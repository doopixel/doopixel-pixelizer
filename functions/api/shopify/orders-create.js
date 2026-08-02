import {
  hashEmail,
  normalizeOrderNumber,
  sha256Hex,
  verifyShopifyWebhook,
} from "../../_lib/security.js";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function logWebhook(outcome, details = {}) {
  console.log(JSON.stringify({
    event: "doopixel_shopify_order_webhook",
    outcome,
    ...details,
  }));
}

function propertiesToMap(properties) {
  const result = new Map();
  (Array.isArray(properties) ? properties : []).forEach((property) => {
    const name = String(property?.name || "").trim();
    if (name) result.set(name, String(property?.value || "").trim());
  });
  return result;
}

function findProperty(properties, names) {
  for (const name of names) {
    const value = properties.get(name);
    if (value) return value;
  }
  return "";
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.SHOPIFY_WEBHOOK_SECRET || !env.ORDER_LOOKUP_PEPPER) {
    logWebhook("missing_configuration", {
      hasDb: Boolean(env.DB),
      hasWebhookSecret: Boolean(env.SHOPIFY_WEBHOOK_SECRET),
      hasLookupPepper: Boolean(env.ORDER_LOOKUP_PEPPER),
    });
    return jsonResponse({ ok: false, error: "Missing order integration configuration." }, 500);
  }

  const rawBody = await request.text();
  const validHmac = await verifyShopifyWebhook(
    rawBody,
    request.headers.get("x-shopify-hmac-sha256"),
    env.SHOPIFY_WEBHOOK_SECRET
  );
  if (!validHmac) {
    logWebhook("invalid_hmac");
    return jsonResponse({ ok: false, error: "Invalid webhook signature." }, 401);
  }

  const expectedShop = String(env.SHOPIFY_STORE_DOMAIN || "").trim().toLowerCase();
  const sourceShop = String(request.headers.get("x-shopify-shop-domain") || "").trim().toLowerCase();
  if (expectedShop && sourceShop !== expectedShop) {
    logWebhook("unexpected_shop", { sourceShop, expectedShop });
    return jsonResponse({ ok: false, error: "Unexpected Shopify store." }, 403);
  }

  const deliveryId = String(
    request.headers.get("x-shopify-webhook-id") || request.headers.get("webhook-id") || ""
  ).trim();
  if (!deliveryId) {
    logWebhook("missing_delivery_id", { sourceShop });
    return jsonResponse({ ok: false, error: "Missing webhook delivery id." }, 400);
  }

  const existingDelivery = await env.DB.prepare("SELECT id FROM webhook_deliveries WHERE id = ?")
    .bind(deliveryId)
    .first();
  if (existingDelivery) {
    logWebhook("duplicate", { deliveryId });
    return jsonResponse({ ok: true, duplicate: true });
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch (_error) {
    logWebhook("invalid_json", { deliveryId });
    return jsonResponse({ ok: false, error: "Invalid webhook JSON." }, 400);
  }

  const orderId = String(order.admin_graphql_api_id || order.id || "").slice(0, 120);
  const orderNumber = normalizeOrderNumber(order.name || order.order_number);
  const email = String(order.email || order.contact_email || "").trim().toLowerCase();
  const emailHash = await hashEmail(email, env.ORDER_LOOKUP_PEPPER);
  if (!orderId || !orderNumber) {
    logWebhook("missing_order_identity", {
      deliveryId,
      hasOrderId: Boolean(orderId),
      hasOrderNumber: Boolean(orderNumber),
    });
    return jsonResponse({ ok: false, error: "Order is missing its id or number." }, 400);
  }

  const now = new Date().toISOString();
  const projectUpdates = [];

  for (const lineItem of Array.isArray(order.line_items) ? order.line_items : []) {
    const properties = propertiesToMap(lineItem.properties);
    const designId = findProperty(properties, [
      "_DooPixel Design ID",
      "DooPixel Design ID",
      "DooPixel Share ID",
    ]).toUpperCase();
    const accessToken = findProperty(properties, ["_DooPixel Project Token", "DooPixel Project Token"]);
    const projectId = findProperty(properties, ["_DooPixel Project ID", "DooPixel Project ID"]).toUpperCase();

    if (
      !/^DP-[A-Z0-9]{6,32}$/.test(designId) ||
      !/^PRJ-[A-Z0-9]{8,32}$/.test(projectId) ||
      !accessToken
    ) continue;

    projectUpdates.push(
      env.DB.prepare(
        `UPDATE projects
         SET status = 'ordered',
             shopify_order_id = ?,
             order_number = ?,
             order_email_hash = ?,
             ordered_at = COALESCE(ordered_at, ?),
             updated_at = ?
         WHERE id = ? AND design_id = ?
           AND EXISTS (
             SELECT 1 FROM project_access_tokens t
             WHERE t.project_id = projects.id AND t.token_hash = ?
           )`
      ).bind(orderId, orderNumber, emailHash || null, now, now, projectId, designId, await sha256Hex(accessToken))
    );
  }

  const statements = [
    ...projectUpdates,
    env.DB.prepare("INSERT INTO webhook_deliveries (id, topic, received_at) VALUES (?, ?, ?)").bind(
      deliveryId,
      "orders/create",
      now
    ),
  ];
  const results = await env.DB.batch(statements);
  const updatedProjects = results.slice(0, projectUpdates.length).reduce((total, result) => {
    return total + Number(result?.meta?.changes || 0);
  }, 0);

  logWebhook("accepted", {
    deliveryId,
    sourceShop,
    projectCandidates: projectUpdates.length,
    updatedProjects,
    lookupAvailable: Boolean(emailHash),
  });
  return jsonResponse({ ok: true, updatedProjects, lookupAvailable: Boolean(emailHash) });
}
