// Noise configuration and parameters
class NoiseConfig {
    // Default noise parameters
    static NOISE_SCALE = 0.01; // How zoomed in the noise pattern is (affects X,Y,Z scaling)
    static NOISE_AMPLITUDE = 1.0; // How strong the noise effect is

    static Z_OFFSET = 0; // Starting Z position
    static NOISE_THRESHOLD = 0.0; // Minimum noise value to show (0-1, creates empty space)
    static ANIMATION_RANGE = 100; // How far to move through noise space for animation



    // Animation settings
    static ANIMATE_NOISE = true; // Whether to animate through Z-axis
    static LOOP_DURATION = 300; // Frames for one complete loop

    constructor() {
        // Instance parameters - can be modified per use
        this.scale = NoiseConfig.NOISE_SCALE;
        this.amplitude = NoiseConfig.NOISE_AMPLITUDE;

        this.zOffset = NoiseConfig.Z_OFFSET;
        this.threshold = NoiseConfig.NOISE_THRESHOLD;
        this.animationRange = NoiseConfig.ANIMATION_RANGE;

        // Animation
        this.animateNoise = NoiseConfig.ANIMATE_NOISE;
        this.loopDuration = NoiseConfig.LOOP_DURATION;
        this.animationSpeed = 1.0; // Speed multiplier for animation
    }

    // Get circular coordinates for seamless constant-speed animation
    getCircularCoords(frameCount) {
        if (!this.animateNoise) return {
            z: this.zOffset,
            w: 0
        };

        const adjustedFrameCount = frameCount * this.animationSpeed;
        const progress = (adjustedFrameCount % this.loopDuration) / this.loopDuration;
        const angle = progress * Math.PI * 2; // Full circle
        const radius = this.animationRange / 2;

        return {
            z: this.zOffset + Math.cos(angle) * radius,
            w: Math.sin(angle) * radius
        };
    }

    // Get 4D coordinates for seamless circular loop (like the example)
    get4DCoords(frameCount) {
        if (!this.animateNoise) return {
            z: this.zOffset,
            w: 0
        };

        // Perfect looping: simple frame-based progression
        const progress = (frameCount % this.loopDuration) / this.loopDuration;
        const angle = progress * Math.PI * 2; // Full circle

        // Debug logging
        if (frameCount < 5 || progress < 0.02 || progress > 0.98) {
            console.log(`Frame ${frameCount}: progress=${progress.toFixed(4)}, range=${this.animationRange}`);
        }

        // Use circular motion in 4D space for seamless loop
        // Scale radius based on animation length for more dramatic longer animations
        const lengthMultiplier = this.loopDuration / 300; // 300 is the base length
        const radius = (this.animationRange / 2) * lengthMultiplier;

        return {
            z: this.zOffset + Math.cos(angle) * radius, // Z coordinate of circle
            w: Math.sin(angle) * radius // W coordinate of circle
        };
    }

    // Legacy methods for compatibility
    getCurrentZ(frameCount) {
        return this.get4DCoords(frameCount).z;
    }

    getCurrentW(frameCount) {
        return this.get4DCoords(frameCount).w;
    }

    // Update parameters dynamically
    updateScale(newScale) {
        this.scale = newScale;
    }

    updateAmplitude(newAmplitude) {
        this.amplitude = newAmplitude;
    }

    updateThreshold(newThreshold) {
        this.threshold = Math.max(0, Math.min(0.99, newThreshold)); // Clamp 0-0.99
    }
}