// Manages all UI display updates and interactions
class DisplayManager {
    constructor() {
        this.performanceStats = new PerformanceStats();
        this.noiseControls = new NoiseControls();
        this.modeSelector = new ModeSelector();
        this.sharedImageUploader = new SharedImageUploader();
        this.imageProcessor = new ImageProcessor();
        this.brightnessControls = new BrightnessControls();
        this.brightnessProcessor = new BrightnessImageProcessor();
        this.globalControls = new GlobalControls();
        this.sharedControls = new SharedControls();
        this.colorPalette = new ColorPalette();
        this.svgExportManager = new SVGExportManager();
        this.isInitialized = false;
        this.grid = null; // Will be set from sketch.js
    }

    init() {
        if (this.isInitialized) return;

        // Initialize UI components
        this.performanceStats.init();
        this.noiseControls.init();
        this.modeSelector.init();
        this.sharedImageUploader.init();
        this.brightnessControls.init();
        this.globalControls.init();
        this.svgExportManager.init();

        // Set up brightness processor reference
        this.brightnessControls.setBrightnessProcessor(this.brightnessProcessor);

        // Set up global zoom control
        this.globalControls.onGlobalEvent('zoomChanged', (zoomValue) => {
            console.log('Global zoom changed:', zoomValue);
            if (this.grid) {
                this.grid.setZoom(zoomValue);
            }
        });

        // Initialize global zoom value if grid is available
        if (this.grid) {
            this.globalControls.setZoomValue(this.grid.getZoom());
        }

        // Set up color palette callback
        this.colorPalette.onPaletteChange((colors) => {
            console.log('Color palette changed:', colors);
            this.handleColorChange(colors);
        });

        // Set up mode change callback
        this.modeSelector.onModeChange((data) => {
            console.log(`Mode changed to: ${data.currentMode}`);
            this.handleModeChange(data);
        });

        // Set up shared image upload callback
        this.sharedImageUploader.onImageEvent('imageLoaded', (data) => {
            console.log('Shared image loaded:', data.file.name);

            // Resize canvas to match image aspect ratio
            const newDimensions = this.resizeCanvasToImage(data.image);

            // Process image immediately for both processors
            this.onCanvasResized(newDimensions);
            this.processImageForGrid(data.image, this.grid, newDimensions);
            this.processBrightnessImageForGrid(data.image, this.grid, newDimensions);

            console.log('Shared image processing completed for both modes');

            // Disable reveal animation so image-based graphics are immediately visible
            if (typeof revealAnimation !== 'undefined') {
                revealAnimation.isActive = false;
                revealAnimation.hasEverCompleted = true; // Mark as completed to prevent future animations
                console.log('Reveal animation disabled for image mode');

                // Immediately reveal all rectangles in the grid
                if (this.grid && this.grid.rectangles) {
                    this.grid.rectangles.forEach(rectangle => {
                        rectangle.firstReveal = true;
                    });
                    console.log('All rectangles revealed for image mode');
                }
            }
        });

        this.sharedImageUploader.onImageEvent('imageCleared', (data) => {
            console.log('Shared image cleared');

            // Clear both processors
            this.imageProcessor.clearProcessedData();
            this.brightnessProcessor.clearProcessedData();

            // Reset canvas to original size only if not uploading a new image
            if (!data || !data.skipCanvasReset) {
                this.resetCanvasToOriginalSize();
            }
        });

        // Set up brightness config change callback
        this.brightnessControls.onBrightnessEvent('configChanged', (config) => {
            console.log('Brightness config changed:', config);
            // The brightness processor is already updated by BrightnessControls
        });





        this.isInitialized = true;
    }

    // Handle mode changes
    handleModeChange(data) {
        const {
            currentMode,
            previousMode
        } = data;

        console.log(`Mode switched from ${previousMode} to ${currentMode}`);

        // Handle switching TO noise mode - reset canvas to original size
        if (currentMode === 'noise') {
            console.log('Switching to pattern mode - resetting canvas to original size');
            this.resetCanvasToOriginalSize();

            // Only re-enable reveal animation if it has never completed before
            if (typeof revealAnimation !== 'undefined' && !revealAnimation.hasEverCompleted) {
                revealAnimation.isActive = true;
                revealAnimation.hasStarted = false;
                revealAnimation.startTime = null;

                // Reset all rectangles to hidden for the reveal animation
                if (this.grid && this.grid.rectangles) {
                    this.grid.rectangles.forEach(rectangle => {
                        rectangle.firstReveal = false;
                    });
                    console.log('Reveal animation re-enabled for pattern mode - rectangles hidden for reveal');
                }
            } else if (typeof revealAnimation !== 'undefined' && revealAnimation.hasEverCompleted) {
                // If reveal animation has completed before, just show all rectangles immediately
                if (this.grid && this.grid.rectangles) {
                    this.grid.rectangles.forEach(rectangle => {
                        rectangle.firstReveal = true;
                    });
                    console.log('Reveal animation skipped - showing all rectangles immediately in noise mode');
                }
            }
        }

        // Handle switching TO image-based modes
        if (currentMode === 'icon' || currentMode === 'brightness') {
            if (this.sharedImageUploader.hasImage()) {
                console.log(`Switching to ${currentMode} mode - resizing canvas and ensuring processors have data`);
                const image = this.sharedImageUploader.getImage();
                if (image) {
                    // Always resize canvas to match image when switching to image-based modes
                    const newDimensions = this.resizeCanvasToImage(image);
                    this.onCanvasResized(newDimensions);

                    // Ensure icon processor has data if switching to icon mode
                    if (currentMode === 'icon' && !this.imageProcessor.hasProcessedData()) {
                        this.processImageForGrid(image, this.grid, newDimensions);
                    }

                    // Ensure brightness processor has data if switching to brightness mode
                    if (currentMode === 'brightness' && !this.brightnessProcessor.hasProcessedData()) {
                        this.processBrightnessImageForGrid(image, this.grid, newDimensions);
                    }

                    // Disable reveal animation and reveal all rectangles for image-based modes
                    if (typeof revealAnimation !== 'undefined') {
                        revealAnimation.isActive = false;
                        revealAnimation.hasEverCompleted = true; // Mark as completed to prevent future animations
                        if (this.grid && this.grid.rectangles) {
                            this.grid.rectangles.forEach(rectangle => {
                                rectangle.firstReveal = true;
                            });
                            console.log(`All rectangles revealed for ${currentMode} mode switch`);
                        }
                    }
                }
            } else {
                console.log(`Switching to ${currentMode} mode without image - resetting canvas to base dimensions`);
                // Reset canvas to base dimensions for icon/image modes without image
                this.resetCanvasToOriginalSize();
            }
        }

        // Clear processors when switching AWAY from modes to avoid conflicts
        if (previousMode === 'icon' && currentMode !== 'icon') {
            console.log('Leaving icon mode - clearing icon processor data');
            this.imageProcessor.clearProcessedData();
        }

        if (previousMode === 'brightness' && currentMode !== 'brightness') {
            console.log('Leaving brightness mode - clearing brightness processor data');
            this.brightnessProcessor.clearProcessedData();
        }
    }

    // Update all UI elements
    update(grid) {
        if (!this.isInitialized) this.init();

        // Update performance stats
        const perfInfo = this.getPerformanceInfo(grid);
        this.performanceStats.updateFromPerformanceInfo(perfInfo);
    }

    // Update with animation frame data
    updateWithFrame(grid, frameCount) {
        this.update(grid);

        // Could add more frame-based UI updates here
        // e.g., zoom level display, performance metrics, etc.
    }

    // Handle window resize
    onResize(newWidth, newHeight) {
        // Handle any UI adjustments needed for resize
        console.log(`Display resized to ${newWidth}x${newHeight}`);
    }

    // Set up noise control callbacks
    setupNoiseControlCallbacks(noiseConfig, grid) {
        if (!this.isInitialized) this.init();

        // Set up callbacks for noise-specific controls
        this.noiseControls.onControlChange('scale', (value) => {
            noiseConfig.scale = value;
        });

        this.noiseControls.onControlChange('useAnimation', (value) => {
            noiseConfig.useAnimation = value;
            noiseConfig.animateNoise = value; // Also update the internal property used by get4DCoords
        });

        this.noiseControls.onControlChange('loopDuration', (value) => {
            noiseConfig.loopDuration = value;
            console.log(`Animation length updated to: ${value} frames`);
        });

        this.noiseControls.onControlChange('animationSpeed', (value) => {
            // Map animation speed slider to animation range (intensity of movement)
            // Convert speed (0.25-3.0) to range (25-300)
            noiseConfig.animationRange = value * 100;
            console.log(`Animation intensity updated to: ${noiseConfig.animationRange} (from speed slider: ${value})`);
        });

        // Set up shared control callbacks that update both noise and brightness configs
        this.sharedControls.onControlChange('threshold', (value) => {
            noiseConfig.threshold = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    threshold: value
                });
            }
        });

        this.sharedControls.onControlChange('upperThreshold', (value) => {
            noiseConfig.upperThreshold = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    upperThreshold: value
                });
            }
        });

        this.sharedControls.onControlChange('heightSteps', (value) => {
            noiseConfig.heightSteps = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    heightSteps: value
                });
            }
        });

        this.sharedControls.onControlChange('widthMinScale', (value) => {
            noiseConfig.widthMinScale = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    widthMinScale: value
                });
            }
        });

        this.sharedControls.onControlChange('widthMaxScale', (value) => {
            noiseConfig.widthMaxScale = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    widthMaxScale: value
                });
            }
        });

        this.sharedControls.onControlChange('heightMinScale', (value) => {
            noiseConfig.heightMinScale = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    heightMinScale: value
                });
            }
        });

        this.sharedControls.onControlChange('heightMaxScale', (value) => {
            noiseConfig.heightMaxScale = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    heightMaxScale: value
                });
            }
        });

        this.sharedControls.onControlChange('useDiscreteSteps', (value) => {
            noiseConfig.useDiscreteSteps = value;
            // Also update brightness config if it exists
            if (this.brightnessProcessor.hasProcessedData()) {
                this.brightnessProcessor.updateBrightnessConfig({
                    useDiscreteSteps: value
                });
            }
        });

        // Set initial control values from current noiseConfig
        this.noiseControls.setControlValue('scale', noiseConfig.scale);
        this.noiseControls.setControlValue('useAnimation', noiseConfig.useAnimation);

        // Set shared control values
        this.sharedControls.setControlValue('threshold', noiseConfig.threshold);
        this.sharedControls.setControlValue('upperThreshold', noiseConfig.upperThreshold);
        this.sharedControls.setControlValue('heightSteps', noiseConfig.heightSteps);
        this.sharedControls.setControlValue('widthMinScale', noiseConfig.widthMinScale);
        this.sharedControls.setControlValue('widthMaxScale', noiseConfig.widthMaxScale);
        this.sharedControls.setControlValue('heightMinScale', noiseConfig.heightMinScale);
        this.sharedControls.setControlValue('heightMaxScale', noiseConfig.heightMaxScale);
        this.sharedControls.setControlValue('useDiscreteSteps', noiseConfig.useDiscreteSteps);

        // Set global zoom value
        this.globalControls.setZoomValue(grid.getZoom());
    }

    // Resize canvas to match image aspect ratio
    resizeCanvasToImage(image) {
        if (!image) return {
            width: width,
            height: height
        };

        const imageAspect = image.width / image.height;
        const maxDimension = AppConstants.BASE_DIMENSION; // Use base dimension from constants

        let newWidth, newHeight;

        if (imageAspect >= 1.0) {
            // Image is square or wider - fit to max dimension
            newWidth = maxDimension;
            newHeight = Math.round(maxDimension / imageAspect);
        } else {
            // Image is taller - fit to max dimension  
            newHeight = maxDimension;
            newWidth = Math.round(maxDimension * imageAspect);
        }

        // Resize the p5.js canvas
        resizeCanvas(newWidth, newHeight);

        // Now scale the canvas to fit the available area
        // Use setTimeout to ensure DOM has updated after resizeCanvas
        setTimeout(() => {
            this.updateCanvasScaleForAvailableSpace(newWidth, newHeight);
        }, 0);

        // Return the new dimensions
        return {
            width: newWidth,
            height: newHeight
        };
    }

    // Scale the canvas to fit the available area after it's been resized to image dimensions
    updateCanvasScaleForAvailableSpace(canvasWidth, canvasHeight) {
        const currentMode = AppConstants.currentMode;

        if (currentMode === 'noise') {
            // Noise mode uses its own scaling logic
            return;
        }

        // Apply the canvas area positioning first
        const canvasArea = document.getElementById('canvas-area');
        if (canvasArea) {
            // Ensure canvas area has correct CSS class for positioning
            canvasArea.className = '';
            if (currentMode === 'icon') {
                canvasArea.classList.add('canvas-area-icon');
            } else if (currentMode === 'brightness') {
                canvasArea.classList.add('canvas-area-image');
            }
        }

        // Get actual available space after positioning
        const actualAvailableWidth = canvasArea ? canvasArea.offsetWidth : window.innerWidth - 380;
        const actualAvailableHeight = canvasArea ? canvasArea.offsetHeight : window.innerHeight;

        // Calculate scale to fit canvas within actual available space
        const scaleByWidth = actualAvailableWidth / canvasWidth;
        const scaleByHeight = actualAvailableHeight / canvasHeight;
        const baseScale = Math.min(scaleByWidth, scaleByHeight);

        // Apply a slight reduction to create padding around the canvas
        const paddingFactor = 0.95; // Makes canvas 95% of available space (5% padding)
        const scale = baseScale * paddingFactor;

        // Apply the scaling to the canvas container
        const container = document.getElementById('sketch-container');

        if (container) {
            container.style.transform = `scale(${scale})`;
            container.style.transformOrigin = 'center center';
        }
    }

    // Reset canvas to original size when image is cleared
    resetCanvasToOriginalSize() {
        const originalWidth = AppConstants.CANVAS_WIDTH;
        const originalHeight = AppConstants.CANVAS_HEIGHT;

        console.log('=== CANVAS RESET START ===');
        console.log(`Resetting canvas from ${width}x${height} to ${originalWidth}x${originalHeight}`);

        resizeCanvas(originalWidth, originalHeight);
        console.log(`Canvas reset completed. New p5.js globals: ${width}x${height}`);

        // Recreate grid with original dimensions
        if (this.grid) {
            console.log('Recreating grid for original canvas size');
            this.grid.updateDimensions(originalWidth, originalHeight);
            console.log('Grid reset completed. Rectangle count:', this.grid.getCount());
        }

        // Update SVG export canvas size to match reset canvas dimensions
        if (this.svgExportManager) {
            console.log('Updating SVG export canvas size after canvas reset');
            this.svgExportManager.updateSVGCanvasSize();
        }

        console.log('=== CANVAS RESET END ===');
    }

    // Process uploaded image for grid masking
    processImageForGrid(image, grid = null, dimensions = null) {
        if (!image) return;

        // Clear any existing processed data first
        this.imageProcessor.clearProcessedData();
        console.log('Cleared existing image processor data');

        // Use provided dimensions or current canvas dimensions for processing
        const canvasWidth = dimensions ? dimensions.width : width; // p5.js global width
        const canvasHeight = dimensions ? dimensions.height : height; // p5.js global height
        console.log('Processing with canvas dimensions:', {
            canvasWidth,
            canvasHeight
        });

        // Calculate grid dimensions if grid is provided
        let gridCols = 0,
            gridRows = 0;
        if (grid) {
            // Calculate how many grid cells fit in the canvas
            const cellCount = GridCalculator.calculateCellCount(
                canvasWidth,
                canvasHeight,
                grid.rectWidth,
                grid.rectHeight
            );
            gridCols = cellCount.cols;
            gridRows = cellCount.rows;
            console.log('Grid dimensions calculated:', {
                gridCols,
                gridRows,
                rectWidth: grid.rectWidth,
                rectHeight: grid.rectHeight
            });
        } else {
            console.log('No grid provided, using 0x0 dimensions');
        }

        const result = this.imageProcessor.processImageForGrid(image, gridCols, gridRows, canvasWidth, canvasHeight);
        console.log('Image processing result:', result ? 'SUCCESS' : 'FAILED');
        console.log('ImageProcessor now has data:', this.imageProcessor.hasProcessedData());
    }

    // Process brightness image for grid
    processBrightnessImageForGrid(image, grid, newDimensions) {
        if (!image || !grid) {
            console.warn('Cannot process brightness image: missing image or grid');
            return;
        }

        // Calculate grid dimensions the same way as regular image processing
        const canvasWidth = newDimensions.width;
        const canvasHeight = newDimensions.height;

        let gridCols = 0;
        let gridRows = 0;

        if (grid) {
            const cellCount = GridCalculator.calculateCellCount(
                canvasWidth,
                canvasHeight,
                grid.rectWidth,
                grid.rectHeight
            );
            gridCols = cellCount.cols;
            gridRows = cellCount.rows;
        }

        console.log('Processing brightness image for grid with dimensions:', newDimensions);
        console.log('Brightness grid dimensions:', {
            gridCols,
            gridRows
        });
        this.brightnessProcessor.processImageForGrid(image, gridCols, gridRows, newDimensions.width, newDimensions.height);
    }

    // Get the image processor (for use in sketch.js)
    getImageProcessor() {
        return this.imageProcessor;
    }

    // Get brightness processor reference
    getBrightnessProcessor() {
        return this.brightnessProcessor;
    }

    // Get current mode
    getCurrentMode() {
        return this.modeSelector.getCurrentMode();
    }

    // Get the uploaded image
    getUploadedImage() {
        return this.sharedImageUploader.getImage();
    }

    // Reprocess image with grid information (called from sketch.js)
    reprocessImageWithGrid(grid) {
        if (!this.sharedImageUploader.getImage()) {
            console.log('No shared image to reprocess');
            return;
        }

        console.log('Reprocessing shared image with grid information');
        const image = this.sharedImageUploader.getImage();
        this.processImageForGrid(image, grid);
        this.processBrightnessImageForGrid(image, grid);
    }

    // Check if in icon mode and has image
    isIconModeWithImage() {
        return this.modeSelector.isIconMode() &&
            this.imageProcessor.hasProcessedData() &&
            this.sharedImageUploader.hasImage();
    }

    // Check if in brightness mode with image loaded
    isBrightnessModeWithImage() {
        return this.modeSelector.isBrightnessMode() &&
            this.sharedImageUploader.hasImage() &&
            this.brightnessProcessor.hasProcessedData();
    }

    // Set grid reference (called from sketch.js)
    setGrid(grid) {
        this.grid = grid;
        this.svgExportManager.setGrid(grid);
    }

    // Handle canvas resize - recreate grid with new dimensions
    onCanvasResized(newDimensions) {
        if (this.grid) {
            console.log('=== GRID RECREATION START ===');
            console.log('Recreating grid for new canvas dimensions:', newDimensions);
            console.log('Current grid zoom:', this.grid.getZoom());

            // Force grid to recreate with new canvas dimensions
            this.grid.updateDimensions(newDimensions.width, newDimensions.height);

            console.log('Grid recreation completed. New rectangle count:', this.grid.getCount());
            console.log('=== GRID RECREATION END ===');
        } else {
            console.log('WARNING: No grid available for recreation!');
        }

        // Update SVG export canvas size to match new main canvas dimensions
        if (this.svgExportManager) {
            console.log('Updating SVG export canvas size after main canvas resize');
            this.svgExportManager.updateSVGCanvasSize();
        }
    }

    // Handle color palette changes
    handleColorChange(colors) {
        console.log('Applying color palette:', colors);

        // Update canvas background color
        if (typeof backgroundColor !== 'undefined') {
            // This will be applied in the p5.js draw loop
            window.currentBackgroundColor = colors.background;
        }

        // Update canvas area background color to match canvas background
        const canvasArea = document.getElementById('canvas-area');
        if (canvasArea) {
            canvasArea.style.backgroundColor = colors.background;
        }

        // Update graphics color for rectangles
        if (this.grid) {
            this.grid.setGraphicsColor(colors.graphics);
        }

        // Update SVG export manager colors
        this.svgExportManager.updateColors({
            background: this.hexToRgb(colors.background),
            graphics: this.hexToRgb(colors.graphics)
        });

        // Trigger callback for external color updates (like p5.js background)
        if (this.callbacks && this.callbacks['colorChanged']) {
            this.callbacks['colorChanged'](colors);
        }
    }

    // Register callback for color changes
    onColorChange(callback) {
        if (!this.callbacks) this.callbacks = {};
        this.callbacks['colorChanged'] = callback;
    }

    // Get performance info
    getPerformanceInfo(grid) {
        return {
            totalRectangles: grid.getCount(),
            visibleRectangles: grid.getVisibleCount(),
            nonZeroRectangles: grid.getNonZeroCount(),
            currentZoom: grid.getZoom()
        };
    }

    // Utility function to convert hex color to RGB array
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255]; // Default to white if parsing fails
    }

    // Get SVG export manager reference
    getSVGExportManager() {
        return this.svgExportManager;
    }
}