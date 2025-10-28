# Configuration Guide - config.json

## 📁 Cấu trúc

```
kanban-frontend/
├── config.json                  ← File cấu hình chính
└── assets/
    └── js/
        ├── config-loader.js     ← Auto-load config (async)
        └── api.js               ← Sử dụng window.ENV
```

## 🚀 Cách sử dụng

### 1. Edit file `config.json`

```json
{
  "development": {
    "API_URL": "http://localhost:8000",
    "API_TIMEOUT": 10000,
    "DEBUG": true
  },
  "production": {
    "API_URL": "https://kanban-todo-project.onrender.com",
    "API_TIMEOUT": 10000,
    "DEBUG": false
  }
}
```

### 2. Refresh browser (F5)

**Xong!** Không cần build hay compile.

## 🔄 Auto-detection

Hệ thống tự động chọn config dựa trên hostname:

| Hostname | Environment | Config sử dụng |
|----------|-------------|----------------|
| `localhost` hoặc `127.0.0.1` | Development | `"development"` |
| Tất cả domains khác | Production | `"production"` |

## 📝 Config Options

| Key | Type | Mô tả | Example |
|-----|------|-------|---------|
| `API_URL` | string | Backend API URL | `"http://localhost:8000"` |
| `API_TIMEOUT` | number | Request timeout (ms) | `10000` |
| `DEBUG` | boolean | Bật debug logs | `true` / `false` |

## 🔍 Kiểm tra config

Mở Browser Console (F12):

```javascript
// Xem API URL hiện tại
console.log('API URL:', window.ENV.API_URL);

// Xem environment
console.log('Environment:', window.ENV.ENVIRONMENT);

// Xem toàn bộ config
console.log('Full config:', window.ENV);

// Check if development
console.log('Is Dev?', window.ENV.isDevelopment());
```

## ⚙️ Workflow

### Development (Local)

```bash
# 1. Start backend
cd ../kanban-todo-api
uvicorn main:app --reload

# 2. Open frontend
# http://localhost:5500
# → Auto sử dụng config.development
# → API: http://localhost:8000
```

### Production

```bash
# 1. Update API URL trong config.json nếu cần
# 2. Deploy frontend
# → Auto sử dụng config.production
# → API: https://kanban-todo-project.onrender.com
```

## 🎯 Override API URL (Testing)

Trong browser console (F12):

```javascript
// Set custom API URL
window.ENV.setApiUrl('https://test-api.com');

// Reload page
window.location.reload();
```

## 🔧 Cách hoạt động

### 1. **config-loader.js loads first**
```javascript
// Async fetch config.json
const config = await fetch('./config.json');

// Auto-detect environment
const env = hostname === 'localhost' ? 'development' : 'production';

// Export to window.ENV
window.ENV = config[env];
```

### 2. **api.js uses window.ENV**
```javascript
// Dynamic config - always fresh
function getAPIConfig() {
    return {
        baseURL: window.ENV?.API_URL || 'fallback-url',
        timeout: window.ENV?.API_TIMEOUT || 10000,
    };
}
```

### 3. **Config update event**
```javascript
// Listen for config loaded
window.addEventListener('configLoaded', () => {
    console.log('Config ready!', window.ENV);
});
```

## ✅ Files cần load (thứ tự quan trọng)

Trong HTML files (`index.html`, `login.html`, etc.):

```html
<!-- 1. Load config FIRST -->
<script src="assets/js/config-loader.js"></script>

<!-- 2. Load other scripts -->
<script src="assets/js/api.js"></script>
<script src="assets/js/auth.js"></script>
<!-- ... more scripts ... -->
```

## 🐛 Troubleshooting

### Lỗi: "Failed to load config.json"

**Nguyên nhân:** File không tồn tại hoặc path sai

**Giải pháp:**
1. Kiểm tra `config.json` có trong thư mục root của frontend
2. Check browser Network tab (F12) xem request đến đâu
3. Fallback config sẽ tự động được dùng (production)

### Lỗi: API calls fail 404

**Kiểm tra:**
```javascript
console.log('Current API URL:', window.ENV?.API_URL);
```

**Giải pháp:**
1. Verify `config.json` có đúng API URL
2. Check environment detection đúng chưa
3. Hard refresh (Ctrl+F5)

### Config không update sau khi edit

**Giải pháp:**
1. Hard refresh: `Ctrl+F5` (Windows) hoặc `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Check JSON syntax (dùng [JSONLint](https://jsonlint.com))

## 🔒 Security

⚠️ **QUAN TRỌNG:** File `config.json` là **PUBLIC**

### ❌ KHÔNG BAO GIỜ chứa:
- API keys
- Passwords  
- Secrets
- Private tokens
- Sensitive data

### ✅ CHỈ chứa:
- Public API URLs
- Timeout settings
- Feature flags
- Public configuration

## 📝 Example: Đổi API URL

### Scenario: Backend chuyển sang Vercel

**Edit `config.json`:**
```json
{
  "production": {
    "API_URL": "https://my-api.vercel.app",
    "API_TIMEOUT": 10000,
    "DEBUG": false
  }
}
```

**Commit & Deploy:**
```bash
git add config.json
git commit -m "Update production API to Vercel"
git push
```

**Done!** 🎉

## 💡 Best Practices

1. ✅ **Always test both environments**
   - Local (localhost) with local backend
   - Production URL with deployed backend

2. ✅ **Keep config simple**
   - Only add necessary settings
   - Use clear, descriptive names

3. ✅ **Document changes**
   - Update this README when adding new config options
   - Comment complex settings

4. ✅ **Version control**
   - Commit `config.json` to git
   - Track API URL changes in commits

5. ✅ **Use semantic URLs**
   ```json
   "API_URL": "https://api.myapp.com/v1"
   ```

## 🎓 Advanced: Multiple Environments

Nếu cần thêm environments (staging, testing, etc.):

```json
{
  "development": { ... },
  "staging": {
    "API_URL": "https://staging-api.myapp.com",
    "API_TIMEOUT": 10000,
    "DEBUG": true
  },
  "production": { ... }
}
```

Update `config-loader.js` để detect staging domain.

---

**Simple, Clean, Effective!** 🚀

**Last updated:** October 2025

