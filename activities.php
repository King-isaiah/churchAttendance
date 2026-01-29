<?php 
include "include/header.php";

// Simulated data - in a real app, this would come from your database
$activities = [
    [
        'id' => 1,
        'name' => 'Sunday Service',
        'description' => 'Weekly worship service',
        'category' => 'Worship',
        'date' => '2023-06-25',
        'time' => '10:00',
        'location' => 'Main Hall',
        'attendance_method' => 'qr_code',
        'status' => 'active',
        'attendance_count' => 150,
        'expected_count' => 200,
        'target_audience' => 'all'
    ],
    [
        'id' => 2,
        'name' => 'Youth Bible Study',
        'description' => 'Bible study for youth members',
        'category' => 'Education',
        'date' => '2023-06-23',
        'time' => '18:00',
        'location' => 'Youth Room',
        'attendance_method' => 'numeric_code',
        'status' => 'completed',
        'attendance_count' => 35,
        'expected_count' => 40,
        'target_audience' => 'youth'
    ],
    [
        'id' => 3,
        'name' => 'Prayer Meeting',
        'description' => 'Weekly prayer gathering',
        'category' => 'Spiritual',
        'date' => '2023-06-21',
        'time' => '19:00',
        'location' => 'Chapel',
        'attendance_method' => 'location',
        'status' => 'completed',
        'attendance_count' => 25,
        'expected_count' => 30,
        'target_audience' => 'all'
    ]
];

$categories = ['All', 'Worship', 'Education', 'Social', 'Spiritual', 'Volunteer'];
$statuses = ['All', 'Active', 'Upcoming', 'Completed', 'Cancelled'];
?>
        
<div class="center-div">
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
                    <?php if($category != 'All'): ?>
                    <option value="<?php echo strtolower($category); ?>"><?php echo $category; ?></option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div class="filter-group">
            <select id="statusFilter">
                <option value="all">All Statuses</option>
                <?php foreach($statuses as $status): ?>
                    <?php if($status != 'All'): ?>
                    <option value="<?php echo strtolower($status); ?>"><?php echo $status; ?></option>
                    <?php endif; ?>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div class="filter-group">
            <input type="date" id="dateFilter">
        </div>
    </div>
    
    <div class="activities-container">
        <div class="activities-list">
            <div class="list-header">
                <h3>Activities</h3>
                <span class="result-count"><?php echo count($activities); ?> results</span>
            </div>
            
            <div class="activities-items">
                <?php foreach($activities as $activity): ?>
                <div class="activity-card" data-status="<?php echo $activity['status']; ?>" 
                     data-category="<?php echo strtolower($activity['category']); ?>">
                    <div class="activity-card-header">
                        <h4><?php echo $activity['name']; ?></h4>
                        <span class="status-badge status-<?php echo $activity['status']; ?>">
                            <?php echo ucfirst($activity['status']); ?>
                        </span>
                    </div>
                    
                    <div class="activity-card-body">
                        <div class="activity-info">
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <span><?php echo date('M j, Y', strtotime($activity['date'])); ?> at <?php echo $activity['time']; ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span><?php echo $activity['location']; ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-tag"></i>
                                <span><?php echo $activity['category']; ?></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-users"></i>
                                <span><?php echo $activity['attendance_count']; ?> / <?php echo $activity['expected_count']; ?> attendees</span>
                            </div>
                        </div>
                        
                        <div class="activity-actions">
                            <?php if($activity['status'] == 'active'): ?>
                            <button class="btn-sm btn-primary live-session-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-play-circle"></i> Live Session
                            </button>
                            <?php endif; ?>
                            
                            <button class="btn-sm btn-secondary view-details-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            
                            <button class="btn-sm btn-edit edit-activity-btn" data-id="<?php echo $activity['id']; ?>">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <div class="activities-sidebar">
            <div class="sidebar-section">
                <h4>Quick Stats</h4>
                <div class="stats-summary">
                    <div class="stat-item">
                        <span class="stat-value">12</span>
                        <span class="stat-label">This Week</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">45</span>
                        <span class="stat-label">This Month</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">78%</span>
                        <span class="stat-label">Avg. Attendance</span>
                    </div>
                </div>
            </div>
            
            <div class="sidebar-section">
                <h4>Categories Distribution</h4>
                <canvas id="categoriesChart" width="300" height="200"></canvas>
            </div>
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
                    <label for="activityName">Activity Name</label>
                    <input type="text" id="activityName" required>
                </div>
                
                <div class="form-group">
                    <label for="activityDescription">Description</label>
                    <textarea id="activityDescription" rows="3"></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="activityCategory">Category</label>
                        <select id="activityCategory" required>
                            <option value="">Select Category</option>
                            <?php foreach($categories as $category): ?>
                                <?php if($category != 'All'): ?>
                                <option value="<?php echo strtolower($category); ?>"><?php echo $category; ?></option>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="activityAudience">Target Audience</label>
                        <select id="activityAudience" required>
                            <option value="all">All Members</option>
                            <option value="youth">Youth Only</option>
                            <option value="adults">Adults Only</option>
                            <option value="children">Children Only</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="activityDate">Date</label>
                        <input type="date" id="activityDate" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="activityTime">Time</label>
                        <input type="time" id="activityTime" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="activityLocation">Location</label>
                    <input type="text" id="activityLocation" required>
                </div>
                
                <div class="form-group">
                    <label for="attendanceMethod">Attendance Method</label>
                    <select id="attendanceMethod" required>
                        <option value="qr_code">QR Code</option>
                        <option value="numeric_code">Numeric Code</option>
                        <option value="location">Location Check-in</option>
                        <option value="nfc">NFC/RFID Tap</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="expectedAttendance">Expected Attendance</label>
                    <input type="number" id="expectedAttendance" min="1" required>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="submit" class="btn-primary">Create Activity</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Categories chart
        const categoriesCtx = document.getElementById('categoriesChart').getContext('2d');
        const categoriesChart = new Chart(categoriesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Worship', 'Education', 'Social', 'Spiritual', 'Volunteer'],
                datasets: [{
                    data: [40, 25, 15, 12, 8],
                    backgroundColor: [
                        '#8786E3',
                        '#FF9F40',
                        '#36A2EB',
                        '#4BC0C0',
                        '#FF6384'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Modal functionality
        const modal = document.getElementById('createActivityModal');
        const createBtn = document.getElementById('createActivityBtn');
        const closeBtns = document.querySelectorAll('.close-modal');
        
        createBtn.addEventListener('click', function() {
            modal.style.display = 'block';
        });
        
        closeBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Form submission
        document.getElementById('activityForm').addEventListener('submit', function(e) {
            e.preventDefault();
            // In a real app, you would send this data to the server
            alert('Activity created successfully!');
            modal.style.display = 'none';
        });
        
        // Filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('activitySearch');
        const dateFilter = document.getElementById('dateFilter');
        const activityCards = document.querySelectorAll('.activity-card');
        const resultCount = document.querySelector('.result-count');
        
        function filterActivities() {
            const categoryValue = categoryFilter.value;
            const statusValue = statusFilter.value;
            const searchValue = searchInput.value.toLowerCase();
            const dateValue = dateFilter.value;
            
            let visibleCount = 0;
            
            activityCards.forEach(function(card) {
                const matchesCategory = categoryValue === 'all' || card.dataset.category === categoryValue;
                const matchesStatus = statusValue === 'all' || card.dataset.status === statusValue;
                const matchesSearch = card.querySelector('h4').textContent.toLowerCase().includes(searchValue);
                
                // For date filtering, you would need to store the date in a data attribute
                let matchesDate = true;
                if (dateValue) {
                    // This would need to be implemented based on your data structure
                }
                
                if (matchesCategory && matchesStatus && matchesSearch && matchesDate) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            resultCount.textContent = visibleCount + ' results';
        }
        
        categoryFilter.addEventListener('change', filterActivities);
        statusFilter.addEventListener('change', filterActivities);
        searchInput.addEventListener('input', filterActivities);
        dateFilter.addEventListener('change', filterActivities);
        
        // View details buttons
        document.querySelectorAll('.view-details-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const activityId = this.dataset.id;
                // In a real app, this would navigate to the activity details page
                alert('Viewing details for activity ID: ' + activityId);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.edit-activity-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const activityId = this.dataset.id;
                // In a real app, this would open an edit modal
                alert('Editing activity ID: ' + activityId);
            });
        });
        
        // Live session buttons
        document.querySelectorAll('.live-session-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const activityId = this.dataset.id;
                // In a real app, this would open the live session dashboard
                alert('Starting live session for activity ID: ' + activityId);
            });
        });
    });
</script>

<style>
/* Activities Page Styles */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.btn-primary {
    background: #8786E3;
    color: white;
    border: none;
    padding: 0.7rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.filters-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.search-box {
    flex: 1;
}

.search-box input {
    width: 100%;
    padding: 0.7rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.filter-group select, .filter-group input {
    padding: 0.7rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
}

.activities-container {
    display: flex;
    gap: 1.5rem;
}

.activities-list {
    flex: 1;
}

.activities-sidebar {
    width: 300px;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.list-header h3 {
    margin: 0;
}

.result-count {
    color: #718096;
    font-size: 0.9rem;
}

.activities-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.activity-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.activity-card-header h4 {
    margin: 0;
}

.status-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-active {
    background: #c6f6d5;
    color: #22543d;
}

.status-completed {
    background: #e9d8fd;
    color: #44337a;
}

.status-upcoming {
    background: #fed7d7;
    color: #822727;
}

.activity-card-body {
    display: flex;
    justify-content: space-between;
}

.activity-info {
    flex: 1;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.info-item i {
    width: 16px;
    color: #718096;
}

.activity-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.btn-sm {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
}

.btn-edit {
    background: #faf089;
    color: #744210;
}

.sidebar-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.sidebar-section h4 {
    margin: 0 0 1rem 0;
}

.stats-summary {
    display: flex;
    justify-content: space-around;
}

.stat-item {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: #8786E3;
}

.stat-label {
    font-size: 0.8rem;
    color: #718096;
}

/* Modal Styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    width: 90%;
    max-width: 600px;
    border-radius: 12px;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
    margin: 0;
}

.close-modal {
    font-size: 1.5rem;
    cursor: pointer;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-group {
    flex: 1;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 0.7rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

/* Responsive Design */
@media (max-width: 1000px) {
    .activities-container {
        flex-direction: column;
    }
    
    .activities-sidebar {
        width: 100%;
    }
    
    .stats-summary {
        justify-content: space-between;
    }
}

@media (max-width: 800px) {
    .filters-bar {
        flex-direction: column;
    }
    
    .activity-card-body {
        flex-direction: column;
        gap: 1rem;
    }
    
    .activity-actions {
        flex-direction: row;
        flex-wrap: wrap;
    }
    
    .form-row {
        flex-direction: column;
        gap: 0;
    }
}
</style>
<?php include "include/footer.php" ?>