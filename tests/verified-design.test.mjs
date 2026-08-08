import assert from "node:assert/strict";
import test from "node:test";

import { onRequestPost } from "../functions/api/admin/verified-designs.js";
import { onRequestPost as createGalleryProject } from "../functions/api/designs/[id]/projects.js";
import { onRequestGet as getProject } from "../functions/api/projects/[id].js";

const ADMIN_TOKEN = "test-admin-token";

function makePart(overrides = {}) {
  return {
    pieceType: "98138",
    pieceTypeName: "Flat Pixel Pieces (1x1 Round Tile)",
    sku: "DP-FLAT-001",
    quantity: 120,
    doopixelNo: "001",
    colorName: "Black",
    hex: "#212121",
    bricklinkColorId: 11,
    ...overrides,
  };
}

function makeRequest(parts, imageCount = 1) {
  const form = new FormData();
  form.set("title", "Verified Test Design");
  form.set("caption", "A ready-to-build DooPixel design.");
  form.set("pieceType", "98138");
  form.set("width", "48");
  form.set("height", "64");
  form.set("parts", JSON.stringify(parts));
  if (imageCount === 1) {
    form.set("artworkImage", new File([new Uint8Array([1, 2, 3])], "build.png", { type: "image/png" }));
  } else {
    for (let index = 0; index < imageCount; index += 1) {
      form.append("artworkImages", new File([new Uint8Array([index])], "build-" + index + ".png", { type: "image/png" }));
    }
  }
  form.set("instructionsPdf", new File(["%PDF-1.7\n%%EOF"], "instructions.pdf", { type: "application/pdf" }));
  return new Request("https://pixelizer.doopixel.com/api/admin/verified-designs", {
    method: "POST",
    headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
    body: form,
  });
}

function makeEnv() {
  const writes = [];
  const deleted = [];
  const dbCalls = [];
  return {
    writes,
    deleted,
    dbCalls,
    env: {
      ADMIN_TOKEN,
      DESIGN_IMAGES: {
        async put(key, value, options) {
          writes.push({ key, value, options });
        },
        async delete(key) {
          deleted.push(key);
        },
      },
      DB: {
        prepare(sql) {
          return {
            bind(...values) {
              dbCalls.push({ sql, values });
              return { async run() {} };
            },
          };
        },
      },
    },
  };
}

test("publishes a verified design with image, PDF, and normalized parts", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([makePart()]),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.match(result.id, /^DP-[A-Z0-9]{8}$/);
  assert.equal(result.totalPieces, 120);
  assert.equal(result.colorLines, 1);
  assert.equal(harness.writes.length, 2);
  assert.match(harness.writes[0].key, /^finished\/verified\/DP-/);
  assert.match(harness.writes[1].key, /^instructions\/verified\/DP-/);
  assert.equal(harness.dbCalls.length, 1);
  assert.match(harness.dbCalls[0].sql, /is_verified/);
  assert.deepEqual(JSON.parse(harness.dbCalls[0].values[6]), [makePart({ bricklinkColorId: "11" })]);
});

test("rejects duplicate colors before writing files", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([makePart(), makePart({ quantity: 20 })]),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.equal(result.ok, false);
  assert.match(result.error, /unique/);
  assert.equal(harness.writes.length, 0);
  assert.equal(harness.dbCalls.length, 0);
});

test("publishes mixed tile and plate pieces with per-row type metadata", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([
      makePart(),
      makePart({
        pieceType: "4073",
        pieceTypeName: "Raised Pixel Pieces (1x1 Round Plate)",
        sku: "DP-STUD-001",
      }),
    ]),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(harness.dbCalls.length, 1);
  assert.equal(harness.dbCalls[0].values[2], "mixed");
  assert.equal(harness.dbCalls[0].values[3], "Mixed Pieces (Flat + Raised)");
  assert.deepEqual(JSON.parse(harness.dbCalls[0].values[6]).map((part) => part.pieceType), ["98138", "4073"]);
});

test("publishes custom colors without requiring a Shopify catalog SKU", async () => {
  const harness = makeEnv();
  const customPart = makePart({
    pieceType: "4073",
    pieceTypeName: "Raised Pixel Pieces (1x1 Round Plate)",
    sku: "not-a-shopify-sku",
    quantity: 24,
    doopixelNo: "W-105",
    colorName: "Custom Warm Gray",
    hex: "#8a8178",
    bricklinkColorId: "",
    isCustom: true,
  });
  const response = await onRequestPost({
    request: makeRequest([customPart]),
    env: harness.env,
  });
  const result = await response.json();
  const storedPart = JSON.parse(harness.dbCalls[0].values[6])[0];

  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(storedPart.isCustom, true);
  assert.equal(storedPart.sku, "CUSTOM-4073-W-105");
  assert.equal(storedPart.doopixelNo, "W-105");
  assert.equal(storedPart.colorName, "Custom Warm Gray");
});

test("rejects a custom color without complete warehouse display information", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([makePart({
      sku: "CUSTOM-98138-1",
      doopixelNo: "",
      isCustom: true,
    })]),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.match(result.error, /DooPixel color information/);
  assert.equal(harness.writes.length, 0);
});

test("publishes multiple gallery photos and keeps the first as the cover", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([makePart()], 3),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.imageCount, 3);
  assert.equal(harness.writes.length, 4);
  assert.match(harness.writes[0].key, new RegExp("^finished/verified/" + result.id + "\\.png$"));
  assert.match(harness.writes[1].key, new RegExp("^finished/verified/" + result.id + "-2\\.png$"));
  assert.match(harness.writes[2].key, new RegExp("^finished/verified/" + result.id + "-3\\.png$"));
  assert.equal(harness.dbCalls[0].values[7], harness.writes[0].key);
});

test("rejects more than six gallery photos before writing files", async () => {
  const harness = makeEnv();
  const response = await onRequestPost({
    request: makeRequest([makePart()], 7),
    env: harness.env,
  });
  const result = await response.json();

  assert.equal(response.status, 400);
  assert.match(result.error, /no more than 6 images/i);
  assert.equal(harness.writes.length, 0);
});

test("creates an order project for a verified PDF design without copying pixel data", async () => {
  const prepared = [];
  const batches = [];
  let copiedInstructionData = false;
  const env = {
    DESIGN_IMAGES: {
      async get(key) {
        assert.equal(key, "instructions/verified/DP-SOURCE1.pdf");
        return { body: "pdf" };
      },
      async put() {
        copiedInstructionData = true;
      },
    },
    DB: {
      prepare(sql) {
        if (sql.startsWith("SELECT id, status")) {
          return {
            bind() {
              return {
                async first() {
                  return {
                    id: "DP-SOURCE1",
                    status: "approved",
                    is_verified: 1,
                    instruction_pdf_key: "instructions/verified/DP-SOURCE1.pdf",
                  };
                },
              };
            },
          };
        }
        return {
          bind(...values) {
            const statement = { sql, values };
            prepared.push(statement);
            return statement;
          },
        };
      },
      async batch(statements) {
        batches.push(statements);
      },
    },
  };

  const response = await createGalleryProject({ env, params: { id: "DP-SOURCE1" } });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.ok, true);
  assert.equal(copiedInstructionData, false);
  assert.equal(batches.length, 1);
  assert.equal(prepared.length, 3);
  assert.match(prepared[0].sql, /instruction_pdf_key/);
  assert.match(result.projectId, /^PRJ-/);
  assert.ok(result.projectToken);
});

test("returns an authenticated PDF instruction route for an ordered project", async () => {
  const env = {
    DESIGN_IMAGES: {
      async get(key) {
        assert.equal(key, "instructions/verified/DP-SOURCE1.pdf");
        return { body: "pdf" };
      },
    },
    DB: {
      prepare(sql) {
        return {
          bind() {
            return {
              async first() {
                if (sql.includes("project_access_tokens")) return { id: "access" };
                return {
                  project_id: "PRJ-TEST1234",
                  design_id: "DP-CUSTOM1",
                  project_status: "ordered",
                  order_number: "1001",
                  ordered_at: "2026-08-04T00:00:00.000Z",
                  title: "Verified Test Design",
                  piece_type: "98138",
                  piece_type_name: "1x1 Round Tile",
                  width: 48,
                  height: 64,
                  parts_json: JSON.stringify([makePart()]),
                  preview_image_key: "finished/verified/DP-SOURCE1.png",
                  instruction_pdf_key: "instructions/verified/DP-SOURCE1.pdf",
                  gallery_status: "private",
                };
              },
            };
          },
        };
      },
    },
  };

  const response = await getProject({
    request: new Request("https://pixelizer.doopixel.com/api/projects/PRJ-TEST1234", {
      headers: { authorization: "Bearer project-token" },
    }),
    env,
    params: { id: "PRJ-TEST1234" },
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.instructionsAvailable, true);
  assert.equal(result.instructionType, "pdf");
  assert.equal(result.instructionsUrl, "/api/projects/PRJ-TEST1234/instructions");
});
