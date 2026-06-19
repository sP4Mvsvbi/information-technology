/**
 * Products Page
 * Manages product listing, add, edit, and delete operations
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession, requireRole } from '../components/session.js';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getSuppliers } from '../utils/api.js';
import { formatCurrency, joinById, debounce } from '../utils/utils.js';

// State
let products = [];
let categories = [];
let suppliers = [];
let filteredProducts = [];
let editingProduct = null;

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  requireRole(['Manager']);
  
  // Initialize sidebar
  initSidebar('products');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add product button
  document.getElementById('add-product-btn').addEventListener('click', () => {
    editingProduct = null;
    showProductModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterProducts();
  }, 300));

  // Category filter
  document.getElementById('category-filter').addEventListener('change', () => {
    filterProducts();
  });
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('products-table', 5, 8);

  try {
    // Load all data in parallel
    [products, categories, suppliers] = await Promise.all([
      getProducts(),
      getCategories(),
      getSuppliers()
    ]);

    // Populate category filter
    populateCategoryFilter();

    // Initial render
    filteredProducts = [...products];
    renderProductsTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('products-table').innerHTML = 
      '<p class="empty-message">Error loading products</p>';
  }
}

/**
 * Populate category filter dropdown
 */
function populateCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.category_id;
    option.textContent = category.category_name;
    categoryFilter.appendChild(option);
  });
}

/**
 * Filter products based on search and category
 */
function filterProducts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const categoryId = document.getElementById('category-filter').value;

  filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = !searchTerm || 
      product.product_name.toLowerCase().includes(searchTerm) ||
      product.product_id.toLowerCase().includes(searchTerm);

    // Category filter
    const matchesCategory = !categoryId || product.category_id === categoryId;

    return matchesSearch && matchesCategory;
  });

  renderProductsTable();
}

/**
 * Render products table
 */
function renderProductsTable() {
  renderTable({
    mountId: 'products-table',
    columns: [
      { key: 'product_id', label: 'ID' },
      { key: 'product_name', label: 'Product Name' },
      { 
        key: 'category_id', 
        label: 'Category',
        render: (row) => {
          const category = joinById(row.category_id, categories, 'category_id');
          return category ? category.category_name : '-';
        }
      },
      { 
        key: 'supplier_id', 
        label: 'Supplier',
        render: (row) => {
          const supplier = joinById(row.supplier_id, suppliers, 'supplier_id');
          return supplier ? supplier.supplier_name : '-';
        }
      },
      { 
        key: 'unit_price', 
        label: 'Unit Price',
        render: (row) => formatCurrency(row.unit_price)
      }
    ],
    rows: filteredProducts,
    emptyMessage: 'No products found',
    onEdit: handleEdit,
    onDelete: handleDelete
  });
}

/**
 * Show product modal (add or edit)
 */
function showProductModal() {
  const isEdit = editingProduct !== null;
  const title = isEdit ? 'Edit Product' : 'Add Product';
  
  // Build category options
  const categoryOptions = categories.map(cat => 
    `<option value="${cat.category_id}" ${editingProduct?.category_id === cat.category_id ? 'selected' : ''}>
      ${cat.category_name}
    </option>`
  ).join('');

  // Build supplier options
  const supplierOptions = suppliers.map(sup => 
    `<option value="${sup.supplier_id}" ${editingProduct?.supplier_id === sup.supplier_id ? 'selected' : ''}>
      ${sup.supplier_name}
    </option>`
  ).join('');

  const bodyHtml = `
    <form id="product-form">
      <div class="form-group">
        <label for="product-name">Product Name *</label>
        <input 
          type="text" 
          id="product-name" 
          value="${editingProduct?.product_name || ''}"
          required
        >
      </div>

      <div class="form-group">
        <label for="product-description">Description</label>
        <textarea 
          id="product-description" 
          rows="3"
        >${editingProduct?.description || ''}</textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="product-category">Category *</label>
          <select id="product-category" required>
            <option value="">Select category</option>
            ${categoryOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="product-supplier">Supplier *</label>
          <select id="product-supplier" required>
            <option value="">Select supplier</option>
            ${supplierOptions}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="product-price">Unit Price (₱) *</label>
        <input 
          type="number" 
          id="product-price" 
          step="0.01"
          min="0"
          value="${editingProduct?.unit_price || ''}"
          required
        >
      </div>
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: isEdit ? 'Update' : 'Create',
    onConfirm: handleProductSubmit
  });
}

/**
 * Handle product form submission
 */
async function handleProductSubmit() {
  const form = document.getElementById('product-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    product_name: document.getElementById('product-name').value,
    description: document.getElementById('product-description').value,
    category_id: document.getElementById('product-category').value,
    supplier_id: document.getElementById('product-supplier').value,
    unit_price: parseFloat(document.getElementById('product-price').value)
  };

  try {
    if (editingProduct) {
      // Update existing product
      formData.product_id = editingProduct.product_id;
      await updateProduct(editingProduct.product_id, formData);
      showToast('Product updated successfully', 'success');
    } else {
      // Add new product
      formData.product_id = `P${String(products.length + 1).padStart(3, '0')}`;
      await createProduct(formData);
      showToast('Product added successfully', 'success');
    }

    await loadData();
    closeModal();
  } catch (error) {
    showToast(error.message || 'Operation failed', 'error');
  }
}

/**
 * Handle edit button click
 */
function handleEdit(product) {
  editingProduct = product;
  showProductModal();
}

/**
 * Handle delete button click
 */
async function handleDelete(product) {
  if (confirm(`Are you sure you want to delete "${product.product_name}"?`)) {
    try {
      await deleteProduct(product.product_id);
      showToast('Product deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Delete failed', 'error');
    }
  }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
