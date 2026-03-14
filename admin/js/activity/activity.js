class ActivitiesCarousel {
    constructor() {
        this.carousel = document.getElementById('activitiesCarousel');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.navDots = document.getElementById('navDots');
        this.carouselCounter = document.getElementById('carouselCounter');
        this.carouselInfo = document.getElementById('carouselInfo');
        this.currentActivityCount = document.getElementById('currentActivityCount');
        this.totalActivityCount = document.getElementById('totalActivityCount');
        this.filteredCount = document.getElementById('filteredCount');
        this.addDepartmentBtn = document.getElementById('addDepartmentBtn');
        
        this.currentIndex = 0;
        this.cards = Array.from(this.carousel.querySelectorAll('.activity-card'));
        this.totalCards = this.cards.length;
        this.filteredCards = this.cards;
        this.departmentCounter = 1;
        this.maxDepartments = 7;
        
        this.init();
    }
    
    init() {
        this.createNavigationDots();
        this.updateNavigation();
        this.attachEventListeners();
        this.updateCarousel();
        this.addDepartmentBtn.addEventListener('click', () => this.addDepartmentField());
    }
async refreshDepartmentSelects() {
    const department  = await fetch('class/ApiHandler.php?entity=departments&action=getAll');
    const departmentData = await department.json();
    // Get all currently selected department IDs
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) {
            selectedDepartments.push(value);
        }
    });
    
    const allDepartments = departmentData
    
    document.querySelectorAll('.department-select').forEach(select => {
        const currentValue = select.value;
    
        let optionsHTML = '<option value="">Select Department</option>';  
        
        // Add department options
        allDepartments.data.forEach(dept => {
            if (!selectedDepartments.includes(dept.id) || parseInt(currentValue) === dept.id) {
                optionsHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
            }
        });
        
        select.innerHTML = optionsHTML;
        if (currentValue || currentValue === '0') {
            select.value = currentValue;
        }
    });
}
// Function to remove ALL extra departments
removeAllExtraDepartments() {
    const extraFields = document.querySelectorAll('.extra-department');
    
    extraFields.forEach(field => {
        field.remove();
    });
    
    this.departmentCounter = 1;
    document.querySelector('#originalDepartment .remove-department').style.display = 'none';
    document.getElementById('addDepartmentBtn').disabled = false;
    
    // Reset original field to "Select Department"
    document.querySelector('#originalDepartment select').value = '';
    
    refreshDepartmentSelects();
}

removeDepartmentField(button) {
    const field = button.closest('.department-field');
   
    if (field.id === 'originalDepartment') {   
        field.querySelector('select').value = '';
        return;
    }
    
    // Remove the extra field
    field.remove();
    this.departmentCounter--;
    
    if (this.departmentCounter === 1) {
        document.querySelector('#originalDepartment .remove-department').style.display = 'none';
    }
    
    // Enable add button
    document.getElementById('addDepartmentBtn').disabled = false;
    
    // Refresh all selects to restore removed department as an option
    this.refreshDepartmentSelects();
}

async addDepartmentField() {      
    const department  = await fetch('class/ApiHandler.php?entity=departments&action=getAll');
    const departmentData = await department.json();
    if (this.departmentCounter >= this.maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
        alert('Maximum of 7 departments reached');
        return;
    }
    
    this.departmentCounter++;
    const container = document.getElementById('additionalDepartments');
    
    const selectedDepartments = [];
    document.querySelectorAll('.department-select').forEach(select => {
        const value = parseInt(select.value);
        if (value && value > 0) {
            selectedDepartments.push(value);
        }
    });
    
    const allDepartments = departmentData;
    console.log(allDepartments)
    
    // Create new department field with class "extra-department"
    const newField = document.createElement('div');
    newField.className = 'form-group department-field extra-department';
    newField.id = 'departmentField' + this.departmentCounter;
    
    // Build the select options HTML
    let optionsHTML = '<option value="">Select Department</option>';
    
    allDepartments.data.forEach(dept => {
        if (!selectedDepartments.includes(dept.id)) {
            optionsHTML += `<option value="${dept.id}">${escapeHtml(dept.name)}</option>`;
        }
    });
    
    newField.innerHTML = `
        <div class="form-group">
            <label for="eventDepartment${this.departmentCounter}"></label>
            <select id="eventDepartment${this.departmentCounter}" name="department_id[]" class="department-select">
                ${optionsHTML}
            </select>
        </div>
        <button type="button" class="remove-department" onclick="this.removeDepartmentField(this)">−</button>
    `;
    
    container.appendChild(newField);
    
    // Show remove button on first field if there are extras
    // if (this.departmentCounter >= 2) {
    //     document.querySelector('#originalDepartment .remove-department').style.display = 'block';
    // }
    
    // Disable button if max reached
    if (this.departmentCounter >= maxDepartments) {
        document.getElementById('addDepartmentBtn').disabled = true;
    }
    
    this.refreshDepartmentSelects();
} 
 
    createNavigationDots() {
        this.navDots.innerHTML = '';
        
        for (let i = 0; i < this.totalCards; i++) {
            const dot = document.createElement('div');
            dot.className = `nav-dot ${i === 0 ? 'active' : ''}`;
            dot.dataset.index = i;
            dot.addEventListener('click', () => this.goToCard(i));
            this.navDots.appendChild(dot);
        }
    }
    
    attachEventListeners() {
        this.prevBtn.addEventListener('click', () => this.prevCard());
        this.nextBtn.addEventListener('click', () => this.nextCard());
              
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prevCard();
            if (e.key === 'ArrowRight') this.nextCard();
        });
    }
    
    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }
    
    nextCard() {
        if (this.currentIndex < this.filteredCards.length - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }
    
    goToCard(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    updateCarousel() {
        // Hide all cards first
        this.cards.forEach(card => {
            card.style.display = 'none';
            card.classList.remove('active');
        });
        
        // Show only the current filtered card
        if (this.filteredCards.length > 0 && this.filteredCards[this.currentIndex]) {
            this.filteredCards[this.currentIndex].style.display = 'block';
            this.filteredCards[this.currentIndex].classList.add('active');
        }
        
        this.updateNavigation();
        this.updateDots();
        this.updateCounters();
    }
    
    updateDots() {
        const dots = this.navDots.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
            dot.style.display = index < this.filteredCards.length ? 'block' : 'none';
        });
    }
    
    updateNavigation() {
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === this.filteredCards.length - 1;
    }
    
    updateCounters() {
        const visibleCount = this.filteredCards.length;
        this.currentActivityCount.textContent = visibleCount > 0 ? this.currentIndex + 1 : 0;
        this.totalActivityCount.textContent = visibleCount;
        this.filteredCount.textContent = visibleCount;
        this.carouselCounter.textContent = `${this.currentIndex + 1} of ${visibleCount}`;
        this.carouselInfo.innerHTML = `Showing ${this.currentIndex + 1} of ${visibleCount} activities<br>
                                      <span class="result-count">${visibleCount} results</span>`;
    }
    
    filterCards(filteredCards) {
        this.filteredCards = filteredCards;
        this.currentIndex = 0;
        this.updateCarousel();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carousel = new ActivitiesCarousel();
    
    // Load dynamic chart data
    loadChartData();
    
    // Modal functionality
    const modal = document.getElementById('createActivityModal');
    const createBtn = document.getElementById('createActivityBtn');
    const closeBtns = document.querySelectorAll('.close-modal');
    
    createBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });
    
    closeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Form submission
    document.getElementById('activityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const departmentSelects = document.querySelectorAll('select[name="department_id[]"]');
        const departmentIds = [];
        
        departmentSelects.forEach(select => {
            const value = select.value.trim();
            if (value && value !== "") {
                departmentIds.push(value);
            }
        });
        const formData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            category_id: document.getElementById('category').value,            
            dayofactivity: document.getElementById('dayofactivity').value,
            time: document.getElementById('time').value,
            time_exp: document.getElementById('time_exp').value,
            location_id: document.getElementById('location_id').value,
            attendance_method_id: document.getElementById('attendance_method_id').value,
            // target_audience: document.getElementById('target_audience').value,
            target_audience: 'target_audience',
            expected_count: document.getElementById('expected_count').value,
            status_id: document.getElementById('status_id').value,
            department_id: departmentIds,
        };
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        submitBtn.disabled = true;
        
        fetch('class/ApiHandler.php?entity=activities&action=create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Activity created successfully!', 'success');
                modal.style.display = 'none';
                this.reset();
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showError('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showError('Network error: ' + error, 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
    
    // Enhanced Filter functionality
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('activitySearch');
    const dateFilter = document.getElementById('dateFilter');
    const allCards = Array.from(document.querySelectorAll('.activity-card'));
    
    function filterActivities() {
        const categoryValue = categoryFilter.value;
        const statusValue = statusFilter.value;
        const searchValue = searchInput.value.toLowerCase();
        const dateValue = dateFilter.value;
        
        const filteredCards = allCards.filter(card => {
            const matchesCategory = categoryValue === 'all' || card.dataset.category === categoryValue;
            const matchesStatus = statusValue === 'all' || card.dataset.status === statusValue;
            const matchesSearch = card.dataset.search.includes(searchValue);
            const matchesDate = !dateValue;
            
            return matchesCategory && matchesStatus && matchesSearch && matchesDate;
        });
        
        // Update carousel with filtered cards
        carousel.filterCards(filteredCards);
    }
    
    // Debounce search for better performance
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterActivities, 300);
    });
    
    categoryFilter.addEventListener('change', filterActivities);
    statusFilter.addEventListener('change', filterActivities);
    dateFilter.addEventListener('change', filterActivities);
    
    // Initialize filters on page load
    filterActivities();
    
    // View details functionality
    document.querySelectorAll('.view-details-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            viewActivityDetails(activityId);
        });
    });
    
    // Edit functionality
    document.querySelectorAll('.edit-activity-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            editActivity(activityId);
        });
    });
    // Delete functionality
    document.querySelectorAll('.delete-activity-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            deleteActivity(activityId);
        });
    });
    // QR functionality - UPDATED VERSION
    document.querySelectorAll('.generate-qr-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            const attendanceMethod = this.dataset.attendanceMethod;
            showQRCodeModal(activityId);
        });
    });

   
   
    
    // Live session buttons
    document.querySelectorAll('.live-session-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            alert('Starting live session for activity ID: ' + activityId);
        });
    });
});


// Add chart instance variable at the top
let categoriesChart = null;

// Dynamic Chart Function
async function loadChartData() {
    try {
        const categoriesCtx = document.getElementById('categoriesChart');
        
        if (!categoriesCtx) {
            console.warn('Chart canvas element not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (categoriesChart) {
            categoriesChart.destroy();
            categoriesChart = null;
        }
        
        const ctx = categoriesCtx.getContext('2d');
        
        // Fetch categories from API
        const categoriesResponse = await fetch('class/ApiHandler.php?entity=categories&action=getAll');
        const categoriesData = await categoriesResponse.json();
        
        // Fetch activities from API
        const activitiesResponse = await fetch('class/ApiHandler.php?entity=activities&action=getAll');
        const activitiesData = await activitiesResponse.json();
        
        if (categoriesData.success && activitiesData.success) {
            // Count activities by category
            const categoryCounts = {};
            activitiesData.data.forEach(activity => {
                const category = activity.category;
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            // Prepare chart data
            const chartLabels = [];
            const chartData = [];

            categoriesData.data.forEach(category => {
                const categoryName = category.categories || category.name || category;
                if (categoryName && categoryName !== 'All') {
                    chartLabels.push(categoryName);
                    chartData.push(categoryCounts[categoryName] || 0);
                }
            });

            // 11 distinct colors
            const colorPalette = [
                '#8786E3', '#FF9F40', '#36A2EB', '#4BC0C0', '#FF6384',
                '#9966FF', '#FFCD56', '#C9CBCF', '#4D5360', '#FF6B6B',
                '#51CF66'
            ];

            // Assign colors - reuse if more than 11 categories
            const chartColors = chartLabels.map((label, index) => {
                return colorPalette[index % colorPalette.length];
            });

            // Create the chart with stable configuration
            categoriesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: chartColors,
                        borderWidth: 1,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '50%',
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
            
            // Force a stable layout by setting fixed dimensions
            categoriesCtx.style.display = 'block';
            categoriesCtx.style.maxHeight = '200px';
            categoriesCtx.parentElement.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// Make sure loadChartData is only called once
let chartInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    const carousel = new ActivitiesCarousel();
    
    // Load dynamic chart data only once
    if (!chartInitialized) {
        setTimeout(() => {
            loadChartData();
            chartInitialized = true;
        }, 500);
    }
    
    // ... rest of your existing code
});

// View Activity Details Function
async function viewActivityDetails(activityId) {
    try {
        const response = await fetch(`class/ApiHandler.php?entity=activities&action=get&id=${activityId}`);
        const result = await response.json();
        
        if (result.success) {
            showActivityDetailsModal(result.data);
        } else {
            showError('Error loading activity details: ' + result.message, 'error');
        }
    } catch (error) {
        showError('Network error: ' + error.message, 'error');
    }
}

// Delete Activity Function
async function deleteActivity(activityId) {
    if (!confirm('Are you sure you want to delete this member?')) return;
    if (!confirm('Deleting this may delete attendnace records relating to this activity')) return;
    
    try {       
        const response = await fetch(`class/ApiHandler.php?action=delete&entity=activities&id=${activityId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Activity Succesfully Deleted')
            location.reload()
            
        } else {
            // handleApiError(result, 'delete activities');
            showError('Error deleting activity: ' + result.message, 'error');
        }
    } catch (error) {
        showError('Error: ' + error.message);
    }
}

      
       
   
// Edit Activity Function
async function editActivity(activityId) {
    try {
        const response = await fetch(`class/ApiHandler.php?entity=activities&action=get&id=${activityId}`);
        const result = await response.json();
        
        if (result.success) {
            showEditActivityModal(result.data);
        } else {
            showError('Error loading activity for editing: ' + result.message, 'error');
        }
    } catch (error) {
        showError('Network error: ' + error.message, 'error');
    }
}

// Show Activity Details Modal
function showActivityDetailsModal(activity) {
    const modalHtml = `
        <div class="modal" id="viewActivityModal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Activity Details</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="activity-details">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Activity Name:</label>
                                    <span>${escapeHtml(activity.name)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Description:</label>
                                    <span>${escapeHtml(activity.description || 'No description')}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Category:</label>
                                    <span>${escapeHtml(activity.category)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Status:</label>
                                    <span class="status-badge status-${activity.id}">${activity.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Schedule & Location</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Day:</label>
                                    <span>${escapeHtml(activity.dayofactivity)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Time:</label>
                                    <span>${activity.time}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Time Expired:</label>
                                    <span>${activity.time_exp}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Location:</label>
                                    <span>${escapeHtml(activity.location)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Attendance Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Attendance Method:</label>
                                    <span>${formatAttendanceMethod(activity.attendance_method)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Target Audience:</label>
                                    <span>${formatTargetAudience(activity.target_audience)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Expected Attendance:</label>
                                    <span>${activity.expected_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    
                    <button class="btn-edit" onclick="editActivity(${activity.id})">
                        <i class="fas fa-edit"></i> Edit Activity
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal and add event listeners
    const modal = document.getElementById('viewActivityModal');
    modal.style.display = 'block';
    
    // Close modal functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}




// function showEditActivityModal(activity) {
//     const modalHtml = `
//         <div class="modal" id="editActivityModal">
//             <div class="modal-content" style="max-width: 700px;">
//                 <div class="modal-header">
//                     <h3>Edit Activity</h3>
//                     <span class="close-modal">&times;</span>
//                 </div>
//                 <div class="modal-body">
//                     <form id="editActivityForm">
//                         <input type="hidden" id="edit_id" value="${activity.id}">
//                         <div class="form-group">
//                             <label for="edit_name">Activity Name *</label>
//                             <input type="text" id="edit_name" value="${escapeHtml(activity.name)}" required>
//                         </div>
                        
//                         <div class="form-group">
//                             <label for="edit_description">Description</label>
//                             <textarea id="edit_description" rows="3">${escapeHtml(activity.description || '')}</textarea>
//                         </div>
                        
//                         <div class="form-row">
//                             <div class="form-group">
//                                 <label for="edit_category">Category *</label>
//                                 <select id="edit_category" required>
//                                     <option value="">Select Category</option>
//                                 </select>
//                             </div>
                            
//                             <div class="form-group">
//                                 <label for="edit_status">Status *</label>
//                                 <select id="edit_status" required>
//                                     <option value="">Select Status</option>
//                                 </select>
//                             </div>

                            
//                         </div>
//                         <div class="department-selection">    
//                             <div class="form-group department-field" id="originalDepartment">
//                                 <div class="form-group">
//                                     <label for="edit_department">Department *</label>
//                                     <select id="edit_department" required>
//                                         <option value="">Select Department</option>
//                                     </select>
//                                 </div>
//                                 <div id="additionalDepartments"></div>
                            
//                                 <button type="button" id="addDepartmentBtn"  class="add-department-btn">
//                                     + Add Another Department
//                                 </button>
//                                 <small class="hint">Maximum 7 departments total</small>
//                             </div>
//                         </div>
//                         <div class="form-row">
//                             <div class="form-group">
//                                 <label for="edit_dayofactivity">Day Of The Week *</label>                        
//                                 <select id="edit_dayofactivity" required>
//                                     <option value="Sunday">Sundays</option>
//                                     <option value="Monday">Mondays</option>
//                                     <option value="Tuesday">Tuesdays</option>
//                                     <option value="Wednesday">Wednesdays</option>
//                                     <option value="Thursday">Thursdays</option>
//                                     <option value="Friday">Fridays</option>
//                                     <option value="Saturday">Saturdays</option>
//                                 </select>                        
//                             </div>
                            
                            
//                             <div class="form-group">
//                                 <label for="edit_location">Location *</label>
//                                 <select id="edit_location" required>
//                                     <option value="">Select Location</option>
//                                 </select>
//                             </div>
//                         </div>
                        
//                         <div class="form-row">
//                             <div class="form-group">
//                                 <label for="edit_time">Attendance To Start *</label>
//                                 <input type="time" id="edit_time" value="${activity.time}" required>
//                             </div>

//                             <div class="form-group">
//                                 <label for="edit_time">Attendance To Expire *</label>
//                                 <input type="time" id="edit_time_exp" value="${activity.time_exp}" required>
//                             </div>
//                         </div>
                       
                        
//                         <div class="form-row">
//                             <div class="form-group">
//                                 <label for="edit_attendance_method">Attendance Method *</label>
//                                 <select id="edit_attendance_method" required>
//                                     <option value="">Select Attendance Method</option>
//                                 </select>
//                             </div>
                             
                            
//                             <div class="form-group">
//                                 <label for="edit_target_audience">Target Audience *</label>
//                                 <select id="edit_target_audience" required>
//                                     <option value="all">All Members</option>
//                                     <option value="youth">Youth Only</option>
//                                     <option value="adults">Adults Only</option>
//                                     <option value="children">Children Only</option>
//                                 </select>
//                             </div>
//                         </div>
                        
//                         <div class="form-group">
//                             <label for="edit_expected_count">Expected Attendance *</label>
//                             <input type="number" id="edit_expected_count" value="${activity.expected_count || ''}" min="1" required>
//                         </div>
                        
//                         <div class="form-actions">
//                             <button type="button" class="btn-secondary close-modal">Cancel</button>
//                             <button type="submit" class="btn-primary">Update Activity</button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     `;
    
//     // Add modal to page
//     document.body.insertAdjacentHTML('beforeend', modalHtml);
    
//     // Populate dynamic dropdowns
//     populateEditFormDropdowns(activity);
    
//     // Show modal
//     const modal = document.getElementById('editActivityModal');
//     modal.style.display = 'block';
    
//     // Close modal functionality
//     modal.querySelector('.close-modal').addEventListener('click', () => {
//         modal.remove();
//     });
    
//     modal.addEventListener('click', (e) => {
//         if (e.target === modal) {
//             modal.remove();
//         }
//     });
    
//     // Form submission
//     document.getElementById('editActivityForm').addEventListener('submit', handleEditFormSubmit);
// }

// Utility functions

//Show Edit Activity Modal
function showEditActivityModal(activity) {
    const modalHtml = `
        <div class="modal" id="editActivityModal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>Edit Activity</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="editActivityForm">
                        <input type="hidden" id="edit_id" value="${activity.id}">
                        <div class="form-group">
                            <label for="edit_name">Activity Name *</label>
                            <input type="text" id="edit_name" value="${escapeHtml(activity.name)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit_description">Description</label>
                            <textarea id="edit_description" rows="3">${escapeHtml(activity.description || '')}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_category">Category *</label>
                                <select id="edit_category" required>
                                    <option value="">Select Category</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit_status">Status *</label>
                                <select id="edit_status" required>
                                    <option value="">Select Status</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="department-selection">
                            <div class="form-group" id="editDepartmentContainer">
                                <label>Departments *</label>
                                <div class="department-fields-container" id="editDepartmentFields">
                                    <!-- Dynamic department fields will be added here -->
                                </div>
                                <button type="button" id="editAddDepartmentBtn" class="add-department-btn">
                                    + Add Another Department
                                </button>
                                <small class="hint">Maximum 7 departments total</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_dayofactivity">Day Of The Week *</label>                        
                                <select id="edit_dayofactivity" required>
                                    <option value="Sunday">Sundays</option>
                                    <option value="Monday">Mondays</option>
                                    <option value="Tuesday">Tuesdays</option>
                                    <option value="Wednesday">Wednesdays</option>
                                    <option value="Thursday">Thursdays</option>
                                    <option value="Friday">Fridays</option>
                                    <option value="Saturday">Saturdays</option>
                                </select>                        
                            </div>
                            
                            <div class="form-group">
                                <label for="edit_location">Location *</label>
                                <select id="edit_location" required>
                                    <option value="">Select Location</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_time">Attendance To Start *</label>
                                <input type="time" id="edit_time" value="${activity.time}" required>
                            </div>

                            <div class="form-group">
                                <label for="edit_time_exp">Attendance To Expire *</label>
                                <input type="time" id="edit_time_exp" value="${activity.time_exp}" required>
                            </div>
                        </div>               
                       
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_attendance_method">Attendance Method *</label>
                                <select id="edit_attendance_method" required>
                                    <option value="">Select Attendance Method</option>
                                </select>
                            </div>
                             
                            <div class="form-group">
                                <label for="edit_target_audience">Target Audience *</label>
                                <select id="edit_target_audience" required>
                                    <option value="all">All Members</option>
                                    <option value="youth">Youth Only</option>
                                    <option value="adults">Adults Only</option>
                                    <option value="children">Children Only</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit_expected_count">Expected Attendance *</label>
                            <input type="number" id="edit_expected_count" value="${activity.expected_count || ''}" min="1" required>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary close-modal">Cancel</button>
                            <button type="submit" class="btn-primary">Update Activity</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = document.getElementById('editActivityModal');
    modal.style.display = 'block';
    
    // Initialize the edit modal with existing departments
    initializeEditModalDepartments(activity);
    
    // Set the day value
    document.getElementById('edit_dayofactivity').value = activity.dayofactivity;
    document.getElementById('edit_target_audience').value = activity.target_audience || 'all';
    
    // Populate other dynamic dropdowns
    populateEditFormDropdowns(activity);
    
    // Setup edit department functionality
    setupEditDepartmentFunctionality(activity);
    
    // Populate dynamic dropdowns
    populateEditFormDropdowns(activity);    
 
    
    // Close modal functionality
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Form submission
    document.getElementById('editActivityForm').addEventListener('submit', handleEditFormSubmit);
}

// Initialize edit modal with existing departments
async function initializeEditModalDepartments(activity) {
    try {
        // Parse department data from the activity
        // Assuming activity has departments property which could be an array of department objects
        // or a string of comma-separated department IDs
        let departmentIds = [];
        
        if (activity.department_names) {
            if (Array.isArray(activity.department_names)) {
                departmentIds = activity.departments.map(dept => dept.id || dept);
            } else if (activity.department_id) {
                // Try to get from department_id if it's a string/array
                if (Array.isArray(activity.department_id)) {
                    departmentIds = activity.department_id;
                } else if (typeof activity.department_id === 'string') {
                    departmentIds = activity.department_id.split(',').map(id => id.trim());
                }
            }
        }
        
        // Remove empty strings and convert to numbers
        departmentIds = departmentIds.filter(id => id && id !== '').map(id => parseInt(id));
        
        // If no departments found, create one empty field
        if (departmentIds.length === 0) {
            createEditDepartmentField('');
        } else {
            // Create fields for each existing department
            departmentIds.forEach((deptId, index) => {
                createEditDepartmentField(deptId, index === 0);
            });
        }
        
        // Update add button state
        updateEditAddButtonState();
        
    } catch (error) {
        console.error('Error initializing departments:', error);
        // Create one empty field as fallback
        createEditDepartmentField('');
    }
}

// Create a department field for edit modal
function createEditDepartmentField(deptId = '', isFirst = false) {
    const container = document.getElementById('editDepartmentFields');
    const fieldCount = container.querySelectorAll('.edit-department-field').length;
    const fieldId = `edit_dept_${fieldCount + 1}`;
    
    const fieldHTML = `
        <div class="edit-department-field" id="${fieldId}">
            <div class="form-group department-field" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <select class="edit-department-select" name="edit_department_id[]" style="flex: 1;" ${isFirst ? 'required' : ''}>
                    <option value="">Select Department</option>
                </select>
                ${!isFirst ? '<button type="button" class="remove-edit-department" onclick="removeEditDepartmentField(this)" style="background: #ff6b6b; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">−</button>' : ''}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHTML);
    
    // Populate the select with options
    setTimeout(() => populateEditDepartmentSelect(fieldId, deptId), 0);
    
    // Update add button state
    updateEditAddButtonState();
}

// Populate a single department select in edit modal
async function populateEditDepartmentSelect(fieldId, selectedValue = '') {
    try {
        const response = await fetch('class/ApiHandler.php?entity=departments&action=getAll');
        const data = await response.json();
        
        if (data.success) {
            const field = document.getElementById(fieldId);
            const select = field.querySelector('.edit-department-select');
            const currentValue = selectedValue || select.value;
            
            // Get all selected departments from other fields
            const selectedDepartments = [];
            document.querySelectorAll('.edit-department-select').forEach(otherSelect => {
                if (otherSelect !== select && otherSelect.value) {
                    selectedDepartments.push(parseInt(otherSelect.value));
                }
            });
            
            // Build options
            let optionsHTML = '<option value="">Select Department</option>';
            
            data.data.forEach(dept => {
                // Include option if it's not selected elsewhere OR if it's the current value for this field
                if (!selectedDepartments.includes(dept.id) || parseInt(currentValue) === dept.id) {
                    const selected = (parseInt(currentValue) === dept.id) ? 'selected' : '';
                    optionsHTML += `<option value="${dept.id}" ${selected}>${escapeHtml(dept.name)}</option>`;
                }
            });
            
            select.innerHTML = optionsHTML;
            
            // Trigger change event to refresh other selects
            select.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}
function setupEditDepartmentFunctionality(activity) {
    // Add department button click handler
    document.getElementById('editAddDepartmentBtn').addEventListener('click', () => {
        addEditDepartmentField();
    });
    
    // Department select change handler to refresh other selects
    document.getElementById('editDepartmentFields').addEventListener('change', (e) => {
        if (e.target.classList.contains('edit-department-select')) {
            refreshEditDepartmentSelects();
        }
    });
}

// Add new department field in edit modal
function addEditDepartmentField() {
    const fieldCount = document.querySelectorAll('.edit-department-field').length;
    
    if (fieldCount >= 7) {
        document.getElementById('editAddDepartmentBtn').disabled = true;
        alert('Maximum of 7 departments reached');
        return;
    }
    
    createEditDepartmentField('');
    refreshEditDepartmentSelects();
}

// Remove department field in edit modal
function removeEditDepartmentField(button) {
    const field = button.closest('.edit-department-field');
    field.remove();
    
    refreshEditDepartmentSelects();
    updateEditAddButtonState();
}

// Refresh all department selects in edit modal
async function refreshEditDepartmentSelects() {
    try {
        const response = await fetch('class/ApiHandler.php?entity=departments&action=getAll');
        const data = await response.json();
        
        if (data.success) {
            const allDepartments = data.data;
            
            // Get all current selections
            const selects = document.querySelectorAll('.edit-department-select');
            const currentSelections = [];
            
            selects.forEach(select => {
                if (select.value) {
                    currentSelections.push(parseInt(select.value));
                }
            });
            
            // Update each select
            selects.forEach(select => {
                const currentValue = select.value;
                let optionsHTML = '<option value="">Select Department</option>';
                
                allDepartments.forEach(dept => {
                    // Show option if: 
                    // 1. It's not selected in any other field, OR
                    // 2. It's the current value for this field
                    if (!currentSelections.includes(dept.id) || parseInt(currentValue) === dept.id) {
                        const selected = (parseInt(currentValue) === dept.id) ? 'selected' : '';
                        optionsHTML += `<option value="${dept.id}" ${selected}>${escapeHtml(dept.name)}</option>`;
                    }
                });
                
                select.innerHTML = optionsHTML;
            });
        }
    } catch (error) {
        console.error('Error refreshing department selects:', error);
    }
}

// Update add button state based on current field count
function updateEditAddButtonState() {
    const fieldCount = document.querySelectorAll('.edit-department-field').length;
    const addBtn = document.getElementById('editAddDepartmentBtn');
    
    if (fieldCount >= 7) {
        addBtn.disabled = true;
        addBtn.textContent = 'Maximum departments reached';
    } else {
        addBtn.disabled = false;
        addBtn.textContent = '+ Add Another Department';
    }
}

// Update the handleEditFormSubmit function to handle multiple departments
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    // Collect department IDs
    const departmentSelects = document.querySelectorAll('.edit-department-select');
    const departmentIds = [];
    
    departmentSelects.forEach(select => {
        const value = select.value.trim();
        if (value && value !== "") {
            departmentIds.push(value);
        }
    });
    
    // Ensure at least one department is selected
    if (departmentIds.length === 0) {
        showError('Please select at least one department', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('edit_name').value,
        description: document.getElementById('edit_description').value,
        category_id: document.getElementById('edit_category').value,
        status_id: document.getElementById('edit_status').value,
        dayofactivity: document.getElementById('edit_dayofactivity').value,
        time: document.getElementById('edit_time').value,
        time_exp: document.getElementById('edit_time_exp').value,
        location_id: document.getElementById('edit_location').value,
        attendance_method_id: document.getElementById('edit_attendance_method').value,
        target_audience: document.getElementById('edit_target_audience').value,
        expected_count: document.getElementById('edit_expected_count').value,
        department_id: departmentIds
    };
    
    const activityId = document.getElementById('edit_id').value;
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`class/ApiHandler.php?entity=activities&action=update&id=${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Activity updated successfully!', 'success');
            document.getElementById('editActivityModal').remove();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showError('Error updating activity: ' + data.message, 'error');
        }
    } catch (error) {
        showError('Network error: ' + error.message, 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
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

function formatAttendanceMethod(method) {
    const methodMap = {
        'qr_code': 'QR Code',
        'numeric_code': 'Numeric Code',
        'location': 'Location Based',
        'nfc': 'NFC'
    };
    return methodMap[method] || method;
}

function formatTargetAudience(audience) {
    const audienceMap = {
        'all': 'All Members',
        'youth': 'Youth Only',
        'adults': 'Adults Only',
        'children': 'Children Only'
    };
    return audienceMap[audience] || audience;
}

// Populate edit form dropdowns
// async function populateEditFormDropdowns(activity) {
//     try {
//         // Load categories
//         const categoriesResponse = await fetch('class/ApiHandler.php?entity=categories&action=getAll');
//         const categoriesData = await categoriesResponse.json();
//         showSuccess('sategory set')
//         const attendance_methodResponse = await fetch('class/ApiHandler.php?entity=attendance_methods&action=getAll');
//         const attendance_methodData = await attendance_methodResponse.json();
//         showSuccess('attendance method set')        
//         const locationsResponse = await fetch('class/ApiHandler.php?entity=locations&action=getAll');
//         const locationsData = await locationsResponse.json();
//         showSuccess('location set')
//         const departmentsResponse = await fetch('class/ApiHandler.php?entity=departments&action=getAll');
//         const departmentsData = await departmentsResponse.json();
//         showSuccess('department set')
//         if (departmentsData.success) {
//             const departmentSelect = document.getElementById('edit_department');
//             departmentsData.data.forEach(department => {
//                 const departmentName = department.name;
//                 const departmentId = department.id;
//                 if (departmentName && departmentId && departmentName !== 'All') {
//                     const option = document.createElement('option');
//                     option.value = departmentId;
//                     option.textContent = departmentName;
//                     if (departmentName === activity.department_names) {
//                         option.selected = true;
//                     }
//                     departmentSelect.appendChild(option);
//                 }
//             });
//         }
//         if (categoriesData.success) {
//             const categorySelect = document.getElementById('edit_category');
//             categoriesData.data.forEach(category => {
//                 const categoryName = category.categories || category.name || category;
//                 const categoryId = category.id || category.name || category;
//                 if (categoryName && categoryId && categoryName !== 'All') {
//                     const option = document.createElement('option');
//                     option.value = categoryId;
//                     option.textContent = categoryName;
//                     if (categoryName === activity.category) {
//                         option.selected = true;
//                     }
//                     categorySelect.appendChild(option);
//                 }
//             });
//         }
        
//         if (attendance_methodData.success) {
//             const attendance_methodSelect = document.getElementById('edit_attendance_method');
//             attendance_methodData.data.forEach(attendance_method => {
//                 const attendance_methodName = attendance_method.code || attendance_method.name || attendance_method;
//                 const attendance_methodId = attendance_method.id || attendance_method.name || attendance_method;
//                 if (attendance_methodId && attendance_methodName && attendance_methodName !== 'All') {
//                     const option = document.createElement('option');
//                     option.value = attendance_methodId;
//                     option.textContent = attendance_methodName;
//                     if (attendance_methodName === activity.attendance_method) {
//                         option.selected = true;
//                     }
//                     attendance_methodSelect.appendChild(option);
//                 }
//             });
//         }
//         if (locationsData.success) {
//             const locationSelect = document.getElementById('edit_location');
//             locationsData.data.forEach(location => {
//                 const locationName = location.name || location;
//                 const locationId = location.id || location.name || location;
//                 if (locationId && locationName && locationName !== 'All') {
//                     const option = document.createElement('option');
//                     option.value = locationId;
//                     option.textContent = locationName;
//                     if (locationName === activity.location) {
//                         option.selected = true;
//                     }
//                     locationSelect.appendChild(option);
//                 }
//             });
//         }
        
//         // Load statuses
//         const statusesResponse = await fetch('class/ApiHandler.php?entity=statuses&action=getAll');
//         const statusesData = await statusesResponse.json();
        
//         if (statusesData.success) {
//             const statusSelect = document.getElementById('edit_status');
//             statusesData.data.forEach(status => {
//                 const option = document.createElement('option');
//                 option.value = status.id;
//                 option.textContent = status.name;
//                 if (status.name === activity.status) {
//                     option.selected = true;
//                 }
//                 statusSelect.appendChild(option);
//             });
//         }
        
//         // Set other form values
//         document.getElementById('edit_dayofactivity').value = activity.dayofactivity;
//         document.getElementById('edit_target_audience').value = activity.target_audience || 'all';
        
//     } catch (error) {
//         console.error('Error populating form:', error);
//     }
// }
// Populate edit form dropdowns (updated)
async function populateEditFormDropdowns(activity) {
    try {
        // Load categories
        const categoriesResponse = await fetch('class/ApiHandler.php?entity=categories&action=getAll');
        const categoriesData = await categoriesResponse.json();
        
        const attendance_methodResponse = await fetch('class/ApiHandler.php?entity=attendance_methods&action=getAll');
        const attendance_methodData = await attendance_methodResponse.json();        
        
        const locationsResponse = await fetch('class/ApiHandler.php?entity=locations&action=getAll');
        const locationsData = await locationsResponse.json();
        
        // Categories dropdown
        if (categoriesData.success) {
            const categorySelect = document.getElementById('edit_category');
            categoriesData.data.forEach(category => {
                const categoryName = category.categories || category.name || category;
                const categoryId = category.id || category.name || category;
                if (categoryName && categoryId && categoryName !== 'All') {
                    const option = document.createElement('option');
                    option.value = categoryId;
                    option.textContent = categoryName;
                    // Assuming activity.category is the category ID
                    if (categoryId == activity.category_id || categoryName === activity.category) {
                        option.selected = true;
                    }
                    categorySelect.appendChild(option);
                }
            });
        }
        
        // Attendance methods dropdown
        if (attendance_methodData.success) {
            const attendance_methodSelect = document.getElementById('edit_attendance_method');
            attendance_methodData.data.forEach(attendance_method => {
                const attendance_methodName = attendance_method.code || attendance_method.name || attendance_method;
                const attendance_methodId = attendance_method.id || attendance_method.name || attendance_method;
                if (attendance_methodId && attendance_methodName && attendance_methodName !== 'All') {
                    const option = document.createElement('option');
                    option.value = attendance_methodId;
                    option.textContent = attendance_methodName;
                    if (attendance_methodId == activity.attendance_method_id || attendance_methodName === activity.attendance_method) {
                        option.selected = true;
                    }
                    attendance_methodSelect.appendChild(option);
                }
            });
        }
        
        // Locations dropdown
        if (locationsData.success) {
            const locationSelect = document.getElementById('edit_location');
            locationsData.data.forEach(location => {
                const locationName = location.name || location;
                const locationId = location.id || location.name || location;
                if (locationId && locationName && locationName !== 'All') {
                    const option = document.createElement('option');
                    option.value = locationId;
                    option.textContent = locationName;
                    if (locationId == activity.location_id || locationName === activity.location) {
                        option.selected = true;
                    }
                    locationSelect.appendChild(option);
                }
            });
        }
        
        // Load statuses
        const statusesResponse = await fetch('class/ApiHandler.php?entity=statuses&action=getAll');
        const statusesData = await statusesResponse.json();
        
        if (statusesData.success) {
            const statusSelect = document.getElementById('edit_status');
            statusesData.data.forEach(status => {
                const option = document.createElement('option');
                option.value = status.id;
                option.textContent = status.name;
                if (status.id == activity.status_id || status.name === activity.status) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error populating form:', error);
    }
}

// Handle edit form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    // Validate required fields first
    const requiredFields = [
        'edit_name', 'edit_category', 'edit_status', 
        'edit_dayofactivity', 'edit_time', 'edit_time_exp',
        'edit_location', 'edit_attendance_method', 'edit_target_audience',
        'edit_expected_count'
    ];
    
    let hasErrors = false;
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showError(`${field.previousElementSibling?.textContent || field.name} is required`, 'error');
            field.style.borderColor = '#ff6b6b';
            hasErrors = true;
        } else {
            field.style.borderColor = '';
        }
    });
    
    if (hasErrors) return;
    
    // Collect department IDs from the edit modal - store as strings
    const departmentSelects = document.querySelectorAll('.edit-department-select');
    const departmentIds = [];
    let hasDepartmentError = false;
    
    departmentSelects.forEach((select, index) => {
        const value = select.value.trim();
        if (value && value !== "" && value !== "0") {
            // Store as string (keep as-is from the select value)
            departmentIds.push(value);
        } else if (index === 0) {
            // First department is required
            showError('At least one department is required', 'error');
            select.style.borderColor = '#ff6b6b';
            hasDepartmentError = true;
        }
    });
    
    if (hasDepartmentError) return;
    
    // Ensure at least one department is selected
    if (departmentIds.length === 0) {
        showError('Please select at least one department', 'error');
        return;
    }
    
    // Remove duplicates (in case user accidentally selects same department multiple times)
    // For strings, we need to ensure case sensitivity and trim values
    const uniqueDepartmentIds = [...new Set(departmentIds.map(id => id.toString().trim()))];
    
    // Validate that all department IDs are valid strings (not empty)
    const validDepartmentIds = uniqueDepartmentIds.filter(id => id && id !== '0');
    
    if (validDepartmentIds.length === 0) {
        showError('Please select at least one valid department', 'error');
        return;
    }
    
    // Validate time logic
    const startTime = document.getElementById('edit_time').value;
    const endTime = document.getElementById('edit_time_exp').value;
    
    if (startTime && endTime) {
        const startDate = new Date(`1970-01-01T${startTime}`);
        const endDate = new Date(`1970-01-01T${endTime}`);
        
        if (endDate <= startDate) {
            showError('Attendance expiration time must be after start time', 'error');
            return;
        }
    }
    
    // Validate expected count
    const expectedCount = parseInt(document.getElementById('edit_expected_count').value);
    if (expectedCount <= 0) {
        showError('Expected attendance must be greater than 0', 'error');
        return;
    }
    
    const formData = {
        name: document.getElementById('edit_name').value.trim(),
        description: document.getElementById('edit_description').value.trim(),
        category_id: parseInt(document.getElementById('edit_category').value),
        status_id: parseInt(document.getElementById('edit_status').value),
        dayofactivity: document.getElementById('edit_dayofactivity').value,
        time: document.getElementById('edit_time').value,
        time_exp: document.getElementById('edit_time_exp').value,
        location_id: parseInt(document.getElementById('edit_location').value),
        attendance_method_id: parseInt(document.getElementById('edit_attendance_method').value),
        target_audience: document.getElementById('edit_target_audience').value,
        expected_count: expectedCount,
        department_id: validDepartmentIds // Send as array of strings
    };
    
    // Optional: Log the data to verify format
    console.log('Submitting form data:', {
        ...formData,
        department_id: validDepartmentIds
    });
    
    const activityId = parseInt(document.getElementById('edit_id').value);
    
    // Show loading state with better UX
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Activity...';
    submitBtn.disabled = true;
    
    // Disable all form inputs during submission
    const form = e.target;
    const formInputs = form.querySelectorAll('input, select, textarea, button');
    formInputs.forEach(input => {
        if (input !== submitBtn) input.disabled = true;
    });
    
    try {
        // Add timeout for slow connections
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(`class/ApiHandler.php?entity=activities&action=update&id=${activityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message with more details
            showSuccess(`Activity "${formData.name}" updated successfully!`, 'success');
            
            // Close modal with animation
            const modal = document.getElementById('editActivityModal');
            modal.style.opacity = '0';
            modal.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                modal.remove();
                // Refresh the page to show updated data
                window.location.reload();
            }, 300);
            
        } else {
            // Handle server-side validation errors
            let errorMessage = 'Error updating activity';
            if (data.message) {
                errorMessage += ': ' + data.message;
            }
            if (data.errors) {
                // If server returns field-specific errors
                errorMessage += '<br>';
                Object.entries(data.errors).forEach(([field, message]) => {
                    errorMessage += `<br>• ${field}: ${message}`;
                });
            }
            showError(errorMessage, 'error');
        }
    } catch (error) {
        let errorMessage = 'Error updating activity';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else {
            errorMessage += ': ' + error.message;
        }
        
        showError(errorMessage, 'error');
        console.error('Update error:', error);
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalHTML;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        // Re-enable form inputs
        formInputs.forEach(input => {
            if (input !== submitBtn) input.disabled = false;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#originalDepartment .remove-department').style.display = 'none';
    
    // Helper function for escaping HTML
    window.escapeHtml = function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    };
});



async function loadExistingQRCode(activityId) {
    try {
        const response = await fetch(`class/ApiHandler.php?entity=activity_qr_codes&action=getQR&id=${activityId}`);
        const data = await response.json();
        
        if (data.success && data.qr_data) {
            displayQRCode(data.qr_data);
            document.getElementById('downloadQRBtn').style.display = 'inline-block';
        }
    } catch (error) {
        console.log('No existing QR code found');
    }
}

