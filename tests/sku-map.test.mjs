import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const skuMap = JSON.parse(
  await fs.readFile(new URL("../app/doopixel-pixelizer-sku-map.json", import.meta.url), "utf8")
);

test("uses stable flat SKUs and A-prefixed raised-piece SKUs", () => {
  const entries = Object.values(skuMap);
  const skus = [];

  entries.forEach((entry) => {
    const colorNumber = String(Number(entry.doopixelNo));
    if (entry.flatSku) {
      assert.equal(entry.flatSku, `DP-FLAT-${entry.doopixelNo}`);
      skus.push(entry.flatSku);
    }
    if (entry.studSku) {
      assert.equal(entry.studSku, `DP-STUD-A${colorNumber}`);
      skus.push(entry.studSku);
    }
  });

  assert.equal(new Set(skus).size, skus.length);
});

test("maps Dark Red to warehouse labels 18 and A18", () => {
  const darkRed = Object.values(skuMap).find((entry) => entry.colorName === "Dark Red");
  assert.ok(darkRed);
  assert.equal(darkRed.doopixelNo, "018");
  assert.equal(darkRed.flatSku, "DP-FLAT-018");
  assert.equal(darkRed.studSku, "DP-STUD-A18");
});

test("wires warehouse codes into PDF legends and pixel cells", async () => {
  const [projectInstructions, algorithm] = await Promise.all([
    fs.readFile(new URL("../app/js/doopixel-project-instructions.js", import.meta.url), "utf8"),
    fs.readFile(new URL("../app/js/algo.js", import.meta.url), "utf8"),
  ]);

  assert.match(projectInstructions, /formatWarehouseCode\(\s*decoded\.pieceType/);
  assert.match(algorithm, /getInstructionCode\(pixelHex, rowNumber\)/);
  assert.match(algorithm, /studToInstructionCode\[pixelHex\]/);
});
