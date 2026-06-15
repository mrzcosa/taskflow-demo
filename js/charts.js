// ==========================================
// TASKFLOW ANALYTICS CHARTS
// ==========================================

let statusChart = null;
let priorityChart = null;

function renderCharts() {

    const statusCanvas =
        document.getElementById('statusChart');

    const priorityCanvas =
        document.getElementById('priorityChart');

    if (!statusCanvas || !priorityCanvas)
        return;

    const completed =
        tasks.filter(t =>
            t.status === "Completed"
        ).length;

    const pending =
        tasks.filter(t =>
            t.status === "Pending"
        ).length;

    const high =
        tasks.filter(t =>
            t.priority === "High"
        ).length;

    const medium =
        tasks.filter(t =>
            t.priority === "Medium"
        ).length;

    const low =
        tasks.filter(t =>
            t.priority === "Low"
        ).length;

    // Destroy old charts before redraw

    if (statusChart) {
        statusChart.destroy();
    }

    if (priorityChart) {
        priorityChart.destroy();
    }

    // ==========================================
    // STATUS CHART
    // ==========================================

    statusChart = new Chart(statusCanvas, {

        type: 'doughnut',

        data: {

            labels: [
                'Completed',
                'Pending'
            ],

            datasets: [{
                data: [
                    completed,
                    pending
                ],

                backgroundColor: [
                    '#22c55e',
                    '#f59e0b'
                ],

                borderWidth: 0
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });

    // ==========================================
    // PRIORITY CHART
    // ==========================================

    priorityChart = new Chart(priorityCanvas, {

        type: 'bar',

        data: {

            labels: [
                'Low',
                'Medium',
                'High'
            ],

            datasets: [{
                label: 'Tasks',

                data: [
                    low,
                    medium,
                    high
                ],

                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#ef4444'
                ],

                borderRadius: 8
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }
            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {
                        color: '#ffffff'
                    },

                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },

                x: {

                    ticks: {
                        color: '#ffffff'
                    },

                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}