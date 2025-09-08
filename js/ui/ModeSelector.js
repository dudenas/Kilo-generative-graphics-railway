// Handles mode switching between Noise and Icon modes
class ModeSelector {
    constructor() {
        this.currentMode = 'noise';
        this.callbacks = {};
        this.elements = {};
        this.init();
    }

    init() {
        // Get references to mode elements
        this.elements = {
            noiseRadio: document.getElementById('noise-mode'),
            iconRadio: document.getElementById('icon-mode'),
            brightnessRadio: document.getElementById('brightness-mode'),
            noiseControls: document.getElementById('noise-controls'),
            brightnessControls: document.getElementById('brightness-controls'),
            sharedImageUploader: document.getElementById('shared-image-uploader'),
            sharedControls: document.getElementById('shared-controls'),
            rightPanel: document.getElementById('right-panel')
        };

        // Check if all elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`ModeSelector: Element '${key}' not found`);
            }
        }

        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Noise mode radio
        if (this.elements.noiseRadio) {
            this.elements.noiseRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.switchMode('noise');
                }
            });
        }

        // Icon mode radio
        if (this.elements.iconRadio) {
            this.elements.iconRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.switchMode('icon');
                }
            });
        }

        // Brightness mode radio
        if (this.elements.brightnessRadio) {
            this.elements.brightnessRadio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.switchMode('brightness');
                }
            });
        }
    }

    switchMode(mode) {
        if (mode === this.currentMode) return;

        const previousMode = this.currentMode;
        this.currentMode = mode;

        console.log(`Switching from ${previousMode} to ${mode} mode`);

        this.updateUI();

        // Update canvas for new mode
        if (typeof updateCanvasForMode === 'function') {
            updateCanvasForMode(mode);
        }

        this.triggerCallback('modeChanged', {
            previousMode: previousMode,
            currentMode: mode
        });
    }

    updateUI() {
        // Show/hide right panel and its control panels based on current mode
        if (this.elements.rightPanel) {
            // Right panel is always visible since it contains mode-specific settings
            this.elements.rightPanel.style.display = 'block';
        }

        // Show/hide control panels within right panel based on current mode
        if (this.elements.noiseControls && this.elements.brightnessControls) {
            if (this.currentMode === 'noise') {
                this.elements.noiseControls.style.display = 'block';
                this.elements.brightnessControls.style.display = 'none';
            } else if (this.currentMode === 'icon') {
                // Icon mode shows noise controls (for graphics generation)
                this.elements.noiseControls.style.display = 'block';
                this.elements.brightnessControls.style.display = 'none';
            } else if (this.currentMode === 'brightness') {
                this.elements.noiseControls.style.display = 'none';
                this.elements.brightnessControls.style.display = 'block';
            }
        }

        // Shared controls are always visible (they apply to all modes)
        if (this.elements.sharedControls) {
            this.elements.sharedControls.style.display = 'block';
        }

        // Show image uploader in all modes but disable in noise mode
        if (this.elements.sharedImageUploader) {
            this.elements.sharedImageUploader.style.display = 'block';

            const uploadButton = document.getElementById('shared-image-upload-button');
            const fileInput = document.getElementById('shared-image-file-input');

            if (this.currentMode === 'noise') {
                // Disable in noise mode
                if (uploadButton) {
                    uploadButton.disabled = true;
                    uploadButton.style.opacity = '0.5';
                    uploadButton.style.cursor = 'not-allowed';
                }
                if (fileInput) {
                    fileInput.disabled = true;
                }
            } else {
                // Enable in other modes
                if (uploadButton) {
                    uploadButton.disabled = false;
                    uploadButton.style.opacity = '1';
                    uploadButton.style.cursor = 'pointer';
                }
                if (fileInput) {
                    fileInput.disabled = false;
                }
            }
        }

        // Update radio button states
        if (this.elements.noiseRadio && this.elements.iconRadio && this.elements.brightnessRadio) {
            this.elements.noiseRadio.checked = (this.currentMode === 'noise');
            this.elements.iconRadio.checked = (this.currentMode === 'icon');
            this.elements.brightnessRadio.checked = (this.currentMode === 'brightness');
        }
    }

    // Register callback for mode change events
    onModeChange(callback) {
        this.callbacks['modeChanged'] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(eventName, data = null) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](data);
        }
    }

    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    // Set mode programmatically
    setMode(mode) {
        if (mode !== 'noise' && mode !== 'icon' && mode !== 'brightness') {
            console.warn(`Invalid mode: ${mode}. Must be 'noise', 'icon', or 'brightness'`);
            return;
        }

        this.switchMode(mode);
    }

    // Check if in specific mode
    isNoiseMode() {
        return this.currentMode === 'noise';
    }

    isIconMode() {
        return this.currentMode === 'icon';
    }

    isBrightnessMode() {
        return this.currentMode === 'brightness';
    }
}