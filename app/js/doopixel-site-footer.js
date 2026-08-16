(function () {
  const mount = document.querySelector("[data-doopixel-footer]");
  if (!mount) return;

  document.body.classList.add("dp-site-footer-page");
  const year = new Date().getFullYear();
  mount.outerHTML = `
    <footer class="dp-site-footer">
      <div class="dp-site-footer__inner">
        <div class="dp-site-footer__brand">
          <a class="dp-site-footer__logo" href="https://doopixel.com/" aria-label="DooPixel home">
            <img src="https://cdn.shopify.com/s/files/1/0738/7562/0006/files/20260408-001830.png?v=1775578807" alt="DooPixel" width="397" height="102" />
          </a>
          <p class="dp-site-footer__summary">Turn your photos into buildable pixel art, then get the exact pieces and instructions you need.</p>
        </div>
        <nav aria-label="Create with DooPixel">
          <h2 class="dp-site-footer__heading">Create</h2>
          <ul class="dp-site-footer__links">
            <li><a href="https://pixelizer.doopixel.com/">Upload Images</a></li>
            <li><a href="https://pixelizer.doopixel.com/gallery">Gallery &amp; Shop</a></li>
            <li><a href="https://pixelizer.doopixel.com/find-project">Find My Project</a></li>
          </ul>
        </nav>
        <nav aria-label="DooPixel support">
          <h2 class="dp-site-footer__heading">Help</h2>
          <ul class="dp-site-footer__links">
            <li><a href="https://doopixel.com/pages/contact">Contact Us</a></li>
            <li><a href="https://doopixel.com/policies/shipping-policy">Shipping Policy</a></li>
            <li><a href="https://doopixel.com/policies/refund-policy">Refund Policy</a></li>
          </ul>
        </nav>
      </div>
      <div class="dp-site-footer__bottom">
        <p class="dp-site-footer__copyright">&copy; ${year} DooPixel. All rights reserved.</p>
        <nav class="dp-site-footer__legal" aria-label="Legal">
          <a href="https://doopixel.com/policies/privacy-policy">Privacy Policy</a>
          <a href="https://doopixel.com/policies/terms-of-service">Terms of Service</a>
          <a href="https://doopixel.com/policies/legal-notice">Legal Notice</a>
        </nav>
      </div>
    </footer>`;

  const footer = document.querySelector(".dp-site-footer");
  if (footer && footer.parentElement !== document.body) {
    document.body.appendChild(footer);
  }
})();
