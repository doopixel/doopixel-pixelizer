import { getPieceTypeDisplayName, sortPartsByColorNumber } from "../../_lib/piece-types.js";
import { listDesignImageKeys } from "../../_lib/design-images.js";

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
        is_verified,
        instruction_pdf_key,
        status,
        created_at,
        updated_at
      FROM designs
      WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!design || design.status !== "approved") {
      return jsonResponse(
        {
          ok: false,
          error: "Design not found.",
        },
        404
      );
    }

    const imageKeys = await listDesignImageKeys(
      env.DESIGN_IMAGES,
      design.id,
      design.finished_image_key
    );

    return jsonResponse({
      ok: true,
      design: {
        id: design.id,
        title: design.title,
        pieceType: design.piece_type,
        pieceTypeName: getPieceTypeDisplayName(design.piece_type),
        size: [design.width, design.height],
        parts: sortPartsByColorNumber(JSON.parse(design.parts_json || "[]")),
        previewImageKey: design.preview_image_key,
        finishedImageKey: design.finished_image_key,
        imageKeys,
        customerCaption: design.customer_caption,
        isVerified: Boolean(design.is_verified),
        instructionsAvailable: Boolean(design.is_verified && design.instruction_pdf_key),
        instructionsUrl:
          design.is_verified && design.instruction_pdf_key
            ? `/api/designs/${encodeURIComponent(design.id)}/instructions`
            : null,
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
