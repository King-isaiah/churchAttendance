<?php include "include/header.php"; ?>

<head>
    <link rel="stylesheet" href="css/email_log.css">
</head>

<div class="page-header">
    <h2>Email Log History</h2>
    
    <!-- MOVED EXPORT AND PRINT HERE -->
    <div class="header-actions">
        <button class="btn-secondary" onclick="emailLogManager.exportCSV()">
            <i class="fas fa-file-csv"></i> Export CSV
        </button>
        <button class="btn-dark" onclick="window.print()">
            <i class="fas fa-print"></i> Print
        </button>
    </div>
</div>

<div class="email-log-container">
    <!-- Filters -->
    <div class="filters-bar">
        <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="searchInput" placeholder="Search by subject or recipient email...">
        </div>
        <div class="filter-group">
            <label>Start Date:</label>
            <input type="date" id="startDate">
        </div>
        <div class="filter-group">
            <label>End Date:</label>
            <input type="date" id="endDate">
        </div>
        <button class="btn-primary" onclick="emailLogManager.loadLogs()">Apply Filters</button>
        <button class="btn-secondary" onclick="emailLogManager.resetFilters()">Reset</button>
    </div>

    <!-- Table -->
    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date & Time</th>                  
                    <th>Recipient Name</th>
                    <th>Recipient Email</th>
                    <th>Subject</th>
                </tr>
            </thead>
            <tbody id="emailLogsTable">
                <tr><td colspan="5" style="text-align: center;">Loading logs...</td></tr>
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    <div class="pagination" id="pagination"></div>
</div>

<script src="js/email_log.js"></script>
<?php include "include/footer.php"; ?>