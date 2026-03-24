import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import useAuthStore from "../lib/store/useAuthStore";

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      initialize();
      hasInitialized.current = true;
    }
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
