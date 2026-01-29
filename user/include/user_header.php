<?php session_start() ?>
<?php 
    if (!isset($_SESSION['unique_id'])) {
    header('Location: user/login.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/qr_scanner.css">
    
</head>
<body>

    <div class="content">
        <div class="toastify-container" id="toastifyContainer"></div>
        
        
        <div class="sidebar user-sidebar collapsed">  
            <!-- <nav class="sidebar-nav">
                <div class="nav-item active" data-page="dashboard">
                    <a href="user_dashboard.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <span class="nav-text">Dashboard</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
                
                <div class="nav-item" data-page="activities">
                    <a href="activities.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-check-square"></i>
                        </div>
                        <span class="nav-text">Activities</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
                
                <div class="nav-item" data-page="attendance">
                    <a href="attendance_history.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <span class="nav-text">Attendance</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
                
                <div class="nav-item" data-page="events">
                    <a href="events.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <span class="nav-text">Events</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
                
                <div class="nav-item" data-page="profile">
                    <a href="profile.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <span class="nav-text">Profile</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
                
                <div class="nav-item logout-item" data-page="logout">
                    <a href="logout.php" class="nav-link">
                        <div class="nav-icon">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <span class="nav-text">Logout</span>
                        <div class="nav-indicator"></div>
                    </a>
                </div>
            </nav> -->
            
        
        </div>

        <div class="center-div">            
            <div class="top-nav">
                <div class="nav-left">
                    
                    <button class="mobile-menu-btn" onclick="toggleNavList()">
                        <i class="fas fa-bars"></i>
                    </button>
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
                        <div class="scan-pulse"></div>
                        <i class="fas fa-qrcode"></i>
                        <span>Quick Scan</span>
                    </button>
                    
                    <!-- Notifications -->
                    <div class="notification-bell">
                        <button class="notification-btn">
                            <i class="fas fa-bell"></i>
                            <span class="notification-count">3</span>
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
                                        <p>Sunday Service starts in 2 hours</p>
                                        <span class="notification-time">10 min ago</span>
                                    </div>
                                </div>
                                <div class="notification-item unread">
                                    <div class="notification-icon">
                                        <i class="fas fa-trophy"></i>
                                    </div>
                                    <div class="notification-content">
                                        <p>You've achieved 3-week streak! 🎉</p>
                                        <span class="notification-time">1 hour ago</span>
                                    </div>
                                </div>
                                <div class="notification-item">
                                    <div class="notification-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="notification-content">
                                        <p>New event: Youth Night this Friday</p>
                                        <span class="notification-time">2 hours ago</span>
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
                                    <input id='department_id' type="hidden" value="<?php echo $_SESSION['department_id']; ?>">
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