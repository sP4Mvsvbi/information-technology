# Inventory & Stock Control System

A modern, lightweight inventory management system built with vanilla HTML, CSS, and JavaScript (no frameworks). Includes a Python entry-point script (`main.py`) that serves the app correctly for local development.

---

## Features

- **Dashboard** — Overview with key metrics and recent transactions
- **Product Management** — Full CRUD for products with category and supplier linking
- **Category Management** — Organize products by category
- **Supplier Management** — Track supplier contact information
- **Warehouse Management** — Manage multiple warehouse locations
- **Inventory Tracking** — Real-time stock levels with low-stock alerts
- **Stock Transactions** — Record stock-in and stock-out movements
- **User Management** — Manage system users with role-based access
- **Session Management** — Secure login with session storage

---

## Getting Started

### Prerequisites

- Python 3.6+ (standard library only — no packages to install)
- A modern browser: Chrome, Firefox, Safari, or Edge

> **Why a server?** ES6 modules (`type="module"`) are blocked by browsers when
> opened directly from the filesystem (`file://`). A local HTTP server is required.

### Run the development server

```bash
python main.py           # http://localhost:8000
python main.py 5000      # http://localhost:5000 (custom port)
```

Then open your browser at:

```
http://localhost:8000/login.html
```

### Alternative servers

```bash
# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

---

## Login Credentials

| Username | Password  | Role    |
|----------|-----------|---------|
| jsmith   | smith123  | Admin   |
| jdoe     | doe123    | Manager |
| ggates   | gates123  | Staff   |

See `CREDENTIALS.md` for full details.

---

## Project Structure

```
/
├── main.py                    # Dev server entry point (Python)
├── login.html                 # Login page (app entry point in browser)
├── index.html                 # Dashboard
├── products.html
├── categories.html
├── suppliers.html
├── warehouses.html
├── inventory.html
├── stock-in.html
├── stock-out.html
├── users.html
│
├── css/
│   ├── variables.css          # Design tokens (colors, spacing, typography)
│   ├── base.css               # CSS reset and base element styles
│   ├── layout.css             # Sidebar + main content layout, responsive
│   └── components.css         # All reusable component styles
│
└── js/
    ├── components/
    │   ├── sidebar.js         # Navigation sidebar with active state
    │   ├── modal.js           # Generic modal dialog (focus trap, ESC key)
    │   ├── table.js           # Config-driven data table with actions
    │   ├── card.js            # Metric summary cards
    │   ├── loader.js          # Full-page loading spinner
    │   ├── toast.js           # Auto-dismissing notifications
    │   └── session.js         # Session management and logout dropdown
    │
    ├── data/
    │   └── mockData.js        # Mock API (Promise-based, 250 ms delay)
    │
    ├── pages/
    │   ├── dashboard.js
    │   ├── products.js
    │   ├── categories.js
    │   ├── suppliers.js
    │   ├── warehouses.js
    │   ├── inventory.js
    │   ├── stock-in.js
    │   ├── stock-out.js
    │   ├── users.js
    │   └── login.js
    │
    └── utils/
        └── utils.js           # Shared helpers (joinById, formatDate, debounce, …)
```

---

## Architecture

### Module dependency graph

```
pages/* → components/sidebar.js
pages/* → components/modal.js
pages/* → components/table.js
pages/* → components/toast.js
pages/* → components/session.js
pages/* → data/mockData.js
pages/* → utils/utils.js

components/card.js  → utils/utils.js
components/table.js → utils/utils.js

utils/utils.js      → (no dependencies)
data/mockData.js    → (no dependencies)
```

No circular dependencies. Clean, flat dependency graph.

### Data layer

All data operations in `js/data/mockData.js` return Promises with a 250 ms artificial delay to simulate a real API. To connect a backend, replace the function bodies with `fetch()` calls — no page code needs to change.

### Session flow

1. `login.html` validates credentials and writes `currentUser` to `sessionStorage`
2. Every page calls `initSession()` on load, which redirects to `login.html` if no session exists
3. Logout clears `sessionStorage` and redirects to `login.html`

---

## Design System

| Token category | Details |
|---|---|
| Primary accent | Muted yellow `#E8C468` |
| Status colors | success `#51CF66`, warning `#FFA94D`, danger `#FF6B6B`, info `#4DABF7` |
| Spacing scale | 8 px base: xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48 |
| Border radius | sm=4px, md=8px, lg=16px, pill=999px |
| Sidebar width | 240 px (collapses to 64 px on ≤ 760 px screens) |

---

## Browser Support

Chrome/Edge (latest), Firefox (latest), Safari (latest)

---

## Technology Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Flexbox, Grid
- **JavaScript ES6+** — Modules, async/await, arrow functions
- **Python 3** — Development server only (`main.py`)
- **No frameworks** — Zero runtime dependencies

---

## Future Enhancements

- Backend API integration (replace `mockData.js` with real `fetch()` calls)
- Real database and authentication
- Advanced reporting and analytics
- Export to CSV / PDF
- Barcode scanning
- Email notifications
- Multi-language support

---

## License

MIT License
