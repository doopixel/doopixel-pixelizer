export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Find My Pixel Art Project | DooPixel</title>
    <style>
      :root { --text:#1d1d1d; --muted:#666; --line:#d8d8d8; --yellow:#f4ce21; --blue:#405bb8; --red:#d4141a; }
      * { box-sizing:border-box; }
      body { margin:0; color:var(--text); background:#fff; font-family:Arial,Helvetica,sans-serif; }
      .nav { border-top:5px solid var(--yellow); border-bottom:1px solid #343434; background:#181818; }
      .nav-inner { display:flex; align-items:center; width:min(100% - 32px,1000px); min-height:64px; margin:auto; }
      .nav img { display:block; width:auto; height:34px; }
      .nav a:last-child { margin-left:auto; color:#fff; text-decoration:none; }
      main { width:min(100% - 28px,620px); margin:auto; padding:54px 0 70px; }
      .eyebrow { margin:0 0 8px; color:var(--blue); font-size:13px; font-weight:700; text-transform:uppercase; }
      h1 { margin:0; font-size:clamp(30px,6vw,46px); letter-spacing:0; }
      .intro { margin:14px 0 28px; color:var(--muted); line-height:1.6; }
      form { display:grid; gap:16px; padding:24px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
      label { display:grid; gap:7px; font-weight:700; }
      input { width:100%; min-height:46px; padding:10px 12px; border:1px solid #999; border-radius:2px; font:inherit; }
      button { min-height:48px; border:1px solid #1d1d1d; border-radius:3px; background:#1d1d1d; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
      button:hover,button:focus-visible { background:var(--yellow); color:#1d1d1d; }
      button:disabled { opacity:.55; cursor:wait; }
      #message { min-height:22px; margin:18px 0; color:var(--red); line-height:1.5; }
      #results { display:grid; gap:10px; }
      .result { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--line); color:inherit; text-decoration:none; }
      .result img { width:72px; height:72px; object-fit:cover; image-rendering:pixelated; }
      .result strong { display:block; margin-bottom:4px; }
      .result span { color:var(--blue); font-size:13px; }
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
      <p class="eyebrow">Order Support</p>
      <h1>Find My Pixel Art Project</h1>
      <p class="intro">Enter the order number and email used at checkout to recover your private project, parts list, and building instructions.</p>
      <form id="lookup-form">
        <label>Order number<input name="orderNumber" autocomplete="off" placeholder="#1001" required /></label>
        <label>Checkout email<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label>
        <button id="lookup-button" type="submit">Find My Project</button>
      </form>
      <div id="message" aria-live="polite"></div>
      <div id="results"></div>
    </main>
    <div data-doopixel-footer></div>
    <script src="/js/doopixel-site-footer.js?v=20260816b"></script>
    <script src="/js/doopixel-site-header.js?v=20260816b"></script>
    <script>
      document.getElementById("lookup-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const button = document.getElementById("lookup-button");
        const message = document.getElementById("message");
        const results = document.getElementById("results");
        button.disabled = true;
        message.textContent = "Searching...";
        results.innerHTML = "";
        try {
          const data = new FormData(event.currentTarget);
          const response = await fetch("/api/projects/find", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orderNumber: data.get("orderNumber"), email: data.get("email") }),
          });
          const result = await response.json();
          if (!response.ok || !result.ok) throw new Error(result.error || "Could not find this project.");
          message.textContent = result.projects.length === 1 ? "Project found." : result.projects.length + " projects found.";
          result.projects.forEach(function (project) {
            const link = document.createElement("a");
            link.className = "result";
            link.href = project.url;
            const image = document.createElement("img");
            image.alt = "";
            image.src = "/api/images?key=" + encodeURIComponent(project.previewImageKey || "");
            const copy = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = project.title;
            const action = document.createElement("span");
            action.textContent = "Open private project";
            copy.append(title, action);
            link.append(image, copy);
            results.appendChild(link);
          });
        } catch (error) {
          message.textContent = error.message || "Could not find this project.";
        } finally {
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );
}
