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
                <div class="qr-scanner-header">
                    <h3>Scan QR Code</h3>
                    <button class="close-scanner">&times;</button>
                </div>
                
                <div class="qr-scanner-body">
                    <!-- HTML5 QR Code Scanner will be mounted here -->
                    <div id="qr-reader" style="width: 100%; height: 100%;"></div>
                    
                    <!-- Laser Animation - Hidden by default -->
                    <div class="scan-laser"></div>
                    
                    <!-- Upload Fallback -->
                    <div class="file-upload-fallback" id="file-upload-fallback">
                        <div style="font-size: 64px; color: #007bff; margin-bottom: 20px;">📷</div>
                        <h3>Upload QR Code</h3>
                        <p>Take a photo or choose from gallery</p>
                        <button id="upload-qr-btn" class="btn-scanner btn-scanner-primary" style="width: 100%; max-width: 250px;">📁 Upload & Scan</button>
                        <input type="file" id="qr-image-upload" accept="image/*" capture="environment" style="display: none;">
                    </div>
                    
                    <!-- Scan Result Overlay -->
                    <div class="scan-result" id="scan-result">
                        <div id="result-content"></div>
                        <button id="scan-again-btn">Scan Again</button>
                    </div>
                </div>
                
                <div class="qr-scanner-footer">
                    <button class="btn-scanner btn-scanner-secondary" id="use-fallback-btn">📁 Upload Image</button>
                    <button class="btn-scanner btn-scanner-danger" id="stop-camera-btn" style="display: none;">⏹ Stop Camera</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
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