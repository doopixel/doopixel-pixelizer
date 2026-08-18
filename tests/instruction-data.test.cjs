const assert = require("node:assert/strict");
const test = require("node:test");

const codec = require("../app/js/doopixel-instruction-data.js");

test("formats warehouse codes by physical piece type", () => {
  assert.equal(codec.formatWarehouseCode("98138", "001"), "1");
  assert.equal(codec.formatWarehouseCode("98138", "018"), "18");
  assert.equal(codec.formatWarehouseCode("4073", "001"), "A1");
  assert.equal(codec.formatWarehouseCode("4073", "018"), "A18");
});

function makePixelArray(width, height, colors) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const hex = colors[index % colors.length].slice(1);
    const offset = index * 4;
    pixels[offset] = parseInt(hex.slice(0, 2), 16);
    pixels[offset + 1] = parseInt(hex.slice(2, 4), 16);
    pixels[offset + 2] = parseInt(hex.slice(4, 6), 16);
    pixels[offset + 3] = 255;
  }
  return pixels;
}

for (const [width, height] of [[16, 16], [48, 64], [128, 128]]) {
  test(`round-trips an exact ${width} x ${height} pixel matrix`, async () => {
    const colors = ["#000000", "#ffffff", "#d4141a", "#289b3a"];
    const pixelArray = makePixelArray(width, height, colors);
    const palette = colors.map((hex, index) => ({
      hex,
      doopixelNo: String(index + 1),
      colorName: `Color ${index + 1}`,
      sku: `DP-${index + 1}`,
      bricklinkColorId: String(index + 1),
    }));

    const encoded = await codec.create({
      width,
      height,
      plateWidth: 16,
      pieceType: "98138",
      pixelArray,
      palette,
      paletteOrder: colors,
    });
    const decoded = await codec.decode(encoded);

    assert.deepEqual(decoded.pixelArray, pixelArray);
    assert.equal(decoded.width, width);
    assert.equal(decoded.height, height);
    assert.equal(decoded.pieceType, "98138");
  });
}

test("rejects a modified stored matrix", async () => {
  const colors = ["#000000", "#ffffff"];
  const encoded = await codec.create({
    width: 16,
    height: 16,
    plateWidth: 16,
    pieceType: "4073",
    pixelArray: makePixelArray(16, 16, colors),
    palette: colors.map((hex, index) => ({ hex, colorName: `Color ${index + 1}` })),
    paletteOrder: colors,
  });
  const bytes = Buffer.from(encoded.pixelsBase64, "base64");
  bytes[0] = bytes[0] === 0 ? 1 : 0;
  encoded.pixelsBase64 = bytes.toString("base64");

  await assert.rejects(codec.decode(encoded), /integrity check/);
});
