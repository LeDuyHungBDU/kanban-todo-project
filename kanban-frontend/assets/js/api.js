// API Configuration
// NOTE: Configuration is loaded from config.json via config-loader.js
// Make sure to load config-loader.js before this file in your HTML

// Function to get API config (supports async loading)
function getAPIConfig() {
    return {
        baseURL: window.ENV?.API_URL,
        timeout: window.ENV?.API_TIMEOUT || 10000,
    };
}

// Initial config
const API_CONFIG = getAPIConfig();

// Update config when it's loaded
window.addEventListener('configLoaded', () => {
    const newConfig = getAPIConfig();
    API_CONFIG.baseURL = newConfig.baseURL;
    API_CONFIG.timeout = newConfig.timeout;
    
    if (window.ENV?.DEBUG) {
        console.log('[API] Config updated:', API_CONFIG);
    }
});

// API Helper Functions
class APIClient {
    constructor() {
        // Don't cache baseURL - always get it from API_CONFIG for dynamic updates
    }

    // Get current base URL (always fresh from config)
    getBaseURL() {
        return API_CONFIG.baseURL;
    }

    // Get authentication token from localStorage
    getToken() {
        return localStorage.getItem('access_token');
    }

    // Set authentication token
    setToken(token) {
        localStorage.setItem('access_token', token);
    }

    // Remove authentication token
    removeToken() {
        localStorage.removeItem('access_token');
    }

    // Get headers with authentication
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = `${this.getBaseURL()}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.requireAuth !== false),
            ...options,
        };

        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            // Log response for debugging
            console.log(`API Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(response.status, errorData.detail || response.statusText, errorData);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            console.error('API Request failed:', error);
            throw new APIError(0, 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
        }
    }

    // Authentication APIs
    async login(username, password) {
        return this.request('/auth/login-json', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            requireAuth: false,
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            requireAuth: false,
        });
    }

    async getCurrentUser() {
        const user = await this.request('/users/me');
        console.log('📥 getCurrentUser response:', user);
        return user;
    }

    async updateCurrentUser(userData) {
        return this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // Board APIs
    async getBoards() {
        return this.request('/boards/');
    }

    async getBoard(boardId) {
        return this.request(`/boards/${boardId}`);
    }

    async createBoard(boardData) {
        return this.request('/boards/', {
            method: 'POST',
            body: JSON.stringify(boardData),
        });
    }

    async updateBoard(boardId, boardData) {
        return this.request(`/boards/${boardId}`, {
            method: 'PUT',
            body: JSON.stringify(boardData),
        });
    }

    async deleteBoard(boardId) {
        return this.request(`/boards/${boardId}`, {
            method: 'DELETE',
        });
    }

    // Task APIs
    async getTasks(boardId, filters = {}) {
        const params = new URLSearchParams({ board_id: boardId, ...filters });
        return this.request(`/tasks/?${params}`);
    }

    async getTask(taskId) {
        return this.request(`/tasks/${taskId}`);
    }

    async createTask(taskData) {
        console.log('🔄 API: Creating task with data:', taskData);
        const result = await this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
        console.log('✅ API: Task created successfully:', result);
        return result;
    }

    async updateTask(taskId, taskData) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
    }

    async moveTask(taskId, status, position = null) {
        return this.request(`/tasks/${taskId}/move`, {
            method: 'PATCH',
            body: JSON.stringify({ status, position }),
        });
    }

    async assignTask(taskId, assignedTo) {
        return this.request(`/tasks/${taskId}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ assigned_to: assignedTo }),
        });
    }

    async deleteTask(taskId) {
        return this.request(`/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }

    // User APIs
    async getUsers() {
        return this.request('/users/');
    }

    async getUser(userId) {
        return this.request(`/users/${userId}`);
    }

    async createUser(userData) {
        // Use register endpoint but from admin context
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            requireAuth: true, // Admin creating user
        });
    }

    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, {
            method: 'DELETE',
        });
    }
}

// Custom Error Class
class APIError extends Error {
    constructor(status, message, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Global API instance
const api = new APIClient();

// Make APIError globally available
window.APIError = APIError;

// Utility Functions
function handleAPIError(error, fallbackMessage = 'Đã xảy ra lỗi') {
    console.error('API Error:', error);

    if (error instanceof APIError) {
        if (error.status === 401) {
            // Check if we're already on login page
            const isLoginPage = window.location.pathname.includes('login.html');
            
            if (isLoginPage) {
                // We're on login page, this is a login failure
                // Return error message instead of redirecting
                return error.message || 'Tên đăng nhập hoặc mật khẩu không đúng';
            } else {
                // We're on another page, token expired - redirect to login
                localStorage.removeItem('access_token');
                window.location.href = 'login.html';
                return 'Phiên đăng nhập đã hết hạn';
            }
        }
        
        if (error.status === 403) {
            // Forbidden - Account locked/inactive
            console.log('🚫 Account is locked or inactive');
            return error.message || 'Tài khoản của bạn đã bị khóa';
        }
        
        return error.message;
    }

    return fallbackMessage;
}

function showError(element, message) {
    if (element) {
        // If no message, hide the element
        if (!message || message.trim() === '') {
            hideError(element);
            return;
        }
        
        // Reset any custom styling
        element.style.backgroundColor = '';
        element.style.color = '';
        element.style.border = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        element.innerHTML = ''; // Clear any HTML content
        
        // Set text message and show
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

function hideError(element) {
    if (element) {
        // Clear content
        element.textContent = '';
        element.innerHTML = '';
        
        // Reset any custom styling
        element.style.backgroundColor = '';
        element.style.color = '';
        element.style.border = '';
        element.style.padding = '';
        element.style.borderRadius = '';
        
        // Hide element
        element.classList.add('hidden');
    }
}

function showLoading(element) {
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.add('hidden');
    }
}
