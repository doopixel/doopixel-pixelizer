export async function onRequestGet() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DooPixel Community Gallery</title>
    <meta name="description" content="Explore pixel art builds shared by the DooPixel community." />
    <style>
      :root {
        color-scheme: light;
        --text: #181818;
        --muted: #666;
        --line: #dedede;
        --soft: #f5f5f5;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
      }
      .wrap { max-width: 1200px; margin: 0 auto; padding: 30px 18px 64px; }
      header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        border-bottom: 1px solid var(--line);
        padding-bottom: 20px;
        margin-bottom: 26px;
      }
      h1 { margin: 0 0 7px; font-size: 32px; }
      .muted { color: var(--muted); margin: 0; line-height: 1.5; }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border: 1px solid #111;
        background: #111;
        color: #fff;
        padding: 10px 16px;
        text-decoration: none;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 22px;
      }
      .card { border: 1px solid var(--line); }
      .card img {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: contain;
        background: var(--soft);
      }
      .body { padding: 15px; }
      .title { margin: 0 0 7px; font-size: 19px; }
      .caption { color: #444; min-height: 44px; line-height: 1.45; }
      .meta { color: var(--muted); font-size: 13px; margin-bottom: 14px; }
      .card .button { width: 100%; background: #fff; color: #111; }
      .notice {
        border: 1px solid var(--line);
        background: var(--soft);
        padding: 18px;
      }
      .hidden { display: none; }
      @media (max-width: 820px) {
        .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 560px) {
        .wrap { padding: 20px 14px 44px; }
        header { display: block; }
        header .button { margin-top: 16px; }
        h1 { font-size: 27px; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>DooPixel Community Gallery</h1>
          <p class="muted">Finished pixel art builds shared by our community.</p>
        </div>
        <a class="button" href="/">Create Your Own</a>
      </header>

      <main>
        <div id="loading" class="notice">Loading community builds...</div>
        <div id="empty" class="notice hidden">No approved builds have been shared yet.</div>
        <div id="grid" class="grid hidden"></div>
      </main>
    </div>

    <script>
      const loading = document.getElementById("loading");
      const empty = document.getElementById("empty");
      const grid = document.getElementById("grid");

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
        caption.textContent = design.customerCaption || "Shared by a DooPixel builder.";
        body.appendChild(caption);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent =
          design.size.join(" x ") +
          " pixels · " +
          Number(design.totalPieces).toLocaleString() +
          " pieces · " +
          design.colorLines +
          " colors";
        body.appendChild(meta);

        const link = document.createElement("a");
        link.className = "button";
        link.href = "/share/" + encodeURIComponent(design.id);
        link.textContent = "View Pieces & Build This Design";
        body.appendChild(link);

        card.appendChild(body);
        return card;
      }

      fetch("/api/gallery")
        .then((response) => response.json().then((result) => ({ response, result })))
        .then(({ response, result }) => {
          if (!response.ok || !result.ok) {
            throw new Error(result.error || "Could not load the gallery.");
          }
          loading.classList.add("hidden");
          if (!result.designs.length) {
            empty.classList.remove("hidden");
            return;
          }
          result.designs.forEach((design) => grid.appendChild(createCard(design)));
          grid.classList.remove("hidden");
        })
        .catch((error) => {
          loading.textContent = error.message;
        });
    </script>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    }
  );
}
