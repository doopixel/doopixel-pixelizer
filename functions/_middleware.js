const PUBLIC_ORIGIN = "https://pixelizer.doopixel.com";
const PRODUCTION_PAGES_HOST = "doopixel-pixelizer.pages.dev";
const STOREFRONT_ORIGINS = new Set([
  "https://doopixel.com",
  "https://www.doopixel.com",
  "https://mz77zt-nj.myshopify.com",
]);

export function isStorefrontOriginAllowed(origin) {
  if (STOREFRONT_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch (_error) {
    return false;
  }
}

export function isStorefrontApiPath(pathname) {
  return (
    pathname === "/api/gallery" ||
    pathname === "/api/images" ||
    pathname === "/api/kit-price" ||
    /^\/api\/designs\/[^/]+$/.test(pathname) ||
    /^\/api\/designs\/[^/]+\/(comments|engagement|like|projects|share-event)$/.test(pathname)
  );
}

function withStorefrontCors(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-credentials", "true");
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-max-age", "86400");
  headers.append("vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

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
  const requestOrigin = context.request.headers.get("origin") || "";
  const allowStorefrontCors =
    isStorefrontApiPath(url.pathname) && isStorefrontOriginAllowed(requestOrigin);
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

  if (context.request.method === "OPTIONS" && allowStorefrontCors) {
    return withStorefrontCors(new Response(null, { status: 204 }), requestOrigin);
  }

  let response = await context.next();
  if (allowStorefrontCors) {
    response = withStorefrontCors(response, requestOrigin);
  }
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
