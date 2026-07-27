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

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return jsonResponse({ ok: false, error: "Invalid comment id." }, 400);
    }

    const existing = await env.DB.prepare(
      "SELECT id, display_name, body, status FROM design_comments WHERE id = ?"
    )
      .bind(id)
      .first();
    if (!existing) {
      return jsonResponse({ ok: false, error: "Comment not found." }, 404);
    }

    const payload = await request.json();
    const status =
      payload.status === undefined
        ? existing.status
        : String(payload.status || "").toLowerCase();
    const displayName =
      payload.displayName === undefined
        ? existing.display_name
        : String(payload.displayName || "").trim().slice(0, 40);
    const body =
      payload.body === undefined
        ? existing.body
        : String(payload.body || "").trim().slice(0, 500);

    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return jsonResponse({ ok: false, error: "Invalid comment status." }, 400);
    }
    if (displayName.length < 2 || body.length < 2) {
      return jsonResponse(
        { ok: false, error: "Comment name and content cannot be empty." },
        400
      );
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE design_comments
      SET display_name = ?, body = ?, status = ?, updated_at = ?
      WHERE id = ?`
    )
      .bind(displayName, body, status, now, id)
      .run();

    return jsonResponse({
      ok: true,
      comment: { id, displayName, body, status, updatedAt: now },
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
