import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { onRequest } from "../functions/_middleware.js";

test("Pixel Art Maker and Cloudflare design pages hand off to the new store", async () => {
  const paths = [
    "app/index.html",
    "app/js/doopixel-pixelizer-add-to-cart.js",
    "functions/share/[id].js",
  ];
  for (const path of paths) {
    const source = await fs.readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.match(source, /https:\/\/mypixelwalls\.com\/pages\/add-pixel-kit/, path);
    assert.doesNotMatch(source, /https:\/\/doopixel\.com\/pages\/add-pixel-kit/, path);
  }
});

test("temporarily retired Matching Parts route cannot send shoppers to the old store", async () => {
  for (const pathname of ["/parts-import", "/parts-import/"]) {
    const response = await onRequest({
      request: new Request(`https://pixelizer.doopixel.com${pathname}`),
      next: async () => new Response("old checkout"),
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://pixelizer.doopixel.com/");
  }
});
