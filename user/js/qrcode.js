// QR Code Scanner functionality using Html5QrcodeScanner
class QRCodeScanner {  
    constructor() {
        console.log('QRCodeScanner constructor called - Using Html5QrcodeScanner');        
        this.scanner = null;
        this.isScanning = false;
        this.modal = null;
        this.currentActivityId = null;
        this.lastScannedCode = null;
        this.scanCooldown = 2000;
        this.useFallback = false;
        this.html5QrcodeScanner = null;
        this.QrString = null
        this.init();
    }
    
    init() {
        console.log('Initializing QR scanner with Html5QrcodeScanner...');
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        if (this.modal) return;

        this.modal = document.createElement('div');
        this.modal.className = 'qr-scanner-modal';
        
        this.modal.innerHTML = `
            <div class="qr-scanner-content">
                <!-- Header: only X button -->
                <div class="qr-scanner-header">
                    <button class="close-scanner" aria-label="Close">&times;</button>
                </div>

                <div class="qr-scanner-body">
                    <!-- Camera area -->
                    <div class="camera-wrapper">
                        <div id="qr-reader" style="width:100%;height:100%;"></div>
                        <!-- Corner brackets -->
                        <div class="corner-bracket corner-tl"></div>
                        <div class="corner-bracket corner-tr"></div>
                        <div class="corner-bracket corner-bl"></div>
                        <div class="corner-bracket corner-br"></div>
                        <!-- Laser -->
                        <div class="scan-laser"></div>
                        <!-- Upload fallback -->
                        <div class="file-upload-fallback" id="file-upload-fallback">
                            <div style="font-size:64px;margin-bottom:20px;">📁</div>
                            <h3>Upload QR Code</h3>
                            <p>Take a photo or choose from gallery</p>
                            <button id="upload-qr-btn" style="
                                padding:14px 24px;background:#4A90E2;color:white;border:none;
                                border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;
                            ">Browse Files</button>
                            <input type="file" id="qr-image-upload" accept="image/*" capture="environment" style="display:none;">
                        </div>
                    </div>

                    <!-- Camera Controls -->
                    <div class="camera-controls">
                        <button class="btn-stop-camera" id="stop-camera-btn">
                            <span class="stop-square"></span> Stop Camera
                        </button>
                        <button class="btn-icon-circle" id="flash-btn" title="Toggle Flash">⚡</button>
                        <button class="btn-icon-circle" id="switch-camera-btn" title="Switch Camera">🔄</button>
                    </div>

                    <!-- Camera dropdown (visual) -->
                    <select class="camera-select" id="camera-select">
                        <option>camera 0, facing back</option>
                    </select>

                    <!-- Zoom (visual) -->
                    <div class="zoom-control">
                        <span class="zoom-label">Zoom</span>
                        <input type="range" class="zoom-slider" id="zoom-slider" min="1" max="5" value="1" step="0.1">
                        <span class="zoom-value" id="zoom-value">1.0x</span>
                    </div>

                    <!-- Scanned Result section -->
                    <div class="scanned-result-section">
                        <div class="scanned-result-header">
                            <h3>Scanned Result</h3>
                            <button class="history-btn">
                                History <span class="history-dot"></span>
                            </button>
                        </div>
                        <div class="scan-status" id="scan-status">
                            <span class="scan-status-dot"></span>
                            <span id="scan-status-text">Waiting to start...</span>
                        </div>
                        <div class="scan-result-box" id="scan-result-box">
                            Scan a QR code to see results here...
                        </div>
                        <button id="scan-again-btn">Scan Again</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
    }

    setupModalEvents() {
        if (!this.modal) return;

        const closeBtn      = this.modal.querySelector('.close-scanner');
        const stopBtn       = this.modal.querySelector('#stop-camera-btn');
        const uploadBtn     = this.modal.querySelector('#upload-qr-btn');
        const fileInput     = this.modal.querySelector('#qr-image-upload');
        const scanAgainBtn  = this.modal.querySelector('#scan-again-btn');
        const zoomSlider    = this.modal.querySelector('#zoom-slider');
        const zoomValue     = this.modal.querySelector('#zoom-value');

        if (closeBtn)  closeBtn.addEventListener('click',  () => this.closeScanner());
        if (uploadBtn) uploadBtn.addEventListener('click', () => this.triggerFileUpload());
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopHtml5Scanner();
                this.updateScanStatus('Camera stopped', 'idle');
                this.showScanResult('Camera stopped. Click Scan Again to resume.', 'info');
            });
        }

        if (scanAgainBtn) {
            scanAgainBtn.addEventListener('click', () => {
                scanAgainBtn.style.display = 'none';
                this.clearScanResult();
                this.startHtml5Scanner();
            });
        }

        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', () => {
                zoomValue.textContent = parseFloat(zoomSlider.value).toFixed(1) + 'x';
            });
        }

        // Close when clicking on the light overlay (outside the card)
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeScanner();
        });
    }

    updateScanStatus(text, state = 'scanning') {
        const statusText = document.getElementById('scan-status-text');
        const statusDot  = this.modal.querySelector('.scan-status-dot');
        if (!statusText || !statusDot) return;

        statusText.textContent = text;
        if (state === 'scanning') {
            statusDot.style.background = '#FFC107';
            statusDot.style.boxShadow  = '0 0 0 4px rgba(255,193,7,0.2)';
            statusDot.style.animation  = 'pulse 1.5s ease-in-out infinite';
        } else if (state === 'success') {
            statusDot.style.background = '#4CAF50';
            statusDot.style.boxShadow  = '0 0 0 4px rgba(76,175,80,0.2)';
            statusDot.style.animation  = 'none';
        } else if (state === 'error') {
            statusDot.style.background = '#E53935';
            statusDot.style.boxShadow  = '0 0 0 4px rgba(229,57,53,0.2)';
            statusDot.style.animation  = 'none';
        } else {
            statusDot.style.background = '#999';
            statusDot.style.boxShadow  = 'none';
            statusDot.style.animation  = 'none';
        }
    }

    showScanResult(message, type = 'info') {
        const box = document.getElementById('scan-result-box');
        const scanAgainBtn = document.getElementById('scan-again-btn');
        if (!box) return;

        box.className = 'scan-result-box';
        box.textContent = message;

        if (type === 'success') {
            box.classList.add('success');
            this.updateScanStatus('Scan successful!', 'success');
        } else if (type === 'error') {
            box.classList.add('error');
            this.updateScanStatus('Scan failed', 'error');
        } else if (type === 'loading') {
            box.classList.add('loading');
            this.updateScanStatus('Processing...', 'scanning');
        } else {
            this.updateScanStatus('Scanning for QR codes...', 'scanning');
        }

        if (scanAgainBtn && (type === 'success' || type === 'error' || type === 'info')) {
            scanAgainBtn.style.display = 'inline-block';
        } else if (scanAgainBtn) {
            scanAgainBtn.style.display = 'none';
        }
    }

    clearScanResult() {
        const box = document.getElementById('scan-result-box');
        if (box) {
            box.className = 'scan-result-box';
            box.textContent = 'Scan a QR code to see results here...';
        }
        this.updateScanStatus('Scanning for QR codes...', 'scanning');
    }

    async openScanner(activityId = null) {
        if (this.isScanning) return;

        this.currentActivityId = activityId;
        this.lastScannedCode = null;

        if (!this.modal) this.createModal();

        // Reset UI
        const fallbackSection = document.getElementById('file-upload-fallback');
        const qrReader        = document.getElementById('qr-reader');
        const scanAgainBtn    = document.getElementById('scan-again-btn');
        const laser           = document.querySelector('.scan-laser');

        if (fallbackSection) fallbackSection.style.display = 'none';
        if (qrReader) qrReader.innerHTML = '';
        if (scanAgainBtn) scanAgainBtn.style.display = 'none';
        if (laser) laser.style.display = 'none';

        this.clearScanResult();

        this.modal.style.display = 'block';
        this.isScanning = true;
        this.useFallback = false;

        if (typeof Html5QrcodeScanner === 'undefined') {
            showError('QR Scanner library not loaded');
            this.showFallbackMode();
            return;
        }

        this.startHtml5Scanner();
    }

    startHtml5Scanner() {
        console.log('Starting Html5QrcodeScanner...');

        // Hide laser until camera is ready
        const laser = document.querySelector('.scan-laser');
        if (laser) laser.style.display = 'none';

        this.updateScanStatus('Requesting camera permission...', 'scanning');

        const qrReaderElement = document.getElementById('qr-reader');

        if (this.html5QrcodeScanner) {
            try { this.html5QrcodeScanner.clear(); } catch (e) {}
        }

        if (qrReaderElement) {
            qrReaderElement.innerHTML = '';
            qrReaderElement.style.display = 'block';
        }

        this.html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                qrbox: { width: 220, height: 220 },
                fps: 10,
                facingMode: "environment",
                rememberLastUsedCamera: false,
                showTorchButtonIfSupported: false,
                showZoomSliderIfSupported: false,
                defaultZoomValueIfSupported: 1
            },
            false
        );

        const onScanSuccess = (decodedText) => {
            console.log('QR Code scanned:', decodedText);
            this.stopHtml5Scanner();
            this.processScannedData(decodedText);
        };

        const onScanError = () => { /* silence */ };

        this.html5QrcodeScanner.render(onScanSuccess, onScanError);

        // Poll until the video element is live, THEN show the laser
        this.checkCameraStatus();
    }

    checkCameraStatus() {
        const laser = document.querySelector('.scan-laser');
        let attempts = 0;
        const maxAttempts = 30;

        const interval = setInterval(() => {
            const video = document.querySelector('#qr-reader video');

            if (video && video.readyState >= 2 && video.videoWidth > 0) {
                if (laser) laser.style.display = 'block';
                this.updateScanStatus('Scanning for QR codes...', 'scanning');
                clearInterval(interval);
                console.log('Camera active, laser started.');
                return;
            }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                this.updateScanStatus('Camera is taking too long. Try refreshing.', 'error');
                console.warn('Camera check timed out.');
            }
        }, 500);
    }

    stopHtml5Scanner() {
        const laser = document.querySelector('.scan-laser');
        if (laser) laser.style.display = 'none';

        if (this.html5QrcodeScanner) {
            try {
                this.html5QrcodeScanner.clear();
                console.log('Scanner stopped');
            } catch (e) {
                console.log('Error stopping scanner:', e);
            }
        }
    }
  

    setupModalEvents() {
        if (!this.modal) return;

        const closeBtn = this.modal.querySelector('.close-scanner');
        const fallbackBtn = this.modal.querySelector('#use-fallback-btn');
        const uploadBtn = this.modal.querySelector('#upload-qr-btn');
        const fileInput = this.modal.querySelector('#qr-image-upload');
        const scanAgainBtn = this.modal.querySelector('#scan-again-btn');
        const stopCameraBtn = this.modal.querySelector('#stop-camera-btn');

        if (closeBtn) closeBtn.addEventListener('click', () => this.closeScanner());
        if (fallbackBtn) fallbackBtn.addEventListener('click', () => this.showFallbackMode());
        
        if (stopCameraBtn) {
            stopCameraBtn.addEventListener('click', () => {
                this.stopHtml5Scanner();
                this.showScanResult('Camera stopped', 'info');
                stopCameraBtn.style.display = 'none';
                fallbackBtn.style.display = 'block';
            });
        }

        if (uploadBtn) uploadBtn.addEventListener('click', () => this.triggerFileUpload());
        if (fileInput) fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        if (scanAgainBtn) {
            scanAgainBtn.addEventListener('click', () => {
                document.getElementById('scan-result').style.display = 'none';
                this.lastScannedCode = null;
                this.startHtml5Scanner();
            });
        }

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeScanner();
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) this.closeScanner();
        });
    }

    async openScanner(activityId = null) {
        if (this.isScanning) return;

        this.currentActivityId = activityId;
        this.lastScannedCode = null;

        if (!this.modal) this.createModal();

        const scanResult = document.getElementById('scan-result');
        const fallbackSection = document.getElementById('file-upload-fallback');
        const qrReader = document.getElementById('qr-reader');
        const stopCameraBtn = this.modal.querySelector('#stop-camera-btn');
        const fallbackBtn = this.modal.querySelector('#use-fallback-btn');
        
        if (scanResult) scanResult.style.display = 'none';
        if (fallbackSection) fallbackSection.style.display = 'none';
        if (qrReader) qrReader.innerHTML = '';
        if (stopCameraBtn) stopCameraBtn.style.display = 'block';
        if (fallbackBtn) fallbackBtn.style.display = 'block';

        this.modal.style.display = 'flex';
        this.isScanning = true;
        this.useFallback = false;
        
        if (typeof Html5QrcodeScanner === 'undefined') {
            showError('QR Scanner library not loaded');
            this.showFallbackMode();
            return;
        }

        this.startHtml5Scanner();
    }

    startHtml5Scanner() {
        console.log('Starting Html5QrcodeScanner...');
        
        // 1. Ensure laser is hidden initially
        const laser = document.querySelector('.scan-laser');
        if (laser) laser.style.display = 'none';

        this.showScanResult('Starting camera...', 'loading');
        
        const qrReaderElement = document.getElementById('qr-reader');
        
        if (this.html5QrcodeScanner) {
            try { this.html5QrcodeScanner.clear(); } catch (e) {}
        }
        
        if (qrReaderElement) {
            qrReaderElement.innerHTML = '';
            qrReaderElement.style.display = 'block';
        }
        
        setTimeout(() => {
            const scanResult = document.getElementById('scan-result');
            if (scanResult) scanResult.style.display = 'none';
        }, 1000);
        
        this.html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { 
                qrbox: { width: 250, height: 250 },
                fps: 10,
                facingMode: "environment",
                rememberLastUsedCamera: false,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 1
            },
            false
        );
        
        const onScanSuccess = (decodedText, decodedResult) => {
            console.log('QR Code scanned:', decodedText);
            this.stopHtml5Scanner();
            this.processScannedData(decodedText);
        };
        
        const onScanError = (errorMessage) => {
            // console.log('Scan error:', errorMessage);
        };
        
        this.html5QrcodeScanner.render(onScanSuccess, onScanError);

        // 2. Check if camera is actually on before showing the laser
        this.checkCameraStatus();
    }

    // NEW METHOD: Continuously check if the video element is active
    checkCameraStatus() {
        const laser = document.querySelector('.scan-laser');
        let attempts = 0;
        const maxAttempts = 20; // 20 * 500ms = 10 seconds timeout

        const interval = setInterval(() => {
            const video = document.querySelector('#qr-reader video');
            
            // Check if video exists and is playing (readyState >= 2 means it has data)
            if (video && video.readyState >= 2) {
                if (laser) laser.style.display = 'block';
                clearInterval(interval);
                console.log('Camera active, laser started.');
            }
            
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.warn('Camera check timed out.');
            }
        }, 500);
    }

    stopHtml5Scanner() {
        const laser = document.querySelector('.scan-laser');
        if (laser) laser.style.display = 'none';

        if (this.html5QrcodeScanner) {
            try {
                this.html5QrcodeScanner.clear();
                console.log('Scanner stopped');
            } catch (e) {
                console.log('Error stopping scanner:', e);
            }
        }
    }

    showFallbackMode() {
        this.useFallback = true;
        const qrReader = document.getElementById('qr-reader');
        const fallbackSection = document.getElementById('file-upload-fallback');
        const scanResult = document.getElementById('scan-result');
        const stopCameraBtn = this.modal.querySelector('#stop-camera-btn');
        
        if (qrReader) qrReader.style.display = 'none';
        this.stopHtml5Scanner();
        
        if (scanResult) scanResult.style.display = 'none';
        if (fallbackSection) fallbackSection.style.display = 'flex';
        if (stopCameraBtn) stopCameraBtn.style.display = 'none';
    }

    triggerFileUpload() {
        const fileInput = document.getElementById('qr-image-upload');
        if (fileInput) fileInput.click();
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showScanResult('Processing image...', 'loading');

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            const decodedText = await html5QrCode.scanFile(file, true);
            console.log('QR Code from file:', decodedText);
            this.processScannedData(decodedText);
        } catch (error) {
            console.error('Error processing image:', error);
            this.showScanResult('No QR code found in image', 'error');
        }
    }

    async processScannedData(data) {
        console.log('Processing scanned data:', data);        
        this.stopHtml5Scanner();
        
        const now = Date.now();
        if (this.lastScannedCode && now - this.lastScannedCode.time < this.scanCooldown && this.lastScannedCode.data === data) {
            return;
        }
        
        this.lastScannedCode = { data: data, time: now };
        
        try {
            this.QrString = data;
            const checkQrCode = await fetch(`class/ApiHandler.php?action=get&entity=activity_qr_codes&id=${data}`);        
            const qrResponse = await checkQrCode.json();    
            this.processAttendanceFromQR(qrResponse);    
        } catch (error) {
            if (data && !isNaN(data)) {
                this.showScanResult('QR Code Scanned!', 'success');
                this.processAttendanceFromQR({ activity_id: data, id: data });
            } else {
                this.showScanResult('Data: ' + data.substring(0, 30) + '...', 'info');
                setTimeout(() => {
                    if (this.isScanning && !this.useFallback) this.startHtml5Scanner();
                }, 3000);
            }
        }
    }

    async processAttendanceFromQR(qrData) {
        if (!qrData || typeof qrData !== 'object') {           
            this.showScanResult('Invalid QR code format', 'error');
            return;
        }
        
        try {           
            const activityId = qrData.data.activity_id;
            if (!activityId) {
                this.showScanResult('The system doesnt recognize this code', 'error');
                throw new Error('No activity ID found');
            } else {     
                await this.submitAttendance(activityId, qrData);
            }
        } catch (error) {
            this.showScanResult(`Error: ${error.message}`, 'error');
            setTimeout(() => {
                if (this.isScanning && !this.useFallback) this.startHtml5Scanner();
            }, 3000);
        }
    }

    async submitAttendance(activityId, data) {
        try {
            this.showScanResult('Submitting attendance...', 'loading');
            
            const uniqueId = document.getElementById('unique_id')?.value;
            if (!uniqueId) throw new Error('User not logged in');
            
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = new Date();           
            const dept = document.getElementById('department_id')?.value || 0;
            
            const formUpdateAttendanceTable = {                
                attendance_category: 'activity',
                attendance_category_id: activityId,   
                unique_id: uniqueId,  
                department_id: dept,           
                attendance_method_id: data.data.attendance_method_id || 3,
                dayofactivity: daysOfWeek[today.getDay()],
                check_in_time: today.toTimeString().split(' ')[0],
                status: new Date() > new Date(data.data.expires_at) ? 'late' : 'present',               
                location_id: data.data.location_id || 0 
            };
            
            const responseCreateAttendance = await fetch('class/ApiHandler.php?entity=attendance&action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formUpdateAttendanceTable)
            });
            
            const result = await responseCreateAttendance.json();
            
            if (result.success) {
                const formUpdateQr = { uses: (data.data.uses || 0) + 1 };
                
                await fetch(`class/ApiHandler.php?entity=activity_qr_codes&action=update&id=${data.data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(formUpdateQr)
                });
                
                this.showScanResult('Attendance recorded!', 'success');
                setTimeout(() => { this.closeScanner(); }, 2000);
            } else {
                throw new Error(result.message || 'Failed to record attendance');
            }
        } catch (error) {
            this.showScanResult(`Submission failed: ${error.message}`, 'error');
            setTimeout(() => {
                if (this.isScanning && !this.useFallback) this.startHtml5Scanner();
            }, 3000);
        }
    }

    stopScanner() {
        this.stopHtml5Scanner();
        this.isScanning = false;
    }

    closeScanner() {
        this.stopScanner();
        if (this.modal) this.modal.style.display = 'none';
        this.useFallback = false;
        this.lastScannedCode = null;
    }

    showScanResult(message, type = 'info') {
        const scanResult = document.getElementById('scan-result');
        const resultContent = document.getElementById('result-content');
        const scanAgainBtn = document.getElementById('scan-again-btn');
        
        if (!scanResult || !resultContent) return;
        
        scanResult.style.display = 'flex';
        
        let icon = '', color = '';
        switch(type) {
            case 'success': icon = '✅'; color = '#28a745'; break;
            case 'error': icon = '❌'; color = '#dc3545'; break;
            case 'loading': icon = '⏳'; color = '#007bff'; break;
            default: icon = 'ℹ️'; color = '#17a2b8';
        }
        
        resultContent.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">${icon}</div>
            <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 24px;">${message}</h3>
        `;
        
        if (scanAgainBtn && (type === 'success' || type === 'error' || type === 'info')) {
            scanAgainBtn.style.display = 'block';
        } else if (scanAgainBtn) {
            scanAgainBtn.style.display = 'none';
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