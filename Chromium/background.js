let nextRefreshTime = 0;
let isRefreshing = false;
let refreshInterval = 0.5; // Default to 30 seconds (0.5 minutes)
let badgeUpdateTimer = null;

chrome.runtime.onInstalled.addListener(initializeState);
chrome.runtime.onStartup.addListener(initializeState);

function initializeState() {
  chrome.storage.local.get(['refreshInterval', 'isRefreshing'], (data) => {
    refreshInterval = data.refreshInterval !== undefined ? data.refreshInterval : 0.5;
    isRefreshing = data.isRefreshing !== undefined ? data.isRefreshing : false;
    updateIcon(isRefreshing);
    if (isRefreshing) {
      scheduleNextRefresh();
    } else {
      clearBadgeText();
    }
    console.log('Extension initialized. State:', { refreshInterval, isRefreshing });
  });
}

function notifyPopup() {
  chrome.runtime.sendMessage({ 
    action: "updateCountdown", 
    nextRefreshTime: nextRefreshTime, 
    isRefreshing: isRefreshing 
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Popup not available:", chrome.runtime.lastError.message);
    }
  });
}

function scheduleNextRefresh() {
  const delayInMilliseconds = refreshInterval * 60000;

  chrome.alarms.create("refreshZendeskViews", { delayInMinutes: refreshInterval });
  nextRefreshTime = Date.now() + delayInMilliseconds;
  chrome.storage.local.set({ nextRefreshTime: nextRefreshTime });
  
  console.log(`Next refresh scheduled in ${refreshInterval} minutes`);
  notifyPopup();
  updateBadgeText();
}

function clearBadgeText() {
  chrome.action.setBadgeText({ text: '' });
  if (badgeUpdateTimer) {
    clearTimeout(badgeUpdateTimer);
    badgeUpdateTimer = null;
  }
}

function updateBadgeText() {
  if (!isRefreshing) {
    clearBadgeText();
    return;
  }

  const updateTimer = () => {
    const now = Date.now();
    const timeLeft = Math.max(0, Math.floor((nextRefreshTime - now) / 1000));
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

    if (timeLeft > 0) {
      badgeUpdateTimer = setTimeout(updateTimer, 1000);
    } else {
      refreshZendeskViews();
    }
  };

  updateTimer();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshZendeskViews" && isRefreshing) {
    refreshZendeskViews();
  }
});

function refreshZendeskViews() {
  chrome.tabs.query({ url: "https://*.zendesk.com/agent/*" }, (tabs) => {
    if (tabs.length === 0) {
      scheduleNextRefresh();
      return;
    }
    
    let refreshedTabs = 0;
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: clickRefreshButton,
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Error executing script:', chrome.runtime.lastError.message);
        }
        if (++refreshedTabs === tabs.length) {
          scheduleNextRefresh();
        }
      });
    });
  });
  notifyPopup();
}

function clickRefreshButton() {
  // Strictly target only the specific refresh button using data-test-id
  const refreshButton = document.querySelector(
    'button[data-test-id="views_views-list_header-refresh"]'
  );

  if (refreshButton) {
    refreshButton.click();
    console.log('Refresh button clicked');
    return true;
  }

  console.log('Refresh button not found');
  return false;
}

function updateIcon(isOn) {
  const iconPath = isOn ? {
    16: "icon-16.png",
    48: "icon-48.png",
    128: "icon-128.png"
  } : {
    16: "icon-off-16.png",
    48: "icon-off-48.png",
    128: "icon-off-128.png"
  };
  chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRefreshState") {
    sendResponse({ nextRefreshTime, isRefreshing, refreshInterval });
  } else if (request.action === "setRefreshState") {
    isRefreshing = request.isRefreshing;
    updateIcon(isRefreshing);
    chrome.storage.local.set({ isRefreshing });
    if (isRefreshing) {
      scheduleNextRefresh();
    } else {
      chrome.alarms.clear("refreshZendeskViews");
      nextRefreshTime = 0;
      chrome.storage.local.set({ nextRefreshTime: 0 });
      clearBadgeText();
    }
    sendResponse({ success: true });
  } else if (request.action === "setRefreshInterval") {
    refreshInterval = request.interval;
    chrome.storage.local.set({ refreshInterval });
    if (isRefreshing) {
      chrome.alarms.clear("refreshZendeskViews");
      scheduleNextRefresh();
    }
    sendResponse({ success: true });
  }
  return true;
});

console.log('Background script loaded');
