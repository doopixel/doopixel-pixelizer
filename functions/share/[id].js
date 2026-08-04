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
        --text: #191919;
        --muted: #666;
        --line: #ddd;
        --soft: #f6f6f6;
        --accent: #111;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--text);
        background: #fff;
      }

      .dp-site-nav-wrap {
        position: sticky;
        top: 0;
        z-index: 1000;
        border-top: 5px solid #f4ce21;
        border-bottom: 1px solid #343434;
        background: #181818;
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
        border-color: #555;
        color: #f4ce21;
      }

      .dp-site-link.is-active {
        border-color: #f4ce21;
        background: #f4ce21;
        color: #181818;
      }

      .dp-site-cart {
        border-color: #f4ce21;
        color: #f4ce21;
      }

      .dp-site-menu-button,
      .dp-site-mobile-cart {
        display: none;
      }

      .wrap { max-width: 1080px; margin: 0 auto; padding: 28px 18px 48px; }
      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 16px;
        color: var(--muted);
        font-size: 13px;
      }
      .breadcrumb a {
        color: #181818;
        font-weight: 700;
      }
      .design-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        border-bottom: 1px solid var(--line);
        padding-bottom: 18px;
        margin-bottom: 24px;
      }
      h1 { font-size: 28px; line-height: 1.2; margin: 0 0 8px; }
      h2 { font-size: 21px; margin: 24px 0 12px; }
      p { line-height: 1.5; }
      .muted { color: var(--muted); margin: 0; }
      .verified-badge {
        display: inline-flex;
        margin-top: 10px;
        border: 1px solid #181818;
        background: #f4ce21;
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 800;
      }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
        gap: 28px;
        align-items: start;
      }
      .preview {
        display: block;
        width: 100%;
        max-height: 720px;
        object-fit: contain;
        border: 1px solid var(--line);
        background: var(--soft);
      }
      .preview.pixelated { image-rendering: pixelated; }
      .panel { border: 1px solid var(--line); padding: 16px; }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 14px;
        margin: 0 0 16px;
        font-size: 14px;
      }
      .meta dt { color: var(--muted); }
      .meta dd { margin: 0; font-weight: 600; }
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
        border-radius: 0;
      }
      button.secondary, .button.secondary { background: #fff; color: var(--accent); }
      .button.full { width: 100%; margin-bottom: 10px; }
      button.active { background: #fff; color: var(--accent); }
      button:disabled { opacity: .55; cursor: wait; }
      .social-actions { display: flex; gap: 10px; margin: 14px 0; }
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
      table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 14px; }
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
        border-radius: 0;
        background: #fff;
      }
      textarea { min-height: 90px; resize: vertical; }
      .comments-list { display: grid; gap: 10px; }
      .comment { border-top: 1px solid var(--line); padding-top: 12px; }
      .comment:first-child { border-top: 0; }
      .comment-head { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }
      .comment-name { font-weight: 700; }
      .comment-date { color: var(--muted); font-size: 12px; }
      .comment-body { margin: 7px 0 0; white-space: pre-wrap; }
      .notice { margin-top: 14px; padding: 12px; background: var(--soft); border: 1px solid var(--line); }
      .hidden { display: none; }
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
          border-bottom: 1px solid #343434;
          background: #181818;
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
          border: 1px solid #f4ce21;
          background: transparent;
          color: #f4ce21;
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
        .design-header, .grid { display: block; }
        .panel { margin-top: 18px; }
        .share-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    </style>
  </head>
  <body>
    <div class="dp-site-nav-wrap">
      <nav class="dp-site-nav" aria-label="DooPixel main navigation">
        <a class="dp-site-logo" href="https://doopixel.com/" aria-label="DooPixel shop">
          <img
            src="https://cdn.shopify.com/s/files/1/0738/7562/0006/files/20260408-001830.png?v=1775578807"
            alt="DooPixel"
          />
        </a>
        <div class="dp-site-links" id="dp-site-menu">
          <a class="dp-site-link" href="https://doopixel.com/">Shop</a>
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/">Pixel Art Maker</a>
          <a
            class="dp-site-link is-active"
            href="https://pixelizer.doopixel.com/gallery"
            aria-current="page"
          >
            Community Gallery
          </a>
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/find-project">Find My Project</a>
          <a class="dp-site-link dp-site-cart" href="https://doopixel.com/cart">Cart</a>
        </div>
        <a class="dp-site-mobile-cart" href="https://doopixel.com/cart">Cart</a>
        <button
          class="dp-site-menu-button"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-controls="dp-site-menu"
        >
          &#9776;
        </button>
      </nav>
    </div>

    <div class="wrap">
      <div class="breadcrumb">
        <a href="https://pixelizer.doopixel.com/gallery">Back to Gallery</a>
        <span aria-hidden="true">/</span>
        <span id="breadcrumb-title">DooPixel Design</span>
      </div>
      <header class="design-header">
        <div>
          <h1 id="design-title">DooPixel Design</h1>
          <p class="muted" id="design-subtitle">${id}</p>
          <span id="verified-badge" class="verified-badge hidden">DooPixel Verified</span>
        </div>
      </header>

      <main id="loading"><p>Loading design...</p></main>

      <main id="content" class="grid hidden">
        <section>
          <img id="preview" class="preview hidden" alt="Pixel art build" />
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

          <h2>Required Pieces</h2>
          <table>
            <thead>
              <tr><th>Color</th><th>SKU</th><th>Qty</th></tr>
            </thead>
            <tbody id="parts-body"></tbody>
          </table>

          <section id="comments-section" class="hidden">
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
        </section>

        <aside class="panel">
          <dl class="meta">
            <dt>Design ID</dt><dd id="meta-id"></dd>
            <dt>Size</dt><dd id="meta-size"></dd>
            <dt>Piece</dt><dd id="meta-piece"></dd>
            <dt>Total Pieces</dt><dd id="meta-total"></dd>
          </dl>

          <label for="share-frame-color" style="display:block;font-weight:700;margin-bottom:6px;">Frame Color</label>
          <select id="share-frame-color" style="margin-bottom:10px;">
            <option value="black" selected>Black Frame</option>
            <option value="white">White Frame</option>
          </select>
          <a id="download-verified-instructions" class="button secondary full hidden" href="#" download>
            Download Building Instructions
          </a>
          <button id="add-to-cart">Add Custom Kit to Cart</button>
        </aside>
      </main>
    </div>

    <script>
      const DESIGN_ID = ${JSON.stringify(rawId)};
      const CANONICAL_URL = ${JSON.stringify(canonicalUrl)};
      const TURNSTILE_CONFIGURED = ${JSON.stringify(turnstileConfigured)};
      const SHOPIFY_ADD_KIT_URL = "https://doopixel.com/pages/add-pixel-kit";
      let currentDesign = null;
      let currentEngagement = null;

      function setupSiteNavigation() {
        const button = document.querySelector(".dp-site-menu-button");
        const menu = document.getElementById("dp-site-menu");
        if (!button || !menu) return;

        function setOpen(isOpen) {
          menu.classList.toggle("is-open", isOpen);
          button.setAttribute("aria-expanded", String(isOpen));
          button.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
        }

        button.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
        menu.addEventListener("click", (event) => {
          if (event.target.closest("a")) setOpen(false);
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") setOpen(false);
        });
      }

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
          const colorCell = document.createElement("td");
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.background = part.hex;
          colorCell.append(swatch, document.createTextNode(part.doopixelNo + " - " + part.colorName));
          const skuCell = document.createElement("td");
          skuCell.textContent = part.sku;
          const quantityCell = document.createElement("td");
          quantityCell.textContent = part.quantity;
          row.append(colorCell, skuCell, quantityCell);
          partsBody.appendChild(row);
        });
      }

      function renderDesign(design) {
        currentDesign = design;
        document.getElementById("design-title").textContent = design.title;
        document.getElementById("breadcrumb-title").textContent = design.title;
        document.getElementById("design-subtitle").textContent = design.id;
        document.getElementById("verified-badge").classList.toggle("hidden", !design.isVerified);
        document.getElementById("meta-id").textContent = design.id;
        document.getElementById("meta-size").textContent = design.size[0] + " x " + design.size[1];
        document.getElementById("meta-piece").textContent = design.pieceTypeName;
        document.getElementById("meta-total").textContent =
          design.parts.reduce((sum, part) => sum + Number(part.quantity), 0).toLocaleString();

        const imageKey =
          design.status === "approved" && design.finishedImageKey
            ? design.finishedImageKey
            : design.previewImageKey;
        if (imageKey) {
          const preview = document.getElementById("preview");
          preview.src = "/api/images?key=" + encodeURIComponent(imageKey);
          preview.classList.toggle("pixelated", imageKey === design.previewImageKey);
          preview.classList.remove("hidden");
        } else {
          document.getElementById("no-preview").classList.remove("hidden");
        }

        renderParts(design.parts);
        const instructionsLink = document.getElementById("download-verified-instructions");
        if (design.isVerified && design.instructionsAvailable && design.instructionsUrl) {
          instructionsLink.href = design.instructionsUrl;
          instructionsLink.classList.remove("hidden");
        }
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

      setupSiteNavigation();
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
