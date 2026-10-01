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

test("all public pages load the shared footer", () => {
  for (const path of publicTemplates) {
    const source = fs.readFileSync(path, "utf8");
    assert.match(source, /doopixel-site-footer\.css/, `${path} is missing footer styles`);
    assert.match(source, /data-doopixel-footer/, `${path} is missing the footer mount`);
    assert.match(source, /doopixel-site-footer\.js/, `${path} is missing the footer script`);
  }
});

test("footer uses My Pixel Walls storefront and policy destinations", () => {
  const source = fs.readFileSync("app/js/doopixel-site-footer.js", "utf8");
  assert.match(source, /https:\/\/mypixelwalls\.com\/collections\/brick-art/);
  assert.match(source, /https:\/\/mypixelwalls\.com\/collections\/brick-parts/);
  assert.match(source, /https:\/\/pixelizer\.doopixel\.com\/gallery/);
  assert.match(source, /https:\/\/mypixelwalls\.com\/policies\/shipping-policy/);
  assert.match(source, /logo111\.png\?v=1788088003/);
  assert.match(source, /https:\/\/mypixelwalls\.com\/contact#contact_form/);
  assert.match(source, /contact\[email\]/);
  assert.match(source, /support@mypixelwalls\.com/);
  assert.doesNotMatch(source, /facebook\.com\/doopixel|\/parts-import|\/find-project/);
  assert.doesNotMatch(source, /target=["']_blank["']/);
});

test("footer keeps responsive structure with the purple theme", () => {
  const styles = fs.readFileSync("app/css/doopixel-site-footer.css", "utf8");
  assert.match(styles, /grid-template-areas:/);
  assert.match(styles, /"brand connect"/);
  assert.match(styles, /#201938/);
  assert.match(styles, /@media \(max-width: 899px\)/);
});
