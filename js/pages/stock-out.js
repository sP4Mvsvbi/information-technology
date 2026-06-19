/**
 * Stock Out Page
 * Manages outgoing stock transactions
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getStockOut, getProducts, getWarehouses, getUsers } from '../data/mockData.js';
import { joinById, formatDate, debounce } from '../utils/utils.js';

// State
let stockOutRecords = [];
let products = [];
let warehouses = [];
let users = [];
let filteredStockOut = [];

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('stock-out');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add stock out button
  document.getElementById('add-stock-out-btn').addEventListener('click', () => {
    showStockOutModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterStockOut();
  }, 300));

  // Warehouse filter
  document.getElementById('warehouse-filter').addEventListener('change', () => {
    filterStockOut();
  });
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('stock-out-table', 6, 8);

  try {
    // Load all data in parallel
    [stockOutRecords, products, warehouses, users] = await Promise.all([
      getStockOut(),
      getProducts(),
      getWarehouses(),
      getUsers()
    ]);

    // Populate warehouse filter
    populateWarehouseFilter();

    // Initial render
    filteredStockOut = [...stockOutRecords];
    renderStockOutTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('stock-out-table').innerHTML = 
      '<p class="empty-message">Error loading stock out records</p>';
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
 * Filter stock out records based on search and warehouse
 */
function filterStockOut() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const warehouseId = document.getElementById('warehouse-filter').value;

  filteredStockOut = stockOutRecords.filter(record => {
    // Get product for search
    const product = joinById(record.product_id, products, 'product_id');
    const productName = product ? product.product_name : '';

    // Search filter
    const matchesSearch = !searchTerm || 
      record.stock_out_id.toLowerCase().includes(searchTerm) ||
      productName.toLowerCase().includes(searchTerm) ||
      (record.destination && record.destination.toLowerCase().includes(searchTerm));

    // Warehouse filter
    const matchesWarehouse = !warehouseId || record.warehouse_id === warehouseId;

    return matchesSearch && matchesWarehouse;
  });

  renderStockOutTable();
}

/**
 * Render stock out table
 */
function renderStockOutTable() {
  renderTable({
    mountId: 'stock-out-table',
    columns: [
      { key: 'stock_out_id', label: 'ID' },
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
        key: 'user_id',
        label: 'Released By',
        render: (row) => {
          const user = joinById(row.user_id, users, 'user_id');
          return user ? user.full_name : '-';
        }
      },
      { key: 'quantity', label: 'Quantity' },
      { key: 'destination', label: 'Destination' },
      {
        key: 'date_released',
        label: 'Date Released',
        render: (row) => formatDate(row.date_released)
      }
    ],
    rows: filteredStockOut,
    emptyMessage: 'No stock out records found',
    showActions: false
  });
}

/**
 * Show stock out modal
 */
function showStockOutModal() {
  // Build product options
  const productOptions = products.map(prod =>
    `<option value="${prod.product_id}">${prod.product_name}</option>`
  ).join('');

  // Build warehouse options
  const warehouseOptions = warehouses.map(wh =>
    `<option value="${wh.warehouse_id}">${wh.warehouse_name}</option>`
  ).join('');

  // Build user options
  const userOptions = users.map(user =>
    `<option value="${user.user_id}">${user.full_name}</option>`
  ).join('');

  const bodyHtml = `
    <form id="stock-out-form">
      <div class="form-row">
        <div class="form-group">
          <label for="stock-out-product">Product *</label>
          <select id="stock-out-product" required>
            <option value="">Select product</option>
            ${productOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="stock-out-warehouse">Warehouse *</label>
          <select id="stock-out-warehouse" required>
            <option value="">Select warehouse</option>
            ${warehouseOptions}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock-out-user">Released By *</label>
          <select id="stock-out-user" required>
            <option value="">Select user</option>
            ${userOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="stock-out-quantity">Quantity *</label>
          <input
            type="number"
            id="stock-out-quantity"
            min="1"
            placeholder="Enter quantity"
            required
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="stock-out-destination">Destination *</label>
          <input
            type="text"
            id="stock-out-destination"
            placeholder="Location or department"
            required
          >
        </div>

        <div class="form-group">
          <label for="stock-out-date">Date Released *</label>
          <input
            type="date"
            id="stock-out-date"
            value="${new Date().toISOString().split('T')[0]}"
            required
          >
        </div>
      </div>
    </form>
  `;

  openModal({
    title: 'Record Stock Out',
    bodyHtml,
    confirmLabel: 'Record',
    onConfirm: handleStockOutSubmit
  });
}

/**
 * Handle stock out form submission
 */
function handleStockOutSubmit() {
  const form = document.getElementById('stock-out-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    product_id: document.getElementById('stock-out-product').value,
    warehouse_id: document.getElementById('stock-out-warehouse').value,
    user_id: document.getElementById('stock-out-user').value,
    quantity: parseInt(document.getElementById('stock-out-quantity').value),
    destination: document.getElementById('stock-out-destination').value,
    date_released: document.getElementById('stock-out-date').value
  };

  // Add new record (no editing for historical transactions)
  const newStockOut = {
    stock_out_id: `SO${String(stockOutRecords.length + 1).padStart(3, '0')}`,
    ...formData
  };
  stockOutRecords.push(newStockOut);

  showToast('Stock out record added successfully', 'success');

  // Refresh display
  filterStockOut();
  closeModal();
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
