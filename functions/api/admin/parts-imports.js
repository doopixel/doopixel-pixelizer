function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function authorized(request, env) {
  return env.ADMIN_TOKEN && request.headers.get("authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) throw new Error("Missing DB binding.");
    if (!authorized(request, env)) return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    const url = new URL(request.url);
    const requested = url.searchParams.get("status") || "ordered";
    const status = ["ordered", "pending_order", "all"].includes(requested) ? requested : "ordered";
    const search = String(url.searchParams.get("q") || "").trim().toLowerCase().slice(0, 100);
    const pattern = `%${search}%`;
    const whereStatus = status === "all" ? "1 = 1" : "p.status = ?";
    const binds = status === "all" ? [] : [status];
    const imports = await env.DB.prepare(
      `SELECT p.* FROM parts_imports p
       WHERE ${whereStatus}
         AND (? = '' OR LOWER(p.id) LIKE ? OR LOWER(COALESCE(p.order_number, '')) LIKE ? OR LOWER(COALESCE(p.source_filename, '')) LIKE ?)
       ORDER BY COALESCE(p.ordered_at, p.created_at) DESC LIMIT 100`
    ).bind(...binds, search, pattern, pattern, pattern).all();
    const rows = imports.results || [];
    let allLines = [];
    if (rows.length) {
      const placeholders = rows.map(() => "?").join(",");
      const lines = await env.DB.prepare(
        `SELECT piece_type, bricklink_color_id, color_name, warehouse_code, sku, quantity
              , import_id
         FROM parts_import_lines WHERE import_id IN (${placeholders})
         ORDER BY CASE piece_type WHEN '98138' THEN 0 ELSE 1 END,
                  CAST(REPLACE(warehouse_code, 'A', '') AS INTEGER)`
      ).bind(...rows.map((item) => item.id)).all();
      allLines = lines.results || [];
    }
    const linesByImport = new Map();
    allLines.forEach((line) => {
      if (!linesByImport.has(line.import_id)) linesByImport.set(line.import_id, []);
      linesByImport.get(line.import_id).push(line);
    });
    const result = rows.map((item) => {
      const lines = linesByImport.get(item.id) || [];
      return {
        id: item.id, status: item.status, filename: item.source_filename,
        totalPieces: Number(item.total_pieces), flatPieces: Number(item.flat_pieces), raisedPieces: Number(item.raised_pieces),
        colorLines: Number(item.color_lines), ignoredLines: Number(item.ignored_lines), ignoredPieces: Number(item.ignored_pieces),
        unsupportedLines: JSON.parse(item.unsupported_json || "[]"), chargeBlocks: Number(item.charge_blocks),
        priceCents: Number(item.price_cents), orderNumber: item.order_number, createdAt: item.created_at, orderedAt: item.ordered_at,
        lines: lines.map((line) => ({
          pieceType: line.piece_type, bricklinkColorId: Number(line.bricklink_color_id), colorName: line.color_name,
          warehouseCode: line.warehouse_code, sku: line.sku, quantity: Number(line.quantity),
        })),
      };
    });
    return jsonResponse({ ok: true, status, imports: result });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) }, 500);
  }
}
