
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

// --- Full report pagination variables ---
let fullCurrentPage = 1;
const fullItemsPerPage = 5;
let isFullReportVisible = false;
const fullTableContainer = document.getElementById('fullTableContainer');
const mainContent = document.getElementById('reportMainContent');
const fullContent = document.getElementById('fullReportContent');

// -------------------- Existing functions (unchanged) --------------------
async function loadInitialData() {
    try {
        const deptResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=departments');
        const deptData = await deptResponse.json();
        if (deptData.success) {
            populateDepartments(deptData.data);
        }

        const activityResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=activities');
        const activityData = await activityResponse.json();
        if (activityData.success) {
            populateSelect(activityData.data);
        }

        const eventResponse = await fetch('../class/ApiHandler.php?action=getAll&entity=events');
        const eventData = await eventResponse.json();
        if (eventData.success) {
            populateSelect(eventData.data);
        }

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

    const uniqueActivities = activities.reduce((acc, activity) => {
        if (!acc.find(item => item.id === activity.id)) {
            acc.push({
                id: activity.id,
                displayText: activity.name || activity.title
            });
        }
        return acc;
    }, []);

    uniqueActivities.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id;
        option.textContent = activity.displayText;
        option.selected = (activity.id.toString() === currentActivity.toString());
        select.appendChild(option);
    });
}

function getTableContainer() {
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
                            
                        </tr>
                    </thead>
                    <tbody id="attendanceTableBody">
                        <tr>
                            <td colspan="6" class="no-data">Loading data...</td>
                        </tr>
                    </tbody>
                </table>
                <div class="pagination" id="pagination"></div>
                <div class="page-info" id="page-info"></div>
    `;
    tableContainer.innerHTML = content;
}
getTableContainer();

function getFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const startDate = urlParams.get('start_date') || getFirstDayOfMonth();
    const endDate = urlParams.get('end_date') || getCurrentDate();
    const reportFilter = document.getElementById('report-filters');

    function getFirstDayOfMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }
    function getCurrentDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

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
                    <option>First select category</option>                     
                </select>
            </div>
            <div class="filter-group">
                <button class="btn-primary" onclick="applyFilters()">
                    <i class="fas fa-filter"></i> Apply Filters
                </button>
            </div>
        </div>`;
    reportFilter.innerHTML = content;
    const attendance_category = document.getElementById('attendance_category');
    attendance_category.addEventListener('change', function() {
        const selectedValue = this.value;
        const categorySelect = document.getElementById('attendance_category_id');
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
    });
}
getFilters();

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

        const url = '../class/ApiHandler.php?action=special&entity=reports';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        const result = await response.json();

        if (result.success) {
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
            
        </tr>`;
    }).join('');
}


function updateSummary() {
    if (!allData || allData.length === 0) {
        document.getElementById('totalRecord').textContent = '0';
        document.getElementById('totalLate').textContent = '0';
        document.getElementById('totalPresent').textContent = '0';
        document.getElementById('avgAttendance').textContent = '0%';
        document.getElementById('topDepartment').textContent = 'N/A';
        document.getElementById('topDepartmentRate').textContent = '0% attendance';
        document.getElementById('totalCategory').textContent = '0';
        document.getElementById('totalCategoryNo').textContent = '0';
        return;
    }

    // Count present/absent from individual records
    const totalRecord = allData.length;
    const totalPresent = allData.filter(item => item.status.toLowerCase() === 'present').length;
    const totalLate = allData.filter(item => item.status.toLowerCase() === 'late').length;
    const totalAbsent = allData.filter(item => item.status.toLowerCase() === 'absent').length;    
    const presentPercentage = totalRecord > 0 ? Math.round((totalPresent / totalRecord) * 100) : 0;
    const latePercentage = totalRecord > 0 ? Math.round((totalLate / totalRecord) * 100) : 0;

    // Calculate top department (department with highest attendance rate)
    const deptStats = {};
    allData.forEach(item => {
        const dept = item.department || 'Unknown';
        if (!deptStats[dept]) {
            deptStats[dept] = { present: 0, total: 0 };
        }
        if (item.status.toLowerCase() === 'present') {
            deptStats[dept].present++;
        }
        deptStats[dept].total++;
    });

    let topDept = 'N/A';
    let topRate = 0;
    Object.keys(deptStats).forEach(dept => {
        const rate = deptStats[dept].total > 0 ? Math.round((deptStats[dept].present / deptStats[dept].total) * 100) : 0;
        if (rate > topRate) {
            topRate = rate;
            topDept = dept;
        }
    });

    // Total categories (distinct attendance_category_id)
    const uniqueCategories = new Set(allData.map(item => item.attendance_category_id).filter(id => id));
    const totalDistinctCategories = uniqueCategories.size;

    // Total distinct members (unique_id)
    const uniqueMembers = new Set(allData.map(item => item.unique_id).filter(id => id));
    const totalDistinctMembers = uniqueMembers.size;

    document.getElementById('totalRecord').textContent = totalRecord.toLocaleString();
    document.getElementById('totalLate').textContent = totalLate.toLocaleString();
    document.getElementById('totalPresent').textContent = totalPresent.toLocaleString();
    document.getElementById('presentPercentage').textContent = presentPercentage + '%';
    document.getElementById('latePercentage').textContent = latePercentage + '%';
    document.getElementById('topDepartment').textContent = topDept;
    document.getElementById('topDepartmentRate').textContent = topRate + '% attendance';
    document.getElementById('totalCategory').textContent = totalDistinctCategories.toString();
    document.getElementById('totalCategoryNo').textContent = totalDistinctMembers.toString() + ' members in Total';
}

function generateReport() { 
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const department_id = document.getElementById('department_id').value;
    const attendance_category = document.getElementById('attendance_category').value;
    const attendance_category_id = document.getElementById('attendance_category_id').value;
    
    let reportData = filteredData || allData || [];
    reportData = reportData.filter(item => {
        const itemDateStr = item.date || item.created_at;
        const itemDate = new Date(item.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        if (department_id && department_id !== 'all' && 
            item.department_id != department_id && 
            item.department !== 'All') return false;
        if (attendance_category && attendance_category !== 'all' && 
            item.attendance_category !== attendance_category) return false;
        if (attendance_category_id && attendance_category_id !== 'all' && 
            item.attendance_category_id != attendance_category_id) return false;
        return true;
    });

    const attendanceByDate = {};
    reportData.forEach(item => {
        // const key = `${item.created_at}_${item.attendance_category_id}_${item.department_id}`;
        const dateOnly = (item.date || item.created_at).split(' ')[0];
        const key = `${dateOnly}_${item.attendance_category}_${item.attendance_category_id}_${item.department}`;
        if (!attendanceByDate[key]) {
            attendanceByDate[key] = {
                date: item.created_at,
                category_type: item.attendance_category,
                activity_name: item.activity_name,
                department: item.department,
                first_name: item.first_name,
                present: 0,
                late: 0,
                status: 0
            };
        }
        if (item.status === 'present') {
            attendanceByDate[key].present++;
        } else if (item.status === 'late') {
            attendanceByDate[key].late++;
        }
        attendanceByDate[key].total++;
    });

    const summaryData = Object.values(attendanceByDate).map(item => {
        const attendanceRate = item.status > 0 ? Math.round((item.present / item.status) * 100) : 0;
        return {
            ...item,
            attendance_rate: attendanceRate
        };
    });

    const totalPresent = summaryData.reduce((sum, item) => sum + item.present, 0);
    const totalAbsent = summaryData.reduce((sum, item) => sum + item.late, 0);
    const totalActivities = summaryData.length;
    const totalParticipants = totalPresent + totalAbsent;
    const averageAttendance = totalParticipants > 0 ? Math.round((totalPresent / totalParticipants) * 100) : 0;
    
    const categoryTypeDisplay = attendance_category === 'activity' ? 'Activity' :
                              attendance_category === 'event' ? 'Event' :
                              'Activity/Event';
    
    const departmentSelect = document.getElementById('department_id');
    const selectedDeptOption = departmentSelect.options[departmentSelect.selectedIndex];
    const departmentDisplay = department_id === 'all' ? 'All Departments' : 
                            selectedDeptOption ? selectedDeptOption.textContent : department_id;
    
    let activityDisplay = 'All';
    if (attendance_category_id && attendance_category_id !== 'all') {
        const categorySelect = document.getElementById('attendance_category_id');
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        if (selectedOption) {
            activityDisplay = selectedOption.textContent;
        }
    }

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
                        <span class="stat-label">Total Late</span>
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
                            <th>Members Status</th>
                            
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
    window.location.reload();
}

function closeReport() {
    const overlay = document.querySelector('.report-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('report-modal-overlay')) {
        closeReport();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeReport();
    }
});

let attendanceChart = null;
let chartVisible = false;

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
        initializeChart();
    } catch (error) {
        console.error('Error loading weekly trend:', error);
    }
}

function initializeChart() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
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
    const dailyData = {};

    allData.forEach(item => {
        // your SQL aliases dayofactivity as `date`
        // fall back to created_at if `date` is empty
        const rawDate = item.date || item.created_at;
        if (!rawDate) return;

        // normalize to YYYY-MM-DD (handles "2024-01-15 10:20:30" too)
        const date = String(rawDate).split(' ')[0];

        if (!dailyData[date]) {
            dailyData[date] = 0;
        }

        // count only present records
        if (item.status && String(item.status).toLowerCase() === 'present') {
            dailyData[date]++;
        }
    });

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
    const headers = ['Date','Name', 'Activity', 'Department', 'Time In','Status'];
    const csvContent = [
        headers.join(','),
        ...allData.map(item => [
            item.date,
            item.first_name,
            `"${item.activity_name.replace(/"/g, '""')}"`,
            `"${item.department.replace(/"/g, '""')}"`,            
            item.check_in_time,           
            item.status,           
        ].join(','))
    ].join('\n');
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

// --- MODIFIED: filterData() now resets fullCurrentPage and updates full table ---
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
    // Reset both paginations to page 1 when filters change
    currentPage = 1;
    fullCurrentPage = 1;
    renderTable();
    renderPagination();
    updateResultsCount();
    if (isFullReportVisible) {
        renderFullTable();
    }
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

// ======================== FULL REPORT FUNCTIONS ========================

function viewFullReport() {
    isFullReportVisible = true;
    fullCurrentPage = 1; // reset to first page
    mainContent.style.display = 'none';
    fullContent.style.display = 'block';
    renderFullTable();
}

function backToReport() {
    isFullReportVisible = false;
    fullContent.style.display = 'none';
    mainContent.style.display = 'block';
    renderTable();
    renderPagination();
}

function renderFullTable() {
    if (!fullTableContainer) return;
    // Build the table structure if not present
    let table = fullTableContainer.querySelector('table');
    if (!table) {
        fullTableContainer.innerHTML = `
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
                        
                    </tr>
                </thead>
                <tbody id="fullTableBody"></tbody>
            </table>
            <div id="fullPagination" class="pagination"></div>
        `;
        table = fullTableContainer.querySelector('table');
    }
    const tbody = document.getElementById('fullTableBody');
    if (!tbody) return;

    const data = filteredData;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No records found</td></tr>';
        // Hide pagination if no data
        const paginationDiv = document.getElementById('fullPagination');
        if (paginationDiv) paginationDiv.innerHTML = '';
        return;
    }

    // Calculate pagination for full report
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / fullItemsPerPage);
    // Ensure current page is within bounds
    if (fullCurrentPage > totalPages) fullCurrentPage = totalPages;
    if (fullCurrentPage < 1) fullCurrentPage = 1;

    const startIndex = (fullCurrentPage - 1) * fullItemsPerPage;
    const endIndex = Math.min(startIndex + fullItemsPerPage, totalItems);
    const pageData = data.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>${formatDate(item.created_at)}</td>
            <td>${escapeHtml(item.attendance_category)}</td>
            <td>${escapeHtml(item.activity_name)}</td>
            <td>${escapeHtml(item.department)}</td>
            <td>${escapeHtml(item.user_name)}</td>
            <td>${escapeHtml(item.first_name)}</td>
            <td>${escapeHtml(item.last_name)}</td>
            <td>${item.status}</td>
           
        </tr>
    `).join('');

    // Render pagination for full report
    renderFullPagination(totalPages);
}

function renderFullPagination(totalPages) {
    const paginationDiv = document.getElementById('fullPagination');
    if (!paginationDiv) return;
    paginationDiv.innerHTML = '';
    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = fullCurrentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (fullCurrentPage > 1) {
            fullCurrentPage--;
            renderFullTable();
        }
    });
    paginationDiv.appendChild(prevBtn);

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, fullCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.toggle('active', i === fullCurrentPage);
        btn.addEventListener('click', () => {
            fullCurrentPage = i;
            renderFullTable();
        });
        paginationDiv.appendChild(btn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = fullCurrentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (fullCurrentPage < totalPages) {
            fullCurrentPage++;
            renderFullTable();
        }
    });
    paginationDiv.appendChild(nextBtn);

    // Optional page info
    const info = document.createElement('span');
    info.className = 'page-info';
    info.textContent = `Page ${fullCurrentPage} of ${totalPages}`;
    paginationDiv.appendChild(info);
}