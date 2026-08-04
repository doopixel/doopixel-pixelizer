import { createAccessToken, sha256Hex } from "../../../_lib/security.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestPost({ env, params }) {
  try {
    if (!env.DB || !env.DESIGN_IMAGES) throw new Error("Missing project storage configuration.");
    const designId = String(params.id || "").trim().toUpperCase();
    const design = await env.DB.prepare(
      "SELECT id, status, is_verified, instruction_pdf_key FROM designs WHERE id = ?"
    ).bind(designId).first();
    if (!design || design.status !== "approved") {
      return jsonResponse({ ok: false, error: "This Gallery design is not available." }, 404);
    }

    const instructionObject = design.is_verified
      ? await env.DESIGN_IMAGES.get(design.instruction_pdf_key || "")
      : await env.DESIGN_IMAGES.get(`instruction-data/${designId}.json`);
    if (!instructionObject) {
      return jsonResponse({ ok: false, error: "Building instructions are unavailable for this older design." }, 409);
    }

    const customerDesignId = `DP-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const projectId = `PRJ-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const projectToken = createAccessToken();
    const now = new Date().toISOString();
    if (!design.is_verified) {
      const instructionData = await instructionObject.arrayBuffer();
      await env.DESIGN_IMAGES.put(`instruction-data/${customerDesignId}.json`, instructionData, {
        httpMetadata: { contentType: "application/json; charset=utf-8" },
      });
    }

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO designs (
          id, title, piece_type, piece_type_name, width, height,
          parts_json, preview_image_key, status, is_verified,
          instruction_pdf_key, created_at, updated_at
        )
        SELECT ?, title, piece_type, piece_type_name, width, height,
               parts_json, COALESCE(preview_image_key, finished_image_key), 'private',
               is_verified, instruction_pdf_key, ?, ?
        FROM designs WHERE id = ?`
      ).bind(customerDesignId, now, now, designId),
      env.DB.prepare(
        `INSERT INTO projects (id, design_id, status, created_at, updated_at)
         VALUES (?, ?, 'pending_order', ?, ?)`
      ).bind(projectId, customerDesignId, now, now),
      env.DB.prepare(
        `INSERT INTO project_access_tokens (id, project_id, token_hash, created_at)
         VALUES (?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), projectId, await sha256Hex(projectToken), now),
    ]);

    return jsonResponse({
      ok: true,
      designId: customerDesignId,
      shareUrl: `/share/${customerDesignId}`,
      projectId,
      projectToken,
      projectUrl: `/project/${projectId}#${projectToken}`,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
