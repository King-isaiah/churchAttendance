<?php
    include_once "include/user_header.php";
   

    $categories = ['All', 'Worship', 'Education', 'Social', 'Spiritual'];
?>


    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activities - Hub Church</title>
        <link rel="stylesheet" href="css/user_header.css">
        <link rel="stylesheet" href="css/user_activities.css">
        <link rel="stylesheet" href="../fontawesome/css/all.min.css">
    </head>


    <!-- <div class="activities-page">
        <div class="page-header">
            <h2>Church Activities</h2>
            <p>Find and join upcoming activities</p>
        </div>

        <div class="filters-bar">
            <div class="search-box">
                <input type="text" placeholder="Search activities..." id="activitySearch">
            </div>
            
            <div class="filter-group">
                <select id="categoryFilter">
                    <option value="all">All Categories</option>
                    <?php foreach($categories as $category): ?>
                        <?php if($category != 'All'): ?>
                        <option value="<?php echo strtolower($category); ?>"><?php echo $category; ?></option>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="filter-group">
                <select id="statusFilter">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                </select>
            </div>
        </div>
        
       
        <div class="activities-grid">
            
            <div id="loading-activities" class="loading-state">
                <div class="spinner"></div>
                <p>Loading activities...</p>
            </div>

           
            <div id="activities-container">
               
            </div>

         
            <div id="no-activities" class="no-activities" style="display: none;">
                <i class="fas fa-calendar-times"></i>
                <h3>No Activities Found</h3>
                <p>There are no activities scheduled at the moment.</p>
            </div>
        </div>
    </div> -->
     

    <div class="activities-page">
    <div class="page-header">
        <h2>Church Activities</h2>
        <p>Find and join upcoming activities</p>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
        <div class="search-box">
            <input type="text" placeholder="Search activities..." id="activitySearch">
        </div>
        
        <div class="filter-group">
            <select id="categoryFilter">
                <option value="all">All Categories</option>
                <!-- Categories will be populated by JavaScript -->
            </select>
        </div>
        
        <div class="filter-group">
            <select id="statusFilter">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
            </select>
        </div>
    </div>
    
    <!-- Activities Grid -->
    <div class="activities-grid">
        <div id="loading-activities" class="loading-state">
            <div class="spinner"></div>
            <p>Loading activities...</p>
        </div>

        <div id="activities-container">
            <!-- Activities will be populated by existing renderActivities function -->
        </div>

        <div id="no-activities" class="no-activities" style="display: none;">
            <i class="fas fa-calendar-times"></i>
            <h3>No Activities Found</h3>
            <p>There are no activities scheduled at the moment.</p>
        </div>
    </div>
</div>

    <!-- Activity Details Modal -->
    <div id="activityDetailsModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Activity Details</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body" id="activityDetailsContent">
                
            </div>
        </div>
    </div>

    <!-- Numeric Code Modal -->
    <div id="numericCodeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Enter Attendance Code</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="attendanceCode">Enter the code provided:</label>
                    <input type="text" id="attendanceCode" placeholder="Enter code..." maxlength="6">
                </div>
                <div class="form-actions">
                    <button class="btn-secondary" onclick="closeNumericModal()">Cancel</button>
                    <button class="btn-primary" onclick="submitAttendanceCode()">Submit</button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/user_activities.js"></script>
    <script src="js/activityhtml.js"></script>
    <?php include_once "include/footer.php"; ?>
