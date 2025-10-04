// Track if page is locked and settings
let isPageLocked = false;
let openLinksInNewTab = true; // Default value

// Listen for page lock status changes and settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setPageLock') {
    isPageLocked = request.enabled;
    sendResponse({ success: true });
  } else if (request.action === 'settingsUpdated') {
    openLinksInNewTab = request.settings.openLinksInNewTab;
    sendResponse({ success: true });
  }
  return true;
});

// Check initial page lock status and settings
chrome.runtime.sendMessage({ action: 'checkPageLock' }, (response) => {
  if (response) {
    isPageLocked = response.pageLock;
    openLinksInNewTab = response.openLinksInNewTab ?? true;
  }
});

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
