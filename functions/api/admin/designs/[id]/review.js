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

export async function onRequestPost({ request, env, params }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }
    if (!env.ADMIN_TOKEN) {
      throw new Error("Missing ADMIN_TOKEN environment variable.");
    }
    if (!isAuthorized(request, env)) {
      return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    }

    const id = String(params.id || "").trim().toUpperCase();
    const body = await request.json();
    const status = String(body.status || "");

    if (!/^DP-[A-Z0-9]{6,32}$/.test(id)) {
      return jsonResponse({ ok: false, error: "Invalid design id." }, 400);
    }
    if (!["approved", "rejected"].includes(status)) {
      return jsonResponse({ ok: false, error: "Invalid review status." }, 400);
    }

    const design = await env.DB.prepare(
      "SELECT id, finished_image_key FROM designs WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!design) {
      return jsonResponse({ ok: false, error: "Design not found." }, 404);
    }
    if (status === "approved" && !design.finished_image_key) {
      return jsonResponse(
        { ok: false, error: "A finished build image is required before approval." },
        400
      );
    }

    const now = new Date().toISOString();
    await env.DB.prepare("UPDATE designs SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, now, id)
      .run();

    return jsonResponse({ ok: true, id, status, updatedAt: now });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
