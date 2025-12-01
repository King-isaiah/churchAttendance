function generateReport() {
    // Get filter values
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const department = document.getElementById('reportDepartment').value;
    const activityType = document.getElementById('activityType').value;
    
    // Get all table rows (skip the header row)
    const tableRows = document.querySelectorAll('.data-table tbody tr');
    const reportData = [];

    // Collect data from table
    tableRows.forEach(row => {
        // Skip empty rows or "no data" rows
        if (row.classList.contains('no-data')) return;
        
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const rowData = {
                date: cells[0].textContent.trim(),
                activity: cells[1].textContent.trim(),
                department: cells[2].textContent.trim(),
                present: parseInt(cells[3].textContent.trim()),
                absent: parseInt(cells[4].textContent.trim()),
                attendanceRate: cells[5].querySelector('.progress-fill').textContent.trim()
            };
            reportData.push(rowData);
        }
    });
    
    // Apply filters
    let filteredData = reportData.filter(item => {
        // Date filter
        const itemDate = new Date(item.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        
        // Department filter
        if (department && item.department !== department && item.department !== 'All') return false;
        
        // Activity type filter
        if (activityType && !item.activity.toLowerCase().includes(activityType.toLowerCase())) return false;
        
        return true;
    });

    // Calculate statistics
    const totalPresent = filteredData.reduce((sum, item) => sum + item.present, 0);
    const totalAbsent = filteredData.reduce((sum, item) => sum + item.absent, 0);
    const totalActivities = filteredData.length;
    const averageAttendance = totalActivities > 0 ? Math.round(totalPresent / totalActivities) : 0;
        
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
                <p><strong>Department:</strong> ${department || 'All Departments'}</p>
                <p><strong>Activity Type:</strong> ${activityType || 'All Activities'}</p>
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
                        <span class="stat-label">Activities</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${averageAttendance}</span>
                        <span class="stat-label">Average Attendance</span>
                    </div>
                </div>
            </div>
            
            <div class="report-details">
                <h3>Attendance Details</h3>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Activity</th>
                            <th>Department</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData.map(item => `
                            <tr>
                                <td>${item.date}</td>
                                <td>${item.activity}</td>
                                <td>${item.department}</td>
                                <td>${item.present}</td>
                                <td>${item.absent}</td>
                                <td>${item.attendanceRate}</td>
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
        
    // Add styles if not already added
    if (!document.getElementById('report-styles')) {
        const styles = document.createElement('style');
        styles.id = 'report-styles';
        styles.textContent = `
            .report-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .report-modal {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                width: 800px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #8786E3;
            }
            
            .report-header h2 {
                margin: 0;
                color: #8786E3;
            }
            
            .report-date {
                color: #6c757d;
                font-size: 0.9rem;
            }
            
            .report-filters-summary {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
            }
            
                .report-filters-summary h3 {
                    margin: 0 0 0.5rem 0;
                    color: #495057;
                }
                
                .report-statistics {
                    margin-bottom: 1.5rem;
                }
                
                .report-statistics h3 {
                    margin: 0 0 1rem 0;
                    color: #495057;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                }
                
                .stat-item {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e9ecef;
                }
                
                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #8786E3;
                    margin-bottom: 0.3rem;
                }
                
                .stat-label {
                    font-size: 0.8rem;
                    color: #6c757d;
                }
                
                .report-details {
                    margin-bottom: 1.5rem;
                }
                
                .report-details h3 {
                    margin: 0 0 1rem 0;
                    color: #495057;
                }
                
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }
                
                .report-table th {
                    background: #f8f9fa;
                    padding: 0.75rem;
                    text-align: left;
                    font-weight: 600;
                    color: #495057;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .report-table td {
                    padding: 0.75rem;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .report-table tr:hover {
                    background: #f8f9fa;
                }
                
                .report-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }
                
                @media (max-width: 768px) {
                    .report-modal {
                        padding: 1rem;
                        width: 95%;
                    }
                
                    .report-header {
                        flex-direction: column;
                            align-items: flex-start;
                            gap: 0.5rem;
                        }
                        
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                        
                        .report-actions {
                            flex-direction: column;
                        }
                    }
                    
            @media print {
                .report-modal-overlay {
                    position: static;
                    background: none;
                    padding: 0;
                }
                
                .report-modal {
                    box-shadow: none;
                    max-width: none;
                    max-height: none;
                }
                
                .report-actions {
                    display: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

    // Helper functions for the report modal
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
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let currentSearchTerm = '';

document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    initializeSearchAndPagination();
});

async function loadInitialData() {
    try {
        // Load departments
        const deptResponse = await fetch('class/ApiHandler.php?action=getAll&entity=departments');
        const deptData = await deptResponse.json();
        
        if (deptData.success) {
            populateDepartments(deptData.data);
        }

        // Load activity types from activities
        const activityResponse = await fetch('class/ApiHandler.php?action=getAll&entity=activities');
        const activityData = await activityResponse.json();
        
        if (activityData.success) {
            populateActivityTypes(activityData.data);
        }

        // Load attendance data
        await loadAttendanceData();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load initial data');
    }
}

function populateDepartments(departments) {
    const select = document.getElementById('reportDepartment');
    const currentDept = '<?php echo $department; ?>';
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        option.selected = (dept.name === currentDept);
        select.appendChild(option);
    });
}

function populateActivityTypes(activities) {
    const select = document.getElementById('activityType');
    const currentActivity = '<?php echo $activityType; ?>';
    const uniqueActivities = [...new Set(activities.map(activity => activity.name))];
    
    uniqueActivities.forEach(activity => {
        if (activity) {
            const option = document.createElement('option');
            option.value = activity;
            option.textContent = activity;
            option.selected = (activity === currentActivity);
            select.appendChild(option);
        }
    });
}

    async function loadAttendanceData() {
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const department = document.getElementById('reportDepartment').value;
            const activityType = document.getElementById('activityType').value;
            
            // Build API URL with filters
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (department) params.append('department', department);
            if (activityType) params.append('activity_type', activityType);
            
            const response = await fetch(`class/ApiHandler.php?action=getAll&entity=attendance&${params.toString()}`);
            const result = await response.json();
            
            if (result.success) {
                allData = result.data;
                filterData();
                updateSummary();
                loadWeeklyTrend();
            } else {
                throw new Error(result.message || 'Failed to load attendance data');
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
            showError('Failed to load attendance data');
        }
    }

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

    function updateSummary() {
        if (allData.length === 0) {
            document.getElementById('totalPresent').textContent = '0';
            document.getElementById('avgAttendance').textContent = '0%';
            document.getElementById('topDepartment').textContent = 'N/A';
            document.getElementById('topDepartmentRate').textContent = '0% attendance';
            return;
        }

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

        document.getElementById('totalPresent').textContent = totalPresent.toLocaleString();
        document.getElementById('avgAttendance').textContent = avgAttendance + '%';
        document.getElementById('topDepartment').textContent = topDept;
        document.getElementById('topDepartmentRate').textContent = topRate.toFixed(1) + '% attendance';
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
                <td>${formatDate(item.date)}</td>
                <td>${escapeHtml(item.activity_name)}</td>
                <td>${escapeHtml(item.department)}</td>
                <td>${item.present_count}</td>
                <td>${item.absent_count}</td>
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
    
    // Utility functions
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

   