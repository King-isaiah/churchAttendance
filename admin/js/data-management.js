let parsedData = [];

// --- FALLBACK NOTIFICATION FUNCTIONS ---
// (In case these are missing in your global JS files)
function showSuccess(msg) { showToast(msg, 'success'); }
function showError(msg) { showToast(msg, 'error'); }
function showWarning(msg) { showToast(msg, 'info'); }

// --- TEMPLATE DOWNLOAD ---
function downloadTemplate() {
    // OMITTED unique_id FOR SECURITY & CONVENIENCE
    const headers = ["first_name", "last_name", "email", "phone", "department_id", "status"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "members_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- DRAG AND DROP ZONE LOGIC ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFileSelect({ target: { files: files } });
    });
}

// --- FILE SELECTION & PARSING ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        showError('Please upload a valid .csv file');
        return;
    }

    document.getElementById('previewSection').style.display = 'block';
    document.getElementById('previewError').textContent = 'Parsing file...';

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length) {
                document.getElementById('previewError').textContent = 'Error parsing CSV: ' + results.errors[0].message;
                return;
            }
            
            parsedData = results.data;
            renderPreview(results.meta.fields, parsedData);
        }
    });
}

function renderPreview(headers, data) {
    document.getElementById('previewError').textContent = '';
    
    // Render Headers
    const thead = document.getElementById('previewHead');
    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    // Render Rows (limit to first 10 for preview)
    const tbody = document.getElementById('previewBody');
    const previewData = data.slice(0, 10);
    
    tbody.innerHTML = previewData.map(row => {
        return `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`;
    }).join('');

    if (data.length > 10) {
        tbody.innerHTML += `<tr><td colspan="${headers.length}" style="text-align:center; color:#6c757d;">... and ${data.length - 10} more rows</td></tr>`;
    }
}

function cancelImport() {
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    parsedData = [];
}

// --- SUBMIT IMPORT TO API ---
async function submitImport() {
    if (parsedData.length === 0) return;

    const btn = document.getElementById('confirmImportBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
    btn.disabled = true;

    try {
        const res = await fetch('../class/ApiHandler.php?action=importMembers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: parsedData })
        });
        
        const json = await res.json();
        
        if (json.success) {
            showSuccess(`Successfully imported ${json.imported_count} members!`);
            showToast(`Successfully imported ${json.imported_count} members! (${json.failed_count} skipped)`, 'success');
            cancelImport();
        } else {
            showError(json.message || 'Import failed.');
        }
    } catch (error) {
        console.error(error);
        showError('Network error during import.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- EXPORT DATA ---
async function exportData(entity) {
    try {
        showWarning('Preparing download...');
        
        // Fetch data from API
        const res = await fetch(`../class/ApiHandler.php?action=getAll&entity=${entity}`);
        const json = await res.json();

        if (!json.success || !json.data || json.data.length === 0) {
            showError('No data available to export.');
            return;
        }

        // Convert JSON to CSV
        const data = json.data;
        
        // 1. OMIT unique_id FOR SECURITY
        if (entity === 'members') {
            data.forEach(row => {
                delete row.unique_id; 
                // You can also delete other sensitive internal fields here if needed
            });
        }

        // 2. Extract Headers
        const headers = Object.keys(data[0]);
        
        // 3. Build CSV
        let csvContent = headers.join(',') + '\n';
        data.forEach(row => {
            const rowValues = headers.map(header => {
                let val = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape quotes and wrap in quotes if it contains a comma
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            });
            csvContent += rowValues.join(',') + '\n';
        });

        // 4. Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${entity}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccess('Export downloaded successfully!');

    } catch (error) {
        console.error(error);
        showError('Error exporting data.');
    }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toastifyContainer');
    if (!container) return alert(message);

    const toast = document.createElement('div');
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> <span>${message}</span>`;
    
    toast.style.cssText = `
        background: ${type === 'success' ? '#198754' : type === 'error' ? '#dc3545' : '#0d6efd'};
        color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 10px;
        display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        position: fixed; top: 20px; right: 20px; z-index: 9999; font-weight: 500;
        animation: slideIn 0.3s ease;
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}