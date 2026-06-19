/**
 * Users Page
 * Manages system users and access control
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession, getCurrentUser } from '../components/session.js';
import { getUsers, createUser, updateUser, deleteUser } from '../data/api.js';
import { debounce, escapeHtml } from '../utils/utils.js';

// State
let users = [];
let filteredUsers = [];
let editingUser = null;

// Role options
const ROLES = ['Admin', 'Manager', 'Staff', 'Viewer'];

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('users');

  // Setup event listeners
  setupEventListeners();

  // Load data
  await loadData();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add user button
  document.getElementById('add-user-btn').addEventListener('click', () => {
    editingUser = null;
    showUserModal();
  });

  // Search input with debounce
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce((e) => {
    filterUsers();
  }, 300));

  // Role filter
  document.getElementById('role-filter').addEventListener('change', () => {
    filterUsers();
  });
}

/**
 * Load all data
 */
async function loadData() {
  // Show skeleton
  renderTableSkeleton('users-table', 5, 8);

  try {
    // Load users
    users = await getUsers();

    // Populate role filter
    populateRoleFilter();

    // Initial render
    filteredUsers = [...users];
    renderUsersTable();
  } catch (error) {
    console.error('Error loading data:', error);
    document.getElementById('users-table').innerHTML = 
      '<p class="empty-message">Error loading users</p>';
  }
}

/**
 * Populate role filter dropdown
 */
function populateRoleFilter() {
  const roleFilter = document.getElementById('role-filter');
  
  ROLES.forEach(role => {
    const option = document.createElement('option');
    option.value = role;
    option.textContent = role;
    roleFilter.appendChild(option);
  });
}

/**
 * Filter users based on search and role
 */
function filterUsers() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const roleFilter = document.getElementById('role-filter').value;

  filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = !searchTerm || 
      user.user_id.toLowerCase().includes(searchTerm) ||
      user.full_name.toLowerCase().includes(searchTerm) ||
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm);

    // Role filter
    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  renderUsersTable();
}

/**
 * Render users table
 */
function renderUsersTable() {
  const currentUser = getCurrentUser();

  renderTable({
    mountId: 'users-table',
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      {
        key: 'role',
        label: 'Role',
        render: (row) => {
          const roleColors = {
            'Admin': 'danger',
            'Manager': 'warning',
            'Staff': 'info',
            'Viewer': 'default'
          };
          const badgeClass = roleColors[row.role] || 'default';
          return `<span class="badge badge-${badgeClass}">${row.role}</span>`;
        }
      }
    ],
    rows: filteredUsers,
    emptyMessage: 'No users found',
    onEdit: handleEdit,
    // Pass null as onDelete for the logged-in user's own row so no delete button renders
    onDelete: (row) => {
      if (currentUser && row.user_id === currentUser.id) return null;
      handleDelete(row);
    },
    // Tell the table which rows should hide the delete button
    deleteDisabled: (row) => currentUser && row.user_id === currentUser.id
  });
}

/**
 * Show user modal (add or edit)
 */
function showUserModal() {
  const isEdit = editingUser !== null;
  const title = isEdit ? 'Edit User' : 'Add User';
  
  // Build role options
  const roleOptions = ROLES.map(role => 
    `<option value="${role}" ${editingUser?.role === role ? 'selected' : ''}>
      ${role}
    </option>`
  ).join('');

  const bodyHtml = `
    <form id="user-form">
      <div class="form-row">
        <div class="form-group">
          <label for="user-fullname">Full Name *</label>
          <input 
            type="text" 
            id="user-fullname" 
            value="${editingUser?.full_name || ''}"
            placeholder="John Doe"
            required
          >
        </div>

        <div class="form-group">
          <label for="user-username">Username *</label>
          <input 
            type="text" 
            id="user-username" 
            value="${editingUser?.username || ''}"
            placeholder="johndoe"
            pattern="[a-zA-Z0-9_]+"
            title="Only letters, numbers, and underscores"
            required
          >
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="user-email">Email *</label>
          <input 
            type="email" 
            id="user-email" 
            value="${editingUser?.email || ''}"
            placeholder="john@example.com"
            required
          >
        </div>

        <div class="form-group">
          <label for="user-role">Role *</label>
          <select id="user-role" required>
            <option value="">Select role</option>
            ${roleOptions}
          </select>
        </div>
      </div>

      ${!isEdit ? `
        <div class="form-row">
          <div class="form-group">
            <label for="user-password">Password *</label>
            <input 
              type="password" 
              id="user-password" 
              placeholder="Minimum 8 characters"
              minlength="8"
              required
            >
          </div>

          <div class="form-group">
            <label for="user-password-confirm">Confirm Password *</label>
            <input 
              type="password" 
              id="user-password-confirm" 
              placeholder="Re-enter password"
              minlength="8"
              required
            >
          </div>
        </div>
      ` : ''}
    </form>
  `;

  openModal({
    title,
    bodyHtml,
    confirmLabel: isEdit ? 'Update' : 'Create',
    onConfirm: handleUserSubmit
  });
}

/**
 * Handle user form submission
 */
async function handleUserSubmit() {
  const form = document.getElementById('user-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    full_name: document.getElementById('user-fullname').value,
    username:  document.getElementById('user-username').value,
    email:     document.getElementById('user-email').value,
    role:      document.getElementById('user-role').value
  };

  // Validate passwords for new users
  if (!editingUser) {
    const password        = document.getElementById('user-password').value;
    const passwordConfirm = document.getElementById('user-password-confirm').value;

    if (password !== passwordConfirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    formData.password = password;
  }

  try {
    if (editingUser) {
      // Update via API
      await updateUser(editingUser.user_id, formData);
      showToast('User updated successfully', 'success');
    } else {
      // Create via API
      await createUser(formData);
      showToast('User added successfully', 'success');
    }

    // Reload from server so the table reflects DB state
    users = await getUsers();
    filteredUsers = [...users];
    renderUsersTable();
    closeModal();
  } catch (error) {
    showToast(error.message || 'An error occurred', 'error');
  }
}

/**
 * Handle edit button click
 */
function handleEdit(user) {
  editingUser = user;
  showUserModal();
}

/**
 * Handle delete button click
 */
function handleDelete(user) {
  const bodyHtml = `
    <p>Are you sure you want to delete user "<strong>${escapeHtml(user.username)}</strong>"? This action cannot be undone.</p>
  `;

  openModal({
    title: 'Delete User',
    bodyHtml,
    confirmLabel: 'Delete',
    onConfirm: async () => {
      try {
        await deleteUser(user.user_id);
        users = users.filter(u => u.user_id !== user.user_id);
        filteredUsers = filteredUsers.filter(u => u.user_id !== user.user_id);
        renderUsersTable();
        closeModal();
        showToast('User deactivated successfully', 'success');
      } catch (error) {
        showToast(error.message || 'Failed to delete user', 'error');
      }
    }
  });

  // Style the confirm button as danger after modal opens
  setTimeout(() => {
    const confirmButton = document.getElementById('modal-confirm');
    if (confirmButton) {
      confirmButton.classList.remove('btn-primary');
      confirmButton.classList.add('btn-danger');
    }
  }, 0);
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
