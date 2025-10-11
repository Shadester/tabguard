# TabGuard - Chrome/Brave Extension

Guard your tabs from closing or navigating away from the current page.

## Features

### Lock Controls
- **🔒⛔ Lock Both** - Quick one-click button to lock both page and tab
- **🔒 Page Lock** - Prevents navigation away from the current URL
  - Allows same-page hash changes (anchor links)
  - Visual on-page indicator when active
  - Automatically opens blocked links in new tabs
- **⛔ Tab Lock** - Prevents closing the tab
  - Reopens immediately if closed
  - Preserves lock state across reopens

### Additional Features
- **Visual Indicators**
  - 🔒 badge on extension icon when any lock is active
  - On-page banner when Page Lock is enabled
- **Right-click menu** - Quick access to toggle locks from context menu
- **Persistent** - Lock states saved across browser restarts
- **Keyboard Shortcuts** - Quick access via keyboard (see below)

## Installation

### Option 1: Download from GitHub Releases (Easiest)

1. **Download the latest release**
   - Go to [Releases](https://github.com/Shadester/tabguard/releases/latest)
   - Download `tabguard-v1.0.0.zip`
   - Extract the zip file

2. **Load extension in Chrome/Brave**
   - Open `chrome://extensions/` (or `brave://extensions/`)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the extracted `tabguard` folder

### Option 2: Clone from Source

```bash
git clone https://github.com/Shadester/tabguard.git
cd tabguard
```

Then follow step 2 above.

### Option 3: Chrome Web Store (Coming Soon)
*Extension will be published to Chrome Web Store for easy one-click installation*

## Usage

### Via Popup (Click Extension Icon)

Main controls:
- **Lock Both** button - Lock/unlock both Page and Tab simultaneously
- **Page Lock** toggle - Prevents navigation only (opens blocked links in new tabs)
- **Tab Lock** toggle - Prevents closing only

### Via Right-Click Menu
1. Right-click anywhere on the page
2. Select "Toggle Page Lock" or "Toggle Tab Lock"
3. Or select "Unlock All" to remove all locks

### Via Keyboard Shortcuts
- `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) - Toggle Page Lock
- `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) - Toggle Tab Lock

### On-Page Indicator
When Page Lock is active:
- A small blue lock icon (🔒) appears in the top-right corner
- Hover for tooltip: "Page Locked - Click to unlock"
- Click the icon to unlock all locks (both Page and Tab)

## How It Works

- **Page Lock**:
  - Intercepts navigation events and redirects back to the locked URL
  - Same-page hash navigation is allowed
  - Automatically opens blocked links in new tabs
  - Visual on-page banner for clear feedback
- **Tab Lock**:
  - Detects tab close events and immediately reopens the tab
  - Preserves URL and lock state
- **Lock states**:
  - Persisted in Chrome's local storage
  - Survive browser restarts
- **No passwords**: Simple toggle on/off for quick use

## Troubleshooting

### Page Lock isn't working
- Make sure the Page Lock toggle is ON (green)
- Check if the on-page banner is visible
- Some websites may prevent the extension from working (e.g., chrome:// pages)

### Links still navigate away
- Make sure you're clicking regular links (not form submissions or JavaScript events)
- Blocked links should automatically open in new tabs

### Tab Lock reopens in wrong position
- This is a browser limitation - reopened tabs appear at the end
- The tab will maintain its URL and lock state

### Extension not appearing
- Make sure Developer Mode is enabled in chrome://extensions/
- Try reloading the extension
- Check that all files were extracted from the zip

### Keyboard shortcuts not working
- Check chrome://extensions/shortcuts to see if shortcuts are configured
- Some shortcuts may conflict with browser or OS shortcuts
- You can customize shortcuts in chrome://extensions/shortcuts

## Browser Compatibility

- ✅ Google Chrome (Manifest V3)
- ✅ Brave Browser
- ✅ Microsoft Edge (Chromium-based)
- ✅ Any Chromium-based browser

## Contributing

Pull requests welcome! To contribute:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details
