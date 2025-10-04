// Get current tab and update UI
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  const lockBoth = document.getElementById('lockBoth');
  const togglePageLock = document.getElementById('togglePageLock');
  const toggleTabLock = document.getElementById('toggleTabLock');
  const toggleOpenInNewTab = document.getElementById('toggleOpenInNewTab');
  const toggleTabOverride = document.getElementById('toggleTabOverride');
  const overrideStatus = document.getElementById('overrideStatus');

  let globalSetting = true;
  let tabOverride = null;

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Update button states
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content visibility
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tabName + '-tab').classList.add('active');
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
        updateOverrideUI();
      }
    }
  );

  function updateOverrideUI() {
    const hasOverride = tabOverride !== null;
    toggleTabOverride.setAttribute('data-active', hasOverride);

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
  toggleTabLock.setAttribute('data-active', tabLock);

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
