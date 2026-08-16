const KIT_PRICES_USD_CENTS = {
  "DP-KIT-1X1": 762,
  "DP-KIT-1X2": 1524,
  "DP-KIT-1X3": 2286,
  "DP-KIT-1X4": 3048,
  "DP-KIT-1X5": 3820,
  "DP-KIT-1X6": 4572,
  "DP-KIT-1X7": 5334,
  "DP-KIT-1X8": 6096,
  "DP-KIT-2X2": 3048,
  "DP-KIT-2X3": 4572,
  "DP-KIT-2X4": 6096,
  "DP-KIT-2X5": 7620,
  "DP-KIT-2X6": 9144,
  "DP-KIT-2X7": 10668,
  "DP-KIT-2X8": 12192,
  "DP-KIT-3X3": 6858,
  "DP-KIT-3X4": 9144,
  "DP-KIT-3X5": 11430,
  "DP-KIT-3X6": 13716,
  "DP-KIT-3X7": 16002,
  "DP-KIT-3X8": 18288,
  "DP-KIT-4X4": 12192,
  "DP-KIT-4X5": 15240,
  "DP-KIT-4X6": 18288,
  "DP-KIT-4X7": 21336,
  "DP-KIT-4X8": 24384,
  "DP-KIT-5X5": 19050,
  "DP-KIT-5X6": 22860,
  "DP-KIT-5X7": 26670,
  "DP-KIT-5X8": 30480,
  "DP-KIT-6X6": 27432,
  "DP-KIT-6X7": 32004,
  "DP-KIT-6X8": 36576,
  "DP-KIT-7X7": 37338,
  "DP-KIT-7X8": 42672,
  "DP-KIT-8X8": 48768,
};

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
    const priceCents = KIT_PRICES_USD_CENTS[sku];

    if (!Number.isInteger(priceCents)) {
      throw new Error(`Could not find kit price for ${sku}.`);
    }

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
