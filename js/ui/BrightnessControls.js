// Handles brightness mode controls (image upload handled by SharedImageUploader)
class BrightnessControls {
    constructor() {
        this.brightnessProcessor = null;
        this.callbacks = {};
        this.controls = {};
        this.elements = {};
    }

    init() {
        // Get references to brightness control elements
        this.elements = {
            // Image-specific control sliders
            brightnessSlider: document.getElementById('brightness-adjustment-slider'),
            brightnessValue: document.getElementById('brightness-adjustment-value'),
            contrastSlider: document.getElementById('brightness-contrast-slider'),
            contrastValue: document.getElementById('brightness-contrast-value'),

            // Image-specific toggle switches
            invertToggle: document.getElementById('brightness-invert-toggle')
        };

        // Check if elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`BrightnessControls: Element '${key}' not found`);
            }
        }

        this.setupControls();
    }

    setupControls() {
        // Brightness adjustment
        this.setupSliderControl('brightnessSlider', 'brightnessValue', 'brightness', (value) => {
            return parseFloat(value).toFixed(1);
        });

        // Contrast
        this.setupSliderControl('contrastSlider', 'contrastValue', 'contrast', (value) => {
            return parseFloat(value).toFixed(1);
        });

        // Toggle controls
        this.setupToggleControl('invertToggle', 'invert');
    }

    setupSliderControl(sliderKey, valueKey, configKey, formatter) {
        const slider = this.elements[sliderKey];
        const valueDisplay = this.elements[valueKey];

        if (slider && valueDisplay) {
            // Initialize display
            valueDisplay.textContent = formatter(slider.value);

            // Store control reference
            this.controls[configKey] = {
                element: slider,
                getValue: () => {
                    const value = parseFloat(slider.value);
                    return configKey === 'heightSteps' ? parseInt(value) : value;
                }
            };

            // Set up event listener
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                valueDisplay.textContent = formatter(value);
                this.updateBrightnessConfig();
            });
        }
    }

    setupToggleControl(toggleKey, configKey) {
        const toggle = this.elements[toggleKey];

        if (toggle) {
            // Store control reference
            this.controls[configKey] = {
                element: toggle,
                getValue: () => toggle.checked
            };

            // Set up event listener
            toggle.addEventListener('change', () => {
                this.updateBrightnessConfig();
            });
        }
    }

    updateBrightnessConfig() {
        if (!this.brightnessProcessor) return;

        // Only update brightness config if we have processed data
        // This prevents errors when sliders are moved in other modes
        if (!this.brightnessProcessor.hasProcessedData()) {
            console.log('Brightness config not updated - no processed data available');
            return;
        }

        // Collect all control values
        const config = {};
        for (let [key, control] of Object.entries(this.controls)) {
            config[key] = control.getValue();
        }

        // Update brightness processor
        this.brightnessProcessor.updateBrightnessConfig(config);

        // Trigger callback for config change
        this.triggerCallback('configChanged', config);
    }

    // Set brightness processor reference
    setBrightnessProcessor(processor) {
        this.brightnessProcessor = processor;
    }

    // Register callback for events
    onBrightnessEvent(eventName, callback) {
        this.callbacks[eventName] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(eventName, data = null) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](data);
        }
    }

    // Get current brightness configuration from controls
    getCurrentConfig() {
        const config = {};
        for (let [key, control] of Object.entries(this.controls)) {
            config[key] = control.getValue();
        }
        return config;
    }


}