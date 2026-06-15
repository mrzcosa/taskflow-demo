// sidebar.js - Handles navigation and sidebar interactions
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
    const views = document.querySelectorAll('.content-view');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    function toggleMobileSidebar() {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
    }

    function closeMobileSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
    if (overlay) overlay.addEventListener('click', closeMobileSidebar);

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
        if (window.innerWidth <= 768) closeMobileSidebar();
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

    // Export navigation globally if needed
    window.taskFlowNavigate = navigateTo;
});