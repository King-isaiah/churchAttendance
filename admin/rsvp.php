

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RSVP Responses</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="css/rsvp.css"> 
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Mobile Navigation -->
    <div class="mobile-nav-header">
        <button class="mobile-back-btn" onclick="window.location.href='events.php'">
            <i class="fas fa-arrow-left"></i>
            <span>Back</span>
        </button>
        <div class="mobile-title">RSVP Responses</div>
        <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
            <i class="fas fa-ellipsis-v"></i>
        </button>
    </div>
   <div class="toastify-container" id="toastifyContainer"></div>

    <main class="main-content">
        <!-- Event Header -->
        <div class="event-header-container">
            <div class="event-header-content">
                <div>
                    <h1 class="event-title" id="eventTitle">Loading...</h1>
                    <div class="event-meta" id="eventMeta"></div>
                </div>
                <div class="event-header-actions">
                    <button class="btn btn-primary btn-desktop" onclick="window.location.href='events.php'">
                        <i class="fas fa-arrow-left"></i> Back to Events
                    </button>
                    <button class="btn btn-secondary btn-desktop" onclick="exportRSVPData()">
                        <i class="fas fa-download"></i> Export Data
                    </button>
                </div>
            </div>
        </div>

        <div id="errorContainer"></div>

        <!-- Quick Stats -->
        <div class="quick-stats-container">
            <div class="quick-stats-grid" id="statsGrid"></div>
        </div>

        <!-- Charts -->
        <div class="charts-section">
            <h2 class="section-title">Response Analytics</h2>
            <div class="charts-grid">
                <div class="chart-container">
                    <div class="chart-header"><h3>Response Distribution</h3></div>
                    <div class="chart-wrapper"><canvas id="responseChart"></canvas></div>
                </div>
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Response Trend</h3>
                        <select class="responsive-filter" id="trendPeriod" onchange="updateTrendChart()">
                            <option value="7">Last 7 Days</option>
                            <option value="14">Last 14 Days</option>
                            <option value="30">Last 30 Days</option>
                        </select>
                    </div>
                    <div class="chart-wrapper"><canvas id="trendChart"></canvas></div>
                </div>
            </div>
        </div>

        <!-- Responses -->
        <div class="responses-section">
            <div class="section-header">
                <h2 class="section-title">Response Details</h2>
                <div class="section-controls">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="rsvpSearch" placeholder="Search responses...">
                    </div>
                    <select id="responseFilter" class="responsive-filter">
                        <option value="all">All Responses</option>
                        <option value="attending">Attending</option>
                        <option value="not-attending">Not Attending</option>
                        <option value="maybe">Maybe</option>
                    </select>
                </div>
            </div>

            <!-- Mobile View -->
            <div class="mobile-responses" id="mobileResponses"></div>

            <!-- Desktop View -->
            <div class="desktop-table-container">
                <table class="responsive-table" id="rsvpTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Response</th>
                            <th>Comment</th>
                            <th>Full Name</th>
                            <th>Response Date</th>                            
                            <th>Guests</th>
                            <th>Actions</th> <!-- Added Actions Column -->
                        </tr>
                    </thead>
                    <tbody id="rsvpTableBody"></tbody>
                </table>
                
                <div class="pagination-container">
                    <div class="pagination-info">
                        Showing <span id="results-count">0-0</span> of <span id="total-count">0</span> responses
                    </div>
                    <div id="pagination" class="pagination"></div>
                    <div id="page-info" class="page-info"></div>
                </div>
            </div>
        </div>
    </main>

    <!-- FAB Button -->
    <div class="fab-container">
        <button class="fab-btn" onclick="toggleFABMenu()">
            <i class="fas fa-plus"></i>
        </button>
        <div class="fab-menu" id="fabMenu">
            <button class="fab-menu-item" onclick="exportRSVPData()">
                <i class="fas fa-download"></i><span>Export Data</span>
            </button>
            <button class="fab-menu-item" onclick="window.location.href='events.php'">
                <i class="fas fa-arrow-left"></i><span>Back to Events</span>
            </button>
        </div>
    </div>

    <!-- View Details Modal -->
    <div id="viewMoreModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="viewModalTitle">Response Details</h3>
                <span class="close" onclick="closeViewEventModal()">&times;</span>
            </div>
            <div class="modal-body" id="viewEventDetails"></div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeViewEventModal()">Close</button>
            </div>
        </div>
    </div>

    <!-- Custom Email Compose Modal -->
    <div id="emailModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Send Custom Email</h3>
                <span class="close" onclick="closeEmailModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="emailForm">
                    <div class="form-group">
                        <label>To:</label>
                        <input type="email" id="emailTo" readonly style="background-color: #e9ecef; cursor: not-allowed;">
                    </div>
                    <div class="form-group">
                        <label>Subject:</label>
                        <input type="text" id="emailSubject" required placeholder="Enter email subject...">
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="emailMessage" rows="5" required placeholder="Type your message here..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeEmailModal()">Cancel</button>
                        <button type="submit" class="btn-primary" id="sendEmailBtn">Send Email</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="js/rsvp.js"></script>
</body>
</html>
<?php include "include/footer.php"; ?>