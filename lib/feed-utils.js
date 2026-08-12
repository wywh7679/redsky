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

  return { findProductArray, productId, productTitle, productImage, slugify };
});
