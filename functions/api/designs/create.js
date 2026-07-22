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

function normalizeDesignId(id) {
  if (!id) {
    return makeDesignId();
  }

  const normalized = String(id).trim().toUpperCase();
  if (!/^DP-[A-Z0-9]{6,32}$/.test(normalized)) {
    throw new Error("Invalid design id.");
  }

  return normalized;
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

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const payload = await request.json();
    const id = normalizeDesignId(payload.id);
    const title = String(payload.name || payload.title || "Custom Pixel Art").trim().slice(0, 120);
    const pieceType = String(payload.pieceType || "");
    const pieceTypeName = String(payload.pieceTypeName || "");
    const { width, height } = parseSize(payload.size);
    const parts = validateItems(payload.items);
    const previewImageKey = await saveDataUrlToR2(env, id, payload.previewImageDataUrl);
    const now = new Date().toISOString();

    if (!["98138", "4073"].includes(pieceType)) {
      throw new Error("Invalid piece type.");
    }

    await env.DB.prepare(
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'private', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        piece_type = excluded.piece_type,
        piece_type_name = excluded.piece_type_name,
        width = excluded.width,
        height = excluded.height,
        parts_json = excluded.parts_json,
        preview_image_key = COALESCE(excluded.preview_image_key, designs.preview_image_key),
        updated_at = excluded.updated_at`
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
      )
      .run();

    return jsonResponse({
      ok: true,
      id,
      shareUrl: `/share/${id}`,
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
