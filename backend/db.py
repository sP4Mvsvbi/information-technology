"""
db.py — MySQL connection helper.

Provides get_connection() which returns a fresh mysql-connector connection
using the values from Config. Each route opens and closes its own connection
so we stay simple without needing a connection pool library.
"""

import mysql.connector
from config import Config


def get_connection():
    """
    Returns an open MySQL connection.
    Caller is responsible for closing it (use a try/finally or 'with' block).

    Example:
        conn = get_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT ...")
            rows = cursor.fetchall()
        finally:
            conn.close()
    """
    return mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        charset="utf8mb4",
        use_pure=True,
    )
