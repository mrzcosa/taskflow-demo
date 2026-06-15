// ==========================================
// GLOBAL STATE
// ==========================================

let tasks = [];

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
});

// ==========================================
// API FUNCTIONS
// ==========================================

async function loadTasks(){

    try{

        const response =
            await fetch('/tasks');

        tasks =
            await response.json();

        updateCards();
        renderTasks();

    }catch(error){

        console.error(error);

        alert('Unable to load tasks.');
    }
}

async function addTask(){

    const payload = getFormData();

    try{

        const response =
            await fetch('/tasks',{

                method:'POST',

                headers:{
                    'Content-Type':'application/json'
                },

                body:JSON.stringify(payload)
            });

        if(!response.ok){

            const message =
                await response.text();

            throw new Error(message);
        }

        clearForm();

        loadTasks();

    }catch(error){

        alert(error.message);
    }
}

async function deleteTask(id){

    if(!confirm('Delete this task?'))
        return;

    await fetch(`/tasks/${id}`,{
        method:'DELETE'
    });

    loadTasks();
}

// ==========================================
// FORM HELPERS
// ==========================================

function getFormData(){

    return{

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

function clearForm(){

    document.getElementById('title').value='';
    document.getElementById('estimatedHours').value='';
    document.getElementById('reward').value='';
}

// ==========================================
// UI FUNCTIONS
// ==========================================

function updateCards(){

    const total =
        tasks.length;

    const pending =
        tasks.filter(task =>
            task.status === 'Pending'
        ).length;

    const completed =
        tasks.filter(task =>
            task.status === 'Completed'
        ).length;

    document.getElementById('totalTasks').textContent =
        total;

    document.getElementById('pendingTasks').textContent =
        pending;

    document.getElementById('completedTasks').textContent =
        completed;
}

function renderTasks(){

    const searchText =
        document.getElementById('search')
        .value
        .toLowerCase();

    const filteredTasks =
        tasks.filter(task =>
            task.title.toLowerCase()
            .includes(searchText)
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
                <span class="badge ${task.status === 'Completed'
                    ? 'completed'
                    : 'pending'}">

                    ${task.status}

                </span>
            </td>

            <td>${task.estimatedHours}</td>

            <td>${task.rewardForCompletion}</td>

            <td>
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