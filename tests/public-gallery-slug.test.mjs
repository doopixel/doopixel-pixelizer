import assert from "node:assert/strict";
import test from "node:test";

import { toPublicSlug } from "../functions/_lib/public-slug.js";
import { onRequestGet as getDesign } from "../functions/api/designs/[id].js";

test("creates readable public slugs from Gallery titles", () => {
  assert.equal(toPublicSlug("Van Gogh’s Sunflowers"), "van-goghs-sunflowers");
  assert.equal(toPublicSlug("Hope Poster - Obama"), "hope-poster-obama");
});

test("loads an approved design using its title slug", async () => {
  const candidate = {
    id: "DP-TEST1234",
    title: "Leo Messi Mosaic",
    piece_type: "98138",
    piece_type_name: "Flat Pixel Pieces (98138)",
    width: 48,
    height: 48,
    parts_json: "[]",
    preview_image_key: null,
    finished_image_key: "finished/test.jpg",
    customer_caption: "Test caption",
    is_verified: 1,
    instruction_pdf_key: "instructions/test.pdf",
    status: "approved",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  };
  const DB = {
    prepare(sql) {
      return {
        bind() {
          return { async first() { return null; } };
        },
        async all() {
          assert.match(sql, /status = 'approved'/);
          return { results: [candidate] };
        },
      };
    },
  };

  const response = await getDesign({ env: { DB }, params: { id: "leo-messi-mosaic" } });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.design.id, candidate.id);
  assert.equal(payload.design.slug, "leo-messi-mosaic");
});
