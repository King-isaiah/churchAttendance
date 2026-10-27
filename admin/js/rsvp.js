// Global State
let allRsvpData = [];
let filteredRsvpData = [];
let currentPage = 1;
const itemsPerPage = 10;
let eventId = 0;
let trendChartInstance = null;
let emailModalInstance = null;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get('event_id');

    if (!eventId || eventId <= 0) {
        showError("Invalid Event ID provided.");
        return;
    }

    const periodParam = urlParams.get('trend_period');
    if (periodParam) {
        document.getElementById('trendPeriod').value = periodParam;
    }

    try {
        const [eventRes, rsvpRes, trendRes] = await Promise.all([
            fetch(`../class/ApiHandler.php?action=get&entity=events&id=${eventId}`),
            fetch(`../class/ApiHandler.php?action=getOthers&entity=rsvp&event_id=${eventId}`),
            fetch(`../class/ApiHandler.php?action=getOthers&entity=rsvp_trend&event_id=${eventId}&days=${document.getElementById('trendPeriod').value}`)
        ]);

        const eventData = await eventRes.json();
        const rsvpData = await rsvpRes.json();
        const trendData = await trendRes.json();

        if (eventData.success) renderHeader(eventData.data);

        if (rsvpData.success) {
            allRsvpData = rsvpData.data || [];
            filteredRsvpData = [...allRsvpData];
            calculateAndRenderStats(allRsvpData);
            renderMobileCards();
            renderDesktopTable();
            setupPagination();
        }

        if (trendData.success && eventData.success) {
            initCharts(allRsvpData, trendData.data);
        }

        setupFilters();
        setupEmailForm();

    } catch (error) {
        console.error("Failed to load RSVP page data:", error);
        showError(error.message);
    }
});

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

function renderHeader(event) {
    document.title = `RSVP Responses - ${event.title || 'Event'}`;
    document.getElementById('eventTitle').textContent = event.title || 'Event';

    const dateObj = event.event_date ? new Date(event.event_date) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';
    
    let timeStr = 'N/A';
    if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        timeStr = `${h12}:${minutes} ${ampm}`;
    }

    document.getElementById('eventMeta').innerHTML = `
        <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
        <span class="meta-item"><i class="fas fa-clock"></i> ${timeStr}</span>
        <span class="meta-item"><i class="fas fa-map-marker-alt"></i> ${event.location_name || 'No Location'}</span>
    `;
}

function calculateAndRenderStats(data) {
    let stats = { yes: 0, no: 0, maybe: 0, pending: 0, total: data.length };

    data.forEach(user => {
        if (user.attending == 1) stats.yes++;
        else if (user.attending == 2) stats.no++;
        else if (user.attending == 3) stats.maybe++;
        else stats.pending++;
    });

    document.getElementById('statsGrid').innerHTML = `
        <div class="quick-stat-card">
            <div class="quick-stat-icon attending"><i class="fas fa-check-circle"></i></div>
            <div>
                <div class="quick-stat-value">${stats.yes}</div>
                <div class="quick-stat-label">Attending</div>
            </div>
        </div>
        <div class="quick-stat-card">
            <div class="quick-stat-icon maybe"><i class="fas fa-question-circle"></i></div>
            <div>
                <div class="quick-stat-value">${stats.maybe}</div>
                <div class="quick-stat-label">Maybe</div>
            </div>
        </div>
        <div class="quick-stat-card">
            <div class="quick-stat-icon not-attending"><i class="fas fa-times-circle"></i></div>
            <div>
                <div class="quick-stat-value">${stats.no}</div>
                <div class="quick-stat-label">Not Attending</div>
            </div>
        </div>
        <div class="quick-stat-card">
            <div class="quick-stat-icon total"><i class="fas fa-users"></i></div>
            <div>
                <div class="quick-stat-value">${stats.total}</div>
                <div class="quick-stat-label">Total Responses</div>
            </div>
        </div>
    `;
}

function renderMobileCards() {
    const container = document.getElementById('mobileResponses');
    
    if (filteredRsvpData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>No Responses Yet</h3>
                <p>No one has responded to this event yet.</p>
            </div>`;
        return;
    }

    container.innerHTML = filteredRsvpData.map((user, index) => {
        let responseText = 'Pending', badgeClass = 'badge-pending';
        if (user.attending == 1) { responseText = 'Yes'; badgeClass = 'badge-success'; }
        else if (user.attending == 2) { responseText = 'No'; badgeClass = 'badge-danger'; }
        else if (user.attending == 3) { responseText = 'Maybe'; badgeClass = 'badge-warning'; }

        const comment = user.notes ? (user.notes.length > 100 ? user.notes.substring(0, 100) + '...' : user.notes) : '';
        const dateStr = user.dated ? new Date(user.dated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not responded';
        const safeEmail = (user.email || '').replace(/'/g, "\\'");

        return `
            <div class="response-card" data-response="${responseText.toLowerCase()}">
                <div class="response-card-header">
                    <div class="user-avatar-large" style="background-color: #4CAF50;">U${index + 1}</div>
                    <div class="response-card-title">
                        <h4>User ${user.unique_id || 'N/A'}</h4>
                        <p>${user.email || 'No email'}</p>
                    </div>
                    <span class="badge-mobile ${badgeClass}">${responseText}</span>
                </div>
                <div class="response-card-body">
                    ${comment ? `<div class="response-comment"><i class="fas fa-comment"></i><p>${comment}</p></div>` : ''}
                    <div class="response-meta"><i class="fas fa-clock"></i> ${dateStr}</div>
                </div>
                <div class="response-card-actions">
                    <button class="action-btn btn-view" onclick="viewResponseDetails(${user.ide})"><i class="fas fa-eye"></i><span>View</span></button>
                    <button class="action-btn btn-email" onclick="openEmailModal('${safeEmail}', 'User')"><i class="fas fa-envelope"></i><span>Email</span></button>
                    <button class="action-btn btn-chat" onclick="showToast('Chat system coming soon!', 'info')"><i class="fas fa-comment-dots"></i><span>Chat</span></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderDesktopTable() {
    const tbody = document.getElementById('rsvpTableBody');
    if (!tbody) return;

    if (filteredRsvpData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No responses found.</td></tr>';
        document.getElementById('results-count').textContent = '0-0';
        document.getElementById('total-count').textContent = '0';
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredRsvpData.length);
    const paginatedData = filteredRsvpData.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map((user, index) => {
        const globalIndex = startIndex + index + 1;
        
        let attendingClass = 'fa-exclamation-circle';
        let attendingText = 'Pending';
        let badgeClass = 'badge-secondary';

        if (user.attending == 1) { attendingClass = 'fa-check-circle'; attendingText = 'Attending'; badgeClass = 'badge-success'; }
        else if (user.attending == 2) { attendingClass = 'fa-times-circle'; attendingText = 'Not Attending'; badgeClass = 'badge-danger'; }
        else if (user.attending == 3) { attendingClass = 'fa-question-circle'; attendingText = 'Maybe'; badgeClass = 'badge-warning'; }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';
        const comment = user.notes ? (user.notes.length > 30 ? user.notes.substring(0, 30) + '...' : user.notes) : '-';
        const dateStr = user.dated ? new Date(user.dated).toLocaleString() : 'N/A';
        const safeEmail = (user.email || '').replace(/'/g, "\\'");

        return `
            <tr>
                <td>${globalIndex}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar" style="background-color: #4CAF50">${globalIndex}</div>
                        <div class="user-details">
                            <strong>User ${user.unique_id || 'N/A'}</strong>
                            <small>${user.email || 'No email'}</small>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}"><i class="fas ${attendingClass}"></i> ${attendingText}</span></td>
                <td title="${user.notes || ''}">${comment}</td>
                <td>${fullName}</td>
                <td>${dateStr}</td>
                <td>${user.guest_count > 0 ? user.guest_count : '0'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view tooltip" onclick="viewResponseDetails(${user.ide})">
                            <i class="fas fa-eye"></i>
                            <span class="tooltiptext">View Details</span>
                        </button>
                        
                        <button class="btn-icon btn-email tooltip" onclick="openEmailModal('${safeEmail}', '${fullName}')">
                            <i class="fas fa-envelope"></i>
                            <span class="tooltiptext">Send Email</span>
                        </button>

                        <button class="btn-icon btn-chat tooltip" onclick="showToast('Chat system coming soon!', 'info')">
                            <i class="fas fa-comment-dots"></i>
                            <span class="tooltiptext">Direct Message (Soon)</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('results-count').textContent = `${startIndex + 1}-${endIndex}`;
    document.getElementById('total-count').textContent = filteredRsvpData.length;
}

// ==========================================
// EMAIL & TOAST LOGIC
// ==========================================

function openEmailModal(email, name) {
    if (!email || email === 'No email' || email === 'null' || email.trim() === '') {
        showToast('This user does not have a valid email address.', 'error');
        return;
    }

    document.getElementById('emailForm').reset();
    document.getElementById('emailTo').value = email;
    document.getElementById('emailSubject').value = `Regarding your RSVP to the event`; 
    
    emailModalInstance = document.getElementById('emailModal');
    emailModalInstance.style.display = 'block';
}

function closeEmailModal() {
    if (emailModalInstance) {
        emailModalInstance.style.display = 'none';
    }
}

function setupEmailForm() {
    const emailForm = document.getElementById('emailForm');
    if (!emailForm) return;

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const sendBtn = document.getElementById('sendEmailBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        sendBtn.disabled = true;

        const payload = {
            to: document.getElementById('emailTo').value,
            subject: document.getElementById('emailSubject').value,
            message: document.getElementById('emailMessage').value
        };

        try {
            const res = await fetch('../class/ApiHandler.php?action=sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const json = await res.json();
            
            if (json.success) {
                showToast('Email sent successfully!', 'success');
                closeEmailModal();
            } else {
                showToast(json.message || 'Failed to send email.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error while sending email.', 'error');
        } finally {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    });
}

// Custom Toastify-like implementation using DOM
function showToast(message, type = 'info') {
    const container = document.getElementById('toastifyContainer');
    if (!container) {
        alert(message); // Fallback
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Inline styles for quick implementation (you can move to CSS if you prefer)
    toast.style.cssText = `
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#0d6efd'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease forwards;
        font-weight: 500;
    `;

    container.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================
// FILTER & PAGINATION
// ==========================================

function setupFilters() {
    const searchInput = document.getElementById('rsvpSearch');
    const filterSelect = document.getElementById('responseFilter');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterResponses, 300);
        });
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterResponses);
    }
}

function filterResponses() {
    const searchTerm = document.getElementById('rsvpSearch').value.toLowerCase();
    const responseFilter = document.getElementById('responseFilter').value;

    filteredRsvpData = allRsvpData.filter(user => {
        const matchesSearch = 
            (user.unique_id && user.unique_id.toLowerCase().includes(searchTerm)) ||
            (user.first_name && user.first_name.toLowerCase().includes(searchTerm)) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchTerm)) ||
            (user.user_name && user.user_name.toLowerCase().includes(searchTerm)) ||
            (user.notes && user.notes.toLowerCase().includes(searchTerm));

        if (!matchesSearch) return false;
        if (responseFilter === 'all') return true;

        if (responseFilter === 'attending' && user.attending == 1) return true;
        if (responseFilter === 'not-attending' && user.attending == 2) return true;
        if (responseFilter === 'maybe' && user.attending == 3) return true;
        if (responseFilter === 'pending' && !user.attending) return true;

        return false;
    });

    currentPage = 1;
    renderMobileCards(); 
    renderDesktopTable();
    setupPagination();
}

function setupPagination() {
    const totalPages = Math.ceil(filteredRsvpData.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';
    if (currentPage > 1) html += `<button class="page-btn" onclick="changePage(${currentPage - 1})">&laquo;</button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    if (currentPage < totalPages) html += `<button class="page-btn" onclick="changePage(${currentPage + 1})">&raquo;</button>`;
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderDesktopTable();
    setupPagination();
}

// ==========================================
// CHARTS & MODALS
// ==========================================

function updateTrendChart() {
    const period = document.getElementById('trendPeriod').value;
    window.location.href = `rsvp.php?event_id=${eventId}&trend_period=${period}`;
}

function initCharts(rsvpData, trendData) {
    const trendArray = trendData || [];
    
    let stats = { yes: 0, no: 0, maybe: 0, pending: 0 };
    (rsvpData || []).forEach(user => {
        if (user.attending == 1) stats.yes++;
        else if (user.attending == 2) stats.no++;
        else if (user.attending == 3) stats.maybe++;
        else stats.pending++;
    });

    const ctx1 = document.getElementById('responseChart').getContext('2d');
    new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Attending', 'Not Attending', 'Maybe', 'No Response'],
            datasets: [{
                data: [stats.yes, stats.no, stats.maybe, stats.pending],
                backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#6c757d'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { padding: 20, font: { size: 14 } } } },
            cutout: '60%'
        }
    });

    const trendDates = trendArray.map(d => d.day_name);
    const trendTotals = trendArray.map(d => d.total);
    const trendAttending = trendArray.map(d => d.attending);
    const trendNotAttending = trendArray.map(d => d.not_attending);

    const ctx2 = document.getElementById('trendChart').getContext('2d');
    trendChartInstance = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: trendDates,
            datasets: [
                { label: 'Total Responses', data: trendTotals, borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.1)', borderWidth: 3, fill: true, tension: 0.3 },
                { label: 'Attending', data: trendAttending, borderColor: '#28a745', backgroundColor: 'rgba(40, 167, 69, 0.1)', borderWidth: 2, tension: 0.3, borderDash: [5, 5] },
                { label: 'Not Attending', data: trendNotAttending, borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderWidth: 2, tension: 0.3, borderDash: [3, 3] }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

async function viewResponseDetails(id) {
    try {
        const res = await fetch(`../class/ApiHandler.php?action=get&entity=rsvp&id=${id}`);
        const json = await res.json();
        
        if (json.success && json.data) {
            const r = json.data;
            document.getElementById('viewModalTitle').textContent = `Response from ${r.first_name || 'User'}`;
            let status = r.attending == 1 ? 'Attending' : r.attending == 2 ? 'Not Attending' : r.attending == 3 ? 'Maybe' : 'Pending';
            
            document.getElementById('viewEventDetails').innerHTML = `
                <div class="event-details">
                    <div class="detail-row"><label>Name:</label><span>${r.first_name || ''} ${r.last_name || ''}</span></div>
                    <div class="detail-row"><label>Unique ID:</label><span>${r.uniqued || 'N/A'}</span></div>
                    <div class="detail-row"><label>Status:</label><span>${status}</span></div>
                    <div class="detail-row"><label>Guests:</label><span>${r.guest_count || 0}</span></div>
                    <div class="detail-row"><label>Comment:</label><span>${r.comments || 'No comment provided'}</span></div>
                    <div class="detail-row"><label>Date:</label><span>${r.dated ? new Date(r.dated).toLocaleString() : 'N/A'}</span></div>
                </div>
            `;
            document.getElementById('viewMoreModal').style.display = 'block';
        } else {
            showToast("Could not load response details.", 'error');
        }
    } catch (e) {
        console.error(e);
        showToast("Error fetching details.", 'error');
    }
}

function closeViewEventModal() {
    document.getElementById('viewMoreModal').style.display = 'none';
}

function toggleFABMenu() {
    document.getElementById('fabMenu').classList.toggle('show');
}

function showError(msg) {
    document.getElementById('errorContainer').innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #f5c6cb;">
            <i class="fas fa-exclamation-circle"></i> ${msg}
        </div>`;
}

function exportRSVPData() {
    if (allRsvpData.length === 0) return showToast("No data to export", 'error');
    
    let csvContent = "data:text/csv;charset=utf-8,Unique ID,Name,Attending,Guests,Comment,Date\n";
    allRsvpData.forEach(u => {
        let status = u.attending == 1 ? 'Yes' : u.attending == 2 ? 'No' : u.attending == 3 ? 'Maybe' : 'Pending';
        let name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
        csvContent += `"${u.unique_id}","${name}","${status}","${u.guest_count || 0}","${(u.notes || '').replace(/"/g, '""')}","${u.dated || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rsvp_export_event_${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleMobileMenu() {
    showToast('Mobile menu would open here', 'info');
}