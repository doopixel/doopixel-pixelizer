import http from "node:http";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
const projectSource = await readFile(new URL("../functions/project/[id].js", import.meta.url), "utf8");
const projectModule = await import("data:text/javascript;base64," + Buffer.from(projectSource).toString("base64"));
const pixels = new Uint8Array(16 * 16);
const digest = await crypto.subtle.digest("SHA-256", pixels);
const checksum = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
const instructionData = {
  version: 1,
  width: 16,
  height: 16,
  plateWidth: 16,
  pieceType: "98138",
  palette: [{ hex: "#000000", doopixelNo: "001", colorName: "Black", sku: "DP-FLAT-001", bricklinkColorId: "11" }],
  pixelsBase64: Buffer.from(pixels).toString("base64"),
  checksum,
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4175");
  if (url.pathname === "/project/PRJ-TEST1234") {
    const result = await projectModule.onRequestGet({ params: { id: "PRJ-TEST1234" } });
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
    return;
  }
  if (url.pathname === "/api/projects/PRJ-TEST1234") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({
      ok: true,
      instructionsAvailable: true,
      project: {
        id: "PRJ-TEST1234", designId: "DP-TEST1234", status: "ordered", orderNumber: "#1001",
        title: "Test Pixel Art", pieceType: "98138", pieceTypeName: "1x1 Round Tile", size: [16, 16],
        parts: [{ sku: "DP-FLAT-001", quantity: 256, doopixelNo: "001", colorName: "Black", hex: "#000000", bricklinkColorId: "11" }],
        previewImageKey: "previews/test.svg", galleryStatus: "private",
      },
      instructionData,
    }));
    return;
  }
  if (url.pathname === "/api/projects/PRJ-TEST1234/submit") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, status: "pending" }));
    return;
  }
  if (url.pathname === "/api/images") {
    response.writeHead(200, { "content-type": "image/svg+xml" });
    response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#f4ce21"/><path d="M0 0h8v8H0zm8 8h8v8H8z" fill="#d4141a"/></svg>');
    return;
  }
  if (url.pathname.startsWith("/js/")) {
    try {
      const content = await readFile(root + "/app" + url.pathname);
      response.writeHead(200, { "content-type": "application/javascript" });
      response.end(content);
    } catch (_error) {
      response.writeHead(404).end();
    }
    return;
  }
  response.writeHead(404).end();
});

server.listen(4175, "127.0.0.1", () => {
  console.log("DooPixel test server: http://127.0.0.1:4175/project/PRJ-TEST1234#testtoken");
});
