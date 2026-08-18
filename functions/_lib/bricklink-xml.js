import { findWarehousePart } from "./bricklink-parts.js";

const MAX_XML_BYTES = 256 * 1024;
const MAX_ITEM_ROWS = 5000;
const TARGET_PARTS = new Set(["98138", "4073"]);

function decodeXml(value) {
  return String(value)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function field(itemXml, name) {
  const match = itemXml.match(new RegExp(`<${name}\\s*>([\\s\\S]*?)<\\/${name}\\s*>`, "i"));
  if (!match) return "";
  if (/<[^>]+>/.test(match[1])) throw new Error(`Invalid nested XML in ${name}.`);
  return decodeXml(match[1]);
}

function positiveInteger(value, label) {
  if (!/^\d+$/.test(value)) throw new Error(`Invalid ${label} in BrickLink XML.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid ${label} in BrickLink XML.`);
  return number;
}

export function parseBrickLinkXml(xmlText) {
  const xml = String(xmlText || "");
  if (!xml.trim()) throw new Error("Please choose a BrickLink XML file.");
  if (new TextEncoder().encode(xml).length > MAX_XML_BYTES) throw new Error("XML file is larger than 256 KB.");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("DOCTYPE and ENTITY declarations are not accepted.");
  if (!/<INVENTORY(?:\s[^>]*)?>[\s\S]*<\/INVENTORY\s*>/i.test(xml)) {
    throw new Error("This does not look like a BrickLink INVENTORY XML file.");
  }

  const items = Array.from(xml.matchAll(/<ITEM(?:\s[^>]*)?>([\s\S]*?)<\/ITEM\s*>/gi));
  if (!items.length) throw new Error("No ITEM rows were found in the XML file.");
  if (items.length > MAX_ITEM_ROWS) throw new Error("XML contains too many ITEM rows.");

  const aggregates = new Map();
  const unsupported = new Map();
  let ignoredLines = 0;
  let ignoredPieces = 0;

  for (const match of items) {
    const item = match[1];
    const itemType = field(item, "ITEMTYPE").toUpperCase();
    const pieceType = field(item, "ITEMID").toUpperCase();
    const quantityText = field(item, "MINQTY") || field(item, "QTY");
    const filledText = field(item, "QTYFILLED") || "0";
    const quantity = quantityText ? Math.max(0, positiveInteger(quantityText, "quantity") - positiveInteger(filledText, "filled quantity")) : 0;

    if (itemType !== "P" || !TARGET_PARTS.has(pieceType)) {
      ignoredLines += 1;
      ignoredPieces += quantity;
      continue;
    }
    if (quantity === 0) continue;

    const colorText = field(item, "COLOR");
    const colorId = positiveInteger(colorText, "BrickLink color ID");
    const part = findWarehousePart(pieceType, colorId);
    if (!part) {
      const key = `${pieceType}:${colorId}`;
      const existing = unsupported.get(key) || { pieceType, bricklinkColorId: colorId, quantity: 0 };
      existing.quantity += quantity;
      unsupported.set(key, existing);
      continue;
    }

    const existing = aggregates.get(part.sku) || { ...part, quantity: 0 };
    existing.quantity += quantity;
    aggregates.set(part.sku, existing);
  }

  const lines = Array.from(aggregates.values()).sort((a, b) => {
    if (a.pieceType !== b.pieceType) return a.pieceType === "98138" ? -1 : 1;
    return Number(a.warehouseCode.replace(/^A/, "")) - Number(b.warehouseCode.replace(/^A/, ""));
  });
  const unsupportedLines = Array.from(unsupported.values());
  const flatPieces = lines.filter((line) => line.pieceType === "98138").reduce((sum, line) => sum + line.quantity, 0);
  const raisedPieces = lines.filter((line) => line.pieceType === "4073").reduce((sum, line) => sum + line.quantity, 0);
  const totalPieces = flatPieces + raisedPieces;
  if (!totalPieces) throw new Error("No supported 98138 or 4073 pieces matched the DooPixel warehouse catalog.");

  return {
    lines, unsupportedLines, totalPieces, flatPieces, raisedPieces,
    colorLines: lines.length, ignoredLines, ignoredPieces,
    chargeBlocks: Math.ceil(totalPieces / 100),
    priceCents: Math.ceil(totalPieces / 100) * 200,
  };
}
