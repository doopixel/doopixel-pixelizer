import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("photo appearance sliders redraw on mobile input events", async () => {
  const source = await fs.readFile(new URL("../app/js/index.js", import.meta.url), "utf8");
  const page = await fs.readFile(new URL("../app/index.html", import.meta.url), "utf8");

  assert.match(source, /slider\.addEventListener\("input", handler/);
  assert.match(source, /slider\.addEventListener\("change", handler/);
  ["hue", "saturation", "value", "brightness", "contrast"].forEach((name) => {
    assert.match(source, new RegExp(`bindLivePhotoAppearanceSlider\\("${name}-slider"`));
  });
  assert.match(source, /80 - \(Date\.now\(\) - photoAppearanceLastUpdate\)/);
  assert.match(page, /js\/index\.js\?v=20260820b/);
});

test("photo appearance resets flush pending mobile updates", async () => {
  const source = await fs.readFile(new URL("../app/js/index.js", import.meta.url), "utf8");

  assert.match(source, /const flushPhotoAppearanceUpdate = \(\) => \{/);
  assert.match(source, /window\.clearTimeout\(photoAppearanceUpdateTimer\)/);
  assert.match(source, /runStep2\(\);[\s\S]*photoAppearanceLastUpdate = 0;/);
  assert.equal((source.match(/flushPhotoAppearanceUpdate\(\);/g) || []).length, 3);
});

test("pixelizer uses the current DooPixel green visual theme", async () => {
  const page = await fs.readFile(new URL("../app/index.html", import.meta.url), "utf8");
  const styles = await fs.readFile(new URL("../app/css/doopixel-wizard.css", import.meta.url), "utf8");
  const manifest = await fs.readFile(new URL("../app/manifest.json", import.meta.url), "utf8");

  assert.match(styles, /--dp-blue: #1f9d48/);
  assert.match(styles, /--dp-blue-dark: #14733b/);
  assert.doesNotMatch(styles, /#4961bd|#35499d|#289b3a/);
  assert.match(page, /theme-color" content="#1f9d48"/);
  assert.match(page, /doopixel-wizard\.css\?v=20260820a/);
  assert.doesNotMatch(page, /#4961bd|#35499d|#289b3a/);
  assert.equal(JSON.parse(manifest).theme_color, "#1f9d48");
});
