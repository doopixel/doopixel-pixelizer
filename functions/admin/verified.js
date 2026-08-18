export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Add DooPixel Verified Design</title>
    <style>
      :root {
        color-scheme: light;
        --text: #181818;
        --muted: #666;
        --line: #d8d8d8;
        --soft: #f7f7f5;
        --red: #d4141a;
        --green: #247f35;
        --yellow: #f4ce21;
      }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--text); background: #fff; font-family: Arial, Helvetica, sans-serif; }
      .wrap { width: min(100% - 36px, 1120px); margin: 0 auto; padding: 28px 0 60px; }
      header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
      h1 { margin: 0 0 6px; font-size: 28px; }
      h2 { margin: 0 0 16px; font-size: 20px; }
      p { line-height: 1.5; }
      .muted { margin: 0; color: var(--muted); }
      .nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
      .nav a { color: #111; font-weight: 700; }
      .login { display: flex; gap: 8px; }
      input, select, textarea, button { min-height: 42px; border: 1px solid var(--line); border-radius: 0; background: #fff; color: var(--text); padding: 9px 11px; font: inherit; }
      input[type="file"] { width: 100%; padding: 7px; }
      textarea { width: 100%; min-height: 92px; resize: vertical; }
      button { cursor: pointer; font-weight: 700; }
      button.primary { border-color: #111; background: #111; color: #fff; }
      button.danger { border-color: #b32a2a; color: #a21f1f; }
      button.danger span[aria-hidden="true"] { display: none; }
      button:disabled { cursor: wait; opacity: .55; }
      .form { margin-top: 24px; }
      .section { margin-bottom: 18px; border: 1px solid var(--line); padding: 18px; }
      .field { display: grid; gap: 7px; }
      .field label { font-size: 14px; font-weight: 700; }
      .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      .field.full { grid-column: 1 / -1; }
      .help { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
      .piece-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 12px; }
      .piece-head h2 { margin: 0; }
      .parts { display: grid; gap: 8px; }
      .part-row { display: grid; grid-template-columns: 190px minmax(0, 1fr) 120px 90px; gap: 8px; align-items: center; }
      .part-row select, .part-row input { width: 100%; min-width: 0; }
      .part-color { display: grid; gap: 8px; min-width: 0; }
      .catalog-color { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .catalog-color select { flex: 1; min-width: 0; }
      .custom-color-fields { display: grid; grid-template-columns: 110px minmax(140px, 1fr) 110px; gap: 7px; }
      .custom-color-fields input { width: 100%; min-width: 0; }
      .swatch { display: inline-block; flex: 0 0 18px; width: 18px; height: 18px; border: 1px solid #aaa; }
      .summary { margin: 12px 0 0; color: var(--muted); font-size: 14px; }
      .actions { display: flex; justify-content: flex-end; gap: 10px; }
      .actions .primary { min-width: 220px; }
      .notice { margin-top: 18px; border: 1px solid var(--line); border-left: 4px solid var(--yellow); background: var(--soft); padding: 14px; }
      .notice.success { border-left-color: var(--green); }
      .notice.error { border-left-color: var(--red); }
      .notice a { color: #111; font-weight: 700; }
      .hidden { display: none; }
      @media (max-width: 680px) {
        .wrap { width: min(100% - 24px, 1120px); padding-top: 20px; }
        header { display: block; }
        .login { margin-top: 16px; }
        .login input { width: 100%; min-width: 0; }
        .fields { grid-template-columns: 1fr; }
        .field.full { grid-column: auto; }
        .part-row { grid-template-columns: minmax(0, 1fr) 78px 44px; }
        .part-row > .piece-type-select { grid-column: 1 / -1; }
        .custom-color-fields { grid-template-columns: 1fr; }
        .remove-label { display: none; }
        button.danger span[aria-hidden="true"] { display: inline; }
        .section { padding: 14px; }
        .actions, .actions .primary { width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Add DooPixel Verified Design</h1>
          <p class="muted">Publish an existing build with its required pieces and PDF instructions.</p>
          <nav class="nav">
            <a href="/admin/verified">Add Verified Design</a>
            <a href="/admin/review">Artwork Review</a>
            <a href="/admin/comments">Comment Review</a>
            <a href="/admin/parts-imports">Parts Picking</a>
            <a href="/gallery" target="_blank" rel="noopener">Open Gallery</a>
          </nav>
        </div>
        <form id="login" class="login">
          <input id="token" type="password" autocomplete="current-password" placeholder="Admin password" required />
          <button class="primary" type="submit">Open Form</button>
        </form>
      </header>

      <form id="verified-form" class="form hidden">
        <section class="section">
          <h2>Design Details</h2>
          <div class="fields">
            <div class="field full">
              <label for="title">Public title</label>
              <input id="title" name="title" maxlength="120" required />
            </div>
            <div class="field full">
              <label for="caption">Short public description</label>
              <textarea id="caption" name="caption" maxlength="500" required></textarea>
            </div>
            <div class="field">
              <label>Baseplate layout</label>
              <p id="layout-summary" class="help">3 x 3 baseplates</p>
            </div>
            <div class="field">
              <label for="width">Artwork width</label>
              <select id="width" name="width"></select>
            </div>
            <div class="field">
              <label for="height">Artwork height</label>
              <select id="height" name="height"></select>
            </div>
            <div class="field">
              <label for="artwork-images">Gallery photos</label>
              <input id="artwork-images" name="artworkImages" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
              <p id="artwork-image-help" class="help">Choose up to 6 photos. The first photo is the Gallery cover. Large photos are optimized before upload.</p>
            </div>
            <div class="field">
              <label for="instructions-pdf">Building instructions</label>
              <input id="instructions-pdf" name="instructionsPdf" type="file" accept="application/pdf,.pdf" required />
              <p class="help">Compressed PDF. Maximum 25 MB.</p>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="piece-head">
            <h2>Required Pieces</h2>
            <button id="add-color" type="button">Add Color</button>
          </div>
          <p class="help">Choose a catalog color, or select Custom Color to enter a warehouse number, color name, and display color for this design only.</p>
          <div id="parts" class="parts"></div>
          <p id="parts-summary" class="summary">0 colors · 0 pieces</p>
        </section>

        <div class="actions">
          <button id="publish" class="primary" type="submit">Publish to Gallery</button>
        </div>
      </form>
      <div id="message" class="notice hidden" aria-live="polite"></div>
    </div>

    <script src="/js/doopixel-image-upload.js?v=20260808a"></script>
    <script>
      const SKU_MAP_URL = "/doopixel-pixelizer-sku-map.json?v=20260818a";
      const loginForm = document.getElementById("login");
      const verifiedForm = document.getElementById("verified-form");
      const tokenInput = document.getElementById("token");
      const partsElement = document.getElementById("parts");
      const message = document.getElementById("message");
      const publishButton = document.getElementById("publish");
      let token = sessionStorage.getItem("doopixelGalleryAdminToken") || "";
      let skuMap = null;
      const PIECE_TYPES = {
        "98138": "Flat Pixel Pieces (98138)",
        "4073": "Raised Pixel Pieces (4073)",
      };

      function showMessage(text, type) {
        message.innerHTML = "";
        message.className = "notice" + (type ? " " + type : "");
        if (!text) {
          message.classList.add("hidden");
          return;
        }
        message.textContent = text;
      }

      function setupSizes() {
        ["width", "height"].forEach(function (id) {
          const select = document.getElementById(id);
          for (let plates = 1; plates <= 8; plates += 1) {
            const pixels = plates * 16;
            const option = document.createElement("option");
            option.value = pixels;
            option.textContent = pixels + " pixels (" + plates + " baseplate" + (plates === 1 ? "" : "s") + ")";
            option.selected = plates === 3;
            select.appendChild(option);
          }
          select.addEventListener("change", updateLayout);
        });
        updateLayout();
      }

      function updateLayout() {
        const width = Number(document.getElementById("width").value || 48) / 16;
        const height = Number(document.getElementById("height").value || 48) / 16;
        document.getElementById("layout-summary").textContent =
          width + " x " + height + " baseplates · " + width * height + " total";
      }

      function availableColors(pieceType) {
        const skuField = pieceType === "98138" ? "flatSku" : "studSku";
        return Object.keys(skuMap || {})
          .map(function (hex) { return Object.assign({ hex: hex }, skuMap[hex]); })
          .filter(function (color) { return Boolean(color[skuField]); })
          .sort(function (a, b) { return String(a.doopixelNo).localeCompare(String(b.doopixelNo)); });
      }

      function createPieceTypeSelect(selectedType) {
        const select = document.createElement("select");
        select.className = "piece-type-select";
        select.setAttribute("aria-label", "Piece type");
        Object.keys(PIECE_TYPES).forEach(function (pieceType) {
          const option = document.createElement("option");
          option.value = pieceType;
          option.textContent = PIECE_TYPES[pieceType];
          option.selected = pieceType === (selectedType || "98138");
          select.appendChild(option);
        });
        return select;
      }

      function createColorSelect(pieceType, selectedHex) {
        const select = document.createElement("select");
        select.className = "color-select";
        availableColors(pieceType).forEach(function (color) {
          const option = document.createElement("option");
          option.value = color.hex;
          option.textContent = color.doopixelNo + " - " + color.colorName;
          option.selected = color.hex === selectedHex;
          select.appendChild(option);
        });
        const customOption = document.createElement("option");
        customOption.value = "__custom__";
        customOption.textContent = "Custom Color";
        customOption.selected = selectedHex === "__custom__";
        select.appendChild(customOption);
        return select;
      }

      function addPartRow(selectedType, selectedHex, quantity, selectedCustom) {
        const row = document.createElement("div");
        row.className = "part-row";
        const typeSelect = createPieceTypeSelect(selectedType);
        const colorWrap = document.createElement("div");
        colorWrap.className = "part-color";
        const catalogColor = document.createElement("div");
        catalogColor.className = "catalog-color";
        const swatch = document.createElement("span");
        swatch.className = "swatch";
        let select = createColorSelect(typeSelect.value, selectedHex);
        const customFields = document.createElement("div");
        customFields.className = "custom-color-fields hidden";
        const customNumber = document.createElement("input");
        customNumber.className = "custom-number";
        customNumber.maxLength = 20;
        customNumber.placeholder = "Warehouse No.";
        customNumber.setAttribute("aria-label", "Custom warehouse color number");
        customNumber.value = selectedCustom && selectedCustom.doopixelNo || "";
        const customName = document.createElement("input");
        customName.className = "custom-name";
        customName.maxLength = 80;
        customName.placeholder = "Color name";
        customName.setAttribute("aria-label", "Custom color name");
        customName.value = selectedCustom && selectedCustom.colorName || "";
        const customHex = document.createElement("input");
        customHex.className = "custom-hex";
        customHex.maxLength = 7;
        customHex.placeholder = "#RRGGBB";
        customHex.setAttribute("aria-label", "Custom color HEX value");
        customHex.value = selectedCustom && selectedCustom.hex || "#808080";
        customFields.append(customNumber, customName, customHex);
        const quantityInput = document.createElement("input");
        quantityInput.className = "quantity";
        quantityInput.type = "number";
        quantityInput.min = "1";
        quantityInput.max = "50000";
        quantityInput.step = "1";
        quantityInput.value = quantity || 1;
        quantityInput.setAttribute("aria-label", "Quantity");
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "danger";
        remove.innerHTML = '<span class="remove-label">Remove</span><span aria-hidden="true">×</span>';
        remove.setAttribute("aria-label", "Remove color");

        function updateSwatch() {
          const isCustom = select.value === "__custom__";
          customFields.classList.toggle("hidden", !isCustom);
          swatch.style.background = isCustom ? customHex.value : select.value || "transparent";
          updatePartsSummary();
        }
        typeSelect.addEventListener("change", function () {
          const previousHex = select.value;
          const nextSelect = createColorSelect(typeSelect.value, previousHex);
          catalogColor.replaceChild(nextSelect, select);
          select = nextSelect;
          select.addEventListener("change", updateSwatch);
          updateSwatch();
        });
        select.addEventListener("change", updateSwatch);
        customHex.addEventListener("input", updateSwatch);
        quantityInput.addEventListener("input", updatePartsSummary);
        remove.addEventListener("click", function () {
          row.remove();
          updatePartsSummary();
        });
        catalogColor.append(swatch, select);
        colorWrap.append(catalogColor, customFields);
        row.append(typeSelect, colorWrap, quantityInput, remove);
        partsElement.appendChild(row);
        updateSwatch();
      }

      function updatePartsSummary() {
        const rows = Array.from(partsElement.querySelectorAll(".part-row"));
        const total = rows.reduce(function (sum, row) {
          return sum + Math.max(0, Number(row.querySelector(".quantity").value) || 0);
        }, 0);
        document.getElementById("parts-summary").textContent =
          rows.length + " color" + (rows.length === 1 ? "" : "s") + " · " + total.toLocaleString() +
          " piece" + (total === 1 ? "" : "s");
      }

      function resetPartRows() {
        partsElement.innerHTML = "";
        addPartRow("98138");
      }

      function serializeParts() {
        const seen = new Set();
        return Array.from(partsElement.querySelectorAll(".part-row")).map(function (row) {
          const pieceType = row.querySelector(".piece-type-select").value;
          const colorSelection = row.querySelector(".color-select").value;
          const isCustom = colorSelection === "__custom__";
          let hex = colorSelection;
          let color = skuMap[hex];
          const skuField = pieceType === "98138" ? "flatSku" : "studSku";
          let sku = color && color[skuField];
          const quantity = Number(row.querySelector(".quantity").value);
          if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Every color needs a valid quantity.");
          if (isCustom) {
            const doopixelNo = row.querySelector(".custom-number").value.trim();
            const colorName = row.querySelector(".custom-name").value.trim();
            hex = row.querySelector(".custom-hex").value.trim().toLowerCase();
            if (!hex.startsWith("#")) hex = "#" + hex;
            if (!doopixelNo || !colorName || !/^#[0-9a-f]{6}$/.test(hex)) {
              throw new Error("Every custom color needs a warehouse number, color name, and valid HEX value.");
            }
            const customId = (pieceType + "-" + doopixelNo).toUpperCase();
            if (seen.has(customId)) throw new Error("Each custom piece type and warehouse color number can only be added once.");
            seen.add(customId);
            return {
              pieceType: pieceType,
              pieceTypeName: PIECE_TYPES[pieceType],
              sku: "CUSTOM-" + customId.replace(/[^A-Z0-9-]+/g, "-"),
              quantity: quantity,
              doopixelNo: doopixelNo,
              colorName: colorName,
              hex: hex,
              bricklinkColorId: "",
              isCustom: true,
            };
          }
          if (!sku || seen.has(sku)) throw new Error("Each required piece type and color can only be added once.");
          seen.add(sku);
          return {
            pieceType: pieceType,
            pieceTypeName: PIECE_TYPES[pieceType],
            sku: sku,
            quantity: quantity,
            doopixelNo: color.doopixelNo,
            colorName: color.colorName,
            hex: hex,
            bricklinkColorId: color.bricklinkColorId,
          };
        });
      }

      async function loadSkuMap() {
        if (skuMap) return;
        const response = await fetch(SKU_MAP_URL);
        if (!response.ok) throw new Error("Could not load the DooPixel color catalog.");
        skuMap = await response.json();
      }

      async function verifyAdminToken() {
        const response = await fetch("/api/admin/designs?status=pending&page=1", {
          headers: { authorization: "Bearer " + token },
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Admin password is incorrect.");
        }
      }

      async function openForm() {
        showMessage("Checking access and loading DooPixel colors...");
        await verifyAdminToken();
        await loadSkuMap();
        if (!partsElement.children.length) resetPartRows();
        verifiedForm.classList.remove("hidden");
        tokenInput.value = "";
        showMessage("");
      }

      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        token = tokenInput.value.trim();
        sessionStorage.setItem("doopixelGalleryAdminToken", token);
        try {
          await openForm();
        } catch (error) {
          showMessage(error.message, "error");
        }
      });

      document.getElementById("add-color").addEventListener("click", function () { addPartRow(); });

      document.getElementById("artwork-images").addEventListener("change", function () {
        const count = this.files.length;
        document.getElementById("artwork-image-help").textContent = count
          ? count + " photo" + (count === 1 ? " selected (cover)" : "s selected · first photo is the cover")
          : "Choose up to 6 photos. The first photo is the Gallery cover. Large photos are optimized before upload.";
      });

      verifiedForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        publishButton.disabled = true;
        publishButton.textContent = "Uploading & Publishing...";
        showMessage("Preparing the artwork photos. Keep this page open.");
        try {
          const formData = new FormData(verifiedForm);
          formData.delete("artworkImages");
          const artworkInput = document.getElementById("artwork-images");
          const photos = await window.DooPixelImageUpload.compressFiles(artworkInput.files, function (current, total) {
            showMessage("Optimizing photo " + current + " of " + total + "...");
          });
          photos.forEach(function (photo) {
            formData.append("artworkImages", photo, photo.name);
          });
          formData.set("parts", JSON.stringify(serializeParts()));
          showMessage("Uploading " + photos.length + " photo" + (photos.length === 1 ? "" : "s") + " and the instructions...");
          const response = await fetch("/api/admin/verified-designs", {
            method: "POST",
            headers: { authorization: "Bearer " + token },
            body: formData,
          });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not publish this design.");
          message.className = "notice success";
          message.innerHTML = "Published as DooPixel Verified. " +
            '<a href="' + result.shareUrl + '" target="_blank" rel="noopener">Open design</a>';
          verifiedForm.reset();
          document.getElementById("artwork-image-help").textContent =
            "Choose up to 6 photos. The first photo is the Gallery cover. Large photos are optimized before upload.";
          document.getElementById("width").value = "48";
          document.getElementById("height").value = "48";
          updateLayout();
          resetPartRows();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
          showMessage(error.message, "error");
        } finally {
          publishButton.disabled = false;
          publishButton.textContent = "Publish to Gallery";
        }
      });

      setupSizes();
      if (token) openForm().catch(function (error) { showMessage(error.message, "error"); });
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
