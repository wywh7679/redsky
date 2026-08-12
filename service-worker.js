chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "download-json" || !Array.isArray(message.files)) return false;
  Promise.all(message.files.map(async ({ filename, content }) => {
    const url = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
    return chrome.downloads.download({ url, filename, conflictAction: "uniquify", saveAs: false });
  })).then((ids) => sendResponse({ ok: true, ids })).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
