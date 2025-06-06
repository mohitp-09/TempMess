import { create } from "zustand";

const useAuthStore = create((set) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  login: () => set({ isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('token');
    set({ isAuthenticated: false });
  },
}));

export { useAuthStore }
