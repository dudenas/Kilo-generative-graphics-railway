// Simplified Grid class - delegates complex calculations to math modules
class Grid {
    constructor(baseWidth = 100, baseHeight = 128, zoom = 1.0) {
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.zoom = zoom;
        this.offsetX = 0;
        this.offsetY = 0;
        this.rectangles = [];
        this.updateDimensions();
    }

    updateDimensions(canvasWidth = null, canvasHeight = null) {
        // Use provided dimensions or p5.js globals
        const w = canvasWidth !== null ? canvasWidth : width;
        const h = canvasHeight !== null ? canvasHeight : height;



        // Calculate actual dimensions - maintain original ratio
        this.rectWidth = this.baseWidth * this.zoom;
        this.rectHeight = this.baseHeight * this.zoom;

        // Update offset using math module
        const offset = ZoomCalculator.calculateCenterOffset(
            w / 2, h / 2,
            this.baseWidth, this.baseHeight,
            this.zoom
        );
        this.offsetX = offset.x;
        this.offsetY = offset.y;

        this.createGrid(w, h);
    }

    createGrid(canvasWidth = null, canvasHeight = null) {
        this.rectangles = [];

        // Use provided dimensions or p5.js globals
        const w = canvasWidth !== null ? canvasWidth : width;
        const h = canvasHeight !== null ? canvasHeight : height;

        // Check if reveal animation has ever completed (global variable from sketch.js)
        const shouldRevealAll = typeof revealAnimation !== 'undefined' && revealAnimation.hasEverCompleted;

        // Get grid bounds from calculator - pass current zoom for proper coverage
        const bounds = GridCalculator.calculateGridBounds(
            w, h,
            this.baseWidth, this.baseHeight,
            this.zoom
        );

        // Create rectangles
        for (let row = bounds.startRow; row < bounds.startRow + bounds.rows; row++) {
            for (let col = bounds.startCol; col < bounds.startCol + bounds.cols; col++) {
                let x = col * this.rectWidth + this.offsetX;
                let y = row * this.rectHeight + this.offsetY;

                // Check if potentially visible using bounds checker
                if (BoundsChecker.isRectangleVisible(x, y, this.rectWidth, this.rectHeight, w, h)) {
                    const rectangle = new Rectangle(x, y, this.rectWidth, this.rectHeight);

                    // Calculate distance from canvas center for reveal animation
                    const centerX = w / 2;
                    const centerY = h / 2;
                    const rectCenterX = x + this.rectWidth / 2;
                    const rectCenterY = y + this.rectHeight / 2;
                    rectangle.distanceFromCenter = Math.sqrt(
                        (rectCenterX - centerX) * (rectCenterX - centerX) +
                        (rectCenterY - centerY) * (rectCenterY - centerY)
                    );

                    // If reveal animation has completed, immediately reveal all rectangles
                    // This prevents graphics from disappearing when zoom changes
                    if (shouldRevealAll) {
                        rectangle.firstReveal = true;
                    }

                    this.rectangles.push(rectangle);
                }
            }
        }
    }

    setZoom(zoomLevel) {
        this.zoom = GridConfig.clampZoom(zoomLevel);
        this.updateDimensions();
    }

    getZoom() {
        return this.zoom;
    }

    zoomIn(factor = 0.1) {
        this.setZoom(this.zoom - factor);
    }

    zoomOut(factor = 0.1) {
        this.setZoom(this.zoom + factor);
    }

    draw(noiseCalculator = null, noiseConfig = null, frameCount = 0, imageProcessor = null, brightnessProcessor = null, mode = 'noise') {


        // Handle different drawing modes
        if (mode === 'brightness' && brightnessProcessor && brightnessProcessor.hasProcessedData()) {
            // Brightness mode - use brightness values for scaling
            let maskedCount = 0;

            for (let rectangle of this.rectangles) {
                // Always set base color to current graphics color
                rectangle.setBaseColor(currentSwatch.graphics);

                // Get brightness data for this rectangle
                const brightnessData = brightnessProcessor.getBrightnessForRectangleDetailed(rectangle);
                if (brightnessData && !brightnessData.visible) {
                    maskedCount++;
                }

                // Update brightness height
                rectangle.updateBrightnessHeight(brightnessProcessor, brightnessData);

                // Draw with brightness properties
                rectangle.draw();
            }


        } else if (noiseCalculator && noiseConfig && (mode === 'noise' || mode === 'icon')) {
            // Noise mode or Icon mode - use noise for scaling
            const z = noiseConfig.getCurrentZ(frameCount);
            let maskedCount = 0; // Count how many rectangles get masked

            for (let rectangle of this.rectangles) {
                // Always set base color to current graphics color
                rectangle.setBaseColor(currentSwatch.graphics);

                // Get icon mask data if processor is available (for icon mode)
                let iconMask = null;
                if (mode === 'icon' && imageProcessor && imageProcessor.hasProcessedData()) {
                    // Use detailed sampling for better accuracy with small grid cells
                    iconMask = imageProcessor.getIconMaskForRectangleDetailed(rectangle);
                    if (iconMask && !iconMask.visible) {
                        maskedCount++;
                    }
                }

                // Update noise height with optional icon mask
                rectangle.updateNoiseHeight(noiseCalculator, z, noiseConfig, frameCount, iconMask);

                // Draw with noise properties
                rectangle.draw();
            }


        } else {
            // Fallback - regular drawing without any processing
            for (let rectangle of this.rectangles) {
                // Always set base color to current graphics color
                rectangle.setBaseColor(currentSwatch.graphics);
                rectangle.draw();
            }
        }
    }

    getCount() {
        return this.rectangles.length;
    }

    getVisibleCount() {
        return BoundsChecker.countVisibleRectangles(this.rectangles, width, height);
    }

    // Count rectangles with non-zero values (currentHeight > 0) that are also visible
    getNonZeroCount() {
        let nonZeroCount = 0;
        for (let rectangle of this.rectangles) {
            if (rectangle.currentHeight > 0 && rectangle.isVisible(width, height)) {
                nonZeroCount++;
            }
        }
        return nonZeroCount;
    }

    // Set graphics color for all rectangles
    setGraphicsColor(colorHex) {
        for (let rectangle of this.rectangles) {
            rectangle.setGraphicsColor(colorHex);
        }
    }
}