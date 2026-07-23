function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function onRequestGet({ params }) {
  const id = escapeHtml(String(params.id || "").toUpperCase());

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DooPixel Shared Design ${id}</title>
    <style>
      :root {
        color-scheme: light;
        --text: #191919;
        --muted: #666;
        --line: #ddd;
        --soft: #f6f6f6;
        --accent: #111;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: var(--text);
        background: #fff;
      }

      .wrap {
        max-width: 1080px;
        margin: 0 auto;
        padding: 28px 18px 48px;
      }

      header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
        border-bottom: 1px solid var(--line);
        padding-bottom: 18px;
        margin-bottom: 24px;
      }

      h1 {
        font-size: 28px;
        line-height: 1.2;
        margin: 0 0 8px;
      }

      p {
        line-height: 1.5;
      }

      .muted {
        color: var(--muted);
        margin: 0;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
        gap: 28px;
        align-items: start;
      }

      .preview {
        width: 100%;
        border: 1px solid var(--line);
        background: var(--soft);
        image-rendering: pixelated;
      }

      .panel {
        border: 1px solid var(--line);
        padding: 16px;
      }

      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 14px;
        margin: 0 0 16px;
        font-size: 14px;
      }

      .meta dt {
        color: var(--muted);
      }

      .meta dd {
        margin: 0;
        font-weight: 600;
      }

      button,
      .button {
        appearance: none;
        border: 1px solid var(--accent);
        background: var(--accent);
        color: #fff;
        padding: 12px 16px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }

      button.secondary {
        background: #fff;
        color: var(--accent);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 18px;
        font-size: 14px;
      }

      th,
      td {
        border-bottom: 1px solid var(--line);
        padding: 9px 6px;
        text-align: left;
        vertical-align: middle;
      }

      th:last-child,
      td:last-child {
        text-align: right;
      }

      .swatch {
        width: 18px;
        height: 18px;
        border: 1px solid #999;
        display: inline-block;
        vertical-align: middle;
        margin-right: 8px;
      }

      form {
        display: grid;
        gap: 10px;
        margin-top: 22px;
      }

      input,
      textarea {
        width: 100%;
        border: 1px solid var(--line);
        padding: 10px;
        font: inherit;
      }

      textarea {
        min-height: 90px;
        resize: vertical;
      }

      .notice {
        margin-top: 14px;
        padding: 12px;
        background: var(--soft);
        border: 1px solid var(--line);
      }

      .hidden {
        display: none;
      }

      @media (max-width: 760px) {
        header,
        .grid {
          display: block;
        }

        .panel {
          margin-top: 18px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1 id="design-title">DooPixel Design</h1>
          <p class="muted" id="design-subtitle">${id}</p>
        </div>
        <a class="button" href="/">Create Your Own</a>
      </header>

      <main id="loading">
        <p>Loading design...</p>
      </main>

      <main id="content" class="grid hidden">
        <section>
          <img id="preview" class="preview hidden" alt="Pixel art preview" />
          <div id="no-preview" class="notice hidden">Preview image is not available yet.</div>

          <h2>Required Pieces</h2>
          <table>
            <thead>
              <tr>
                <th>Color</th>
                <th>SKU</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody id="parts-body"></tbody>
          </table>
        </section>

        <aside class="panel">
          <dl class="meta">
            <dt>Design ID</dt>
            <dd id="meta-id"></dd>
            <dt>Size</dt>
            <dd id="meta-size"></dd>
            <dt>Piece</dt>
            <dd id="meta-piece"></dd>
            <dt>Total Pieces</dt>
            <dd id="meta-total"></dd>
          </dl>

          <label for="share-frame-color" style="display: block; font-weight: 700; margin-bottom: 6px;">
            Frame Color
          </label>
          <select id="share-frame-color" style="margin-bottom: 10px;">
            <option value="black" selected>Black Frame</option>
            <option value="white">White Frame</option>
          </select>

          <button id="add-to-cart">Add Custom Kit to Cart</button>

          <form id="submit-form">
            <h2>Share Your Finished Build</h2>
            <input type="file" id="finished-image" name="finishedImage" accept="image/png,image/jpeg,image/webp" required />
            <textarea id="caption" name="caption" maxlength="500" placeholder="Add a short note about your build"></textarea>
            <button class="secondary" type="submit">Submit to Gallery Review</button>
          </form>

          <div id="message" class="notice hidden"></div>
        </aside>
      </main>
    </div>

    <script>
      const DESIGN_ID = ${JSON.stringify(id)};
      const SHOPIFY_ADD_KIT_URL = "https://doopixel.com/pages/add-pixel-kit";
      let currentDesign = null;

      function encodePayload(payload) {
        const json = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(json);
        let binary = "";
        bytes.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        return btoa(binary);
      }

      function showMessage(message) {
        const el = document.getElementById("message");
        el.textContent = message;
        el.classList.remove("hidden");
      }

      function getBaseplateInfo(size) {
        const baseplateWidth = Math.ceil(Number(size[0]) / 16);
        const baseplateHeight = Math.ceil(Number(size[1]) / 16);
        const pricingWidth = Math.min(baseplateWidth, baseplateHeight);
        const pricingHeight = Math.max(baseplateWidth, baseplateHeight);

        return {
          baseplateWidth: baseplateWidth,
          baseplateHeight: baseplateHeight,
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
          shareUrl: window.location.href,
          name: design.title,
          pieceType: design.pieceType,
          pieceTypeName: design.pieceTypeName,
          frameColor: frameColor,
          frameLabel: frameLabel,
          shopifyKitSku: baseplateInfo.shopifyKitSku,
          size: design.size,
          baseplateWidth: baseplateInfo.baseplateWidth,
          baseplateHeight: baseplateInfo.baseplateHeight,
          baseplateLayout: baseplateInfo.baseplateLayout,
          pricingBaseplateWidth: baseplateInfo.pricingBaseplateWidth,
          pricingBaseplateHeight: baseplateInfo.pricingBaseplateHeight,
          pricingLayout: baseplateInfo.pricingLayout,
          totalBaseplates: baseplateInfo.totalBaseplates,
          totalPieces: totalPieces,
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

      function renderDesign(design) {
        currentDesign = design;
        document.getElementById("design-title").textContent = design.title;
        document.getElementById("design-subtitle").textContent = design.id;
        document.getElementById("meta-id").textContent = design.id;
        document.getElementById("meta-size").textContent = design.size[0] + " x " + design.size[1];
        document.getElementById("meta-piece").textContent = design.pieceTypeName;

        const total = design.parts.reduce((sum, part) => sum + Number(part.quantity), 0);
        document.getElementById("meta-total").textContent = total;

        if (design.previewImageKey) {
          const preview = document.getElementById("preview");
          preview.src = "/api/images?key=" + encodeURIComponent(design.previewImageKey);
          preview.classList.remove("hidden");
        } else {
          document.getElementById("no-preview").classList.remove("hidden");
        }

        const partsBody = document.getElementById("parts-body");
        partsBody.innerHTML = "";
        design.parts.forEach((part) => {
          const row = document.createElement("tr");
          row.innerHTML =
            '<td><span class="swatch" style="background:' +
            part.hex +
            '"></span>' +
            part.doopixelNo +
            " - " +
            part.colorName +
            "</td><td>" +
            part.sku +
            "</td><td>" +
            part.quantity +
            "</td>";
          partsBody.appendChild(row);
        });

        document.getElementById("loading").classList.add("hidden");
        document.getElementById("content").classList.remove("hidden");
      }

      async function loadDesign() {
        const response = await fetch("/api/designs/" + encodeURIComponent(DESIGN_ID));
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Could not load design.");
        }
        renderDesign(result.design);
      }

      document.getElementById("add-to-cart").addEventListener("click", () => {
        if (!currentDesign) {
          return;
        }

        const encoded = encodeURIComponent(encodePayload(getSharePayload(currentDesign)));
        window.location.href = SHOPIFY_ADD_KIT_URL + "#" + encoded;
      });

      document.getElementById("submit-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData();
        const file = document.getElementById("finished-image").files[0];
        const caption = document.getElementById("caption").value;
        form.append("finishedImage", file);
        form.append("caption", caption);

        const response = await fetch("/api/designs/" + encodeURIComponent(DESIGN_ID) + "/submit", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Could not submit this build.");
        }

        showMessage("Submitted. Your build is now pending review.");
      });

      loadDesign().catch((error) => {
        document.getElementById("loading").innerHTML = "<p>" + error.message + "</p>";
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
