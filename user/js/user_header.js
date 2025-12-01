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