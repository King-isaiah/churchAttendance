<?php 
    include "include/header.php" ;
   
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
                        
                    
                    <div class="depting">
                        <div class="depting-track" id="activitiesSlider">
                            <!-- slides injected by JS -->
                        </div>
                        <button class="slider__btn slider__btn--left" aria-label="Previous">&larr;</button>
                        <button class="slider__btn slider__btn--right" aria-label="Next">&rarr;</button>
                        <div class="slider-dots" id="sliderDots"></div>
                    </div>   
                    
                </div>
                <div class="slider-chart">
                    <div class="dept-track" id="departmentsContainer">
                        <!-- department cards injected by JS -->
                    </div>
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
            <button class="btn-active" id="tabAttendance">Attendance</button>
            <button id="tabOnline">Online</button>
        </div>
        <div class="rewards-container" id='rewardsContainer'>
            
        </div>
    </div>
        
    </div>

<script src="js/dashboard.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    
</script>



    <?php include "include/footer.php" ?>
