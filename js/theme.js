document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtns = document.querySelectorAll('#themeToggle');
    const themeIcons = document.querySelectorAll('#themeIcon');
    const htmlElement = document.documentElement;

    // Safe storage helper to prevent crashes in Private/Incognito mode
    const getStoredTheme = () => {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    };
    
    const setStoredTheme = (theme) => {
        try { localStorage.setItem('theme', theme); } catch (e) { 
            console.warn('Local storage blocked. Theme will not persist.');
        }
    };

    const updateIcons = (theme) => {
        themeIcons.forEach(icon => {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    };

    // Set initial icon state based on what was already loaded
    const currentTheme = getStoredTheme() || 'light';
    updateIcons(currentTheme);

    // Add click listeners to all toggle buttons
    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                htmlElement.setAttribute('data-theme', 'dark');
            } else {
                htmlElement.removeAttribute('data-theme');
            }
            
            setStoredTheme(newTheme);
            updateIcons(newTheme);
        });
    });
});