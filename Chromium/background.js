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
  chrome.runtime.sendMessage({ action: "updateCountdown", nextRefreshTime: nextRefreshTime, isRefreshing: isRefreshing }, (response) => {
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
        badgeUpdateTimer = setTimeout(updateTimer, 1000);  // Update every second
    } else if (isRefreshing) {
        refreshZendeskViews();
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
  }
});

function refreshZendeskViews() {
  chrome.tabs.query({ url: "https://*.zendesk.com/agent/*" }, (tabs) => {
    if (tabs.length === 0) {
      console.log('No Zendesk tabs found');
      scheduleNextRefresh(); // Reschedule even if no tabs are found
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
        } else if (results && results[0]) {
          console.log('Script execution result:', results[0].result);
        }
        refreshedTabs++;
        if (refreshedTabs === tabs.length) {
          scheduleNextRefresh(); // Reschedule after all tabs are refreshed
        }
      });
    });
  });
  notifyPopup();
}

function clickRefreshButton() {
  // Specific selector for the refresh button
  const refreshButtonSelector = 'button[data-test-id="views_views-list_header-refresh"]';
  const refreshButton = document.querySelector(refreshButtonSelector);

  if (refreshButton) {
    refreshButton.click();
    console.log('Refresh button clicked:', refreshButtonSelector);
    return true;
  }

  // Fallback selectors if the specific one doesn't work
  const fallbackSelectors = [
    'button[aria-label="Refresh views pane"]', // Common selector
    'button.StyledIconButton-sc-1t0ughp-0:not([data-test-id])', // Less common
    'button[data-garden-id="buttons.icon_button"]:not([data-test-id])', // Rarely used
    'button.StyledButton-sc-qe3ace-0:not([data-test-id])', // Rarely used
    'button:has(svg[data-garden-id="buttons.icon"]):not([data-test-id])' // Rarely used
  ];

  for (const selector of fallbackSelectors) {
    const buttons = document.querySelectorAll(selector);
    for (const button of buttons) {
      // Exclude buttons with text content "Export CSV"
      if (
        !button.closest('[data-test-id="header-toolbar"]') && 
        !button.textContent.includes('Export CSV')
      ) {
        button.click();
        console.log('Refresh button clicked using fallback:', selector);
        return true;
      }
    }
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
  console.log('Icon updated:', isOn ? 'on' : 'off');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "getRefreshState") {
    sendResponse({ nextRefreshTime: nextRefreshTime, isRefreshing: isRefreshing, refreshInterval: refreshInterval });
  } else if (request.action === "setRefreshState") {
    isRefreshing = request.isRefreshing;
    updateIcon(isRefreshing);
    chrome.storage.local.set({ isRefreshing: isRefreshing });
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
    chrome.storage.local.set({ refreshInterval: refreshInterval });
    if (isRefreshing) {
      chrome.alarms.clear("refreshZendeskViews");
      scheduleNextRefresh();
    }
    sendResponse({ success: true });
  }
  return true;
});

// Use alarms for periodic state checks instead of setInterval
chrome.alarms.create("periodicCheck", { periodInMinutes: 0.5 }); // Check every 30 seconds
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicCheck") {
    chrome.alarms.getAll((alarms) => console.log('Current alarms:', alarms));
    console.log('Current state:', { isRefreshing, nextRefreshTime, refreshInterval });
  }
});

console.log('Background script loaded');