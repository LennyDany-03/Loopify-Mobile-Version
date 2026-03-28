import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import { usersAPI } from "../../lib/api";
import useAppTheme from "../../lib/hooks/useAppTheme";
import { withOpacity } from "../../lib/theme";

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

function StatTile({ icon, label, value, suffix, accent = "#7CA6FF", theme }) {
  return (
    <View
      className="w-[48%] rounded-[28px] border p-5 shadow-lg"
      style={{ backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }}
    >
      <View
        className="mb-8 w-11 h-11 rounded-2xl items-center justify-center border"
        style={{
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.border,
        }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={accent} />
      </View>
      <Text className="text-[10px] font-bold tracking-[2px] uppercase mb-2" style={{ color: theme.textMuted }}>
        {label}
      </Text>
      <View className="flex-row items-end">
        <Text className="text-[34px] font-black tracking-tight leading-[38px]" style={{ color: theme.text }}>
          {value}
        </Text>
        {suffix ? (
          <Text className="text-[11px] font-bold tracking-[1px] ml-2 mb-1" style={{ color: theme.textSubtle }}>
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InfoRow({ icon, label, value, accentColor, theme }) {
  return (
    <View
      className="flex-row items-start rounded-[22px] border px-4 py-4"
      style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
    >
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: theme.surfaceRaised }}
      >
        <Feather name={icon} size={16} color={accentColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-bold tracking-[2px] uppercase mb-1" style={{ color: theme.textSubtle }}>
          {label}
        </Text>
        <Text className="text-[15px] font-bold leading-5" style={{ color: accentColor || theme.text }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function PersonalInformation() {
  const { theme, isDark } = useAppTheme();
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
    [
      profileStats?.best_streak_ever,
      profileStats?.total_checkins_all_time,
      profileStats?.total_loops_created,
      summary?.best_streak_overall,
      summary?.current_streak_overall,
      summary?.total_checkins,
      summary?.total_loops,
    ]
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 72 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center rounded-full border"
            style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
          >
            <Feather name="arrow-left" size={18} color={theme.accentSoft} />
          </TouchableOpacity>

          <Text className="text-lg font-black tracking-tight" style={{ color: theme.logo }}>
            Loopify
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/profile/editProfile")}
            className="items-center justify-center rounded-full px-4 py-2.5 border"
            style={{
              backgroundColor: withOpacity(theme.accent, isDark ? 0.16 : 0.1),
              borderColor: withOpacity(theme.accent, 0.2),
            }}
          >
            <Text className="text-[10px] font-black tracking-[1.8px] uppercase" style={{ color: theme.accentSoft }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-[10px] font-black tracking-[3px] uppercase mb-2" style={{ color: theme.accent }}>
            Live Identity Feed
          </Text>
          <Text className="text-[34px] leading-[38px] font-black tracking-tight" style={{ color: theme.text }}>
            Personal Information
          </Text>
          <Text className="text-[14px] leading-6 mt-3 max-w-[92%]" style={{ color: theme.textMuted }}>
            Your profile card now reflects the latest profile and streak data from the backend whenever this screen opens.
          </Text>
        </View>

        <View
          className="rounded-[34px] border px-6 py-6 mb-8 overflow-hidden shadow-2xl"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          }}
        >
          <View className="absolute -right-24 -bottom-16 opacity-[0.06]">
            <MaterialCommunityIcons name="sync" size={280} color={theme.accentSoft} />
          </View>

          <View className="flex-row items-start justify-between mb-6">
            <View className="flex-row items-center flex-1 pr-4">
              <View
                className="w-[74px] h-[74px] rounded-full border-2 items-center justify-center overflow-hidden"
                style={{ borderColor: theme.accentSoft, backgroundColor: theme.surface }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-3xl font-black" style={{ color: theme.accentSoft }}>
                    {initial}
                  </Text>
                )}
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[28px] font-black tracking-tight leading-8" style={{ color: theme.text }}>
                  {displayName}
                </Text>
                <Text className="text-[13px] font-bold tracking-wide mt-1" style={{ color: theme.accentText }}>
                  {handle}
                </Text>
                <Text className="text-[12px] font-semibold mt-1" style={{ color: theme.textMuted }} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>

            <View
              className="rounded-full border px-3.5 py-2 flex-row items-center"
              style={{
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.borderStrong,
              }}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={theme.accentSoft} />
              ) : (
                <MaterialCommunityIcons name="pulse" size={14} color={theme.accentSoft} />
              )}
              <Text className="text-[9px] font-black tracking-[1.8px] uppercase ml-2" style={{ color: theme.accentText }}>
                {isRefreshing ? "Syncing" : `Live ${liveDate}`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <View
              className="flex-1 rounded-[24px] border px-4 py-4"
              style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
            >
              <Text className="text-[10px] font-black tracking-[2px] uppercase mb-1" style={{ color: theme.textSubtle }}>
                Member Since
              </Text>
              <Text className="text-[17px] font-black tracking-tight" style={{ color: theme.text }}>
                {memberSince}
              </Text>
            </View>

            <View
              className="w-[78px] h-[78px] rounded-[24px] border-[3px] items-center justify-center"
              style={{
                backgroundColor: isDark ? "#000000" : theme.surfaceRaised,
                borderColor: isDark ? "rgba(255,255,255,0.9)" : withOpacity(theme.accent, 0.25),
              }}
            >
              {user?.symbol ? (
                <Feather name={user.symbol} size={30} color={isDark ? "#FFFFFF" : theme.accent} />
              ) : (
                <View
                  className="w-7 h-7 border-2 border-dashed rounded-md"
                  style={{ borderColor: theme.textSubtle }}
                />
              )}
            </View>
          </View>
        </View>

        <View className="gap-4 mb-8">
          <InfoRow icon="mail" label="Login Email" value={email} accentColor={theme.text} theme={theme} />
          <InfoRow icon="user" label="Profile Handle" value={handle} accentColor={theme.accentText} theme={theme} />
        </View>

        <View className="flex-row items-center gap-4 mb-6">
          <Text className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: theme.textMuted }}>
            Real-Time Activity
          </Text>
          <View className="flex-1 h-[1px]" style={{ backgroundColor: theme.borderStrong }} />
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-4 mb-4">
          {statTiles.map((item) => (
            <StatTile
              key={item.label}
              icon={item.icon}
              label={item.label}
              value={item.value}
              suffix={item.suffix}
              accent={theme.accentSoft}
              theme={theme}
            />
          ))}
        </View>

        {!!error && (
          <Text className="text-sm mt-2 text-center" style={{ color: theme.danger }}>
            {error}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
