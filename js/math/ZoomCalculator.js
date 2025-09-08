// Handles all zoom-related calculations
class ZoomCalculator {
    // Calculate offset to keep center point fixed during zoom
    static calculateCenterOffset(centerX, centerY, baseWidth, baseHeight, zoom) {
        // Calculate which grid cell the center would be in at zoom level 1.0
        const baseCenterCol = centerX / baseWidth;
        const baseCenterRow = centerY / baseHeight;

        // Calculate where that same grid cell should be positioned at current zoom
        const rectWidth = baseWidth * zoom;
        const rectHeight = baseHeight * zoom;
        const targetCenterX = baseCenterCol * rectWidth;
        const targetCenterY = baseCenterRow * rectHeight;

        // Calculate offset to keep the center point fixed
        return {
            x: centerX - targetCenterX,
            y: centerY - targetCenterY
        };
    }
}