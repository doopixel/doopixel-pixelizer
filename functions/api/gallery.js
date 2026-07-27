function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
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

    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const sort = url.searchParams.get("sort") === "popular" ? "popular" : "newest";
    const limit = 24;
    const offset = (page - 1) * limit;
    const orderBy =
      sort === "popular"
        ? "is_pinned DESC, pinned_at DESC, displayed_like_count DESC, COALESCE(approved_at, updated_at) DESC"
        : "is_pinned DESC, pinned_at DESC, COALESCE(approved_at, updated_at) DESC";

    const result = await env.DB.prepare(
      `SELECT
        id,
        title,
        piece_type_name,
        width,
        height,
        parts_json,
        finished_image_key,
        customer_caption,
        is_pinned,
        pinned_at,
        approved_at,
        manual_like_offset,
        share_count,
        ((SELECT COUNT(*) FROM design_likes l WHERE l.design_id = designs.id) + manual_like_offset) AS displayed_like_count,
        (SELECT COUNT(*) FROM design_comments c WHERE c.design_id = designs.id AND c.status = 'approved') AS approved_comment_count,
        updated_at
      FROM designs
      WHERE status = 'approved'
        AND finished_image_key IS NOT NULL
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`
    )
      .bind(limit + 1, offset)
      .all();

    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total
      FROM designs
      WHERE status = 'approved'
        AND finished_image_key IS NOT NULL`
    ).first();

    const rows = result.results || [];
    const hasMore = rows.length > limit;
    const designs = rows.slice(0, limit).map((design) => {
      const parts = parseParts(design.parts_json);
      return {
        id: design.id,
        title: design.title,
        pieceTypeName: design.piece_type_name,
        size: [design.width, design.height],
        totalPieces: parts.reduce((sum, part) => sum + Number(part.quantity || 0), 0),
        colorLines: parts.length,
        finishedImageKey: design.finished_image_key,
        customerCaption: design.customer_caption,
        isPinned: Boolean(design.is_pinned),
        likeCount: Number(design.displayed_like_count || 0),
        commentCount: Number(design.approved_comment_count || 0),
        shareCount: Number(design.share_count || 0),
        approvedAt: design.approved_at || design.updated_at,
      };
    });

    return jsonResponse({
      ok: true,
      page,
      sort,
      total: Number(totalRow?.total || 0),
      hasMore,
      designs,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}

