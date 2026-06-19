/**
 * Dashboard Page
 * Overview of inventory system with key metrics and recent activity
 */

import { initSidebar } from '../components/sidebar.js';
import { initSession } from '../components/session.js';
import { renderTable, renderTableSkeleton } from '../components/table.js';
import { renderMetricCards } from '../components/card.js';
import {
  getProducts,
  getInventory,
  getWarehouses,
  getSuppliers,
  getStockIn,
  getStockOut
} from '../data/api.js';
import { joinById, formatDate, isLowStock } from '../utils/utils.js';

// State
let products = [];
let inventory = [];
let warehouses = [];
let suppliers = [];
let stockInRecords = [];
let stockOutRecords = [];

/**
 * Initialize the page
 */
async function init() {
  // Initialize session
  await initSession();
  
  // Initialize sidebar
  initSidebar('dashboard');

  // Load data
  await loadData();
}

/**
 * Load all data
 */
async function loadData() {
  try {
    // Load all data in parallel
    [products, inventory, warehouses, suppliers, stockInRecords, stockOutRecords] = await Promise.all([
      getProducts(),
      getInventory(),
      getWarehouses(),
      getSuppliers(),
      getStockIn(),
      getStockOut()
    ]);

    // Render all sections
    renderMetrics();
    renderRecentTransactions();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/**
 * Render metric cards
 */
function renderMetrics() {
  // Calculate metrics
  const totalProducts = products.length;
  const lowStockCount = inventory.filter(item => isLowStock(item)).length;
  const totalSuppliers = suppliers.length;
  const totalWarehouses = warehouses.length;

  // Render cards
  renderMetricCards('metric-cards', [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>`
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockCount,
      variant: lowStockCount > 0 ? 'warning' : 'default',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`
    },
    {
      label: 'Total Suppliers',
      value: totalSuppliers,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>`
    },
    {
      label: 'Total Warehouses',
      value: totalWarehouses,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>`
    }
  ]);
}

/**
 * Render recent transactions (merged stock in and stock out)
 */
function renderRecentTransactions() {
  // Show skeleton while loading
  renderTableSkeleton('recent-transactions-table', 5, 6);

  // Merge and transform stock in records
  const stockInTransactions = stockInRecords.map(record => ({
    ...record,
    type: 'IN',
    date: record.date_received,
    id: record.stock_in_id
  }));

  // Merge and transform stock out records
  const stockOutTransactions = stockOutRecords.map(record => ({
    ...record,
    type: 'OUT',
    date: record.date_released,
    id: record.stock_out_id
  }));

  // Combine and sort by date descending, limit to 6
  const allTransactions = [...stockInTransactions, ...stockOutTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  renderTable({
    mountId: 'recent-transactions-table',
    columns: [
      {
        key: 'type',
        label: 'Type',
        render: (row) => {
          const badgeClass = row.type === 'IN' ? 'badge-success' : 'badge-danger';
          return `<span class="badge ${badgeClass}">${row.type}</span>`;
        }
      },
      { key: 'id', label: 'ID' },
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
      { key: 'quantity', label: 'Quantity' },
      {
        key: 'date',
        label: 'Date',
        render: (row) => formatDate(row.date)
      }
    ],
    rows: allTransactions,
    emptyMessage: 'No recent transactions',
    showActions: false
  });
}

// Initialize page when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
