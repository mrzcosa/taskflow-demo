// ==========================================
// GLOBAL STATE
// ==========================================

/**
 * STORAGE_KEY: The key used in Local Storage
 */
const STORAGE_KEY = 'taskflow_demo_tasks'; // Changed to a more specific key
let tasks = [];
// use window.currentEditId as the single source of truth for edit state
window.currentEditId = window.currentEditId || null;

// Active Filter States
let currentStatusFilter = 'All';
let currentPriorityFilter = 'All';

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

/**
 * Retrieves tasks from Local Storage.
 * @returns {Array} An array of task objects.
 */
function getTasksFromStorage() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : [];
}

/**
 * Saves the current tasks array to Local Storage.
 * @param {Array} tasksArray - The array of task objects to save.
 */
function saveTasksToStorage(tasksArray) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initFilters();
});

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

// ==========================================
// DATA & UI MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Loads tasks from Local Storage or seeds demo data if empty.
 * Then refreshes the UI.
 */
function loadTasks() {
    tasks = getTasksFromStorage();

    if (tasks.length === 0) {
        // Seed Demo Data for first-time users
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        tasks = [
            { id: Date.now() + 1, title: 'Review Q3 Financial Report', description: 'Analyze revenue, expenses, and profit margins for the third quarter.', dueDate: today.toISOString().split('T')[0], priority: 'High', status: 'Pending', estimatedHours: 4, rewardForCompletion: 'Team Recognition' },
            { id: Date.now() + 2, title: 'Update User Onboarding Flow', description: 'Refine the steps new users take to get started with TaskFlow.', dueDate: tomorrow.toISOString().split('T')[0], priority: 'Medium', status: 'Pending', estimatedHours: 6, rewardForCompletion: 'Free Coffee' },
            { id: Date.now() + 3, title: 'Database Schema Refactoring', description: 'Optimize database tables and relationships for better performance.', dueDate: yesterday.toISOString().split('T')[0], priority: 'High', status: 'Pending', estimatedHours: 8, rewardForCompletion: 'Project Bonus' },
            { id: Date.now() + 4, title: 'Prepare Marketing Campaign for Q4', description: 'Develop content and strategy for upcoming product features.', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5).toISOString().split('T')[0], priority: 'Medium', status: 'Pending', estimatedHours: 5, rewardForCompletion: 'Extra PTO Day' },
            { id: Date.now() + 5, title: 'Fix Mobile Responsiveness Bugs', description: 'Address layout and interaction issues on various mobile devices.', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString().split('T')[0], priority: 'Low', status: 'Completed', estimatedHours: 3, rewardForCompletion: 'User Satisfaction' },
            { id: Date.now() + 6, title: 'Research AI Integration Options', description: 'Explore potential AI features for task automation and recommendations.', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0], priority: 'High', status: 'Pending', estimatedHours: 10, rewardForCompletion: 'Innovation Award' }
        ];
        saveTasksToStorage(tasks);
    }

    refreshUI();
}

/**
 * Refreshes all Dashboard components (KPIs, Charts, Task Table).
 */
function refreshUI() {
    updateCards();
    if (typeof renderCharts === "function") renderCharts();
    renderTasks();
}

/**
 * Handles Add and Update logic for tasks using Local Storage.
 */
function addTask() {
    const payload = getFormData();

    // Validation
    if (!payload.title || payload.title.trim() === '') {
        if (typeof showToast === 'function') showToast('Please enter a task title');
        return;
    }
    if (!payload.dueDate) {
        if (typeof showToast === 'function') showToast('Please select a due date');
        return;
    }
    if (!payload.estimatedHours || parseInt(payload.estimatedHours) <= 0) { // Changed to parseInt for consistency
        if (typeof showToast === 'function') showToast('Please enter valid estimated hours');
        return;
    }
    if (!payload.rewardForCompletion || payload.rewardForCompletion.trim() === '') {
        if (typeof showToast === 'function') showToast('Please enter a reward');
        return;
    }

    let successMessage;

    if (window.currentEditId) {
        // Update Existing Task
        tasks = tasks.map(t => t.id === window.currentEditId ? { ...payload, id: t.id } : t);
        successMessage = 'Task updated successfully';
    } else {
        // Create New Task
        const newTask = {
            ...payload,
            id: Date.now() // Unique ID generation
        };
        tasks.push(newTask);
        successMessage = 'Task added successfully';
    }

    saveTasksToStorage(tasks);
    resetFormState(successMessage);
    refreshUI();
}

/**
 * Removes a task from Local Storage.
 * @param {number} id - The ID of the task to delete.
 */
function deleteTask(id) {
    if (!confirm('Delete this task?')) return;

    tasks = tasks.filter(t => t.id !== id);
    saveTasksToStorage(tasks);

    if (typeof showToast === 'function') showToast('Task deleted successfully');
    refreshUI();
}

/**
 * Toggles a task's status in Local Storage.
 * @param {number} id - The ID of the task to toggle.
 */
function toggleStatus(id) {
    tasks = tasks.map(t => {
        if (t.id === id) {
            return { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' };
        }
        return t;
    });

    saveTasksToStorage(tasks);
    if (typeof showToast === 'function') showToast('Status updated');
    refreshUI();
}

/**
 * Resets the main task form UI state after an add/update operation.
 * @param {string} message - The toast message to display.
 */
function resetFormState(message) {
    window.currentEditId = null;
    clearForm();

    const addButton = document.querySelector('.btn-primary');
    if (addButton) addButton.textContent = 'Add Task';

    if (typeof showToast === 'function') showToast(message);
}

function logout() {
    if (typeof showToast === 'function')
        showToast('Logging out... (Demo version, no actual logout)'); // Updated message
    // In a real app, you'd clear session/token here
    // window.location.href = '/logout'; // Removed backend call
}

// ==========================================
// FORM HELPERS
// ==========================================

function getFormData() {
    return {
        title: document.getElementById('title').value,
        dueDate: document.getElementById('dueDate').value,
        priority: document.getElementById('priority').value,
        status: document.getElementById('status').value,
        estimatedHours: parseInt(document.getElementById('estimatedHours').value) || 0,
        rewardForCompletion: document.getElementById('reward').value
    };
}

function clearForm() {
    document.getElementById('title').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('priority').value = 'Medium';
    document.getElementById('status').value = 'Pending';
    document.getElementById('estimatedHours').value = '';
    document.getElementById('reward').value = '';
    // Reset the "Add Task" button text if it was "Update Task"
    const addButton = document.querySelector('.btn-primary');
    if (addButton && addButton.textContent === 'Update Task') {
        addButton.textContent = 'Add Task';
    }
}

// ==========================================
// DASHBOARD CARDS (KPIs)
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