document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadTestimonies();

    document.getElementById('statusFilter').addEventListener('change', applyFilter);
});

// --- Pagination Variables ---
let allTestimonies = [];
let filteredTestimonies = [];
let currentPage = 1;
const itemsPerPage = 4; // You can change this to 10 if you want more per page

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
            applyFilter(); // Apply filter and render
        }
    } catch (error) {
        console.error('Error loading testimonies:', error);
    }
}

// --- Filter & Pagination Logic ---
function applyFilter() {
    const filter = document.getElementById('statusFilter').value;
    
    if (filter === 'all') {
        filteredTestimonies = [...allTestimonies];
    } else {
        filteredTestimonies = allTestimonies.filter(t => t.status === filter);
    }
    
    currentPage = 1; // Reset to page 1 on new filter
    renderTable();
    renderPagination();
    updateResultsCount();
}

function renderTable() {
    const tbody = document.getElementById('testimonyTableBody');
    
    if (filteredTestimonies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No testimonies found.</td></tr>';
        return;
    }

    // Calculate pagination slice
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredTestimonies.length);
    const paginatedData = filteredTestimonies.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedData.map(t => {
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

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    if (!pagination) return;

    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredTestimonies.length / itemsPerPage);

    if (totalPages <= 1) {
        if (pageInfo) pageInfo.textContent = '';
        return;
    }

    // Previous Button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'btn-secondary'; // Optional styling class
    prevButton.style.padding = '5px 10px';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            renderPagination();
            updateResultsCount();
        }
    });
    pagination.appendChild(prevButton);

    // Page Numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.style.padding = '5px 10px';
        // Simple active styling
        if (i === currentPage) {
            pageButton.style.background = '#0d6efd';
            pageButton.style.color = '#fff';
            pageButton.style.border = 'none';
        } else {
            pageButton.style.background = '#fff';
            pageButton.style.border = '1px solid #ddd';
        }
        
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderTable();
            renderPagination();
            updateResultsCount();
        });
        pagination.appendChild(pageButton);
    }

    // Next Button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.style.padding = '5px 10px';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            renderPagination();
            updateResultsCount();
        }
    });
    pagination.appendChild(nextButton);

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    const totalCount = document.getElementById('total-count');
    
    if (resultsCount && totalCount) {
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredTestimonies.length);
        
        resultsCount.textContent = filteredTestimonies.length === 0 ? '0' : `${startIndex}-${endIndex}`;
        totalCount.textContent = filteredTestimonies.length;
    }
}

// --- Actions ---
async function updateStatus(id, status) {
    try {
        const res = await fetch(`../class/ApiHandler.php?action=update&entity=testimonies&id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        const json = await res.json();
        
        if (json.success) {
            loadTestimonies(); // Reload data & refresh pagination
            loadStats();
        } else {
            if (typeof showError === 'function') {
                showError(json.message);
            } else {
                alert(json.message);
            }
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
            // If we delete the last item on a page, move back a page
            if (filteredTestimonies.length % itemsPerPage === 1 && currentPage > 1) {
                currentPage--;
            }
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