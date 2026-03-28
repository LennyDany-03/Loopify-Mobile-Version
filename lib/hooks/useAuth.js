import { router } from "expo-router";
import useAuthStore from "../store/useAuthStore";
import useLoopStore from "../store/useLoopStore";

export function useAuth() {
  const {
    user, isLoggedIn, isLoading, isReady, error,
    login, register, loginWithGoogle, logout, clearError,
  } = useAuthStore();
  const { reset } = useLoopStore();

  async function handleLogin(credentials) {
    const result = await login(credentials);
    if (result.success) {
      router.replace("/(tabs)/dashboard");
    }
    return result;
  }

  async function handleRegister(data) {
    const result = await register(data);
    if (result.success) {
      router.replace("/(tabs)/dashboard");
    }
    return result;
  }

  async function handleGoogleLogin() {
    const result = await loginWithGoogle();
    if (result.success) {
      router.replace("/(tabs)/dashboard");
    }
    return result;
  }

  async function handleLogout() {
    await logout();
    reset(); // clear loop store too
    router.replace("/(auth)/sign-in");
  }

  return {
    user,
    isLoggedIn,
    isLoading,
    isReady,
    error,
    clearError,
    login:    handleLogin,
    register: handleRegister,
    loginWithGoogle: handleGoogleLogin,
    logout:   handleLogout,
  };
}
