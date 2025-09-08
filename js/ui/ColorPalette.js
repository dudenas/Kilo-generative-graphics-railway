// Handles color palette selection and management
class ColorPalette {
    constructor() {
        this.currentPaletteIndex = 6;
        this.callbacks = {};

        // Define color palettes [background, graphics] - 21 total
        this.palettes = [
            ['#FFFFFF', '#3FF478'], // White background, Green graphics
            ['#FFFFFF', '#55E0FF'], // White background, Cyan graphics
            ['#FFFFFF', '#EDC9FF'], // White background, Light purple graphics
            ['#E3F255', '#3FF478'], // Yellow-green background, Green graphics
            ['#E3F255', '#FF4D12'], // Yellow-green background, Orange graphics
            ['#E3F255', '#B029FF'], // Yellow-green background, Purple graphics
            ['#3FF478', '#E6F3DB'], // Green background, Light sage graphics
            ['#3FF478', '#E3F255'], // Green background, Yellow-green graphics
            ['#3FF478', '#FF4D12'], // Green background, Orange graphics
            ['#E6F3DB', '#3FF478'], // Light sage background, Green graphics
            ['#E6F3DB', '#FF4D12'], // Light sage background, Orange graphics
            ['#E6F3DB', '#B029FF'], // Light sage background, Purple graphics
            ['#E6F3DB', '#55E0FF'], // Light sage background, Cyan graphics
            ['#FF4D12', '#E3F255'], // Orange background, Yellow-green graphics
            ['#FF4D12', '#EDC9FF'], // Orange background, Light purple graphics
            ['#55E0FF', '#E3F255'], // Cyan background, Yellow-green graphics
            ['#EDC9FF', '#B029FF'], // Light purple background, Purple graphics
            ['#EDC9FF', '#FF4D12'], // Light purple background, Orange graphics
            ['#B029FF', '#E3F255'], // Purple background, Yellow-green graphics
            ['#FFFFFF', '#000000'], // White background, Black graphics
            ['#000000', '#FFFFFF'], // Black background, White graphics
        ];

        this.init();
    }

    init() {
        this.container = document.getElementById('color-palette-container');
        if (!this.container) {
            console.warn('ColorPalette: Container element not found');
            return;
        }

        this.createPaletteSwatches();
        this.selectPalette(6); // Select green background with light sage graphics by default
    }

    createPaletteSwatches() {
        // Clear existing swatches
        this.container.innerHTML = '';

        this.palettes.forEach((palette, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.dataset.paletteIndex = index;

            // Create background and graphics color indicators
            const bgColor = document.createElement('div');
            bgColor.className = 'swatch-bg';
            bgColor.style.backgroundColor = palette[0];

            const graphicsColor = document.createElement('div');
            graphicsColor.className = 'swatch-graphics';
            graphicsColor.style.backgroundColor = palette[1];

            swatch.appendChild(bgColor);
            swatch.appendChild(graphicsColor);

            // Add click event
            swatch.addEventListener('click', () => {
                this.selectPalette(index);
            });

            this.container.appendChild(swatch);
        });
    }



    selectPalette(index) {
        if (index < 0 || index >= this.palettes.length) return;

        this.currentPaletteIndex = index;

        // Update active swatch appearance
        this.updateActiveSwatchAppearance();

        // Get current palette colors
        const palette = this.palettes[index];
        const colors = {
            background: palette[0],
            graphics: palette[1]
        };

        // Trigger callback to update colors in the app
        this.triggerCallback('paletteChanged', colors);
    }

    updateActiveSwatchAppearance() {
        // Remove active class from all swatches
        const allSwatches = this.container.querySelectorAll('.color-swatch');
        allSwatches.forEach(swatch => swatch.classList.remove('active'));

        // Add active class to current swatch
        const activeSwatch = this.container.querySelector(`[data-palette-index="${this.currentPaletteIndex}"]`);
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    }

    // Get current palette colors
    getCurrentColors() {
        const palette = this.palettes[this.currentPaletteIndex];
        return {
            background: palette[0],
            graphics: palette[1]
        };
    }

    // Register callback for palette changes
    onPaletteChange(callback) {
        this.callbacks['paletteChanged'] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(eventName, data) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](data);
        }
    }

    // Add a new palette programmatically
    addPalette(backgroundColor, graphicsColor) {
        this.palettes.push([backgroundColor, graphicsColor]);
        this.createPaletteSwatches();
    }

    // Get all available palettes
    getAllPalettes() {
        return this.palettes.map(palette => ({
            background: palette[0],
            graphics: palette[1]
        }));
    }
}