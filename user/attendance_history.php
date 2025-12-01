<?php
    include_once "include/user_header.php";
    $attendanceHistory = [
        [
            'id' => 1,
            'date' => '2024-01-21',
            'activity_name' => 'Sunday Service',
            'time' => '10:00 AM',
            'location' => 'Main Sanctuary',
            'status' => 'present',
            'checked_in' => '2024-01-21 10:05 AM'
        ],
        [
            'id' => 2,
            'date' => '2024-01-20',
            'activity_name' => 'Youth Night',
            'time' => '6:00 PM',
            'location' => 'Youth Hall',
            'status' => 'absent',
            'checked_in' => null
        ]
    ];

    $months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    $years = ['2024', '2023', '2022'];
?>


    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance History - Hub Church</title>
        <link rel="stylesheet" href="css/user_header.css">
        <link rel="stylesheet" href="css/user_attendance.css">
        <link rel="stylesheet" href="../fontawesome/css/all.min.css">
    </head>
    

        <div class="center-div">
          

            <div class="attendance-history-page">
                <div class="page-header">
                    <h2>My Attendance History</h2>
                    <p>Track your participation in church activities</p>
                </div>

                <!-- Summary Cards -->
                <div class="summary-cards">
                    <div class="summary-card total">
                        <div class="summary-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="summary-info">
                            <h3>15</h3>
                            <p>Total Activities</p>
                        </div>
                    </div>
                    
                    <div class="summary-card present">
                        <div class="summary-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h3>12</h3>
                            <p>Present</p>
                        </div>
                    </div>
                    
                    <div class="summary-card absent">
                        <div class="summary-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h3>3</h3>
                            <p>Absent</p>
                        </div>
                    </div>
                    
                    <div class="summary-card rate">
                        <div class="summary-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="summary-info">
                            <h3>80%</h3>
                            <p>Attendance Rate</p>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters-section">
                    <div class="filter-group">
                        <label>Month:</label>
                        <select id="monthFilter">
                            <option value="all">All Months</option>
                            <?php foreach($months as $month): ?>
                                <option value="<?php echo $month; ?>"><?php echo $month; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Year:</label>
                        <select id="yearFilter">
                            <option value="all">All Years</option>
                            <?php foreach($years as $year): ?>
                                <option value="<?php echo $year; ?>"><?php echo $year; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Status:</label>
                        <select id="statusFilter">
                            <option value="all">All Status</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>
                    
                    <button class="btn-primary" onclick="applyFilters()">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                </div>

                <!-- Attendance Table -->
                <div class="table-container">
                    <table class="attendance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Activity</th>
                                <th>Time</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Checked In</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (!empty($attendanceHistory)): ?>
                                <?php foreach ($attendanceHistory as $record): ?>
                                    <tr class="attendance-row status-<?php echo $record['status']; ?>">
                                        <td>
                                            <div class="date-cell">
                                                <strong><?php echo date('M j, Y', strtotime($record['date'])); ?></strong>
                                                <span><?php echo date('D', strtotime($record['date'])); ?></span>
                                            </div>
                                        </td>
                                        <td><?php echo htmlspecialchars($record['activity_name']); ?></td>
                                        <td><?php echo $record['time']; ?></td>
                                        <td><?php echo htmlspecialchars($record['location']); ?></td>
                                        <td>
                                            <span class="status-badge status-<?php echo $record['status']; ?>">
                                                <?php echo ucfirst($record['status']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if ($record['checked_in']): ?>
                                                <?php echo $record['checked_in']; ?>
                                            <?php else: ?>
                                                <span class="no-checkin">-</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="6" class="no-data">
                                        <i class="fas fa-clipboard-list"></i>
                                        <p>No attendance records found</p>
                                    </td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Export Section -->
                <div class="export-section">
                    <button class="btn-secondary" onclick="exportAttendance()">
                        <i class="fas fa-download"></i> Export to CSV
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/user_attendance.js"></script>
    <?php include_once "include/footer.php"; ?>