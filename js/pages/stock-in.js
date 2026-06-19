/**
 * Stock In Page
 * Manages incoming stock transactions
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession, requireRole } from '../components/session.js';
import { getStockIn, createStockIn, getProducts, getWarehouses, getSuppliers, getUsers } from '../utils/api.js';
import { joinById, formatDate, debounce } from '../utils/utils.js';

// State
let stockInRecords = [];
let products = [];
let warehouses = [];
let suppliers = [];
let users = [];
let filteredStockIn = [];

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  requireRole(['Manager']);
  
  // Initialize sidebar
  initSidebar('stock-in');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add stock in button
  document.getElementById('add-stock-in-btn').addEventListener('click', () => {
    showStockInModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterStockIn();
  }, 300));

  // Warehouse filter
  document.getElementById('warehouse-filter').addEventListener('change', () => {
    filterStockIn();
  });
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('stock-in-table', 6, 8);

  try {
    // Load all data in parallel
    [stockInRecords, products, warehouses, suppliers, users] = await Promise.all([
      getStockIn(),
      getProducts(),
      getWarehouses(),
      getSuppliers(),
      getUsers()
    ]);

    // Populate warehouse filter
    populateWarehouseFilter();

    // Initial render
    filteredStockIn = [...stockInRecords];
    renderStockInTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('stock-in-table').innerHTML = 
      '<p class="empty-message">Error loading stock in records</p>';
  }
}

/**
 * Populate warehouse filter dropdown
 */
function populateWarehouseFilter() {
  const warehouseFilter = document.getElementById('warehouse-filter');
  
  warehouses.forEach(warehouse => {
    const option = document.createElement('option');
    option.value = warehouse.warehouse_id;
    option.textContent = warehouse.warehouse_name;
    warehouseFilter.appendChild(option);
  });
}

/**
 * Filter stock in records based on search and warehouse
 */
function filterStockIn() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const warehouseId = document.getElementById('warehouse-filter').value;

  filteredStockIn = stockInRecords.filter(record => {
    // Get product for search
    const product = joinById(record.product_id, products, 'product_id');
    const productName = product ? product.product_name : '';

    // Search filter
    const matchesSearch = !searchTerm || 
      record.stock_in_id.toLowerCase().includes(searchTerm) ||
      productName.toLowerCase().includes(searchTerm);

    // Warehouse filter
    const matchesWarehouse = !warehouseId || record.warehouse_id === warehouseId;

    return matchesSearch && matchesWarehouse;
  });

  renderStockInTable();
}

/**
 * Render stock in table
 */
function renderStockInTable() {
  renderTable({
    mountId: 'stock-in-table',
    columns: [
      { key: 'stock_in_id', label: 'ID' },
      {
        key: 'product_id',
        label: 'Product',
        render: (row) => {
          const product = joinById(row.product_id, products, 'product_id');
          return product ? product.product_name : '-';
        }
      },
      {
        key: 'warehouse_id',
        label: 'Warehouse',
        render: (row) => {
          const warehouse = joinById(row.warehouse_id, warehouses, 'warehouse_id');
          return warehouse ? warehouse.warehouse_name : '-';
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
        key: 'user_id',
        label: 'Received By',
        render: (row) => {
          const user = joinById(row.user_id, users, 'user_id');
          return user ? user.full_name : '-';
        }
      },
      { key: 'quantity', label: 'Quantity' },
      {
        key: 'date_received',
        label: 'Date Received',
        render: (row) => formatDate(row.date_received)
      }
    ],
    rows: filteredStockIn,
    emptyMessage: 'No stock in records found',
    showActions: false
  });
}

/**
 * Show stock in modal
 */
function showStockInModal() {
  // Build product options
  const productOptions = products.map(prod =>
    `<option value="${prod.product_id}">${prod.product_name}</option>`
  ).join('');

  // Build warehouse options
  const warehouseOptions = warehouses.map(wh =>
    `<option value="${wh.warehouse_id}">${wh.warehouse_name}</option>`
  ).join('');

  // Build supplier options
  const supplierOptions = suppliers.map(sup =>
    `<option value="${sup.supplier_id}">${sup.supplier_name}</option>`
  ).join('');

  // Build user options
  const userOptions = users.map(user =>
    `<option value="${user.user_id}">${user.full_name}</option>`
  ).join('');

  const bodyHtml = `
    <form id="stock-in-form">
      <div class="form-row">
        <div class="form-group">
          <label for="stock-in-product">Product *</label>
          <select id="stock-in-product" required>
            <option value="">Select product</option>
            ${productOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="stock-in-warehouse">Warehouse *</label>
          <select id="stock-in-warehouse" required>
            <option value="">Select warehouse</option>
            ${warehouseOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock-in-supplier">Supplier *</label>
          <select id="stock-in-supplier" required>
            <option value="">Select supplier</option>
            ${supplierOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="stock-in-user">Received By *</label>
          <select id="stock-in-user" required>
            <option value="">Select user</option>
            ${userOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock-in-quantity">Quantity *</label>
          <input
            type="number"
            id="stock-in-quantity"
            min="1"
            placeholder="Enter quantity"
            required
          >
        </div>

        <div class="form-group">
          <label for="stock-in-date">Date Received *</label>
          <input
            type="date"
            id="stock-in-date"
            value="${new Date().toISOString().split('T')[0]}"
            required
          >
        </div>
      </div>
    </form>
  `;

  openModal({
    title: 'Record Stock In',
    bodyHtml,
    confirmLabel: 'Record',
    onConfirm: handleStockInSubmit
  });
}

/**
 * Handle stock in form submission
 */
async function handleStockInSubmit() {
  const form = document.getElementById('stock-in-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    product_id: document.getElementById('stock-in-product').value,
    warehouse_id: document.getElementById('stock-in-warehouse').value,
    supplier_id: document.getElementById('stock-in-supplier').value,
    user_id: document.getElementById('stock-in-user').value,
    quantity: parseInt(document.getElementById('stock-in-quantity').value),
    date_received: document.getElementById('stock-in-date').value
  };

  try {
    // Generate ID
    formData.stock_in_id = `SI${String(stockInRecords.length + 1).padStart(3, '0')}`;
    await createStockIn(formData);
    showToast('Stock in record added successfully', 'success');
    await loadData();
    closeModal();
  } catch (error) {
    showToast(error.message || 'Operation failed', 'error');
  }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
