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

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

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
        updated_at
      FROM designs
      WHERE status = 'approved'
        AND finished_image_key IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 60`
    ).all();

    const designs = (result.results || []).map((design) => {
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
        approvedAt: design.updated_at,
      };
    });

    return jsonResponse({ ok: true, designs });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
