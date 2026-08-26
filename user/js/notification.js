// notification.js - Enhanced Notification System for Church Management
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.userDepartmentId = null;
        this.userRole = null;
        this.interval = null;
        this.pollingInterval = 50000; // 30 seconds
        this.isInitialized = false;
        this.userId = this.getCurrentUserId();
        this.userDepartmentId = this.getCurrentUserDepartmentId();
        
        // Local storage keys for hybrid approach
        this.localReadStorageKey = 'church_notifications_read';
        this.userSpecificStorageKey = null;
        if (this.userId) {
            this.userSpecificStorageKey = `${this.localReadStorageKey}_${this.userId}`;
        }
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    

    async init() {
        if (this.isInitialized) return;
        
        try {            
            await this.fetchUserInfo();
            
            // Setup notification bell
            this.setupNotificationBell();
            
            // Load initial notifications
            await this.loadNotifications();
            
            // Sync with server if user is logged in
            if (this.userId) {
                this.syncReadStatusWithServer();
            }
            
            // Start polling for new notifications
            this.startPolling();
            
            this.isInitialized = true;
            
            console.log('Notification system initialized');
        } catch (error) {
            console.error('Failed to initialize notification system:', error);
        }
    }
    
    getCurrentUserDepartmentId() {
        const departmentIdElement = document.getElementById('department_id');
        if (departmentIdElement && departmentIdElement.value) {
            return departmentIdElement.value;
        }
        
        const storedId = localStorage.getItem('user_department_id') || 
                         sessionStorage.getItem('user_department_id');
        
        if (storedId) {
            console.log('Retrieved department_id from storage:', storedId);
            return storedId;
        }
        
        console.warn('No department_id found');
        return null;
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
   
    // not really necesaary but comfortable storing information in the session storage
    async fetchUserInfo() {
        try {
            if (!this.userId) {
                console.warn('No user ID found');
                return;
            }
            
            const memberResponse = await fetch(`class/ApiHandler.php?action=get&entity=members&id=${this.userId}`);
            const memberResult = await memberResponse.json();
          
            if (memberResult.success && memberResult.data) {
                const userData = memberResult.data;
                console.log('User data fetched:', userData);
                this.userDepartmentId = userData.department_id || this.userDepartmentId;

                // Store in session for quick access
                sessionStorage.setItem('userDeptId', this.userDepartmentId);    
                console.log('Updated department ID:', this.userDepartmentId);         
                sessionStorage.setItem('userId', this.userId);
                
                // Update user-specific storage key
                this.userSpecificStorageKey = `${this.localReadStorageKey}_${this.userId}`;
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            this.userDepartmentId = sessionStorage.getItem('userDeptId');       
        }
    }
    
    /**
     * Get read notifications from localStorage
     */
    getReadNotificationsFromStorage() {
        try {
            // Try user-specific storage first
            if (this.userSpecificStorageKey) {
                const userData = localStorage.getItem(this.userSpecificStorageKey);
                if (userData) {
                    return JSON.parse(userData) || [];
                }
            }
            
            // Fallback to general storage
            const data = localStorage.getItem(this.localReadStorageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('Failed to read from local storage:', error);
            return [];
        }
    }
    
    /**
     * Filter notifications based on local read status
     */
    filterReadNotifications(notifications) {
        if (!notifications || !Array.isArray(notifications)) {
            return [];
        }
        
        // Get IDs that user has marked as read locally
        const locallyReadIds = this.getReadNotificationsFromStorage();
   
        return notifications.filter(notification => {
            // If notification has read_at timestamp from server, it's read
            if (notification.read_at) {
                return false;
            }
            
            // Check if user marked it as read locally
            const isLocallyRead = locallyReadIds.includes(String(notification.id));
            // console.log(!locallyReadIds)
            // console.log(isLocallyRead)
            
            // Only show if NOT read locally
            return !isLocallyRead;
        });
    }
    
    async loadNotifications() {
        try {
            let url = '';            
            if (this.userDepartmentId) {
                url = `class/ApiHandler.php?entity=notifications&action=get&id=${this.userDepartmentId}`;
                console.log('Fetching notifications for users ID:', this.userDepartmentId);
            } else {
                // url = `class/ApiHandler.php?entity=notifications&action=getAll`;                
                showWarning('User does not have a deprtment')
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                console.log('successfully fetched')                
                this.rawNotifications = data.data || [];
                
                // Apply client-side filtering for read status
                this.notifications = this.filterReadNotifications(this.rawNotifications);
                
                this.updateNotificationDisplay();
                this.updateUnreadCount();
            } else {
                console.warn('Failed to load notifications:', data.message);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    
    setupNotificationBell() {
        const bellContainer = document.querySelector('.notification-bell');
        if (!bellContainer) return;

        // const bellBtn = bellContainer.querySelector('.notification-btn');
        const bellBtn = document.querySelector('.notification-btn');
        const dropdown = document.querySelector('.notification-dropdown');
        const countSpan = document.querySelector('.notification-count');
        // countSpan.textContent = '14'
        // Toggle dropdown
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                // this.markNotifications('one'); 
            }
        });
       
       
        document.addEventListener('click', (e) => {
            if (!bellContainer.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // Mark all as read
        const markAllBtn = dropdown.querySelector('.mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.markNotifications('all'); 
            });
        }

        // Store references for updates
        this.bellContainer = bellContainer;
        this.dropdown = dropdown;
        this.countSpan = countSpan;
    }
    async markNotifications(notificationId) {
        try {
            // showSuccess('welcome my boy')
            let notificationIds = [];
            let isMarkAll = false;
            
            if (notificationId === 'all') {
                // Mark all currently visible notifications
                isMarkAll = true;
                notificationIds = this.notifications.map(n => n.id);
            } else if (Array.isArray(notificationId)) {
                // Mark specific array of IDs
                notificationIds = notificationId;
            } else {
                // Mark single notification
                notificationIds = [notificationId];
            }
            
            // If no notifications to mark, exit early
            if (notificationIds.length === 0) {
                return;
            }
            
            // 1. Update local storage immediately for instant UI feedback
            this.updateLocalReadStorage(notificationIds);
            
            // 2. Update local state immediately (no waiting for server)
            this.updateLocalNotificationsState(notificationIds);
            
            // 3. Update UI immediately
            this.updateNotificationDisplay();
            this.updateUnreadCount();
            
           
            const message = isMarkAll 
                ? 'All notifications marked as read' 
                : notificationId.length === 1 
                    ? 'Notification marked as read' 
                    : `${notificationIds.length} notifications marked as read`;
            
            showSuccess(message, 'success');
            
        } catch (error) {
            console.error('Error marking notifications:', error);
            showError('Failed to mark notifications', 'error');
        }
    }
    updateNotificationDisplay() {
        if (!this.dropdown) return;

        const notificationList = this.dropdown.querySelector('.notification-list');
        if (!notificationList) return;

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        notificationList.innerHTML = this.notifications.map(notification => {
            const timeAgo = this.getTimeAgo(notification.created_at);
            const isUnread = !notification.read_at;
            const icon = this.getNotificationIcon(notification.notification_type);
            const priorityClass = notification.priority || 'medium';
            
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''} priority-${priorityClass}" 
                     data-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <h5>${this.escapeHtml(notification.title)}</h5>
                        <p>${this.escapeHtml(notification.message)}</p>
                        <div class="notification-meta">
                            <span class="notification-time">${timeAgo}</span>
                            ${notification.department_name ? 
                                `<span class="notification-department">${notification.department_name}</span>` : ''}
                        </div>
                    </div>
                    <button class="notification-action" onclick="markNotifications(${notification.id})">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Add click event to view notification details
        notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-action')) {
                    const notificationId = item.dataset.id;
                    console.log('from the add i give you' +  notificationId)
                    // this.viewNotificationDetails(notificationId);
                    this.markNotifications(notificationId);
                    // showSuccess('you good bro')
                }
            });
        });
    }
    
    updateUnreadCount() {
        if (!this.countSpan) return;
        
        this.unreadCount = this.notifications.filter(n => !n.read_at).length;
        
        if (this.unreadCount > 0) {
            this.countSpan.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            this.countSpan.style.display = 'inline-block';
            
            // Add bounce animation
            this.countSpan.classList.add('pulse');
            setTimeout(() => {
                this.countSpan.classList.remove('pulse');
            }, 1000);
        } else {
            this.countSpan.style.display = 'none';
        }
    }
    
    /**
     * UNIFIED METHOD: Mark notifications as read (hybrid approach)
     * @param {number|string|'all'} notificationId - Single ID, array of IDs, or 'all'
     */
   
    
    /**
     * Update local storage with read notification IDs
     */
    updateLocalReadStorage(notificationIds) {
        try {
            // Get existing read notifications from localStorage
            let readNotifications = this.getReadNotificationsFromStorage();
            
            // Add new IDs (avoid duplicates)
            notificationIds.forEach(id => {
                const idStr = String(id);
                if (!readNotifications.includes(idStr)) {
                    readNotifications.push(idStr);
                }
            });
            
            // Save back to localStorage (limit to last 1000 for performance)
            if (readNotifications.length > 1000) {
                readNotifications = readNotifications.slice(-1000);
            }
            
            // Save to both general and user-specific storage
            localStorage.setItem(this.localReadStorageKey, JSON.stringify(readNotifications));
            
            if (this.userSpecificStorageKey) {
                localStorage.setItem(this.userSpecificStorageKey, JSON.stringify(readNotifications));
            }
            
            console.log('Updated local read storage with IDs:', notificationIds);
            
        } catch (error) {
            console.warn('Failed to update local storage:', error);
        }
    }
    
    /**
     * Update local notifications state
     */
    updateLocalNotificationsState(notificationIds) {
        const now = new Date().toISOString();
        
        this.notifications.forEach(notification => {
            if (notificationIds.includes(notification.id)) {
                notification.read_at = now;
                notification._locallyRead = true; // Flag for client-side tracking
            }
        });
    }
    
   
    
    /**
     * Sync local read status with server
     */
    async syncReadStatusWithServer() {
        try {
            if (!this.userId) return;
            
            const locallyReadIds = this.getReadNotificationsFromStorage();
            
            if (locallyReadIds.length > 0) {
                console.log('Syncing', locallyReadIds.length, 'locally read IDs with server');
                
                await fetch(`class/ApiHandler.php?entity=notifications&action=special`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: this.userId,
                        read_ids: locallyReadIds
                    })
                });
                
                console.log('Local read status synced with server');
            }
        } catch (error) {
            console.warn('Failed to sync with server:', error);
        }
    }
    
    async viewNotificationDetails(notificationId) {
        try {
            const response = await fetch(`class/ApiHandler.php?entity=notifications&action=get&id=${notificationId}`);
            const data = await response.json();
            
            if (data.success) {
                this.showNotificationModal(data.data);
                // Mark as read when viewing
                await this.markNotifications(notificationId);
            }
        } catch (error) {
            console.error('Error fetching notification details:', error);
        }
    }
    
    showNotificationModal(notification) {
        const modalHtml = `
            <div class="modal notification-modal" style="display: block;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Notification Details</h3>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="notification-detail">
                            <div class="notification-detail-header">
                                <div class="notification-icon-large">
                                    <i class="${this.getNotificationIcon(notification.notification_type)}"></i>
                                </div>
                                <div>
                                    <h4>${this.escapeHtml(notification.title)}</h4>
                                    <div class="notification-meta">
                                        <span class="notification-time">${this.getTimeAgo(notification.created_at)}</span>
                                        ${notification.department_name ? 
                                            `<span class="notification-department">${notification.department_name}</span>` : ''}
                                        <span class="notification-priority ${notification.priority}">${notification.priority}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="notification-detail-body">
                                <p>${this.escapeHtml(notification.message)}</p>
                                ${notification.expires_at ? 
                                    `<div class="notification-expiry">
                                        <i class="fas fa-clock"></i>
                                        <span>Expires: ${this.formatDate(notification.expires_at)}</span>
                                    </div>` : ''}
                            </div>
                            <div class="notification-detail-footer">
                                <button class="btn-primary" onclick="notificationSystem.deleteNotification(${notification.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                                <button class="btn-secondary close-modal">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.querySelector('.notification-modal');
        if (existingModal) existingModal.remove();
        
        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Setup close functionality
        const modal = document.querySelector('.notification-modal');
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }
    
    async deleteNotification(notificationId) {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        
        try {
            const response = await fetch(`class/ApiHandler.php?entity=notifications&action=delete&id=${notificationId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove from local array
                this.notifications = this.notifications.filter(n => n.id != notificationId);
                this.updateNotificationDisplay();
                this.updateUnreadCount();
                
                // Close modal
                const modal = document.querySelector('.notification-modal');
                if (modal) {
                    modal.style.display = 'none';
                    setTimeout(() => modal.remove(), 300);
                }
                
                showSuccess('Notification deleted');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            showError('Failed to delete notification', 'error');
        }
    }
    
    startPolling() {
        // Clear existing interval
        if (this.interval) clearInterval(this.interval);
        
        // Start polling for new notifications
        this.interval = setInterval(() => {
            this.checkForNewNotifications();
        }, this.pollingInterval);
    }
    
    async checkForNewNotifications() {
        try {
            const oldCount = this.notifications.length;
            await this.loadNotifications();
            
            // Check if new notifications arrived
            if (this.notifications.length > oldCount) {
                const newCount = this.notifications.length - oldCount;
                this.showNewNotificationAlert(newCount);
            }
        } catch (error) {
            console.error('Error checking for new notifications:', error);
        }
    }
    
    showNewNotificationAlert(count) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'notification-toast new-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-bell"></i>
                <div>
                    <strong>${count} new notification${count > 1 ? 's' : ''}</strong>
                    <p>Click the bell to view</p>
                </div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        });
        
        // Click to open notifications
        toast.addEventListener('click', () => {
            if (this.bellContainer) {
                this.bellContainer.querySelector('.notification-btn').click();
            }
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        });
    }
    
    
    
    // Utility Methods
    getNotificationIcon(type) {
        const icons = {
            'event': 'fas fa-calendar-check',
            'activity': 'fas fa-tasks',
            'member': 'fas fa-user-plus',
            'birthday': 'fas fa-birthday-cake',
            'attendance': 'fas fa-clipboard-check',
            'prayer': 'fas fa-pray',
            'announcement': 'fas fa-bullhorn',
            'system': 'fas fa-cog',
            'offering': 'fas fa-donate',
            'volunteer': 'fas fa-hands-helping'
        };
        return icons[type] || 'fas fa-bell';
    }
    
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) === 1 ? '' : 's'} ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) === 1 ? '' : 's'} ago`;
        
        return date.toLocaleDateString();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        const div = document.createElement('div');
        div.textContent = unsafe;
        return div.innerHTML;
    }
    
    // Public API
    refresh() {
        return this.loadNotifications();
    }
    
    getUnreadCount() {
        return this.unreadCount;
    }
    
    getNotifications() {
        return this.notifications;
    }
    
    stopPolling() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    destroy() {
        this.stopPolling();
        this.isInitialized = false;
    }
    
    /**
     * Clear all locally read notifications (for testing or cleanup)
     */
    clearLocalReadStorage() {
        try {
            localStorage.removeItem(this.localReadStorageKey);
            
            if (this.userSpecificStorageKey) {
                localStorage.removeItem(this.userSpecificStorageKey);
            }
            
            // Reload notifications to reflect changes
            this.loadNotifications();
            
            showSuccess('Local read status cleared');
        } catch (error) {
            console.error('Failed to clear local storage:', error);
            showError('Failed to clear local storage');
        }
    }
}

// Add CSS styles for notifications
const notificationStyles = `
    /* Notification Bell */
    .notification-bell {
        position: relative;
    }
    
    .notification-btn {
        position: relative;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        transition: color 0.3s ease;
    }
    
    .notification-btn:hover {
        color: #8786E3;
    }
    
    .notification-count {
        position: absolute;
        top: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        font-size: 0.7rem;
        font-weight: bold;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        display: none;
    }
    
    .notification-count.pulse {
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    /* Dropdown */
    .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 350px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        display: none;
        max-height: 500px;
        overflow: hidden;
    }
    
    .notification-dropdown.show {
        display: block;
        animation: slideDown 0.3s ease;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .notification-header {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-header h4 {
        margin: 0;
        font-size: 1rem;
    }
    
    .mark-all-read {
        color: #8786E3;
        font-size: 0.875rem;
        cursor: pointer;
        background: none;
        border: none;
    }
    
    .mark-all-read:hover {
        text-decoration: underline;
    }
    
    /* Notification List */
    .notification-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .notification-item {
        padding: 1rem;
        border-bottom: 1px solid #f5f5f5;
        display: flex;
        gap: 0.75rem;
        cursor: pointer;
        transition: background 0.2s ease;
    }
    
    .notification-item:hover {
        background: #f9f9f9;
    }
    
    .notification-item.unread {
        background: #f0f7ff;
    }
    
    .notification-item.priority-high {
        border-left: 3px solid #ff6b6b;
    }
    
    .notification-item.priority-medium {
        border-left: 3px solid #ffa500;
    }
    
    .notification-item.priority-low {
        border-left: 3px solid #51cf66;
    }
    
    .notification-icon {
        color: #8786E3;
        font-size: 1.25rem;
        margin-top: 0.25rem;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-content h5 {
        margin: 0 0 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .notification-content p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: #666;
    }
    
    .notification-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: #999;
    }
    
    .notification-action {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .notification-item:hover .notification-action {
        opacity: 1;
    }
    
    .notification-action:hover {
        color: #8786E3;
    }
    
    .no-notifications {
        padding: 2rem 1rem;
        text-align: center;
        color: #999;
    }
    
    .no-notifications i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }
    
    /* Toast Notifications */
    .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 1001;
        transform: translateX(150%);
        transition: transform 0.3s ease;
        min-width: 300px;
        max-width: 400px;
    }
    
    .notification-toast.show {
        transform: translateX(0);
    }
    
    .notification-toast.new-notification {
        border-left: 4px solid #8786E3;
    }
    
    .notification-toast.toast-success {
        border-left: 4px solid #51cf66;
    }
    
    .notification-toast.toast-error {
        border-left: 4px solid #ff6b6b;
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    }
    
    .toast-content i {
        font-size: 1.25rem;
    }
    
    .new-notification i {
        color: #8786E3;
    }
    
    .toast-success i {
        color: #51cf66;
    }
    
    .toast-error i {
        color: #ff6b6b;
    }
    
    .toast-close {
        background: none;
        border: none;
        color: #999;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0 0 0 1rem;
    }
    
    /* Modal Styles */
    .notification-detail-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .notification-icon-large {
        font-size: 2rem;
        color: #8786E3;
    }
    
    .notification-detail-header h4 {
        margin: 0 0 0.5rem 0;
    }
    
    .notification-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: #666;
        flex-wrap: wrap;
    }
    
    .notification-priority {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: bold;
    }
    
    .notification-priority.high {
        background: #ff6b6b;
        color: white;
    }
    
    .notification-priority.medium {
        background: #ffa500;
        color: white;
    }
    
    .notification-priority.low {
        background: #51cf66;
        color: white;
    }
    
    .notification-detail-body {
        margin-bottom: 1.5rem;
    }
    
    .notification-detail-body p {
        line-height: 1.6;
    }
    
    .notification-expiry {
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
    }
    
    .notification-detail-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize global notification system instance
const notificationSystem = new NotificationSystem();

// Export for use in other scripts
window.NotificationSystem = NotificationSystem;
window.notificationSystem = notificationSystem;

// Auto-initialize when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Your existing initialization code...
});