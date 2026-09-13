import { getPieceTypeDisplayName, sortPartsByColorNumber } from "../../_lib/piece-types.js";
import { listDesignImageKeys } from "../../_lib/design-images.js";
import { getKitPrice } from "../../_lib/kit-pricing.js";
import { toPublicSlug } from "../../_lib/public-slug.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const DESIGN_SELECT = `SELECT
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
FROM designs`;

export async function onRequestGet({ env, params }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const reference = decodeURIComponent(String(params.id || "")).trim();
    const id = reference.toUpperCase();
    let design = await env.DB.prepare(`${DESIGN_SELECT} WHERE id = ?`).bind(id).first();

    if (!design && reference && !/^DP-[A-Z0-9]+$/i.test(reference)) {
      const candidates = await env.DB.prepare(
        `${DESIGN_SELECT}
        WHERE status = 'approved' AND finished_image_key IS NOT NULL
        ORDER BY COALESCE(created_at, updated_at) ASC, id ASC`
      ).all();
      design = (candidates.results || []).find(
        (candidate) => toPublicSlug(candidate.title) === reference.toLowerCase()
      );
    }

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

    const price = getKitPrice(design.width, design.height);
    return jsonResponse({
      ok: true,
      design: {
        id: design.id,
        title: design.title,
        slug: toPublicSlug(design.title),
        pieceType: design.piece_type,
        pieceTypeName: getPieceTypeDisplayName(design.piece_type),
        size: [design.width, design.height],
        parts: sortPartsByColorNumber(JSON.parse(design.parts_json || "[]")),
        previewImageKey: design.preview_image_key,
        finishedImageKey: design.finished_image_key,
        imageKeys,
        customerCaption: design.customer_caption,
        isVerified: Boolean(design.is_verified),
        instructionsAvailableAfterPurchase: Boolean(
          design.is_verified && design.instruction_pdf_key
        ),
        status: design.status,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
        ...price,
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
