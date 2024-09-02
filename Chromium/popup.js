document.addEventListener('DOMContentLoaded', () => {
  const intervalSelect = document.getElementById('intervalSelect');
  const countdownElement = document.getElementById('countdown');
  const refreshToggle = document.getElementById('refreshToggle');
  const versionElement = document.getElementById('extensionVersion');
  let countdownInterval;

  // Fetch and display the extension version
  chrome.management.getSelf((extensionInfo) => {
    versionElement.textContent = extensionInfo.version;
  });

  function initPopup() {
    chrome.runtime.sendMessage({ action: "getRefreshState" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      intervalSelect.value = response.refreshInterval.toString();
      refreshToggle.checked = response.isRefreshing;
      updateCountdownDisplay(response.nextRefreshTime, response.isRefreshing);
    });
  }

  intervalSelect.addEventListener('change', () => {
    const newInterval = parseFloat(intervalSelect.value);
    chrome.runtime.sendMessage({ 
      action: "setRefreshInterval", 
      interval: newInterval 
    }, () => {
      updateCountdown();
    });
  });

  refreshToggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({ 
      action: "setRefreshState", 
      isRefreshing: refreshToggle.checked 
    }, () => {
      updateCountdown();
    });
  });

  function updateCountdown() {
    clearInterval(countdownInterval);
    chrome.runtime.sendMessage({ action: "getRefreshState" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        countdownElement.textContent = "Error: Unable to get refresh state";
        return;
      }
      updateCountdownDisplay(response.nextRefreshTime, response.isRefreshing);
    });
  }

  function updateCountdownDisplay(nextRefreshTime, isRefreshing) {
    clearInterval(countdownInterval);
    if (nextRefreshTime && isRefreshing) {
      function updateTimer() {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.floor((nextRefreshTime - now) / 1000));
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `Next refresh in: ${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          setTimeout(updateCountdown, 1000);
        }
      }
      updateTimer();
      countdownInterval = setInterval(updateTimer, 1000);
    } else {
      countdownElement.textContent = "Auto-refresh is paused";
    }
  }

  initPopup();

  // Listen for changes from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateCountdown") {
      updateCountdownDisplay(request.nextRefreshTime, true);
    }
  });
});