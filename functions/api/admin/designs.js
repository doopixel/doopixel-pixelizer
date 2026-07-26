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

function parseParts(value) {
  try {
    const parts = JSON.parse(value || "[]");
    return Array.isArray(parts) ? parts : [];
  } catch (_error) {
    return [];
  }
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
    const status = ["pending", "approved", "rejected"].includes(requestedStatus)
      ? requestedStatus
      : "pending";

    const result = await env.DB.prepare(
      `SELECT
        id,
        title,
        piece_type_name,
        width,
        height,
        parts_json,
        preview_image_key,
        finished_image_key,
        customer_caption,
        status,
        created_at,
        updated_at
      FROM designs
      WHERE status = ?
      ORDER BY updated_at DESC
      LIMIT 100`
    )
      .bind(status)
      .all();

    const designs = (result.results || []).map((design) => {
      const parts = parseParts(design.parts_json);
      return {
        id: design.id,
        title: design.title,
        pieceTypeName: design.piece_type_name,
        size: [design.width, design.height],
        totalPieces: parts.reduce((sum, part) => sum + Number(part.quantity || 0), 0),
        colorLines: parts.length,
        previewImageKey: design.preview_image_key,
        finishedImageKey: design.finished_image_key,
        customerCaption: design.customer_caption,
        status: design.status,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
      };
    });

    return jsonResponse({ ok: true, status, designs });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
