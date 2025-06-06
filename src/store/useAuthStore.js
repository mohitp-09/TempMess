import { create } from "zustand";
import { getCurrentUserFromToken, isTokenExpired } from "../lib/jwtUtils";

const useAuthStore = create((set, get) => ({
  isAuthenticated: (() => {
    const token = localStorage.getItem('token');
    return token && !isTokenExpired(token);
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
    }
    return null;
  }
}));

export { useAuthStore }