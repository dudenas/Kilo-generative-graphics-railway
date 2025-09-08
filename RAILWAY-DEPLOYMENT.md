# KILO Graphics Generator - Railway Deployment Guide

## Overview
This guide will help you deploy your KILO Graphics Generator to Railway. The application consists of:
- **Frontend**: HTML/JavaScript/p5.js application served by Express
- **Backend**: Node.js Express server with Flask API for video processing
- **Video Processing**: Python Flask server with FFmpeg support

## Prerequisites
1. A Railway account (sign up at [railway.app](https://railway.app))
2. Your code pushed to GitHub
3. Railway CLI (optional): `npm install -g @railway/cli`

## Deployment Methods

### Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub** (already done)
2. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
3. **Connect Repository**
   - Select your `Kilo-generative-graphics-railway` repository
   - Railway will automatically detect it's a Node.js project
4. **Deploy**
   - Railway will automatically build and deploy
   - It will use the `npm start` command from package.json
   - No additional configuration needed!

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to your project
cd /path/to/Kilo-generative-graphics-railway

# Initialize and deploy
railway init
railway up
```

## What Railway Detects Automatically

✅ **Node.js Application**: Detected via `package.json`  
✅ **Start Command**: `npm start` (runs `node server.js`)  
✅ **Port Configuration**: Your app already uses `process.env.PORT || 3000`  
✅ **Dependencies**: Automatically installs from `package.json`  
✅ **Python Dependencies**: Flask server dependencies in `flask-server/requirements.txt`  

## Application Architecture on Railway

```
Railway Container
├── Node.js Express Server (Port: $PORT)
│   ├── Serves static frontend files
│   ├── Handles API routing
│   └── Manages Flask server lifecycle
└── Python Flask Server (Port: 8080)
    ├── Video conversion API
    ├── FFmpeg processing
    └── File handling
```

## Environment Variables

Your application is already configured to work with Railway's environment:

- `PORT`: Automatically provided by Railway (your app listens on this)
- `FLASK_ENV`: Set to 'production' in your server.js
- All other configuration is handled automatically

## Features Available on Railway

✅ **Full FFmpeg Support**: Unlike Vercel, Railway supports full FFmpeg functionality  
✅ **Persistent Storage**: Better for temporary file handling during video processing  
✅ **No Function Timeouts**: No 5-minute serverless limits  
✅ **Better Memory**: More resources for video processing  
✅ **Docker Support**: Your Dockerfile can be used if needed  

## Post-Deployment

1. **Access Your App**: Railway provides a public URL (e.g., `https://your-app.railway.app`)
2. **Test All Features**:
   - Graphics generation ✅
   - PNG export ✅
   - SVG export ✅
   - **Video export ✅** (This should work much better than on Vercel!)

## Monitoring and Logs

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history and rollback if needed

## Scaling and Performance

Railway automatically handles:
- **Auto-scaling**: Based on traffic
- **Resource allocation**: CPU and memory as needed
- **Global CDN**: For faster static file delivery

## Troubleshooting

### Common Issues:
1. **Flask server not starting**: Check Python dependencies in logs
2. **Video conversion fails**: Monitor memory usage, may need to upgrade plan
3. **Port conflicts**: Your app already handles this correctly

### Checking Logs:
```bash
# Via CLI
railway logs

# Or check the Railway dashboard logs section
```

## Cost Considerations

- **Hobby Plan**: Free tier with generous limits
- **Pro Plan**: $5/month for higher resource limits
- **Video processing**: May use more resources, monitor usage

## Next Steps

1. ✅ Deploy to Railway using Method 1 (GitHub integration)
2. ✅ Test all functionality, especially video export
3. ✅ Monitor performance and resource usage
4. ✅ Set up custom domain (optional)

## Advantages Over Vercel

- ✅ **Full FFmpeg support** for video processing
- ✅ **No serverless timeouts** for long video renders
- ✅ **Better file handling** with persistent storage
- ✅ **More memory** for complex animations
- ✅ **Real-time logs** for debugging

Your application is now ready for Railway deployment! 🚀
