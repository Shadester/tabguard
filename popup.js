// Get current tab and update UI
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  const lockBoth = document.getElementById('lockBoth');
  const togglePageLock = document.getElementById('togglePageLock');
  const toggleTabLock = document.getElementById('toggleTabLock');
  const helpBtn = document.getElementById('helpBtn');
  const helpTooltip = document.getElementById('helpTooltip');

  // Help button toggle
  helpBtn.addEventListener('click', () => {
    helpTooltip.classList.toggle('hidden');
  });

  // Get initial lock status
  chrome.runtime.sendMessage(
    { action: 'getLockStatus', tabId: currentTab.id },
    (response) => {
      updateUI(response.pageLock, response.tabLock);
    }
  );

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
