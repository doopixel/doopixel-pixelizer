function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestPost({ env, params }) {
  try {
    if (!env.DB) {
      throw new Error("Missing DB binding.");
    }

    const id = String(params.id || "").trim().toUpperCase();
    const result = await env.DB.prepare(
      `UPDATE designs
      SET share_count = share_count + 1
      WHERE id = ? AND status = 'approved'`
    )
      .bind(id)
      .run();

    if (!result.meta?.changes) {
      return jsonResponse({ ok: false, error: "Published design not found." }, 404);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
