(function setupDooPixelSiteHeader() {
  const LOGO_URL = "https://cdn.shopify.com/s/files/1/0655/4953/3297/files/logo111.png?v=1788088003";
  const SHOPIFY_ORIGIN = "https://mypixelwalls.com";

  const searchIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5"></circle>
      <path d="m16 16 4.25 4.25"></path>
    </svg>`;

  function updateCartCount(count) {
    const normalized = Math.max(0, Number(count) || 0);
    document.querySelectorAll("[data-dp-cart-count]").forEach(function (badge) {
      badge.textContent = normalized > 99 ? "99+" : String(normalized);
      badge.hidden = false;
    });
    document.querySelectorAll(".dp-site-cart-icon").forEach(function (link) {
      link.setAttribute("aria-label", "Shopping cart, " + normalized + (normalized === 1 ? " item" : " items"));
    });
  }

  async function refreshCartCount() {
    try {
      const response = await fetch(SHOPIFY_ORIGIN + "/cart.js", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      const cart = await response.json();
      updateCartCount(cart.item_count);
    } catch (_error) {
      // Shopify may reject cross-origin cart reads; do not display an unverified count.
    }
  }

  function initialize() {
    const wrap = document.querySelector(".dp-site-nav-wrap");
    const nav = wrap && wrap.querySelector(".dp-site-nav");
    const button = nav && nav.querySelector(".dp-site-menu-button");
    const links = document.getElementById("dp-site-links");
    const cart = nav && nav.querySelector(".dp-site-cart-icon");
    if (!wrap || !nav || !button || !links || !cart || button.dataset.headerReady === "true") return;

    button.dataset.headerReady = "true";

    wrap.querySelectorAll(".dp-site-logo img").forEach(function (logo) {
      logo.src = LOGO_URL;
      logo.removeAttribute("srcset");
      logo.alt = "My Pixel Walls";
      logo.parentElement.href = SHOPIFY_ORIGIN + "/";
    });

    if (!wrap.querySelector(".dp-site-topbar")) {
      const topbar = document.createElement("div");
      topbar.className = "dp-site-topbar";
      topbar.setAttribute("role", "note");
      topbar.innerHTML = `
        <span class="dp-site-topbar__dot" aria-hidden="true"></span>
        <strong>Turn Bricks Into Wall Art</strong>`;
      wrap.insertBefore(topbar, nav);
    }

    links.querySelectorAll('a[href*="/parts-import"], a[href*="/find-project"]').forEach(function (link) {
      link.remove();
    });

    let drawerHeader = links.querySelector(".dp-site-drawer-header");
    if (!drawerHeader) {
      drawerHeader = document.createElement("div");
      drawerHeader.className = "dp-site-drawer-header";
      drawerHeader.innerHTML = `
        <a href="${SHOPIFY_ORIGIN}/" class="dp-site-drawer-logo" aria-label="My Pixel Walls shop">
          <img src="${LOGO_URL}" alt="My Pixel Walls" />
        </a>
        <span class="dp-site-drawer-label">Menu</span>
        <button class="dp-site-drawer-close" type="button" aria-label="Close navigation menu">×</button>`;
      links.insertBefore(drawerHeader, links.firstChild);
    }

    let overlay = wrap.querySelector(".dp-site-menu-overlay");
    if (!overlay) {
      overlay = document.createElement("button");
      overlay.className = "dp-site-menu-overlay";
      overlay.type = "button";
      overlay.setAttribute("aria-label", "Close navigation menu");
      wrap.appendChild(overlay);
    }

    let actions = nav.querySelector(".dp-site-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "dp-site-actions";
      cart.insertAdjacentElement("beforebegin", actions);
    }

    let searchButton = actions.querySelector(".dp-site-search-button");
    if (!searchButton) {
      searchButton = document.createElement("button");
      searchButton.className = "dp-site-search-button";
      searchButton.type = "button";
      searchButton.setAttribute("aria-label", "Search My Pixel Walls shop");
      searchButton.setAttribute("aria-expanded", "false");
      searchButton.setAttribute("aria-controls", "dp-site-search-panel");
      searchButton.innerHTML = searchIcon;
      actions.insertBefore(searchButton, actions.firstChild);
    }

    if (cart.parentElement !== actions) actions.appendChild(cart);

    if (!cart.querySelector("[data-dp-cart-count]")) {
      const count = document.createElement("span");
      count.className = "dp-site-cart-count";
      count.dataset.dpCartCount = "";
      count.textContent = "0";
      count.hidden = true;
      cart.appendChild(count);
    }
    cart.querySelectorAll("[data-dp-cart-count]").forEach(function (count) { count.hidden = true; });

    let searchPanel = wrap.querySelector("#dp-site-search-panel");
    if (!searchPanel) {
      searchPanel = document.createElement("div");
      searchPanel.className = "dp-site-search-panel";
      searchPanel.id = "dp-site-search-panel";
      searchPanel.hidden = true;
      searchPanel.innerHTML = `
        <button class="dp-site-search-backdrop" type="button" aria-label="Close search"></button>
        <section class="dp-site-search-dialog" role="dialog" aria-modal="true" aria-labelledby="dp-site-search-title">
          <div class="dp-site-search-heading">
            <div>
              <span>Find Your Next Build</span>
              <h2 id="dp-site-search-title">Search My Pixel Walls</h2>
            </div>
            <button class="dp-site-search-close" type="button" aria-label="Close search">×</button>
          </div>
          <form action="${SHOPIFY_ORIGIN}/search" method="get" role="search">
            <input type="hidden" name="type" value="product" />
            <label class="dp-site-visually-hidden" for="dp-site-search-input">Search products</label>
            <input id="dp-site-search-input" name="q" type="search" autocomplete="off" placeholder="Search pixel art and pieces" required />
            <button type="submit" aria-label="Submit search">${searchIcon}</button>
          </form>
        </section>`;
      wrap.appendChild(searchPanel);
    }

    const searchInput = searchPanel.querySelector("#dp-site-search-input");

    function setMenuOpen(isOpen) {
      links.classList.toggle("is-open", isOpen);
      overlay.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("dp-site-menu-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    }

    function setSearchOpen(isOpen) {
      searchPanel.hidden = !isOpen;
      document.body.classList.toggle("dp-site-search-open", isOpen);
      searchButton.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) window.setTimeout(function () { searchInput.focus(); }, 20);
    }

    button.addEventListener("click", function () {
      setSearchOpen(false);
      setMenuOpen(!links.classList.contains("is-open"));
    });
    links.querySelector(".dp-site-drawer-close").addEventListener("click", function () { setMenuOpen(false); });
    overlay.addEventListener("click", function () { setMenuOpen(false); });
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenuOpen(false);
    });

    searchButton.addEventListener("click", function () {
      setMenuOpen(false);
      setSearchOpen(true);
    });
    searchPanel.querySelector(".dp-site-search-close").addEventListener("click", function () { setSearchOpen(false); });
    searchPanel.querySelector(".dp-site-search-backdrop").addEventListener("click", function () { setSearchOpen(false); });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    });

    refreshCartCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
