export const PIECE_TYPES = Object.freeze({
  "98138": Object.freeze({
    customerName: "Flat Pixel Pieces (98138)",
    technicalName: "1x1 Round Tile",
    skuPrefix: "DP-FLAT-",
  }),
  "4073": Object.freeze({
    customerName: "Raised Pixel Pieces (4073)",
    technicalName: "1x1 Round Plate",
    skuPrefix: "DP-STUD-",
  }),
});

export function getPieceTypeDisplayName(pieceType) {
  return PIECE_TYPES[String(pieceType)]?.customerName ||
    (String(pieceType) === "mixed" ? "Mixed Pieces (Flat + Raised)" : "Unknown Piece Type");
}

export function getPieceTypeTechnicalName(pieceType) {
  return PIECE_TYPES[String(pieceType)]?.technicalName || "";
}

export function getCatalogSku(pieceType, doopixelNo) {
  const normalizedType = String(pieceType || "").trim();
  const normalizedNumber = String(doopixelNo || "").trim();
  if (!/^\d+$/.test(normalizedNumber)) return "";

  const colorNumber = String(Number(normalizedNumber));
  if (normalizedType === "98138") {
    return `DP-FLAT-${colorNumber.padStart(3, "0")}`;
  }
  if (normalizedType === "4073") {
    return `DP-STUD-A${colorNumber}`;
  }
  return "";
}

export function normalizeCatalogPart(part) {
  if (!part || typeof part !== "object" || part.isCustom === true) return part;
  const sku = getCatalogSku(part.pieceType, part.doopixelNo);
  return sku ? { ...part, sku } : part;
}

function compareColorNumbers(left, right) {
  const leftValue = String(left || "").trim();
  const rightValue = String(right || "").trim();
  const leftIsNumber = /^\d+$/.test(leftValue);
  const rightIsNumber = /^\d+$/.test(rightValue);

  if (leftIsNumber && rightIsNumber) {
    const difference = Number(leftValue) - Number(rightValue);
    if (difference) return difference;
  } else if (leftIsNumber !== rightIsNumber) {
    return leftIsNumber ? -1 : 1;
  }

  return leftValue.localeCompare(rightValue, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortPartsByColorNumber(parts) {
  if (!Array.isArray(parts)) return [];
  return parts.map(normalizeCatalogPart).sort((left, right) => {
    const customDifference = Number(Boolean(left?.isCustom)) - Number(Boolean(right?.isCustom));
    if (customDifference) return customDifference;

    const numberDifference = compareColorNumbers(left?.doopixelNo, right?.doopixelNo);
    if (numberDifference) return numberDifference;

    const typeOrder = { "98138": 0, "4073": 1 };
    const typeDifference =
      (typeOrder[String(left?.pieceType)] ?? 99) -
      (typeOrder[String(right?.pieceType)] ?? 99);
    if (typeDifference) return typeDifference;

    return String(left?.colorName || "").localeCompare(String(right?.colorName || ""));
  });
}
