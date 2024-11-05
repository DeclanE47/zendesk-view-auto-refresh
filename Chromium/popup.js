
// Debounce function to limit storage update calls
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, arguments), delay);
    };
}
document.addEventListener('DOMContentLoaded', () => {
    const intervalSelect = document.getElementById('intervalSelect');
    const countdownElement = document.getElementById('countdown');
    const refreshToggle = document.getElementById('refreshToggle');
    const versionElement = document.getElementById('extensionVersion');
    const modeToggleIcon = document.getElementById('modeToggleIcon');
    let countdownInterval;
  
    // Fetch and display the extension version
    chrome.management.getSelf((extensionInfo) => {
      versionElement.textContent = extensionInfo.version;
    });
  
    function initPopup() {
      chrome.storage.local.get(['refreshInterval', 'isRefreshing'], (data) => {
        intervalSelect.value = data.refreshInterval !== undefined ? data.refreshInterval.toString() : "0.5";
        refreshToggle.checked = data.isRefreshing !== undefined ? data.isRefreshing : false;
        
        chrome.runtime.sendMessage({ action: "getRefreshState" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          updateCountdownDisplay(response.nextRefreshTime, response.isRefreshing);
        });
      });
  
      // Load dark mode preference
      chrome.storage.local.get('darkMode', (data) => {
        const isDarkMode = data.darkMode || false;
        updateDarkMode(isDarkMode);
      });
    }
  
    function toggleDarkMode() {
      const isDarkMode = document.body.classList.toggle('dark-mode');
      chrome.storage.local.set({ darkMode: isDarkMode });
    }
  
    function updateDarkMode(isDarkMode) {
      document.body.classList.toggle('dark-mode', isDarkMode);
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
  
    modeToggleIcon.addEventListener('click', toggleDarkMode);
  
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
        updateCountdownDisplay(request.nextRefreshTime, request.isRefreshing);
      }
    });
  });