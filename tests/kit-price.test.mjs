import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/kit-price.js";

test("returns the matching Shopify kit price for an artwork size", async () => {
  const response = await onRequestGet({
    request: new Request("https://pixelizer.doopixel.com/api/kit-price?width=64&height=48"),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result, {
    ok: true,
    sku: "DP-KIT-3X4",
    priceCents: 9144,
    currency: "USD",
  });
});

test("calculates price from the total number of 16 x 16 baseplates", async () => {
  const response = await onRequestGet({
    request: new Request("https://pixelizer.doopixel.com/api/kit-price?width=80&height=16"),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.sku, "DP-KIT-1X5");
  assert.equal(result.priceCents, 3810);
});

test("rejects invalid artwork dimensions", async () => {
  const response = await onRequestGet({
    request: new Request("https://pixelizer.doopixel.com/api/kit-price?width=50&height=48"),
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.ok, false);
  assert.match(result.error, /16-pixel steps/);
});
