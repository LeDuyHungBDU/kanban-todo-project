// Kanban Board Management
class KanbanManager {
    constructor() {
        this.currentBoard = null;
        this.tasks = [];
        this.init();
    }

    init() {
        console.log('🎯 Kanban Manager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('🎯 Setting up KanbanManager event listeners...');
        console.log('🔍 DOM ready state:', document.readyState);
        console.log('🔍 Available forms:', document.querySelectorAll('form'));

        // Direct event listeners for forms (since delegation might not work with dynamic content)
        const taskForm = document.getElementById('taskForm');
        const boardForm = document.getElementById('boardForm');
        const profileForm = document.getElementById('profileForm');

        console.log('🔍 Form elements found:', {
            taskForm: !!taskForm,
            boardForm: !!boardForm,
            profileForm: !!profileForm
        });

        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Task form submitted');
                this.handleTaskSubmit();
            });
            console.log('✅ Task form listener attached');
        } else {
            console.warn('❌ Task form not found');
        }

        if (boardForm) {
            boardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Board form submitted');
                this.handleBoardSubmit();
            });
            console.log('✅ Board form listener attached');
        } else {
            console.warn('❌ Board form not found');
        }

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
            console.log('✅ Profile form listener attached');
        }

        // Confirm modal buttons - also use delegation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'confirmYes') {
                this.handleConfirmYes();
            } else if (e.target.id === 'confirmNo') {
                this.handleConfirmNo();
            }
        });

        console.log('✅ KanbanManager event listeners setup complete');
    }

    async loadUsers() {
        try {
            console.log('🔄 Loading users for assignee dropdown...');
            const users = await api.getUsers();
            console.log('✅ Users loaded:', users.length, 'users');
            return users;
        } catch (error) {
            console.error('❌ Error loading users:', error);
            return [];
        }
    }

    async populateAssigneeSelect() {
        const assigneeSelect = document.getElementById('taskAssignee');
        if (!assigneeSelect) {
            console.warn('❌ Assignee select element not found');
            return;
        }

        console.log('🔄 Populating assignee dropdown...');

        try {
            const users = await this.loadUsers();
            assigneeSelect.innerHTML = '<option value="">-- Chưa gán --</option>';

            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.full_name || user.username;
                assigneeSelect.appendChild(option);
            });

            console.log('✅ Assignee dropdown populated with', users.length, 'users');
        } catch (error) {
            console.error('❌ Error populating assignee select:', error);
            assigneeSelect.innerHTML = '<option value="">-- Lỗi tải danh sách --</option>';
        }
    }

    async handleTaskSubmit() {
        console.log('🔄 handleTaskSubmit called');
        
        const taskId = document.getElementById('taskId').value;
        const taskTitle = document.getElementById('taskTitle');
        const taskDescription = document.getElementById('taskDescription');
        const taskStatus = document.getElementById('taskStatus');
        const taskPriority = document.getElementById('taskPriority');
        const taskAssignee = document.getElementById('taskAssignee');
        
        console.log('🔍 Form elements:', {
            taskId,
            taskTitle: taskTitle ? taskTitle.value : 'not found',
            taskDescription: taskDescription ? taskDescription.value : 'not found',
            taskStatus: taskStatus ? taskStatus.value : 'not found',
            taskPriority: taskPriority ? taskPriority.value : 'not found',
            taskAssignee: taskAssignee ? taskAssignee.value : 'not found',
            currentBoardId: window.app ? window.app.currentBoardId : 'not found'
        });
        
        // Parse assigned_to as integer if it has a value
        let assignedToValue = null;
        if (taskAssignee && taskAssignee.value && taskAssignee.value !== '') {
            assignedToValue = parseInt(taskAssignee.value, 10);
            console.log('🔍 Parsed assigned_to:', assignedToValue);
        }
        
        const formData = {
            title: taskTitle ? taskTitle.value.trim() : '',
            description: taskDescription ? taskDescription.value.trim() : '',
            status: taskStatus ? taskStatus.value : '',
            priority: taskPriority ? taskPriority.value : '',
            assigned_to: assignedToValue,
            board_id: window.app ? window.app.currentBoardId : null
        };

        console.log('📝 Form data:', formData);

        if (!formData.title) {
            console.log('❌ Title is empty');
            this.showError('taskError', 'Vui lòng nhập tiêu đề task');
            return;
        }

        if (!formData.board_id) {
            console.log('❌ Board ID is missing');
            this.showError('taskError', 'Không tìm thấy board ID');
            return;
        }

        try {
            console.log('🚀 Starting API call...');
            let updatedTask;
            if (taskId) {
                // Update existing task
                console.log('📝 Updating existing task:', taskId);
                updatedTask = await api.updateTask(taskId, formData);
                console.log('✅ Task updated:', updatedTask);
            } else {
                // Create new task
                console.log('➕ Creating new task with data:', formData);
                updatedTask = await api.createTask(formData);
                console.log('✅ Task created:', updatedTask);
            }

            console.log('🔄 Updating store...');
            if (window.app) {
                if (taskId) {
                    // Update existing task in store - pass full task object as updates
                    console.log('📝 Updating task in store:', taskId, updatedTask);
                    // Extract only the fields we want to update
                    const updates = {
                        title: updatedTask.title,
                        description: updatedTask.description,
                        status: updatedTask.status,
                        priority: updatedTask.priority,
                        assigned_to: updatedTask.assigned_to
                    };
                    console.log('📝 Updates to apply:', updates);
                    store.dispatch(actions.updateTask(parseInt(taskId), updates));
                    console.log('✅ Store updated with task update');
                    console.log('📊 Current store state:', store.getState());
                } else {
                    // Add new task to store
                    console.log('➕ Adding new task to store:', updatedTask);
                    store.dispatch(actions.addTask(updatedTask));
                    console.log('✅ Store updated with new task');
                    console.log('📊 Current store state:', store.getState());
                }
                
                // Reload users to ensure assignee display is up to date
                await window.app.loadUsers();
            } else {
                console.warn('⚠️ window.app not available');
            }
            
            console.log('🔄 Closing modal...');
            this.closeTaskModal();
            console.log('✅ Task submission completed successfully');
        } catch (error) {
            console.error('❌ Error in handleTaskSubmit:', error);
            const message = handleAPIError(error, taskId ? 'Không thể cập nhật task' : 'Không thể tạo task');
            this.showError('taskError', message);
        }
    }

    async handleBoardSubmit() {
        const boardId = document.getElementById('boardId').value;
        const boardName = document.getElementById('boardName');
        const boardDescriptionInput = document.getElementById('boardDescriptionInput');
        const boardIsPublic = document.getElementById('boardIsPublic');

        console.log('🔍 Form elements check:');
        console.log('boardId:', boardId);
        console.log('boardName:', boardName, 'value:', boardName ? boardName.value : 'undefined');
        console.log('boardDescriptionInput:', boardDescriptionInput, 'value:', boardDescriptionInput ? boardDescriptionInput.value : 'undefined');
        console.log('boardIsPublic:', boardIsPublic, 'checked:', boardIsPublic ? boardIsPublic.checked : 'undefined');

        // Additional debug for description
        if (boardDescriptionInput && boardDescriptionInput.value) {
            console.log('boardDescriptionInput.value length:', boardDescriptionInput.value.length);
            console.log('boardDescriptionInput.value trimmed:', boardDescriptionInput.value.trim());
        }

        if (!boardName || !boardDescriptionInput || !boardIsPublic) {
            console.error('❌ Form elements not found');
            console.error('boardName:', !!boardName, 'boardDescriptionInput:', !!boardDescriptionInput, 'boardIsPublic:', !!boardIsPublic);
            this.showError('boardError', 'Lỗi form không tìm thấy các trường');
            return;
        }

        const formData = {
            name: boardName.value ? boardName.value.trim() : '',
            description: boardDescriptionInput.value !== undefined && boardDescriptionInput.value !== null 
                ? boardDescriptionInput.value.trim() 
                : '',
            is_public: boardIsPublic ? boardIsPublic.checked : false
        };

        console.log('═══════════════════════════════════════');
        console.log('📝 BOARD FORM SUBMISSION DEBUG');
        console.log('═══════════════════════════════════════');
        console.log('Board ID:', boardId || 'NEW BOARD');
        console.log('Form Data:', formData);
        console.log('Description:', `"${formData.description}"`);
        console.log('Description Length:', formData.description.length);
        console.log('Description Type:', typeof formData.description);
        console.log('═══════════════════════════════════════');

        if (!formData.name) {
            this.showError('boardError', 'Vui lòng nhập tên board');
            return;
        }

        try {
            let updatedBoard;
            if (boardId) {
                // Update existing board
                console.log('🔄 Updating board:', boardId);
                updatedBoard = await api.updateBoard(boardId, formData);
                console.log('✅ Board updated:', updatedBoard);
                console.log('✅ Updated board description:', updatedBoard.description);
            } else {
                // Create new board
                console.log('➕ Creating new board with data:', formData);
                updatedBoard = await api.createBoard(formData);
                console.log('✅ Board created:', updatedBoard);
                console.log('✅ Created board description:', updatedBoard.description);
            }

            console.log('═══════════════════════════════════════');
            console.log('📊 BOARD RESPONSE CHECK');
            console.log('═══════════════════════════════════════');
            console.log('Board ID:', updatedBoard.id);
            console.log('Board Name:', updatedBoard.name);
            console.log('Board Description:', `"${updatedBoard.description}"`);
            console.log('Description in response:', updatedBoard.description !== null && updatedBoard.description !== undefined);
            console.log('═══════════════════════════════════════');

            if (window.app) {
                console.log('🔄 Updating board UI after creation/update');
                
                const boardIdToKeep = updatedBoard.id;
                console.log('📌 Board ID:', boardIdToKeep);
                
                if (boardId) {
                    // UPDATE CASE: Just update the board name in selector (no rebuild!)
                    console.log('✏️ Update case: Updating board name in selector');
                    window.app.updateBoardNameInSelector(
                        boardIdToKeep, 
                        updatedBoard.name,
                        updatedBoard.owner_id,
                        updatedBoard.owner_name
                    );
                    
                    // Reload board details and tasks to show changes
                    console.log('🔄 Reloading board details and tasks');
                    await window.app.loadBoardDetails(boardIdToKeep);
                    await window.app.loadTasks(boardIdToKeep);
                    
                    console.log('✅ Board updated, selector preserved');
                } else {
                    // CREATE CASE: Add new board to selector and switch to it
                    console.log('➕ Create case: Adding new board to selector');
                    window.app.addBoardToSelector(updatedBoard);
                    
                    // Update app state and save to localStorage
                    window.app.setCurrentBoard(boardIdToKeep);
                    
                    // Load new board details and tasks
                    console.log('🔄 Loading new board details and tasks');
                    await window.app.loadBoardDetails(boardIdToKeep);
                    await window.app.loadTasks(boardIdToKeep);
                    window.app.showKanbanBoard();
                    
                    console.log('✅ New board created and displayed');
                }
            }
            this.closeBoardModal();
        } catch (error) {
            console.error('❌ Board submit error:', error);
            const message = handleAPIError(error, boardId ? 'Không thể cập nhật board' : 'Không thể tạo board');
            this.showError('boardError', message);
        }
    }

    async handleProfileSubmit() {
        const formData = {
            email: document.getElementById('profileEmail').value.trim(),
            full_name: document.getElementById('profileFullName').value.trim()
        };

        try {
            await api.updateCurrentUser(formData);
            this.showSuccess('profileSuccess', 'Cập nhật thành công!');
            setTimeout(() => this.closeProfileModal(), 2000);
        } catch (error) {
            const message = handleAPIError(error, 'Không thể cập nhật thông tin');
            this.showError('profileError', message);
        }
    }

    handleConfirmYes() {
        // Handle confirmation actions based on context
        this.closeConfirmModal();
    }

    handleConfirmNo() {
        this.closeConfirmModal();
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    showSuccess(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            // If no message, hide the element
            if (!message || message.trim() === '') {
                this.hideSuccess(elementId);
                return;
            }
            
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }
    
    hideSuccess(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.classList.add('hidden');
        }
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.classList.add('hidden');
            // Clear error messages
            this.showError('taskError', '');
        }
    }

    closeBoardModal() {
        const modal = document.getElementById('boardModal');
        if (modal) {
            modal.classList.add('hidden');
            // Clear error messages
            this.showError('boardError', '');
        }
    }

    closeProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.add('hidden');
            // Clear error and success messages
            this.showError('profileError', '');
            this.showSuccess('profileSuccess', '');
        }
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize Kanban Manager
const kanbanManager = new KanbanManager();
window.kanbanManager = kanbanManager;