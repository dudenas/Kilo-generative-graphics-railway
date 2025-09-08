// About Modal functionality
class AboutModal {
    constructor() {
        this.modal = document.getElementById('about-modal');
        this.aboutButton = document.getElementById('about-button');
        this.closeButton = document.querySelector('.modal-close');
        this.overlay = document.querySelector('.modal-overlay');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Open modal when About button is clicked
        if (this.aboutButton) {
            this.aboutButton.addEventListener('click', () => {
                this.open();
            });
        }

        // Close modal when X button is clicked
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => {
                this.close();
            });
        }

        // Close modal when overlay is clicked
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.close();
            });
        }

        // Close modal when Escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Initialize tab functionality
        this.initializeTabs();
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Show corresponding tab content
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            // Hide the About button when modal is open
            if (this.aboutButton) {
                this.aboutButton.classList.add('hidden');
            }
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            console.log('About modal opened');
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            // Show the About button again when modal is closed
            if (this.aboutButton) {
                this.aboutButton.classList.remove('hidden');
            }
            // Restore background scrolling
            document.body.style.overflow = '';
            console.log('About modal closed');
        }
    }

    isOpen() {
        return this.modal && !this.modal.classList.contains('hidden');
    }
}