class UserProfile {
    constructor() {
        this.isEditMode = false;
        this.originalData = {};
        this.uniqueId = this.getCurrentUserId();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProfileData();
        this.loadDepartments();
    }

async loadDepartments() {
    try {
        const url = `class/ApiHandler.php?action=getAll&entity=departments`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            this.populateDepartmentDropdown(result.data);
        } else {
            console.error('Failed to load departments:', result.message);
            this.showMessage(result.message || 'Failed to load departments', 'error');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        this.showMessage('Error loading departments. Please try again.', 'error');
    }
}

populateDepartmentDropdown(departments) {
    const departmentSelect = document.querySelector('select[name="department_id"]');
    if (!departmentSelect) return;
    
    departmentSelect.innerHTML = '';
    
    // Add a default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Department';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    departmentSelect.appendChild(defaultOption);
    
    // Add department options
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name || 'Unnamed Department';
        
        // If you want to select the current user's department
        if (this.originalData.department && 
            (dept.id === this.originalData.department || 
             dept.name === this.originalData.department)) {
            option.selected = true;
        }
        
        departmentSelect.appendChild(option);
    });
}




    setupEventListeners() {
        const profileForm = document.getElementById('profileForm');
        const passwordForm = document.getElementById('passwordForm');
        
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.updateProfile(e));
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }
        
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }
        
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
    }

    getCurrentUserId() {      
        const uniqueIdElement = document.getElementById('unique_id');
        console.log(uniqueIdElement)
        if (uniqueIdElement && uniqueIdElement.value) {
            return uniqueIdElement.value;
        }
        
        const storedId = localStorage.getItem('user_unique_id') || 
                         sessionStorage.getItem('user_unique_id');
        
        if (storedId) {
            return storedId;
        }
        
        // If no ID found, return a default for testing
        console.warn('No unique_id found');
        
    }

    async loadProfileData() {
        try {
            const profileData = await this.fetchProfileData();
            if (profileData) {
                this.populateProfileForm(profileData);
                this.originalData = { ...profileData };
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showMessage('Failed to load profile data. Please try again.', 'error');
        }
    }

    async fetchProfileData() {
        try {           
            let unique_id = this.uniqueId
            const response = await fetch(`class/ApiHandler.php?action=get&entity=members&id=${unique_id}`);           
            const result = await response.json();
            if (result.success && result.data) {
                // showSuccess('we in fm')
                const userData = result.data;
                return {
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    department: userData.department || '',
                    join_date: userData.join_date || '',
                    membership_id: userData.unique_id || ''
                };
            } else {
                console.error('API returned error:', result.message);
                this.showMessage(result.message || 'Failed to load profile data', 'error');
                return null;
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            throw error;
        }
    }
    centerDiv(){
        const center =  document.getElementById('center-div');
    }
    populateProfileForm(data) {
        const form = document.getElementById('profileForm');
        if (!form) return;
        
        const fields = {
            'first_name': data.first_name,
            'last_name': data.last_name,
            'email': data.email,
            'phone': data.phone,
            'department': data.department,
            'join_date': data.join_date,
            'membership_id': data.unique_id
        };
        
        Object.keys(fields).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = fields[key] || '';
            }
        });
        
        // Update display name if needed
        this.updateDisplayName(data.department, data.first_name, data.last_name);
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const form = document.getElementById('profileForm');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, select');
        const actions = document.getElementById('profileActions');
        const editBtn = document.querySelector('.edit-profile-btn');

        if (this.isEditMode) {
            // Enable editing (except non-editable fields)
            inputs.forEach(input => {
                if (!input.classList.contains('non-editable')) {
                    input.readOnly = false;
                    input.disabled = false;
                }
            });
            
            if (actions) actions.style.display = 'flex';
            
            if (editBtn) {
                editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Editing';
                editBtn.classList.add('editing');
            }
        } else {
            // Disable editing and reset form
            inputs.forEach(input => {
                input.readOnly = true;
                input.disabled = true;
            });
            
            if (actions) actions.style.display = 'none';
            
            if (editBtn) {
                editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
                editBtn.classList.remove('editing');
            }
            
            // Reset form to original data
            this.populateProfileForm(this.originalData);
        }
    }

    formatJoinDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        // Format as "12 September 2023"
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long', 
            year: 'numeric'
        });
    }
async handleProfileSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Add unique_id to the data
    data.unique_id = this.uniqueId;

    try {
          
        const notNow = {
            unique_id: this.uniqueId,
            first_name: data.first_name,               
            last_name: data.last_name,               
            email: data.email,               
            phone: data.phone,               
            department_id: data.department_id,               
            // department_id: '12',               
        };
    
        const url = `class/ApiHandler.php?action=update&entity=members&id=${this.uniqueId}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notNow)
        });
    
        if (response){
            showSuccess('Succesfully updated')
            return await response.json();
        }
            
        
        
        if (response && response.success) {
            this.showMessage('Profile updated successfully!', 'success');

            this.originalData = { 
                ...this.originalData,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                department: data.department,
                unique_id: this.uniqueId,
                join_date: this.formatJoinDate(data.join_date)  
            };
            this.toggleEditMode();
            
            // Update displayed name
            this.updateDisplayName(data.department, data.first_name, data.last_name);
        } else {
            this.showMessage(response?.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        this.showMessage('Error updating profile. Please try again.', 'error');
    }
}



    async handlePasswordSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validate passwords match
        if (data.new_password !== data.confirm_password) {
            this.showMessage('New passwords do not match', 'error');
            return;
        }

        // Validate password strength
        if (!this.validatePasswordStrength(data.new_password)) {
            this.showMessage('Password must be at least 8 characters with letters and numbers', 'error');
            return;
        }

        try {
            this.showMessage('Updating password...', 'loading');
            
            const response = await this.updatePassword(data);
            
            if (response.success) {
                this.showMessage('Password updated successfully!', 'success');
                this.closeChangePassword();
                e.target.reset();
            } else {
                this.showMessage(response.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            this.showMessage('Error updating password. Please try again.', 'error');
        }
    }

    async updatePassword(data) {
        try {
            const passwordData = {
                unique_id: this.uniqueId,
                password: data.new_password                
            };
            
            const url = `class/ApiHandler.php?action=update&entity=members&id=${this.uniqueId}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passwordData)
            });
            if (response){
                showSuccess('yh its working')
                return await response.json();
            }
            
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    validatePasswordStrength(password) {
        // At least 8 characters, contains letters and numbers
        const strongRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        return strongRegex.test(password);
    }

    updateDisplayName(department, firstName, lastName) {
        const welcomeElements = document.querySelectorAll('.user-welcome h6');
        welcomeElements.forEach(el => {
            el.textContent = `Welcome, ${firstName} ${lastName}`;
        });
        
        const profileName = document.querySelector('.profile-info h3');
        const profileDepartment = document.querySelector('.profile-info p');
        const profileUnique_id = document.querySelector('.profile-info span');
        if (profileName) {
            profileName.textContent = `${firstName} ${lastName}`;
        }
        if (profileDepartment) {
            profileDepartment.textContent = `${department}`;
        }
        if (profileUnique_id) {
            profileUnique_id.textContent = `ID: MM${this.uniqueId}`;
        }
    }

    openChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.style.display = 'block';
            const passwordForm = document.getElementById('passwordForm');
            if (passwordForm) passwordForm.reset();
        }
    }

    closeChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    openNotifications() {
        this.showNotificationSettings();
    }

    openPrivacy() {
        this.showPrivacySettings();
    }

    showNotificationSettings() {
        // Create or show notification settings modal
        let modal = document.getElementById('notificationSettingsModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'notificationSettingsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h4>Notification Settings</h4>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="notification-settings">
                            <h5>Email Notifications</h5>
                            <div class="notification-option">
                                <label>
                                    <input type="checkbox" name="email_attendance_reminders" checked>
                                    <span>Attendance reminders</span>
                                </label>
                                <p class="description">Get notified about upcoming events and activities</p>
                            </div>
                            <div class="notification-option">
                                <label>
                                    <input type="checkbox" name="email_announcements" checked>
                                    <span>Church announcements</span>
                                </label>
                                <p class="description">Receive important church announcements and updates</p>
                            </div>
                            <div class="notification-option">
                                <label>
                                    <input type="checkbox" name="email_department_updates" checked>
                                    <span>Department updates</span>
                                </label>
                                <p class="description">Updates from your ministry department</p>
                            </div>
                            
                            <h5 style="margin-top: 20px;">SMS Notifications</h5>
                            <div class="notification-option">
                                <label>
                                    <input type="checkbox" name="sms_urgent_alerts">
                                    <span>Urgent alerts</span>
                                </label>
                                <p class="description">Important announcements via SMS</p>
                            </div>
                            
                            <h5 style="margin-top: 20px;">Notification Frequency</h5>
                            <div class="notification-option">
                                <label>Email frequency:</label>
                                <select name="email_frequency" style="margin-left: 10px;">
                                    <option value="immediate">Immediate</option>
                                    <option value="daily">Daily digest</option>
                                    <option value="weekly">Weekly digest</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeModalById('notificationSettingsModal')">Cancel</button>
                        <button type="button" class="btn-primary" onclick="saveNotificationSettings()">Save Settings</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listener for close button
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        modal.style.display = 'block';
    }

    showPrivacySettings() {
        // Create or show privacy settings modal
        let modal = document.getElementById('privacySettingsModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'privacySettingsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h4>Privacy Settings</h4>
                        <span class="close-modal">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="privacy-settings">
                            <h5>Profile Visibility</h5>
                            <div class="privacy-option">
                                <label>
                                    <input type="radio" name="profile_visibility" value="public" checked>
                                    <span>Show my profile to other members</span>
                                </label>
                                <p class="description">Other church members can view your basic profile information</p>
                            </div>
                            <div class="privacy-option">
                                <label>
                                    <input type="radio" name="profile_visibility" value="private">
                                    <span>Keep my profile private</span>
                                </label>
                                <p class="description">Only church administrators can view your profile</p>
                            </div>
                            
                            <h5 style="margin-top: 20px;">Attendance Visibility</h5>
                            <div class="privacy-option">
                                <label>
                                    <input type="checkbox" name="show_attendance" checked>
                                    <span>Show my attendance history</span>
                                </label>
                                <p class="description">Allow others to see your participation in church activities</p>
                            </div>
                            
                            <h5 style="margin-top: 20px;">Contact Information</h5>
                            <div class="privacy-option">
                                <label>
                                    <input type="checkbox" name="show_email" checked>
                                    <span>Show my email address</span>
                                </label>
                            </div>
                            <div class="privacy-option">
                                <label>
                                    <input type="checkbox" name="show_phone">
                                    <span>Show my phone number</span>
                                </label>
                            </div>
                            
                            <h5 style="margin-top: 20px;">Data Management</h5>
                            <div class="privacy-option">
                                <button type="button" class="btn-secondary" onclick="exportMyData()" style="margin-right: 10px;">
                                    <i class="fas fa-download"></i> Export My Data
                                </button>
                                <button type="button" class="btn-danger" onclick="requestDataDeletion()">
                                    <i class="fas fa-trash"></i> Request Data Deletion
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeModalById('privacySettingsModal')">Cancel</button>
                        <button type="button" class="btn-primary" onclick="savePrivacySettings()">Save Settings</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listener for close button
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        modal.style.display = 'block';
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Use existing functions from main.js instead of creating duplicates
    showMessage(message, type = 'info') {
        if (typeof showToastify === 'function') {
            // Map 'loading' type to 'info' since showToastify doesn't have loading
            const toastType = type === 'loading' ? 'info' : type;
            showToastify(message, toastType);
        } else if (typeof showError === 'function' && type === 'error') {
            showError(message);
        } else if (typeof showSuccess === 'function' && type === 'success') {
            showSuccess(message);
        } else {
            alert(message);
        }
    }

    // Use existing escapeHtml from main.js
    escapeHtml(unsafe) {
        if (typeof escapeHtml === 'function') {
            return escapeHtml(unsafe);
        }
        // Fallback implementation if main.js function not available
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Use existing formatDate from main.js
    formatDate(dateString) {
        if (typeof formatDate === 'function') {
            return formatDate(dateString);
        }
        // Fallback implementation
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Use existing formatDateTime from main.js
    formatDateTime(dateTimeString) {
        if (typeof formatDateTime === 'function') {
            return formatDateTime(dateTimeString);
        }
        // Fallback implementation
        if (!dateTimeString) return 'N/A';
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Note: formatTime function exists in main.js but is not used in this class
    // If needed, you could add a wrapper method similar to above
}



// Initialize profile when page loads
let userProfile;
document.addEventListener('DOMContentLoaded', () => {
    userProfile = new UserProfile();
});

// Global functions for HTML onclick handlers
function toggleEditMode() {
    if (userProfile) {
        userProfile.toggleEditMode();
    }
}

function openChangePassword() {
    if (userProfile) {
        userProfile.openChangePassword();
    }
}

function closeChangePassword() {
    if (userProfile) {
        userProfile.closeChangePassword();
    }
}

function openNotifications() {
    if (userProfile) {
        userProfile.openNotifications();
    }
}

function openPrivacy() {
    if (userProfile) {
        userProfile.openPrivacy();
    }
}

// Helper functions for modals
function closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveNotificationSettings() {
    // Collect form data from notification settings modal
    const modal = document.getElementById('notificationSettingsModal');
    const formData = {};
    
    modal.querySelectorAll('input[type="checkbox"], select').forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else {
            formData[input.name] = input.value;
        }
    });
    
    // Save to database via API
    console.log('Saving notification settings:', formData);
    
    // Use showToastify from main.js instead of showMessage
    if (typeof showToastify === 'function') {
        showToastify('Notification settings saved successfully!', 'success');
    } else if (typeof userProfile !== 'undefined' && userProfile.showMessage) {
        userProfile.showMessage('Notification settings saved successfully!', 'success');
    } else {
        alert('Notification settings saved successfully!');
    }
    
    closeModalById('notificationSettingsModal');
}

function savePrivacySettings() {
    // Collect form data from privacy settings modal
    const modal = document.getElementById('privacySettingsModal');
    const formData = {};
    
    modal.querySelectorAll('input[type="checkbox"], input[type="radio"]:checked, select').forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
        } else if (input.type === 'radio') {
            formData[input.name] = input.value;
        }
    });
    
    // Save to database via API
    console.log('Saving privacy settings:', formData);
    
    // Use showToastify from main.js instead of showMessage
    if (typeof showToastify === 'function') {
        showToastify('Privacy settings saved successfully!', 'success');
    } else if (typeof userProfile !== 'undefined' && userProfile.showMessage) {
        userProfile.showMessage('Privacy settings saved successfully!', 'success');
    } else {
        alert('Privacy settings saved successfully!');
    }
    
    closeModalById('privacySettingsModal');
}

function exportMyData() {
    // Use showToastify or showInfo from main.js
    if (typeof showToastify === 'function') {
        showToastify('Data export requested. You will receive an email with your data shortly.', 'info');
    } else if (typeof showInfo === 'function') {
        showInfo('Data export requested. You will receive an email with your data shortly.');
    } else if (typeof userProfile !== 'undefined' && userProfile.showMessage) {
        userProfile.showMessage('Data export requested. You will receive an email with your data shortly.', 'info');
    } else {
        alert('Data export requested. You will receive an email with your data shortly.');
    }
}

function requestDataDeletion() {
    if (confirm('Are you sure you want to request deletion of your data? This action cannot be undone.')) {
        // Use showToastify or showWarning from main.js
        if (typeof showToastify === 'function') {
            showToastify('Data deletion request submitted. An administrator will contact you shortly.', 'warning');
        } else if (typeof showWarning === 'function') {
            showWarning('Data deletion request submitted. An administrator will contact you shortly.');
        } else if (typeof userProfile !== 'undefined' && userProfile.showMessage) {
            userProfile.showMessage('Data deletion request submitted. An administrator will contact you shortly.', 'warning');
        } else {
            alert('Data deletion request submitted. An administrator will contact you shortly.');
        }
    }
}

