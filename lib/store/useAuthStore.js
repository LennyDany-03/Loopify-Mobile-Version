import { create } from "zustand";
import {
  clearTokens,
  getStoredUser,
  getToken,
  setStoredUser,
  setTokens,
} from "../auth";
import { authAPI, usersAPI } from "../api";

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isReady: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      const token = await getToken();

      if (!token) {
        set({
          user: null,
          isLoggedIn: false,
          isLoading: false,
          isReady: true,
        });
        return;
      }

      const cachedUser = await getStoredUser();
      const profileRes = await usersAPI.getMe();
      const user = profileRes.data ?? cachedUser;

      await setStoredUser(user);
      set({
        user,
        isLoggedIn: true,
        isLoading: false,
        isReady: true,
      });
    } catch {
      await clearTokens();
      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
        isReady: true,
      });
    }
  },

  register: async ({ full_name, email, password }) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authAPI.register({ full_name, email, password });
      const { access_token, refresh_token } = res.data;

      await setTokens(access_token, refresh_token);
      const profileRes = await usersAPI.getMe();
      await setStoredUser(profileRes.data);

      set({
        user: profileRes.data,
        isLoggedIn: true,
        isLoading: false,
        isReady: true,
      });

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed.";
      set({ error: msg, isLoading: false, isReady: true });
      return { success: false, error: msg };
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authAPI.login({ email, password });
      const { access_token, refresh_token } = res.data;

      await setTokens(access_token, refresh_token);
      const profileRes = await usersAPI.getMe();
      await setStoredUser(profileRes.data);

      set({
        user: profileRes.data,
        isLoggedIn: true,
        isLoading: false,
        isReady: true,
      });

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password.";
      set({ error: msg, isLoading: false, isReady: true });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {}

    await clearTokens();
    set({ user: null, isLoggedIn: false, isReady: true, error: null });
  },

  updateUser: async (updatedUser) => {
    await setStoredUser(updatedUser);
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
