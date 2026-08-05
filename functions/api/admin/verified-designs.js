import { PIECE_TYPES } from "../../_lib/piece-types.js";

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

function makeDesignId() {
  return `DP-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function getImageExtension(file) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  throw new Error("Artwork image must be JPG, PNG, or WEBP.");
}

async function hasPdfSignature(file) {
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...header) === "%PDF-";
}

function validateParts(rawParts) {
  let parsed;
  try {
    parsed = JSON.parse(String(rawParts || "[]"));
  } catch (_error) {
    throw new Error("The required pieces list is invalid.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 255) {
    throw new Error("Add at least one required color.");
  }

  const seenSkus = new Set();
  return parsed.map((entry) => {
    const pieceType = String(entry?.pieceType || "").trim();
    const pieceTypeInfo = PIECE_TYPES[pieceType];
    const sku = String(entry?.sku || "").trim().toUpperCase();
    const quantity = Number(entry?.quantity);
    const doopixelNo = String(entry?.doopixelNo || "").trim().slice(0, 20);
    const colorName = String(entry?.colorName || "").trim().slice(0, 80);
    const hex = String(entry?.hex || "").trim().toLowerCase();
    const bricklinkColorId = String(entry?.bricklinkColorId || "").trim().slice(0, 20);

    if (!pieceTypeInfo || !sku.startsWith(pieceTypeInfo.skuPrefix) || seenSkus.has(sku)) {
      throw new Error("Each required piece must have a valid type, color, and unique SKU.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50000) {
      throw new Error(`Invalid quantity for ${colorName || sku}.`);
    }
    if (!doopixelNo || !colorName || !/^#[0-9a-f]{6}$/.test(hex)) {
      throw new Error("A required piece is missing its DooPixel color information.");
    }
    seenSkus.add(sku);
    return {
      pieceType,
      pieceTypeName: pieceTypeInfo.customerName,
      sku,
      quantity,
      doopixelNo,
      colorName,
      hex,
      bricklinkColorId,
    };
  });
}

export async function onRequestPost({ request, env }) {
  let imageKey = null;
  let pdfKey = null;
  try {
    if (!env.DB || !env.DESIGN_IMAGES) {
      throw new Error("Missing design storage configuration.");
    }
    if (!env.ADMIN_TOKEN) {
      throw new Error("Missing ADMIN_TOKEN environment variable.");
    }
    if (!isAuthorized(request, env)) {
      return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    }

    const form = await request.formData();
    const title = String(form.get("title") || "").trim().slice(0, 120);
    const caption = String(form.get("caption") || "").trim().slice(0, 500);
    const width = Number(form.get("width"));
    const height = Number(form.get("height"));
    const artworkImage = form.get("artworkImage");
    const instructionsPdf = form.get("instructionsPdf");

    if (!title) throw new Error("Enter a public title.");
    if (!caption) throw new Error("Enter a short public description.");
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 16 ||
      height < 16 ||
      width > 128 ||
      height > 128 ||
      width % 16 !== 0 ||
      height % 16 !== 0
    ) {
      throw new Error("Artwork width and height must be 16 to 128 pixels in 16-pixel steps.");
    }
    if (!(artworkImage instanceof File) || artworkImage.size === 0) {
      throw new Error("Choose an artwork image.");
    }
    if (artworkImage.size > 8 * 1024 * 1024) {
      throw new Error("Artwork image must be smaller than 8 MB.");
    }
    if (!(instructionsPdf instanceof File) || instructionsPdf.size === 0) {
      throw new Error("Choose a PDF instruction file.");
    }
    if (instructionsPdf.size > 25 * 1024 * 1024) {
      throw new Error("Instruction PDF must be smaller than 25 MB.");
    }
    if (!(await hasPdfSignature(instructionsPdf))) {
      throw new Error("The instruction file is not a valid PDF.");
    }

    const parts = validateParts(form.get("parts"));
    const pieceTypes = [...new Set(parts.map((part) => part.pieceType))];
    const pieceType = pieceTypes.length === 1 ? pieceTypes[0] : "mixed";
    const pieceTypeName = pieceTypes.length === 1 ? PIECE_TYPES[pieceTypes[0]].customerName : "Mixed Pieces (Flat + Raised)";
    const imageExtension = getImageExtension(artworkImage);
    const id = makeDesignId();
    imageKey = `finished/verified/${id}.${imageExtension}`;
    pdfKey = `instructions/verified/${id}.pdf`;

    await env.DESIGN_IMAGES.put(imageKey, await artworkImage.arrayBuffer(), {
      httpMetadata: { contentType: artworkImage.type },
    });
    await env.DESIGN_IMAGES.put(pdfKey, await instructionsPdf.arrayBuffer(), {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: { originalName: instructionsPdf.name.slice(0, 180) },
    });

    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO designs (
        id, title, piece_type, piece_type_name, width, height,
        parts_json, finished_image_key, customer_caption, status,
        is_verified, instruction_pdf_key, approved_at, comments_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 1, ?, ?, 1, ?, ?)`
    )
      .bind(
        id,
        title,
        pieceType,
        pieceTypeName,
        width,
        height,
        JSON.stringify(parts),
        imageKey,
        caption,
        pdfKey,
        now,
        now,
        now
      )
      .run();

    return jsonResponse({
      ok: true,
      id,
      shareUrl: `/share/${id}`,
      totalPieces: parts.reduce((sum, part) => sum + part.quantity, 0),
      colorLines: parts.length,
    });
  } catch (error) {
    if (env.DESIGN_IMAGES) {
      if (imageKey) await env.DESIGN_IMAGES.delete(imageKey).catch(() => {});
      if (pdfKey) await env.DESIGN_IMAGES.delete(pdfKey).catch(() => {});
    }
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
