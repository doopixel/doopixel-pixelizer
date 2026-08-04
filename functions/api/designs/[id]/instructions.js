function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

function safeFilename(value) {
  const normalized = String(value || "DooPixel Instructions")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 _-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${normalized || "DooPixel-Instructions"}.pdf`;
}

export async function onRequestGet({ env, params }) {
  if (!env.DB || !env.DESIGN_IMAGES) {
    return textResponse("Missing design storage configuration.", 500);
  }

  const id = String(params.id || "").trim().toUpperCase();
  const design = await env.DB.prepare(
    `SELECT title, instruction_pdf_key
     FROM designs
     WHERE id = ? AND status = 'approved' AND is_verified = 1`
  )
    .bind(id)
    .first();

  if (!design?.instruction_pdf_key) {
    return textResponse("Instructions not found.", 404);
  }

  const object = await env.DESIGN_IMAGES.get(design.instruction_pdf_key);
  if (!object) return textResponse("Instructions not found.", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", `attachment; filename="${safeFilename(design.title)}"`);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
