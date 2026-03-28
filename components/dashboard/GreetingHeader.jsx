import { View, Text, Image } from "react-native";

export default function GreetingHeader({ user }) {
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const initial = firstName.charAt(0).toUpperCase();
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;

  return (
    <View className="mb-8 mt-2">
      <Text className="text-white text-[16px] font-semibold tracking-wide mb-3">
        Welcome back,
      </Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-[42px] font-black leading-[44px] tracking-tight">
          {firstName}
        </Text>
        <View className="w-14 h-14 rounded-full bg-[#162032] items-center justify-center border border-white/10 overflow-hidden shadow-lg shadow-black/50">
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[#7DA7FF] text-2xl font-black pt-1">{initial}</Text>
          )}
        </View>
      </View>
      <Text className="text-white/50 text-[15px] mt-3 leading-6 max-w-[280px]">
        Your kinetic loops are ready for execution.
      </Text>
    </View>
  );
}
