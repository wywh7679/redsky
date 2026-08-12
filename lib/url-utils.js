(function exposeUrlUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RedskyUrlUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const PLP_HOSTNAME = "redsky.target.com";
  const PLP_PATHNAME = "/redsky_aggregations/v1/web/plp_search_v2";

  function isPlpSearchUrl(value, baseUrl) {
    try {
      const url = new URL(String(value), baseUrl);
      return url.protocol === "https:" &&
        url.hostname === PLP_HOSTNAME &&
        url.pathname === PLP_PATHNAME;
    } catch {
      return false;
    }
  }

  return { isPlpSearchUrl, PLP_HOSTNAME, PLP_PATHNAME };
});
