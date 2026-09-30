<?php 
include "include/header.php";
include "class/Category.php";
include "class/Activity.php";
include "class/Status.php";
include "class/Location.php";
include "class/Department.php";
include "class/AttendanceMethod.php";


$activity = new Activity();
$categorys = new Category();
$status = new Status();
$location = new Location();
$department = new Department();
$attendanceMethod = new AttendanceMethod();

$activities = $activity->getAllActivities();
$day = $activity->getDaysOfTheWeek();
$categories = $categorys->getAllCategory();
$locations = $location->getAllLocations();
$departments = $department->getAllDepartments();
$statuses = $status->getAllStatuses();
$attendanceMethods = $attendanceMethod->getAllAttendanceMethods();
    


// Calculate active count for stats
$activeCount = 0;
foreach ($activities as $activityItem) {
    if (isset($activityItem['status']) && $activityItem['status'] === 'Active') {
        $activeCount++;
    }
}
?>

<div class="page-header">
    <h2>Activity Management</h2>
    <button class="btn-primary" id="createActivityBtn">
        <i class="fas fa-plus"></i> Create New Activity
    </button>
</div>

<div class="filters-bar">
    <div class="search-box">
        <input type="text" placeholder="Search activities..." id="activitySearch">
    </div>
    
    <div class="filter-group">
        <select id="categoryFilter">
            <option value="all">All Categories</option>
            <?php foreach($categories as $category): ?>
                <?php 
                // Get the category name from the array
                $categoryName = $category['categories'] ?? $category['name'] ?? $category;
                if($categoryName != 'All'): 
                ?>
                <option value="<?php echo strtolower($categoryName); ?>"><?php echo $categoryName; ?></option>
                <?php endif; ?>
            <?php endforeach; ?>
        </select>
    </div>
    
    
    <div class="filter-group">
        <select id="statusFilter">
            <option value="all">All Statuses</option>
            <?php foreach($statuses as $statusItem): ?>
                <option value="<?php echo $statusItem['name']; ?>"><?php echo $statusItem['name']; ?></option>
            <?php endforeach; ?>
        </select>
    </div>
    <div class="filter-group">
        <!-- <select id="dateFilter">
            <option value="all">All Days</option>
            <?php foreach($day as $days): ?>
                <option value="<?php echo $days['dayofactivity']; ?>"><?php echo $days['dayofactivity']; ?></option>
            <?php endforeach; ?>
        </select> -->
        <input type="date" id="dateFilter">
    </div>
   
</div>

<div class="activities-container">
    <div class="activities-list">
        <div class="list-header">
            <h3>Activities</h3>
            <span class="result-count" id="carouselInfo">
                Showing <span id="currentActivityCount">1</span> of <span id="totalActivityCount"><?php echo count($activities); ?></span> activities
                <br>
                <span class="result-count"><span id="filteredCount"><?php echo count($activities); ?></span> results</span>
            </span>
        </div>
        
        <div class="activities-carousel-container">
            <div class="activities-items" id="activitiesCarousel">
                <?php foreach($activities as $index => $activity): ?>
                <div class="activity-card <?php echo $index === 0 ? 'Active' : ''; ?>" 
                    data-id="<?php echo $activity['id']; ?>"
                    data-status="<?php echo $activity['status']; ?>" 
                    data-category="<?php echo strtolower($activity['category']); ?>"
                
                    data-day="<?php echo $activity['dayofactivity'] ?? ''; ?>"
                    data-search="<?php echo htmlspecialchars(strtolower($activity['name'] . ' ' . $activity['description'] . ' ' . $activity['location'])); ?>">
                    <div class="activity-card-header">
                        <h4><?php echo htmlspecialchars($activity['name']); ?></h4>
                        <span class="status-badge status-<?php echo $activity['status']; ?>" style="color: green;">
                            <?php echo ucfirst($activity['status']); ?>
                        </span>
                    </div>
                    
                    <div class="activity-card-body">
                        <div class="activity-info">
                           
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span><?php echo htmlspecialchars($activity['dayofactivity'] ?? 'Not set'); ?> at <?php echo $activity['time']; ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span><?php echo htmlspecialchars($activity['location']); ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-tag"></i>
                                <span><?php echo htmlspecialchars($activity['category']); ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-users"></i>
                                <span><?php echo $activity['expected_count'] ?? 0; ?> Expected attendees</span>
                            </div>
                        </div>
                        
                        <div class="activity-actions">
                            <?php if($activity['status'] == 'Active'): ?>
                            <button class="btn-sm btn-primary live-session-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-play-circle"></i> Live Session
                            </button>
                            <?php endif; ?>
                            <?php if($activity['code'] == 'qr_code'): ?>
                                <button class="btn-sm btn-info generate-qr-btn" data-id="<?php echo $activity['id']; ?>" 
                                     data-attendance-method="<?php echo $activity['attendance_method'] ?? ''; ?>">
                                    <i class="fas fa-qrcode"></i> Generate QR
                                </button>
                            <?php endif; ?>
                            
                            <button class="btn-sm btn-secondary view-details-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            
                            <button class="btn-sm btn-edit edit-activity-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-sm delete-activity-btn" style="background-color: #dc3545;" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <div class="activities-nav">
                <button class="nav-btn prev-btn" id="prevBtn">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                
                <div class="nav-dots" id="navDots">
                    <!-- Dots will be generated by JavaScript -->
                </div>
                
                <button class="nav-btn next-btn" id="nextBtn">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
                
                <span class="carousel-info" id="carouselCounter"></span>
            </div>
        </div>
    </div>
    
    <div class="activities-sidebar">
        <div class="sidebar-section">
            <h4>Quick Stats</h4>
            <div class="stats-summary">
                <div class="stat-item">
                    <span class="stat-value"><?php echo count($activities); ?></span>
                    <span class="stat-label">Total Activities</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value"><?php echo $activeCount; ?></span>
                    <span class="stat-label" >Active</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">78%</span>
                    <span class="stat-label">Avg. Attendance</span>
                </div>
            </div>
        </div>
        
        <div class="sidebar-section">
            <h4>Categories Distribution</h4>
            <h6>testing to see</h6>
            <canvas id="categoriesChart" width="300" height="200"> thestoig to see</canvas>
        </div>
    </div>
</div>

<!-- Create Activity Modal -->
<div class="modal" id="createActivityModal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Create New Activity</h3>
            <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
            <form id="activityForm">
                <div class="form-group">
                    <label for="name">Activity Name *</label>
                    <input type="text" id="name" required>
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea id="description" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="category">Category *</label>
                        <select id="category" required>
                            <option value="">Select Category</option>
                            <?php foreach($categories as $category): ?>
                                <?php 
                                $categoryId = $category['id'] ?? $category['id'] ?? $category;
                                $categoryName = $category['categories'] ?? $category['name'] ?? $category;
                                if($categoryName != 'All'): 
                                ?>
                                <option value="<?php echo $categoryId; ?>"><?php echo $categoryName; ?></option>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="status">Status *</label>
                        <select id="status_id" required>
                            <option value="">Select Status</option>
                            <?php foreach($statuses as $statusItem): ?>
                                <option value="<?php echo $statusItem['id']; ?>"><?php echo $statusItem['name']; ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    
                    
                    <div class="form-group">
                        <label for="time">Attendance Start Time *</label>
                        <input type="time" id="time" required>
                    </div>
                    <div class="form-group">
                        <label for="time_exp">Attendance Expired Time *</label>
                        <input type="time" id="time_exp" required>
                    </div>
                </div>

               
                <div class="form-row">
                    <div class="form-group">
                        <label for="dayofactivity">Day Of The Week *</label>                        
                        <select id="dayofactivity" required>
                            <option value="Sunday">Sundays</option>
                            <option value="Monday">Mondays</option>
                            <option value="Tuesday">Tuesdays</option>
                            <option value="Wednesday">Wednedays</option>
                            <option value="Thursday">Thursdays</option>
                            <option value="Friday">Fridays</option>
                            <option value="Saturday">Saturdays</option>
                        </select>                        
                    </div>
                    
                    <div class="form-group">
                        <label for="location_id">Location *</label>
                        <select id="location_id" required>
                            <option value="">Select Location</option>
                            <?php if(!empty($locations)): ?>
                                <?php foreach($locations as $location): ?>
                                    <?php 
                                    if (is_array($location)) {
                                        $locationName = $location['name'] ?? $location;
                                        $locationId = $location['id'] ?? $location;
                                    } else {
                                        $locationName = $location;
                                        $locationId = $location;
                                    }
                                    ?>
                                    <option value="<?php echo htmlspecialchars($locationId); ?>">
                                        <?php echo htmlspecialchars($locationName); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <option value="">No locations available</option>
                            <?php endif; ?>
                        </select>
                    </div>
                </div>
                
                
                
                <div class="form-row">
                    
                    <div class="form-group">
                        <label for="attendance_method_id">Attendance Method *</label>
                        <select id="attendance_method_id" required>
                            <option value="">Select Attendance Method</option>
                            <?php if(!empty($attendanceMethods)): ?>
                                <?php foreach($attendanceMethods as $method): ?>
                                    <?php 
                                    // Handle different possible data structures
                                    if (is_array($method)) {
                                        $methodCode = $method['code'] ?? $method['id'] ?? $method;
                                        $methodName = $method['name'] ?? $method;
                                        $methodId = $method['id'];
                                    } else {
                                        $methodCode = $method;
                                        $methodName = $method;
                                    }
                                    ?>
                                    <option value="<?php echo htmlspecialchars($methodId); ?>">
                                        <?php echo htmlspecialchars($methodName); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <option value="">No attendance methods available</option>
                            <?php endif; ?>
                        </select>
                    </div>
                    
                    

                   
                             
                <div class="department-selection">    
                    <div class="form-group department-field" id="originalDepartment">
                        <div class="form-group">
                            <label for="eventDepartment1">Department</label>
                            <select id="eventDepartment1" name="department_id[]" class="department-select">
                                <option value="">Select Department</option> 
                                <option value="0">All Departments</option>
                                <?php foreach ($departments as $dept): ?>
                                    <option value="<?php echo $dept['id']; ?>">
                                        <?php echo htmlspecialchars($dept['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                    </div>
                    
                    <div id="additionalDepartments"></div>
                    
                    <button type="button" id="addDepartmentBtn"  class="add-department-btn">
                        + Add Another Department
                    </button>
                    <small class="hint">Maximum 7 departments total</small>
                </div>
                </div>
                
                <div class="form-group">
                    <label for="expectedAttendance">Expected Attendance *</label>
                    <input type="number" id="expected_count" min="1" required>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn-primary">Create Activity</button>
                </div>
            </form>
        </div>
    </div>
</div>
<script>
    let departmentCounter = 1;
const maxDepartments = 7;








</script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/activity/activity.js"></script>
<script src="js/activity/qrcode.js"></script>
<script src="js/activity/chart.js"></script>
<script src="js/activity/qrajax.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

<?php include "include/footer.php" ?>