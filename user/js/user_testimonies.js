document.addEventListener('DOMContentLoaded', () => {
    loadUserTestimonies();

    document.getElementById('testimonyForm').addEventListener('submit', handleSubmit);
});

async function loadUserTestimonies() {
    // Get unique_id from the hidden input in the user_header
    const uniqueId = document.getElementById('unique_id')?.value;
    if (!uniqueId) return;

    try {
        const res = await fetch(`../class/ApiHandler.php?action=getOthers&entity=testimonies_user&unique_id=${uniqueId}`);
        const json = await res.json();
        
        const container = document.getElementById('userTestimonyList');
        
        if (json.success && json.data.length > 0) {
            container.innerHTML = json.data.map(t => {
                let badge = '';
                if (t.status === 'approved') badge = '<span style="color: #28a745; font-weight: 600; font-size: 0.8rem;">(Approved)</span>';
                if (t.status === 'rejected') badge = '<span style="color: #dc3545; font-weight: 600; font-size: 0.8rem;">(Rejected)</span>';
                if (t.status === 'pending') badge = '<span style="color: #ffc107; font-weight: 600; font-size: 0.8rem;">(Pending Review)</span>';

                return `
                    <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <h4 style="margin: 0; color: #333;">${escapeHtml(t.title)}</h4>
                            ${badge}
                        </div>
                        <small style="color: #999;">Submitted on: ${new Date(t.created_at).toLocaleDateString()}</small>
                        <p style="margin-top: 10px; color: #555;">${escapeHtml(t.content)}</p>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #999;">You have not submitted any testimonies yet.</p>';
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const uniqueId = document.getElementById('unique_id')?.value;
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerHTML;

    if (!uniqueId) {
        alert('Session expired. Please log in again.');
        return;
    }

    const payload = {
        unique_id: uniqueId,
        title: document.getElementById('testimonyTitle').value,
        content: document.getElementById('testimonyContent').value
    };

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    btn.disabled = true;

    try {
        const res = await fetch('../class/ApiHandler.php?action=create&entity=testimonies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
            alert('Testimony submitted successfully! It is now pending admin review.');
            document.getElementById('testimonyForm').reset();
            loadUserTestimonies();
        } else {
            alert(json.message || 'Failed to submit.');
        }
    } catch (error) {
        console.error(error);
        alert('A network error occurred.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}