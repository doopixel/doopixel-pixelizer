import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as getGalleryPage } from "../functions/gallery.js";

test("gallery cards open their design detail page", async () => {
  const html = await (await getGalleryPage()).text();

  assert.match(html, /card\.tabIndex = 0/);
  assert.match(html, /card\.setAttribute\("role", "link"\)/);
  assert.match(html, /card\.addEventListener\("click"/);
  assert.match(html, /window\.location\.href = detailUrl/);
  assert.match(html, /link\.href = detailUrl/);
});
