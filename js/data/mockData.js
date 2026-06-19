/**
 * Mock Data Layer
 * Simulates API calls with Promise-based functions
 * Backend developers can replace internals with real fetch() calls
 * without modifying page code
 */

const NETWORK_DELAY = 250; // ms

// ============================================================================
// CATEGORIES
// ============================================================================
const CATEGORIES = [
  {
    category_id: 'C001',
    category_name: 'Office Supplies',
    description: 'General office and stationery items'
  },
  {
    category_id: 'C002',
    category_name: 'Tools',
    description: 'Hardware and maintenance tools'
  }
];

export function getCategories() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...CATEGORIES]), NETWORK_DELAY);
  });
}

export function getCategoryById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const category = CATEGORIES.find(c => c.category_id === id);
      resolve(category || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// SUPPLIERS
// ============================================================================
const SUPPLIERS = [
  {
    supplier_id: 'S001',
    supplier_name: 'ABC Company',
    contact_number: '09123456780',
    address: 'Pulong Buhangin',
    email: 'abccompany@ex.com'
  },
  {
    supplier_id: 'S002',
    supplier_name: 'XYZ Corp.',
    contact_number: '09123456780',
    address: 'Pulong Buhangin',
    email: 'xyzcorporation@ex.com'
  }
];

export function getSuppliers() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...SUPPLIERS]), NETWORK_DELAY);
  });
}

export function getSupplierById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const supplier = SUPPLIERS.find(s => s.supplier_id === id);
      resolve(supplier || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// WAREHOUSES
// ============================================================================
const WAREHOUSES = [
  {
    warehouse_id: 'W001',
    warehouse_name: 'Main Warehouse',
    location: 'Caypombo'
  },
  {
    warehouse_id: 'W002',
    warehouse_name: 'Branch Warehouse',
    location: 'Poblacion'
  }
];

export function getWarehouses() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...WAREHOUSES]), NETWORK_DELAY);
  });
}

export function getWarehouseById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const warehouse = WAREHOUSES.find(w => w.warehouse_id === id);
      resolve(warehouse || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// PRODUCTS
// ============================================================================
const PRODUCTS = [
  {
    product_id: 'P001',
    product_name: 'Blue Ballpen',
    description: 'Standard blue ink ballpoint pen',
    unit_price: 16,
    category_id: 'C001',
    supplier_id: 'S001'
  },
  {
    product_id: 'P002',
    product_name: 'Black Ballpen',
    description: 'Standard black ink ballpoint pen',
    unit_price: 10,
    category_id: 'C001',
    supplier_id: 'S001'
  },
  {
    product_id: 'P003',
    product_name: 'Stapler',
    description: 'Heavy-duty office stapler',
    unit_price: 40,
    category_id: 'C002',
    supplier_id: 'S001'
  },
  {
    product_id: 'P004',
    product_name: 'A4 Paper Ream',
    description: '500 sheets of A4 white paper',
    unit_price: 120,
    category_id: 'C001',
    supplier_id: 'S002'
  }
];

export function getProducts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...PRODUCTS]), NETWORK_DELAY);
  });
}

export function getProductById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const product = PRODUCTS.find(p => p.product_id === id);
      resolve(product || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// INVENTORY
// ============================================================================
const INVENTORY = [
  {
    inventory_id: 'I001',
    product_id: 'P001',
    warehouse_id: 'W001',
    quantity_on_hand: 300,
    reorder_level: 100,
    last_updated: '2026-01-23'
  },
  {
    inventory_id: 'I002',
    product_id: 'P002',
    warehouse_id: 'W001',
    quantity_on_hand: 400,
    reorder_level: 100,
    last_updated: '2026-01-25'
  },
  {
    inventory_id: 'I003',
    product_id: 'P003',
    warehouse_id: 'W001',
    quantity_on_hand: 150,
    reorder_level: 50,
    last_updated: '2026-01-23'
  },
  {
    inventory_id: 'I004',
    product_id: 'P004',
    warehouse_id: 'W002',
    quantity_on_hand: 100,
    reorder_level: 100,
    last_updated: '2026-03-15'
  }
];

export function getInventory() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...INVENTORY]), NETWORK_DELAY);
  });
}

export function getInventoryById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const inventory = INVENTORY.find(i => i.inventory_id === id);
      resolve(inventory || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// STOCK IN
// ============================================================================
const STOCK_IN = [
  {
    stock_in_id: 'SI001',
    product_id: 'P001',
    warehouse_id: 'W001',
    supplier_id: 'S001',
    user_id: 'U001',
    quantity: 100,
    date_received: '2026-01-23'
  },
  {
    stock_in_id: 'SI002',
    product_id: 'P002',
    warehouse_id: 'W001',
    supplier_id: 'S001',
    user_id: 'U002',
    quantity: 30,
    date_received: '2026-01-23'
  },
  {
    stock_in_id: 'SI003',
    product_id: 'P003',
    warehouse_id: 'W001',
    supplier_id: 'S001',
    user_id: 'U001',
    quantity: 100,
    date_received: '2026-01-25'
  },
  {
    stock_in_id: 'SI004',
    product_id: 'P001',
    warehouse_id: 'W001',
    supplier_id: 'S001',
    user_id: 'U002',
    quantity: 100,
    date_received: '2026-01-25'
  }
];

export function getStockIn() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...STOCK_IN]), NETWORK_DELAY);
  });
}

export function getStockInById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stockIn = STOCK_IN.find(s => s.stock_in_id === id);
      resolve(stockIn || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// STOCK OUT
// ============================================================================
const STOCK_OUT = [
  {
    stock_out_id: 'SO001',
    product_id: 'P004',
    warehouse_id: 'W002',
    user_id: 'U003',
    quantity: 200,
    date_released: '2026-03-15',
    destination: 'Tierra'
  }
];

export function getStockOut() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...STOCK_OUT]), NETWORK_DELAY);
  });
}

export function getStockOutById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stockOut = STOCK_OUT.find(s => s.stock_out_id === id);
      resolve(stockOut || null);
    }, NETWORK_DELAY);
  });
}

// ============================================================================
// USERS
// ============================================================================
const USERS = [
  {
    user_id: 'U001',
    full_name: 'John Smith',
    username: 'jsmith',
    email: 'jsmith@ex.com',
    hashed_password: '-----',
    role: 'Admin'
  },
  {
    user_id: 'U002',
    full_name: 'Jane Doe',
    username: 'jdoe',
    email: 'jdoe@ex.com',
    hashed_password: '-----',
    role: 'Manager'
  }
];

export function getUsers() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...USERS]), NETWORK_DELAY);
  });
}

export function getUserById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = USERS.find(u => u.user_id === id);
      resolve(user || null);
    }, NETWORK_DELAY);
  });
}

// Made with Bob
