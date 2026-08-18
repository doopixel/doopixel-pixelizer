import assert from "node:assert/strict";
import test from "node:test";

import {
  getCatalogSku,
  sortPartsByColorNumber,
} from "../functions/_lib/piece-types.js";
import { onRequestPost as deleteDesign } from "../functions/api/admin/designs/[id]/delete.js";
import { onRequestPost as updateFiles } from "../functions/api/admin/designs/[id]/files.js";

const ADMIN_TOKEN = "test-admin-token";
const DESIGN_ID = "DP-TEST1234";

function authorizedRequest(url, options = {}) {
  return new Request(url, {
    ...options,
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(options.headers || {}),
    },
  });
}

test("sorts catalog colors by number and places custom colors last", () => {
  const parts = [
    { doopixelNo: "20", pieceType: "98138", colorName: "Twenty" },
    { doopixelNo: "2", pieceType: "98138", colorName: "Two" },
    { doopixelNo: "C-1", pieceType: "4073", colorName: "Custom", isCustom: true },
    { doopixelNo: "003", pieceType: "4073", colorName: "Three" },
    { doopixelNo: "100", pieceType: "98138", colorName: "One Hundred" },
  ];

  assert.deepEqual(
    sortPartsByColorNumber(parts).map((part) => part.colorName),
    ["Two", "Three", "Twenty", "One Hundred", "Custom"]
  );
  assert.equal(parts[0].colorName, "Twenty");
});

test("normalizes old saved catalog SKUs when projects are read", () => {
  assert.equal(getCatalogSku("98138", "018"), "DP-FLAT-018");
  assert.equal(getCatalogSku("4073", "018"), "DP-STUD-A18");

  const parts = sortPartsByColorNumber([
    { doopixelNo: "018", pieceType: "4073", sku: "DP-STUD-018" },
    { doopixelNo: "018", pieceType: "98138", sku: "DP-FLAT-018" },
  ]);

  assert.deepEqual(parts.map((part) => part.sku), ["DP-FLAT-018", "DP-STUD-A18"]);
});

test("replaces verified photos and PDF before deleting obsolete files", async () => {
  const writes = [];
  const deleted = [];
  const dbCalls = [];
  const form = new FormData();
  form.append("artworkImages", new File([new Uint8Array([1, 2, 3])], "new-cover.png", { type: "image/png" }));
  form.append("artworkImages", new File([new Uint8Array([4, 5, 6])], "new-detail.jpg", { type: "image/jpeg" }));
  form.set("instructionsPdf", new File(["%PDF-1.7\n%%EOF"], "updated.pdf", { type: "application/pdf" }));

  const env = {
    ADMIN_TOKEN,
    DESIGN_IMAGES: {
      async put(key) {
        writes.push(key);
      },
      async delete(key) {
        deleted.push(key);
      },
      async list() {
        return {
          objects: [
            { key: `finished/verified/${DESIGN_ID}.png` },
            { key: `finished/verified/${DESIGN_ID}-2.jpg` },
          ],
        };
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            dbCalls.push({ sql, values });
            return {
              async first() {
                if (sql.includes("COUNT(*)")) return { total: 0 };
                return {
                  id: DESIGN_ID,
                  is_verified: 1,
                  finished_image_key: `finished/verified/${DESIGN_ID}.png`,
                  instruction_pdf_key: `instructions/verified/${DESIGN_ID}.pdf`,
                };
              },
              async run() {},
            };
          },
        };
      },
    },
  };

  const response = await updateFiles({
    request: authorizedRequest(`https://pixelizer.doopixel.com/api/admin/designs/${DESIGN_ID}/files`, {
      method: "POST",
      body: form,
    }),
    env,
    params: { id: DESIGN_ID },
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.imageCount, 2);
  assert.equal(result.instructionsUpdated, true);
  assert.equal(writes.length, 3);
  assert.match(writes[0], new RegExp(`^finished/verified/${DESIGN_ID}-\\d+-1\\.png$`));
  assert.match(writes[1], new RegExp(`^finished/verified/${DESIGN_ID}-\\d+-2\\.jpg$`));
  assert.match(writes[2], new RegExp(`^instructions/verified/${DESIGN_ID}-\\d+\\.pdf$`));
  assert.ok(dbCalls.some((call) => /UPDATE designs/.test(call.sql)));
  assert.deepEqual(deleted.sort(), [
    `finished/verified/${DESIGN_ID}-2.jpg`,
    `finished/verified/${DESIGN_ID}.png`,
    `instructions/verified/${DESIGN_ID}.pdf`,
  ].sort());
});

test("keeps an older PDF when an existing private project still references it", async () => {
  const writes = [];
  const deleted = [];
  const form = new FormData();
  form.set("instructionsPdf", new File(["%PDF-1.7\n%%EOF"], "updated.pdf", { type: "application/pdf" }));
  const oldPdfKey = `instructions/verified/${DESIGN_ID}.pdf`;
  const env = {
    ADMIN_TOKEN,
    DESIGN_IMAGES: {
      async put(key) {
        writes.push(key);
      },
      async delete(key) {
        deleted.push(key);
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind() {
            return {
              async first() {
                if (sql.includes("COUNT(*)")) return { total: 1 };
                return {
                  id: DESIGN_ID,
                  is_verified: 1,
                  finished_image_key: `finished/verified/${DESIGN_ID}.png`,
                  instruction_pdf_key: oldPdfKey,
                };
              },
              async run() {},
            };
          },
        };
      },
    },
  };

  const response = await updateFiles({
    request: authorizedRequest(`https://pixelizer.doopixel.com/api/admin/designs/${DESIGN_ID}/files`, {
      method: "POST",
      body: form,
    }),
    env,
    params: { id: DESIGN_ID },
  });

  assert.equal(response.status, 200);
  assert.equal(writes.length, 1);
  assert.match(writes[0], new RegExp(`^instructions/verified/${DESIGN_ID}-\\d+\\.pdf$`));
  assert.deepEqual(deleted, []);
});

test("blocks permanent deletion when a verified design has linked projects", async () => {
  const deleted = [];
  const env = {
    ADMIN_TOKEN,
    DESIGN_IMAGES: {
      async delete(key) {
        deleted.push(key);
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind() {
            return {
              async first() {
                if (sql.includes("COUNT(*)")) return { total: 1 };
                return {
                  id: DESIGN_ID,
                  is_verified: 1,
                  finished_image_key: `finished/verified/${DESIGN_ID}.png`,
                  instruction_pdf_key: `instructions/verified/${DESIGN_ID}.pdf`,
                };
              },
              async run() {
                throw new Error("Deletion should not run.");
              },
            };
          },
        };
      },
    },
  };

  const response = await deleteDesign({
    request: authorizedRequest(`https://pixelizer.doopixel.com/api/admin/designs/${DESIGN_ID}/delete`, { method: "POST" }),
    env,
    params: { id: DESIGN_ID },
  });
  const result = await response.json();

  assert.equal(response.status, 409);
  assert.match(result.error, /linked to a customer project or order/i);
  assert.deepEqual(deleted, []);
});

test("deletes an unlinked verified design and its stored files", async () => {
  const deletedFiles = [];
  const executedSql = [];
  const env = {
    ADMIN_TOKEN,
    DESIGN_IMAGES: {
      async list() {
        return { objects: [{ key: `finished/verified/${DESIGN_ID}.png` }] };
      },
      async delete(key) {
        deletedFiles.push(key);
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind() {
            return {
              async first() {
                if (sql.includes("COUNT(*)")) return { total: 0 };
                return {
                  id: DESIGN_ID,
                  is_verified: 1,
                  finished_image_key: `finished/verified/${DESIGN_ID}.png`,
                  instruction_pdf_key: `instructions/verified/${DESIGN_ID}.pdf`,
                };
              },
              async run() {
                executedSql.push(sql);
              },
            };
          },
        };
      },
    },
  };

  const response = await deleteDesign({
    request: authorizedRequest(`https://pixelizer.doopixel.com/api/admin/designs/${DESIGN_ID}/delete`, { method: "POST" }),
    env,
    params: { id: DESIGN_ID },
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.deleted, true);
  assert.equal(executedSql.length, 3);
  assert.ok(executedSql.some((sql) => /DELETE FROM designs/.test(sql)));
  assert.deepEqual(deletedFiles.sort(), [
    `finished/verified/${DESIGN_ID}.png`,
    `instructions/verified/${DESIGN_ID}.pdf`,
  ].sort());
});
