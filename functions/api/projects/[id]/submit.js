import { sha256Hex } from "../../../_lib/security.js";
import { getImageExtension, getImageFiles } from "../../../_lib/design-images.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestPost({ request, env, params }) {
  const uploadedKeys = [];
  try {
    if (!env.DB || !env.DESIGN_IMAGES) throw new Error("Missing project storage configuration.");

    const projectId = String(params.id || "").trim().toUpperCase();
    const authorization = String(request.headers.get("authorization") || "");
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    const project = await env.DB.prepare(
      "SELECT id, design_id, status FROM projects WHERE id = ?"
    ).bind(projectId).first();

    const access = project && token
      ? await env.DB.prepare(
          "SELECT id FROM project_access_tokens WHERE project_id = ? AND token_hash = ?"
        ).bind(projectId, await sha256Hex(token)).first()
      : null;
    if (!project || !access) {
      return jsonResponse({ ok: false, error: "Project not found." }, 404);
    }
    if (project.status !== "ordered") {
      return jsonResponse({ ok: false, error: "Complete checkout before submitting a finished build." }, 403);
    }

    const form = await request.formData();
    const caption = String(form.get("caption") || "").trim().slice(0, 500);
    const files = getImageFiles(form, "finishedImages", "finishedImage");

    const now = new Date().toISOString();
    const keyBase = `finished/${project.design_id}/${project.id}-${Date.now()}`;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const key = `${keyBase}-${index + 1}.${getImageExtension(file)}`;
      await env.DESIGN_IMAGES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      uploadedKeys.push(key);
    }
    await env.DB.prepare(
      `UPDATE designs
       SET finished_image_key = ?, customer_caption = ?, status = 'pending',
           is_pinned = 0, pinned_at = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(uploadedKeys[0], caption, now, project.design_id).run();

    return jsonResponse({ ok: true, status: "pending", imageCount: uploadedKeys.length });
  } catch (error) {
    if (env.DESIGN_IMAGES) {
      await Promise.all(uploadedKeys.map((key) => env.DESIGN_IMAGES.delete(key).catch(() => {})));
    }
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
