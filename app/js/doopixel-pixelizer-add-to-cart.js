(function () {
  const SHOPIFY_ADD_KIT_URL =
    window.DOOPIXEL_SHOPIFY_ADD_KIT_URL || "https://YOUR-SHOPIFY-DOMAIN.com/pages/add-pixel-kit";
  const SKU_MAP_URL = window.DOOPIXEL_SKU_MAP_URL || "/doopixel-pixelizer-sku-map.json";
  const CREATE_DESIGN_URL = window.DOOPIXEL_CREATE_DESIGN_URL || "/api/designs/create";

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

  function buildPayload(skuMap) {
    if (!bricklinkCacheCanvas || bricklinkCacheCanvas.width === 0 || bricklinkCacheCanvas.height === 0) {
      throw new Error("Please upload an image and generate the final pixel art first.");
    }

    const pieceInfo = getPieceInfo();
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

    const designId = "DP-" + Date.now().toString(36).toUpperCase();
    const designName = window.prompt("Name this pixel art design:", "Custom Pixel Art") || "Custom Pixel Art";

    return {
      v: 1,
      id: designId,
      name: designName.trim() || "Custom Pixel Art",
      pieceType: String(selectedPixelPartNumber),
      pieceTypeName: pieceInfo.pieceTypeName,
      size: [Number(targetResolution[0]), Number(targetResolution[1])],
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

  function insertButton() {
    if (document.getElementById("doopixel-add-to-cart-button")) {
      return;
    }

    const downloadButton = document.getElementById("download-instructions-button");
    if (!downloadButton || !downloadButton.parentElement) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "doopixel-add-to-cart-button";
    button.className = "btn btn-success";
    button.style.marginTop = "8px";
    button.style.marginLeft = "8px";
    button.textContent = "Add All Pieces to Cart";
    button.addEventListener("click", function () {
      handleAddToCartClick(button);
    });

    downloadButton.insertAdjacentElement("afterend", button);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertButton);
  } else {
    insertButton();
  }
})();

