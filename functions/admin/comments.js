export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,nofollow" />
    <title>DooPixel Comment Review</title>
    <style>
      :root {
        color-scheme: light;
        --text: #181818;
        --muted: #666;
        --line: #d8d8d8;
        --soft: #f6f6f6;
        --green: #14733b;
        --red: #a32626;
      }
      * { box-sizing: border-box; }
      body { margin: 0; color: var(--text); background: #fff; font-family: Arial, Helvetica, sans-serif; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
      header, .toolbar, .search, .pagination, .actions, .login, .nav, .dialog-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      header { justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 18px; }
      h1 { margin: 0 0 5px; font-size: 28px; }
      .muted { margin: 0; color: var(--muted); }
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
      textarea { width: 100%; min-height: 120px; resize: vertical; }
      button { cursor: pointer; font-weight: 700; }
      button.primary, button.approve { background: #111; border-color: #111; color: #fff; }
      button.reject { color: var(--red); border-color: var(--red); }
      button:disabled { opacity: .55; cursor: wait; }
      .toolbar { justify-content: space-between; flex-wrap: wrap; margin: 22px 0 16px; }
      .search input { min-width: min(360px, 55vw); }
      .summary { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); margin-bottom: 14px; }
      .list { display: grid; gap: 12px; }
      .comment { border: 1px solid var(--line); padding: 15px; }
      .comment-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .comment h2 { font-size: 17px; margin: 0 0 5px; }
      .comment-body { white-space: pre-wrap; line-height: 1.5; margin: 14px 0; }
      .meta { color: var(--muted); font-size: 13px; }
      .actions { flex-wrap: wrap; }
      .actions a, .actions button { min-width: 88px; text-align: center; }
      .link { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; border: 1px solid var(--line); padding: 9px 12px; color: #111; text-decoration: none; font-weight: 700; }
      .notice { border: 1px solid var(--line); background: var(--soft); padding: 14px; margin-top: 18px; }
      .hidden { display: none; }
      dialog { width: min(560px, calc(100vw - 28px)); border: 1px solid var(--line); padding: 0; }
      dialog::backdrop { background: rgba(0, 0, 0, .42); }
      .dialog-body { padding: 20px; }
      .field { display: grid; gap: 6px; margin-bottom: 14px; }
      .field label { font-size: 14px; font-weight: 700; }
      .field input { width: 100%; }
      .dialog-actions { justify-content: flex-end; }
      @media (max-width: 650px) {
        .wrap { padding: 20px 14px 40px; }
        header { display: block; }
        .login { margin-top: 16px; flex-wrap: wrap; }
        .login input, .search, .search input { width: 100%; min-width: 0; }
        .summary, .comment-head { display: block; }
        .pagination { margin-top: 10px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Comment Review</h1>
          <p class="muted">Approve and manage visitor comments.</p>
          <nav class="nav">
            <a href="/admin/verified">Add Verified Design</a>
            <a href="/admin/review">Artwork Review</a>
            <a href="/admin/comments">Comment Review</a>
            <a href="/admin/parts-imports">Parts Picking</a>
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
            <option value="pending">Pending</option>
            <option value="approved">Published</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>
          <form id="search-form" class="search">
            <input id="search" type="search" placeholder="Search comment, name, design or ID" />
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
        <div id="list" class="list"></div>
        <div id="empty" class="notice hidden">No comments in this section.</div>
      </div>
      <div id="message" class="notice hidden"></div>
    </div>

    <dialog id="edit-dialog">
      <form id="edit-form" class="dialog-body">
        <h2>Edit Comment</h2>
        <input id="edit-id" type="hidden" />
        <div class="field">
          <label for="edit-name">Display name</label>
          <input id="edit-name" maxlength="40" required />
        </div>
        <div class="field">
          <label for="edit-body">Comment</label>
          <textarea id="edit-body" maxlength="500" required></textarea>
        </div>
        <div class="dialog-actions">
          <button id="cancel-edit" type="button">Cancel</button>
          <button class="primary" type="submit">Save Changes</button>
        </div>
      </form>
    </dialog>

    <script>
      const tokenInput = document.getElementById("token");
      const reviewArea = document.getElementById("review-area");
      const statusSelect = document.getElementById("status");
      const searchInput = document.getElementById("search");
      const list = document.getElementById("list");
      const empty = document.getElementById("empty");
      const message = document.getElementById("message");
      const previousButton = document.getElementById("previous");
      const nextButton = document.getElementById("next");
      const editDialog = document.getElementById("edit-dialog");
      let token = sessionStorage.getItem("doopixelGalleryAdminToken") || "";
      let currentPage = 1;
      let totalPages = 1;
      let currentComments = [];

      function showMessage(text) {
        message.textContent = text;
        message.classList.toggle("hidden", !text);
      }

      async function api(url, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set("authorization", "Bearer " + token);
        if (options.body) headers.set("content-type", "application/json");
        const response = await fetch(url, { ...options, headers });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || "Request failed.");
        return result;
      }

      function button(label, className, handler) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = className || "";
        element.textContent = label;
        element.addEventListener("click", () => handler(element));
        return element;
      }

      async function updateComment(comment, payload, element, confirmation) {
        if (confirmation && !window.confirm(confirmation)) return;
        element.disabled = true;
        try {
          await api("/api/admin/comments/" + comment.id + "/review", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          await loadComments();
        } catch (error) {
          showMessage(error.message);
          element.disabled = false;
        }
      }

      function openEditor(comment) {
        document.getElementById("edit-id").value = comment.id;
        document.getElementById("edit-name").value = comment.displayName;
        document.getElementById("edit-body").value = comment.body;
        editDialog.showModal();
      }

      function createComment(comment) {
        const article = document.createElement("article");
        article.className = "comment";
        const head = document.createElement("div");
        head.className = "comment-head";
        const titleWrap = document.createElement("div");
        const title = document.createElement("h2");
        title.textContent = comment.displayName + " on " + comment.designTitle;
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = comment.designId + " · " + new Date(comment.createdAt).toLocaleString();
        titleWrap.append(title, meta);
        head.appendChild(titleWrap);
        article.appendChild(head);

        const body = document.createElement("p");
        body.className = "comment-body";
        body.textContent = comment.body;
        article.appendChild(body);

        const actions = document.createElement("div");
        actions.className = "actions";
        const view = document.createElement("a");
        view.className = "link";
        view.href = "/share/" + encodeURIComponent(comment.designId);
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "View Work";
        actions.append(view, button("Edit", "", () => openEditor(comment)));

        if (comment.status === "pending") {
          actions.append(
            button("Approve", "approve", (element) =>
              updateComment(comment, { status: "approved" }, element)
            ),
            button("Reject", "reject", (element) =>
              updateComment(comment, { status: "rejected" }, element, "Reject this comment?")
            )
          );
        } else if (comment.status === "approved") {
          actions.append(
            button("Hide", "reject", (element) =>
              updateComment(comment, { status: "hidden" }, element)
            )
          );
        } else if (comment.status === "hidden") {
          actions.append(
            button("Publish Again", "approve", (element) =>
              updateComment(comment, { status: "approved" }, element)
            ),
            button("Reject", "reject", (element) =>
              updateComment(comment, { status: "rejected" }, element)
            )
          );
        } else {
          actions.append(
            button("Return to Pending", "", (element) =>
              updateComment(comment, { status: "pending" }, element)
            )
          );
        }
        article.appendChild(actions);
        return article;
      }

      function updateStatusLabels(counts) {
        const labels = { pending: "Pending", approved: "Published", hidden: "Hidden", rejected: "Rejected" };
        Array.from(statusSelect.options).forEach((option) => {
          option.textContent = labels[option.value] + " (" + Number(counts[option.value] || 0) + ")";
        });
      }

      async function loadComments() {
        showMessage("Loading comments...");
        list.innerHTML = "";
        empty.classList.add("hidden");
        const query = "?status=" + encodeURIComponent(statusSelect.value) +
          "&q=" + encodeURIComponent(searchInput.value.trim()) + "&page=" + currentPage;
        const result = await api("/api/admin/comments" + query);
        currentComments = result.comments;
        totalPages = result.totalPages;
        result.comments.forEach((comment) => list.appendChild(createComment(comment)));
        empty.classList.toggle("hidden", result.comments.length !== 0);
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

      document.getElementById("login").addEventListener("submit", async (event) => {
        event.preventDefault();
        token = tokenInput.value.trim();
        sessionStorage.setItem("doopixelGalleryAdminToken", token);
        currentPage = 1;
        try {
          await loadComments();
          tokenInput.value = "";
        } catch (error) {
          showMessage(error.message);
        }
      });

      statusSelect.addEventListener("change", () => {
        currentPage = 1;
        loadComments().catch((error) => showMessage(error.message));
      });
      document.getElementById("search-form").addEventListener("submit", (event) => {
        event.preventDefault();
        currentPage = 1;
        loadComments().catch((error) => showMessage(error.message));
      });
      document.getElementById("clear-search").addEventListener("click", () => {
        searchInput.value = "";
        currentPage = 1;
        loadComments().catch((error) => showMessage(error.message));
      });
      document.getElementById("refresh").addEventListener("click", () =>
        loadComments().catch((error) => showMessage(error.message))
      );
      previousButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          loadComments().catch((error) => showMessage(error.message));
        }
      });
      nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage += 1;
          loadComments().catch((error) => showMessage(error.message));
        }
      });
      document.getElementById("cancel-edit").addEventListener("click", () => editDialog.close());
      document.getElementById("edit-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = Number(document.getElementById("edit-id").value);
        const comment = currentComments.find((entry) => entry.id === id);
        const submitButton = event.submitter;
        submitButton.disabled = true;
        try {
          await api("/api/admin/comments/" + id + "/review", {
            method: "POST",
            body: JSON.stringify({
              displayName: document.getElementById("edit-name").value,
              body: document.getElementById("edit-body").value,
              status: comment.status,
            }),
          });
          editDialog.close();
          await loadComments();
        } catch (error) {
          showMessage(error.message);
        } finally {
          submitButton.disabled = false;
        }
      });

      if (token) {
        loadComments().catch(() => {
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
