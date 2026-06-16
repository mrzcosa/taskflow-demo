// sidebar.js - Handles navigation and sidebar interactions
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const views = document.querySelectorAll('.content-view');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');

    if (!sidebar || !overlay || !menuToggle) return;

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when open
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function toggleSidebar() {
        sidebar.classList.contains('active') ? closeSidebar() : openSidebar();
    }

    menuToggle.addEventListener('click', toggleSidebar);
    
    // Close sidebar when clicking overlay OR any menu item on mobile
    overlay.addEventListener('click', closeSidebar);

    /**
     * Switch between dashboard views
     * @param {string} viewId - The ID of the view to show (e.g., 'dashboard', 'tasks')
     */
    function navigateTo(viewId) {
        // 1. Update Menu Item Active State
        menuItems.forEach(item => {
            if (item.getAttribute('data-view') === viewId) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
            } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            }
        });

        // 2. Toggle View Visibility
        let viewFound = false;
        views.forEach(view => {
            if (view.id === `view-${viewId}`) {
                view.classList.add('active');
                viewFound = true;
            } else {
                view.classList.remove('active');
            }
        });

        // Optional: Show toast if a view is not yet implemented (e.g., Rewards, Settings)
        if (!viewFound && typeof showToast === 'function') {
            showToast(`${viewId.charAt(0).toUpperCase() + viewId.slice(1)} module coming soon!`);
        }

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 991) closeSidebar();
    }

    // Add Click Listeners to Menu Items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const viewId = item.getAttribute('data-view');
            
            if (viewId) {
                e.preventDefault();
                navigateTo(viewId);
            }
        });
    });

    // Close sidebar when clicking menu items on mobile
    menuItems.forEach(item => item.addEventListener('click', () => {
        if (window.innerWidth <= 991) closeSidebar();
    }));

    // Export navigation globally if needed
    window.taskFlowNavigate = navigateTo;
});