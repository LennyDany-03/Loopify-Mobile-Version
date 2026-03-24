import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import useAuthStore from "../lib/store/useAuthStore";

export default function App() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050508]">
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? "/(tabs)/dashboard" : "/(auth)/sign-in"} />;
}
