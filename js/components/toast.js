/**
 * Toast Notification Component
 * Shows brief success/error/warning messages that auto-dismiss
 */

let currentToast = null;
let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', or 'warning' (default: 'success')
 */
export function showToast(message, type = 'success') {
  // Remove existing toast if any
  if (currentToast) {
    removeToast();
  }

  // Clear any pending timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  // Get icon based on type
  const icon = getIcon(type);

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
    <button class="toast-close" aria-label="Close notification">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Add close button handler
  const closeButton = toast.querySelector('.toast-close');
  closeButton.addEventListener('click', () => removeToast());

  // Add to DOM
  document.body.appendChild(toast);
  currentToast = toast;

  // Trigger fade-in animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto-dismiss after 3 seconds
  toastTimeout = setTimeout(() => {
    removeToast();
  }, 3000);
}

/**
 * Remove the current toast
 */
function removeToast() {
  if (!currentToast) return;

  // Fade out
  currentToast.classList.remove('toast-show');
  currentToast.classList.add('toast-hide');

  // Remove from DOM after animation
  setTimeout(() => {
    if (currentToast && currentToast.parentNode) {
      currentToast.parentNode.removeChild(currentToast);
    }
    currentToast = null;
  }, 300);

  // Clear timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }
}

/**
 * Get icon SVG based on toast type
 * @param {string} type - Toast type
 * @returns {string} SVG icon HTML
 */
function getIcon(type) {
  switch (type) {
    case 'success':
      return `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    case 'error':
      return `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      `;
    case 'warning':
      return `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    default:
      return '';
  }
}

// Made with Bob
