(() => {
  const EVENT_NAME = "redsky-feed-exporter:capture";
  const { isPlpSearchUrl } = globalThis.RedskyUrlUtils;
  let initialResponseCaptured = false;

  function publish(url, payload) {
    if (initialResponseCaptured) return;
    initialResponseCaptured = true;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { url: String(url), payload, capturedAt: new Date().toISOString() }
    }));
  }

  const nativeFetch = window.fetch;
  window.fetch = async function redskyExporterFetch(...args) {
    const response = await nativeFetch.apply(this, args);
    const url = response.url || args[0]?.url || args[0];
    if (!initialResponseCaptured && isPlpSearchUrl(url, location.href)) {
      response.clone().json().then((payload) => publish(url, payload)).catch(() => {});
    }
    return response;
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function redskyExporterOpen(method, url, ...args) {
    this.__redskyExporterUrl = url;
    return nativeOpen.call(this, method, url, ...args);
  };
  XMLHttpRequest.prototype.send = function redskyExporterSend(...args) {
    if (!initialResponseCaptured && isPlpSearchUrl(this.__redskyExporterUrl, location.href)) {
      this.addEventListener("load", () => {
        try {
          const payload = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
          publish(this.responseURL || this.__redskyExporterUrl, payload);
        } catch {}
      }, { once: true });
    }
    return nativeSend.apply(this, args);
  };
})();
