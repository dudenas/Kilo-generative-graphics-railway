const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const {
    spawn
} = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const FLASK_PORT = 8080;

let flaskProcess = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for handling multipart/form-data
const upload = multer();

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        flaskServer: flaskProcess ? 'running' : 'stopped'
    });
});

// Start Flask server endpoint
app.post('/start-flask', (req, res) => {
    if (flaskProcess) {
        return res.json({
            success: true,
            message: 'Flask server already running'
        });
    }

    startFlaskServer()
        .then(() => {
            res.json({
                success: true,
                message: 'Flask server started successfully'
            });
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                error: error.message
            });
        });
});

// Stop Flask server endpoint
app.post('/stop-flask', (req, res) => {
    if (flaskProcess) {
        flaskProcess.kill('SIGTERM');
        flaskProcess = null;
        res.json({
            success: true,
            message: 'Flask server stopped'
        });
    } else {
        res.json({
            success: false,
            message: 'Flask server not running'
        });
    }
});

// Check Flask server status
app.get('/api/flask-status', async (req, res) => {
    try {
        const response = await fetch(`http://localhost:${FLASK_PORT}/api/`, {
            signal: AbortSignal.timeout(5000)
        });
        res.json({
            running: response.ok
        });
    } catch (error) {
        res.json({
            running: false
        });
    }
});

function startFlaskServer() {
    return new Promise((resolve, reject) => {
        try {
            console.log('Starting Flask server...');

            // Path to Flask server (now bundled inside Kilo-V1)
            const flaskPath = path.join(__dirname, 'flask-server');

            // Check if Flask server exists
            if (!fs.existsSync(flaskPath)) {
                throw new Error('Flask server directory not found at: ' + flaskPath);
            }

            const appPath = path.join(flaskPath, 'app.py');
            if (!fs.existsSync(appPath)) {
                throw new Error('Flask app.py not found at: ' + appPath);
            }

            // Start Flask server with more robust Python detection
            let pythonCmd = 'python3';

            // Try to find Python
            try {
                const {
                    execSync
                } = require('child_process');
                execSync('python3 --version', {
                    stdio: 'pipe'
                });
                pythonCmd = 'python3';
            } catch (e) {
                try {
                    execSync('python --version', {
                        stdio: 'pipe'
                    });
                    pythonCmd = 'python';
                } catch (e2) {
                    throw new Error('Python not found. Please install Python 3.');
                }
            }

            console.log(`Using Python command: ${pythonCmd}`);

            flaskProcess = spawn(pythonCmd, [appPath], {
                cwd: flaskPath,
                env: {
                    ...process.env,
                    PORT: FLASK_PORT.toString(),
                    FLASK_ENV: 'production',
                    PYTHONPATH: flaskPath
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            flaskProcess.stdout.on('data', (data) => {
                console.log('Flask stdout:', data.toString());
            });

            flaskProcess.stderr.on('data', (data) => {
                console.log('Flask stderr:', data.toString());
            });

            flaskProcess.on('error', (error) => {
                console.error('Failed to start Flask server:', error);
                reject(error);
            });

            flaskProcess.on('close', (code) => {
                console.log(`Flask server exited with code ${code}`);
                flaskProcess = null;
            });

            // Give Flask server time to start
            setTimeout(() => {
                console.log(`Flask server should be running on http://localhost:${FLASK_PORT}`);
                resolve();
            }, 3000);

        } catch (error) {
            console.error('Error starting Flask server:', error);
            reject(error);
        }
    });
}

// Proxy endpoints for Flask server
app.get('/api/progress', async (req, res) => {
    try {
        console.log('Checking progress from Flask server...');
        const response = await fetch(`http://localhost:${FLASK_PORT}/api/progress`, {
            signal: AbortSignal.timeout(20000) // 20s to allow work
        });

        if (!response.ok) {
            console.error(`Flask server returned ${response.status}: ${response.statusText}`);
            return res.status(500).json({
                error: `Flask server error: ${response.status} ${response.statusText}`
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Flask progress error:', error);

        // Try to start Flask server if it's not running
        if (error.code === 'ECONNREFUSED' || error.name === 'TypeError') {
            console.log('Flask server appears to be down, attempting to start...');
            try {
                await startFlaskServer();
                // Retry the request
                const retryResponse = await fetch(`http://localhost:${FLASK_PORT}/api/progress`);
                const retryData = await retryResponse.json();
                return res.json(retryData);
            } catch (startError) {
                console.error('Failed to start Flask server:', startError);
            }
        }

        res.status(500).json({
            error: 'Flask server not available',
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

app.post('/api/convert', async (req, res) => {
    try {
        console.log('Proxying video conversion request to Flask server...');

        // Set longer timeout for video processing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

        // Forward the multipart form data to Flask server with better error handling
        const response = await fetch(`http://localhost:${FLASK_PORT}/api/convert`, {
            method: 'POST',
            body: req,
            headers: req.headers,
            duplex: 'half',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            console.log('Flask server responded successfully');

            // Set appropriate headers
            res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
            res.setHeader('Content-Disposition', response.headers.get('content-disposition') || 'attachment; filename="video.mp4"');

            // Get the response as buffer and send it (fetch API doesn't support direct piping)
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        } else {
            console.error(`Flask server error: ${response.status} ${response.statusText}`);
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = {
                    error: `Server returned ${response.status}: ${response.statusText}`
                };
            }
            res.status(response.status).json(errorData);
        }
    } catch (error) {
        console.error('Proxy error:', error);

        let errorMessage = 'Failed to connect to video conversion server';
        if (error.name === 'AbortError') {
            errorMessage = 'Video conversion timed out (5 minutes). Try reducing animation length or frame count.';
        } else if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection lost during video conversion. This may be due to large file size or server overload.';
        }

        res.status(500).json({
            error: errorMessage,
            details: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    if (flaskProcess) {
        flaskProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    if (flaskProcess) {
        flaskProcess.kill('SIGTERM');
    }
    process.exit(0);
});

// Start the server
app.listen(PORT, () => {
    console.log('🎬 KILO Graphics Generator Server');
    console.log('================================');
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Flask API: http://localhost:${FLASK_PORT} (will start automatically)`);
    console.log('================================');

    // Auto-start Flask server with better error handling
    setTimeout(async () => {
        try {
            console.log('🔄 Auto-starting Flask server...');
            await startFlaskServer();
            console.log('✅ Flask server started automatically');

            // Verify it's actually working
            setTimeout(async () => {
                try {
                    const testResponse = await fetch(`http://localhost:${FLASK_PORT}/api/`, {
                        signal: AbortSignal.timeout(5000)
                    });
                    if (testResponse.ok) {
                        console.log('✅ Flask server verified working');
                    } else {
                        console.log(`⚠️ Flask server responding but returned ${testResponse.status}`);
                    }
                } catch (error) {
                    console.error('❌ Flask server verification failed:', error.message);
                }
            }, 2000);

        } catch (error) {
            console.error('❌ Failed to auto-start Flask server:', error.message);
            console.log('💡 You may need to manually start the Flask server or check Python/dependencies');
        }
    }, 1000);
});