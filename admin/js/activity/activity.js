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
        
        this.currentIndex = 0;
        this.cards = Array.from(this.carousel.querySelectorAll('.activity-card'));
        this.totalCards = this.cards.length;
        this.filteredCards = this.cards;
        
        this.init();
    }
    
    init() {
        this.createNavigationDots();
        this.updateNavigation();
        this.attachEventListeners();
        this.updateCarousel();
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
    
    // Form submission with API call
    document.getElementById('activityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            category_id: document.getElementById('category').value,            
            dayofactivity: document.getElementById('dayofactivity').value,
            time: document.getElementById('time').value,
            location_id: document.getElementById('location_id').value,
            attendance_method_id: document.getElementById('attendance_method_id').value,
            target_audience: document.getElementById('target_audience').value,
            expected_count: document.getElementById('expected_count').value,
            status_id: document.getElementById('status_id').value,
        };
        
        // Show loading state
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        submitBtn.disabled = true;
        
        // Send to API
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
    // QR functionality - UPDATED VERSION
    document.querySelectorAll('.generate-qr-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const activityId = this.dataset.id;
            const attendanceMethod = this.dataset.attendanceMethod;
            showQRCodeModal(activityId);
        });
    });

    // QR functionality
    // document.querySelectorAll('.generate-qr-btn').forEach(function(btn) {
    //     // const carousel = new ActivitiesCarousel();
    
    //     // // Load dynamic chart data only once
    //     // if (!chartInitialized) {
    //     //     setTimeout(() => {
    //     //         loadChartData();
    //     //         chartInitialized = true;
    //     //     }, 500);
    //     // }
    //     btn.addEventListener('click', function() {
    //         const activityId = this.dataset.id;
    //         const attendanceMethod = this.dataset.attendanceMethod;
            // showQRCodeModal(activityId);
    //     });
    // });
   
    
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

// Show Edit Activity Modal
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
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_dayofactivity">Day Of The Week *</label>                        
                                <select id="edit_dayofactivity" required>
                                    <option value="Sunday's">Sundays</option>
                                    <option value="Monday's">Mondays</option>
                                    <option value="Tuesday's">Tuesdays</option>
                                    <option value="Wednesday's">Wednesdays</option>
                                    <option value="Thursday's">Thursdays</option>
                                    <option value="Friday's">Fridays</option>
                                    <option value="Saturday's">Saturdays</option>
                                </select>                        
                            </div>
                            
                            <div class="form-group">
                                <label for="edit_time">Time *</label>
                                <input type="time" id="edit_time" value="${activity.time}" required>
                            </div>
                        </div>
                        
                        
                        <div class="form-group">
                            <label for="edit_location">Location *</label>
                            <select id="edit_location" required>
                                <option value="">Select Location</option>
                            </select>
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
    
    // Populate dynamic dropdowns
    populateEditFormDropdowns(activity);
    
    // Show modal
    const modal = document.getElementById('editActivityModal');
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
    
    // Form submission
    document.getElementById('editActivityForm').addEventListener('submit', handleEditFormSubmit);
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
async function populateEditFormDropdowns(activity) {
    try {
        // Load categories
        const categoriesResponse = await fetch('class/ApiHandler.php?entity=categories&action=getAll');
        const categoriesData = await categoriesResponse.json();
        const attendance_methodResponse = await fetch('class/ApiHandler.php?entity=attendance_methods&action=getAll');
        const attendance_methodData = await attendance_methodResponse.json();        
        const locationsResponse = await fetch('class/ApiHandler.php?entity=locations&action=getAll');
        const locationsData = await locationsResponse.json();
        
        if (categoriesData.success) {
            const categorySelect = document.getElementById('edit_category');
            categoriesData.data.forEach(category => {
                const categoryName = category.categories || category.name || category;
                const categoryId = category.id || category.name || category;
                if (categoryName && categoryId && categoryName !== 'All') {
                    const option = document.createElement('option');
                    option.value = categoryId;
                    option.textContent = categoryName;
                    if (categoryName === activity.category) {
                        option.selected = true;
                    }
                    categorySelect.appendChild(option);
                }
            });
        }
        
        if (attendance_methodData.success) {
            const attendance_methodSelect = document.getElementById('edit_attendance_method');
            attendance_methodData.data.forEach(attendance_method => {
                const attendance_methodName = attendance_method.code || attendance_method.name || attendance_method;
                const attendance_methodId = attendance_method.id || attendance_method.name || attendance_method;
                if (attendance_methodId && attendance_methodName && attendance_methodName !== 'All') {
                    const option = document.createElement('option');
                    option.value = attendance_methodId;
                    option.textContent = attendance_methodName;
                    if (attendance_methodName === activity.attendance_method) {
                        option.selected = true;
                    }
                    attendance_methodSelect.appendChild(option);
                }
            });
        }
        if (locationsData.success) {
            const locationSelect = document.getElementById('edit_location');
            locationsData.data.forEach(location => {
                const locationName = location.name || location;
                const locationId = location.id || location.name || location;
                if (locationId && locationName && locationName !== 'All') {
                    const option = document.createElement('option');
                    option.value = locationId;
                    option.textContent = locationName;
                    if (locationName === activity.location) {
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
                if (status.name === activity.status) {
                    option.selected = true;
                }
                statusSelect.appendChild(option);
            });
        }
        
        // Set other form values
        document.getElementById('edit_dayofactivity').value = activity.dayofactivity;
        document.getElementById('edit_target_audience').value = activity.target_audience || 'all';
        
    } catch (error) {
        console.error('Error populating form:', error);
    }
}

// Handle edit form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('edit_name').value,
        description: document.getElementById('edit_description').value,
        category_id: document.getElementById('edit_category').value,
        status_id: document.getElementById('edit_status').value,
        dayofactivity: document.getElementById('edit_dayofactivity').value,
        time: document.getElementById('edit_time').value,
        location_id: document.getElementById('edit_location').value,
        attendance_method_id: document.getElementById('edit_attendance_method').value,
        target_audience: document.getElementById('edit_target_audience').value,
        expected_count: document.getElementById('edit_expected_count').value
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






// Load existing QR code
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

