// Base Shape class for all drawable objects
class Shape {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // Abstract method - to be implemented by subclasses
    draw() {
        throw new Error('draw() method must be implemented by subclass');
    }

    // Check if shape is visible within given bounds
    isVisible(canvasWidth, canvasHeight) {
        return this.x < canvasWidth &&
            this.y < canvasHeight &&
            this.x + this.width > 0 &&
            this.y + this.height > 0;
    }

    // Get center point of the shape
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}