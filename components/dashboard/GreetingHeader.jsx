import { View, Text, Image } from "react-native";

export default function GreetingHeader({ user }) {
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const initial = firstName.charAt(0).toUpperCase();
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;

  return (
    <View className="mb-8 mt-2 rounded-[30px] border border-white/5 bg-[#0B0D14] px-5 py-5 shadow-2xl shadow-black/80">
      <View className="flex-row items-start">
        <View className="flex-1 pr-4">
          <Text className="text-white/70 text-[14px] font-semibold tracking-wide mb-2">
            Welcome back,
          </Text>
          <Text className="text-white text-[38px] font-black leading-[42px] tracking-tight">
            {firstName}
          </Text>
          <Text className="text-white/45 text-[14px] mt-3 leading-6">
            Your kinetic loops are ready for execution.
          </Text>
        </View>

        <View className="w-[76px] h-[76px] rounded-full bg-[#162032] items-center justify-center border border-white/10 overflow-hidden">
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
    </View>
  );
}
