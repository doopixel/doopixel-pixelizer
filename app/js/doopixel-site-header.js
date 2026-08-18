(function setupDooPixelSiteHeader() {
  function initialize() {
    const button = document.querySelector(".dp-site-menu-button");
    const links = document.getElementById("dp-site-links");
    if (!button || !links || button.dataset.headerReady === "true") return;

    if (!links.querySelector('a[href*="/parts-import"]')) {
      const matchingParts = document.createElement("a");
      matchingParts.className = "dp-site-link";
      matchingParts.href = "https://pixelizer.doopixel.com/parts-import/";
      matchingParts.textContent = "Matching Parts";
      const projectLink = links.querySelector('a[href*="/find-project"]');
      links.insertBefore(matchingParts, projectLink || null);
    }

    button.dataset.headerReady = "true";
    function setOpen(isOpen) {
      links.classList.toggle("is-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    }

    button.addEventListener("click", function () {
      setOpen(!links.classList.contains("is-open"));
    });
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".dp-site-nav")) setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
