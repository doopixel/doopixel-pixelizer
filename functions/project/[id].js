function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function onRequestGet({ params }) {
  const projectId = String(params.id || "").trim().toUpperCase();
  if (!/^PRJ-[A-Z0-9]{8,32}$/.test(projectId)) {
    return new Response("Project not found.", { status: 404 });
  }

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>My Pixel Art Project | DooPixel</title>
    <style>
      :root { --text:#1d1d1d; --muted:#666; --line:#ddd; --soft:#f7f7f7; --blue:#405bb8; --yellow:#f4ce21; --red:#d4141a; --green:#289b3a; }
      * { box-sizing:border-box; }
      body { margin:0; color:var(--text); background:#fff; font-family:Arial,Helvetica,sans-serif; }
      a { color:inherit; }
      .site-nav { border-top:5px solid var(--yellow); border-bottom:1px solid #343434; background:#181818; }
      .site-nav-inner { display:flex; align-items:center; gap:20px; width:min(100% - 32px,1100px); min-height:64px; margin:auto; }
      .site-nav img { display:block; width:auto; height:34px; }
      .site-links { display:flex; gap:6px; margin-left:auto; }
      .site-links a { padding:10px; color:#fff; text-decoration:none; font-size:14px; }
      main { width:min(100% - 32px,1000px); margin:0 auto; padding:34px 0 60px; }
      .eyebrow { margin:0 0 7px; color:var(--blue); font-size:13px; font-weight:700; text-transform:uppercase; }
      h1 { margin:0; font-size:clamp(28px,4vw,44px); letter-spacing:0; }
      .intro { margin:10px 0 0; color:var(--muted); line-height:1.55; }
      .notice { margin:24px 0; padding:13px 15px; border-left:4px solid var(--yellow); background:var(--soft); line-height:1.5; }
      .hidden { display:none !important; }
      .project-overview { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr); gap:28px; margin-top:28px; align-items:start; }
      .preview-wrap { min-height:320px; border:1px solid var(--line); background:var(--soft); }
      .preview-wrap img { display:block; width:100%; height:auto; max-height:660px; object-fit:contain; image-rendering:pixelated; }
      .project-meta { margin:0; border-top:1px solid var(--line); }
      .project-meta div { display:grid; grid-template-columns:120px 1fr; gap:12px; padding:11px 0; border-bottom:1px solid var(--line); }
      .project-meta dt { color:var(--muted); }
      .project-meta dd { margin:0; font-weight:600; overflow-wrap:anywhere; }
      .section { margin-top:34px; padding-top:26px; border-top:1px solid var(--line); }
      .section h2 { margin:0 0 8px; font-size:22px; letter-spacing:0; }
      .section p { margin:0 0 16px; color:var(--muted); line-height:1.55; }
      .button { display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:10px 18px; border:1px solid #1d1d1d; border-radius:3px; background:#1d1d1d; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
      .button:hover,.button:focus-visible { background:var(--yellow); color:#1d1d1d; }
      .button:disabled { opacity:.55; cursor:wait; }
      details { border:1px solid var(--line); }
      summary { padding:13px 15px; font-weight:700; cursor:pointer; }
      .table-scroll { overflow:auto; border-top:1px solid var(--line); }
      table { width:100%; border-collapse:collapse; font-size:13px; }
      th,td { padding:10px 12px; border-bottom:1px solid #eee; text-align:left; }
      th:last-child,td:last-child { text-align:right; }
      .swatch { display:inline-block; width:15px; height:15px; margin-right:8px; border:1px solid #999; vertical-align:-2px; }
      .upload-form { display:grid; gap:12px; max-width:640px; }
      input[type=file],textarea { width:100%; padding:11px; border:1px solid #aaa; border-radius:2px; background:#fff; font:inherit; }
      textarea { min-height:96px; resize:vertical; }
      .status { min-height:20px; margin-top:10px; color:var(--green); }
      @media(max-width:720px) {
        .site-links a:not(:last-child) { display:none; }
        main { width:min(100% - 24px,1000px); padding-top:24px; }
        .project-overview { grid-template-columns:1fr; gap:18px; }
        .preview-wrap { min-height:220px; }
        .project-meta div { grid-template-columns:105px 1fr; }
        .button { width:100%; }
      }
    </style>
    <link rel="stylesheet" href="/css/doopixel-site-header.css?v=20260816d" />
    <link rel="stylesheet" href="/css/doopixel-site-footer.css?v=20260816b" />
  </head>
  <body>
    <div class="dp-site-nav-wrap">
      <nav class="dp-site-nav" aria-label="DooPixel main navigation">
        <button class="dp-site-menu-button" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="dp-site-links">
          <img class="dp-site-icon" src="/assets/icons/lucide-menu.svg" alt="" />
        </button>
        <a class="dp-site-logo" href="https://doopixel.com/" aria-label="DooPixel shop">
          <img src="https://cdn.shopify.com/s/files/1/0738/7562/0006/files/20260408-001830.png?v=1775578807" alt="DooPixel" />
        </a>
        <div class="dp-site-links" id="dp-site-links">
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/">Upload Images</a>
          <a class="dp-site-link" href="https://pixelizer.doopixel.com/gallery">Gallery &amp; Shop</a>
          <a class="dp-site-link is-active" href="https://pixelizer.doopixel.com/find-project" aria-current="page">Find My Project</a>
        </div>
        <a class="dp-site-cart-icon" href="https://doopixel.com/cart" aria-label="Shopping cart">
          <img class="dp-site-icon" src="/assets/icons/lucide-shopping-cart.svg" alt="" />
        </a>
      </nav>
    </div>
    <main>
      <p class="eyebrow">My Pixel Art Project</p>
      <h1 id="project-title">Loading project...</h1>
      <p class="intro">Keep this private project link. It contains your instructions and finished-build submission tools.</p>
      <div id="message" class="notice">Checking project access...</div>

      <div id="project-content" class="hidden">
        <section class="project-overview">
          <div class="preview-wrap"><img id="preview" alt="Pixel art preview" /></div>
          <dl class="project-meta">
            <div><dt>Project</dt><dd id="meta-project"></dd></div>
            <div><dt>Order</dt><dd id="meta-order"></dd></div>
            <div><dt>Size</dt><dd id="meta-size"></dd></div>
            <div><dt>Piece</dt><dd id="meta-piece"></dd></div>
            <div><dt>Total pieces</dt><dd id="meta-total"></dd></div>
          </dl>
        </section>

        <section id="instructions-section" class="section hidden">
          <h2>Building Instructions</h2>
          <p>Download and keep your instructions. They are required to rebuild your pixel art correctly.</p>
          <button id="download-instructions" class="button" type="button">Download Building Instructions</button>
          <div id="download-status" class="status" aria-live="polite"></div>
        </section>

        <section class="section">
          <details>
            <summary id="parts-summary">Required Pieces</summary>
            <div class="table-scroll">
              <table><thead><tr><th>Piece Type</th><th>Color</th><th>SKU</th><th>Qty</th></tr></thead><tbody id="parts-body"></tbody></table>
            </div>
          </details>
        </section>

        <section id="upload-section" class="section hidden">
          <h2>Share Your Finished Build</h2>
          <p>After assembly, upload up to 6 photos of your completed build. The first photo will be the Gallery cover. Large photos are optimized before upload.</p>
          <form id="upload-form" class="upload-form">
            <input id="finished-images" name="finishedImages" type="file" accept="image/jpeg,image/png,image/webp" multiple required />
            <p id="selected-image-count">Choose 1 to 6 JPG, PNG, or WEBP photos.</p>
            <textarea id="caption" name="caption" maxlength="500" placeholder="Add a short note about your build"></textarea>
            <button id="submit-build" class="button" type="submit">Submit Finished Build for Review</button>
          </form>
          <div id="upload-status" class="status" aria-live="polite"></div>
        </section>
      </div>
    </main>

    <div data-doopixel-footer></div>
    <script src="/js/doopixel-site-footer.js?v=20260818b"></script>
    <script src="/js/doopixel-site-header.js?v=20260818b"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.debug.js" crossorigin="anonymous"></script>
    <script>window.DOOPIXEL_INSTRUCTION_BRAND = "DooPixel";</script>
    <script src="/js/bricklink-colors.js"></script>
    <script src="/js/algo.js?v=20260818a"></script>
    <script src="/js/doopixel-instruction-data.js?v=20260818a"></script>
    <script src="/js/doopixel-project-instructions.js?v=20260818a"></script>
    <script src="/js/doopixel-image-upload.js?v=20260808a"></script>
    <script>
      const PROJECT_ID = ${JSON.stringify(projectId)};
      const PROJECT_TOKEN = decodeURIComponent(window.location.hash.slice(1));
      let currentResult = null;

      function showMessage(text, isError) {
        const message = document.getElementById("message");
        message.textContent = text;
        message.style.borderLeftColor = isError ? "#d4141a" : "#f4ce21";
      }

      function renderParts(parts) {
        const body = document.getElementById("parts-body");
        body.innerHTML = "";
        parts.forEach((part) => {
          const row = document.createElement("tr");
          const type = document.createElement("td");
          type.textContent = part.pieceTypeName ||
            (String(part.pieceType) === "4073"
              ? "Raised Pixel Pieces (4073)"
              : "Flat Pixel Pieces (98138)");
          const color = document.createElement("td");
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.background = part.hex;
          color.append(swatch, document.createTextNode(part.doopixelNo + " - " + part.colorName));
          const sku = document.createElement("td");
          sku.textContent = part.isCustom ? "Custom Color" : part.sku;
          const quantity = document.createElement("td");
          quantity.textContent = Number(part.quantity).toLocaleString();
          row.append(type, color, sku, quantity);
          body.appendChild(row);
        });
      }

      function render(result) {
        const project = result.project;
        currentResult = result;
        document.getElementById("project-title").textContent = project.title;
        document.getElementById("meta-project").textContent = project.id;
        document.getElementById("meta-order").textContent = project.orderNumber || "Waiting for checkout";
        document.getElementById("meta-size").textContent = project.size[0] + " x " + project.size[1];
        document.getElementById("meta-piece").textContent = project.pieceTypeName;
        const total = project.parts.reduce((sum, part) => sum + Number(part.quantity), 0);
        document.getElementById("meta-total").textContent = total.toLocaleString();
        document.getElementById("parts-summary").textContent = "Required Pieces (" + project.parts.length + " colors)";
        renderParts(project.parts);
        if (project.previewImageKey) {
          document.getElementById("preview").src = "/api/images?key=" + encodeURIComponent(project.previewImageKey);
        }
        document.getElementById("project-content").classList.remove("hidden");

        const ordered = project.status === "ordered" && result.instructionsAvailable;
        document.getElementById("instructions-section").classList.toggle("hidden", !ordered);
        document.getElementById("upload-section").classList.toggle("hidden", !ordered);
        showMessage(
          ordered
            ? "Order confirmed. Your building instructions and upload tools are ready."
            : "This project is saved. Complete checkout to unlock the building instructions.",
          false
        );
      }

      async function loadProject() {
        if (!PROJECT_TOKEN) throw new Error("This private project link is incomplete.");
        const response = await fetch("/api/projects/" + encodeURIComponent(PROJECT_ID), {
          headers: { authorization: "Bearer " + PROJECT_TOKEN },
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Could not load this project.");
        render(result);
      }

      document.getElementById("download-instructions").addEventListener("click", async function () {
        const button = this;
        const status = document.getElementById("download-status");
        button.disabled = true;
        try {
          if (currentResult.instructionType === "pdf") {
            const response = await fetch(currentResult.instructionsUrl, {
              headers: { authorization: "Bearer " + PROJECT_TOKEN },
            });
            if (!response.ok) throw new Error("Could not download instructions.");
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = (currentResult.project.title || "DooPixel Instructions") + ".pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
            status.textContent = "Instructions downloaded. Keep the PDF in a safe place.";
            return;
          }
          await window.DooPixelProjectInstructions.generate(currentResult.instructionData, {
            title: currentResult.project.title,
            onProgress: function (done, total) {
              status.textContent = done === total ? "Finishing PDF..." : "Preparing section " + (done + 1) + " of " + total + "...";
            },
          });
          status.textContent = "Instructions downloaded. Keep the PDF in a safe place.";
        } catch (error) {
          status.textContent = error.message || "Could not generate instructions.";
        } finally {
          button.disabled = false;
        }
      });

      document.getElementById("finished-images").addEventListener("change", function () {
        const count = this.files.length;
        document.getElementById("selected-image-count").textContent = count
          ? count + " photo" + (count === 1 ? " selected (cover)" : "s selected · first photo is the cover")
          : "Choose 1 to 6 JPG, PNG, or WEBP photos.";
      });

      document.getElementById("upload-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const button = document.getElementById("submit-build");
        const status = document.getElementById("upload-status");
        button.disabled = true;
        status.textContent = "Preparing photos...";
        try {
          const input = document.getElementById("finished-images");
          const photos = await window.DooPixelImageUpload.compressFiles(input.files, function (current, total) {
            status.textContent = "Optimizing photo " + current + " of " + total + "...";
          });
          const formData = new FormData();
          photos.forEach(function (photo) {
            formData.append("finishedImages", photo, photo.name);
          });
          formData.set("caption", document.getElementById("caption").value);
          status.textContent = "Uploading " + photos.length + " photo" + (photos.length === 1 ? "..." : "s...");
          const response = await fetch("/api/projects/" + encodeURIComponent(PROJECT_ID) + "/submit", {
            method: "POST",
            headers: { authorization: "Bearer " + PROJECT_TOKEN },
            body: formData,
          });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not submit this build.");
          event.currentTarget.reset();
          document.getElementById("selected-image-count").textContent = "Choose 1 to 6 JPG, PNG, or WEBP photos.";
          status.textContent = "Submitted successfully. Your build is pending Gallery review.";
        } catch (error) {
          status.textContent = error.message || "Could not submit this build.";
        } finally {
          button.disabled = false;
        }
      });

      loadProject().catch((error) => showMessage(error.message, true));
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, private",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, nofollow",
      },
    }
  );
}
