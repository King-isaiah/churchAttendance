class UserAttendanceHistory {
    constructor() {
        this.attendanceRecords = [];
        this.filteredRecords = [];
        this.currentPage = 1;
        this.recordsPerPage = 5;
        this.userId = this.getCurrentUserId();
        
        this.months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
        this.years = [2026, 2025];
    }

    init() {
        this.centerDiv(); 
        this.setupEventListeners();
        this.loadAttendanceHistory();
        this.updateSummary();
    }

    centerDiv() {
        const centerDiv = document.getElementById('center-div');
        if (!centerDiv) {
            console.error('center-div element not found!');
            return;
        }
        
        let monthOptions = '';
        if (this.months && Array.isArray(this.months)) {
            for (let i = 0; i < this.months.length; i++) {
                monthOptions += `<option value="${this.months[i]}">${this.months[i]}</option>`;
            }
        }

        let yearOptions = '';
        if (this.years && Array.isArray(this.years)) {
            for (let i = 0; i < this.years.length; i++) {
                yearOptions += `<option value="${this.years[i]}">${this.years[i]}</option>`;
            }
        }
        
        const content = `<div class="attendance-history-page">
                        <div class="page-header">
                            <h2>My Attendance History</h2>
                            <p>Track your participation in church activities</p>
                        </div>

                        <!-- Summary Cards -->
                        <div class="summary-cards">
                            <div class="summary-card total">
                                <div class="summary-icon">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <div class="summary-info">
                                    <h3 id="totalActivities">0</h3>
                                    <p>Total Activities Attended</p>
                                </div>
                            </div>
        
                            <div class="summary-card present">
                                <div class="summary-icon">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="summary-info">
                                    <h3 id="presentCount">0</h3>
                                    <p>Present</p>
                                </div>
                            </div>
                            
                            <div class="summary-card absent">
                                <div class="summary-icon">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                                <div class="summary-info">
                                    <h3 id="absentCount">0</h3>
                                    <p>Late</p>
                                </div>
                            </div>
                            
                            <div class="summary-card rate">
                                <div class="summary-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="summary-info">
                                    <h3 id="attendanceRate">0%</h3>
                                    <p>Attendance Rate</p>
                                </div>
                            </div>
                        </div>

                        <!-- Filters -->
                        <div class="filters-section">
                            <div class="filter-group">
                                <label>Month:</label>
                                <select id="monthFilter">
                                    <option value="all">All Months</option>
                                    ${monthOptions}
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label>Year:</label>
                                <select id="yearFilter">
                                    <option value="all">All Years</option>
                                    ${yearOptions}
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label>Status:</label>
                                <select id="statusFilter">
                                    <option value="all">All Status</option>
                                    <option value="present">Present</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>
                         
                        </div>

                        <!-- Results Count -->
                        <div class="results-count" id="resultsCountContainer" style="margin: 1rem 0; display: none;">
                            <p>Showing <span id="resultsRange">0-0</span> of <span id="totalResults">0</span> records</p>
                        </div>

                        <!-- Attendance Table -->
                        <div class="table-container">
                            <table class="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Activity/Event</th>
                                        <th>Location</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Clocked IN</th>                                    
                                        <th>Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody id="attendanceTableBody">
                                    <tr>
                                        <td colspan="8" class="no-data">
                                            <i class="fas fa-spinner fa-spin"></i>
                                            <p>Loading attendance records...</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        
                        <div class="pagination" id="pagination" style="margin: 1rem 0; display: none;"></div>

                        <!-- <div class="export-section">
                            <button class="btn-secondary" id="exportBtn">
                                <i class="fas fa-download"></i> Export to CSV
                            </button>
                        </div> -->
                    </div>`;
        
        centerDiv.innerHTML = content;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'applyFiltersBtn' || e.target.closest('#applyFiltersBtn')) {
                this.applyFilters();
            }
            if (e.target.id === 'exportBtn' || e.target.closest('#exportBtn')) {
                this.exportToCSV();
            }
            if (e.target.classList.contains('pagination-btn') && !e.target.classList.contains('disabled')) {
                const page = parseInt(e.target.dataset.page);
                if (page && !isNaN(page)) {
                    this.goToPage(page);
                }
            }
        });

        setTimeout(() => {
            const monthFilter = document.getElementById('monthFilter');
            const yearFilter = document.getElementById('yearFilter');
            const statusFilter = document.getElementById('statusFilter');
            
            if (monthFilter) monthFilter.addEventListener('change', () => this.loadAttendanceHistory());
            if (yearFilter) yearFilter.addEventListener('change', () => this.loadAttendanceHistory());
            if (statusFilter) statusFilter.addEventListener('change', () => this.loadAttendanceHistory());
        }, 100);
    }

    async loadAttendanceHistory() {
        try {
            this.showLoading(true);
            
            const records = await this.fetchAttendanceHistory();
            this.attendanceRecords = records;
            this.filteredRecords = [...records];
            
            this.renderAttendanceTable();
            this.updatePagination();
            this.updateSummary();
            this.showLoading(false);
            this.showResultsCount(true);
        } catch (error) {
            console.error('Error loading attendance history:', error);
            this.showError('Failed to load attendance history. Please try again.');
            this.showLoading(false);
        }
    }

    async fetchAttendanceHistory() {
        try {   
            const year = document.getElementById('yearFilter')?.value || 'all';
            const month = document.getElementById('monthFilter')?.value || 'all';    
            const status = document.getElementById('statusFilter')?.value || 'all';
            const unique_id = this.getCurrentUserId();

            const jsonData = {
                year: year,
                month: month,
                status: status,               
                unique_id: unique_id,               
            };
            
            console.log('Fetching attendance data:', jsonData);
    
            const url = 'class/ApiHandler.php?action=special&entity=reports';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                return this.transformApiData(result.data);
            } else {
                console.error('API returned error:', result.message);
                
            }
        } 
        catch (error) {
            console.error('Error loading attendance data:', error);
           
        }
    }

    transformApiData(apiData) {
        const individualRecords = [];
        
        apiData.forEach(group => {           
            for (let i = 0; i < (group.present_count || 0); i++) {
                individualRecords.push({
                    id: `${group.date}_${group.activity_or_event_name}_present_${i}`,
                    date: group.date || group.created_at,
                    activity_name: group.activity_or_event_name || 'Unknown',
                    location: group.location_name || 'Unknown',
                    category: group.attendance_category || 'activity',
                    status: group.status,
                    present_count: group.check_in_time,                
                    attendance_rate: group.attendance_rate || 0,                    
                });
            }
            
            
        });
        
        return individualRecords;
    }

    getCurrentUserId() {
        // Try different methods to get the user's unique_id
        const uniqueIdElement = document.getElementById('unique_id');
        if (uniqueIdElement && uniqueIdElement.value) {
            return uniqueIdElement.value;
        }
        
        const storedId = localStorage.getItem('user_unique_id') || 
                         sessionStorage.getItem('user_unique_id');
        
        if (storedId) {
            return storedId;
        }
        
        // If no ID found, return a default for testing
        console.warn('No unique_id found, using default');
        return 1; // You should replace this with actual user ID logic
    }


    applyFilters() {
        const monthFilter = document.getElementById('monthFilter')?.value || 'all';
        const yearFilter = document.getElementById('yearFilter')?.value || 'all';
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';

        this.filteredRecords = this.attendanceRecords.filter(record => {
            const recordDate = new Date(record.date);
            const recordMonth = recordDate.toLocaleString('en-US', { month: 'long' });
            const recordYear = recordDate.getFullYear().toString();

            const matchesMonth = monthFilter === 'all' || recordMonth === monthFilter;
            const matchesYear = yearFilter === 'all' || recordYear === yearFilter;
            const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

            return matchesMonth && matchesYear && matchesStatus;
        });

        this.currentPage = 1;
        this.renderAttendanceTable();
        this.updatePagination();
        this.updateSummary();
        this.updateResultsCount();
    }

    renderAttendanceTable() {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageRecords = this.filteredRecords.slice(startIndex, endIndex);

        if (pageRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No attendance records found for the selected filters</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageRecords.map(record => `
            <tr class="attendance-row status-${record.status}">
                <td>
                    <div class="date-cell">
                        <strong>${this.formatDate(record.date, 'M j, Y')}</strong>
                        <span>${this.formatDate(record.date, 'D')}</span>
                    </div>
                </td>
                <td>${this.escapeHtml(record.activity_name)}</td>
                <td>${this.escapeHtml(record.location)}</td>
                <td>
                    <span class="category-badge">${record.category === 'activity' ? 'Activity' : 'Event'}</span>
                </td>
                <td>
                    <span class="status-badge status-${record.status}">
                        ${this.capitalizeFirst(record.status)}
                    </span>
                </td>
                <td>${record.present_count}</td>               
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${record.attendance_rate}%">
                            ${record.attendance_rate}%
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateResultsCount();
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            pagination.style.display = 'none';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
            `;
        }

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.currentPage + 1}">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        pagination.innerHTML = paginationHTML;
        pagination.style.display = 'flex';
    }

    updateResultsCount() {
        const startIndex = (this.currentPage - 1) * this.recordsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.recordsPerPage, this.filteredRecords.length);
        const totalCount = this.filteredRecords.length;

        const resultsRange = document.getElementById('resultsRange');
        const totalResults = document.getElementById('totalResults');
        const resultsContainer = document.getElementById('resultsCountContainer');

        if (resultsRange && totalResults && resultsContainer) {
            resultsRange.textContent = totalCount > 0 ? `${startIndex}-${endIndex}` : '0-0';
            totalResults.textContent = totalCount;
            resultsContainer.style.display = totalCount > 0 ? 'block' : 'none';
        }
    }

    showResultsCount(show) {
        const container = document.getElementById('resultsCountContainer');
        if (container) {
            container.style.display = show ? 'block' : 'none';
        }
    }

    updateSummary() {
        const totalCount = this.filteredRecords.length;
        const presentCount = this.filteredRecords.filter(record => record.status === 'present').length;
        const absentCount = this.filteredRecords.filter(record => record.status === 'absent').length;
        const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        // Update summary cards
        const totalEl = document.getElementById('totalActivities');
        const presentEl = document.getElementById('presentCount');
        const absentEl = document.getElementById('absentCount');
        const rateEl = document.getElementById('attendanceRate');

        if (totalEl) totalEl.textContent = totalCount;
        if (presentEl) presentEl.textContent = presentCount;
        if (absentEl) absentEl.textContent = absentCount;
        if (rateEl) rateEl.textContent = attendanceRate + '%';
    }

    goToPage(page) {
        if (page >= 1 && page <= Math.ceil(this.filteredRecords.length / this.recordsPerPage)) {
            this.currentPage = page;
            this.renderAttendanceTable();
            this.updatePagination();
            this.updateResultsCount();
        }
    }

    exportToCSV() {
        if (this.filteredRecords.length === 0) {
            this.showMessage('No data to export', 'warning');
            return;
        }

        try {
            const csvContent = this.generateCSV();
            this.downloadCSV(csvContent, `attendance_history_${new Date().toISOString().split('T')[0]}.csv`);
            this.showMessage('Attendance data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showMessage('Error exporting data', 'error');
        }
    }

    generateCSV() {
        const headers = ['Date', 'Activity/Event', 'Location', 'Category', 'Status', 'Present', 'Absent', 'Attendance Rate'];
        const csvRows = [headers.join(',')];

        this.filteredRecords.forEach(record => {
            const row = [
                this.formatDate(record.date, 'Y-m-d'),
                `"${record.activity_name.replace(/"/g, '""')}"`,
                `"${record.location.replace(/"/g, '""')}"`,
                record.category,
                record.status,
                record.present_count,
                record.absent_count,
                record.attendance_rate
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    showLoading(show) {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading attendance records...</p>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="userAttendanceHistory.loadAttendanceHistory()" style="margin-top: 1rem;">
                        Try Again
                    </button>
                </td>
            </tr>
        `;
    }

    showMessage(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else if (typeof showError === 'function' && type === 'error') {
            showError(message);
        } else if (typeof showSuccess === 'function' && type === 'success') {
            showSuccess(message);
        } else {
            alert(message);
        }
    }

    formatDate(dateString, format) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        if (format === 'Y-m-d') {
            return date.toISOString().split('T')[0];
        }
        
        const options = {
            'M j, Y': { month: 'short', day: 'numeric', year: 'numeric' },
            'D': { weekday: 'short' }
        };
        
        return date.toLocaleDateString('en-US', options[format] || {});
    }

    formatDateTime(dateTimeString, format = 'M j, Y g:i A') {
        if (!dateTimeString) return '';
        
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return dateTimeString;

        if (format === 'Y-m-d H:i') {
            return date.toISOString().replace('T', ' ').substring(0, 16);
        }
        
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    capitalizeFirst(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize attendance history when page loads
let userAttendanceHistory;

document.addEventListener('DOMContentLoaded', () => {
    userAttendanceHistory = new UserAttendanceHistory();
    userAttendanceHistory.init();
});