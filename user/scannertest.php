<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scanner Mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;min-height:100vh;display:grid;place-items:center;padding:20px}

.qr-scanner-modal{position:relative;width:100%;max-width:480px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.15);overflow:hidden}

.qr-scanner-header{display:flex;justify-content:flex-end;padding:16px 16px 0;background:#fff}
.close-scanner{width:40px;height:40px;background:#f5f5f5;border:none;border-radius:50%;font-size:22px;cursor:pointer;color:#333;display:flex;align-items:center;justify-content:center}
.close-scanner:hover{background:#e8e8e8}

.qr-scanner-body{padding:16px 20px 20px;background:#fff}

/* Tab bar */
.scan-tabs{display:flex;border-bottom:1px solid #eee;margin-bottom:16px}
.scan-tab{flex:1;padding:14px 10px;background:none;border:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500;color:#888;display:flex;align-items:center;justify-content:center;gap:8px;border-bottom:3px solid transparent;transition:all .2s}
.scan-tab.active{color:#4A90E2;border-bottom-color:#4A90E2}
.scan-tab svg{width:20px;height:20px}

.tab-panel{display:none}
.tab-panel.active{display:block}

/* CAMERA OFF state */
.camera-off-box{width:100%;aspect-ratio:1/1;background:#f8f9fa;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;margin-bottom:16px;border:1px dashed #ddd}
.camera-off-icon{font-size:64px;color:#bbb;margin-bottom:16px}
.camera-off-title{font-size:15px;font-weight:600;color:#333;margin-bottom:6px}
.camera-off-sub{font-size:13px;color:#888;margin-bottom:20px}

.btn-start-camera{width:100%;max-width:280px;padding:14px 20px;background:#4A90E2;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 4px 12px rgba(74,144,226,.35)}
.btn-start-camera:hover{background:#357ABD}

/* CAMERA ON state */
.camera-wrapper{position:relative;width:100%;aspect-ratio:1/1;background:#1a1a1a;border-radius:16px;overflow:hidden;margin-bottom:16px}
.camera-preview{width:100%;height:100%;background:linear-gradient(135deg,#2c2c3e 0%,#1a1a2e 50%,#16213e 100%)}

.corner-bracket{position:absolute;width:44px;height:44px;border-color:#FFC107;border-style:solid;pointer-events:none;z-index:10}
.corner-tl{top:30px;left:30px;border-width:4px 0 0 4px;border-top-left-radius:10px}
.corner-tr{top:30px;right:30px;border-width:4px 4px 0 0;border-top-right-radius:10px}
.corner-bl{bottom:30px;left:30px;border-width:0 0 4px 4px;border-bottom-left-radius:10px}
.corner-br{bottom:30px;right:30px;border-width:0 4px 4px 0;border-bottom-right-radius:10px}

.scan-laser{position:absolute;left:30px;right:30px;height:3px;background:linear-gradient(to right,transparent,#FFC107 20%,#FF9800 50%,#FFC107 80%,transparent);box-shadow:0 0 12px #FFC107,0 0 24px rgba(255,152,0,.6);z-index:5;border-radius:2px;animation:scanAnim 2.5s ease-in-out infinite}
@keyframes scanAnim{0%{top:30px}50%{top:calc(100% - 33px)}100%{top:30px}}

.camera-controls{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.btn-stop-camera{flex:1;padding:14px 18px;background:#E53935;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-family:inherit}
.btn-stop-camera .stop-square{width:12px;height:12px;background:#fff;border-radius:2px}
.btn-icon-circle{width:50px;height:50px;flex:0 0 50px;border:1px solid #e0e0e0;background:#fff;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333;font-size:20px}

.camera-select{width:100%;padding:14px 16px;border:2px solid #4A90E2;border-radius:10px;background:#fff;font-size:14px;font-family:inherit;color:#333;cursor:pointer;margin-bottom:12px;appearance:none;background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");background-repeat:no-repeat;background-position:right 14px center;background-size:18px;padding-right:44px}

.zoom-control{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.zoom-label{font-size:14px;color:#333;font-weight:500;min-width:45px}
.zoom-slider{flex:1;height:4px;-webkit-appearance:none;background:#e0e0e0;border-radius:2px;outline:none}
.zoom-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#4A90E2;cursor:pointer;box-shadow:0 2px 6px rgba(74,144,226,.4)}
.zoom-value{font-size:13px;color:#666;font-weight:500;min-width:40px;text-align:right}

.scanned-result-section{border-top:1px solid #eee;padding-top:20px}
.scanned-result-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.scanned-result-header h3{font-size:18px;font-weight:700;color:#1a1a1a}
.history-btn{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#f5f5f5;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:#333;font-family:inherit}
.history-dot{width:8px;height:8px;border-radius:50%;background:#4CAF50;box-shadow:0 0 0 3px rgba(76,175,80,.15)}
.scan-status{display:flex;align-items:center;gap:10px;color:#888;font-size:14px;margin-bottom:14px}
.scan-status-dot{width:10px;height:10px;border-radius:50%;background:#FFC107;box-shadow:0 0 0 4px rgba(255,193,7,.2);animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.scan-result-box{min-height:110px;padding:24px 20px;background:#f8f9fa;border-radius:12px;display:flex;align-items:center;justify-content:center;text-align:center;color:#999;font-style:italic;font-size:14px}

/* SCAN IMAGE tab */
.image-drop-zone{width:100%;min-height:260px;border:2px dashed #d0d0d0;border-radius:16px;background:#f8f9fa;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;text-align:center;margin-bottom:16px;cursor:pointer}
.image-drop-zone:hover{border-color:#4A90E2;background:#f0f7ff}
.folder-icon{font-size:64px;margin-bottom:20px}
.image-drop-title{font-size:16px;font-weight:600;color:#333;margin-bottom:8px}
.image-drop-sub{font-size:13px;color:#888;margin-bottom:20px}
.btn-browse-files{padding:12px 28px;background:#4A90E2;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
</style>
</head>
<body>

<div class="qr-scanner-modal">
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
            <!-- STATE 1: OFF -->
            <div class="camera-off-box" id="cameraOff">
                <div class="camera-off-icon">📷</div>
                <div class="camera-off-title">Camera is off.</div>
                <div class="camera-off-sub">Press Start Camera to scan.</div>
                <button class="btn-start-camera" onclick="showOn()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Start Camera
                </button>
            </div>

            <!-- STATE 2: ON -->
            <div id="cameraOn" style="display:none">
                <div class="camera-wrapper">
                    <div class="camera-preview"></div>
                    <div class="corner-bracket corner-tl"></div>
                    <div class="corner-bracket corner-tr"></div>
                    <div class="corner-bracket corner-bl"></div>
                    <div class="corner-bracket corner-br"></div>
                    <div class="scan-laser"></div>
                </div>

                <div class="camera-controls">
                    <button class="btn-stop-camera" onclick="showOff()">
                        <span class="stop-square"></span> Stop Camera
                    </button>
                    <button class="btn-icon-circle">⚡</button>
                    <button class="btn-icon-circle">🔄</button>
                </div>

                <select class="camera-select">
                    <option>Back camera</option>
                    <option>Front camera</option>
                </select>

                <div class="zoom-control">
                    <span class="zoom-label">Zoom</span>
                    <input type="range" class="zoom-slider" min="1" max="5" value="1" step="0.1">
                    <span class="zoom-value">1.0x</span>
                </div>
            </div>

            <!-- Scanned Result (always shown in camera tab) -->
            <div class="scanned-result-section">
                <div class="scanned-result-header">
                    <h3>Scanned Result</h3>
                    <button class="history-btn">History <span class="history-dot"></span></button>
                </div>
                <div class="scan-status" id="statusRow" style="display:none">
                    <span class="scan-status-dot"></span>
                    <span>Scanning for QR codes...</span>
                </div>
                <div class="scan-result-box">Scan a QR code to see results here...</div>
            </div>
        </div>

        <!-- SCAN IMAGE PANEL -->
        <div class="tab-panel" id="panel-image">
            <div class="image-drop-zone">
                <div class="folder-icon">📁</div>
                <div class="image-drop-title">Choose an image to scan</div>
                <div class="image-drop-sub">PNG · JPG · WEBP · GIF · BMP</div>
                <button class="btn-browse-files">Browse files</button>
            </div>
            <div class="scanned-result-section">
                <div class="scanned-result-header">
                    <h3>Scanned Result</h3>
                    <button class="history-btn">History <span class="history-dot"></span></button>
                </div>
                <div class="scan-result-box">Scan a QR code to see results here...</div>
            </div>
        </div>
    </div>
</div>

<script>
// Tab switching
document.querySelectorAll('.scan-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});
// Camera on/off toggle (demo)
function showOn(){document.getElementById('cameraOff').style.display='none';document.getElementById('cameraOn').style.display='block';document.getElementById('statusRow').style.display='flex'}
function showOff(){document.getElementById('cameraOff').style.display='flex';document.getElementById('cameraOn').style.display='none';document.getElementById('statusRow').style.display='none'}
// Zoom value
document.querySelector('.zoom-slider')?.addEventListener('input',e=>{document.querySelector('.zoom-value').textContent=parseFloat(e.target.value).toFixed(1)+'x'});
</script>
</body>
</html>