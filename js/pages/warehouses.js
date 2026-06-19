/**
 * Warehouses Page
 * Manages warehouse listing, add, edit, and delete operations
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getWarehouses } from '../data/mockData.js';
import { debounce } from '../utils/utils.js';

// State
let warehouses = [];
let filteredWarehouses = [];
let editingWarehouse = null;

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('warehouses');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add warehouse button
  document.getElementById('add-warehouse-btn').addEventListener('click', () => {
    editingWarehouse = null;
    showWarehouseModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterWarehouses();
  }, 300));
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('warehouses-table', 3, 8);

  try {
    // Load warehouses
    warehouses = await getWarehouses();

    // Initial render
    filteredWarehouses = [...warehouses];
    renderWarehousesTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('warehouses-table').innerHTML = 
      '<p class="empty-message">Error loading warehouses</p>';
  }
}

/**
 * Filter warehouses based on search
 */
function filterWarehouses() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  filteredWarehouses = warehouses.filter(warehouse => {
    return !searchTerm || 
      warehouse.warehouse_name.toLowerCase().includes(searchTerm) ||
      warehouse.warehouse_id.toLowerCase().includes(searchTerm) ||
      (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm));
  });

  renderWarehousesTable();
}

/**
 * Render warehouses table
 */
function renderWarehousesTable() {
  renderTable({
    mountId: 'warehouses-table',
    columns: [
      { key: 'warehouse_id', label: 'ID' },
      { key: 'warehouse_name', label: 'Warehouse Name' },
      { key: 'location', label: 'Location' }
    ],
    rows: filteredWarehouses,
    emptyMessage: 'No warehouses found',
    onEdit: handleEdit,
    onDelete: handleDelete
  });
}

/**
 * Show warehouse modal (add or edit)
 */
function showWarehouseModal() {
  const isEdit = editingWarehouse !== null;
  const title = isEdit ? 'Edit Warehouse' : 'Add Warehouse';

  const bodyHtml = `
    <form id="warehouse-form">
      <div class="form-group">
        <label for="warehouse-name">Warehouse Name *</label>
        <input 
          type="text" 
          id="warehouse-name" 
          value="${editingWarehouse?.warehouse_name || ''}"
          required
        >
      </div>

      <div class="form-group">
        <label for="warehouse-location">Location *</label>
        <input 
          type="text" 
          id="warehouse-location" 
          value="${editingWarehouse?.location || ''}"
          placeholder="City, Province"
          required
        >
      </div>
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: isEdit ? 'Update' : 'Create',
    onConfirm: handleWarehouseSubmit
  });
}

/**
 * Handle warehouse form submission
 */
function handleWarehouseSubmit() {
  const form = document.getElementById('warehouse-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    warehouse_name: document.getElementById('warehouse-name').value,
    location: document.getElementById('warehouse-location').value
  };

  if (editingWarehouse) {
    // Update existing warehouse
    const index = warehouses.findIndex(w => w.warehouse_id === editingWarehouse.warehouse_id);
    if (index !== -1) {
      warehouses[index] = { ...warehouses[index], ...formData };
    }
    showToast('Warehouse updated successfully', 'success');
  } else {
    // Add new warehouse
    const newWarehouse = {
      warehouse_id: `W${String(warehouses.length + 1).padStart(3, '0')}`,
      ...formData
    };
    warehouses.push(newWarehouse);
    showToast('Warehouse added successfully', 'success');
  }

  // Refresh display
  filterWarehouses();
  closeModal();
}

/**
 * Handle edit button click
 */
function handleEdit(warehouse) {
  editingWarehouse = warehouse;
  showWarehouseModal();
}

/**
 * Handle delete button click
 */
function handleDelete(warehouse) {
  if (confirm(`Are you sure you want to delete "${warehouse.warehouse_name}"?`)) {
    warehouses = warehouses.filter(w => w.warehouse_id !== warehouse.warehouse_id);
    filterWarehouses();
    showToast('Warehouse deleted successfully', 'success');
  }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
