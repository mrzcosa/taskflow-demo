// modal.js - controls Edit Task modal behavior and API integration
(function(){
    const overlay = document.getElementById('modalOverlay');
    const modal = overlay ? overlay.querySelector('.modal') : null;
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');
    const form = document.getElementById('modalForm');

    // modal inputs
    const titleInput = document.getElementById('modalTitleInput');
    const dueDateInput = document.getElementById('modalDueDate');
    const priorityInput = document.getElementById('modalPriority');
    const statusInput = document.getElementById('modalStatus');
    const estimatedInput = document.getElementById('modalEstimatedHours');
    const rewardInput = document.getElementById('modalReward');

    // ensure elements exist
    if (!overlay || !form) return;

    // open modal and populate with task object
    window.openEditModal = function(task){
        if(!task) return;

        // set fields
        titleInput.value = task.title || '';
        dueDateInput.value = task.dueDate ? task.dueDate.split('T')[0] : '';
        priorityInput.value = task.priority || 'Medium';
        statusInput.value = task.status || 'Pending';
        estimatedInput.value = task.estimatedHours || '';
        rewardInput.value = task.rewardForCompletion || '';

        // set global edit id if provided
        window.currentEditId = task.id;

        // show overlay/modal
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden','false');

        // focus first input
        setTimeout(()=> titleInput.focus(), 120);
    };

    // close modal
    function closeModal(){
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden','true');
        // small delay to allow animation to end
        setTimeout(()=>{
            // clear fields to avoid stale data
            form.reset();
            // clear global edit id so top-form doesn't accidentally reuse it
            try{ window.currentEditId = null; }catch(e){}
        }, 220);
    }

    // click overlay to close when clicking outside modal
    overlay.addEventListener('click', (e)=>{
        if(e.target === overlay) closeModal();
    });

    // close button
    closeBtn && closeBtn.addEventListener('click', closeModal);

    // cancel button
    cancelBtn && cancelBtn.addEventListener('click', closeModal);

    // esc key closes modal
    document.addEventListener('keydown', (e)=>{
        if(e.key === 'Escape' && overlay.classList.contains('open')){
            closeModal();
        }
    });

    // form submit - save changes via PUT
    form.addEventListener('submit', (e)=>{
        e.preventDefault();

        if (!titleInput.value || titleInput.value.trim() === '') {
            if (typeof showToast === 'function') showToast('Task title cannot be empty');
            return;
        }

        if (!dueDateInput.value) {
            if (typeof showToast === 'function') showToast('Please select a due date');
            return;
        }

        if (!estimatedInput.value || parseInt(estimatedInput.value) <= 0) {
            if (typeof showToast === 'function') showToast('Please enter valid estimated hours');
            return;
        }

        if (!rewardInput.value || rewardInput.value.trim() === '') {
            if (typeof showToast === 'function') showToast('Please enter a reward');
            return;
        }

        const id = window.currentEditId;
        if(!id){
            if(typeof showToast === 'function') showToast('No task selected for edit');
            return;
        }

        const payload = {
            title: titleInput.value,
            dueDate: dueDateInput.value || null,
            priority: priorityInput.value,
            status: statusInput.value,
            estimatedHours: parseInt(estimatedInput.value) || 0,
            rewardForCompletion: rewardInput.value
        };

        // Local Storage Update Logic
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...payload };
            
            if (typeof saveTasks === 'function') saveTasks();
            
            // success
            if(typeof showToast === 'function') showToast('Task updated successfully');
            closeModal();
            // refresh tasks and UI
            if(typeof loadTasks === 'function') loadTasks();
        }
    });

})();
