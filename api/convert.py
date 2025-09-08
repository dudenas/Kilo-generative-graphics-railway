from http.server import BaseHTTPRequestHandler
import json
import cgi
import io

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # For now, return an error explaining Vercel limitations
            response = {
                'error': 'Video conversion is not fully supported on Vercel serverless functions',
                'reason': 'FFmpeg is not available in the Vercel runtime environment',
                'suggestion': 'Use PNG Sequence export instead, then convert locally with video editing software',
                'alternatives': [
                    'Export PNG Sequence and use local FFmpeg',
                    'Use online video converters',
                    'Deploy backend to a platform with FFmpeg support (Railway, Render, etc.)'
                ]
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            error_response = {
                'error': f'Server error: {str(e)}'
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
