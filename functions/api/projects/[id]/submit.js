import { sha256Hex } from "../../../_lib/security.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function getExtension(file) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  throw new Error("Only JPG, PNG, and WEBP images are supported.");
}

export async function onRequestPost({ request, env, params }) {
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
    const file = form.get("finishedImage");
    if (!(file instanceof File)) throw new Error("Missing finished image.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Image is too large. Please upload an image under 8 MB.");

    const now = new Date().toISOString();
    const key = `finished/${project.design_id}/${project.id}-${Date.now()}.${getExtension(file)}`;
    await env.DESIGN_IMAGES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    await env.DB.prepare(
      `UPDATE designs
       SET finished_image_key = ?, customer_caption = ?, status = 'pending',
           is_pinned = 0, pinned_at = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(key, caption, now, project.design_id).run();

    return jsonResponse({ ok: true, status: "pending" });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
