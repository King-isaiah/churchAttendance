<?php
// session_start();
   include_once "include/user_header.php";
    $userData = [
        'name' => 'Afuwape Eshioze',
        'department' => 'Worship Team',
        'present_count' => 12,
        'upcoming_count' => 5,
        'attendance_rate' => 85,
        'current_streak' => 3
    ];

    $upcomingActivities = [
        [
            'id' => 1,
            'name' => 'Sunday Service',
            'dayofactivity' => '2024-01-21',
            'time' => '10:00 AM',
            'location' => 'Main Sanctuary',
            'attendance_method' => 'qr_code'
        ],
        [
            'id' => 2,
            'name' => 'Bible Study',
            'dayofactivity' => '2024-01-22',
            'time' => '7:00 PM',
            'location' => 'Room 101',
            'attendance_method' => 'numeric_code'
        ]
    ];

    $recentAttendance = [
        [
            'date' => '2024-01-14',
            'activity_name' => 'Sunday Service',
            'time' => '10:00 AM',
            'status' => 'present'
        ],
        [
            'date' => '2024-01-13',
            'activity_name' => 'Youth Night',
            'time' => '6:00 PM',
            'status' => 'absent'
        ]
    ];
?>


<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Dashboard - Hub Church</title>
    <link rel="stylesheet" href="css/user_header.css">
    <link rel="stylesheet" href="css/user_dashboard.css">
    <link rel="stylesheet" href="../fontawesome/css/all.min.css">
    
</head>

  


            <div class="user-dashboard">
                <!-- Welcome Section -->
                <div class="welcome-section">
                    <h1>Welcome, Afuwape Eshiozemhe 👋  <?php echo  $_SESSION['user_department']; ?></h1>
                    <p>Here's your attendance overview and upcoming activities</p>
                </div>

                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon present">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $userData['present_count']; ?></h3>
                            <p>Present Days</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon upcoming">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $userData['upcoming_count']; ?></h3>
                            <p>Upcoming Activities</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon rate">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $userData['attendance_rate']; ?>%</h3>
                            <p>Attendance Rate</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon streak">
                            <i class="fas fa-fire"></i>
                        </div>
                        <div class="stat-info">
                            <h3><?php echo $userData['current_streak']; ?></h3>
                            <p>Current Streak</p>
                        </div>
                    </div>
                </div>

                <div class="dashboard-content">
                    <!-- Upcoming Activities -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h3>Upcoming Activities</h3>
                            <a href="activities.php" class="view-all">View All</a>
                        </div>
                        <div class="activities-list">
                            <?php if (!empty($upcomingActivities)): ?>
                                <?php foreach ($upcomingActivities as $activity): ?>
                                    <div class="activity-item">
                                        <div class="activity-info">
                                            <h4><?php echo htmlspecialchars($activity['name']); ?></h4>
                                            <p>
                                                <i class="fas fa-calendar"></i>
                                                <?php echo date('D, M j', strtotime($activity['dayofactivity'])); ?> at <?php echo $activity['time']; ?>
                                            </p>
                                            <p>
                                                <i class="fas fa-map-marker-alt"></i>
                                                <?php echo htmlspecialchars($activity['location']); ?>
                                            </p>
                                        </div>
                                        <div class="activity-actions">
                                            <?php if ($activity['attendance_method'] === 'qr_code'): ?>
                                                <button class="btn-sm btn-primary scan-btn" 
                                                        onclick="openQRScanner(<?php echo $activity['id']; ?>)">
                                                    <i class="fas fa-qrcode"></i> Scan QR
                                                </button>
                                            <?php endif; ?>
                                            <button class="btn-sm btn-secondary" 
                                                    onclick="viewActivityDetails(<?php echo $activity['id']; ?>)">
                                                <i class="fas fa-info-circle"></i> Details
                                            </button>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="no-data">
                                    <i class="fas fa-calendar-times"></i>
                                    <p>No upcoming activities</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Recent Attendance -->
                    <div class="dashboard-section">
                        <div class="section-header">
                            <h3>Recent Attendance</h3>
                            <a href="attendance_history.php" class="view-all">View All</a>
                        </div>
                        <div class="attendance-list">
                            <?php if (!empty($recentAttendance)): ?>
                                <?php foreach ($recentAttendance as $record): ?>
                                    <div class="attendance-item <?php echo $record['status']; ?>">
                                        <div class="attendance-date">
                                            <strong><?php echo date('M j', strtotime($record['date'])); ?></strong>
                                            <span><?php echo date('D', strtotime($record['date'])); ?></span>
                                        </div>
                                        <div class="attendance-details">
                                            <h4><?php echo htmlspecialchars($record['activity_name']); ?></h4>
                                            <p><?php echo $record['time']; ?></p>
                                        </div>
                                        <div class="attendance-status">
                                            <span class="status-badge status-<?php echo $record['status']; ?>">
                                                <?php echo ucfirst($record['status']); ?>
                                            </span>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="no-data">
                                    <i class="fas fa-clipboard-list"></i>
                                    <p>No attendance records yet</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- QR Scanner Modal -->
    <div id="qrScannerModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Scan QR Code</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div id="qrScanner">
                    <div id="reader" style="width: 100%;"></div>
                    <p class="scan-instruction">Point your camera at the QR code to mark attendance</p>
                </div>
                <div id="scanResult" style="display: none;">
                    <!-- Scan result will appear here -->
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js"></script>
    <script src="js/user_dashboard.js"></script>
      <!-- <script src="../js/main.js"></script> -->
   <?php include_once "include/footer.php"; ?>