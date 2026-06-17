/**
 * Login Page
 * Handles user authentication with username and password
 */

// Mock accounts for demonstration
const MOCK_ACCOUNTS = [
  { user_id: 'U001', username: 'jsmith',  password: 'smith123',  role: 'Admin',   name: 'John Smith' },
  { user_id: 'U002', username: 'jdoe',    password: 'doe123',    role: 'Manager', name: 'Jane Doe' },
  { user_id: 'U003', username: 'ggates',  password: 'gates123',  role: 'Staff',   name: 'Grace Gates' }
];

/**
 * Show error message
 */
function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.classList.add('show');
}

/**
 * Hide error message
 */
function hideError() {
  const errorElement = document.getElementById('error-message');
  errorElement.classList.remove('show');
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
  event.preventDefault();
  hideError();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  // Find matching account
  const account = MOCK_ACCOUNTS.find(
    acc => acc.username === username && acc.password === password
  );
  
  if (account) {
    // Create user object for session (exclude password)
    const user = {
      id: account.user_id,
      name: account.name,
      role: account.role,
      email: `${account.username}@inventory.com`
    };
    
    // Save to sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // Redirect to dashboard
    window.location.href = 'index.html';
  } else {
    // Show error message
    showError('Invalid username or password.');
  }
}

/**
 * Initialize the login page
 */
function init() {
  // Check if user is already logged in
  const currentUser = sessionStorage.getItem('currentUser');
  if (currentUser) {
    // Already logged in, redirect to dashboard
    window.location.href = 'index.html';
    return;
  }
  
  // Set up form submission
  const form = document.getElementById('login-form');
  form.addEventListener('submit', handleLogin);
  
  // Clear error on input change
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  
  usernameInput.addEventListener('input', hideError);
  passwordInput.addEventListener('input', hideError);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
