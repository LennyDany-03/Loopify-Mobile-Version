import { create } from "zustand";
import {
  clearTokens,
  getStoredUser,
  getToken,
  setStoredUser,
  setTokens,
} from "../auth";
import { signInWithGoogle, signOutFromGoogle } from "../googleAuth";
import { authAPI, usersAPI } from "../api";
import useLoopStore from "./useLoopStore";

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isReady: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });

    let cachedUser = null;

    try {
      const token = await getToken();

      if (!token) {
        useLoopStore.getState().reset();
        set({
          user: null,
          isLoggedIn: false,
          isLoading: false,
          isReady: true,
        });
        return;
      }

      cachedUser = await getStoredUser();
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
      const token = await getToken();

      if (token && cachedUser) {
        set({
          user: cachedUser,
          isLoggedIn: true,
          isLoading: false,
          isReady: true,
          error: null,
        });
        return;
      }

      await clearTokens();
      useLoopStore.getState().reset();
      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
        isReady: true,
      });
    }
  },

  finalizeAuth: async (response) => {
    const { access_token, refresh_token } = response.data;

    useLoopStore.getState().reset();
    await setTokens(access_token, refresh_token);
    const profileRes = await usersAPI.getMe();
    await setStoredUser(profileRes.data);

    set({
      user: profileRes.data,
      isLoggedIn: true,
      isLoading: false,
      isReady: true,
      error: null,
    });

    return { success: true };
  },

  register: async ({ full_name, email, password }) => {
    set({ isLoading: true, error: null });

    try {
      const res = await authAPI.register({ full_name, email, password });
      return await useAuthStore.getState().finalizeAuth(res);
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
      return await useAuthStore.getState().finalizeAuth(res);
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password.";
      set({ error: msg, isLoading: false, isReady: true });
      return { success: false, error: msg };
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });

    const googleResult = await signInWithGoogle();

    if (googleResult.cancelled) {
      set({ isLoading: false, isReady: true });
      return { success: false, cancelled: true };
    }

    if (!googleResult.success) {
      const msg = googleResult.error || "Google sign-in failed.";
      set({ error: msg, isLoading: false, isReady: true });
      return { success: false, error: msg };
    }

    try {
      const res = await authAPI.google({ id_token: googleResult.idToken });
      return await useAuthStore.getState().finalizeAuth(res);
    } catch (err) {
      const msg = err.response?.data?.detail || "Google sign-in failed.";
      set({ error: msg, isLoading: false, isReady: true });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {}

    await signOutFromGoogle();
    await clearTokens();
    useLoopStore.getState().reset();
    set({ user: null, isLoggedIn: false, isReady: true, error: null });
  },

  updateUser: async (updatedUser) => {
    await setStoredUser(updatedUser);
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
