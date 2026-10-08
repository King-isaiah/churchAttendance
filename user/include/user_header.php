<?php session_start() ?>
<?php 
    // if (!isset($_SESSION['unique_id'])) {
    // header('Location: login.php');
    // exit();
// }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/qr_scanner.css">
    <link rel="stylesheet" href="css/scanner.css">
    
</head>
<style>
    /* Hide the default Html5QrcodeScanner UI elements */
    #qr-reader__dashboard, 
    #qr-reader__dashboard_section_csr, 
    #qr-reader__header_message, 
    #qr-reader__status_span,
    #qr-reader__dashboard_section_swaplink {
        display: none !important;
    }

    /* Ensure the video fills the container */
    #qr-reader video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
    }
    .qr-scanner-body {
        position: relative;
        overflow: hidden;
    }

    .scan-laser {
        position: absolute;
        width: 100%;
        height: 3px;
        background-color: #00ff00;
        box-shadow: 0 0 15px #00ff00, 0 0 30px #00ff00;
        animation: scanAnimation 2.5s ease-in-out infinite;
        z-index: 5;
    }

    @keyframes scanAnimation {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
    }
</style>
<body>

    <div class="content">
        <div class="toastify-container" id="toastifyContainer"></div>
        
        
        <div class="sidebar user-sidebar collapsed">                    
        
        </div>

        <div class="center-div">            
            <div class="top-nav">
                <div class="nav-left">
                    
                    <!-- <button class="mobile-menu-btn" onclick="toggleNavList()">
                        <i class="fas fa-bars"></i>
                    </button> -->
                    <div class="user-welcome">
                        <div class="welcome-content">
                            <h6 class="welcome-text">Welcome, <span class="user-name"> <?php  echo $_SESSION['user_name'] ?></span>! 👋</h6>
                            <span class="user-role">
                                <i class="fas fa-users"></i>
                                Member - <?php echo $_SESSION['user_department'] ?>
                            </span>
                        </div>
                        <div class="user-stats">
                            <div class="stat-badge">
                                <i class="fas fa-fire"></i>
                                <span>3 day streak</span>
                            </div>
                            <div class="stat-badge">
                                <i class="fas fa-check-circle"></i>
                                <span>85% attendance</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="nav-right">
                    <!-- Quick Scan Button -->
                    <button class="quick-scan-btn" onclick="openQRScanner()">
                    <!-- <button class="quick-scan-btn"> -->
                        <div class="scan-pulse"></div>
                        <i class="fas fa-qrcode"></i>
                        <span>Quick Scan</span>
                    </button>
                    
                    <!-- Notifications -->
                    <div class="notification-bell">
                        <button class="notification-btn">
                            <i class="fas fa-bell"></i>
                            <span class="notification-count">0</span>
                        </button>
                        <div class="notification-dropdown">
                            <div class="notification-header">
                                <h4>Notifications</h4>
                                <span class="mark-all-read">Mark all read</span>
                            </div>
                            <div class="notification-list">
                                <div class="notification-item unread">
                                    <div class="notification-icon">
                                        <i class="fas fa-calendar-check"></i>
                                    </div>
                                    <div class="notification-content">
                                        <p></p>
                                        <span class="notification-time"></span>
                                    </div>
                                </div>
                                
                                <div class="notification-item">
                                    <div class="notification-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="notification-content">
                                        <p></p>
                                        <span class="notification-time"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Profile Quick Menu -->
                    <div class="user-menu">
                        <button class="user-avatar-btn">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <span class="user-name-short"> <?php  $randomLetters = strtoupper(substr(str_shuffle($_SESSION['full_name'] ), 0, 2));
                             echo $randomLetters ?></span>
                        </button>
                        <div class="user-dropdown">
                            <div class="user-info">
                                <div class="user-avatar-large">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="user-details">
                                    <h4> <?php echo $_SESSION['user_name'] ?></h4>
                                    <p>Member - <?php echo $_SESSION['user_department'] ?></p>
                                    <span class="user-id">ID: MEM-22<?php echo $_SESSION['unique_id'] ?>3983</span>
                                
                                    <input id='unique_id' type="hidden" value="<?php echo $_SESSION['unique_id']; ?>">
                                    <input id='department_id' type="hidden" value="<?php echo $_SESSION['primary_dept_id'] ; ?>">
                                </div>
                            </div>

                           
            
                            <div class="user-links">
                                <a href="user_dashboard.php" class="user-link">
                                   <i class="fas fa-home"></i>
                                    <span>Dashboard</span>
                                </a>
                                <a href="activities.php" class="user-link">
                                    <i class="fas fa-clipboard-list"></i>
                                    <span>Activities</span>
                                </a>                              
                                <a href="events.php" class="user-link">
                                    <i class="fas fa-calendar"></i>
                                    <span>Events</span>
                                </a>
                                <a href="attendance_history.php" class="user-link">
                                    <i class="fas fa-history"></i>
                                    <span>Attendance History</span>
                                </a>
                                <a href="profile.php" class="user-link">
                                    <i class="fas fa-user-cog"></i>
                                    <span>Profile Settings</span>
                                </a>                               
                              
                                <div class="user-link-divider"></div>
                                <a href="logout.php" class="user-link logout-link">
                                    <i class="fas fa-sign-out-alt"></i>
                                    <span>Logout</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content Area -->
            <div class="main-content">