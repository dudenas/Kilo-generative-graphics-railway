// Grid configuration and constants
class GridConfig {
    static MIN_ZOOM = 0.01;
    static MAX_ZOOM = 5.0;
    static EXTRA_CELLS = 10;

    // Default grid settings
    static DEFAULT_BASE_WIDTH = 100;
    static DEFAULT_BASE_HEIGHT = 128;
    static DEFAULT_ZOOM = 1.0;

    // Clamp zoom to valid bounds
    static clampZoom(zoom) {
        return Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, zoom));
    }

    // Get bounds configuration for grid calculations
    static getBounds() {
        return {
            minZoom: this.MIN_ZOOM,
            maxZoom: this.MAX_ZOOM,
            extraCells: this.EXTRA_CELLS
        };
    }

    // Get default grid settings
    static getDefaults() {
        return {
            baseWidth: this.DEFAULT_BASE_WIDTH,
            baseHeight: this.DEFAULT_BASE_HEIGHT,
            zoom: this.DEFAULT_ZOOM
        };
    }
}