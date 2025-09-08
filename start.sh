#!/bin/bash
set -e

echo "🚀 Starting KILO Graphics Generator"
echo "=================================="

# Ensure we're in the right directory
cd /app

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found: $(python3 --version)"
else
    echo "❌ Python3 not found"
    exit 1
fi

# Check if FFmpeg is available
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg found: $(ffmpeg -version | head -n1)"
else
    echo "❌ FFmpeg not found"
fi

# Check if Flask dependencies are installed
echo "🔍 Checking Flask dependencies..."
cd flask-server
python3 -c "import flask; print(f'✅ Flask {flask.__version__} available')" || echo "❌ Flask not available"
python3 -c "import PIL; print(f'✅ Pillow available')" || echo "❌ Pillow not available"
cd ..

# Start Node.js server (which will start Flask as subprocess)
echo "🌐 Starting Node.js server..."
exec node server.js
