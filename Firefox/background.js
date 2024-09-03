let nextRefreshTime = 0;
let isRefreshing = false;
let refreshInterval = 0.5; // Default to 30 seconds (0.5 minutes)
let badgeUpdateTimer = null;

browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.get(['refreshInterval', 'isRefreshing']).then((data) => {
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
  browser.runtime.sendMessage({ action: "updateCountdown", nextRefreshTime: nextRefreshTime, isRefreshing: isRefreshing }).catch((error) => {
    console.log("Popup not available:", error);
  });
}

function scheduleNextRefresh() {
  const delayInMinutes = refreshInterval;
  const delayInMilliseconds = delayInMinutes * 60000;

  browser.alarms.create("refreshZendeskViews", { delayInMinutes: delayInMinutes });
  nextRefreshTime = Date.now() + delayInMilliseconds;
  browser.storage.local.set({ nextRefreshTime: nextRefreshTime });
  
  console.log(`Next refresh scheduled in ${delayInMinutes} minutes`);
  notifyPopup();
  updateBadgeText();
}

function clearBadgeText() {
  browser.browserAction.setBadgeText({ text: '' });
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
    
    // Format the badge text to ensure it fits
    let badgeText;
    if (minutes > 0) {
      badgeText = `${minutes}m`;
    } else {
      badgeText = seconds.toString();
    }
    
    // Set the badge text with padding to center it
    browser.browserAction.setBadgeText({ text: ` ${badgeText} ` });
    browser.browserAction.setBadgeBackgroundColor({ color: '#4CAF50' });

    if (timeLeft > 0 && isRefreshing) {
      badgeUpdateTimer = setTimeout(updateTimer, 1000);
    } else if (isRefreshing) {
      refreshZendeskViews();
    } else {
      clearBadgeText();
    }
  };

  updateTimer();
}

browser.alarms.onAlarm.addListener((alarm) => {
  console.log('Alarm fired:', alarm.name);
  if (alarm.name === "refreshZendeskViews" && isRefreshing) {
    console.log('Refreshing Zendesk views');
    refreshZendeskViews();
  }
});

function refreshZendeskViews() {
  browser.tabs.query({ url: "https://*.zendesk.com/agent/*" }).then((tabs) => {
    if (tabs.length === 0) {
      console.log('No Zendesk tabs found');
      scheduleNextRefresh(); // Reschedule even if no tabs are found
      return;
    }
    let refreshedTabs = 0;
    tabs.forEach((tab) => {
      browser.tabs.executeScript(tab.id, {
        code: `(${clickRefreshButton.toString()})();`
      }).then((results) => {
        if (results && results[0]) {
          console.log('Script execution result:', results[0]);
        }
        refreshedTabs++;
        if (refreshedTabs === tabs.length) {
          scheduleNextRefresh(); // Reschedule after all tabs are refreshed
        }
      }).catch((error) => {
        console.error('Error executing script:', error);
        refreshedTabs++;
        if (refreshedTabs === tabs.length) {
          scheduleNextRefresh(); // Reschedule even if there was an error
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
  browser.browserAction.setIcon({ path: iconPath });
  console.log('Icon updated:', isOn ? 'on' : 'off');
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);
  if (request.action === "getRefreshState") {
    return Promise.resolve({ nextRefreshTime: nextRefreshTime, isRefreshing: isRefreshing, refreshInterval: refreshInterval });
  } else if (request.action === "setRefreshState") {
    isRefreshing = request.isRefreshing;
    updateIcon(isRefreshing);
    browser.storage.sync.set({ isRefreshing: isRefreshing });
    if (isRefreshing) {
      scheduleNextRefresh();
    } else {
      browser.alarms.clear("refreshZendeskViews");
      nextRefreshTime = 0;
      browser.storage.local.set({ nextRefreshTime: 0 });
      clearBadgeText();
    }
    return Promise.resolve({ success: true });
  } else if (request.action === "setRefreshInterval") {
    console.log('Setting new refresh interval:', request.interval);
    refreshInterval = request.interval;
    browser.storage.sync.set({ refreshInterval: refreshInterval });
    if (isRefreshing) {
      browser.alarms.clear("refreshZendeskViews");
      scheduleNextRefresh();
    }
    return Promise.resolve({ success: true });
  }
});

// Check alarms and refresh state periodically
setInterval(() => {
  browser.alarms.getAll().then((alarms) => {
    console.log('Current alarms:', alarms);
  });
  console.log('Current state:', { isRefreshing, nextRefreshTime, refreshInterval });
}, 30000); // Check every 30 seconds

console.log('Background script loaded');