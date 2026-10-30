// QR Scanner — Real camera control using Html5Qrcode
class QRCodeScanner {
    constructor() {
        this.html5QrCode = null;       // The Html5Qrcode instance
        this.isScanning  = false;
        this.modal       = null;
        this.lastScannedCode = null;
        this.scanCooldown = 2000;
        this.cameras      = [];        // {id, label}[]
        this.currentCameraId = null;
        this.currentZoom  = 1;
        this.zoomSupported = false;
        this.originalZoom = 1;
        this.currentImagePreview = null; // <--- NEW: For storing the uploaded image
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    // ---------- BUILD MODAL ----------
    createModal() {
        if (this.modal) return;
        this.modal = document.createElement('div');
        this.modal.className = 'qr-scanner-modal';
        this.modal.innerHTML = `
            <div class="qr-scanner-content">
                <div class="qr-scanner-header">
                    <button class="close-scanner">&times;</button>
                </div>
                <div class="qr-scanner-body">
                    <!-- TABS -->
                    <div class="scan-tabs">
                        <button class="scan-tab active" data-tab="camera">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            Camera
                        </button>
                        <button class="scan-tab" data-tab="image">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                            Scan Image
                        </button>
                    </div>

                    <!-- CAMERA PANEL -->
                    <div class="tab-panel active" id="panel-camera">
                        <div class="camera-off-box" id="cameraOff">
                            <div class="camera-off-icon">📷</div>
                            <div class="camera-off-title">Camera is off.</div>
                            <div class="camera-off-sub">Press Start Camera to scan.</div>
                            <button class="btn-start-camera" id="start-camera-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                Start Camera
                            </button>
                        </div>

                        <div id="cameraOn" style="display:none">
                            <div class="camera-wrapper">
                                <div id="qr-reader"></div>
                                <div class="corner-bracket corner-tl"></div>
                                <div class="corner-bracket corner-tr"></div>
                                <div class="corner-bracket corner-bl"></div>
                                <div class="corner-bracket corner-br"></div>
                                <div class="scan-laser" id="scan-laser"></div>
                            </div>

                            <div class="camera-controls">
                                <button class="btn-stop-camera" id="stop-camera-btn">
                                    <span class="stop-square"></span> Stop Camera
                                </button>
                                <button class="btn-icon-circle" id="torch-btn" title="Toggle Flash">⚡</button>
                                <button class="btn-icon-circle" id="switch-camera-btn" title="Switch Camera">🔄</button>
                            </div>

                            <select class="camera-select" id="camera-select"></select>

                            <div class="zoom-control">
                                <span class="zoom-label">Zoom</span>
                                <input type="range" class="zoom-slider" id="zoom-slider" min="1" max="5" value="1" step="0.1">
                                <span class="zoom-value" id="zoom-value">1.0x</span>
                            </div>
                        </div>

                        <div class="scanned-result-section">
                            <div class="scanned-result-header">
                                <h3>Scanned Result</h3>
                                <button class="history-btn">History <span class="history-dot"></span></button>
                            </div>
                            <div class="scan-status" id="scan-status" style="display:none">
                                <span class="scan-status-dot" id="scan-status-dot"></span>
                                <span id="scan-status-text">Scanning for QR codes...</span>
                            </div>
                            <div class="scan-result-box" id="scan-result-box">Scan a QR code to see results here...</div>
                            <button id="scan-again-btn">Scan Again</button>
                        </div>
                    </div>

                    <!-- SCAN IMAGE PANEL -->
                    <div class="tab-panel" id="panel-image">
                        <div class="image-drop-zone" id="image-drop-zone">
                            <div class="folder-icon">📁</div>
                            <div class="image-drop-title">Choose an image to scan</div>
                            <div class="image-drop-sub">PNG · JPG · WEBP · GIF · BMP</div>
                            <button class="btn-browse-files" id="browse-files-btn">Browse files</button>
                            <input type="file" id="qr-image-upload" accept="image/*" style="display:none">
                        </div>
                        <div class="scanned-result-section">
                            <div class="scanned-result-header">
                                <h3>Scanned Result</h3>
                                <button class="history-btn">History <span class="history-dot"></span></button>
                            </div>
                            <div class="scan-status" id="scan-status-img" style="display:none">
                                <span class="scan-status-dot" id="scan-status-dot-img"></span>
                                <span id="scan-status-text-img">Waiting for image...</span>
                            </div>
                            <div class="scan-result-box" id="scan-result-box-img">Scan a QR code to see results here...</div>
                            <button id="scan-again-btn-img">Scan Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
        this.setupModalEvents();
    }

    // ---------- EVENTS ----------
    setupModalEvents() {
        const $ = (s) => this.modal.querySelector(s);

        $('.close-scanner').addEventListener('click', () => this.closeScanner());
        this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.closeScanner(); });

        // Tabs
        this.modal.querySelectorAll('.scan-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.modal.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
                this.modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
                // If switching away from camera while on, stop camera
                if (tab.dataset.tab !== 'camera' && this.html5QrCode) this.stopCamera();
            });
        });

        // Start / Stop camera
        $('#start-camera-btn').addEventListener('click', () => this.startCamera());
        $('#stop-camera-btn').addEventListener('click', () => this.stopCamera());
        $('#switch-camera-btn').addEventListener('click', () => this.switchCamera());
        $('#torch-btn').addEventListener('click', () => this.toggleTorch());

        // Camera select
        $('#camera-select').addEventListener('change', (e) => {
            this.currentCameraId = e.target.value;
            this.stopCamera().then(() => this.startCamera());
        });

        // Zoom slider
        $('#zoom-slider').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            $('#zoom-value').textContent = val.toFixed(1) + 'x';
            this.applyZoom(val);
        });

        // File upload
        $('#browse-files-btn').addEventListener('click', () => $('#qr-image-upload').click());
        $('#image-drop-zone').addEventListener('click', (e) => {
            if (e.target.id !== 'browse-files-btn') $('#qr-image-upload').click();
        });
        $('#qr-image-upload').addEventListener('change', (e) => this.handleFileUpload(e));

        // Scan again (both panels)
        $('#scan-again-btn').addEventListener('click', () => {
            $('#scan-again-btn').style.display = 'none';
            this.clearResult('camera');
            this.startCamera();
        });
        $('#scan-again-btn-img').addEventListener('click', () => {
            $('#scan-again-btn-img').style.display = 'none';
            this.clearResult('image');
            $('#qr-image-upload').value = '';
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) this.closeScanner();
        });
    }

    // ---------- OPEN MODAL ----------
    async openScanner(activityId = null) {
        if (this.isScanning) return;
        this.currentActivityId = activityId;
        this.lastScannedCode = null;
        this.currentImagePreview = null; // Reset preview

        // Reset UI
        document.getElementById('cameraOff').style.display = 'flex';
        document.getElementById('cameraOn').style.display = 'none';
        document.getElementById('scan-status').style.display = 'none';
        document.getElementById('scan-again-btn').style.display = 'none';
        this.clearResult('camera');
        this.clearResult('image');

        // Reset tabs to Camera
        this.modal.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
        this.modal.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        this.modal.querySelector('.scan-tab[data-tab="camera"]').classList.add('active');
        document.getElementById('panel-camera').classList.add('active');

        this.modal.style.display = 'block';
        this.isScanning = true;
        this.useFallback = false;

        if (typeof Html5Qrcode === 'undefined') {
            this.updateStatus('camera', 'QR Scanner library not loaded', 'error');
            return;
        }
    }

    // ---------- ENUMERATE CAMERAS ----------
    async loadCameras() {
        try {
            try {
                const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
                tmp.getTracks().forEach(t => t.stop());
            } catch (e) { }

            const cams = await Html5Qrcode.getCameras();
            this.cameras = cams || [];

            const select = document.getElementById('camera-select');
            select.innerHTML = '';

            if (this.cameras.length === 0) {
                select.innerHTML = '<option>No cameras found</option>';
                return false;
            }

            this.cameras.forEach((cam, i) => {
                const opt = document.createElement('option');
                opt.value = cam.id;
                opt.textContent = cam.label || `Camera ${i + 1}`;
                select.appendChild(opt);
            });

            const backCam = this.cameras.find(c => /back|rear|environment/i.test(c.label));
            this.currentCameraId = backCam ? backCam.id : this.cameras[0].id;
            select.value = this.currentCameraId;
            return true;
        } catch (err) {
            console.error('Camera enumeration failed:', err);
            this.updateStatus('camera', 'Camera permission denied', 'error');
            return false;
        }
    }

    // ---------- START CAMERA ----------
    async startCamera() {
        document.getElementById('cameraOff').style.display = 'none';
        document.getElementById('cameraOn').style.display = 'block';
        document.getElementById('scan-status').style.display = 'flex';
        this.updateStatus('camera', 'Requesting camera permission...', 'scanning');

        if (this.cameras.length === 0) {
            const ok = await this.loadCameras();
            if (!ok) {
                this.stopCamera();
                return;
            }
        }

        if (!this.html5QrCode) {
            this.html5QrCode = new Html5Qrcode("qr-reader", { verbose: false });
        }

        const config = {
            fps: 10,
            qrbox: (w, h) => {
                const size = Math.min(w, h) * 0.7;
                return { width: size, height: size };
            },
            aspectRatio: 1.0
        };

        try {
            await this.html5QrCode.start(
                this.currentCameraId,
                config,
                (decodedText) => this.onScanSuccess(decodedText),
                () => { }
            );

            this.detectCapabilities();
            document.getElementById('scan-laser').classList.add('running');
            this.updateStatus('camera', 'Scanning for QR codes...', 'scanning');
            this.clearResult('camera');
        } catch (err) {
            console.error('Camera start failed:', err);
            this.updateStatus('camera', 'Could not start camera: ' + (err.message || err), 'error');
            this.stopCamera();
        }
    }

    // ---------- STOP CAMERA ----------
    async stopCamera() {
        document.getElementById('scan-laser').classList.remove('running');
        if (this.html5QrCode) {
            try { await this.html5QrCode.stop(); } catch (e) { }
        }
        document.getElementById('cameraOff').style.display = 'flex';
        document.getElementById('cameraOn').style.display = 'none';
        document.getElementById('scan-status').style.display = 'none';
    }

    // ---------- SWITCH CAMERA ----------
    async switchCamera() {
        if (this.cameras.length < 2) return;
        const currentIdx = this.cameras.findIndex(c => c.id === this.currentCameraId);
        const nextIdx = (currentIdx + 1) % this.cameras.length;
        this.currentCameraId = this.cameras[nextIdx].id;
        document.getElementById('camera-select').value = this.currentCameraId;

        await this.stopCamera();
        document.getElementById('cameraOff').style.display = 'none';
        document.getElementById('cameraOn').style.display = 'block';
        await this.startCamera();
    }

    // ---------- DETECT CAPABILITIES (zoom + torch) ----------
    detectCapabilities() {
        const video = document.querySelector('#qr-reader video');
        if (!video) return;
        const stream = video.srcObject;
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (!track) return;

        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.zoom) {
            this.zoomSupported = true;
            this.originalZoom = caps.zoom.min || 1;
            const slider = document.getElementById('zoom-slider');
            slider.min = caps.zoom.min || 1;
            slider.max = caps.zoom.max || 5;
            slider.step = caps.zoom.step || 0.1;
            slider.value = caps.zoom.min || 1;
            document.getElementById('zoom-value').textContent = parseFloat(slider.value).toFixed(1) + 'x';
        } else {
            this.zoomSupported = false;
        }

        const torchBtn = document.getElementById('torch-btn');
        if (caps.torch === true) {
            torchBtn.style.opacity = '1';
            torchBtn.style.pointerEvents = 'auto';
            this.currentTrack = track;
        } else {
            torchBtn.style.opacity = '.4';
            torchBtn.style.pointerEvents = 'none';
            this.currentTrack = null;
        }
    }

    async applyZoom(value) {
        if (!this.zoomSupported) return;
        const video = document.querySelector('#qr-reader video');
        if (!video || !video.srcObject) return;
        const track = video.srcObject.getVideoTracks()[0];
        if (!track) return;
        try {
            await track.applyConstraints({ advanced: [{ zoom: value }] });
        } catch (e) {
            console.log('Zoom apply failed:', e);
        }
    }

    async toggleTorch() {
        if (!this.currentTrack) return;
        const btn = document.getElementById('torch-btn');
        const on = btn.classList.toggle('active');
        try {
            await this.currentTrack.applyConstraints({ advanced: [{ torch: on }] });
        } catch (e) {
            console.log('Torch failed:', e);
            btn.classList.remove('active');
        }
    }

    // ---------- SCAN SUCCESS ----------
    async onScanSuccess(decodedText) {
        const now = Date.now();
        if (this.lastScannedCode && now - this.lastScannedCode.time < this.scanCooldown && this.lastScannedCode.data === decodedText) {
            return;
        }
        this.lastScannedCode = { data: decodedText, time: now };

        document.getElementById('scan-laser').classList.remove('running');
        if (this.html5QrCode) { try { await this.html5QrCode.pause(true); } catch(e){} }

        this.updateStatus('camera', 'QR code detected! Processing...', 'scanning');
        this.processScannedData(decodedText);
    }

    // ---------- PROCESS DATA ----------
    async processScannedData(data, panel = 'camera') {
        try {
            // Send the ENTIRE scanned string to the API to validate the exact QR code
            const res = await fetch(`../class/ApiHandler.php?action=getQR&qr_code=${encodeURIComponent(data)}`);
            const qrResponse = await res.json();
            
            if (qrResponse.success && qrResponse.data) {
                // If valid and not expired, process the attendance using the true activity_id
                this.processAttendanceFromQR(qrResponse, panel);
            } else {
                // Show the exact error message (e.g., "This QR Code has expired")
                this.showResult(panel, qrResponse.message || 'Invalid QR code', 'error');
            }
            
        } catch (error) {
            console.error("Process scanned data error:", error);
            this.showResult(panel, 'Unrecognized QR code format', 'error');
        }
    }

    async processAttendanceFromQR(qrData, panel = 'camera') {
        if (!qrData || typeof qrData !== 'object' || !qrData.data || !qrData.data.activity_id) {
            this.showResult(panel, 'The system doesn\'t recognize this code', 'error');
            return;
        }
        await this.submitAttendance(qrData.data.activity_id, qrData, panel);
    }

    async submitAttendance(activityId, data, panel = 'camera') {
        try {
            this.showResult(panel, 'Submitting attendance...', 'loading');

            const uniqueId = document.getElementById('unique_id')?.value;
            if (!uniqueId) throw new Error('User not logged in');
            const dept = document.getElementById('department_id')?.value || 0;
            const daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const today = new Date();

            const payload = {
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

            const res = await fetch('../class/ApiHandler.php?entity=attendance&action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (result.success) {
                if (data.data.id) {
                    await fetch(`../class/ApiHandler.php?entity=activity_qr_codes&action=update&id=${data.data.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ uses: (data.data.uses || 0) + 1 })
                    });
                }
                this.showResult(panel, 'Attendance recorded!', 'success');
                setTimeout(() => this.closeScanner(), 2000);
            } else {
                throw new Error(result.message || 'Failed to record attendance');
            }
        } catch (err) {
            this.showResult(panel, 'Submission failed: ' + err.message, 'error');
        }
    }

    // ---------- FILE UPLOAD SCAN ----------    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Save the image URL for the preview
        this.currentImagePreview = URL.createObjectURL(file);

        this.showResult('image', 'Processing image...', 'loading');

        try {
            const tempScanner = new Html5Qrcode("qr-reader", { verbose: false });
            const decodedText = await tempScanner.scanFile(file, true);
            
            // Pass 'image' so it updates the correct panel
            this.processScannedData(decodedText, 'image'); 
            
        } catch (err) {
            console.error('File scan failed:', err);
            this.showResult('image', 'No QR code found in this image', 'error');
        }
    }

    // ---------- UI HELPERS ----------
    updateStatus(panel, text, state = 'scanning') {
        const idSuffix = panel === 'camera' ? '' : '-img';
        const textEl = document.getElementById('scan-status-text' + idSuffix);
        const dotEl  = document.getElementById('scan-status-dot' + idSuffix);
        const rowEl  = document.getElementById('scan-status' + idSuffix);
        if (!textEl || !dotEl) return;

        textEl.textContent = text;
        dotEl.className = 'scan-status-dot ' + (state === 'scanning' ? '' : state);
        if (rowEl) rowEl.style.display = 'flex';
    }

    showResult(panel, message, type = 'info') {
        const idSuffix = panel === 'camera' ? '' : '-img';
        const box = document.getElementById('scan-result-box' + idSuffix);
        const againBtn = document.getElementById('scan-again-btn' + idSuffix);
        if (!box) return;

        // Reset content
        box.innerHTML = '';
        box.className = 'scan-result-box ' + (type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'loading' ? 'loading' : '');

        // If it's the image panel and we have a preview, prepend the image
        if (panel === 'image' && this.currentImagePreview && type !== 'loading') {
            const img = document.createElement('img');
            img.src = this.currentImagePreview;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '10px';
            img.style.objectFit = 'contain';
            box.appendChild(img);
            
            const textNode = document.createElement('div');
            textNode.textContent = message;
            box.appendChild(textNode);
        } else {
            box.textContent = message;
        }

        const stateMap = { success: 'success', error: 'error', loading: 'scanning', info: 'idle' };
        this.updateStatus(panel, message, stateMap[type] || 'scanning');

        if (againBtn && (type === 'success' || type === 'error' || type === 'info')) {
            againBtn.style.display = 'inline-block';
        }
    }

    clearResult(panel) {
        const idSuffix = panel === 'camera' ? '' : '-img';
        const box = document.getElementById('scan-result-box' + idSuffix);
        const againBtn = document.getElementById('scan-again-btn' + idSuffix);
        
        if (box) {
            box.className = 'scan-result-box';
            box.innerHTML = 'Scan a QR code to see results here...'; // Reset innerHTML
        }
        if (againBtn) againBtn.style.display = 'none';
        
        // Clear the image memory if clearing the image panel
        if (panel === 'image') {
            this.currentImagePreview = null;
        }
    }

    // ---------- CLOSE ----------
    async closeScanner() {
        document.getElementById('scan-laser').classList.remove('running');
        if (this.html5QrCode) {
            try { await this.html5QrCode.stop(); } catch (e) {}
            try { this.html5QrCode.clear(); } catch (e) {}
            this.html5QrCode = null;
        }
        if (this.modal) this.modal.style.display = 'none';
        this.isScanning = false;
        this.lastScannedCode = null;
        this.cameras = [];
        this.currentCameraId = null;
        this.currentImagePreview = null; // Reset preview on close
    }
}

// Global opener
function openQRScanner(activityId = null) {
    if (!window.qrCodeScanner) window.qrCodeScanner = new QRCodeScanner();
    window.qrCodeScanner.openScanner(activityId);
}