// Authentication Manager
class AuthManager {
    constructor() {
        this.initializeAuth();
    }

    initializeAuth() {
        // Check if we're on login/register page
        const isAuthPage = window.location.pathname.includes('login.html') || 
                          window.location.pathname.includes('register.html');

        if (isAuthPage) {
            this.initializeAuthPage();
        } else {
            this.checkAuthentication();
        }
    }

    initializeAuthPage() {
        // If already logged in, redirect to dashboard
        if (this.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupAuthForms();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('loginError');
        const loadingElement = document.getElementById('loginLoading');
        const submitButton = document.getElementById('loginBtn');

        // Reset error state
        hideError(errorElement);
        
        // Validation
        if (!username || !password) {
            showError(errorElement, 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            // Show loading state
            showLoading(loadingElement);
            submitButton.disabled = true;
            submitButton.textContent = 'Đang đăng nhập...';

            // Call login API
            const response = await api.login(username, password);
            
            // Store token and user info
            api.setToken(response.access_token);
            localStorage.setItem('user_info', JSON.stringify(response.user));
            
            // Redirect to dashboard
            window.location.href = 'index.html';
            
        } catch (error) {
            const message = handleAPIError(error, 'Đăng nhập thất bại');
            showError(errorElement, message);
        } finally {
            // Reset loading state
            hideLoading(loadingElement);
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng nhập';
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            full_name: document.getElementById('fullName').value.trim(),
            password: document.getElementById('password').value,
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('registerError');
        const successElement = document.getElementById('registerSuccess');
        const loadingElement = document.getElementById('registerLoading');
        const submitButton = document.getElementById('registerBtn');

        // Reset states
        hideError(errorElement);
        if (successElement) successElement.classList.add('hidden');

        // Validation
        if (!formData.username || !formData.password) {
            showError(errorElement, 'Username và password là bắt buộc');
            return;
        }

        if (formData.password !== confirmPassword) {
            showError(errorElement, 'Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            showError(errorElement, 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            // Show loading state
            showLoading(loadingElement);
            submitButton.disabled = true;
            submitButton.textContent = 'Đang đăng ký...';

            // Call register API
            await api.register(formData);
            
            // Show success message
            if (successElement) {
                successElement.textContent = 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...';
                successElement.classList.remove('hidden');
            }
            
            // Redirect to login after delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            const message = handleAPIError(error, 'Đăng ký thất bại');
            showError(errorElement, message);
        } finally {
            // Reset loading state
            hideLoading(loadingElement);
            submitButton.disabled = false;
            submitButton.textContent = 'Đăng ký';
        }
    }

    checkAuthentication() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }
        
        this.setupLogout();
        this.displayUserInfo();
    }

    isLoggedIn() {
        return !!api.getToken();
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    handleLogout() {
        // Clear authentication data
        api.removeToken();
        localStorage.removeItem('user_info');
        
        // Redirect to login
        window.location.href = 'login.html';
    }

    async displayUserInfo() {
        const userDisplayElement = document.getElementById('currentUser');
        if (!userDisplayElement) return;

        try {
            // Try to get fresh user info from API
            const userInfo = await api.getCurrentUser();
            userDisplayElement.textContent = userInfo.full_name || userInfo.username;
            
            // Update stored user info
            localStorage.setItem('user_info', JSON.stringify(userInfo));
        } catch (error) {
            // Fall back to stored user info
            const storedUserInfo = localStorage.getItem('user_info');
            if (storedUserInfo) {
                const userInfo = JSON.parse(storedUserInfo);
                userDisplayElement.textContent = userInfo.full_name || userInfo.username;
            } else {
                // If no stored info and API fails, logout
                this.handleLogout();
            }
        }
    }

    getCurrentUser() {
        const storedUserInfo = localStorage.getItem('user_info');
        return storedUserInfo ? JSON.parse(storedUserInfo) : null;
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
