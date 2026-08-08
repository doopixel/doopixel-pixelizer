import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost as submitBuild } from "../functions/api/projects/[id]/submit.js";
import { onRequestGet as getDesign } from "../functions/api/designs/[id].js";

function makeSubmitRequest() {
  const form = new FormData();
  form.append("finishedImages", new File(["first"], "first.jpg", { type: "image/jpeg" }));
  form.append("finishedImages", new File(["second"], "second.webp", { type: "image/webp" }));
  form.set("caption", "Two views of the finished build.");
  return new Request("https://pixelizer.doopixel.com/api/projects/PRJ-TEST1234/submit", {
    method: "POST",
    headers: { authorization: "Bearer project-token" },
    body: form,
  });
}

test("customer submission stores multiple photos and uses the first as the cover", async () => {
  const writes = [];
  let updateValues = null;
  const env = {
    DESIGN_IMAGES: {
      async put(key) { writes.push(key); },
      async delete() {},
    },
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              async first() {
                if (sql.includes("project_access_tokens")) return { id: "access" };
                return { id: "PRJ-TEST1234", design_id: "DP-DESIGN1", status: "ordered" };
              },
              async run() { updateValues = values; },
            };
          },
        };
      },
    },
  };

  const response = await submitBuild({
    request: makeSubmitRequest(),
    env,
    params: { id: "PRJ-TEST1234" },
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.imageCount, 2);
  assert.equal(writes.length, 2);
  assert.match(writes[0], /^finished\/DP-DESIGN1\/PRJ-TEST1234-\d+-1\.jpg$/);
  assert.match(writes[1], /^finished\/DP-DESIGN1\/PRJ-TEST1234-\d+-2\.webp$/);
  assert.equal(updateValues[0], writes[0]);
});

test("approved design API returns the cover first and all stored photos", async () => {
  const primary = "finished/verified/DP-DESIGN1.jpg";
  const env = {
    DESIGN_IMAGES: {
      async list() {
        return {
          objects: [
            { key: "finished/verified/DP-DESIGN1-2.jpg" },
            { key: primary },
            { key: "finished/verified/DP-DESIGN1-3.webp" },
          ],
        };
      },
    },
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return {
                  id: "DP-DESIGN1",
                  title: "Multi Photo Design",
                  piece_type: "98138",
                  piece_type_name: "Flat Pixel Pieces (1x1 Round Tile)",
                  width: 48,
                  height: 48,
                  parts_json: "[]",
                  preview_image_key: null,
                  finished_image_key: primary,
                  customer_caption: "Three views",
                  is_verified: 1,
                  instruction_pdf_key: "instructions/verified/DP-DESIGN1.pdf",
                  status: "approved",
                  created_at: "2026-08-08T00:00:00.000Z",
                  updated_at: "2026-08-08T00:00:00.000Z",
                };
              },
            };
          },
        };
      },
    },
  };

  const response = await getDesign({ env, params: { id: "DP-DESIGN1" } });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result.design.imageKeys, [
    primary,
    "finished/verified/DP-DESIGN1-2.jpg",
    "finished/verified/DP-DESIGN1-3.webp",
  ]);
});

test("customer photo listing only includes the latest submission set", async () => {
  const primary = "finished/DP-DESIGN1/PRJ-TEST1234-1786000000000-1.jpg";
  let requestedPrefix = "";
  const env = {
    DESIGN_IMAGES: {
      async list(options) {
        requestedPrefix = options.prefix;
        return {
          objects: [
            { key: primary },
            { key: "finished/DP-DESIGN1/PRJ-TEST1234-1786000000000-2.jpg" },
          ],
        };
      },
    },
    DB: {
      prepare() {
        return {
          bind() {
            return {
              async first() {
                return {
                  id: "DP-DESIGN1", title: "Customer Design", piece_type: "98138",
                  width: 48, height: 48, parts_json: "[]", preview_image_key: null,
                  finished_image_key: primary, customer_caption: "Two views", is_verified: 0,
                  instruction_pdf_key: null, status: "approved", created_at: "now", updated_at: "now",
                };
              },
            };
          },
        };
      },
    },
  };

  const response = await getDesign({ env, params: { id: "DP-DESIGN1" } });
  const result = await response.json();
  assert.equal(requestedPrefix, "finished/DP-DESIGN1/PRJ-TEST1234-1786000000000-");
  assert.equal(result.design.imageKeys.length, 2);
});
