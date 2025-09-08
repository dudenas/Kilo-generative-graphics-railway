// Handles noise parameter controls (sliders and toggle)
class NoiseControls {
    constructor() {
        this.elements = {};
        this.callbacks = {};
        this.init();
    }

    init() {
        // Get references to noise-specific control elements
        this.elements = {
            scaleSlider: document.getElementById('scale-slider'),
            scaleValue: document.getElementById('scale-value'),
            animationToggle: document.getElementById('animation-toggle'),
            animationLengthSlider: document.getElementById('animation-length-slider'),
            animationLengthValue: document.getElementById('animation-length-value'),
            animationSpeedSlider: document.getElementById('animation-speed-slider'),
            animationSpeedValue: document.getElementById('animation-speed-value')
        };

        // Check if all elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`NoiseControls: Element '${key}' not found`);
            }
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Scale slider
        if (this.elements.scaleSlider) {
            this.elements.scaleSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.updateValueDisplay('scale', value);
                this.triggerCallback('scale', value);
            });
        }

        // Animation toggle
        if (this.elements.animationToggle) {
            this.elements.animationToggle.addEventListener('change', (e) => {
                const value = e.target.checked;
                this.triggerCallback('useAnimation', value);
            });
        }

        // Animation length slider
        if (this.elements.animationLengthSlider) {
            this.elements.animationLengthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.updateValueDisplay('animationLength', value);
                this.triggerCallback('loopDuration', value);
            });
        }

        // Animation speed slider
        if (this.elements.animationSpeedSlider) {
            this.elements.animationSpeedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.updateValueDisplay('animationSpeed', value);
                this.triggerCallback('animationSpeed', value);
            });
        }
    }

    // Update the value display next to sliders
    updateValueDisplay(control, value) {
        const valueElement = this.elements[control + 'Value'];
        if (valueElement) {
            if (control === 'scale') {
                valueElement.textContent = value.toFixed(3);
            } else if (control === 'animationLength') {
                valueElement.textContent = value.toString();
            } else if (control === 'animationSpeed') {
                valueElement.textContent = value.toFixed(1);
            } else {
                valueElement.textContent = value.toFixed(1);
            }
        }
    }

    // Register a callback for when controls change
    onControlChange(controlName, callback) {
        this.callbacks[controlName] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(controlName, value) {
        if (this.callbacks[controlName]) {
            this.callbacks[controlName](value);
        }
    }

    // Set control values programmatically
    setControlValue(controlName, value) {
        const sliderMap = {
            'scale': 'scaleSlider',
            'useAnimation': 'animationToggle',
            'loopDuration': 'animationLengthSlider',
            'animationSpeed': 'animationSpeedSlider'
        };

        const elementKey = sliderMap[controlName];
        if (elementKey && this.elements[elementKey]) {
            if (controlName === 'useAnimation') {
                this.elements[elementKey].checked = value;
            } else {
                this.elements[elementKey].value = value;
                // Update display
                if (controlName === 'scale') {
                    this.updateValueDisplay('scale', value);
                } else if (controlName === 'loopDuration') {
                    this.updateValueDisplay('animationLength', value);
                } else if (controlName === 'animationSpeed') {
                    this.updateValueDisplay('animationSpeed', value);
                }
            }
        }
    }

    // Get all current control values
    getAllValues() {
        return {
            scale: parseFloat((this.elements.scaleSlider && this.elements.scaleSlider.value) || 0.01),
            useAnimation: (this.elements.animationToggle && this.elements.animationToggle.checked) || false,
            loopDuration: parseInt((this.elements.animationLengthSlider && this.elements.animationLengthSlider.value) || 300),
            animationSpeed: parseFloat((this.elements.animationSpeedSlider && this.elements.animationSpeedSlider.value) || 1.0)
        };
    }
}