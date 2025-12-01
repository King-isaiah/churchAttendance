// User Dashboard functionality
class UserDashboard {
    constructor() {
        this.currentActivityId = null;
        this.qrScanner = null;
        this.init();
    }

    init() {
        this.initializeQRScanner();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('qrScannerModal');
            if (e.target === modal) {
                this.closeQRScanner();
            }
        });

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeQRScanner();
            }
        });
    }

    initializeQRScanner() {
        // Check if HTML5 QR code scanner is available
        if (typeof Html5QrcodeScanner !== 'undefined') {
            this.qrScanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_QR_CODE]
                },
                false
            );
        }
    }

    openQRScanner(activityId = null) {
        this.currentActivityId = activityId;
        const modal = document.getElementById('qrScannerModal');
        const scanResult = document.getElementById('scanResult');
        
        // Reset UI
        scanResult.style.display = 'none';
        document.getElementById('qrScanner').style.display = 'block';
        
        // Show modal
        modal.style.display = 'block';

        // Start scanner if available
        if (this.qrScanner) {
            this.qrScanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
        } else {
            this.showMessage('QR Scanner not available. Please try manual entry.', 'error');
        }
    }

    closeQRScanner() {
        const modal = document.getElementById('qrScannerModal');
        modal.style.display = 'none';
        
        // Stop scanner if running
        if (this.qrScanner) {
            this.qrScanner.clear();
        }
    }

    onScanSuccess(decodedText, decodedResult) {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        
        // Process the scanned QR code
        this.processQRCode(decodedText);
        
        // Stop scanner
        if (this.qrScanner) {
            this.qrScanner.clear();
        }
        
        // Show success message
        this.showScanResult('Attendance marked successfully!', 'success');
    }

    onScanFailure(error) {
        // Handle scan failure silently - usually just camera not available or permission denied
        console.log('QR scan failed:', error);
    }

    async processQRCode(qrData) {
        try {
            // Show loading state
            this.showScanResult('Processing QR code...', 'loading');

            // Simulate API call to mark attendance
            const response = await this.markAttendance(qrData);
            
            if (response.success) {
                this.showScanResult('Attendance marked successfully!', 'success');
                
                // Update dashboard stats after successful attendance
                setTimeout(() => {
                    this.loadDashboardData();
                    this.closeQRScanner();
                }, 2000);
            } else {
                this.showScanResult(response.message || 'Failed to mark attendance', 'error');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            this.showScanResult('Error processing QR code', 'error');
        }
    }

    async markAttendance(qrData) {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock successful response
                resolve({
                    success: true,
                    message: 'Attendance marked successfully',
                    activity: 'Sunday Service',
                    timestamp: new Date().toISOString()
                });
            }, 1000);
        });

        // Actual implementation would be:
        /*
        try {
            const response = await fetch('class/ApiHandler.php?entity=attendance&action=mark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    qr_code: qrData,
                    activity_id: this.currentActivityId
                })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error');
        }
        */
    }

    showScanResult(message, type) {
        const scanResult = document.getElementById('scanResult');
        const qrScanner = document.getElementById('qrScanner');
        
        qrScanner.style.display = 'none';
        scanResult.style.display = 'block';
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-times-circle' : 'fa-spinner fa-spin';
        const color = type === 'success' ? 'green' : 
                     type === 'error' ? 'red' : 'blue';
        
        scanResult.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas ${icon}" style="font-size: 3rem; color: ${color}; margin-bottom: 1rem;"></i>
                <h3 style="color: ${color}; margin-bottom: 1rem;">${message}</h3>
                ${type === 'loading' ? '<p>Please wait...</p>' : ''}
                <button class="btn-primary" onclick="userDashboard.closeQRScanner()" style="margin-top: 1rem;">
                    Close
                </button>
            </div>
        `;
    }

    async loadDashboardData() {
        try {
            // Simulate loading dashboard data
            const data = await this.fetchDashboardData();
            this.updateDashboardUI(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async fetchDashboardData() {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    present_count: 15,
                    upcoming_count: 5,
                    attendance_rate: 85,
                    current_streak: 3,
                    recent_attendance: [
                        {
                            date: '2024-01-21',
                            activity_name: 'Sunday Service',
                            time: '10:00 AM',
                            status: 'present'
                        },
                        {
                            date: '2024-01-20',
                            activity_name: 'Youth Night',
                            time: '6:00 PM',
                            status: 'absent'
                        }
                    ]
                });
            }, 500);
        });

        // Actual implementation would be:
        /*
        try {
            const response = await fetch('class/ApiHandler.php?entity=dashboard&action=getUserData');
            return await response.json();
        } catch (error) {
            throw new Error('Failed to load dashboard data');
        }
        */
    }

    updateDashboardUI(data) {
        // Update stats cards
        document.querySelector('.stat-card:nth-child(1) h3').textContent = data.present_count;
        document.querySelector('.stat-card:nth-child(2) h3').textContent = data.upcoming_count;
        document.querySelector('.stat-card:nth-child(3) h3').textContent = data.attendance_rate + '%';
        document.querySelector('.stat-card:nth-child(4) h3').textContent = data.current_streak;

        // Update recent attendance
        this.updateRecentAttendance(data.recent_attendance);
    }

    updateRecentAttendance(attendance) {
        const attendanceList = document.querySelector('.attendance-list');
        
        if (attendance && attendance.length > 0) {
            attendanceList.innerHTML = attendance.map(item => `
                <div class="attendance-item ${item.status}">
                    <div class="attendance-date">
                        <strong>${this.formatDate(item.date, 'M j')}</strong>
                        <span>${this.formatDate(item.date, 'D')}</span>
                    </div>
                    <div class="attendance-details">
                        <h4>${item.activity_name}</h4>
                        <p>${item.time}</p>
                    </div>
                    <div class="attendance-status">
                        <span class="status-badge status-${item.status}">
                            ${this.capitalizeFirst(item.status)}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    }

    formatDate(dateString, format) {
        const date = new Date(dateString);
        const options = {
            'M j': { month: 'short', day: 'numeric' },
            'D': { weekday: 'short' }
        };
        return date.toLocaleDateString('en-US', options[format]);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    showMessage(message, type = 'info') {
        // Use your existing toast notification system
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// View activity details
function viewActivityDetails(activityId) {
    // Simulate opening activity details
    console.log('Viewing activity details:', activityId);
    userDashboard.showMessage('Opening activity details...', 'info');
    
    // In a real implementation, this would open a modal or navigate to details page
    // window.location.href = `activity_details.php?id=${activityId}`;
}

// Initialize dashboard when page loads
let userDashboard;
document.addEventListener('DOMContentLoaded', () => {
    userDashboard = new UserDashboard();
    
    // Add close modal functionality
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            userDashboard.closeQRScanner();
        });
    });
});

// Global functions for HTML onclick handlers
function openQRScanner(activityId = null) {
    if (userDashboard) {
        userDashboard.openQRScanner(activityId);
    }
}

function viewActivityDetails(activityId) {
    if (userDashboard) {
        // This would typically open a modal or navigate to activity details
        userDashboard.showMessage(`Viewing details for activity ${activityId}`, 'info');
    }
}