class EmailLogManager {
    constructor() {
        this.allLogs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    async loadLogs() {
        const search = document.getElementById('searchInput').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        const tbody = document.getElementById('emailLogsTable');
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Fetching logs...</td></tr>`;

        try {
            const res = await fetch('../class/ApiHandler.php?action=special&entity=email_logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search, start_date: startDate, end_date: endDate })
            });
            const data = await res.json();

            if (data.success) {
                this.allLogs = data.data;
                this.filteredLogs = [...this.allLogs];
                this.currentPage = 1;
                this.renderTable();
            } else {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${data.message}</td></tr>`;
            }
        } catch (error) {
            console.error("Error fetching logs", error);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">No Record Found</td></tr>`;
        }
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        this.loadLogs();
    }

    renderTable() {
        const tbody = document.getElementById('emailLogsTable');
        
        if (this.filteredLogs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No email logs found.</td></tr>`;
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = this.filteredLogs.slice(start, end);

        tbody.innerHTML = pageData.map(log => `
            <tr>
                <td>${new Date(log.sent_at).toLocaleString()}</td>
                
                <td>${log.recipient_name || 'Unknown User'}</td>
                <td>${log.recipient_email}</td>
                <td>${log.subject}</td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="emailLogManager.goToPage(${i})">${i}</button>`;
        }
        pagination.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
    }

    exportCSV() {
        if (this.filteredLogs.length === 0) return alert("No data to export");

        let csv = "No,Date,Recipient Name,Recipient Email,Subject\n";
        
        this.filteredLogs.forEach(log => {
            // Escape quotes inside strings to prevent breaking CSV
            const subject = `"${(log.subject || '').replace(/"/g, '""')}"`;
            const name = `"${(log.recipient_name || '').replace(/"/g, '""')}"`;
            csv += `${new Date(log.sent_at).toLocaleString()},${name},${log.recipient_email},${subject}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `email_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

const emailLogManager = new EmailLogManager();
document.addEventListener('DOMContentLoaded', () => {
    emailLogManager.loadLogs();
});