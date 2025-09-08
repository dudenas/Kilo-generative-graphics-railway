# KILO Graphics Generator

A powerful graphics generation tool with video export capabilities.

## Features

- **Interactive Graphics Generation**: Create dynamic noise-based graphics with real-time controls
- **Multiple Export Formats**: SVG, PNG, PNG Sequence, and MP4 video
- **Animation Support**: Generate animated sequences with customizable parameters
- **High-Quality Video Export**: Uses FFmpeg for professional-quality MP4 output
- **User-Friendly Interface**: Intuitive controls for all generation parameters

## Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **Python 3.8+** 
- **FFmpeg** (for video conversion)

### Quick Start

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies for video conversion:**
   ```bash
   cd ../KILO-image_to_vid
   pip install -r requirements.txt
   ```

3. **Install FFmpeg:**
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Download from https://ffmpeg.org/download.html
   - **Linux**: `sudo apt-get install ffmpeg`

4. **Run the application:**
   ```bash
   npm start
   ```

## Usage

### Basic Graphics Generation

1. **Select Mode**: Choose between Noise, Icon, or Image modes
2. **Adjust Parameters**: Use the controls to modify:
   - Zoom level
   - Threshold values
   - Animation settings
   - Color palette
3. **Generate**: Watch your graphics update in real-time

### Video Export

1. **Configure Animation**: Set animation length and speed
2. **Click Video Export**: The application will:
   - Automatically start the video conversion server
   - Capture animation frames
   - Convert to high-quality MP4
   - Download the final video

### Export Options

- **SVG**: Vector graphics for scalable output
- **PNG**: High-resolution raster images (1x-5x scaling)
- **PNG Sequence**: Individual frames for custom video editing
- **MP4 Video**: Professional-quality video with H.264 encoding

## Development

### Project Structure

```
Kilo-V1/
├── index.html              # Main application interface
├── sketch.js               # Core p5.js graphics logic
├── style.css               # Application styling
├── js/
│   ├── config/             # Configuration files
│   ├── core/               # Core graphics classes
│   ├── image/              # Image processing
│   ├── math/               # Mathematical utilities
│   └── ui/                 # User interface components
├── main.js                 # Electron main process
├── package.json            # Node.js dependencies
└── README.md               # This file

KILO-image_to_vid/          # Flask video conversion server
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
└── ...
```

### Key Components

- **SVGExportManager**: Handles all export functionality
- **Grid System**: Manages the graphics grid and rendering
- **Noise Calculator**: Generates procedural noise patterns
- **Display Manager**: Coordinates UI updates and interactions

### Building for Distribution

```bash
npm run build
```

This creates a distributable Electron app with the Flask server bundled.

## Technical Details

### Video Export Process

1. **Frame Capture**: Canvas frames are captured as PNG data
2. **Server Upload**: Frames are sent to local Flask server
3. **FFmpeg Conversion**: Server uses FFmpeg to create MP4
4. **Download**: Final video is automatically downloaded

### Performance Optimization

- Real-time frame counting and performance monitoring
- Efficient memory management for large frame sequences
- Optimized FFmpeg settings for quality vs. speed balance

## Troubleshooting

### Video Export Issues

- **Server not starting**: Check Python and FFmpeg installation
- **Slow conversion**: Reduce animation length or frame rate
- **Memory issues**: Close other applications during export

### Common Solutions

1. **Restart the application** if video export stops working
2. **Check console logs** for detailed error information
3. **Verify FFmpeg installation** with `ffmpeg -version`

## License

MIT License - see LICENSE file for details.
