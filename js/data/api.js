/**
 * api.js — Real API client for the Flask backend.
 *
 * Used by dashboard.js and users.js instead of mockData.js.
 * All other pages continue to use mockData.js unchanged.
 *
 * Base URL points to the Flask app running on port 5000.
 * Change API_BASE if you deploy the backend elsewhere.
 */

const API_BASE = 'http://localhost:5000/api';

/**
 * Shared fetch wrapper — throws a readable error on non-2xx responses.
 * @param {string} path  - path relative to API_BASE (e.g. '/users/')
 * @param {RequestInit} options - standard fetch options
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// DASHBOARD
// ============================================================================

/** Four metric card counts */
export function getDashboardMetrics() {
  return apiFetch('/dashboard/metrics');
}

/** Six most recent combined IN + OUT transactions */
export function getRecentTransactions() {
  return apiFetch('/dashboard/recent-transactions');
}

/** Full product list (with category_name + supplier_name from JOIN) */
export function getProducts() {
  return apiFetch('/dashboard/products');
}

/** Full inventory list (with product_name, warehouse_name, stock_status) */
export function getInventory() {
  return apiFetch('/dashboard/inventory');
}

/** All warehouses */
export function getWarehouses() {
  return apiFetch('/dashboard/warehouses');
}

/** All suppliers */
export function getSuppliers() {
  return apiFetch('/dashboard/suppliers');
}

/** All stock-in records */
export function getStockIn() {
  return apiFetch('/dashboard/stock-in');
}

/** All stock-out records */
export function getStockOut() {
  return apiFetch('/dashboard/stock-out');
}

// ============================================================================
// USERS
// ============================================================================

/** List all users (no password hash returned) */
export function getUsers() {
  return apiFetch('/users/');
}

/**
 * Create a new user.
 * @param {{ full_name, username, email, password, role }} data
 */
export function createUser(data) {
  return apiFetch('/users/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing user.
 * @param {string} userId
 * @param {{ full_name?, email?, role? }} data
 */
export function updateUser(userId, data) {
  return apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a user.
 * @param {string} userId
 */
export function deleteUser(userId) {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  return apiFetch(`/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'X-Current-User-Id': currentUser.id || ''
    }
  });
}
