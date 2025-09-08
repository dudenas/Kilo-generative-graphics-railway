# KILO Graphics Generator - Vercel Deployment Guide

## Overview
This guide will help you deploy your KILO Graphics Generator to Vercel. The application consists of:
- **Frontend**: HTML/JavaScript/p5.js application served as static files
- **Backend**: Flask API for video processing (deployed as serverless functions)

## Prerequisites
1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed: `npm i -g vercel`
3. Your code pushed to GitHub

## Deployment Steps

### 1. Connect to Vercel
```bash
# Login to Vercel
vercel login

# Navigate to your project directory
cd /Users/kazkas/Desktop/KILO/CODE/Kilo-generative-graphics

# Deploy to Vercel
vercel
```

### 2. Configuration During Deployment
When prompted:
- **Set up and deploy**: Choose `Y`
- **Which scope**: Choose your account
- **Link to existing project**: Choose `N` (unless you have one)
- **Project name**: `kilo-graphics-generator` (or your preferred name)
- **Directory**: `.` (current directory)
- **Override settings**: `N` (use the vercel.json configuration)

### 3. Alternative: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect the configuration from `vercel.json`
5. Click "Deploy"

## What's Configured

### Frontend
- Static HTML, CSS, and JavaScript files served directly
- All `/js/`, `/resources/`, and root files properly routed

### Backend API
- Flask app deployed as serverless functions
- All API endpoints available at `/api/*`:
  - `/api/` - API status
  - `/api/flask-status` - Server status check
  - `/api/progress` - Video conversion progress
  - `/api/convert` - PNG to video conversion

### File Structure
```
/
├── vercel.json           # Deployment configuration
├── index.html           # Main application
├── style.css            # Styles
├── sketch.js            # Main p5.js sketch
├── js/                  # JavaScript modules
├── resources/           # Assets (fonts, logos)
└── flask-server/
    ├── app.py          # Flask API (serverless functions)
    └── requirements.txt # Python dependencies
```

## Environment Variables (if needed)
If you need to set environment variables:
1. In Vercel dashboard, go to your project
2. Settings → Environment Variables
3. Add any required variables

## Limitations on Vercel
- **Function timeout**: 300 seconds (5 minutes) for video processing
- **Memory**: Limited by Vercel's serverless function limits
- **File size**: Max 50MB for function payload
- **FFmpeg**: May have limited codec support in serverless environment

## Testing Your Deployment
1. Visit your deployed URL
2. Test the graphics generator
3. Try exporting PNG and SVG (should work normally)
4. Test video export (may have limitations due to FFmpeg in serverless environment)

## Troubleshooting
- **Video export not working**: FFmpeg may not be available in Vercel's serverless environment
- **Function timeout**: Large videos may exceed the 5-minute limit
- **Memory issues**: Complex animations may hit memory limits

## Alternative Deployment Options
If video processing doesn't work well on Vercel, consider:
1. **Frontend on Vercel + Backend on Railway/Render**: Deploy frontend to Vercel, backend to a platform with better FFmpeg support
2. **Full deployment on Railway/Render**: Deploy the entire application to a platform with persistent storage
3. **Client-side video processing**: Use WebCodecs API or client-side libraries

## Next Steps
1. Deploy to Vercel
2. Test all functionality
3. If video processing has issues, consider the alternative deployment options above
