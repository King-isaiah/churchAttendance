// QR Code Scanner functionality
class QRCodeScanner {
    constructor() {
        // console.log('QRCodeScanner constructor called');
        // console.log('Html5Qrcode available:', typeof Html5Qrcode);
        
        this.scanner = null;
        this.isScanning = false;
        this.modal = null;
        this.isLibraryLoaded = typeof Html5Qrcode !== 'undefined';
        
        if (this.isLibraryLoaded) {
            console.log('Library loaded, initializing scanner...');
            this.init();
        } else {
            console.error('HTML5 QR Code library not loaded - Html5Qrcode is undefined');
            showError('QR scanner library failed to load. Please check your internet connection and refresh the page.');
        }
    }

    init() {
        console.log('Initializing QR scanner...');
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Check if modal already exists
        if (this.modal) return;

        // Create QR scanner modal
        this.modal = document.createElement('div');
        this.modal.className = 'qr-scanner-modal';
        this.modal.style.display = 'none'; // Start hidden
        this.modal.innerHTML = `
            <div class="qr-scanner-content">
                <div class="qr-scanner-header">
                    <h3>Scan QR Code</h3>
                    <button class="close-scanner">&times;</button>
                </div>
                <div class="qr-scanner-body">
                    <div id="qr-reader" style="width: 100%"></div>
                    <div class="scanning-overlay">
                        <div class="scanning-line"></div>
                    </div>
                    <div class="scanner-instructions">
                        <p>Point your camera at the QR code to scan</p>
                    </div>
                </div>
                <div class="qr-scanner-footer">
                    <button class="btn-secondary toggle-camera">Switch Camera</button>
                    <button class="btn-primary torch-toggle">Toggle Flash</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
    }

    setupModalEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-scanner');
        const toggleCameraBtn = this.modal.querySelector('.toggle-camera');
        const torchToggleBtn = this.modal.querySelector('.torch-toggle');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScanner());
        }
        if (toggleCameraBtn) {
            toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        }
        if (torchToggleBtn) {
            torchToggleBtn.addEventListener('click', () => this.toggleTorch());
        }

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeScanner();
            }
        });
    }

    setupEventListeners() {
        // Escape key to close scanner
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) {
                this.closeScanner();
            }
        });
    }

    openScanner() {
        console.log('openScanner called, library loaded:', this.isLibraryLoaded);
        
        if (this.isScanning) {
            console.log('Scanner already running');
            return;
        }

        if (!this.isLibraryLoaded) {
            console.error('Library not loaded when opening scanner');
            showError('QR scanner is not available. The scanning library failed to load.');
            return;
        }

        // Ensure modal is created
        if (!this.modal) {
            console.log('Creating modal...');
            this.createModal();
        }

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            if (this.modal) {
                console.log('Showing modal and starting scanner...');
                this.modal.style.display = 'flex';
                this.isScanning = true;
                
                // Initialize the QR scanner
                this.initializeScanner();
                
                showSuccess('QR scanner activated. Point camera at QR code.');
            } else {
                console.error('Modal not created properly');
                showError('Scanner interface failed to load.');
            }
        }, 100);
    }

    // NEW: Get available cameras and use front camera
   async getCameras() {
    try {
        const cameras = await Html5Qrcode.getCameras();
        console.log('Available cameras:', cameras);
        return cameras;
    } catch (err) {
        // Log the error details to the console
        console.error('Error getting cameras:', err);

        // Enhanced error handling
        if (err.name === 'NotAllowedError') {
            showError('Camera access denied. Please allow camera permissions in your browser settings and refresh the page.');
        } else if (err.name === 'NotFoundError') {
            showError('No cameras found on this device. Check your hardware connection.');
        } else if (err.name === 'NotSupportedError') {
            showError('This device or browser does not support camera access.');
        } else if (err.name === 'NotReadableError') {
            showError('Camera is already in use by another application. Please close other apps and try again.');
        } else if (err.message && err.message.includes('permission')) {
            showError('Permission error: ' + err.message);
        } else {
            showError('Cannot access camera list: ' + (err.message || 'Unknown error'));
        }

        // Return an empty array in case of error
        return [];
    }
}
// Cannot access camera list: Unknown error
// Error: Failed to start camera: Unknown error 241
    // NEW: Find front camera
    findFrontCamera(cameras) {
        // Try to find front-facing camera
        const frontCamera = cameras.find(cam => 
            cam.label.toLowerCase().includes('front') || 
            cam.label.toLowerCase().includes('face') ||
            cam.label.includes('1') || // Often front camera is camera 1
            (cam.label.toLowerCase().includes('back') === true) // Not back camera
        );
        
        return frontCamera || cameras[0]; // Use front camera or first available
    }

    // UPDATED: Start with front camera by default
    async startScanner(cameraId = null) {
        if (!this.scanner) {
            this.scanner = new Html5Qrcode("qr-reader");
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        let cameraConfig;
        
        if (cameraId) {
            // Use specific camera if provided
            cameraConfig = { deviceId: { exact: cameraId } };
        } else {
            // Try to get cameras and use front camera
            try {
                const cameras = await this.getCameras();
                if (cameras.length > 0) {
                    const frontCamera = this.findFrontCamera(cameras);
                    cameraConfig = { deviceId: { exact: frontCamera.id } };
                    console.log('Using camera:', frontCamera.label);
                } else {
                    // Fallback to environment mode if no cameras found
                    cameraConfig = { facingMode: "user" }; // "user" is front camera
                    console.log('No cameras found, using facingMode: user');
                }
            } catch (err) {
                // Fallback if camera detection fails
                cameraConfig = { facingMode: "user" }; // "user" is front camera
                console.log('Camera detection failed, using facingMode: user');
            }
        }

        console.log('Camera config:', cameraConfig);
        
        try {
            const result = await this.scanner.start(
                cameraConfig,
                config,
                this.onScanSuccess.bind(this),
                this.onScanFailure.bind(this)
            );
            console.log('Camera started successfully');
            return result;
        } catch (err) {
            console.error('Camera start failed:', err);
            throw err;
        }
    }

    // UPDATED: Initialize scanner with front camera
    initializeScanner() {
        if (!this.isLibraryLoaded) {
            showError('QR scanning library not loaded.');
            return;
        }

        showSuccess('Starting camera with front camera preference...');
        
        this.startScanner().catch(err => {
            // console.error('Camera start error details:', err);
            // console.error('Error name:', err?.name);
            // console.error('Error message:', err?.message);
            if (err?.name === 'NotAllowedError') {
                showError('Camera access denied. Please allow camera permissions in your browser settings and refresh the page. 299');
            } else if (err?.name === 'NotFoundError') {
                showError('No camera found on this device. 231');
            } else if (err?.name === 'NotSupportedError') {
                showError('Camera not supported on this device or browser. 233');
            } else if (err?.name === 'NotReadableError') {
                showError('Camera is already in use by another application. Close other camera apps and try again. 235');
            }else if (err?.message?.includes('HTTPS') || window.location.protocol !== 'https:') {
                showError('Camera access requires HTTPS. Please use a secure connection (https://). Current protocol: ' + window.location.protocol);
            }  else if (err?.message?.includes('permission')) {
                showError('Camera permission denied. Please check your browser settings and allow camera access for this site. 239');
            } else {
                showError('Failed to start camera: ' + (err?.message || 'Unknown error 241'));
            }
            
            this.closeScanner();
        });
    }

// Error: Cannot access camera list: Unknown error
    onScanSuccess(decodedText, decodedResult) {
        // Stop scanning once successful
        this.stopScanner();
        
        showSuccess('QR Code scanned successfully!');
        
        // Process the scanned data
        this.processScannedData(decodedText);
        
        // Close scanner after short delay
        setTimeout(() => {
            this.closeScanner();
        }, 1000);
    }

    onScanFailure(error) {
        // Failure callbacks are normal during scanning process
        // Only show errors for actual issues, not normal scanning process
        if (error && !error.includes('No QR code found')) {
            console.log('Scanning in progress...');
        }
    }

    processScannedData(scannedData) {
        try {
            // Parse the QR code data (assuming it's JSON)
            const qrData = JSON.parse(scannedData);
            
            // Validate the data structure
            if (this.validateQRData(qrData)) {
                this.submitAttendance(qrData);
            } else {
                showError('Invalid QR code format');
            }
        } catch (error) {
            // If not JSON, treat as simple activity ID
            this.submitAttendance({ activity_id: scannedData });
        }
    }

    validateQRData(qrData) {
        return qrData && qrData.activity_id;
    }

    async submitAttendance(attendanceData) {
        try {
            const response = await fetch('class/ApiHandler.php?action=submitAttendance&entity=attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(attendanceData)
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('Attendance recorded successfully!');
            } else {
                showError(result.message || 'Failed to record attendance');
            }
        } catch (error) {
            showError('Network error while submitting attendance');
        }
    }

    async toggleCamera() {
        if (!this.scanner || !this.isScanning) return;

        try {
            const currentCamera = await this.scanner.getRunningTrackCameraId();
            const cameras = await this.getCameras();
            
            if (cameras.length < 2) {
                showInfo('Only one camera available');
                return;
            }

            // Find current camera index
            const currentIndex = cameras.findIndex(cam => cam.id === currentCamera);
            const nextIndex = (currentIndex + 1) % cameras.length;
            const nextCamera = cameras[nextIndex];

            // Restart with new camera
            await this.stopScanner();
            await this.startScanner(nextCamera.id);
            
            showSuccess(`Switched to ${nextCamera.label}`);
        } catch (error) {
            console.error('Error switching camera:', error);
            showError('Failed to switch camera');
        }
    }

    async toggleTorch() {
        // Torch functionality would depend on specific browser/device support
        showInfo('Flash toggle not supported on this device');
    }

    async stopScanner() {
        if (this.scanner && this.isScanning) {
            try {
                await this.scanner.stop();
                this.isScanning = false;
                console.log('Scanner stopped successfully');
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
    }

    closeScanner() {
        this.stopScanner();
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        this.isScanning = false;
        console.log('Scanner closed');
    }

    // Cleanup method
    destroy() {
        this.closeScanner();
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}