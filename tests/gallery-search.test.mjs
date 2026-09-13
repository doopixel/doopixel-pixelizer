import assert from "node:assert/strict";
import test from "node:test";

import { onRequestGet } from "../functions/api/gallery.js";

test("gallery API searches all approved designs with parameterized keywords", async () => {
  const statements = [];
  const env = {
    DB: {
      prepare(sql) {
        const statement = { sql, bindings: [] };
        statements.push(statement);
        return {
          bind(...bindings) {
            statement.bindings = bindings;
            return this;
          },
          async all() {
            return { results: [] };
          },
          async first() {
            return { total: 0 };
          },
        };
      },
    },
  };

  const response = await onRequestGet({
    request: new Request("https://pixelizer.doopixel.com/api/gallery?q=Mickey%25&sort=popular&limit=10"),
    env,
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.search, "Mickey%");
  assert.equal(payload.limit, 10);
  assert.match(statements[0].sql, /LOWER\(title\) LIKE LOWER\(\?\)/);
  assert.match(statements[0].sql, /LOWER\(COALESCE\(customer_caption, ''\)\)/);
  assert.match(statements[0].sql, /LOWER\(id\) LIKE LOWER\(\?\)/);
  assert.deepEqual(statements[0].bindings, ["Mickey%", "%Mickey\\%%", "%Mickey\\%%", "%Mickey\\%%", 11, 0]);
  assert.deepEqual(statements[1].bindings, ["Mickey%", "%Mickey\\%%", "%Mickey\\%%", "%Mickey\\%%"]);
});

test("gallery API includes the matching kit price and piece type", async () => {
  let queryIndex = 0;
  const env = {
    DB: {
      prepare() {
        queryIndex += 1;
        return {
          bind() { return this; },
          async all() {
            return {
              results: [{
                id: "DP-TEST",
                title: "Test Design",
                piece_type: "4073",
                width: 48,
                height: 64,
                parts_json: JSON.stringify([{ quantity: 3072 }]),
                finished_image_key: "finished/DP-TEST/image.webp",
                is_verified: 1,
              }],
            };
          },
          async first() { return { total: 1 }; },
        };
      },
    },
  };

  const response = await onRequestGet({
    request: new Request("https://pixelizer.doopixel.com/api/gallery"),
    env,
  });
  const payload = await response.json();

  assert.equal(queryIndex, 2);
  assert.equal(payload.designs[0].pieceTypeName, "Raised Pixel Pieces (4073)");
  assert.equal(payload.designs[0].sku, "DP-KIT-3X4");
  assert.equal(payload.designs[0].priceCents, 9144);
  assert.equal(payload.designs[0].currency, "USD");
});
