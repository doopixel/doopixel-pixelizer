import {
  createAccessToken,
  hashEmail,
  normalizeOrderNumber,
  sha256Hex,
} from "../../_lib/security.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function enforceRateLimit(request, env) {
  const ip = String(request.headers.get("cf-connecting-ip") || "unknown");
  const fingerprint = await hashEmail(ip, env.ORDER_LOOKUP_PEPPER);
  const now = new Date();
  now.setUTCMinutes(Math.floor(now.getUTCMinutes() / 15) * 15, 0, 0);
  const windowStart = now.toISOString();

  await env.DB.prepare(
    `INSERT INTO project_lookup_attempts (fingerprint, window_start, attempt_count)
     VALUES (?, ?, 1)
     ON CONFLICT(fingerprint, window_start)
     DO UPDATE SET attempt_count = attempt_count + 1`
  ).bind(fingerprint, windowStart).run();

  const attempt = await env.DB.prepare(
    "SELECT attempt_count FROM project_lookup_attempts WHERE fingerprint = ? AND window_start = ?"
  ).bind(fingerprint, windowStart).first();
  if (Number(attempt?.attempt_count || 0) > 10) {
    throw new Error("Too many lookup attempts. Please try again in 15 minutes.");
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB || !env.ORDER_LOOKUP_PEPPER) {
      throw new Error("Project lookup is not configured.");
    }
    await enforceRateLimit(request, env);

    const body = await request.json();
    const orderNumber = normalizeOrderNumber(body.orderNumber);
    const email = String(body.email || "").trim().toLowerCase();
    if (!orderNumber || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter the order number and email used at checkout.");
    }

    const emailHash = await hashEmail(email, env.ORDER_LOOKUP_PEPPER);
    const result = await env.DB.prepare(
      `SELECT p.id, p.design_id, d.title, d.preview_image_key
       FROM projects p
       JOIN designs d ON d.id = p.design_id
       WHERE p.status = 'ordered' AND p.order_number = ? AND p.order_email_hash = ?
       ORDER BY p.created_at ASC`
    ).bind(orderNumber, emailHash).all();
    const matches = result.results || [];
    if (matches.length === 0) {
      return jsonResponse({ ok: false, error: "We could not find a matching pixel art project." }, 404);
    }

    const now = new Date().toISOString();
    const projects = [];
    const inserts = [];
    for (const project of matches) {
      const token = createAccessToken();
      inserts.push(
        env.DB.prepare(
          "INSERT INTO project_access_tokens (id, project_id, token_hash, created_at) VALUES (?, ?, ?, ?)"
        ).bind(crypto.randomUUID(), project.id, await sha256Hex(token), now)
      );
      projects.push({
        id: project.id,
        designId: project.design_id,
        title: project.title,
        previewImageKey: project.preview_image_key,
        url: `/project/${project.id}#${token}`,
      });
    }
    await env.DB.batch(inserts);

    return jsonResponse({ ok: true, projects });
  } catch (error) {
    const rateLimited = String(error.message || "").startsWith("Too many lookup attempts");
    return jsonResponse({ ok: false, error: error.message || String(error) }, rateLimited ? 429 : 400);
  }
}
