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
