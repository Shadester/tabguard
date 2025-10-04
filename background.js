// Storage structure: { tabId: { pageLock: boolean, tabLock: boolean, url: string, openLinksInNewTab: boolean | null } }
// openLinksInNewTab: null = use global setting, true/false = override
let lockedTabs = {};
// Track pending reopened tabs to restore lock state
let pendingReopenedTabs = new Map(); // url -> lock state
// Global settings
let settings = {
  openLinksInNewTab: true // Default to opening links in new tab
};

// Load locked tabs and settings from storage on startup
chrome.storage.local.get(['lockedTabs', 'settings'], (result) => {
  lockedTabs = result.lockedTabs || {};
  settings = result.settings || { openLinksInNewTab: true };
});

// Create context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'togglePageLock',
    title: 'Toggle Page Lock (prevent navigation)',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'toggleTabLock',
    title: 'Toggle Tab Lock (prevent close)',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'separator',
    type: 'separator',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'unlockAll',
    title: 'Unlock All',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'togglePageLock') {
    toggleLock(tab.id, 'page', tab.url);
  } else if (info.menuItemId === 'toggleTabLock') {
    toggleLock(tab.id, 'tab', tab.url);
  } else if (info.menuItemId === 'unlockAll') {
    unlockTab(tab.id);
  }
});

// Prevent navigation on page-locked tabs
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  const lock = lockedTabs[details.tabId];

  if (!lock) return;

  // Update locked URL if tab lock is on but page lock is off
  if (lock.tabLock && !lock.pageLock) {
    lockedTabs[details.tabId].url = details.url;
    saveLocks();
  }

  // For page lock, prevent navigation to different URLs
  if (lock.pageLock && details.frameId === 0) {
    const lockedUrl = new URL(lock.url);
    const targetUrl = new URL(details.url);

    // Allow same-page navigation (hash changes)
    if (lockedUrl.origin === targetUrl.origin &&
        lockedUrl.pathname === targetUrl.pathname &&
        lockedUrl.search === targetUrl.search) {
      return; // Allow hash-only changes
    }

    // Block navigation to different page
    chrome.tabs.update(details.tabId, { url: lock.url });
  }
});

// Prevent tab from closing
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const lock = lockedTabs[tabId];

  if (lock && lock.tabLock) {
    // Store the lock state before reopening
    pendingReopenedTabs.set(lock.url, { ...lock });

    // Reopen the tab with the last known URL
    chrome.tabs.create({
      url: lock.url,
      index: removeInfo.windowClosing ? undefined : tabId
    }, (newTab) => {
      // Transfer lock state to new tab immediately
      if (newTab && pendingReopenedTabs.has(lock.url)) {
        const savedLock = pendingReopenedTabs.get(lock.url);
        lockedTabs[newTab.id] = savedLock;
        pendingReopenedTabs.delete(lock.url);
        saveLocks();
        updateTabIndicator(newTab.id);
      }
    });

    // Clean up old tab entry
    delete lockedTabs[tabId];
    saveLocks();
  } else {
    // Clean up storage for unlocked tabs
    delete lockedTabs[tabId];
    saveLocks();
  }
});

// Update visual indicators when tab loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if this is a reopened tab that needs its lock restored
  if (changeInfo.url && pendingReopenedTabs.has(changeInfo.url) && !lockedTabs[tabId]) {
    const savedLock = pendingReopenedTabs.get(changeInfo.url);
    lockedTabs[tabId] = savedLock;
    pendingReopenedTabs.delete(changeInfo.url);
    saveLocks();
  }

  if (changeInfo.status === 'complete') {
    updateTabIndicator(tabId);
    const lock = lockedTabs[tabId];
    if (lock) {
      updateTabTitle(tabId, lock);
    }
  }
});

// Update indicators when tab becomes active
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateTabIndicator(activeInfo.tabId);
});

function toggleLock(tabId, lockType, url) {
  if (!lockedTabs[tabId]) {
    lockedTabs[tabId] = { pageLock: false, tabLock: false, url, openLinksInNewTab: null };
  }

  if (lockType === 'page') {
    lockedTabs[tabId].pageLock = !lockedTabs[tabId].pageLock;
    // Notify content script about page lock change
    notifyContentScript(tabId, lockedTabs[tabId].pageLock);
  } else if (lockType === 'tab') {
    lockedTabs[tabId].tabLock = !lockedTabs[tabId].tabLock;
  }

  // Remove entry if both locks are off and no override is set
  if (!lockedTabs[tabId].pageLock && !lockedTabs[tabId].tabLock && lockedTabs[tabId].openLinksInNewTab === null) {
    delete lockedTabs[tabId];
    removeTabTitlePrefix(tabId);
  } else {
    updateTabTitle(tabId, lockedTabs[tabId]);
  }

  saveLocks();
  updateTabIndicator(tabId);
}

function unlockTab(tabId) {
  // Notify content script to disable page lock
  notifyContentScript(tabId, false);

  delete lockedTabs[tabId];
  saveLocks();
  updateTabIndicator(tabId);
  removeTabTitlePrefix(tabId);
}

function notifyContentScript(tabId, pageLockEnabled) {
  chrome.tabs.sendMessage(tabId, {
    action: 'setPageLock',
    enabled: pageLockEnabled
  }).catch(() => {
    // Ignore errors if content script not ready
  });
}

function saveLocks() {
  chrome.storage.local.set({ lockedTabs });
}

function updateTabIndicator(tabId) {
  const lock = lockedTabs[tabId];

  if (lock && (lock.pageLock || lock.tabLock)) {
    chrome.action.setBadgeText({ tabId, text: '🔒' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#FF0000' });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

function updateTabTitle(tabId, lock) {
  // No longer updating tab titles - removed for cleaner UI
}

function removeTabTitlePrefix(tabId) {
  // No longer updating tab titles - removed for cleaner UI
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLockStatus') {
    const lock = lockedTabs[request.tabId];
    sendResponse({
      pageLock: lock?.pageLock || false,
      tabLock: lock?.tabLock || false,
      openLinksInNewTab: lock?.openLinksInNewTab ?? null
    });
  } else if (request.action === 'lockBoth') {
    // Lock both or unlock both (toggle)
    const lock = lockedTabs[request.tabId];
    const bothLocked = lock && lock.pageLock && lock.tabLock;

    if (bothLocked) {
      // Unlock both
      unlockTab(request.tabId);
      sendResponse({ pageLock: false, tabLock: false, openLinksInNewTab: null });
    } else {
      // Lock both
      if (!lockedTabs[request.tabId]) {
        lockedTabs[request.tabId] = { pageLock: false, tabLock: false, url: request.url, openLinksInNewTab: null };
      }
      lockedTabs[request.tabId].pageLock = true;
      lockedTabs[request.tabId].tabLock = true;
      lockedTabs[request.tabId].url = request.url;

      saveLocks();
      updateTabIndicator(request.tabId);
      updateTabTitle(request.tabId, lockedTabs[request.tabId]);
      notifyContentScript(request.tabId, true);
      sendResponse({ pageLock: true, tabLock: true, openLinksInNewTab: lockedTabs[request.tabId].openLinksInNewTab });
    }
  } else if (request.action === 'toggleLock') {
    toggleLock(request.tabId, request.lockType, request.url);
    const lock = lockedTabs[request.tabId];
    sendResponse({
      pageLock: lock?.pageLock || false,
      tabLock: lock?.tabLock || false,
      openLinksInNewTab: lock?.openLinksInNewTab ?? null
    });
  } else if (request.action === 'unlockAll') {
    unlockTab(request.tabId);
    sendResponse({ pageLock: false, tabLock: false, openLinksInNewTab: null });
  } else if (request.action === 'checkPageLock') {
    // Content script checking if page is locked
    const tabId = sender.tab?.id;
    const lock = lockedTabs[tabId];
    const effectiveOpenLinksInNewTab = lock?.openLinksInNewTab ?? settings.openLinksInNewTab;
    sendResponse({
      pageLock: lock?.pageLock || false,
      openLinksInNewTab: effectiveOpenLinksInNewTab
    });
  } else if (request.action === 'getSettings') {
    sendResponse(settings);
  } else if (request.action === 'updateSettings') {
    if (request.tabId !== undefined) {
      // Per-tab override
      if (!lockedTabs[request.tabId]) {
        lockedTabs[request.tabId] = { pageLock: false, tabLock: false, url: request.url, openLinksInNewTab: null };
      }

      const newOverrideValue = request.settings.openLinksInNewTab;
      lockedTabs[request.tabId].openLinksInNewTab = newOverrideValue;

      // Calculate effective value before potential cleanup
      const effectiveValue = newOverrideValue ?? settings.openLinksInNewTab;

      // Clean up if no locks and no override
      if (!lockedTabs[request.tabId].pageLock && !lockedTabs[request.tabId].tabLock &&
          lockedTabs[request.tabId].openLinksInNewTab === null) {
        delete lockedTabs[request.tabId];
      }

      saveLocks();

      // Notify this tab about the setting change
      chrome.tabs.sendMessage(request.tabId, {
        action: 'settingsUpdated',
        settings: { openLinksInNewTab: effectiveValue }
      }).catch(() => {
        // Ignore errors if content script not ready
      });

      sendResponse({
        openLinksInNewTab: newOverrideValue,
        effectiveValue: effectiveValue
      });
    } else {
      // Global setting
      settings = { ...settings, ...request.settings };
      chrome.storage.local.set({ settings });
      // Notify all tabs about the setting change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          const lock = lockedTabs[tab.id];
          const effectiveValue = lock?.openLinksInNewTab ?? settings.openLinksInNewTab;
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: { openLinksInNewTab: effectiveValue }
          }).catch(() => {
            // Ignore errors if content script not ready
          });
        });
      });
      sendResponse(settings);
    }
  }
  return true;
});
