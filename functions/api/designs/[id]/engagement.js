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

export async function onRequestGet({ request, env, params }) {
  const visitor = visitorFromRequest(request);
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const id = String(params.id || "").trim().toUpperCase();
    const design = await env.DB.prepare(
      `SELECT id, status, manual_like_offset, comments_enabled, share_count
      FROM designs
      WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!design || design.status !== "approved") {
      return jsonResponse({ ok: false, error: "Published design not found." }, visitor, 404);
    }

    const [likeRow, likedRow, commentCountRow, commentResult] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS total FROM design_likes WHERE design_id = ?")
        .bind(id)
        .first(),
      env.DB.prepare(
        "SELECT id FROM design_likes WHERE design_id = ? AND visitor_id = ?"
      )
        .bind(id, visitor.id)
        .first(),
      env.DB.prepare(
        "SELECT COUNT(*) AS total FROM design_comments WHERE design_id = ? AND status = 'approved'"
      )
        .bind(id)
        .first(),
      env.DB.prepare(
        `SELECT id, display_name, body, created_at
        FROM design_comments
        WHERE design_id = ? AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT 50`
      )
        .bind(id)
        .all(),
    ]);

    const organicLikes = Number(likeRow?.total || 0);
    const promotionalLikes = Math.max(0, Number(design.manual_like_offset || 0));
    const comments = (commentResult.results || []).reverse().map((comment) => ({
      id: Number(comment.id),
      displayName: comment.display_name,
      body: comment.body,
      createdAt: comment.created_at,
    }));

    return jsonResponse(
      {
        ok: true,
        liked: Boolean(likedRow),
        likes: organicLikes + promotionalLikes,
        commentCount: Number(commentCountRow?.total || 0),
        commentsEnabled: Boolean(design.comments_enabled),
        comments,
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
