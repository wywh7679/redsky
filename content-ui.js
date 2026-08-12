(() => {
  const utils = globalThis.RedskyFeedUtils;
  const batches = [];
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
        <div class="rfe-toolbar"><button data-action="all">Select all</button><button data-action="none">Select none</button><button data-action="save" class="rfe-save">Save JSON</button><button data-action="clear">Clear</button></div>
        <div class="rfe-items"><div class="rfe-empty">Browse or refresh this Target category page to capture its feed.</div></div>
      </section>
      <button class="rfe-toggle" aria-expanded="false">Redsky (0)</button>`;
    document.body.append(root);
    root.querySelector(".rfe-toggle").addEventListener("click", togglePanel);
    root.querySelector(".rfe-toolbar").addEventListener("click", handleAction);
    root.querySelector(".rfe-items").addEventListener("change", updateStatus);
  }

  function togglePanel() {
    const panel = root.querySelector(".rfe-panel");
    panel.classList.toggle("rfe-hidden");
    root.querySelector(".rfe-toggle").setAttribute("aria-expanded", String(!panel.classList.contains("rfe-hidden")));
  }

  function handleAction(event) {
    const action = event.target.dataset.action;
    if (!action) return;
    if (action === "all" || action === "none") {
      root.querySelectorAll("input[type=checkbox]").forEach((box) => { box.checked = action === "all"; });
      updateStatus();
    } else if (action === "clear") {
      batches.length = 0;
      render();
    } else if (action === "save") save();
  }

  function updateStatus() {
    const total = batches.reduce((sum, batch) => sum + batch.items.length, 0);
    const selected = root.querySelectorAll("input[type=checkbox]:checked").length;
    root.querySelector(".rfe-status").textContent = `${batches.length} feed page(s) · ${selected} of ${total} items selected`;
    root.querySelector(".rfe-toggle").textContent = `Redsky (${total})`;
  }

  function render() {
    buildUi();
    const container = root.querySelector(".rfe-items");
    container.replaceChildren();
    if (!batches.length) {
      container.innerHTML = '<div class="rfe-empty">Browse or refresh this Target category page to capture its feed.</div>';
      updateStatus();
      return;
    }
    batches.forEach((batch, batchIndex) => {
      const title = document.createElement("div");
      title.className = "rfe-batch";
      title.textContent = `Page ${String(batchIndex + 1).padStart(3, "0")} · ${batch.items.length} items`;
      container.append(title);
      batch.items.forEach((product, itemIndex) => {
        const row = document.createElement("label");
        row.className = "rfe-item";
        const image = utils.productImage(product);
        row.innerHTML = `<input type="checkbox" checked data-batch="${batchIndex}" data-item="${itemIndex}">
          ${image ? `<img src="${escapeAttribute(image)}" alt="">` : "<span></span>"}<span>${escapeHtml(utils.productTitle(product))}<small>${escapeHtml(utils.productId(product, itemIndex))}</small></span>`;
        container.append(row);
      });
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
    const checked = new Set([...root.querySelectorAll("input[type=checkbox]:checked")].map((box) => `${box.dataset.batch}:${box.dataset.item}`));
    const files = batches.map((batch, batchIndex) => ({
      filename: `${folder}/page-${String(batchIndex + 1).padStart(3, "0")}.json`,
      content: JSON.stringify({ category: categoryName(), source_url: batch.url, captured_at: batch.capturedAt,
        items: batch.items.filter((_, itemIndex) => checked.has(`${batchIndex}:${itemIndex}`)) }, null, 2)
    })).filter((file) => JSON.parse(file.content).items.length);
    if (!files.length) return alert("Select at least one item before saving.");
    chrome.runtime.sendMessage({ type: "download-json", files }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) alert(`Could not save files: ${chrome.runtime.lastError?.message || response?.error || "Unknown error"}`);
    });
  }

  window.addEventListener("redsky-feed-exporter:capture", (event) => {
    const items = utils.findProductArray(event.detail?.payload);
    if (!items.length) return;
    const signature = `${event.detail.url}:${items.map((item, index) => utils.productId(item, index)).join(",")}`;
    if (batches.some((batch) => batch.signature === signature)) return;
    batches.push({ ...event.detail, items, signature });
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
