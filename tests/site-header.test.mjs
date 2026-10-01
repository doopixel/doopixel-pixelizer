import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { onRequestGet as getFindProject } from "../functions/find-project.js";
import { onRequestGet as getGallery } from "../functions/gallery.js";
import { onRequestGet as getProject } from "../functions/project/[id].js";
import { onRequestGet as getShare } from "../functions/share/[id].js";

const EXPECTED_LABELS = ["Shop Pixel Art", "Create My Art", "Community Gallery", "Brick Parts", "Contact"];

function assertSharedHeader(html, pageName) {
  const navigation = html.match(/id="dp-site-links">([\s\S]*?)<\/div>/)[1];
  assert.match(navigation, /href="https:\/\/mypixelwalls\.com\/collections\/brick-art"/);
  assert.match(navigation, /href="https:\/\/mypixelwalls\.com\/collections\/brick-parts"/);
  assert.match(navigation, /href="https:\/\/pixelizer\.doopixel\.com\/gallery"/);
  assert.doesNotMatch(navigation, /\/parts-import|\/find-project/);
  let previousIndex = -1;
  EXPECTED_LABELS.forEach((label) => {
    const index = html.indexOf(`>${label}</a>`);
    assert.ok(index > previousIndex, `${pageName} should contain ${label} in the expected order`);
    previousIndex = index;
  });
  assert.match(html, /class="dp-site-menu-button"[^>]*>[\s\S]*?lucide-menu\.svg/);
  assert.match(html, /class="dp-site-cart-icon"[^>]*aria-label="Shopping cart"[^>]*>[\s\S]*?lucide-shopping-cart\.svg/);
  assert.match(html, /class="dp-site-logo"[\s\S]*?logo111\.png\?v=1788088003/);
  assert.match(html, /href="https:\/\/mypixelwalls\.com\/cart"/);
  assert.match(html, /doopixel-site-header\.css/);
  assert.match(html, /doopixel-site-header\.js/);
}

test("public pages use the My Pixel Walls header while preserving Cloudflare routes", async () => {
  const pages = [
    ["Pixel Art Maker", await readFile(new URL("../app/index.html", import.meta.url), "utf8")],
    ["Matching Parts", await readFile(new URL("../app/parts-import/index.html", import.meta.url), "utf8")],
    ["Gallery", await (await getGallery()).text()],
    ["Find My Project", await (await getFindProject()).text()],
    ["Private Project", await (await getProject({ params: { id: "PRJ-TEST1234" } })).text()],
    ["Shared Design", await (await getShare({
      params: { id: "DP-TEST1234" },
      env: {},
      request: new Request("https://pixelizer.doopixel.com/share/DP-TEST1234"),
    })).text()],
  ];
  pages.forEach(([pageName, html]) => assertSharedHeader(html, pageName));
});

test("shared navigation hides Matching Parts and Find My Project without removing their routes", async () => {
  const source = await readFile(new URL("../app/js/doopixel-site-header.js", import.meta.url), "utf8");
  assert.match(source, /a\[href\*="\/parts-import"\], a\[href\*="\/find-project"\]/);
  assert.match(source, /link\.remove\(\)/);
});

test("shared header uses the new store branding and search destination", async () => {
  const source = await readFile(new URL("../app/js/doopixel-site-header.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/css/doopixel-site-header.css", import.meta.url), "utf8");
  assert.match(source, /logo111\.png\?v=1788088003/);
  assert.match(source, /https:\/\/mypixelwalls\.com/);
  assert.match(source, /dp-site-search-panel/);
  assert.match(source, /SHOPIFY_ORIGIN.*\/search/s);
  assert.match(source, /dataset\.dpCartCount/);
  assert.match(source, /count\.hidden = true/);
  assert.match(styles, /#5433eb/);
  assert.match(styles, /@media \(max-width: 1199px\)/);
});
