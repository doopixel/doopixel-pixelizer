import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import { getCatalogRows } from "../functions/_lib/bricklink-parts.js";
import { parseBrickLinkXml } from "../functions/_lib/bricklink-xml.js";

test("server catalog stays aligned with the public SKU map", async () => {
  const skuMap = JSON.parse(await fs.readFile(new URL("../app/doopixel-pixelizer-sku-map.json", import.meta.url), "utf8"));
  const expected = [];
  Object.entries(skuMap).forEach(([hex, color]) => {
    if (color.flatSku) expected.push(["98138", Number(color.bricklinkColorId), color.flatSku, String(Number(color.doopixelNo)), hex]);
    if (color.studSku) expected.push(["4073", Number(color.bricklinkColorId), color.studSku, `A${Number(color.doopixelNo)}`, hex]);
  });
  const actual = getCatalogRows().map((row) => [row.pieceType, row.bricklinkColorId, row.sku, row.warehouseCode, row.hex]);
  assert.deepEqual(actual.sort(), expected.sort());
});

test("parses Wanted List quantities, aggregates duplicates, ignores other parts, and prices combined pieces", () => {
  const result = parseBrickLinkXml(`<?xml version="1.0" encoding="UTF-8"?>
  <INVENTORY>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>59</COLOR><MINQTY>80</MINQTY><QTYFILLED>10</QTYFILLED></ITEM>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>59</COLOR><MINQTY>50</MINQTY></ITEM>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>4073</ITEMID><COLOR>59</COLOR><MINQTY>1</MINQTY></ITEM>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>3001</ITEMID><COLOR>5</COLOR><MINQTY>12</MINQTY></ITEM>
  </INVENTORY>`);
  assert.equal(result.totalPieces, 121);
  assert.equal(result.flatPieces, 120);
  assert.equal(result.raisedPieces, 1);
  assert.equal(result.chargeBlocks, 2);
  assert.equal(result.priceCents, 400);
  assert.equal(result.estimatedWeightGrams, 12);
  assert.equal(result.ignoredLines, 1);
  assert.equal(result.ignoredPieces, 12);
  assert.deepEqual(result.lines.map((line) => [line.warehouseCode, line.sku, line.quantity]), [
    ["18", "DP-FLAT-018", 120],
    ["A18", "DP-STUD-A18", 1],
  ]);
});

test("reports stocked-part colors that DooPixel does not carry", () => {
  const result = parseBrickLinkXml(`<INVENTORY>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>98138</ITEMID><COLOR>59</COLOR><QTY>100</QTY></ITEM>
    <ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>4073</ITEMID><COLOR>220</COLOR><QTY>5</QTY></ITEM>
  </INVENTORY>`);
  assert.equal(result.totalPieces, 100);
  assert.deepEqual(result.unsupportedLines, [{ pieceType: "4073", bricklinkColorId: 220, quantity: 5 }]);
});

test("rejects dangerous or unrelated XML", () => {
  assert.throws(() => parseBrickLinkXml('<!DOCTYPE x [<!ENTITY y "z">]><INVENTORY><ITEM></ITEM></INVENTORY>'), /DOCTYPE/);
  assert.throws(() => parseBrickLinkXml("<root></root>"), /INVENTORY/);
});

test("customer import page and Shopify cart details contain valid inline JavaScript", async () => {
  const files = [
    await fs.readFile(new URL("../app/parts-import/index.html", import.meta.url), "utf8"),
    await fs.readFile(new URL("../shopify/cart-matching-parts-details-custom-liquid.liquid", import.meta.url), "utf8"),
  ];
  files.forEach((source) => {
    Array.from(source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)).forEach((match) => new Function(match[1]));
  });
});

test("customer flow goes directly to Shopify cart and shows only useful match columns", async () => {
  const page = await fs.readFile(new URL("../app/parts-import/index.html", import.meta.url), "utf8");
  assert.match(page, /https:\/\/doopixel\.com\/cart\/add/);
  assert.doesNotMatch(page, /products\/custom-pixel-pieces/);
  assert.match(page, /Doo Number<\/th><th>Color<\/th><th>Qty<\/th><th>Part Type/);
  assert.doesNotMatch(page, /<th>SKU<\/th>/);
  assert.doesNotMatch(page, /unsupported part row/);
  assert.match(page, /XML files up to 3 MB/);
});

test("customer and cart tables show synchronized mobile scroll progress above and below", async () => {
  const page = await fs.readFile(new URL("../app/parts-import/index.html", import.meta.url), "utf8");
  const cart = await fs.readFile(new URL("../shopify/cart-matching-parts-details-custom-liquid.liquid", import.meta.url), "utf8");
  assert.match(page, /table-scroll-progress table-scroll-progress--top[\s\S]*table-wrap[\s\S]*table-scroll-progress/);
  assert.match(cart, /dp-parts-dialog__scroll-progress dp-parts-dialog__scroll-progress--top[\s\S]*dp-parts-dialog__table-wrap[\s\S]*dp-parts-dialog__scroll-progress/);
  assert.match(page, /Turn A BrickLink List Into A Ready-To-Pick DooPixel Order/);
  assert.match(cart, /Matching Parts Details/);
});

test("Shopify pick properties are readable and do not expose color codes", async () => {
  const page = await fs.readFile(new URL("../app/parts-import/index.html", import.meta.url), "utf8");
  const cart = await fs.readFile(new URL("../shopify/cart-matching-parts-details-custom-liquid.liquid", import.meta.url), "utf8");
  assert.match(page, /_Pick · .*warehouseCode.*colorName.*typeLabel/);
  assert.match(page, /properties\[_Import ID\]/);
  assert.match(page, /properties\[_Import Token\]/);
  assert.doesNotMatch(page, /properties\[_DooPixel Total Pieces\]/);
  assert.doesNotMatch(page, /_DP\|/);
  assert.doesNotMatch(page, /const key = .*line\.hex/);
  assert.match(cart, /split: ' · '/);
  assert.doesNotMatch(cart, /dp_property_parts\[4\]/);

  const skuMap = JSON.parse(await fs.readFile(new URL("../app/doopixel-pixelizer-sku-map.json", import.meta.url), "utf8"));
  Object.entries(skuMap).forEach(([hex, color]) => {
    assert.match(cart, new RegExp(`dp-parts-dialog__swatch--${Number(color.doopixelNo)} \\{ background: ${hex}; \\}`));
  });
});
