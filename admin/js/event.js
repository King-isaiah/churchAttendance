
let allDepartments = '';
let departmentCounter = 1;
const maxDepartments = 7;
async function initializeDepartmentColors() {
    departmentColorMap = {};

    try {
        const res  = await fetch('../class/ApiHandler.php?action=getAll&entity=events');
        const json = await res.json();
        if(json){
            // alert('json working its alright')
        }
        console.log(json, 'we testing colors')
        if (!json.success) {
            console.warn('initializeDepartmentColors: events fetch failed —', json.message);
            return;
        }

        const allEvents = json.data || [];

        // array_column($allEvents, 'department_name') + Set(...)
        const uniqueNames = [...new Set(allEvents.map(e => e.department_name))];

        uniqueNames.forEach((dept, index) => {
            if (dept && dept !== 'No Department') {
                departmentColorMap[dept] = departmentColors[index % departmentColors.length];
            }
        });
    } catch (e) {
        console.error('initializeDepartmentColors failed:', e);
        departmentColorMap = {};
    }
}


async function evenRender() {
    const params = new URLSearchParams(window.location.search);
    const now    = new Date();

    let currentMonth = parseInt(params.get('month'), 10) || (now.getMonth() + 1);
    let currentYear  = parseInt(params.get('year'),  10) || now.getFullYear();

    // Validate month and year
    if (currentMonth < 1 || currentMonth > 12) {
        currentMonth = now.getMonth() + 1;
    }
    if (currentYear < 2020 || currentYear > 2030) {
        currentYear = now.getFullYear();
    }

    // Get events for the current month
    let monthEvents = [];
    let allEvents   = [];
    let departments = [];
    let locations   = [];
    let categories  = [];
    let attendanceMethod  = [];
    let error       = null;

    try {
        const [evRes, deptRes, locRes, catRes, attMethodRes] = await Promise.all([
            fetch('../class/ApiHandler.php?action=getAll&entity=events'),
            fetch('../class/ApiHandler.php?action=getAll&entity=departments'),
            fetch('../class/ApiHandler.php?action=getAll&entity=locations'),
            fetch('../class/ApiHandler.php?action=getAll&entity=categories'),
            fetch('../class/ApiHandler.php?action=getAll&entity=attendance_methods')
        ]);

        const [evJson, deptJson, locJson, catJson,attMethodJson] = await Promise.all([
            evRes.json(), deptRes.json(), locRes.json(), catRes.json(), attMethodRes.json()
        ]);

        allEvents   = evJson.success   ? (evJson.data   || []) : [];
        departments = deptJson.success ? (deptJson.data || []) : [];
        locations   = locJson.success  ? (locJson.data  || []) : [];
        categories  = catJson.success  ? (catJson.data  || []) : [];
        attendanceMethod  = attMethodJson.success  ? (attMethodJson.data  || []) : [];

        // Filter the events down to this month — replaces getEventsByMonth()
        const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}-`;
        monthEvents  = allEvents.filter(ev => (ev.event_date || '').startsWith(prefix));

    } catch (e) {
        monthEvents = [];
        allEvents   = [];
        departments = [];
        locations   = [];
        categories  = [];
        attendanceMethod  = [];
        error       = e.message;
    }

    // ---------- Calendar math ----------
    const firstDayOfMonth = (() => {
        const d = new Date(currentYear, currentMonth - 1, 1).getDay();
        return d === 0 ? 7 : d;              // ISO: Sunday = 7 (matches PHP date('N'))
    })();

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    const prevMonth = currentMonth === 1  ? 12 : currentMonth - 1;
    const prevYear  = currentMonth === 1  ? currentYear - 1 : currentYear;
    const nextMonth = currentMonth === 12 ? 1  : currentMonth + 1;
    const nextYear  = currentMonth === 12 ? currentYear + 1 : currentYear;

    // ---------- Group events by date ----------
    const eventsByDate = {};                    // object, not array
    for (const eventItem of monthEvents) {      // for..of, not foreach
        const date = eventItem.event_date;
        if (!eventsByDate[date]) eventsByDate[date] = [];
        eventsByDate[date].push(eventItem);     // .push(), not []
    }

  
    // ---------- Pre-build the pieces that used to be PHP foreach/for loops ----------

    // Month label: "September 2026"
    const monthLabel = new Date(currentYear, currentMonth - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Today's date as "YYYY-MM-DD" for the .today class
    const today     = new Date();
    const todayStr  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // ---------- Calendar day cells ----------
    let calendarCells = '';

    // Empty cells before the 1st of the month
    for (let i = 1; i < firstDayOfMonth; i++) {
        calendarCells += '<div class="calendar-day empty"></div>';
    }

    // Day cells 1..daysInMonth
    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = eventsByDate[date] || [];
        const hasEvent  = dayEvents.length > 0;
        const isToday   = date === todayStr;

        calendarCells += `<div class="calendar-day${hasEvent ? ' has-event' : ''}${isToday ? ' today' : ''}" data-date="${date}">`;
        calendarCells +=   `<span class="day-number">${day}</span>`;

        if (hasEvent) {
            calendarCells += '<div class="event-indicators">';
            for (const ev of dayEvents) {
                calendarCells += `<div class="event-indicator" data-department="${escapeHtml(ev.department_name || '')}" title="${escapeHtml(ev.title || '')}"></div>`;
            }
            calendarCells += '</div>';
        }
        calendarCells += '</div>';
    }

    // Trailing empty cells to fill a 6×7 grid
    const totalCells     = 42;
    const filledCells    = (firstDayOfMonth - 1) + daysInMonth;
    const remainingCells = totalCells - filledCells;
    for (let i = 0; i < remainingCells; i++) {
        calendarCells += '<div class="calendar-day empty"></div>';
    }

    // ---------- Department filter options ----------
    let departmentOptions = '';
    for (const dept of departments) {
        departmentOptions += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
    }


    // ---------- Location options ----------
    let locationOptions = '';
    for (const loc of locations) {
        locationOptions += `<option value="${loc.id}">${escapeHtml(loc.name)}</option>`;
    }

    // ---------- Category options (used by "Categories" select) ----------
    let categoryOptions = '';
    for (const cat of categories) {
        categoryOptions += `<option value="${cat.id}">${escapeHtml(cat.categories)}</option>`;
    }

    // ---------- Attendance-method options (same source for now) ----------
    
    let attendanceMethodOptions = '';
    for (const am of attendanceMethod) {
        attendanceMethodOptions += `<option value="${am.id}">${escapeHtml(am.name)}</option>`;
    }



    // build `content` from firstDayOfMonth / daysInMonth / eventsByDate here…
    let content = `
        <div class="events-layout">
            <div class="calendar-container">
                <div class="calendar-view">
                    <div class="calendar-header">
                        <h3>${monthLabel}</h3>
                        <div class="calendar-nav">
                            <button class="btn-icon" onclick="navigateCalendar(${prevMonth}, ${prevYear})">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="btn-icon" onclick="navigateCalendar(${nextMonth}, ${nextYear})">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div class="calendar-weekdays">
                            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
                            <div>Thu</div><div>Fri</div><div>Sat</div>
                        </div>
                        <div class="calendar-days">
                            ${calendarCells}
                        </div>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <h3>Upcoming Events</h3>

                <div class="search-container">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="eventSearch" placeholder="Search events...">
                    </div>
                    <select id="departmentFilter">
                        <option value="">All Departments</option>
                        ${departmentOptions}
                    </select>
                    <div class="results-count">
                        Showing <span id="results-count">0</span> of <span id="total-count">0</span> events
                    </div>
                </div>

                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date &amp; Time</th>
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

                <div class="pagination" id="pagination"></div>
                <div class="page-info" id="page-info"></div>
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
                            <label for="eventTime">Time *</label>
                            <input type="time" id="eventTime" name="event_time" required>
                        </div>
                        <div class="form-group">
                            <label for="eventTimeExp">Attendance Time Expired *</label>
                            <input type="time" id="eventTimeExp" name="time_exp" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventLocation">Location *</label>
                            <select id="eventLocation" name="location_id" required>
                                <option value="">Select Location</option>
                                ${locationOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="eventCategory">Categories</label>
                            <select id="eventCategory" name="category_id">
                                <option value="">Select Category</option>
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="expectedAttendance">Expected Attendance</label>
                            <input type="number" id="expectedAttendance" name="expected_attendance" min="1">
                        </div>
                        <div class="form-group">
                            <label for="eventAttendanceMethod">Attendance Method</label>
                            <select id="eventAttendanceMethod" name="attendance_method_id">
                                <option value="">Select Method</option>
                                ${attendanceMethodOptions}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventDate">Date *</label>
                            <input type="date" id="eventDate" name="event_date" required>
                        </div>
                        <div class="department-selection">
                            <div class="form-group department-field" id="departmentField1">
                                <div class="form-group">
                                    <label for="eventDepartment1">Department</label>
                                    <select id="eventDepartment1" name="department_id" class="department-select">
                                        <option value="0">All Departments</option>
                                        ${departmentOptions}
                                    </select>
                                </div>
                                <button type="button" class="remove-department"
                                        onclick="removeDepartmentField(this)" style="display: none;">−</button>
                            </div>

                            <div id="additionalDepartments"></div>

                            <button type="button" id="addDepartmentBtn"
                                onclick="addDepartmentField()" class="add-department-btn">
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
    `;
    
    const renderEvent = document.querySelector('.evenRendering');
    if (renderEvent) renderEvent.innerHTML = content;
    
}




// Department color palette
const departmentColors = [
    '#8786E3', '#FF9F40', '#36A2EB', '#4BC0C0', '#FF6384',
    '#9966FF', '#FFCD56', '#C9CBCF', '#4D5360', '#FF6B6B',
    '#51CF66'
];

let departmentColorMap = {};
let eventsPagination;


// Initialize the page
document.addEventListener('DOMContentLoaded', async function () {
    // 1. Inject the HTML first — nothing else can query the DOM before this
    await evenRender();

    // 2. Colour map must be built BEFORE applying it
    await initializeDepartmentColors();
    applyDepartmentColors();

    // 3. Pagination + search wiring
    await initializeSearchAndPagination();

    // 4. Post-render setup
    const removeBtn = document.querySelector('#departmentField1 .remove-department');
    if (removeBtn) removeBtn.style.display = 'none';

    const dateInput = document.getElementById('eventDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    // 5. Form submit
    const form = document.getElementById('eventForm');
    if (form) form.addEventListener('submit', handleEventSubmit);

    // 6. Click-outside-to-close
    window.addEventListener('click', function (e) {
        const eventModal = document.getElementById('eventModal');
        const viewModal  = document.getElementById('viewEventModal');

        if (eventModal && e.target === eventModal) closeEventModal();
        if (viewModal  && e.target === viewModal)  closeViewEventModal();
    });
});


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

async function initializeSearchAndPagination() {
    const eventResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=events');
    const eventData = await eventResponse.json();
    console.log(eventData)
    const allEvents = eventData.data;
    
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
        const response = await fetch(`../class/ApiHandler.php?action=get&entity=events&id=${id}`);
        const data = await response.json();

        if (data.success) {
            showEventDetails(data.data);
        } else {
            handleApiError(data, 'load event data');
        }
    } catch (error) {
        showError('Error loading event: ' + error.message);
    }
}
// Show event details in modal
function showEventDetails(event) {
    const modal            = document.getElementById('viewEventModal');
    const modalTitle       = document.getElementById('viewModalTitle');
    const detailsContainer = document.getElementById('viewEventDetails');

    modalTitle.textContent = 'Event Details';

    // ---------- Department cell ----------
    const viewdept = Array.isArray(event.viewdept) ? event.viewdept : [];

    let departmentHTML;
    if (viewdept.length === 0) {
        // All Departments
        departmentHTML = `
            <span class="department-badge"
                  style="background-color:#C9CBCF;color:white;padding:4px 12px;border-radius:20px;font-size:0.85em;font-weight:500;">
                All Departments
            </span>`;
    } else {
        // One or many — same rendering path
        departmentHTML = `
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${viewdept.map(d => {
                    const color = getDepartmentColor(d.name);
                    return `<span class="department-badge"
                                  style="background-color:${color};color:white;padding:4px 12px;border-radius:20px;font-size:0.85em;font-weight:500;">
                                ${escapeHtml(d.name)}
                            </span>`;
                }).join('')}
            </div>`;
    }

    detailsContainer.innerHTML = `
        <div class="event-details">
            <div class="detail-row"><label>Event Title:</label><span>${escapeHtml(event.title || 'N/A')}</span></div>
            <div class="detail-row"><label>Description:</label><span>${escapeHtml(event.description || 'No description')}</span></div>
            <div class="detail-row"><label>Date:</label><span>${formatDate(event.event_date)}</span></div>
            <div class="detail-row"><label>Time:</label><span>${formatTime(event.event_time)}</span></div>
            <div class="detail-row"><label>Location:</label><span>${escapeHtml(event.location_name || 'N/A')}</span></div>
            <div class="detail-row"><label>Category:</label><span>${escapeHtml(event.categories || 'N/A')}</span></div>

            <div class="detail-row">
                <label>Department:</label>
                <span>${departmentHTML}</span>
            </div>

            <div class="detail-row"><label>Expected Attendance:</label><span>${event.expected_attendance || 'N/A'}</span></div>
            <div class="detail-row"><label>Created:</label><span>${formatDateTime(event.created_at)}</span></div>
            ${event.updated_at && event.updated_at !== event.created_at ? `
            <div class="detail-row"><label>Last Updated:</label><span>${formatDateTime(event.updated_at)}</span></div>
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
        const response = await fetch(`../class/ApiHandler.php?action=get&entity=events&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const event = data.data;
            
            // Set basic fields
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventDate').value = event.event_date || '';
            document.getElementById('eventTime').value = event.event_time || '';
            document.getElementById('eventTimeExp').value = event.time_exp || '';
            document.getElementById('eventAttendanceMethod').value = event.attendance_method_id || '';
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
        const url = `../class/ApiHandler.php?action=${action}&entity=events${eventId ? '&id=' + eventId : ''}`;
        
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
        const response = await fetch(`../class/ApiHandler.php?action=delete&entity=events&id=${id}`, {
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



async function addDepartmentField() {
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
    const deptResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=departments');
    const deptData = await deptResponse.json();
    if (deptData.success) {
        console.log("working like a charm for the adddepartment");
        allDepartments = deptData.data
        // populateDepartments(deptData.data);
    }
    
  
    
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


async function refreshDepartmentSelects() {
    // Get all currently selected department IDs
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) {
            selectedDepartments.push(value);
        }
    });
    
    const deptResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=departments');
        const deptData = await deptResponse.json();
        if (deptData.success) {
            console.log("working like a charm this is for the refreshdepartmentselect");
           allDepartments = deptData.data
    }

    
    
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

