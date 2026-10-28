<?php
// 1. Start the session if it hasn't been started yet
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 2. Check if the user has a unique_id and it is not empty
if (!isset($_SESSION['unique_id']) || empty($_SESSION['unique_id'])) {
    // Redirect to login.html with a query parameter.     
    header('Location: ../login.html?login_required=1');
    exit();
}

// 3. HEARTBEAT: Update the user's last activity timestamp
if (isset($_SESSION['user_id'])) {
    // require_once __DIR__ . '/../class/Member.php'; 
    require_once __DIR__ . '/../../class/Member.php'; 
    $heartbeat = new Member();
    $heartbeat->updateHeartbeat($_SESSION['user_id']);
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/activity.css">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">    
</head>
<body>
    <div class="content">
        <!-- Toastify Container -->
        <div class="toastify-container" id="toastifyContainer"></div>
        <div class="sidebar">  
            <div class="sidebar-top-wrapper">
                <div class="sidebar-top">
                    <a href="" class="logo__wrapper">
                        <img src="images/hublogo.jpg" alt="logo" class="logo-small">
                        <div class="hide sidebar-top__company">
                            <span class="hub-name">
                                Hub Church
                            </span>
                            <span class="hub-workers">6.3k Workers</span>
                        </div>
                    </a>
                </div>
                <button class="expand-btn" type="button"></button>
            </div>
           
            <div> 
                <div class="icon-square">
                    <a href="dashboard.php">
                        <i class="fas fa-home"></i> 
                        <span class="hide">Dashboard</span> 
                    </a>   
                </div>
                <div class="icon-square">
                    <a href="management.php">
                        <i class="fas fa-user-cog"></i>
                        <span class="hide">Management</span>
                    </a>                              
                </div>
                <div class="icon-square">
                    <a href="activities.php">
                        <i class="fas fa-check-square"></i> 
                        <span class="hide">Activities </span>
                    </a>                              
                </div>
                <div class="icon-square">
                    <a href="events.php">                        
                        <i class="fas fa-calendar-alt"></i> 
                        <span class="hide">Events</span>
                    </a>                              
                </div>
                <div class="icon-square">
                    <a href="members.php">                        
                        <i class="fas fa-user-plus"></i>
                        <span class="hide">Members</span>
                    </a>                              
                </div>
                <div class="icon-square">
                    <a href="reports.php">
                       <i class="fas fa-file-alt"></i>
                        <span class="hide">Report</span>
                    </a>                              
                </div>
               
                <div class="icon-square">
                    <a href="email_logs.php">
                        <i class="fas fa-envelope-open-text"></i> 
                        <span class="hide">Email Logs</span>
                    </a>                     
                </div>

               <div class="icon-square">
                    <a href="dataManagement.php">
                        <i class="fas fa-database"></i> 
                        <span class="hide">Data Management</span>
                    </a>                     
                </div>
                
                <div class="icon-square">
                    <a href="logout.php">                        
                        <i class="fas fa-sign-out-alt"></i> 
                        <span class="hide">Log Out</span>
                    </a>                     
                </div>
            
            </div>         
            
           

        </div>
        <div class="center-div">
            <div class="top-nav">
                <h6 style="color: greenyellow;">Hub Church</h6>