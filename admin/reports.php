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
        <!-- Changed onclick to viewFullReport() -->
        <button class="btn-secondary" style="background-color:brown" onclick="viewFullReport()">
            <i class="fas fa-expand"></i> View Report In Full
        </button>
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

<!-- Shared Filters (outside both containers) -->
<div class="report-filters" id="report-filters"></div>

<!-- MAIN CONTENT (visible by default) -->
<div id="reportMainContent">
    <div class="report-summary">
        <div class="summary-card">
            <h4>Total Attendance</h4>
            <h3 id="totalRecord">0</h3>            
            <span class="trend positive">+12%</span>
        </div>
        <div class="summary-card">
            <h4>Total Present</h4>
            <h3 id="totalPresent">0</h3>
            <span class="trend positive" id="presentPercentage">0%</span>
            <!-- <span class="trend positive">+5%</span> -->
        </div>
        <div class="summary-card">
            <h4>Total Late</h4>
            <h3 id="totalLate">0</h3> 
            <span class="trend positive" id="latePercentage">0%</span>
            <!-- <span >+12%</span> -->
        </div>
        <div class="summary-card">
            <h4>Top Department</h4>
            <h3 id="topDepartment">N/A</h3>
            <span id="topDepartmentRate">0% attendance</span>
        </div>
        
        <!-- <div class="summary-card">
            <h4>Total Members</h4>
            <h3 id="totalMembers">0</h3>
            <span class="trend positive">+0%</span>
        </div> -->


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

    <!-- Main Table Container (paginated) -->
    <div class="table-container" id='table-container'></div>
</div>

<!-- FULL REPORT CONTENT (hidden by default) -->
<div id="fullReportContent" style="display: none;">
    <div class="full-report-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Full Attendance Report</h2>
        <button class="btn-secondary" onclick="backToReport()">
            <i class="fas fa-arrow-left"></i> Back to Report
        </button>
    </div>
    <!-- Full table container (no pagination) -->
    <div class="table-container" id="fullTableContainer">
        <!-- Table will be rendered by JavaScript -->
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="js/report/report.js"></script>

<?php include "include/footer.php"; ?>