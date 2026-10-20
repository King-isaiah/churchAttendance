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