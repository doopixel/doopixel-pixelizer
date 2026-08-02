export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DooPixel Community Gallery</title>
    <meta name="description" content="Explore pixel art builds shared by the DooPixel community." />
    <style>
      :root {
        color-scheme: light;
        --ink: #181818;
        --muted: #66645f;
        --paper: #ffffff;
        --canvas: #f6f7f4;
        --line: #d8d9d3;
        --red: #d4141a;
        --pink: #e899bc;
        --green: #289b3a;
        --yellow: #f4ce21;
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
        border-top: 5px solid var(--yellow);
        border-bottom: 1px solid #343434;
        background: var(--ink);
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
        color: var(--yellow);
      }

      .dp-site-link.is-active {
        border-color: var(--yellow);
        background: var(--yellow);
        color: var(--ink);
      }

      .dp-site-cart {
        border-color: var(--yellow);
        color: var(--yellow);
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
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--ink);
        border-radius: 4px;
        padding: 10px 16px;
        background: var(--yellow);
        color: var(--ink);
        text-decoration: none;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
      }

      .button:hover {
        background: var(--red);
        color: #fff;
      }

      .intro {
        padding: 44px 0 38px;
        border-bottom: 1px solid var(--line);
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--red);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
      }

      h1 {
        max-width: 720px;
        margin: 0;
        font-size: 42px;
        line-height: 1.08;
        letter-spacing: 0;
      }

      .intro-copy {
        max-width: 650px;
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.55;
      }

      .gallery-section { padding: 32px 0 64px; }

      .gallery-toolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }

      .gallery-toolbar h2 {
        margin: 0 0 5px;
        font-size: 23px;
      }

      .result-count {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
      }

      .sort-control {
        display: inline-grid;
        grid-template-columns: 1fr 1fr;
        min-width: 230px;
        border: 1px solid var(--ink);
        border-radius: 4px;
        overflow: hidden;
      }

      .sort-button {
        min-height: 40px;
        border: 0;
        border-right: 1px solid var(--ink);
        background: var(--paper);
        color: var(--ink);
        padding: 8px 12px;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .sort-button:last-child { border-right: 0; }
      .sort-button.active { background: var(--yellow); }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 360px));
        justify-content: center;
        gap: 24px;
      }

      .card {
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-top-width: 5px;
        border-radius: 6px;
        background: var(--paper);
      }

      .card.accent-0 { border-top-color: var(--red); }
      .card.accent-1 { border-top-color: var(--pink); }
      .card.accent-2 { border-top-color: var(--green); }
      .card.accent-3 { border-top-color: var(--yellow); }

      .image-wrap {
        position: relative;
        display: grid;
        place-items: center;
        aspect-ratio: 1 / 1;
        overflow: hidden;
        border-bottom: 1px solid var(--line);
        background: #efefec;
      }

      .card img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .badge {
        position: absolute;
        top: 12px;
        left: 12px;
        border: 1px solid var(--ink);
        border-radius: 3px;
        background: var(--yellow);
        color: var(--ink);
        padding: 6px 9px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .card-body {
        display: flex;
        flex: 1;
        flex-direction: column;
        padding: 18px;
      }

      .card-title {
        margin: 0;
        overflow-wrap: anywhere;
        font-size: 20px;
        line-height: 1.25;
      }

      .caption {
        min-height: 44px;
        margin: 9px 0 16px;
        color: #45443f;
        line-height: 1.45;
      }

      .specs {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.5;
      }

      .engagement {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 18px;
        margin: 14px 0 18px;
        padding-top: 13px;
        border-top: 1px solid var(--line);
        font-size: 13px;
        font-weight: 700;
      }

      .likes { color: var(--red); }
      .comments { color: var(--green); }

      .card .button {
        width: 100%;
        margin-top: auto;
      }

      .notice {
        width: min(100%, 760px);
        margin: 0 auto;
        border: 1px solid var(--line);
        border-left: 5px solid var(--yellow);
        border-radius: 4px;
        background: var(--paper);
        padding: 18px;
        color: var(--muted);
      }

      .more {
        display: flex;
        justify-content: center;
        margin-top: 30px;
      }

      .more .button { min-width: 190px; }
      .hidden { display: none; }

      @media (max-width: 680px) {
        .shell { width: min(100% - 28px, 1220px); }
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
          background: var(--ink);
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
          border: 1px solid var(--yellow);
          background: transparent;
          color: var(--yellow);
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
        .intro { padding: 30px 0 28px; }
        h1 { font-size: 32px; }
        .intro-copy { font-size: 15px; }
        .gallery-section { padding: 24px 0 44px; }
        .gallery-toolbar { display: block; }
        .sort-control { width: 100%; margin-top: 16px; }
        .grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
        .card { width: 100%; }
      }

      @media (max-width: 390px) {
        h1 { font-size: 29px; }
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

    <div class="shell">
      <main>
        <section class="intro">
          <p class="eyebrow">Community Gallery</p>
          <h1>Built by the DooPixel community.</h1>
          <p class="intro-copy">
            Discover finished pixel art, see every color and piece used, or make the design your own.
          </p>
        </section>

        <section class="gallery-section">
          <div class="gallery-toolbar">
            <div>
              <h2>Community Builds</h2>
              <p id="result-count" class="result-count">Loading builds...</p>
            </div>
            <div class="sort-control" role="group" aria-label="Sort gallery">
              <button class="sort-button active" type="button" data-sort="newest">Newest</button>
              <button class="sort-button" type="button" data-sort="popular">Most Liked</button>
            </div>
          </div>

          <div id="loading" class="notice">Loading community builds...</div>
          <div id="empty" class="notice hidden">No approved builds have been shared yet.</div>
          <div id="grid" class="grid hidden"></div>
          <div id="more" class="more hidden">
            <button id="load-more" class="button" type="button">Load More Builds</button>
          </div>
        </section>
      </main>
    </div>

    <script>
      const loading = document.getElementById("loading");
      const empty = document.getElementById("empty");
      const grid = document.getElementById("grid");
      const more = document.getElementById("more");
      const loadMoreButton = document.getElementById("load-more");
      const resultCount = document.getElementById("result-count");
      const sortButtons = Array.from(document.querySelectorAll("[data-sort]"));
      let currentPage = 1;
      let currentSort = "newest";
      let loadedCount = 0;

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

      function plural(value, singular, pluralValue) {
        return value === 1 ? singular : pluralValue;
      }

      function createCard(design, index) {
        const card = document.createElement("article");
        card.className = "card accent-" + (index % 4);

        const imageWrap = document.createElement("div");
        imageWrap.className = "image-wrap";
        const image = document.createElement("img");
        image.alt = design.title + " finished build";
        image.loading = "lazy";
        image.src = "/api/images?key=" + encodeURIComponent(design.finishedImageKey);
        imageWrap.appendChild(image);

        if (design.isPinned) {
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = "Featured";
          imageWrap.appendChild(badge);
        }
        card.appendChild(imageWrap);

        const body = document.createElement("div");
        body.className = "card-body";

        const title = document.createElement("h3");
        title.className = "card-title";
        title.textContent = design.title;
        body.appendChild(title);

        const caption = document.createElement("p");
        caption.className = "caption";
        caption.textContent = design.customerCaption || "Shared by a DooPixel builder.";
        body.appendChild(caption);

        const specs = document.createElement("p");
        specs.className = "specs";
        specs.textContent =
          design.size.join(" x ") +
          " pixels | " +
          Number(design.totalPieces).toLocaleString() +
          " pieces | " +
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
        link.href = "/share/" + encodeURIComponent(design.id);
        link.textContent = "View Design & Pieces";
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

      async function loadGallery(page) {
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = "Loading...";
        try {
          const response = await fetch(
            "/api/gallery?page=" + page + "&sort=" + encodeURIComponent(currentSort)
          );
          const result = await response.json();
          if (!response.ok || !result.ok) {
            throw new Error(result.error || "Could not load the gallery.");
          }

          loading.classList.add("hidden");
          if (page === 1 && !result.designs.length) {
            empty.classList.remove("hidden");
            resultCount.textContent = "No published builds yet";
            return;
          }

          result.designs.forEach((design, index) => {
            grid.appendChild(createCard(design, loadedCount + index));
          });
          loadedCount += result.designs.length;
          currentPage = page;
          resultCount.textContent =
            "Showing " +
            loadedCount.toLocaleString() +
            " of " +
            Number(result.total).toLocaleString() +
            " published " +
            plural(result.total, "build", "builds");
          grid.classList.remove("hidden");
          more.classList.toggle("hidden", !result.hasMore);
        } catch (error) {
          loading.textContent = error.message;
          loading.classList.remove("hidden");
        } finally {
          loadMoreButton.disabled = false;
          loadMoreButton.textContent = "Load More Builds";
        }
      }

      function resetGallery(sort) {
        currentSort = sort;
        currentPage = 1;
        loadedCount = 0;
        grid.innerHTML = "";
        grid.classList.add("hidden");
        empty.classList.add("hidden");
        more.classList.add("hidden");
        loading.textContent = "Loading community builds...";
        loading.classList.remove("hidden");
        resultCount.textContent = "Loading builds...";
        updateSortButtons();
        loadGallery(1);
      }

      sortButtons.forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.sort !== currentSort) {
            resetGallery(button.dataset.sort);
          }
        });
      });

      loadMoreButton.addEventListener("click", () => loadGallery(currentPage + 1));
      setupSiteNavigation();
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
