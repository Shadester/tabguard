// Get current tab and update UI
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  const lockBoth = document.getElementById('lockBoth');
  const togglePageLock = document.getElementById('togglePageLock');
  const toggleTabLock = document.getElementById('toggleTabLock');
  const toggleOpenInNewTab = document.getElementById('toggleOpenInNewTab');
  const toggleTabOverride = document.getElementById('toggleTabOverride');
  const overrideStatus = document.getElementById('overrideStatus');
  const helpBtn = document.getElementById('helpBtn');
  const helpTooltip = document.getElementById('helpTooltip');

  let globalSetting = true;
  let tabOverride = null;

  // Help button toggle
  helpBtn.addEventListener('click', () => {
    helpTooltip.classList.toggle('hidden');
  });

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');

  function switchTab(button) {
    const tabName = button.getAttribute('data-tab');

    // Update ARIA and classes
    tabButtons.forEach(btn => {
      const isActive = btn === button;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(tabName + '-tab').classList.add('active');
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      switchTab(button);
    });

    // Keyboard navigation for tabs
    button.addEventListener('keydown', (e) => {
      let newIndex;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        newIndex = index > 0 ? index - 1 : tabButtons.length - 1;
        tabButtons[newIndex].focus();
        switchTab(tabButtons[newIndex]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        newIndex = index < tabButtons.length - 1 ? index + 1 : 0;
        tabButtons[newIndex].focus();
        switchTab(tabButtons[newIndex]);
      } else if (e.key === 'Home') {
        e.preventDefault();
        tabButtons[0].focus();
        switchTab(tabButtons[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        tabButtons[tabButtons.length - 1].focus();
        switchTab(tabButtons[tabButtons.length - 1]);
      }
    });
  });

  // Get initial lock status
  chrome.runtime.sendMessage(
    { action: 'getLockStatus', tabId: currentTab.id },
    (response) => {
      updateUI(response.pageLock, response.tabLock);
      tabOverride = response.openLinksInNewTab;
      updateOverrideUI();
    }
  );

  // Get initial settings
  chrome.runtime.sendMessage(
    { action: 'getSettings' },
    (response) => {
      if (response) {
        globalSetting = response.openLinksInNewTab;
        toggleOpenInNewTab.setAttribute('data-active', response.openLinksInNewTab);
        toggleOpenInNewTab.setAttribute('aria-checked', response.openLinksInNewTab);
        updateOverrideUI();
      }
    }
  );

  function updateOverrideUI() {
    const hasOverride = tabOverride !== null;
    toggleTabOverride.setAttribute('data-active', hasOverride);
    toggleTabOverride.setAttribute('aria-checked', hasOverride);

    if (hasOverride) {
      const behavior = tabOverride ? 'Opens in new tab' : 'Blocks navigation';
      overrideStatus.textContent = `Override: ${behavior}`;
    } else {
      const globalBehavior = globalSetting ? 'opens in new tab' : 'blocks navigation';
      overrideStatus.textContent = `Using global (${globalBehavior})`;
    }
  }

  // Lock Both
  lockBoth.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'lockBoth',
      tabId: currentTab.id,
      url: currentTab.url
    }, (response) => {
      if (response) {
        updateUI(response.pageLock, response.tabLock);
      }
    });
  });

  // Toggle Page Lock
  togglePageLock.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'toggleLock',
      tabId: currentTab.id,
      lockType: 'page',
      url: currentTab.url
    }, (response) => {
      updateUI(response.pageLock, response.tabLock);
    });
  });

  // Toggle Tab Lock
  toggleTabLock.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'toggleLock',
      tabId: currentTab.id,
      lockType: 'tab',
      url: currentTab.url
    }, (response) => {
      updateUI(response.pageLock, response.tabLock);
    });
  });

  // Toggle Open Links in New Tab (Global)
  toggleOpenInNewTab.addEventListener('click', () => {
    const currentValue = toggleOpenInNewTab.getAttribute('data-active') === 'true';
    const newValue = !currentValue;

    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: { openLinksInNewTab: newValue }
    }, (response) => {
      if (response) {
        globalSetting = response.openLinksInNewTab;
        toggleOpenInNewTab.setAttribute('data-active', response.openLinksInNewTab);
        toggleOpenInNewTab.setAttribute('aria-checked', response.openLinksInNewTab);
        updateOverrideUI();
      }
    });
  });

  // Toggle Tab Override
  toggleTabOverride.addEventListener('click', () => {
    let newOverride;

    if (tabOverride === null) {
      // No override currently - set to opposite of global
      newOverride = !globalSetting;
    } else {
      // Has override - clear it to use global
      newOverride = null;
    }

    chrome.runtime.sendMessage({
      action: 'updateSettings',
      tabId: currentTab.id,
      url: currentTab.url,
      settings: { openLinksInNewTab: newOverride }
    }, (response) => {
      if (response) {
        tabOverride = response.openLinksInNewTab;
        updateOverrideUI();
      }
    });
  });
});

function updateUI(pageLock, tabLock) {
  const lockBoth = document.getElementById('lockBoth');
  const togglePageLock = document.getElementById('togglePageLock');
  const toggleTabLock = document.getElementById('toggleTabLock');

  togglePageLock.setAttribute('data-active', pageLock);
  togglePageLock.setAttribute('aria-checked', pageLock);
  toggleTabLock.setAttribute('data-active', tabLock);
  toggleTabLock.setAttribute('aria-checked', tabLock);

  // Update lock both button
  const bothLocked = pageLock && tabLock;
  if (bothLocked) {
    lockBoth.classList.add('locked');
    lockBoth.textContent = '✓ Both Locked';
  } else {
    lockBoth.classList.remove('locked');
    lockBoth.textContent = '🔒⛔ Lock Both';
  }
}
