import { ActionTypes } from './store-step1.js';

// Bước 4: Action Creators helper functions
export const actions = {
  loadTasks: (tasks) => ({
    type: ActionTypes.LOAD_TASKS,
    payload: tasks
  }),
  addTask: (task) => ({
    type: ActionTypes.ADD_TASK,
    payload: task
  }),
  updateTask: (id, updates) => ({
    type: ActionTypes.UPDATE_TASK,
    payload: { id, updates }
  }),
  deleteTask: (id) => ({
    type: ActionTypes.DELETE_TASK,
    payload: id
  }),
  setFilter: (filter) => ({
    type: ActionTypes.SET_FILTER,
    payload: filter
  }),
  setLoading: (loading) => ({
    type: ActionTypes.SET_LOADING,
    payload: loading
  }),
  setError: (error) => ({
    type: ActionTypes.SET_ERROR,
    payload: error
  })
};

console.log('✅ Step 4: Action creators defined');

