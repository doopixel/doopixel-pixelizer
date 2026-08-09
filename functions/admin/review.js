export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>DooPixel Gallery Review</title>
    <style>
      :root {
        color-scheme: light;
        --text: #181818;
        --muted: #666;
        --line: #d8d8d8;
        --soft: #f6f6f6;
        --green: #14733b;
        --red: #a32626;
        --gold: #8a6300;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
      }
      .wrap { max-width: 1220px; margin: 0 auto; padding: 28px 18px 60px; }
      header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 1px solid var(--line);
        padding-bottom: 18px;
      }
      h1 { margin: 0 0 5px; font-size: 28px; }
      p { line-height: 1.5; }
      .muted { color: var(--muted); margin: 0; }
      .login, .toolbar, .search, .pagination, .actions, .dialog-actions, .nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nav { margin-top: 10px; }
      .nav a { color: #111; font-weight: 700; }
      input, select, textarea, button {
        min-height: 42px;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text);
        padding: 9px 12px;
        font: inherit;
        border-radius: 0;
      }
      input { min-width: 230px; }
      textarea { width: 100%; min-height: 100px; resize: vertical; }
      button { cursor: pointer; font-weight: 700; }
      button.primary { background: #111; border-color: #111; color: #fff; }
      button.approve { background: var(--green); border-color: var(--green); color: #fff; }
      button.reject { color: var(--red); border-color: var(--red); }
      button.danger { background: var(--red); border-color: var(--red); color: #fff; }
      button.pin { color: var(--gold); border-color: var(--gold); }
      button:disabled { cursor: wait; opacity: .55; }
      .toolbar {
        justify-content: space-between;
        flex-wrap: wrap;
        margin: 22px 0 16px;
      }
      .search input { min-width: min(360px, 55vw); }
      .summary {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 14px;
        color: var(--muted);
        font-size: 14px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }
      .card { position: relative; border: 1px solid var(--line); background: #fff; }
      .card img {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        background: var(--soft);
      }
      .badge {
        position: absolute;
        top: 10px;
        left: 10px;
        border: 1px solid #111;
        background: #fff;
        color: #111;
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 700;
      }
      .body { padding: 14px; }
      .title { margin: 0 0 6px; font-size: 18px; }
      .caption { min-height: 42px; color: #444; }
      .note {
        border-left: 3px solid var(--line);
        color: var(--muted);
        margin: 12px 0 0;
        padding-left: 9px;
        font-size: 13px;
      }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px 12px;
        color: var(--muted);
        font-size: 13px;
      }
      .actions { flex-wrap: wrap; margin-top: 14px; }
      .actions button, .actions a { flex: 1 1 82px; text-align: center; }
      .link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border: 1px solid var(--line);
        color: var(--text);
        padding: 9px 12px;
        text-decoration: none;
        font-weight: 700;
      }
      .notice {
        border: 1px solid var(--line);
        background: var(--soft);
        padding: 14px;
        margin-top: 18px;
      }
      .hidden { display: none; }
      dialog {
        width: min(580px, calc(100vw - 28px));
        border: 1px solid var(--line);
        padding: 0;
      }
      dialog::backdrop { background: rgba(0, 0, 0, .42); }
      .dialog-body { padding: 20px; }
      .dialog-body h2 { margin: 0 0 18px; }
      .field { display: grid; gap: 6px; margin-bottom: 14px; }
      .field label { font-weight: 700; font-size: 14px; }
      .field input { width: 100%; }
      .field input[type="checkbox"] { width: auto; min-width: 0; min-height: 0; margin-right: 7px; }
      .field input[type="file"] { width: 100%; min-width: 0; }
      .field-help { margin: 0; color: var(--muted); font-size: 13px; }
      .dialog-actions { justify-content: flex-end; margin-top: 18px; }
      @media (max-width: 850px) {
        header { display: block; }
        .login { margin-top: 16px; }
        .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 560px) {
        .wrap { padding: 20px 14px 40px; }
        .login, .toolbar, .search, .pagination { align-items: stretch; flex-wrap: wrap; }
        .login input, .search, .search input { width: 100%; min-width: 0; }
        .grid { grid-template-columns: 1fr; }
        .summary { display: block; }
        .pagination { margin-top: 9px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Gallery Review</h1>
          <p class="muted">Review, feature, hide, and edit community submissions.</p>
          <nav class="nav">
            <a href="/admin/verified">Add Verified Design</a>
            <a href="/admin/review">Artwork Review</a>
            <a href="/admin/comments">Comment Review</a>
            <a href="/gallery" target="_blank" rel="noopener">Open Gallery</a>
          </nav>
        </div>
        <form id="login" class="login">
          <input id="token" type="password" autocomplete="current-password" placeholder="Admin review password" />
          <button class="primary" type="submit">Open Review</button>
        </form>
      </header>

      <div id="review-area" class="hidden">
        <div class="toolbar">
          <select id="status">
            <option value="pending">Pending Review</option>
            <option value="approved">Published</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>
          <form id="search-form" class="search">
            <input id="search" type="search" placeholder="Search design name or ID" />
            <button type="submit">Search</button>
            <button id="clear-search" type="button">Clear</button>
          </form>
          <button id="refresh" type="button">Refresh</button>
        </div>

        <div class="summary">
          <span id="result-summary"></span>
          <div class="pagination">
            <button id="previous" type="button">Previous</button>
            <span id="page-summary"></span>
            <button id="next" type="button">Next</button>
          </div>
        </div>

        <div id="grid" class="grid"></div>
        <div id="empty" class="notice hidden">No submissions in this section.</div>
      </div>
      <div id="message" class="notice hidden"></div>
    </div>

    <dialog id="edit-dialog">
      <form id="edit-form" class="dialog-body">
        <h2>Edit Gallery Details</h2>
        <input id="edit-id" type="hidden" />
        <div class="field">
          <label for="edit-title">Public title</label>
          <input id="edit-title" maxlength="120" required />
        </div>
        <div class="field">
          <label for="edit-caption">Public caption</label>
          <textarea id="edit-caption" maxlength="500"></textarea>
        </div>
        <div class="field">
          <label for="edit-note">Private moderator note</label>
          <textarea id="edit-note" maxlength="500" placeholder="Only visible in this admin page"></textarea>
        </div>
        <div class="field">
          <label for="edit-organic-likes">Organic likes</label>
          <input id="edit-organic-likes" type="number" readonly />
        </div>
        <div class="field">
          <label for="edit-displayed-likes">Displayed likes (cannot be lower than organic likes)</label>
          <input id="edit-displayed-likes" type="number" min="0" max="999999" step="1" required />
        </div>
        <div class="field">
          <label>
            <input id="edit-comments-enabled" type="checkbox" />
            Allow new visitor comments
          </label>
        </div>
        <div class="dialog-actions">
          <button id="cancel-edit" type="button">Cancel</button>
          <button class="primary" type="submit">Save Changes</button>
        </div>
      </form>
    </dialog>

    <dialog id="files-dialog">
      <form id="files-form" class="dialog-body">
        <h2>Manage Verified Design Files</h2>
        <input id="files-id" type="hidden" />
        <p id="files-design-name" class="muted"></p>
        <div class="field">
          <label for="replacement-images">Replace Gallery photos</label>
          <input id="replacement-images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
          <p id="replacement-image-help" class="field-help">Optional. Choose 1 to 6 photos. Selecting photos replaces the complete current photo set; the first new photo becomes the cover.</p>
        </div>
        <div class="field">
          <label for="replacement-pdf">Replace building instructions</label>
          <input id="replacement-pdf" type="file" accept="application/pdf,.pdf" />
          <p class="field-help">Optional. Upload a PDF only when the instructions need to be updated. Maximum 25 MB.</p>
        </div>
        <div class="dialog-actions">
          <button id="cancel-files" type="button">Cancel</button>
          <button class="primary" type="submit">Update Files</button>
        </div>
      </form>
    </dialog>

    <script src="/js/doopixel-image-upload.js?v=20260808a"></script>
    <script>
      const loginForm = document.getElementById("login");
      const tokenInput = document.getElementById("token");
      const reviewArea = document.getElementById("review-area");
      const statusSelect = document.getElementById("status");
      const searchInput = document.getElementById("search");
      const grid = document.getElementById("grid");
      const empty = document.getElementById("empty");
      const message = document.getElementById("message");
      const previousButton = document.getElementById("previous");
      const nextButton = document.getElementById("next");
      const editDialog = document.getElementById("edit-dialog");
      const filesDialog = document.getElementById("files-dialog");
      let token = sessionStorage.getItem("doopixelGalleryAdminToken") || "";
      let currentPage = 1;
      let totalPages = 1;
      let currentDesigns = [];

      function showMessage(text) {
        message.textContent = text;
        message.classList.toggle("hidden", !text);
      }

      async function api(url, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set("authorization", "Bearer " + token);
        if (options.body && !(options.body instanceof FormData)) {
          headers.set("content-type", "application/json");
        }
        const response = await fetch(url, { ...options, headers });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          throw new Error(result.error || "Request failed.");
        }
        return result;
      }

      function metaItem(label, value) {
        const item = document.createElement("span");
        item.textContent = label + ": " + value;
        return item;
      }

      function actionButton(label, className, handler) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className || "";
        button.textContent = label;
        button.addEventListener("click", () => handler(button));
        return button;
      }

      async function updateDesign(design, payload, button, confirmation) {
        if (confirmation && !window.confirm(confirmation)) {
          return;
        }
        button.disabled = true;
        try {
          await api("/api/admin/designs/" + encodeURIComponent(design.id) + "/review", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await loadDesigns();
        } catch (error) {
          showMessage(error.message);
          button.disabled = false;
        }
      }

      function openEditor(design) {
        document.getElementById("edit-id").value = design.id;
        document.getElementById("edit-title").value = design.title || "";
        document.getElementById("edit-caption").value = design.customerCaption || "";
        document.getElementById("edit-note").value = design.moderatorNote || "";
        document.getElementById("edit-organic-likes").value = design.organicLikeCount || 0;
        document.getElementById("edit-displayed-likes").min = design.organicLikeCount || 0;
        document.getElementById("edit-displayed-likes").value = design.displayedLikeCount || 0;
        document.getElementById("edit-comments-enabled").checked = design.commentsEnabled;
        editDialog.showModal();
      }

      function openFileManager(design) {
        document.getElementById("files-id").value = design.id;
        document.getElementById("files-design-name").textContent = design.title + " · " + design.id;
        document.getElementById("files-form").reset();
        document.getElementById("files-id").value = design.id;
        filesDialog.showModal();
      }

      async function deleteDesign(design, button) {
        const warning =
          "Permanently delete “" + design.title + "”? This removes its Gallery entry, photos, PDF, likes, and comments. This cannot be undone.";
        if (!window.confirm(warning)) return;
        button.disabled = true;
        try {
          await api("/api/admin/designs/" + encodeURIComponent(design.id) + "/delete", {
            method: "POST",
          });
          showMessage("Deleted " + design.title + ".");
          await loadDesigns();
        } catch (error) {
          showMessage(error.message);
          button.disabled = false;
        }
      }

      function createCard(design) {
        const card = document.createElement("article");
        card.className = "card";

        if (design.isPinned) {
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = "Pinned";
          card.appendChild(badge);
        }

        const image = document.createElement("img");
        image.alt = design.title + " finished build";
        image.loading = "lazy";
        image.src = "/api/images?key=" + encodeURIComponent(design.finishedImageKey);
        card.appendChild(image);

        const body = document.createElement("div");
        body.className = "body";

        const title = document.createElement("h2");
        title.className = "title";
        title.textContent = design.title;
        body.appendChild(title);

        const caption = document.createElement("p");
        caption.className = "caption";
        caption.textContent = design.customerCaption || "No customer caption.";
        body.appendChild(caption);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.append(
          metaItem("ID", design.id),
          metaItem("Type", design.isVerified ? "DooPixel Verified" : "Community"),
          metaItem("Size", design.size.join(" x ")),
          metaItem("Pieces", Number(design.totalPieces).toLocaleString()),
          metaItem("Colors", design.colorLines),
          metaItem("Likes", Number(design.displayedLikeCount).toLocaleString()),
          metaItem(
            "Comments",
            design.approvedCommentCount +
              (design.pendingCommentCount ? " (" + design.pendingCommentCount + " pending)" : "")
          ),
          metaItem("Shares", Number(design.shareCount).toLocaleString())
        );
        body.appendChild(meta);

        if (design.moderatorNote) {
          const note = document.createElement("p");
          note.className = "note";
          note.textContent = "Private note: " + design.moderatorNote;
          body.appendChild(note);
        }

        const actions = document.createElement("div");
        actions.className = "actions";

        const view = document.createElement("a");
        view.className = "link";
        view.href = "/share/" + encodeURIComponent(design.id);
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "View";
        actions.appendChild(view);
        actions.appendChild(actionButton("Edit", "", () => openEditor(design)));

        if (design.isVerified) {
          actions.appendChild(actionButton("Manage Files", "", () => openFileManager(design)));
          actions.appendChild(
            actionButton("Delete", "danger", (button) => deleteDesign(design, button))
          );
        }

        if (design.status === "pending") {
          actions.appendChild(
            actionButton("Approve", "approve", (button) =>
              updateDesign(design, { status: "approved" }, button)
            )
          );
          actions.appendChild(
            actionButton("Reject", "reject", (button) =>
              updateDesign(
                design,
                { status: "rejected" },
                button,
                "Reject this gallery submission?"
              )
            )
          );
        }

        if (design.status === "approved") {
          actions.appendChild(
            actionButton(design.isPinned ? "Unpin" : "Pin", "pin", (button) =>
              updateDesign(design, { isPinned: !design.isPinned }, button)
            )
          );
          actions.appendChild(
            actionButton("Hide", "reject", (button) =>
              updateDesign(
                design,
                { status: "hidden" },
                button,
                "Hide this work from the public gallery? You can publish it again later."
              )
            )
          );
        }

        if (design.status === "hidden") {
          actions.appendChild(
            actionButton("Publish Again", "approve", (button) =>
              updateDesign(design, { status: "approved" }, button)
            )
          );
          actions.appendChild(
            actionButton("Reject", "reject", (button) =>
              updateDesign(design, { status: "rejected" }, button)
            )
          );
        }

        if (design.status === "rejected") {
          actions.appendChild(
            actionButton("Return to Pending", "", (button) =>
              updateDesign(design, { status: "pending" }, button)
            )
          );
        }

        body.appendChild(actions);
        card.appendChild(body);
        return card;
      }

      function updateStatusLabels(counts) {
        const labels = {
          pending: "Pending Review",
          approved: "Published",
          hidden: "Hidden",
          rejected: "Rejected",
        };
        Array.from(statusSelect.options).forEach((option) => {
          option.textContent = labels[option.value] + " (" + Number(counts[option.value] || 0) + ")";
        });
      }

      async function loadDesigns() {
        showMessage("Loading submissions...");
        grid.innerHTML = "";
        empty.classList.add("hidden");
        const query =
          "?status=" +
          encodeURIComponent(statusSelect.value) +
          "&q=" +
          encodeURIComponent(searchInput.value.trim()) +
          "&page=" +
          currentPage;
        const result = await api("/api/admin/designs" + query);
        currentDesigns = result.designs;
        totalPages = result.totalPages;
        result.designs.forEach((design) => grid.appendChild(createCard(design)));
        empty.classList.toggle("hidden", result.designs.length !== 0);
        document.getElementById("result-summary").textContent =
          result.total + " result" + (result.total === 1 ? "" : "s");
        document.getElementById("page-summary").textContent =
          "Page " + result.page + " of " + result.totalPages;
        previousButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= result.totalPages;
        updateStatusLabels(result.counts);
        reviewArea.classList.remove("hidden");
        showMessage("");
      }

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        token = tokenInput.value.trim();
        sessionStorage.setItem("doopixelGalleryAdminToken", token);
        currentPage = 1;
        try {
          await loadDesigns();
          tokenInput.value = "";
        } catch (error) {
          showMessage(error.message);
        }
      });

      statusSelect.addEventListener("change", () => {
        currentPage = 1;
        loadDesigns().catch((error) => showMessage(error.message));
      });

      document.getElementById("search-form").addEventListener("submit", (event) => {
        event.preventDefault();
        currentPage = 1;
        loadDesigns().catch((error) => showMessage(error.message));
      });

      document.getElementById("clear-search").addEventListener("click", () => {
        searchInput.value = "";
        currentPage = 1;
        loadDesigns().catch((error) => showMessage(error.message));
      });

      document.getElementById("refresh").addEventListener("click", () => {
        loadDesigns().catch((error) => showMessage(error.message));
      });

      previousButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          loadDesigns().catch((error) => showMessage(error.message));
        }
      });

      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage += 1;
          loadDesigns().catch((error) => showMessage(error.message));
        }
      });

      document.getElementById("cancel-edit").addEventListener("click", () => editDialog.close());
      document.getElementById("cancel-files").addEventListener("click", () => filesDialog.close());

      document.getElementById("edit-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = document.getElementById("edit-id").value;
        const design = currentDesigns.find((entry) => entry.id === id);
        const submitButton = event.submitter;
        submitButton.disabled = true;
        try {
          await api("/api/admin/designs/" + encodeURIComponent(id) + "/review", {
            method: "POST",
            body: JSON.stringify({
              title: document.getElementById("edit-title").value,
              customerCaption: document.getElementById("edit-caption").value,
              moderatorNote: document.getElementById("edit-note").value,
              manualLikeOffset: Math.max(
                0,
                Number(document.getElementById("edit-displayed-likes").value) -
                  Number(design.organicLikeCount || 0)
              ),
              commentsEnabled: document.getElementById("edit-comments-enabled").checked,
              status: design.status,
            }),
          });
          editDialog.close();
          await loadDesigns();
        } catch (error) {
          showMessage(error.message);
        } finally {
          submitButton.disabled = false;
        }
      });

      document.getElementById("replacement-images").addEventListener("change", (event) => {
        const count = event.target.files.length;
        document.getElementById("replacement-image-help").textContent = count
          ? count + " new photo" + (count === 1 ? "" : "s") + " selected. These will replace the current photo set."
          : "Optional. Choose 1 to 6 photos. Selecting photos replaces the complete current photo set; the first new photo becomes the cover.";
      });

      document.getElementById("files-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = event.submitter;
        const id = document.getElementById("files-id").value;
        const imageInput = document.getElementById("replacement-images");
        const pdfInput = document.getElementById("replacement-pdf");
        if (!imageInput.files.length && !pdfInput.files.length) {
          showMessage("Choose new Gallery photos, a PDF, or both.");
          return;
        }

        submitButton.disabled = true;
        showMessage("Preparing the replacement files. Keep this page open.");
        try {
          const formData = new FormData();
          if (imageInput.files.length) {
            const photos = await window.DooPixelImageUpload.compressFiles(
              imageInput.files,
              function (current, total) {
                showMessage("Optimizing photo " + current + " of " + total + "...");
              }
            );
            photos.forEach((photo) => formData.append("artworkImages", photo, photo.name));
          }
          if (pdfInput.files.length) {
            formData.append("instructionsPdf", pdfInput.files[0], pdfInput.files[0].name);
          }

          showMessage("Uploading replacement files...");
          await api("/api/admin/designs/" + encodeURIComponent(id) + "/files", {
            method: "POST",
            body: formData,
          });
          filesDialog.close();
          showMessage("Files updated successfully.");
          await loadDesigns();
        } catch (error) {
          showMessage(error.message);
        } finally {
          submitButton.disabled = false;
        }
      });

      if (token) {
        loadDesigns().catch(() => {
          sessionStorage.removeItem("doopixelGalleryAdminToken");
          token = "";
        });
      }
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
