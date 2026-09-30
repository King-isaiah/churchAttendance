// Function to render RSVP table
function renderRSVPTable(data, startIndex) {
    const tableBody = document.getElementById('rsvpTableBody');
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">No RSVP responses found</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    data.forEach((response, index) => {
    const globalIndex = startIndex + index + 1;
    const attendingClass = response.attending === 1 ? 'check-circle' : 
                        response.attending === 2 ? 'times-circle' : 
                        response.attending === 3 ? 'question-circle' : 'exclamation-circle';
    const attendingText = response.attending === 1 ? 'Attending' : 
                      response.attending === 2 ? 'Not Attending' : 
                      response.attending === 3 ? 'Maybe' : 'Pending';
        
        html += `
            <tr data-response="${(response.notes || '').toLowerCase()}">
                <td>${globalIndex}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar" style="background-color: #4CAF50">
                            ${globalIndex}
                        </div>
                        <div class="user-details">
                            <strong>User ${response.unique_id || 'N/A'}</strong>
                            <small>${response.email || 'No email'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${response.attending || '0'}">
                        <i class="fas fa-${attendingClass}"></i>
                        ${attendingText}
                    </span>
                </td>
                <td>
                    ${response.notes 
                        ? escapeHtml(response.notes.length > 50 ? response.notes.substring(0, 50) + '...' : response.notes)
                        : '<span style="color: #6c757d; font-style: italic;">No comment</span>'}
                </td>
                <td>
                    ${response.user_name 
                        ? escapeHtml(response.user_name.length > 10 ? response.user_name.substring(0, 10) + '...' : response.user_name)
                        : '<span style="color: #6c757d; font-style: italic;">No username</span>'}
                </td>
                <td>
                    ${(response.first_name || response.last_name) 
                        ? escapeHtml(`${response.first_name || ''} ${response.last_name || ''}`.trim())
                        : '<span style="color: #6c757d; font-style: italic;">No name</span>'}
                </td>
                <td>
                    ${response.dated 
                        ? formatDateTime(response.dated)
                        : '<span style="color: #6c757d; font-style: italic;">Not responded</span>'}
                </td>
                <td>
                    ${response.guest_count && response.guest_count > 0 
                        ? response.guest_count + ' guest(s)'
                        : '<span style="color: #6c757d; font-style: italic;">No guest</span>'}
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Initialize pagination when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize pagination with RSVP data
    const paginationConfig = {
        containerId: 'pagination',
        pageInfoId: 'page-info',
        resultsCountId: 'results-count',
        totalCountId: 'total-count',
        itemsPerPage: 5
    };
    
    // Create pagination instance
    const rsvpPagination = new PaginationSystem(paginationConfig);
    
    // Initialize with data and render function
    rsvpPagination.initialize(rsvpData, renderRSVPTable);
    
    // Store pagination instance globally for filter functions
    window.rsvpPagination = rsvpPagination;
    
    // Add items per page selector
    addItemsPerPageSelector(rsvpPagination);
});

// Function to add items per page selector
function addItemsPerPageSelector(pagination) {
    const paginationContainer = document.querySelector('.pagination-container');
    
    if (paginationContainer) {
        // Create items per page selector
        const itemsPerPageDiv = document.createElement('div');
        itemsPerPageDiv.className = 'items-per-page-selector';
        itemsPerPageDiv.innerHTML = `
            <label>Show:</label>
            <select id="itemsPerPage" onchange="changeItemsPerPage(this.value)">
                <option value="5" selected>5</option>
                <option value="10" >10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
            <span>per page</span>
        `;
        
        paginationContainer.insertBefore(itemsPerPageDiv, paginationContainer.firstChild);
    }
}

// Function to change items per page
function changeItemsPerPage(count) {
    if (window.rsvpPagination) {
        window.rsvpPagination.setItemsPerPage(parseInt(count));
    }
}
// filterResponses function to work with pagination
function filterResponses() {
    const searchTerm = document.getElementById('rsvpSearch').value.toLowerCase();
    const filterValue = document.getElementById('responseFilter').value;
    
    if (window.rsvpPagination) {
        // Define custom filter function
        const customFilterFn = (item) => {            
            const searchMatch = searchTerm === '' ||                 
                (item.user_name && item.user_name.toLowerCase().includes(searchTerm)) ||
                (item.email && item.email.toLowerCase().includes(searchTerm)) ||
                (item.first_name && item.first_name.toLowerCase().includes(searchTerm)) ||
                (item.last_name && item.last_name.toLowerCase().includes(searchTerm)) ||
                (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
                (item.unique_id && item.unique_id.toString().includes(searchTerm));
            
            if (!searchMatch) return false;
            
            // Then check filter value
            if (filterValue === 'all') return true;
            
            // Map filter values to attending values
            const filterMap = {
                'attending': 1,
                'not-attending': 2,
                'maybe': 3,
                'pending': 0
            };
            
            const filterValueNum = filterMap[filterValue];
            return item.attending === filterValueNum;
        };
        
        // Apply filter using pagination system
        window.rsvpPagination.filterData(searchTerm, '', customFilterFn);
    }
}


// Also update the search input to work with pagination
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('rsvpSearch');
    if (searchInput) {
        // Add debounce to search
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterResponses();
            }, 300);
        });
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    const eventModal = document.getElementById('eventModal');
    const viewEventModal = document.getElementById('viewMoreModal');
    
    if (event.target === eventModal) {
        closeEventModal();
    }
    if (event.target === viewEventModal) {
        closeViewEventModal();
    }
};
// Close view event modal
function closeViewEventModal() {
    const modal = document.getElementById('viewMoreModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
        }
       
// View event details
async function viewMore(eventId) {
    try {
        const response = await fetch(`class/ApiHandler.php?action=get&entity=rsvp&id=${eventId}`);
        const data = await response.json();
        
        if (data.success) {
            const event = data.data;
            showMoreDetails(event);
        } else {
            handleApiError(data, 'load  data');
        }
    } catch (error) {
        showError('Error loading response: ' + error.message);
    }
}

function showMoreDetails(event) {
    const modal = document.getElementById('viewMoreModal');
    const modalTitle = document.getElementById('viewModalTitle');
    const detailsContainer = document.getElementById('viewEventDetails');
    
    modalTitle.textContent = 'Event Details';
    
    // const departmentName = event.department_name || 'All Departments';
    // const departmentColor = getDepartmentColor(departmentName);
    
    detailsContainer.innerHTML = `
        <div class="event-details">
            <div class="detail-row">
                <label>Members Id:</label>
                <span>${escapeHtml(event.uniqued)}</span>
            </div>
            <div class="detail-row">
                <label>Expected Guest:</label>
                <span>${escapeHtml(event.guest_count)}</span>
            </div>
            <div class="detail-row">
                <label>Comment:</label>
                <span>${event.comments}</span>
            </div>
            <div class="detail-row">
                <label>Date/Time:</label>
                <span>${formatTime(event.dated)}</span>
            </div>
            <div class="detail-row">
                <label>Username:</label>
                <span>${escapeHtml(event.user_name)}</span>
            </div>
            
            <div class="detail-row">
                <label>Members Email:</label>
                <span>${event.email}</span>
            </div>
            <div class="detail-row">
                <label>Phone Number:</label>
                <span>${event.phone}</span>
            </div>
            
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}
// Initialize charts
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    setupResponsive();
});

// Setup responsive features
function setupResponsive() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.querySelector('.mobile-responses').style.display = 'block';
        document.querySelector('.desktop-table-container').style.display = 'none';
    } else {
        document.querySelector('.mobile-responses').style.display = 'none';
        document.querySelector('.desktop-table-container').style.display = 'block';
    }
}



// Toggle mobile menu
function toggleMobileMenu() {
    alert('Mobile menu would open here');
}

// Toggle FAB menu
function toggleFABMenu() {
    document.getElementById('fabMenu').classList.toggle('show');
}

// Export data
function exportRSVPData() {
    alert('Export functionality would be implemented here');
}

// View response details
function viewResponseDetails(id) {
    alert('Viewing response details for ID: ' + id);
}

// Contact user
function contactUser(email) {
    if (email) {
        window.location.href = 'mailto:' + email;
    } else {
        alert('No email address available');
    }
}

// Handle window resize
window.addEventListener('resize', setupResponsive);