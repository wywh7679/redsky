(function exposeFeedUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RedskyFeedUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const PRODUCT_KEYS = ["tcin", "product_id", "item_id", "title", "name", "description", "price"];

  function looksLikeProduct(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return PRODUCT_KEYS.some((key) => value[key] != null) ||
      Boolean(value.item?.product_description || value.product_description);
  }

  function findProductArray(payload) {
    const queue = [payload];
    const visited = new Set();
    let fallback = [];
    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== "object" || visited.has(current)) continue;
      visited.add(current);
      if (Array.isArray(current)) {
        if (current.length && current.some(looksLikeProduct)) return current.filter(looksLikeProduct);
        if (current.length > fallback.length && current.every((item) => item && typeof item === "object")) fallback = current;
        current.forEach((item) => queue.push(item));
      } else {
        ["products", "items", "results", "search_results"].forEach((key) => {
          if (Array.isArray(current[key])) queue.unshift(current[key]);
        });
        Object.values(current).forEach((value) => queue.push(value));
      }
    }
    return fallback;
  }

  function productId(product, index) {
    return String(product?.tcin ?? product?.product_id ?? product?.item_id ?? product?.item?.tcin ?? `item-${index}`);
  }

  function productTitle(product) {
    return product?.title ?? product?.name ?? product?.item?.product_description?.title ??
      product?.product_description?.title ?? "Untitled item";
  }

  function productImage(product) {
    return product?.image_url ?? product?.image ?? product?.item?.enrichment?.images?.primary_image_url ??
      product?.enrichment?.images?.primary_image_url ?? "";
  }

  function slugify(value) {
    return String(value || "target-category").toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "target-category";
  }

  function stripHtml(value) {
    return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim() : value;
  }

  function cleanBulletValue(value) {
    if (Array.isArray(value)) return value.map(cleanBulletValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cleanBulletValue(child)]));
    }
    return stripHtml(value);
  }

  function cleanProductBullets(payload) {
    if (Array.isArray(payload)) return payload.map(cleanProductBullets);
    if (!payload || typeof payload !== "object") return payload;
    return Object.fromEntries(Object.entries(payload).map(([key, value]) => {
      if (key === "bullet_descriptors" || key === "soft_bullets") {
        return [key, cleanBulletValue(value)];
      }
      return [key, cleanProductBullets(value)];
    }));
  }

  function pageNumberFromUrl(value) {
    try {
      const url = new URL(String(value));
      const count = Number.parseInt(url.searchParams.get("count"), 10);
      const offset = Number.parseInt(url.searchParams.get("offset"), 10);
      if (Number.isFinite(count) && count > 0 && Number.isFinite(offset) && offset >= 0) {
        return Math.floor(offset / count) + 1;
      }
    } catch {}
    return 1;
  }

  return { findProductArray, productId, productTitle, productImage, slugify, stripHtml, cleanProductBullets, pageNumberFromUrl };
});
