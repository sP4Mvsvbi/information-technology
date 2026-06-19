/**
 * Card Component
 * Renders dashboard summary metric cards
 */

import { escapeHtml } from '../utils/utils.js';

/**
 * Renders metric cards in a responsive grid
 * @param {string} mountId - ID of the container element to mount the cards
 * @param {Array} metrics - Array of metric objects
 * @param {string} metrics[].label - Card label/title
 * @param {string|number} metrics[].value - Metric value to display
 * @param {string} metrics[].icon - Inline SVG icon string
 * @param {boolean} metrics[].alert - Optional, if true uses warning color for value
 * 
 * @example
 * renderMetricCards('dashboard-metrics', [
 *   {
 *     label: 'Total Products',
 *     value: 150,
 *     icon: '<svg>...</svg>'
 *   },
 *   {
 *     label: 'Low Stock Items',
 *     value: 5,
 *     icon: '<svg>...</svg>',
 *     alert: true
 *   }
 * ]);
 */
export function renderMetricCards(mountId, metrics) {
  const container = document.getElementById(mountId);
  if (!container) {
    console.error(`Card mount point #${mountId} not found`);
    return;
  }

  if (!metrics || metrics.length === 0) {
    container.innerHTML = '<p class="empty-message">No metrics available</p>';
    return;
  }

  const cards = metrics.map(metric => {
    const alertClass = metric.alert ? 'metric-card-alert' : '';
    const valueClass = metric.alert ? 'metric-value-alert' : '';
    
    return `
      <div class="metric-card ${alertClass}">
        <div class="metric-header">
          <span class="metric-icon">${metric.icon}</span>
          <span class="metric-label">${escapeHtml(metric.label)}</span>
        </div>
        <div class="metric-value ${valueClass}">${escapeHtml(String(metric.value))}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="metric-cards-grid">${cards}</div>`;
}

// Made with Bob
