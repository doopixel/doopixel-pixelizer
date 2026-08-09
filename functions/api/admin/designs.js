import { getPieceTypeDisplayName } from "../../_lib/piece-types.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isAuthorized(request, env) {
  const configuredToken = String(env.ADMIN_TOKEN || "");
  const authorization = request.headers.get("authorization") || "";
  return configuredToken && authorization === `Bearer ${configuredToken}`;
}

function parseParts(value) {
  try {
    const parts = JSON.parse(value || "[]");
    return Array.isArray(parts) ? parts : [];
  } catch (_error) {
    return [];
  }
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }
    if (!env.ADMIN_TOKEN) {
      throw new Error("Missing ADMIN_TOKEN environment variable.");
    }
    if (!isAuthorized(request, env)) {
      return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    }

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status") || "pending";
    const status = ["pending", "approved", "hidden", "rejected"].includes(requestedStatus)
      ? requestedStatus
      : "pending";
    const search = String(url.searchParams.get("q") || "").trim().toLowerCase().slice(0, 100);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = 18;
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const result = await env.DB.prepare(
      `SELECT
        id,
        title,
        piece_type,
        piece_type_name,
        width,
        height,
        parts_json,
        preview_image_key,
        finished_image_key,
        customer_caption,
        is_verified,
        instruction_pdf_key,
        is_pinned,
        pinned_at,
        approved_at,
        moderator_note,
        manual_like_offset,
        comments_enabled,
        share_count,
        (SELECT COUNT(*) FROM design_likes l WHERE l.design_id = designs.id) AS organic_like_count,
        (SELECT COUNT(*) FROM design_comments c WHERE c.design_id = designs.id AND c.status = 'approved') AS approved_comment_count,
        (SELECT COUNT(*) FROM design_comments c WHERE c.design_id = designs.id AND c.status = 'pending') AS pending_comment_count,
        status,
        created_at,
        updated_at
      FROM designs
      WHERE status = ?
        AND (
          ? = ''
          OR LOWER(id) LIKE ?
          OR LOWER(title) LIKE ?
          OR LOWER(COALESCE(customer_caption, '')) LIKE ?
        )
      ORDER BY is_pinned DESC, pinned_at DESC, updated_at DESC
      LIMIT ? OFFSET ?`
    )
      .bind(status, search, searchPattern, searchPattern, searchPattern, limit, offset)
      .all();

    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total
      FROM designs
      WHERE status = ?
        AND (
          ? = ''
          OR LOWER(id) LIKE ?
          OR LOWER(title) LIKE ?
          OR LOWER(COALESCE(customer_caption, '')) LIKE ?
        )`
    )
      .bind(status, search, searchPattern, searchPattern, searchPattern)
      .first();

    const countResult = await env.DB.prepare(
      `SELECT status, COUNT(*) AS total
      FROM designs
      WHERE status IN ('pending', 'approved', 'hidden', 'rejected')
      GROUP BY status`
    ).all();

    const counts = {
      pending: 0,
      approved: 0,
      hidden: 0,
      rejected: 0,
    };
    (countResult.results || []).forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
        counts[row.status] = Number(row.total || 0);
      }
    });

    const designs = (result.results || []).map((design) => {
      const parts = parseParts(design.parts_json);
      return {
        id: design.id,
        title: design.title,
        pieceTypeName: getPieceTypeDisplayName(design.piece_type),
        size: [design.width, design.height],
        totalPieces: parts.reduce((sum, part) => sum + Number(part.quantity || 0), 0),
        colorLines: parts.length,
        previewImageKey: design.preview_image_key,
        finishedImageKey: design.finished_image_key,
        customerCaption: design.customer_caption,
        isVerified: Boolean(design.is_verified),
        instructionsAvailable: Boolean(design.instruction_pdf_key),
        isPinned: Boolean(design.is_pinned),
        pinnedAt: design.pinned_at,
        approvedAt: design.approved_at,
        moderatorNote: design.moderator_note,
        organicLikeCount: Number(design.organic_like_count || 0),
        manualLikeOffset: Number(design.manual_like_offset || 0),
        displayedLikeCount:
          Number(design.organic_like_count || 0) + Number(design.manual_like_offset || 0),
        approvedCommentCount: Number(design.approved_comment_count || 0),
        pendingCommentCount: Number(design.pending_comment_count || 0),
        commentsEnabled: Boolean(design.comments_enabled),
        shareCount: Number(design.share_count || 0),
        status: design.status,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      };
    });

    const total = Number(totalRow?.total || 0);
    return jsonResponse({
      ok: true,
      status,
      search,
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
      designs,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
