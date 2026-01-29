// User Dashboard functionality with API integration
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
                console.log(userData)
                this.updateDashboardStats(userData);
                const welcomeMessage = document.getElementById('welcomeMessage');
                if (welcomeMessage) {
                    welcomeMessage.innerHTML = `Welcome, ${userData.first_name} ${userData.last_name } 👋`;
                }
            }

            // Get attendance data for stats
            // const attendanceResponse = await fetch(`class/ApiHandler.php?action=get&entity=attendance&id=${this.userId}`);
            // const attendanceResult = await attendanceResponse.json();
            
            // if (attendanceResult.success && attendanceResult.data) {
              
            // } else {
            //     // Use defaults if no data
            //     this.updateDashboardStats([]);
            // }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            showError('Error loading dashboard data. Please try again.');
            // Set defaults on error
            this.updateDashboardStats([]);
        }
    }

updateDashboardStats(attendanceData) {
    if (!Array.isArray(attendanceData)) {
        attendanceData = [];
    }
    
    // Calculate stats from attendance data
    
    const presentCount = attendanceData.reduce((sum, record) => {
        // Add present_count for each group (each group represents multiple present records)
        return sum + (parseInt(record.present_count) || 0);
    }, 0);
    
    const absentCount = attendanceData.reduce((sum, record) => {
        return sum + (parseInt(record.absent_count) || 0);
    }, 0);
    
    // Total activities attended (present + absent)
    const totalActivities = presentCount + absentCount;
    
    // Calculate attendance rate - percentage of present out of total activities
    const attendanceRate = totalActivities > 0 ? Math.round((presentCount / totalActivities) * 100) : 0;
    
    // Calculate current streak (consecutive present days)
    const currentStreak = this.calculateCurrentStreak(attendanceData);
    
    // For upcoming activities, you'll need to fetch this separately
    const upcomingCount = 0; // This should come from a different API call

    // Update stats cards
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('upcomingCount').textContent = upcomingCount;
    document.getElementById('attendanceRate').textContent = `${attendanceRate}%`;
    document.getElementById('currentStreak').textContent = currentStreak;
}

// Helper method to calculate current streak
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

        const container = document.getElementById('upcomingActivities');
        if (!container) return;

        if (result.success && Array.isArray(result.data)) {
            const now = new Date();
            const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
            
            // Map day names to numbers for comparison
            const dayMap = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
                'thursday': 4, 'friday': 5, 'saturday': 6
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
            }).slice(0, 5); // Limit to 5

            this.renderUpcomingActivities(upcoming, container);
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

    const activitiesHTML = activities.map(activity => {
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
                    <button class="btn-sm btn-primary scan-btn" onclick="userDashboard.openQRScanner(${activity.id})">
                        <i class="fas fa-qrcode"></i> Mark Attendance
                    </button>
                    <button class="btn-sm btn-secondary" onclick="userDashboard.viewActivityDetails(${activity.id})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
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
                // Take only the most recent 5 records
                const recent = result.data.slice(0, 5);
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

    viewActivityDetails(activityId) {
        console.log('Viewing activity details:', activityId);
        showInfo(`Opening details for activity #${activityId}`);
        // You can implement navigation to activity details page here
        // window.location.href = `activity_details.php?id=${activityId}`;
    }
}

// Initialize dashboard when page loads
let userDashboard;
document.addEventListener('DOMContentLoaded', () => {
    userDashboard = new UserDashboard();
});