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
import useReminderStore from "./useReminderStore";
import { cancelDailyLoopReminderAsync } from "../notifications/dailyReminder";

function mergeUserWithCachedUser(nextUser, fallbackUser = null) {
  if (!nextUser && !fallbackUser) {
    return null;
  }

  const mergedUser = {
    ...(fallbackUser || {}),
    ...(nextUser || {}),
  };

  mergedUser.theme = nextUser?.theme ?? fallbackUser?.theme ?? "dark";

  return mergedUser;
}

function isMissingThemeColumnError(err) {
  const message =
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "";

  return typeof message === "string" && message.includes("Could not find the 'theme' column");
}

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
        await cancelDailyLoopReminderAsync();
        useReminderStore.getState().resetSession();
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
      const user = mergeUserWithCachedUser(profileRes.data, cachedUser);

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
      await cancelDailyLoopReminderAsync();
      useReminderStore.getState().resetSession();
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
    const cachedUser = await getStoredUser();
    const profileRes = await usersAPI.getMe();
    const user = mergeUserWithCachedUser(profileRes.data, cachedUser);
    await setStoredUser(user);

    set({
      user,
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
    await cancelDailyLoopReminderAsync();
    useReminderStore.getState().resetSession();
    useLoopStore.getState().reset();
    set({ user: null, isLoggedIn: false, isReady: true, error: null });
  },

  updateUser: async (updatedUser) => {
    const currentUser = useAuthStore.getState().user;
    const mergedUser = mergeUserWithCachedUser(updatedUser, currentUser);
    await setStoredUser(mergedUser);
    set({ user: mergedUser });
  },

  setThemePreference: async (nextTheme) => {
    const previousUser = useAuthStore.getState().user;
    const normalizedTheme = nextTheme === "light" ? "light" : "dark";

    if (!previousUser) {
      return { success: false, error: "No active user session." };
    }

    if (previousUser.theme === normalizedTheme) {
      return { success: true, user: previousUser };
    }

    const optimisticUser = {
      ...previousUser,
      theme: normalizedTheme,
    };

    await setStoredUser(optimisticUser);
    set({ user: optimisticUser });

    try {
      const response = await usersAPI.updateMe({ theme: normalizedTheme });
      const mergedUser = mergeUserWithCachedUser(response?.data?.profile, optimisticUser);

      await setStoredUser(mergedUser);
      set({ user: mergedUser });
      return { success: true, user: mergedUser };
    } catch (err) {
      if (isMissingThemeColumnError(err)) {
        return { success: true, user: optimisticUser, syncDeferred: true };
      }

      await setStoredUser(previousUser);
      set({ user: previousUser });
      return {
        success: false,
        error: err.response?.data?.detail || "Unable to update your theme right now.",
      };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
