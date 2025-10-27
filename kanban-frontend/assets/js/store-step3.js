import { todoReducer } from './store-step2.js';

// Bước 3: Store class - quản lý state tập trung
class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState;
    this.listeners = [];
    
    console.log('🏪 Store được khởi tạo với state:', this.state);
  }

  // Lấy state hiện tại
  getState() {
    return this.state;
  }

  // Dispatch action để cập nhật state
  dispatch(action) {
    console.log('📤 Dispatch action:', action.type);
    
    const prevState = this.state;
    this.state = this.reducer(this.state, action);
    
    console.log('📊 State cũ:', prevState);
    console.log('📊 State mới:', this.state);
    
    // Notify tất cả listeners
    this.listeners.forEach(listener => {
      listener(this.state, prevState);
    });
  }

  // Đăng ký listener để lắng nghe thay đổi state
  subscribe(listener) {
    console.log('👂 Đăng ký listener mới');
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      console.log('👋 Hủy đăng ký listener');
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

console.log('✅ Bước 3: Store class đã được tạo');
export { Store };

