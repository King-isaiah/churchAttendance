// Function to fetch and populate categories
// async function populateCategories() {
//     try {
//         const response = await fetch('class/ApiHandler.php?entity=categories&action=getAll');
        
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         const data = await response.json();
        
//         if (!data.success) {
//             throw new Error('API request failed');
//         }
        
//         const categories = data.data || [];
//         const categoryFilter = document.getElementById('categoryFilter');
        
//         // Clear existing options except "All Categories"
//         const allCategoriesOption = categoryFilter.querySelector('option[value="all"]');
//         categoryFilter.innerHTML = '';
//         categoryFilter.appendChild(allCategoriesOption);
        
//         // Add categories from API
//         categories.forEach(category => {
//             // Skip if category name is 'All'
//             if (category.name && category.name.toLowerCase() !== 'all') {
//                 const option = document.createElement('option');
//                 option.value = category.name ? category.name.toLowerCase() : '';
//                 option.textContent = category.name || 'Unnamed Category';
//                 categoryFilter.appendChild(option);
//             }
//         });
        
//     } catch (error) {
//         console.error('Error fetching categories:', error);
//         // Fallback to existing PHP categories or show error
//         showError('Failed to load categories. Using default categories.');
//     }
// }

// // Initialize categories when page loads
// document.addEventListener('DOMContentLoaded', function() {
//     populateCategories();
//     // Your existing initialization code can remain here
// });