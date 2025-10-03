// Track if page is locked
let isPageLocked = false;

// Listen for page lock status changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setPageLock') {
    isPageLocked = request.enabled;
    sendResponse({ success: true });
  }
  return true;
});

// Check initial page lock status
chrome.runtime.sendMessage({ action: 'checkPageLock' }, (response) => {
  if (response) {
    isPageLocked = response.pageLock;
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

  // Block all other navigation
  event.preventDefault();
  event.stopPropagation();
}, true); // Use capture phase to catch before other handlers
