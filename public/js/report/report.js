const attendanceData = [];
const weeklyTrend = { labels: [], values: [] };
const summary = { 
    total_present: 0, 
    total_absent: 0, 
    total_activities: 0, 
    avg_attendance_rate: 0 
};
const topDepartment = { department: 'N/A', attendance_rate: 0 };
const departments = [];
const activityTypes = [];
async function loadInitialData() {
    try {
        // Load departments
        const deptResponse = await fetch('class/ApiHandler.php?action=getAll&entity=departments');
        const deptData = await deptResponse.json();
        
        if (deptData.success) {
            // showSuccess('succesfully gotten to department')
            populateDepartments(deptData.data);
        }

        // Load activity types from activities
        const activityResponse = await fetch('class/ApiHandler.php?action=getAll&entity=activities');
        const activityData = await activityResponse.json();
        
        if (activityData.success) {
            // showSuccess('succesfully gotten to activity')
            populateSelect(activityData.data);
        }
        

        const eventResponse = await fetch('class/ApiHandler.php?action=getAll&entity=events');
        const eventData = await eventResponse.json();
        
        if (eventData.success) {
            // showSuccess('succesfully gotten to event')
            populateSelect(eventData.data);
        }

        // Load attendance data
        await loadAttendanceData();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load initial data');
    }
}

function populateDepartments(departments) {
    const select = document.getElementById('department_id');
    const currentDept = departments;
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        option.selected = (dept.name === currentDept);
        select.appendChild(option);
    });
}

    
function populateSelect(activities) {
    const select = document.getElementById('attendance_category_id');
    const currentActivity = activityTypes;
    
    select.innerHTML = '';
    
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'First Select A Category';
    defaultOption.selected = (!currentActivity || currentActivity === '');
    select.appendChild(defaultOption);
    
    // Create an array of unique activities by ID
    const uniqueActivities = activities.reduce((acc, activity) => {
        // Check if we already have this ID
        if (!acc.find(item => item.id === activity.id)) {
            acc.push({
                id: activity.id,
                displayText: activity.name || activity.title
            });
        }
        return acc;
    }, []);
    
    // Populate the select with options
    uniqueActivities.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id; 
        option.textContent = activity.displayText;
        option.selected = (activity.id.toString() === currentActivity.toString());
        select.appendChild(option);
    });
}
function getTableContainer(){
    const tableContainer = document.getElementById('table-container');
    content = ` <h3>Attendance Records</h3>
                <div class="search-container">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-input" placeholder="Search attendance records...">
                    </div>
                    <div class="results-count">
                        Showing <span id="results-count">0</span> of <span id="total-count">0</span> records
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category Type</th>
                            <th>Category Name</th>
                            <th>Department</th>
                            <th>Username</th>
                            <th>FirstName</th>
                            <th>LastName</th>
                            <th>Status</th>                
                            <th>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody id="attendanceTableBody">
                        <tr>
                            <td colspan="6" class="no-data">Loading data...</td>
                        </tr>
                    </tbody>
                </table>
    
                <!-- Pagination -->
                <div class="pagination" id="pagination">
                    
                </div>
                <div class="page-info" id="page-info">
                    
                </div>
    `
    tableContainer.innerHTML = content
}
getTableContainer()
function getFilters(){
    const urlParams = new URLSearchParams(window.location.search);
    const startDate = urlParams.get('start_date') || getFirstDayOfMonth();
    const endDate = urlParams.get('end_date') || getCurrentDate();
    const reportFilter = document.getElementById('report-filters');
  

    // Helper functions
    function getFirstDayOfMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    function getCurrentDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // console.log('Start Date:', startDate);
    // console.log('End Date:', endDate);
    content = `<div class="report-filters" id="report-filters">
            <div class="filter-group">
                <label>Date Range:</label>
                <input type="date" id="startDate" value="${startDate}">
                <span>to</span>
                <input type="date" id="endDate" value="${endDate}">
            </div>
            <div class="filter-group">
                <label>Department:</label>
                <select id="department_id">
                    <option value="all">All Departments</option>
                    
                </select>
            </div>
            <div class="filter-group">
                <label>Category Type:</label>
                <select id="attendance_category">
                    <option value="all">All Categories</option>
                    <option value="activity">Activity</option>
                    <option value="event">Events</option>           
                </select>
            </div>
            <div class="filter-group">
                <label>Category Associate:</label>
                <select id="attendance_category_id">
                    <option>First select  category</option>                     
                </select>
            </div>
            <div class="filter-group">
                <button class="btn-primary" onclick="applyFilters()">
                    <i class="fas fa-filter"></i> Apply Filters
                </button>
            </div>
        </div>`
    reportFilter.innerHTML = content
    const attendance_category = document.getElementById('attendance_category');
    attendance_category.addEventListener('change', function() {
        const selectedValue = this.value;
        const categorySelect = document.getElementById('attendance_category_id');
        
        // Get the first option (default option)
        const defaultOption = categorySelect.querySelector('option:first-child');
        
        if (selectedValue === 'event') {
            defaultOption.textContent = 'All Events';
            defaultOption.value = 'all'; 
        } else if (selectedValue === 'activity') {
            defaultOption.textContent = 'All Activities';
            defaultOption.value = 'all'; 
        } else {
            defaultOption.textContent = 'First select category';
            defaultOption.value = ''; 
        }
    })
    

}
getFilters()

async function loadAttendanceData() {
    try {   
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;    
        const department_id = document.getElementById('department_id').value;
        const attendance_category = document.getElementById('attendance_category').value;
        const attendance_category_id = document.getElementById('attendance_category_id').value;
    
        
        const jsonData = {
            start_date: startDate,
            end_date: endDate,
            department_id: department_id,
            attendance_category: attendance_category,
            attendance_category_id: attendance_category_id || 'all'
        };
        // showSuccess(jsonData);
        
        const url = 'class/ApiHandler.php?action=special&entity=reports';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        const result = await response.json();
        
        if (result.success) {
            // showSuccess('succesfully worked');
            allData = result.data;
            filterData();
            updateSummary();
            loadWeeklyTrend();
        } else {
            showError('failed to work');
            throw new Error(result.message || 'Failed to load attendance data');
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
        showError('Failed to load attendance data');
    }
}
function renderTable() {
    const tbody = document.getElementById('attendanceTableBody');
    
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="no-data">No data found</td></tr>`;
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    
    tbody.innerHTML = filteredData.slice(startIndex, endIndex).map((item, index) => {
        const globalIndex = startIndex + index + 1;
        return `<tr>
            <td>${formatDate(item.created_at)}</td>                
            <td>${escapeHtml(item.attendance_category)}</td>
            <td>${escapeHtml(item.activity_name)}</td>
            <td>${escapeHtml(item.department)}</td>
            <td>${escapeHtml(item.user_name)}</td>
            <td>${escapeHtml(item.first_name)}</td>
            <td>${escapeHtml(item.last_name)}</td>
            <td>${item.status}</td>                
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${item.attendance_rate}%">
                        ${item.attendance_rate}%
                    </div>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateSummary() {
    if (allData.length === 0) {
        document.getElementById('totalPresent').textContent = '0';
        document.getElementById('avgAttendance').textContent = '0%';
        document.getElementById('topDepartment').textContent = 'N/A';
        document.getElementById('topDepartmentRate').textContent = '0% attendance';
        document.getElementById('totalCategory').textContent = '0'; 
        document.getElementById('totalCategoryNo').textContent = '0';
        return;
    }

    // Calculate basic statistics
    const totalPresent = allData.reduce((sum, item) => sum + parseInt(item.present_count), 0);
    const totalAbsent = allData.reduce((sum, item) => sum + parseInt(item.absent_count), 0);
    const avgAttendance = allData.length > 0 ? 
        (allData.reduce((sum, item) => sum + parseFloat(item.attendance_rate), 0) / allData.length).toFixed(1) : 0;
    
    // Find top department
    const departmentRates = {};
    allData.forEach(item => {
        if (item.department && item.attendance_rate) {
            if (!departmentRates[item.department]) {
                departmentRates[item.department] = [];
            }
            departmentRates[item.department].push(parseFloat(item.attendance_rate));
        }
    });

    let topDept = 'N/A';
    let topRate = 0;

    Object.keys(departmentRates).forEach(dept => {
        const avgRate = departmentRates[dept].reduce((a, b) => a + b) / departmentRates[dept].length;
        if (avgRate > topRate) {
            topRate = avgRate;
            topDept = dept;
        }
    });

    const uniqueCategories = new Set();
    allData.forEach(item => {
        if (item.attendance_category_id) {           
            uniqueCategories.add(item.attendance_category_id);
        }
    });
    const totalDistinctCategories = uniqueCategories.size;

    const uniqueAttendanceIds = new Set();
    allData.forEach(item => {
    
        if (item.unique_id) {
            uniqueAttendanceIds.add(item.unique_id);
        } 
    });
    
    const totalDistinctAttendanceRecords = uniqueAttendanceIds.size;

    document.getElementById('totalPresent').textContent = totalPresent.toLocaleString();
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';
    document.getElementById('topDepartment').textContent = topDept;
    document.getElementById('topDepartmentRate').textContent = topRate.toFixed(1) + '% attendance';
    document.getElementById('totalCategory').textContent = totalDistinctCategories.toString(); 
    document.getElementById('totalCategoryNo').textContent = totalDistinctAttendanceRecords.toString()  + ' memebers in Toatal'; 
}
function generateReport() { 
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const department_id = document.getElementById('department_id').value;
    const attendance_category = document.getElementById('attendance_category').value;
    const attendance_category_id = document.getElementById('attendance_category_id').value;
    
    let reportData = filteredData || allData || [];
    
    // Apply additional filters if needed
    reportData = reportData.filter(item => {
        // Date filter
        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        // Department filter
        if (department_id && department_id !== 'all' && 
            item.department_id != department_id && 
            item.department !== 'All') return false;
        
        // Attendance category filter
        if (attendance_category && attendance_category !== 'all' && 
            item.attendance_category !== attendance_category) return false;
        
        // Specific activity/event filter
        if (attendance_category_id && attendance_category_id !== 'all' && 
            item.attendance_category_id != attendance_category_id) return false;
        
        return true;
    });

    // Calculate statistics
    const totalRecords = reportData.length;
    
    // Count present/absent per unique date+category combination
    const attendanceByDate = {};
    
    reportData.forEach(item => {
        const key = `${item.created_at}_${item.attendance_category_id}_${item.department_id}`;
        if (!attendanceByDate[key]) {
            attendanceByDate[key] = {
                date: item.created_at,
                category_type: item.attendance_category,
                activity_name: item.activity_name,
                department: item.department,
                first_name: item.first_name,
                present: 0,
                absent: 0,
                total: 0
            };
        }
        
        if (item.status === 'Present') {
            attendanceByDate[key].present++;
        } else if (item.status === 'Absent') {
            attendanceByDate[key].absent++;
        }
        attendanceByDate[key].total++;
    });

    // Convert to array and calculate attendance rates
    const summaryData = Object.values(attendanceByDate).map(item => {
        const attendanceRate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
        return {
            ...item,
            attendance_rate: attendanceRate
        };
    });

    // Calculate overall statistics
    const totalPresent = summaryData.reduce((sum, item) => sum + item.present, 0);
    const totalAbsent = summaryData.reduce((sum, item) => sum + item.absent, 0);
    const totalActivities = summaryData.length;
    const totalParticipants = totalPresent + totalAbsent;
    const averageAttendance = totalParticipants > 0 ? Math.round((totalPresent / totalParticipants) * 100) : 0;
    
    // Get category type display text
    const categoryTypeDisplay = attendance_category === 'activity' ? 'Activity' :
                              attendance_category === 'event' ? 'Event' :
                              'Activity/Event';
    
    // Get department display text
    const departmentSelect = document.getElementById('department_id');
    const selectedDeptOption = departmentSelect.options[departmentSelect.selectedIndex];
    const departmentDisplay = department_id === 'all' ? 'All Departments' : 
                            selectedDeptOption ? selectedDeptOption.textContent : department_id;
    
    // Get activity/event display text
    let activityDisplay = 'All';
    if (attendance_category_id && attendance_category_id !== 'all') {
        const categorySelect = document.getElementById('attendance_category_id');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        if (selectedOption) {
            activityDisplay = selectedOption.textContent;
        }
    }

    // Generate report HTML
    const reportHTML = `
        <div class="report-modal">
            <div class="report-header">
                <h2>Attendance Report</h2>
                <span class="report-date">Generated: ${new Date().toLocaleDateString()}</span>
            </div>
            
            <div class="report-filters-summary">
                <h3>Report Criteria</h3>
                <p><strong>Date Range:</strong> ${startDate || 'Any'} to ${endDate || 'Any'}</p>
                <p><strong>Department:</strong> ${departmentDisplay}</p>
                <p><strong>Category Type:</strong> ${attendance_category === 'all' ? 'All Categories' : categoryTypeDisplay}</p>
                <p><strong>Specific ${categoryTypeDisplay}:</strong> ${activityDisplay}</p>
            </div>
            
            <div class="report-statistics">
                <h3>Summary Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${totalPresent}</span>
                        <span class="stat-label">Total Present</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalAbsent}</span>
                        <span class="stat-label">Total Absent</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${totalActivities}</span>
                        <span class="stat-label">Total ${categoryTypeDisplay}s</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${averageAttendance}%</span>
                        <span class="stat-label">Average Attendance Rate</span>
                    </div>
                </div>
            </div>
            
            <div class="report-details">
                <h3>Attendance Details</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category Type</th>
                            <th>Activity/Event</th>
                            <th>Department</th>                            
                            <th>Members Name</th>                            
                            <th>Total Members</th>
                            <th>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summaryData.map(item => `
                            <tr>
                                <td>${formatDate(item.date)}</td>
                                <td>${item.category_type === 'activity' ? 'Activity' : 'Event'}</td>
                                <td>${escapeHtml(item.activity_name)}</td>
                                <td>${escapeHtml(item.department)}</td>
                                <td>${escapeHtml(item.first_name)}</td>                              
                                <td>${item.total}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${item.attendance_rate}%">
                                            ${item.attendance_rate}%
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="report-actions">
                <button onclick="printReport()" class="btn-primary">
                    <i class="fas fa-print"></i> Print Report
                </button>
                <button onclick="closeReport()" class="btn-secondary">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;

    // Create and show report modal
    const reportModal = document.createElement('div');
    reportModal.className = 'report-modal-overlay';
    reportModal.innerHTML = reportHTML;
    document.body.appendChild(reportModal);
}

function printReport() {
    const printContent = document.querySelector('.report-modal').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Re-initialize any necessary scripts
    window.location.reload();
}

function closeReport() {
    const overlay = document.querySelector('.report-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('report-modal-overlay')) {
        closeReport();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
                closeReport();
    }
});

let attendanceChart = null;
let chartVisible = false;
    
// Pagination variables
let currentPage = 1;
const itemsPerPage = 5;
let allData = [];
let filteredData = [];
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    initializeSearchAndPagination();
});







async function loadWeeklyTrend() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        // Since we don't have a direct API for weekly trend, we'll calculate from existing data
        // Or you can create a separate method in Report class if needed
        initializeChart();
    } catch (error) {
        console.error('Error loading weekly trend:', error);
    }
}



    function initializeChart() {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        
        // Calculate weekly data from allData
        const weeklyData = calculateWeeklyData();
        
        if (attendanceChart) {
            attendanceChart.destroy();
        }
        
        attendanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Attendance',
                    data: weeklyData.values,
                    backgroundColor: 'rgba(135, 134, 227, 0.8)',
                    borderColor: 'rgba(135, 134, 227, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Attendees'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }

    function calculateWeeklyData() {
        // Group data by date and calculate total attendance per date
        const dailyData = {};
        allData.forEach(item => {
            const date = item.date;
            if (!dailyData[date]) {
                dailyData[date] = 0;
            }
            dailyData[date] += parseInt(item.present_count);
        });

        // Get last 7 days or available dates
        const dates = Object.keys(dailyData).sort().slice(-7);
        const labels = dates.map(date => formatChartDate(date));
        const values = dates.map(date => dailyData[date]);

        return { labels, values };
    }

    function formatChartDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    function toggleChart() {
        const chartModal = document.getElementById('chartModal');
        const chartButton = document.getElementById('chartToggleBtn');
        
        chartVisible = !chartVisible;
        
        if (chartVisible) {
            chartModal.style.display = 'flex';
            chartButton.innerHTML = '<i class="fas fa-times"></i> Hide Chart';
            chartButton.classList.add('btn-close-active');
            
            // Update chart on show to ensure proper rendering
            setTimeout(() => {
                if (attendanceChart) {
                    attendanceChart.update();
                }
            }, 100);
        } else {
            chartModal.style.display = 'none';
            chartButton.innerHTML = '<i class="fas fa-chart-line"></i> Show Chart';
            chartButton.classList.remove('btn-close-active');
        }
    }
    
    function applyFilters() {
        currentPage = 1;
        loadAttendanceData();
    }
    
    function exportToCSV() {
        if (allData.length === 0) {
            showError('No data to export');
            return;
        }

        // Create CSV content
        const headers = ['Date', 'Activity', 'Department', 'Present', 'Absent', 'Attendance Rate'];
        const csvContent = [
            headers.join(','),
            ...allData.map(item => [
                item.date,
                `"${item.activity_name.replace(/"/g, '""')}"`,
                `"${item.department.replace(/"/g, '""')}"`,
                item.present_count,
                item.absent_count,
                item.attendance_rate
            ].join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Search and Pagination Functions (same as before)
    function initializeSearchAndPagination() {
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
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(currentSearchTerm)
                );
            });
        }
        renderTable();
        renderPagination();
        updateResultsCount();
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
    
   

   