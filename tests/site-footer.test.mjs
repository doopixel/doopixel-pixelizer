import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const publicTemplates = [
  "app/index.html",
  "functions/gallery.js",
  "functions/share/[id].js",
  "functions/find-project.js",
  "functions/project/[id].js",
];

test("all public pages load the shared DooPixel footer", () => {
  for (const path of publicTemplates) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /doopixel-site-footer\.css/, `${path} is missing footer styles`);
    assert.match(source, /data-doopixel-footer/, `${path} is missing the footer mount`);
    assert.match(source, /doopixel-site-footer\.js/, `${path} is missing the footer script`);
  }
});
test("footer uses valid storefront destinations in the same window", () => {
  const source = fs.readFileSync("app/js/doopixel-site-footer.js", "utf8");
  assert.match(source, /https:\/\/pixelizer\.doopixel\.com\/gallery/);
  assert.match(source, /https:\/\/doopixel\.com\/pages\/contact/);
  assert.doesNotMatch(source, /target=["']_blank["']/);
  assert.doesNotMatch(source, /href=["']#["']/);
});
