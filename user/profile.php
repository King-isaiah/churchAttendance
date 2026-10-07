<?php
   include_once "include/user_header.php"; 
    
    $departments = ['Worship Team', 'Youth Ministry', 'Children Ministry', 'Outreach', 'Administration'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Profile - Hub Church</title>
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/user_profile.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">
</head>
<body>
   

        <div class="center-div">
           

            <div class="profile-page">
                <div class="page-header">
                    <h2>My Profile</h2>
                    <p>Manage your personal information and preferences</p>
                </div>

                <div class="profile-content">
                    <!-- Profile Overview -->
                    <div class="profile-card">
                        <div class="profile-header">
                            <div class="profile-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="profile-info">
                                <h3></h3>
                                <p></p>
                                <span class="member-id"></span>
                            </div>
                            <button class="btn-outline edit-profile-btn" onclick="toggleEditMode()">
                                <i class="fas fa-edit"></i> Edit Profile
                            </button>
                        </div>
                    </div>

                    <div class="profile-sections">
                        <!-- Personal Information -->
                        <div class="profile-section">
                            <h4>Personal Information</h4>
                            <form id="profileForm" class="profile-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>First Name</label>
                                        <input type="text" name="first_name" value="" readonly>
                                    </div>
                                    <div class="form-group">
                                        <label>Last Name</label>
                                        <input type="text" name="last_name" value="" readonly>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Email Address</label>
                                        <input type="email" name="email" value="" readonly>
                                    </div>
                                    <div class="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" name="phone" value="" readonly>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Department</label>
                                    <select name="department_id" disabled>
                                        
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Join Date</label>
                                    <input type="text"  name="join_date" value=""readonly>
                                </div>
                                
                                <div class="form-actions" id="profileActions" style="display: none;">
                                    <button type="button" class="btn-secondary" onclick="toggleEditMode()">Cancel</button>
                                    <button type="submit" class="btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>

                        <!-- Account Settings -->
                        <div class="profile-section">
                            <h4>Account Settings</h4>
                            <div class="settings-list">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5>Change Password</h5>
                                        <p>Update your account password</p>
                                    </div>
                                    <button class="btn-outline" onclick="openChangePassword()">
                                        Change Password
                                    </button>
                                </div>
                                
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5>Notification Preferences</h5>
                                        <p>Manage how you receive notifications</p>
                                    </div>
                                    <button class="btn-outline" onclick="openNotifications()">
                                        Manage
                                    </button>
                                </div>
                                
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h5>Privacy Settings</h5>
                                        <p>Control your privacy and data</p>
                                    </div>
                                    <button class="btn-outline" onclick="openPrivacy()">
                                        Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Change Password Modal -->
    <div id="changePasswordModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Change Password</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="passwordForm">
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" name="current_password" required>
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" name="new_password" id="password" required>
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" name="confirm_password" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeChangePassword()">Cancel</button>
                        <button type="submit" class="btn-primary">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/user_profile.js"></script>
   <?php include_once "include/footer.php"; ?>