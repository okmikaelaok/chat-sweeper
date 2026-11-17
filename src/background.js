chrome.action.onClicked.addListener(async (tab) => {
  if (
    /^https:\/\/(?:gemini\.google\.com|chatgpt\.com|chat\.openai\.com)\//.test(
      tab.url || "",
    )
  ) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "toggle-manager" });
    } catch {
      await chrome.tabs.reload(tab.id);
    }
  } else {
    await chrome.tabs.create({ url: chrome.runtime.getURL("start.html") });
  }
});
