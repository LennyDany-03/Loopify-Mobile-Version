import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "loopify_access_token";
const REFRESH_KEY = "loopify_refresh_token";
const USER_KEY = "loopify_user";
const SECURE_STORE_SOFT_LIMIT = 1900;

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

function removeNullishValues(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined && entry !== "")
  );
}

function isInlineAsset(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function getStringSize(value) {
  return typeof value === "string" ? value.length : 0;
}

function sanitizeStoredUser(user) {
  if (!user || typeof user !== "object") {
    return user ?? null;
  }

  const sanitized = { ...user };

  for (const key of ["avatar_url", "picture", "profile_pic"]) {
    const value = sanitized[key];

    if (isInlineAsset(value) || getStringSize(value) > 1024) {
      delete sanitized[key];
    }
  }

  const serialized = JSON.stringify(sanitized);

  if (serialized.length <= SECURE_STORE_SOFT_LIMIT) {
    return sanitized;
  }

  const compactUser = removeNullishValues({
    id: sanitized.id,
    email: sanitized.email,
    username: sanitized.username,
    full_name: sanitized.full_name,
    symbol: sanitized.symbol,
    created_at: sanitized.created_at,
    timezone: sanitized.timezone,
    reminder_time: sanitized.reminder_time,
    theme: sanitized.theme,
    avatar_url: sanitized.avatar_url,
    picture: sanitized.picture,
    profile_pic: sanitized.profile_pic,
  });

  if (JSON.stringify(compactUser).length <= SECURE_STORE_SOFT_LIMIT) {
    return compactUser;
  }

  return removeNullishValues({
    id: sanitized.id,
    email: sanitized.email,
    username: sanitized.username,
    full_name: sanitized.full_name,
    symbol: sanitized.symbol,
  });
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
    await setItem(USER_KEY, JSON.stringify(sanitizeStoredUser(user)));
  } catch (e) {
    console.error("Failed to save user:", e);
  }
}

export async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}
