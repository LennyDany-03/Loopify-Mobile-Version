import { Redirect } from "expo-router";
import { Image, Text, View } from "react-native";
import useAuthStore from "../lib/store/useAuthStore";

export default function App() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0f0f23]">
        <Image 
          source={require("../assets/images/image.png")} 
          className="w-24 h-24 mb-4"
          resizeMode="contain"
        />
        <Text className="text-white text-2xl font-bold">Loopify</Text>
      </View>
    );
  }

  return <Redirect href={isLoggedIn ? "/(tabs)/dashboard" : "/(auth)/sign-in"} />;
}
