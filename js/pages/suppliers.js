/**
 * Suppliers Page
 * Manages supplier listing, add, edit, and delete operations
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getSuppliers } from '../data/mockData.js';
import { debounce } from '../utils/utils.js';

// State
let suppliers = [];
let filteredSuppliers = [];
let editingSupplier = null;

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('suppliers');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add supplier button
  document.getElementById('add-supplier-btn').addEventListener('click', () => {
    editingSupplier = null;
    showSupplierModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterSuppliers();
  }, 300));
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('suppliers-table', 5, 8);

  try {
    // Load suppliers
    suppliers = await getSuppliers();

    // Initial render
    filteredSuppliers = [...suppliers];
    renderSuppliersTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('suppliers-table').innerHTML = 
      '<p class="empty-message">Error loading suppliers</p>';
  }
}

/**
 * Filter suppliers based on search
 */
function filterSuppliers() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  filteredSuppliers = suppliers.filter(supplier => {
    return !searchTerm || 
      supplier.supplier_name.toLowerCase().includes(searchTerm) ||
      supplier.supplier_id.toLowerCase().includes(searchTerm) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
      (supplier.contact_number && supplier.contact_number.includes(searchTerm));
  });

  renderSuppliersTable();
}

/**
 * Render suppliers table
 */
function renderSuppliersTable() {
  renderTable({
    mountId: 'suppliers-table',
    columns: [
      { key: 'supplier_id', label: 'ID' },
      { key: 'supplier_name', label: 'Supplier Name' },
      { key: 'contact_number', label: 'Contact Number' },
      { key: 'address', label: 'Address' },
      { key: 'email', label: 'Email' }
    ],
    rows: filteredSuppliers,
    emptyMessage: 'No suppliers found',
    onEdit: handleEdit,
    onDelete: handleDelete
  });
}

/**
 * Show supplier modal (add or edit)
 */
function showSupplierModal() {
  const isEdit = editingSupplier !== null;
  const title = isEdit ? 'Edit Supplier' : 'Add Supplier';

  const bodyHtml = `
    <form id="supplier-form">
      <div class="form-group">
        <label for="supplier-name">Supplier Name *</label>
        <input 
          type="text" 
          id="supplier-name" 
          value="${editingSupplier?.supplier_name || ''}"
          required
        >
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="supplier-contact">Contact Number *</label>
          <input 
            type="tel" 
            id="supplier-contact" 
            value="${editingSupplier?.contact_number || ''}"
            placeholder="09123456789"
            required
          >
        </div>

        <div class="form-group">
          <label for="supplier-email">Email *</label>
          <input 
            type="email" 
            id="supplier-email" 
            value="${editingSupplier?.email || ''}"
            placeholder="supplier@example.com"
            required
          >
        </div>
      </div>

      <div class="form-group">
        <label for="supplier-address">Address *</label>
        <textarea 
          id="supplier-address" 
          rows="3"
          required
        >${editingSupplier?.address || ''}</textarea>
      </div>
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: isEdit ? 'Update' : 'Create',
    onConfirm: handleSupplierSubmit
  });
}

/**
 * Handle supplier form submission
 */
function handleSupplierSubmit() {
  const form = document.getElementById('supplier-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    supplier_name: document.getElementById('supplier-name').value,
    contact_number: document.getElementById('supplier-contact').value,
    email: document.getElementById('supplier-email').value,
    address: document.getElementById('supplier-address').value
  };

  if (editingSupplier) {
    // Update existing supplier
    const index = suppliers.findIndex(s => s.supplier_id === editingSupplier.supplier_id);
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...formData };
    }
    showToast('Supplier updated successfully', 'success');
  } else {
    // Add new supplier
    const newSupplier = {
      supplier_id: `S${String(suppliers.length + 1).padStart(3, '0')}`,
      ...formData
    };
    suppliers.push(newSupplier);
    showToast('Supplier added successfully', 'success');
  }

  // Refresh display
  filterSuppliers();
  closeModal();
}

/**
 * Handle edit button click
 */
function handleEdit(supplier) {
  editingSupplier = supplier;
  showSupplierModal();
}

/**
 * Handle delete button click
 */
function handleDelete(supplier) {
  if (confirm(`Are you sure you want to delete "${supplier.supplier_name}"?`)) {
    suppliers = suppliers.filter(s => s.supplier_id !== supplier.supplier_id);
    filterSuppliers();
    showToast('Supplier deleted successfully', 'success');
  }
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Made with Bob
