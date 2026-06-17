/**
 * Users Page
 * Manages system users and access control
 */

import { initSidebar } from '../components/sidebar.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { initSession } from '../components/session.js';
import { getUsers } from '../data/mockData.js';
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
  renderTable({
    mountId: 'users-table',
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      {
        key: 'role',
        label: 'Role',
        render: (row) => {
          // Role badge with color based on role
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
    onDelete: handleDelete
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
function handleUserSubmit() {
  const form = document.getElementById('user-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = {
    full_name: document.getElementById('user-fullname').value,
    username: document.getElementById('user-username').value,
    email: document.getElementById('user-email').value,
    role: document.getElementById('user-role').value
  };

  // Validate passwords for new users
  if (!editingUser) {
    const password = document.getElementById('user-password').value;
    const passwordConfirm = document.getElementById('user-password-confirm').value;

    if (password !== passwordConfirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
  }

  if (editingUser) {
    // Update existing user
    const index = users.findIndex(u => u.user_id === editingUser.user_id);
    if (index !== -1) {
      users[index] = { ...users[index], ...formData };
    }
    showToast('User updated successfully', 'success');
  } else {
    // Add new user
    const newUser = {
      user_id: `U${String(users.length + 1).padStart(3, '0')}`,
      ...formData
    };
    users.push(newUser);
    showToast('User added successfully', 'success');
  }

  // Refresh display
  filterUsers();
  closeModal();
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
    onConfirm: () => {
      // Perform the actual delete
      users = users.filter(u => u.user_id !== user.user_id);
      filterUsers();
      closeModal();
      showToast('User deleted successfully', 'success');
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
