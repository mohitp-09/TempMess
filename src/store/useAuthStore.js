import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  
  login: (userData) => {
    set({ 
      isAuthenticated: true,
      user: userData 
    });
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
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
    localStorage.setItem('user', JSON.stringify(userData));
  }
}));

export { useAuthStore }