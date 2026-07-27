function visitorFromRequest(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)dp_visitor=([a-f0-9-]{36})(?:;|$)/i);
  if (match) {
    return { id: match[1].toLowerCase(), isNew: false };
  }
  return { id: crypto.randomUUID(), isNew: true };
}

function jsonResponse(body, visitor, status = 200) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  if (visitor?.isNew) {
    headers.set(
      "set-cookie",
      `dp_visitor=${visitor.id}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`
    );
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function validateTurnstile(request, env, token) {
  if (!env.TURNSTILE_SECRET_KEY) {
    throw new Error("Comment protection is not configured.");
  }
  if (!token) {
    throw new Error("Please complete the security check.");
  }

  const form = new FormData();
  form.append("secret", String(env.TURNSTILE_SECRET_KEY));
  form.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) {
    form.append("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
    }
  );
  const result = await response.json();
  if (!result.success) {
    throw new Error("Security check failed. Please try again.");
  }
}

export async function onRequestPost({ request, env, params }) {
  const visitor = visitorFromRequest(request);
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const id = String(params.id || "").trim().toUpperCase();
    const design = await env.DB.prepare(
      "SELECT id, status, comments_enabled FROM designs WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!design || design.status !== "approved") {
      return jsonResponse({ ok: false, error: "Published design not found." }, visitor, 404);
    }
    if (!design.comments_enabled) {
      return jsonResponse({ ok: false, error: "Comments are closed for this design." }, visitor, 403);
    }

    const body = await request.json();
    const displayName = String(body.displayName || "").trim().slice(0, 40);
    const commentBody = String(body.body || "").trim().slice(0, 500);
    const turnstileToken = String(body.turnstileToken || "");

    if (displayName.length < 2) {
      return jsonResponse(
        { ok: false, error: "Please enter a name with at least 2 characters." },
        visitor,
        400
      );
    }
    if (commentBody.length < 2) {
      return jsonResponse(
        { ok: false, error: "Please enter a comment with at least 2 characters." },
        visitor,
        400
      );
    }

    await validateTurnstile(request, env, turnstileToken);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total
      FROM design_comments
      WHERE visitor_id = ? AND created_at >= ?`
    )
      .bind(visitor.id, oneHourAgo)
      .first();

    if (Number(recentRow?.total || 0) >= 3) {
      return jsonResponse(
        { ok: false, error: "You have submitted several comments. Please try again later." },
        visitor,
        429
      );
    }

    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO design_comments (
        design_id,
        visitor_id,
        display_name,
        body,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    )
      .bind(id, visitor.id, displayName, commentBody, now, now)
      .run();

    return jsonResponse(
      {
        ok: true,
        status: "pending",
        message: "Your comment was submitted and is waiting for review.",
      },
      visitor
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error.message || String(error) },
      visitor,
      400
    );
  }
}
