from http.server import BaseHTTPRequestHandler
import json

# Simple progress tracking (in a real app, you'd use a database or cache)
conversion_progress = 0

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        global conversion_progress
        response = {
            'progress': conversion_progress
        }
        
        self.wfile.write(json.dumps(response).encode())
        return
