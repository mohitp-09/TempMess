import axios from 'axios';

// Configure axios for group API calls
const API_BASE_URL = 'http://localhost:8080';

const groupApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include auth token
groupApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
groupApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Group API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Create a new group
export const createGroup = async (groupData) => {
  try {
    const response = await groupApi.post('/create', {
      groupName: groupData.name,
      createdBy: groupData.createdBy,
      memberUsernames: groupData.members
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || 'Failed to create group');
  }
};

// Get user's groups (you'll need to implement this endpoint in backend)
export const getUserGroups = async () => {
  try {
    const response = await groupApi.get('/user/groups');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user groups:', error);
    return []; // Return empty array if API fails
  }
};

// Get group messages (you'll need to implement this endpoint in backend)
export const getGroupMessages = async (groupId) => {
  try {
    const response = await groupApi.get(`/group/${groupId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch group messages:', error);
    return []; // Return empty array if API fails
  }
};

export default groupApi;