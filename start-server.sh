#!/bin/bash

echo "🎬 Starting KILO Graphics Generator Web Server..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first."
    echo "   macOS: brew install ffmpeg"
    echo "   Linux: sudo apt-get install ffmpeg"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup Flask server dependencies
echo "🐍 Setting up Python dependencies..."
cd flask-server/

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt
cd ../

# Start the web server
echo "🚀 Starting web server..."
echo "================================================"
echo "Frontend will be available at: http://localhost:3000 (or your domain)"
echo "Flask API will start automatically on port 8080"
echo "Press Ctrl+C to stop the server"
echo "================================================"

npm start
