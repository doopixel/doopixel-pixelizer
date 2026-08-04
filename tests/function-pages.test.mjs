import test from "node:test";

import { onRequestGet as getVerifiedAdmin } from "../functions/admin/verified.js";
import { onRequestGet as getGallery } from "../functions/gallery.js";
import { onRequestGet as getProject } from "../functions/project/[id].js";
import { onRequestGet as getShare } from "../functions/share/[id].js";

function assertInlineScriptsParse(html) {
  const scripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi));
  scripts.forEach((match) => {
    new Function(match[1]);
  });
}

test("dynamic HTML pages contain valid inline JavaScript", async () => {
  const responses = [
    await getVerifiedAdmin(),
    await getGallery(),
    await getProject({ params: { id: "PRJ-TEST1234" } }),
    await getShare({
      params: { id: "DP-TEST1234" },
      env: {},
      request: new Request("https://pixelizer.doopixel.com/share/DP-TEST1234"),
    }),
  ];

  for (const response of responses) {
    assertInlineScriptsParse(await response.text());
  }
});
