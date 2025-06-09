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
    
    // Handle OAuth redirect issue
    if (error.response?.status === 302 || 
        (error.response?.data && typeof error.response.data === 'string' && 
         error.response.data.includes('oauth2'))) {
      console.error('❌ Backend is redirecting to OAuth - check authentication');
      throw new Error('Authentication required - please login again');
    }
    
    return Promise.reject(error);
  }
);

// Create a new group - ADJUSTED TO MATCH YOUR CONTROLLER
export const createGroup = async (groupData) => {
  try {
    console.log('📤 Creating group with data:', groupData);
    
    // Match your backend DTO structure
    const response = await groupApi.post('/create', {
      groupName: groupData.name,
      createdBy: groupData.createdBy,
      memberUsernames: groupData.members
    });
    
    console.log('✅ Group created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to create group:', error);
    throw new Error(error.response?.data || 'Failed to create group');
  }
};

// Get user's groups - SIMPLIFIED TO AVOID OAUTH REDIRECT
export const getUserGroups = async () => {
  try {
    console.log('📤 Fetching user groups...');
    
    // For now, return empty array to avoid OAuth redirect
    // You'll need to implement this endpoint properly in your backend
    console.log('⚠️ getUserGroups temporarily disabled to avoid OAuth redirect');
    return [];
    
    // Uncomment when your backend endpoint is fixed:
    // const response = await groupApi.get('/user/groups');
    // return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch user groups:', error);
    return []; // Return empty array if API fails
  }
};

// Get group messages - ADJUSTED TO MATCH YOUR CONTROLLER
export const getGroupMessages = async (groupId) => {
  try {
    console.log('📤 Fetching messages for group:', groupId);
    
    const response = await groupApi.get(`/${groupId}`);
    console.log('✅ Group messages fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch group messages:', error);
    return []; // Return empty array if API fails
  }
};

export default groupApi;