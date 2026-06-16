// ==========================================
// GLOBAL STATE
// ==========================================

const STORAGE_KEY = "taskflow_tasks";
const NOTIFICATION_STORAGE_KEY = 'taskflow_notifications';

let tasks = [];
// use window.currentEditId as the single source of truth for edit state
window.currentEditId = window.currentEditId || null;

// Active Filter States
let currentStatusFilter = 'All';
let notifications = []; // Global array for notifications
let currentPriorityFilter = 'All';

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initFilters();
    initNotificationBell();
});

/**
 * Saves the tasks array to localStorage.
 */
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Updates all dashboard UI components.
 */
function updateDashboard() {
    updateCards();
    if (typeof renderCharts === "function") {
        renderCharts();
    }
    updateNotifications();
    renderTasks();
}

/**
 * Generates sample data for the demo.
 */
function getSampleTasks() {
    return [
        { id: 1, title: "Complete TaskFlow Demo", dueDate: new Date().toISOString().split('T')[0], priority: "High", status: "Pending", estimatedHours: 4, rewardForCompletion: "Coffee" },
        { id: 2, title: "Explore Analytics", dueDate: new Date().toISOString().split('T')[0], priority: "Medium", status: "Completed", estimatedHours: 2, rewardForCompletion: "Insight" }
    ];
}

/**
 * Setup event listeners for filter buttons
 */
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.getAttribute('data-filter');
            const filterValue = btn.getAttribute('data-value');

            // Update internal state
            if (filterType === 'status') currentStatusFilter = filterValue;
            if (filterType === 'priority') currentPriorityFilter = filterValue;

            // Update UI Active State
            btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            renderTasks();
        });
    });
}

/**
 * Initializes the notification bell functionality.
 */
function initNotificationBell() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from immediately closing dropdown
            toggleNotificationDropdown();
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (!notificationDropdown.contains(event.target) && !notificationBell.contains(event.target) && notificationDropdown.classList.contains('open')) {
                toggleNotificationDropdown(false);
            }
        });
    }
}

/**
 * Toggles the visibility of the notification dropdown.
 * @param {boolean} [forceOpen] - Optional. If true, forces dropdown open. If false, forces dropdown closed.
 */
function toggleNotificationDropdown(forceOpen) {
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationBell = document.getElementById('notificationBell');

    if (!notificationDropdown || !notificationBell) return;

    const isOpen = notificationDropdown.classList.contains('open');
    const shouldOpen = forceOpen === undefined ? !isOpen : forceOpen;

    notificationDropdown.classList.toggle('open', shouldOpen);
    notificationBell.setAttribute('aria-expanded', shouldOpen);
    notificationDropdown.setAttribute('aria-hidden', !shouldOpen);
}


// ==========================================
// API FUNCTIONS
// ==========================================

function loadTasks() {
    try {
        loadNotifications(); // Load existing notifications at the start
        
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        } else {
            // Initialize with sample data for first-time demo users
            tasks = getSampleTasks();
            saveTasks();
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Generate notifications for overdue, due today, and high priority tasks
        tasks.forEach(task => {
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);

            // Overdue notifications (if not completed)
            if (task.status !== 'Completed' && taskDate < now) {
                generateNotification('overdue', task);
            }
            // Due Today notifications (if not completed)
            if (task.status !== 'Completed' && taskDate.getTime() === now.getTime()) {
                generateNotification('dueToday', task);
            }
            // High Priority notifications (if not completed)
            if (task.priority === 'High' && task.status !== 'Completed') {
                generateNotification('highPriority', task);
            }
        });

        updateDashboard();
        
    } catch (error) {
        console.error(error);

        if (typeof showToast === 'function')
            showToast('Unable to load tasks');
    }
}

function addTask() {
    const payload = getFormData();

    if (!payload.title || payload.title.trim() === '') {
        if (typeof showToast === 'function') showToast('Please enter a task title');
        return;
    }

    if (!payload.dueDate) {
        if (typeof showToast === 'function') showToast('Please select a due date');
        return;
    }

    if (!payload.estimatedHours || payload.estimatedHours <= 0) {
        if (typeof showToast === 'function') showToast('Please enter valid estimated hours');
        return;
    }

    if (!payload.rewardForCompletion || payload.rewardForCompletion.trim() === '') {
        if (typeof showToast === 'function') showToast('Please enter a reward');
        return;
    }

    const isNewTask = !window.currentEditId;
    let returnedTask;

    if (!isNewTask) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === window.currentEditId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...payload };
            returnedTask = tasks[index];
        }
    } else {
        // Create new task with local ID generation
        const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
        returnedTask = { id: newId, ...payload };
        tasks.push(returnedTask);
    }

    try {
        saveTasks();

        window.currentEditId = null;
        clearForm();

        const addButton =
            document.querySelector('.btn-primary');

        if (addButton)
            addButton.textContent = 'Add Task';

        if (typeof showToast === 'function')
            showToast(isNewTask ? 'Task added successfully' : 'Task updated successfully');

        // Generate notifications based on the action
        if (isNewTask) {
            generateNotification('created', returnedTask);
        }
        // High priority notification (for new or updated tasks)
        // Overdue/Due Today notifications are handled by loadTasks()
        if (returnedTask.priority === 'High' && returnedTask.status !== 'Completed') {
            generateNotification('highPriority', returnedTask);
        }

        loadTasks();

    } catch (error) {

        if (typeof showToast === 'function')
            showToast(error.message);
    }
}

async function deleteTask(id) {

    if (!confirm('Delete this task?'))
        return;

    try {

        const response = await fetch(`/tasks/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete task from server');
        }

        if (typeof showToast === 'function')
            showToast('Task deleted successfully');

        loadTasks();

    } catch (error) {

        console.error(error);

        if (typeof showToast === 'function')
            showToast('Delete failed');
    }
}

async function toggleStatus(id) {

    try {

        const response = await fetch(`/tasks/${id}/toggle`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error('Failed to update status on server');
        }

        if (typeof showToast === 'function')
            showToast('Status updated');

        loadTasks();

    } catch (error) {

        console.error(error);

        if (typeof showToast === 'function')
            showToast('Status update failed');
    }
}

function logout() {
    if (typeof showToast === 'function')
        showToast('Logging out...');
    window.location.href = '/logout';
}

// ==========================================
// FORM HELPERS
// ==========================================

function getFormData() {

    return {

        title:
            document.getElementById('title').value,

        dueDate:
            document.getElementById('dueDate').value,

        priority:
            document.getElementById('priority').value,

        status:
            document.getElementById('status').value,

        estimatedHours:
            parseInt(
                document.getElementById('estimatedHours').value
            ) || 0,

        rewardForCompletion:
            document.getElementById('reward').value
    };
}

function clearForm() {

    document.getElementById('title').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('priority').value = 'Medium';
    document.getElementById('status').value = 'Pending';
    document.getElementById('estimatedHours').value = '';
    document.getElementById('reward').value = '';
}

// ==========================================
// DASHBOARD CARDS
// ==========================================

function updateCards() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    let counts = {
        total: tasks.length,
        pending: 0,
        completed: 0,
        overdue: 0,
        dueToday: 0,
        upcoming: 0
    };

    tasks.forEach(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        if (task.status === 'Completed') {
            counts.completed++;
        } else {
            counts.pending++;
            // Check Overdue: Status Pending AND Date < Today
            if (taskDate < now) counts.overdue++;
        }

        // Due Today
        if (taskDate.getTime() === now.getTime()) counts.dueToday++;

        // Upcoming: Next 7 days (including today)
        if (taskDate >= now && taskDate <= nextWeek) counts.upcoming++;
    });

    const rate = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

    // Update UI elements
    const elements = {
        'totalTasks': counts.total,
        'pendingTasks': counts.pending,
        'completedTasks': counts.completed,
        'overdueTasks': counts.overdue,
        'dueToday': counts.dueToday,
        'upcomingTasks': counts.upcoming,
        'completionRate': rate + '%'
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // Overdue visual warning
    const overdueCard = document.getElementById('overdueCard');
    if (overdueCard) {
        counts.overdue > 0 ? overdueCard.classList.add('is-overdue') : overdueCard.classList.remove('is-overdue');
    }
    return counts; // Return counts for use in notifications
}

// ==========================================
// TASK TABLE
// ==========================================

function renderTasks() {

    const searchInput =
        document.getElementById('search');

    const searchText =
        searchInput
            ? searchInput.value.toLowerCase()
            : '';

    const filteredTasks =
        tasks.filter(task =>
            // Combine Search, Status, and Priority Filters
            (task.title.toLowerCase().includes(searchText)) &&
            (currentStatusFilter === 'All' || task.status === currentStatusFilter) &&
            (currentPriorityFilter === 'All' || task.priority === currentPriorityFilter)
        );

    let html = '';

    if (filteredTasks.length === 0) {
        html = `
            <tr class="empty-state">
                <td colspan="8">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <strong>No matching tasks found</strong>
                    <br>
                    <small style="opacity: 0.7;">Try adjusting your search or filters.</small>
                </td>
            </tr>`;
    } else {
    filteredTasks.forEach(task => {

        html += `
        <tr>

            <td>${task.id}</td>

            <td>${task.title}</td>

            <td>
                ${new Date(task.dueDate)
                    .toLocaleDateString()}
            </td>

            <td>${task.priority}</td>

            <td>

                <span
                    class="badge ${
                        task.status === 'Completed'
                            ? 'completed'
                            : 'pending'
                    }"
                    style="cursor:pointer"
                    onclick="toggleStatus(${task.id})">

                    ${task.status}

                </span>

            </td>

            <td>${task.estimatedHours}</td>

            <td>${task.rewardForCompletion}</td>

            <td>

                <button
                    class="btn-primary"
                    onclick="editTask(${task.id})">
                    Edit
                </button>

                <button
                    class="btn-danger"
                    onclick="deleteTask(${task.id})">
                    Delete
                </button>

            </td>

        </tr>`;
    });
    }

    document.getElementById('taskTable').innerHTML =
        html;
}

// ==========================================
// EDIT TASK
// ==========================================

function editTask(id) {

    const task =
        tasks.find(t => t.id === id);

    if (!task)
        return;

    // Open edit modal and populate fields (modal.js exposes openEditModal)
    if (typeof openEditModal === 'function') {
        openEditModal(task);
        currentEditId = id;
        return;
    }

    // Fallback (if modal script not loaded): populate top form
    document.getElementById('title').value = task.title;
    document.getElementById('dueDate').value = task.dueDate.split('T')[0];
    document.getElementById('priority').value = task.priority;
    document.getElementById('status').value = task.status;
    document.getElementById('estimatedHours').value = task.estimatedHours;
    document.getElementById('reward').value = task.rewardForCompletion;
    window.currentEditId = id;
    const addButton = document.querySelector('.btn-primary');
    if (addButton) addButton.textContent = 'Update Task';
}

// ==========================================
// NOTIFICATIONS
// ==========================================

window.saveTasks = saveTasks;
window.loadTasks = loadTasks;

/**
 * Saves the current notifications array to localStorage.
 */
function saveNotifications() {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

/**
 * Loads notifications from localStorage.
 */
function loadNotifications() {
    const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
}

/**
 * Formats a timestamp into a human-readable "X time ago" string.
 * @param {number} timestamp - The timestamp in milliseconds.
 * @returns {string} The formatted time string.
 */
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} weeks ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;

    const years = Math.floor(days / 365);
    return `${years} years ago`;
}

/**
 * Checks if a notification of a specific type for a specific task already exists and is unread.
 * @param {string} type - The type of notification (e.g., 'overdue', 'dueToday').
 * @param {number} taskId - The ID of the task.
 * @returns {boolean} True if an unread notification of this type for this task exists, false otherwise.
 */
function notificationExists(type, taskId) {
    return notifications.some(n => n.type === type && n.taskId === taskId && !n.read);
}

/**
 * Generates and adds a new notification.
 * @param {string} type - The type of notification ('overdue', 'dueToday', 'completed', 'highPriority', 'created').
 * @param {object} task - The task object related to the notification.
 */
function generateNotification(type, task) {
    if (!task || !task.id) return;

    // Prevent duplicate unread notifications for certain types
    if (notificationExists(type, task.id)) {
        return;
    }

    let message = '';
    switch (type) {
        case 'overdue':
            message = `Task '${task.title}' is overdue.`;
            break;
        case 'dueToday':
            message = `Task '${task.title}' is due today.`;
            break;
        case 'completed':
            message = `Task '${task.title}' was completed.`;
            break;
        case 'highPriority':
            message = `High priority task '${task.title}' requires attention.`;
            break;
        case 'created':
            message = `New task '${task.title}' has been created.`;
            break;
        default:
            message = `New notification for task '${task.title}'.`;
    }

    const newNotification = {
        id: Date.now() + Math.random().toString(36).substring(2, 9), // Unique ID
        taskId: task.id,
        type: type,
        message: message,
        timestamp: Date.now(),
        read: false
    };

    notifications.unshift(newNotification); // Add to the beginning
    saveNotifications();
    updateNotifications();
}

/**
 * Updates the notification dropdown and badge.
 */
function updateNotifications() {
    const notificationList = document.getElementById('notificationList');
    const notificationDot = document.getElementById('notificationDot');
    const notificationCountElement = document.getElementById('notificationCount');

    if (!notificationList || !notificationDot || !notificationCountElement) return;

    const unreadNotifications = notifications.filter(n => !n.read);
    const unreadCount = unreadNotifications.length;

    let notificationsHtml = '';
    if (notifications.length === 0) {
        notificationsHtml = '<div class="notification-item">No notifications.</div>';
    } else {
        notifications.forEach(n => {
            let iconClass = 'fa-circle-info';
            let iconColor = 'var(--primary)';

            if (n.type === 'overdue') { iconClass = 'fa-circle-exclamation'; iconColor = 'var(--danger)'; }
            else if (n.type === 'dueToday') { iconClass = 'fa-calendar-day'; iconColor = 'var(--warning)'; }
            else if (n.type === 'completed') { iconClass = 'fa-circle-check'; iconColor = 'var(--success)'; }
            else if (n.type === 'highPriority') { iconClass = 'fa-triangle-exclamation'; iconColor = 'var(--danger)'; }
            else if (n.type === 'created') { iconClass = 'fa-circle-plus'; iconColor = 'var(--primary)'; }

            notificationsHtml += `
                <div class="notification-item ${n.read ? '' : 'unread'}">
                    <div class="notif-icon-wrapper" style="color: ${iconColor}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notif-message" onclick="editTask(${n.taskId}); markNotificationAsRead('${n.id}'); toggleNotificationDropdown(false);">
                            ${n.message}
                        </div>
                        <div class="notification-meta-actions">
                            <span class="notif-timestamp">${formatTimeAgo(n.timestamp)}</span>
                            <div class="notif-item-btns">
                                ${!n.read ? `
                                    <button class="btn-notif-action success" title="Mark as Read" onclick="markNotificationAsRead('${n.id}')">
                                        <i class="fa-solid fa-check"></i>
                                    </button>` : ''}
                                <button class="btn-notif-action danger" title="Delete" onclick="clearNotification('${n.id}')">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    notificationList.innerHTML = notificationsHtml;
    notificationCountElement.textContent = unreadCount > 0 ? `[${unreadCount}]` : '';
    
    updateNotificationDot();
}

/**
 * Specifically handles the visibility of the red dot indicator.
 */
function updateNotificationDot() {
    const dot = document.getElementById('notificationDot');
    if (!dot) return;
    const unreadCount = notifications.filter(n => !n.read).length;
    dot.classList.toggle('hidden', unreadCount === 0);
}

function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) notification.read = true;
    saveNotifications();
    updateNotifications();
}

function clearNotification(id) {
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications();
    updateNotifications();
}

function markAllNotificationsAsRead() {
    notifications.forEach(n => n.read = true);
    saveNotifications();
    updateNotifications();
}

function clearAllNotifications() {
    notifications = [];
    saveNotifications();
    updateNotifications();
}
