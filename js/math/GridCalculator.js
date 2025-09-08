// Handles grid layout and positioning calculations
class GridCalculator {
    // Calculate grid bounds that work for all zoom levels
    static calculateGridBounds(canvasWidth, canvasHeight, baseWidth, baseHeight, currentZoom = null) {
        const config = GridConfig.getBounds();

        // Use current zoom if provided, otherwise use minZoom for maximum coverage
        const zoomForCalculation = currentZoom || config.minZoom;

        // Calculate grid bounds that ensure full canvas coverage
        const maxCols = Math.ceil(canvasWidth / (baseWidth * zoomForCalculation)) + config.extraCells;
        const maxRows = Math.ceil(canvasHeight / (baseHeight * zoomForCalculation)) + config.extraCells;

        // Calculate starting positions to center the grid
        const startCol = -Math.ceil(maxCols / 2);
        const startRow = -Math.ceil(maxRows / 2);

        return {
            cols: maxCols,
            rows: maxRows,
            startCol: startCol,
            startRow: startRow
        };
    }

    // Calculate how many cells fit in given dimensions
    static calculateCellCount(width, height, cellWidth, cellHeight) {
        const cols = Math.ceil(width / cellWidth);
        const rows = Math.ceil(height / cellHeight);
        return {
            cols,
            rows,
            total: cols * rows
        };
    }

    // Calculate grid density (cells per square unit)
    static calculateDensity(cellWidth, cellHeight) {
        return 1 / (cellWidth * cellHeight);
    }
}