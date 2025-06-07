import { create } from "zustand";
import { getCurrentUserFromToken, isTokenExpired } from "../lib/jwtUtils";

const useAuthStore = create((set, get) => ({
  isAuthenticated: (() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
<<<<<<< HEAD

=======
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clean up expired token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
<<<<<<< HEAD

    return true;
  })(),

=======
    
    return true;
  })(),
  
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
  user: (() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      return getCurrentUserFromToken();
    }
    return null;
  })(),
<<<<<<< HEAD

=======
  
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
  login: (userData) => {
    // If userData contains a token, decode it to get user info
    let userInfo = userData;
    if (userData && userData.token) {
      const decodedUser = getCurrentUserFromToken();
      userInfo = { ...userData, ...decodedUser };
    }
<<<<<<< HEAD

    set({
      isAuthenticated: true,
      user: userInfo
    });
  },

  logout: () => {
    console.log('Logging out user...');

=======
    
    set({ 
      isAuthenticated: true,
      user: userInfo 
    });
  },
  
  logout: () => {
    console.log('Logging out user...');
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
<<<<<<< HEAD

=======
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // Clear any other auth-related items that might exist
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        localStorage.removeItem(key);
      }
    });
<<<<<<< HEAD

    console.log('LocalStorage cleared, updating state...');

    // Update state
    set({
      isAuthenticated: false,
      user: null
    });

    console.log('Logout complete');
  },

  updateUser: (userData) => {
    set({ user: userData });
  },

=======
    
    console.log('LocalStorage cleared, updating state...');
    
    // Update state
    set({ 
      isAuthenticated: false,
      user: null 
    });
    
    console.log('Logout complete');
  },
  
  updateUser: (userData) => {
    set({ user: userData });
  },
  
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
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
<<<<<<< HEAD

=======
  
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
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