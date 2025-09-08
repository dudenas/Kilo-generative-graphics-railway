# KILO Graphics Generator - Web Deployment Guide

## 📦 Complete Web Application Package

This is a web-based application that you can deploy to any server. It includes:
- **Frontend**: HTML/CSS/JavaScript graphics generator
- **Backend**: Node.js Express server
- **Video Conversion**: Python Flask server with FFmpeg

## 🚀 Quick Start

### Local Development
```bash
./start-server.sh
```

### Manual Startup
```bash
npm start
```

### Docker Deployment (Recommended for Servers)
```bash
docker-compose up -d
```

## 📋 System Requirements

### Required Software
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python 3.8+** - [Download](https://python.org/)
- **FFmpeg** - [Installation Guide](#ffmpeg-installation)

### FFmpeg Installation

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

## 🏗️ Project Structure

```
Kilo-V1/                    # Main application
├── main.js                 # Electron main process
├── package.json            # Dependencies
├── index.html              # Frontend interface
├── js/                     # Application logic
├── start-app.sh           # Startup script
└── README.md              # Documentation

KILO-image_to_vid/         # Video conversion server
├── app.py                 # Flask server
├── requirements.txt       # Python dependencies
└── ...                    # Server files
```

## ⚙️ How It Works

1. **Express Server**: Serves the frontend and manages Flask server
2. **Frontend**: HTML/JavaScript interface accessible via web browser
3. **Flask Server**: Python backend for video conversion using FFmpeg
4. **Automatic Integration**: Flask server starts automatically when Express server launches

## 🌐 Web Access

- **Frontend Interface**: `http://your-domain.com:3000` (or your configured port)
- **Flask API**: Internal only (proxied through Express server)
- **Health Check**: `http://your-domain.com:3000/health`

## 🚀 Server Deployment Options

### Option 1: Traditional Server
1. Upload the entire `Kilo-V1` and `KILO-image_to_vid` folders to your server
2. Install Node.js, Python 3, and FFmpeg on the server
3. Run `npm install` and install Python dependencies
4. Start with `npm start`
5. Set up reverse proxy (nginx/Apache) to serve on port 80/443

### Option 2: Docker Deployment (Recommended)
1. Upload project files to server
2. Install Docker and Docker Compose
3. Run `docker-compose up -d`
4. Access via `http://your-server-ip:3000`

### Option 3: Cloud Platforms
- **Heroku**: Use the provided `Dockerfile`
- **DigitalOcean App Platform**: Deploy directly from Git
- **AWS/GCP**: Use Docker container deployment

## 🎬 Video Export Process

1. User creates graphics and animations
2. Clicks "Video Export" button
3. App captures PNG frames from canvas
4. Frames are sent to local Flask server
5. Server uses FFmpeg to create MP4 video
6. Video automatically downloads

## 🔧 Troubleshooting

### Common Issues

**"Server not starting"**
- Check Python installation: `python3 --version`
- Check FFmpeg installation: `ffmpeg -version`
- Try running: `./start-app.sh`

**"Video export failed"**
- Ensure FFmpeg is installed and in PATH
- Check console for error messages
- Try restarting the application

**"Dependencies not found"**
- Run: `npm install`
- For Flask server: `cd ../KILO-image_to_vid && pip install -r requirements.txt`

### Development Mode

Run with developer tools:
```bash
npm run dev
```

## 📱 Building for Distribution

Create distributable app:
```bash
npm run build
```

This creates a standalone application in the `dist/` folder.

## 🆘 Support

If you encounter issues:

1. Check the console logs (Help → Toggle Developer Tools)
2. Verify all system requirements are installed
3. Try restarting the application
4. Contact support with error logs

## 📄 License

MIT License - See LICENSE file for details.
