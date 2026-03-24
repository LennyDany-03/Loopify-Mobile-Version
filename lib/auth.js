import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "loopify_access_token";
const REFRESH_KEY = "loopify_refresh_token";
const USER_KEY = "loopify_user";

const isWeb = Platform.OS === "web";

function getWebStorage() {
  if (!isWeb || typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

async function getItem(key) {
  const webStorage = getWebStorage();

  if (webStorage) {
    return webStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function setItem(key, value) {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key) {
  const webStorage = getWebStorage();

  if (webStorage) {
    webStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getToken() {
  try {
    return await getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken() {
  try {
    return await getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setTokens(accessToken, refreshToken) {
  try {
    await setItem(ACCESS_KEY, accessToken);

    if (refreshToken) {
      await setItem(REFRESH_KEY, refreshToken);
    }
  } catch (e) {
    console.error("Failed to save tokens:", e);
  }
}

export async function clearTokens() {
  try {
    await deleteItem(ACCESS_KEY);
    await deleteItem(REFRESH_KEY);
    await deleteItem(USER_KEY);
  } catch (e) {
    console.error("Failed to clear tokens:", e);
  }
}

export async function getStoredUser() {
  try {
    const raw = await getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user) {
  try {
    await setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user:", e);
  }
}

export async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}
