import { View, Text } from "react-native";

export default function GreetingHeader({ user }) {
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <View className="mb-8 mt-2">
      <Text className="text-white text-[16px] font-semibold tracking-wide mb-3">
        Welcome back,
      </Text>
      <Text className="text-white text-[42px] font-black leading-[44px] tracking-tight">
        {firstName}
      </Text>
      <Text className="text-white/50 text-[15px] mt-3 leading-6 max-w-[280px]">
        Your kinetic loops are ready for execution.
      </Text>
    </View>
  );
}
