(function (root) {
  "use strict";

  const MAX_FILES = 6;
  const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
  const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
  const MAX_DIMENSION = 2000;

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read " + file.name + "."));
      };
      image.src = url;
    });
  }

  function canvasBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("Could not optimize this image."));
      }, "image/jpeg", quality);
    });
  }

  async function compressFile(file) {
    if (!(file instanceof File)) throw new Error("Choose a valid image file.");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      throw new Error("Only JPG, PNG, and WEBP images are supported.");
    }
    if (file.size > MAX_SOURCE_BYTES) {
      throw new Error(file.name + " is larger than 25 MB.");
    }

    const image = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let blob = await canvasBlob(canvas, 0.82);
    if (blob.size > MAX_OUTPUT_BYTES) blob = await canvasBlob(canvas, 0.68);
    if (blob.size > MAX_OUTPUT_BYTES) {
      throw new Error(file.name + " could not be compressed below 4 MB. Please use a smaller photo.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "doopixel-build";
    return new File([blob], baseName + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function compressFiles(fileList, onProgress) {
    const files = Array.from(fileList || []);
    if (!files.length) throw new Error("Choose at least one photo.");
    if (files.length > MAX_FILES) throw new Error("Choose no more than 6 photos.");

    const compressed = [];
    for (let index = 0; index < files.length; index += 1) {
      if (onProgress) onProgress(index + 1, files.length, files[index]);
      compressed.push(await compressFile(files[index]));
    }
    return compressed;
  }

  root.DooPixelImageUpload = {
    MAX_FILES,
    compressFiles,
  };
})(window);
