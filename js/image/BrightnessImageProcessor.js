// Processes uploaded images for brightness-based grid scaling
class BrightnessImageProcessor {
    constructor() {
        this.processedData = null;
        this.brightnessConfig = {
            brightness: 0.0, // Brightness adjustment (-1 to 1)
            contrast: 1.0, // Contrast multiplier (0.5 to 3)
            invert: false, // Invert brightness values
            threshold: 0.2, // Lower threshold for visibility
            upperThreshold: 0.8, // Upper threshold for maximum scale
            heightSteps: 5, // Number of discrete steps for height
            useDiscreteSteps: true, // Use discrete steps vs continuous
            widthMinScale: 0.2, // Minimum width scale
            widthMaxScale: 1.0, // Maximum width scale
            heightMinScale: 0.1, // Minimum height scale
            heightMaxScale: 1.0, // Maximum height scale
            alphaThreshold: 0.1 // Below this alpha value = transparent
        };
    }

    // Process an uploaded image for brightness-based grid scaling
    processImageForGrid(image, gridWidth, gridHeight, canvasWidth, canvasHeight) {
        if (!image) {
            this.processedData = null;
            return null;
        }

        console.log('Processing image for brightness grid:', {
            imageSize: `${image.width}x${image.height}`,
            gridSize: `${gridWidth}x${gridHeight}`,
            canvasSize: `${canvasWidth}x${canvasHeight}`
        });

        // Create canvas to extract image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate image dimensions to fill entire canvas (maintaining aspect ratio)
        const imageData = this.calculateImageDimensions(image, canvasWidth, canvasHeight);

        // Set canvas size to match the canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the scaled and positioned image
        ctx.drawImage(
            image,
            imageData.x, imageData.y,
            imageData.width, imageData.height
        );

        // Extract image data
        let rawImageData;
        try {
            rawImageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        } catch (error) {
            console.warn('Could not extract image data:', error);
            return null;
        }

        // Process brightness data
        const brightnessData = this.extractBrightnessData(rawImageData);

        // Create processed data for grid sampling
        this.processedData = {
            imageData: rawImageData,
            brightnessData: brightnessData,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            imageDimensions: imageData
        };

        return this.processedData;
    }

    // Calculate image dimensions to fill entire canvas (maintaining aspect ratio)
    calculateImageDimensions(image, canvasWidth, canvasHeight) {
        // Fill the entire canvas while maintaining aspect ratio
        const imageAspect = image.width / image.height;
        const canvasAspect = canvasWidth / canvasHeight;

        let width, height, x, y;

        if (imageAspect > canvasAspect) {
            // Image is wider than canvas - fit to height
            height = canvasHeight;
            width = height * imageAspect;
            x = (canvasWidth - width) / 2;
            y = 0;
        } else {
            // Image is taller than canvas - fit to width
            width = canvasWidth;
            height = width / imageAspect;
            x = 0;
            y = (canvasHeight - height) / 2;
        }

        return {
            x,
            y,
            width,
            height
        };
    }

    // Extract brightness values from image data
    extractBrightnessData(imageData) {
        if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
            console.warn('Invalid imageData passed to extractBrightnessData:', imageData);
            return new Float32Array(0);
        }

        const {
            data,
            width,
            height
        } = imageData;
        const brightnessData = new Float32Array(width * height);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Calculate luminance using standard formula
            let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Apply brightness adjustment
            brightness += this.brightnessConfig.brightness;

            // Apply contrast
            brightness = (brightness - 0.5) * this.brightnessConfig.contrast + 0.5;

            // Apply inversion if enabled
            if (this.brightnessConfig.invert) {
                brightness = 1.0 - brightness;
            }

            // Clamp to 0-1 range
            brightness = Math.max(0, Math.min(1, brightness));

            // Store brightness value (pixel index = i / 4)
            brightnessData[i / 4] = brightness;
        }

        return brightnessData;
    }

    // Get brightness and mask data for a specific rectangle
    getBrightnessForRectangle(rectangle) {
        if (!this.processedData) {
            return {
                visible: true,
                brightness: 0.5 // Default brightness if no image
            };
        }

        const {
            imageData,
            brightnessData,
            canvasWidth,
            canvasHeight
        } = this.processedData;

        // Calculate the center point of the rectangle
        const rectCenterX = rectangle.x + (rectangle.width / 2);
        const rectCenterY = rectangle.y + (rectangle.height / 2);

        // Clamp to canvas bounds
        const x = Math.max(0, Math.min(canvasWidth - 1, Math.round(rectCenterX)));
        const y = Math.max(0, Math.min(canvasHeight - 1, Math.round(rectCenterY)));

        // Get pixel index
        const pixelIndex = y * canvasWidth + x;

        // Get alpha for transparency masking
        const dataIndex = pixelIndex * 4;
        const alpha = imageData.data[dataIndex + 3] / 255;

        // Get brightness value
        const brightness = brightnessData[pixelIndex];

        return {
            visible: alpha > this.brightnessConfig.alphaThreshold,
            brightness: brightness,
            alpha: alpha,
            x: x,
            y: y
        };
    }

    // Sample multiple points within a rectangle for better accuracy
    getBrightnessForRectangleDetailed(rectangle) {
        if (!this.processedData) {
            return {
                visible: true,
                brightness: 0.5
            };
        }

        const {
            imageData,
            brightnessData,
            canvasWidth,
            canvasHeight
        } = this.processedData;

        // Use 3x3 grid for better sampling
        const samplePoints = 3;
        let visibleSamples = 0;
        let totalBrightness = 0;
        let totalAlpha = 0;
        let maxAlpha = 0;

        // Sample points within the rectangle
        for (let sx = 0; sx < samplePoints; sx++) {
            for (let sy = 0; sy < samplePoints; sy++) {
                const sampleX = rectangle.x + (rectangle.width * (sx + 0.5) / samplePoints);
                const sampleY = rectangle.y + (rectangle.height * (sy + 0.5) / samplePoints);

                const x = Math.max(0, Math.min(canvasWidth - 1, Math.round(sampleX)));
                const y = Math.max(0, Math.min(canvasHeight - 1, Math.round(sampleY)));

                const pixelIndex = y * canvasWidth + x;
                const dataIndex = pixelIndex * 4;

                const alpha = imageData.data[dataIndex + 3] / 255;
                const brightness = brightnessData[pixelIndex];

                totalBrightness += brightness;
                totalAlpha += alpha;
                maxAlpha = Math.max(maxAlpha, alpha);

                if (alpha > this.brightnessConfig.alphaThreshold) {
                    visibleSamples++;
                }
            }
        }

        const avgBrightness = totalBrightness / (samplePoints * samplePoints);
        const avgAlpha = totalAlpha / (samplePoints * samplePoints);
        const visibilityRatio = visibleSamples / (samplePoints * samplePoints);

        return {
            // Use a more lenient threshold - if any sample point is visible, show the rectangle
            visible: maxAlpha > this.brightnessConfig.alphaThreshold || visibilityRatio > 0.3,
            brightness: avgBrightness,
            alpha: maxAlpha,
            avgAlpha: avgAlpha,
            visibilityRatio: visibilityRatio
        };
    }

    // Update brightness configuration
    updateBrightnessConfig(config) {
        const oldConfig = {
            ...this.brightnessConfig
        };
        this.brightnessConfig = {
            ...this.brightnessConfig,
            ...config
        };

        console.log('Brightness config updated:', this.brightnessConfig);

        // If brightness, contrast, or invert changed, reprocess brightness data
        const needsReprocess = (
            oldConfig.brightness !== this.brightnessConfig.brightness ||
            oldConfig.contrast !== this.brightnessConfig.contrast ||
            oldConfig.invert !== this.brightnessConfig.invert
        );

        if (needsReprocess && this.processedData && this.processedData.imageData) {
            console.log('Reprocessing brightness data due to config change');
            this.processedData.brightnessData = this.extractBrightnessData(this.processedData.imageData);
        }
    }

    // Get current brightness configuration
    getBrightnessConfig() {
        return {
            ...this.brightnessConfig
        };
    }

    // Check if processor has data
    hasProcessedData() {
        return this.processedData !== null;
    }

    // Clear processed data
    clearProcessedData() {
        const hadData = this.processedData !== null;
        this.processedData = null;
        console.log('BrightnessImageProcessor data cleared. Had data:', hadData);
    }

    // Get debug info about current processed data
    getDebugInfo() {
        if (!this.processedData) {
            return {
                hasData: false
            };
        }

        return {
            hasData: true,
            canvasSize: `${this.processedData.canvasWidth}x${this.processedData.canvasHeight}`,
            imagePosition: this.processedData.imageDimensions,
            config: this.brightnessConfig,
            brightnessDataLength: this.processedData.brightnessData.length
        };
    }
}