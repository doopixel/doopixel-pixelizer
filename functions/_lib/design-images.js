export const MAX_DESIGN_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_BYTES = 24 * 1024 * 1024;

export function getImageExtension(file) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  throw new Error("Only JPG, PNG, and WEBP images are supported.");
}

export function getImageFiles(form, pluralName, legacyName) {
  const files = form.getAll(pluralName).filter((value) => value instanceof File && value.size > 0);
  const legacyFile = form.get(legacyName);
  if (!files.length && legacyFile instanceof File && legacyFile.size > 0) files.push(legacyFile);

  if (!files.length) throw new Error("Choose at least one image.");
  if (files.length > MAX_DESIGN_IMAGES) throw new Error("Choose no more than 6 images.");

  let totalBytes = 0;
  files.forEach((file) => {
    getImageExtension(file);
    if (file.size > MAX_IMAGE_BYTES) throw new Error("Each image must be smaller than 5 MB.");
    totalBytes += file.size;
  });
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    throw new Error("The combined image upload must be smaller than 24 MB.");
  }
  return files;
}

export async function listDesignImageKeys(bucket, designId, primaryKey) {
  if (!primaryKey) return [];
  const keys = [primaryKey];
  if (!bucket || typeof bucket.list !== "function") return keys;

  let prefix = "";
  let exactPrefix = "";
  if (primaryKey.startsWith(`finished/verified/${designId}`)) {
    prefix = `finished/verified/${designId}`;
    exactPrefix = prefix;
  } else if (primaryKey.startsWith(`finished/${designId}/`)) {
    const currentUploadPrefix = primaryKey.replace(/-1\.[^.]+$/i, "-");
    if (currentUploadPrefix !== primaryKey) prefix = currentUploadPrefix;
    else return keys;
  }
  if (!prefix) return keys;

  let result;
  try {
    result = await bucket.list({ prefix, limit: 20 });
  } catch (_error) {
    return keys;
  }
  const extraKeys = (result.objects || [])
    .map((object) => object.key)
    .filter((key) => /\.(jpe?g|png|webp)$/i.test(key))
    .filter((key) => !exactPrefix || key === primaryKey || key.startsWith(exactPrefix + "-") || key.startsWith(exactPrefix + "."))
    .sort();

  extraKeys.forEach((key) => {
    if (!keys.includes(key) && keys.length < MAX_DESIGN_IMAGES) keys.push(key);
  });
  return keys;
}
