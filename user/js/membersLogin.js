// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Convert FormData to JSON
    const jsonData = {};
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });
    
    try {
        const response = await fetch('../class/ApiHandler.php?action=login&entity=members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Login successful!');
            // alert('why d fuck are you not workinfg')
            // Redirect to dashboard after successful login
            setTimeout(() => {
                // window.location.href = 'user_dashboard.php';
                window.location.replace('user_dashboard.php');
            }, 2000);
        } else {
            handleApiError(result, 'login');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

// Add event listener to login form
document.getElementById('loginForm').addEventListener('submit', handleLogin);