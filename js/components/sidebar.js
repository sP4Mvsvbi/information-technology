/**
 * Sidebar Navigation Component
 * Renders grouped navigation menu with active state highlighting
 */

import { logout } from '../utils/api.js';

// Simple inline SVG icons
const ICONS = {
  dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  products: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  categories: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  suppliers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  warehouses: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  inventory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
  stockIn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>',
  stockOut: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/></svg>',
  users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: 'index.html', icon: 'dashboard' }
    ]
  },
  {
    title: 'Catalog',
    items: [
      { key: 'products', label: 'Products', href: 'products.html', icon: 'products' },
      { key: 'categories', label: 'Categories', href: 'categories.html', icon: 'categories' },
      { key: 'suppliers', label: 'Suppliers', href: 'suppliers.html', icon: 'suppliers' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { key: 'warehouses', label: 'Warehouses', href: 'warehouses.html', icon: 'warehouses' },
      { key: 'inventory', label: 'Inventory', href: 'inventory.html', icon: 'inventory' }
    ]
  },
  {
    title: 'Transactions',
    items: [
      { key: 'stock-in', label: 'Stock In', href: 'stock-in.html', icon: 'stockIn' },
      { key: 'stock-out', label: 'Stock Out', href: 'stock-out.html', icon: 'stockOut' }
    ]
  },
  {
    title: 'Admin',
    items: [
      { key: 'users', label: 'Users', href: 'users.html', icon: 'users' }
    ]
  }
];

/**
 * Renders the sidebar navigation
 * @param {string} currentPageKey - The key of the current active page
 * @returns {string} HTML string for the sidebar
 */
export function renderSidebar(currentPageKey) {
  // Get current user from sessionStorage for role-based rendering
  let userName = '';
  let userRole = '';
  let userInitials = '';
  try {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      const u = JSON.parse(stored);
      userName = u.name || '';
      userRole = u.role || '';
      const parts = userName.trim().split(' ');
      userInitials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : userName.substring(0, 2).toUpperCase();
    }
  } catch (e) { /* ignore */ }

  const filteredGroups = NAV_GROUPS.filter(group => {
    if (userRole === 'Admin') {
      return group.title === 'Admin';
    }
    if (userRole === 'Manager') {
      return group.title !== 'Admin';
    }
    return false; // Default fallback
  });

  const groupsHtml = filteredGroups.map(group => {
    const itemsHtml = group.items.map(item => {
      const isActive = item.key === currentPageKey;
      const activeClass = isActive ? 'active' : '';
      const iconSvg = ICONS[item.icon] || '';
      
      return `
        <a href="${item.href}" class="sidebar-link ${activeClass}" data-page="${item.key}">
          <span class="sidebar-icon">${iconSvg}</span>
          <span class="sidebar-label">${item.label}</span>
        </a>
      `;
    }).join('');

    return `
      <div class="sidebar-group">
        <div class="sidebar-group-title">${group.title}</div>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  const logoIcon = ICONS.products; // Using package icon for logo



  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">${logoIcon}</span>
          <span class="logo-text">Inventory</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        ${groupsHtml}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${userInitials}</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${userName}</div>
            <div class="sidebar-user-role">${userRole}</div>
          </div>
        </div>
        <button class="sidebar-logout-btn" id="sidebar-logout-btn" title="Log Out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="sidebar-logout-label">Log Out</span>
        </button>
      </div>
    </aside>
  `;
}

/**
 * Initializes the sidebar in the DOM
 * @param {string} currentPageKey - The key of the current active page (must be explicitly passed)
 */
export function initSidebar(currentPageKey) {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) {
    sidebarContainer.innerHTML = renderSidebar(currentPageKey);

    // Wire up logout button
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await logout();
        } catch (e) {
          console.error('Logout error:', e);
        }
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
      });
    }
  }
}

// Made with Bob
