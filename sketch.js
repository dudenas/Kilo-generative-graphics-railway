let grid;
let displayManager;
let noiseCalculator;
let noiseConfig;
let openSimplexNoise;
let logoLoader;
let aboutModal;

// Animation state for initial circular reveal
let revealAnimation = {
    isActive: true, // Re-enabled with new approach
    startTime: null,
    duration: 1500, // 4 seconds
    maxRadius: 0,
    hasStarted: false,
    hasEverCompleted: false // Track if reveal animation has ever completed
};

// Current color swatch (replaces colors.js)
let currentSwatch = {
    background: [63, 244, 120], // Default: green background (#3FF478)
    graphics: [230, 243, 219] // Default: light sage graphics (#E6F3DB)
};

// Utility function to convert hex color to RGB array
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [255, 255, 255]; // Default to white if parsing fails
}

function setup() {
    // Create canvas with dynamic base dimensions for fullscreen display
    const dimensions = AppConstants.getCanvasDimensions();
    let canvas = createCanvas(dimensions.width, dimensions.height);
    canvas.parent(AppConstants.CANVAS_CONTAINER_ID);

    // Set initial mode and apply CSS scaling
    AppConstants.setCurrentMode('noise'); // Default to noise mode
    updateCanvasScale();

    // Calculate max radius for reveal animation (diagonal from center to corner)
    revealAnimation.maxRadius = Math.sqrt((width / 2) * (width / 2) + (height / 2) * (height / 2));

    // Add window resize listener for responsive fullscreen scaling
    window.addEventListener('resize', handleWindowResize);

    // Add keyboard event listener for performance stats toggle
    window.addEventListener('keydown', handleKeyPress);

    // Initialize OpenSimplex noise
    openSimplexNoise = new OpenSimplexNoise(Date.now());

    // Initialize logo loader and start animation
    logoLoader = new LogoLoader();
    logoLoader.start();

    // Initialize about modal
    aboutModal = new AboutModal();

    // Initialize display manager
    displayManager = new DisplayManager();

    // Initialize noise system
    noiseCalculator = new NoiseCalculator();
    noiseConfig = new NoiseConfig();

    // Make noiseConfig globally accessible for export functions
    window.noiseConfig = noiseConfig;

    // Adjust noise parameters for testing
    noiseConfig.scale = 0.01; // Larger patterns

    noiseConfig.threshold = 0.5; // 50% empty space (0-0.5 becomes black)
    noiseConfig.upperThreshold = 0.7; // Values above 0.7 become full height
    noiseConfig.useDiscreteSteps = true; // true = discrete steps, false = continuous
    noiseConfig.heightSteps = 2; // Number of discrete height steps (only used when useDiscreteSteps = true)
    noiseConfig.widthMinScale = 0.5; // Width minimum: 50% of original
    noiseConfig.widthMaxScale = 1.0; // Width maximum: 100% of original
    noiseConfig.heightMinScale = 0.1; // Height minimum: 0% (hidden)
    noiseConfig.heightMaxScale = 1.0; // Height maximum: 100% of original
    noiseConfig.useAnimation = false; // Disable animation by default
    noiseConfig.animateNoise = false; // Also set the internal property

    // Create grid with default settings
    const defaults = GridConfig.getDefaults();
    grid = new Grid(defaults.baseWidth, defaults.baseHeight, 0.2);

    // Set grid reference in display manager
    displayManager.setGrid(grid);

    // Set up noise control callbacks
    displayManager.setupNoiseControlCallbacks(noiseConfig, grid);

    // Reprocess any loaded image with grid information
    displayManager.reprocessImageWithGrid(grid);

    // Set up color change callback
    displayManager.onColorChange((colors) => {

        // Convert hex colors to RGB arrays for currentSwatch
        currentSwatch.background = hexToRgb(colors.background);
        currentSwatch.graphics = hexToRgb(colors.graphics);
    });

    // Set initial colors for SVG export
    displayManager.getSVGExportManager().updateColors({
        background: currentSwatch.background,
        graphics: currentSwatch.graphics
    });

    noStroke();
}

function draw() {
    // Handle both RGB array and hex string for background
    if (Array.isArray(currentSwatch.background)) {
        background(currentSwatch.background[0], currentSwatch.background[1], currentSwatch.background[2]);
    } else {
        background(currentSwatch.background);
    }

    // Don't set fill here - let the noise system handle colors

    // Calculate animated zoom
    const animatedZoom = map(Math.sin(frameCount * 0.01) * 0.3, -0.3, 0.3, 0.05, 1.0); // Oscillates between 0.2 and 0.8
    // grid.setZoom(animatedZoom);

    // Draw the grid with noise colors - use animation toggle
    // During PNG sequence or video capture, use the capture frame count instead of actual frameCount
    let frameValue = 0;
    if (noiseConfig.useAnimation) {
        const svgExportManager = displayManager.getSVGExportManager();
        if (svgExportManager && (svgExportManager.isCapturing || svgExportManager.isCapturingVideo)) {
            // For PNG sequence export, use recorded frames but let NoiseConfig apply speed multiplier
            // For video export, use video recorded frames
            if (svgExportManager.isCapturingVideo) {
                frameValue = svgExportManager.videoRecordedFrames;
            } else {
                frameValue = svgExportManager.recordedFrames;
            }
        } else {
            frameValue = frameCount;
        }
    }

    // Get current mode and processors
    const currentMode = displayManager.getCurrentMode();
    const imageProcessor = displayManager.isIconModeWithImage() ? displayManager.getImageProcessor() : null;
    const brightnessProcessor = displayManager.isBrightnessModeWithImage() ? displayManager.getBrightnessProcessor() : null;

    // Check if we're in icon/image mode without an image
    if ((currentMode === 'icon' || currentMode === 'brightness') && !displayManager.sharedImageUploader.hasImage()) {
        // Show "Select an image" message instead of grid
        showSelectImageMessage();
    } else {
        // Normal drawing
        grid.draw(noiseCalculator, noiseConfig, frameValue, imageProcessor, brightnessProcessor, currentMode);
    }

    // Apply circular reveal animation on initial load
    if (revealAnimation.isActive) {
        // Start animation after first few frames to ensure everything is rendered
        if (!revealAnimation.hasStarted && frameCount > 3) {
            revealAnimation.startTime = millis();
            revealAnimation.hasStarted = true;
        }

        if (revealAnimation.hasStarted) {
            updateCircularReveal();
        }
    }

    // Capture frame if PNG sequence export is active
    if (displayManager && displayManager.getSVGExportManager()) {
        const exportManager = displayManager.getSVGExportManager();
        exportManager.captureFrame();
    }

    // Update UI
    displayManager.updateWithFrame(grid, frameCount);
}

// Show "Select an image" message when in icon/image mode without an image
function showSelectImageMessage() {
    // Clear the canvas with background color
    if (Array.isArray(currentSwatch.background)) {
        background(currentSwatch.background[0], currentSwatch.background[1], currentSwatch.background[2]);
    } else {
        background(currentSwatch.background);
    }

    // Use graphics color from current palette
    if (Array.isArray(currentSwatch.graphics)) {
        fill(currentSwatch.graphics[0], currentSwatch.graphics[1], currentSwatch.graphics[2]);
    } else {
        fill(currentSwatch.graphics);
    }

    // Set text properties
    textAlign(CENTER, CENTER);

    // Scale text size based on canvas size (responsive to scaling)
    const scaledTextSize = Math.min(width, height) * 0.08; // 8% of smaller dimension
    textSize(scaledTextSize);
    textFont('Saans, Arial, sans-serif');

    // Draw the message in the center of the canvas
    // Use precise centering to account for any scaling transforms
    const centerX = width / 2;
    const centerY = height / 2;
    text('Select an image', centerX, centerY);
}

// Function to update slider fill color
function updateSliderFill(slider) {
    const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #000 0%, #000 ${value}%, #ddd ${value}%, #ddd 100%)`;
}

// Update canvas scaling and positioning based on current mode
function updateCanvasScale() {
    const container = document.getElementById(AppConstants.CANVAS_CONTAINER_ID);
    const canvasArea = document.getElementById('canvas-area');
    if (!container || !canvasArea) return;

    const config = AppConstants.getCanvasConfig();
    const scale = config.scale;
    const mode = config.mode;

    // Only apply scaling for noise mode - icon/image modes handle their own scaling
    if (mode === 'noise') {
        // Noise mode: fullscreen, no padding
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'center center';
    } else {
        // Icon/image modes: scaling is handled by DisplayManager after image is loaded
        // Just ensure no constraints
        container.style.maxWidth = 'none';
        container.style.maxHeight = 'none';
    }

    // Update canvas area positioning based on mode using CSS classes
    canvasArea.className = ''; // Clear existing classes

    if (mode === 'noise') {
        canvasArea.classList.add('canvas-area-noise');
    } else if (mode === 'icon') {
        canvasArea.classList.add('canvas-area-icon');
    } else if (mode === 'image' || mode === 'brightness') {
        canvasArea.classList.add('canvas-area-image');
    }
}

// Handle window resize for responsive scaling
function handleWindowResize() {
    const currentMode = AppConstants.currentMode;

    console.log(`Window resized in ${currentMode} mode`);
    console.log(`Current canvas: ${width}×${height}`);

    if (currentMode === 'noise') {
        // Noise mode: use the original scaling logic with dimension recalculation
        const currentDimensions = AppConstants.getCanvasDimensions();
        const currentCanvasWidth = width;
        const currentCanvasHeight = height;

        // Check if canvas dimensions need to change
        if (currentCanvasWidth !== currentDimensions.width || currentCanvasHeight !== currentDimensions.height) {
            resizeCanvas(currentDimensions.width, currentDimensions.height);
        }

        updateCanvasScale();

        // Debug: Log the applied scale for noise mode
        const config = AppConstants.getCanvasConfig();
        console.log(`Noise mode resize - Scale applied: ${config.scale.toFixed(3)}`);
        console.log(`Canvas dimensions: ${width}×${height}`);
    } else if ((currentMode === 'icon' || currentMode === 'brightness') && typeof displayManager !== 'undefined') {
        // Icon/Image modes: don't change canvas dimensions, just rescale to fit new viewport
        displayManager.updateCanvasScaleForAvailableSpace(width, height);
    }

    // Trigger redraw
    if (typeof draw === 'function') {
        draw();
    }
}

// Update canvas when mode changes
function updateCanvasForMode(newMode) {
    const modeChanged = AppConstants.setCurrentMode(newMode);

    // Always update scaling when switching modes, even if mode didn't technically change
    // Recalculate dimensions for new mode
    const newDimensions = AppConstants.getCanvasDimensions();
    const currentCanvasWidth = width;
    const currentCanvasHeight = height;

    // Resize canvas if dimensions changed
    if (currentCanvasWidth !== newDimensions.width || currentCanvasHeight !== newDimensions.height) {
        resizeCanvas(newDimensions.width, newDimensions.height);
    }

    // Always update scaling and positioning when mode changes
    const currentMode = AppConstants.currentMode;

    // First, update canvas area positioning (like in updateCanvasScale)
    const canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
        canvasArea.className = ''; // Clear existing classes

        if (currentMode === 'noise') {
            canvasArea.classList.add('canvas-area-noise');
        } else if (currentMode === 'icon') {
            canvasArea.classList.add('canvas-area-icon');
        } else if (currentMode === 'brightness') {
            canvasArea.classList.add('canvas-area-image');
        }
    }

    // Then apply scaling
    if (currentMode === 'noise') {
        // Noise mode: use the standard scaling
        updateCanvasScale();
    } else if ((currentMode === 'icon' || currentMode === 'brightness') && typeof displayManager !== 'undefined') {
        // Icon/Image modes: ALWAYS use DisplayManager scaling for proper canvas area sizing
        displayManager.updateCanvasScaleForAvailableSpace(width, height);
    }

    // Trigger redraw
    if (typeof draw === 'function') {
        draw();
    }
}

// Initialize slider styling on page load
document.addEventListener('DOMContentLoaded', function () {
    const sliders = document.querySelectorAll('input[type="range"]');

    sliders.forEach(slider => {
        // Set initial fill
        updateSliderFill(slider);

        // Update fill on input
        slider.addEventListener('input', function () {
            updateSliderFill(this);
        });
    });
});

// Update circular reveal animation by enabling rectangles within the current radius
function updateCircularReveal() {
    const currentTime = millis();
    const elapsed = currentTime - revealAnimation.startTime;

    // Check if animation should end
    if (elapsed >= revealAnimation.duration) {
        revealAnimation.isActive = false;
        revealAnimation.hasEverCompleted = true; // Mark as completed
        // Ensure all rectangles are revealed when animation completes
        grid.rectangles.forEach(rectangle => {
            rectangle.firstReveal = true;
        });
        return;
    }

    // Calculate animation progress (0 to 1)
    const progress = elapsed / revealAnimation.duration;

    // Use ease-in animation curve (starts slow, speeds up at the end)
    const easeProgress = Math.pow(progress, 1);

    // Calculate current reveal radius
    const currentRadius = easeProgress * revealAnimation.maxRadius;

    // Update rectangle visibility based on distance from center with organic randomness
    grid.rectangles.forEach(rectangle => {
        if (!rectangle.firstReveal && rectangle.distanceFromCenter <= currentRadius) {
            // Add 50% random chance for organic expansion
            if (Math.random() > 0.9) {
                rectangle.firstReveal = true;
            }
        }
    });
}

// Handle keyboard shortcuts
function handleKeyPress(event) {
    // Toggle performance stats with 'i' key
    if (event.key === 'i' || event.key === 'I') {
        const statsPanel = document.getElementById('performance-stats');
        if (statsPanel) {
            if (statsPanel.style.display === 'none' || statsPanel.style.display === '') {
                statsPanel.style.display = 'block';
            } else {
                statsPanel.style.display = 'none';
            }
        }
    }
}