# TabGuard - Chrome/Brave Extension

Guard your tabs from closing or navigating away from the current page.

## Features

- **🔒⛔ Lock Both** - Quick one-click button to lock both page and tab
- **🔒 Page Lock** - Prevents navigation away from the current URL (allows same-page hash changes)
- **⛔ Tab Lock** - Prevents closing the tab (reopens immediately if closed)
- **Simple visual indicator** - 🔒 badge on extension icon when any lock is active
- **Right-click menu** - Quick access to toggle locks from context menu
- **Persistent** - Lock states saved across browser restarts

## Installation

### Option 1: Install from Source (Recommended for now)

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/yourusername/locktab.git
   cd locktab
   ```

2. **Generate icons** (one-time setup)
   - Open `icons/generate-icons.html` in your browser
   - Right-click each canvas and save as PNG:
     - `icon16.png`
     - `icon48.png`
     - `icon128.png`
   - Save all in the `icons/` folder

3. **Load extension in Chrome/Brave**
   - Open `chrome://extensions/` (or `brave://extensions/`)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `locktab` folder

### Option 2: Chrome Web Store (Coming Soon)
*Extension will be published to Chrome Web Store for easy one-click installation*

## Usage

### Quick Lock (Most Common)
1. Click the LockTab extension icon
2. Click the big **"🔒⛔ Lock Both"** button
3. Done! Tab is now locked from closing and navigation

### Individual Locks
- **Page Lock toggle** - Prevents navigation only
- **Tab Lock toggle** - Prevents closing only
- **Unlock All** - Remove all locks

### Right-Click Menu
1. Right-click anywhere on the page
2. Select "Toggle Page Lock" or "Toggle Tab Lock"
3. Or select "Unlock All" to remove all locks

## How It Works

- **Page Lock**: Intercepts navigation events and redirects back to the locked URL (same-page hash navigation is allowed)
- **Tab Lock**: Detects tab close events and immediately reopens the tab with the same URL and lock state
- **Lock states**: Persisted in Chrome's local storage and survive browser restarts
- **No passwords**: Simple toggle on/off for quick use

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

MIT License - feel free to use and modify
