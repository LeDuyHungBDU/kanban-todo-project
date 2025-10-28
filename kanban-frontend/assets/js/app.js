// Store is loaded globally from store.js
import { animations } from './animations.js';

class KanbanApp {
  constructor() {
    this.currentBoardId = null;
    this.currentBoard = null; // Store current board details
    this.users = []; // Store users for assignee display
    this.currentUser = null; // Store current user info
    this.init();
  }

  async init() {
    console.log('✅ Store and actions are available:', { store: !!window.store, actions: !!window.actions });

    // Check authentication first
    if (!this.checkAuth()) {
      console.log('⚠️ User not authenticated, redirecting to login...');
      return;
    }

    // Load users for assignee display
    await this.loadUsers();

    // Subscribe to store changes
    store.subscribe((newState, prevState) => {
      console.log('📊 State changed!');
      this.render(newState);
    });

    // Load initial data
    await this.loadBoards();

    // Setup event listeners
    this.setupEvents();
  }

  async loadUsers() {
    try {
      console.log('👥 Loading users for assignee display...');
      this.users = await api.getUsers();
      console.log('✅ Users loaded:', this.users.length);
      
      // Load and store current user
      this.currentUser = await api.getCurrentUser();
      console.log('👤 Current user loaded:', this.currentUser.username);
      
      // Show Manage Users button for admin
      if (this.currentUser && this.currentUser.role === 'admin') {
        const manageUsersBtn = document.getElementById('manageUsersBtn');
        if (manageUsersBtn) {
          manageUsersBtn.classList.remove('hidden');
          console.log('👮 Admin detected, showing Manage Users button');
        }
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      this.users = [];
      this.currentUser = null;
    }
  }

  getUserName(userId) {
    if (!userId) return null;
    const user = this.users.find(u => u.id === userId);
    return user ? (user.full_name || user.username) : null;
  }

  checkAuth() {
    const token = api.getToken();
    if (!token) {
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  async loadBoards() {
    try {
      console.log('🔄 Loading boards...');
      
      store.dispatch(actions.setLoading(true));
      const boards = await api.getBoards();
      console.log('✅ Boards loaded:', boards);

      // Store boards in state
      store.dispatch(actions.loadBoards(boards));

      if (boards.length > 0) {
        // Hide empty state and show board controls
        this.hideEmptyState();

        // Try to restore last viewed board from localStorage
        if (!this.currentBoardId) {
          const savedBoardId = localStorage.getItem('last_board_id');
          console.log('💾 Saved board ID from localStorage:', savedBoardId);
          
          // Check if saved board still exists
          if (savedBoardId) {
            const savedBoard = boards.find(b => b.id === parseInt(savedBoardId));
            if (savedBoard) {
              console.log('✅ Restoring last viewed board:', savedBoard.id);
              this.setCurrentBoard(savedBoard.id);
            } else {
              // Saved board not found, use first board
              console.log('⚠️ Saved board not found, using first board:', boards[0].id);
              this.setCurrentBoard(boards[0].id);
            }
          } else {
            // No saved board, use first board
            console.log('🎯 No saved board, auto-selecting first board:', boards[0].id);
            this.setCurrentBoard(boards[0].id);
          }
          
          // Populate board selector AFTER setting currentBoardId
          this.populateBoardSelector(boards);
          
          await this.loadBoardDetails(this.currentBoardId);
          await this.loadTasks(this.currentBoardId);
          this.showKanbanBoard();
        }
      } else {
        // No boards, show empty state and hide kanban board
        this.showEmptyState();
      }
    } catch (error) {
      console.error('❌ Error loading boards:', error);
      
      // Check if it's an authentication error
      if (error instanceof APIError && error.status === 401) {
        console.log('🔒 Authentication failed, redirecting to login...');
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
        return;
      }
      
      store.dispatch(actions.setError(error.message));
    }
  }

  async loadTasks(boardId) {
    try {
      console.log('🔄 Loading tasks for board:', boardId);
      store.dispatch(actions.setLoading(true));
      const tasks = await api.getTasks(boardId);
      console.log('✅ Tasks loaded:', tasks);
      store.dispatch(actions.loadTasks(tasks));
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      store.dispatch(actions.setError(error.message));
    }
  }

  setCurrentBoard(boardId) {
    this.currentBoardId = boardId;
    store.dispatch(actions.setCurrentBoard(boardId));
    localStorage.setItem('last_board_id', boardId);
    console.log('💾 Current board set and saved:', boardId);
  }

  render(state) {
    const { tasks, filter, loading } = state;
    console.log('🎨 Rendering state:', { tasks: tasks.length, filter, loading });
    console.log('🔍 Tasks in state:', tasks);

    if (loading) {
      this.showLoading();
      return;
    }

    // Hide loading state
    this.hideLoading();

    // Filter tasks
    const filteredTasks = filter === 'all'
      ? tasks
      : tasks.filter(t => t.priority === filter);

    console.log('🔍 Filtered tasks:', filteredTasks);

    // Render to DOM
    this.renderTasks(filteredTasks);

    // Show kanban board
    this.showKanbanBoard();
  }

  setupEvents() {
    console.log('🎧 Setting up event listeners...');

    // New Board button
    const newBoardBtn = document.getElementById('newBoardBtn');
    if (newBoardBtn) {
      newBoardBtn.addEventListener('click', () => {
        console.log('➕ New board button clicked');
        this.showNewBoardModal();
      });
    }

    // Profile button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        console.log('👤 Profile button clicked');
        this.showProfileModal();
      });
    }

    // Manage Users button (admin only)
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    if (manageUsersBtn) {
      manageUsersBtn.addEventListener('click', () => {
        console.log('👥 Redirecting to User Management...');
        window.location.href = 'users.html';
      });
    }

    // Board selector
    const boardSelect = document.getElementById('boardSelect');
    if (boardSelect) {
      boardSelect.addEventListener('change', async (e) => {
        const boardId = e.target.value;
        console.log('📋 Board selected:', boardId);
        if (boardId) {
          this.setCurrentBoard(boardId);
          await this.loadBoardDetails(boardId);
          await this.loadTasks(boardId);
          this.showKanbanBoard();
        } else {
          // No board selected, hide kanban board
          this.hideKanbanBoard();
        }
      });
    }

    // Add task buttons in columns
    document.querySelectorAll('.btn-small').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const status = e.target.closest('.kanban-column').dataset.status;
        console.log('➕ Add task button clicked for status:', status);
        this.showNewTaskModal(status);
      });
    });

    // Edit and Delete board buttons
    const editBoardBtn = document.getElementById('editBoardBtn');
    if (editBoardBtn) {
      editBoardBtn.addEventListener('click', () => {
        console.log('✏️ Edit board button clicked');
        this.showEditBoardModal();
      });
    }

    const deleteBoardBtn = document.getElementById('deleteBoardBtn');
    if (deleteBoardBtn) {
      deleteBoardBtn.addEventListener('click', () => {
        console.log('🗑️ Delete board button clicked');
        this.showDeleteBoardConfirm();
      });
    }

    console.log('✅ Event listeners setup complete');
    
    // Setup drag and drop
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    console.log('🎯 Setting up drag and drop with animations...');
    
    // Make task cards draggable
    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('task-card')) {
        // Get task to check permissions
        const taskId = parseInt(e.target.dataset.taskId);
        const state = store.getState();
        const task = state.tasks.find(t => t.id === taskId);
        
        // Check if user can edit this specific task
        if (!task || !this.canEditTask(task)) {
          e.preventDefault();
          console.log('🔒 Drag prevented: No permission for this task');
          return;
        }
        
        console.log('🎯 Drag started for task:', taskId);
        // Apply drag start animation
        animations.dragStart(e.target);
        e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    document.addEventListener('dragend', (e) => {
      if (e.target.classList.contains('task-card')) {
        console.log('🎯 Drag ended');
        // Apply drag end animation
        animations.dragEnd(e.target);
      }
    });

    // Setup drop zones - use correct container IDs
    const dropZoneIds = ['todoTasks', 'inProgressTasks', 'doneTasks'];
    
    dropZoneIds.forEach(containerId => {
      const dropZone = document.getElementById(containerId);
      if (!dropZone) {
        console.warn(`❌ Drop zone not found: ${containerId}`);
        return;
      }
      
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (!dropZone.classList.contains('drag-over')) {
          dropZone.classList.add('drag-over');
          // Animate drop zone highlight
          animations.highlightZone(dropZone);
        }
      });

      dropZone.addEventListener('dragleave', (e) => {
        // Only remove if leaving the drop zone itself (not child elements)
        if (e.target === dropZone) {
          dropZone.classList.remove('drag-over');
          // Animate drop zone unhighlight
          animations.unhighlightZone(dropZone);
        }
      });

      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        // Animate drop zone unhighlight
        animations.unhighlightZone(dropZone);
        
        const taskIdString = e.dataTransfer.getData('text/plain');
        const taskId = parseInt(taskIdString, 10); // Convert to integer
        const newStatus = dropZone.closest('.kanban-column').dataset.status;
        
        console.log('🎯 Drop event:', { taskIdString, taskId, newStatus });
        
        if (taskId && newStatus) {
          await this.moveTask(taskId, newStatus);
        }
      });
      
      console.log(`✅ Drop zone setup for ${containerId}`);
    });
  }

  async moveTask(taskId, newStatus) {
    try {
      console.log('🔄 Moving task:', { taskId, type: typeof taskId, newStatus });
      
      // Ensure taskId is an integer
      const taskIdInt = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
      
      // Get current task from store to check old status
      const currentState = store.getState();
      const currentTask = currentState.tasks.find(t => t.id === taskIdInt);
      
      if (!currentTask) {
        console.error('❌ Task not found in store:', taskIdInt);
        alert('Task không tồn tại');
        return;
      }
      
      // Check if status actually changed
      if (currentTask.status === newStatus) {
        console.log('ℹ️ Task already in this status, no need to move');
        return;
      }
      
      console.log('📝 Moving task from', currentTask.status, 'to', newStatus);
      
      // Update task status via API
      const updatedTask = await api.moveTask(taskIdInt, newStatus);
      console.log('✅ API response:', updatedTask);
      
      // Update task in store with full task data from API
      store.dispatch(actions.updateTask(taskIdInt, updatedTask));
      
      // After re-render, find the moved task card and animate it
      setTimeout(() => {
        const movedCard = document.querySelector(`[data-task-id="${taskIdInt}"]`);
        if (movedCard) {
          animations.dropBounce(movedCard);
          console.log('✨ Applied drop bounce animation');
        }
      }, 100);
      
      console.log('✅ Task moved successfully');
    } catch (error) {
      console.error('❌ Error moving task:', error);
      const message = handleAPIError(error, 'Không thể di chuyển task');
      
      // Shake the task card on error if it exists
      const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskCard) {
        animations.shake(taskCard);
      }
      
      // Reload tasks to ensure UI is in sync with server
      if (this.currentBoardId) {
        console.log('🔄 Reloading tasks to sync...');
        await this.loadTasks(this.currentBoardId);
      }
      
      alert(message);
    }
  }

  renderTasks(tasks) {
    console.log('🔄 renderTasks called with tasks:', tasks);
    console.log('🔍 Tasks count:', tasks.length);
    
    // Clear all columns - use correct IDs from HTML
    const columnIds = {
      'todo': 'todoTasks',
      'in_progress': 'inProgressTasks', 
      'done': 'doneTasks'
    };
    
    Object.entries(columnIds).forEach(([status, containerId]) => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
        console.log(`✅ Cleared ${status} column (${containerId})`);
      } else {
        console.warn(`❌ Container not found for ${status} (${containerId})`);
      }
    });

    // Group tasks by status
    const tasksByStatus = {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      done: tasks.filter(t => t.status === 'done')
    };

    console.log('🔍 Tasks grouped by status:', tasksByStatus);

    // Render tasks in each column
    Object.entries(tasksByStatus).forEach(([status, statusTasks]) => {
      const containerId = columnIds[status];
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`❌ Container not found for ${status} (${containerId})`);
        return;
      }

      console.log(`🔄 Rendering ${statusTasks.length} tasks for ${status}:`, statusTasks);

      statusTasks.forEach((task, index) => {
        console.log(`🔄 Creating task card for:`, task);
        console.log(`🔍 Task assigned_to:`, task.assigned_to, `Type:`, typeof task.assigned_to);
        
        const div = document.createElement('div');
        div.className = `task-card priority-${task.priority}`;
        div.draggable = true;
        div.dataset.taskId = task.id;
        div.onclick = () => this.showTaskDetail(task);
        
        // Get assignee name if assigned
        const assigneeName = this.getUserName(task.assigned_to);
        console.log(`👤 Assignee name for task ${task.id}:`, assigneeName);
        console.log(`📋 Available users:`, this.users.length, this.users.map(u => ({id: u.id, name: u.full_name || u.username})));
        
        // Check if user can edit this task
        const canEditThisTask = this.canEditTask(task);
        
        div.innerHTML = `
          <div class="task-title">${task.title}</div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          <div class="task-meta">
            <div class="task-info">
              <span class="task-priority ${task.priority}">${task.priority}</span>
              ${assigneeName ? `<span class="task-assignee">👤 ${assigneeName}</span>` : ''}
            </div>
            ${canEditThisTask ? `<button class="delete-task-btn task-action-btn" data-task-id="${task.id}">🗑️</button>` : ''}
          </div>
        `;
        
        // Add delete button event listener if button exists
        if (canEditThisTask) {
          const deleteBtn = div.querySelector('.delete-task-btn');
          if (deleteBtn) {
            deleteBtn.onclick = (e) => {
              e.stopPropagation();
              this.showDeleteTaskConfirm(task.id);
            };
          }
        }
        
        // Set initial opacity to 0 for animation
        div.style.opacity = '0';
        container.appendChild(div);
        
        // Animate task card appearance with staggered delay
        setTimeout(() => {
          animations.fadeIn(div, 300);
        }, index * 50);
        
        console.log(`✅ Task card added to ${status} column`);
      });

      // Update task count - use correct count IDs
      const countIds = {
        'todo': 'todoCount',
        'in_progress': 'inProgressCount',
        'done': 'doneCount'
      };
      
      const countElement = document.getElementById(countIds[status]);
      if (countElement) {
        countElement.textContent = statusTasks.length;
        console.log(`✅ Updated ${status} count to ${statusTasks.length}`);
      } else {
        console.warn(`❌ Count element not found for ${status} (${countIds[status]})`);
      }
    });
    
    // Update UI permissions after rendering tasks
    this.updateUIPermissions();
    
    console.log('✅ renderTasks completed');
  }

  showDeleteTaskConfirm(taskId) {
    console.log('🗑️ Showing delete task confirmation for:', taskId);
    const modal = document.getElementById('confirmModal');
    if (modal) {
      document.getElementById('confirmMessage').textContent = 
        'Bạn có chắc chắn muốn xóa task này?';
      modal.classList.remove('hidden');
      
      // Set up confirm action
      const confirmYes = document.getElementById('confirmYes');
      confirmYes.onclick = () => this.confirmDeleteTask(taskId);
      
      // Set up cancel action
      const confirmNo = document.getElementById('confirmNo');
      confirmNo.onclick = () => this.closeConfirmModal();
    }
  }

  async confirmDeleteTask(id) {
    try {
      console.log('🗑️ Deleting task:', id);
      await api.deleteTask(id);
      store.dispatch(actions.deleteTask(id));
      console.log('✅ Task deleted successfully');
      this.closeConfirmModal();
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      const message = handleAPIError(error, 'Không thể xóa task');
      this.showErrorModal(message);
    }
  }
  
  showErrorModal(message) {
    const modal = document.getElementById('confirmModal');
    if (modal) {
      document.getElementById('confirmMessage').textContent = message;
      modal.classList.remove('hidden');
      
      // Only show OK button for errors
      const confirmYes = document.getElementById('confirmYes');
      confirmYes.textContent = 'OK';
      confirmYes.onclick = () => {
        this.closeConfirmModal();
        confirmYes.textContent = 'Đồng ý'; // Reset text
      };
      
      // Hide No button for errors
      const confirmNo = document.getElementById('confirmNo');
      confirmNo.style.display = 'none';
    }
  }

  showLoading() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
      loadingElement.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('loadingState');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }
  }

  showKanbanBoard() {
    const kanbanElement = document.getElementById('kanbanBoard');
    if (kanbanElement) {
      kanbanElement.classList.remove('hidden');
    }
  }

  showNewBoardModal() {
    const modal = document.getElementById('boardModal');
    if (modal) {
      document.getElementById('boardModalTitle').textContent = 'Tạo Board Mới';
      document.getElementById('boardId').value = '';
      document.getElementById('boardForm').reset();
      modal.classList.remove('hidden');
    }
  }

  showProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.loadProfileData();
    }
  }

  async loadProfileData() {
    try {
      const userData = await api.getCurrentUser();
      document.getElementById('profileUsername').value = userData.username || '';
      document.getElementById('profileEmail').value = userData.email || '';
      document.getElementById('profileFullName').value = userData.full_name || '';
      document.getElementById('profileRole').value = userData.role || '';
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  }

  showNewTaskModal(status) {
    console.log('🔄 showNewTaskModal called with status:', status);
    
    const modal = document.getElementById('taskModal');
    if (modal) {
      console.log('✅ Task modal found');
      
      document.getElementById('taskModalTitle').textContent = 'Thêm Task Mới';
      document.getElementById('taskId').value = '';
      document.getElementById('taskStatus').value = status;
      document.getElementById('taskForm').reset();

      console.log('🔍 Modal form elements:', {
        taskId: document.getElementById('taskId').value,
        taskStatus: document.getElementById('taskStatus').value,
        taskTitle: document.getElementById('taskTitle').value,
        taskDescription: document.getElementById('taskDescription').value,
        taskPriority: document.getElementById('taskPriority').value,
        taskAssignee: document.getElementById('taskAssignee').value
      });

      // Load users for assignee dropdown
      if (window.kanbanManager) {
        console.log('🔄 Loading users for assignee dropdown...');
        window.kanbanManager.populateAssigneeSelect();
      } else {
        console.warn('⚠️ window.kanbanManager not available');
      }

      modal.classList.remove('hidden');
      console.log('✅ Task modal opened');
    } else {
      console.error('❌ Task modal not found');
    }
  }

  async showEditBoardModal() {
    if (!this.currentBoardId) return;

    try {
      // Load full board data from API
      console.log('🔄 Loading board data for editing:', this.currentBoardId);
      const board = await api.getBoard(this.currentBoardId);
      console.log('✅ Board data loaded:', board);
      console.log('🔍 Board description:', board.description);

      const modal = document.getElementById('boardModal');
      if (modal) {
        document.getElementById('boardModalTitle').textContent = 'Chỉnh sửa Board';
        document.getElementById('boardId').value = board.id;
        document.getElementById('boardName').value = board.name || '';
        
        // Handle description in modal textarea - ensure it's a string
        const descriptionInputField = document.getElementById('boardDescriptionInput');
        if (descriptionInputField) {
          descriptionInputField.value = board.description ? board.description : '';
          console.log('🔍 Description input field (modal) set to:', descriptionInputField.value);
        } else {
          console.warn('❌ Board description input field not found');
        }
        
        document.getElementById('boardIsPublic').checked = board.is_public || false;

        modal.classList.remove('hidden');
      }
    } catch (error) {
      console.error('❌ Error loading board for editing:', error);
      const message = handleAPIError(error, 'Không thể tải dữ liệu board để chỉnh sửa');
      this.showErrorModal(message);
    }
  }

  showDeleteBoardConfirm() {
    if (!this.currentBoardId) return;

    const modal = document.getElementById('confirmModal');
    if (modal) {
      document.getElementById('confirmMessage').textContent =
        'Bạn có chắc chắn muốn xóa board này? Tất cả tasks sẽ bị xóa vĩnh viễn.';
      modal.classList.remove('hidden');

      // Set up confirm action
      const confirmYes = document.getElementById('confirmYes');
      confirmYes.onclick = () => this.deleteCurrentBoard();
    }
  }

  async deleteCurrentBoard() {
    if (!this.currentBoardId) return;

    try {
      await api.deleteBoard(this.currentBoardId);
      console.log('✅ Board deleted');

      // Update store
      store.dispatch(actions.deleteBoard(this.currentBoardId));

      // Clear current board from state and localStorage
      this.currentBoardId = null;
      localStorage.removeItem('last_board_id');
      console.log('🗑️ Cleared current board from state and localStorage');

      // Reload boards (will auto-select first remaining board)
      await this.loadBoards();

      // Close modal
      this.closeConfirmModal();
    } catch (error) {
      console.error('❌ Error deleting board:', error);
      const message = handleAPIError(error, 'Không thể xóa board. Vui lòng thử lại.');
      this.showErrorModal(message);
    }
  }

  closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
      modal.classList.add('hidden');
      
      // Reset button states
      const confirmYes = document.getElementById('confirmYes');
      const confirmNo = document.getElementById('confirmNo');
      
      if (confirmYes) {
        confirmYes.textContent = 'Đồng ý';
        confirmYes.onclick = null;
      }
      
      if (confirmNo) {
        confirmNo.style.display = '';
        confirmNo.onclick = null;
      }
    }
  }


  async loadBoardDetails(boardId) {
    try {
      console.log('🔄 Loading board details:', boardId);
      const board = await api.getBoard(boardId);
      console.log('✅ Board details loaded:', board);
      
      // Store current board
      this.currentBoard = board;

      // Update board title and description in display area (not modal)
      const boardTitleElement = document.getElementById('boardTitle');
      const boardDescDisplayElement = document.getElementById('boardDescriptionDisplay');
      const boardVisibilityBadge = document.getElementById('boardVisibilityBadge');

      if (boardTitleElement) {
        boardTitleElement.textContent = board.name;
        console.log('📋 Board title set to:', board.name);
      }
      if (boardDescDisplayElement) {
        boardDescDisplayElement.textContent = board.description || '';
        console.log('📝 Board description display set to:', board.description || '(empty)');
      }
      if (boardVisibilityBadge) {
        if (board.is_public) {
          boardVisibilityBadge.textContent = '🌐 Public';
          boardVisibilityBadge.className = 'board-visibility-badge badge-public';
        } else {
          boardVisibilityBadge.textContent = '🔒 Private';
          boardVisibilityBadge.className = 'board-visibility-badge badge-private';
        }
        console.log('👁️ Board visibility set to:', board.is_public ? 'Public' : 'Private');
      }
      
      // Update UI permissions
      this.updateUIPermissions();
    } catch (error) {
      console.error('❌ Error loading board details:', error);
    }
  }
  
  canEditCurrentBoard() {
    if (!this.currentBoard || !this.currentUser) {
      console.warn('⚠️ canEditCurrentBoard: Data not loaded', {
        hasBoard: !!this.currentBoard,
        hasUser: !!this.currentUser
      });
      return false;
    }
    
    // Admin can edit everything
    if (this.currentUser.role === 'admin') {
      console.log('✅ canEditCurrentBoard: Admin access');
      return true;
    }
    
    // Owner can edit their own board
    if (this.currentBoard.owner_id === this.currentUser.id) {
      console.log('✅ canEditCurrentBoard: Owner access');
      return true;
    }
    
    // Others cannot edit board (even if public)
    console.log('❌ canEditCurrentBoard: Not owner', {
      boardOwner: this.currentBoard.owner_id,
      currentUser: this.currentUser.id
    });
    return false;
  }
  
  canEditTask(task) {
    if (!this.currentUser) {
      console.warn('⚠️ canEditTask: currentUser not loaded');
      return false;
    }
    
    // Admin can edit everything
    if (this.currentUser.role === 'admin') {
      console.log('✅ canEditTask: Admin access');
      return true;
    }
    
    // Board owner can edit all tasks in their board
    if (this.currentBoard && this.currentBoard.owner_id === this.currentUser.id) {
      console.log('✅ canEditTask: Board owner access');
      return true;
    }
    
    // Assigned user can edit their assigned task
    if (task && task.assigned_to === this.currentUser.id) {
      console.log('✅ canEditTask: Assigned user access');
      return true;
    }
    
    // Others cannot edit
    console.log('❌ canEditTask: No permission', {
      user: this.currentUser?.id,
      boardOwner: this.currentBoard?.owner_id,
      taskAssignee: task?.assigned_to
    });
    return false;
  }
  
  hasAnyTaskAssigned() {
    // Check if current user has any task assigned in current board
    const state = store.getState();
    return state.tasks.some(task => task.assigned_to === this.currentUser.id);
  }
  
  updateUIPermissions() {
    const canEdit = this.canEditCurrentBoard();
    console.log('🔐 Can edit current board:', canEdit, {
      board: this.currentBoard?.name,
      owner_id: this.currentBoard?.owner_id,
      current_user_id: this.currentUser?.id,
      current_user_role: this.currentUser?.role
    });
    
    // Hide/show Edit Board button (only owner/admin can see)
    const editBoardBtn = document.getElementById('editBoardBtn');
    if (editBoardBtn) {
      editBoardBtn.style.display = canEdit ? '' : 'none';
      console.log(`🔘 Edit Board button: ${canEdit ? 'visible' : 'hidden'}`);
    }
    
    // Hide/show Delete Board button (only owner/admin can see)
    const deleteBoardBtn = document.getElementById('deleteBoardBtn');
    if (deleteBoardBtn) {
      deleteBoardBtn.style.display = canEdit ? '' : 'none';
      console.log(`🗑️ Delete Board button: ${canEdit ? 'visible' : 'hidden'}`);
    }
    
    // Hide/show Add Task buttons
    const addTaskBtns = document.querySelectorAll('.btn-small');
    addTaskBtns.forEach(btn => {
      btn.style.display = canEdit ? '' : 'none';
    });
    console.log(`➕ Add Task buttons: ${canEdit ? 'visible' : 'hidden'}`);
    
    // Enable/disable drag and drop for each task card individually
    const state = store.getState();
    const taskCards = document.querySelectorAll('.task-card');
    let dragCount = 0;
    
    taskCards.forEach(card => {
      const taskId = parseInt(card.dataset.taskId);
      const task = state.tasks.find(t => t.id === taskId);
      const canEditThisTask = task && this.canEditTask(task);
      
      if (canEditThisTask) {
        card.setAttribute('draggable', 'true');
        card.style.cursor = 'move';
        dragCount++;
      } else {
        card.setAttribute('draggable', 'false');
        card.style.cursor = 'default';
      }
    });
    
    console.log(`🖱️ Drag & drop: ${dragCount}/${taskCards.length} tasks draggable`);
    console.log(`✅ UI permissions updated: ${canEdit ? 'EDIT MODE' : 'READ-ONLY MODE'} (Board), ${dragCount} tasks editable`);
  }

  showTaskDetail(task) {
    console.log('📋 Showing task detail:', task);
    console.log('🔍 Task assigned_to:', task.assigned_to);
    
    // Check if user can edit THIS SPECIFIC task
    const canEdit = this.canEditTask(task);
    console.log('🔐 Can edit this task:', canEdit, 'assigned_to:', task.assigned_to, 'current_user:', this.currentUser?.id);
    
    // Reuse the task modal for editing/viewing
    const modal = document.getElementById('taskModal');
    if (modal) {
      document.getElementById('taskModalTitle').textContent = canEdit ? 'Chi tiết Task' : 'Xem Task (Read-only)';
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskTitle').value = task.title || '';
      
      // Handle description
      const descriptionField = document.getElementById('taskDescription');
      if (descriptionField) {
        descriptionField.value = task.description ? task.description : '';
        console.log('🔍 Description field set to:', descriptionField.value);
      } else {
        console.warn('❌ Task description field not found');
      }
      
      document.getElementById('taskStatus').value = task.status;
      document.getElementById('taskPriority').value = task.priority;

      // Load users and set assignee
      if (window.kanbanManager) {
        window.kanbanManager.populateAssigneeSelect().then(() => {
          const assigneeSelect = document.getElementById('taskAssignee');
          if (assigneeSelect) {
            // Set assignee value - handle both null and valid ID
            assigneeSelect.value = task.assigned_to || '';
            console.log('🔍 Assignee dropdown set to:', assigneeSelect.value);
            console.log('🔍 Available options:', Array.from(assigneeSelect.options).map(o => ({value: o.value, text: o.text})));
          }
        });
      }
      
      // Disable/enable form fields based on permissions
      const formFields = ['taskTitle', 'taskDescription', 'taskStatus', 'taskPriority', 'taskAssignee'];
      formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          field.disabled = !canEdit;
        }
      });
      
      // Hide/show action buttons
      const saveBtn = modal.querySelector('button[type="submit"]');
      const taskForm = document.getElementById('taskForm');
      if (saveBtn) {
        saveBtn.style.display = canEdit ? '' : 'none';
      }
      if (taskForm) {
        if (!canEdit) {
          taskForm.onsubmit = (e) => {
            e.preventDefault();
            return false;
          };
        } else {
          taskForm.onsubmit = null; // Reset to allow normal form submission
        }
      }

      modal.classList.remove('hidden');
      console.log(`✅ Task modal opened in ${canEdit ? 'EDIT' : 'READ-ONLY'} mode`);
    }
  }

  populateBoardSelector(boards, preserveSelection = false) {
    const boardSelect = document.getElementById('boardSelect');
    if (!boardSelect) return;

    // Save current selection if needed
    const currentSelection = preserveSelection ? boardSelect.value : null;
    console.log('🔄 Populating board selector, preserve:', preserveSelection, 'current:', currentSelection);

    // Clear existing options except the first one
    boardSelect.innerHTML = '<option value="">-- Chọn board --</option>';

    // Add boards to selector
    boards.forEach(board => {
      const option = document.createElement('option');
      option.value = board.id;
      
      // Add owner info to board name
      if (this.currentUser) {
        if (board.owner_id === this.currentUser.id) {
          option.textContent = `${board.name} (Yours)`;
        } else if (board.owner_name) {
          option.textContent = `${board.name} (${board.owner_name})`;
        } else {
          option.textContent = board.name;
        }
      } else {
        option.textContent = board.name;
      }
      
      boardSelect.appendChild(option);
    });

    // Restore selection based on priority:
    // 1. Preserved selection (if explicitly requested)
    // 2. Current board ID (from app state or localStorage)
    // 3. First board as fallback
    if (preserveSelection && currentSelection) {
      boardSelect.value = currentSelection;
      console.log('✅ Restored preserved selection:', currentSelection);
    } else if (this.currentBoardId) {
      boardSelect.value = this.currentBoardId;
      console.log('✅ Restored current board from state:', this.currentBoardId);
    } else if (boards.length > 0) {
      boardSelect.value = boards[0].id;
      console.log('🎯 Auto-selected first board:', boards[0].id);
    }
  }

  updateBoardNameInSelector(boardId, newName, ownerId = null, ownerName = null) {
    const boardSelect = document.getElementById('boardSelect');
    if (!boardSelect) return;

    // Find and update the option
    const option = boardSelect.querySelector(`option[value="${boardId}"]`);
    if (option) {
      // Add owner info if available
      if (this.currentUser) {
        if (ownerId === this.currentUser.id) {
          option.textContent = `${newName} (Yours)`;
        } else if (ownerName) {
          option.textContent = `${newName} (${ownerName})`;
        } else {
          option.textContent = newName;
        }
      } else {
        option.textContent = newName;
      }
      console.log(`✅ Updated board name in selector: ${boardId} -> "${option.textContent}"`);
    }
  }

  addBoardToSelector(board) {
    const boardSelect = document.getElementById('boardSelect');
    if (!boardSelect) return;

    // Add new board option
    const option = document.createElement('option');
    option.value = board.id;
    
    // Add owner info
    if (this.currentUser) {
      if (board.owner_id === this.currentUser.id) {
        option.textContent = `${board.name} (Yours)`;
      } else if (board.owner_name) {
        option.textContent = `${board.name} (${board.owner_name})`;
      } else {
        option.textContent = board.name;
      }
    } else {
      option.textContent = board.name;
    }
    
    boardSelect.appendChild(option);
    
    // Select the new board
    boardSelect.value = board.id;
    console.log(`✅ Added new board to selector: ${board.id} -> "${option.textContent}"`);
  }

  showEmptyState() {
    console.log('📭 Showing empty state (no boards)');
    const emptyElement = document.getElementById('emptyState');
    const kanbanBoard = document.getElementById('kanbanBoard');
    const boardControls = document.querySelector('.board-controls');
    
    if (emptyElement) {
      emptyElement.classList.remove('hidden');
    }
    if (kanbanBoard) {
      kanbanBoard.classList.add('hidden');
    }
    // Hide board selector when no boards
    if (boardControls) {
      const boardSelector = boardControls.querySelector('.board-selector');
      if (boardSelector) {
        boardSelector.style.display = 'none';
      }
    }
  }

  hideEmptyState() {
    console.log('📋 Hiding empty state (boards exist)');
    const emptyElement = document.getElementById('emptyState');
    const boardControls = document.querySelector('.board-controls');
    
    if (emptyElement) {
      emptyElement.classList.add('hidden');
    }
    // Show board selector when boards exist
    if (boardControls) {
      const boardSelector = boardControls.querySelector('.board-selector');
      if (boardSelector) {
        boardSelector.style.display = 'flex';
      }
    }
  }

  showKanbanBoard() {
    console.log('📊 Showing kanban board');
    const kanbanBoard = document.getElementById('kanbanBoard');
    if (kanbanBoard) {
      kanbanBoard.classList.remove('hidden');
    }
  }

  hideKanbanBoard() {
    console.log('🙈 Hiding kanban board');
    const kanbanBoard = document.getElementById('kanbanBoard');
    if (kanbanBoard) {
      kanbanBoard.classList.add('hidden');
    }
  }
}

// Global functions for onclick handlers
function addNewTask(status) {
  if (window.app) {
    window.app.showNewTaskModal(status);
  }
}

function createNewBoard() {
  if (window.app) {
    window.app.showNewBoardModal();
  }
}

function closeTaskModal() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function closeBoardModal() {
  const modal = document.getElementById('boardModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Expose functions to global scope for onclick handlers
window.createNewBoard = createNewBoard;
window.closeTaskModal = closeTaskModal;
window.closeBoardModal = closeBoardModal;
window.closeProfileModal = closeProfileModal;

// Initialize app when DOM and config are ready
let configReady = false;
let domReady = false;

function tryInitializeApp() {
  console.log('🚀 Checking initialization conditions...', { configReady, domReady });
  
  if (!configReady || !domReady) {
    console.log('⏳ Waiting for config and DOM...');
    return;
  }
  
  // Both config and DOM are ready
  try {
    if (window.store && window.actions && window.actions.loadBoards) {
      console.log('✅ Config loaded, store ready, creating app...');
      console.log('🔧 API Config:', { API_URL: window.ENV?.API_URL });
      window.app = new KanbanApp();
    } else {
      console.log('❌ Store not ready, retrying in 100ms...');
      setTimeout(tryInitializeApp, 100);
    }
  } catch (error) {
    console.error('❌ Error initializing app:', error);
  }
}

// Wait for config loaded
window.addEventListener('configLoaded', () => {
  console.log('✅ Config loaded event received');
  configReady = true;
  tryInitializeApp();
});

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    domReady = true;
    tryInitializeApp();
  });
} else {
  console.log('✅ DOM already loaded');
  domReady = true;
  // Config might already be loaded too
  if (window.ENV && window.ENV.API_URL) {
    console.log('✅ Config already loaded');
    configReady = true;
  }
  tryInitializeApp();
}
