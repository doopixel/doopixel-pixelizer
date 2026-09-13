import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost } from "../functions/api/designs/[id]/comments.js";

function createDb() {
  const inserts = [];
  return {
    inserts,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (sql.includes("FROM designs")) {
                return { id: "DP-TEST", status: "approved", comments_enabled: 1 };
              }
              if (sql.includes("FROM design_comments")) {
                return { total: 0 };
              }
              throw new Error(`Unexpected first query: ${sql}`);
            },
            async run() {
              inserts.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

function requestWith(body) {
  return new Request("https://pixelizer.doopixel.com/api/designs/DP-TEST/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("accepts a comment without a Turnstile token", async () => {
  const DB = createDb();
  const response = await onRequestPost({
    request: requestWith({ displayName: "Doo User", body: "Great design!", website: "" }),
    env: { DB },
    params: { id: "DP-TEST" },
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "pending");
  assert.equal(DB.inserts.length, 1);
});

test("silently discards submissions that fill the honeypot", async () => {
  const DB = createDb();
  const response = await onRequestPost({
    request: requestWith({ displayName: "Bot", body: "Spam", website: "https://spam.example" }),
    env: { DB },
    params: { id: "DP-TEST" },
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "pending");
  assert.equal(DB.inserts.length, 0);
});
