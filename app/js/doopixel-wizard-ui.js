(function () {
  "use strict";

  const RARE_PIECE_THRESHOLD = 5;
  let currentPage = 0;
  let summaryTimer = null;

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function moveBodyContents(collapseId, target) {
    const collapse = document.getElementById(collapseId);
    const body = collapse && collapse.querySelector(".card-body");
    if (!body || !target) {
      return;
    }
    while (body.firstChild) {
      target.appendChild(body.firstChild);
    }
  }

  function buildShell() {
    const shell = document.createElement("div");
    shell.id = "dp-wizard-shell";
    shell.innerHTML = `
      <div class="dp-loading-slot" id="dp-loading-slot"></div>
      <header class="dp-wizard-intro">
        <h1>DooPixel Pixel Art Maker</h1>
        <p>Turn your photo into a buildable pixel artwork, then get the exact pieces and guide you need.</p>
      </header>

      <div class="dp-progress-wrap" id="dp-progress-wrap">
        <ol class="dp-progress" aria-label="Design progress">
          <li class="dp-progress-item" data-progress="1">
            <span class="dp-progress-number">1</span>
            <span class="dp-progress-label">Size</span>
          </li>
          <li class="dp-progress-item" data-progress="2">
            <span class="dp-progress-number">2</span>
            <span class="dp-progress-label">Customize</span>
          </li>
          <li class="dp-progress-item" data-progress="3">
            <span class="dp-progress-number">3</span>
            <span class="dp-progress-label">Build</span>
          </li>
        </ol>
      </div>

      <section class="dp-upload-screen" id="dp-upload-screen">
        <div class="dp-upload-panel">
          <div class="dp-upload-mark" aria-hidden="true">+</div>
          <h2>Upload Your Photo</h2>
          <p>Choose a clear photo. You will set the artwork size and crop before customizing the pixel result.</p>
          <button type="button" class="dp-primary-button dp-upload-button" id="dp-upload-button">Choose Photo</button>
        </div>
      </section>

      <section class="dp-page" id="dp-page-size" data-page="1" hidden>
        <div class="dp-page-heading">
          <h2>Choose Your Artwork Size</h2>
          <p>Position the photo inside the crop area, then choose how many 16 × 16 baseplates your artwork will use.</p>
        </div>
        <div class="dp-workspace">
          <div class="dp-preview-column">
            <div class="dp-preview-frame">
              <div class="dp-preview-stage" id="dp-size-preview"></div>
              <div class="dp-crop-toolbar" aria-label="Photo zoom controls">
                <button type="button" class="dp-crop-icon-button" id="dp-crop-zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
                <label class="dp-crop-slider-label" for="dp-crop-zoom">
                  <span>Photo zoom</span>
                  <input type="range" id="dp-crop-zoom" min="0" max="100" step="1" value="0" />
                </label>
                <button type="button" class="dp-crop-icon-button" id="dp-crop-zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
                <button type="button" class="dp-crop-reset-button" id="dp-crop-reset">Reset</button>
              </div>
              <div class="dp-preview-caption">
                <strong>Position your photo</strong>
                <span>Drag with one finger. Pinch with two fingers to zoom.</span>
              </div>
            </div>
          </div>
          <div class="dp-controls-column">
            <div class="dp-panel">
              <h3>Artwork dimensions</h3>
              <p class="dp-panel-copy">Each step equals one 16 × 16 baseplate. Larger artwork uses more pieces.</p>
              <div id="dp-size-controls"></div>
              <div class="dp-size-summary" aria-live="polite">
                <div class="dp-stat"><span>Baseplate layout</span><strong id="dp-board-layout">3 × 3</strong></div>
                <div class="dp-stat"><span>Total baseplates</span><strong id="dp-board-total">9</strong></div>
                <div class="dp-stat"><span>Approx. artwork size</span><strong id="dp-physical-size">38.4 × 38.4 cm</strong></div>
              </div>
            </div>
          </div>
        </div>
        <div class="dp-wizard-actionbar">
          <button type="button" class="dp-quiet-button" id="dp-size-back">Choose Another Photo</button>
          <button type="button" class="dp-primary-button" id="dp-size-next">Confirm Size & Continue</button>
        </div>
      </section>

      <section class="dp-page" id="dp-page-adjust" data-page="2" hidden>
        <div class="dp-page-heading">
          <h2>Customize Your Pixel Art</h2>
          <p>Adjust the photo, piece style and color matching. Changes appear in the preview automatically.</p>
        </div>
        <div class="dp-workspace">
          <div class="dp-preview-column">
            <div class="dp-preview-frame">
              <div class="dp-preview-stage is-pixel-preview" id="dp-adjust-preview"></div>
              <div class="dp-preview-caption">
                <strong>Live pixel preview</strong>
                <span class="dp-editor-status">Manual editing is active</span>
                <span id="dp-adjust-size-label"></span>
              </div>
            </div>
          </div>
          <div class="dp-controls-column">
            <details class="dp-control-group" open>
              <summary>Piece Style</summary>
              <div class="dp-control-content" id="dp-piece-controls">
                <p class="dp-panel-copy">Choose the surface you want for every pixel in this artwork.</p>
              </div>
            </details>

            <details class="dp-control-group">
              <summary>Adjust Photo Appearance</summary>
              <div class="dp-control-content" id="dp-photo-controls"></div>
            </details>

            <details class="dp-control-group">
              <summary>Pixel Color Matching</summary>
              <div class="dp-control-content" id="dp-color-match-controls">
                <p class="dp-panel-copy">Change how photo colors are translated into available piece colors.</p>
              </div>
            </details>

            <details class="dp-control-group" id="dp-manual-group">
              <summary>Manually Edit Pixels</summary>
              <div class="dp-control-content">
                <p class="dp-manual-intro">Open this section to paint, erase or sample individual pixel colors.</p>
                <div id="dp-manual-controls"></div>
                <button type="button" class="dp-secondary-button dp-editor-button" id="dp-editor-fullscreen">
                  Open Large Editor
                </button>
              </div>
            </details>

            <div class="dp-panel dp-piece-summary">
              <div class="dp-piece-summary-header">
                <h3>Pieces Needed</h3>
                <span id="dp-piece-summary-count">Calculating…</span>
              </div>
              <div class="dp-rare-notice" id="dp-rare-notice">
                Some colors use fewer than 5 pieces. Consider replacing them with a similar color to make sorting easier.
              </div>
              <div class="dp-piece-list" id="dp-piece-list" aria-live="polite"></div>
            </div>
          </div>
        </div>
        <div class="dp-wizard-actionbar">
          <button type="button" class="dp-secondary-button" id="dp-adjust-back">Back to Size</button>
          <button type="button" class="dp-primary-button" id="dp-adjust-next">Finish Editing & Continue</button>
        </div>
      </section>

      <section class="dp-page" id="dp-page-build" data-page="3" hidden>
        <div class="dp-page-heading">
          <h2>Save Your Guide & Add Your Kit</h2>
          <p>Review the finished design, save the building guide and choose your frame.</p>
        </div>
        <div class="dp-workspace dp-workspace-final">
          <div class="dp-preview-column">
            <div class="dp-preview-frame">
              <div class="dp-preview-stage is-pixel-preview" id="dp-final-preview"></div>
              <div class="dp-preview-caption">
                <strong>Final pixel art</strong>
                <span id="dp-final-size-label"></span>
              </div>
            </div>
          </div>
          <div class="dp-controls-column">
            <div class="dp-panel dp-final-controls">
              <div class="dp-guide-warning">
                <strong>Save your building guide</strong>
                <p>Download and keep the guide before ordering. You need it to rebuild this exact pixel artwork.</p>
              </div>
              <div id="dp-instructions-controls"></div>
              <div id="dp-cart-controls-slot"></div>
            </div>

            <details class="dp-control-group">
              <summary>View Final Piece Colors</summary>
              <div class="dp-control-content">
                <div class="dp-rare-notice" id="dp-final-rare-notice">
                  Colors marked below use fewer than 5 pieces and may be easier to replace before ordering.
                </div>
                <div class="dp-piece-list" id="dp-final-piece-list"></div>
              </div>
            </details>
          </div>
        </div>
        <div class="dp-wizard-actionbar">
          <button type="button" class="dp-secondary-button" id="dp-build-back">Back to Editing</button>
        </div>
      </section>

      <p class="dp-attribution">
        DooPixel Pixel Art Maker is based on an open-source project and customized for DooPixel.
      </p>
    `;
    return shell;
  }

  function addSubcontrol(target, title, collapseId) {
    const section = createElement("section", "dp-subcontrol");
    section.appendChild(createElement("div", "dp-subcontrol-title", title));
    const content = createElement("div");
    section.appendChild(content);
    moveBodyContents(collapseId, content);
    target.appendChild(section);
    return content;
  }

  function mountLegacyControls() {
    const sizePreview = document.getElementById("dp-size-preview");
    const sizeCanvas = document.getElementById("step-1-canvas-upscaled");
    if (sizePreview && sizeCanvas) {
      sizePreview.appendChild(sizeCanvas);
    }

    moveBodyContents("step-1-1-collapse", document.getElementById("dp-size-controls"));

    const adjustPreview = document.getElementById("dp-adjust-preview");
    const adjustCanvas = document.getElementById("step-3-canvas-upscaled");
    if (adjustPreview && adjustCanvas) {
      adjustPreview.appendChild(adjustCanvas);
    }

    const photoControls = document.getElementById("dp-photo-controls");
    addSubcontrol(photoControls, "Resize quality", "step-2-4-collapse");
    addSubcontrol(photoControls, "Color balance", "step-2-1-collapse");
    addSubcontrol(photoControls, "Brightness", "step-2-2-collapse");
    addSubcontrol(photoControls, "Contrast", "step-2-3-collapse");

    moveBodyContents("step-3-3-collapse", document.getElementById("dp-piece-controls"));

    const colorMatchControls = document.getElementById("dp-color-match-controls");
    moveBodyContents("step-3-4-collapse", colorMatchControls);
    const tieControls = document.getElementById("color-ties-resolution-section");
    if (tieControls) {
      tieControls.classList.add("dp-hidden-adjustment");
    }
    document.querySelectorAll(".traditional-dithering-algorithm-warning").forEach(function (warning) {
      warning.classList.add("dp-hidden-adjustment");
    });

    const manualButton = document.getElementById("paintbrush-tool-selection-dropdown");
    const manualToolbar =
      manualButton && manualButton.closest('div[style*="display: flex"][style*="flex-direction: row"]');
    if (manualToolbar) {
      manualToolbar.classList.add("dp-manual-toolbar");
      document.getElementById("dp-manual-controls").appendChild(manualToolbar);
    }

    const finalPreview = document.getElementById("dp-final-preview");
    const finalCanvas = document.getElementById("step-4-canvas-upscaled");
    if (finalPreview && finalCanvas) {
      finalPreview.appendChild(finalCanvas);
    }

    const instructionTarget = document.getElementById("dp-instructions-controls");
    moveBodyContents("step-4-3-collapse", instructionTarget);
    if (instructionTarget) {
      instructionTarget.classList.add("dp-instructions-options");
    }

    const downloadButton = document.getElementById("download-instructions-button");
    if (downloadButton) {
      downloadButton.textContent = "Download Building Guide";
    }

    mountCartControls();
    setTimeout(mountCartControls, 250);
    setTimeout(mountCartControls, 1000);
  }

  function mountCartControls() {
    const cartControls = document.getElementById("doopixel-cart-controls");
    const slot = document.getElementById("dp-cart-controls-slot");
    if (!cartControls || !slot || cartControls.parentElement === slot) {
      return;
    }
    slot.appendChild(cartControls);
  }

  function hideLegacyLayout(legacyApp, shell) {
    Array.from(legacyApp.children).forEach(function (child) {
      if (child !== shell) {
        child.classList.add("dp-legacy-hidden");
      }
    });
  }

  function mountLoadingBar() {
    const slot = document.getElementById("dp-loading-slot");
    const progress = document.getElementById("universal-loading-progress");
    const complement = document.getElementById("universal-loading-progress-complement");
    if (slot && progress) {
      slot.appendChild(progress);
    }
    if (slot && complement) {
      slot.appendChild(complement);
    }
  }

  function openImagePicker() {
    const input = document.getElementById("input-image-selector-hidden");
    if (input) {
      input.click();
    }
  }

  function updateProgress(page) {
    document.querySelectorAll(".dp-progress-item").forEach(function (item) {
      const itemPage = Number(item.dataset.progress);
      item.classList.toggle("is-active", itemPage === page);
      item.classList.toggle("is-complete", page > itemPage);
    });
  }

  function refreshCropperLayout() {
    window.setTimeout(function () {
      const cropBox = document.querySelector("#dp-size-preview .cropper-crop-box");
      if (!cropBox || (cropBox.offsetWidth > 0 && cropBox.offsetHeight > 0)) {
        return;
      }

      try {
        if (typeof initializeCropper === "function") {
          initializeCropper();
          window.requestAnimationFrame(function () {
            if (typeof runStep1 === "function") {
              runStep1();
            }
          });
        }
      } catch (error) {
        console.warn("Could not refresh the crop area:", error);
      }
    }, 180);
  }

  function getCropperInstance() {
    try {
      return typeof inputImageCropper !== "undefined" ? inputImageCropper : null;
    } catch (error) {
      return null;
    }
  }

  function getCropperRatio(cropper) {
    const canvasData = cropper.getCanvasData();
    const imageData = cropper.getImageData();
    if (!canvasData || !imageData || !imageData.naturalWidth) {
      return 0;
    }
    return canvasData.width / imageData.naturalWidth;
  }

  function syncCropperControls(resetRange) {
    const cropper = getCropperInstance();
    const slider = document.getElementById("dp-crop-zoom");
    if (!cropper || !slider) {
      return;
    }

    const currentRatio = getCropperRatio(cropper);
    if (!currentRatio) {
      return;
    }

    if (resetRange || !Number(slider.dataset.minimumRatio)) {
      slider.dataset.minimumRatio = String(currentRatio);
    }

    const minimumRatio = Number(slider.dataset.minimumRatio);
    const zoomPercent = (Math.log(currentRatio / minimumRatio) / Math.log(4)) * 100;
    slider.value = String(Math.max(0, Math.min(100, Math.round(zoomPercent))));
  }

  function setCropperZoomFromSlider() {
    const cropper = getCropperInstance();
    const slider = document.getElementById("dp-crop-zoom");
    if (!cropper || !slider) {
      return;
    }

    const minimumRatio = Number(slider.dataset.minimumRatio);
    if (!minimumRatio) {
      syncCropperControls(true);
      return;
    }

    const ratio = minimumRatio * Math.pow(4, Number(slider.value) / 100);
    cropper.zoomTo(ratio);
  }

  function bindCropperControls() {
    const slider = document.getElementById("dp-crop-zoom");
    const zoomOut = document.getElementById("dp-crop-zoom-out");
    const zoomIn = document.getElementById("dp-crop-zoom-in");
    const reset = document.getElementById("dp-crop-reset");
    if (!slider || !zoomOut || !zoomIn || !reset) {
      return;
    }

    slider.addEventListener("input", setCropperZoomFromSlider);

    function changeZoom(amount) {
      slider.value = String(Math.max(0, Math.min(100, Number(slider.value) + amount)));
      setCropperZoomFromSlider();
    }

    zoomOut.addEventListener("click", function () {
      changeZoom(-10);
    });
    zoomIn.addEventListener("click", function () {
      changeZoom(10);
    });
    reset.addEventListener("click", function () {
      const cropper = getCropperInstance();
      if (!cropper) {
        return;
      }
      cropper.reset();
      window.requestAnimationFrame(function () {
        syncCropperControls(true);
      });
    });

    window.syncDooPixelCropperControls = syncCropperControls;
  }

  function goToPage(page) {
    currentPage = page;
    document.getElementById("dp-upload-screen").hidden = page !== 0;
    document.querySelectorAll(".dp-page").forEach(function (section) {
      section.hidden = Number(section.dataset.page) !== page;
    });
    updateProgress(page);

    if (page === 1) {
      refreshCropperLayout();
    }

    if (page === 2) {
      try {
        if (typeof runStep3 === "function") {
          runStep3();
        }
      } catch (error) {
        console.warn("Could not refresh pixel preview:", error);
      }
    }

    if (page === 3) {
      try {
        if (typeof runStep4 === "function") {
          runStep4();
        }
      } catch (error) {
        console.warn("Could not refresh final preview:", error);
      }
    }

    updateSizeSummary();
    schedulePieceSummary();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function updateSizeSummary() {
    const widthInput = document.getElementById("width-slider");
    const heightInput = document.getElementById("height-slider");
    if (!widthInput || !heightInput) {
      return;
    }

    const width = Number(widthInput.value);
    const height = Number(heightInput.value);
    const boardWidth = Math.ceil(width / 16);
    const boardHeight = Math.ceil(height / 16);
    const physicalWidth = (width * 0.8).toFixed(1);
    const physicalHeight = (height * 0.8).toFixed(1);
    const artworkAspect = width + " / " + height;

    ["dp-adjust-preview", "dp-final-preview"].forEach(function (id) {
      const preview = document.getElementById(id);
      if (preview) {
        preview.style.setProperty("--dp-art-aspect", artworkAspect);
      }
    });

    const sourceCanvas = document.getElementById("step-1-canvas-upscaled");
    const sourcePreview = document.getElementById("dp-size-preview");
    if (sourceCanvas && sourcePreview && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      sourcePreview.style.setProperty("--dp-source-aspect", sourceCanvas.width + " / " + sourceCanvas.height);
    }

    document.getElementById("dp-board-layout").textContent = boardWidth + " × " + boardHeight;
    document.getElementById("dp-board-total").textContent = String(boardWidth * boardHeight);
    document.getElementById("dp-physical-size").textContent = physicalWidth + " × " + physicalHeight + " cm";
    document.getElementById("dp-adjust-size-label").textContent = width + " × " + height + " pixels";
    document.getElementById("dp-final-size-label").textContent =
      boardWidth + " × " + boardHeight + " baseplates · " + width + " × " + height + " pixels";
  }

  function friendlyPieceNames() {
    const button = document.getElementById("bricklink-piece-button");
    const menu = document.getElementById("bricklink-piece-options");
    if (!button || !menu) {
      return;
    }

    function normalizeButton() {
      if (button.textContent.indexOf("Round Tile") !== -1) {
        button.textContent = "Flat Pixel Pieces";
      } else if (button.textContent.indexOf("Round Plate") !== -1) {
        button.textContent = "Raised Pixel Pieces";
      }
    }

    Array.from(menu.children).forEach(function (option) {
      if (option.textContent.indexOf("Round Tile") !== -1) {
        option.textContent = "Flat Pixel Pieces";
      } else if (option.textContent.indexOf("Round Plate") !== -1) {
        option.textContent = "Raised Pixel Pieces";
      }
      option.addEventListener("click", function () {
        setTimeout(normalizeButton, 0);
      });
    });

    normalizeButton();
    const observer = new MutationObserver(normalizeButton);
    observer.observe(button, { childList: true, characterData: true, subtree: true });
  }

  function bindPieceTypeMenu() {
    const button = document.getElementById("bricklink-piece-button");
    const menu = document.getElementById("bricklink-piece-options");
    if (!button || !menu) {
      return;
    }

    button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const isOpen = menu.classList.toggle("show");
        button.setAttribute("aria-expanded", String(isOpen));
      },
      true
    );

    Array.from(menu.children).forEach(function (option) {
      option.addEventListener("click", function (event) {
        event.preventDefault();
        menu.classList.remove("show");
        button.setAttribute("aria-expanded", "false");
        schedulePieceSummary();
      });
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && event.target !== button) {
        menu.classList.remove("show");
        button.setAttribute("aria-expanded", "false");
      }
    });
  }

  function schedulePieceSummary() {
    clearTimeout(summaryTimer);
    summaryTimer = setTimeout(updatePieceSummary, 350);
  }

  function getPieceData() {
    const canvas = document.getElementById("bricklink-cache-canvas");
    if (
      !canvas ||
      canvas.width === 0 ||
      canvas.height === 0 ||
      typeof getUsedPixelsStudMap !== "function" ||
      typeof getPixelArrayFromCanvas !== "function"
    ) {
      return [];
    }

    try {
      const usedMap = getUsedPixelsStudMap(getPixelArrayFromCanvas(canvas));
      return Object.keys(usedMap)
        .map(function (hex) {
          let name = hex;
          try {
            if (typeof HEX_TO_COLOR_NAME !== "undefined" && HEX_TO_COLOR_NAME[hex]) {
              name = HEX_TO_COLOR_NAME[hex];
            }
          } catch (_error) {
            name = hex;
          }
          return {
            hex: hex,
            name: name,
            quantity: Number(usedMap[hex]),
          };
        })
        .sort(function (a, b) {
          return b.quantity - a.quantity || a.name.localeCompare(b.name);
        });
    } catch (error) {
      console.warn("Could not build piece summary:", error);
      return [];
    }
  }

  function renderPieceList(container, pieces) {
    if (!container) {
      return;
    }
    container.innerHTML = "";
    pieces.forEach(function (piece) {
      const row = createElement("div", "dp-piece-row" + (piece.quantity < RARE_PIECE_THRESHOLD ? " is-rare" : ""));
      const swatch = createElement("span", "dp-color-swatch");
      swatch.style.backgroundColor = piece.hex;
      const name = createElement("span", "dp-piece-name", piece.name);
      const quantity = createElement("span", "dp-piece-qty", String(piece.quantity));
      row.appendChild(swatch);
      row.appendChild(name);
      row.appendChild(quantity);
      container.appendChild(row);
    });

    if (pieces.length === 0) {
      container.appendChild(createElement("div", "dp-piece-row", "Piece colors will appear here."));
    }
  }

  function updatePieceSummary() {
    if (currentPage < 2) {
      return;
    }
    const pieces = getPieceData();
    const total = pieces.reduce(function (sum, piece) {
      return sum + piece.quantity;
    }, 0);
    const rareCount = pieces.filter(function (piece) {
      return piece.quantity < RARE_PIECE_THRESHOLD;
    }).length;

    const count = document.getElementById("dp-piece-summary-count");
    if (count) {
      count.textContent = pieces.length + " colors · " + total.toLocaleString() + " pieces";
    }

    renderPieceList(document.getElementById("dp-piece-list"), pieces);
    renderPieceList(document.getElementById("dp-final-piece-list"), pieces);

    const rareNotice = document.getElementById("dp-rare-notice");
    const finalRareNotice = document.getElementById("dp-final-rare-notice");
    if (rareNotice) {
      rareNotice.classList.toggle("is-visible", rareCount > 0);
    }
    if (finalRareNotice) {
      finalRareNotice.classList.toggle("is-visible", rareCount > 0);
    }
  }

  function setEditorActive(active) {
    const page = document.getElementById("dp-page-adjust");
    if (!page) {
      return;
    }
    page.classList.toggle("dp-editor-active", active);
    if (!active) {
      page.classList.remove("dp-editor-fullscreen");
      const fullButton = document.getElementById("dp-editor-fullscreen");
      if (fullButton) {
        fullButton.textContent = "Open Large Editor";
      }
    }
  }

  function bindInteractions() {
    document.getElementById("dp-upload-button").addEventListener("click", openImagePicker);
    document.getElementById("dp-size-back").addEventListener("click", openImagePicker);
    document.getElementById("dp-size-next").addEventListener("click", function () {
      goToPage(2);
    });
    document.getElementById("dp-adjust-back").addEventListener("click", function () {
      setEditorActive(false);
      goToPage(1);
    });
    document.getElementById("dp-adjust-next").addEventListener("click", function () {
      setEditorActive(false);
      goToPage(3);
    });
    document.getElementById("dp-build-back").addEventListener("click", function () {
      goToPage(2);
    });

    const imageInput = document.getElementById("input-image-selector-hidden");
    if (imageInput) {
      imageInput.addEventListener("change", function () {
        setTimeout(function () {
          document.body.classList.add("dp-has-image");
          goToPage(1);
        }, 100);
      });
    }

    ["width-slider", "height-slider"].forEach(function (id) {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", updateSizeSummary);
        input.addEventListener("change", updateSizeSummary);
      }
    });

    const manualGroup = document.getElementById("dp-manual-group");
    if (manualGroup) {
      manualGroup.addEventListener("toggle", function () {
        setEditorActive(manualGroup.open);
      });
    }

    const editorButton = document.getElementById("dp-editor-fullscreen");
    if (editorButton) {
      editorButton.addEventListener("click", function () {
        const page = document.getElementById("dp-page-adjust");
        const isFullscreen = page.classList.toggle("dp-editor-fullscreen");
        editorButton.textContent = isFullscreen ? "Close Large Editor" : "Open Large Editor";
        window.scrollTo({ top: 0, behavior: "auto" });
      });
    }

    document.addEventListener(
      "input",
      function () {
        if (currentPage >= 2) {
          schedulePieceSummary();
        }
      },
      true
    );
    document.addEventListener(
      "change",
      function () {
        if (currentPage >= 2) {
          schedulePieceSummary();
        }
      },
      true
    );
    document.addEventListener(
      "click",
      function () {
        if (currentPage >= 2) {
          schedulePieceSummary();
        }
      },
      true
    );
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        const page = document.getElementById("dp-page-adjust");
        if (page && page.classList.contains("dp-editor-fullscreen")) {
          page.classList.remove("dp-editor-fullscreen");
          document.getElementById("dp-editor-fullscreen").textContent = "Open Large Editor";
        }
      }
    });
  }

  function watchForProgrammaticImageLoad() {
    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      try {
        if (typeof inputImage !== "undefined" && inputImage !== null) {
          document.body.classList.add("dp-has-image");
          if (currentPage === 0) {
            goToPage(1);
          }
          clearInterval(timer);
        }
      } catch (_error) {
        // The original app owns inputImage; wait until it is initialized.
      }
      if (attempts > 60) {
        clearInterval(timer);
      }
    }, 500);
  }

  function initWizard() {
    const legacyApp = document.getElementById("dp-legacy-app");
    if (!legacyApp || document.getElementById("dp-wizard-shell")) {
      return;
    }

    const shell = buildShell();
    legacyApp.insertBefore(shell, legacyApp.firstChild);
    mountLoadingBar();
    mountLegacyControls();
    hideLegacyLayout(legacyApp, shell);
    bindCropperControls();
    bindInteractions();
    friendlyPieceNames();
    bindPieceTypeMenu();
    updateSizeSummary();
    goToPage(0);
    watchForProgrammaticImageLoad();
    document.body.classList.add("dp-wizard-ready");
  }

  onReady(initWizard);
})();
