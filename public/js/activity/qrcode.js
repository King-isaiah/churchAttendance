// Show QR Code Modal
function showQRCodeModal(activityId) {
    console.log(activityId)
    // Create modal HTML if it doesn't exist
    let modal = document.getElementById('qrCodeModal');
    if (!modal) {
        const modalHtml = `
            <div class="modal" id="qrCodeModal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Generate QR Code</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="qr-code-section">
                            <div class="qr-code-preview" id="qrCodePreview">
                                <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                                    <i class="fas fa-qrcode" style="font-size: 48px; color: #666; margin-bottom: 10px;"></i>
                                    <p style="color: #666; margin: 0;">QR Code will appear here after generation</p>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="qrExpiry">QR Code Expiry</label>
                                <select id="qrExpiry">
                                    <option value="1">1 hour</option>
                                    <option value="3" selected>3 hours</option>
                                    <option value="6">6 hours</option>
                                    <option value="24">24 hours</option>
                                    <option value="24">To infinity and beyond</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="maxUses">Maximum Uses</label>
                                <input type="number" id="maxUses" min="1" max="1000" value="100">
                            </div>
                            
                            <div class="info-box">
                                <i class="fas fa-info-circle"></i>
                                <p>Generate a QR code that attendees can scan to mark attendance. 
                                The QR code will expire based on your settings.</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary close-modal">Cancel</button>
                        <button class="btn-primary" id="generateQRBtn">
                            <i class="fas fa-sync"></i> Generate QR Code
                        </button>
                        <button class="btn-info" id="downloadQRBtn" style="display: none;">
                            <i class="fas fa-download"></i> Download QR
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('qrCodeModal');
        
        // Add event listeners for the modal
        setupQRModalEventListeners();
    }
    
    // Set current activity ID
    modal.dataset.activityId = activityId;
    
    // Show modal
    modal.style.display = 'block';
    
    // Check if QR code already exists and update button text
    checkExistingQRCode(activityId);
}

// Check if QR code exists and update button
async function checkExistingQRCode(activityId) {
    try {
        const response = await fetch(`class/ApiHandler.php?entity=activity_qr_codes&action=getQR&id=${activityId}`);
        const data = await response.json();
        
        if (data.success && data.qr_data) {
            const generateBtn = document.getElementById('generateQRBtn');
            generateBtn.innerHTML = '<i class="fas fa-edit"></i> Regenerate QR Code';
            generateBtn.title = "Generate new QR code (will deactivate existing one)";
            
            // Display existing QR code
            displayQRCode(data.qr_data, true);
            document.getElementById('downloadQRBtn').style.display = 'inline-block';
        }
    } catch (error) {
        console.log('No existing QR code found');
    }
}

// Setup QR Modal Event Listeners
function setupQRModalEventListeners() {
    const modal = document.getElementById('qrCodeModal');
    const closeBtn = modal.querySelector('.close-modal');
    const generateBtn = document.getElementById('generateQRBtn');
    const downloadBtn = document.getElementById('downloadQRBtn');
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Generate QR Code
    generateBtn.addEventListener('click', () => {
        const activityId = modal.dataset.activityId;
        generateQRCode(activityId);
    });
    
    // Download QR Code
    downloadBtn.addEventListener('click', () => {
        downloadQRCode(modal.dataset.activityId);
    });
}

// Generate QR Code - UPDATED with image generation
async function generateQRCode(activityId) {
    const expiry = document.getElementById('qrExpiry').value;
    const maxUses = document.getElementById('maxUses').value;
    const generateBtn = document.getElementById('generateQRBtn');
    
    // Show loading state
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('class/ApiHandler.php?entity=activity_qr_codes&action=generateQR', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity_id: activityId,
                expiry_hours: expiry,
                max_uses: maxUses
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display QR code with actual image
            displayQRCode(data.qr_data, false);
            document.getElementById('downloadQRBtn').style.display = 'inline-block';
            
            // Update button to show regenerate option
            generateBtn.innerHTML = '<i class="fas fa-edit"></i> Regenerate QR Code';
            generateBtn.title = "Generate new QR code (will deactivate existing one)";
            
            showSuccess('QR code generated successfully!', 'success');
        } else {
            showError('Error generating QR code: ' + data.message, 'error');
        }
    } catch (error) {
        showError('Network error: ' + error.message, 'error');
    } finally {
        generateBtn.disabled = false;
    }
}

// Display QR Code - UPDATED with actual image generation
function displayQRCode(qrData, isExisting = false) {
    const qrPreview = document.getElementById('qrCodePreview');
    
    qrPreview.innerHTML = `
        <div style="text-align: center;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; display: inline-block;">
                <div style="font-family: monospace; font-size: 14px; margin-bottom: 15px; color: #333; font-weight: bold;">
                    ${isExisting ? 'EXISTING' : 'NEW'} ACTIVITY QR CODE
                </div>
                <div id="qrcodeCanvas" style="margin-bottom: 15px; min-height: 200px; display: flex; align-items: center; justify-content: center;"></div>
                <div style="margin-top: 15px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                        <strong>Code:</strong> ${qrData}
                    </div>
                    <div style="font-size: 11px; color: #888;">
                        Scan this code to mark attendance
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Generate actual QR code image
    generateQRImage(qrData, 'qrcodeCanvas');
}

// Generate QR Code Image
function generateQRImage(qrData, containerId) {
    const container = document.getElementById(containerId);
    
    if (typeof QRCode !== 'undefined') {
        // Clear previous QR code
        container.innerHTML = '';
        
        // Generate new QR code
        try {
            const qrcode = new QRCode(container, {
                text: qrData,
                width: 180,
                height: 180,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
            
            // Style the generated canvas
            setTimeout(() => {
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    canvas.style.cssText = `
                        display: block;
                        margin: 0 auto;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    `;
                }
            }, 100);
            
        } catch (error) {
            console.error('QR image generation error:', error);
            showFallbackQR(container, qrData);
        }
    } else {
        showFallbackQR(container, qrData);
    }
}

// Fallback if QR generation fails
function showFallbackQR(container, qrData) {
    container.innerHTML = `
        <div style="text-align: center; color: #666; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 15px; color: #ccc;">📱</div>
            <div style="font-size: 14px; margin-bottom: 10px; color: #999;">QR Code Preview</div>
            <div style="font-family: monospace; font-size: 10px; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${qrData}
            </div>
            <div style="font-size: 11px; color: #ff6b6b; margin-top: 10px;">
                (QR image unavailable - use code above)
            </div>
        </div>
    `;
}

// Download QR Code - UPDATED to download actual image
function downloadQRCode(activityId) {
    const qrPreview = document.getElementById('qrCodePreview');
    const canvas = qrPreview.querySelector('canvas');
    
    if (canvas) {
        // Convert canvas to blob and download
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-${activityId}-qrcode.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('QR code image downloaded!', 'success');
        }, 'image/png');
    } else {
        // Fallback: download as text file
        const qrData = document.querySelector('.qr-code-preview').textContent.match(/Code:\s*(.+)/)[1];
        const textData = `QR Code for Activity ${activityId}\nGenerated on: ${new Date().toLocaleString()}\nCode: ${qrData}`;
        const blob = new Blob([textData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-${activityId}-qrcode.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('QR code data downloaded!', 'success');
    }
}