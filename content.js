// Track if page is locked and settings
let isPageLocked = false;
let openLinksInNewTab = true; // Default value
let lockBanner = null;

// Listen for page lock status changes and settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setPageLock') {
    isPageLocked = request.enabled;
    updateLockBanner();
    sendResponse({ success: true });
  } else if (request.action === 'settingsUpdated') {
    openLinksInNewTab = request.settings.openLinksInNewTab;
    sendResponse({ success: true });
  }
  return true;
});

// Check initial page lock status and settings (wait for DOM)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLockState);
} else {
  initializeLockState();
}

function initializeLockState() {
  chrome.runtime.sendMessage({ action: 'checkPageLock' }, (response) => {
    if (response) {
      isPageLocked = response.pageLock;
      openLinksInNewTab = response.openLinksInNewTab ?? true;
      updateLockBanner();
    }
  });
}

// Intercept link clicks to prevent navigation
document.addEventListener('click', (event) => {
  if (!isPageLocked) return;

  // Find the closest anchor element
  let target = event.target;
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
  }

  if (!target) return;

  const href = target.getAttribute('href');
  if (!href) return;

  // Allow hash-only links (same page navigation)
  if (href.startsWith('#')) return;

  // Allow javascript: links
  if (href.startsWith('javascript:')) return;

  // Block navigation but optionally open in new tab
  event.preventDefault();
  event.stopPropagation();

  // If setting is enabled, open link in new tab
  if (openLinksInNewTab) {
    // Get absolute URL
    const absoluteUrl = new URL(href, window.location.href).href;
    window.open(absoluteUrl, '_blank');
  }
}, true); // Use capture phase to catch before other handlers

// Create and manage lock indicator
function createLockBanner() {
  const banner = document.createElement('div');
  banner.id = 'tabguard-lock-banner';
  banner.innerHTML = `
    <span class="tabguard-banner-icon">🔒</span>
  `;
  banner.title = 'Page Locked - Click to unlock';

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #tabguard-lock-banner {
      position: fixed;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      padding: 6px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #tabguard-lock-banner:hover {
      transform: scale(1.1);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    }
    .tabguard-banner-icon {
      font-size: 16px;
    }
  `;

  // Ensure head and body exist
  if (!document.head || !document.body) {
    console.error('TabGuard: Cannot create banner - DOM not ready');
    return null;
  }

  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Click to unlock all locks
  banner.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'unlockAllFromBanner' });
  });

  return banner;
}

function updateLockBanner() {
  if (isPageLocked) {
    if (!lockBanner) {
      lockBanner = createLockBanner();
    }
  } else {
    if (lockBanner) {
      lockBanner.remove();
      lockBanner = null;
    }
  }
}
