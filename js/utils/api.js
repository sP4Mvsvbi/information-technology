/**
 * API Utility
 * Handles all API calls to the Flask backend
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

/**
 * Get authentication token from session storage
 */
function getAuthToken() {
  return sessionStorage.getItem('token');
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if (currentUser.id) {
    headers['X-Current-User-Id'] = currentUser.id;
  }

  const config = {
    ...options,
    headers
  };

  try {
    // Append user ID as query param (reliable fallback for role checks)
    let url = `${API_BASE_URL}${endpoint}`;
    const currentUserForUrl = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUserForUrl.id) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}_uid=${currentUserForUrl.id}`;
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================================================
// SUPPLIERS API
// ============================================================================

export async function getSuppliers() {
  return apiRequest('/suppliers');
}

export async function getSupplierById(id) {
  return apiRequest(`/suppliers/${id}`);
}

export async function createSupplier(data) {
  return apiRequest('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateSupplier(id, data) {
  return apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteSupplier(id) {
  return apiRequest(`/suppliers/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// CATEGORIES API
// ============================================================================

export async function getCategories() {
  return apiRequest('/categories');
}

export async function getCategoryById(id) {
  return apiRequest(`/categories/${id}`);
}

export async function createCategory(data) {
  return apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateCategory(id, data) {
  return apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// PRODUCTS API
// ============================================================================

export async function getProducts() {
  return apiRequest('/products');
}

export async function getProductById(id) {
  return apiRequest(`/products/${id}`);
}

export async function createProduct(data) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProduct(id, data) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProduct(id) {
  return apiRequest(`/products/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// WAREHOUSES API
// ============================================================================

export async function getWarehouses() {
  return apiRequest('/warehouses');
}

export async function getWarehouseById(id) {
  return apiRequest(`/warehouses/${id}`);
}

export async function createWarehouse(data) {
  return apiRequest('/warehouses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateWarehouse(id, data) {
  return apiRequest(`/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteWarehouse(id) {
  return apiRequest(`/warehouses/${id}`, {
    method: 'DELETE'
  });
}

// ============================================================================
// INVENTORY API
// ============================================================================

export async function getInventory() {
  return apiRequest('/inventory');
}

export async function getLowStockItems() {
  return apiRequest('/inventory/low-stock');
}

export async function updateInventory(id, data) {
  return apiRequest(`/inventory/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ============================================================================
// STOCK TRANSACTIONS API
// ============================================================================

export async function getStockIn() {
  return apiRequest('/stock-in');
}

export async function createStockIn(data) {
  return apiRequest('/stock-in', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getStockOut() {
  return apiRequest('/stock-out');
}

export async function createStockOut(data) {
  return apiRequest('/stock-out', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ============================================================================
// USERS API
// ============================================================================

export async function getUsers() {
  return apiRequest('/users');
}

export async function createUser(data) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateUser(id, data) {
  return apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ============================================================================
// DASHBOARD API
// ============================================================================

export async function getDashboardMetrics() {
  return apiRequest('/dashboard/metrics');
}

export async function getRecentTransactions(limit = 10) {
  return apiRequest(`/dashboard/recent-transactions?limit=${limit}`);
}

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return await response.json();
}

export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST'
  });
}

// Made with Bob