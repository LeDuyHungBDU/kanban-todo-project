// Main Application Class
class KanbanApp {
    constructor() {
        this.currentBoard = null;
        this.boards = [];
        this.tasks = {};
        this.users = [];
        
        this.initializeApp();
    }

    async initializeApp() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Không thể khởi tạo ứng dụng');
        }
    }

    setupEventListeners() {
        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfileModal());
        }

        // Board controls
        const newBoardBtn = document.getElementById('newBoardBtn');
        if (newBoardBtn) {
            newBoardBtn.addEventListener('click', () => this.showBoardModal());
        }

        const boardSelect = document.getElementById('boardSelect');
        if (boardSelect) {
            boardSelect.addEventListener('change', (e) => this.switchBoard(e.target.value));
        }

        // Board actions
        const editBoardBtn = document.getElementById('editBoardBtn');
        if (editBoardBtn) {
            editBoardBtn.addEventListener('click', () => this.editCurrentBoard());
        }

        const deleteBoardBtn = document.getElementById('deleteBoardBtn');
        if (deleteBoardBtn) {
            deleteBoardBtn.addEventListener('click', () => this.deleteCurrentBoard());
        }

        // Modal forms
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));
        }

        const boardForm = document.getElementById('boardForm');
        if (boardForm) {
            boardForm.addEventListener('submit', (e) => this.handleBoardSubmit(e));
        }

        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }

        // Confirm modal
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');
        if (confirmYes) confirmYes.addEventListener('click', () => this.handleConfirmYes());
        if (confirmNo) confirmNo.addEventListener('click', () => this.hideConfirmModal());
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            // Load boards
            await this.loadBoards();
            
            // Load users for assignment dropdown
            await this.loadUsers();
            
            // If no boards, show empty state
            if (this.boards.length === 0) {
                this.showEmptyState();
            } else {
                // Select first board by default
                await this.switchBoard(this.boards[0].id);
            }
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Không thể tải dữ liệu');
        } finally {
            this.hideLoading();
        }
    }

    async loadBoards() {
        try {
            this.boards = await api.getBoards();
            this.populateBoardSelect();
        } catch (error) {
            throw new Error('Không thể tải danh sách boards');
        }
    }

    async loadUsers() {
        try {
            this.users = await api.getUsers();
            this.populateUserSelect();
        } catch (error) {
            console.warn('Could not load users for assignment:', error);
            // This is not critical, continue without user list
        }
    }

    populateBoardSelect() {
        const boardSelect = document.getElementById('boardSelect');
        if (!boardSelect) return;

        // Clear existing options
        boardSelect.innerHTML = '<option value="">-- Chọn board --</option>';

        // Add board options
        this.boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            boardSelect.appendChild(option);
        });
    }

    populateUserSelect() {
        const taskAssignee = document.getElementById('taskAssignee');
        if (!taskAssignee) return;

        // Clear existing options (except the first one)
        taskAssignee.innerHTML = '<option value="">-- Chưa gán --</option>';

        // Add user options
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.full_name || user.username;
            taskAssignee.appendChild(option);
        });
    }

    async switchBoard(boardId) {
        if (!boardId) {
            this.currentBoard = null;
            this.hideKanbanBoard();
            return;
        }

        try {
            // Find board in our list
            const board = this.boards.find(b => b.id == boardId);
            if (!board) {
                throw new Error('Board not found');
            }

            this.currentBoard = board;
            
            // Update UI
            document.getElementById('boardSelect').value = boardId;
            this.updateBoardHeader();
            
            // Load tasks for this board
            await this.loadTasks();
            
            // Show kanban board
            this.showKanbanBoard();
            
        } catch (error) {
            console.error('Failed to switch board:', error);
            this.showError('Không thể chuyển board');
        }
    }

    updateBoardHeader() {
        const boardTitle = document.getElementById('boardTitle');
        if (boardTitle && this.currentBoard) {
            boardTitle.textContent = this.currentBoard.name;
        }
    }

    async loadTasks() {
        if (!this.currentBoard) return;

        try {
            const tasks = await api.getTasks(this.currentBoard.id);
            
            // Group tasks by status
            this.tasks = {
                todo: tasks.filter(t => t.status === 'todo'),
                in_progress: tasks.filter(t => t.status === 'in_progress'),
                done: tasks.filter(t => t.status === 'done')
            };
            
            // Render tasks
            this.renderTasks();
            
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showError('Không thể tải tasks');
        }
    }

    renderTasks() {
        // Render each column
        this.renderTaskColumn('todo', 'todoTasks', 'todoCount');
        this.renderTaskColumn('in_progress', 'inProgressTasks', 'inProgressCount');
        this.renderTaskColumn('done', 'doneTasks', 'doneCount');
    }

    renderTaskColumn(status, containerId, countId) {
        const container = document.getElementById(containerId);
        const countElement = document.getElementById(countId);
        
        if (!container) return;

        const tasks = this.tasks[status] || [];
        
        // Update count
        if (countElement) {
            countElement.textContent = tasks.length;
        }

        // Clear container
        container.innerHTML = '';

        // Render tasks
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-card priority-${task.priority}`;
        taskDiv.dataset.taskId = task.id;
        
        // Find assigned user name
        const assignedUser = this.users.find(u => u.id === task.assigned_to);
        const assignedName = assignedUser ? (assignedUser.full_name || assignedUser.username) : '';

        taskDiv.innerHTML = `
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <span class="task-priority ${task.priority}">${this.getPriorityText(task.priority)}</span>
                ${assignedName ? `<span class="task-assignee">👤 ${this.escapeHtml(assignedName)}</span>` : ''}
                <div class="task-actions">
                    <button class="task-action-btn" onclick="app.editTask(${task.id})" title="Chỉnh sửa">✏️</button>
                    <button class="task-action-btn" onclick="app.deleteTask(${task.id})" title="Xóa">🗑️</button>
                </div>
            </div>
        `;

        // Add click handler for task details
        taskDiv.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (!e.target.classList.contains('task-action-btn')) {
                this.editTask(task.id);
            }
        });

        return taskDiv;
    }

    getPriorityText(priority) {
        const priorityMap = {
            low: 'Thấp',
            medium: 'TB',
            high: 'Cao'
        };
        return priorityMap[priority] || priority;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Task Modal Functions
    showTaskModal(task = null, status = 'todo') {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('taskModalTitle');
        const form = document.getElementById('taskForm');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        hideError(document.getElementById('taskError'));

        if (task) {
            // Edit mode
            modalTitle.textContent = 'Chỉnh sửa Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskAssignee').value = task.assigned_to || '';
        } else {
            // Create mode
            modalTitle.textContent = 'Thêm Task Mới';
            document.getElementById('taskId').value = '';
            document.getElementById('taskStatus').value = status;
        }

        modal.classList.remove('hidden');
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleTaskSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const errorElement = document.getElementById('taskError');
        
        const taskData = {
            title: formData.get('taskTitle') || document.getElementById('taskTitle').value,
            description: formData.get('taskDescription') || document.getElementById('taskDescription').value,
            priority: formData.get('taskPriority') || document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            board_id: this.currentBoard.id,
        };

        const assignedTo = document.getElementById('taskAssignee').value;
        if (assignedTo) {
            taskData.assigned_to = parseInt(assignedTo);
        }

        const taskId = document.getElementById('taskId').value;
        const isEdit = !!taskId;

        hideError(errorElement);

        try {
            if (isEdit) {
                await api.updateTask(parseInt(taskId), taskData);
            } else {
                await api.createTask(taskData);
            }

            // Reload tasks and close modal
            await this.loadTasks();
            this.closeTaskModal();
            
        } catch (error) {
            const message = handleAPIError(error, isEdit ? 'Không thể cập nhật task' : 'Không thể tạo task');
            showError(errorElement, message);
        }
    }

    // Board Modal Functions
    showBoardModal(board = null) {
        const modal = document.getElementById('boardModal');
        const modalTitle = document.getElementById('boardModalTitle');
        const form = document.getElementById('boardForm');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        hideError(document.getElementById('boardError'));

        if (board) {
            // Edit mode
            modalTitle.textContent = 'Chỉnh sửa Board';
            document.getElementById('boardId').value = board.id;
            document.getElementById('boardName').value = board.name;
            document.getElementById('boardDescription').value = board.description || '';
            document.getElementById('boardIsPublic').checked = board.is_public;
        } else {
            // Create mode
            modalTitle.textContent = 'Tạo Board Mới';
            document.getElementById('boardId').value = '';
        }

        modal.classList.remove('hidden');
    }

    closeBoardModal() {
        const modal = document.getElementById('boardModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleBoardSubmit(event) {
        event.preventDefault();
        
        const errorElement = document.getElementById('boardError');
        
        const boardData = {
            name: document.getElementById('boardName').value,
            description: document.getElementById('boardDescription').value,
            is_public: document.getElementById('boardIsPublic').checked,
        };

        const boardId = document.getElementById('boardId').value;
        const isEdit = !!boardId;

        hideError(errorElement);

        try {
            if (isEdit) {
                await api.updateBoard(parseInt(boardId), boardData);
            } else {
                await api.createBoard(boardData);
            }

            // Reload boards and close modal
            await this.loadBoards();
            this.closeBoardModal();
            
            // If we were editing current board, refresh it
            if (isEdit && this.currentBoard && this.currentBoard.id == boardId) {
                this.currentBoard = { ...this.currentBoard, ...boardData };
                this.updateBoardHeader();
            }
            
        } catch (error) {
            const message = handleAPIError(error, isEdit ? 'Không thể cập nhật board' : 'Không thể tạo board');
            showError(errorElement, message);
        }
    }

    // Utility Functions
    showLoading() {
        const loadingState = document.getElementById('loadingState');
        const kanbanBoard = document.getElementById('kanbanBoard');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (kanbanBoard) kanbanBoard.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.classList.add('hidden');
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const kanbanBoard = document.getElementById('kanbanBoard');
        
        if (emptyState) emptyState.classList.remove('hidden');
        if (kanbanBoard) kanbanBoard.classList.add('hidden');
    }

    showKanbanBoard() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        const emptyState = document.getElementById('emptyState');
        
        if (kanbanBoard) kanbanBoard.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }

    hideKanbanBoard() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        if (kanbanBoard) kanbanBoard.classList.add('hidden');
    }

    showError(message) {
        alert(message); // Simple error display, can be improved with custom modal
    }

    // Confirm Modal Functions
    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageElement = document.getElementById('confirmMessage');
        
        if (!modal || !messageElement) return;

        messageElement.textContent = message;
        this.confirmCallback = onConfirm;
        modal.classList.remove('hidden');
    }

    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.confirmCallback = null;
    }

    handleConfirmYes() {
        if (this.confirmCallback) {
            this.confirmCallback();
        }
        this.hideConfirmModal();
    }

    // Public API Functions (called by onclick handlers)
    addNewTask(status) {
        this.showTaskModal(null, status);
    }

    editTask(taskId) {
        // Find task in our data
        let task = null;
        for (const status in this.tasks) {
            task = this.tasks[status].find(t => t.id === taskId);
            if (task) break;
        }

        if (task) {
            this.showTaskModal(task);
        }
    }

    deleteTask(taskId) {
        this.showConfirmModal(
            'Bạn có chắc chắn muốn xóa task này?',
            async () => {
                try {
                    await api.deleteTask(taskId);
                    await this.loadTasks();
                } catch (error) {
                    const message = handleAPIError(error, 'Không thể xóa task');
                    this.showError(message);
                }
            }
        );
    }

    editCurrentBoard() {
        if (this.currentBoard) {
            this.showBoardModal(this.currentBoard);
        }
    }

    deleteCurrentBoard() {
        if (!this.currentBoard) return;

        this.showConfirmModal(
            `Bạn có chắc chắn muốn xóa board "${this.currentBoard.name}"? Tất cả tasks trong board này cũng sẽ bị xóa.`,
            async () => {
                try {
                    await api.deleteBoard(this.currentBoard.id);
                    
                    // Reload boards
                    await this.loadBoards();
                    
                    // Reset current board
                    this.currentBoard = null;
                    
                    // Update UI
                    if (this.boards.length === 0) {
                        this.showEmptyState();
                    } else {
                        await this.switchBoard(this.boards[0].id);
                    }
                    
                } catch (error) {
                    const message = handleAPIError(error, 'Không thể xóa board');
                    this.showError(message);
                }
            }
        );
    }

    createNewBoard() {
        this.showBoardModal();
    }

    // Profile Modal Functions
    async showProfileModal() {
        const modal = document.getElementById('profileModal');
        const form = document.getElementById('profileForm');

        if (!modal || !form) return;

        // Reset form
        form.reset();
        hideError(document.getElementById('profileError'));
        hideError(document.getElementById('profileSuccess'));

        try {
            // Load current user data
            const userData = await api.getCurrentUser();

            document.getElementById('profileUsername').value = userData.username;
            document.getElementById('profileEmail').value = userData.email || '';
            document.getElementById('profileFullName').value = userData.full_name || '';
            document.getElementById('profileRole').value = userData.role;

            modal.classList.remove('hidden');
        } catch (error) {
            const message = handleAPIError(error, 'Không thể tải thông tin profile');
            this.showError(message);
        }
    }

    closeProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleProfileSubmit(event) {
        event.preventDefault();

        const errorElement = document.getElementById('profileError');
        const successElement = document.getElementById('profileSuccess');

        const profileData = {
            email: document.getElementById('profileEmail').value.trim(),
            full_name: document.getElementById('profileFullName').value.trim(),
        };

        hideError(errorElement);
        hideError(successElement);

        try {
            await api.updateCurrentUser(profileData);

            // Show success message
            successElement.textContent = 'Cập nhật profile thành công!';
            successElement.classList.remove('hidden');

            // Update stored user info
            const currentUser = await api.getCurrentUser();
            localStorage.setItem('user_info', JSON.stringify(currentUser));

            // Update display name in header
            const userDisplayElement = document.getElementById('currentUser');
            if (userDisplayElement) {
                userDisplayElement.textContent = currentUser.full_name || currentUser.username;
            }

            // Close modal after delay
            setTimeout(() => {
                this.closeProfileModal();
            }, 2000);

        } catch (error) {
            const message = handleAPIError(error, 'Không thể cập nhật profile');
            showError(errorElement, message);
        }
    }
}

// Global functions for onclick handlers
function addNewTask(status) {
    if (window.app) {
        window.app.addNewTask(status);
    }
}

function createNewBoard() {
    if (window.app) {
        window.app.createNewBoard();
    }
}

function closeTaskModal() {
    if (window.app) {
        window.app.closeTaskModal();
    }
}

function closeBoardModal() {
    if (window.app) {
        window.app.closeBoardModal();
    }
}

function closeProfileModal() {
    if (window.app) {
        window.app.closeProfileModal();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on main page (not login/register)
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        window.app = new KanbanApp();
    }
});
