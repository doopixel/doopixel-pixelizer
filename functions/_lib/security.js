function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function base64ToBytes(value) {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function createAccessToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashEmail(email, pepper) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !pepper) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(pepper)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(normalizedEmail));
  return bytesToHex(new Uint8Array(signature));
}

export async function verifyShopifyWebhook(rawBody, providedHmac, secret) {
  if (!providedHmac || !secret) return false;

  let signature;
  try {
    signature = base64ToBytes(providedHmac);
  } catch (_error) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(rawBody));
}

export function normalizeOrderNumber(value) {
  return String(value || "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase()
    .slice(0, 80);
}
