import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";

export default function PersonalInformation() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const summary = useLoopStore((state) => state.summary);

  const firstName = user?.full_name?.split(" ")[0] || "Lenny";
  const handle = `@${firstName.toLowerCase()}_loops`;
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = firstName.charAt(0).toUpperCase();

  const activeDays = summary?.current_streak_overall || 124;
  const hubChecks = summary?.total_checkins || 42;

  return (
    <SafeAreaView className="flex-1 bg-[#090A0E]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Navigation Bar */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/5 active:bg-white/10"
          >
            <Feather name="arrow-left" size={18} color="#7CA6FF" />
          </TouchableOpacity>

          <Text className="text-[#88AFFF] text-lg font-black tracking-tight ml-4">Loopify</Text>

          <TouchableOpacity 
            onPress={() => router.push('/profile/editProfile')}
            className="items-center justify-center rounded-full bg-[#1A253A] px-3.5 py-2 border border-[#4F8EF7]/20 active:bg-white/10"
          >
            <Text className="text-[#7CA6FF] text-[9px] font-bold tracking-[1px] uppercase pt-[1px]">EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        {/* Header Titles */}
        <View className="mb-6">
          <Text className="text-[#4F8EF7] text-[10px] font-black tracking-[3px] uppercase mb-1">
            Digital Protocol
          </Text>
          <Text className="text-white text-[32px] leading-[36px] font-bold tracking-tight">Identity Vault</Text>
        </View>

        {/* Identity Card */}
        <View className="bg-[#131722] rounded-[32px] p-6 mb-10 border border-white/5 shadow-2xl shadow-black/80 relative overflow-hidden h-[240px]">
          {/* Faded Watermark */}
          <View className="absolute -right-16 top-0 bottom-0 justify-center opacity-[0.05]">
            <MaterialCommunityIcons name="sync" size={320} color="#FFFFFF" />
          </View>

          {/* User Info Row */}
          <View className="flex-row items-center relative z-10">
            <View className="w-[68px] h-[68px] rounded-full border-2 border-[#7CA6FF] items-center justify-center overflow-hidden bg-[#0B0D14]">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[#7CA6FF] text-3xl font-black">{initial}</Text>
              )}
            </View>
            <View className="ml-4">
              <Text className="text-white text-2xl font-black tracking-tight leading-7">{firstName}</Text>
              <Text className="text-white/40 text-[12px] font-bold">{handle}</Text>
            </View>
          </View>

          {/* Sync Pill (Top Right Overlap Placeholder) */}
          <View className="absolute top-6 right-6 bg-[#1A253A]/80 backdrop-blur-md rounded-full px-3 py-1.5 flex-row items-center gap-1 border border-white/10 z-10">
            <MaterialCommunityIcons name="sync" size={12} color="#7CA6FF" />
            <Text className="text-[#7CA6FF] text-[8px] font-black tracking-widest pl-0.5 pt-[1px]">LOOPIFY</Text>
          </View>

          {/* Bottom Left Auth Tags */}
          <View className="absolute bottom-6 left-6 z-10">
            <View className="bg-[#1A253A] border border-[#4F8EF7]/20 rounded-full px-3 py-1.5 flex-row items-center self-start gap-1.5 mb-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" />
              <Text className="text-[#7CA6FF] text-[9px] font-bold tracking-[1px] pt-[1px]">LOOP MASTER</Text>
            </View>
            <Text className="text-white/30 text-[9px] font-bold tracking-[2px] uppercase">
              AUTH-LVL: 07-OMEGA
            </Text>
          </View>

          {/* QR/Barcode Placeholder */}
          <View className="absolute bottom-6 right-6 w-14 h-14 bg-black border-[3px] border-white rounded-[10px] z-10" />
        </View>

        {/* Proof of Streak Section */}
        <View className="flex-row items-center gap-4 mb-6">
          <Text className="text-white/50 text-[10px] font-black tracking-[3px] uppercase">
            Proof of Streak
          </Text>
          <View className="flex-1 h-[1px] bg-white/10" />
        </View>

        {/* Stat Cards */}
        <View className="flex-row gap-4">
          {/* Active Days Card */}
          <View className="flex-1 bg-[#131722] rounded-[32px] p-5 min-h-[160px] justify-between border border-white/5 shadow-lg shadow-black/80">
            <MaterialCommunityIcons name="calendar-blank" size={24} color="#7CA6FF" />
            <View>
              <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-1">
                Active Days
              </Text>
              <Text className="text-white text-[42px] font-black tracking-tight leading-[46px]">
                {activeDays}
              </Text>
            </View>
          </View>

          {/* Hub Checks Card */}
          <View className="flex-1 bg-[#131722] rounded-[32px] p-5 min-h-[160px] justify-between border border-white/5 shadow-lg shadow-black/80">
            <MaterialCommunityIcons name="console-network" size={24} color="#7CA6FF" />
            <View>
              <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-1">
                Hub Checks
              </Text>
              <Text className="text-white text-[42px] font-black tracking-tight leading-[46px]">
                {hubChecks}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
