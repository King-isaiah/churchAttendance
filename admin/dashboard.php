<?php 
    include "include/header.php" ;
    $weeklyData = [65, 59, 80, 81, 56, 55, 72];
    $activities = [
        ['name' => 'Sunday Service', 'attendance' => 150, 'date' => '2023-06-18'],
        ['name' => 'Bible Study', 'attendance' => 45, 'date' => '2023-06-15'],
        ['name' => 'Youth Group', 'attendance' => 35, 'date' => '2023-06-16']
    ];
    $departments = [
        ['name' => 'Hub Ushering', 'totalNum' => 150, 'date' => '2023-06-18'],
        ['name' => 'Hub Theaatre', 'totalNum' => 45, 'date' => '2023-06-15'],
        ['name' => 'Choir', 'totalNum' => 35, 'date' => '2023-06-16']
    ];
?>

    <head>
    <link rel="stylesheet" href="css/dashboard.css">
     
    </head>
    
            <div class="text-nav">
                <h3>Attendance Dashboard</h3>
                <div>
                    <input type="text" placeholder="🔍 Search activities"> 
                    <img src="images/test.jpg" alt="">
                </div>
            </div>
            <div class="charts">
                <div class="progress-chart">
                    
                    <div class="btn">
                        <h4>Weekly Progress</h4>  
                        <a href="activities.php" class="activity-link-button"> Activities ⬇️</a>
                    </div>
                    
                    <div class="chart-header">
                        <h4 id="chartTitle">Weeklly Attendance</h4>
                        <select id="chart-filter">
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                        </select>
                    </div>
                        
                    <canvas id="attendanceChart"></canvas>
                        
                    <div class="depting" id="activitiesSlider">
                        

                        <button class="slider__btn slider__btn--left">&larr;</button>
                        <button class="slider__btn slider__btn--right">&rarr;</button>
                        <div  id ="sliderDots"></div>
                    </div>
                        
                    
                </div>
                <div class="slider-chart" id="departmentsContainer">
                    <?php foreach($departments as $index => $department): ?>
                        <div class="sunschl" id="section--<?php echo $index + 1; ?>">
                            <div>
                                <h4><?php echo htmlspecialchars($department['name']); ?></h4>
                                <h6><?php echo date('M j, Y', strtotime($department['date'])); ?></p>
                                <h6><?php echo htmlspecialchars($department['totalNum']); ?> Members</h6>
                            </div>
                        </div>
                    <?php endforeach; ?>
                    
                </div>
            </div>
            
            <div class="stats-cards" id = "statsCards">
                
            </div>
        </div>
    </div>
    <div class="last" >
        <div class="last-text">
            <h5>📆 Attendance Report</h5>
            <a href="reports.php">View all</a>
        </div>
        <div class="btn-group">
            <button class="btn-active">Attendance </button>
            <button>Online</button>
        </div>
        <div class="rewards-container" id='rewardsContainer'>
            
        </div>
    </div>
        
    </div>

<script src="js/dashboard.js"></script>
<!-- <script src="js/chart.js"></script> -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    
</script>



    <?php include "include/footer.php" ?>
