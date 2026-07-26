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
        --line: #d9d9d9;
        --soft: #f6f6f6;
        --green: #14733b;
        --red: #a32626;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
      }
      .wrap { max-width: 1180px; margin: 0 auto; padding: 28px 18px 60px; }
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
      .login {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      input, select, button {
        min-height: 42px;
        border: 1px solid var(--line);
        background: #fff;
        color: var(--text);
        padding: 9px 12px;
        font: inherit;
      }
      input { min-width: 230px; }
      button { cursor: pointer; font-weight: 700; }
      button.primary { background: #111; border-color: #111; color: #fff; }
      button.approve { background: var(--green); border-color: var(--green); color: #fff; }
      button.reject { color: var(--red); border-color: var(--red); }
      button:disabled { cursor: wait; opacity: .55; }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin: 22px 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }
      .card { border: 1px solid var(--line); background: #fff; }
      .card img {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        background: var(--soft);
      }
      .body { padding: 14px; }
      .title { margin: 0 0 6px; font-size: 18px; }
      .caption { min-height: 42px; color: #444; }
      .meta {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px 12px;
        color: var(--muted);
        font-size: 13px;
      }
      .actions { display: flex; gap: 8px; margin-top: 14px; }
      .actions button, .actions a { flex: 1; text-align: center; }
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
      @media (max-width: 850px) {
        header { display: block; }
        .login { margin-top: 16px; }
        .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 560px) {
        .wrap { padding: 20px 14px 40px; }
        .login, .toolbar, .actions { flex-wrap: wrap; }
        .login input { width: 100%; min-width: 0; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>Gallery Review</h1>
          <p class="muted">Approve finished builds before they appear in the public gallery.</p>
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
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button id="refresh" type="button">Refresh</button>
        </div>
        <div id="grid" class="grid"></div>
        <div id="empty" class="notice hidden">No submissions in this section.</div>
      </div>
      <div id="message" class="notice hidden"></div>
    </div>

    <script>
      const loginForm = document.getElementById("login");
      const tokenInput = document.getElementById("token");
      const reviewArea = document.getElementById("review-area");
      const statusSelect = document.getElementById("status");
      const grid = document.getElementById("grid");
      const empty = document.getElementById("empty");
      const message = document.getElementById("message");
      let token = sessionStorage.getItem("doopixelGalleryAdminToken") || "";

      function showMessage(text) {
        message.textContent = text;
        message.classList.toggle("hidden", !text);
      }

      async function api(url, options = {}) {
        const headers = new Headers(options.headers || {});
        headers.set("authorization", "Bearer " + token);
        if (options.body) {
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

      function createCard(design) {
        const card = document.createElement("article");
        card.className = "card";

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
          metaItem("Size", design.size.join(" x ")),
          metaItem("Pieces", design.totalPieces),
          metaItem("Colors", design.colorLines)
        );
        body.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "actions";

        const view = document.createElement("a");
        view.className = "link";
        view.href = "/share/" + encodeURIComponent(design.id);
        view.target = "_blank";
        view.rel = "noopener";
        view.textContent = "View";
        actions.appendChild(view);

        if (design.status === "pending") {
          const approve = document.createElement("button");
          approve.className = "approve";
          approve.type = "button";
          approve.textContent = "Approve";
          approve.addEventListener("click", () => review(design.id, "approved", approve));
          actions.appendChild(approve);

          const reject = document.createElement("button");
          reject.className = "reject";
          reject.type = "button";
          reject.textContent = "Reject";
          reject.addEventListener("click", () => review(design.id, "rejected", reject));
          actions.appendChild(reject);
        }

        body.appendChild(actions);
        card.appendChild(body);
        return card;
      }

      async function loadDesigns() {
        showMessage("Loading submissions...");
        grid.innerHTML = "";
        empty.classList.add("hidden");
        const result = await api("/api/admin/designs?status=" + encodeURIComponent(statusSelect.value));
        result.designs.forEach((design) => grid.appendChild(createCard(design)));
        empty.classList.toggle("hidden", result.designs.length !== 0);
        reviewArea.classList.remove("hidden");
        showMessage("");
      }

      async function review(id, status, button) {
        button.disabled = true;
        try {
          await api("/api/admin/designs/" + encodeURIComponent(id) + "/review", {
            method: "POST",
            body: JSON.stringify({ status }),
          });
          await loadDesigns();
        } catch (error) {
          showMessage(error.message);
          button.disabled = false;
        }
      }

      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        token = tokenInput.value.trim();
        sessionStorage.setItem("doopixelGalleryAdminToken", token);
        try {
          await loadDesigns();
          tokenInput.value = "";
        } catch (error) {
          showMessage(error.message);
        }
      });

      statusSelect.addEventListener("change", () => loadDesigns().catch((error) => showMessage(error.message)));
      document.getElementById("refresh").addEventListener("click", () => {
        loadDesigns().catch((error) => showMessage(error.message));
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
