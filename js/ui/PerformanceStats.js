// Handles performance statistics display
class PerformanceStats {
    constructor() {
        this.elements = {};
        this.frameTimeHistory = [];
        this.maxFrameHistory = 60; // Keep last 60 frames for FPS calculation
        this.lastFrameTime = 0;
        this.init();
    }

    init() {
        // Get references to all stat elements
        this.elements = {
            totalRectangles: document.getElementById('total-rectangles'),
            visibleRectangles: document.getElementById('visible-rectangles'),
            nonzeroRectangles: document.getElementById('nonzero-rectangles'),
            fps: document.getElementById('fps')
        };

        // Check if all elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`PerformanceStats: Element '${key}' not found`);
            }
        }
    }

    // Update FPS calculation
    updateFPS() {
        const currentTime = millis();

        if (this.lastFrameTime > 0) {
            const frameTime = currentTime - this.lastFrameTime;
            this.frameTimeHistory.push(frameTime);

            // Keep only recent frame times
            if (this.frameTimeHistory.length > this.maxFrameHistory) {
                this.frameTimeHistory.shift();
            }

            // Calculate average FPS
            if (this.frameTimeHistory.length > 0) {
                const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b) / this.frameTimeHistory.length;
                const fps = Math.round(1000 / avgFrameTime);
                this.updateElement('fps', fps);
            }
        }

        this.lastFrameTime = currentTime;
    }

    // Update a single stat element
    updateElement(elementKey, value) {
        const element = this.elements[elementKey];
        if (element) {
            if (typeof value === 'number') {
                element.textContent = this.formatNumber(value);
            } else {
                element.textContent = value;
            }
        }
    }

    // Format large numbers nicely
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Update all stats from performance info
    updateFromPerformanceInfo(perfInfo) {
        this.updateElement('totalRectangles', perfInfo.totalRectangles);
        this.updateElement('visibleRectangles', perfInfo.visibleRectangles);
        this.updateElement('nonzeroRectangles', perfInfo.nonZeroRectangles);

        // Update FPS
        this.updateFPS();
    }

    // Get current stats as an object
    getCurrentStats() {
        const stats = {};
        for (let [key, element] of Object.entries(this.elements)) {
            stats[key] = element ? element.textContent : 'N/A';
        }
        return stats;
    }
}