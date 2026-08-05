import { createAccessToken, sha256Hex } from "../../_lib/security.js";
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

function makeDesignId() {
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `DP-${randomPart}`;
}

function parseSize(size) {
  if (!Array.isArray(size) || size.length !== 2) {
    throw new Error("Invalid artwork size.");
  }

  const width = Number(size[0]);
  const height = Number(size[1]);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid artwork size.");
  }

  return { width, height };
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Missing parts list.");
  }

  return items.map((entry) => {
    if (!Array.isArray(entry) || entry.length < 6) {
      throw new Error("Invalid parts list entry.");
    }

    const quantity = Number(entry[1]);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid quantity in parts list.");
    }

    return {
      sku: String(entry[0]),
      quantity,
      doopixelNo: String(entry[2]),
      colorName: String(entry[3]),
      hex: String(entry[4]).toLowerCase(),
      bricklinkColorId: String(entry[5]),
    };
  });
}

function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function sha256BytesHex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function validateInstructionData(data, width, height, pieceType, parts) {
  if (!data || Number(data.version) !== 1) {
    throw new Error("Missing or unsupported instruction data.");
  }

  if (
    Number(data.width) !== width ||
    Number(data.height) !== height ||
    Number(data.plateWidth) !== 16 ||
    String(data.pieceType) !== pieceType
  ) {
    throw new Error("Instruction data does not match the design.");
  }

  if (width < 16 || height < 16 || width > 128 || height > 128 || width % 16 !== 0 || height % 16 !== 0) {
    throw new Error("Instruction artwork size must use 16 x 16 baseplates.");
  }

  const palette = Array.isArray(data.palette) ? data.palette : [];
  if (palette.length === 0 || palette.length > 255) {
    throw new Error("Invalid instruction palette.");
  }

  const seenHexes = new Set();
  const normalizedPalette = palette.map((entry) => {
    const hex = String(entry?.hex || "").trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(hex) || seenHexes.has(hex)) {
      throw new Error("Invalid instruction palette color.");
    }
    seenHexes.add(hex);
    return {
      hex,
      doopixelNo: String(entry.doopixelNo || "").slice(0, 20),
      colorName: String(entry.colorName || "").slice(0, 80),
      sku: String(entry.sku || "").slice(0, 80),
      bricklinkColorId: String(entry.bricklinkColorId || "").slice(0, 20),
    };
  });

  let pixelIndexes;
  try {
    pixelIndexes = base64ToBytes(data.pixelsBase64);
  } catch (_error) {
    throw new Error("Invalid encoded instruction pixels.");
  }

  if (pixelIndexes.length !== width * height) {
    throw new Error("Instruction data has the wrong number of pixels.");
  }

  const countsByHex = new Map();
  pixelIndexes.forEach((paletteIndex) => {
    const color = normalizedPalette[paletteIndex];
    if (!color) {
      throw new Error("Instruction data contains an invalid color index.");
    }
    countsByHex.set(color.hex, (countsByHex.get(color.hex) || 0) + 1);
  });

  const partCountsByHex = new Map(parts.map((part) => [part.hex, part.quantity]));
  if (countsByHex.size !== partCountsByHex.size) {
    throw new Error("Instruction colors do not match the parts list.");
  }
  countsByHex.forEach((quantity, hex) => {
    if (partCountsByHex.get(hex) !== quantity) {
      throw new Error("Instruction quantities do not match the parts list.");
    }
  });

  const checksum = await sha256BytesHex(pixelIndexes);
  if (!/^[0-9a-f]{64}$/.test(String(data.checksum || "")) || checksum !== data.checksum) {
    throw new Error("Instruction data failed its integrity check.");
  }

  return {
    version: 1,
    width,
    height,
    plateWidth: 16,
    pieceType,
    palette: normalizedPalette,
    pixelsBase64: String(data.pixelsBase64),
    checksum,
  };
}

async function saveDataUrlToR2(env, id, dataUrl) {
  if (!dataUrl || !env.DESIGN_IMAGES) {
    return null;
  }

  const match = String(dataUrl).match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid preview image format.");
  }

  const extension = match[1] === "jpeg" ? "jpg" : match[1];
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  const key = `previews/${id}.${extension}`;

  await env.DESIGN_IMAGES.put(key, bytes, {
    httpMetadata: {
      contentType: `image/${match[1]}`,
    },
  });

  return key;
}

async function saveInstructionDataToR2(env, id, instructionData) {
  if (!env.DESIGN_IMAGES) {
    throw new Error("Missing DESIGN_IMAGES binding.");
  }

  const key = `instruction-data/${id}.json`;
  await env.DESIGN_IMAGES.put(key, JSON.stringify(instructionData), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
    },
  });
  return key;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const payload = await request.json();
    const id = makeDesignId();
    const title = String(payload.name || payload.title || "Custom Pixel Art").trim().slice(0, 120);
    const pieceType = String(payload.pieceType || "");
    const pieceTypeName = getPieceTypeDisplayName(pieceType);
    const { width, height } = parseSize(payload.size);
    const parts = validateItems(payload.items);
    if (!["98138", "4073"].includes(pieceType)) {
      throw new Error("Invalid piece type.");
    }

    const instructionData = await validateInstructionData(payload.instructionData, width, height, pieceType, parts);
    const previewImageKey = await saveDataUrlToR2(env, id, payload.previewImageDataUrl);
    await saveInstructionDataToR2(env, id, instructionData);
    const now = new Date().toISOString();
    const projectToken = createAccessToken();
    const projectTokenHash = await sha256Hex(projectToken);
    const projectId = `PRJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    const designStatement = env.DB.prepare(
      `INSERT INTO designs (
        id,
        title,
        piece_type,
        piece_type_name,
        width,
        height,
        parts_json,
        preview_image_key,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?)`
    )
      .bind(
        id,
        title || "Custom Pixel Art",
        pieceType,
        pieceTypeName,
        width,
        height,
        JSON.stringify(parts),
        previewImageKey,
        now,
        now
      );

    const projectStatement = env.DB.prepare(
      `INSERT INTO projects (
        id,
        design_id,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, 'pending_order', ?, ?)`
    ).bind(projectId, id, now, now);

    const accessTokenStatement = env.DB.prepare(
      `INSERT INTO project_access_tokens (id, project_id, token_hash, created_at)
       VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), projectId, projectTokenHash, now);

    await env.DB.batch([designStatement, projectStatement, accessTokenStatement]);

    return jsonResponse({
      ok: true,
      id,
      shareUrl: `/share/${id}`,
      projectId,
      projectToken,
      projectUrl: `/project/${projectId}#${projectToken}`,
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
