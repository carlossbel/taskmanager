// src/services/taskService.js
import api from './interceptors';

const TaskService = {
  // Get user tasks
  getUserTasks: async (userId) => {
    try {
      const response = await api.get(`/tasks/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },

  // Create personal task
  createPersonalTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Create group task
  createGroupTask: async (taskData) => {
    const response = await api.post('/tasks/group', taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    const response = await api.put(`/tasks/${taskId}`, { status });
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
  
  // Get all tasks (admin only)
  getAllTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  }
};

export default TaskService;