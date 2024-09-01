# Zendesk View Auto-Refresh

Zendesk View Auto-Refresh is a browser extension that automatically refreshes your Zendesk views, ensuring you always have the most up-to-date information without manual intervention.

## Features

- Automatic refresh of Zendesk views
- Customizable refresh intervals (30 seconds to 10 minutes)
- Easy to use on/off toggle
- Countdown timer to next refresh
- Works with multiple Zendesk tabs simultaneously

## Installation

### Chromium-based Browsers (Chrome, Edge, Brave, etc.)

[Chrome Web Store Link] - Coming Soon!

### Firefox

[Firefox Add-ons Store Link] - Coming Soon!

## Usage

1. Install the extension for your browser.
2. Click on the extension icon to open the popup.
3. Select your desired refresh interval from the dropdown menu.
4. Toggle the "Enable auto-refresh" switch to start or stop the auto-refresh.

![image](https://github.com/user-attachments/assets/99e59a55-90c4-49ee-b952-f675d5a24540)

## How It Works

The extension works by simulating a click on the refresh button in your Zendesk views. It supports various Zendesk layouts and attempts to find the correct refresh button using multiple selectors.



## Development

This project contains both Chromium and Firefox versions of the extension in a single repository.

### Project Structure

```
zendesk-view-auto-refresh/
├── chromium/
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
├── firefox/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   ├── popup.js
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   ├── icon-off-16.png
│   ├── icon-off-48.png
    └── icon-off-128.png
```

### Building and Testing

1. Clone the repository:
   ```
   git clone https://github.com/DeclanE47/zendesk-view-auto-refresh.git
   ```

2. For Chromium-based browsers:
   - Open your browser and go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chromium` folder

3. For Firefox:
   - Open Firefox and go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on" and select the `manifest.json` file in the `firefox` folder

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/DeclanE47/zendesk-view-auto-refresh/issues) on GitHub.

---

Maintained by [Emery.Tools](https://emery.tools)
