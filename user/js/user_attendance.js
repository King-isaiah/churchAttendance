// User Attendance History functionality
class UserAttendanceHistory {
    constructor() {
        this.attendanceRecords = [];
        this.filteredRecords = [];
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAttendanceHistory();
        this.initializeSummary();
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('monthFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('yearFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());

        // Export functionality
        document.querySelector('.export-section button').addEventListener('click', () => this.exportToCSV());
    }

    async loadAttendanceHistory() {
        try {
            this.showLoading(true);
            
            const records = await this.fetchAttendanceHistory();
            this.attendanceRecords = records;
            this.filteredRecords = records;
            
            this.renderAttendanceTable();
            this.updatePagination();
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading attendance history:', error);
            this.showError('Failed to load attendance history');
            this.showLoading(false);
        }
    }

    async fetchAttendanceHistory() {
        // Simulate API call - replace with actual API endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        date: '2024-01-21',
                        activity_name: 'Sunday Service',
                        time: '10:00 AM',
                        location: 'Main Sanctuary',
                        status: 'present',
                        checked_in: '2024-01-21 10:05 AM'
                    },
                    {
                        id: 2,
                        date: '2024-01-20',
                        activity_name: 'Youth Night',
                        time: '6:00 PM',
                        location: 'Youth Hall',
                        status: 'absent',
                        checked_in: null
                    },
                    {
                        id: 3,
                        date: '2024-01-14',
                        activity_name: 'Sunday Service',
                        time: '10:00 AM',
                        location: 'Main Sanctuary',
                        status: 'present',
                        checked_in: '2024-01-14 10:02 AM'
                    },
                    {
                        id: 4,
                        date: '2024-01-13',
                        activity_name: 'Bible Study',
                        time: '7:00 PM',
                        location: 'Room 101',
                        status: 'present',
                        checked_in: '2024-01-13 19:05 PM'
                    },
                    {
                        id: 5,
                        date: '2024-01-07',
                        activity_name: 'Sunday Service',
                        time: '10:00 AM',
                        location: 'Main Sanctuary',
                        status: 'absent',
                        checked_in: null
                    }
                ]);
            }, 1000);
        });

        // Actual implementation would be:
        /*
        try {
            const response = await fetch('class/ApiHandler.php?entity=attendance&action=getUserHistory');
            const data = await response.json();
            return data.success ? data.data : [];
        } catch (error) {
            throw new Error('Network error');
        }
        */
    }

    applyFilters() {
        const monthFilter = document.getElementById('monthFilter').value;
        const yearFilter = document.getElementById('yearFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

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
    }

    renderAttendanceTable() {
        const tbody = document.querySelector('.attendance-table tbody');
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageRecords = this.filteredRecords.slice(startIndex, endIndex);

        if (pageRecords.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
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
                <td>${record.time}</td>
                <td>${this.escapeHtml(record.location)}</td>
                <td>
                    <span class="status-badge status-${record.status}">
                        ${this.capitalizeFirst(record.status)}
                    </span>
                </td>
                <td>
                    ${record.checked_in ? 
                        this.formatDateTime(record.checked_in) : 
                        '<span class="no-checkin">-</span>'
                    }
                </td>
            </tr>
        `).join('');

        // Update results count
        this.updateResultsCount();
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="userAttendanceHistory.previousPage()" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="userAttendanceHistory.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="userAttendanceHistory.nextPage()" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    updateResultsCount() {
        const startIndex = (this.currentPage - 1) * this.recordsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.recordsPerPage, this.filteredRecords.length);
        const totalCount = this.filteredRecords.length;

        const resultsCount = document.getElementById('results-count');
        const totalCountElement = document.getElementById('total-count');

        if (resultsCount && totalCountElement) {
            resultsCount.textContent = `${startIndex}-${endIndex}`;
            totalCountElement.textContent = totalCount;
        }
    }

    updateSummary() {
        const presentCount = this.filteredRecords.filter(record => record.status === 'present').length;
        const absentCount = this.filteredRecords.filter(record => record.status === 'absent').length;
        const totalCount = this.filteredRecords.length;
        const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

        // Update summary cards
        document.querySelector('.summary-card.total h3').textContent = totalCount;
        document.querySelector('.summary-card.present h3').textContent = presentCount;
        document.querySelector('.summary-card.absent h3').textContent = absentCount;
        document.querySelector('.summary-card.rate h3').textContent = attendanceRate + '%';
    }

    initializeSummary() {
        // Initial summary will be updated after data loads
        setTimeout(() => {
            this.updateSummary();
        }, 1500);
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderAttendanceTable();
            this.updatePagination();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredRecords.length / this.recordsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderAttendanceTable();
            this.updatePagination();
        }
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderAttendanceTable();
        this.updatePagination();
    }

    exportToCSV() {
        if (this.filteredRecords.length === 0) {
            this.showMessage('No data to export', 'warning');
            return;
        }

        try {
            const csvContent = this.generateCSV();
            this.downloadCSV(csvContent, 'attendance_history.csv');
            this.showMessage('Attendance data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showMessage('Error exporting data', 'error');
        }
    }

    generateCSV() {
        const headers = ['Date', 'Activity', 'Time', 'Location', 'Status', 'Checked In'];
        const csvRows = [headers.join(',')];

        this.filteredRecords.forEach(record => {
            const row = [
                this.formatDate(record.date, 'Y-m-d'),
                `"${record.activity_name}"`,
                record.time,
                `"${record.location}"`,
                record.status,
                record.checked_in ? this.formatDateTime(record.checked_in, 'Y-m-d H:i') : 'N/A'
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
    }

    showLoading(show) {
        const tbody = document.querySelector('.attendance-table tbody');
        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading attendance records...</p>
                    </td>
                </tr>
            `;
        }
    }

    showError(message) {
        const tbody = document.querySelector('.attendance-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
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
        } else {
            alert(message);
        }
    }

    // Utility functions
    formatDate(dateString, format) {
        const date = new Date(dateString);
        const options = {
            'M j, Y': { month: 'short', day: 'numeric', year: 'numeric' },
            'D': { weekday: 'short' },
            'Y-m-d': { year: 'numeric', month: '2-digit', day: '2-digit' }
        };
        
        if (format === 'Y-m-d') {
            return date.toISOString().split('T')[0];
        }
        
        return date.toLocaleDateString('en-US', options[format]);
    }

    formatDateTime(dateTimeString, format = 'M j, Y g:i A') {
        const date = new Date(dateTimeString);
        
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
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize attendance history when page loads
let userAttendanceHistory;
document.addEventListener('DOMContentLoaded', () => {
    userAttendanceHistory = new UserAttendanceHistory();
});

// Global functions for HTML onclick handlers
function applyFilters() {
    if (userAttendanceHistory) {
        userAttendanceHistory.applyFilters();
    }
}

function exportAttendance() {
    if (userAttendanceHistory) {
        userAttendanceHistory.exportToCSV();
    }
}