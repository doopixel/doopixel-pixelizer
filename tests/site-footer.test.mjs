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
  assert.match(source, /https:\/\/pixelizer\.doopixel\.com\/parts-import\//);
  assert.match(source, /https:\/\/doopixel\.com\/pages\/contact/);
  assert.match(source, /logo3\.png\?v=1787501605/);
  assert.match(source, /https:\/\/doopixel\.com\/contact#contact_form/);
  assert.match(source, /contact\[email\]/);
  assert.match(source, /Follow on Facebook/);
  assert.match(source, /Secure payments/);
  assert.doesNotMatch(source, /target=["']_blank["']/);
  assert.doesNotMatch(source, /href=["']#["']/);
});

test("footer keeps the Shopify-inspired responsive visual structure", () => {
  const styles = fs.readFileSync("app/css/doopixel-site-footer.css", "utf8");
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /"brand connect"/);
  assert.match(styles, /#0e100f/);
  assert.match(styles, /#b9ed65/);
  assert.match(styles, /@media \(max-width: 899px\)/);
});
