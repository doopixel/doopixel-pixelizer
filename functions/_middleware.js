const PUBLIC_ORIGIN = "https://pixelizer.doopixel.com";
const PRODUCTION_PAGES_HOST = "doopixel-pixelizer.pages.dev";

function isPrivateOrMachinePath(pathname) {
  return (
    pathname === "/find-project" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api" ||
    pathname.startsWith("/api/") ||
    pathname === "/project" ||
    pathname.startsWith("/project/")
  );
}
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isPagesPreview = url.hostname.endsWith(".pages.dev");
  const isApiRequest = url.pathname === "/api" || url.pathname.startsWith("/api/");
  const canRedirect = context.request.method === "GET" || context.request.method === "HEAD";

  if (
    url.hostname === PRODUCTION_PAGES_HOST &&
    !isApiRequest &&
    canRedirect
  ) {
    return Response.redirect(`${PUBLIC_ORIGIN}${url.pathname}${url.search}`, 301);
  }

  const response = await context.next();
  if (!isPagesPreview && !isPrivateOrMachinePath(url.pathname)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
