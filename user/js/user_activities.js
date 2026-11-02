// User Activities functionality
class UserActivities {
    constructor() {
        this.activities = [];
        this.filteredActivities = [];
        this.currentActivityId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadActivities();
        this.initializeFilters();
        this.populateCategories();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('activitySearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterActivities();
            }, 300));
        }

        // Filter changes
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterActivities());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterActivities());

        // Modal close events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    initializeFilters() {
        // Initialize filter values from URL parameters or defaults
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const status = urlParams.get('status');
        
        if (category) {
            document.getElementById('categoryFilter').value = category;
        }
        if (status) {
            document.getElementById('statusFilter').value = status;
        }
    }



    async populateCategories() {
        try {
            const response = await fetch('../class/ApiHandler.php?entity=categories&action=getAll');
            
            if (!response.ok) {
                showError('response for populateCategoryfailed')
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                showError('data not succesfull for populatecategory two')
                throw new Error('API request failed')               
            }
           
            const categories = data.data || [];
            const categoryFilter = document.getElementById('categoryFilter');
          
            // Clear existing options except "All Categories"
            const allCategoriesOption = categoryFilter.querySelector('option[value="all"]');
            categoryFilter.innerHTML = '';
            categoryFilter.appendChild(allCategoriesOption);
            showSuccess('testing one two')
            // Add categories from API
            categories.forEach(category => {
                if (category.categories && category.categories.toLowerCase() !== 'all') {
                    const option = document.createElement('option');
                    option.value = category.categories ? category.categories.toLowerCase() : '';
                    option.textContent = category.categories || 'Unnamed Category';
                    categoryFilter.appendChild(option);
                }
            
            });            
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback - the existing PHP categories will remain
        }
    }

    async loadActivities() {
        try {
            // Show loading state
            this.showLoading(true);

            const activities = await this.fetchActivities();
            this.activities = activities;
            this.filteredActivities = activities;
            
            this.renderActivities();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading activities:', error);
            this.showError('Failed to load activities');
            this.showLoading(false);
        }
    }
    

    filterActivities() {
        const searchTerm = document.getElementById('activitySearch').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value.toLowerCase();

        this.filteredActivities = this.activities.filter(activity => {
            const matchesSearch = !searchTerm || 
                activity.name.toLowerCase().includes(searchTerm) ||
                activity.description.toLowerCase().includes(searchTerm) ||
                activity.location.toLowerCase().includes(searchTerm);

            // FIXED: Convert to lowercase for a case-insensitive match
            const matchesCategory = categoryFilter === 'all' || 
                activity.category.toLowerCase() === categoryFilter;

            // FIXED: Convert to lowercase for a case-insensitive match
            const matchesStatus = statusFilter === 'all' || 
                activity.status.toLowerCase() === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderActivities();
    }

    renderActivities() {
        const grid = document.querySelector('.activities-grid');
        
        if (this.filteredActivities.length === 0) {
            grid.innerHTML = `
                <div class="no-activities">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Activities Found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredActivities.map(activity => `
            <div class="activity-card" 
                 data-category="${activity.category}"
                 data-status="${activity.status}">
                <div class="activity-header">
                    <h3>${this.escapeHtml(activity.name)}</h3>
                    <span class="activity-badge badge-${activity.color}" style="background-color: ${activity.color};">
                        ${this.capitalizeFirst(activity.status)}
                    </span>
                </div>
                
                <div class="activity-body">
                    <p class="activity-description">${this.escapeHtml(activity.description)}</p>
                    
                    <div class="activity-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span> ${this.escapeHtml(activity.dayofactivity)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${activity.time}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.escapeHtml(activity.location)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span>${this.capitalizeFirst(activity.category)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="activity-footer">
                    ${activity.status !== 'Upcoming' ? `
                        ${activity.attendance_method === 'qr_code' ? `
                            <button class="btn-primary scan-btn" onclick="userActivities.openQRScanner(${activity.id})">
                                <i class="fas fa-qrcode"></i> Scan QR Code
                            </button>
                        ` : activity.attendance_method === 'numeric_code' ? `
                            <button class="btn-secondary" onclick="userActivities.enterNumericCode(${activity.id})">
                                <i class="fas fa-keyboard"></i> Enter Code
                            </button>
                        ` : ''}
                        
                        <button class="btn-outline" onclick="userActivities.viewActivityDetails(${activity.id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                    ` : `
                        <p style="color: #666; font-style: italic;">Attendance not available for upcoming activities</p>
                    `}
                </div>
            </div>
        `).join('');
    }

    openQRScanner(activityId) {
        this.currentActivityId = activityId;
        
        // Use the dashboard's QR scanner functionality
        if (typeof openQRScanner === 'function') {
            openQRScanner(activityId);
        } else {
            this.showMessage('QR Scanner not available', 'error');
        }
    }

    enterNumericCode(activityId) {
        this.currentActivityId = activityId;
        const modal = document.getElementById('numericCodeModal');
        modal.style.display = 'block';
        
        // Clear previous input
        document.getElementById('attendanceCode').value = '';
    }

    closeNumericModal() {
        const modal = document.getElementById('numericCodeModal');
        modal.style.display = 'none';
    }

    async submitAttendanceCode() {
        const code = document.getElementById('attendanceCode').value.trim();
        
        if (!code) {
            this.showMessage('Please enter the attendance code', 'error');
            return;
        }

        try {
            this.showMessage('Submitting attendance code...', 'loading');
            
            const response = await this.markAttendanceWithCode(code);
            
            if (response.success) {
                this.showMessage('Attendance marked successfully!', 'success');
                this.closeNumericModal();
                
                // Refresh activities to show updated status
                setTimeout(() => {
                    this.loadActivities();
                }, 1000);
            } else {
                this.showMessage(response.message || 'Invalid code', 'error');
            }
        } catch (error) {
            console.error('Error submitting code:', error);
            this.showMessage('Error submitting attendance', 'error');
        }
    }

    async markAttendanceWithCode(code) {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock validation
                if (code.length >= 4) {
                    resolve({
                        success: true,
                        message: 'Attendance marked successfully',
                        activity: 'Bible Study'
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Invalid code'
                    });
                }
            }, 1000);
        });

        
    }

    async viewActivityDetails(activityId) {
        try {
            const activity = await this.fetchActivityDetails(activityId);
            this.showActivityDetails(activity);
        } catch (error) {
            console.error('Error loading activity details:', error);
            this.showMessage('Failed to load activity details', 'error');
        }
    }

    async fetchActivityDetails(activityId) {
        try {
         
            const response = await fetch(`../class/ApiHandler.php?entity=activities&action=get&id=${activityId}`);
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

    async fetchActivities() {       
        try {
            // FIXED: Points to the new user-specific endpoint
            const response = await fetch('../class/ApiHandler.php?entity=activities_user&action=getOthers');
        
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
    
            if (!data.success) {
                throw new Error('API request failed');
            }
            
            const rawActivities = data.data || [];
            
            // FIXED: Removed 'Cancelled' check since backend already filters for 1 and 2
            const transformedActivities = rawActivities.map(activity => ({
                id: activity.id || 0,
                name: activity.name || 'Unnamed Activity', 
                description: activity.description || 'No description available',                    
                category: activity.category || 'general',                  
                dayofactivity: activity.dayofactivity || 'No day given',
                time: activity.time || '00:00',
                location: activity.location || 'Unknown Location',
                attendance_method: activity.code || 'manual',
                status: activity.status || 'Active',               
                color: activity.status === 'Active' ? 'green' : 'orange',               
            }));
            
            return transformedActivities;
            
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw new Error('Failed to fetch activities: ' + error.message);
        }
    }

    showActivityDetails(activity) {
        const modal = document.getElementById('activityDetailsModal');
        const content = document.getElementById('activityDetailsContent');
        
        // FIXED: Removed 'Invalid Date' formatting and used dayofactivity
        content.innerHTML = `
            <div class="modern-activity-details">
                <div class="detail-header">
                    <h4>${this.escapeHtml(activity.name)}</h4>
                    <span class="status-badge" style="background: ${activity.status === 'Active' ? '#28a745' : '#ffc107'}; color: white;">
                        ${this.capitalizeFirst(activity.status)}
                    </span>
                </div>
                
                <p class="detail-desc">${this.escapeHtml(activity.description)}</p>
                
                <div class="details-grid-modern">
                    <div class="detail-item-modern">
                        <i class="fas fa-tag"></i>
                        <div>
                            <small>Category</small>
                            <span>${this.escapeHtml(activity.category)}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <i class="fas fa-calendar-day"></i>
                        <div>
                            <small>Day</small>
                            <span>${this.escapeHtml(activity.dayofactivity)}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <i class="fas fa-clock"></i>
                        <div>
                            <small>Time</small>
                            <span>${activity.time}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <small>Location</small>
                            <span>${this.escapeHtml(activity.location)}</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <i class="fas fa-users"></i>
                        <div>
                            <small>Expected Attendance</small>
                            <span>${activity.expected_count || 'N/A'} people</span>
                        </div>
                    </div>
                    <div class="detail-item-modern">
                        <i class="fas fa-qrcode"></i>
                        <div>
                            <small>Attendance Method</small>
                            <span>${this.capitalizeFirst(activity.attendance_method.replace('_', ' '))}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showLoading(show) {
        const grid = document.querySelector('.activities-grid');
        if (show) {
            grid.innerHTML = `
                <div class="no-activities">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Loading Activities</h3>
                    <p>Please wait...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const grid = document.querySelector('.activities-grid');
        grid.innerHTML = `
            <div class="no-activities">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Activities</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="userActivities.loadActivities()" style="margin-top: 1rem;">
                    Try Again
                </button>
            </div>
        `;
    }

    showMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    formatDate(dateString, format) {
        const date = new Date(dateString);
        const options = {
            'D, M j, Y': { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
            'M j': { month: 'short', day: 'numeric' },
            'D': { weekday: 'short' }
        };
        return date.toLocaleDateString('en-US', options[format]);
    }
}

// Initialize activities when page loads
let userActivities;
document.addEventListener('DOMContentLoaded', () => {
    userActivities = new UserActivities();
});

// Global functions for HTML onclick handlers
function enterNumericCode(activityId) {
    if (userActivities) {
        userActivities.enterNumericCode(activityId);
    }
}

function closeNumericModal() {
    if (userActivities) {
        userActivities.closeNumericModal();
    }
}

function submitAttendanceCode() {
    if (userActivities) {
        userActivities.submitAttendanceCode();
    }
}

function viewActivityDetails(activityId) {
    if (userActivities) {
        userActivities.viewActivityDetails(activityId);
    }
}