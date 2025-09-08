// Logo Loader Animation - plays PNG sequence at startup
class LogoLoader {
    constructor() {
        this.container = document.getElementById('logo-loader');
        this.image = document.getElementById('logo-loader-image');
        this.currentFrame = 0;
        this.totalFrames = 100; // 00000 to 00099
        this.frameDuration = 50; // milliseconds per frame (20 FPS)
        this.isPlaying = false;
        this.animationInterval = null;
    }

    // Start the logo loader animation
    start() {
        if (!this.container || !this.image) {
            console.warn('LogoLoader: Elements not found');
            return;
        }

        // Show the loader
        this.container.classList.remove('hidden');
        this.currentFrame = 0;
        this.isPlaying = true;

        // Start the animation
        this.animationInterval = setInterval(() => {
            this.updateFrame();
        }, this.frameDuration);

        console.log('Logo loader animation started');
    }

    // Update to the next frame
    updateFrame() {
        if (!this.isPlaying) return;

        // Update the image source
        const frameNumber = String(this.currentFrame).padStart(5, '0');
        this.image.src = `resources/logo_loader/logo_loader_${frameNumber}.png`;

        this.currentFrame++;

        // Check if animation is complete
        if (this.currentFrame >= this.totalFrames) {
            this.complete();
        }
    }

    // Complete the animation and hide the loader
    complete() {
        this.isPlaying = false;

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        // Fade out and hide
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s ease-out';

        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.style.opacity = '1'; // Reset for potential future use
            this.container.style.transition = '';
            console.log('Logo loader animation completed and hidden');
        }, 500);
    }

    // Force hide the loader (for debugging or manual control)
    hide() {
        this.isPlaying = false;

        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        this.container.classList.add('hidden');
    }

    // Check if loader is currently playing
    isActive() {
        return this.isPlaying;
    }
}