<?php
include "include/header.php";

// Initialize variables
$attendanceData = [];
$weeklyTrend = ['labels' => [], 'values' => []];
$summary = ['total_present' => 0, 'total_absent' => 0, 'total_activities' => 0, 'avg_attendance_rate' => 0];
$topDepartment = ['department' => 'N/A', 'attendance_rate' => 0];
$departments = [];
$activityTypes = [];


?>

<head>
    <link rel="stylesheet" href="css/reports.css">      
</head>

<div class="page-header">
    <h2>Attendance Reports</h2>
    <div class="header-actions">
        <button class="btn-secondary" onclick="exportToCSV()">
            <i class="fas fa-download"></i> Export CSV
        </button>
        <button class="btn-primary" onclick="generateReport()">
            <i class="fas fa-chart-bar"></i> Generate Report
        </button>
        <button class="btn-tertiary" onclick="toggleChart()" id="chartToggleBtn">
            <i class="fas fa-chart-line"></i> Show Chart
        </button>
    </div>
</div>

<div class="report-filters" id="report-filters">
    
   
 
</div> 

<div class="report-summary">
    <div class="summary-card">
        <h4>Total Present</h4>
        <h3 id="totalPresent">0</h3>
        <span class="trend positive">+12%</span>
    </div>
    <div class="summary-card">
        <h4>Average Attendance</h4>
        <h3 id="avgAttendance">0%</h3>
        <span class="trend positive">+5%</span>
    </div>
    <div class="summary-card">
        <h4>Top Department</h4>
        <h3 id="topDepartment">N/A</h3>
        <span id="topDepartmentRate">0% attendance</span>
    </div>
    <div class="summary-card">
        <h4>Total Activity/Event</h4>
        <h3 id="totalCategory">N/A</h3>
        <span id="totalCategoryNo">0</span>
    </div>
</div>

<!-- Chart Container - Modal Overlay -->
<div class="chart-modal-overlay" id="chartModal" style="display: none;">
    <div class="chart-modal">
        <div class="chart-header">
            <h3>Weekly Attendance Trend</h3>
            <button class="btn-close" onclick="toggleChart()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <canvas id="attendanceChart" height="300"></canvas>
    </div>
</div>

<div class="table-container" id='table-container'>
    
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
   
</script>


<script src="js/report/report.js"></script>

<?php include "include/footer.php"; ?>