import Constants from "expo-constants";
import { Platform } from "react-native";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const NATIVE_MODULE_NAME = "RNGoogleSignin";

let googleSigninModule = null;
let googleSigninUnavailableReason = null;
let isConfigured = false;

function getExpoGoMessage() {
  return `Google sign-in is disabled in Expo Go. Open the app in a development build or standalone app because Expo Go does not include the ${NATIVE_MODULE_NAME} native module.`;
}

function isExpoGo() {
  return Constants.appOwnership === "expo";
}

export function getGoogleAuthAvailability() {
  if (Platform.OS === "web") {
    return {
      available: false,
      error: "Google sign-in is only available in the native app build.",
    };
  }

  if (Platform.OS === "ios" && !GOOGLE_IOS_CLIENT_ID) {
    return {
      available: false,
      error:
        "Google sign-in on iOS still needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and the Google URL scheme configured in the native app.",
    };
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    return {
      available: false,
      error:
        "Google sign-in is not configured yet. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your app .env.",
    };
  }

  if (isExpoGo()) {
    return {
      available: false,
      error: getExpoGoMessage(),
    };
  }

  return { available: true, error: null };
}

function getGoogleSigninModule() {
  const availability = getGoogleAuthAvailability();

  if (!availability.available) {
    googleSigninUnavailableReason = availability.error;
    return null;
  }

  if (googleSigninModule) {
    return googleSigninModule;
  }

  if (googleSigninUnavailableReason) {
    return null;
  }

  try {
    googleSigninModule = require("@react-native-google-signin/google-signin");
    return googleSigninModule;
  } catch (error) {
    const message = error?.message || "";

    googleSigninUnavailableReason = message.includes(NATIVE_MODULE_NAME)
      ? getExpoGoMessage()
      : "Google sign-in is unavailable in this build right now.";

    return null;
  }
}

function getAvailability() {
  const baseAvailability = getGoogleAuthAvailability();

  if (!baseAvailability.available) {
    return baseAvailability;
  }

  const module = getGoogleSigninModule();

  if (!module) {
    return {
      available: false,
      error: googleSigninUnavailableReason || getExpoGoMessage(),
    };
  }

  return { available: true, error: null };
}

export function configureGoogleAuth() {
  const availability = getAvailability();

  if (!availability.available || isConfigured) {
    return availability;
  }

  const { GoogleSignin } = googleSigninModule;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
  });

  isConfigured = true;
  return availability;
}

export async function signInWithGoogle() {
  const availability = configureGoogleAuth();

  if (!availability.available) {
    return {
      success: false,
      error: availability.error,
    };
  }

  const {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
  } = googleSigninModule;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { success: false, cancelled: true };
    }

    const idToken = response.data?.idToken;

    if (!idToken) {
      return {
        success: false,
        error:
          "Google sign-in did not return an ID token. Double-check the Web client ID in Google Cloud and Supabase.",
      };
    }

    return { success: true, idToken };
  } catch (error) {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.IN_PROGRESS:
          return {
            success: false,
            error: "Google sign-in is already in progress.",
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error:
              "Google Play Services is unavailable or out of date on this device.",
          };
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        default:
          return {
            success: false,
            error: error.message || "Google sign-in failed. Please try again.",
          };
      }
    }

    return {
      success: false,
      error: "Google sign-in failed. Please try again.",
    };
  }
}

export async function signOutFromGoogle() {
  const module = getGoogleSigninModule();

  if (!module) {
    return;
  }

  try {
    const hasPreviousSignIn = module.GoogleSignin.hasPreviousSignIn?.();

    if (hasPreviousSignIn) {
      await module.GoogleSignin.signOut();
    }
  } catch {}
}
