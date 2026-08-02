(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.DooPixelInstructionData = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const VERSION = 1;
  const HEX_PATTERN = /^#[0-9a-f]{6}$/;

  function normalizeHex(value) {
    const hex = String(value || "").trim().toLowerCase();
    if (!HEX_PATTERN.test(hex)) {
      throw new Error("Invalid pixel color: " + value);
    }
    return hex;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 8192;

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
    }

    return btoa(binary);
  }

  function base64ToBytes(value) {
    const binary = atob(String(value || ""));
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  async function sha256Hex(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(function (byte) {
        return byte.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function pixelArrayToHexes(pixelArray, width, height) {
    const expectedLength = width * height * 4;
    if (!pixelArray || pixelArray.length !== expectedLength) {
      throw new Error("The final pixel data does not match the artwork size.");
    }

    const hexes = new Array(width * height);
    for (let pixelIndex = 0; pixelIndex < hexes.length; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      if (pixelArray[offset + 3] === 0) {
        throw new Error("The final pixel art contains an empty pixel.");
      }

      hexes[pixelIndex] =
        "#" +
        [pixelArray[offset], pixelArray[offset + 1], pixelArray[offset + 2]]
          .map(function (channel) {
            return Number(channel).toString(16).padStart(2, "0");
          })
          .join("");
    }

    return hexes;
  }

  async function create(options) {
    const width = Number(options.width);
    const height = Number(options.height);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
      throw new Error("Invalid instruction artwork size.");
    }

    const metadataByHex = new Map();
    (options.palette || []).forEach(function (entry) {
      const hex = normalizeHex(entry.hex);
      if (!metadataByHex.has(hex)) {
        metadataByHex.set(hex, {
          hex: hex,
          doopixelNo: String(entry.doopixelNo || ""),
          colorName: String(entry.colorName || hex),
          sku: String(entry.sku || ""),
          bricklinkColorId: String(entry.bricklinkColorId || ""),
        });
      }
    });

    const pixelHexes = pixelArrayToHexes(options.pixelArray, width, height);
    const usedHexes = new Set(pixelHexes);
    const orderedHexes = [];

    (options.paletteOrder || []).forEach(function (value) {
      const hex = normalizeHex(value);
      if (usedHexes.has(hex) && !orderedHexes.includes(hex)) {
        orderedHexes.push(hex);
      }
    });

    Array.from(usedHexes)
      .sort()
      .forEach(function (hex) {
        if (!orderedHexes.includes(hex)) orderedHexes.push(hex);
      });

    if (orderedHexes.length > 255) {
      throw new Error("The instruction palette contains too many colors.");
    }

    const palette = orderedHexes.map(function (hex) {
      const metadata = metadataByHex.get(hex);
      if (!metadata) {
        throw new Error("Missing DooPixel color data for " + hex + ".");
      }
      return metadata;
    });
    const paletteIndexes = new Map(palette.map(function (entry, index) { return [entry.hex, index]; }));
    const pixelIndexes = new Uint8Array(pixelHexes.length);

    pixelHexes.forEach(function (hex, index) {
      pixelIndexes[index] = paletteIndexes.get(hex);
    });

    return {
      version: VERSION,
      width: width,
      height: height,
      plateWidth: Number(options.plateWidth || 16),
      pieceType: String(options.pieceType || ""),
      palette: palette,
      pixelsBase64: bytesToBase64(pixelIndexes),
      checksum: await sha256Hex(pixelIndexes),
    };
  }

  async function decode(data) {
    if (!data || Number(data.version) !== VERSION) {
      throw new Error("Unsupported instruction data version.");
    }

    const width = Number(data.width);
    const height = Number(data.height);
    const palette = Array.isArray(data.palette) ? data.palette : [];
    const pixelIndexes = base64ToBytes(data.pixelsBase64);

    if (pixelIndexes.length !== width * height) {
      throw new Error("Stored instruction data has the wrong number of pixels.");
    }

    pixelIndexes.forEach(function (paletteIndex) {
      if (!palette[paletteIndex]) {
        throw new Error("Stored instruction data contains an invalid color index.");
      }
    });

    const checksum = await sha256Hex(pixelIndexes);
    if (checksum !== data.checksum) {
      throw new Error("Stored instruction data failed its integrity check.");
    }

    const pixelArray = new Uint8ClampedArray(pixelIndexes.length * 4);
    pixelIndexes.forEach(function (paletteIndex, pixelIndex) {
      const hex = normalizeHex(palette[paletteIndex].hex).slice(1);
      const offset = pixelIndex * 4;
      pixelArray[offset] = parseInt(hex.slice(0, 2), 16);
      pixelArray[offset + 1] = parseInt(hex.slice(2, 4), 16);
      pixelArray[offset + 2] = parseInt(hex.slice(4, 6), 16);
      pixelArray[offset + 3] = 255;
    });

    return {
      width: width,
      height: height,
      plateWidth: Number(data.plateWidth),
      pieceType: String(data.pieceType),
      palette: palette,
      pixelIndexes: pixelIndexes,
      pixelArray: pixelArray,
      checksum: checksum,
    };
  }

  return {
    VERSION: VERSION,
    create: create,
    decode: decode,
  };
});
