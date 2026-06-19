import os
import re

files = [
    'backend/routes/products.py',
    'backend/routes/categories.py',
    'backend/routes/suppliers.py',
    'backend/routes/warehouses.py',
    'backend/routes/inventory.py',
    'backend/routes/stock_in.py',
    'backend/routes/stock_out.py'
]

for file_path in files:
    with open(file_path, 'r') as f:
        content = f.read()

    # Add import if missing
    if 'from .auth import require_role' not in content:
        content = content.replace('from db import get_connection', 'from db import get_connection\nfrom .auth import require_role')
    
    # Remove any existing require_roles to avoid duplicates if we re-run
    content = re.sub(r'@require_role\(\[\"Manager\"\]\)\n', '', content)
    
    # Add decorator after any @.*_bp.(get|post|put|delete)
    pattern = re.compile(r'(@[a-z_]+_bp\.(?:get|post|put|delete)\([^)]+\))\n(def [a-zA-Z0-9_]+\([^)]*\):)')
    content = pattern.sub(r'\1\n@require_role(["Manager"])\n\2', content)

    with open(file_path, 'w') as f:
        f.write(content)
