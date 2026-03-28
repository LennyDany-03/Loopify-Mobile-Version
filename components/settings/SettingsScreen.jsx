import { View, Text, Switch, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/hooks/useAuth";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import { useCallback, useMemo, useState } from "react";

function SectionTitle({ title }) {
  return (
    <Text className="text-[#7DA7FF] text-[11px] font-black tracking-[2px] mt-8 mb-3 px-1 uppercase">
      {title}
    </Text>
  );
}

function calculateAccountHealth(summary, loopCountFallback = 0) {
  const totalLoops = summary?.total_loops ?? loopCountFallback ?? 0;
  const totalCheckins = summary?.total_checkins ?? 0;
  const currentStreak = summary?.current_streak_overall ?? 0;
  const bestStreak = summary?.best_streak_overall ?? 0;
  const loopsOnStreakToday = summary?.loops_on_streak_today ?? 0;

  if (!totalLoops && !totalCheckins && !currentStreak && !bestStreak) {
    return {
      score: 0,
      headline: "No live score yet",
      message: "Create your first loop and log a check-in to start building account health.",
      badge: "New Account",
      stats: [
        { label: "Streak", value: "0d" },
        { label: "Active", value: "0/0" },
        { label: "Checks", value: "0" },
      ],
    };
  }

  const streakStrength = Math.min(currentStreak / 14, 1);
  const bestStreakStrength = Math.min(bestStreak / 30, 1);
  const activeLoopStrength = totalLoops ? loopsOnStreakToday / totalLoops : 0;
  const checkinStrength = Math.min(totalCheckins / Math.max(totalLoops * 12, 12), 1);

  const score = Number(
    (
      streakStrength * 35 +
      activeLoopStrength * 25 +
      checkinStrength * 25 +
      bestStreakStrength * 15
    ).toFixed(1)
  );

  let headline = "Building momentum";
  let badge = "In Progress";
  let message = `${loopsOnStreakToday} of ${totalLoops} loops are active today. Keep stacking check-ins.`;

  if (score >= 85) {
    headline = "Elite consistency";
    badge = "Peak Form";
    message = `${loopsOnStreakToday} of ${totalLoops} loops are active today, backed by a ${currentStreak}-day streak.`;
  } else if (score >= 70) {
    headline = "Strong account health";
    badge = "High Momentum";
    message = `${currentStreak} live streak days and ${totalCheckins} total check-ins are keeping your account strong.`;
  } else if (score >= 50) {
    headline = "Steady progress";
    badge = "On Track";
    message = `${loopsOnStreakToday} active loops and a best streak of ${bestStreak} days give you a solid rhythm.`;
  } else if (score >= 25) {
    headline = "Early rhythm";
    badge = "Warming Up";
    message = "A few more completed loops this week will noticeably raise your live score.";
  }

  return {
    score,
    headline,
    badge,
    message,
    stats: [
      { label: "Streak", value: `${currentStreak}d` },
      { label: "Active", value: `${loopsOnStreakToday}/${totalLoops || 0}` },
      { label: "Checks", value: `${totalCheckins}` },
    ],
  };
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, isLoading } = useAuth();
  const user = useAuthStore((state) => state.user);
  const loops = useLoopStore((state) => state.loops);
  const summary = useLoopStore((state) => state.summary);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);

  const firstName = user?.full_name?.split(" ")[0] || "Lenny";
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = firstName.charAt(0).toUpperCase();

  const [dailyReminder, setDailyReminder] = useState(true);
  const [smartPings, setSmartPings] = useState(false);
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshAccountHealth() {
        setIsHealthRefreshing(true);
        await Promise.allSettled([fetchSummary(), fetchLoops()]);

        if (isActive) {
          setIsHealthRefreshing(false);
        }
      }

      refreshAccountHealth();

      return () => {
        isActive = false;
      };
    }, [fetchLoops, fetchSummary])
  );

  const accountHealth = useMemo(
    () => calculateAccountHealth(summary, loops.length),
    [loops.length, summary]
  );
  const accountHealthBadge = `${Math.round(accountHealth.score)}%`;

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View className="bg-[#0B0D14] rounded-[32px] p-5 flex-row items-center border border-white/5 shadow-2xl shadow-black/80">
          <View className="relative mr-5">
            <View className="w-[88px] h-[88px] rounded-full border-[3px] border-[#4F8EF7] items-center justify-center">
              <View className="w-[76px] h-[76px] rounded-full overflow-hidden bg-[#162032] items-center justify-center">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[#7DA7FF] font-black text-3xl pt-1">{initial}</Text>
                )}
              </View>
            </View>
            <View className="absolute bottom-[-2px] right-[-2px] bg-[#050508] rounded-full p-[3px]">
              <View className="bg-[#1A253A] border border-[#4F8EF7]/50 rounded-full px-1.5 py-0.5">
                <Text className="text-[#7DA7FF] text-[9px] font-bold">{accountHealthBadge}</Text>
              </View>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-white text-[22px] font-black tracking-tight">{firstName}</Text>
            <Text className="text-[#7DA7FF] text-[12px] font-semibold mt-0.5">
              {accountHealth.badge} • Live Score {accountHealthBadge}
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/profile/editProfile")}
              className="bg-[#1A253A] rounded-full px-4 py-1.5 mt-3 self-start border border-[#4F8EF7]/20"
            >
              <Text className="text-[#7DA7FF] text-[9px] font-bold tracking-[1px] uppercase pt-[1px]">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionTitle title="Account Settings" />

        <View className="bg-[#0B0D14] rounded-[24px] overflow-hidden border border-white/5">
          <TouchableOpacity
            onPress={() => router.push("/profile/personalInformation")}
            className="flex-row items-center justify-between p-5 border-b border-white/5"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <MaterialCommunityIcons name="account" size={20} color="rgba(255,255,255,0.7)" />
              <Text className="text-white font-bold text-[15px]">Personal Information</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-5" activeOpacity={0.7}>
            <View className="flex-row items-center gap-4">
              <MaterialCommunityIcons name="lock" size={20} color="rgba(255,255,255,0.7)" />
              <Text className="text-white font-bold text-[15px]">Change Password</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        <SectionTitle title="Notifications" />

        <View className="bg-[#0B0D14] rounded-[24px] overflow-hidden border border-white/5">
          <View className="flex-row items-center justify-between p-5 border-b border-white/5">
            <View>
              <Text className="text-white font-bold text-[15px]">Daily Reminder</Text>
              <Text className="text-white/40 text-[11px] mt-1 font-medium">Stay consistent with your goals</Text>
            </View>
            <Switch
              value={dailyReminder}
              onValueChange={setDailyReminder}
              trackColor={{ false: "#1E222E", true: "#7DA7FF" }}
              thumbColor={dailyReminder ? "#14366D" : "#8E93A6"}
              ios_backgroundColor="#1E222E"
            />
          </View>

          <View className="flex-row items-center justify-between p-5">
            <View>
              <Text className="text-white font-bold text-[15px]">Smart Pings</Text>
              <Text className="text-white/40 text-[11px] mt-1 font-medium">AI-driven activity nudges</Text>
            </View>
            <Switch
              value={smartPings}
              onValueChange={setSmartPings}
              trackColor={{ false: "#1E222E", true: "#7DA7FF" }}
              thumbColor={smartPings ? "#14366D" : "#5B6175"}
              ios_backgroundColor="#1E222E"
            />
          </View>
        </View>

        <SectionTitle title="App Preferences" />

        <View className="flex-row gap-4">
          <View className="flex-1 bg-[#0B0D14] rounded-[24px] p-5 border border-white/5">
            <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-4">Theme</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="w-10 h-10 rounded-full border border-[#4F8EF7] items-center justify-center bg-[#1A253A] shadow-lg shadow-[#4F8EF7]/30">
                <Feather name="moon" size={16} color="#7DA7FF" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 rounded-full border border-white/5 items-center justify-center bg-white/5">
                <Feather name="sun" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 bg-[#0B0D14] rounded-[24px] p-5 border border-white/5">
            <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-4">Accent</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity className="w-6 h-6 rounded-full bg-[#7CA6FF] border-2 border-white shadow-lg shadow-[#7CA6FF]/50" />
              <TouchableOpacity className="w-6 h-6 rounded-full bg-[#B27CFF]" />
              <TouchableOpacity className="w-6 h-6 rounded-full bg-[#1CE59D]" />
            </View>
          </View>
        </View>

        <View className="mt-8 mb-8 rounded-[32px] overflow-hidden shadow-2xl shadow-[#4F8EF7]/40">
          <LinearGradient
            colors={["#6EA0FF", "#3E6AC9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, paddingVertical: 28 }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 pr-6">
                <Text className="text-[#0D1B36] font-black text-[18px]">Account Health</Text>
                <Text className="text-[#14366D]/80 font-bold text-[13px] mt-1 leading-5">
                  {accountHealth.message}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-[#14366D]/10 items-center justify-center">
                <MaterialCommunityIcons
                  name={isHealthRefreshing ? "refresh" : "star-four-points"}
                  size={24}
                  color="#0D1B36"
                />
              </View>
            </View>

            <View className="flex-row items-baseline mt-2">
              <Text className="text-[#0D1B36] font-black text-[46px] leading-[48px] tracking-tight">
                {accountHealth.score.toFixed(1)}
              </Text>
              <Text className="text-[#14366D] font-black text-[10px] tracking-widest uppercase ml-2">
                Live Score
              </Text>
            </View>

            <Text className="text-[#14366D] font-black text-[11px] tracking-[2px] uppercase mt-2">
              {accountHealth.headline}
            </Text>

            <View className="flex-row gap-3 mt-6">
              {accountHealth.stats.map((item) => (
                <View
                  key={item.label}
                  className="flex-1 rounded-[18px] bg-[#14366D]/12 border border-[#14366D]/10 px-3 py-3"
                >
                  <Text className="text-[#14366D]/70 text-[8px] font-black tracking-[1.6px] uppercase mb-1">
                    {item.label}
                  </Text>
                  <Text className="text-[#0D1B36] text-[17px] font-black tracking-tight">
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity
          onPress={logout}
          disabled={isLoading}
          activeOpacity={0.8}
          className="w-full flex-row items-center justify-center gap-2 bg-[#E5484D]/10 border border-[#E5484D]/20 py-4 rounded-full"
        >
          <Feather name="log-out" size={18} color="#FF6E73" />
          <Text className="text-[#FF6E73] font-bold text-[15px]">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
