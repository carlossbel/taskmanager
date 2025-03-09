// src/services/groupService.js
import api from './interceptors';

const GroupService = {
  // Get user groups
  getUserGroups: async (userId) => {
    try {
      const response = await api.get(`/groups/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching groups:", error);
      throw error;
    }
  },

  // Create group
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data.group;
  },

  // Update group
  updateGroup: async (groupId, groupData) => {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data.group;
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },

  // Add user to group
  addUserToGroup: async (groupId, userId) => {
    const response = await api.post(`/groups/${groupId}/users`, { userId });
    return response.data.group;
  },

  // Remove user from group
  removeUserFromGroup: async (groupId, userId) => {
    const response = await api.delete(`/groups/${groupId}/users/${userId}`);
    return response.data.group;
  },
  
  // Get all groups (admin only)
  getAllGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  }
};

export default GroupService;