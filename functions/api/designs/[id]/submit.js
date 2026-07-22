function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getSafeFileExtension(file) {
  const type = file.type || "";
  if (type === "image/jpeg") {
    return "jpg";
  }
  if (type === "image/png") {
    return "png";
  }
  if (type === "image/webp") {
    return "webp";
  }
  throw new Error("Only JPG, PNG, and WEBP images are supported.");
}

export async function onRequestPost({ request, env, params }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }
    if (!env.DESIGN_IMAGES) {
      throw new Error("Missing DESIGN_IMAGES binding.");
    }

    const id = String(params.id || "").toUpperCase();
    const existing = await env.DB.prepare("SELECT id FROM designs WHERE id = ?").bind(id).first();
    if (!existing) {
      return jsonResponse(
        {
          ok: false,
          error: "Design not found.",
        },
        404
      );
    }

    const form = await request.formData();
    const caption = String(form.get("caption") || "").trim().slice(0, 500);
    const file = form.get("finishedImage");

    if (!(file instanceof File)) {
      throw new Error("Missing finished image.");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Image is too large. Please upload an image under 8 MB.");
    }

    const extension = getSafeFileExtension(file);
    const key = `finished/${id}/${Date.now()}.${extension}`;

    await env.DESIGN_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE designs
      SET
        finished_image_key = ?,
        customer_caption = ?,
        status = 'pending',
        updated_at = ?
      WHERE id = ?`
    )
      .bind(key, caption, now, id)
      .run();

    return jsonResponse({
      ok: true,
      id,
      status: "pending",
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
