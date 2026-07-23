(function () {
  const SHOPIFY_ADD_KIT_URL =
    window.DOOPIXEL_SHOPIFY_ADD_KIT_URL || "https://doopixel.com/pages/add-pixel-kit";
  const SKU_MAP_URL = window.DOOPIXEL_SKU_MAP_URL || "/doopixel-pixelizer-sku-map.json";
  const CREATE_DESIGN_URL = window.DOOPIXEL_CREATE_DESIGN_URL || "/api/designs/create";

  const KIT_SKU_PREFIX = window.DOOPIXEL_CUSTOM_KIT_SKU_PREFIX || "DP-KIT";

  let skuMapPromise = null;

  function loadSkuMap() {
    if (!skuMapPromise) {
      skuMapPromise = fetch(SKU_MAP_URL).then(async function (response) {
        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            "Could not load DooPixel SKU map from " +
              SKU_MAP_URL +
              ". Make sure doopixel-pixelizer-sku-map.json is uploaded to the app folder."
          );
        }

        if (responseText.trim().startsWith("<")) {
          throw new Error(
            "DooPixel SKU map URL returned HTML instead of JSON: " +
              SKU_MAP_URL +
              ". The JSON file is missing or uploaded to the wrong folder."
          );
        }

        return JSON.parse(responseText);
      });
    }

    return skuMapPromise;
  }

  function encodePayload(payload) {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach(function (byte) {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  function getPreviewImageDataUrl() {
    if (!bricklinkCacheCanvas || bricklinkCacheCanvas.width === 0 || bricklinkCacheCanvas.height === 0) {
      return null;
    }

    return bricklinkCacheCanvas.toDataURL("image/png");
  }

  function getPieceInfo() {
    if (String(selectedPixelPartNumber) === "98138") {
      return {
        skuField: "flatSku",
        pieceTypeName: "1x1 Round Tile",
      };
    }

    if (String(selectedPixelPartNumber) === "4073") {
      return {
        skuField: "studSku",
        pieceTypeName: "1x1 Round Plate",
      };
    }

    throw new Error("Please choose 1x1 Round Tile or 1x1 Round Plate before adding to cart.");
  }

  function getSelectedFrame() {
    const selector = document.getElementById("doopixel-frame-color-select");
    const color = selector && selector.value === "white" ? "white" : "black";

    return {
      color: color,
      label: color === "white" ? "White Frame" : "Black Frame",
    };
  }

  function getBaseplateInfo(width, height) {
    const baseplateWidth = Math.ceil(Number(width) / 16);
    const baseplateHeight = Math.ceil(Number(height) / 16);

    if (
      !Number.isInteger(baseplateWidth) ||
      !Number.isInteger(baseplateHeight) ||
      baseplateWidth < 1 ||
      baseplateHeight < 1 ||
      baseplateWidth > 8 ||
      baseplateHeight > 8
    ) {
      throw new Error("Artwork size must fit within 1 x 1 to 8 x 8 baseplates.");
    }

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
      shopifyKitSku: KIT_SKU_PREFIX + "-" + pricingWidth + "X" + pricingHeight,
    };
  }

  function buildPayload(skuMap) {
    if (!bricklinkCacheCanvas || bricklinkCacheCanvas.width === 0 || bricklinkCacheCanvas.height === 0) {
      throw new Error("Please upload an image and generate the final pixel art first.");
    }

    const pieceInfo = getPieceInfo();
    const frame = getSelectedFrame();
    const width = Number(targetResolution[0]);
    const height = Number(targetResolution[1]);
    const baseplateInfo = getBaseplateInfo(width, height);
    const usedMap = getUsedPixelsStudMap(getPixelArrayFromCanvas(bricklinkCacheCanvas));
    const missingColors = [];
    const items = Object.keys(usedMap)
      .sort()
      .map(function (hex) {
        const normalizedHex = hex.toLowerCase();
        const colorInfo = skuMap[normalizedHex] || skuMap[hex];
        if (!colorInfo || !colorInfo[pieceInfo.skuField]) {
          missingColors.push(hex);
          return null;
        }

        return [
          colorInfo[pieceInfo.skuField],
          usedMap[hex],
          colorInfo.doopixelNo,
          colorInfo.colorName,
          normalizedHex,
          colorInfo.bricklinkColorId,
        ];
      })
      .filter(Boolean);

    if (missingColors.length > 0) {
      throw new Error(
        "These colors do not have a matching Shopify SKU for the selected piece type:\n" + missingColors.join("\n")
      );
    }

    const totalPieces = items.reduce(function (sum, item) {
      return sum + Number(item[1]);
    }, 0);
    const designId = "DP-" + Date.now().toString(36).toUpperCase();
    const designName = window.prompt("Name this pixel art design:", "Custom Pixel Art") || "Custom Pixel Art";

    return {
      v: 2,
      orderMode: "generic-kit",
      id: designId,
      name: designName.trim() || "Custom Pixel Art",
      pieceType: String(selectedPixelPartNumber),
      pieceTypeName: pieceInfo.pieceTypeName,
      frameColor: frame.color,
      frameLabel: frame.label,
      shopifyKitSku: baseplateInfo.shopifyKitSku,
      size: [width, height],
      baseplateWidth: baseplateInfo.baseplateWidth,
      baseplateHeight: baseplateInfo.baseplateHeight,
      baseplateLayout: baseplateInfo.baseplateLayout,
      pricingBaseplateWidth: baseplateInfo.pricingBaseplateWidth,
      pricingBaseplateHeight: baseplateInfo.pricingBaseplateHeight,
      pricingLayout: baseplateInfo.pricingLayout,
      totalBaseplates: baseplateInfo.totalBaseplates,
      totalPieces: totalPieces,
      colorLines: items.length,
      items: items,
    };
  }

  async function saveDesign(payload) {
    const response = await fetch(CREATE_DESIGN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        previewImageDataUrl: getPreviewImageDataUrl(),
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Could not save this DooPixel design.");
    }

    payload.id = result.id;
    payload.shareId = result.id;
    payload.shareUrl = new URL(result.shareUrl, window.location.origin).href;
    return payload;
  }

  async function handleAddToCartClick(button) {
    const originalText = button.textContent;

    try {
      button.disabled = true;
      button.textContent = "Preparing kit...";
      const skuMap = await loadSkuMap();
      const payload = buildPayload(skuMap);
      button.textContent = "Saving design...";
      const savedPayload = await saveDesign(payload);
      const encoded = encodeURIComponent(encodePayload(savedPayload));
      window.location.href = SHOPIFY_ADD_KIT_URL + "#" + encoded;
    } catch (error) {
      console.error(error);
      window.alert(error.message || String(error));
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function insertControls() {
    if (document.getElementById("doopixel-cart-controls")) {
      return;
    }

    const downloadButton = document.getElementById("download-instructions-button");
    if (!downloadButton || !downloadButton.parentElement) {
      return;
    }

    const wrapper = document.createElement("span");
    wrapper.id = "doopixel-cart-controls";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    wrapper.style.marginTop = "8px";
    wrapper.style.marginLeft = "8px";
    wrapper.style.verticalAlign = "middle";

    const label = document.createElement("label");
    label.htmlFor = "doopixel-frame-color-select";
    label.textContent = "Frame";
    label.style.margin = "0";
    label.style.fontWeight = "600";

    const select = document.createElement("select");
    select.id = "doopixel-frame-color-select";
    select.className = "form-control";
    select.style.width = "auto";
    select.style.minWidth = "128px";
    select.innerHTML =
      '<option value="black" selected>Black Frame</option><option value="white">White Frame</option>';

    const button = document.createElement("button");
    button.type = "button";
    button.id = "doopixel-add-to-cart-button";
    button.className = "btn btn-success";
    button.textContent = "Add Custom Kit to Cart";
    button.addEventListener("click", function () {
      handleAddToCartClick(button);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    wrapper.appendChild(button);
    downloadButton.insertAdjacentElement("afterend", wrapper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertControls);
  } else {
    insertControls();
  }
})();

