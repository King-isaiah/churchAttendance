<?php include "include/header.php" ?>

        <head>
        <link rel="stylesheet" href="css/dashboard.css">
        </head>
        <div class="center-div">
            <div class="top-nav">
                <h6 style="color: greenyellow;">Hub Church</h6>
                <div class="text-nav">
                    <h3>Attendance Dashboard</h3>
                    <div>
                        <input type="text" placeholder="🔍 Search activities"> <img src="images/test.jpg" alt="">
                    </div>
                </div>
                <div class="charts">
                    <div class="progress-chart">
                        <div class="chart-text">
                            <div class="btn" style=" color:white; display:flex; justify-content:space-between">
                                <h4>Weekly Progress</h4>  
                                <a href="activities.php" class="activity-link-button"> Activities ⬇️</a>
                            </div>
                            
                            <div class="chart-header">
                                <h4>Weekly Attendance</h4>
                                <select id="chart-filter">
                                    <option value="week">This Week</option>
                                    <option value="month">This Month</option>
                                    <option value="quarter">This Quarter</option>
                                </select>
                            </div>
                               
                            
                           
                            <canvas id="myChart" width="500" height="300"></canvas>
                            <div class="depting">
                                <div class="graph-info  slide" id="section--1"></div>
                                <div class="graph-info  slide" id="section--1">yes</div>
                                <div class="graph-info  slide" id="section--1"></div>
                                <button class="slider__btn slider__btn--left">&larr;</button>
                                <button class="slider__btn slider__btn--right">&rarr;</button>
                                <div class="dots"></div>
                            </div>
                            
                        </div>
                    </div>
                    <div class="slider-chart">
                        <div class="sunschl"></div>
                        <div class="sunschl" style="margin-top: 1em;"></div>
                    </div>
                </div>
                <!-- <div class="dept-attendance">
                    <div class="dept">
                         <div class="stat-icon" style="background: #c1bff2;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h4>245</h4>
                            <p>Total Attendees</p>
                        </div>
                    </div>
                    <div class="dept">
                         <div class="stat-icon" style="background: #ffb2b2;">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-info">
                            <h4>12</h4>
                            <p>Activities This Week</p>
                        </div>
                    </div>
                    <div class="dept">
                        <div class="stat-icon" style="background: #c9e78a;">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h4>+15%</h4>
                            <p>Growth</p>
                        </div>
                    </div>
                </div> -->
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
            </div>
        </div>
        <div class="last">
    <div class="last-text">
        <h5>📆 Attendance Rewards</h5>
        <a href="#">View all</a>
    </div>
    <div class="btn-group">
        <button class="btn-active">Activities </button>
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
        
    </div>
    
    <script src="js/dashboard.js"></script>
    <script src="js/chart.js"></script>
    <!-- <script src="js/nav.js"></script>
</body>
</html> -->


    <?php include "include/footer.php" ?>
