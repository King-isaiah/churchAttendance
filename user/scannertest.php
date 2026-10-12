<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Scanner UI Mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
        font-family: 'Inter', system-ui, sans-serif;
        background: #f0f2f5;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
    }

    /* ============================================
       MODAL OVERLAY - LIGHT, ALMOST FULL SCREEN
       ============================================ */
    .qr-scanner-modal {
        position: relative;
        width: 100%;
        max-width: 480px;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* ============================================
       HEADER - JUST THE X BUTTON
       ============================================ */
    .qr-scanner-header {
        display: flex;
        justify-content: flex-end;
        padding: 16px 16px 0;
        background: #ffffff;
    }

    .close-scanner {
        width: 40px;
        height: 40px;
        background: #f5f5f5;
        border: none;
        border-radius: 50%;
        font-size: 22px;
        cursor: pointer;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .close-scanner:hover {
        background: #e8e8e8;
    }

    /* ============================================
       BODY
       ============================================ */
    .qr-scanner-body {
        padding: 16px 20px 20px;
        background: #ffffff;
    }

    /* ============================================
       CAMERA WRAPPER WITH ROUNDED CORNERS
       ============================================ */
    .camera-wrapper {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        background: #1a1a1a;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 16px;
    }

    /* Simulated camera view */
    .camera-preview {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #2c2c3e 0%, #1a1a2e 50%, #16213e 100%);
        position: relative;
    }

    /* Yellow corner brackets */
    .corner-bracket {
        position: absolute;
        width: 44px;
        height: 44px;
        border-color: #FFC107;
        border-style: solid;
        pointer-events: none;
        z-index: 10;
    }

    .corner-tl {
        top: 30px;
        left: 30px;
        border-width: 4px 0 0 4px;
        border-top-left-radius: 10px;
    }

    .corner-tr {
        top: 30px;
        right: 30px;
        border-width: 4px 4px 0 0;
        border-top-right-radius: 10px;
    }

    .corner-bl {
        bottom: 30px;
        left: 30px;
        border-width: 0 0 4px 4px;
        border-bottom-left-radius: 10px;
    }

    .corner-br {
        bottom: 30px;
        right: 30px;
        border-width: 0 4px 4px 0;
        border-bottom-right-radius: 10px;
    }

    /* Animated scan laser - yellow/orange */
    .scan-laser {
        position: absolute;
        left: 30px;
        right: 30px;
        height: 3px;
        background: linear-gradient(to right, transparent, #FFC107 20%, #FF9800 50%, #FFC107 80%, transparent);
        box-shadow: 0 0 12px #FFC107, 0 0 24px rgba(255, 152, 0, 0.6);
        z-index: 5;
        border-radius: 2px;
        animation: scanAnimation 2.5s ease-in-out infinite;
    }

    @keyframes scanAnimation {
        0%   { top: 30px; }
        50%  { top: calc(100% - 33px); }
        100% { top: 30px; }
    }

    /* ============================================
       CAMERA CONTROLS - STOP BUTTON + ICONS
       ============================================ */
    .camera-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 12px;
    }

    .btn-stop-camera {
        flex: 1;
        padding: 14px 18px;
        background: #E53935;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-family: inherit;
        transition: background 0.2s;
    }

    .btn-stop-camera:hover {
        background: #C62828;
    }

    .btn-stop-camera .stop-square {
        width: 12px;
        height: 12px;
        background: #ffffff;
        border-radius: 2px;
    }

    .btn-icon-circle {
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        border: 1px solid #e0e0e0;
        background: #ffffff;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
        font-size: 20px;
        transition: background 0.2s, border-color 0.2s;
    }

    .btn-icon-circle:hover {
        background: #f5f5f5;
        border-color: #ccc;
    }

    /* ============================================
       CAMERA SELECTOR DROPDOWN
       ============================================ */
    .camera-select {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #4A90E2;
        border-radius: 10px;
        background: #ffffff;
        font-size: 14px;
        font-family: inherit;
        color: #333;
        cursor: pointer;
        margin-bottom: 12px;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 18px;
        padding-right: 44px;
    }

    .camera-select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
    }

    /* ============================================
       ZOOM SLIDER
       ============================================ */
    .zoom-control {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
    }

    .zoom-label {
        font-size: 14px;
        color: #333;
        font-weight: 500;
        min-width: 45px;
    }

    .zoom-slider {
        flex: 1;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: #e0e0e0;
        border-radius: 2px;
        outline: none;
    }

    .zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4A90E2;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(74, 144, 226, 0.4);
    }

    .zoom-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #4A90E2;
        cursor: pointer;
        border: none;
    }

    .zoom-value {
        font-size: 13px;
        color: #666;
        font-weight: 500;
        min-width: 40px;
        text-align: right;
    }

    /* ============================================
       SCANNED RESULT SECTION
       ============================================ */
    .scanned-result-section {
        border-top: 1px solid #eee;
        padding-top: 20px;
    }

    .scanned-result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .scanned-result-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #1a1a1a;
    }

    .history-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: #f5f5f5;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        color: #333;
        font-family: inherit;
        transition: background 0.2s;
    }

    .history-btn:hover {
        background: #e8e8e8;
    }

    .history-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
    }

    .scan-status {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #888;
        font-size: 14px;
        margin-bottom: 14px;
    }

    .scan-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #FFC107;
        box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
        animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.4; }
    }

    .scan-result-box {
        min-height: 110px;
        padding: 24px 20px;
        background: #f8f9fa;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #999;
        font-style: italic;
        font-size: 14px;
    }

    @media (max-width: 480px) {
        body { padding: 0; }
        .qr-scanner-modal {
            border-radius: 0;
            max-width: 100%;
            min-height: 100vh;
        }
    }
</style>
</head>
<body>

<div class="qr-scanner-modal">
    <!-- Header: Just the X button -->
    <div class="qr-scanner-header">
        <button class="close-scanner" aria-label="Close">&times;</button>
    </div>

    <!-- Body -->
    <div class="qr-scanner-body">
        <!-- Camera area -->
        <div class="camera-wrapper">
            <div class="camera-preview"></div>

            <!-- Yellow corner brackets -->
            <div class="corner-bracket corner-tl"></div>
            <div class="corner-bracket corner-tr"></div>
            <div class="corner-bracket corner-bl"></div>
            <div class="corner-bracket corner-br"></div>

            <!-- Animated laser -->
            <div class="scan-laser"></div>
        </div>

        <!-- Camera controls -->
        <div class="camera-controls">
            <button class="btn-stop-camera">
                <span class="stop-square"></span>
                Stop Camera
            </button>
            <button class="btn-icon-circle" title="Flash">⚡</button>
            <button class="btn-icon-circle" title="Switch Camera">🔄</button>
        </div>

        <!-- Camera dropdown -->
        <select class="camera-select">
            <option>camera 0, facing back</option>
            <option>camera 1, facing front</option>
        </select>

        <!-- Zoom -->
        <div class="zoom-control">
            <span class="zoom-label">Zoom</span>
            <input type="range" class="zoom-slider" min="1" max="5" value="1" step="0.1">
            <span class="zoom-value">1.0x</span>
        </div>

        <!-- Scanned Result -->
        <div class="scanned-result-section">
            <div class="scanned-result-header">
                <h3>Scanned Result</h3>
                <button class="history-btn">
                    History <span class="history-dot"></span>
                </button>
            </div>

            <div class="scan-status">
                <span class="scan-status-dot"></span>
                Scanning for QR codes...
            </div>

            <div class="scan-result-box">
                Scan a QR code to see results here...
            </div>
        </div>
    </div>
</div>

</body>
</html>