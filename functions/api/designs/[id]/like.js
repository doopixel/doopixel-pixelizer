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

export async function onRequestPost({ request, env, params }) {
  const visitor = visitorFromRequest(request);
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const id = String(params.id || "").trim().toUpperCase();
    const design = await env.DB.prepare(
      "SELECT id, status, manual_like_offset FROM designs WHERE id = ?"
    )
      .bind(id)
      .first();

    if (!design || design.status !== "approved") {
      return jsonResponse({ ok: false, error: "Published design not found." }, visitor, 404);
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM design_likes WHERE design_id = ? AND visitor_id = ?"
    )
      .bind(id, visitor.id)
      .first();

    let liked;
    if (existing) {
      await env.DB.prepare(
        "DELETE FROM design_likes WHERE design_id = ? AND visitor_id = ?"
      )
        .bind(id, visitor.id)
        .run();
      liked = false;
    } else {
      await env.DB.prepare(
        "INSERT INTO design_likes (design_id, visitor_id, created_at) VALUES (?, ?, ?)"
      )
        .bind(id, visitor.id, new Date().toISOString())
        .run();
      liked = true;
    }

    const likeRow = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM design_likes WHERE design_id = ?"
    )
      .bind(id)
      .first();
    const organicLikes = Number(likeRow?.total || 0);
    const promotionalLikes = Math.max(0, Number(design.manual_like_offset || 0));

    return jsonResponse(
      {
        ok: true,
        liked,
        likes: organicLikes + promotionalLikes,
      },
      visitor
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error.message || String(error) },
      visitor,
      500
    );
  }
}
