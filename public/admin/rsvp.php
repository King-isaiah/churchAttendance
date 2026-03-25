<?php
    include "include/footer.php"; 
    require_once 'class/Event.php';
    require_once 'class/RSVP.php';

    $event = new Event();
    $rsvp = new RSVP();

    // Get event ID from query parameter
    $eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : 0;

    if ($eventId <= 0) {
        header('Location: events.php');
        exit();
    }

    // Initialize variables with defaults
    $error = null;
    $eventDetails = null;
    $rsvpResponses = [];
    $responseStats = ['total' => 0, 'yes' => 0, 'no' => 0, 'maybe' => 0, 'pending' => 0];
    $attendanceRate = 0;
    $allUsers = [];

    try {
        // Get event details
        $eventDetails = $event->getEvent($eventId);
        if (!$eventDetails) {
            throw new Exception("Event not found in database!");
        }       
   
        // Get RSVP responses
        $rsvpResponses = $rsvp->getRSVPByEvent($eventId);
        
       
        
        if (empty($rsvpResponses)) {
            echo "<p style='color: #856404;'><strong>⚠️ No RSVP records found for this event.</strong></p>";
        } 
        echo "</div>";
        
        // Process RSVP data based on YOUR table structure
        if (is_array($rsvpResponses) && !empty($rsvpResponses)) {
            foreach ($rsvpResponses as $index => $response) {
                // Convert numeric attending to text based on YOUR rules:
                // 1 = yes, 2 = maybe, 3 = no
                $attendingValue = $response['attending'] ?? 0;
                
                switch ($attendingValue) {
                    case 1:
                        $responseStats['yes']++;
                        $responseType = 'yes';
                        break;
                    case 3:
                        $responseStats['maybe']++;
                        $responseType = 'maybe';
                        break;
                    case 2:
                        $responseStats['no']++;
                        $responseType = 'no';
                        break;
                    default:
                        $responseStats['pending']++;
                        $responseType = 'pending';
                }
                
                // Store for display (optional)
                $allUsers[] = [
                    'id' => $response['id'] ?? $index,
                    'unique_id' => $response['unique_id'] ?? 'N/A',
                    'attending' => $attendingValue,
                    'response' => $responseType,
                    'guest_count' => $response['guest_count'] ?? 0,
                    'notes' => $response['notes'] ?? '',
                    'created_at' => $response['created_at'] ?? 'N/A'
                ];
            }
            
            $responseStats['total'] = count($rsvpResponses);
            
            // Calculate attendance rate
            if ($responseStats['total'] > 0) {
                $attendanceRate = round(($responseStats['yes'] / $responseStats['total']) * 100, 1);
            }
            
            echo "<div class='debug-info' style='background: #cce5ff; padding: 10px; margin: 10px 0; border: 1px solid #b8daff;'>
                    <strong>✓ Statistics Calculated:</strong>
                    <p>Total: {$responseStats['total']} | 
                    Yes: {$responseStats['yes']} | 
                    No: {$responseStats['no']} | 
                    Maybe: {$responseStats['maybe']} | 
                    Pending: {$responseStats['pending']}</p>
                   
                </div>";
                
        } 
        
    } catch (Exception $e) {
        $error = $e->getMessage();
        echo "<div class='error-message' style='background: #f8d7da; color: #721c24; padding: 15px; margin: 10px 0; border: 1px solid #f5c6cb; border-radius: 4px;'>
                <strong>❌ ERROR:</strong> " . htmlspecialchars($error) . "
            </div>";
       
    }

$trendPeriod = isset($_GET['trend_period']) ? (int)$_GET['trend_period'] : 7;
$trendData = $rsvp->getRSVPTrendByEvent($eventId, $trendPeriod);

// Prepare data for the chart
$trendDates = [];
$trendTotals = [];
$trendAttending = [];
$trendNotAttending = [];
$trendMaybe = [];

foreach ($trendData as $day) {
    $trendDates[] = $day['day_name']; // Mon, Tue, etc.
    $trendTotals[] = $day['total'];
    $trendAttending[] = $day['attending'];
    $trendNotAttending[] = $day['not_attending'];
    $trendMaybe[] = $day['maybe'];
}

// If no trend data, create empty arrays for chart
if (empty($trendData)) {
    // Generate dates for the selected period, not just 7 days
    for ($i = $trendPeriod - 1; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $trendDates[] = date('D', strtotime($date));
        $trendTotals[] = 0;
        $trendAttending[] = 0;
        $trendNotAttending[] = 0;
        $trendMaybe[] = 0;
    }
}

// Debug: Check what data you're getting
error_log("Trend Data: " . print_r($trendData, true));
error_log("Trend Dates: " . print_r($trendDates, true));
error_log("Trend Totals: " . print_r($trendTotals, true));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RSVP Responses - <?php echo htmlspecialchars($eventDetails['title'] ?? 'Event'); ?></title>
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
                    <h1 class="event-title"><?php echo htmlspecialchars($eventDetails['title'] ?? 'Event'); ?></h1>
                    <div class="event-meta">
                        <span class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <?php echo date('F j, Y', strtotime($eventDetails['event_date'] ?? '')); ?>
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-clock"></i>
                            <?php echo date('g:i A', strtotime($eventDetails['event_time'] ?? '')); ?>
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <?php echo htmlspecialchars($eventDetails['location_name'] ?? 'No Location'); ?>
                        </span>
                    </div>
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

        <?php if (isset($error)): ?>
            <div style="background: #f8d7da; color: #721c24; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #f5c6cb;">
                <i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?>
            </div>
        <?php endif; ?>

        <!-- Quick Stats -->
        <div class="quick-stats-container">
            <div class="quick-stats-grid">
                <div class="quick-stat-card">
                    <div class="quick-stat-icon attending">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <div class="quick-stat-value"><?php echo $responseStats['yes']; ?></div>
                        <div class="quick-stat-label">Attending</div>
                    </div>
                </div>
                
                <div class="quick-stat-card">
                    <div class="quick-stat-icon maybe">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <div>
                        <div class="quick-stat-value"><?php echo $responseStats['maybe']; ?></div>
                        <div class="quick-stat-label">Maybe</div>
                    </div>
                </div>
                
                <div class="quick-stat-card">
                    <div class="quick-stat-icon not-attending">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div>
                        <div class="quick-stat-value"><?php echo $responseStats['no']; ?></div>
                        <div class="quick-stat-label">Not Attending</div>
                    </div>
                </div>
                
                <div class="quick-stat-card">
                    <div class="quick-stat-icon total">
                        <i class="fas fa-users"></i>
                    </div>
                    <div>
                        <div class="quick-stat-value"><?php echo $responseStats['total']; ?></div>
                        <div class="quick-stat-label">Total Responses</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="charts-section">
            <h2 class="section-title">Response Analytics</h2>
            <div class="charts-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Response Distribution</h3>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="responseChart"></canvas>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3>Response Trend</h3>
                        
                        <select class="responsive-filter" id="trendPeriod" onchange="updateTrendChart()">
                            <option value="7" <?php echo $trendPeriod == 7 ? 'selected' : ''; ?>>Last 7 Days</option>
                            <option value="14" <?php echo $trendPeriod == 14 ? 'selected' : ''; ?>>Last 14 Days</option>
                            <option value="30" <?php echo $trendPeriod == 30 ? 'selected' : ''; ?>>Last 30 Days</option>
                        </select>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="trendChart"></canvas>
                    </div>
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
                        <input type="text" id="rsvpSearch" placeholder="Search responses..." oninput="filterResponses()">
                    </div>
                    <select id="responseFilter" class="responsive-filter" onchange="filterResponses()">
                        <option value="all">All Responses</option>
                        <option value="yes">Attending</option>
                        <option value="no">Not Attending</option>
                        <option value="maybe">Maybe</option>
                    </select>
                </div>
            </div>

            <!-- Mobile View -->
            <div class="mobile-responses" id="mobileResponses">
                <?php if (empty($rsvpResponses)): ?>
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <h3>No Responses Yet</h3>
                        <p>No one has responded to this event yet.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($rsvpResponses as $index => $response): ?>
                        <div class="response-card" data-response="<?php echo strtolower($response['response']); ?>">
                            <div class="response-card-header">
                                <div class="user-avatar-large" style="background-color: <?php echo '#4CAF50'; ?>">
                                    <?php echo 'U' . ($index + 1); ?>
                                </div>
                                <div class="response-card-title">
                                    <h4>User <?php echo $response['unique_id']; ?></h4>
                                    <p><?php echo $response['email'] ?? 'No email'; ?></p>
                                </div>
                                <span class="badge-mobile badge-<?php echo strtolower($response['response']); ?>">
                                    <?php echo ucfirst($response['response']); ?>
                                </span>
                            </div>
                            <div class="response-card-body">
                                <?php if (!empty($response['comment'])): ?>
                                    <div class="response-comment">
                                        <i class="fas fa-comment"></i>
                                        <p><?php echo htmlspecialchars(substr($response['comment'], 0, 100) . (strlen($response['comment']) > 100 ? '...' : '')); ?></p>
                                    </div>
                                <?php endif; ?>
                                <div class="response-meta">
                                    <i class="fas fa-clock"></i>
                                    <?php echo !empty($response['response_date']) 
                                        ? date('M j, g:i A', strtotime($response['response_date'])) 
                                        : 'Not responded'; ?>
                                </div>
                            </div>
                            <div class="response-card-actions">
                                <button class="action-btn btn-view" onclick="viewResponseDetails(<?php echo $response['id']; ?>)">
                                    <i class="fas fa-eye"></i>
                                    <span>View</span>
                                </button>
                                <button class="action-btn btn-email" onclick="contactUser('<?php echo $response['email'] ?? ''; ?>')">
                                    <i class="fas fa-envelope"></i>
                                    <span>Email</span>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <!-- Desktop View -->           
            
            <div class="desktop-table-container">
                <table class="responsive-table" id="rsvpTable">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Response</th>
                            <th>Comment</th>
                            <th>Users Name</th>
                            <th>Full Name</th>
                            <th>Response Date</th>                            
                            <th>Guest Count</th>
                        </tr>
                    </thead>
                    <tbody id="rsvpTableBody">
                        <!-- This will be populated by JavaScript -->
                    </tbody>
                </table>
                
                <!-- Add pagination controls -->
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
                <i class="fas fa-download"></i>
                <span>Export Data</span>
            </button>
            <button class="fab-menu-item" onclick="window.location.href='events.php'">
                <i class="fas fa-arrow-left"></i>
                <span>Back to Events</span>
            </button>
        </div>
    </div>

    <!-- View Event Details Modal -->
    <div id="viewMoreModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="viewModalTitle">Event Details</h3>
                <span class="close" onclick="closeViewEventModal()">&times;</span>
            </div>
            <div class="modal-body" id="viewEventDetails">
                <!-- Event details will be populated here -->
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeViewEventModal()">Close</button>
            </div>
        </div>
    </div>
    <script src="js/rsvp.js"></script>

  
    <script>
        // pagiintion m// RSVP Data from PHP (convert to JavaScript)
        const rsvpData = <?php echo json_encode($rsvpResponses); ?>;

        function updateTrendChart() {
            const period = document.getElementById('trendPeriod').value;
            const eventId = <?php echo $eventId; ?>;
            
            // Show loading indicator
            const chartContainer = document.getElementById('trendChart').closest('.chart-wrapper');
            const originalHTML = chartContainer.innerHTML;
            chartContainer.innerHTML = '<div class="chart-loading" style="display: flex; align-items: center; justify-content: center; height: 100%;"><i class="fas fa-spinner fa-spin"></i> Loading trend data...</div>';
            
            // Reload page with new period parameter
            setTimeout(() => {
                window.location.href = `rsvp.php?event_id=${eventId}&trend_period=${period}`;
            }, 500);
        }

      
        function initializeCharts() {
            // Response Distribution Chart
            const ctx1 = document.getElementById('responseChart').getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Attending', 'Not Attending', 'Maybe', 'No Response'],
                    datasets: [{
                        data: [
                            <?php echo $responseStats['yes']; ?>,
                            <?php echo $responseStats['no']; ?>,
                            <?php echo $responseStats['maybe']; ?>,
                            <?php echo $responseStats['pending']; ?>
                        ],
                        backgroundColor: [
                            '#28a745',
                            '#dc3545',
                            '#ffc107',
                            '#6c757d'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });

            
            const ctx2 = document.getElementById('trendChart').getContext('2d');
            window.trendChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: <?php echo json_encode($trendDates); ?>,
                    datasets: [
                        {
                            label: 'Total Responses',
                            data: <?php echo json_encode($trendTotals); ?>,
                            borderColor: '#0d6efd',
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#0d6efd',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Attending',
                            data: <?php echo json_encode($trendAttending); ?>,
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            borderDash: [5, 5],
                            pointRadius: 4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Not Attending',
                            data: <?php echo json_encode($trendNotAttending); ?>,
                            borderColor: '#dc3545',
                            backgroundColor: 'rgba(220, 53, 69, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            borderDash: [3, 3],
                            pointRadius: 4,
                            yAxisID: 'y'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                font: {
                                    size: 12
                                },
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.parsed.y;
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            },
                            title: {
                                display: true,
                                text: 'Number of Responses'
                            },
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                    return '';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

    </script>
</body>
</html>
