/**
 * Config Loader - Load configuration from config.json
 * Auto-detect environment and load appropriate config
 */

(async function loadConfig() {
    try {
        // Fetch config.json
        const response = await fetch('./config.json');
        if (!response.ok) {
            throw new Error('Failed to load config.json');
        }
        
        const config = await response.json();
        
        // Auto-detect environment based on hostname
        const hostname = window.location.hostname;
        const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
        const environment = isDevelopment ? 'development' : 'production';
        
        // Get environment-specific config
        const envConfig = config[environment];
        
        if (!envConfig) {
            throw new Error(`Configuration for environment "${environment}" not found in config.json`);
        }
        
        // Export to window.ENV
        window.ENV = {
            ...envConfig,
            ENVIRONMENT: environment,
            
            // Helper functions
            isDevelopment: () => environment === 'development',
            isProduction: () => environment === 'production',
            
            // Override API_URL manually (useful for testing)
            setApiUrl: (url) => {
                window.ENV.API_URL = url;
                console.log(`[CONFIG] API_URL manually set to: ${url}`);
            }
        };
        
        // Log in development mode
        if (window.ENV.DEBUG) {
            console.log('[CONFIG] Environment:', environment);
            console.log('[CONFIG] API_URL:', window.ENV.API_URL);
            console.log('[CONFIG] Full config:', window.ENV);
        }
        
        // Dispatch event when config is loaded
        window.dispatchEvent(new CustomEvent('configLoaded', { detail: window.ENV }));
        
    } catch (error) {
        console.error('[CONFIG] Failed to load configuration:', error);
        
        // Fallback to production config
        window.ENV = {
            API_URL: 'https://kanban-todo-project.onrender.com',
            API_TIMEOUT: 10000,
            DEBUG: false,
            ENVIRONMENT: 'production',
            isDevelopment: () => false,
            isProduction: () => true,
            setApiUrl: (url) => { window.ENV.API_URL = url; }
        };
        
        console.warn('[CONFIG] Using fallback production configuration');
    }
})();
