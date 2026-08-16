function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function onRequestGet({ params, env, request }) {
  const rawId = String(params.id || "").trim().toUpperCase();
  const id = escapeHtml(rawId);
  const url = new URL(request.url);
  const canonicalUrl = `${url.origin}/share/${encodeURIComponent(rawId)}`;
  let socialTitle = `DooPixel Shared Design ${rawId}`;
  let socialDescription = "Explore this community pixel art build and its required pieces.";
  let socialImageUrl = "";

  if (env.DB && /^DP-[A-Z0-9]{6,32}$/.test(rawId)) {
    const socialDesign = await env.DB.prepare(
      `SELECT
        title,
        customer_caption,
        preview_image_key,
        finished_image_key,
        is_verified,
        status
      FROM designs
      WHERE id = ?`
    )
      .bind(rawId)
      .first();

    if (socialDesign?.status === "approved") {
      socialTitle = socialDesign.is_verified
        ? `${socialDesign.title} | DooPixel Verified`
        : `${socialDesign.title} | DooPixel Community`;
      socialDescription =
        String(socialDesign.customer_caption || "").trim() ||
        "A finished pixel art build shared by the DooPixel community.";
      const imageKey = socialDesign.finished_image_key || socialDesign.preview_image_key;
      if (imageKey) {
        socialImageUrl = `${url.origin}/api/images?key=${encodeURIComponent(imageKey)}`;
      }
    }
  }

  const turnstileSiteKey = String(env.TURNSTILE_SITE_KEY || "").trim();
  const turnstileConfigured = Boolean(turnstileSiteKey && env.TURNSTILE_SECRET_KEY);
  const turnstileHead = turnstileSiteKey
    ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>'
    : "";
  const turnstileWidget = turnstileSiteKey
    ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(turnstileSiteKey)}"></div>`
    : '<div class="notice">Comments are temporarily unavailable.</div>';
  const socialImageMeta = socialImageUrl
    ? `<meta property="og:image" content="${escapeHtml(socialImageUrl)}" />
    <meta property="og:image:alt" content="${escapeHtml(socialTitle)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />`
    : '<meta name="twitter:card" content="summary" />';

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(socialTitle)}</title>
    <meta name="description" content="${escapeHtml(socialDescription)}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(socialTitle)}" />
    <meta property="og:description" content="${escapeHtml(socialDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="DooPixel" />
    <meta name="twitter:title" content="${escapeHtml(socialTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(socialDescription)}" />
    ${socialImageMeta}
    ${turnstileHead}
    <style>
      :root {
        color-scheme: light;
        --text: #202124;
        --muted: #666a73;
        --line: #dfe1e7;
        --soft: #f5f6f8;
        --paper: #fff;
        --blue: #4961bd;
        --green: #28a139;
        --green-dark: #228b31;
        --yellow: #f4ce21;
        --red: #d4141a;
        --accent: #28a139;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--text);
        background: #f8f9fa;
        letter-spacing: 0;
      }

      .dp-site-nav-wrap {
        position: sticky;
        top: 0;
        z-index: 1000;
        border: 0;
        background: #4961bd;
      }

      .dp-site-nav {
        position: relative;
        display: flex;
        align-items: center;
        gap: 22px;
        width: min(100% - 36px, 1220px);
        min-height: 64px;
        margin: 0 auto;
      }

      .dp-site-logo {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
      }

      .dp-site-logo img {
        display: block;
        width: auto;
        height: 34px;
      }

      .dp-site-links {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
      }

      .dp-site-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        border: 1px solid transparent;
        padding: 8px 12px;
        color: #fff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
      }

      .dp-site-link:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #fff;
      }

      .dp-site-link.is-active {
        border-color: #fff;
        background: #fff;
        color: #35499d;
      }

      .dp-site-cart {
        border-color: rgba(255, 255, 255, 0.75);
        color: #fff;
      }

      .dp-site-menu-button,
      .dp-site-mobile-cart {
        display: none;
      }

      .wrap {
        width: min(100% - 36px, 1180px);
        margin: 0 auto;
        padding: 26px 0 64px;
      }
      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 18px;
        color: var(--muted);
        font-size: 13px;
      }
      .breadcrumb a {
        color: var(--green-dark);
        font-weight: 700;
        text-decoration: none;
      }
      .breadcrumb a:hover { text-decoration: underline; }
      .design-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-bottom: 20px;
      }
      .design-title-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }
      h1 { font-size: 32px; line-height: 1.2; margin: 0; }
      h2 { font-size: 21px; line-height: 1.25; margin: 0 0 16px; }
      p { line-height: 1.5; }
      .muted { color: var(--muted); margin: 0; }
      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 0;
        border-radius: 8px;
        background: var(--yellow);
        padding: 5px 8px;
        color: var(--text);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .product-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
        gap: 24px;
        align-items: start;
      }
      .media-column, .product-column { min-width: 0; }
      .product-column { display: grid; gap: 16px; }
      .preview {
        display: block;
        width: 100%;
        max-height: 720px;
        object-fit: contain;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #f3f3f0;
      }
      .preview.pixelated { image-rendering: pixelated; }
      .preview-gallery { display: grid; gap: 10px; }
      .preview-thumbnails {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 8px;
      }
      .preview-thumb {
        width: 100%;
        min-height: 0;
        aspect-ratio: 1;
        padding: 2px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #fff;
        overflow: hidden;
      }
      .preview-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .preview-thumb.is-active { border: 2px solid var(--blue); padding: 1px; }
      .panel,
      .description-panel,
      .pieces-section,
      .comments-section {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
        padding: 22px;
      }
      .panel-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .panel-heading h2 { margin: 0; }
      .meta {
        display: grid;
        grid-template-columns: minmax(110px, auto) minmax(0, 1fr);
        gap: 0;
        margin: 0 0 20px;
        font-size: 14px;
      }
      .meta dt,
      .meta dd {
        margin: 0;
        border-bottom: 1px solid var(--line);
        padding: 10px 0;
      }
      .meta dt { color: var(--muted); padding-right: 14px; }
      .meta dd { font-weight: 700; overflow-wrap: anywhere; }
      .meta dt:first-of-type,
      .meta dd:first-of-type { padding-top: 0; }
      .meta dt:last-of-type,
      .meta dd:last-of-type { border-bottom: 0; padding-bottom: 0; }
      .meta-price { color: var(--green-dark); font-size: 20px; }
      .meta-detail {
        display: block;
        margin-top: 3px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 400;
        line-height: 1.4;
      }
      .description-panel h2 { margin-bottom: 10px; }
      .design-description {
        margin: 0;
        color: #4f535b;
        font-size: 14px;
        line-height: 1.65;
        overflow-wrap: anywhere;
        white-space: pre-line;
      }
      .pieces-section { margin-top: 24px; }
      .pieces-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
      }
      .pieces-heading p { margin: 0 0 16px; color: var(--muted); font-size: 13px; }
      .comments-section { margin-top: 24px; }
      button, .button {
        appearance: none;
        border: 1px solid var(--accent);
        background: var(--accent);
        color: #fff;
        padding: 12px 16px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border-radius: 6px;
      }
      button:hover, .button:hover { border-color: var(--green-dark); background: var(--green-dark); }
      button.secondary, .button.secondary {
        border-color: var(--line);
        background: #fff;
        color: var(--text);
      }
      button.secondary:hover, .button.secondary:hover { background: var(--soft); }
      .button.full { width: 100%; margin-bottom: 10px; }
      #add-to-cart { width: 100%; }
      .instructions-note {
        margin: 0 0 12px;
        border: 1px solid #cfe8d4;
        border-radius: 6px;
        background: #eef8f0;
        padding: 10px 12px;
        color: #3f5f46;
        font-size: 13px;
      }
      button.active { border-color: var(--green); background: #eef8f0; color: var(--green-dark); }
      button:disabled { opacity: .55; cursor: wait; }
      .social-actions { display: flex; gap: 10px; margin: 12px 0 0; }
      .social-actions button { flex: 1; }
      .share-options {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--line);
        background: var(--soft);
      }
      .share-options button { min-height: 40px; padding: 8px; font-size: 13px; background: #fff; color: #111; }
      table { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 14px; }
      th, td {
        border-bottom: 1px solid var(--line);
        padding: 9px 6px;
        text-align: left;
        vertical-align: middle;
      }
      th:last-child, td:last-child { text-align: right; }
      .swatch {
        width: 18px;
        height: 18px;
        border: 1px solid #999;
        border-radius: 50%;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
      }
      form { display: grid; gap: 10px; margin-top: 22px; }
      input, textarea, select {
        width: 100%;
        border: 1px solid var(--line);
        padding: 10px;
        font: inherit;
        border-radius: 6px;
        background: #fff;
      }
      textarea { min-height: 90px; resize: vertical; }
      .comments-list { display: grid; gap: 10px; }
      .comment { border-top: 1px solid var(--line); padding-top: 14px; }
      .comment:first-child { border-top: 0; }
      .comment-head { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }
      .comment-name { font-weight: 700; }
      .comment-date { color: var(--muted); font-size: 12px; }
      .comment-body { margin: 7px 0 0; white-space: pre-wrap; }
      .notice {
        margin-top: 14px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--soft);
        padding: 12px;
      }
      .hidden { display: none; }
      @media (max-width: 860px) {
        .wrap { width: min(100% - 20px, 1180px); padding-top: 18px; }
        .product-layout { grid-template-columns: minmax(0, 1fr); }
        .product-column { gap: 14px; }
        .pieces-section, .comments-section { margin-top: 18px; }
      }
      @media (max-width: 760px) {
        .dp-site-nav {
          width: min(100% - 28px, 1220px);
          min-height: 58px;
          gap: 10px;
        }
        .dp-site-logo img { height: 29px; }
        .dp-site-links {
          position: absolute;
          top: calc(100% + 1px);
          right: -14px;
          left: -14px;
          display: none;
          align-items: stretch;
          margin-left: 0;
          padding: 10px 14px 14px;
          border-bottom: 0;
          background: #4961bd;
        }
        .dp-site-links.is-open { display: grid; gap: 6px; }
        .dp-site-link {
          justify-content: flex-start;
          min-height: 44px;
          padding: 10px 12px;
        }
        .dp-site-links .dp-site-cart { display: none; }
        .dp-site-mobile-cart,
        .dp-site-menu-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          background: transparent;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
        }
        .dp-site-mobile-cart {
          margin-left: auto;
          padding: 7px 10px;
          text-decoration: none;
        }
        .dp-site-menu-button {
          width: 40px;
          padding: 0;
          cursor: pointer;
        }
        .breadcrumb { margin-bottom: 14px; }
        .design-header { margin-bottom: 16px; }
        .design-title-row { gap: 8px; }
        h1 { font-size: 26px; }
        .panel,
        .description-panel,
        .pieces-section,
        .comments-section { padding: 17px; }
        .meta { grid-template-columns: 96px minmax(0, 1fr); }
        .meta dt, .meta dd { padding: 9px 0; }
        .pieces-heading { display: block; }
        .pieces-heading p { margin-top: -8px; }
        table, tbody { display: block; }
        thead {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
        tbody { border-top: 1px solid var(--line); }
        tbody tr {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 7px 12px;
          border-bottom: 1px solid var(--line);
          padding: 12px 0;
        }
        tbody tr:last-child { border-bottom: 0; padding-bottom: 0; }
        td { display: block; border: 0; padding: 0; }
        td:first-child {
          grid-column: 1 / -1;
          color: var(--muted);
          font-size: 12px;
        }
        td:last-child {
          align-self: center;
          min-width: 50px;
          color: var(--text);
          font-weight: 800;
          text-align: right;
        }
        td:last-child::before {
          color: var(--muted);
          content: "Qty ";
          font-size: 11px;
          font-weight: 400;
        }
        .share-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    </style>
    <link rel="stylesheet" href="/css/doopixel-site-header.css?v=20260816d" />
    <link rel="stylesheet" href="/css/doopixel-site-footer.css?v=20260816a" />
  </head>
  <body>
    <div class="dp-site-nav-wrap">
      <nav class="dp-site-nav" aria-label="DooPixel main navigation">
        <button
          class="dp-site-menu-button"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="dp-site-links"
        >
          <img class="dp-site-icon" src="/assets/icons/lucide-menu.svg" alt="" />
        </button>
        <a class="dp-site-logo" href="https://doopixel.com/" aria-label="DooPixel shop">
          <img
            src="https://cdn.shopify.com/s/files/1/0738/7562/0006/files/20260408-001830.png?v=1775578807"
            alt="DooPixel"
          />
        </a>
        <div class="dp-site-links" id="dp-site-links">
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/">Upload Images</a>
          <a class="dp-site-link is-active" href="https://pixelizer.doopixel.com/gallery" aria-current="page">Gallery &amp; Shop</a>
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/find-project">Find My Project</a>
        </div>
        <a class="dp-site-cart-icon" href="https://doopixel.com/cart" aria-label="Shopping cart">
          <img class="dp-site-icon" src="/assets/icons/lucide-shopping-cart.svg" alt="" />
        </a>
      </nav>
    </div>

    <div class="wrap">
      <div class="breadcrumb">
        <a href="https://pixelizer.doopixel.com/gallery">Back to Gallery</a>
        <span aria-hidden="true">/</span>
        <span id="breadcrumb-title">DooPixel Design</span>
      </div>
      <header class="design-header">
        <div class="design-title-row">
          <h1 id="design-title">DooPixel Design</h1>
        </div>
      </header>

      <main id="loading"><p>Loading design...</p></main>

      <main id="content" class="hidden">
        <div class="product-layout">
          <section class="media-column">
          <div id="preview-gallery" class="preview-gallery hidden">
            <img id="preview" class="preview" alt="Pixel art build" />
            <div id="preview-thumbnails" class="preview-thumbnails" aria-label="Design photos"></div>
          </div>
          <div id="no-preview" class="notice hidden">Preview image is not available yet.</div>

          <section id="engagement" class="hidden">
            <div class="social-actions">
              <button id="like-button" class="secondary" type="button">Like (0)</button>
              <button id="share-button" class="secondary" type="button">Share</button>
            </div>
            <div id="share-options" class="share-options hidden">
              <button type="button" data-share="native">More Options</button>
              <button type="button" data-share="facebook">Facebook</button>
              <button type="button" data-share="x">X</button>
              <button type="button" data-share="pinterest">Pinterest</button>
              <button type="button" data-share="whatsapp">WhatsApp</button>
              <button type="button" data-share="copy">Copy Link</button>
            </div>
          </section>
          </section>

          <div class="product-column">
            <aside class="panel">
              <div class="panel-heading">
                <h2>Product Information</h2>
                <span id="verified-badge" class="verified-badge hidden"><span aria-hidden="true">&#10003;</span> Verified</span>
              </div>
              <dl class="meta">
                <dt>Price</dt><dd id="meta-price" class="meta-price">Loading...</dd>
                <dt>Size</dt><dd id="meta-size"></dd>
                <dt>Piece Type</dt><dd id="meta-piece"></dd>
                <dt>Design ID</dt><dd id="meta-id"></dd>
                <dt>Total Pieces</dt><dd id="meta-total"></dd>
                <dt>Colors</dt><dd id="meta-colors"></dd>
              </dl>

              <label for="share-frame-color" style="display:block;font-weight:700;margin-bottom:6px;">Frame Color</label>
              <select id="share-frame-color" style="margin-bottom:10px;">
                <option value="black" selected>Black Frame</option>
                <option value="white">White Frame</option>
              </select>
              <p class="instructions-note">After you place your order, a download link for the building instructions will be included in your order email.</p>
              <button id="add-to-cart">Add Custom Kit to Cart</button>
            </aside>

            <section id="description-panel" class="description-panel hidden">
              <h2>About This Design</h2>
              <p id="design-description" class="design-description"></p>
            </section>
          </div>
        </div>

        <section class="pieces-section">
          <div class="pieces-heading">
            <h2>Required Pieces</h2>
            <p>Every color and quantity included in this kit.</p>
          </div>
          <table>
            <thead>
              <tr><th>Piece Type</th><th>Color</th><th>Qty</th></tr>
            </thead>
            <tbody id="parts-body"></tbody>
          </table>
        </section>

        <section id="comments-section" class="comments-section hidden">
          <h2>Comments (<span id="comment-count">0</span>)</h2>
          <div id="comments-list" class="comments-list"></div>
          <div id="no-comments" class="notice">No comments yet. Be the first to comment.</div>
          <form id="comment-form">
            <input id="comment-name" maxlength="40" autocomplete="name" placeholder="Your display name" required />
            <textarea id="comment-body" maxlength="500" placeholder="Write a comment" required></textarea>
            ${turnstileWidget}
            <button id="comment-submit" type="submit">Submit Comment for Review</button>
          </form>
          <div id="comment-message" class="notice hidden"></div>
        </section>
      </main>
    </div>

    <div data-doopixel-footer></div>
    <script src="/js/doopixel-site-footer.js?v=20260816a"></script>
    <script src="/js/doopixel-site-header.js?v=20260816b"></script>
    <script>
      const DESIGN_ID = ${JSON.stringify(rawId)};
      const CANONICAL_URL = ${JSON.stringify(canonicalUrl)};
      const TURNSTILE_CONFIGURED = ${JSON.stringify(turnstileConfigured)};
      const SHOPIFY_ADD_KIT_URL = "https://doopixel.com/pages/add-pixel-kit";
      let currentDesign = null;
      let currentEngagement = null;

      function encodePayload(payload) {
        const json = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(json);
        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
      }

      function showCommentMessage(message) {
        const element = document.getElementById("comment-message");
        element.textContent = message;
        element.classList.toggle("hidden", !message);
      }

      function getBaseplateInfo(size) {
        const baseplateWidth = Math.ceil(Number(size[0]) / 16);
        const baseplateHeight = Math.ceil(Number(size[1]) / 16);
        const pricingWidth = Math.min(baseplateWidth, baseplateHeight);
        const pricingHeight = Math.max(baseplateWidth, baseplateHeight);
        return {
          baseplateWidth,
          baseplateHeight,
          baseplateLayout: baseplateWidth + " x " + baseplateHeight,
          pricingBaseplateWidth: pricingWidth,
          pricingBaseplateHeight: pricingHeight,
          pricingLayout: pricingWidth + " x " + pricingHeight,
          totalBaseplates: baseplateWidth * baseplateHeight,
          shopifyKitSku: "DP-KIT-" + pricingWidth + "X" + pricingHeight,
        };
      }

      function getSharePayload(design) {
        const frameColor = document.getElementById("share-frame-color").value === "white" ? "white" : "black";
        const frameLabel = frameColor === "white" ? "White Frame" : "Black Frame";
        const baseplateInfo = getBaseplateInfo(design.size);
        const totalPieces = design.parts.reduce((sum, part) => sum + Number(part.quantity), 0);
        return {
          v: 2,
          orderMode: "generic-kit",
          id: design.id,
          shareId: design.id,
          shareUrl: CANONICAL_URL,
          name: design.title,
          pieceType: design.pieceType,
          pieceTypeName: design.pieceTypeName,
          frameColor,
          frameLabel,
          shopifyKitSku: baseplateInfo.shopifyKitSku,
          size: design.size,
          baseplateWidth: baseplateInfo.baseplateWidth,
          baseplateHeight: baseplateInfo.baseplateHeight,
          baseplateLayout: baseplateInfo.baseplateLayout,
          pricingBaseplateWidth: baseplateInfo.pricingBaseplateWidth,
          pricingBaseplateHeight: baseplateInfo.pricingBaseplateHeight,
          pricingLayout: baseplateInfo.pricingLayout,
          totalBaseplates: baseplateInfo.totalBaseplates,
          totalPieces,
          colorLines: design.parts.length,
          items: design.parts.map((part) => [
            part.sku,
            part.quantity,
            part.doopixelNo,
            part.colorName,
            part.hex,
            part.bricklinkColorId,
          ]),
        };
      }

      function renderParts(parts) {
        const partsBody = document.getElementById("parts-body");
        partsBody.innerHTML = "";
        parts.forEach((part) => {
          const row = document.createElement("tr");
          const typeCell = document.createElement("td");
          typeCell.textContent = part.pieceTypeName ||
            (String(part.pieceType) === "4073"
              ? "Raised Pixel Pieces (1x1 Round Plate)"
              : "Flat Pixel Pieces (1x1 Round Tile)");
          const colorCell = document.createElement("td");
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.background = part.hex;
          colorCell.append(swatch, document.createTextNode(part.doopixelNo + " - " + part.colorName));
          const quantityCell = document.createElement("td");
          quantityCell.textContent = part.quantity;
          row.append(typeCell, colorCell, quantityCell);
          partsBody.appendChild(row);
        });
      }

      async function loadKitPrice(size) {
        const priceElement = document.getElementById("meta-price");
        try {
          const query = new URLSearchParams({ width: size[0], height: size[1] });
          const response = await fetch("/api/kit-price?" + query.toString());
          const result = await response.json();
          if (!response.ok || !result.ok) {
            throw new Error(result.error || "Could not load price.");
          }
          priceElement.textContent = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: result.currency || "USD",
          }).format(Number(result.priceCents) / 100);
        } catch (_error) {
          priceElement.textContent = "See price at checkout";
          priceElement.classList.remove("meta-price");
        }
      }

      function renderDesign(design) {
        currentDesign = design;
        document.getElementById("design-title").textContent = design.title;
        document.getElementById("breadcrumb-title").textContent = design.title;
        document.getElementById("verified-badge").classList.toggle("hidden", !design.isVerified);
        document.getElementById("meta-id").textContent = design.id;
        const baseplateInfo = getBaseplateInfo(design.size);
        const sizeElement = document.getElementById("meta-size");
        sizeElement.textContent = design.size[0] + " x " + design.size[1] + " pixels";
        const baseplateDetail = document.createElement("span");
        baseplateDetail.className = "meta-detail";
        baseplateDetail.textContent =
          baseplateInfo.baseplateLayout + " layout · 16 x 16 baseplates";
        const physicalSizeDetail = document.createElement("span");
        physicalSizeDetail.className = "meta-detail";
        const physicalWidth = Number((Number(design.size[0]) * 0.8).toFixed(1));
        const physicalHeight = Number((Number(design.size[1]) * 0.8).toFixed(1));
        physicalSizeDetail.textContent =
          "Approx. " + physicalWidth + " x " + physicalHeight + " cm";
        sizeElement.append(baseplateDetail, physicalSizeDetail);
        document.getElementById("meta-piece").textContent = design.pieceTypeName;
        const totalPieces = design.parts.reduce(
          (sum, part) => sum + Number(part.quantity),
          0
        );
        document.getElementById("meta-total").textContent =
          totalPieces.toLocaleString() + " pixel pieces";
        const uniqueColorCount = new Set(
          design.parts.map((part) =>
            String(part.doopixelNo || part.hex || part.colorName || "").toLowerCase()
          )
        ).size;
        document.getElementById("meta-colors").textContent =
          uniqueColorCount.toLocaleString() +
          (uniqueColorCount === 1 ? " color" : " colors");

        const description = String(design.customerCaption || "").trim();
        if (description) {
          document.getElementById("design-description").textContent = description;
          document.getElementById("description-panel").classList.remove("hidden");
        }
        loadKitPrice(design.size);

        const imageKeys = design.imageKeys && design.imageKeys.length
          ? design.imageKeys
          : design.status === "approved" && design.finishedImageKey
            ? [design.finishedImageKey]
            : design.previewImageKey
              ? [design.previewImageKey]
              : [];
        if (imageKeys.length) {
          const preview = document.getElementById("preview");
          const gallery = document.getElementById("preview-gallery");
          const thumbnails = document.getElementById("preview-thumbnails");
          thumbnails.innerHTML = "";

          function selectImage(imageKey, button) {
            preview.src = "/api/images?key=" + encodeURIComponent(imageKey);
            preview.classList.toggle("pixelated", imageKey === design.previewImageKey);
            Array.from(thumbnails.children).forEach(function (thumbnail) {
              thumbnail.classList.toggle("is-active", thumbnail === button);
              thumbnail.setAttribute("aria-pressed", thumbnail === button ? "true" : "false");
            });
          }

          imageKeys.forEach(function (imageKey, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "preview-thumb";
            button.setAttribute("aria-label", "View photo " + (index + 1));
            button.setAttribute("aria-pressed", "false");
            const image = document.createElement("img");
            image.src = "/api/images?key=" + encodeURIComponent(imageKey);
            image.alt = "";
            button.appendChild(image);
            button.addEventListener("click", function () { selectImage(imageKey, button); });
            thumbnails.appendChild(button);
            if (index === 0) selectImage(imageKey, button);
          });
          thumbnails.classList.toggle("hidden", imageKeys.length === 1);
          gallery.classList.remove("hidden");
        } else {
          document.getElementById("no-preview").classList.remove("hidden");
        }

        renderParts(design.parts);
        document.getElementById("loading").classList.add("hidden");
        document.getElementById("content").classList.remove("hidden");

        if (design.status === "approved") {
          document.getElementById("engagement").classList.remove("hidden");
          document.getElementById("comments-section").classList.remove("hidden");
          loadEngagement().catch((error) => showCommentMessage(error.message));
        }
      }

      async function loadDesign() {
        const response = await fetch("/api/designs/" + encodeURIComponent(DESIGN_ID));
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Could not load design.");
        renderDesign(result.design);
      }

      function renderComments(engagement) {
        currentEngagement = engagement;
        const likeButton = document.getElementById("like-button");
        likeButton.textContent =
          (engagement.liked ? "Liked" : "Like") + " (" + Number(engagement.likes).toLocaleString() + ")";
        likeButton.classList.toggle("active", engagement.liked);
        document.getElementById("comment-count").textContent = engagement.commentCount;

        const list = document.getElementById("comments-list");
        list.innerHTML = "";
        engagement.comments.forEach((comment) => {
          const article = document.createElement("article");
          article.className = "comment";
          const head = document.createElement("div");
          head.className = "comment-head";
          const name = document.createElement("span");
          name.className = "comment-name";
          name.textContent = comment.displayName;
          const date = document.createElement("span");
          date.className = "comment-date";
          date.textContent = new Date(comment.createdAt).toLocaleDateString();
          head.append(name, date);
          const body = document.createElement("p");
          body.className = "comment-body";
          body.textContent = comment.body;
          article.append(head, body);
          list.appendChild(article);
        });
        document.getElementById("no-comments").classList.toggle(
          "hidden",
          engagement.comments.length !== 0
        );
        const form = document.getElementById("comment-form");
        form.classList.toggle("hidden", !engagement.commentsEnabled);
        if (!engagement.commentsEnabled) {
          showCommentMessage("Comments are closed for this design.");
        }
      }

      async function loadEngagement() {
        const response = await fetch(
          "/api/designs/" + encodeURIComponent(DESIGN_ID) + "/engagement"
        );
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Could not load comments.");
        renderComments(result);
      }

      async function toggleLike() {
        const button = document.getElementById("like-button");
        button.disabled = true;
        try {
          const response = await fetch(
            "/api/designs/" + encodeURIComponent(DESIGN_ID) + "/like",
            { method: "POST" }
          );
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not update like.");
          currentEngagement.liked = result.liked;
          currentEngagement.likes = result.likes;
          renderComments(currentEngagement);
        } catch (error) {
          showCommentMessage(error.message);
        } finally {
          button.disabled = false;
        }
      }

      function trackShare() {
        fetch("/api/designs/" + encodeURIComponent(DESIGN_ID) + "/share-event", {
          method: "POST",
          keepalive: true,
        }).catch(() => {});
      }

      async function copyLink() {
        try {
          await navigator.clipboard.writeText(CANONICAL_URL);
        } catch (_error) {
          const textarea = document.createElement("textarea");
          textarea.value = CANONICAL_URL;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          textarea.remove();
        }
        trackShare();
        showCommentMessage("Share link copied.");
      }

      async function shareNative() {
        if (!navigator.share) {
          showCommentMessage("Use one of the sharing options below.");
          return;
        }
        try {
          await navigator.share({
            title: currentDesign.title,
            text: currentDesign.customerCaption || "See this DooPixel community build.",
            url: CANONICAL_URL,
          });
          trackShare();
        } catch (error) {
          if (error.name !== "AbortError") showCommentMessage("Could not open sharing options.");
        }
      }

      function openSocialShare(network) {
        const encodedUrl = encodeURIComponent(CANONICAL_URL);
        const text = encodeURIComponent(currentDesign.title + " | DooPixel");
        const imageKey = currentDesign.finishedImageKey || currentDesign.previewImageKey;
        const media = encodeURIComponent(
          window.location.origin + "/api/images?key=" + encodeURIComponent(imageKey || "")
        );
        let target = "";
        if (network === "facebook") {
          target = "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
        } else if (network === "x") {
          target = "https://twitter.com/intent/tweet?url=" + encodedUrl + "&text=" + text;
        } else if (network === "pinterest") {
          target = "https://pinterest.com/pin/create/button/?url=" + encodedUrl +
            "&media=" + media + "&description=" + text;
        } else if (network === "whatsapp") {
          target = "https://wa.me/?text=" + text + "%20" + encodedUrl;
        }
        if (target) {
          trackShare();
          window.open(target, "_blank", "noopener,noreferrer");
        }
      }

      document.getElementById("add-to-cart").addEventListener("click", async (event) => {
        if (!currentDesign) return;
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Preparing your project...";
        try {
          const response = await fetch(
            "/api/designs/" + encodeURIComponent(currentDesign.id) + "/projects",
            { method: "POST" }
          );
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not prepare this project.");
          const payload = getSharePayload(currentDesign);
          payload.v = 3;
          payload.id = result.designId;
          payload.shareId = result.designId;
          payload.shareUrl = new URL(result.shareUrl, window.location.origin).href;
          payload.projectId = result.projectId;
          payload.projectToken = result.projectToken;
          payload.projectUrl = new URL(result.projectUrl, window.location.origin).href;
          const encoded = encodeURIComponent(encodePayload(payload));
          window.location.href = SHOPIFY_ADD_KIT_URL + "#" + encoded;
        } catch (error) {
          showCommentMessage(error.message || "Could not prepare this project.");
          button.disabled = false;
          button.textContent = "Add Custom Kit to Cart";
        }
      });

      document.getElementById("like-button").addEventListener("click", toggleLike);
      document.getElementById("share-button").addEventListener("click", () => {
        document.getElementById("share-options").classList.toggle("hidden");
      });
      document.querySelectorAll("[data-share]").forEach((button) => {
        button.addEventListener("click", () => {
          const network = button.dataset.share;
          if (network === "native") shareNative();
          else if (network === "copy") copyLink();
          else openSocialShare(network);
        });
      });

      document.getElementById("comment-name").value =
        localStorage.getItem("doopixelCommentName") || "";
      document.getElementById("comment-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = document.getElementById("comment-submit");
        if (!TURNSTILE_CONFIGURED) {
          showCommentMessage("Comments are temporarily unavailable.");
          return;
        }
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
        try {
          const displayName = document.getElementById("comment-name").value.trim();
          const commentBody = document.getElementById("comment-body").value.trim();
          const tokenInput = event.currentTarget.querySelector(
            '[name="cf-turnstile-response"]'
          );
          const response = await fetch(
            "/api/designs/" + encodeURIComponent(DESIGN_ID) + "/comments",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                displayName,
                body: commentBody,
                turnstileToken: tokenInput ? tokenInput.value : "",
              }),
            }
          );
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not submit comment.");
          localStorage.setItem("doopixelCommentName", displayName);
          document.getElementById("comment-body").value = "";
          showCommentMessage(result.message);
          if (window.turnstile) window.turnstile.reset();
        } catch (error) {
          showCommentMessage(error.message);
          if (window.turnstile) window.turnstile.reset();
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = "Submit Comment for Review";
        }
      });

      loadDesign().catch((error) => {
        const loading = document.getElementById("loading");
        loading.textContent = error.message;
      });
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}
