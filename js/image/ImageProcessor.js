// Processes uploaded images for grid masking
class ImageProcessor {
    constructor() {
        this.processedData = null;
        this.iconConfig = {
            scale: 1.0,
            offsetX: 0.0,
            offsetY: 0.0,
            alphaThreshold: 0.1 // Below this alpha value = transparent
        };
    }

    // Process an uploaded image for grid masking
    processImageForGrid(image, gridWidth, gridHeight, canvasWidth, canvasHeight) {
        if (!image) {
            this.processedData = null;
            return null;
        }

        console.log('Processing image for grid:', {
            imageSize: `${image.width}x${image.height}`,
            gridSize: `${gridWidth}x${gridHeight}`,
            canvasSize: `${canvasWidth}x${canvasHeight}`
        });

        // Create canvas to extract image data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate icon dimensions and position on canvas
        const iconData = this.calculateIconDimensions(image, canvasWidth, canvasHeight);

        // Set canvas size to match the canvas
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the scaled and positioned icon
        ctx.drawImage(
            image,
            iconData.x, iconData.y,
            iconData.width, iconData.height
        );

        // Extract image data
        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        } catch (error) {
            console.warn('Could not extract image data:', error);
            return null;
        }

        // Create processed data for grid sampling
        this.processedData = {
            imageData: imageData,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            iconData: iconData
        };

        return this.processedData;
    }

    // Calculate icon dimensions to fill entire canvas (maintaining aspect ratio)
    calculateIconDimensions(image, canvasWidth, canvasHeight) {
        // Since we resize the canvas to match image aspect ratio,
        // we should fill the entire canvas
        return {
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight
        };
    }

    // Get mask data for a specific rectangle
    getIconMaskForRectangle(rectangle) {
        if (!this.processedData) {
            return {
                visible: true
            }; // No icon = show all rectangles
        }

        const {
            imageData,
            canvasWidth,
            canvasHeight
        } = this.processedData;

        // Calculate the center point of the rectangle
        const rectCenterX = rectangle.x + (rectangle.width / 2);
        const rectCenterY = rectangle.y + (rectangle.height / 2);

        // Clamp to canvas bounds
        const x = Math.max(0, Math.min(canvasWidth - 1, Math.round(rectCenterX)));
        const y = Math.max(0, Math.min(canvasHeight - 1, Math.round(rectCenterY)));

        // Get pixel data at this position
        const pixelIndex = (y * canvasWidth + x) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        const alpha = imageData.data[pixelIndex + 3] / 255; // Normalize alpha to 0-1

        // Check if pixel is pure white (all RGB values are 255)
        const whiteThreshold = 255; // Only pure white pixels
        const isWhite = r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;

        // Return visibility based on alpha threshold AND white check
        return {
            visible: alpha > this.iconConfig.alphaThreshold && !isWhite,
            alpha: alpha,
            isWhite: isWhite,
            rgb: [r, g, b],
            x: x,
            y: y
        };
    }

    // Sample multiple points within a rectangle for better accuracy
    getIconMaskForRectangleDetailed(rectangle) {
        if (!this.processedData) {
            return {
                visible: true
            };
        }

        const {
            imageData,
            canvasWidth,
            canvasHeight
        } = this.processedData;

        // Use 3x3 grid for better sampling of small rectangles
        const samplePoints = 3;
        let visibleSamples = 0;
        let totalAlpha = 0;
        let maxAlpha = 0;
        let whiteSamples = 0;
        const whiteThreshold = 255; // Only pure white pixels

        // Sample points within the rectangle
        for (let sx = 0; sx < samplePoints; sx++) {
            for (let sy = 0; sy < samplePoints; sy++) {
                const sampleX = rectangle.x + (rectangle.width * (sx + 0.5) / samplePoints);
                const sampleY = rectangle.y + (rectangle.height * (sy + 0.5) / samplePoints);

                const x = Math.max(0, Math.min(canvasWidth - 1, Math.round(sampleX)));
                const y = Math.max(0, Math.min(canvasHeight - 1, Math.round(sampleY)));

                const pixelIndex = (y * canvasWidth + x) * 4;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];
                const alpha = imageData.data[pixelIndex + 3] / 255;

                // Check if pixel is white
                const isWhite = r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
                if (isWhite) {
                    whiteSamples++;
                }

                totalAlpha += alpha;
                maxAlpha = Math.max(maxAlpha, alpha);

                // Sample is visible if it has good alpha AND is not white
                if (alpha > this.iconConfig.alphaThreshold && !isWhite) {
                    visibleSamples++;
                }
            }
        }

        const avgAlpha = totalAlpha / (samplePoints * samplePoints);
        const visibilityRatio = visibleSamples / (samplePoints * samplePoints);
        const whiteRatio = whiteSamples / (samplePoints * samplePoints);

        return {
            // Rectangle is visible if it has good alpha AND is not predominantly white
            visible: maxAlpha > this.iconConfig.alphaThreshold && visibilityRatio > 0.3 && whiteRatio < 0.7,
            alpha: maxAlpha, // Use the strongest alpha value
            avgAlpha: avgAlpha,
            visibilityRatio: visibilityRatio,
            whiteRatio: whiteRatio
        };
    }

    // Update icon configuration
    updateIconConfig(config) {
        this.iconConfig = {
            ...this.iconConfig,
            ...config
        };
        console.log('Icon config updated:', this.iconConfig);
    }

    // Get current icon configuration
    getIconConfig() {
        return {
            ...this.iconConfig
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
        console.log('ImageProcessor data cleared. Had data:', hadData);
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
            iconPosition: this.processedData.iconData,
            config: this.iconConfig
        };
    }
}