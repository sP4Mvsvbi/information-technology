/**
 * Inventory Page
 * Manages inventory listing and stock level updates
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getInventory, getProducts, getWarehouses } from '../data/mockData.js';
import { joinById, formatDate, isLowStock, debounce } from '../utils/utils.js';

// State
let inventory = [];
let products = [];
let warehouses = [];
let filteredInventory = [];
let editingInventory = null;

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('inventory');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterInventory();
  }, 300));

  // Warehouse filter
  document.getElementById('warehouse-filter').addEventListener('change', () => {
    filterInventory();
  });

  // Status filter
  document.getElementById('status-filter').addEventListener('change', () => {
    filterInventory();
  });
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('inventory-table', 6, 8);

  try {
    // Load all data in parallel
    [inventory, products, warehouses] = await Promise.all([
      getInventory(),
      getProducts(),
      getWarehouses()
    ]);

    // Populate warehouse filter
    populateWarehouseFilter();

    // Initial render
    filteredInventory = [...inventory];
    renderInventoryTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('inventory-table').innerHTML = 
      '<p class="empty-message">Error loading inventory</p>';
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
 * Filter inventory based on search, warehouse, and status
 */
function filterInventory() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const warehouseId = document.getElementById('warehouse-filter').value;
  const statusFilter = document.getElementById('status-filter').value;

  filteredInventory = inventory.filter(item => {
    // Get product for search
    const product = joinById(item.product_id, products, 'product_id');
    const productName = product ? product.product_name : '';

    // Search filter
    const matchesSearch = !searchTerm || 
      item.inventory_id.toLowerCase().includes(searchTerm) ||
      productName.toLowerCase().includes(searchTerm);

    // Warehouse filter
    const matchesWarehouse = !warehouseId || item.warehouse_id === warehouseId;

    // Status filter
    const isLow = isLowStock(item.quantity_on_hand, item.reorder_level);
    const matchesStatus = !statusFilter || 
      (statusFilter === 'low' && isLow) ||
      (statusFilter === 'healthy' && !isLow);

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  renderInventoryTable();
}

/**
 * Render inventory table
 */
function renderInventoryTable() {
  renderTable({
    mountId: 'inventory-table',
    columns: [
      { key: 'inventory_id', label: 'ID' },
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
      { key: 'quantity_on_hand', label: 'Quantity' },
      { key: 'reorder_level', label: 'Reorder Level' },
      { 
        key: 'status', 
        label: 'Status',
        render: (row) => {
          const isLow = isLowStock(row.quantity_on_hand, row.reorder_level);
          const badgeClass = isLow ? 'badge-warning' : 'badge-success';
          const badgeText = isLow ? 'Low Stock' : 'Healthy';
          return `<span class="badge ${badgeClass}">${badgeText}</span>`;
        }
      },
      { 
        key: 'last_updated', 
        label: 'Last Updated',
        render: (row) => formatDate(row.last_updated)
      }
    ],
    rows: filteredInventory,
    emptyMessage: 'No inventory records found',
    onEdit: handleEdit,
    onDelete: null // No delete for inventory
  });
}

/**
 * Show inventory modal (edit only)
 */
function showInventoryModal() {
  const title = 'Update Inventory';
  
  const product = joinById(editingInventory.product_id, products, 'product_id');
  const warehouse = joinById(editingInventory.warehouse_id, warehouses, 'warehouse_id');

  const bodyHtml = `
    <form id="inventory-form">
      <div class="form-group">
        <label>Product</label>
        <input 
          type="text" 
          value="${product ? product.product_name : '-'}"
          disabled
        >
      </div>

      <div class="form-group">
        <label>Warehouse</label>
        <input 
          type="text" 
          value="${warehouse ? warehouse.warehouse_name : '-'}"
          disabled
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="quantity-on-hand">Quantity on Hand *</label>
          <input 
            type="number" 
            id="quantity-on-hand" 
            min="0"
            value="${editingInventory.quantity_on_hand}"
            required
          >
        </div>

        <div class="form-group">
          <label for="reorder-level">Reorder Level *</label>
          <input 
            type="number" 
            id="reorder-level" 
            min="0"
            value="${editingInventory.reorder_level}"
            required
          >
        </div>
      </div>

      <p class="text-secondary" style="font-size: var(--font-size-sm); margin-top: var(--space-md);">
        <strong>Note:</strong> Quantity on hand should be updated through Stock In/Out transactions. 
        Use this form only for corrections or adjustments.
      </p>
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: 'Update',
    onConfirm: handleInventorySubmit
  });
}

/**
 * Handle inventory form submission
 */
function handleInventorySubmit() {
  const form = document.getElementById('inventory-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    quantity_on_hand: parseInt(document.getElementById('quantity-on-hand').value),
    reorder_level: parseInt(document.getElementById('reorder-level').value),
    last_updated: new Date().toISOString().split('T')[0]
  };

  // Update existing inventory
  const index = inventory.findIndex(i => i.inventory_id === editingInventory.inventory_id);
  if (index !== -1) {
    inventory[index] = { ...inventory[index], ...formData };
  }

  showToast('Inventory record updated successfully', 'success');

  // Refresh display
  filterInventory();
  closeModal();
}

/**
 * Handle edit button click
 */
function handleEdit(inventoryItem) {
  editingInventory = inventoryItem;
  showInventoryModal();
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
