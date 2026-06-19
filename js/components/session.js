/**
 * Session Component
 * Manages user session and displays session bar
 */

let currentUser = null;

/**
 * Initialize session management
 */
export async function initSession() {
  // Check for existing session
  const storedUser = sessionStorage.getItem('currentUser');
  
  if (!storedUser) {
    // No user logged in, redirect to login page
    window.location.href = 'login.html';
    return;
  }
  
  try {
    currentUser = JSON.parse(storedUser);
  } catch (e) {
    console.error('Error parsing stored user:', e);
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    return;
  }
  
  // Render session bar
  renderSessionBar();
  
  // Setup event listener
  setupEventListeners();
}

/**
 * Get user initials from full name
 */
function getInitials(fullName) {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
}

/**
 * Render the session bar with dropdown profile menu
 */
function renderSessionBar() {
  // Find or create session bar container
  let sessionBar = document.querySelector('.session-bar');
  
  if (!sessionBar) {
    sessionBar = document.createElement('div');
    sessionBar.className = 'session-bar';
    
    // Insert at the top of main-content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.insertBefore(sessionBar, mainContent.firstChild);
    }
  }
  
  // Render logged-in state with dropdown
  if (currentUser) {
    const initials = getInitials(currentUser.name);
    
    sessionBar.innerHTML = `
      <div class="session-profile" id="session-profile">
        <button class="session-trigger" id="session-trigger">
          <div class="session-avatar">${initials}</div>
          <span class="session-username">${currentUser.name}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="session-dropdown" id="session-dropdown">
          <div class="session-dropdown-header">
            <div class="session-avatar session-avatar-lg">${initials}</div>
            <div>
              <div class="session-fullname">${currentUser.name}</div>
              <div class="session-role-text">${currentUser.role}</div>
            </div>
          </div>
          <hr class="session-divider">
          <button class="session-logout-btn" id="session-logout-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log Out
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown() {
  const dropdown = document.getElementById('session-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('session-dropdown-open');
  }
}

/**
 * Close dropdown menu
 */
function closeDropdown() {
  const dropdown = document.getElementById('session-dropdown');
  if (dropdown) {
    dropdown.classList.remove('session-dropdown-open');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle dropdown on trigger click
  document.addEventListener('click', (e) => {
    const trigger = document.getElementById('session-trigger');
    const dropdown = document.getElementById('session-dropdown');
    const logoutBtn = document.getElementById('session-logout-btn');
    
    // Handle logout button click
    if (e.target.id === 'session-logout-btn' || e.target.closest('#session-logout-btn')) {
      handleLogout();
      return;
    }
    
    // Handle trigger click
    if (e.target.id === 'session-trigger' || e.target.closest('#session-trigger')) {
      e.stopPropagation();
      toggleDropdown();
      return;
    }
    
    // Close dropdown if clicking outside
    if (dropdown && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });
}

/**
 * Handle logout
 */
function handleLogout() {
  // Clear session
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('token');
  
  // Redirect to login page
  window.location.href = 'login.html';
}

/**
 * Get current logged-in user
 * @returns {Object|null} Current user object or null
 */
export function getCurrentUser() {
  return currentUser;
}

// Made with Bob
