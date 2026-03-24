import { View, Text } from "react-native";

export default function GreetingHeader({ user, onAvatarPress }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <View className="mb-6 mt-4">
      <Text className="text-white text-3xl font-bold leading-tight">
        {greeting},{"\n"}
        {firstName}
      </Text>
      <Text className="text-white/50 text-base mt-2">
        Your kinetic loops are ready for execution.
      </Text>
    </View>
  );
}
