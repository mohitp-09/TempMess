import axios from 'axios';
import { isTokenExpired } from './jwtUtils';

// Configure axios with base URL
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Add request interceptor to include auth token and check expiration
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Check if token is expired before making request
      if (isTokenExpired(token)) {
        console.warn('Token expired, removing from storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error('Token expired'));
      }
      
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
      console.warn('Unauthorized request, clearing all auth data');
      
      // Clear all possible auth-related localStorage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authUser');
      
      // Clear any other auth-related items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
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

// Get user by ID - NEW FUNCTION
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user by ID:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch user details');
  }
};

// Friend requests - Create a separate axios instance for friend requests to handle the different base URL
const friendsApi = axios.create({
  baseURL: 'http://localhost:8080', // No /api prefix for friends endpoints
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth interceptor for friends API
friendsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const sendFriendRequest = async (senderUsername, receiverUsername) => {
  try {
    console.log('Sending friend request:', { senderUsername, receiverUsername });
    
    const response = await friendsApi.post('/friends/request', null, {
      params: { 
        senderUsername: senderUsername, 
        receiverUsername: receiverUsername 
      }
    });
    
    console.log('Friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Friend request error:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Handle CORS and network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Unable to connect to server. Please check if the backend is running and CORS is properly configured.');
    }
    
    // Handle specific error cases
    const errorMessage = error.response?.data || error.message;
    
    // Check for common "already exists" error patterns
    if (typeof errorMessage === 'string') {
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      if (lowerErrorMessage.includes('already') || 
          lowerErrorMessage.includes('exists') || 
          lowerErrorMessage.includes('pending') ||
          lowerErrorMessage.includes('duplicate')) {
        throw new Error('FRIEND_REQUEST_EXISTS');
      }
      
      if (lowerErrorMessage.includes('not found') || 
          lowerErrorMessage.includes('user not found')) {
        throw new Error('USER_NOT_FOUND');
      }
      
      if (lowerErrorMessage.includes('already friends') || 
          lowerErrorMessage.includes('friendship exists')) {
        throw new Error('ALREADY_FRIENDS');
      }
    }
    
    // Default error
    throw new Error(errorMessage || 'Failed to send friend request');
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    console.log('Accepting friend request with ID:', requestId);
    
    const response = await friendsApi.post('/friends/accept', null, {
      params: { requestId }
    });
    
    console.log('Accept friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Accept friend request error:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Handle CORS and network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    
    // Handle specific error messages
    const errorMessage = error.response?.data?.message || error.response?.data || error.message;
    throw new Error(errorMessage || 'Failed to accept friend request');
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    console.log('Rejecting friend request with ID:', requestId);
    
    const response = await friendsApi.post('/friends/reject', null, {
      params: { requestId }
    });
    
    console.log('Reject friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reject friend request error:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Handle CORS and network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    
    // Handle specific error messages
    const errorMessage = error.response?.data?.message || error.response?.data || error.message;
    throw new Error(errorMessage || 'Failed to reject friend request');
  }
};

// Notifications - Only fetch from backend, no mock data
export const getUnreadNotifications = async () => {
  try {
    console.log('Fetching notifications from backend...');
    const response = await api.get('/notifications/unread');
    console.log('Notifications response:', response.data);
    
    // Handle different response formats from backend
    let notifications = response.data;
    
    // If response.data is an object with a notifications array
    if (notifications && typeof notifications === 'object' && notifications.notifications) {
      notifications = notifications.notifications;
    }
    
    // If response.data is an object with a data array
    if (notifications && typeof notifications === 'object' && notifications.data) {
      notifications = notifications.data;
    }
    
    // Ensure we return an array
    if (!Array.isArray(notifications)) {
      console.warn('Notifications response is not an array:', notifications);
      return [];
    }
    
    return notifications;
  } catch (error) {
    console.error('Failed to fetch notifications:', error.response?.data || error.message);
    
    // Return empty array if API fails - no mock data
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.post(`/notifications/read/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to mark notification as read:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
  }
};

export default api;