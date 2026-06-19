"""
main.py — Development server entry point for the Inventory & Stock Control System.

This is a static frontend application (HTML + CSS + ES6 JavaScript modules).
ES6 modules require a proper HTTP server with correct MIME types; opening
HTML files directly from the filesystem (file://) will cause CORS/module
loading errors. Run this script to start a local server.

Usage:
    python main.py           # serves on http://localhost:8000
    python main.py 5000      # serves on http://localhost:5000

Then open your browser to:
    http://localhost:8000/login.html
"""

import sys
import os
import http.server
import socketserver
from functools import partial


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_PORT = 3000
HOST = "localhost"

# Root of the project (directory containing this file)
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))


# ---------------------------------------------------------------------------
# Custom handler: correct MIME types for ES6 modules
# ---------------------------------------------------------------------------

class StaticFileHandler(http.server.SimpleHTTPRequestHandler):
    """
    Extends SimpleHTTPRequestHandler to:
    - Serve the project root directory
    - Return the correct Content-Type for .js files (application/javascript)
      so browsers accept them as ES6 modules
    - Suppress request logs for a cleaner console (override log_message)
    """

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js":   "application/javascript",
        ".mjs":  "application/javascript",
        ".css":  "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".svg":  "image/svg+xml",
        ".ico":  "image/x-icon",
    }

    def end_headers(self):
        # Prevent browser caching during development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Print a minimal access log: method + path + status
        print(f"  {self.command:<6} {self.path:<45} {args[1]}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    port = DEFAULT_PORT

    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port '{sys.argv[1]}'. Using default port {DEFAULT_PORT}.")

    # Change working directory so SimpleHTTPRequestHandler serves project files
    os.chdir(PROJECT_ROOT)

    handler = partial(StaticFileHandler, directory=PROJECT_ROOT)

    socketserver.TCPServer.allow_reuse_address = True

    try:
        server = socketserver.TCPServer((HOST, port), handler)
    except OSError as e:
        print(f"\n  ERROR: Could not start server on port {port}.")
        print(f"  {e}")
        print(f"\n  Port {port} is blocked or in use. Try a different port:")
        print(f"      python main.py 3000")
        print(f"      python main.py 5173")
        print(f"      python main.py 52000")
        sys.exit(1)

    url = f"http://{HOST}:{port}/login.html"

    print()
    print("  Inventory & Stock Control System")
    print("  ==================================")
    print(f"  Server running at: http://{HOST}:{port}")
    print(f"  Open in browser:   {url}")
    print()
    print("  Press Ctrl+C to stop the server.")
    print()

    with server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")


if __name__ == "__main__":
    main()
