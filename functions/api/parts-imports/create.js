import { parseBrickLinkXml } from "../../_lib/bricklink-xml.js";
import { createAccessToken, sha256Hex } from "../../_lib/security.js";

const SHOPIFY_VARIANT_ID = "57037331595430";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) throw new Error("Missing DB binding.");
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) return jsonResponse({ ok: false, error: "Upload must be an XML file." }, 415);
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.text !== "function") throw new Error("Please choose a BrickLink XML file.");
    const filename = String(file.name || "bricklink.xml").slice(0, 160);
    if (!filename.toLowerCase().endsWith(".xml")) throw new Error("Only .xml files are accepted.");

    const summary = parseBrickLinkXml(await file.text());
    const id = `IMP-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const token = createAccessToken();
    const tokenHash = await sha256Hex(token);
    const now = new Date().toISOString();
    const statements = [
      env.DB.prepare(`INSERT INTO parts_imports (
        id, status, source_filename, total_pieces, flat_pieces, raised_pieces, color_lines,
        ignored_lines, ignored_pieces, unsupported_json, charge_blocks, price_cents, created_at, updated_at
      ) VALUES (?, 'pending_order', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        id, filename, summary.totalPieces, summary.flatPieces, summary.raisedPieces, summary.colorLines,
        summary.ignoredLines, summary.ignoredPieces, JSON.stringify(summary.unsupportedLines),
        summary.chargeBlocks, summary.priceCents, now, now
      ),
      env.DB.prepare("INSERT INTO parts_import_access_tokens (id, import_id, token_hash, created_at) VALUES (?, ?, ?, ?)")
        .bind(crypto.randomUUID(), id, tokenHash, now),
      ...summary.lines.map((line) => env.DB.prepare(`INSERT INTO parts_import_lines (
        id, import_id, piece_type, bricklink_color_id, color_name, warehouse_code, sku, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
        crypto.randomUUID(), id, line.pieceType, line.bricklinkColorId, line.colorName, line.warehouseCode, line.sku, line.quantity
      )),
    ];
    await env.DB.batch(statements);

    return jsonResponse({
      ok: true, importId: id, importToken: token, variantId: SHOPIFY_VARIANT_ID,
      ...summary,
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 400);
  }
}
