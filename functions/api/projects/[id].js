import { sha256Hex } from "../../_lib/security.js";
import { getPieceTypeDisplayName, sortPartsByColorNumber } from "../../_lib/piece-types.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, private",
    },
  });
}

function getBearerToken(request) {
  const authorization = String(request.headers.get("authorization") || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

export async function onRequestGet({ request, env, params }) {
  try {
    if (!env.DB || !env.DESIGN_IMAGES) {
      throw new Error("Missing project storage configuration.");
    }

    const projectId = String(params.id || "").trim().toUpperCase();
    const token = getBearerToken(request);
    if (!/^PRJ-[A-Z0-9]{8,32}$/.test(projectId) || !token) {
      return jsonResponse({ ok: false, error: "Project not found." }, 404);
    }

    const project = await env.DB.prepare(
      `SELECT
        p.id AS project_id,
        p.design_id,
        p.status AS project_status,
        p.order_number,
        p.ordered_at,
        d.title,
        d.piece_type,
        d.piece_type_name,
        d.width,
        d.height,
        d.parts_json,
        d.preview_image_key,
        d.instruction_pdf_key,
        d.status AS gallery_status
      FROM projects p
      JOIN designs d ON d.id = p.design_id
      WHERE p.id = ?`
    )
      .bind(projectId)
      .first();

    const access = project
      ? await env.DB.prepare(
          "SELECT id FROM project_access_tokens WHERE project_id = ? AND token_hash = ?"
        ).bind(projectId, await sha256Hex(token)).first()
      : null;
    if (!project || !access) {
      return jsonResponse({ ok: false, error: "Project not found." }, 404);
    }

    const responseProject = {
      id: project.project_id,
      designId: project.design_id,
      status: project.project_status,
      orderNumber: project.order_number ? `#${project.order_number}` : null,
      orderedAt: project.ordered_at,
      title: project.title,
      pieceType: project.piece_type,
      pieceTypeName: getPieceTypeDisplayName(project.piece_type),
      size: [project.width, project.height],
      parts: sortPartsByColorNumber(JSON.parse(project.parts_json || "[]")),
      previewImageKey: project.preview_image_key,
      galleryStatus: project.gallery_status,
    };

    if (project.project_status !== "ordered") {
      return jsonResponse({ ok: true, project: responseProject, instructionsAvailable: false });
    }

    if (project.instruction_pdf_key) {
      const instructionObject = await env.DESIGN_IMAGES.get(project.instruction_pdf_key);
      if (!instructionObject) {
        throw new Error("Instruction PDF is unavailable for this project.");
      }
      return jsonResponse({
        ok: true,
        project: responseProject,
        instructionsAvailable: true,
        instructionType: "pdf",
        instructionsUrl: `/api/projects/${encodeURIComponent(project.project_id)}/instructions`,
      });
    }

    const instructionObject = await env.DESIGN_IMAGES.get(`instruction-data/${project.design_id}.json`);
    if (!instructionObject) {
      throw new Error("Instruction data is unavailable for this project.");
    }

    return jsonResponse({
      ok: true,
      project: responseProject,
      instructionsAvailable: true,
      instructionType: "generated",
      instructionData: await instructionObject.json(),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
