// User Management Page - Admin Only

class UserManagement {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.selectedUserId = null;
        this.init();
    }

    async init() {
        console.log('🔐 Initializing User Management...');

        // Check authentication and authorization
        if (!await this.checkAdminAccess()) {
            console.log('❌ Access denied - not an admin');
            this.showAccessDenied();
            return;
        }

        console.log('✅ Admin access granted');
        this.showContent();
        await this.loadCurrentAdmin();
        await this.loadUsers();
        this.setupEventListeners();
    }

    async checkAdminAccess() {
        const token = api.getToken();
        if (!token) {
            console.log('❌ No token found');
            window.location.href = 'login.html';
            return false;
        }

        try {
            console.log('🔍 Fetching current user...');
            const user = await api.getCurrentUser();
            console.log('👤 Current user:', user);
            console.log('👤 User role:', user.role);
            
            this.currentUser = user;
            
            if (user.role !== 'admin') {
                console.log('❌ User is not admin, role:', user.role);
                return false;
            }
            
            console.log('✅ User is admin');
            return true;
        } catch (error) {
            console.error('❌ Error checking admin access:', error);
            window.location.href = 'login.html';
            return false;
        }
    }

    showAccessDenied() {
        document.getElementById('accessDenied').classList.remove('hidden');
        document.getElementById('usersContent').classList.add('hidden');
    }

    showContent() {
        document.getElementById('accessDenied').classList.add('hidden');
        document.getElementById('usersContent').classList.remove('hidden');
    }

    async loadCurrentAdmin() {
        const adminElement = document.getElementById('currentAdmin');
        if (adminElement && this.currentUser) {
            adminElement.textContent = this.currentUser.full_name || this.currentUser.username;
        }
    }

    async loadUsers() {
        try {
            console.log('👥 Loading users...');
            this.showLoading();

            this.users = await api.getUsers();
            
            // Sort users by ID (ascending) to maintain consistent order
            this.users.sort((a, b) => a.id - b.id);
            
            console.log('✅ Users loaded and sorted by ID:', this.users.length);

            this.renderUsers();
            this.hideLoading();
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.hideLoading();
            alert('Failed to load users: ' + error.message);
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        const tableContainer = document.getElementById('usersTableContainer');
        const emptyState = document.getElementById('emptyState');

        if (!this.users || this.users.length === 0) {
            tableContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        tableContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        tbody.innerHTML = '';

        // Users are already sorted by ID in loadUsers()
        // This ensures consistent display order
        this.users.forEach(user => {
            const row = document.createElement('tr');
            
            // Role badge
            const roleBadge = `<span class="role-badge role-${user.role}">${user.role.toUpperCase()}</span>`;
            
            // Status badge
            const statusBadge = user.is_active 
                ? '<span class="status-badge status-active">Active</span>'
                : '<span class="status-badge status-inactive">Inactive</span>';
            
            // Format date
            const createdDate = new Date(user.created_at).toLocaleDateString('vi-VN');
            
            // Can't edit/delete yourself
            const isSelf = user.id === this.currentUser.id;
            const actions = isSelf 
                ? '<span style="color: #95a5a6; font-size: 12px;">Current User</span>'
                : `
                    <div class="user-actions">
                        <button class="btn-icon btn-edit" onclick="userManagement.editUser(${user.id})">✏️ Edit</button>
                        <button class="btn-icon btn-delete" onclick="userManagement.confirmDelete(${user.id})">🗑️</button>
                    </div>
                `;

            row.innerHTML = `
                <td><strong>#${user.id}</strong></td>
                <td>${user.username}</td>
                <td>${user.full_name || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${createdDate}</td>
                <td>${actions}</td>
            `;

            tbody.appendChild(row);
        });
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found');
            return;
        }

        console.log('✏️ Editing user:', user);

        // Populate modal
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editFullName').value = user.full_name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editRole').value = user.role;
        document.getElementById('editIsActive').checked = user.is_active;

        // Clear messages
        this.hideMessage('editError');
        this.hideMessage('editSuccess');

        // Show modal
        document.getElementById('editUserModal').classList.remove('hidden');
    }

    async handleEditSubmit(event) {
        event.preventDefault();
        
        const userId = parseInt(document.getElementById('editUserId').value);
        const isActiveCheckbox = document.getElementById('editIsActive');
        const updateData = {
            full_name: document.getElementById('editFullName').value.trim() || null,
            email: document.getElementById('editEmail').value.trim() || null,
            role: document.getElementById('editRole').value,
            is_active: isActiveCheckbox.checked
        };

        console.log('═══════════════════════════════════════');
        console.log('👤 USER UPDATE DEBUG');
        console.log('═══════════════════════════════════════');
        console.log('User ID:', userId);
        console.log('Update Data:', updateData);
        console.log('is_active checkbox checked:', isActiveCheckbox.checked);
        console.log('is_active value to send:', updateData.is_active);
        console.log('is_active type:', typeof updateData.is_active);
        console.log('═══════════════════════════════════════');

        try {
            const updatedUser = await api.updateUser(userId, updateData);
            console.log('✅ User updated successfully!');
            console.log('Updated user is_active:', updatedUser.is_active);

            this.showMessage('editSuccess', 'User updated successfully!');
            
            // Reload users after short delay
            setTimeout(async () => {
                await this.loadUsers();
                this.closeEditModal();
            }, 1500);

        } catch (error) {
            console.error('❌ Error updating user:', error);
            this.showMessage('editError', error.message || 'Failed to update user');
        }
    }

    confirmDelete(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            alert('User not found');
            return;
        }

        this.selectedUserId = userId;
        
        const message = `Are you sure you want to delete user "${user.username}"?`;
        document.getElementById('deleteMessage').textContent = message;
        document.getElementById('confirmDeleteModal').classList.remove('hidden');
    }

    async handleDelete() {
        if (!this.selectedUserId) return;

        console.log('🗑️ Deleting user:', this.selectedUserId);

        try {
            await api.deleteUser(this.selectedUserId);
            console.log('✅ User deleted successfully');

            this.closeDeleteModal();
            await this.loadUsers();

        } catch (error) {
            console.error('❌ Error deleting user:', error);
            alert('Failed to delete user: ' + error.message);
        }
    }

    showCreateModal() {
        // Reset form
        document.getElementById('createUserForm').reset();
        document.getElementById('createIsActive').checked = true;
        
        // Clear messages
        this.hideMessage('createError');
        this.hideMessage('createSuccess');
        
        // Show modal
        document.getElementById('createUserModal').classList.remove('hidden');
    }

    async handleCreateSubmit(event) {
        event.preventDefault();
        
        const isActiveCheckbox = document.getElementById('createIsActive');
        const userData = {
            username: document.getElementById('createUsername').value.trim(),
            password: document.getElementById('createPassword').value,
            full_name: document.getElementById('createFullName').value.trim() || null,
            email: document.getElementById('createEmail').value.trim() || null,
            role: document.getElementById('createRole').value,
            is_active: isActiveCheckbox.checked
        };

        console.log('═══════════════════════════════════════');
        console.log('➕ USER CREATE DEBUG');
        console.log('═══════════════════════════════════════');
        console.log('User Data:', { ...userData, password: '***' });
        console.log('is_active checkbox checked:', isActiveCheckbox.checked);
        console.log('is_active value to send:', userData.is_active);
        console.log('═══════════════════════════════════════');

        try {
            const newUser = await api.createUser(userData);
            console.log('✅ User created successfully!');
            console.log('Created user is_active:', newUser.is_active);

            this.showMessage('createSuccess', 'User created successfully!');
            
            // Reload users after short delay
            setTimeout(async () => {
                await this.loadUsers();
                this.closeCreateModal();
            }, 1500);

        } catch (error) {
            console.error('❌ Error creating user:', error);
            let errorMsg = error.message || 'Failed to create user';
            
            // Parse specific error messages
            if (errorMsg.includes('already exists') || errorMsg.includes('đã tồn tại')) {
                errorMsg = 'Username or email already exists!';
            }
            
            this.showMessage('createError', errorMsg);
        }
    }

    setupEventListeners() {
        // Back to main button
        const backBtn = document.getElementById('backToMainBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                api.removeToken();
                localStorage.removeItem('user_info');
                window.location.href = 'login.html';
            });
        }

        // Create User button
        const createUserBtn = document.getElementById('createUserBtn');
        if (createUserBtn) {
            createUserBtn.addEventListener('click', () => {
                this.showCreateModal();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadUsers();
            });
        }

        // Create form submit
        const createForm = document.getElementById('createUserForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
        }

        // Edit form submit
        const editForm = document.getElementById('editUserForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        // Delete confirm button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Delete cancel button
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }
    }

    closeCreateModal() {
        document.getElementById('createUserModal').classList.add('hidden');
    }

    closeEditModal() {
        document.getElementById('editUserModal').classList.add('hidden');
    }

    closeDeleteModal() {
        document.getElementById('confirmDeleteModal').classList.add('hidden');
        this.selectedUserId = null;
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('usersTableContainer').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showMessage(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    hideMessage(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.classList.add('hidden');
        }
    }
}

// Global functions for onclick handlers
function closeCreateModal() {
    if (window.userManagement) {
        window.userManagement.closeCreateModal();
    }
}

function closeEditModal() {
    if (window.userManagement) {
        window.userManagement.closeEditModal();
    }
}

// Initialize when DOM is ready
// Initialize User Management when DOM and config are loaded
let usersConfigReady = false;
let usersDomReady = false;

function initializeUserManagement() {
    if (!usersConfigReady || !usersDomReady) {
        return;
    }
    console.log('🚀 Config and DOM loaded, initializing User Management...', { API_URL: window.ENV?.API_URL });
    window.userManagement = new UserManagement();
}

// Wait for config
window.addEventListener('configLoaded', () => {
    console.log('✅ Config loaded for users');
    usersConfigReady = true;
    initializeUserManagement();
});

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        usersDomReady = true;
        initializeUserManagement();
    });
} else {
    usersDomReady = true;
    // Check if config already loaded
    if (window.ENV && window.ENV.API_URL) {
        usersConfigReady = true;
    }
    initializeUserManagement();
}

