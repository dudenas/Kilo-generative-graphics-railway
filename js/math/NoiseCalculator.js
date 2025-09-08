// Handles noise calculations and utilities
class NoiseCalculator {
    constructor() {
        // Initialize noise seed for consistent patterns
        this.initNoise();
    }

    initNoise() {
        // OpenSimplex noise will be initialized globally in setup()
    }

    // Get 4D OpenSimplex noise value for seamless circular motion
    getNoise4D(x, y, z, w, scale = 0.01) {
        // Use global OpenSimplex noise instance
        const noiseVal = openSimplexNoise.noise4D(x * scale, y * scale, z * scale, w * scale);
        // OpenSimplex returns -1 to 1, convert to 0 to 1
        return (noiseVal + 1) * 0.5;
    }

    // Get noise value for color variation with seamless 4D loop
    getColorNoise(x, y, z, config, frameCount = 0) {
        // Get 4D coordinates for seamless circular motion
        const coords4D = config.get4DCoords ? config.get4DCoords(frameCount) : {
            z: z,
            w: 0
        };

        // Use 4D noise with circular time coordinates for seamless loop
        const noiseVal = this.getNoise4D(x, y, coords4D.z, coords4D.w, config.scale);
        return noiseVal; // Already 0-1 range
    }

    // Get noise-modified color with threshold
    getNoiseColor(baseColor, x, y, z, config, frameCount = 0) {
        const noiseVal = this.getColorNoise(x, y, z, config, frameCount);

        // Apply threshold to create empty space
        if (noiseVal < config.threshold) {
            return [0, 0, 0]; // Empty/black
        }

        // Remap remaining values (threshold to 1.0) back to (0 to 1.0)
        const remappedNoise = (noiseVal - config.threshold) / (1.0 - config.threshold);

        return [
            Math.floor(baseColor[0] * remappedNoise),
            Math.floor(baseColor[1] * remappedNoise),
            Math.floor(baseColor[2] * remappedNoise)
        ];
    }
}