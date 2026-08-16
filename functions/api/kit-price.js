const PRICE_PER_BASEPLATE_USD_CENTS = 762;

function jsonResponse(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

function parseArtworkDimension(value) {
  const dimension = Number(value);
  if (
    !Number.isInteger(dimension) ||
    dimension < 16 ||
    dimension > 128 ||
    dimension % 16 !== 0
  ) {
    throw new Error("Artwork dimensions must be 16 to 128 pixels in 16-pixel steps.");
  }
  return dimension;
}

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const artworkWidth = parseArtworkDimension(url.searchParams.get("width"));
    const artworkHeight = parseArtworkDimension(url.searchParams.get("height"));
    const baseplateWidth = artworkWidth / 16;
    const baseplateHeight = artworkHeight / 16;
    const pricingWidth = Math.min(baseplateWidth, baseplateHeight);
    const pricingHeight = Math.max(baseplateWidth, baseplateHeight);
    const sku = `DP-KIT-${pricingWidth}X${pricingHeight}`;
    const priceCents = baseplateWidth * baseplateHeight * PRICE_PER_BASEPLATE_USD_CENTS;

    return jsonResponse(
      { ok: true, sku, priceCents, currency: "USD" },
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
