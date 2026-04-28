import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.role === 'super_admin';
  },

  isManager: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return ['super_admin', 'branch_manager'].includes(user?.role);
  },
}));

export default useAuthStore;
