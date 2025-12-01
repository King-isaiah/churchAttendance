// Configuration for different management types
const managementConfig = {
    locations: {
        title: 'Locations Management',
        addButton: 'Add Location',
        columns: ['#', 'Location Name', 'Capacity', 'Address', 'Created At', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="locationName">Location Name</label>
                <input type="text" id="locationName" name="name" required>
            </div>
            <div class="form-group">
                <label for="locationCapacity">Capacity</label>
                <input type="number" id="locationCapacity" name="capacity" required>
            </div>
            <div class="form-group">
                <label for="locationAddress">Address</label>
                <textarea id="locationAddress" name="address" rows="3"></textarea>
            </div>
        `,
        entity: 'locations'
    },
    departments: {
        title: 'Departments Management',
        addButton: 'Add Department',
        columns: ['#', 'Name', 'HOD', 'ASS.HOD', 'No_Member', 'Description', 'Created At', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="departmentName">Department Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <label for="HOD">HOD</label>
                <input type="text" id="HOD" name="HOD">
            </div>
            <div class="form-group">
                <label for="ASS_HOD">ASS.HOD</label>
                <input type="text" id="ASS_HOD" name="ASS_HOD">
            </div>
            <div class="form-group">
                <label for="no_members">Number of members</label>
                <input type="text" id="no_members" name="no_members">
            </div>
            <div class="form-group">
                <label for="departmentDescription">Description</label>
                <textarea id="description" name="description" rows="3"></textarea>
            </div>
        `,
        entity: 'departments'
    },
    speakers: {
        title: 'Speakers Management',
        addButton: 'Add Speaker',
        columns: ['#', 'Speaker Name', 'Email', 'Phone', 'Specialty', 'Created At', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="speakers_name">Speaker Name</label>
                <input type="text" id="speakers_name" name="speakers_name" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email">
            </div>
            <div class="form-group">
                <label for="phone_number">Phone</label>
                <input type="tel" id="phone_number" name="phone_number">
            </div>
            <div class="form-group">
                <label for="speciality">Specialty</label>
                <input type="text" id="speciality" name="speciality">
            </div>
        `,
        entity: 'speakers'
    },
    events: {
        title: 'Events Management',
        addButton: 'Add Event',
        columns: ['#', 'Event Name', 'Date', 'Location', 'Speaker', 'Attendees', 'Created At', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="eventName">Event Name</label>
                <input type="text" id="eventName" name="name" required>
            </div>
            <div class="form-group">
                <label for="eventDate">Date</label>
                <input type="datetime-local" id="eventDate" name="date" required>
            </div>
            <div class="form-group">
                <label for="eventLocation">Location</label>
                <select id="eventLocation" name="location_id">
                    <option value="">Select Location</option>
                </select>
            </div>
            <div class="form-group">
                <label for="eventSpeaker">Speaker</label>
                <select id="eventSpeaker" name="speaker_id">
                    <option value="">Select Speaker</option>
                </select>
            </div>
            <div class="form-group">
                <label for="eventDescription">Description</label>
                <textarea id="eventDescription" name="description" rows="3"></textarea>
            </div>
        `,
        entity: 'events'
    },
    members: {
        title: 'Members Management',
        addButton: 'Add Member',
        columns: ['#', 'Member Name', 'Email', 'Phone', 'Department', 'Join Date', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="memberName">Member Name</label>
                <input type="text" id="memberName" name="name" required>
            </div>
            <div class="form-group">
                <label for="memberEmail">Email</label>
                <input type="email" id="memberEmail" name="email">
            </div>
            <div class="form-group">
                <label for="memberPhone">Phone</label>
                <input type="tel" id="memberPhone" name="phone">
            </div>
            <div class="form-group">
                <label for="memberDepartment">Department</label>
                <select id="memberDepartment" name="department_id">
                    <option value="">Select Department</option>
                </select>
            </div>
            <div class="form-group">
                <label for="memberAddress">Address</label>
                <textarea id="memberAddress" name="address" rows="3"></textarea>
            </div>
        `,
        entity: 'members'
    },
    attendance: {
        title: 'Attendance Management',
        addButton: 'Add Attendance',
        columns: ['#', 'Event', 'Member', 'Check-in Time', 'Status', 'Actions'],
        formFields: `
            <div class="form-group">
                <label for="attendanceEvent">Event</label>
                <select id="attendanceEvent" name="event_id" required>
                    <option value="">Select Event</option>
                </select>
            </div>
            <div class="form-group">
                <label for="attendanceMember">Member</label>
                <select id="attendanceMember" name="member_id" required>
                    <option value="">Select Member</option>
                </select>
            </div>
            <div class="form-group">
                <label for="attendanceStatus">Status</label>
                <select id="attendanceStatus" name="status" required>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                </select>
            </div>
            <div class="form-group">
                <label for="attendanceNotes">Notes</label>
                <textarea id="attendanceNotes" name="notes" rows="3"></textarea>
            </div>
        `,
        entity: 'attendance'
    }
};

// Navigation history stack
let navigationHistory = [];
let currentHistoryIndex = -1;


// Updated the switchView function
function switchView(viewType, addToHistory = true) {
    if (!managementConfig[viewType]) return;
    
    // Save to localStorage
    localStorage.setItem('managementView', viewType);
    
    // Add to navigation history if requested
    if (addToHistory) {
        // Remove any future history if we're navigating back then forward
        if (currentHistoryIndex < navigationHistory.length - 1) {
            navigationHistory = navigationHistory.slice(0, currentHistoryIndex + 1);
        }
        navigationHistory.push(viewType);
        currentHistoryIndex = navigationHistory.length - 1;
        
        // Add to browser history
        window.history.pushState({ view: viewType }, '', `?view=${viewType}`);
    }
    
    // Update menu active state
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === viewType) {
            item.classList.add('active');
        }
    });
    
    // Update content
    const config = managementConfig[viewType];
    document.getElementById('content-display').innerHTML = `
        <div class="content-header">
            <h3>${config.title}</h3>
            <button class="btn-primary" onclick="openModal('${viewType}')">
                <i class="fas fa-plus"></i> ${config.addButton}
            </button>
        </div>
        
        <div class="search-container">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-input" placeholder="${config.addButton.replace('Add ', 'Search ')}...">
            </div>
            <div class="results-count">
                Showing <span id="results-count">0</span> of <span id="total-count">0</span> items
            </div>
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        ${config.columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="${config.columns.length}" class="no-data">
                            Loading data...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="pagination" id="pagination">
            <!-- Pagination buttons will be generated by JavaScript -->
        </div>
        <div class="page-info" id="page-info">
            <!-- Page info will be generated by JavaScript -->
        </div>
    `;
    
    // Reset search and pagination
    currentPage = 1;
    currentSearchTerm = '';
    
    // Initialize search functionality
    initializeSearchAndPagination();
    
    // Load data from server
    loadData(viewType);
}

// Updated the loadData function
async function loadData(type) {
    try {
        const config = managementConfig[type];        
        const response = await fetch(`class/ApiHandler.php?action=getAll&entity=${config.entity}`);
        const data = await response.json();
        
        if (data.success) {
            allData = data.data;
            filterData(); // This will trigger rendering with search and pagination
        } else {
            showError('Failed to load data: ' + data.message);
        }
    } catch (error) {
        showError('Error loading data: ' + error.message);
    }
}

// Updated the DOMContentLoaded event listener for initiallizing the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation history
    const savedView = localStorage.getItem('managementView') || 'locations';
    navigationHistory = [savedView];
    currentHistoryIndex = 0;
    
    // Set up menu item click handlers
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const target = this.dataset.target;
            switchView(target);
        });
    });
    
    // Load the saved view
    switchView(savedView, false);
    
    // Set up browser navigation
    window.addEventListener('popstate', function(event) {
        if (navigationHistory.length > 1) {
            navigateBack();
        }
    });
});
// Navigation functions
function navigateBack() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const previousView = navigationHistory[currentHistoryIndex];
        switchView(previousView, false);
    }
}

function navigateForward() {
    if (currentHistoryIndex < navigationHistory.length - 1) {
        currentHistoryIndex++;
        const nextView = navigationHistory[currentHistoryIndex];
        switchView(nextView, false);
    }
}



// Update table with data
function updateTable(type, data) {
    const config = managementConfig[type];
    const tbody = document.querySelector('.data-table tbody');
    
    if (data && data.length > 0) {
        tbody.innerHTML = data.map((item, index) => {
            let row = `<tr>
                <td>${index + 1}</td>`;
            
            // Add data columns based on entity type
            switch (type) {
                case 'locations':
                    row += `
                        <td>${truncateString(item.name || 'N/A', 5)}</td>                       
                        <td>${truncateString(item.capacity || '', 5)}</td>
                        <td>${truncateString(item.address || '',5)}</td>
                        <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                    `;
                    break;
                    
                case 'departments':
                    row += `
                        <td>${truncateString(item.name || 'N/A', 5)}</td>  
                        <td>${truncateString(item.HOD || '',5)}</td>
                        <td>${truncateString(item.ASS_HOD || '',5)}</td>
                        <td>${truncateString(item.no_members || '0',5)}</td>
                        <td>${truncateString(item.description || '0',5)}</td>
                        <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                    `;
                    break;
                    
                case 'speakers':
                    row += `
                        <td>${truncateString(item.speakers_name || '',5)}</td>
                        <td>${truncateString(item.email || '',5)}</td>
                        <td>${truncateString(item.phone_number || '',5)}</td>
                        <td>${truncateString(item.speciality || '',5)}</td>
                        <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                    `;
                    break;
                    
                case 'events':
                    row += `
                        <td>${item.name || ''}</td>
                        <td>${item.date ? formatDateTime(item.date) : ''}</td>
                        <td>${item.location_name || ''}</td>
                        <td>${item.speaker_name || ''}</td>
                        <td>${item.attendee_count || '0'}</td>
                        <td>${item.created_at ? formatDate(item.created_at) : ''}</td>
                    `;
                    break;
                    
                case 'members':
                    row += `
                        <td>${item.name || ''}</td>
                        <td>${item.email || ''}</td>
                        <td>${item.phone || ''}</td>
                        <td>${item.department_name || ''}</td>
                        <td>${item.join_date ? formatDate(item.join_date) : ''}</td>
                    `;
                    break;
                    
                case 'attendance':
                    row += `
                        <td>${item.event_name || ''}</td>
                        <td>${item.member_name || ''}</td>
                        <td>${item.check_in_time ? formatDateTime(item.check_in_time) : ''}</td>
                        <td>${item.status || ''}</td>
                    `;
                    break;
            }
            
            // Add action buttons
            row += `
                <td class="action-buttons">
                    <button class="btn-icon" onclick="viewItem('${type}', ${item.id})">
                       <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="editItem('${type}', ${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteItem('${type}', ${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            
            return row;
        }).join('');
    } else {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length}" class="no-data">No data found</td></tr>`;
    }
}

// Handle form submission
document.getElementById('managementForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const type = formData.get('type');
    const id = formData.get('id');
    const action = id ? 'update' : 'create';
    const config = managementConfig[type];
    
    // Convert FormData to JSON
    const jsonData = {};
    formData.forEach((value, key) => {
        if (key !== 'type' && key !== 'id') {
            jsonData[key] = value;
        }
    });
    
    try {
        const methods = id ? 'PUT' : 'POST'; 
        const url = `class/ApiHandler.php?action=${action}&entity=${config.entity}${id ? '&id=' + id : ''}`;
        const response = await fetch(url, {
            method: methods,
            // method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal();
            loadData(type);
            showSuccess(id ? 'Updated successfully' : 'Created successfully');
        } else {
            showError('Operation failed: ' + result.message);
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
});

// View item
async function viewItem(type, id) {
    

    try {
        const config = managementConfig[type];
        const response = await fetch(`class/ApiHandler.php?action=get&entity=${config.entity}&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const item = data.data;
            showItemDetails(type, item); // Call the modal display function
        } else {
            showError('View failed: ' + data.message);
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

function showItemDetails(type, item) {
    const modal = document.getElementById('itemDetailsModal');
    const overlay = document.getElementById('overlay');
    const content = modal.querySelector('.modal-content');

    // Clear previous content
    content.innerHTML = '';

    // Build the content based on item type
    let htmlContent = `<h2>${type.charAt(0).toUpperCase() + type.slice(1)} Details</h2>`;
    htmlContent += '<table>';

    switch (type) {
        case 'locations':
            htmlContent += `
                <tr><th>Name</th><td>${item.name || 'N/A'}</td></tr>
                <tr><th>Capacity</th><td>${item.capacity || 'N/A'}</td></tr>
                <tr><th>Address</th><td>${item.address || 'N/A'}</td></tr>
            `;
            break;
            
        case 'departments':
            htmlContent += `
                <tr><th>Name</th><td>${item.name || 'N/A'}</td></tr>
                <tr><th>HOD</th><td>${item.HOD || 'N/A'}</td></tr>
                <tr><th>Assistant HOD</th><td>${item.ASS_HOD || 'N/A'}</td></tr>
                <tr><th>Description</th><td>${item.description || 'N/A'}</td></tr>
                <tr><th>No. of Members</th><td>${item.no_members || 'N/A'}</td></tr>
            `;
            break;
            
        case 'speakers':
            htmlContent += `
                <tr><th>Name</th><td>${item.speakers_name || 'N/A'}</td></tr>
                <tr><th>Email</th><td>${item.email || 'N/A'}</td></tr>
                <tr><th>Phone</th><td>${item.phone_number || 'N/A'}</td></tr>
                <tr><th>Specialty</th><td>${item.speciality || 'N/A'}</td></tr>
            `;
            break;
    }

    htmlContent += '</table>';
    content.innerHTML = htmlContent;

    // Show the modal and overlay
    overlay.style.display = 'block';
    modal.style.display = 'block';
}
function truncateString(str, maxLength) {
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '...';
    }
    return str;
}








document.querySelector('.close-modal').addEventListener('click', () => {
    // Close modal and overlay
    document.getElementById('itemDetailsModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
});


// Delete item
async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const config = managementConfig[type];
        const response = await fetch(`class/ApiHandler.php?action=delete&entity=${config.entity}&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadData(type);
            showSuccess('Item deleted successfully');
        } else {
            showError('Delete failed: ' + result.message);
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

// Modal functions
function openModal(type, id = null) {
    const modal = document.getElementById('managementModal');
    const modalTitle = document.getElementById('modalTitle');
    const formFields = document.getElementById('formFields');
    const itemType = document.getElementById('itemType');
    const itemId = document.getElementById('itemId');
    
    modalTitle.textContent = id ? `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}` : `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    itemType.value = type;
    itemId.value = id || '';
    
    // Set form fields based on type
    formFields.innerHTML = managementConfig[type].formFields;
    document.getElementById('save-btn').innerHTML = id ? `Edit ${managementConfig[type].entity} ` : managementConfig[type].addButton;
    
    // If editing, load existing data
    if (id) {
        loadItemData(type, id);
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('managementModal');
    modal.style.display = 'none';
    document.getElementById('managementForm').reset();
}

// Load item data for editing
async function loadItemData(type, id) {
    try {
        const config = managementConfig[type];
        const response = await fetch(`class/ApiHandler.php?action=get&entity=${config.entity}&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const item = data.data;
            
            // Populate form fields based on type
            switch (type) {
                case 'locations':
                    document.getElementById('locationName').value = item.name || '';
                    document.getElementById('locationCapacity').value = item.capacity || '';
                    document.getElementById('locationAddress').value = item.address || '';
                    break;
                    
                case 'departments':
                    document.getElementById('name').value = item.name || '';
                    document.getElementById('HOD').value = item.HOD || '';
                    document.getElementById('ASS_HOD').value = item.ASS_HOD || '';
                    document.getElementById('description').value = item.description || '';
                    document.getElementById('no_members').value = item.no_members || '';   
                    break;
                    
                case 'speakers':
                    document.getElementById('speakers_name').value = item.speakers_name || '';
                    document.getElementById('email').value = item.email || '';
                    document.getElementById('phone_number').value = item.phone_number || '';
                    document.getElementById('speciality').value = item.speciality || '';
                    break;
                    
                
            }
        } else {
            showError('Failed to load item data');
        }
    } catch (error) {
        showError('Error loading item: ' + error.message);
    }
}

// Edit item function
function editItem(type, id) {
    openModal(type, id);
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
}





// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('managementModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Global variables for pagination and search
let currentPage = 1;
const itemsPerPage = 4;
let allData = [];
let filteredData = [];
let currentSearchTerm = '';


// Search and Pagination Functions
function initializeSearchAndPagination() {
    // Set up search input handler
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.toLowerCase();
            currentPage = 1;
            filterData();
        });
    }
}

function filterData() {
    if (currentSearchTerm === '') {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(item => {
            // Search through all string properties of the item
            return Object.values(item).some(value => 
                String(value).toLowerCase().includes(currentSearchTerm)
            );
        });
    }
    renderTable();
    renderPagination();
    updateResultsCount();
}

function renderTable() {
    const config = managementConfig[navigationHistory[currentHistoryIndex]];
    const tbody = document.querySelector('.data-table tbody');
    
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length}" class="no-data">No data found</td></tr>`;
        return;
    }
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    tbody.innerHTML = filteredData.slice(startIndex, endIndex).map((item, index) => {
        const globalIndex = startIndex + index + 1;
        let row = `<tr>
            <td>${globalIndex}</td>`;
        
        // Add data columns based on entity type
        const type = navigationHistory[currentHistoryIndex];
        switch (type) {
            case 'locations':
                row += `
                    <td>${truncateString(item.name || 'N/A', 5)}</td>                       
                    <td>${truncateString(item.capacity || '', 5)}</td>
                    <td>${truncateString(item.address || '',5)}</td>
                    <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                `;
                break;
                
            case 'departments':
                row += `
                    <td>${truncateString(item.name || 'N/A', 5)}</td>  
                    <td>${truncateString(item.HOD || '',5)}</td>
                    <td>${truncateString(item.ASS_HOD || '',5)}</td>
                    <td>${truncateString(item.no_members || '0',5)}</td>
                    <td>${truncateString(item.description || '0',5)}</td>
                    <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                `;
                break;
                
            case 'speakers':
                row += `
                    <td>${truncateString(item.speakers_name || '',5)}</td>
                    <td>${truncateString(item.email || '',5)}</td>
                    <td>${truncateString(item.phone_number || '',5)}</td>
                    <td>${truncateString(item.speciality || '',5)}</td>
                    <td>${truncateString(item.created_at ? formatDate(item.created_at) : '',5)}</td>
                `;
                break;
                
            case 'events':
                row += `
                    <td>${item.name || ''}</td>
                    <td>${item.date ? formatDateTime(item.date) : ''}</td>
                    <td>${item.location_name || ''}</td>
                    <td>${item.speaker_name || ''}</td>
                    <td>${item.attendee_count || '0'}</td>
                    <td>${item.created_at ? formatDate(item.created_at) : ''}</td>
                `;
                break;
                
            case 'members':
                row += `
                    <td>${item.name || ''}</td>
                    <td>${item.email || ''}</td>
                    <td>${item.phone || ''}</td>
                    <td>${item.department_name || ''}</td>
                    <td>${item.join_date ? formatDate(item.join_date) : ''}</td>
                `;
                break;
                
            case 'attendance':
                row += `
                    <td>${item.event_name || ''}</td>
                    <td>${item.member_name || ''}</td>
                    <td>${item.check_in_time ? formatDateTime(item.check_in_time) : ''}</td>
                    <td>${item.status || ''}</td>
                `;
                break;
        }
        
        // Add action buttons
        row += `
            <td class="action-buttons">
                <button class="btn-icon" onclick="viewItem('${type}', ${item.id})">
                   <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="editItem('${type}', ${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteItem('${type}', ${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
        
        return row;
    }).join('');
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pageInfo.textContent = '';
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            renderPagination();
        }
    });
    pagination.appendChild(prevButton);
    
    // Page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderTable();
            renderPagination();
        });
        pagination.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            renderPagination();
        }
    });
    pagination.appendChild(nextButton);
    
    // Page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    const totalCount = document.getElementById('total-count');
    
    if (resultsCount && totalCount) {
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);
        
        resultsCount.textContent = filteredData.length === 0 ? '0' : `${startIndex}-${endIndex}`;
        totalCount.textContent = filteredData.length;
    }
}

function updateSearchPlaceholder(type) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const placeholders = {
        locations: "Search locations...",
        departments: "Search departments...",
        speakers: "Search speakers...",
        events: "Search events...",
        members: "Search members...",
        attendance: "Search attendance..."
    };
    
    searchInput.placeholder = placeholders[type] || "Search...";
}