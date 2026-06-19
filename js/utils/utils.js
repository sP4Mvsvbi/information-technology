/**
 * Utility Functions
 * Shared helper functions used across the application
 */

/**
 * Resolves a foreign key to its full record
 * @param {string} foreignKey - The foreign key value (e.g., 'C001')
 * @param {Array} collection - The collection to search in
 * @param {string} keyField - The field name to match against (e.g., 'category_id')
 * @returns {Object|null} The matched record or null if not found
 * 
 * @example
 * const category = joinById('C001', categories, 'category_id');
 * console.log(category.category_name); // 'Office Supplies'
 */
export function joinById(foreignKey, collection, keyField) {
  if (!foreignKey || !collection || !Array.isArray(collection)) {
    return null;
  }
  return collection.find(item => item[keyField] === foreignKey) || null;
}

/**
 * Formats a date string to a readable format
 * @param {string} dateString - ISO date string (e.g., '2026-01-23')
 * @param {string} format - Format type: 'short' (Jan 23, 2026) or 'long' (January 23, 2026)
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate('2026-01-23'); // 'Jan 23, 2026'
 * formatDate('2026-01-23', 'long'); // 'January 23, 2026'
 */
export function formatDate(dateString, format = 'short') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return dateString; // Return original if invalid
  }
  
  const options = {
    year: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats a number as currency (Philippine Peso)
 * @param {number} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include the ₱ symbol (default: true)
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56); // '₱1,234.56'
 * formatCurrency(1234.56, false); // '1,234.56'
 */
export function formatCurrency(amount, includeSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '₱0.00' : '0.00';
  }
  
  const formatted = Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return includeSymbol ? `₱${formatted}` : formatted;
}

/**
 * Checks if inventory is at or below reorder level (low stock)
 * @param {number} quantityOnHand - Current quantity in stock
 * @param {number} reorderLevel - Minimum quantity threshold
 * @returns {boolean} True if stock is low
 * 
 * @example
 * isLowStock(50, 100); // true
 * isLowStock(150, 100); // false
 */
export function isLowStock(quantityOnHand, reorderLevel) {
  if (quantityOnHand === null || quantityOnHand === undefined) {
    return false;
  }
  if (reorderLevel === null || reorderLevel === undefined) {
    return false;
  }
  return quantityOnHand <= reorderLevel;
}

/**
 * Debounces a function call
 * Useful for search inputs to avoid excessive API calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Escapes HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML insertion
 * 
 * @example
 * escapeHtml('<script>alert("xss")</script>'); 
 * // '<script>alert("xss")</script>'
 */
export function escapeHtml(text) {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates a unique ID (simple implementation for client-side use)
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID string
 * 
 * @example
 * generateId('product'); // 'product_1718625123456_abc123'
 */
export function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// Made with Bob
