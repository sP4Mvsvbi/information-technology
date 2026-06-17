/**
 * Table Component
 * Config-driven, reusable data table for all entity pages
 */

import { escapeHtml } from '../utils/utils.js';

/**
 * Renders a data table
 * @param {Object} config - Table configuration
 * @param {string} config.mountId - ID of the container element to mount the table
 * @param {Array} config.columns - Column definitions [{ key, label, render? }]
 * @param {Array} config.rows - Data rows (array of objects)
 * @param {string} config.emptyMessage - Message to show when no data
 * @param {Function} config.onEdit - Optional edit handler (row) => void
 * @param {Function} config.onDelete - Optional delete handler (row) => void
 * 
 * @example
 * renderTable({
 *   mountId: 'products-table',
 *   columns: [
 *     { key: 'product_id', label: 'ID' },
 *     { key: 'product_name', label: 'Name' },
 *     { key: 'unit_price', label: 'Price', render: (row) => formatCurrency(row.unit_price) }
 *   ],
 *   rows: products,
 *   emptyMessage: 'No products found',
 *   onEdit: (row) => console.log('Edit', row),
 *   onDelete: (row) => console.log('Delete', row)
 * });
 */
export function renderTable({ mountId, columns, rows, emptyMessage = 'No data available', onEdit, onDelete }) {
  const container = document.getElementById(mountId);
  if (!container) {
    console.error(`Table mount point #${mountId} not found`);
    return;
  }

  // Show empty state if no rows
  if (!rows || rows.length === 0) {
    const emptyIcon = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    `;
    
    container.innerHTML = `
      <div class="table-empty">
        <div class="empty-icon">${emptyIcon}</div>
        <p class="empty-message">${escapeHtml(emptyMessage)}</p>
      </div>
    `;
    return;
  }

  // Determine if we need an actions column
  const hasActions = onEdit || onDelete;

  // Build table header
  const headerCells = columns.map(col => 
    `<th>${escapeHtml(col.label)}</th>`
  ).join('');
  
  const actionsHeader = hasActions ? '<th class="table-actions-header">Actions</th>' : '';

  // Build table rows
  const tableRows = rows.map((row, rowIndex) => {
    const cells = columns.map(col => {
      let cellContent;
      
      if (col.render && typeof col.render === 'function') {
        // Custom render function - assumes it handles its own escaping
        cellContent = col.render(row);
      } else {
        // Default: escape the raw value
        const value = row[col.key];
        cellContent = escapeHtml(value !== null && value !== undefined ? String(value) : '');
      }
      
      return `<td>${cellContent}</td>`;
    }).join('');

    // Build actions column if needed
    let actionsCell = '';
    if (hasActions) {
      const editButton = onEdit
        ? `<button class="btn-icon btn-edit" data-action="edit" data-row-index="${rowIndex}" title="Edit">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
               <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
             </svg>
           </button>`
        : '';
      
      const deleteButton = onDelete
        ? `<button class="btn-icon btn-delete" data-action="delete" data-row-index="${rowIndex}" title="Delete">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <polyline points="3 6 5 6 21 6"/>
               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
               <line x1="10" y1="11" x2="10" y2="17"/>
               <line x1="14" y1="11" x2="14" y2="17"/>
             </svg>
           </button>`
        : '';

      actionsCell = `<td class="table-actions">${editButton}${deleteButton}</td>`;
    }

    return `<tr>${cells}${actionsCell}</tr>`;
  }).join('');

  // Render the complete table
  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>${headerCells}${actionsHeader}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  // Attach event listeners for action buttons
  if (hasActions) {
    const actionButtons = container.querySelectorAll('[data-action]');
    actionButtons.forEach((button) => {
      const action = button.getAttribute('data-action');
      const rowIndex = parseInt(button.getAttribute('data-row-index'), 10);
      const row = rows[rowIndex];

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (action === 'edit' && onEdit) {
          onEdit(row);
        } else if (action === 'delete' && onDelete) {
          onDelete(row);
        }
      });
    });
  }
}

/**
 * Renders a skeleton loading state for the table
 * @param {string} mountId - ID of the container element
 * @param {number} columnCount - Number of columns to show
 * @param {number} rowCount - Number of skeleton rows to show (default: 5)
 * 
 * @example
 * renderTableSkeleton('products-table', 5, 8);
 */
export function renderTableSkeleton(mountId, columnCount, rowCount = 5) {
  const container = document.getElementById(mountId);
  if (!container) {
    console.error(`Table mount point #${mountId} not found`);
    return;
  }

  // Generate skeleton header cells
  const headerCells = Array(columnCount).fill(0).map(() => 
    '<th><div class="skeleton skeleton-text"></div></th>'
  ).join('');

  // Generate skeleton rows
  const skeletonRows = Array(rowCount).fill(0).map(() => {
    const cells = Array(columnCount).fill(0).map(() => 
      '<td><div class="skeleton skeleton-text"></div></td>'
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  container.innerHTML = `
    <div class="table-wrapper">
      <table class="data-table table-skeleton">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${skeletonRows}
        </tbody>
      </table>
    </div>
  `;
}

// Made with Bob
