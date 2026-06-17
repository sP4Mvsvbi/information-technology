# Inventory and Stock Control System

A modern, lightweight inventory management system built with vanilla HTML, CSS, and JavaScript (no frameworks).

## Features

- **Dashboard** - Overview with key metrics and recent transactions
- **Product Management** - CRUD operations for products
- **Category Management** - Organize products by categories
- **Supplier Management** - Track supplier information
- **Warehouse Management** - Manage multiple warehouse locations
- **Inventory Tracking** - Real-time stock levels across warehouses
- **Stock Transactions** - Record stock-in and stock-out movements
- **User Management** - Manage system users and roles
- **Session Management** - Secure login with role-based access

## Design System

- **Accent Color**: Muted yellow (#E8C468) for primary actions
- **Status Colors**: Semantic colors for success/warning/danger/info badges
- **Layout**: Sidebar navigation with responsive design
- **Components**: Reusable UI components (buttons, forms, tables, modals, cards)
- **Typography**: Clean, readable font stack with consistent sizing

## Project Structure

```
/css
  ├── variables.css      # Design tokens (colors, spacing, typography)
  ├── base.css          # Reset and base styles
  ├── layout.css        # Sidebar and main content layout
  └── components.css    # Reusable component styles

/js
  ├── /components
  │   ├── sidebar.js    # Navigation sidebar
  │   ├── modal.js      # Modal dialogs
  │   ├── table.js      # Data tables
  │   ├── card.js       # Metric cards
  │   ├── loader.js     # Loading states
  │   ├── toast.js      # Notifications
  │   └── session.js    # User session management
  │
  ├── /data
  │   └── mockData.js   # Mock API with Promise-based functions
  │
  ├── /pages
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
  └── /utils
      └── utils.js      # Shared helper functions

/pages (HTML files)
  ├── login.html
  ├── index.html        # Dashboard
  ├── products.html
  ├── categories.html
  ├── suppliers.html
  ├── warehouses.html
  ├── inventory.html
  ├── stock-in.html
  ├── stock-out.html
  └── users.html
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (required for ES6 modules)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

2. Start a local web server. Choose one of these options:

**Using Python 3:**
```bash
python -m http.server 8000
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000/login.html
```

### Login Credentials

Use these test accounts to log in:

| Username | Password  | Role    |
|----------|-----------|---------|
| jsmith   | smith123  | Admin   |
| jdoe     | doe123    | Manager |
| ggates   | gates123  | Staff   |

## Mock Data

The system uses mock data stored in `js/data/mockData.js`. All data operations return Promises with a 250ms delay to simulate API calls. This makes it easy for backend developers to replace the mock functions with real API calls without changing page code.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Flexbox, Grid
- **JavaScript (ES6+)** - Modules, async/await, arrow functions
- **No frameworks** - Pure vanilla JavaScript

## Future Enhancements

- Backend API integration
- Real database connection
- Advanced reporting and analytics
- Export to CSV/PDF
- Barcode scanning
- Email notifications
- Multi-language support

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Built with ❤️ using vanilla JavaScript