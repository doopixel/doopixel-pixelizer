import {
  getImageExtension,
  getImageFiles,
  listDesignImageKeys,
} from "../../../../_lib/design-images.js";

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

async function hasPdfSignature(file) {
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...header) === "%PDF-";
}

export async function onRequestPost({ request, env, params }) {
  const uploadedKeys = [];
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

    const id = String(params.id || "").trim().toUpperCase();
    if (!/^DP-[A-Z0-9]{6,32}$/.test(id)) {
      return jsonResponse({ ok: false, error: "Invalid design id." }, 400);
    }

    const design = await env.DB.prepare(
      `SELECT id, is_verified, finished_image_key, instruction_pdf_key
      FROM designs
      WHERE id = ?`
    ).bind(id).first();
    if (!design) return jsonResponse({ ok: false, error: "Design not found." }, 404);
    if (!design.is_verified) {
      return jsonResponse({ ok: false, error: "File management is only available for DooPixel Verified designs." }, 400);
    }

    const form = await request.formData();
    const submittedImages = form
      .getAll("artworkImages")
      .filter((value) => value instanceof File && value.size > 0);
    const hasImages = submittedImages.length > 0;
    const instructionsPdf = form.get("instructionsPdf");
    const hasPdf = instructionsPdf instanceof File && instructionsPdf.size > 0;
    if (!hasImages && !hasPdf) {
      return jsonResponse({ ok: false, error: "Choose new gallery photos, a PDF, or both." }, 400);
    }

    const artworkImages = hasImages
      ? getImageFiles(form, "artworkImages", "artworkImage")
      : [];
    if (hasPdf) {
      if (instructionsPdf.size > 25 * 1024 * 1024) {
        throw new Error("Instruction PDF must be smaller than 25 MB.");
      }
      if (!(await hasPdfSignature(instructionsPdf))) {
        throw new Error("The instruction file is not a valid PDF.");
      }
    }

    const stamp = Date.now();
    const newImageKeys = [];
    for (let index = 0; index < artworkImages.length; index += 1) {
      const image = artworkImages[index];
      const key = `finished/verified/${id}-${stamp}-${index + 1}.${getImageExtension(image)}`;
      await env.DESIGN_IMAGES.put(key, await image.arrayBuffer(), {
        httpMetadata: { contentType: image.type },
      });
      uploadedKeys.push(key);
      newImageKeys.push(key);
    }

    let newPdfKey = null;
    if (hasPdf) {
      newPdfKey = `instructions/verified/${id}-${stamp}.pdf`;
      await env.DESIGN_IMAGES.put(newPdfKey, await instructionsPdf.arrayBuffer(), {
        httpMetadata: { contentType: "application/pdf" },
        customMetadata: { originalName: instructionsPdf.name.slice(0, 180) },
      });
      uploadedKeys.push(newPdfKey);
    }

    const oldImageKeys = hasImages
      ? await listDesignImageKeys(env.DESIGN_IMAGES, id, design.finished_image_key)
      : [];
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE designs
      SET finished_image_key = ?, instruction_pdf_key = ?, updated_at = ?
      WHERE id = ?`
    ).bind(
      hasImages ? newImageKeys[0] : design.finished_image_key,
      hasPdf ? newPdfKey : design.instruction_pdf_key,
      now,
      id
    ).run();

    const obsoleteKeys = [
      ...oldImageKeys,
      ...(hasPdf && design.instruction_pdf_key ? [design.instruction_pdf_key] : []),
    ].filter((key) => key && !uploadedKeys.includes(key));
    await Promise.all(obsoleteKeys.map((key) => env.DESIGN_IMAGES.delete(key).catch(() => {})));

    return jsonResponse({
      ok: true,
      id,
      imageCount: hasImages ? newImageKeys.length : null,
      instructionsUpdated: hasPdf,
      updatedAt: now,
    });
  } catch (error) {
    if (env.DESIGN_IMAGES) {
      await Promise.all(uploadedKeys.map((key) => env.DESIGN_IMAGES.delete(key).catch(() => {})));
    }
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
