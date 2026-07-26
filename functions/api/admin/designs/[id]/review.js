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

    if (!/^DP-[A-Z0-9]{6,32}$/.test(id)) {
      return jsonResponse({ ok: false, error: "Invalid design id." }, 400);
    }
    const design = await env.DB.prepare(
      `SELECT
        id,
        title,
        customer_caption,
        finished_image_key,
        status,
        is_pinned,
        pinned_at,
        approved_at,
        moderator_note
      FROM designs
      WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!design) {
      return jsonResponse({ ok: false, error: "Design not found." }, 404);
    }
    const status =
      body.status === undefined ? design.status : String(body.status || "").toLowerCase();
    if (!["pending", "approved", "hidden", "rejected"].includes(status)) {
      return jsonResponse({ ok: false, error: "Invalid review status." }, 400);
    }
    if (status === "approved" && !design.finished_image_key) {
      return jsonResponse(
        { ok: false, error: "A finished build image is required before approval." },
        400
      );
    }

    const now = new Date().toISOString();
    const title =
      body.title === undefined
        ? design.title
        : String(body.title || "").trim().slice(0, 120);
    const customerCaption =
      body.customerCaption === undefined
        ? design.customer_caption
        : String(body.customerCaption || "").trim().slice(0, 500);
    const moderatorNote =
      body.moderatorNote === undefined
        ? design.moderator_note
        : String(body.moderatorNote || "").trim().slice(0, 500);

    if (!title) {
      return jsonResponse({ ok: false, error: "Title cannot be empty." }, 400);
    }

    let isPinned =
      body.isPinned === undefined ? Boolean(design.is_pinned) : Boolean(body.isPinned);
    let pinnedAt = design.pinned_at;
    let approvedAt = design.approved_at;

    if (status !== "approved") {
      isPinned = false;
      pinnedAt = null;
    } else {
      approvedAt = approvedAt || now;
      if (isPinned && !design.is_pinned) {
        pinnedAt = now;
      }
      if (!isPinned) {
        pinnedAt = null;
      }
    }

    await env.DB.prepare(
      `UPDATE designs
      SET
        title = ?,
        customer_caption = ?,
        moderator_note = ?,
        status = ?,
        is_pinned = ?,
        pinned_at = ?,
        approved_at = ?,
        updated_at = ?
      WHERE id = ?`
    )
      .bind(
        title,
        customerCaption,
        moderatorNote,
        status,
        isPinned ? 1 : 0,
        pinnedAt,
        approvedAt,
        now,
        id
      )
      .run();

    return jsonResponse({
      ok: true,
      id,
      status,
      isPinned,
      title,
      customerCaption,
      moderatorNote,
      updatedAt: now,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}

