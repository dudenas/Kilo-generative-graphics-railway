// Rectangle class extending Shape
class Rectangle extends Shape {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.baseColor = null; // Will be set by grid
        this.baseWidth = width; // Store original width
        this.baseHeight = height; // Store original height
        this.currentWidth = width; // Current noise-modified width
        this.currentHeight = height; // Current noise-modified height
        this.currentRoundnessX = .9; // Horizontal roundness (affects width-based corners)
        this.currentRoundnessY = .9; // Vertical roundness (affects height-based corners)
        this.firstReveal = false; // For circular reveal animation
        this.distanceFromCenter = 0; // Distance from canvas center
    }

    // Set the base color for this rectangle
    setBaseColor(color) {
        // Handle different color formats
        if (Array.isArray(color)) {
            // RGB array format [r, g, b]
            this.baseColor = color;
        } else if (typeof color === 'string') {
            // Hex string format "#ffffff"
            this.baseColor = this.hexToRgb(color);
        } else {
            // p5.js color object - extract RGB values
            this.baseColor = [red(color), green(color), blue(color)];
        }
    }

    // Update properties based on noise (width and height scale together)
    updateNoiseHeight(noiseCalculator, z, noiseConfig, frameCount = 0, iconMask = null) {
        // Check icon mask first - if not visible, hide the rectangle
        if (iconMask && !iconMask.visible) {
            this.currentWidth = 0;
            this.currentHeight = 0;
            return; // Exit early, don't process noise
        }

        // Use center point of rectangle for noise calculation
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Get noise value for size (0-1 range)
        const sizeNoise = noiseCalculator.getColorNoise(centerX, centerY, z, noiseConfig, frameCount);

        // Calculate separate scale factors using the same noise value but different ranges
        let widthScaleFactor, heightScaleFactor;

        if (noiseConfig.useDiscreteSteps) {
            // Discrete steps mode
            widthScaleFactor = this.calculateDiscreteScaleWithRange(sizeNoise, noiseConfig,
                noiseConfig.widthMinScale || 0.0, noiseConfig.widthMaxScale || 1.0);
            heightScaleFactor = this.calculateDiscreteScaleWithThreshold(sizeNoise, noiseConfig,
                noiseConfig.heightMinScale || 0.0, noiseConfig.heightMaxScale || 1.0);
        } else {
            // Continuous mode
            widthScaleFactor = this.calculateContinuousScaleWithRange(sizeNoise, noiseConfig,
                noiseConfig.widthMinScale || 0.0, noiseConfig.widthMaxScale || 1.0);
            heightScaleFactor = this.calculateContinuousScaleWithThreshold(sizeNoise, noiseConfig,
                noiseConfig.heightMinScale || 0.0, noiseConfig.heightMaxScale || 1.0);
        }

        // Apply different scale factors to width and height
        this.currentWidth = this.baseWidth * widthScaleFactor;
        this.currentHeight = this.baseHeight * heightScaleFactor;
    }

    // Update properties based on brightness values from image
    updateBrightnessHeight(brightnessProcessor, brightnessData = null) {
        // Get brightness data for this rectangle
        const brightnessSample = brightnessData ||
            brightnessProcessor.getBrightnessForRectangleDetailed(this);

        // Check transparency mask first - if not visible, hide the rectangle
        if (brightnessSample && !brightnessSample.visible) {
            this.currentWidth = 0;
            this.currentHeight = 0;
            return; // Exit early, don't process brightness
        }

        // Get brightness value (0-1 range)
        const brightness = brightnessSample ? brightnessSample.brightness : 0.5;

        // Get brightness configuration
        const config = brightnessProcessor.getBrightnessConfig();

        // Calculate separate scale factors using brightness value
        let widthScaleFactor, heightScaleFactor;

        if (config.useDiscreteSteps) {
            // Discrete steps mode
            widthScaleFactor = this.calculateBrightnessDiscreteScaleWithRange(
                brightness, config, config.widthMinScale, config.widthMaxScale);
            heightScaleFactor = this.calculateBrightnessDiscreteScaleWithThreshold(
                brightness, config, config.heightMinScale, config.heightMaxScale);
        } else {
            // Continuous mode
            widthScaleFactor = this.calculateBrightnessContinuousScaleWithRange(
                brightness, config, config.widthMinScale, config.widthMaxScale);
            heightScaleFactor = this.calculateBrightnessContinuousScaleWithThreshold(
                brightness, config, config.heightMinScale, config.heightMaxScale);
        }

        // Apply different scale factors to width and height
        this.currentWidth = this.baseWidth * widthScaleFactor;
        this.currentHeight = this.baseHeight * heightScaleFactor;
    }

    // Calculate discrete scale factor
    calculateDiscreteScale(sizeNoise, noiseConfig) {
        const steps = noiseConfig.heightSteps;
        const threshold = noiseConfig.threshold || 0.5;
        const upperThreshold = noiseConfig.upperThreshold || 1.0;

        // Apply lower threshold - values below threshold are hidden
        if (sizeNoise < threshold) {
            return 0; // Hidden (scale = 0)
        }

        // Apply upper threshold - values above upperThreshold are full size
        if (sizeNoise >= upperThreshold) {
            return 1.0; // Full size (scale = 1.0)
        }

        // Remap values between thresholds to 0-1 range
        const remappedNoise = (sizeNoise - threshold) / (upperThreshold - threshold);

        // Ensure remappedNoise is clamped to 0-1
        const clampedRemapped = Math.max(0, Math.min(1, remappedNoise));

        // Find which step this value falls into
        const stepIndex = Math.floor(clampedRemapped * steps);

        // Clamp to valid range (0 to steps-1)
        const finalStep = Math.min(stepIndex, steps - 1);

        // Convert step to scale factor
        // Step 0 = 1/steps, Step 1 = 2/steps, etc.
        const scaleFactor = (finalStep + 1) / steps;
        return scaleFactor;
    }

    // Calculate continuous scale factor (original behavior)
    calculateContinuousScale(sizeNoise, noiseConfig) {
        // Apply lower threshold to create empty space (scale = 0)
        if (sizeNoise < noiseConfig.threshold) {
            return 0;
        }

        // Apply upper threshold for full size rectangles
        const upperThreshold = noiseConfig.upperThreshold || 0.8; // Default to 0.8 if not set
        if (sizeNoise >= upperThreshold) {
            return 1.0; // Full size (scale = 1.0)
        }

        // Remap values between thresholds (threshold to upperThreshold) back to (0 to 1.0)
        const remappedSizeNoise = (sizeNoise - noiseConfig.threshold) / (upperThreshold - noiseConfig.threshold);

        // Scale based on noise (minimum 10% size, maximum 100% size)
        return 0.1 + remappedSizeNoise * 0.9;
    }

    // Calculate discrete scale factor with custom range
    calculateDiscreteScaleWithRange(sizeNoise, noiseConfig, minScale, maxScale) {
        const steps = noiseConfig.heightSteps;
        const threshold = noiseConfig.threshold || 0.5;
        const upperThreshold = noiseConfig.upperThreshold || 1.0;

        // Apply lower threshold - values below threshold use minimum scale
        if (sizeNoise < threshold) {
            return minScale;
        }

        // Apply upper threshold - values above upperThreshold use maximum scale
        if (sizeNoise >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds to 0-1 range
        const remappedNoise = (sizeNoise - threshold) / (upperThreshold - threshold);
        const clampedRemapped = Math.max(0, Math.min(1, remappedNoise));

        // Find which step this value falls into
        const stepIndex = Math.floor(clampedRemapped * steps);
        const finalStep = Math.min(stepIndex, steps - 1);

        // Convert step to scale factor between minScale and maxScale
        const stepProgress = (finalStep + 1) / steps;
        return minScale + stepProgress * (maxScale - minScale);
    }

    // Calculate continuous scale factor with custom range
    calculateContinuousScaleWithRange(sizeNoise, noiseConfig, minScale, maxScale) {
        const threshold = noiseConfig.threshold || 0.5;
        const upperThreshold = noiseConfig.upperThreshold || 0.8;

        // Apply lower threshold - use minimum scale
        if (sizeNoise < threshold) {
            return minScale;
        }

        // Apply upper threshold - use maximum scale
        if (sizeNoise >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds
        const remappedSizeNoise = (sizeNoise - threshold) / (upperThreshold - threshold);

        // Scale between minScale and maxScale
        return minScale + remappedSizeNoise * (maxScale - minScale);
    }

    // Calculate discrete scale factor with threshold logic (for height)
    calculateDiscreteScaleWithThreshold(sizeNoise, noiseConfig, minScale, maxScale) {
        const steps = noiseConfig.heightSteps;
        const threshold = noiseConfig.threshold || 0.5;
        const upperThreshold = noiseConfig.upperThreshold || 1.0;

        // Apply lower threshold - values below threshold are hidden (scale = 0)
        if (sizeNoise < threshold) {
            return 0; // Always 0 for height below threshold
        }

        // Apply upper threshold - values above upperThreshold use maximum scale
        if (sizeNoise >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds to 0-1 range
        const remappedNoise = (sizeNoise - threshold) / (upperThreshold - threshold);
        const clampedRemapped = Math.max(0, Math.min(1, remappedNoise));

        // Find which step this value falls into
        const stepIndex = Math.floor(clampedRemapped * steps);
        const finalStep = Math.min(stepIndex, steps - 1);

        // Convert step to scale factor between minScale and maxScale
        const stepProgress = (finalStep + 1) / steps;
        return minScale + stepProgress * (maxScale - minScale);
    }

    // Calculate continuous scale factor with threshold logic (for height)
    calculateContinuousScaleWithThreshold(sizeNoise, noiseConfig, minScale, maxScale) {
        const threshold = noiseConfig.threshold || 0.5;
        const upperThreshold = noiseConfig.upperThreshold || 0.8;

        // Apply lower threshold - values below threshold are hidden (scale = 0)
        if (sizeNoise < threshold) {
            return 0; // Always 0 for height below threshold
        }

        // Apply upper threshold - use maximum scale
        if (sizeNoise >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds
        const remappedSizeNoise = (sizeNoise - threshold) / (upperThreshold - threshold);

        // Scale between minScale and maxScale
        return minScale + remappedSizeNoise * (maxScale - minScale);
    }

    // Brightness-based scaling methods (similar to noise methods but using brightness)

    // Calculate discrete scale factor with custom range for brightness
    calculateBrightnessDiscreteScaleWithRange(brightness, config, minScale, maxScale) {
        const steps = config.heightSteps;
        const threshold = config.threshold || 0.2;
        const upperThreshold = config.upperThreshold || 0.8;

        // Apply lower threshold - values below threshold use minimum scale
        if (brightness < threshold) {
            return minScale;
        }

        // Apply upper threshold - values above upperThreshold use maximum scale
        if (brightness >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds to 0-1 range
        const remappedBrightness = (brightness - threshold) / (upperThreshold - threshold);
        const clampedRemapped = Math.max(0, Math.min(1, remappedBrightness));

        // Find which step this value falls into
        const stepIndex = Math.floor(clampedRemapped * steps);
        const finalStep = Math.min(stepIndex, steps - 1);

        // Convert step to scale factor between minScale and maxScale
        const stepProgress = (finalStep + 1) / steps;
        return minScale + stepProgress * (maxScale - minScale);
    }

    // Calculate continuous scale factor with custom range for brightness
    calculateBrightnessContinuousScaleWithRange(brightness, config, minScale, maxScale) {
        const threshold = config.threshold || 0.2;
        const upperThreshold = config.upperThreshold || 0.8;

        // Apply lower threshold - use minimum scale
        if (brightness < threshold) {
            return minScale;
        }

        // Apply upper threshold - use maximum scale
        if (brightness >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds
        const remappedBrightness = (brightness - threshold) / (upperThreshold - threshold);

        // Scale between minScale and maxScale
        return minScale + remappedBrightness * (maxScale - minScale);
    }

    // Calculate discrete scale factor with threshold logic for brightness (for height)
    calculateBrightnessDiscreteScaleWithThreshold(brightness, config, minScale, maxScale) {
        const steps = config.heightSteps;
        const threshold = config.threshold || 0.2;
        const upperThreshold = config.upperThreshold || 0.8;

        // Apply lower threshold - values below threshold are hidden (scale = 0)
        if (brightness < threshold) {
            return 0; // Always 0 for height below threshold
        }

        // Apply upper threshold - values above upperThreshold use maximum scale
        if (brightness >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds to 0-1 range
        const remappedBrightness = (brightness - threshold) / (upperThreshold - threshold);
        const clampedRemapped = Math.max(0, Math.min(1, remappedBrightness));

        // Find which step this value falls into
        const stepIndex = Math.floor(clampedRemapped * steps);
        const finalStep = Math.min(stepIndex, steps - 1);

        // Convert step to scale factor between minScale and maxScale
        const stepProgress = (finalStep + 1) / steps;
        return minScale + stepProgress * (maxScale - minScale);
    }

    // Calculate continuous scale factor with threshold logic for brightness (for height)
    calculateBrightnessContinuousScaleWithThreshold(brightness, config, minScale, maxScale) {
        const threshold = config.threshold || 0.2;
        const upperThreshold = config.upperThreshold || 0.8;

        // Apply lower threshold - values below threshold are hidden (scale = 0)
        if (brightness < threshold) {
            return 0; // Always 0 for height below threshold
        }

        // Apply upper threshold - use maximum scale
        if (brightness >= upperThreshold) {
            return maxScale;
        }

        // Remap values between thresholds
        const remappedBrightness = (brightness - threshold) / (upperThreshold - threshold);

        // Scale between minScale and maxScale
        return minScale + remappedBrightness * (maxScale - minScale);
    }

    // Draw rounded rectangle using bezier curves with separate X/Y roundness
    drawRoundedRect(x, y, w, h, roundnessX, roundnessY) {
        if (h <= 0) return; // Don't draw if height is 0

        // Calculate separate corner radii for X and Y dimensions
        const radiusX = w * roundnessX * 0.5; // Horizontal radius (affects left/right curves)
        const radiusY = h * roundnessY * 0.5; // Vertical radius (affects top/bottom curves)

        beginShape();

        // Top edge (left to right)
        vertex(x + radiusX, y);
        vertex(x + w - radiusX, y);

        // Top-right corner
        bezierVertex(x + w - radiusX * 0.45, y,
            x + w, y + radiusY * 0.45,
            x + w, y + radiusY);

        // Right edge (top to bottom)
        vertex(x + w, y + h - radiusY);

        // Bottom-right corner
        bezierVertex(x + w, y + h - radiusY * 0.45,
            x + w - radiusX * 0.45, y + h,
            x + w - radiusX, y + h);

        // Bottom edge (right to left)
        vertex(x + radiusX, y + h);

        // Bottom-left corner
        bezierVertex(x + radiusX * 0.45, y + h,
            x, y + h - radiusY * 0.45,
            x, y + h - radiusY);

        // Left edge (bottom to top)
        vertex(x, y + radiusY);

        // Top-left corner
        bezierVertex(x, y + radiusY * 0.45,
            x + radiusX * 0.45, y,
            x + radiusX, y);

        endShape(CLOSE);
    }

    draw() {
        // Only draw if revealed (for circular reveal animation)
        if (!this.firstReveal) {
            return;
        }

        // Set color if available
        if (this.baseColor) {
            fill(this.baseColor[0], this.baseColor[1], this.baseColor[2]);
        }

        // Calculate offsets to center the scaling for both width and height
        const widthDiff = this.baseWidth - this.currentWidth;
        const heightDiff = this.baseHeight - this.currentHeight;
        const adjustedX = this.x + widthDiff / 2;
        const adjustedY = this.y + heightDiff / 2;

        // Always use noise-modified properties
        this.drawRoundedRect(adjustedX, adjustedY, this.currentWidth, this.currentHeight,
            this.currentRoundnessX, this.currentRoundnessY);
    }

    // Utility method to convert hex to RGB array
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 255, 255];
    }

    // Set graphics color for this rectangle
    setGraphicsColor(colorHex) {
        // Convert hex color to RGB array
        this.baseColor = this.hexToRgb(colorHex);
    }
}