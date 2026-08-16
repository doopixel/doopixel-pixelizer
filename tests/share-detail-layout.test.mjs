import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet as getSharePage } from "../functions/share/[id].js";

test("share detail page presents product information before pieces and comments", async () => {
  const response = await getSharePage({
    params: { id: "DP-TEST1234" },
    env: {},
    request: new Request("https://pixelizer.doopixel.com/share/DP-TEST1234"),
  });
  const html = await response.text();

  const informationIndex = html.indexOf("Product Information");
  const descriptionIndex = html.indexOf("About This Design");
  const piecesIndex = html.indexOf("Required Pieces");
  const commentsIndex = html.indexOf("Comments (<span");

  assert.ok(informationIndex > 0);
  assert.ok(descriptionIndex > informationIndex);
  assert.ok(piecesIndex > descriptionIndex);
  assert.ok(commentsIndex > piecesIndex);
  assert.doesNotMatch(html, /id="design-subtitle"/);
  assert.doesNotMatch(html, /<th>SKU<\/th>/);
  assert.doesNotMatch(html, /Build This Design/);
  assert.match(html, /id="meta-price"/);
  assert.match(html, /layout · 16 x 16 baseplates/);
  assert.match(html, /Approx\. .* x .* cm/);
  assert.match(html, /pixel pieces/);
  assert.match(html, /download link for the building instructions/);
  assert.ok(html.indexOf('id="meta-id"') < html.indexOf('id="meta-total"'));
  assert.ok(html.indexOf('class="panel-heading"') < html.indexOf('id="verified-badge"'));
  assert.match(html, /white-space: pre-line/);
  assert.match(html, /\/api\/kit-price\?/);
});
