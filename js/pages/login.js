/**
 * Login Page
 * Handles user authentication with username and password
 */

import { login } from '../utils/api.js';

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
async function handleLogin(event) {
  event.preventDefault();
  hideError();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const submitButton = event.target.querySelector('button[type="submit"]');
  
  console.log('Login attempt:', username);
  
  // Disable button and show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Logging in...';
  
  try {
    console.log('Calling API...');
    // Call real API
    const response = await login(username, password);
    console.log('API response:', response);
    
    // Store token and user info
    sessionStorage.setItem('token', response.token);
    sessionStorage.setItem('currentUser', JSON.stringify({
      id: response.user.user_id,
      name: response.user.full_name,
      role: response.user.role,
      email: response.user.email,
      username: response.user.username
    }));
    
    // Redirect to dashboard
    window.location.href = 'index.html';
  } catch (error) {
    // Show error message
    showError(error.message || 'Login failed. Please try again.');
    submitButton.disabled = false;
    submitButton.textContent = 'Log In';
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
