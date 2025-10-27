import { ActionTypes } from './store-step1.js';

// Bước 2: Reducer - xử lý cập nhật state
function todoReducer(state, action) {
  console.log('🔄 Reducer nhận:', action.type);
  
  switch (action.type) {
    case ActionTypes.LOAD_TASKS:
      return {
        ...state,
        tasks: action.payload,
        loading: false
      };
      
    case ActionTypes.ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      };
      
    case ActionTypes.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      };
      
    case ActionTypes.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
      
    case ActionTypes.SET_FILTER:
      return {
        ...state,
        filter: action.payload
      };
      
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
      
    default:
      console.warn('⚠️ Action không được xử lý:', action.type);
      return state;
  }
}

console.log('✅ Bước 2: Reducer đã được tạo');
export { todoReducer };

