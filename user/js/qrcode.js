// QR Code Scanner functionality using jsQR library
class QRCodeScanner {
    // constructor() {
    //     console.log('QRCodeScanner constructor called - Using jsQR Library');
        
    //     this.scanner = null;
    //     this.isScanning = false;
    //     this.modal = null;
    //     this.videoElement = null;
    //     this.canvasElement = null;
    //     this.canvasContext = null;
    //     this.mediaStream = null;
    //     this.currentCameraId = null;
    //     this.cameras = [];
    //     this.scanInterval = null;
    //     this.isFrontCamera = false;
    //     this.torchOn = false;
    //     this.lastScannedCode = null;
    //     this.scanCooldown = 2000;
    //     this.useFallback = false;
    //     this.currentActivityId = null;
        
    //     // Check for browser support
    //     this.isBrowserSupported = this.checkBrowserSupport();
        
    //     this.init();
    // }
    constructor() {
        console.log('QRCodeScanner constructor called - Using jsQR Library');
        
        this.scanner = null;
        this.isScanning = false;
        this.modal = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasContext = null;
        this.mediaStream = null;
        this.currentCameraId = null;
        this.cameras = [];
        this.scanInterval = null;
        this.isFrontCamera = false;
        this.torchOn = false;
        this.lastScannedCode = null;
        this.scanCooldown = 2000;
        this.useFallback = false;
        this.currentActivityId = null;
        this.canvasDrawn = false; // ADD THIS LINE
        
        // Check for browser support
        this.isBrowserSupported = this.checkBrowserSupport();
        
        this.init();
    }
    


    // Check browser support
    checkBrowserSupport() {
        const hasMediaDevices = 'mediaDevices' in navigator;
        const hasGetUserMedia = hasMediaDevices && 'getUserMedia' in navigator.mediaDevices;
        const hasOldGetUserMedia = 'getUserMedia' in navigator || 
                                  'webkitGetUserMedia' in navigator || 
                                  'mozGetUserMedia' in navigator;
        
        return hasGetUserMedia || hasOldGetUserMedia;
    }

    // Load jsQR library
    loadJsQR() {
        if (typeof jsQR !== 'undefined') {
            console.log('jsQR already loaded');
            return Promise.resolve();
        }

        console.log('Loading jsQR library...');
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
            script.onload = () => {
                console.log('jsQR library loaded successfully');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load jsQR library');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    init() {
        console.log('Initializing QR scanner with jsQR...');
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        if (this.modal) return;

        // Create responsive modal
        this.modal = document.createElement('div');
        this.modal.className = 'qr-scanner-modal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: none;
            justify-content: center;
            align-items: center;
            touch-action: none;
        `;
        
        this.modal.innerHTML = `
            <div class="qr-scanner-content" style="
                background: #111;
                border-radius: 0;
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">
                <div class="qr-scanner-header" style="
                    padding: 20px 16px 16px;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <h3 style="margin: 0; color: white; font-size: 18px;">Scan QR Code</h3>
                    <button class="close-scanner" style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: white;
                        padding: 8px;
                        width: 44px;
                        height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                
                <div class="qr-scanner-body" style="
                    padding: 0;
                    flex: 1;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <div id="qr-reader-native" style="flex: 1; position: relative; background: #000;">
                        <video id="qr-video" autoplay playsinline muted style="
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                            display: block;
                        "></video>
                        <canvas id="qr-canvas" style="display: none;"></canvas>
                        
                        <div class="scanning-overlay" style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            pointer-events: none;
                        ">
                            <div style="
                                position: absolute;
                                top: 20%;
                                left: 15%;
                                right: 15%;
                                bottom: 40%;
                                border: 2px solid #00ff00;
                                border-radius: 16px;
                            ">
                                <div style="
                                    position: absolute;
                                    top: -2px;
                                    left: -2px;
                                    width: 40px;
                                    height: 40px;
                                    border-top: 4px solid #00ff00;
                                    border-left: 4px solid #00ff00;
                                    border-radius: 8px 0 0 0;
                                "></div>
                                <div style="
                                    position: absolute;
                                    top: -2px;
                                    right: -2px;
                                    width: 40px;
                                    height: 40px;
                                    border-top: 4px solid #00ff00;
                                    border-right: 4px solid #00ff00;
                                    border-radius: 0 8px 0 0;
                                "></div>
                                <div style="
                                    position: absolute;
                                    bottom: -2px;
                                    left: -2px;
                                    width: 40px;
                                    height: 40px;
                                    border-bottom: 4px solid #00ff00;
                                    border-left: 4px solid #00ff00;
                                    border-radius: 0 0 0 8px;
                                "></div>
                                <div style="
                                    position: absolute;
                                    bottom: -2px;
                                    right: -2px;
                                    width: 40px;
                                    height: 40px;
                                    border-bottom: 4px solid #00ff00;
                                    border-right: 4px solid #00ff00;
                                    border-radius: 0 0 8px 0;
                                "></div>
                            </div>
                            
                            <div class="scanning-line" style="
                                position: absolute;
                                top: 20%;
                                left: 15%;
                                right: 15%;
                                height: 3px;
                                background: linear-gradient(to right, transparent, #00ff00, transparent);
                                animation: scanLine 2s infinite ease-in-out;
                            "></div>
                            
                            <div style="
                                position: absolute;
                                bottom: 25%;
                                left: 0;
                                right: 0;
                                text-align: center;
                                color: white;
                                padding: 16px;
                                font-size: 16px;
                            ">
                                <div style="margin-bottom: 8px;">📷</div>
                                <div>Position QR code inside the frame</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="file-upload-fallback" id="file-upload-fallback" style="
                        display: none; 
                        flex: 1; 
                        text-align: center; 
                        padding: 40px 20px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: #111;
                    ">
                        <div style="margin-bottom: 30px;">
                            <div style="font-size: 64px; color: #007bff; margin-bottom: 20px;">📷</div>
                            <h3 style="color: white; margin-bottom: 10px; font-size: 20px;">Upload QR Code</h3>
                            <p style="color: #aaa; font-size: 14px;">Take a photo or choose from gallery</p>
                        </div>
                        
                        <div style="width: 100%; max-width: 300px;">
                            <label for="qr-image-upload" style="
                                display: block;
                                padding: 20px;
                                background: #007bff;
                                color: white;
                                border-radius: 12px;
                                text-align: center;
                                font-size: 16px;
                                cursor: pointer;
                                margin-bottom: 20px;
                            ">
                                📁 Choose Image
                            </label>
                            <input type="file" id="qr-image-upload" accept="image/*" capture="environment" style="display: none;">
                            
                            <button id="upload-qr-btn" class="btn-primary" style="
                                width: 100%;
                                padding: 20px;
                                background: #28a745;
                                color: white;
                                border: none;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 16px;
                            ">
                                Upload & Scan
                            </button>
                        </div>
                    </div>
                    
                    <div class="scan-result" id="scan-result" style="
                        display: none;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.95);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                        z-index: 100;
                    ">
                        <div id="result-content" style="text-align: center; color: white;"></div>
                        <button id="scan-again-btn" style="
                            margin-top: 30px;
                            padding: 16px 32px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            font-size: 16px;
                            cursor: pointer;
                            display: none;
                        ">Scan Again</button>
                    </div>
                </div>
                
                <div class="qr-scanner-footer" style="
                    padding: 16px;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                    flex-shrink: 0;
                ">
                    <button class="btn-secondary toggle-camera" id="toggle-camera-btn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 14px 16px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        🔄 Switch Camera
                    </button>
                    
                    <button class="btn-primary torch-toggle" id="torch-toggle-btn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 14px 16px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        💡 Flash
                    </button>
                    
                    <button class="btn-secondary use-fallback" id="use-fallback-btn" style="
                        flex: 1;
                        min-width: 120px;
                        padding: 14px 16px;
                        background: rgba(255,255,255,0.1);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                        📁 Upload
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes scanLine {
                    0% { top: 20%; opacity: 0.8; }
                    50% { top: 80%; opacity: 1; }
                    100% { top: 20%; opacity: 0.8; }
                }
            </style>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
        
        this.videoElement = document.getElementById('qr-video');
        this.canvasElement = document.getElementById('qr-canvas');
        if (this.canvasElement) {
            this.canvasContext = this.canvasElement.getContext('2d');
        }
    }

    // SETUP MODAL EVENTS - THIS WAS MISSING!
    setupModalEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-scanner');
        const toggleCameraBtn = this.modal.querySelector('#toggle-camera-btn');
        const torchToggleBtn = this.modal.querySelector('#torch-toggle-btn');
        const fallbackBtn = this.modal.querySelector('#use-fallback-btn');
        const uploadBtn = this.modal.querySelector('#upload-qr-btn');
        const fileInput = this.modal.querySelector('#qr-image-upload');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScanner());
        }
        if (toggleCameraBtn) {
            toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        }
        if (torchToggleBtn) {
            torchToggleBtn.addEventListener('click', () => this.toggleTorch());
        }
        if (fallbackBtn) {
            fallbackBtn.addEventListener('click', () => this.toggleFallbackMode());
        }
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.triggerFileUpload());
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
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

    async openScanner(activityId = null) {
        console.log('openScanner called with activity:', activityId);
        
        if (this.isScanning) {
            console.log('Scanner already running');
            return;
        }

        this.currentActivityId = activityId;
        this.lastScannedCode = null;

        if (!this.modal) {
            this.createModal();
        }

        // Reset UI
        const scanResult = document.getElementById('scan-result');
        const fallbackSection = document.getElementById('file-upload-fallback');
        const qrReader = document.querySelector('#qr-reader-native');
        
        if (scanResult) scanResult.style.display = 'none';
        if (fallbackSection) fallbackSection.style.display = 'none';
        if (qrReader) qrReader.style.display = 'block';

        this.modal.style.display = 'flex';
        this.isScanning = true;
        
        // Check browser support
        if (!this.isBrowserSupported) {
            this.showFallbackMode();
            this.showError('Your browser does not support camera access.');
            return;
        }
        
        // Check secure context
        if (!this.isSecureContext()) {
            if (confirm('Camera access requires HTTPS. Switch to upload mode?')) {
                this.showFallbackMode();
                return;
            }
            this.closeScanner();
            return;
        }

        // Load jsQR
        await this.loadJsQR();
        
        // Initialize scanner
        await this.initializeScanner();
    }

    isSecureContext() {
        return window.isSecureContext || 
               window.location.protocol === 'https:' ||
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }

    showFallbackMode() {
        this.useFallback = true;
        const qrReader = document.querySelector('#qr-reader-native');
        const fallbackSection = document.getElementById('file-upload-fallback');
        
        if (qrReader) qrReader.style.display = 'none';
        if (fallbackSection) fallbackSection.style.display = 'flex';
        
        // Hide camera controls
        const toggleCameraBtn = document.getElementById('toggle-camera-btn');
        const torchBtn = document.getElementById('torch-toggle-btn');
        if (toggleCameraBtn) toggleCameraBtn.style.display = 'none';
        if (torchBtn) torchBtn.style.display = 'none';
    }

    toggleFallbackMode() {
        if (this.useFallback) {
            this.useFallback = false;
            this.showCameraMode();
        } else {
            this.showFallbackMode();
        }
    }

    showCameraMode() {
        this.useFallback = false;
        const qrReader = document.querySelector('#qr-reader-native');
        const fallbackSection = document.getElementById('file-upload-fallback');
        
        if (qrReader) qrReader.style.display = 'block';
        if (fallbackSection) fallbackSection.style.display = 'none';
        
        // Show camera controls
        const toggleCameraBtn = document.getElementById('toggle-camera-btn');
        const torchBtn = document.getElementById('torch-toggle-btn');
        if (toggleCameraBtn) toggleCameraBtn.style.display = 'flex';
        if (torchBtn) torchBtn.style.display = 'flex';
        
        // Restart camera if needed
        if (this.isScanning && !this.mediaStream) {
            this.initializeScanner();
        }
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('qr-image-upload');
        if (fileInput) {
            fileInput.click();
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showScanResult('Processing image...', 'loading');

        try {
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (e) => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    ctx.drawImage(img, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    this.decodeQRFromImageData(imageData);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.showScanResult('Error processing image', 'error');
        }
    }

    decodeQRFromImageData(imageData) {
        if (typeof jsQR !== 'undefined') {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code) {
                console.log("QR Code detected:", code.data);
                this.processScannedData(code.data);
            } else {
                this.showScanResult('No QR code found', 'error');
            }
        } else {
            this.showScanResult('QR decoder not available', 'error');
        }
    }

    async getCameras() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            this.cameras = videoDevices;
            return videoDevices;
        } catch (err) {
            console.error('Error getting cameras:', err);
            this.showError('Cannot access camera list');
            return [];
        }
    }

    async startCamera(constraints = null) {
        try {
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }
            
            const defaultConstraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: { ideal: 'environment' },
                    frameRate: { ideal: 30 }
                }
            };
            
            const finalConstraints = constraints || defaultConstraints;
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
            this.videoElement.srcObject = this.mediaStream;
            
            const track = this.mediaStream.getVideoTracks()[0];
            const settings = track.getSettings();
            this.currentCameraId = settings.deviceId;
            
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve).catch(reject);
                };
                this.videoElement.onerror = reject;
                
                setTimeout(() => {
                    if (this.videoElement.readyState >= 2) {
                        resolve();
                    }
                }, 1000);
            });
            
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
            
            this.showSuccess('Camera activated');
            return true;
            
        } catch (err) {
            console.error('Camera start failed:', err);
            this.handleCameraError(err);
            throw err;
        }
    }

    handleCameraError(err) {
        let errorMessage = 'Failed to start camera';
        
        if (err?.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (err?.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
        } else if (err?.message?.includes('HTTPS')) {
            errorMessage = 'Camera access requires HTTPS.';
        }
        
        this.showError(errorMessage);
        
        setTimeout(() => {
            const useFallback = confirm(errorMessage + '\n\nSwitch to upload mode?');
            if (useFallback) {
                this.showFallbackMode();
            } else {
                this.closeScanner();
            }
        }, 500);
    }

    async initializeScanner() {
        try {
            await this.startCamera();
            this.startQRScanning();
        } catch (err) {
            console.error('Scanner initialization failed:', err);
        }
    }

    // startQRScanning() {
    //     if (this.scanInterval) {
    //         clearInterval(this.scanInterval);
    //     }

    //     console.log('Starting QR scanning loop...');
        
    //     const scanFrame = () => {
    //         if (!this.isScanning || !this.videoElement || 
    //             this.videoElement.readyState < 2 || 
    //             !this.canvasContext) {
    //             return;
    //         }

    //         try {
    //             this.canvasContext.drawImage(
    //                 this.videoElement, 
    //                 0, 0, 
    //                 this.canvasElement.width, 
    //                 this.canvasElement.height
    //             );

    //             const imageData = this.canvasContext.getImageData(
    //                 0, 0, 
    //                 this.canvasElement.width, 
    //                 this.canvasElement.height
    //             );

    //             if (typeof jsQR !== 'undefined') {
    //                 const code = jsQR(
    //                     imageData.data, 
    //                     imageData.width, 
    //                     imageData.height, 
    //                     { inversionAttempts: "dontInvert" }
    //                 );

    //                 if (code) {
    //                     this.processScannedData(code.data);
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('Scanning error:', error);
    //         }
    //     };

    //     this.scanInterval = setInterval(scanFrame, 100);
    // }
// ===== ULTRA-FAST SCANNING LOOP =====
startQRScanning() {
    if (this.scanInterval) {
        clearInterval(this.scanInterval);
    }

    console.log('Starting ULTRA-FAST QR scanning loop...');
    
    let lastScanTime = 0;
    const SCAN_THROTTLE = 50; // Minimum 50ms between scans (20fps)
    
    const scanFrame = () => {
        if (!this.isScanning || !this.videoElement || 
            this.videoElement.readyState < 2 || 
            !this.canvasContext) {
            return;
        }

        // Throttle scanning to prevent CPU overload
        const now = Date.now();
        if (now - lastScanTime < SCAN_THROTTLE) {
            return;
        }
        lastScanTime = now;

        try {
            // OPTIMIZATION: Only draw to canvas when needed
            if (!this.canvasDrawn) {
                this.canvasContext.drawImage(
                    this.videoElement, 
                    0, 0, 
                    this.canvasElement.width, 
                    this.canvasElement.height
                );
                this.canvasDrawn = true;
            }

            // Get image data from canvas
            const imageData = this.canvasContext.getImageData(
                0, 0, 
                this.canvasElement.width, 
                this.canvasElement.height
            );

            // OPTIMIZATION: Use smaller region for faster scanning
            const scanRegion = this.getOptimalScanRegion(imageData);

            // Use jsQR to decode - ULTRA-FAST mode
            if (typeof jsQR !== 'undefined') {
                const code = jsQR(
                    scanRegion.data, 
                    scanRegion.width, 
                    scanRegion.height, 
                    {
                        inversionAttempts: "dontInvert",
                    }
                );

                if (code) {
                    console.log('QR Code INSTANTLY detected:', code.data);
                    this.processScannedData(code.data);
                    
                    // Clear canvas flag for next scan
                    this.canvasDrawn = false;
                }
            }
        } catch (error) {
            console.error('Scanning error:', error);
        }
    };

    // SCAN AT 60 FPS FOR INSTANT DETECTION (like Xender)
    this.scanInterval = setInterval(scanFrame, 16); // 16ms = ~60fps
}

// ===== GET OPTIMAL SCAN REGION (FASTER) =====
getOptimalScanRegion(imageData) {
    // Only scan the center region where QR code is most likely
    // This makes scanning 4x faster!
    
    const centerX = Math.floor(imageData.width / 2);
    const centerY = Math.floor(imageData.height / 2);
    const regionWidth = Math.floor(imageData.width * 0.7); // 70% of width
    const regionHeight = Math.floor(imageData.height * 0.7); // 70% of height
    
    const startX = centerX - Math.floor(regionWidth / 2);
    const startY = centerY - Math.floor(regionHeight / 2);
    
    // Create new image data for the region
    const regionData = new Uint8ClampedArray(regionWidth * regionHeight * 4);
    
    let regionIndex = 0;
    for (let y = startY; y < startY + regionHeight; y++) {
        for (let x = startX; x < startX + regionWidth; x++) {
            const imageIndex = (y * imageData.width + x) * 4;
            
            regionData[regionIndex] = imageData.data[imageIndex];     // R
            regionData[regionIndex + 1] = imageData.data[imageIndex + 1]; // G
            regionData[regionIndex + 2] = imageData.data[imageIndex + 2]; // B
            regionData[regionIndex + 3] = imageData.data[imageIndex + 3]; // A
            
            regionIndex += 4;
        }
    }
    
    return {
        data: regionData,
        width: regionWidth,
        height: regionHeight
    };
}

// ===== ENHANCED PROCESS SCANNED DATA =====
processScannedData(data) {
    console.log('QR Code INSTANTLY scanned:', data);
    
    // Stop scanning immediately when QR is found
    this.stopScanner();
    
    // Prevent duplicate scans within cooldown period
    const now = Date.now();
    if (this.lastScannedCode && 
        now - this.lastScannedCode.time < this.scanCooldown &&
        this.lastScannedCode.data === data) {
        console.log('Duplicate scan ignored');
        return;
    }
    
    // Update last scanned code
    this.lastScannedCode = {
        data: data,
        time: now
    };
    
    // Play success sound
    this.playSuccessSound();
    
    // Draw green box around detected QR
    this.drawQRCodeBox();
    
    // Show immediate visual feedback
    this.showImmediateScanFeedback();
    
    // Process the data
    try {
        const qrData = JSON.parse(data);
        
        // Show success message INSTANTLY
        this.showScanResult('✓ QR Code Scanned!', 'success');
        
        // Process attendance based on QR data
        this.processAttendanceFromQR(qrData);
        
    } catch (error) {
        console.error('Invalid QR code format:', error);
        this.showScanResult('Invalid QR Code', 'error');
        
        // Resume scanning after error
        setTimeout(() => {
            this.startQRScanning();
        }, 1000);
    }
}

// ===== SHOW IMMEDIATE SCAN FEEDBACK =====
showImmediateScanFeedback() {
    // Flash the scanning frame green
    const scanningFrame = this.modal.querySelector('.scanning-overlay > div:first-child');
    if (scanningFrame) {
        scanningFrame.style.borderColor = '#00ff00';
        scanningFrame.style.boxShadow = '0 0 30px #00ff00';
        
        // Flash the corners
        const corners = scanningFrame.querySelectorAll('div');
        corners.forEach(corner => {
            corner.style.borderColor = '#00ff00';
        });
        
        // Reset after 300ms
        setTimeout(() => {
            scanningFrame.style.borderColor = '#00ff00';
            scanningFrame.style.boxShadow = 'none';
            corners.forEach(corner => {
                corner.style.borderColor = '#00ff00';
            });
        }, 300);
    }
    
    // Make scanning line brighter
    const scanningLine = this.modal.querySelector('.scanning-line');
    if (scanningLine) {
        scanningLine.style.background = 'linear-gradient(to right, transparent, #00ff00, #00ff00, #00ff00, transparent)';
        scanningLine.style.boxShadow = '0 0 20px #00ff00';
        
        setTimeout(() => {
            scanningLine.style.background = 'linear-gradient(to right, transparent, #00ff00, transparent)';
            scanningLine.style.boxShadow = 'none';
        }, 300);
    }
}



    processScannedData(data) {
        console.log('QR Code scanned:', data);
        
        const now = Date.now();
        if (this.lastScannedCode && 
            now - this.lastScannedCode.time < this.scanCooldown &&
            this.lastScannedCode.data === data) {
            console.log('Duplicate scan ignored');
            return;
        }
        
        this.lastScannedCode = { data: data, time: now };
        
        this.playSuccessSound();
        this.drawQRCodeBox();
        
        try {
            const qrData = JSON.parse(data);
            this.showScanResult('QR Code Scanned!', 'success');
            this.processAttendanceFromQR(qrData);
            
            setTimeout(() => {
                this.closeScanner();
            }, 2000);
            
        } catch (error) {
            console.error('Invalid QR code format:', error);
            this.showScanResult('Invalid QR Code', 'error');
        }
    }

    drawQRCodeBox() {
        if (!this.canvasContext) return;
        
        const centerX = this.canvasElement.width / 2;
        const centerY = this.canvasElement.height / 2;
        const boxSize = 150;
        
        this.canvasContext.strokeStyle = '#00ff00';
        this.canvasContext.lineWidth = 3;
        this.canvasContext.strokeRect(
            centerX - boxSize/2, 
            centerY - boxSize/2, 
            boxSize, 
            boxSize
        );
        
        this.canvasContext.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        this.canvasContext.lineWidth = 1;
        this.canvasContext.strokeRect(
            centerX - boxSize/2 - 5, 
            centerY - boxSize/2 - 5, 
            boxSize + 10, 
            boxSize + 10
        );
    }

    playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Could not play sound');
        }
    }

    showScanResult(message, type = 'info') {
        const scanResult = document.getElementById('scan-result');
        const resultContent = document.getElementById('result-content');
        const scanAgainBtn = document.getElementById('scan-again-btn');
        
        if (!scanResult || !resultContent) return;
        
        scanResult.style.display = 'flex';
        
        let icon = '';
        let color = '';
        
        switch(type) {
            case 'success':
                icon = '✅';
                color = '#28a745';
                break;
            case 'error':
                icon = '❌';
                color = '#dc3545';
                break;
            case 'loading':
                icon = '⏳';
                color = '#007bff';
                break;
            default:
                icon = 'ℹ️';
                color = '#17a2b8';
        }
        
        resultContent.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">${icon}</div>
            <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 24px;">${message}</h3>
        `;
        
        if (scanAgainBtn && (type === 'success' || type === 'error')) {
            scanAgainBtn.style.display = 'block';
            scanAgainBtn.onclick = () => {
                scanResult.style.display = 'none';
                this.lastScannedCode = null;
                this.startQRScanning();
            };
        }
    }

    async processAttendanceFromQR(qrData) {
        try {
            const activityId = qrData.activity_id || qrData.id;
            
            if (!activityId) {
                throw new Error('No activity ID found');
            }
            
            await this.submitAttendance(activityId);
            
        } catch (error) {
            console.error('Error processing QR data:', error);
            this.showScanResult(`Error: ${error.message}`, 'error');
        }
    }

    async submitAttendance(activityId) {
        try {
            this.showScanResult('Submitting attendance...', 'loading');
            
            const uniqueId = document.getElementById('unique_id')?.value;
            
            if (!uniqueId) {
                throw new Error('User not logged in');
            }
            
            const formData = {
                unique_id: uniqueId,
                attendance_category: 'activity',
                attendance_category_id: activityId,
                dayofactivity: new Date().toISOString().split('T')[0],
                check_in_time: new Date().toTimeString().split(' ')[0],
                status: 'present',
                attendance_method_id: 2,
                location_id: null
            };
            
            console.log('Submitting attendance:', formData);
            
            const response = await fetch('class/ApiHandler.php?entity=attendance&action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showScanResult('Attendance recorded!', 'success');
                this.showSuccess('Attendance recorded!');
            } else {
                throw new Error(result.message || 'Failed to record attendance');
            }
            
        } catch (error) {
            console.error('Attendance submission error:', error);
            this.showScanResult(`Submission failed: ${error.message}`, 'error');
            this.showError('Attendance submission failed');
        }
    }

    async toggleCamera() {
        try {
            if (!this.isScanning) return;
            
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }
            
            this.isFrontCamera = !this.isFrontCamera;
            
            const constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: this.isFrontCamera ? 'user' : 'environment',
                    frameRate: { ideal: 30 }
                }
            };
            
            await this.startCamera(constraints);
            
            const toggleBtn = document.getElementById('toggle-camera-btn');
            if (toggleBtn) {
                toggleBtn.innerHTML = this.isFrontCamera ? 
                    '🔄 Back Camera' : '🔄 Front Camera';
            }
            
        } catch (error) {
            console.error('Camera toggle failed:', error);
            this.showError('Could not switch camera');
        }
    }

    async toggleTorch() {
        try {
            if (!this.mediaStream) return;
            
            const track = this.mediaStream.getVideoTracks()[0];
            if (typeof track.getCapabilities === 'function') {
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    await track.applyConstraints({
                        advanced: [{ torch: !this.torchOn }]
                    });
                    this.torchOn = !this.torchOn;
                    
                    const torchBtn = document.getElementById('torch-toggle-btn');
                    if (torchBtn) {
                        torchBtn.innerHTML = this.torchOn ? 
                            '💡 Flash Off' : '💡 Flash On';
                    }
                }
            }
        } catch (error) {
            console.error('Torch toggle failed:', error);
        }
    }

    stopScanner() {
        console.log('Stopping scanner...');
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            this.mediaStream = null;
        }
        
        this.isScanning = false;
    }

    closeScanner() {
        console.log('Closing scanner...');
        
        this.stopScanner();
        
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        
        this.useFallback = false;
        this.lastScannedCode = null;
        this.isFrontCamera = false;
        this.torchOn = false;
    }

    // Helper methods for showing messages
    showError(message) {
        if (typeof showError === 'function') {
            showError(message);
        } else {
            console.error('Error:', message);
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (typeof showSuccess === 'function') {
            showSuccess(message);
        } else {
            console.log('Success:', message);
            alert('Success: ' + message);
        }
    }
}

// Global function to open QR scanner
function openQRScanner(activityId = null) {
    if (!window.qrCodeScanner) {
        window.qrCodeScanner = new QRCodeScanner();
    }
    window.qrCodeScanner.openScanner(activityId);
}