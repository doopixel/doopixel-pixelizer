export const PIECE_TYPES = Object.freeze({
  "98138": Object.freeze({
    customerName: "Flat Pixel Pieces (1x1 Round Tile)",
    technicalName: "1x1 Round Tile",
    skuPrefix: "DP-FLAT-",
  }),
  "4073": Object.freeze({
    customerName: "Raised Pixel Pieces (1x1 Round Plate)",
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
  return [...parts].sort((left, right) => {
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
