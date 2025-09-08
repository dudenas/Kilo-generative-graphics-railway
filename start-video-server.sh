#!/bin/bash

# Start the Flask video conversion server
echo "Starting KILO Video Conversion Server..."
echo "========================================"

# Navigate to the Flask server directory
cd ../KILO-image_to_vid/

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements if needed
echo "Installing/checking requirements..."
pip install -r requirements.txt

# Start the Flask server
echo "Starting Flask server on http://localhost:8080..."
echo "Press Ctrl+C to stop the server"
echo "========================================"
python app.py
