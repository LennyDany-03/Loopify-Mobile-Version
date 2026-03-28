import { Alert, View, Text, Switch, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/hooks/useAuth";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import useReminderStore from "../../lib/store/useReminderStore";
import {
  enableDailyLoopReminderAsync,
  formatReminderTime,
  getLoopReminderStatus,
  syncDailyLoopReminderAsync,
} from "../../lib/notifications/dailyReminder";
import useAppTheme from "../../lib/hooks/useAppTheme";
import { withOpacity } from "../../lib/theme";

function SectionTitle({ title, theme }) {
  return (
    <Text
      className="text-[11px] font-black tracking-[2px] mt-8 mb-3 px-1 uppercase"
      style={{ color: theme.accentSoft }}
    >
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
  const { theme, themeName, isDark } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const setThemePreference = useAuthStore((state) => state.setThemePreference);
  const loops = useLoopStore((state) => state.loops);
  const summary = useLoopStore((state) => state.summary);
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const initializeReminder = useReminderStore((state) => state.initialize);
  const dailyReminder = useReminderStore((state) => state.enabled);
  const reminderTime = useReminderStore((state) => state.reminderTime);
  const isReminderReady = useReminderStore((state) => state.isReady);
  const isReminderUpdating = useReminderStore((state) => state.isUpdating);
  const setReminderEnabled = useReminderStore((state) => state.setEnabled);

  const firstName = user?.full_name?.split(" ")[0] || "Lenny";
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = firstName.charAt(0).toUpperCase();

  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);
  const [isThemeUpdating, setIsThemeUpdating] = useState(false);

  useEffect(() => {
    void initializeReminder(user);
  }, [initializeReminder, user]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshAccountHealth() {
        setIsHealthRefreshing(true);
        await Promise.allSettled([fetchSummary(), fetchLoops(), fetchTodayCheckins()]);

        if (isActive) {
          setIsHealthRefreshing(false);
        }
      }

      refreshAccountHealth();

      return () => {
        isActive = false;
      };
    }, [fetchLoops, fetchSummary, fetchTodayCheckins])
  );

  const accountHealth = useMemo(
    () => calculateAccountHealth(summary, loops.length),
    [loops.length, summary]
  );
  const accountHealthBadge = `${Math.round(accountHealth.score)}%`;
  const reminderStatus = useMemo(
    () => getLoopReminderStatus({ loops, todayCheckins }),
    [loops, todayCheckins]
  );

  const reminderDescription = useMemo(() => {
    const readableTime = formatReminderTime(reminderTime);

    if (!isReminderReady) {
      return "Loading your reminder settings...";
    }

    if (!dailyReminder) {
      return `Send motivation at ${readableTime} when loops are still unfinished.`;
    }

    if (!loops.length) {
      return `Reminder is on for ${readableTime}. Create your first loop to start receiving nudges.`;
    }

    if (reminderStatus.shouldNotify) {
      const loopLabel = reminderStatus.remainingLoops === 1 ? "loop is" : "loops are";

      return `${readableTime} reminder is armed because ${reminderStatus.remainingLoops} ${loopLabel} still open today.`;
    }

    return `Reminder is active for ${readableTime}. We only notify when 0-2 loops are done and some are still left.`;
  }, [dailyReminder, isReminderReady, loops.length, reminderStatus, reminderTime]);

  const handleDailyReminderToggle = useCallback(
    (nextValue) => {
      void (async () => {
        if (!user?.id) {
          return;
        }

        if (!nextValue) {
          await setReminderEnabled(false);
          await syncDailyLoopReminderAsync({ enabled: false });
          return;
        }

        const result = await enableDailyLoopReminderAsync({
          reminderTime,
          loops,
          todayCheckins,
        });

        if (!result.success) {
          await setReminderEnabled(false);
          Alert.alert(
            result.reason === "module-unavailable" ? "Rebuild needed" : "Notifications are blocked",
            result.reason === "module-unavailable"
              ? "This app build does not include expo-notifications yet. Rebuild the dev client or app, then try turning Daily Reminder on again."
              : "Allow Loopify notifications on your device to receive daily motivation for unfinished loops."
          );
          return;
        }

        await setReminderEnabled(true);
      })();
    },
    [loops, reminderTime, setReminderEnabled, todayCheckins, user?.id]
  );

  const handleThemeSelection = useCallback(
    (nextTheme) => {
      if (isThemeUpdating || themeName === nextTheme) {
        return;
      }

      void (async () => {
        setIsThemeUpdating(true);
        const result = await setThemePreference(nextTheme);
        setIsThemeUpdating(false);

        if (!result.success) {
          Alert.alert("Theme update failed", result.error || "Unable to save your theme right now.");
        }
      })();
    },
    [isThemeUpdating, setThemePreference, themeName]
  );

  const healthGradient = isDark ? ["#6EA0FF", "#3E6AC9"] : ["#E0ECFF", "#B3CCFF"];
  const healthHeadingColor = isDark ? "#0D1B36" : "#173A73";
  const healthBodyColor = isDark ? "#14366D" : "#305CA8";

  const themeOptions = [
    {
      key: "dark",
      label: "Dark",
      icon: "moon",
      description: "Keep the current Loopify version.",
    },
    {
      key: "light",
      label: "Light",
      icon: "sun",
      description: "Switch to the light app version.",
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="rounded-[32px] p-5 flex-row items-center border shadow-2xl"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          }}
        >
          <View className="relative mr-5">
            <View
              className="w-[88px] h-[88px] rounded-full border-[3px] items-center justify-center"
              style={{ borderColor: theme.accent }}
            >
              <View
                className="w-[76px] h-[76px] rounded-full overflow-hidden items-center justify-center"
                style={{ backgroundColor: theme.surfaceRaised }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="font-black text-3xl pt-1" style={{ color: theme.accentSoft }}>
                    {initial}
                  </Text>
                )}
              </View>
            </View>

            <View
              className="absolute bottom-[-2px] right-[-2px] rounded-full p-[3px]"
              style={{ backgroundColor: theme.background }}
            >
              <View
                className="rounded-full px-1.5 py-0.5 border"
                style={{
                  backgroundColor: withOpacity(theme.accent, isDark ? 0.18 : 0.1),
                  borderColor: withOpacity(theme.accent, 0.4),
                }}
              >
                <Text className="text-[9px] font-bold" style={{ color: theme.accentSoft }}>
                  {accountHealthBadge}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[22px] font-black tracking-tight" style={{ color: theme.text }}>
              {firstName}
            </Text>
            <Text className="text-[12px] font-semibold mt-0.5" style={{ color: theme.accentSoft }}>
              {accountHealth.badge} - Live Score {accountHealthBadge}
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/profile/editProfile")}
              className="rounded-full px-4 py-1.5 mt-3 self-start border"
              style={{
                backgroundColor: withOpacity(theme.accent, isDark ? 0.16 : 0.1),
                borderColor: withOpacity(theme.accent, 0.2),
              }}
            >
              <Text
                className="text-[9px] font-bold tracking-[1px] uppercase pt-[1px]"
                style={{ color: theme.accentSoft }}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionTitle title="Account Settings" theme={theme} />

        <View
          className="rounded-[24px] overflow-hidden border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <TouchableOpacity
            onPress={() => router.push("/profile/personalInformation")}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-5"
          >
            <View className="flex-row items-center gap-4">
              <MaterialCommunityIcons name="account" size={20} color={theme.textSoft} />
              <Text className="font-bold text-[15px]" style={{ color: theme.text }}>
                Personal Information
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSubtle} />
          </TouchableOpacity>
        </View>

        <SectionTitle title="Notifications" theme={theme} />

        <View
          className="rounded-[24px] overflow-hidden border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="flex-row items-start p-5">
            <View className="flex-1 mr-4">
              <Text className="font-bold text-[15px]" style={{ color: theme.text }}>
                Daily Reminder
              </Text>
              <Text className="text-[11px] mt-1 font-medium leading-[16px]" style={{ color: theme.textMuted }}>
                {reminderDescription}
              </Text>
            </View>

            <View className="pt-0.5">
              <Switch
                value={dailyReminder}
                onValueChange={handleDailyReminderToggle}
                disabled={!isReminderReady || isReminderUpdating}
                trackColor={{
                  false: isDark ? "#1E222E" : "#D0D9E8",
                  true: theme.accentSoft,
                }}
                thumbColor={dailyReminder ? theme.accentContrast : isDark ? "#8E93A6" : "#6E7B91"}
                ios_backgroundColor={isDark ? "#1E222E" : "#D0D9E8"}
              />
            </View>
          </View>
        </View>

        <SectionTitle title="App Preferences" theme={theme} />

        <View
          className="rounded-[24px] p-5 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 pr-4">
              <Text
                className="text-[9px] font-bold tracking-[2px] uppercase mb-2"
                style={{ color: theme.textMuted }}
              >
                Theme
              </Text>
              <Text className="text-[15px] font-bold" style={{ color: theme.text }}>
                Pick the app version you want to keep by default
              </Text>
            </View>

            {isThemeUpdating ? (
              <View
                className="px-3 py-1.5 rounded-full border"
                style={{
                  backgroundColor: withOpacity(theme.accent, 0.1),
                  borderColor: withOpacity(theme.accent, 0.18),
                }}
              >
                <Text className="text-[10px] font-bold uppercase tracking-[1.6px]" style={{ color: theme.accent }}>
                  Saving
                </Text>
              </View>
            ) : null}
          </View>

          <View className="flex-row gap-3">
            {themeOptions.map((option) => {
              const isActive = themeName === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  activeOpacity={0.85}
                  disabled={isThemeUpdating}
                  onPress={() => handleThemeSelection(option.key)}
                  className="flex-1 rounded-[22px] p-4 border"
                  style={{
                    backgroundColor: isActive
                      ? withOpacity(theme.accent, isDark ? 0.16 : 0.1)
                      : theme.surfaceAlt,
                    borderColor: isActive ? withOpacity(theme.accent, 0.35) : theme.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View
                      className="w-11 h-11 rounded-full items-center justify-center border"
                      style={{
                        backgroundColor: isActive
                          ? withOpacity(theme.accent, isDark ? 0.22 : 0.12)
                          : theme.surfaceSoft,
                        borderColor: isActive ? withOpacity(theme.accent, 0.28) : theme.border,
                      }}
                    >
                      <Feather
                        name={option.icon}
                        size={18}
                        color={isActive ? theme.accent : theme.textMuted}
                      />
                    </View>

                    {isActive ? (
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{ backgroundColor: theme.accent }}
                      >
                        <Feather name="check" size={14} color={theme.tabActiveIcon} />
                      </View>
                    ) : null}
                  </View>

                  <Text className="text-[15px] font-bold mb-1" style={{ color: theme.text }}>
                    {option.label}
                  </Text>
                  <Text className="text-[11px] leading-[16px]" style={{ color: theme.textMuted }}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mt-8 mb-8 rounded-[32px] overflow-hidden shadow-2xl" style={{ shadowColor: theme.accent }}>
          <LinearGradient
            colors={healthGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, paddingVertical: 28 }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-1 pr-6">
                <Text className="font-black text-[18px]" style={{ color: healthHeadingColor }}>
                  Account Health
                </Text>
                <Text
                  className="font-bold text-[13px] mt-1 leading-5"
                  style={{ color: withOpacity(healthBodyColor, 0.82) }}
                >
                  {accountHealth.message}
                </Text>
              </View>

              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: withOpacity(healthBodyColor, isDark ? 0.1 : 0.12) }}
              >
                <MaterialCommunityIcons
                  name={isHealthRefreshing ? "refresh" : "star-four-points"}
                  size={24}
                  color={healthHeadingColor}
                />
              </View>
            </View>

            <View className="flex-row items-baseline mt-2">
              <Text
                className="font-black text-[46px] leading-[48px] tracking-tight"
                style={{ color: healthHeadingColor }}
              >
                {accountHealth.score.toFixed(1)}
              </Text>
              <Text
                className="font-black text-[10px] tracking-widest uppercase ml-2"
                style={{ color: healthBodyColor }}
              >
                Live Score
              </Text>
            </View>

            <Text
              className="font-black text-[11px] tracking-[2px] uppercase mt-2"
              style={{ color: healthBodyColor }}
            >
              {accountHealth.headline}
            </Text>

            <View className="flex-row gap-3 mt-6">
              {accountHealth.stats.map((item) => (
                <View
                  key={item.label}
                  className="flex-1 rounded-[18px] border px-3 py-3"
                  style={{
                    backgroundColor: withOpacity(healthBodyColor, isDark ? 0.12 : 0.1),
                    borderColor: withOpacity(healthBodyColor, 0.12),
                  }}
                >
                  <Text
                    className="text-[8px] font-black tracking-[1.6px] uppercase mb-1"
                    style={{ color: withOpacity(healthBodyColor, 0.72) }}
                  >
                    {item.label}
                  </Text>
                  <Text className="text-[17px] font-black tracking-tight" style={{ color: healthHeadingColor }}>
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
          className="w-full flex-row items-center justify-center gap-2 border py-4 rounded-full"
          style={{
            backgroundColor: withOpacity(theme.danger, 0.1),
            borderColor: withOpacity(theme.danger, 0.2),
          }}
        >
          <Feather name="log-out" size={18} color={theme.danger} />
          <Text className="font-bold text-[15px]" style={{ color: theme.danger }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
