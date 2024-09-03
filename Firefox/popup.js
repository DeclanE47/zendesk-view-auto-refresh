document.addEventListener('DOMContentLoaded', () => {
    const intervalSelect = document.getElementById('intervalSelect');
    const countdownElement = document.getElementById('countdown');
    const refreshToggle = document.getElementById('refreshToggle');
    const versionElement = document.getElementById('extensionVersion');
    const modeToggleIcon = document.getElementById('modeToggleIcon');
    let countdownInterval;
  
    // Fetch and display the extension version
    browser.management.getSelf().then((extensionInfo) => {
        versionElement.textContent = extensionInfo.version;
    });
  
    function initPopup() {
        browser.runtime.sendMessage({ action: "getRefreshState" }).then((response) => {
            intervalSelect.value = response.refreshInterval.toString();
            refreshToggle.checked = response.isRefreshing;
            updateCountdownDisplay(response.nextRefreshTime, response.isRefreshing);
        }).catch((error) => {
            console.error(error);
        });
  
        // Load dark mode preference
        browser.storage.sync.get('darkMode').then((data) => {
            const isDarkMode = data.darkMode || false;
            updateDarkMode(isDarkMode);
        });
    }
  
    function toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        browser.storage.sync.set({ darkMode: isDarkMode });
    }
  
    function updateDarkMode(isDarkMode) {
        document.body.classList.toggle('dark-mode', isDarkMode);
    }
  
    intervalSelect.addEventListener('change', () => {
        const newInterval = parseFloat(intervalSelect.value);
        browser.runtime.sendMessage({ 
            action: "setRefreshInterval", 
            interval: newInterval 
        }).then(() => {
            updateCountdown();
        });
    });
  
    refreshToggle.addEventListener('change', () => {
        browser.runtime.sendMessage({ 
            action: "setRefreshState", 
            isRefreshing: refreshToggle.checked 
        }).then(() => {
            updateCountdown();
        });
    });
  
    modeToggleIcon.addEventListener('click', toggleDarkMode);
  
    function updateCountdown() {
        clearInterval(countdownInterval);
        browser.runtime.sendMessage({ action: "getRefreshState" }).then((response) => {
            updateCountdownDisplay(response.nextRefreshTime, response.isRefreshing);
        }).catch((error) => {
            console.error(error);
            countdownElement.textContent = "Error: Unable to get refresh state";
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
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "updateCountdown") {
            updateCountdownDisplay(request.nextRefreshTime, true);
        }
    });
  });