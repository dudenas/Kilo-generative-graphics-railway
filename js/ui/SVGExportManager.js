// SVG Export Manager - export actual graphics
class SVGExportManager {
    constructor() {
        this.svgSketch = null;
        this.isInitialized = false;
        this._exportSVG = false;
        this._exportPNG = false;
        this._exportPNGSequence = false;
        this._exportVideo = false;
        this.pngResolution = 2; // Default to 2x (matches HTML default)
        this.capturer = null;
        this.videoCapturer = null;
        this.isCapturing = false;
        this.isCapturingVideo = false;
        this.recordedFrames = 0;
        this.videoRecordedFrames = 0;
        this.totalSaveFrames = 300;
        this.ffmpeg = null;
        this.ffmpegLoaded = false;
        this.capturedFrames = []; // Store PNG frames for video conversion
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.canvasStream = null;
        this.grid = null;
        this.currentColors = {
            background: [255, 255, 255],
            graphics: [0, 0, 0]
        };
    }

    init() {
        if (this.isInitialized) return;



        // Set up export buttons
        const svgExportButton = document.getElementById('svg-export-button');
        if (svgExportButton) {
            svgExportButton.addEventListener('click', () => this.triggerSVGExport());
        }

        const pngExportButton = document.getElementById('png-export-button');
        if (pngExportButton) {
            pngExportButton.addEventListener('click', () => this.triggerPNGExport());
        }

        const pngSequenceExportButton = document.getElementById('png-sequence-export-button');
        if (pngSequenceExportButton) {
            pngSequenceExportButton.addEventListener('click', () => this.triggerPNGSequenceExport());
        }

        const videoExportButton = document.getElementById('video-export-button');
        if (videoExportButton) {
            videoExportButton.addEventListener('click', () => this.triggerVideoExport());
        }

        const resolutionSelect = document.getElementById('png-resolution-select');
        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', (e) => {
                this.pngResolution = parseInt(e.target.value);
                console.log(`PNG resolution set to ${this.pngResolution}x`);
            });
        }

        // Initialize export sketches
        this.initializeSVGSketch();
        this.initializePNGSketch();

        // Initialize FFmpeg for video conversion
        this.initializeFFmpeg();

        // Check Flask server status and update button
        this.checkServerStatusAndUpdateButton();

        this.isInitialized = true;

    }

    // Simple SVG sketch for export testing
    initializeSVGSketch() {


        const self = this;

        const svgSketch = function (p) {
            p.setup = function () {


                try {
                    // Use current canvas dimensions
                    const canvasWidth = width || AppConstants.BASE_DIMENSION;
                    const canvasHeight = height || AppConstants.BASE_DIMENSION;
                    const canvas = p.createCanvas(canvasWidth, canvasHeight, p.SVG);


                    // Hide the canvas
                    canvas.canvas.style.display = 'none';

                    p.noLoop();
                    p.noStroke();

                } catch (error) {
                    console.error('Error creating SVG canvas:', error);
                }
            };

            p.draw = function () {


                // Set background color
                if (Array.isArray(self.currentColors.background)) {
                    p.background(
                        self.currentColors.background[0],
                        self.currentColors.background[1],
                        self.currentColors.background[2]
                    );
                } else {
                    p.background(255);
                }

                // Draw actual grid graphics
                self.drawGridToSVG(p);

                // Export if requested
                if (self._exportSVG) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const filename = `kilo-graphics-${timestamp}.svg`;
                    p.save(filename);
                    self._exportSVG = false;

                }
            };
        };

        try {
            this.svgSketch = new p5(svgSketch);

        } catch (error) {
            console.error('Error creating p5 SVG instance:', error);
        }
    }

    // Initialize PNG sketch for high-resolution export
    initializePNGSketch() {


        const self = this;

        const pngSketch = function (p) {
            p.setup = function () {


                try {
                    // Use scaled canvas dimensions based on resolution
                    const baseWidth = width || AppConstants.BASE_DIMENSION;
                    const baseHeight = height || AppConstants.BASE_DIMENSION;
                    const scaledWidth = baseWidth * self.pngResolution;
                    const scaledHeight = baseHeight * self.pngResolution;

                    const canvas = p.createCanvas(scaledWidth, scaledHeight);


                    // Hide the canvas
                    canvas.canvas.style.display = 'none';

                    p.noLoop();
                    p.noStroke();
                    p.pixelDensity(1); // Important: keep at 1 since we're scaling manually

                } catch (error) {
                    console.error('Error creating PNG canvas:', error);
                }
            };

            p.draw = function () {


                // Scale everything by resolution factor
                p.scale(self.pngResolution);

                // Set background color
                if (Array.isArray(self.currentColors.background)) {
                    p.background(
                        self.currentColors.background[0],
                        self.currentColors.background[1],
                        self.currentColors.background[2]
                    );
                } else {
                    p.background(255);
                }

                // Draw actual grid graphics (scaled)
                self.drawGridToPNG(p);

                // Export if requested
                if (self._exportPNG) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                    const filename = `kilo-graphics-${self.pngResolution}x-${timestamp}.png`;
                    p.save(filename);
                    self._exportPNG = false;

                }
            };
        };

        try {
            this.pngSketch = new p5(pngSketch);

        } catch (error) {
            console.error('Error creating p5 PNG instance:', error);
        }
    }

    // Draw grid rectangles to SVG
    drawGridToSVG(p) {
        if (!this.grid || !this.grid.rectangles || this.grid.rectangles.length === 0) {

            return;
        }

        let exportedCount = 0;
        const canvasWidth = width || AppConstants.BASE_DIMENSION;
        const canvasHeight = height || AppConstants.BASE_DIMENSION;

        // Draw only non-zero rectangles that are visible within canvas bounds
        // This matches exactly what Grid.getNonZeroCount() counts
        for (let rectangle of this.grid.rectangles) {
            // Use exact same logic as Grid.getNonZeroCount()
            if (rectangle.currentHeight > 0 && rectangle.isVisible(canvasWidth, canvasHeight)) {
                exportedCount++;

                // Use Rectangle class method to draw (ensures identical rendering)
                this.drawRectangleToSVG(p, rectangle);
            }
        }


    }

    // Draw grid rectangles to PNG (same logic as SVG but for PNG canvas)
    drawGridToPNG(p) {
        if (!this.grid || !this.grid.rectangles || this.grid.rectangles.length === 0) {

            return;
        }

        let exportedCount = 0;
        const canvasWidth = width || AppConstants.BASE_DIMENSION;
        const canvasHeight = height || AppConstants.BASE_DIMENSION;

        // Draw only non-zero rectangles that are visible within canvas bounds
        for (let rectangle of this.grid.rectangles) {
            if (rectangle.currentHeight > 0 && rectangle.isVisible(canvasWidth, canvasHeight)) {
                exportedCount++;

                // Use Rectangle class method to draw (ensures identical rendering)
                this.drawRectangleToPNG(p, rectangle);
            }
        }


    }

    // Draw individual rectangle using Rectangle class directly
    drawRectangleToSVG(p, rectangle) {
        // Set fill color
        if (rectangle.baseColor) {
            p.fill(rectangle.baseColor[0], rectangle.baseColor[1], rectangle.baseColor[2]);
        } else {
            p.fill(this.currentColors.graphics[0], this.currentColors.graphics[1], this.currentColors.graphics[2]);
        }

        // Store current p5 context functions temporarily
        const originalBeginShape = window.beginShape;
        const originalVertex = window.vertex;
        const originalQuadraticVertex = window.quadraticVertex;
        const originalEndShape = window.endShape;

        // Replace global p5 functions with SVG p5 instance functions
        window.beginShape = p.beginShape.bind(p);
        window.vertex = p.vertex.bind(p);
        window.quadraticVertex = p.quadraticVertex.bind(p);
        window.endShape = p.endShape.bind(p);

        try {
            // Use Rectangle's own draw method - this ensures 100% identical rendering
            rectangle.draw();
        } finally {
            // Restore original p5 context functions
            window.beginShape = originalBeginShape;
            window.vertex = originalVertex;
            window.quadraticVertex = originalQuadraticVertex;
            window.endShape = originalEndShape;
        }
    }

    // Draw individual rectangle to PNG using Rectangle class directly
    drawRectangleToPNG(p, rectangle) {
        // Set fill color
        if (rectangle.baseColor) {
            p.fill(rectangle.baseColor[0], rectangle.baseColor[1], rectangle.baseColor[2]);
        } else {
            p.fill(this.currentColors.graphics[0], this.currentColors.graphics[1], this.currentColors.graphics[2]);
        }

        // Store current p5 context functions temporarily
        const originalBeginShape = window.beginShape;
        const originalVertex = window.vertex;
        const originalQuadraticVertex = window.quadraticVertex;
        const originalEndShape = window.endShape;

        // Replace global p5 functions with PNG p5 instance functions
        window.beginShape = p.beginShape.bind(p);
        window.vertex = p.vertex.bind(p);
        window.quadraticVertex = p.quadraticVertex.bind(p);
        window.endShape = p.endShape.bind(p);

        try {
            // Use Rectangle's own draw method - this ensures 100% identical rendering
            rectangle.draw();
        } finally {
            // Restore original p5 context functions
            window.beginShape = originalBeginShape;
            window.vertex = originalVertex;
            window.quadraticVertex = originalQuadraticVertex;
            window.endShape = originalEndShape;
        }
    }

    // Update SVG canvas size to match main canvas
    updateSVGCanvasSize() {

        if (this.svgSketch) {
            // Remove existing SVG sketch
            this.svgSketch.remove();
            // Recreate with current canvas dimensions
            this.initializeSVGSketch();
        }
    }

    // Trigger SVG export
    triggerSVGExport() {

        if (this.svgSketch && this.grid) {
            // Update canvas size before export to match current main canvas
            this.updateSVGCanvasSize();
            this._exportSVG = true;
            this.svgSketch.redraw();
        } else {
            console.error('SVG sketch or grid not available');
            if (!this.grid) {
                alert('No graphics to export. Please generate some graphics first.');
            }
        }
    }

    // Trigger PNG export
    triggerPNGExport() {

        if (this.pngSketch && this.grid) {
            // Recreate PNG sketch with current canvas dimensions and resolution
            this.pngSketch.remove();
            this.initializePNGSketch();

            // Trigger export
            this._exportPNG = true;
            this.pngSketch.redraw();
        } else {
            console.error('PNG sketch or grid not available');
            if (!this.grid) {
                alert('No graphics to export. Please generate some graphics first.');
            }
        }
    }

    // Trigger PNG sequence export
    triggerPNGSequenceExport() {

        if (!this.grid) {
            alert('No graphics to export. Please generate some graphics first.');
            return;
        }

        if (this.isCapturing || this.isCapturingVideo) {
            alert('Export already in progress. Please wait for it to complete.');
            return;
        }

        // Show overlay and set button active
        this.showOverlay();
        this.setButtonActive('png-sequence-export-button', true);

        // Get loop duration from current animation length setting
        console.log(`Checking noiseConfig:`, window.noiseConfig);
        const totalFrames = window.noiseConfig ? window.noiseConfig.loopDuration : 300;
        const animSpeed = window.noiseConfig ? window.noiseConfig.animationSpeed : 1.0;
        console.log(`PNG Sequence Export Settings:`)
        console.log(`- Animation Length: ${totalFrames} frames (${totalFrames/30}s at 30fps)`);
        console.log(`- Animation Speed: ${animSpeed}x`);
        console.log(`- Will export ${totalFrames} PNG files`);

        // Double-check by reading from slider directly
        const lengthSlider = document.getElementById('animation-length-slider');
        if (lengthSlider) {
            console.log(`- Slider value: ${lengthSlider.value} frames`);
        }


        try {
            // Initialize CCapture
            this.initializeCapture(totalFrames);

            // Start capturing immediately
            this.startCapture();
        } catch (error) {
            console.error('PNG sequence export failed:', error);
            this.setButtonActive('png-sequence-export-button', false);
            this.hideOverlay();
            alert('PNG sequence export failed: ' + error.message);
        }
    }

    // Trigger Video export (PNG sequence to Flask server)
    async triggerVideoExport() {

        if (!this.grid) {
            alert('No graphics to export. Please generate some graphics first.');
            return;
        }

        if (this.isCapturing || this.isCapturingVideo) {
            alert('Export already in progress. Please wait for it to complete.');
            return;
        }

        // Show overlay and set button active
        this.showOverlay();
        this.setButtonActive('video-export-button', true);

        // Check if Vercel API is available
        const serverRunning = await this.checkFlaskServer();
        if (!serverRunning) {
            const startServer = confirm(`Video conversion API is not responding. 

Would you like to try connecting?

This will:
1. Connect to the Vercel serverless API
2. Capture PNG frames from your animation
3. Attempt video conversion (may have limitations)

Note: Full video processing may not work on Vercel due to FFmpeg limitations.

Click OK to try, or Cancel to use PNG Sequence export instead.`);

            if (startServer) {
                await this.startFlaskServer();
            } else {
                return;
            }
        }

        // Get loop duration from current animation length setting
        console.log(`Checking noiseConfig:`, window.noiseConfig);
        const totalFrames = window.noiseConfig ? window.noiseConfig.loopDuration : 300;
        const animSpeed = window.noiseConfig ? window.noiseConfig.animationSpeed : 1.0;
        const framerate = 30;
        const duration = totalFrames / framerate;

        console.log(`Video Export Settings:`)
        console.log(`- Animation Length: ${totalFrames} frames (${duration}s at ${framerate}fps)`);
        console.log(`- Animation Speed: ${animSpeed}x`);
        console.log(`- Will capture PNG frames and send to Flask server for MP4 conversion`);

        // Initialize PNG frame capture for server upload
        this.initializePNGFrameCapture(totalFrames);

        // Start capturing immediately
        this.startPNGFrameCapture();
    }

    // Initialize CCapture with proper settings
    initializeCapture(totalFrames) {
        try {
            // Check if CCapture is available
            if (typeof CCapture === 'undefined') {
                console.error('CCapture library not loaded');
                alert('CCapture library not loaded. Please refresh the page and try again.');
                return;
            }

            // Create CCapture instance
            this.capturer = new CCapture({
                format: 'png',
                framerate: 30,
                verbose: false
            });

            this.totalSaveFrames = totalFrames;
            this.recordedFrames = 0;


        } catch (error) {
            console.error('Failed to initialize CCapture:', error);
            alert('Failed to initialize capture. Please refresh the page and try again.');
        }
    }

    // Start the capture process
    startCapture() {
        if (!this.capturer) {
            console.error('Capturer not initialized');
            this.initializeCapture(this.totalSaveFrames || 300);
            if (!this.capturer) {
                return;
            }
        }

        this.isCapturing = true;
        this.recordedFrames = 0;

        // Show progress
        this.showExportProgress(0, this.totalSaveFrames);

        // Don't modify frameCount - let it continue naturally
        // We'll use our own recordedFrames counter for the animation sequence

        // Don't start capturer here - let the draw loop start it on first frame

    }

    // This should be called from the main draw() loop when capturing
    captureFrame() {
        if (this.isCapturing && this.capturer) {
            // Start capturer on first frame (like the working example)
            if (this.recordedFrames === 0) {

                this.capturer.start();
            }

            const canvas = document.getElementById('sketch-container').querySelector('canvas');
            if (canvas) {

                this.capturer.capture(canvas);
                this.recordedFrames++;

                // Update progress
                this.showExportProgress(this.recordedFrames, this.totalSaveFrames);

                // Check if we've captured all frames
                if (this.recordedFrames >= this.totalSaveFrames) {

                    this.stopCapture();
                }
            } else {
                console.error('Canvas not found!');
            }
        }

        // Handle PNG frame capture for Flask server conversion
        if (this.isCapturingVideo) {
            const canvas = document.getElementById('sketch-container').querySelector('canvas');
            if (canvas) {
                // Capture current frame as PNG data
                const frameDataURL = canvas.toDataURL('image/png');
                this.capturedFrames.push(frameDataURL);
                this.videoRecordedFrames++;

                // Update progress
                this.showVideoExportProgress(this.videoRecordedFrames, this.totalSaveFrames);

                // Check if we've captured all frames
                if (this.videoRecordedFrames >= this.totalSaveFrames) {
                    this.stopPNGFrameCapture();
                }
            } else {
                console.error('Canvas not found!');
            }
        }
    }

    // Stop capturing and finalize
    stopCapture() {
        if (this.capturer && this.isCapturing) {

            this.capturer.stop();
            this.capturer.save();

            this.isCapturing = false;
            this.recordedFrames = 0;

            // Show completion message
            this.showExportComplete(this.totalSaveFrames);

            // Reinitialize capturer for next use
            this.initializeCapture(this.totalSaveFrames);


        }
    }

    // Initialize Video Capture with WebM format
    initializeVideoCapture(totalFrames) {
        try {
            // Check if CCapture is available
            if (typeof CCapture === 'undefined') {
                console.error('CCapture library not loaded');
                alert('CCapture library not loaded. Please refresh the page and try again.');
                return;
            }

            // Create CCapture instance for video (WebM first, then convert to MP4)
            this.videoCapturer = new CCapture({
                format: 'webm-mediarecorder',
                framerate: 30,
                verbose: false,
                name: 'kilo-video-temp'
            });

            this.totalSaveFrames = totalFrames;
            this.videoRecordedFrames = 0;

            console.log(`Video capturer initialized for ${totalFrames} frames`);

        } catch (error) {
            console.error('Failed to initialize Video CCapture:', error);
            alert('Failed to initialize video capture. Please refresh the page and try again.');
        }
    }

    // Start the video capture process
    startVideoCapture() {
        if (!this.videoCapturer) {
            console.error('Video capturer not initialized');
            this.initializeVideoCapture(this.totalSaveFrames || 300);
            if (!this.videoCapturer) {
                return;
            }
        }

        this.isCapturingVideo = true;
        this.videoRecordedFrames = 0;

        // Show progress
        this.showVideoExportProgress(0, this.totalSaveFrames);

        console.log(`Starting video capture for ${this.totalSaveFrames} frames`);
    }

    // Initialize PNG frame capture for video
    initializePNGFrameCapture(totalFrames) {
        this.totalSaveFrames = totalFrames;
        this.videoRecordedFrames = 0;
        this.capturedFrames = [];
        console.log(`PNG frame capture initialized for ${totalFrames} frames`);
    }

    // Start PNG frame capture
    startPNGFrameCapture() {
        this.isCapturingVideo = true;
        this.videoRecordedFrames = 0;
        this.capturedFrames = [];

        // Show progress
        this.showVideoExportProgress(0, this.totalSaveFrames);

        console.log(`Starting PNG frame capture for ${this.totalSaveFrames} frames`);
    }

    // Stop PNG frame capture and send to Flask server
    stopPNGFrameCapture() {
        console.log(`Stopping PNG frame capture after ${this.videoRecordedFrames} frames`);

        this.isCapturingVideo = false;

        // Send PNG frames to Flask server for MP4 conversion
        this.sendPNGFramesToServer();

        console.log('PNG frame capture completed, sending to server...');
    }

    // Check if Vercel API is working
    async checkFlaskServer() {
        try {
            const response = await fetch('/api/flask-status', {
                method: 'GET'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Vercel API status:', data);
                return true;
            }
            return false;
        } catch (error) {
            console.log('Vercel API not responding:', error.message);
            return false;
        }
    }

    // Connect to Vercel API (always available)
    async startFlaskServer() {
        try {
            this.showConversionProgress('Connecting to video conversion API...');

            // Check if Vercel API is available
            const serverStarted = await this.checkFlaskServer();

            if (!serverStarted) {
                throw new Error('Vercel API is not responding');
            }

            this.showConversionProgress('API connected successfully!');
            this.updateVideoButtonStatus(true, '(API Ready)');
            this.showServerStatus('Video conversion API connected successfully', 'success');
            return true;

        } catch (error) {
            console.error('Failed to start Flask server:', error);
            this.showServerStatus(`Failed to start video server: ${error.message}`, 'error');
            alert(`Failed to start video conversion server: ${error.message}\n\nPlease check that Python and FFmpeg are installed.`);
            return false;
        }
    }

    // Send PNG frames to Flask server
    async sendPNGFramesToServer() {
        try {
            this.showConversionProgress('Preparing frames for upload...');

            if (this.capturedFrames.length === 0) {
                throw new Error('No frames captured');
            }

            // Create FormData with PNG files
            const formData = new FormData();

            for (let i = 0; i < this.capturedFrames.length; i++) {
                // Convert data URL to blob
                const dataURL = this.capturedFrames[i];
                const response = await fetch(dataURL);
                const blob = await response.blob();

                // Add to form data with sequential filename
                const filename = `frame_${String(i).padStart(6, '0')}.png`;
                formData.append('files[]', blob, filename);

                // Update progress
                if (i % 5 === 0 || i === this.capturedFrames.length - 1) {
                    const progress = Math.round((i + 1) / this.capturedFrames.length * 100);
                    this.showConversionProgress(`Preparing frames... ${i + 1}/${this.capturedFrames.length} (${progress}%)`);
                }
            }

            // Add format parameter
            formData.append('format', 'mp4');

            this.showConversionProgress('Uploading frames to server...');

            // Start upload and progress monitoring in parallel
            const uploadPromise = this.uploadWithProgress('/api/convert', formData);

            // Give upload a moment to start, then begin progress monitoring
            setTimeout(() => {
                this.monitorServerProgress();
            }, 500);

            // Wait for upload/conversion to complete
            const uploadResponse = await uploadPromise;

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Server conversion failed');
            }

            // Get the video result
            const videoBlob = await uploadResponse.blob();
            const url = URL.createObjectURL(videoBlob);

            // Create download link
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `kilo-video-${timestamp}.mp4`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            this.showVideoExportComplete(this.totalSaveFrames, 'MP4');
            console.log('Video conversion and download completed');

        } catch (error) {
            console.error('Failed to convert via Flask server:', error);
            // Reset button state on error too
            this.setButtonActive('video-export-button', false);
            this.hideOverlay();
            alert(`Video conversion failed: ${error.message}\n\nPlease check that the Flask server is running and try again.`);
        }

        // Reset for next use
        this.capturedFrames = [];
        this.videoRecordedFrames = 0;
    }

    // Monitor server conversion progress
    async monitorServerProgress() {
        try {
            let progress = 0;
            let lastProgress = 0;
            let stuckCounter = 0;

            console.log('Starting progress monitoring...');

            while (progress < 100) {
                const response = await fetch('/api/progress');
                if (response.ok) {
                    const data = await response.json();
                    progress = data.progress;
                    console.log('Progress update:', progress);

                    if (progress > 0) {
                        // Show progress with percentage
                        const roundedProgress = Math.round(progress);
                        if (progress < 70) {
                            this.showConversionProgress(`Processing frames`, roundedProgress);
                        } else if (progress < 95) {
                            this.showConversionProgress(`Encoding video`, roundedProgress);
                        } else {
                            this.showConversionProgress(`Finalizing video`, roundedProgress);
                        }
                    }

                    // Check if progress is stuck
                    if (progress === lastProgress) {
                        stuckCounter++;
                        if (stuckCounter > 30) { // 30 seconds stuck
                            console.warn('Server progress appears stuck, continuing anyway...');
                            break;
                        }
                    } else {
                        stuckCounter = 0;
                    }
                    lastProgress = progress;
                }

                if (progress < 100) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            console.warn('Could not monitor server progress:', error);
            // Continue anyway - the server might still be working
        }
    }

    // Show export progress
    showExportProgress(current, total) {
        const progressText = `Capturing frame ${current} of ${total}`;
        const percentage = Math.round((current / total) * 100);

        // Create or update progress element
        let progressElement = document.getElementById('export-progress');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'export-progress';
            progressElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                color: black;
                padding: 20px;
                border-radius: 8px;
                z-index: 1000;
                font-family: 'Saans', 'Arial', sans-serif;
                text-align: center;
                min-width: 300px;
                border: none;
            `;
            document.body.appendChild(progressElement);
        }
        progressElement.innerHTML = `
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; color: black;">PNG Sequence Export</div>
            <div style="font-size: 14px; color: black; margin-bottom: 8px;">${progressText}</div>
            <div style="width: 100%; background: #f0f0f0; height: 8px; margin: 16px 0;">
                <div style="width: ${percentage}%; background: #22c55e; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 14px; color: black;">${percentage}% complete</div>
        `;
    }

    // Show export complete message
    showExportComplete(totalFrames) {
        const progressElement = document.getElementById('export-progress');
        if (progressElement) {
            progressElement.innerHTML = `
                <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; color: black;">PNG Sequence Export Complete</div>
                <div style="font-size: 14px; color: black; margin-bottom: 8px;">${totalFrames} PNG files exported</div>
                <div style="font-size: 14px; color: black;">Files will download as ZIP automatically</div>
            `;
            progressElement.style.background = 'white';
            progressElement.style.border = 'none';

            // Reset button state when export is complete
            this.setButtonActive('png-sequence-export-button', false);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideExportProgress();
            }, 5000);
        }
    }

    // Hide export progress
    hideExportProgress() {
        const progressElement = document.getElementById('export-progress');
        if (progressElement) {
            progressElement.remove();
        }
        this.hideOverlay();
    }

    // Show dimmed overlay to prevent interactions
    showOverlay() {
        let overlay = document.getElementById('export-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'export-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.75);
                z-index: 999;
                pointer-events: all;
            `;
            document.body.appendChild(overlay);
        }
    }

    // Hide overlay
    hideOverlay() {
        const overlay = document.getElementById('export-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Set button active state
    setButtonActive(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (isActive) {
                button.style.background = '#22c55e'; // Brand green
                button.style.color = 'white';
                button.disabled = true;
            } else {
                button.style.background = '';
                button.style.color = '';
                button.disabled = false;
            }
        }
    }

    // Show video export progress
    showVideoExportProgress(current, total) {
        const progressText = `Recording video frame ${current} of ${total}`;
        const percentage = Math.round((current / total) * 100);

        // Create or update progress element
        let progressElement = document.getElementById('video-export-progress');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'video-export-progress';
            progressElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                color: black;
                padding: 20px;
                border-radius: 8px;
                z-index: 1000;
                font-family: 'Saans', 'Arial', sans-serif;
                text-align: center;
                min-width: 300px;
                border: none;
            `;
            document.body.appendChild(progressElement);
        }
        progressElement.innerHTML = `
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; color: black;">Video Export</div>
            <div style="font-size: 14px; color: black; margin-bottom: 8px;">${progressText}</div>
            <div style="width: 100%; background: #f0f0f0; height: 8px; margin: 16px 0;">
                <div style="width: ${percentage}%; background: #22c55e; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 14px; color: black;">${percentage}% complete</div>
        `;
    }

    // Show video export complete message
    showVideoExportComplete(totalFrames, format = 'MP4') {
        const progressElement = document.getElementById('video-export-progress');
        if (progressElement) {
            progressElement.innerHTML = `
                <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; color: black;">Video Export Complete</div>
                <div style="font-size: 14px; color: black; margin-bottom: 8px;">${totalFrames} frames recorded as ${format} video</div>
                <div style="font-size: 14px; color: black;">The video will download automatically</div>
            `;
            progressElement.style.background = 'white';
            progressElement.style.border = 'none';

            // Reset button state when export is complete
            this.setButtonActive('video-export-button', false);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideVideoExportProgress();
            }, 5000);
        }
    }

    // Hide video export progress
    hideVideoExportProgress() {
        const progressElement = document.getElementById('video-export-progress');
        if (progressElement) {
            progressElement.remove();
        }
        this.hideOverlay();
    }

    // Initialize FFmpeg for video conversion
    async initializeFFmpeg() {
        try {


            if (typeof FFmpeg === 'undefined' && typeof window.FFmpeg === 'undefined') {
                return;
            }
            const FFmpegClass = FFmpeg || window.FFmpeg;
            this.ffmpeg = new FFmpegClass.FFmpeg();

            // Add logging
            this.ffmpeg.on('log', ({
                message
            }) => {
                // Silent - no logging needed for server-side conversion
            });

            // Load FFmpeg core asynchronously in background
            this.loadFFmpegCore();

        } catch (error) {
            console.error('Failed to initialize FFmpeg:', error);
            this.ffmpeg = null;
            this.ffmpegLoaded = false;
        }
    }

    // Load FFmpeg core asynchronously
    async loadFFmpegCore() {
        try {
            if (!this.ffmpeg) {
                console.error('FFmpeg instance not available');
                return;
            }



            // Check for utility functions
            const FFmpegUtil = window.FFmpegUtil || (typeof FFmpeg !== 'undefined' ? FFmpeg : null);

            if (FFmpegUtil && FFmpegUtil.toBlobURL) {

                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

                const coreURL = await FFmpegUtil.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
                const wasmURL = await FFmpegUtil.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

                await this.ffmpeg.load({
                    coreURL,
                    wasmURL,
                });
            } else {

                const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

                await this.ffmpeg.load({
                    coreURL: `${baseURL}/ffmpeg-core.js`,
                    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
                });
            }

            this.ffmpegLoaded = true;


            // Update button to show MP4 is ready
            this.updateVideoButtonStatus(true);

        } catch (error) {
            console.error('❌ Failed to load FFmpeg core:', error);
            this.ffmpegLoaded = false;
            this.ffmpeg = null;
        }
    }

    // Convert PNG frames to MP4 using FFmpeg
    async convertPNGFramesToMP4() {


        if (!this.ffmpegLoaded || !this.ffmpeg) {
            // Try to reinitialize FFmpeg one more time
            await this.initializeFFmpeg();

            // Wait a moment and check again
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (!this.ffmpegLoaded || !this.ffmpeg) {
                alert(`FFmpeg not available. Cannot create MP4 video. 
                
This may be due to:
• Browser compatibility issues
• Network connectivity problems
• CORS restrictions

Please try:
1. Refreshing the page
2. Using a different browser (Chrome/Firefox recommended)
3. Checking your internet connection

For now, you can use PNG Sequence export instead.`);
                this.videoRecordedFrames = 0;
                return;
            }
        }

        if (this.capturedFrames.length === 0) {
            console.error('No frames captured');
            alert('No frames were captured. Please try again.');
            return;
        }

        try {
            this.showConversionProgress('Converting PNG frames to MP4...');


            // Convert data URLs to binary data and write to FFmpeg
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const dataURL = this.capturedFrames[i];
                const base64Data = dataURL.split(',')[1];
                const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                // Pad frame number to 6 digits (000001.png, 000002.png, etc.)
                const frameNumber = String(i + 1).padStart(6, '0');
                const filename = `frame_${frameNumber}.png`;

                await this.ffmpeg.writeFile(filename, binaryData);

                // Update progress during file writing
                if (i % 10 === 0) {
                    this.showConversionProgress(`Writing frames to FFmpeg... ${i + 1}/${this.capturedFrames.length}`);
                }
            }


            this.showConversionProgress('Converting to MP4...');

            // Convert PNG sequence to MP4
            await this.ffmpeg.exec([
                '-framerate', '30',
                '-i', 'frame_%06d.png',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-pix_fmt', 'yuv420p',
                '-movflags', '+faststart',
                'output.mp4'
            ]);



            // Read the output MP4 file
            const mp4Data = await this.ffmpeg.readFile('output.mp4');


            // Create download link
            const mp4Blob = new Blob([mp4Data.buffer], {
                type: 'video/mp4'
            });
            const url = URL.createObjectURL(mp4Blob);

            // Download the MP4 file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `kilo-video-${timestamp}.mp4`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Cleanup FFmpeg files
            URL.revokeObjectURL(url);
            for (let i = 0; i < this.capturedFrames.length; i++) {
                const frameNumber = String(i + 1).padStart(6, '0');
                const filename = `frame_${frameNumber}.png`;
                try {
                    await this.ffmpeg.deleteFile(filename);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            await this.ffmpeg.deleteFile('output.mp4');

            this.showVideoExportComplete(this.totalSaveFrames, 'MP4');


        } catch (error) {
            console.error('Failed to convert PNG frames to MP4:', error);
            alert('Failed to convert frames to MP4. Error: ' + error.message);
        }

        // Reset for next use
        this.capturedFrames = [];
        this.videoRecordedFrames = 0;
    }

    // Convert WebM to MP4 using FFmpeg (deprecated - keeping for fallback)
    async convertWebMToMP4() {
        if (!this.ffmpegLoaded || !this.ffmpeg) {

            this.videoCapturer.save();
            this.showVideoExportComplete(this.totalSaveFrames, 'WebM');
            this.initializeVideoCapture(this.totalSaveFrames);
            return;
        }

        try {
            this.showConversionProgress('Converting to MP4...');

            // Get the WebM blob from CCapture
            const webmBlob = await this.getWebMBlobFromCapturer();
            if (!webmBlob) {
                throw new Error('Failed to get WebM data from capturer');
            }

            // Convert blob to Uint8Array
            const webmData = new Uint8Array(await webmBlob.arrayBuffer());

            // Write input file to FFmpeg virtual filesystem
            await this.ffmpeg.writeFile('input.webm', webmData);

            // Convert WebM to MP4
            await this.ffmpeg.exec([
                '-i', 'input.webm',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-c:a', 'aac',
                'output.mp4'
            ]);

            // Read the output MP4 file
            const mp4Data = await this.ffmpeg.readFile('output.mp4');

            // Create download link
            const mp4Blob = new Blob([mp4Data.buffer], {
                type: 'video/mp4'
            });
            const url = URL.createObjectURL(mp4Blob);

            // Download the MP4 file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `kilo-video-${timestamp}.mp4`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            // Cleanup
            URL.revokeObjectURL(url);
            await this.ffmpeg.deleteFile('input.webm');
            await this.ffmpeg.deleteFile('output.mp4');

            this.showVideoExportComplete(this.totalSaveFrames, 'MP4');

        } catch (error) {
            console.error('Failed to convert to MP4:', error);

            this.videoCapturer.save();
            this.showVideoExportComplete(this.totalSaveFrames, 'WebM');
        }

        // Reinitialize for next use
        this.initializeVideoCapture(this.totalSaveFrames);
    }

    // Get WebM blob from CCapture
    async getWebMBlobFromCapturer() {
        return new Promise((resolve, reject) => {
            try {
                // CCapture stores the final blob in the capturer object
                // We need to access it directly after stop() is called
                if (this.videoCapturer.encoder && this.videoCapturer.encoder.save) {
                    // For webm-mediarecorder format
                    const originalSave = this.videoCapturer.encoder.save;
                    this.videoCapturer.encoder.save = function (blob) {
                        resolve(blob);
                        // Restore original method
                        this.save = originalSave;
                    };
                    this.videoCapturer.save();
                } else {
                    // Fallback: try to get the blob from the capturer's internal state
                    setTimeout(() => {
                        if (this.videoCapturer.encoder && this.videoCapturer.encoder.recordedBlobs) {
                            const blob = new Blob(this.videoCapturer.encoder.recordedBlobs, {
                                type: 'video/webm'
                            });
                            resolve(blob);
                        } else {
                            reject(new Error('Could not access WebM blob from capturer'));
                        }
                    }, 100);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // Show conversion progress
    showConversionProgress(message, progressPercent = null, subtitle = null) {
        let progressElement = document.getElementById('video-export-progress');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.id = 'video-export-progress';
            progressElement.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                color: black;
                padding: 20px;
                border-radius: 0;
                z-index: 1000;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                min-width: 300px;
                border: 1px solid black;
            `;
            document.body.appendChild(progressElement);
        }

        // Extract percentage from message if not provided separately
        let displayPercent = progressPercent;
        let displayMessage = message;

        if (!displayPercent && message) {
            const percentMatch = message.match(/(\d+)%/);
            if (percentMatch) {
                displayPercent = parseInt(percentMatch[1]);
            }
        }

        // Create progress bar HTML
        const progressBarHtml = displayPercent !== null ? `
            <div style="width: 100%; background: #f0f0f0; height: 8px; margin: 16px 0;">
                <div style="width: ${Math.min(100, Math.max(0, displayPercent))}%; background: #22c55e; height: 100%; transition: width 0.3s ease;"></div>
            </div>
            <div style="font-size: 14px; color: black; margin-top: 8px;">${displayPercent}% complete</div>
        ` : `
            <div style="width: 100%; background: #f0f0f0; height: 8px; margin: 16px 0;">
                <div style="width: 100%; background: #22c55e; height: 100%; animation: pulse 1.5s infinite;"></div>
            </div>
        `;

        progressElement.innerHTML = `
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 16px; color: black;">Video Export</div>
            <div style="font-size: 14px; color: black; margin-bottom: 8px;">${displayMessage}</div>
            ${progressBarHtml}
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            </style>
        `;
    }

    // Update colors for SVG export
    updateColors(colors) {

        this.currentColors.background = colors.background;
        this.currentColors.graphics = colors.graphics;
    }

    // Set grid reference
    setGrid(grid) {

        this.grid = grid;
    }

    cleanup() {
        if (this.svgSketch) {
            this.svgSketch.remove();
            this.svgSketch = null;
        }
        if (this.pngSketch) {
            this.pngSketch.remove();
            this.pngSketch = null;
        }
        this.isInitialized = false;
    }

    // Update video button status
    updateVideoButtonStatus(ready, message = '') {
        const videoButton = document.getElementById('video-export-button');
        if (videoButton) {
            if (ready) {
                videoButton.innerHTML = `Video`;
                videoButton.style.opacity = '1';
                videoButton.disabled = false;
            } else {
                videoButton.innerHTML = `Video`;
                videoButton.style.opacity = '0.7';
                videoButton.disabled = false; // Still allow clicking to start server
            }
        }
    }

    // Check Flask server status and update button
    async checkServerStatusAndUpdateButton() {
        try {
            // First check Vercel API health
            const expressHealth = await this.checkExpressServer();
            if (!expressHealth) {
                this.updateVideoButtonStatus(false, '(API Unavailable)');
                this.showServerStatus('Vercel API not responding', 'error');
                return;
            }

            // Then check Flask server
            const serverRunning = await this.checkFlaskServer();
            if (serverRunning) {
                this.updateVideoButtonStatus(true, '(MP4 Ready)');
                this.showServerStatus('Video conversion server ready', 'success');
                console.log('✅ Flask server is running - MP4 export available');
            } else {
                this.updateVideoButtonStatus(false, '(Click to Start Server)');
                this.showServerStatus('Video server offline - click video button to start', 'warning');
                console.log('⚠️ Flask server not running - will prompt to start');
            }
        } catch (error) {
            this.updateVideoButtonStatus(false, '(Server Check Failed)');
            this.showServerStatus('Server connection failed', 'error');
            console.warn('Could not check Flask server status:', error);
        }
    }

    // Check Vercel API health
    async checkExpressServer() {
        try {
            const response = await fetch('/api/flask-status');
            return response.ok;
        } catch (error) {
            console.warn('Vercel API health check failed:', error);
            return false;
        }
    }

    // Show server status feedback
    showServerStatus(message, type = 'info') {
        // Create or update status element
        let statusElement = document.getElementById('server-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'server-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-family: Arial, sans-serif;
                z-index: 1000;
                max-width: 250px;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(statusElement);
        }

        // Set styling based on type
        const styles = {
            success: {
                background: 'rgba(76, 175, 80, 0.9)',
                color: 'white'
            },
            warning: {
                background: 'rgba(255, 152, 0, 0.9)',
                color: 'white'
            },
            error: {
                background: 'rgba(244, 67, 54, 0.9)',
                color: 'white'
            },
            info: {
                background: 'rgba(33, 150, 243, 0.9)',
                color: 'white'
            }
        };

        const style = styles[type] || styles.info;
        statusElement.style.background = style.background;
        statusElement.style.color = style.color;
        statusElement.textContent = message;

        // Auto-hide after 2 seconds for all messages
        setTimeout(() => {
            if (statusElement && statusElement.textContent === message) {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    if (statusElement && statusElement.parentNode) {
                        statusElement.parentNode.removeChild(statusElement);
                    }
                }, 300);
            }
        }, 2000);
    }

    // Upload with progress tracking
    async uploadWithProgress(url, formData) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    this.showConversionProgress(`Uploading frames... ${percentComplete}%`);
                    console.log(`Upload progress: ${percentComplete}%`);
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Create a Response-like object for compatibility
                    const response = {
                        ok: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        blob: () => Promise.resolve(xhr.response),
                        json: () => Promise.resolve(JSON.parse(xhr.responseText))
                    };
                    resolve(response);
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed due to network error'));
            });

            // Handle timeout
            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timed out'));
            });

            // Configure request
            xhr.open('POST', url);
            xhr.responseType = 'blob';
            xhr.timeout = 300000; // 5 minute timeout

            // Start upload
            xhr.send(formData);
        });
    }
}