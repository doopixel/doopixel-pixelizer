function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet({ env, params }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const id = String(params.id || "").toUpperCase();
    const design = await env.DB.prepare(
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
        status,
        created_at,
        updated_at
      FROM designs
      WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!design) {
      return jsonResponse(
        {
          ok: false,
          error: "Design not found.",
        },
        404
      );
    }

    return jsonResponse({
      ok: true,
      design: {
        id: design.id,
        title: design.title,
        pieceType: design.piece_type,
        pieceTypeName: design.piece_type_name,
        size: [design.width, design.height],
        parts: JSON.parse(design.parts_json || "[]"),
        previewImageKey: design.preview_image_key,
        finishedImageKey: design.finished_image_key,
        customerCaption: design.customer_caption,
        status: design.status,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error.message || String(error),
      },
      400
    );
  }
}
