// Handles shared controls used across multiple modes (Noise, Icon, Image)
class SharedControls {
    constructor() {
        this.elements = {};
        this.callbacks = {};
        this.init();
    }

    init() {
        // Get references to shared control elements
        this.elements = {
            // Threshold controls
            thresholdSlider: document.getElementById('shared-threshold-slider'),
            thresholdValue: document.getElementById('shared-threshold-value'),
            upperThresholdSlider: document.getElementById('shared-upper-threshold-slider'),
            upperThresholdValue: document.getElementById('shared-upper-threshold-value'),

            // Scaling controls
            heightStepsSlider: document.getElementById('shared-height-steps-slider'),
            heightStepsValue: document.getElementById('shared-height-steps-value'),

            // Deprecated controls (will be removed)
            widthMinSlider: document.getElementById('shared-width-min-slider'),
            widthMinValue: document.getElementById('shared-width-min-value'),
            widthMaxSlider: document.getElementById('shared-width-max-slider'),
            widthMaxValue: document.getElementById('shared-width-max-value'),
            heightMinSlider: document.getElementById('shared-height-min-slider'),
            heightMinValue: document.getElementById('shared-height-min-value'),
            heightMaxSlider: document.getElementById('shared-height-max-slider'),
            heightMaxValue: document.getElementById('shared-height-max-value'),

            // Toggle controls
            discreteToggle: document.getElementById('shared-discrete-toggle')
        };

        // Check if all elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`SharedControls: Element '${key}' not found`);
            }
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Threshold slider
        if (this.elements.thresholdSlider && this.elements.thresholdValue) {
            this.elements.thresholdSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.thresholdValue.textContent = value.toFixed(2);
                this.triggerCallback('threshold', value);
            });
        }

        // Upper threshold slider
        if (this.elements.upperThresholdSlider && this.elements.upperThresholdValue) {
            this.elements.upperThresholdSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.upperThresholdValue.textContent = value.toFixed(2);
                this.triggerCallback('upperThreshold', value);
            });
        }

        // Height steps slider
        if (this.elements.heightStepsSlider && this.elements.heightStepsValue) {
            this.elements.heightStepsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.elements.heightStepsValue.textContent = value;
                this.triggerCallback('heightSteps', value);
            });
        }

        // Width min slider
        if (this.elements.widthMinSlider && this.elements.widthMinValue) {
            this.elements.widthMinSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.widthMinValue.textContent = value.toFixed(1);
                this.triggerCallback('widthMinScale', value);
            });
        }

        // Width max slider
        if (this.elements.widthMaxSlider && this.elements.widthMaxValue) {
            this.elements.widthMaxSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.widthMaxValue.textContent = value.toFixed(1);
                this.triggerCallback('widthMaxScale', value);
            });
        }

        // Height min slider
        if (this.elements.heightMinSlider && this.elements.heightMinValue) {
            this.elements.heightMinSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.heightMinValue.textContent = value.toFixed(1);
                this.triggerCallback('heightMinScale', value);
            });
        }

        // Height max slider
        if (this.elements.heightMaxSlider && this.elements.heightMaxValue) {
            this.elements.heightMaxSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.elements.heightMaxValue.textContent = value.toFixed(1);
                this.triggerCallback('heightMaxScale', value);
            });
        }

        // Discrete toggle
        if (this.elements.discreteToggle) {
            this.elements.discreteToggle.addEventListener('change', (e) => {
                const value = e.target.checked;
                this.triggerCallback('useDiscreteSteps', value);
            });
        }
    }

    // Register callback for control changes
    onControlChange(controlName, callback) {
        this.callbacks[controlName] = callback;
    }

    // Trigger callback for a specific control
    triggerCallback(controlName, value) {
        if (this.callbacks[controlName]) {
            this.callbacks[controlName](value);
        }
    }

    // Set control values programmatically
    setControlValue(controlName, value) {
        switch (controlName) {
            case 'threshold':
                if (this.elements.thresholdSlider && this.elements.thresholdValue) {
                    this.elements.thresholdSlider.value = value;
                    this.elements.thresholdValue.textContent = value.toFixed(2);
                }
                break;
            case 'upperThreshold':
                if (this.elements.upperThresholdSlider && this.elements.upperThresholdValue) {
                    this.elements.upperThresholdSlider.value = value;
                    this.elements.upperThresholdValue.textContent = value.toFixed(2);
                }
                break;
            case 'heightSteps':
                if (this.elements.heightStepsSlider && this.elements.heightStepsValue) {
                    this.elements.heightStepsSlider.value = value;
                    this.elements.heightStepsValue.textContent = value;
                }
                break;
            case 'widthMinScale':
                if (this.elements.widthMinSlider && this.elements.widthMinValue) {
                    this.elements.widthMinSlider.value = value;
                    this.elements.widthMinValue.textContent = value.toFixed(1);
                }
                break;
            case 'widthMaxScale':
                if (this.elements.widthMaxSlider && this.elements.widthMaxValue) {
                    this.elements.widthMaxSlider.value = value;
                    this.elements.widthMaxValue.textContent = value.toFixed(1);
                }
                break;
            case 'heightMinScale':
                if (this.elements.heightMinSlider && this.elements.heightMinValue) {
                    this.elements.heightMinSlider.value = value;
                    this.elements.heightMinValue.textContent = value.toFixed(1);
                }
                break;
            case 'heightMaxScale':
                if (this.elements.heightMaxSlider && this.elements.heightMaxValue) {
                    this.elements.heightMaxSlider.value = value;
                    this.elements.heightMaxValue.textContent = value.toFixed(1);
                }
                break;
            case 'useDiscreteSteps':
                if (this.elements.discreteToggle) {
                    this.elements.discreteToggle.checked = value;
                }
                break;
            default:
                console.warn(`SharedControls: Unknown control '${controlName}'`);
        }
    }
}