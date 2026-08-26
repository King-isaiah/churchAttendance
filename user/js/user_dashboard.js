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
            if (!this.userId) {
                showError('No user ID found');
                return;
            }
           
            // First get member info for welcome message
            const memberResponse = await fetch(`class/ApiHandler.php?action=get&entity=members&id=${this.userId}`);
            const memberResult = await memberResponse.json();
          
            if (memberResult.success && memberResult.data) {
                const userData = memberResult.data;
                // showSuccess('tracking it in')
                // console.log(userData)
                const memberAttendanceRecord = await fetch(`class/ApiHandler.php?action=get&entity=reports&id=${this.userId}`);
                const memberReport = await memberAttendanceRecord.json();
                console.log(memberReport)
                this.updateDashboardStats(memberReport);
                const welcomeMessage = document.getElementById('welcomeMessage');
                if (welcomeMessage) {
                    welcomeMessage.innerHTML = `Welcome, ${userData.first_name} ${userData.last_name } 👋`;
                }
            }

          
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            showError('Error loading dashboard data. Please try again.');
            // Set defaults on error
            this.updateDashboardStats([]);
        }
    }

updateDashboardStats(memberReport) {
    
    console.log(memberReport)
   
    const attendanceRecords = memberReport.data || [];
   
    const presentCount = attendanceRecords.filter(record => 
        record.status && record.status.toLowerCase() === 'present'
    ).length;
    
    // Calculate absent count (count of records with status 'absent')
    const absentCount = attendanceRecords.filter(record => 
        record.status && record.status.toLowerCase() === 'absent'
    ).length;
    
    // Total activities attended (present + absent)
    const totalActivities = presentCount + absentCount;
    
    // Calculate attendance rate - percentage of present out of total activities
    const attendanceRate = totalActivities > 0 ? Math.round((presentCount / totalActivities) * 100) : 0;
    
    // Calculate current streak - you'll need to implement this based on dates
    const currentStreak = this.calculateCurrentStreak(attendanceRecords);
    
    // For upcoming activities, you'll need to fetch this separately
    const upcomingCount = 0;

    // Update stats cards
    document.getElementById('presentCount').textContent = presentCount;
  
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('currentStreak').textContent = currentStreak;
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
        
        // Check consecutive days where present_count > 0
        for (let i = 0; i < sortedData.length; i++) {
            const record = sortedData[i];
            const recordDate = new Date(record.date);
            recordDate.setHours(0, 0, 0, 0);
            
            // Check if this record has any present attendance
            if ((parseInt(record.present_count) || 0) > 0) {
                // If it's today or yesterday (for consecutive streak)
                const dayDiff = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
                
                if (i === 0) {
                    // First record - start streak
                    streak = 1;
                } else {
                    // Check if consecutive day
                    const prevRecord = sortedData[i - 1];
                    const prevDate = new Date(prevRecord.date);
                    prevDate.setHours(0, 0, 0, 0);
                    
                    const diffDays = Math.floor((recordDate - prevDate) / (1000 * 60 * 60 * 24));
                    
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

    async loadUpcomingActivities() {
        try {
            const response = await fetch(`class/ApiHandler.php?action=getAll&entity=activities`);
            const result = await response.json();
            console.log(result)

            const container = document.getElementById('upcomingActivities');
            if (!container) return;

            if (result.success && Array.isArray(result.data)) {
                
                const now = new Date();
                let currentDayOfWeek = now.getDay(); // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

                // Re-map: Saturday (6) becomes 0, Sunday (0) becomes 1, Monday (1) becomes 2, etc.
                const customDayMap = [1, 2, 3, 4, 5, 6, 0]; 
                currentDayOfWeek = customDayMap[currentDayOfWeek];
                const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
                
                // Map day names to numbers for comparison
                const dayMap = {
                    'saturday': 0, 'sunday': 1, 'monday': 2, 'tuesday': 3, 'wednesday': 4,
                    'thursday': 5, 'friday': 6 
                };
              
                // Filter upcoming activities
                const upcoming = result.data.filter(activity => {
                    if (!activity.dayofactivity || !activity.time) return false;
                    
                    const activityDay = dayMap[activity.dayofactivity.toLowerCase()];
                    if (activityDay === undefined) return false;
                    
                    // Parse activity time (format: "04:14:00")
                    const [hours, minutes] = activity.time.split(':').map(Number);
                    const activityTime = hours * 60 + minutes;
                    
                    // Check if activity is today or in the future
                    if (activityDay > currentDayOfWeek) {
                        return true; // Activity is on a future day this week
                    } else if (activityDay === currentDayOfWeek) {
                        // Activity is today, check if time is in the future
                        return activityTime > currentTime;
                    }
                    // If activityDay < currentDayOfWeek, it's already passed this week
                    return false;
                });
                
                this.renderUpcomingActivities(upcoming, container);
                // console.log(upcoming, container)
                // console.log(upcoming.length)
                document.getElementById('upcomingCount').textContent = upcoming.length;
            } else {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>No upcoming activities</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading upcoming activities:', error);
            const container = document.getElementById('upcomingActivities');
            if (container) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load activities</p>
                    </div>
                `;
            }
        }
    }

    renderUpcomingActivities(activities, container) {
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-times"></i>
                    <p>No upcoming activities</p>
                </div>
            `;
            return;
        }
        

        const activitiesHTML = activities.slice(0, 3) .map(activity => {
            // Format the time (convert "04:14:00" to "4:14 AM")
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

    // Helper function to format time from database
    formatTimeFromDB(timeString) {
        if (!timeString) return 'TBA';
        
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes.toString().padStart(2, '0');
            return `${formattedHours}:${formattedMinutes} ${ampm}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    }

    // You also need to add this to your UserDashboard class
    getDayName(dayNumber) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNumber];
    }

    async loadRecentAttendance() {
        try {
            const response = await fetch(`class/ApiHandler.php?action=get&entity=attendance&id=${this.userId}`);
            const result = await response.json();

            const container = document.getElementById('recentAttendance');
            if (!container) return;

            if (result.success && Array.isArray(result.data)) {
                
                const recent = result.data.slice(0, 3);
                this.renderRecentAttendance(recent, container);
            } else {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No attendance records yet</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent attendance:', error);
            const container = document.getElementById('recentAttendance');
            if (container) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load attendance records</p>
                    </div>
                `;
            }
        }
    }

    renderRecentAttendance(records, container) {
        if (!records || records.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No attendance records yet</p>
                </div>
            `;
            return;
        }

        const recordsHTML = records.map(record => {
            const date = new Date(record.date);
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
            const status = record.status || 'Present'; // Default to Present since we're showing attendance
            
            return `<div class="attendance-item ${status.toLowerCase()}">
                        <div class="attendance-date">
                            <strong>${monthDay}</strong>
                            <span>${dayOfWeek}</span>
                        </div>
                        <div class="attendance-details">
                            <h4>${record.activity_or_event_name}</h4>
                            <p>${record.check_in_time || ''}</p>
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

    initializeQRScanner() {
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

    // Not necesarilry needed at least for now
    openQRScanner(activityId = null) {
        this.currentActivityId = activityId;
        const modal = document.getElementById('qrScannerModal');
        const scanResult = document.getElementById('scanResult');
        
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
        modal.style.display = 'none';
        
        if (this.qrScanner) {
            this.qrScanner.clear();
        }
    }

    onScanSuccess(decodedText, decodedResult) {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        
        this.processQRCode(decodedText);
        
        if (this.qrScanner) {
            this.qrScanner.clear();
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
                    // Refresh dashboard data after marking attendance
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
            // You need to create this endpoint for marking attendance
            const response = await fetch('class/ApiHandler.php?action=create&entity=attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    qr_code: qrData,
                    activity_id: this.currentActivityId,
                    unique_id: this.userId
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

    async viewActivityDetails(activityId) {
        console.log('Viewing activity details:', activityId);
        // showInfo(`Opening details for activity #${activityId}`);
         showSuccess('whast going on')
        // window.location.href = `activities.php?id=${activityId}`;
        try {
            showSuccess('we in')
            const activity = await this.fetchActivityDetails(activityId);
            showSuccess('after the activity')
            this.showActivityDetails(activity);
            showSuccess('should be working right')
        } catch (error) {
            console.error('Error loading activity details:', error);
            this.showMessage('Failed to load activity details', 'error');
        }
    }
    async fetchActivityDetails(activityId) {
        try {
         
            const response = await fetch(`class/ApiHandler.php?entity=activities&action=get&id=${activityId}`);
            const data = await response.json();
          
            if (data.success) {
                return data.data;
            } else {
                return []; 
            }
            
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw new Error('Failed to fetch activities: ' + error.message);
        }
        
    }
    showActivityDetails(activity) {
        const modal = document.getElementById('activityDetailsModal');
        const content = document.getElementById('activityDetailsContent');
        
        content.innerHTML = `
            <div class="activity-details-content">
                <h4>${this.escapeHtml(activity.name)}</h4>
                <p class="activity-description">${this.escapeHtml(activity.description)}</p>
                
                <div class="details-grid">
                    <div class="detail-row">
                        <strong>Category:</strong>
                        <span>${this.escapeHtml(activity.category)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Date:</strong>
                        <span>${this.formatDate(activity.date, 'D, M j, Y')}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Time:</strong>
                        <span>${activity.time}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Location:</strong>
                        <span>${this.escapeHtml(activity.location)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Expected Attendance:</strong>
                        <span>${activity.expected_count} people</span>
                    </div>
                    <div class="detail-row">
                        <strong>Target Audience:</strong>
                        <span>${this.escapeHtml(activity.target_audience)}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Attendance Method:</strong>
                        <span>${this.escapeHtml(activity.attendance_method)}</span>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
}

// Initialize dashboard when page loads
let userDashboard;
document.addEventListener('DOMContentLoaded', () => {
    userDashboard = new UserDashboard();
});