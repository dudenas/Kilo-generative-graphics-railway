// Handles global controls that affect all modes (like zoom)
class GlobalControls {
    constructor() {
        this.callbacks = {};
        this.elements = {};
    }

    init() {
        // Get references to global control elements
        this.elements = {
            zoomSlider: document.getElementById('global-zoom-slider'),
            zoomValue: document.getElementById('global-zoom-value')
        };

        // Check if elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`GlobalControls: Element '${key}' not found`);
            }
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Zoom control
        if (this.elements.zoomSlider && this.elements.zoomValue) {
            // Initialize display
            this.elements.zoomValue.textContent = parseFloat(this.elements.zoomSlider.value).toFixed(2);

            // Set up event listener
            this.elements.zoomSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.zoomValue.textContent = value.toFixed(2);
                this.triggerCallback('zoomChanged', value);
            });
        }
    }

    // Set zoom value (called when grid zoom changes from other sources)
    setZoomValue(zoomValue) {
        if (this.elements.zoomSlider && this.elements.zoomValue) {
            this.elements.zoomSlider.value = zoomValue;
            this.elements.zoomValue.textContent = zoomValue.toFixed(2);
        }
    }

    // Get current zoom value
    getZoomValue() {
        if (this.elements.zoomSlider) {
            return parseFloat(this.elements.zoomSlider.value);
        }
        return 0.2; // default value
    }

    // Register callback for events
    onGlobalEvent(eventName, callback) {
        this.callbacks[eventName] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(eventName, data = null) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](data);
        }
    }
}