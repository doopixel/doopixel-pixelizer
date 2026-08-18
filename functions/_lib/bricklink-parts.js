const COLORS = [
  ["001", "Black", 11, "DP-FLAT-001", "DP-STUD-A1", "#212121"],
  ["002", "Blue", 7, "DP-FLAT-002", "DP-STUD-A2", "#0057a6"],
  ["003", "Bright Green", 36, "DP-FLAT-003", "DP-STUD-A3", "#10cb31"],
  ["004", "Bright Light Blue", 105, "DP-FLAT-004", null, "#9fc3e9"],
  ["005", "Bright Light Orange", 110, "DP-FLAT-005", null, "#f7ba30"],
  ["006", "Bright Light Yellow", 103, "DP-FLAT-006", "DP-STUD-A6", "#f3e055"],
  ["007", "Bright Pink", 104, "DP-FLAT-007", "DP-STUD-A7", "#ffbbff"],
  ["008", "Brown", 8, null, "DP-STUD-A8", "#532115"],
  ["009", "Coral", 220, "DP-FLAT-009", null, "#f88379"],
  ["010", "Dark Azure", 153, "DP-FLAT-010", null, "#3399ff"],
  ["011", "Dark Blue", 63, "DP-FLAT-011", "DP-STUD-A11", "#143044"],
  ["012", "Dark Bluish Gray", 85, "DP-FLAT-012", "DP-STUD-A12", "#595d60"],
  ["013", "Dark Brown", 120, "DP-FLAT-013", "DP-STUD-A13", "#330000"],
  ["014", "Dark Gray", 10, null, "DP-STUD-A14", "#6b5a5a"],
  ["015", "Dark Orange", 68, "DP-FLAT-015", "DP-STUD-A15", "#b35408"],
  ["016", "Dark Pink", 47, "DP-FLAT-016", "DP-STUD-A16", "#c87080"],
  ["017", "Dark Purple", 89, null, "DP-STUD-A17", "#5f2683"],
  ["018", "Dark Red", 59, "DP-FLAT-018", "DP-STUD-A18", "#6a0e15"],
  ["019", "Dark Tan", 69, "DP-FLAT-019", "DP-STUD-A19", "#907450"],
  ["020", "Dark Turquoise", 39, "DP-FLAT-020", null, "#008a80"],
  ["021", "Flat Silver", 95, "DP-FLAT-021", "DP-STUD-A21", "#898788"],
  ["022", "Green", 6, null, "DP-STUD-A22", "#00642e"],
  ["023", "Lavender", 154, "DP-FLAT-023", null, "#b18cbf"],
  ["024", "Light Aqua", 152, "DP-FLAT-024", "DP-STUD-A24", "#ccffff"],
  ["025", "Light Bluish Gray", 86, "DP-FLAT-025", "DP-STUD-A25", "#afb5c7"],
  ["026", "Light Gray", 9, null, "DP-STUD-A26", "#9c9c9c"],
  ["027", "Light Nougat", 90, "DP-FLAT-027", null, "#feccb0"],
  ["028", "Lime", 34, "DP-FLAT-028", "DP-STUD-A28", "#a6ca55"],
  ["029", "Magenta", 71, "DP-FLAT-029", "DP-STUD-A29", "#b52952"],
  ["030", "Medium Azure", 156, "DP-FLAT-030", "DP-STUD-A30", "#42c0fb"],
  ["031", "Medium Blue", 42, "DP-FLAT-031", null, "#61afff"],
  ["032", "Medium Lavender", 157, null, "DP-STUD-A32", "#885e9e"],
  ["033", "Medium Lime", 76, null, "DP-STUD-A33", "#bdc618"],
  ["034", "Medium Nougat", 150, "DP-FLAT-034", "DP-STUD-A34", "#e3a05b"],
  ["035", "Neon Yellow", 236, "DP-FLAT-035", null, "#fffc00"],
  ["036", "Nougat", 28, "DP-FLAT-036", null, "#ffaf7d"],
  ["037", "Olive Green", 155, "DP-FLAT-037", "DP-STUD-A37", "#7c9051"],
  ["038", "Orange", 4, "DP-FLAT-038", "DP-STUD-A38", "#ff7e14"],
  ["039", "Pearl Dark Gray", 77, null, "DP-STUD-A39", "#666660"],
  ["040", "Pearl Gold", 115, "DP-FLAT-040", "DP-STUD-A40", "#e79500"],
  ["041", "Red", 5, "DP-FLAT-041", "DP-STUD-A41", "#b30006"],
  ["042", "Reddish Brown", 88, "DP-FLAT-042", "DP-STUD-A42", "#89351d"],
  ["043", "Sand Blue", 55, "DP-FLAT-043", "DP-STUD-A43", "#5a7184"],
  ["044", "Sand Green", 48, null, "DP-STUD-A44", "#76a290"],
  ["045", "Tan", 2, "DP-FLAT-045", "DP-STUD-A45", "#dec69c"],
  ["046", "White", 1, "DP-FLAT-046", "DP-STUD-A46", "#ffffff"],
  ["047", "Yellow", 3, "DP-FLAT-047", "DP-STUD-A47", "#f7d117"],
  ["048", "Yellowish Green", 158, "DP-FLAT-048", "DP-STUD-A48", "#dfeea5"],
];

const CATALOG = new Map();
for (const [number, colorName, bricklinkColorId, flatSku, raisedSku, hex] of COLORS) {
  if (flatSku) {
    CATALOG.set(`98138:${bricklinkColorId}`, {
      pieceType: "98138", pieceTypeName: "Flat Pixel Pieces (98138)", bricklinkColorId,
      colorName, hex, warehouseCode: String(Number(number)), sku: flatSku,
    });
  }
  if (raisedSku) {
    CATALOG.set(`4073:${bricklinkColorId}`, {
      pieceType: "4073", pieceTypeName: "Raised Pixel Pieces (4073)", bricklinkColorId,
      colorName, hex, warehouseCode: `A${Number(number)}`, sku: raisedSku,
    });
  }
}

export function findWarehousePart(pieceType, bricklinkColorId) {
  return CATALOG.get(`${pieceType}:${bricklinkColorId}`) || null;
}

export function getCatalogRows() {
  return Array.from(CATALOG.values());
}
