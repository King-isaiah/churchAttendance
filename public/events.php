<?php
include "include/header.php";
require_once 'class/Event.php';
require_once 'class/Department.php';
require_once 'class/Location.php';
require_once 'class/Category.php';

$event = new Event();
$department = new Department();
$location = new Location();
$category = new Category();

// Get current month and year for calendar
$currentMonth = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('m');
$currentYear = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

// Validate month and year
if ($currentMonth < 1 || $currentMonth > 12) {
    $currentMonth = (int)date('m');
}
if ($currentYear < 2020 || $currentYear > 2030) {
    $currentYear = (int)date('Y');
}

// Get events for the current month
try {
    $monthEvents = $event->getEventsByMonth($currentYear, $currentMonth);
    $allEvents = $event->getAllEvents();
    $departments = $department->getAllDepartments();
    $locations = $location->getAllLocations();
    $categories = $category->getAllCategory();
} catch (Exception $e) {
    $monthEvents = [];
    $allEvents = [];
    $departments = [];
    $locations = [];
    $error = $e->getMessage();
}

// Calculate calendar data
$firstDayOfMonth = date('N', strtotime("$currentYear-$currentMonth-01"));
$daysInMonth = date('t', strtotime("$currentYear-$currentMonth-01"));
$prevMonth = $currentMonth == 1 ? 12 : $currentMonth - 1;
$prevYear = $currentMonth == 1 ? $currentYear - 1 : $currentYear;
$nextMonth = $currentMonth == 12 ? 1 : $currentMonth + 1;
$nextYear = $currentMonth == 12 ? $currentYear + 1 : $currentYear;

// Group events by date for calendar display
$eventsByDate = [];
foreach ($monthEvents as $eventItem) {
    $date = $eventItem['event_date'];
    if (!isset($eventsByDate[$date])) {
        $eventsByDate[$date] = [];
    }
    $eventsByDate[$date][] = $eventItem;
}
?>

<head>
    <link rel="stylesheet" href="css/events.css">   
</head>

<div class="page-header">
    <h2>Event Management</h2>
    <button class="btn-primary" onclick="openEventModal()">
        <i class="fas fa-plus"></i> Add Event
    </button>
</div>

<div class="events-layout">
    <div class="calendar-container">
        <div class="calendar-view">
            <div class="calendar-header">
                <h3><?php echo date('F Y', strtotime("$currentYear-$currentMonth-01")); ?></h3>
                <div class="calendar-nav">
                    <button class="btn-icon" onclick="navigateCalendar(<?php echo $prevMonth; ?>, <?php echo $prevYear; ?>)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="btn-icon" onclick="navigateCalendar(<?php echo $nextMonth; ?>, <?php echo $nextYear; ?>)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            <div class="">
                <div class="calendar-weekdays">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="calendar-days">
                    <?php
                    // Add empty cells for days before the first day of the month
                    for ($i = 1; $i < $firstDayOfMonth; $i++) {
                        echo '<div class="calendar-day empty"></div>';
                    }
                    
                    // Add days of the month
                    for ($day = 1; $day <= $daysInMonth; $day++) {
                        $date = sprintf('%04d-%02d-%02d', $currentYear, $currentMonth, $day);
                        $hasEvent = isset($eventsByDate[$date]);
                        $dayEvents = $hasEvent ? $eventsByDate[$date] : [];
                        $isToday = ($day == date('j') && $currentMonth == date('n') && $currentYear == date('Y'));
                        
                        echo '<div class="calendar-day' . ($hasEvent ? ' has-event' : '') . ($isToday ? ' today' : '') . '">';
                        echo '<span class="day-number">' . $day . '</span>';
                        
                        if ($hasEvent) {
                            echo '<div class="event-indicators">';
                            foreach ($dayEvents as $eventItem) {
                                echo '<div class="event-indicator" data-department="' . htmlspecialchars($eventItem['department_name'] ?? '') . '" title="' . htmlspecialchars($eventItem['title']) . '"></div>';
                            }
                            echo '</div>';
                        }
                        
                        echo '</div>';
                    }
                    
                    // Add empty cells for days after the last day of the month
                    $totalCells = 42; // 6 rows × 7 days
                    $filledCells = ($firstDayOfMonth - 1) + $daysInMonth;
                    $remainingCells = $totalCells - $filledCells;
                    for ($i = 0; $i < $remainingCells; $i++) {
                        echo '<div class="calendar-day empty"></div>';
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>

    <div class="table-container">
        <h3>Upcoming Events</h3>
        
        <!-- Search and Filter -->
        <div class="search-container">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="eventSearch" placeholder="Search events...">
            </div>
            <select id="departmentFilter">
                <option value="">All Departments</option>
                <?php foreach ($departments as $dept): ?>
                    <option value="<?php echo $dept['id']; ?>"><?php echo htmlspecialchars($dept['name']); ?></option>
                <?php endforeach; ?>
            </select>
            <div class="results-count">
                Showing <span id="results-count">0</span> of <span id="total-count">0</span> events
            </div>
        </div>
        
        <table class="data-table">
            <thead>
                <tr>
                    <th>Event</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Department</th>
                    <th>Expected</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="eventTableBody">
                <tr>
                    <td colspan="6" class="no-data">Loading events...</td>
                </tr>
            </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="pagination" id="pagination">
            <!-- Pagination buttons will be generated by JavaScript -->
        </div>
        <div class="page-info" id="page-info">
            <!-- Page info will be generated by JavaScript -->
        </div>
    </div>
</div>

<!-- Event Modal (for both Add and Edit) -->
<div id="eventModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="modalTitle">Add New Event</h3>
            <span class="close" onclick="closeEventModal()">&times;</span>
        </div>
        <form id="eventForm">
            <input type="hidden" id="eventId" name="id" value="">
            
            <div class="form-group">
                <label for="eventTitle">Event Title *</label>
                <input type="text" id="eventTitle" name="title" required>
            </div>
            
            <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" name="description" rows="3"></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="eventDate">Date *</label>
                    <input type="date" id="eventDate" name="event_date" required>
                </div>
                <div class="form-group">
                    <label for="eventTime">Time *</label>
                    <input type="time" id="eventTime" name="event_time" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="eventLocation">Location *</label>
                    <select id="eventLocation" name="location_id" required>
                        <option value="">Select Location</option>
                        <?php foreach ($locations as $location): ?>
                            <option value="<?php echo $location['id']; ?>"><?php echo htmlspecialchars($location['name']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventCategory">Categories</label>
                    <select id="eventCategory" name="category_id">
                        <option value="">Select Category</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?php echo $cat['id']; ?>"><?php echo htmlspecialchars($cat['categories']); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
            </div>
            
<div class="form-group">
    
    <label for="expectedAttendance">Expected Attendance</label>
    <input type="number" id="expectedAttendance" name="expected_attendance" min="1">
    <div class="form-group">
               
    </div>

    <div class="department-selection">    
        <div class="form-group department-field" id="departmentField1">
            <div class="form-group">
                <label for="eventDepartment1">Department</label>
                <select id="eventDepartment1" name="department_id" class="department-select">
                    <option value="0">All Departments</option>
                    <?php foreach ($departments as $dept): ?>
                        <option value="<?php echo $dept['id']; ?>">
                            <?php echo htmlspecialchars($dept['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <button type="button" class="remove-department" onclick="removeDepartmentField(this)" style="display: none;">−</button>
        </div>
        
        
        <div id="additionalDepartments"></div>
            <button type="button" id="addDepartmentBtn" onclick="addDepartmentField()" class="add-department-btn">
                + Add Another Department
            </button>
            <small class="hint">Maximum 7 departments total</small>

    </div>


</div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeEventModal()">Cancel</button>
                <button type="submit" class="btn-primary" id="submitButton">Add Event</button>
            </div>
        </form>
    </div>
</div>

<!-- View Event Details Modal -->
<div id="viewEventModal" class="modal">
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

<script>
    // Department color palette
    const departmentColors = [
        '#8786E3', '#FF9F40', '#36A2EB', '#4BC0C0', '#FF6384',
        '#9966FF', '#FFCD56', '#C9CBCF', '#4D5360', '#FF6B6B',
        '#51CF66'
    ];

    let departmentColorMap = {};
    let eventsPagination;

    // Initialize the page
    document.addEventListener('DOMContentLoaded', function() {
        initializeDepartmentColors();
        applyDepartmentColors();
        initializeSearchAndPagination();
        
        // Set today's date as default in the form
        document.getElementById('eventDate').valueAsDate = new Date();
    });

    // Initialize department colors
    function initializeDepartmentColors() {
        departmentColorMap = {};
        const departments = [...new Set(<?php echo json_encode(array_column($allEvents, 'department_name')); ?>)];
        
        departments.forEach((dept, index) => {
            if (dept && dept !== 'No Department') {
                departmentColorMap[dept] = departmentColors[index % departmentColors.length];
            }
        });
    }

    function applyDepartmentColors() {
        document.querySelectorAll('.event-indicator').forEach(indicator => {
            const department = indicator.getAttribute('data-department');
            const color = getDepartmentColor(department);
            indicator.style.backgroundColor = color;
        });
    }

   
    function getDepartmentColor(departmentName) {
        if (!departmentName || departmentName === 'No Department') {
            return '#C9CBCF';
        }
        return departmentColorMap[departmentName] || '#C9CBCF';
    }

    // Calendar navigation
    function navigateCalendar(month, year) {
        window.location.href = `events.php?month=${month}&year=${year}`;
    }

    function initializeSearchAndPagination() {
        const allEvents = <?php echo json_encode($allEvents); ?>;
        
        eventsPagination = initializePagination(
            allEvents,
            renderEventsTable,
            {
                itemsPerPage: 4,
                containerId: 'pagination',
                pageInfoId: 'page-info',
                resultsCountId: 'results-count',
                totalCountId: 'total-count'
            }
        );

        const searchInput = document.getElementById('eventSearch');
        const departmentFilter = document.getElementById('departmentFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                eventsPagination.filterData(this.value, departmentFilter.value);
            });
        }
        
        if (departmentFilter) {
            departmentFilter.addEventListener('change', function() {
                eventsPagination.filterData(searchInput.value, this.value);
            });
        }
    }

  
    function renderEventsTable(events, startIndex) {
        const tbody = document.getElementById('eventTableBody');
        
        if (!tbody) return;
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">No events found</td></tr>';
            return;
        }
        
        tbody.innerHTML = events.map((event, index) => {
            const globalIndex = startIndex + index + 1;
            const departmentName = event.department_name || 'All Departments';
            const departmentColor = getDepartmentColor(departmentName);
            
            // Use truncateString for everything with max 5 characters
            const truncatedTitle = truncateString(event.title || '', 5);
            const truncatedDescription = event.description ? truncateString(event.description, 5) : '';
            const truncatedLocation = truncateString(event.location_name || 'N/A', 5);
            const truncatedDepartment = truncateString(departmentName, 5);
            const truncatedTime = formatTime(event.event_time);
            const truncatedTimeShort = truncateString(truncatedTime, 5);
            
            return `
                <tr data-event-id="${event.id}">
                    <td>
                        <strong title="${escapeHtml(event.title)}">${escapeHtml(truncatedTitle)}</strong>
                        ${truncatedDescription ? '<br><small title="' + escapeHtml(event.description) + '">' + escapeHtml(truncatedDescription) + '</small>' : ''}
                    </td>
                    <td title="${formatDate(event.event_date)} at ${formatTime(event.event_time)}">
                        ${formatDate(event.event_date)}<br>
                        <small>${truncatedTimeShort}</small>
                    </td>
                    <td title="${escapeHtml(event.location_name || 'N/A')}">${escapeHtml(truncatedLocation)}</td>
                    <td>
                        <span class="department-badge" style="background-color: ${departmentColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500;" title="${escapeHtml(departmentName)}">
                            ${escapeHtml(truncatedDepartment)}
                        </span>
                    </td>
                    <td>${event.expected_attendance || 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn-icon btn-rsvp" onclick="viewEventRSVP(${event.id})" title="View RSVP Responses">
                            <i class="fas fa-users"></i>
                        </button>
                        <button class="btn-icon btn-info" onclick="viewEvent(${event.id})" title="View Event Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editEvent(${event.id})" title="Edit Event">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteEvent(${event.id})" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    function viewEventRSVP(eventId) {
        window.location.href = `rsvp.php?event_id=${eventId}`;
    }
    // View event details
    async function viewEvent(id) {
        try {
            const response = await fetch(`class/ApiHandler.php?action=get&entity=events&id=${id}`);
            const data = await response.json();
            
            if (data.success) {
                const event = data.data;
                showEventDetails(event);
            } else {
                handleApiError(data, 'load event data');
            }
        } catch (error) {
            showError('Error loading event: ' + error.message);
        }
    }

    // Show event details in modal
    function showEventDetails(event) {
        const modal = document.getElementById('viewEventModal');
        const modalTitle = document.getElementById('viewModalTitle');
        const detailsContainer = document.getElementById('viewEventDetails');
        
        modalTitle.textContent = 'Event Details';
        
        const departmentName = event.department_name || 'All Departments';
        const departmentColor = getDepartmentColor(departmentName);
        
        detailsContainer.innerHTML = `
            <div class="event-details">
                <div class="detail-row">
                    <label>Event Title:</label>
                    <span>${escapeHtml(event.title || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <label>Description:</label>
                    <span>${escapeHtml(event.description || 'No description')}</span>
                </div>
                <div class="detail-row">
                    <label>Date:</label>
                    <span>${formatDate(event.event_date)}</span>
                </div>
                <div class="detail-row">
                    <label>Time:</label>
                    <span>${formatTime(event.event_time)}</span>
                </div>
                <div class="detail-row">
                    <label>Location:</label>
                    <span>${escapeHtml(event.location_name || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <label>Category:</label>
                    <span>${escapeHtml(event.categories || 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <label>Department:</label>
                    <span class="department-badge" style="background-color: ${departmentColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500;">
                        ${escapeHtml(departmentName)}
                    </span>
                </div>
                <div class="detail-row">
                    <label>Expected Attendance:</label>
                    <span>${event.expected_attendance || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <label>Created:</label>
                    <span>${formatDateTime(event.created_at)}</span>
                </div>
                ${event.updated_at && event.updated_at !== event.created_at ? `
                <div class="detail-row">
                    <label>Last Updated:</label>
                    <span>${formatDateTime(event.updated_at)}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Close view event modal
    function closeViewEventModal() {
        const modal = document.getElementById('viewEventModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Modal functions
    function openEventModal(eventId = null) {
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitButton = document.getElementById('submitButton');
        
        // Reset form
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        
        if (eventId) {
            modalTitle.textContent = 'Edit Event';
            submitButton.textContent = 'Update Event';
            loadEventData(eventId);
        } else {
            modalTitle.textContent = 'Add New Event';
            submitButton.textContent = 'Add Event';
            // Set default date to today
            document.getElementById('eventDate').valueAsDate = new Date();
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeEventModal() {
        const modal = document.getElementById('eventModal');
        modal.style.display = 'none';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.body.style.overflow = 'auto';
    }

async function loadEventData(id) {
    try {
        const response = await fetch(`class/ApiHandler.php?action=get&entity=events&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const event = data.data;
            
            // Set basic fields
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventDate').value = event.event_date || '';
            document.getElementById('eventTime').value = event.event_time || '';
            document.getElementById('eventLocation').value = event.location_id || '';
            document.getElementById('eventCategory').value = event.category_id || '';
            document.getElementById('expectedAttendance').value = event.expected_attendance || '';
            
            // ========== IMPORTANT: Handle department IDs as array ==========
            // Clear all existing department fields except the first one
            const additionalDepartments = document.getElementById('additionalDepartments');
            additionalDepartments.innerHTML = '';
            departmentCounter = 1;
            
            // Get department_id from event data
            let departmentIds = [];
            
            if (event.department_id) {
                try {
                    // Try to parse as JSON array first
                    if (typeof event.department_id === 'string' && 
                        (event.department_id.startsWith('[') || event.department_id.startsWith('"'))) {
                        departmentIds = JSON.parse(event.department_id);
                    } else {
                        // If it's a single number, convert to array
                        departmentIds = [parseInt(event.department_id)];
                    }
                } catch (e) {
                    // If parsing fails, use as single value
                    departmentIds = [parseInt(event.department_id)];
                }
            }
            
            // Set the first department field
            if (departmentIds.length > 0) {
                document.getElementById('eventDepartment1').value = departmentIds[0];
                
                // Show remove button on first field if there are multiple departments
                if (departmentIds.length > 1) {
                    document.querySelector('#departmentField1 .remove-department').style.display = 'block';
                }
                
                // Add additional department fields for remaining IDs
                for (let i = 1; i < departmentIds.length; i++) {
                    addDepartmentField(); // Use existing function to add field
                    const newSelect = document.getElementById('eventDepartment' + (i + 1));
                    if (newSelect) {
                        newSelect.value = departmentIds[i];
                    }
                }
            } else {
                // No departments selected
                document.getElementById('eventDepartment1').value = '';
                document.querySelector('#departmentField1 .remove-department').style.display = 'none';
            }
            // ========== END department handling ==========
           
        } else {
            handleApiError(data, 'load event data');
        }
    } catch (error) {
        showError('Error loading event: ' + error.message);
    }
}

async function handleEventSubmit(event) {
    event.preventDefault();    
    const formData = new FormData(event.target);
    const eventId = formData.get('id');
    const action = eventId ? 'update' : 'create';    
    const jsonData = {};
    
    const departmentValues = formData.getAll('department_id');
    // showSuccess('All department values:', departmentValues);     

    if (departmentValues.includes('0')) {
        // If ANY select has "All Departments" (0), set to null
        jsonData.department_id = null;
    } else {
        // Filter out empty values and keep only valid numbers
        const validDepartments = departmentValues
            .filter(val => val !== '' && val !== '0')
            .map(val => parseInt(val));
        
        console.log('Valid departments:', validDepartments);
        
        if (validDepartments.length === 0) {
            jsonData.department_id = null;
        } else if (validDepartments.length === 1) {
            jsonData.department_id = validDepartments[0];
        } else {
            jsonData.department_id = validDepartments; // This will be an array [3,4,5]
        }
    }
    
    // Add all other form fields (excluding department_id[] and id)
    formData.forEach((value, key) => {
        if (key !== 'id' && key !== 'department_id' && value !== '') {
            jsonData[key] = value;
        }
    });
    
    console.log('Final JSON to send:', jsonData);
    
    try {
        const method = eventId ? 'PUT' : 'POST';
        const url = `class/ApiHandler.php?action=${action}&entity=events${eventId ? '&id=' + eventId : ''}`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            toastSuccess(eventId ? 'Event updated successfully!' : 'Event created successfully!');
            closeEventModal();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            handleApiError(result, action);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

    // Delete event
    async function deleteEvent(id) {
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const response = await fetch(`class/ApiHandler.php?action=delete&entity=events&id=${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                toastSuccess('Event deleted successfully!');
                // Reload the page to refresh calendar and events
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                handleApiError(result, 'delete event');
            }
        } catch (error) {
            showError('Error: ' + error.message);
        }
    }

    // Edit event
    function editEvent(id) {
        openEventModal(id);
    }

  

   

   

    // Close modals when clicking outside
    window.onclick = function(event) {
        const eventModal = document.getElementById('eventModal');
        const viewEventModal = document.getElementById('viewEventModal');
        
        if (event.target === eventModal) {
            closeEventModal();
        }
        if (event.target === viewEventModal) {
            closeViewEventModal();
        }
    };

    // Attach form submit handler
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);



let departmentCounter = 1;
const maxDepartments = 7;

function addDepartmentField() {
    if (departmentCounter >= maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
        alert('Maximum of 7 departments reached');
        return;
    }
    
    departmentCounter++;
    const container = document.getElementById('additionalDepartments');
    
    // Get all currently selected department IDs (except empty/0 values)
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) { // Only include valid department IDs (1-6)
            selectedDepartments.push(value);
        }
    });
    
    // Get all department options from PHP
    const allDepartments = <?php echo json_encode($departments); ?>;
    
    // Create new department field
    const newField = document.createElement('div');
    newField.className = 'form-group department-field';
    newField.id = 'departmentField' + departmentCounter;
    
    // Build the select options HTML
    let optionsHTML = '<option value=""></option>'; // Empty option
    
    // Add only departments that haven't been selected yet
    allDepartments.forEach(dept => {
        if (!selectedDepartments.includes(dept.id)) {
            optionsHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
        }
    });
    
    newField.innerHTML = `
        <div class="form-group">
            <label for="eventDepartment${departmentCounter}"></label>
            <select id="eventDepartment${departmentCounter}" name="department_id" class="department-select">
                ${optionsHTML}
            </select>
        </div>
        <button type="button" class="remove-department" onclick="removeDepartmentField(this)">−</button>
    `;
    
    container.appendChild(newField);
    
    // Show remove button on first field
    if (departmentCounter === 2) {
        document.querySelector('#departmentField1 .remove-department').style.display = 'block';
    }
    
    // Disable button if max reached
    if (departmentCounter >= maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
    }
}

function removeDepartmentField(button) {
    const field = button.closest('.department-field');
    
    // Don't remove the first one
    if (field.id === 'departmentField1') {
        // Clear selection but don't remove the field
        field.querySelector('select').value = '';
        return;
    }
    
    field.remove();
    departmentCounter--;
    
    // Hide remove button on first field if only one left
    if (departmentCounter === 1) {
        document.querySelector('#departmentField1 .remove-department').style.display = 'none';
    }
    
    // Re-enable add button if not at max
    document.getElementById('addDepartmentBtn').disabled = false;
    
    // Update all department selects to show newly available options
    refreshDepartmentSelects();
    
    // Renumber remaining fields (optional, for clean IDs)
    renumberDepartmentFields();
}

function refreshDepartmentSelects() {
    // Get all currently selected department IDs
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) {
            selectedDepartments.push(value);
        }
    });
    
    // Get all department options from PHP
    const allDepartments = <?php echo json_encode($departments); ?>;
    
    // Update each select dropdown
    document.querySelectorAll('.department-select').forEach(select => {
        const currentValue = select.value;
        
        // Clear all options except the first empty one
        select.innerHTML = '<option value=""></option>';
        
        // Add available options (not selected in other fields)
        allDepartments.forEach(dept => {
            // Show option if: 
            // 1. It's the currently selected value for this field, OR
            // 2. It's not selected in any other field
            if (parseInt(currentValue) === dept.id || !selectedDepartments.includes(dept.id)) {
                select.innerHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
            }
        });
        
        // Restore the current value
        select.value = currentValue;
    });
}

function renumberDepartmentFields() {
    const fields = document.querySelectorAll('.department-field');
    let newCounter = 1;
    
    fields.forEach((field, index) => {
        if (index === 0) return; // Skip first field
        
        const select = field.querySelector('select');
        const label = field.querySelector('label');
        const removeBtn = field.querySelector('.remove-department');
        
        // Update IDs
        field.id = 'departmentField' + newCounter;
        select.id = 'eventDepartment' + newCounter;
        label.setAttribute('for', 'eventDepartment' + newCounter);
        
        // Update remove button onclick
        removeBtn.setAttribute('onclick', 'removeDepartmentField(this)');
        
        newCounter++;
    });
}

// Initialize - hide remove button on first field
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#departmentField1 .remove-department').style.display = 'none';
});
</script>

<?php include "include/footer.php"; ?>