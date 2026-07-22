function textResponse(message, status = 400) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet({ request, env }) {
  if (!env.DESIGN_IMAGES) {
    return textResponse("Missing DESIGN_IMAGES binding.", 500);
  }

  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";

  if (!key.startsWith("previews/") && !key.startsWith("finished/")) {
    return textResponse("Invalid image key.", 400);
  }

  const object = await env.DESIGN_IMAGES.get(key);
  if (!object) {
    return textResponse("Image not found.", 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, {
    headers,
  });
}
