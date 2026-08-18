import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost } from "../functions/api/shopify/orders-create.js";

function makeDb(expectedPacks) {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() { return null; },
      };
      return statement;
    },
    async batch(batch) {
      statements.push(...batch);
      return batch.map((statement) => ({
        meta: {
          changes: /UPDATE parts_imports/.test(statement.sql) && statement.values[6] === expectedPacks ? 1 : 0,
        },
      }));
    },
  };
}

async function signedRequest(quantity) {
  const secret = "test-shopify-secret";
  const body = JSON.stringify({
    id: 12345,
    name: "#1007",
    email: "buyer@example.com",
    line_items: [{
      quantity,
      properties: [
        { name: "_Import ID", value: "IMP-ABCDEF123456" },
        { name: "_Import Token", value: "private-token" },
      ],
    }],
  });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hmac = Buffer.from(signature).toString("base64");
  return {
    request: new Request("https://pixelizer.doopixel.com/api/shopify/orders-create", {
      method: "POST", body,
      headers: {
        "x-shopify-hmac-sha256": hmac,
        "x-shopify-webhook-id": `delivery-${quantity}`,
        "x-shopify-shop-domain": "doopixel.myshopify.com",
      },
    }),
    secret,
  };
}

test("order webhook marks a parts import ordered only when the paid pack count matches", async () => {
  const exact = await signedRequest(2);
  const exactDb = makeDb(2);
  const exactResponse = await onRequestPost({
    request: exact.request,
    env: { DB: exactDb, SHOPIFY_WEBHOOK_SECRET: exact.secret, ORDER_LOOKUP_PEPPER: "pepper", SHOPIFY_STORE_DOMAIN: "doopixel.myshopify.com" },
  });
  assert.equal(exactResponse.status, 200);
  assert.equal((await exactResponse.json()).updatedPartsImports, 1);
  const update = exactDb.statements.find((statement) => /UPDATE parts_imports/.test(statement.sql));
  assert.ok(update);
  assert.match(update.sql, /charge_blocks = \?/);

  const short = await signedRequest(1);
  const shortDb = makeDb(2);
  const shortResponse = await onRequestPost({
    request: short.request,
    env: { DB: shortDb, SHOPIFY_WEBHOOK_SECRET: short.secret, ORDER_LOOKUP_PEPPER: "pepper", SHOPIFY_STORE_DOMAIN: "doopixel.myshopify.com" },
  });
  assert.equal((await shortResponse.json()).updatedPartsImports, 0);
});
