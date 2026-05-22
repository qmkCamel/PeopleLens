chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel?.open && tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => undefined);
  }
});
