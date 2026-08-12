chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const supported = Boolean(tab?.url?.startsWith("https://www.target.com/"));
  document.querySelector("#status").textContent = supported ? "The exporter is active on this Target tab." : "Open a Target category page to begin.";
  const button = document.querySelector("#open");
  button.disabled = !supported;
  button.addEventListener("click", () => chrome.tabs.sendMessage(tab.id, { type: "open-exporter" }).catch(() => window.close()));
});
