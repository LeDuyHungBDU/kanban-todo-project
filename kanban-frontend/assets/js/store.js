// =====================================
// STORE.JS - State Management System
// =====================================

console.log('🔄 Store.js is loading...');

try {
// Step 1: Action Types
const ActionTypes = {
  LOAD_TASKS: 'LOAD_TASKS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  LOAD_BOARDS: 'LOAD_BOARDS',
  ADD_BOARD: 'ADD_BOARD',
  UPDATE_BOARD: 'UPDATE_BOARD',
  DELETE_BOARD: 'DELETE_BOARD',
  SET_CURRENT_BOARD: 'SET_CURRENT_BOARD',
  SET_FILTER: 'SET_FILTER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

console.log('✅ ActionTypes created');

// Step 2: Reducer
function todoReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOAD_TASKS:
      return { ...state, tasks: action.payload, loading: false };
    case ActionTypes.ADD_TASK:
      console.log('🔄 Reducer ADD_TASK:', action.payload);
      return { ...state, tasks: [...state.tasks, action.payload] };
    case ActionTypes.UPDATE_TASK:
      console.log('🔄 Reducer UPDATE_TASK:', action.payload);
      const updatedTasks = state.tasks.map(task => {
        // Use loose equality to handle both string and number IDs
        if (task.id == action.payload.id) {
          console.log('✅ Found task to update:', task.id);
          const updated = { ...task, ...action.payload.updates };
          console.log('📝 Updated task:', updated);
          return updated;
        }
        return task;
      });
      console.log('📊 All tasks after update:', updatedTasks);
      
      // Verify the update happened
      const wasUpdated = updatedTasks.some(t => 
        t.id == action.payload.id && 
        JSON.stringify(t) !== JSON.stringify(state.tasks.find(st => st.id == action.payload.id))
      );
      console.log('✅ Task was updated:', wasUpdated);
      
      return {
        ...state,
        tasks: updatedTasks
      };
    case ActionTypes.DELETE_TASK:
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case ActionTypes.LOAD_BOARDS:
      return { ...state, boards: action.payload, loading: false };
    case ActionTypes.ADD_BOARD:
      return { ...state, boards: [...state.boards, action.payload] };
    case ActionTypes.UPDATE_BOARD:
      return {
        ...state,
        boards: state.boards.map(board =>
          board.id === action.payload.id
            ? { ...board, ...action.payload.updates }
            : board
        )
      };
    case ActionTypes.DELETE_BOARD:
      return { 
        ...state, 
        boards: state.boards.filter(b => b.id !== action.payload),
        tasks: state.tasks.filter(t => t.board_id !== action.payload)
      };
    case ActionTypes.SET_CURRENT_BOARD:
      return { ...state, currentBoardId: action.payload };
    case ActionTypes.SET_FILTER:
      return { ...state, filter: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// Step 3: Store Class
class Store {
  constructor(reducer, initialState) {
    this.reducer = reducer;
    this.state = initialState;
    this.listeners = [];
  }
  getState() { return this.state; }
  dispatch(action) {
    const prevState = this.state;
    this.state = this.reducer(this.state, action);
    this.listeners.forEach(listener => listener(this.state, prevState));
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }
}

// Step 4: Initialize Store
const initialState = {
  tasks: [],
  boards: [],
  currentBoardId: null,
  filter: 'all',
  loading: false,
  error: null
};

const store = new Store(todoReducer, initialState);

// Step 5: Action Creators
const actions = {
  loadTasks: (tasks) => ({ type: ActionTypes.LOAD_TASKS, payload: tasks }),
  addTask: (task) => ({ type: ActionTypes.ADD_TASK, payload: task }),
  updateTask: (id, updates) => ({ type: ActionTypes.UPDATE_TASK, payload: { id, updates } }),
  deleteTask: (id) => ({ type: ActionTypes.DELETE_TASK, payload: id }),
  loadBoards: (boards) => ({ type: ActionTypes.LOAD_BOARDS, payload: boards }),
  addBoard: (board) => ({ type: ActionTypes.ADD_BOARD, payload: board }),
  updateBoard: (id, updates) => ({ type: ActionTypes.UPDATE_BOARD, payload: { id, updates } }),
  deleteBoard: (id) => ({ type: ActionTypes.DELETE_BOARD, payload: id }),
  setCurrentBoard: (boardId) => ({ type: ActionTypes.SET_CURRENT_BOARD, payload: boardId }),
  setFilter: (filter) => ({ type: ActionTypes.SET_FILTER, payload: filter }),
  setLoading: (loading) => ({ type: ActionTypes.SET_LOADING, payload: loading }),
  setError: (error) => ({ type: ActionTypes.SET_ERROR, payload: error })
};

console.log('✅ Actions created:', Object.keys(actions));

console.log('✅ Store system đã sẵn sàng!');

// Make store and actions globally available
if (typeof window !== 'undefined') {
  window.store = store;
  window.actions = actions;
  window.ActionTypes = ActionTypes;

  console.log('✅ Store and actions exposed globally:', {
    store: !!window.store,
    actions: !!window.actions,
    loadBoards: !!(window.actions && window.actions.loadBoards)
  });
} else {
  console.log('⚠️ Window not available (Node.js environment)');
}

} catch (error) {
  console.error('❌ Error in store.js:', error);
  console.error('Stack:', error.stack);
}
