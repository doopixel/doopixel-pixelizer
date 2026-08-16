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
    request: new Request("https://pixelizer.doopixel.com/api/gallery?q=Mickey%25&sort=popular"),
    env,
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.search, "Mickey%");
  assert.match(statements[0].sql, /LOWER\(title\) LIKE LOWER\(\?\)/);
  assert.match(statements[0].sql, /LOWER\(COALESCE\(customer_caption, ''\)\)/);
  assert.match(statements[0].sql, /LOWER\(id\) LIKE LOWER\(\?\)/);
  assert.deepEqual(statements[0].bindings, ["Mickey%", "%Mickey\\%%", "%Mickey\\%%", "%Mickey\\%%", 25, 0]);
  assert.deepEqual(statements[1].bindings, ["Mickey%", "%Mickey\\%%", "%Mickey\\%%", "%Mickey\\%%"]);
});
