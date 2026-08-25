(function setupDooPixelSiteFooter() {
  const mount = document.querySelector("[data-doopixel-footer]");
  if (!mount) return;

  const logoUrl = "https://cdn.shopify.com/s/files/1/0738/7562/0006/files/logo3.png?v=1787501605";
  const year = new Date().getFullYear();
  document.body.classList.add("dp-site-footer-page");

  mount.outerHTML = `
    <footer class="dp-site-footer">
      <div class="dp-site-footer__inner">
        <div class="dp-site-footer__brand">
          <a class="dp-site-footer__logo" href="https://doopixel.com/" aria-label="DooPixel home">
            <img src="${logoUrl}" alt="DooPixel" width="520" height="134" loading="lazy" />
          </a>
          <p class="dp-site-footer__summary">Fresh pixel art, creative ideas, and offers—occasionally.</p>
        </div>

        <div class="dp-site-footer__connect">
          <form class="dp-site-footer__newsletter" action="https://doopixel.com/contact#contact_form" method="post">
            <input type="hidden" name="form_type" value="customer" />
            <input type="hidden" name="utf8" value="✓" />
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <label class="dp-site-footer__visually-hidden" for="dp-site-footer-email">Email address</label>
            <input id="dp-site-footer-email" type="email" name="contact[email]" autocomplete="email" placeholder="Your email address" required />
            <button type="submit" aria-label="Subscribe to newsletter">→</button>
          </form>

          <div class="dp-site-footer__social">
            <a href="https://www.facebook.com/doopixel" aria-label="Visit DooPixel on Facebook">
              <span aria-hidden="true">f</span>
              <strong>Follow on Facebook</strong>
              <i aria-hidden="true">↗</i>
            </a>
          </div>
        </div>

        <div class="dp-site-footer__links">
          <nav aria-label="Shop">
            <h2>Shop</h2>
            <a href="https://pixelizer.doopixel.com/">Upload Images</a>
            <a href="https://pixelizer.doopixel.com/gallery">Gallery &amp; Shop</a>
            <a href="https://pixelizer.doopixel.com/parts-import/">Matching Parts</a>
            <a href="https://pixelizer.doopixel.com/find-project">Find My Project</a>
            <a href="https://doopixel.com/pages/contact">Contact</a>
          </nav>
          <nav aria-label="Help">
            <h2>Help</h2>
            <a href="https://doopixel.com/policies/shipping-policy">Shipping Policy</a>
            <a href="https://doopixel.com/policies/refund-policy">Refund Policy</a>
            <a href="https://doopixel.com/policies/privacy-policy">Privacy Policy</a>
            <a href="https://doopixel.com/policies/terms-of-service">Terms of Service</a>
            <a href="https://doopixel.com/policies/legal-notice">Legal Notice</a>
          </nav>
        </div>

        <div class="dp-site-footer__payments" aria-label="Accepted payment methods">
          <strong>Secure payments</strong>
          <div class="dp-site-footer__payment-list" role="list">
            <span class="is-visa" role="listitem">VISA</span>
            <span class="is-mastercard" role="listitem"><i></i><i></i><b>Mastercard</b></span>
            <span class="is-amex" role="listitem">AMEX</span>
            <span class="is-paypal" role="listitem">PayPal</span>
            <span class="is-apple" role="listitem">● Pay</span>
            <span class="is-shop" role="listitem">shop</span>
          </div>
        </div>

        <div class="dp-site-footer__bottom">
          <span>&copy; ${year} DooPixel</span>
          <span>Build your imagination.</span>
        </div>
      </div>
    </footer>`;

  const footer = document.querySelector(".dp-site-footer");
  if (footer && footer.parentElement !== document.body) document.body.appendChild(footer);
})();
