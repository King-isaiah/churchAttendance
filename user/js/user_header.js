// Enhanced User Header functionality
class UserHeader {
    constructor() {
        this.isMobile = window.innerWidth <= 568;
        this.currentPage = this.getCurrentPage();
        // this.navCollapsed = localStorage.getItem('navCollapsed') === 'true' || false;
        const stored = localStorage.getItem('navCollapsed');
        this.navCollapsed = stored !== null ? stored === 'true' : true;
        this.qrScanner = null;
        this.init();       
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.highlightCurrentPage();
        this.setupAnimations();
        this.loadUserData();
        this.applyInitialNavState();       
        // this.trackAttendanceLocation();    
        this.trackActivity();    
    }
    


   
    async trackActivity() {        
        try {   
            // Function to calculate distance in METERS
            function calculateDistance(lat1, lon1, lat2, lon2) {
                const R = 6371000; // Earth's radius in METERS (6371km = 6371000m)
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distanceMeters = R * c; // Distance in meters
                
                return distanceMeters;
            }    
           
            function getCurrentTime() {
                const now = new Date();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                
                return `${hours}:${minutes}:${seconds}`; // Returns "14:30:45"
            }

            const time = getCurrentTime();
        
            const response = await fetch(`class/ApiHandler.php?entity=activities&action=getOthers`);
            // const response = await fetch(`class/ApiHandler.php?entity=activities&action=getOthers&department=${departmentId}`);             
            const data = await response.json();
          
            if (data.success) {                  
                if (!data.data.length > 0){
                    showError('it is not more than one')
                    return false;
                }else{
                    showSuccess('it is more than 1');
                    showSuccess(data.data.length );
                    const userInfo = await this.trackUserInfo();
                    data.data.forEach(activity => {
                        let activityId = activity.id; 
                        let activityName = activity.name; 
                        let activityCategoryId = activity.category_id;
                        let activityDayofactivity = activity.dayofactivity;
                        let activityAttendance_method_id = activity.attendance_method_id;
                        let activityTime = activity.time;
                        let activityLocationId = activity.location_id;
                        let activityTimeIn = activity.time;
                        let activityLatitude = activity.latitude;
                        let activityLongtitude = activity.longtitude;
                        
                        console.log('Activity:', activityName);
                        console.log('Activity longtitude:', activityLongtitude);
                        console.log('Activity latitude:', activityLatitude);
                        console.log('Activity locationid:', activityLocationId);
                        console.log('Activity methodid:', activityAttendance_method_id);
                        // console.log('Activity latitude:', activityLatitude);

                        const distance = calculateDistance(                            
                            userInfo.latitude, userInfo.longitude,
                            activityLatitude, activityLongtitude
                        );
                        
                        console.log(`Distance to "${activityName}": ${distance.toFixed(2)} meters`);
                        
                        
                        if (distance <= 100) {
                            showSuccess(`You are at "${activityName}" location! (${distance.toFixed(0)}m away)`); 

                            const formData = {         
                                department_id: document.getElementById('department_id').value,
                                attendance_category: 'activity',
                                attendance_category_id: activityId,
                                unique_id: document.getElementById('unique_id').value,                                           
                                dayofactivity: activityDayofactivity,
                                check_in_time: time,                                
                                location_id: activityLocationId,
                                attendance_method_id: activityAttendance_method_id,                                
                                status: 'present',
                            };
                            // Send to API
                            fetch('class/ApiHandler.php?entity=attendance&action=create', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(formData)
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    showSuccess('Attendance successfully!', 'success');
                                  
                                } else {
                                    showError('Error: ' + data.message, 'error');
                                }
                            })
                            .catch(error => {
                                showError('Network error: ' + error, 'error');
                            });
                            
                        } else {
                            showError(`You are not at "${activityName}" location (${distance.toFixed(0)}m away)`); 
                        }
                    });
                    


                    
                
            
                    console.log('User latitude:', userInfo.latitude);
                    console.log('User longtitude:', userInfo.longitude);
                    // console.log('Full userInfo:', userInfo);
                }
            } else {
                showError('Something went wrong. Cnt dvlp');
                
            }
            
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw new Error('Failed to fetch activities: ' + error.message);
        }
        
    }
    

async trackUserInfo() {
    try {
        // First try to get high-accuracy GPS coordinates
        const position = await this.getCurrentPosition();
        
        const userInfo = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy, // Important: check this!
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date(position.timestamp).toISOString(),
            source: 'gps', // Mark that this is GPS data
            userAgent: navigator.userAgent
        };
        
        console.log('GPS User Information:', userInfo);
        
        // Check if accuracy is good enough (in meters)
        if (userInfo.accuracy > 100) {
            console.warn(`GPS accuracy is ${userInfo.accuracy}m, may not be precise enough for 100m check`);
        }
        
        return userInfo;
    } catch (gpsError) {
        console.error('GPS Error:', gpsError);
        // Fallback to IP geolocation (less accurate)
        return this.getIPLocation();
    }
}

getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
                enableHighAccuracy: true, // Request GPS if available
                timeout: 10000, // Wait up to 10 seconds
                maximumAge: 0 // Don't use cached position
            }
        );
    });
}

async getIPLocation() {
    try {
        const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,timezone,query');
        const locationData = await response.json();
        
        if (locationData.status !== 'success') {
            throw new Error(locationData.message || 'Failed to get location');
        }
        
        return {
            latitude: parseFloat(locationData.lat),
            longitude: parseFloat(locationData.lon),
            accuracy: 50000, // IP geolocation accuracy is typically 5-50km
            city: locationData.city,
            region: locationData.regionName,
            country: locationData.country,
            ip: locationData.query,
            source: 'ip',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('IP Location Error:', error);
        return this.getDefaultLocation();
    }
}


// not from the new
// async trackUserInfo() {
//     try {
//         // IP-API.com (no API key needed for free tier)
//         const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,timezone,query');
//         const locationData = await response.json();
        
//         if (locationData.status !== 'success') {
//             throw new Error(locationData.message || 'Failed to get location');
//         }
        
//         const userInfo = {
//             ip: locationData.query,
//             city: locationData.city,
//             region: locationData.regionName,
//             country: locationData.country,
//             latitude: parseFloat(locationData.lat),
//             longitude: parseFloat(locationData.lon),
//             timezone: locationData.timezone,
//             userAgent: navigator.userAgent,
//             timestamp: new Date().toISOString()
//         };
        
//         console.log('User Information:', userInfo);
//         return userInfo;
//     } catch (error) {
//         console.error('Error tracking user info:', error);
//         return this.getDefaultLocation();
//     }
// }

    
    // Method to track attendance location
    async trackAttendanceLocation() {
        try {
            // First track user info
            const userInfo = await this.trackUserInfo();
            
            if (userInfo) {
                // Add to attendance data
                const attendanceData = {
                    // userId: this.getCurrentUserId(),
                    // activityId: this.getCurrentActivityId(),
                    location: {
                        city: userInfo.city,
                        region: userInfo.region,
                        country: userInfo.country,
                        latitude: userInfo.latitude,
                        longitude: userInfo.longitude
                    },
                    userAgent: userInfo.userAgent,
                    timestamp: userInfo.timestamp
                };
                
                console.log('Attendance Tracking Data:', attendanceData);
                
                // Send to your server
                const response = await fetch('attendance.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(attendanceData)
                });
                
                if (response.ok) {
                    console.log('Attendance location tracked successfully');
                }
                
                return attendanceData;
            }
        } catch (error) {
            console.error('Error tracking attendance location:', error);
            return null;
        }
    }
    

    async loadUserData() {
        // showSuccess('whast up from loadUserData');
        try {      
            // Simulate loading user data
            const userData = await this.fetchUserData();
            // this.updateUserInterface(userData);
            
        } catch (error) {
            
            console.error('Error loading user data:', error);
        }
    }
    async fetchUserData() {   
           
        try {
            // showSuccess('fetchUserData try');
            const response = await fetch('class/ApiHandler.php?action=getCurrentUser&entity=members', {
                method: 'GET',
                credentials: 'include'                
            });            
            const result = await response.json();
            
            if (result.success) {            
                // showSuccess('successfully Entered into the backend!');
                return {
                    name: result.full_name, 
                    department: result.department, 
                    streak: 3, 
                    attendanceRate: 80, 
                    notifications: 13, 
                    email: result.email,
                    unique_id: result.unique_id,
                    first_name: result.first_name
                };               
            } else {
               throw new Error(result.message || 'Failed to fetch user data');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        }
    
    }
    // updateUserInterface(userData) {
    //     // Update user name
    //     const userNameElements = document.querySelectorAll('.user-name, .user-name-short');
    //     userNameElements.forEach(el => {
    //         if (el.classList.contains('user-name-short')) {
    //             el.textContent = userData.name.substring(0, 2).toUpperCase();
    //         } else {
    //             el.textContent = userData.name;
    //         }
    //     });

    //     // Update stats
    //     const statBadges = document.querySelectorAll('.stat-badge');
    //     if (statBadges[0]) {
    //         statBadges[0].querySelector('span').textContent = `${userData.streak} day streak`;
    //     }
    //     if (statBadges[1]) {
    //         statBadges[1].querySelector('span').textContent = `${userData.attendanceRate}% attendance`;
    //     }
    // }
    setupEventListeners() {
        // Both buttons now toggle the nav list
        const expandBtn = document.querySelector('.expand-btn');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (expandBtn) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNavList();
            });
        }

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNavList();
            });
        }

        // Navigation item clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('a')) {
                    const link = item.querySelector('a');
                    if (link) link.click();
                }
            });
        });

        // Notification interactions
        this.setupNotificationEvents();
        
        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-bell')) {
                this.hideNotificationDropdown();
            }
            if (!e.target.closest('.user-menu')) {
                this.hideUserDropdown();
            }
        });
    }

    applyInitialNavState() {
        if (this.navCollapsed) {
            this.collapseNavList();
        } else {
            this.expandNavList();
        }
    }

    setupMobileMenu() {
        if (this.isMobile) {
            this.setupSwipeGestures();
        }
    }

    setupSwipeGestures() {
        let startX = 0;
        let currentX = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!startX) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', () => {
            const diff = currentX - startX;
            
            // Swipe right to open nav (from left edge)
            if (diff > 50 && startX < 50) {
                this.expandNavList();
            }
            
            // Swipe left to close nav
            if (diff < -50) {
                this.collapseNavList();
            }
            
            startX = 0;
            currentX = 0;
        }, { passive: true });
    }

    toggleNavList() {
        if (this.navCollapsed) {
            this.expandNavList();
        } else {
            this.collapseNavList();
        }
    }

    collapseNavList() {
        const sidebar = document.querySelector('.sidebar');
        const navTexts = document.querySelectorAll('.nav-text');
        const quickActions = document.querySelector('.quick-actions');
        const companyText = document.querySelector('.sidebar-top__company');
        
        // Add collapsed class
        sidebar.classList.add('collapsed');
        
        // Hide text elements
        navTexts.forEach(text => {
            text.style.display = 'none';
        });
        
        if (quickActions) {
            quickActions.style.display = 'none';
        }
        
        if (companyText) {
            companyText.style.display = 'none';
        }
        
        // Update button icon to burger (for when it's collapsed)
        const expandBtnIcon = document.querySelector('.expand-btn i');
        if (expandBtnIcon) {
            expandBtnIcon.className = 'fas fa-bars';
        }
        
        this.navCollapsed = true;
        localStorage.setItem('navCollapsed', 'true');
        
        // On mobile, also close the overlay
        if (this.isMobile) {
            document.body.style.overflow = '';
            this.toggleOverlay(false);
        }
    }

    expandNavList() {
        const sidebar = document.querySelector('.sidebar');
        const navTexts = document.querySelectorAll('.nav-text');
        const quickActions = document.querySelector('.quick-actions');
        const companyText = document.querySelector('.sidebar-top__company');
        
        // Remove collapsed class
        sidebar.classList.remove('collapsed');
        
        // Show text elements
        navTexts.forEach(text => {
            text.style.display = 'block';
        });
        
        if (quickActions) {
            quickActions.style.display = 'block';
        }
        
        if (companyText) {
            companyText.style.display = 'block';
        }
        
        // Update button icon to times (for when it's expanded)
        const expandBtnIcon = document.querySelector('.expand-btn i');
        if (expandBtnIcon) {
            expandBtnIcon.className = 'fas fa-times';
        }
        
        this.navCollapsed = false;
        localStorage.setItem('navCollapsed', 'false');
        
        // On mobile, handle overlay
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
            this.toggleOverlay(true);
        }
    }

    toggleOverlay(show) {
        let overlay = document.querySelector('.mobile-overlay');
        
        if (show && !overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
                backdrop-filter: blur(4px);
            `;
            overlay.addEventListener('click', () => this.collapseNavList());
            document.body.appendChild(overlay);
        } else if (!show && overlay) {
            overlay.remove();
        }
    }

    setupNotificationEvents() {
        const notificationBtn = document.querySelector('.notification-btn');
        const markAllRead = document.querySelector('.mark-all-read');
        
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationDropdown();
            });
        }
        
        if (markAllRead) {
            markAllRead.addEventListener('click', () => {
                this.markAllNotificationsRead();
            });
        }
    }

    toggleNotificationDropdown() {
        const dropdown = document.querySelector('.notification-dropdown');
        dropdown.classList.toggle('active');
    }

    hideNotificationDropdown() {
        const dropdown = document.querySelector('.notification-dropdown');
        dropdown.classList.remove('active');
    }

    hideUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        dropdown.classList.remove('active');
    }

    markAllNotificationsRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
        });
        
        const notificationCount = document.querySelector('.notification-count');
        if (notificationCount) {
            notificationCount.textContent = '0';
            notificationCount.style.display = 'none';
        }
        
        this.showToast('All notifications marked as read', 'success');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'user_dashboard.php';
        return page.replace('.php', '').replace('user_', '');
    }

    highlightCurrentPage() {
        const currentPage = this.currentPage;
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            if (item.dataset.page === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    setupAnimations() {
        // Add entrance animations
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('fade-in-up');
        });
    }

    

    

   

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        if (wasMobile !== this.isMobile) {
            if (this.isMobile && this.navCollapsed) {
                // On mobile resize, ensure proper state
                this.collapseNavList();
            }
        }
    }

openQRScanner() {
   
    // const isMobileDevice = this.isMobileDevice();
    
    // if (!isMobileDevice) {
    //     showError('QR scanning is only available on mobile devices');
    //     return;
    // }

    // // Check if we're on HTTPS (required for camera on mobile)
    // if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    //     showError('Camera access requires HTTPS for mobile devices. Please use a secure connection.');
    //     return;
    // }

    // Check if QRCodeScanner class is available
    if (typeof QRCodeScanner === 'undefined') {
        showError('QR scanning functionality is not available. Please make sure qrcode.js is loaded.');
        return;
    }

    // Initialize QR Scanner if not already done
    if (!this.qrScanner) {
        this.qrScanner = new QRCodeScanner();
    }

    // Open the QR scanner
    this.qrScanner.openScanner();
}

// Add this helper method
isMobileDevice() {
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isSmallScreen || isMobileUserAgent || hasTouch;
}

    markManualAttendance() {
        this.showToast('Manual attendance entry opened', 'info');
    }

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
}

// Initialize when page loads
let userHeader;
document.addEventListener('DOMContentLoaded', () => {
    userHeader = new UserHeader();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .fade-in-up {
            animation: fade-in-up 0.6s ease both;
        }
        
        .notification-dropdown.active,
        .user-dropdown.active {
            opacity: 1 !important;
            visibility: visible !important;
            transform: translateY(0) !important;
        }
        
        /* Smooth transitions for sidebar */
        .sidebar {
            transition: all 0.3s ease;
        }
        
        .nav-text, .quick-actions, .sidebar-top__company {
            transition: opacity 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});

// Global functions
function toggleNavList() {
    if (userHeader) userHeader.toggleNavList();
}

function openQRScanner() {
    if (userHeader) userHeader.openQRScanner();
}

function markManualAttendance() {
    if (userHeader) userHeader.markManualAttendance();
}