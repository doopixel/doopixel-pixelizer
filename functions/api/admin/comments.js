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

export async function onRequestGet({ request, env }) {
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

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status") || "pending";
    const status = ["pending", "approved", "hidden", "rejected"].includes(requestedStatus)
      ? requestedStatus
      : "pending";
    const search = String(url.searchParams.get("q") || "").trim().toLowerCase().slice(0, 100);
    const searchPattern = `%${search}%`;
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = 24;
    const offset = (page - 1) * limit;

    const result = await env.DB.prepare(
      `SELECT
        c.id,
        c.design_id,
        c.display_name,
        c.body,
        c.status,
        c.created_at,
        c.updated_at,
        d.title AS design_title
      FROM design_comments c
      JOIN designs d ON d.id = c.design_id
      WHERE c.status = ?
        AND (
          ? = ''
          OR LOWER(c.design_id) LIKE ?
          OR LOWER(d.title) LIKE ?
          OR LOWER(c.display_name) LIKE ?
          OR LOWER(c.body) LIKE ?
        )
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?`
    )
      .bind(
        status,
        search,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        limit,
        offset
      )
      .all();

    const totalRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total
      FROM design_comments c
      JOIN designs d ON d.id = c.design_id
      WHERE c.status = ?
        AND (
          ? = ''
          OR LOWER(c.design_id) LIKE ?
          OR LOWER(d.title) LIKE ?
          OR LOWER(c.display_name) LIKE ?
          OR LOWER(c.body) LIKE ?
        )`
    )
      .bind(
        status,
        search,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      )
      .first();

    const countResult = await env.DB.prepare(
      `SELECT status, COUNT(*) AS total
      FROM design_comments
      WHERE status IN ('pending', 'approved', 'hidden', 'rejected')
      GROUP BY status`
    ).all();

    const counts = { pending: 0, approved: 0, hidden: 0, rejected: 0 };
    (countResult.results || []).forEach((row) => {
      if (Object.prototype.hasOwnProperty.call(counts, row.status)) {
        counts[row.status] = Number(row.total || 0);
      }
    });

    const total = Number(totalRow?.total || 0);
    return jsonResponse({
      ok: true,
      status,
      search,
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
      comments: (result.results || []).map((comment) => ({
        id: Number(comment.id),
        designId: comment.design_id,
        designTitle: comment.design_title,
        displayName: comment.display_name,
        body: comment.body,
        status: comment.status,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      })),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
