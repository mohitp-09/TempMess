import { create } from "zustand";
import { getCurrentUserFromToken, isTokenExpired } from "../lib/jwtUtils";

const useAuthStore = create((set, get) => ({
  isAuthenticated: (() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clean up expired token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    
    return true;
  })(),
  
  user: (() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      return getCurrentUserFromToken();
    }
    return null;
  })(),
  
  login: (userData) => {
    // If userData contains a token, decode it to get user info
    let userInfo = userData;
    if (userData.token) {
      const decodedUser = getCurrentUserFromToken();
      userInfo = { ...userData, ...decodedUser };
    }
    
    set({ 
      isAuthenticated: true,
      user: userInfo 
    });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ 
      isAuthenticated: false,
      user: null 
    });
  },
  
  updateUser: (userData) => {
    set({ user: userData });
  },
  
  // Method to refresh user data from token
  refreshUserFromToken: () => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      const userInfo = getCurrentUserFromToken();
      set({ user: userInfo });
      return userInfo;
    } else {
      // Token expired, logout user
      get().logout();
      return null;
    }
  },
  
  // Check if current session is valid
  checkAuthStatus: () => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      get().logout();
      return false;
    }
    return true;
  }
}));

export { useAuthStore }