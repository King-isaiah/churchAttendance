// Global variables for pagination
let currentPage = 1;
const itemsPerPage = 5;
let allMembers = [];
let filteredMembers = [];
let currentSearchTerm = '';
let currentDepartmentFilter = '';

// Department color palette (11 distinct colors)
const departmentColors = [
    '#8786E3', '#FF9F40', '#36A2EB', '#4BC0C0', '#FF6384',
    '#9966FF', '#FFCD56', '#C9CBCF', '#4D5360', '#FF6B6B',
    '#51CF66'
];

// Map to store department-color assignments
let departmentColorMap = {};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    initializeSearchAndPagination();
    
    // Add event listener for Add Member button
    document.querySelector('.btn-primary').addEventListener('click', function() {
        openMemberModal();
    });
});

// Load members from database
async function loadMembers() {
    try {
        showLoading();
        const response = await fetch('class/ApiHandler.php?action=getAll&entity=members');
        const data = await response.json();
        
        if (data.success) {
            allMembers = data.data;
            // Initialize department color mapping
            initializeDepartmentColors();
            filterMembers();
        } else {
            handleApiError(data, 'load members');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Initialize department colors
function initializeDepartmentColors() {
    departmentColorMap = {};
    const departments = [...new Set(allMembers.map(member => member.department_name))];
    
    departments.forEach((dept, index) => {
        if (dept && dept !== 'No Department') {
            departmentColorMap[dept] = departmentColors[index % departmentColors.length];
        }
    });
}

// Get color for a department
function getDepartmentColor(departmentName) {
    if (!departmentName || departmentName === 'No Department') {
        return '#C9CBCF'; // Default gray for no department
    }
    return departmentColorMap[departmentName] || '#C9CBCF';
}

// Initialize search and pagination
function initializeSearchAndPagination() {
    const searchInput = document.getElementById('memberSearch');
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearchTerm = this.value.toLowerCase();
            currentPage = 1;
            filterMembers();
        });
    }
    
    if (departmentFilter) {
        departmentFilter.addEventListener('change', function() {
            currentDepartmentFilter = this.value;
            currentPage = 1;
            filterMembers();
        });
    }
}

// Filter members based on search and department
function filterMembers() {
    if (currentSearchTerm === '' && currentDepartmentFilter === '') {
        filteredMembers = [...allMembers];
    } else {
        filteredMembers = allMembers.filter(member => {
            const matchesSearch = currentSearchTerm === '' || 
                Object.values(member).some(value => 
                    String(value).toLowerCase().includes(currentSearchTerm)
                );
            
            const matchesDepartment = currentDepartmentFilter === '' || 
                String(member.department_id) === currentDepartmentFilter;
            
            return matchesSearch && matchesDepartment;
        });
    }
    renderTable();
    renderPagination();
}

// Render the table with paginated data
function renderTable() {
    const tbody = document.getElementById('memberTable');
    
    if (!tbody) return;
    
    if (filteredMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No members found</td></tr>';
        return;
    }
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMembers.length);
    
    tbody.innerHTML = filteredMembers.slice(startIndex, endIndex).map((member, index) => {
        const globalIndex = startIndex + index + 1;
        const departmentName = member.department_name || 'No Department';
        const departmentColor = getDepartmentColor(departmentName);
        
        return `
            <tr data-member-id="${member.id}">
                <td>${escapeHtml(member.user_name)}</td>
                <td>${escapeHtml(member.first_name + ' ' + member.last_name)}</td>
                <td>${escapeHtml(member.email || 'N/A')}</td>
                <td>${escapeHtml(member.phone || 'N/A')}</td>
                <td>
                    <span class="department-badge" style="background-color: ${departmentColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 500;">
                        ${escapeHtml(departmentName)}
                    </span>
                </td>
                <td>${formatDate(member.join_date || member.created_at)}</td>
                <td class="action-buttons">
                    <button class="btn-icon" onclick="editMember(${member.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteMember(${member.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render pagination controls (using management.js style)
function renderPagination() {
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    
    if (totalPages <= 1) {
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
    
    // Add page info (like management.js)
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(pageInfo);
}

// Modal functions - FIXED with management.js style
function openMemberModal(memberId = null) {
    const modal = document.getElementById('memberModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitButton = document.getElementById('submitButton');
    
    // Reset form first
    document.getElementById('memberForm').reset();
    document.getElementById('memberId').value = '';
    
    if (memberId) {
        modalTitle.textContent = 'Edit Member';
        submitButton.textContent = 'Update Member';
        loadMemberData(memberId);
    } else {
        modalTitle.textContent = 'Add New Member';
        submitButton.textContent = 'Add Member';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeMemberModal() {
    const modal = document.getElementById('memberModal');
    modal.style.display = 'none';
    document.getElementById('memberForm').reset();
    document.getElementById('memberId').value = '';
    document.body.style.overflow = 'auto'; // Re-enable body scrolling
}

// Load member data for editing
async function loadMemberData(id) {
    try {
        const response = await fetch(`class/ApiHandler.php?action=get&entity=members&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const member = data.data;
            document.getElementById('memberId').value = member.id;
            document.getElementById('userName').value = member.user_name || '';
            document.getElementById('firstName').value = member.first_name || '';
            document.getElementById('lastName').value = member.last_name || '';
            document.getElementById('email').value = member.email || '';
            document.getElementById('phone').value = member.phone || '';
            document.getElementById('password').value = member.password || '';
            // document.getElementById('department').value = member.department_id || '';
            document.getElementById('joinDate').value = member.join_date || '';

            // Error: Error loading member: t is not defined

            const additionalDepartments = document.getElementById('additionalDepartments');
            additionalDepartments.innerHTML = '';
            departmentCounter = 1;
            
            let departmentIds = [];
            
            if (member.department_id) {
                try {               
                    if (typeof member.department_id === 'string' && 
                        (member.department_id.startsWith('[') || member.department_id.startsWith('"'))) {
                        departmentIds = JSON.parse(member.department_id);
                    } else {                       
                        departmentIds = [parseInt(member.department_id)];
                    }
                } catch (e) {                 
                    departmentIds = [parseInt(member.department_id)];
                }
            }
            
            // Set the first department field
            if (departmentIds.length > 0) {
                document.getElementById('memberDepartment1').value = departmentIds[0];
                
                // Show remove button on first field if there are multiple departments
                if (departmentIds.length > 1) {
                    document.querySelector('#departmentField1 .remove-department').style.display = 'block';
                }
                
                for (let i = 1; i < departmentIds.length; i++) {
                    addDepartmentField(); 
                    const newSelect = document.getElementById('memberDepartment' + (i + 1));
                    if (newSelect) {
                        newSelect.value = departmentIds[i];
                    }
                }
            } else {
                // No departments selected
                document.getElementById('memberDepartment1').value = '';
                document.querySelector('#departmentField1 .remove-department').style.display = 'none';
            }
        } else {
            handleApiError(data, 'load member data');
        }
    } catch (error) {
        showError('Error loading member: ' + error.message);
    }
}

// Handle form submission
async function handleMemberSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const memberId = formData.get('id');
    const action = memberId ? 'update' : 'create';    
    const jsonData = {};
    const departmentValues = formData.getAll('department_id');
    if (departmentValues.includes('')) {
        showWarning('pls pick a department')
    }else {       
        const validDepartments = departmentValues
            .filter(val => val !== '' && val !== '0')
            .map(val => parseInt(val));
        
        console.log('Valid departments:', validDepartments);
        
        if (validDepartments.length === 0) {
            jsonData.department_id = null;
        } else if (validDepartments.length === 1) {
            jsonData.department_id = validDepartments[0];
        } else {
            jsonData.department_id = validDepartments;
        }
    }

    formData.forEach((value, key) => {
        if (key !== 'id' && key !== 'department_id' && value !== '') {
            jsonData[key] = value;
        }
    });
      
    try {
        const method = memberId ? 'PUT' : 'POST';
        const url = `class/ApiHandler.php?action=${action}&entity=members${memberId ? '&id=' + memberId : ''}`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(memberId ? 'Member updated successfully!' : 'Member created successfully!');
            closeMemberModal();
            loadMembers(); 
        } else {
            handleApiError(result, action);
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

// Delete member
async function deleteMember(id) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    
    try {
        const response = await fetch(`class/ApiHandler.php?action=delete&entity=members&id=${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Member deleted successfully!');
            loadMembers(); // Reload the data
        } else {
            handleApiError(result, 'delete member');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

// Edit member
function editMember(id) {
    openMemberModal(id);
}

// Utility functions
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function showLoading() {
    const tbody = document.getElementById('memberTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Loading...</td></tr>';
    }
}

function hideLoading() {
    // Hide loading spinner if implemented
}



// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('memberModal');
    if (event.target === modal) {
        closeMemberModal();
    }
};