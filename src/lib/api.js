import axios from 'axios';

// Configure axios with base URL
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add request interceptor to include auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password
    });
    
    // Store user data including username
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', {
      username: userData.fullName,
      email: userData.email,
      password: userData.password
    });
    
    // Store user data including username
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// Get current user info
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me'); // You'll need this endpoint in your backend
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get current user');
  }
};

// User search
export const searchUser = async (searchTerm) => {
  try {
    const params = {};
    if (searchTerm.includes('@')) {
      params.email = searchTerm;
    } else {
      params.username = searchTerm;
    }
    
    const response = await api.get('/users/search', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'User search failed');
  }
};

// Friend requests - Using direct URL without /api prefix to match your backend
export const sendFriendRequest = async (senderUsername, receiverUsername) => {
  try {
    console.log('Sending friend request:', { senderUsername, receiverUsername });
    
    const response = await axios.post('http://localhost:8080/friends/request', null, {
      params: { 
        senderUsername: senderUsername, 
        receiverUsername: receiverUsername 
      },
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Friend request error:', error.response?.data || error.message);
    console.error('Full error:', error);
    throw new Error(error.response?.data || 'Failed to send friend request');
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await axios.post('http://localhost:8080/friends/accept', null, {
      params: { requestId },
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Accept friend request error:', error.response?.data);
    throw new Error(error.response?.data || 'Failed to accept friend request');
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await axios.post('http://localhost:8080/friends/reject', null, {
      params: { requestId },
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Reject friend request error:', error.response?.data);
    throw new Error(error.response?.data || 'Failed to reject friend request');
  }
};

// Notifications
export const getUnreadNotifications = async () => {
  try {
    const response = await api.get('/notifications/unread');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/notifications/read/${notificationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
  }
};

export default api;