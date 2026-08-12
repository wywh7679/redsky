(() => {
  const REFRESH_EVENT_NAME = "redsky-feed-exporter:refresh";
  const utils = globalThis.RedskyFeedUtils;
  let capture = null;
  let root;

  function categoryName() {
    const heading = document.querySelector("h1")?.textContent?.trim();
    if (heading) return heading;
    const pathPart = location.pathname.split("/").filter(Boolean).find((part) => !["c", "s"].includes(part));
    return pathPart ? decodeURIComponent(pathPart).replace(/-/g, " ") : "Target category";
  }

  function buildUi() {
    if (root || !document.body) return;
    root = document.createElement("div");
    root.id = "redsky-exporter-root";
    root.innerHTML = `
      <section class="rfe-panel rfe-hidden" aria-label="Redsky feed exporter">
        <header class="rfe-header"><h2>Redsky Feed Exporter</h2><div class="rfe-status">Waiting for a Redsky response…</div></header>
        <div class="rfe-toolbar"><button data-action="refresh">Refresh capture</button><button data-action="save" class="rfe-save">Save JSON</button></div>
        <div class="rfe-items"><div class="rfe-empty">Browse or refresh this Target category page to capture its feed.</div></div>
      </section>
      <button class="rfe-toggle" aria-expanded="false">Redsky (0)</button>`;
    document.body.append(root);
    root.querySelector(".rfe-toggle").addEventListener("click", togglePanel);
    root.querySelector(".rfe-toolbar").addEventListener("click", handleAction);
  }

  function togglePanel() {
    const panel = root.querySelector(".rfe-panel");
    panel.classList.toggle("rfe-hidden");
    root.querySelector(".rfe-toggle").setAttribute("aria-expanded", String(!panel.classList.contains("rfe-hidden")));
  }

  function handleAction(event) {
    const action = event.target.dataset.action;
    if (!action) return;
    if (action === "refresh") refreshCapture();
    else if (action === "save") save();
  }

  function refreshCapture() {
    capture = null;
    render();
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT_NAME));
  }

  function updateStatus() {
    const total = capture?.items.length || 0;
    const page = capture ? utils.pageNumberFromUrl(capture.url) : 1;
    root.querySelector(".rfe-status").textContent = capture ? `Page ${page} · ${total} items` : "Waiting for the initial PLP response…";
    root.querySelector(".rfe-toggle").textContent = `Redsky (${total})`;
  }

  function render() {
    buildUi();
    const container = root.querySelector(".rfe-items");
    container.replaceChildren();
    if (!capture) {
      container.innerHTML = '<div class="rfe-empty">Browse or refresh this Target category page to capture its feed.</div>';
      updateStatus();
      return;
    }
    capture.items.forEach((product, itemIndex) => {
      const row = document.createElement("div");
      row.className = "rfe-item";
      const image = utils.productImage(product);
      row.innerHTML = `${image ? `<img src="${escapeAttribute(image)}" alt="">` : "<span></span>"}<span>${escapeHtml(utils.productTitle(product))}<small>${escapeHtml(utils.productId(product, itemIndex))}</small></span>`;
      container.append(row);
    });
    updateStatus();
  }

  function escapeHtml(value) {
    const node = document.createElement("span");
    node.textContent = String(value);
    return node.innerHTML;
  }
  function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }

  function save() {
    const folder = utils.slugify(categoryName());
    if (!capture) return alert("The initial PLP response has not been captured yet.");
    const page = utils.pageNumberFromUrl(capture.url);
    const filename = `${folder}/page-${String(page).padStart(3, "0")}.json`;
    const files = [{ filename, content: JSON.stringify(utils.cleanProductBullets(capture.payload)) }];
    chrome.runtime.sendMessage({ type: "download-json", files }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) alert(`Could not save files: ${chrome.runtime.lastError?.message || response?.error || "Unknown error"}`);
    });
  }

  window.addEventListener("redsky-feed-exporter:capture", (event) => {
    if (capture) return;
    capture = { ...event.detail, items: utils.findProductArray(event.detail?.payload) };
    render();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "open-exporter") {
      buildUi();
      if (root.querySelector(".rfe-panel").classList.contains("rfe-hidden")) togglePanel();
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildUi, { once: true });
  else buildUi();
})();
