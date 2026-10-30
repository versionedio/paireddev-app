#!/bin/sh
# Serves this folder over http (browsers block ES modules on file://) with caching off,
# so every reload shows the latest theme.css and scripts.
cd "$(dirname "$0")" && echo "Open http://localhost:8765  (Ctrl+C to stop)" && python3 -c "
import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
socketserver.TCPServer.allow_reuse_address = True
socketserver.TCPServer(('', 8765), H).serve_forever()
"
