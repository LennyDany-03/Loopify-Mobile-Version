import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import { usersAPI } from "../../lib/api";

function sanitizeUsername(value = "") {
  return value
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatMonthYear(value) {
  if (!value) {
    return "Recently joined";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently joined";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function formatLiveDate(value) {
  if (!value) {
    return "Waiting for sync";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Waiting for sync";
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function StatTile({ icon, label, value, suffix, accent = "#7CA6FF" }) {
  return (
    <View className="w-[48%] rounded-[28px] border border-white/5 bg-[#11141D] p-5 shadow-lg shadow-black/70">
      <View className="mb-8 w-11 h-11 rounded-2xl items-center justify-center bg-[#1A2335] border border-white/5">
        <MaterialCommunityIcons name={icon} size={22} color={accent} />
      </View>
      <Text className="text-white/40 text-[10px] font-bold tracking-[2px] uppercase mb-2">
        {label}
      </Text>
      <View className="flex-row items-end">
        <Text className="text-white text-[34px] font-black tracking-tight leading-[38px]">
          {value}
        </Text>
        {suffix ? (
          <Text className="text-white/35 text-[11px] font-bold tracking-[1px] ml-2 mb-1">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value, valueColor = "text-white" }) {
  return (
    <View className="flex-row items-start rounded-[22px] border border-white/5 bg-[#0F121A] px-4 py-4">
      <View className="w-10 h-10 rounded-2xl bg-[#182033] items-center justify-center mr-4">
        <Feather name={icon} size={16} color="#7CA6FF" />
      </View>
      <View className="flex-1">
        <Text className="text-white/35 text-[10px] font-bold tracking-[2px] uppercase mb-1">
          {label}
        </Text>
        <Text className={`${valueColor} text-[15px] font-bold leading-5`}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function PersonalInformation() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const summary = useLoopStore((state) => state.summary);
  const serverDate = useLoopStore((state) => state.serverDate);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);

  const [profileStats, setProfileStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshProfileView() {
        setIsRefreshing(true);
        setError(null);

        const [profileResult, statsResult] = await Promise.allSettled([
          usersAPI.getMe(),
          usersAPI.getMyStats(),
          fetchSummary(),
        ]);

        if (!isActive) {
          return;
        }

        if (profileResult.status === "fulfilled" && profileResult.value?.data) {
          const currentUser = useAuthStore.getState().user;
          await updateUser({ ...currentUser, ...profileResult.value.data });
        }

        if (statsResult.status === "fulfilled") {
          setProfileStats(statsResult.value?.data ?? null);
        } else {
          setError(
            statsResult.reason?.response?.data?.detail || "Unable to refresh your profile right now."
          );
        }

        setIsRefreshing(false);
      }

      refreshProfileView();

      return () => {
        isActive = false;
      };
    }, [fetchSummary, updateUser])
  );

  const displayName = user?.full_name?.trim() || "Loopify User";
  const usernameValue = sanitizeUsername(user?.username || user?.email?.split("@")[0] || displayName);
  const handle = usernameValue ? `@${usernameValue}` : "@loopify";
  const email = user?.email || "No email available";
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = displayName.charAt(0).toUpperCase();
  const memberSince = formatMonthYear(profileStats?.member_since || user?.created_at);
  const liveDate = formatLiveDate(serverDate);

  const statTiles = useMemo(
    () => [
      {
        icon: "fire",
        label: "Current Streak",
        value: summary?.current_streak_overall ?? 0,
        suffix: "days",
      },
      {
        icon: "check-decagram-outline",
        label: "Check-ins",
        value: summary?.total_checkins ?? profileStats?.total_checkins_all_time ?? 0,
        suffix: "total",
      },
      {
        icon: "orbit",
        label: "Live Loops",
        value: summary?.total_loops ?? profileStats?.total_loops_created ?? 0,
        suffix: "active",
      },
      {
        icon: "trophy-outline",
        label: "Best Streak",
        value: summary?.best_streak_overall ?? profileStats?.best_streak_ever ?? 0,
        suffix: "days",
      },
    ],
    [profileStats?.best_streak_ever, profileStats?.total_checkins_all_time, profileStats?.total_loops_created, summary?.best_streak_overall, summary?.current_streak_overall, summary?.total_checkins, summary?.total_loops]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#050608]">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center rounded-full bg-white/5 border border-white/5 active:bg-white/10"
          >
            <Feather name="arrow-left" size={18} color="#7CA6FF" />
          </TouchableOpacity>

          <Text className="text-[#88AFFF] text-lg font-black tracking-tight">Loopify</Text>

          <TouchableOpacity
            onPress={() => router.push("/profile/editProfile")}
            className="items-center justify-center rounded-full bg-[#182442] px-4 py-2.5 border border-[#7CA6FF]/20 active:bg-[#213259]"
          >
            <Text className="text-[#7CA6FF] text-[10px] font-black tracking-[1.8px] uppercase">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-[#4F8EF7] text-[10px] font-black tracking-[3px] uppercase mb-2">
            Live Identity Feed
          </Text>
          <Text className="text-white text-[34px] leading-[38px] font-black tracking-tight">
            Personal Information
          </Text>
          <Text className="text-white/45 text-[14px] leading-6 mt-3 max-w-[92%]">
            Your profile card now reflects the latest profile and streak data from the backend whenever this screen opens.
          </Text>
        </View>

        <View className="rounded-[34px] border border-white/5 bg-[#121626] px-6 py-6 mb-8 overflow-hidden shadow-2xl shadow-black/80">
          <View className="absolute -right-24 -bottom-16 opacity-[0.06]">
            <MaterialCommunityIcons name="sync" size={280} color="#AFC8FF" />
          </View>

          <View className="flex-row items-start justify-between mb-6">
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-[74px] h-[74px] rounded-full border-2 border-[#7CA6FF] items-center justify-center overflow-hidden bg-[#0B0D14]">
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[#7CA6FF] text-3xl font-black">{initial}</Text>
                )}
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white text-[28px] font-black tracking-tight leading-8">
                  {displayName}
                </Text>
                <Text className="text-[#8FB2FF] text-[13px] font-bold tracking-wide mt-1">
                  {handle}
                </Text>
                <Text className="text-white/40 text-[12px] font-semibold mt-1" numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>

            <View className="rounded-full border border-white/10 bg-[#17223A] px-3.5 py-2 flex-row items-center">
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#7CA6FF" />
              ) : (
                <MaterialCommunityIcons name="pulse" size={14} color="#7CA6FF" />
              )}
              <Text className="text-[#8FB2FF] text-[9px] font-black tracking-[1.8px] uppercase ml-2">
                {isRefreshing ? "Syncing" : `Live ${liveDate}`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 rounded-[24px] border border-white/5 bg-[#0D121B] px-4 py-4">
              <Text className="text-white/35 text-[10px] font-black tracking-[2px] uppercase mb-1">
                Member Since
              </Text>
              <Text className="text-white text-[17px] font-black tracking-tight">
                {memberSince}
              </Text>
            </View>

            <View className="w-[78px] h-[78px] rounded-[24px] bg-black border-[3px] border-white/90 items-center justify-center">
              {user?.symbol ? (
                <Feather name={user.symbol} size={30} color="#FFFFFF" />
              ) : (
                <View className="w-7 h-7 border-2 border-dashed border-white/50 rounded-md" />
              )}
            </View>
          </View>
        </View>

        <View className="gap-4 mb-8">
          <InfoRow icon="mail" label="Login Email" value={email} />
          <InfoRow icon="user" label="Profile Handle" value={handle} valueColor="text-[#8FB2FF]" />
        </View>

        <View className="flex-row items-center gap-4 mb-6">
          <Text className="text-white/55 text-[10px] font-black tracking-[3px] uppercase">
            Real-Time Activity
          </Text>
          <View className="flex-1 h-[1px] bg-white/10" />
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 mb-4">
          {statTiles.map((item) => (
            <StatTile
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              suffix={item.suffix}
            />
          ))}
        </View>

        {!!error && (
          <Text className="text-red-300 text-sm mt-2 text-center">
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
