(function setupDooPixelSiteFooter() {
  const mount = document.querySelector("[data-doopixel-footer]");
  if (!mount) return;

  const logoUrl = "https://cdn.shopify.com/s/files/1/0655/4953/3297/files/logo111.png?v=1788088003";
  const year = new Date().getFullYear();
  document.body.classList.add("dp-site-footer-page");

  mount.outerHTML = `
    <footer class="dp-site-footer">
      <div class="dp-site-footer__inner">
        <div class="dp-site-footer__brand">
          <a class="dp-site-footer__logo" href="https://mypixelwalls.com/" aria-label="My Pixel Walls home">
            <img src="${logoUrl}" alt="My Pixel Walls" loading="lazy" />
          </a>
          <p class="dp-site-footer__summary">Brick pixel art that turns your favorite images into unique wall décor.</p>
        </div>

        <div class="dp-site-footer__connect">
          <form class="dp-site-footer__newsletter" action="https://mypixelwalls.com/contact#contact_form" method="post">
            <input type="hidden" name="form_type" value="customer" />
            <input type="hidden" name="utf8" value="✓" />
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <label class="dp-site-footer__visually-hidden" for="dp-site-footer-email">Email address</label>
            <input id="dp-site-footer-email" type="email" name="contact[email]" autocomplete="email" placeholder="Your email address" required />
            <button type="submit" aria-label="Subscribe to newsletter">→</button>
          </form>

          <p class="dp-site-footer__contact">Questions? <a href="mailto:support@mypixelwalls.com">support@mypixelwalls.com</a></p>
        </div>

        <div class="dp-site-footer__links">
          <nav aria-label="Shop">
            <h2>Shop</h2>
            <a href="https://mypixelwalls.com/collections/brick-art">Shop Pixel Art</a>
            <a href="https://pixelizer.doopixel.com/">Create My Art</a>
            <a href="https://pixelizer.doopixel.com/gallery">Community Gallery</a>
            <a href="https://mypixelwalls.com/collections/brick-parts">Brick Parts</a>
          </nav>
          <nav aria-label="Help">
            <h2>Help</h2>
            <a href="https://mypixelwalls.com/policies/contact-information">Contact Us</a>
            <a href="https://mypixelwalls.com/policies/privacy-policy">Privacy Policy</a>
            <a href="https://mypixelwalls.com/policies/refund-policy">Return &amp; Refund Policy</a>
            <a href="https://mypixelwalls.com/policies/shipping-policy">Shipping Policy</a>
            <a href="https://mypixelwalls.com/policies/terms-of-service">Terms of Service</a>
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
          <span>&copy; ${year} My Pixel Walls</span>
          <span>Turn bricks into wall art.</span>
        </div>
      </div>
    </footer>`;

  const footer = document.querySelector(".dp-site-footer");
  if (footer && footer.parentElement !== document.body) document.body.appendChild(footer);
})();
