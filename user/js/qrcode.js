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
            <div class="qr-scanner-content">
                <div class="qr-scanner-header" style="
                    padding: 20px 16px 16px;
                    background: green;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <h3 style="margin: 0; color: white; font-size: 18px;">Scan QR Code weee</h3>
                    <button class="close-scanner">&times;</button>
                </div>
                
                <div class="qr-scanner-body" style="">
                    <!-- HTML5 QR Code Scanner will be mounted here -->
                    <div id="qr-reader" style="width: 100%; height: 100%;"> We are moing slowly but surely</div>
                    
                    <div class="file-upload-fallback" id="file-upload-fallback" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: none;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: #111;
                        padding: 20px;
                        box-sizing: border-box;
                        z-index: 10;
                    ">
                        <div style="margin-bottom: 30px; text-align: center;">
                            <div style="font-size: 64px; color: #007bff; margin-bottom: 20px;">📷</div>
                            <h3 style="color: white; margin-bottom: 10px; font-size: 20px;">Upload QR Code</h3>
                            <p style="color: #aaa; font-size: 14px;">Take a photo or choose from gallery</p>
                        </div>
                        
                        <div style="width: 100%; max-width: 300px;">
                            <button id="upload-qr-btn" class="btn-primaryScan">
                                📁 Upload & Scan
                            </button>
                            <button id="scan-qr-btn" class="btn-primaryScan" style="
                                width: 100%;
                                padding: 15px;
                                background: #28a745;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                            ">
                                📱 Scan QR Code
                            </button>
                            <input type="file" id="qr-image-upload" accept="image/*" capture="environment" style="display: none;">
                        </div>
                    </div>
                    
                    <div class="scan-result" id="scan-result" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: none;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        background: rgba(0,0,0,0.9);
                        z-index: 20;
                    ">
                        <div id="result-content" style="text-align: center;"></div>
                        <button id="scan-again-btn" style="
                            margin-top: 20px;
                            padding: 12px 30px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                        ">Scan Again</button>
                    </div>
                </div>
                
                <div class="qr-scanner-footer" style="
                    display: flex;
                    justify-content: space-around;
                    padding: 16px;
                    background: rgba(0,0,0,0.8);
                    flex-shrink: 0;
                ">
                    <button class="btn-secondary use-fallback" id="use-fallback-btn" style="
                        padding: 12px 20px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        flex: 1;
                        margin: 0 5px;
                    ">
                        📁 Upload
                    </button>
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
        const scanBtn = this.modal.querySelector('#scan-qr-btn');
        const fileInput = this.modal.querySelector('#qr-image-upload');
        const scanAgainBtn = this.modal.querySelector('#scan-again-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeScanner());
        }
        if (fallbackBtn) {
            fallbackBtn.addEventListener('click', () => this.toggleFallbackMode());
        }
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.triggerFileUpload());
        }
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.useFallback = false;
                this.showCameraMode();
                this.startHtml5Scanner();
            });
        }
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        if (scanAgainBtn) {
            scanAgainBtn.addEventListener('click', () => {
                document.getElementById('scan-result').style.display = 'none';
                this.lastScannedCode = null;
                this.startHtml5Scanner();
            });
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
        const qrReader = document.getElementById('qr-reader');
        
        if (scanResult) scanResult.style.display = 'none';
        if (fallbackSection) fallbackSection.style.display = 'none';
        if (qrReader) {
            qrReader.innerHTML = ''; // Clear any existing scanner
        }

        this.modal.style.display = 'flex';
        this.isScanning = true;
        this.useFallback = false;
        
        // Check if Html5Qrcode is available
        if (typeof Html5QrcodeScanner === 'undefined') {
            console.error('Html5QrcodeScanner not loaded');
            showError('QR Scanner library not loaded');
            this.showFallbackMode();
            return;
        }

        // Start the HTML5 scanner
        this.startHtml5Scanner();
    }

    startHtml5Scanner() {
        console.log('Starting Html5QrcodeScanner...');
        
        // Show loading message
        this.showScanResult('Starting camera...', 'loading');
        
        // Get the QR reader element
        const qrReaderElement = document.getElementById('qr-reader');
        
        // Clear any existing scanner
        if (this.html5QrcodeScanner) {
            try {
                this.html5QrcodeScanner.clear();
            } catch (e) {
                console.log('Error clearing scanner:', e);
            }
        }
        
        // Make sure the element is visible and empty
        qrReaderElement.innerHTML = '';
        qrReaderElement.style.display = 'block';
        
        // Hide loading message after a moment
        setTimeout(() => {
            document.getElementById('scan-result').style.display = 'none';
        }, 1000);
        
        // Create new scanner instance
        this.html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { 
                qrbox: {
                    width: 250,
                    height: 250
                },
                fps: 10,
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true,
                defaultZoomValueIfSupported: 1
            },
            /* verbose= */ false
        );
        
        // Define success and error handlers
        const onScanSuccess = (decodedText, decodedResult) => {
            console.log('QR Code scanned:', decodedText);
            
            // Stop scanning
            this.stopHtml5Scanner();
            
            // Process the scanned data
            this.processScannedData(decodedText);
        };
        
        const onScanError = (errorMessage) => {
            // Just log errors, don't show to user
            console.log('Scan error:', errorMessage);
        };
        
        // Render the scanner
        this.html5QrcodeScanner.render(onScanSuccess, onScanError);
    }

    stopHtml5Scanner() {
        if (this.html5QrcodeScanner) {
            try {
                this.html5QrcodeScanner.clear();
                console.log('Scanner stopped');
            } catch (e) {
                console.log('Error stopping scanner:', e);
            }
        }
    }

    showCameraMode() {
        this.useFallback = false;
        
        const qrReader = document.getElementById('qr-reader');
        const fallbackSection = document.getElementById('file-upload-fallback');
        const scanResult = document.getElementById('scan-result');
        
        // Hide fallback UI
        if (fallbackSection) {
            fallbackSection.style.display = 'none';
        }
        
        // Hide any scan results
        if (scanResult) {
            scanResult.style.display = 'none';
        }
        
        // Show QR reader container
        if (qrReader) {
            qrReader.style.display = 'block';
        }
        
        // Start scanner
        this.startHtml5Scanner();
    }

    showFallbackMode() {
        this.useFallback = true;
        
        const qrReader = document.getElementById('qr-reader');
        const fallbackSection = document.getElementById('file-upload-fallback');
        const scanResult = document.getElementById('scan-result');
        
        // Hide QR reader
        if (qrReader) {
            qrReader.style.display = 'none';
            // Clear scanner
            this.stopHtml5Scanner();
        }
        
        // Hide any scan results
        if (scanResult) {
            scanResult.style.display = 'none';
        }
        
        // Show fallback UI
        if (fallbackSection) {
            fallbackSection.style.display = 'flex';
        }
    }

    toggleFallbackMode() {
        if (this.useFallback) {
            // Switching to camera mode
            this.showCameraMode();
        } else {
            // Switching to fallback mode
            this.showFallbackMode();
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

        this.showScanResult('lets just write some rubbish Processing image...', 'loading');

        try {
            // Use Html5Qrcode to scan from file
            const html5QrCode = new Html5Qrcode("qr-reader");
            
            // Scan from image file
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
        // Stop scanning
        this.stopHtml5Scanner();
        
        // Prevent duplicate scans
        const now = Date.now();
        if (this.lastScannedCode && 
            now - this.lastScannedCode.time < this.scanCooldown &&
            this.lastScannedCode.data === data) {
            console.log('Duplicate scan ignored');
            return;
        }
        
        this.lastScannedCode = { data: data, time: now };
        
        // Show result
        try {
            // Try to parse as JSON
            
            const qrDataL = data;
            this.QrString = data;
            console.log(qrDataL)
            // const qrData = JSON.parse(data);
            // console.log('we passed the first one');
            // the bellow should not be here t this point of the code
            // this.showScanResult('QR Code Scanned!', 'success');
            // console.log('showScanResult is in here')
             
            const checkQrCode = await fetch(`class/ApiHandler.php?action=get&entity=activity_qr_codes&id=${qrDataL}`);        
            const qrResponse = await checkQrCode.json();    
            this.processAttendanceFromQR(qrResponse);    
            console.log(qrResponse)            
        } catch (error) {
            // Not JSON, check if it's just an ID
            if (data && !isNaN(data)) {
                // It's a numeric ID
                this.showScanResult('QR Code Scanned!', 'success');
                this.processAttendanceFromQR({ activity_id: data, id: data });
               
            } else {
                console.error('Invalid QR code format:', error);
                this.showScanResult('Data: ' + data.substring(0, 30) + '...', 'info');
                
                // Resume scanning after 3 seconds
                setTimeout(() => {
                    if (this.isScanning && !this.useFallback) {
                        this.startHtml5Scanner();
                    }
                }, 3000);
            }
        }
    }

    async processAttendanceFromQR(qrData) {
        console.log(qrData)
        if (!qrData || typeof qrData !== 'object') {           
            console.log('Invalid QR data format');
            this.showScanResult('Invalid QR code format', 'error');
            return;
        }
        
        try {           
            const activityId =  qrData.data.activity_id;
            console.log('id is present', activityId)
            if (!activityId) {
                console.log('no such id')
                this.showScanResult('this isnt ours/ The system doesnt recognize this code', 'error')
                throw new Error('No activity ID found');
                
            }else{     
                console.log('we are in')       
                await this.submitAttendance(activityId, qrData);
            }
        } catch (error) {
            console.error('Error processing QR data:', error);
            this.showScanResult(`Error: ${error.message}`, 'error');
            
            // Resume scanning after 3 seconds
            setTimeout(() => {
                if (this.isScanning && !this.useFallback) {
                    this.startHtml5Scanner();
                }
            }, 3000);
        }
    }

    async submitAttendance(activityId, data) {
        try {
            this.showScanResult('Submitting attendance...', 'loading');
            
            const uniqueId = document.getElementById('unique_id')?.value;
            
            if (!uniqueId) {
                console.log('user is not logged in')
                throw new Error('User not logged in');
            }
            
            // const formData = {
           
          
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = new Date();           
            const dayOfWeek = daysOfWeek[today.getDay()];
            console.log(today);
            const dept = document.getElementById('department_id').value
            // console.log(today,dept);
            console.log(dayOfWeek);
            const formUpdateAttendanceTable = {                
                attendance_category: 'activity',
                attendance_category_id: data.data.category_id,   
                unique_id: uniqueId,  
                department_id: dept,           
                attendance_method_id: data.data.attendance_method_id,
                dayofactivity: daysOfWeek[new Date().getDay()],
                check_in_time: new Date().toTimeString().split(' ')[0],
                status: new Date() > new Date(data.data.expires_at) ? 'late' : 'present',               
                location_id: data.data.location_id
            };
            
            console.log('Submitting attendance:', formUpdateAttendanceTable);
            
            const responseCreateAttendance = await fetch('class/ApiHandler.php?entity=attendance&action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formUpdateAttendanceTable)
            });
            
            const result = await responseCreateAttendance.json();
            
            if (result.success) {
                const formUpdateQr = { 
                    id: data.data.Id,
                    uses: data.data.uses + 1,
                    max_uses: data.data.max_uses - 1,                
                    qr_code: data.data.qr_code,                
                };
                console.log('Submitting attendance:', formUpdateQr);
                const responseUpdteQr = await fetch('class/ApiHandler.php?entity=activity_qr_codes&action=update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data.data.Id,formUpdateQr)
                });
                if(responseUpdteQr){
                    this.showScanResult('Attendance recorded!', 'success');
                }
                setTimeout(() => {
                    this.closeScanner();
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to record attendance');
            }
            
        } catch (error) {
            console.error('Attendance submission error:', error);
            this.showScanResult(`Submission failed: ${error.message}`, 'error');
            
            // Resume scanning after 3 seconds
            setTimeout(() => {
                if (this.isScanning && !this.useFallback) {
                    this.startHtml5Scanner();
                }
            }, 3000);
        }
    }

    stopScanner() {
        console.log('Stopping scanner...');
        this.stopHtml5Scanner();
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
        
        if (scanAgainBtn && (type === 'success' || type === 'error' || type === 'info')) {
            scanAgainBtn.style.display = 'block';
        } else if (scanAgainBtn) {
            scanAgainBtn.style.display = 'none';
        }
    }

}

// Global function to open QR scanner
function openQRScanner(activityId = null) {
    // Create global instance if it doesn't exist
    if (!window.qrCodeScanner) {
        window.qrCodeScanner = new QRCodeScanner();
    }
    window.qrCodeScanner.openScanner(activityId);
}