/**
 * Categories Page
 * Manages category listing, add, edit, and delete operations
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../utils/api.js';
import { debounce } from '../utils/utils.js';

// State
let categories = [];
let filteredCategories = [];
let editingCategory = null;

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('categories');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add category button
  document.getElementById('add-category-btn').addEventListener('click', () => {
    editingCategory = null;
    showCategoryModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterCategories();
  }, 300));
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('categories-table', 3, 8);

  try {
    // Load categories
    categories = await getCategories();

    // Initial render
    filteredCategories = [...categories];
    renderCategoriesTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('categories-table').innerHTML = 
      '<p class="empty-message">Error loading categories</p>';
  }
}

/**
 * Filter categories based on search
 */
function filterCategories() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  filteredCategories = categories.filter(category => {
    return !searchTerm || 
      category.category_name.toLowerCase().includes(searchTerm) ||
      category.category_id.toLowerCase().includes(searchTerm) ||
      (category.description && category.description.toLowerCase().includes(searchTerm));
  });

  renderCategoriesTable();
}

/**
 * Render categories table
 */
function renderCategoriesTable() {
  renderTable({
    mountId: 'categories-table',
    columns: [
      { key: 'category_id', label: 'ID' },
      { key: 'category_name', label: 'Category Name' },
      { key: 'description', label: 'Description' }
    ],
    rows: filteredCategories,
    emptyMessage: 'No categories found',
    onEdit: handleEdit,
    onDelete: handleDelete
  });
}

/**
 * Show category modal (add or edit)
 */
function showCategoryModal() {
  const isEdit = editingCategory !== null;
  const title = isEdit ? 'Edit Category' : 'Add Category';

  const bodyHtml = `
    <form id="category-form">
      <div class="form-group">
        <label for="category-name">Category Name *</label>
        <input 
          type="text" 
          id="category-name" 
          value="${editingCategory?.category_name || ''}"
          required
        >
      </div>

      <div class="form-group">
        <label for="category-description">Description</label>
        <textarea 
          id="category-description" 
          rows="4"
        >${editingCategory?.description || ''}</textarea>
      </div>
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: isEdit ? 'Update' : 'Create',
    onConfirm: handleCategorySubmit
  });
}

/**
 * Handle category form submission
 */
async function handleCategorySubmit() {
  const form = document.getElementById('category-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    category_name: document.getElementById('category-name').value,
    description: document.getElementById('category-description').value
  };

  try {
    if (editingCategory) {
      // Update existing category
      formData.category_id = editingCategory.category_id;
      await updateCategory(editingCategory.category_id, formData);
      showToast('Category updated successfully', 'success');
    } else {
      // Add new category
      formData.category_id = `C${String(categories.length + 1).padStart(3, '0')}`;
      await createCategory(formData);
      showToast('Category added successfully', 'success');
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
function handleEdit(category) {
  editingCategory = category;
  showCategoryModal();
}

/**
 * Handle delete button click
 */
async function handleDelete(category) {
  if (confirm(`Are you sure you want to delete "${category.category_name}"?`)) {
    try {
      await deleteCategory(category.category_id);
      showToast('Category deleted successfully', 'success');
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
