let nextRefreshTime = 0;
let isRefreshing = false;
let refreshInterval = 0.5; // Default to 30 seconds (0.5 minutes)
let badgeUpdateTimer = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['refreshInterval', 'isRefreshing'], (data) => {
    refreshInterval = data.refreshInterval !== undefined ? data.refreshInterval : 0.5;
    isRefreshing = data.isRefreshing !== undefined ? data.isRefreshing : false;
    updateIcon(isRefreshing);
    if (isRefreshing) {
      scheduleNextRefresh();
    } else {
      clearBadgeText();
    }
    console.log('Extension installed. Initial state:', { refreshInterval, isRefreshing });
  });
});

function notifyPopup() {
  chrome.runtime.sendMessage({ action: "updateCountdown", nextRefreshTime: nextRefreshTime }, (response) => {
    if (chrome.runtime.lastError) {
      console.log("Popup not available:", chrome.runtime.lastError.message);
    } else {
      console.log("Popup notified:", response);
    }
  });
}

function scheduleNextRefresh() {
  const delayInMinutes = refreshInterval;
  const delayInMilliseconds = delayInMinutes * 60000;

  chrome.alarms.create("refreshZendeskViews", { delayInMinutes: delayInMinutes });
  nextRefreshTime = Date.now() + delayInMilliseconds;
  chrome.storage.local.set({ nextRefreshTime: nextRefreshTime });
  
  console.log(`Next refresh scheduled in ${delayInMinutes} minutes`);
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

    if (timeLeft > 0 && isRefreshing) {
      badgeUpdateTimer = setTimeout(updateTimer, 1000);
    } else if (isRefreshing) {
      badgeUpdateTimer = setTimeout(updateBadgeText, 1000);
    } else {
      clearBadgeText();
    }
  };

  updateTimer();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm fired:', alarm.name);
  if (alarm.name === "refreshZendeskViews" && isRefreshing) {
    console.log('Refreshing Zendesk views');
    refreshZendeskViews();
    scheduleNextRefresh();
  }
});

function refreshZendeskViews() {
  chrome.tabs.query({ url: "https://*.zendesk.com/agent/*" }, (tabs) => {
    if (tabs.length === 0) {
      console.log('No Zendesk tabs found');
      return;
    }
    tabs.forEach((tab) => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: clickRefreshButton,
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Error executing script:', chrome.runtime.lastError.message);
        } else if (results && results[0]) {
          console.log('Script execution result:', results[0].result);
        }
      });
    });
  });
  notifyPopup();
}

function clickRefreshButton() {
  const selectors = [
    'button[data-test-id="views_views-list_header-refresh"]',
    'button[aria-label="Refresh views pane"]',
    'button[data-garden-id="buttons.icon_button"]',
    'button.StyledButton-sc-qe3ace-0',
    'button.StyledIconButton-sc-1t0ughp-0',
    'button:has(svg[data-garden-id="buttons.icon"])'
  ];

  for (const selector of selectors) {
    const refreshButton = document.querySelector(selector);
    if (refreshButton) {
      refreshButton.click();
      console.log('Refresh button clicked:', selector);
      return true;
    }
  }

  const svgButton = findButtonBySVGPath();
  if (svgButton) {
    svgButton.click();
    console.log('Refresh button clicked using SVG path');
    return true;
  }

  console.log('Refresh button not found');
  return false;
}

function findButtonBySVGPath() {
  const buttons = document.querySelectorAll('button');
  const svgPath = "M10 4c-.8-1.1-2-2.5-4.1-2.5-2.5 0-4.4 2-4.4 4.5s2 4.5 4.4 4.5c1.3 0 2.5-.6 3.3-1.5m1.3-7.5V4c0 .3-.2.5-.5.5H7.5";
  
  for (const button of buttons) {
    const svg = button.querySelector('svg');
    if (svg) {
      const path = svg.querySelector('path');
      if (path && path.getAttribute('d') === svgPath) {
        return button;
      }
    }
  }
  
  return null;
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
  console.log('Icon updated:', isOn ? 'on' : 'off');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "getRefreshState") {
    sendResponse({ nextRefreshTime: nextRefreshTime, isRefreshing: isRefreshing, refreshInterval: refreshInterval });
  } else if (request.action === "setRefreshState") {
    isRefreshing = request.isRefreshing;
    updateIcon(isRefreshing);
    chrome.storage.sync.set({ isRefreshing: isRefreshing });
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
    console.log('Setting new refresh interval:', request.interval);
    refreshInterval = request.interval;
    chrome.storage.sync.set({ refreshInterval: refreshInterval });
    if (isRefreshing) {
      chrome.alarms.clear("refreshZendeskViews");
      scheduleNextRefresh();
    }
    sendResponse({ success: true });
  }
  return true;
});

// Check alarms and refresh state periodically
setInterval(() => {
  chrome.alarms.getAll((alarms) => {
    console.log('Current alarms:', alarms);
  });
  console.log('Current state:', { isRefreshing, nextRefreshTime, refreshInterval });
}, 30000); // Check every 30 seconds

console.log('Background script loaded');