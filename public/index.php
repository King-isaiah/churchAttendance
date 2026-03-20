<?php 
include "include/header.php";
// In a real application, you would fetch this data from your database
$weeklyData = [65, 59, 80, 81, 56, 55, 72]; // Example data for the chart
$activities = [
    ['name' => 'Sunday Service', 'attendance' => 150, 'date' => '2023-06-18'],
    ['name' => 'Bible Study', 'attendance' => 45, 'date' => '2023-06-15'],
    ['name' => 'Youth Group', 'attendance' => 35, 'date' => '2023-06-16']
];
?>
        
<div class="center-div">
    <div class="top-nav">
        <h6 style="color: greenyellow;">Hub Church</h6>
        <div class="text-nav">
            <h3>Attendance Dashboard</h3>
            <div class="header-controls">
                <input type="text" placeholder="🔍 Search activities"> 
                <div class="user-profile">
                    <img src="images/test.jpg" alt="Profile">
                    <span>Admin</span>
                </div>
            </div>
        </div>
        
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-icon" style="background: #c1bff2;">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h4>245</h4>
                    <p>Total Attendees</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #ffb2b2;">
                    <i class="fas fa-calendar-check"></i>
                </div>
                <div class="stat-info">
                    <h4>12</h4>
                    <p>Activities This Week</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #c9e78a;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h4>+15%</h4>
                    <p>Growth</p>
                </div>
            </div>
        </div>
        
        <div class="charts">
            <div class="progress-chart">
                <div class="chart-header">
                    <h4>Weekly Attendance</h4>
                    <select id="chart-filter">
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                    </select>
                </div>
                <canvas id="attendanceChart" width="500" height="300"></canvas>
            </div>
            <div class="activity-list">
                <div class="activity-header">
                    <h4>Recent Activities</h4>
                    <a href="activities.php">View All</a>
                </div>
                <div class="activity-items">
                    <?php foreach($activities as $activity): ?>
                    <div class="activity-item">
                        <div class="activity-info">
                            <h5><?php echo $activity['name']; ?></h5>
                            <p><?php echo date('M j, Y', strtotime($activity['date'])); ?></p>
                        </div>
                        <div class="attendance-count">
                            <span><?php echo $activity['attendance']; ?> attendees</span>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="last">
    <div class="last-text">
        <h5>📆 Attendance Rewards</h5>
        <a href="#">View all</a>
    </div>
    <div class="btn-group">
        <button class="btn-active">Activities</button>
        <button>Online</button>
    </div>
    <div class="rewards-container">
        <div class="reward-item">
            <div class="reward-badge" style="background: gold;">
                <i class="fas fa-trophy"></i>
            </div>
            <p>Perfect Attendance</p>
        </div>
        <div class="reward-item">
            <div class="reward-badge" style="background: silver;">
                <i class="fas fa-star"></i>
            </div>
            <p>Regular Participant</p>
        </div>
        <div class="reward-item">
            <div class="reward-badge" style="background: #cd7f32;">
                <i class="fas fa-award"></i>
            </div>
            <p>New Member</p>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Chart initialization
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    const attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Attendance',
                data: <?php echo json_encode($weeklyData); ?>,
                backgroundColor: 'rgba(135, 134, 227, 0.2)',
                borderColor: 'rgba(135, 134, 227, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Filter change handler
    document.getElementById('chart-filter').addEventListener('change', function(e) {
        // In a real app, you would fetch new data based on the filter
        console.log('Filter changed to:', e.target.value);
        // attendanceChart.update();
    });
});
</script>
<?php include "include/footer.php" ?>