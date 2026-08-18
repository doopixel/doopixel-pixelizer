export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pixel Art Gallery &amp; Buildable Kits | DooPixel</title>
    <meta name="description" content="Explore verified and community pixel art designs, view every required piece, and add a complete buildable kit to your cart." />
    <link rel="canonical" href="https://pixelizer.doopixel.com/gallery" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Pixel Art Gallery &amp; Buildable Kits | DooPixel" />
    <meta property="og:description" content="Explore pixel art designs, see the required pieces, and add a complete buildable kit to your cart." />
    <meta property="og:url" content="https://pixelizer.doopixel.com/gallery" />
    <meta property="og:site_name" content="DooPixel" />
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "DooPixel Pixel Art Gallery & Shop",
        "url": "https://pixelizer.doopixel.com/gallery",
        "description": "Explore verified and community pixel art designs with complete piece lists and buildable kits.",
        "isPartOf": {
          "@type": "WebSite",
          "name": "DooPixel",
          "url": "https://doopixel.com/"
        }
      }
    </script>
    <style>
      :root {
        color-scheme: light;
        --ink: #181818;
        --muted: #66645f;
        --paper: #ffffff;
        --canvas: #fafafa;
        --line: #e3e3df;
        --red: #d4141a;
        --pink: #e899bc;
        --green: #289b3a;
        --yellow: #f4ce21;
        --blue: #4961bd;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        color: var(--ink);
        background: var(--canvas);
        font-family: Arial, Helvetica, sans-serif;
      }

      .dp-site-nav-wrap {
        position: sticky;
        top: 0;
        z-index: 1000;
        border: 0;
        background: var(--blue);
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

      .shell {
        width: min(100% - 36px, 1220px);
        margin: 0 auto;
      }

      .button {
        min-height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--blue);
        border-radius: 6px;
        padding: 9px 15px;
        background: var(--blue);
        color: #fff;
        text-decoration: none;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
      }

      .button:hover {
        background: var(--red);
        border-color: var(--red);
        color: #fff;
      }

      .intro {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 42px;
        align-items: center;
        margin-top: 32px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
        padding: 34px 38px;
      }

      h1 {
        margin: 0;
        font-size: 38px;
        line-height: 1.12;
        letter-spacing: 0;
      }

      .intro-copy {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 15px;
        line-height: 1.55;
      }

      .intro-details {
        margin: 0;
        border-left: 1px solid var(--line);
        padding-left: 32px;
      }

      .intro-detail {
        position: relative;
        margin: 0;
        padding: 10px 0 10px 22px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }

      .intro-detail + .intro-detail { border-top: 1px solid var(--line); }

      .intro-detail::before {
        position: absolute;
        top: 15px;
        left: 0;
        width: 7px;
        height: 7px;
        border-radius: 2px;
        background: var(--blue);
        content: "";
      }

      .intro-detail strong { color: var(--ink); }

      .gallery-section { padding: 24px 0 64px; }

      .gallery-tools {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        margin-bottom: 22px;
      }

      .sort-control {
        display: inline-grid;
        grid-template-columns: 1fr 1fr;
        width: 300px;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: var(--paper);
      }

      .sort-button {
        min-height: 40px;
        border: 0;
        border-right: 1px solid var(--line);
        background: var(--paper);
        color: var(--ink);
        padding: 8px 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .sort-button:last-child { border-right: 0; }
      .sort-button.active {
        background: #eef1f8;
        color: var(--ink);
      }

      .sort-button:hover { background: #f5f6f8; }

      .gallery-search {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        width: min(100%, 560px);
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
      }

      .gallery-search input {
        width: 100%;
        min-height: 42px;
        border: 0;
        background: var(--paper);
        color: var(--ink);
        padding: 10px 13px;
        font: inherit;
        font-size: 14px;
      }

      .gallery-search input:focus {
        outline: 0;
      }

      .gallery-search .button {
        min-width: 84px;
        min-height: 42px;
        border: 0;
        border-left: 1px solid var(--line);
        border-radius: 0;
        background: var(--paper);
        color: var(--ink);
        font-weight: 700;
      }

      .gallery-search .button:hover { background: #f5f6f8; }

      .gallery-search:focus-within {
        border-color: #aab4dc;
        outline: 2px solid rgba(73, 97, 189, 0.12);
        outline-offset: 1px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
        cursor: pointer;
      }

      .card:hover { border-color: #aeb8ae; }
      .card:focus-visible {
        border-color: var(--green);
        outline: 2px solid rgba(40, 161, 57, 0.2);
        outline-offset: 2px;
      }

      .image-wrap {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-bottom: 1px solid var(--line);
        background: #f3f3f0;
      }

      .card img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .badge-stack {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
        max-width: calc(100% - 20px);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid rgba(24, 24, 24, 0.16);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        color: #3e3d39;
        padding: 4px 7px;
        font-size: 11px;
        font-weight: 700;
      }

      .badge--verified {
        border: 0;
        background: var(--yellow);
        color: var(--ink);
        text-transform: uppercase;
      }

      .badge-check {
        display: inline-grid;
        place-items: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--ink);
        color: #fff;
        font-size: 9px;
        line-height: 1;
      }

      .card-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        padding: 15px;
      }

      .card-title {
        margin: 0;
        overflow-wrap: anywhere;
        font-size: 18px;
        line-height: 1.25;
      }

      .specs {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }

      .engagement {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 18px;
        margin: 11px 0 13px;
        padding-top: 11px;
        border-top: 1px solid var(--line);
        font-size: 13px;
        font-weight: 700;
      }

      .likes { color: var(--red); }
      .comments { color: var(--green); }

      .card .button {
        width: 100%;
        margin-top: auto;
        border-color: #28a139;
        background: #28a139;
      }

      .card .button:hover {
        border-color: #228b31;
        background: #228b31;
      }

      .notice {
        width: min(100%, 760px);
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
        padding: 18px;
        color: var(--muted);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 32px;
      }

      .page-button {
        display: inline-grid;
        place-items: center;
        min-width: 40px;
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--paper);
        color: var(--ink);
        padding: 7px 10px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .page-button:hover { border-color: #aab4dc; background: #f5f6f8; }
      .page-button.active {
        border-color: var(--blue);
        background: var(--blue);
        color: #fff;
      }
      .page-button:disabled { opacity: 0.42; cursor: default; }
      .page-ellipsis { min-width: 24px; color: var(--muted); text-align: center; }
      .hidden { display: none; }

      @media (max-width: 1020px) and (min-width: 681px) {
        .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .intro { gap: 28px; padding: 30px; }
        .intro-details { padding-left: 24px; }
      }

      @media (min-width: 681px) {
        .intro-detail {
          font-size: 15px;
          text-transform: capitalize;
        }
      }

      @media (max-width: 680px) {
        .shell { width: min(100% - 20px, 1220px); }
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
          background: var(--blue);
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
        .intro {
          display: block;
          margin-top: 18px;
          padding: 22px 20px;
        }
        h1 { font-size: 28px; }
        .intro-copy {
          margin-top: 10px;
          font-size: 14px;
          line-height: 1.5;
        }
        .intro-details {
          margin-top: 18px;
          border-top: 1px solid var(--line);
          border-left: 0;
          padding: 8px 0 0;
        }
        .intro-detail { padding-top: 8px; padding-bottom: 8px; }
        .intro-detail::before { top: 13px; }
        .gallery-section { padding: 16px 0 42px; }
        .gallery-tools { align-items: stretch; gap: 9px; margin-bottom: 16px; }
        .sort-control { width: 100%; }
        .gallery-search {
          width: 100%;
        }
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .card { width: 100%; }
        .badge-stack {
          top: 6px;
          right: 6px;
          gap: 4px;
          max-width: calc(100% - 12px);
        }
        .badge {
          gap: 3px;
          padding: 3px 5px;
          font-size: 9px;
        }
        .badge-check { width: 12px; height: 12px; font-size: 8px; }
        .card-body { padding: 10px; }
        .card-title {
          font-size: 14px;
          line-height: 1.3;
        }
        .specs {
          margin-top: 7px;
          font-size: 11px;
          line-height: 1.4;
        }
        .engagement {
          gap: 4px 8px;
          margin: 8px 0 10px;
          padding-top: 8px;
          font-size: 10px;
          line-height: 1.3;
        }
        .card .button {
          min-height: 36px;
          padding: 7px 6px;
          font-size: 12px;
        }
        .pagination { gap: 4px; margin-top: 24px; }
        .page-button { min-width: 36px; min-height: 36px; padding: 6px 8px; }
        .page-button--direction { min-width: 56px; }
      }

      @media (max-width: 390px) {
        h1 { font-size: 26px; }
      }
    </style>
    <link rel="stylesheet" href="/css/doopixel-site-header.css?v=20260816d" />
    <link rel="stylesheet" href="/css/doopixel-site-footer.css?v=20260816b" />
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

    <div class="shell">
      <main>
        <section class="intro">
          <div>
            <h1>Pixel art, ready to build.</h1>
            <p class="intro-copy">
              Explore verified designs from DooPixel and our builder community. Choose a design, add the exact kit, and receive instructions after checkout.
            </p>
          </div>
          <div class="intro-details" aria-label="What every gallery design includes">
            <p class="intro-detail"><strong>Verified designs:</strong> Reviewed before they appear in the gallery.</p>
            <p class="intro-detail"><strong>Exact piece lists:</strong> See the size, piece count, and colors before ordering.</p>
            <p class="intro-detail"><strong>Ready to build:</strong> Add the complete kit and receive instructions after purchase.</p>
          </div>
        </section>

        <section class="gallery-section">
          <div class="gallery-tools">
            <div class="sort-control" role="group" aria-label="Sort gallery">
              <button class="sort-button active" type="button" data-sort="newest">Newest</button>
              <button class="sort-button" type="button" data-sort="popular">Most Liked</button>
            </div>
            <form id="gallery-search-form" class="gallery-search" role="search">
              <label class="hidden" for="gallery-search-input">Search pixel art designs</label>
              <input
                id="gallery-search-input"
                name="q"
                type="search"
                maxlength="80"
                placeholder="Search by title or keyword"
                autocomplete="off"
              />
              <button class="button" type="submit">Search</button>
            </form>
          </div>

          <div id="loading" class="notice">Loading pixel art designs...</div>
          <div id="empty" class="notice hidden">No approved builds have been shared yet.</div>
          <div id="grid" class="grid hidden"></div>
          <nav id="pagination" class="pagination hidden" aria-label="Gallery pages"></nav>
        </section>
      </main>
    </div>

    <div data-doopixel-footer></div>
    <script src="/js/doopixel-site-footer.js?v=20260818b"></script>
    <script src="/js/doopixel-site-header.js?v=20260818b"></script>
    <script>
      const loading = document.getElementById("loading");
      const empty = document.getElementById("empty");
      const grid = document.getElementById("grid");
      const pagination = document.getElementById("pagination");
      const sortButtons = Array.from(document.querySelectorAll("[data-sort]"));
      const searchForm = document.getElementById("gallery-search-form");
      const searchInput = document.getElementById("gallery-search-input");
      let currentPage = 1;
      let currentSort = "newest";
      let currentSearch = "";
      const pageSize = window.matchMedia("(max-width: 680px)").matches ? 10 : 12;

      function plural(value, singular, pluralValue) {
        return value === 1 ? singular : pluralValue;
      }

      function createCard(design) {
        const card = document.createElement("article");
        card.className = "card";
        const detailUrl = "/share/" + encodeURIComponent(design.id);
        card.tabIndex = 0;
        card.setAttribute("role", "link");
        card.setAttribute("aria-label", "View " + design.title);
        card.addEventListener("click", (event) => {
          if (event.target.closest("a, button, input, select, textarea")) return;
          window.location.href = detailUrl;
        });
        card.addEventListener("keydown", (event) => {
          if (event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          window.location.href = detailUrl;
        });

        const imageWrap = document.createElement("div");
        imageWrap.className = "image-wrap";
        const image = document.createElement("img");
        image.alt = design.title + " finished build";
        image.loading = "lazy";
        image.src = "/api/images?key=" + encodeURIComponent(design.finishedImageKey);
        imageWrap.appendChild(image);

        if (design.isPinned || design.isVerified) {
          const badgeStack = document.createElement("div");
          badgeStack.className = "badge-stack";
          if (design.isVerified) {
            const verifiedBadge = document.createElement("span");
            verifiedBadge.className = "badge badge--verified";
            const verifiedCheck = document.createElement("span");
            verifiedCheck.className = "badge-check";
            verifiedCheck.textContent = "\u2713";
            verifiedBadge.append(verifiedCheck, document.createTextNode("Verified"));
            badgeStack.appendChild(verifiedBadge);
          }
          if (design.isPinned) {
            const featuredBadge = document.createElement("span");
            featuredBadge.className = "badge";
            featuredBadge.textContent = "Featured";
            badgeStack.appendChild(featuredBadge);
          }
          imageWrap.appendChild(badgeStack);
        }
        card.appendChild(imageWrap);

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = design.title;
        body.appendChild(title);

        const specs = document.createElement("p");
        specs.className = "specs";
        specs.textContent =
          design.size.join(" x ") +
          " pixels · " +
          Number(design.totalPieces).toLocaleString() +
          " pieces · " +
          design.colorLines +
          " colors";
        body.appendChild(specs);

        const engagement = document.createElement("div");
        engagement.className = "engagement";
        const likes = document.createElement("span");
        likes.className = "likes";
        likes.textContent =
          Number(design.likeCount).toLocaleString() +
          " " +
          plural(design.likeCount, "Like", "Likes");
        const comments = document.createElement("span");
        comments.className = "comments";
        comments.textContent =
          Number(design.commentCount).toLocaleString() +
          " " +
          plural(design.commentCount, "Comment", "Comments");
        engagement.append(likes, comments);
        body.appendChild(engagement);

        const link = document.createElement("a");
        link.className = "button";
        link.href = detailUrl;
        link.textContent = "View & Add Kit";
        body.appendChild(link);

        card.appendChild(body);
        return card;
      }

      function updateSortButtons() {
        sortButtons.forEach((button) => {
          const isActive = button.dataset.sort === currentSort;
          button.classList.toggle("active", isActive);
          button.setAttribute("aria-pressed", String(isActive));
        });
      }

      function paginationItems(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
        const items = [1];
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        if (start > 2) items.push("ellipsis-start");
        for (let page = start; page <= end; page += 1) items.push(page);
        if (end < total - 1) items.push("ellipsis-end");
        items.push(total);
        return items;
      }

      function pageButton(label, page, options = {}) {
        const button = document.createElement("button");
        button.className = "page-button" + (options.direction ? " page-button--direction" : "");
        button.type = "button";
        button.textContent = label;
        button.disabled = Boolean(options.disabled);
        if (options.active) {
          button.classList.add("active");
          button.setAttribute("aria-current", "page");
        }
        button.setAttribute("aria-label", options.label || "Page " + page);
        if (!button.disabled && !options.active) button.addEventListener("click", () => loadGallery(page, true));
        return button;
      }

      function renderPagination(totalItems) {
        const totalPages = Math.ceil(Number(totalItems) / pageSize);
        pagination.innerHTML = "";
        if (totalPages <= 1) {
          pagination.classList.add("hidden");
          return;
        }

        pagination.appendChild(
          pageButton("Previous", currentPage - 1, {
            direction: true,
            disabled: currentPage === 1,
            label: "Previous page",
          })
        );
        paginationItems(currentPage, totalPages).forEach((item) => {
          if (typeof item === "string") {
            const ellipsis = document.createElement("span");
            ellipsis.className = "page-ellipsis";
            ellipsis.textContent = "\u2026";
            ellipsis.setAttribute("aria-hidden", "true");
            pagination.appendChild(ellipsis);
            return;
          }
          pagination.appendChild(pageButton(String(item), item, { active: item === currentPage }));
        });
        pagination.appendChild(
          pageButton("Next", currentPage + 1, {
            direction: true,
            disabled: currentPage === totalPages,
            label: "Next page",
          })
        );
        pagination.classList.remove("hidden");
      }

      async function loadGallery(page, scrollToResults = false) {
        pagination.classList.add("hidden");
        empty.classList.add("hidden");
        grid.classList.add("hidden");
        loading.textContent = "Loading pixel art designs...";
        loading.classList.remove("hidden");
        try {
          const response = await fetch(
            "/api/gallery?page=" +
              page +
              "&sort=" +
              encodeURIComponent(currentSort) +
              "&q=" +
              encodeURIComponent(currentSearch) +
              "&limit=" +
              pageSize
          );
          const result = await response.json();
          if (!response.ok || !result.ok) {
            throw new Error(result.error || "Could not load the gallery.");
          }

          loading.classList.add("hidden");
          if (page === 1 && !result.designs.length) {
            grid.innerHTML = "";
            empty.classList.remove("hidden");
            empty.textContent = currentSearch
              ? 'No pixel art designs found for "' + currentSearch + '".'
              : "No approved builds have been shared yet.";
            return;
          }

          grid.innerHTML = "";
          result.designs.forEach((design) => {
            grid.appendChild(createCard(design));
          });
          currentPage = page;
          grid.classList.remove("hidden");
          renderPagination(result.total);
          if (scrollToResults) {
            document.querySelector(".gallery-tools").scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } catch (error) {
          loading.textContent = error.message;
          loading.classList.remove("hidden");
        }
      }

      function resetGallery(options = {}) {
        if (options.sort) currentSort = options.sort;
        if (Object.prototype.hasOwnProperty.call(options, "search")) {
          currentSearch = options.search.trim().slice(0, 80);
        }
        currentPage = 1;
        grid.innerHTML = "";
        grid.classList.add("hidden");
        empty.classList.add("hidden");
        pagination.classList.add("hidden");
        loading.textContent = "Loading pixel art designs...";
        loading.classList.remove("hidden");
        updateSortButtons();
        loadGallery(1);
      }

      sortButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.sort !== currentSort) {
            resetGallery({ sort: button.dataset.sort });
          }
        });
      });

      searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        resetGallery({ search: searchInput.value });
      });

      searchInput.addEventListener("search", () => {
        if (!searchInput.value && currentSearch) resetGallery({ search: "" });
      });

      updateSortButtons();
      loadGallery(1);
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    }
  );
}
