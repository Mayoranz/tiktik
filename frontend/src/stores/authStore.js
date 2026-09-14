import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',
  isOperator: () => get().user?.role === 'operator',
  isBuyer: () => get().user?.role === 'buyer',

  login: async (login, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/login', { login, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.login?.[0] || 'Login gagal';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  // Kirim OTP ke email (untuk register atau lupa password)
  sendOtp: async (email, type = 'register') => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/send-otp', { email, type });
      set({ loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim OTP';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  // Verifikasi OTP
  verifyOtp: async (email, otp, type = 'register') => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/verify-otp', { email, otp, type });
      set({ loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP tidak valid atau sudah kedaluwarsa';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  // Reset password setelah OTP terverifikasi
  resetPassword: async (email, otp, password, password_confirmation) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/reset-password', { email, otp, password, password_confirmation });
      set({ loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mereset password';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchUser: async () => {
    try {
      const { data } = await api.get('/user');
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch (_) {
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
