// Wait for config to be loaded
function waitForConfig() {
    return new Promise((resolve) => {
        if (window.ENV && window.ENV.API_URL) {
            resolve();
        } else {
            window.addEventListener('configLoaded', () => resolve(), { once: true });
        }
    });
}

// API Helper Functions
class APIClient {
    constructor() {
        this.baseURL = null;
        this.timeout = 10000;
        this.init();
    }

    async init() {
        await waitForConfig();
        this.baseURL = window.ENV.API_URL;
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
        // Ensure config is loaded
        await this.init();
        
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.requireAuth !== false),
            ...options,
        };

        try {
            console.log(`API Request: ${config.method || 'GET'} ${url}`);
            console.log(`[DEBUG] Using baseURL: ${this.baseURL}`);
            
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
        return this.request('/users/me');
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
        return this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
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

// Utility Functions
function handleAPIError(error, fallbackMessage = 'Đã xảy ra lỗi') {
    console.error('API Error:', error);
    
    if (error instanceof APIError) {
        if (error.status === 401) {
            // Unauthorized - redirect to login
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            return;
        }
        return error.message;
    }
    
    return fallbackMessage;
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

function hideError(element) {
    if (element) {
        element.textContent = '';
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
