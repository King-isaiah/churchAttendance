// 1. Expand Button (Sidebar Toggle)
const expand_btn = document.querySelector(".expand-btn");
if (expand_btn) {
    expand_btn.addEventListener("click", () => {
        document.body.classList.toggle("collapsed");
    });
}

// 2. Highlight the Active Link on Page Load
const currentUrl = window.location.href;
// FIXED: Changed selector from ".sidebar-links a" to ".icon-square a"
const allLinks = document.querySelectorAll(".icon-square a");

allLinks.forEach((link) => {
    const href = link.getAttribute("href");
    
    // Check if the current URL contains the link's href
    if (href && href !== "" && currentUrl.includes(href)) {
        link.classList.add("active");
        // Optional: Also add active to the parent div for styling
        link.parentElement.classList.add("active"); 
    }
});

// 3. Search Input Focus (with Null Check)
const searchInput = document.querySelector(".search__Wrapper input");
if (searchInput) {
    searchInput.addEventListener("focus", (e) => {
        document.body.classList.remove("collapsed");
    });
}


// 4. Fetch and Display Dynamic Member Count
async function loadMemberCount() {
    try {
        // Make sure this path matches where your ApiHandler is relative to nav.js
        const res = await fetch('../class/ApiHandler.php?action=getOthers&entity=members_count');
        const json = await res.json();
        
        if (json.success && json.data !== undefined) {
            const count = json.data;
            
            // Format the number (e.g., 6300 becomes 6.3k)
            let formattedCount = count;
            if (count >= 1000) {
                formattedCount = (count / 1000).toFixed(1) + 'k';
            }
            
            // Find the span and update the text
            const workerSpan = document.getElementById('dynamicWorkerCount');
            if (workerSpan) {
                workerSpan.textContent = `${formattedCount} Workers`;
            }
        }
    } catch (error) {
        console.error('Error loading member count:', error);
    }
}

// Call the function when the script loads
loadMemberCount();