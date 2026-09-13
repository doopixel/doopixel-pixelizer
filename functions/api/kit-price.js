import { getKitPrice } from "../_lib/kit-pricing.js";

function jsonResponse(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const price = getKitPrice(url.searchParams.get("width"), url.searchParams.get("height"));

    return jsonResponse(
      { ok: true, ...price },
      200,
      "public, max-age=300"
    );
  } catch (error) {
    return jsonResponse(
      { ok: false, error: error.message || String(error) },
      400
    );
  }
}
