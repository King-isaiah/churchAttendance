document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadTestimonies();

    document.getElementById('statusFilter').addEventListener('change', filterTable);
});

let allTestimonies = [];

async function loadStats() {
    try {
        const res = await fetch('../class/ApiHandler.php?action=getOthers&entity=testimonies_stats');
        const json = await res.json();
        
        if (json.success) {
            document.getElementById('statTotal').textContent = json.data.total;
            document.getElementById('statWeekly').textContent = json.data.weekly;
            document.getElementById('statMonthly').textContent = json.data.monthly;
            document.getElementById('statRatio').textContent = json.data.ratio + '%';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTestimonies() {
    try {
        const res = await fetch('../class/ApiHandler.php?action=getAll&entity=testimonies');
        const json = await res.json();
        
        if (json.success) {
            allTestimonies = json.data;
            renderTable(allTestimonies);
        }
    } catch (error) {
        console.error('Error loading testimonies:', error);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('testimonyTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No testimonies found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(t => {
        const date = new Date(t.created_at).toLocaleDateString();
        const memberName = t.first_name ? `${t.first_name} ${t.last_name}` : 'Unknown Member';
        
        let badgeClass = 'badge-warning'; // pending
        if (t.status === 'approved') badgeClass = 'badge-success';
        if (t.status === 'rejected') badgeClass = 'badge-danger';

        return `
            <tr>
                <td>${date}</td>
                <td>${escapeHtml(memberName)}</td>
                <td><strong>${escapeHtml(t.title)}</strong></td>
                <td title="${escapeHtml(t.content)}">${escapeHtml(t.content.substring(0, 50))}...</td>
                <td><span class="badge ${badgeClass}" style="padding: 5px 10px; border-radius: 15px; color: white; background: ${t.status === 'approved' ? '#28a745' : t.status === 'rejected' ? '#dc3545' : '#ffc107'};">${t.status.toUpperCase()}</span></td>
                <td class="action-buttons" style="display: flex; gap: 5px;">
                    ${t.status !== 'approved' ? `<button class="btn-icon" style="background:#d1e7dd; color:#0f5132;" onclick="updateStatus(${t.id}, 'approved')" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                    ${t.status !== 'rejected' ? `<button class="btn-icon" style="background:#fff3cd; color:#856404;" onclick="updateStatus(${t.id}, 'rejected')" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                    <button class="btn-icon btn-danger" onclick="deleteTestimony(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterTable() {
    const filter = document.getElementById('statusFilter').value;
    if (filter === 'all') {
        renderTable(allTestimonies);
    } else {
        renderTable(allTestimonies.filter(t => t.status === filter));
    }
}

async function updateStatus(id, status) {
    try {
        const res = await fetch(`../class/ApiHandler.php?action=update&entity=testimonies&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        const json = await res.json();
        
        if (json.success) {
            loadTestimonies(); // Reload data
            loadStats();
        } else {
            alert(json.message);
        }
    } catch (error) {
        console.error(error);
    }
}

async function deleteTestimony(id) {
    if (!confirm('Are you sure you want to delete this testimony?')) return;
    try {
        const res = await fetch(`../class/ApiHandler.php?action=delete&entity=testimonies&id=${id}`, {
            method: 'DELETE'
        });
        const json = await res.json();
        
        if (json.success) {
            loadTestimonies();
            loadStats();
        }
    } catch (error) {
        console.error(error);
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}