import { sha256Hex } from "../../../_lib/security.js";

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function getBearerToken(request) {
  const authorization = String(request.headers.get("authorization") || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function safeFilename(value) {
  const normalized = String(value || "DooPixel Instructions")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 _-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${normalized || "DooPixel-Instructions"}.pdf`;
}

export async function onRequestGet({ request, env, params }) {
  if (!env.DB || !env.DESIGN_IMAGES) {
    return textResponse("Missing project storage configuration.", 500);
  }

  const projectId = String(params.id || "").trim().toUpperCase();
  const token = getBearerToken(request);
  if (!/^PRJ-[A-Z0-9]{8,32}$/.test(projectId) || !token) {
    return textResponse("Instructions not found.", 404);
  }

  const project = await env.DB.prepare(
    `SELECT p.id, p.status, d.title, d.instruction_pdf_key
     FROM projects p
     JOIN designs d ON d.id = p.design_id
     WHERE p.id = ?`
  ).bind(projectId).first();
  const access = project
    ? await env.DB.prepare(
        "SELECT id FROM project_access_tokens WHERE project_id = ? AND token_hash = ?"
      ).bind(projectId, await sha256Hex(token)).first()
    : null;

  if (!project || !access || project.status !== "ordered" || !project.instruction_pdf_key) {
    return textResponse("Instructions not found.", 404);
  }

  const object = await env.DESIGN_IMAGES.get(project.instruction_pdf_key);
  if (!object) return textResponse("Instructions not found.", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", `attachment; filename="${safeFilename(project.title)}"`);
  headers.set("cache-control", "no-store, private");
  return new Response(object.body, { headers });
}
