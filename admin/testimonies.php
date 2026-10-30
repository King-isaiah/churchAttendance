<?php
include "include/header.php";
?>
<head>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/members.css"> <!-- Reusing table styles -->
</head>

<div class="page-header">
    <h2>Testimony Management</h2>
</div>

<!-- Stats Grid -->
<div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
    <div class="stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
        <h3 style="font-size: 2rem; color: #0d6efd;" id="statTotal">0</h3>
        <p style="color: #6c757d;">Total Testimonies</p>
    </div>
    <div class="stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
        <h3 style="font-size: 2rem; color: #28a745;" id="statWeekly">0</h3>
        <p style="color: #6c757d;">This Week</p>
    </div>
    <div class="stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
        <h3 style="font-size: 2rem; color: #ffc107;" id="statMonthly">0</h3>
        <p style="color: #6c757d;">This Month</p>
    </div>
    <div class="stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center;">
        <h3 style="font-size: 2rem; color: #dc3545;" id="statRatio">0%</h3>
        <p style="color: #6c757d;">Member Participation</p>
    </div>
</div>

<div class="search-bar" style="margin-bottom: 20px;">
    <select id="statusFilter" class="form-control" style="padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
        <option value="all">All Testimonies</option>
        <option value="pending">Pending Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
    </select>
</div>

<div class="table-container">
    <table class="data-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Title</th>
                <th>Content</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="testimonyTableBody">
            <tr><td colspan="6" style="text-align: center;">Loading...</td></tr>
        </tbody>
    </table>
</div>

<script src="js/admin_testimonies.js"></script>
<?php include "include/footer.php"; ?>