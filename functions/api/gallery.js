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
    const limit = 24;
    const offset = (page - 1) * limit;

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
        updated_at
      FROM designs
      WHERE status = 'approved'
        AND finished_image_key IS NOT NULL
      ORDER BY
        is_pinned DESC,
        pinned_at DESC,
        COALESCE(approved_at, updated_at) DESC
      LIMIT ? OFFSET ?`
    )
      .bind(limit + 1, offset)
      .all();

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
        approvedAt: design.approved_at || design.updated_at,
      };
    });

    return jsonResponse({ ok: true, page, hasMore, designs });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}

