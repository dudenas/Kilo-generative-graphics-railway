// Handles shared image upload for both Icon and Image modes
class SharedImageUploader {
    constructor() {
        this.uploadedImage = null;
        this.callbacks = {};
        this.elements = {};
    }

    init() {
        // Get references to shared upload elements
        this.elements = {
            fileInput: document.getElementById('shared-image-file-input'),
            uploadButton: document.getElementById('shared-image-upload-button'),
            preview: document.getElementById('shared-image-preview-img'),
            previewContainer: document.getElementById('shared-image-preview'),
            clearButton: document.getElementById('shared-image-clear')
        };

        // Check if elements exist
        for (let [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`SharedImageUploader: Element '${key}' not found`);
            }
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Upload button click (handles both upload and clear)
        if (this.elements.uploadButton) {
            this.elements.uploadButton.addEventListener('click', () => {
                if (this.hasImage()) {
                    // If image is loaded, clear it
                    this.clearImage();
                } else {
                    // If no image, open file dialog
                    if (this.elements.fileInput) {
                        this.elements.fileInput.click();
                    }
                }
            });
        }

        // File input change
        if (this.elements.fileInput) {
            this.elements.fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleFileSelect(e.target.files[0]);
                    e.target.value = '';
                }
            });
        }

        // Clear button (legacy - no longer used)
        if (this.elements.clearButton) {
            this.elements.clearButton.addEventListener('click', () => {
                this.clearImage();
            });
        }
    }

    handleFileSelect(file) {
        if (!file) return;

        console.log('Processing shared image file:', file.name);

        // Clear existing image
        if (this.uploadedImage) {
            console.log('Clearing existing shared image before loading new one');
            this.clearImageWithoutReset();
        }

        // Validate file type
        if (!this.isValidImageFile(file)) {
            alert('Please upload a valid image file (PNG, JPG, JPEG, GIF, SVG)');
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size too large. Please upload an image smaller than 5MB.');
            return;
        }

        this.loadImage(file);
    }

    isValidImageFile(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml'];
        return validTypes.includes(file.type);
    }

    loadImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                this.uploadedImage = img;
                this.showPreview(e.target.result);
                this.triggerCallback('imageLoaded', {
                    image: img,
                    file: file,
                    width: img.width,
                    height: img.height
                });
            };

            img.onerror = () => {
                alert('Error loading image. Please try a different file.');
            };

            img.src = e.target.result;
        };

        reader.onerror = () => {
            alert('Error reading file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    showPreview(imageSrc) {
        if (this.elements.preview) {
            this.elements.preview.src = imageSrc;
        }

        if (this.elements.previewContainer) {
            this.elements.previewContainer.style.display = 'block';
        }

        // Change button to green "Clear Image" mode
        if (this.elements.uploadButton) {
            this.elements.uploadButton.textContent = 'Clear Image';
            this.elements.uploadButton.classList.add('clear-mode');
        }

        // Hide legacy clear button if it exists
        if (this.elements.clearButton) {
            this.elements.clearButton.style.display = 'none';
        }
    }

    clearImage() {
        this.uploadedImage = null;

        if (this.elements.preview) {
            this.elements.preview.src = '';
        }

        if (this.elements.previewContainer) {
            this.elements.previewContainer.style.display = 'none';
        }

        // Change button back to "Choose Image" mode
        if (this.elements.uploadButton) {
            this.elements.uploadButton.textContent = 'Choose Image';
            this.elements.uploadButton.classList.remove('clear-mode');
        }

        // Hide legacy clear button if it exists
        if (this.elements.clearButton) {
            this.elements.clearButton.style.display = 'none';
        }

        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }

        this.triggerCallback('imageCleared');
    }

    // Clear image without triggering canvas reset (used when loading a new image)
    clearImageWithoutReset() {
        this.uploadedImage = null;

        if (this.elements.preview) {
            this.elements.preview.src = '';
        }

        if (this.elements.previewContainer) {
            this.elements.previewContainer.style.display = 'none';
        }

        // Reset button to "Choose Image" mode
        if (this.elements.uploadButton) {
            this.elements.uploadButton.textContent = 'Choose Image';
            this.elements.uploadButton.classList.remove('clear-mode');
        }

        if (this.elements.fileInput) {
            this.elements.fileInput.value = '';
        }

        // Trigger callback with skipCanvasReset flag
        this.triggerCallback('imageCleared', {
            skipCanvasReset: true
        });
    }

    // Register callback for image events
    onImageEvent(eventName, callback) {
        this.callbacks[eventName] = callback;
    }

    // Trigger callback if it exists
    triggerCallback(eventName, data = null) {
        if (this.callbacks[eventName]) {
            this.callbacks[eventName](data);
        }
    }

    // Check if image is loaded
    hasImage() {
        return this.uploadedImage !== null;
    }

    // Get the uploaded image element
    getImage() {
        return this.uploadedImage;
    }

    // Get current image info
    getImageInfo() {
        if (!this.uploadedImage) return null;

        return {
            width: this.uploadedImage.width,
            height: this.uploadedImage.height,
            hasData: true
        };
    }
}