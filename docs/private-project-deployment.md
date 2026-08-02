# Private projects and building instructions

Deploy this feature to a preview branch first. Do not deploy the application code before the D1 migration has been applied.

## 1. Apply the D1 migration

In Cloudflare Dashboard, open the D1 database bound to this Pages project as `DB`, open Console, and run:

`migrations/0001_private_projects.sql`

The migration adds private projects, hashed access tokens, order lookup rate limits, and webhook deduplication. It does not modify existing design, Gallery, like, or comment data.

## 2. Configure Cloudflare variables

Add these production and preview environment variables to the Pages project:

- `SHOPIFY_WEBHOOK_SECRET`: Shopify's webhook signing secret.
- `SHOPIFY_STORE_DOMAIN`: the store's permanent `*.myshopify.com` domain, not `doopixel.com`.
- `ORDER_LOOKUP_PEPPER`: a randomly generated secret of at least 32 characters.

Keep the existing `DB` and `DESIGN_IMAGES` bindings.

After changing bindings or variables, trigger a new deployment.

## 3. Update the Shopify add-kit page

Replace the Custom Liquid on `/pages/add-pixel-kit` with:

`shopify/add-pixel-kit-custom-liquid.liquid`

The new version adds four private line item properties:

- `_DooPixel Design ID`
- `_DooPixel Project ID`
- `_DooPixel Project Token`
- `_DooPixel Project URL`

They are required for order matching and are hidden from the storefront cart UI.

## 4. Create the Shopify order webhook

In Shopify Admin, go to **Settings > Notifications > Webhooks > Create webhook**.

- Event: `Order creation`
- Format: `JSON`
- URL: `https://doopixel-pixelizer.pages.dev/api/shopify/orders-create`
- API version: the current stable version offered by Shopify

Use the stable Pages production hostname, not a hash-prefixed preview URL. Send a test webhook after saving it. A generic Shopify test payload might report zero updated projects; the full COD test below verifies the actual line item properties.

## 5. Update the order confirmation email

In Shopify Admin, go to **Settings > Notifications > Customer notifications > Order confirmation > Edit code**.

Insert `shopify/order-confirmation-project-links.liquid` after the order items section. Send a preview email before saving the production template.

## 6. End-to-end COD test

1. Create a new image in the Pixel Art Maker.
2. Add the custom kit to cart.
3. Confirm these private properties exist in `/cart.js`.
4. Place a COD order using a real test email address.
5. Open the project link from the order email.
6. Confirm the project is `ordered` and instructions download successfully.
7. Compare the downloaded instructions with a PDF generated directly in the Pixel Art Maker.
8. Submit a finished-build test image from the private project page.
9. Confirm the public `/share/...` page has no finished-build upload form.
10. Recover the project at `/find-project` using the order number and checkout email.

Order lookup requires a checkout email. Orders without an email are still confirmed by the webhook, but cannot be recovered through `/find-project`.

## Rollback

If a preview test fails, restore the previous Shopify Custom Liquid and email notification template. The new D1 tables can remain unused; they do not change existing Gallery behavior.
