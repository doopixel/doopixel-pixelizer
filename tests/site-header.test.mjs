import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { onRequestGet as getFindProject } from "../functions/find-project.js";
import { onRequestGet as getGallery } from "../functions/gallery.js";
import { onRequestGet as getProject } from "../functions/project/[id].js";
import { onRequestGet as getShare } from "../functions/share/[id].js";

const EXPECTED_LABELS = ["Upload Images", "Gallery &amp; Shop", "Matching Parts", "Find My Project"];

function assertSharedHeader(html, pageName) {
  let previousIndex = -1;
  EXPECTED_LABELS.forEach((label) => {
    const index = html.indexOf(`>${label}</a>`);
    assert.ok(index > previousIndex, `${pageName} should contain ${label} in the expected order`);
    previousIndex = index;
  });
  assert.doesNotMatch(html, />Shop<\/a>/, `${pageName} should not contain the old Shop link`);
  assert.doesNotMatch(html, />Pixel Art Maker<\/a>/, `${pageName} should not contain the old tool label`);
  assert.doesNotMatch(html, /Community Gallery/, `${pageName} should not contain the old gallery label`);
  assert.match(html, /class="dp-site-menu-button"[^>]*>[\s\S]*?lucide-menu\.svg/);
  assert.match(html, /class="dp-site-cart-icon"[^>]*aria-label="Shopping cart"[^>]*>[\s\S]*?lucide-shopping-cart\.svg/);
  assert.match(html, /class="dp-site-topbar"[\s\S]*?Free U\.S\. Shipping \$99\+[\s\S]*?Ships from the USA/);
  assert.match(html, /class="dp-site-logo"[\s\S]*?logo3\.png\?v=1787501605/);
  assert.match(html, /class="dp-site-actions"[\s\S]*?class="dp-site-search-button"/);
  assert.match(html, /doopixel-site-header\.css/);
  assert.match(html, /doopixel-site-header\.js/);
}

test("public pages use the shared DooPixel header", async () => {
  const pages = [
    ["Pixel Art Maker", await readFile(new URL("../app/index.html", import.meta.url), "utf8")],
    ["Gallery", await (await getGallery()).text()],
    ["Find My Project", await (await getFindProject()).text()],
    ["Private Project", await (await getProject({ params: { id: "PRJ-TEST1234" } })).text()],
    [
      "Shared Design",
      await (
        await getShare({
          params: { id: "DP-TEST1234" },
          env: {},
          request: new Request("https://pixelizer.doopixel.com/share/DP-TEST1234"),
        })
      ).text(),
    ],
  ];

  pages.forEach(([pageName, html]) => assertSharedHeader(html, pageName));
});

test("shared navigation injects Matching Parts before project lookup", async () => {
  const source = await readFile(new URL("../app/js/doopixel-site-header.js", import.meta.url), "utf8");
  assert.match(source, /Matching Parts/);
  assert.match(source, /pixelizer\.doopixel\.com\/parts-import\//);
  assert.match(source, /insertBefore\(matchingParts, projectLink/);
});

test("shared header matches the Shopify visual shell without replacing page routes", async () => {
  const source = await readFile(new URL("../app/js/doopixel-site-header.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/css/doopixel-site-header.css", import.meta.url), "utf8");

  assert.match(source, /logo3\.png\?v=1787501605/);
  assert.match(source, /Free U\.S\. Shipping \$99\+/);
  assert.match(source, /Ships from the USA/);
  assert.match(source, /dp-site-search-panel/);
  assert.match(source, /SHOPIFY_ORIGIN.*\/search/s);
  assert.match(source, /dataset\.dpCartCount/);
  assert.match(source, /doopixel\.com.*\/cart\.js/s);
  assert.match(styles, /\.dp-site-drawer-header/);
  assert.match(styles, /\.dp-site-menu-overlay/);
  assert.match(styles, /@media \(max-width: 1199px\)/);
});
