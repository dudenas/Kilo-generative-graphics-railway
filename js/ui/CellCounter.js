// Handles cell counting logic and display
class CellCounter {
    constructor(elementId = 'cell-count') {
        this.elementId = elementId;
        this.element = null;
        this.init();
    }

    init() {
        this.element = document.getElementById(this.elementId);
        if (!this.element) {
            console.warn(`CellCounter: Element with id '${this.elementId}' not found`);
        }
    }

    // Update the display with current count
    updateDisplay(count) {
        if (this.element) {
            this.element.textContent = count + AppConstants.CELL_COUNT_SUFFIX;
        }
    }

    // Update with visible count from grid
    updateFromGrid(grid) {
        const count = grid.getVisibleCount();
        this.updateDisplay(count);
    }

    // Update with non-zero count from grid (cells with value > 0)
    updateFromGridNonZero(grid) {
        const count = grid.getNonZeroCount();
        this.updateDisplayFormatted(count);
    }

    // Format large numbers nicely
    formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    // Update with formatted display
    updateDisplayFormatted(count) {
        if (this.element) {
            this.element.textContent = this.formatCount(count) + AppConstants.CELL_COUNT_SUFFIX;
        }
    }
}