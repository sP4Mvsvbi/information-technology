/**
 * Modal Component
 * Generic modal shell reused across all entity pages for Add/Edit forms
 */

let modalElement = null;
let modalContainer = null;
let currentOnConfirm = null;
let focusableElements = [];
let firstFocusableElement = null;
let lastFocusableElement = null;

/**
 * Creates the modal DOM structure if it doesn't exist
 */
function ensureModalExists() {
  if (modalElement) return;

  modalElement = document.createElement('div');
  modalElement.id = 'app-modal';
  modalElement.className = 'modal';
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');
  modalElement.setAttribute('aria-labelledby', 'modal-title');
  modalElement.style.display = 'none';

  modalElement.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title"></h2>
        <button class="modal-close" data-modal-close aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body" id="modal-body"></div>
      <div class="modal-footer">
        <button class="btn btn-default" data-modal-close>Cancel</button>
        <button class="btn btn-primary" id="modal-confirm">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalElement);

  // Cache container reference
  modalContainer = modalElement.querySelector('.modal-container');

  // Attach close event listeners
  const closeElements = modalElement.querySelectorAll('[data-modal-close]');
  closeElements.forEach(el => {
    el.addEventListener('click', closeModal);
  });

  // Attach confirm button listener
  const confirmButton = modalElement.querySelector('#modal-confirm');
  confirmButton.addEventListener('click', handleConfirm);

  // Prevent clicks inside modal container from closing
  modalContainer.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Attach focus trap listener once (will use updated focusable elements)
  modalContainer.addEventListener('keydown', handleFocusTrap);
}

/**
 * Opens the modal with specified content
 * @param {Object} config - Modal configuration
 * @param {string} config.title - Modal title
 * @param {string} config.bodyHtml - HTML content for modal body
 * @param {string} config.confirmLabel - Label for confirm button (default: "Save")
 * @param {Function} config.onConfirm - Callback when confirm is clicked
 * 
 * @example
 * openModal({
 *   title: 'Add Product',
 *   bodyHtml: '<form>...</form>',
 *   confirmLabel: 'Create',
 *   onConfirm: () => {
 *     // Handle form submission
 *     closeModal();
 *   }
 * });
 */
export function openModal({ title, bodyHtml, confirmLabel = 'Save', onConfirm }) {
  ensureModalExists();

  // Set modal content
  const titleElement = modalElement.querySelector('#modal-title');
  const bodyElement = modalElement.querySelector('#modal-body');
  const confirmButton = modalElement.querySelector('#modal-confirm');

  titleElement.textContent = title;
  bodyElement.innerHTML = bodyHtml;
  confirmButton.textContent = confirmLabel;

  // Store the confirm callback
  currentOnConfirm = onConfirm;

  // Show modal
  modalElement.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Setup focus trap
  setupFocusTrap();

  // Focus first focusable element
  if (firstFocusableElement) {
    firstFocusableElement.focus();
  }

  // Add escape key listener
  document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Closes the modal
 */
export function closeModal() {
  if (!modalElement) return;

  modalElement.style.display = 'none';
  document.body.style.overflow = '';
  currentOnConfirm = null;

  // Clear modal content
  const bodyElement = modalElement.querySelector('#modal-body');
  bodyElement.innerHTML = '';

  // Remove escape key listener
  document.removeEventListener('keydown', handleEscapeKey);

  // Clear focus trap
  focusableElements = [];
  firstFocusableElement = null;
  lastFocusableElement = null;
}

/**
 * Handles confirm button click
 */
function handleConfirm() {
  if (currentOnConfirm && typeof currentOnConfirm === 'function') {
    currentOnConfirm();
  }
}

/**
 * Handles escape key press
 */
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
}

/**
 * Sets up focus trap to keep focus within modal
 */
function setupFocusTrap() {
  // Get all focusable elements
  focusableElements = modalContainer.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  firstFocusableElement = focusableElements[0];
  lastFocusableElement = focusableElements[focusableElements.length - 1];
}

/**
 * Handles tab key to trap focus within modal
 */
function handleFocusTrap(e) {
  if (e.key !== 'Tab') return;

  if (e.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstFocusableElement) {
      e.preventDefault();
      lastFocusableElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastFocusableElement) {
      e.preventDefault();
      firstFocusableElement.focus();
    }
  }
}

// Made with Bob
