/**
 * Loader Component
 * Full-page loading spinner for initial page load
 */

let loaderElement = null;

/**
 * Creates the loader DOM structure if it doesn't exist
 */
function ensureLoaderExists() {
  if (loaderElement) return;

  loaderElement = document.createElement('div');
  loaderElement.id = 'page-loader';
  loaderElement.className = 'page-loader';
  
  loaderElement.innerHTML = `
    <div class="loader-spinner">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
    </div>
  `;

  document.body.appendChild(loaderElement);
}

/**
 * Shows the full-page loader
 * Typically called at the start of page load before data is fetched
 * 
 * @example
 * showPageLoader();
 * const data = await fetchData();
 * hidePageLoader();
 */
export function showPageLoader() {
  ensureLoaderExists();
  loaderElement.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Hides the full-page loader
 */
export function hidePageLoader() {
  if (!loaderElement) return;
  
  loaderElement.style.display = 'none';
  document.body.style.overflow = '';
}

// Made with Bob
