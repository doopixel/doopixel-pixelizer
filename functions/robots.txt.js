const ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /project/

Sitemap: https://pixelizer.doopixel.com/sitemap.xml
`;

export async function onRequestGet() {
  return new Response(ROBOTS, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
