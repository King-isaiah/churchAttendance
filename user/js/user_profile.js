// User Profile functionality
class UserProfile {
    constructor() {
        this.isEditMode = false;
        this.originalData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProfileData();
    }

    setupEventListeners() {
        // Profile form submission
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileSubmit(e));
        
        // Password form submission
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        
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

    async loadProfileData() {
        try {
            const profileData = await this.fetchProfileData();
            this.populateProfileForm(profileData);
            this.originalData = { ...profileData };
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showMessage('Failed to load profile data', 'error');
        }
    }

    async fetchProfileData() {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    first_name: 'Eshiozemhe',
                    last_name: 'Afuwape',
                    email: 'eshioze@gmil.com',
                    phone: '+1 (555) 123-4567',
                    department: 'Worship Team',
                    join_date: '2023-01-15',
                    membership_id: 'MEM-001234'
                });
            }, 500);
        });

       
    }

    populateProfileForm(data) {
        const form = document.getElementById('profileForm');
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        const form = document.getElementById('profileForm');
        const inputs = form.querySelectorAll('input, select');
        const actions = document.getElementById('profileActions');
        const editBtn = document.querySelector('.edit-profile-btn');

        if (this.isEditMode) {
            // Enable editing
            inputs.forEach(input => {
                input.readOnly = false;
                input.disabled = false;
            });
            actions.style.display = 'flex';
            editBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Editing';
            editBtn.classList.add('editing');
        } else {
            // Disable editing and reset form
            inputs.forEach(input => {
                input.readOnly = true;
                input.disabled = true;
            });
            actions.style.display = 'none';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
            editBtn.classList.remove('editing');
            
            // Reset form to original data
            this.populateProfileForm(this.originalData);
        }
    }

    async handleProfileSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showMessage('Updating profile...', 'loading');
            
            const response = await this.updateProfile(data);
            
            if (response.success) {
                this.showMessage('Profile updated successfully!', 'success');
                this.originalData = { ...data };
                this.toggleEditMode();
                
                // Update displayed name if changed
                if (data.first_name || data.last_name) {
                    this.updateDisplayName(data.first_name, data.last_name);
                }
            } else {
                this.showMessage(response.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showMessage('Error updating profile', 'error');
        }
    }

    async updateProfile(data) {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Profile updated successfully'
                });
            }, 1000);
        });

        // Actual implementation would be:
        /*
        try {
            const response = await fetch('class/ApiHandler.php?entity=profile&action=update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error');
        }
        */
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
            this.showMessage('Error updating password', 'error');
        }
    }

    async updatePassword(data) {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock validation - in real app, this would check current password
                if (data.current_password === 'correctpassword') {
                    resolve({
                        success: true,
                        message: 'Password updated successfully'
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Current password is incorrect'
                    });
                }
            }, 1000);
        });

        // Actual implementation would be:
        /*
        try {
            const response = await fetch('class/ApiHandler.php?entity=profile&action=changePassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            throw new Error('Network error');
        }
        */
    }

    validatePasswordStrength(password) {
        // At least 8 characters, contains letters and numbers
        const strongRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        return strongRegex.test(password);
    }

    updateDisplayName(firstName, lastName) {
        const welcomeElements = document.querySelectorAll('.user-welcome h6');
        welcomeElements.forEach(el => {
            el.textContent = `Welcome, ${firstName} ${lastName}`;
        });
        
        const profileName = document.querySelector('.profile-info h3');
        if (profileName) {
            profileName.textContent = `${firstName} ${lastName}`;
        }
    }

    openChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'block';
        document.getElementById('passwordForm').reset();
    }

    closeChangePassword() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'none';
    }

    openNotifications() {
        this.showMessage('Notification settings would open here', 'info');
        // Implementation for notification settings modal
    }

    openPrivacy() {
        this.showMessage('Privacy settings would open here', 'info');
        // Implementation for privacy settings modal
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    showMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
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