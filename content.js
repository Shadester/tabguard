// Track if page is locked
let isPageLocked = false;
let lockBanner = null;
let bannerPosition = null; // Track custom position
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Listen for page lock status changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setPageLock') {
    isPageLocked = request.enabled;
    updateLockBanner();
    sendResponse({ success: true });
  }
  return true;
});

// Check initial page lock status (wait for DOM)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLockState);
} else {
  initializeLockState();
}

function initializeLockState() {
  chrome.runtime.sendMessage({ action: 'checkPageLock' }, (response) => {
    if (response) {
      isPageLocked = response.pageLock;
      updateLockBanner();
    }
  });
}

// Intercept link clicks to prevent navigation and open in new tab
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

  // Block navigation and open in new tab
  event.preventDefault();
  event.stopPropagation();

  // Get absolute URL and open in new tab
  const absoluteUrl = new URL(href, window.location.href).href;
  window.open(absoluteUrl, '_blank');
}, true); // Use capture phase to catch before other handlers

// Create and manage lock indicator
function createLockBanner() {
  const banner = document.createElement('div');
  banner.id = 'tabguard-lock-banner';
  banner.innerHTML = `
    <span class="tabguard-banner-icon" title="Click to unlock">🔒</span>
    <button class="tabguard-banner-hide" title="Hide (doesn't unlock)">×</button>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #tabguard-lock-banner {
      position: fixed !important;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      padding: 4px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      cursor: move;
      transition: box-shadow 0.2s ease;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    #tabguard-lock-banner:hover {
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    }
    #tabguard-lock-banner.dragging {
      cursor: grabbing;
      transition: none;
    }
    .tabguard-banner-icon {
      font-size: 12px;
      cursor: pointer;
    }
    .tabguard-banner-hide {
      display: none;
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #e74c3c;
      color: white;
      border: 2px solid white;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 0;
      font-weight: bold;
      z-index: 1;
    }
    #tabguard-lock-banner:hover .tabguard-banner-hide {
      display: block;
    }
    .tabguard-banner-hide:hover {
      background: #c0392b;
    }
  `;

  // Ensure head and body exist
  if (!document.head || !document.body) {
    console.error('TabGuard: Cannot create banner - DOM not ready');
    return null;
  }

  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Restore saved position if exists
  if (bannerPosition) {
    banner.style.top = bannerPosition.top;
    banner.style.right = bannerPosition.right;
    banner.style.left = bannerPosition.left;
    banner.style.bottom = bannerPosition.bottom;
  }

  // Lock icon click to unlock
  const lockIcon = banner.querySelector('.tabguard-banner-icon');
  lockIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isDragging) {
      chrome.runtime.sendMessage({ action: 'unlockAllFromBanner' });
    }
  });

  // Hide button handler
  const hideBtn = banner.querySelector('.tabguard-banner-hide');
  hideBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    banner.style.display = 'none';
  });

  // Drag functionality
  banner.addEventListener('mousedown', startDrag);

  function startDrag(e) {
    // Ignore if clicking hide button or lock icon
    if (e.target.classList.contains('tabguard-banner-hide') ||
        e.target.classList.contains('tabguard-banner-icon')) {
      return;
    }

    isDragging = true;
    banner.classList.add('dragging');

    const rect = banner.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }

  function doDrag(e) {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Keep banner within viewport
    const maxX = window.innerWidth - banner.offsetWidth;
    const maxY = window.innerHeight - banner.offsetHeight;

    const clampedX = Math.max(0, Math.min(x, maxX));
    const clampedY = Math.max(0, Math.min(y, maxY));

    // Switch to left/top positioning for dragging
    banner.style.left = clampedX + 'px';
    banner.style.top = clampedY + 'px';
    banner.style.right = 'auto';
    banner.style.bottom = 'auto';
  }

  function stopDrag() {
    if (!isDragging) return;

    isDragging = false;
    banner.classList.remove('dragging');
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);

    // Save position
    bannerPosition = {
      top: banner.style.top,
      left: banner.style.left,
      right: banner.style.right,
      bottom: banner.style.bottom
    };
  }

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
