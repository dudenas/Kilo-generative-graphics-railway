// Application-wide constants
class AppConstants {
    // Canvas settings - fullscreen with base resolution scaling
    static BASE_DIMENSION = 1000; // The longer dimension is always 800
    static CANVAS_CONTAINER_ID = 'sketch-container';
    static currentMode = 'noise'; // Track current mode for canvas calculations

    // Calculate canvas base dimensions and scaling based on current mode
    static getCanvasConfig(mode = 'noise') {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate available space based on mode
        let availableWidth, availableHeight;

        if (mode === 'noise') {
            // Noise mode: fullscreen behind panels
            availableWidth = viewportWidth;
            availableHeight = viewportHeight;
        } else {
            // Icon/Image mode: space between left panel and right viewport edge
            const leftPanelWidth = 380;
            availableWidth = viewportWidth - leftPanelWidth;
            availableHeight = viewportHeight;
        }

        // Calculate isLandscape for all modes
        const isLandscape = availableWidth >= availableHeight;

        // For icon/image modes, canvas dimensions should come from the image
        // This is just a fallback - actual dimensions will be set by image processing
        if (mode === 'noise') {

            if (isLandscape) {
                // Landscape: base width=800, height calculated from aspect ratio
                width = this.BASE_DIMENSION;
                height = Math.round(this.BASE_DIMENSION * (availableHeight / availableWidth));
            } else {
                // Portrait: base height=800, width calculated from aspect ratio
                height = this.BASE_DIMENSION;
                width = Math.round(this.BASE_DIMENSION * (availableWidth / availableHeight));
            }

            // Scale to fit within available space
            const scaleByWidth = availableWidth / width;
            const scaleByHeight = availableHeight / height;
            scale = Math.min(scaleByWidth, scaleByHeight);
        } else {
            // For icon/image modes, use placeholder dimensions
            // Real dimensions come from loaded image
            width = this.BASE_DIMENSION;
            height = this.BASE_DIMENSION;
            scale = 1;
        }

        return {
            width,
            height,
            scale,
            isLandscape,
            availableWidth,
            availableHeight,
            viewportWidth,
            viewportHeight,
            mode
        };
    }

    // Get base canvas dimensions (for p5.js createCanvas)
    static getCanvasDimensions(mode = null) {
        const config = this.getCanvasConfig(mode || this.currentMode);
        return {
            width: config.width,
            height: config.height
        };
    }

    // Get scaling factor for CSS transform
    static getCanvasScale(mode = null) {
        return this.getCanvasConfig(mode || this.currentMode).scale;
    }

    // Set current mode and trigger canvas update if needed
    static setCurrentMode(mode) {
        const oldMode = this.currentMode;
        this.currentMode = mode;

        // Return true if mode changed (indicating canvas update needed)
        return oldMode !== mode;
    }

    // Legacy getters for compatibility
    static get CANVAS_WIDTH() {
        return this.getCanvasDimensions().width;
    }

    static get CANVAS_HEIGHT() {
        return this.getCanvasDimensions().height;
    }

    // UI settings
    static CELL_COUNT_ELEMENT_ID = 'cell-count';
    static CELL_COUNT_SUFFIX = ' cells';

    // Performance settings
    static MAX_RECTANGLES = 50000; // Safety limit
    static FRAME_RATE = 60;
}