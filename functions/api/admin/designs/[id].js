import { listDesignImageKeys } from "../../../_lib/design-images.js";

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

export async function onRequestDelete({ request, env, params }) {
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
      return jsonResponse({ ok: false, error: "Permanent deletion is only available for DooPixel Verified designs." }, 400);
    }

    const projectCount = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM projects WHERE design_id = ?"
    ).bind(id).first();
    if (Number(projectCount?.total || 0) > 0) {
      return jsonResponse(
        {
          ok: false,
          error: "This design is linked to a customer project or order and cannot be deleted. Hide it from the Gallery instead.",
        },
        409
      );
    }

    const imageKeys = await listDesignImageKeys(env.DESIGN_IMAGES, id, design.finished_image_key);
    await env.DB.prepare("DELETE FROM design_likes WHERE design_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM design_comments WHERE design_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM designs WHERE id = ?").bind(id).run();

    const fileKeys = [
      ...imageKeys,
      design.instruction_pdf_key,
    ].filter(Boolean);
    await Promise.all(fileKeys.map((key) => env.DESIGN_IMAGES.delete(key).catch(() => {})));

    return jsonResponse({ ok: true, id, deleted: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
