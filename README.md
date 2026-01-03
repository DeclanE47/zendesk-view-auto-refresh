# Zendesk View Auto-Refresh

Zendesk View Auto-Refresh is a browser extension that automatically refreshes your Zendesk views so you always see the latest tickets without repeatedly clicking the refresh button.

## Installation

### Chromium-based Browsers (Chrome, Brave, Edge, etc.)

- [Chrome Web Store](https://chromewebstore.google.com/detail/zendesk-view-auto-refresh/ckdcgmfljnlmeiilogogfheobbpjiilo)
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/zendesk-view-auto-refresh/mblnlidmghfmoemohbemlaadjadfmepl)

### Firefox

- [Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/zendesk-view-auto-refresh/)

![Zendesk View Auto Refresh 1280 x 800 chrome extension](https://github.com/user-attachments/assets/4910da1b-0467-45a7-89b6-fb525a7d3e47)

## Features
- Automatic refresh of Zendesk views
- Customizable refresh intervals (as fast as 5 seconds, up to 10 minutes) plus a custom timer field
- Easy on/off toggle with a live countdown to the next refresh
- Dark mode toggle that remembers your preference
- Works across multiple Zendesk tabs simultaneously
- Persistent settings across browser sessions
- Cross-browser support (Chrome, Firefox, Edge, and other Chromium-based browsers)

## Usage
1. Install the extension for your browser.
2. Click the extension icon to open the popup.
3. Select your desired refresh interval from the dropdown menu (5 seconds to 10 minutes) or set a custom interval in seconds.
4. Toggle **Enable auto-refresh** to start or pause refreshing.
5. (Optional) Tap the moon/sun icon to switch between light and dark mode.
6. Your settings are saved automatically for future sessions.

![image](https://github.com/user-attachments/assets/0f98cc0f-ce1b-4747-97a7-3d2a9278825b)

## How It Works
The extension locates the refresh button in your Zendesk views and programmatically triggers it on the interval you choose. It handles multiple Zendesk layouts by checking several selectors and keeps a single countdown per tab. All preferences (interval, auto-refresh state, and dark mode) are stored locally so they persist across sessions.

![Zendesk-View-Refresher-Setup](https://github.com/user-attachments/assets/1ea5fe66-65cc-4b22-85ae-25b26c2abbf5)

## Current Versions
- **Chromium-based browsers:** 1.0.9 (Manifest V3)
- **Firefox:** 1.0.7 (Manifest V2 with browser-specific settings)

For release history, see the [Git commit log](https://github.com/DeclanE47/zendesk-view-auto-refresh/commits/main) or your browser's store listing.

## Compatibility

- Chrome: 88+
- Firefox: 78+
- Edge: 88+
- Opera: 75+
- Other Chromium-based browsers: 88+

## Development
This project contains versions of the extension compatible with both Chromium-based browsers and Firefox in a single repository. The codebase is unified to work seamlessly across different browser platforms while maintaining adjustments where necessary.

### Project Structure

```
zendesk-view-auto-refresh/
├── Chromium/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── icon-off-16.png
│   ├── icon-off-48.png
│   └── icon-off-128.png
├── Firefox/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── icon-off-16.png
│   ├── icon-off-48.png
│   └── icon-off-128.png
```

### Building and Testing

1. Clone the repository:
   ```
   git clone https://github.com/DeclanE47/zendesk-view-auto-refresh.git
   ```
2. For Chromium-based browsers:
   - Open your browser and go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `Chromium` folder
3. For Firefox:
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on" and select the `manifest.json` file in the `Firefox` folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/DeclanE47/zendesk-view-auto-refresh/issues) on GitHub.

---

Maintained by [Emery.Tools](https://emery.tools)
