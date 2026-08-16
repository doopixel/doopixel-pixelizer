const PUBLIC_ORIGIN = "https://pixelizer.doopixel.com";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function normalizeLastModified(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function sitemapEntry(path, options = {}) {
  const lastModified = normalizeLastModified(options.lastModified);
  return `  <url>
    <loc>${escapeXml(`${PUBLIC_ORIGIN}${path}`)}</loc>${
      lastModified ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>` : ""
    }
    <changefreq>${options.changefreq || "weekly"}</changefreq>
    <priority>${options.priority || "0.7"}</priority>
  </url>`;
}

export async function onRequestGet({ env }) {
  const entries = [
    sitemapEntry("/", { changefreq: "monthly", priority: "1.0" }),
    sitemapEntry("/gallery", { changefreq: "daily", priority: "0.9" }),
  ];

  if (env.DB) {
    try {
      const result = await env.DB.prepare(
        `SELECT id, COALESCE(approved_at, updated_at) AS last_modified
        FROM designs
        WHERE status = 'approved'
          AND finished_image_key IS NOT NULL
        ORDER BY COALESCE(approved_at, updated_at) DESC`
      ).all();

      (result.results || []).forEach((design) => {
        if (!/^DP-[A-Z0-9]{6,32}$/.test(String(design.id || ""))) return;
        entries.push(
          sitemapEntry(`/share/${encodeURIComponent(design.id)}`, {
            lastModified: design.last_modified,
            changefreq: "weekly",
            priority: "0.8",
          })
        );
      });
    } catch (error) {
      console.error("Could not load gallery designs for sitemap", error);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
