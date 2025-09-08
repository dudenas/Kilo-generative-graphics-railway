// Handles visibility and bounds checking calculations
class BoundsChecker {
    // Check if a rectangle is visible within canvas bounds
    static isRectangleVisible(x, y, width, height, canvasWidth, canvasHeight) {
        return x + width >= -width &&
            y + height >= -height &&
            x < canvasWidth + width &&
            y < canvasHeight + height;
    }

    // Count visible rectangles in a collection
    static countVisibleRectangles(rectangles, canvasWidth, canvasHeight) {
        let visibleCount = 0;
        for (let rectangle of rectangles) {
            if (rectangle.isVisible(canvasWidth, canvasHeight)) {
                visibleCount++;
            }
        }
        return visibleCount;
    }

    // Check if point is within bounds
    static isPointInBounds(x, y, width, height) {
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    // Get visible area of a rectangle within canvas
    static getVisibleArea(rect, canvasWidth, canvasHeight) {
        const left = Math.max(0, rect.x);
        const top = Math.max(0, rect.y);
        const right = Math.min(canvasWidth, rect.x + rect.width);
        const bottom = Math.min(canvasHeight, rect.y + rect.height);

        if (right <= left || bottom <= top) return 0;
        return (right - left) * (bottom - top);
    }
}