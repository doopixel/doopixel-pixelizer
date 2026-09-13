import assert from "node:assert/strict";
import test from "node:test";

import {
  isStorefrontApiPath,
  isStorefrontOriginAllowed,
  onRequest,
} from "../functions/_middleware.js";

test("allows only the public Gallery API surface", () => {
  assert.equal(isStorefrontApiPath("/api/gallery"), true);
  assert.equal(isStorefrontApiPath("/api/designs/DP-123"), true);
  assert.equal(isStorefrontApiPath("/api/designs/DP-123/projects"), true);
  assert.equal(isStorefrontApiPath("/api/admin/designs"), false);
  assert.equal(isStorefrontApiPath("/api/projects/PRJ-123"), false);
});

test("allows the storefront, Shopify preview, and local preview origins", () => {
  assert.equal(isStorefrontOriginAllowed("https://doopixel.com"), true);
  assert.equal(isStorefrontOriginAllowed("https://mz77zt-nj.myshopify.com"), true);
  assert.equal(isStorefrontOriginAllowed("http://127.0.0.1:9292"), true);
  assert.equal(isStorefrontOriginAllowed("https://example.com"), false);
});

test("answers storefront preflight without invoking an API handler", async () => {
  let invoked = false;
  const response = await onRequest({
    request: new Request("https://pixelizer.doopixel.com/api/designs/DP-123/projects", {
      method: "OPTIONS",
      headers: { origin: "https://doopixel.com" },
    }),
    next: async () => {
      invoked = true;
      return new Response("unexpected");
    },
  });

  assert.equal(invoked, false);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://doopixel.com");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
});

test("does not add CORS headers for private APIs", async () => {
  const response = await onRequest({
    request: new Request("https://pixelizer.doopixel.com/api/admin/designs", {
      headers: { origin: "https://doopixel.com" },
    }),
    next: async () => new Response("private"),
  });

  assert.equal(response.headers.has("access-control-allow-origin"), false);
});
