import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { onRequest as applySeoMiddleware } from "../functions/_middleware.js";
import { onRequestGet as getFindProject } from "../functions/find-project.js";
import { onRequestGet as getRobots } from "../functions/robots.txt.js";
import { onRequestGet as getShare } from "../functions/share/[id].js";
import { onRequestGet as getSitemap } from "../functions/sitemap.xml.js";

test("public landing pages use the official canonical host", async () => {
  const index = await fs.readFile(new URL("../app/index.html", import.meta.url), "utf8");
  assert.match(index, /rel="canonical" href="https:\/\/pixelizer\.doopixel\.com\/"/);

  const unapprovedShare = await getShare({
    params: { id: "DP-TEST1234" },
    env: {},
    request: new Request("https://preview.doopixel-pixelizer.pages.dev/share/DP-TEST1234"),
  });
  const shareHtml = await unapprovedShare.text();
  assert.match(shareHtml, /rel="canonical" href="https:\/\/pixelizer\.doopixel\.com\/share\/DP-TEST1234"/);
  assert.equal(unapprovedShare.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("approved share pages expose CreativeWork and breadcrumb structured data", async () => {
  const env = {
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return {
                  id: "DP-TEST1234",
                  title: "Test Design",
                  customer_caption: "A buildable test design.",
                  preview_image_key: "previews/test.png",
                  finished_image_key: "finished/test.png",
                  is_verified: 1,
                  status: "approved",
                  updated_at: "2026-08-16T12:00:00.000Z",
                };
              },
            };
          },
        };
      },
    },
  };
  const response = await getShare({
    params: { id: "DP-TEST1234" },
    env,
    request: new Request("https://pixelizer.doopixel.com/share/DP-TEST1234"),
  });
  const html = await response.text();
  assert.match(html, /"@type":"CreativeWork"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.equal(response.headers.get("x-robots-tag"), null);
});

test("robots file points crawlers to the public sitemap", async () => {
  const response = await getRobots();
  const body = await response.text();
  assert.match(response.headers.get("content-type"), /^text\/plain/);
  assert.match(body, /Disallow: \/api\//);
  assert.match(body, /Sitemap: https:\/\/pixelizer\.doopixel\.com\/sitemap\.xml/);
});

test("sitemap includes only public routes and approved designs", async () => {
  const env = {
    DB: {
      prepare() {
        return {
          async all() {
            return {
              results: [
                { id: "DP-ABC12345", last_modified: "2026-08-16T12:00:00.000Z" },
                { id: "invalid", last_modified: "2026-08-16T12:00:00.000Z" },
              ],
            };
          },
        };
      },
    },
  };
  const response = await getSitemap({ env });
  const body = await response.text();
  assert.match(response.headers.get("content-type"), /^application\/xml/);
  assert.match(body, /https:\/\/pixelizer\.doopixel\.com\/gallery/);
  assert.match(body, /https:\/\/pixelizer\.doopixel\.com\/share\/DP-ABC12345/);
  assert.doesNotMatch(body, /find-project|\/project\/|invalid/);
});

test("middleware redirects public production pages.dev GET requests only", async () => {
  const redirected = await applySeoMiddleware({
    request: new Request("https://doopixel-pixelizer.pages.dev/gallery?q=art"),
    next: async () => new Response("unused"),
  });
  assert.equal(redirected.status, 301);
  assert.equal(redirected.headers.get("location"), "https://pixelizer.doopixel.com/gallery?q=art");

  const webhook = await applySeoMiddleware({
    request: new Request("https://doopixel-pixelizer.pages.dev/api/shopify/orders-create", { method: "POST" }),
    next: async () => new Response("ok"),
  });
  assert.equal(webhook.status, 200);
  assert.equal(webhook.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("private project lookup is noindex in HTML and response headers", async () => {
  const response = await getFindProject();
  const html = await response.text();
  assert.match(html, /meta name="robots" content="noindex,nofollow"/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});
