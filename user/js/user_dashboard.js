class UserDashboard {
    constructor() {
        this.currentActivityId = null;
        this.qrScanner = null;
        this.userId = this.getCurrentUserId();
        this.init();
    }

    init() {
        this.centerDiv();
        this.setupEventListeners();
        this.loadDashboardStats();
        this.loadUpcomingActivities();
        this.loadRecentAttendance();
        this.initializeQRScanner();
    }

    centerDiv() {
        const centerDiv = document.getElementById('center-div');
        if (!centerDiv) {
            console.error('center-div element not found!');
            return;
        }
        
        const content = `<div class="user-dashboard">
                            <div class="welcome-section">
                                <h1 id="welcomeMessage"></h1>
                                <p>Here's your attendance overview and upcoming activities</p>
                            </div>

                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon present">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="stat-info">
                                        <h3 id="presentCount">0</h3>
                                        <p>Present Days</p>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon upcoming">
                                        <i class="fas fa-calendar-alt"></i>
                                    </div>
                                    <div class="stat-info">
                                        <h3 id="upcomingCount">0</h3>
                                        <p>Upcoming Activities</p>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon rate">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="stat-info">
                                        <h3 id="attendanceRate">0%</h3>
                                        <p>Attendance Rate</p>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon streak">
                                        <i class="fas fa-fire"></i>
                                    </div>
                                    <div class="stat-info">
                                        <h3 id="currentStreak">0</h3>
                                        <p>Current Streak</p>
                                    </div>
                                </div>
                            </div>

                            <div class="dashboard-content">
                                <div class="dashboard-section">
                                    <div class="section-header">
                                        <h3>Upcoming Activities</h3>
                                        <a href="activities.php" class="view-all">View All</a>
                                    </div>
                                    <div class="activities-list" id="upcomingActivities">
                                        <div class="no-data">
                                            <i class="fas fa-spinner fa-spin"></i>
                                            <p>Loading upcoming activities...</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="dashboard-section">
                                    <div class="section-header">
                                        <h3>Recent Attendance</h3>
                                        <a href="attendance_history.php" class="view-all">View All</a>
                                    </div>
                                    <div class="attendance-list" id="recentAttendance">
                                        <div class="no-data">
                                            <i class="fas fa-spinner fa-spin"></i>
                                            <p>Loading recent attendance...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        
        centerDiv.innerHTML = content;
    }

    getCurrentUserId() {
        const uniqueIdElement = document.getElementById('unique_id');
        if (uniqueIdElement && uniqueIdElement.value) {
            return uniqueIdElement.value;
        }
        
        const storedId = localStorage.getItem('user_unique_id') || 
                         sessionStorage.getItem('user_unique_id');
        
        if (storedId) {
            return storedId;
        }
        
        console.warn('No unique_id found');
        return null;
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

        // Close modal button
        setTimeout(() => {
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', () => this.closeQRScanner());
            });
        }, 100);
    }

    async loadDashboardStats() {
        try {
            const memberResponse = await fetch(`../class/ApiHandler.php?action=getCurrentUser&entity=members`);
            const memberResult = await memberResponse.json();
          
            if (memberResult.success && memberResult.data) {
                const userData = memberResult.data;
                
                // NEW: Update the streak stat card directly from the database
                const streakElement = document.getElementById('currentStreak');
                if (streakElement) {
                    streakElement.textContent = userData.current_streak || 0;
                }

                const memberAttendanceRecord = await fetch(`../class/ApiHandler.php?action=get&entity=reports&id=${userData.unique_id}`);
                const memberReport = await memberAttendanceRecord.json();
                
                this.updateDashboardStats(memberReport);
                
                const welcomeMessage = document.getElementById('welcomeMessage');
                if (welcomeMessage) {
                    welcomeMessage.innerHTML = `Welcome, ${userData.first_name} ${userData.last_name} 👋`;
                }
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.updateDashboardStats([]);
        }
    }

    updateDashboardStats(memberReport) {
        const attendanceRecords = memberReport.data || [];
    
        const presentCount = attendanceRecords.filter(record => 
            record.status && record.status.toLowerCase() === 'present'
        ).length;
        
        const absentCount = attendanceRecords.filter(record => 
            record.status && record.status.toLowerCase() === 'absent'
        ).length;
        
        const totalActivities = presentCount + absentCount;
        const attendanceRate = totalActivities > 0 ? Math.round((presentCount / totalActivities) * 100) : 0;

        document.getElementById('presentCount').textContent = presentCount;
        document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
        
        // REMOVED: The streak calculation here. 
        // loadDashboardStats() already sets the correct database value.
    }

    calculateCurrentStreak(attendanceData) {
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
            return 0;
        }
        
        // Sort by date descending (most recent first)
        const sortedData = [...attendanceData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < sortedData.length; i++) {
            const record = sortedData[i];
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            
            // FIXED: Check for 'present' status directly since present_count doesn't exist here
            if (record.status && record.status.toLowerCase() === 'present') {
                if (i === 0) {
                    streak = 1;
                } else {
                    const prevRecord = sortedData[i - 1];
                    const prevDate = new Date(prevRecord.date);
                    prevDate.setHours(0, 0, 0, 0);
                    
                    const diffDays = Math.floor((prevDate - recordDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        streak++;
                    } else {
                        break; // Streak broken
                    }
                }
            } else {
                break; // No present attendance on this day, streak broken
            }
        }
        
        return streak;
    }

    async loadRecentAttendance() {
        try {
            // Fetch user first to get the unique_id
            const userRes = await fetch(`../class/ApiHandler.php?action=getCurrentUser&entity=members`);
            const userJson = await userRes.json();
            if (!userJson.success) return;
            
            const uniqueId = userJson.data.unique_id;

            // Fetch attendance using unique_id (Handled by our ApiHandler fallback)
            const response = await fetch(`../class/ApiHandler.php?action=get&entity=attendance&id=${uniqueId}`);
            const result = await response.json();

            const container = document.getElementById('recentAttendance');
            if (!container) return;

            if (result.success && Array.isArray(result.data)) {
                const recent = result.data.slice(0, 3);
                this.renderRecentAttendance(recent, container);
            } else {
                container.innerHTML = `<div class="no-data"><i class="fas fa-clipboard-list"></i><p>No attendance records yet</p></div>`;
            }
        } catch (error) {
            console.error('Error loading recent attendance:', error);
            const container = document.getElementById('recentAttendance');
            if (container) {
                container.innerHTML = `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Failed to load attendance records</p></div>`;
            }
        }
    }

    renderRecentAttendance(records, container) {
        if (!records || records.length === 0) {
            container.innerHTML = `<div class="no-data"><i class="fas fa-clipboard-list"></i><p>No attendance records yet</p></div>`;
            return;
        }

        const recordsHTML = records.map(record => {
            // 1. Format the actual Date & Time from created_at
            let dateStr = 'N/A';
            let timeStr = '';
            
            if (record.created_at) {
                const dateObj = new Date(record.created_at);
                // Format: "Oct 24, 2023"
                dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                // Format: "10:30 AM"
                timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }

            // 2. Get the Day of Activity directly from DB (e.g., "Sunday")
            const dayOfActivity = record.dayofactivity || 'N/A';
            
            // 3. Status badge
            const status = record.status || 'Present'; 
            
            return `<div class="attendance-item ${status.toLowerCase()}">
                        <div class="attendance-date">
                            <!-- Shows "Oct 24, 2023" -->
                            <strong style="font-size: 13px; color: #495057;">${dateStr}</strong>
                            <!-- Shows "Sunday" -->
                            <span style="text-transform: capitalize; font-weight: 600; color: #0d6efd; margin-top: 4px; display: block;">${dayOfActivity}</span>
                        </div>
                        <div class="attendance-details">
                            <h4>${record.activity_or_event_name || 'Unknown Activity'}</h4>
                            <!-- Shows check-in time from DB -->
                            <p><i class="fas fa-clock"></i> ${record.check_in_time || timeStr}</p>
                        </div>
                        <div class="attendance-status">
                            <span class="status-badge status-${status.toLowerCase()}">
                                ${status}
                            </span>
                        </div>
                    </div>`;
        }).join('');

        container.innerHTML = recordsHTML;
    }

    async loadUpcomingActivities() {
        try {
            const response = await fetch(`../class/ApiHandler.php?action=getAll&entity=activities`);
            const result = await response.json();

            const container = document.getElementById('upcomingActivities');
            if (!container) return;

            if (result.success && Array.isArray(result.data)) {
                const now = new Date();
                let currentDayOfWeek = now.getDay(); 

                const customDayMap = [1, 2, 3, 4, 5, 6, 7]; 
                currentDayOfWeek = customDayMap[currentDayOfWeek];
                const currentTime = now.getHours() * 60 + now.getMinutes(); 
                
               const dayMap = {
                    'monday': 1, 
                    'tuesday': 2, 
                    'wednesday': 3, 
                    'thursday': 4,
                    'friday': 5, 
                    'saturday': 6, 
                    'sunday': 7 
                };
              
                const upcoming = result.data.filter(activity => {
                    if (!activity.dayofactivity || !activity.time) return false;
                    
                    const activityDay = dayMap[activity.dayofactivity.toLowerCase()];
                    if (activityDay === undefined) return false;
                    
                    const [hours, minutes] = activity.time.split(':').map(Number);
                    const activityTime = hours * 60 + minutes;
                    
                    if (activityDay > currentDayOfWeek) {
                        return true; 
                    } else if (activityDay === currentDayOfWeek) {
                        return activityTime > currentTime;
                    }
                    return false;
                });
                
                this.renderUpcomingActivities(upcoming, container);
                document.getElementById('upcomingCount').textContent = upcoming.length;
            } else {
                container.innerHTML = `<div class="no-data"><i class="fas fa-calendar-times"></i><p>No upcoming activities</p></div>`;
            }
        } catch (error) {
            console.error('Error loading upcoming activities:', error);
            const container = document.getElementById('upcomingActivities');
            if (container) {
                container.innerHTML = `<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Failed to load activities</p></div>`;
            }
        }
    }

    renderUpcomingActivities(activities, container) {
        if (!activities || activities.length === 0) {
            container.innerHTML = `<div class="no-data"><i class="fas fa-calendar-times"></i><p>No upcoming activities</p></div>`;
            return;
        }

        const activitiesHTML = activities.slice(0, 3).map(activity => {
            const formattedTime = this.formatTimeFromDB(activity.time);
            
            return `
                <div class="activity-item">
                    <div class="activity-info">
                        <h4>${activity.name}</h4>
                        <p>
                            <i class="fas fa-calendar"></i>
                            Every ${activity.dayofactivity} at ${formattedTime}
                        </p>
                        <p class="activity-description">
                            ${activity.description || 'No description'}
                        </p>
                    </div>
                    <div class="activity-actions">
                        <a href="activities.php?id=${activity.id}" class="btn-sm btn-primary scan-btn">
                            <i class="fas fa-qrcode"></i> Mark Attendance
                        </a>                     
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activitiesHTML;
    }

    formatTimeFromDB(timeString) {
        if (!timeString) return 'TBA';
        
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes.toString().padStart(2, '0');
            return `${formattedHours}:${formattedMinutes} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    }

    initializeQRScanner() {
        // FIXED: Added safety check for Html5QrcodeScanType
        if (typeof Html5QrcodeScanner !== 'undefined' && typeof Html5QrcodeScanType !== 'undefined') {
            this.qrScanner = new Html5QrcodeScanner(
                "reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
                },
                false
            );
        } else {
            console.warn('QR Code library not fully loaded yet.');
        }
    }

    openQRScanner(activityId = null) {
        this.currentActivityId = activityId;
        const modal = document.getElementById('qrScannerModal');
        const scanResult = document.getElementById('scanResult');
        
        if (!modal) return;

        scanResult.style.display = 'none';
        document.getElementById('qrScanner').style.display = 'block';
        
        modal.style.display = 'block';

        if (this.qrScanner) {
            this.qrScanner.render(this.onScanSuccess.bind(this), this.onScanFailure.bind(this));
        } else {
            showError('QR Scanner not available. Please try manual entry.');
        }
    }

    closeQRScanner() {
        const modal = document.getElementById('qrScannerModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // FIXED: Safety check before clearing
        if (this.qrScanner) {
            try {
                this.qrScanner.clear();
            } catch(e) {
                console.warn('Scanner already cleared');
            }
        }
    }

    onScanSuccess(decodedText, decodedResult) {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        this.processQRCode(decodedText);
        
        if (this.qrScanner) {
            try { this.qrScanner.clear(); } catch(e) {}
        }
    }

    onScanFailure(error) {
        console.log('QR scan failed:', error);
    }

    async processQRCode(qrData) {
        try {
            this.showScanResult('Processing QR code...', 'loading');

            const response = await this.markAttendance(qrData);
            
            if (response.success) {
                this.showScanResult('Attendance marked successfully!', 'success');
                
                setTimeout(() => {
                    this.loadDashboardStats();
                    this.loadRecentAttendance();
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
        try {
            // FIXED: Grab the unique_id directly from the DOM to ensure it's never stale
            const uniqueIdInput = document.getElementById('unique_id');
            const uniqueId = uniqueIdInput ? uniqueIdInput.value : this.userId;

            const response = await fetch('../class/ApiHandler.php?action=create&entity=attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    qr_code: qrData,
                    activity_id: this.currentActivityId,
                    unique_id: uniqueId
                })
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error');
        }
    }

    showScanResult(message, type) {
        const scanResult = document.getElementById('scanResult');
        const qrScanner = document.getElementById('qrScanner');
        
        if (!scanResult || !qrScanner) return;

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

    // ==========================================
    // ACTIVITY DETAILS & MISSING HELPERS
    // ==========================================

    async viewActivityDetails(activityId) {
        try {
            const activity = await this.fetchActivityDetails(activityId);
            if (activity && activity.id) {
                this.showActivityDetails(activity);
            } else {
                showError('Could not find activity details.');
            }
        } catch (error) {
            console.error('Error loading activity details:', error);
            showError('Failed to load activity details');
        }
    }

    async fetchActivityDetails(activityId) {
        try {
            const response = await fetch(`../class/ApiHandler.php?entity=activities&action=get&id=${activityId}`);
            const data = await response.json();
          
            if (data.success) {
                return data.data;
            } else {
                return null; 
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw new Error('Failed to fetch activities: ' + error.message);
        }
    }

    showActivityDetails(activity) {
        const modal = document.getElementById('activityDetailsModal');
        const content = document.getElementById('activityDetailsContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="activity-details-content">
                <h4>${this.escapeHtml(activity.name)}</h4>
                <p class="activity-description">${this.escapeHtml(activity.description || 'No description')}</p>
                
                <div class="details-grid">
                    <div class="detail-row">
                        <strong>Category:</strong>
                        <span>${this.escapeHtml(activity.category || 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Date:</strong>
                        <span>${activity.date ? this.formatDate(activity.date) : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Time:</strong>
                        <span>${this.formatTimeFromDB(activity.time)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Location:</strong>
                        <span>${this.escapeHtml(activity.location || 'N/A')}</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // FIXED: Added missing utility functions
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
        });
    }
}

// Initialize dashboard when page loads
let userDashboard;
document.addEventListener('DOMContentLoaded', () => {
    userDashboard = new UserDashboard();
});