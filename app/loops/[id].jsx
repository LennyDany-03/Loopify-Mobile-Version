import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import HeatmapGrid from "../../components/loops/HeatmapGrid";
import SlideToComplete from "../../components/loops/SlideToComplete";
import LoopIcon from "../../components/ui/LoopIcon";
import DeleteLoopModal from "../../components/loops/DeleteLoopModal";
import RevokeLoopModal from "../../components/loops/RevokeLoopModal";
import { analyticsAPI, loopsAPI } from "../../lib/api";
import useLoopStore from "../../lib/store/useLoopStore";
import useAppTheme from "../../lib/hooks/useAppTheme";
import {
  buildWeeklyBars,
  formatNumericValue,
  formatWeekLabel,
  getLoopDescription,
  getTodayLoopEntry,
  getTodayLoopProgress,
  isLoopCompletedToday,
} from "../../lib/utils/loopMetrics";

function withOpacity(color, opacity = "33") {
  if (typeof color !== "string" || !color.startsWith("#")) {
    return color || "#72A6FF";
  }

  if (color.length === 7) {
    return `${color}${opacity}`;
  }

  return color;
}

const READABLE_TEXT_STYLE = Platform.select({
  ios: {
    fontFamily: "System",
  },
  android: {
    fontFamily: "sans-serif",
    includeFontPadding: false,
  },
  default: {
    fontFamily: "system-ui",
  },
});

function sentenceCase(value) {
  if (!value) {
    return "Unknown";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCadenceLabel(loop) {
  if (loop?.frequency === "custom" && Array.isArray(loop.custom_days) && loop.custom_days.length) {
    return loop.custom_days.join(", ");
  }

  return `${sentenceCase(loop?.frequency || "daily")} cadence`;
}

function getTargetLabel(loop) {
  if (!loop) {
    return "No target";
  }

  if (loop.target_type === "boolean") {
    return "Yes / No tracking";
  }

  const formattedValue = formatNumericValue(loop.target_value);
  const unit = loop.target_unit ? ` ${loop.target_unit}` : "";

  if (formattedValue) {
    return `${formattedValue}${unit}`;
  }

  return sentenceCase(loop.target_type);
}

function getTrackingLabel(loop) {
  if (!loop?.target_type) {
    return "Not configured";
  }

  if (loop.target_type === "boolean") {
    return "Binary completion";
  }

  if (loop.target_type === "duration") {
    return "Duration tracking";
  }

  return "Measured amount";
}

function formatLastCheckin(dateValue) {
  if (!dateValue) {
    return "No check-ins yet";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "No check-ins yet";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildLoopWeeklyBars(weeks = [], targetValue = null) {
  const trendData = weeks.slice(-7).map((entry) => ({
    key: entry.week,
    label: formatWeekLabel(entry.week),
    count: entry.count || 0,
    value: 0,
  }));

  return buildWeeklyBars(trendData, 7, targetValue);
}

function getServerYear(serverDate) {
  if (!serverDate) {
    return new Date().getFullYear();
  }

  const parsedDate = new Date(`${serverDate}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
}

function getTodayProgressLabel(loop, progress) {
  if (loop?.target_type === "boolean") {
    return progress.completed ? "Completed" : `${formatNumericValue(progress.value) || "0"} / 1 today`;
  }

  const current = formatNumericValue(progress.value) || "0";
  const target = formatNumericValue(progress.target) || "0";
  const unit = loop?.target_unit ? ` ${loop.target_unit}` : "";

  return `${current} / ${target}${unit}`;
}

function getSwipeHint(loop) {
  if (loop?.target_type === "boolean") {
    return "One confident swipe locks today in.";
  }

  return `Each swipe adds 1 ${loop?.target_unit || "unit"} to today's loop.`;
}

function getRemainingLabel(loop, progress, isCompletedToday) {
  if (loop?.target_type === "boolean") {
    return isCompletedToday
      ? "Today's completion is locked in."
      : "Waiting for today's first check-in.";
  }

  if (isCompletedToday) {
    return "Today's target is complete.";
  }

  return `${formatNumericValue(progress.remaining) || "0"} ${
    loop?.target_unit || "unit"
  } left to finish today.`;
}

function getUndoCopy(loop, progress, isCompletedToday) {
  if (loop?.target_type === "boolean") {
    return {
      title: "Revoke Loop's completion",
      subtitle: "This removes today's check-in and unlocks the loop again.",
      buttonLabel: "Undo",
    };
  }

  const current = formatNumericValue(progress.value) || "0";
  const target = formatNumericValue(progress.target) || "0";
  const unit = loop?.target_unit ? ` ${loop.target_unit}` : "";

  return {
    title: isCompletedToday ? "Revoke today's finish" : "Clear today's progress",
    subtitle: `Reset today's ${current} / ${target}${unit} progress back to zero.`,
    buttonLabel: isCompletedToday ? "Revoke" : "Clear",
  };
}

function buildOptimisticTodayEntry(loop, progress, serverDate) {
  if (!loop) {
    return null;
  }

  const fallbackDate = serverDate || new Date().toISOString().slice(0, 10);

  if (loop.target_type === "boolean") {
    return {
      ...progress.entry,
      loop_id: loop.id,
      date: progress.entry?.date || fallbackDate,
      value: 1,
      completed: true,
    };
  }

  const target = Number(progress.target ?? loop.target_value ?? 0);
  const currentValue = Number(progress.rawValue ?? progress.value ?? 0);
  const safeValue = Number.isFinite(currentValue) ? Math.max(currentValue, 0) : 0;
  const nextValue = target > 0 ? Math.min(safeValue + 1, target) : safeValue + 1;

  return {
    ...progress.entry,
    loop_id: loop.id,
    date: progress.entry?.date || fallbackDate,
    value: nextValue,
    completed: target > 0 ? nextValue >= target : !!progress.entry?.completed,
  };
}

function StatusPill({ label, tone = "#DDE8FF", background = "#08111D", border = "#FFFFFF24" }) {
  return (
    <View
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: background,
        borderColor: border,
      }}
    >
      <Text
        className="text-[11px] font-bold tracking-[2px] uppercase"
        style={[READABLE_TEXT_STYLE, { color: tone }]}
      >
        {label}
      </Text>
    </View>
  );
}

function MetricCard({ label, value, hint, accentColor, theme }) {
  return (
    <View className="flex-1 rounded-[26px] overflow-hidden border" style={{ borderColor: theme.border }}>
      <LinearGradient
        colors={theme.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 18, minHeight: 132 }}
      >
        <Text
          className="text-[10px] font-bold tracking-[1.6px] uppercase mb-3"
          style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
        >
          {label}
        </Text>
        <Text
          style={[READABLE_TEXT_STYLE, { color: accentColor }]}
          className="text-[34px] font-black tracking-tight"
        >
          {value}
        </Text>
        <Text className="text-xs font-medium mt-2" style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}>
          {hint}
        </Text>
      </LinearGradient>
    </View>
  );
}

function MetaRow({ icon, label, value, accentColor, theme }) {
  return (
    <View
      className="flex-row items-center rounded-[22px] px-4 py-4 border"
      style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
    >
      <View
        className="w-11 h-11 rounded-full items-center justify-center mr-4 border"
        style={{
          backgroundColor: withOpacity(accentColor, "18"),
          borderColor: withOpacity(accentColor, "2E"),
        }}
      >
        <Feather name={icon} size={18} color={accentColor} />
      </View>
      <View className="flex-1">
        <Text
          className="text-[10px] font-bold tracking-[1.6px] uppercase mb-1"
          style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
        >
          {label}
        </Text>
        <Text className="text-[15px] font-semibold" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function UndoActionCard({
  accentColor,
  title,
  subtitle,
  buttonLabel,
  isUndoing,
  onPress,
  theme,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={isUndoing}
      onPress={onPress}
      className="rounded-[26px] overflow-hidden border mb-4"
      style={{ borderColor: theme.border }}
    >
      <LinearGradient
        colors={theme.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4 border"
            style={{
              backgroundColor: withOpacity("#FF9D73", "16"),
              borderColor: withOpacity("#FF9D73", "30"),
            }}
          >
            <Feather name="rotate-ccw" size={18} color="#FF9D73" />
          </View>

          <View className="flex-1 pr-3">
            <Text className="text-[15px] font-bold tracking-tight" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
              {title}
            </Text>
            <Text
              className="text-[12px] font-medium mt-1 leading-5"
              style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}
            >
              {subtitle}
            </Text>
          </View>

          <View
            className="px-4 py-2.5 rounded-full border"
            style={{
              backgroundColor: withOpacity(accentColor, "18"),
              borderColor: withOpacity(accentColor, "2E"),
            }}
          >
            <Text
              style={[READABLE_TEXT_STYLE, { color: accentColor }]}
              className="text-[11px] font-bold tracking-[1.6px] uppercase"
            >
              {isUndoing ? "Working" : buttonLabel}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function LoopDetail() {
  const { theme, isDark } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const loopId = Array.isArray(id) ? id[0] : id;

  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const serverDate = useLoopStore((state) => state.serverDate);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const checkinLoop = useLoopStore((state) => state.checkinLoop);
  const deleteLoop = useLoopStore((state) => state.deleteLoop);
  const undoTodayCheckin = useLoopStore((state) => state.undoTodayCheckin);

  const [loop, setLoop] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [weeklyBars, setWeeklyBars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isRevokeModalVisible, setIsRevokeModalVisible] = useState(false);
  const [optimisticTodayEntry, setOptimisticTodayEntry] = useState(null);
  const [error, setError] = useState(null);

  const hasLoopRef = useRef(false);
  const previousServerDateRef = useRef(serverDate);

  useEffect(() => {
    hasLoopRef.current = !!loop;
  }, [loop]);

  const loadLoopDetail = useCallback(
    async ({ silent = false } = {}) => {
      if (!loopId) {
        setError("Missing loop id.");
        setIsLoading(false);
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      if (!silent) {
        setError(null);
      }

      try {
        const todayData = await fetchTodayCheckins();
        const activeServerDate = todayData?.server_date || serverDate;
        const serverYear = getServerYear(activeServerDate);

        const [loopRes, streakRes, heatmapRes, weeklyRes] = await Promise.all([
          loopsAPI.getOne(loopId),
          analyticsAPI.streak(loopId),
          analyticsAPI.heatmap(loopId, serverYear),
          analyticsAPI.weekly(loopId),
        ]);

        const mergedLoop = {
          ...loopRes.data,
          ...streakRes.data,
          title: loopRes.data?.name,
        };

        setLoop(mergedLoop);
        setHeatmap(heatmapRes.data?.heatmap || []);
        setWeeklyBars(
          buildLoopWeeklyBars(
            weeklyRes.data?.weeks || [],
            loopRes.data?.target_type === "boolean" ? 1 : loopRes.data?.target_value
          )
        );
      } catch (err) {
        if (!silent || !hasLoopRef.current) {
          setError(err.response?.data?.detail || "Failed to load loop details.");
        }
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [fetchTodayCheckins, loopId, serverDate]
  );

  useEffect(() => {
    loadLoopDetail();
  }, [loadLoopDetail]);

  useEffect(() => {
    if (!loopId) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadLoopDetail({ silent: true });
    }, 30000);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadLoopDetail({ silent: true });
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [loadLoopDetail, loopId]);

  useEffect(() => {
    if (!serverDate || !hasLoopRef.current || previousServerDateRef.current === serverDate) {
      previousServerDateRef.current = serverDate;
      return;
    }

    previousServerDateRef.current = serverDate;
    loadLoopDetail({ silent: true });
  }, [loadLoopDetail, serverDate]);

  async function handleComplete() {
    if (!loopId || !loop || isCompleting || isUndoing || isDeleting) {
      return { success: false };
    }

    setIsCompleting(true);
    setOptimisticTodayEntry(buildOptimisticTodayEntry(loop, todayProgress, serverDate));

    const incrementValue = loop?.target_type === "boolean" ? null : 1;
    const result = await checkinLoop(loopId, incrementValue);

    if (result.success) {
      setOptimisticTodayEntry(null);
      setIsCompleting(false);
      void Promise.allSettled([fetchSummary(), loadLoopDetail({ silent: true })]);
      return result;
    }

    setOptimisticTodayEntry(null);
    setIsCompleting(false);
    Alert.alert("Check-in failed", result.error || "Unable to log progress right now.");
    return result;
  }

  async function handleUndoToday() {
    if (!loopId || isUndoing) {
      return;
    }

    setIsUndoing(true);
    const result = await undoTodayCheckin(loopId);

    if (result.success) {
      await Promise.all([fetchSummary(), fetchTodayCheckins()]);
      await loadLoopDetail({ silent: true });
      setIsUndoing(false);
      return;
    }

    setIsUndoing(false);
    Alert.alert("Undo failed", result.error || "Unable to revoke today's progress right now.");
  }

  async function handleDeleteLoop() {
    if (!loopId || isDeleting) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteLoop(loopId);

    if (result.success) {
      await Promise.all([fetchSummary(), fetchTodayCheckins()]);
      router.replace("/(tabs)/loops");
      return;
    }

    setIsDeleting(false);
    Alert.alert("Delete failed", result.error || "Unable to delete this loop right now.");
  }

  function promptDeleteLoop() {
    if (!loop) {
      return;
    }

    setIsDeleteModalVisible(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.accentStrong} />
      </SafeAreaView>
    );
  }

  if (!loop) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBarStyle} />
        <Text className="text-base text-center mb-4" style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}>
          {error || "Loop details are unavailable right now."}
        </Text>
        <TouchableOpacity
          onPress={() => loadLoopDetail()}
          activeOpacity={0.85}
          className="px-5 py-3 rounded-full border"
          style={{ backgroundColor: theme.surface, borderColor: theme.borderStrong }}
        >
          <Text className="font-semibold" style={[READABLE_TEXT_STYLE, { color: theme.accentSoft }]}>
            Try again
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const accentColor = loop.color || theme.accentStrong;
  const heroGradient = isDark ? ["#122241", "#08192D", "#05070D"] : ["#FFFFFF", "#E6F0FF", "#F6FAFF"];
  const progressGradient = isDark ? ["#0A1020", "#0A0E17"] : ["#FFFFFF", "#F2F7FF"];
  const todayCheckinKey = loop?.id ? String(loop.id) : loopId ? String(loopId) : null;
  const effectiveTodayCheckins =
    optimisticTodayEntry && todayCheckinKey
      ? { ...todayCheckins, [todayCheckinKey]: optimisticTodayEntry }
      : todayCheckins;
  const todayProgress = getTodayLoopProgress(loop, effectiveTodayCheckins);
  const actualTodayEntry = getTodayLoopEntry(loop, todayCheckins);
  const isCompletedToday = isLoopCompletedToday(loop, effectiveTodayCheckins);
  const canUndoToday = !!actualTodayEntry?.id;
  const todayPercent = todayProgress.percent || 0;
  const progressLabel = getTodayProgressLabel(loop, todayProgress);
  const recentCheckins = weeklyBars.reduce((sum, item) => sum + (item.count || 0), 0);
  const activeWeeks = weeklyBars.filter((item) => item.count > 0).length;
  const loopDescription = getLoopDescription(loop, effectiveTodayCheckins);
  const swipeHint = getSwipeHint(loop);
  const remainingLabel = getRemainingLabel(loop, todayProgress, isCompletedToday);
  const undoCopy = getUndoCopy(loop, todayProgress, isCompletedToday);

  const statusLabel = isCompletedToday
    ? "Completed today"
    : todayProgress.value > 0
      ? `${todayPercent}% in progress`
      : "Waiting for today";

  const statusTone = isCompletedToday
    ? theme.success
    : todayProgress.value > 0
      ? accentColor
      : theme.textSoft;

  const metaRows = [
    { icon: "repeat", label: "Cadence", value: getCadenceLabel(loop) },
    { icon: "target", label: "Target", value: getTargetLabel(loop) },
    { icon: "sliders", label: "Tracking", value: getTrackingLabel(loop) },
    { icon: "clock", label: "Last Check-In", value: formatLastCheckin(loop.last_checkin_date) },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <StatusBar style={theme.statusBarStyle} />

      <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="w-11 h-11 rounded-full border items-center justify-center"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>

        <View className="flex-1 px-4 items-center">
          <Text
            className="text-[10px] font-bold tracking-[3px] uppercase mb-1"
            style={[READABLE_TEXT_STYLE, { color: theme.accentSoft }]}
          >
            Loop Detail
          </Text>
          <Text
            className="text-[17px] font-bold"
            style={[READABLE_TEXT_STYLE, { color: theme.text }]}
            numberOfLines={1}
          >
            {loop.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={promptDeleteLoop}
          disabled={isDeleting}
          activeOpacity={0.8}
          className="w-11 h-11 rounded-full border items-center justify-center"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Feather name="trash-2" size={18} color={isDeleting ? theme.textMuted : theme.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-[34px] overflow-hidden border mb-5" style={{ borderColor: theme.border }}>
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 22, paddingVertical: 24, minHeight: 262 }}
          >
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="w-[250px] h-[250px] rounded-full"
                style={{ borderWidth: 1, borderColor: withOpacity(accentColor, "16") }}
              />
            </View>
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="w-[168px] h-[168px] rounded-full"
                style={{ borderWidth: 1, borderColor: withOpacity(accentColor, "24") }}
              />
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-[10px] font-bold tracking-[2.4px] uppercase"
                style={[READABLE_TEXT_STYLE, { color: isDark ? "#B6D3FF" : theme.accent }]}
              >
                Active Protocol
              </Text>
              <StatusPill
                label={isRefreshing ? "Syncing" : "Live"}
                tone={isRefreshing ? theme.warning : accentColor}
                background={isDark ? withOpacity("#07111A", "CC") : withOpacity("#FFFFFF", "F0")}
                border={withOpacity(isRefreshing ? theme.warning : accentColor, "33")}
              />
            </View>

            <View className="flex-row justify-between items-start mb-6">
              <StatusPill
                label={loop.category || "General"}
                tone={isDark ? "#D7E6FF" : theme.text}
                background={isDark ? withOpacity("#08111D", "B8") : withOpacity("#FFFFFF", "E8")}
                border={withOpacity(accentColor, "30")}
              />
              <StatusPill
                label={statusLabel}
                tone={statusTone}
                background={isDark ? withOpacity("#0C151F", "B8") : withOpacity("#FFFFFF", "E8")}
                border={withOpacity(statusTone, "30")}
              />
            </View>

            <View
              className="w-20 h-20 rounded-[28px] items-center justify-center mb-5 border"
              style={{
                backgroundColor: withOpacity(accentColor, "22"),
                borderColor: withOpacity(isDark ? "#FFFFFF" : accentColor, isDark ? "24" : "30"),
              }}
            >
              <LoopIcon icon={loop.icon} fallback="repeat" size={34} color={isDark ? "#F3F7FF" : accentColor} />
            </View>

            <Text
              className="text-[36px] font-black tracking-tight leading-10 mb-2"
              style={[READABLE_TEXT_STYLE, { color: theme.text }]}
            >
              {loop.name}
            </Text>
            <Text
              className="text-[14px] font-medium leading-6"
              style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}
            >
              {loopDescription}
            </Text>

            <View className="flex-row flex-wrap gap-3 mt-6">
              <View
                className="px-4 py-3 rounded-[18px] border min-w-[132px]"
                style={{
                  backgroundColor: isDark ? withOpacity("#08111D", "B5") : withOpacity("#FFFFFF", "EA"),
                  borderColor: withOpacity(accentColor, "24"),
                }}
              >
                <Text
                  className="text-[10px] font-bold tracking-[1.4px] uppercase mb-1"
                  style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
                >
                  Cadence
                </Text>
                <Text className="text-sm font-semibold" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
                  {getCadenceLabel(loop)}
                </Text>
              </View>

              <View
                className="px-4 py-3 rounded-[18px] border min-w-[132px]"
                style={{
                  backgroundColor: isDark ? withOpacity("#08111D", "B5") : withOpacity("#FFFFFF", "EA"),
                  borderColor: withOpacity(accentColor, "24"),
                }}
              >
                <Text
                  className="text-[10px] font-bold tracking-[1.4px] uppercase mb-1"
                  style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
                >
                  Target
                </Text>
                <Text className="text-sm font-semibold" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
                  {getTargetLabel(loop)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="flex-row gap-3 mb-5">
          <MetricCard
            label="Current Streak"
            value={String(loop.current_streak || 0)}
            hint="days in motion"
            accentColor={accentColor}
            theme={theme}
          />
          <MetricCard
            label="Best Streak"
            value={String(loop.best_streak || 0)}
            hint="personal record"
            accentColor={isDark ? "#9BC0FF" : theme.accent}
            theme={theme}
          />
          <MetricCard
            label="Total Check-Ins"
            value={String(loop.total_checkins || 0)}
            hint="all-time completions"
            accentColor={theme.success}
            theme={theme}
          />
        </View>

        <View className="rounded-[30px] overflow-hidden border mb-5" style={{ borderColor: theme.border }}>
          <LinearGradient
            colors={progressGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 20, paddingVertical: 20 }}
          >
            <View className="flex-row items-end justify-between mb-4">
              <View className="flex-1 pr-4">
                <Text
                  className="text-[10px] font-bold tracking-[2.4px] uppercase mb-1"
                  style={[READABLE_TEXT_STYLE, { color: theme.accentSoft }]}
                >
                  Today&apos;s Progress
                </Text>
                <Text
                  className="text-[28px] font-black tracking-tight mb-1"
                  style={[READABLE_TEXT_STYLE, { color: theme.text }]}
                >
                  {progressLabel}
                </Text>
                <Text
                  className="text-[13px] font-medium leading-5"
                  style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}
                >
                  {remainingLabel}
                </Text>
              </View>

              <View
                className="w-[78px] h-[78px] rounded-full items-center justify-center border"
                style={{
                  backgroundColor: withOpacity(accentColor, "14"),
                  borderColor: withOpacity(accentColor, "2A"),
                }}
              >
                <Text
                  style={[READABLE_TEXT_STYLE, { color: accentColor }]}
                  className="text-[24px] font-black tracking-tight"
                >
                  {todayPercent}%
                </Text>
              </View>
            </View>

            <View className="h-3 rounded-full overflow-hidden mb-4" style={{ backgroundColor: theme.surfaceSoft }}>
              <View
                className="h-full rounded-full"
                style={{
                  width: `${todayPercent}%`,
                  backgroundColor: accentColor,
                }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-semibold" style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}>
                {swipeHint}
              </Text>
              <Text
                style={[READABLE_TEXT_STYLE, { color: accentColor }]}
                className="text-[11px] font-bold tracking-[1.6px] uppercase"
              >
                {loop.target_type === "boolean" ? "1 swipe" : "+1 per swipe"}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View className="rounded-[28px] p-5 border mb-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <View className="flex-row items-end justify-between mb-4">
            <View>
              <Text
                className="text-[10px] font-bold tracking-[2.4px] uppercase mb-1"
                style={[READABLE_TEXT_STYLE, { color: theme.accentSoft }]}
              >
                Loop DNA
              </Text>
              <Text className="text-xl font-bold tracking-tight" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
                Behavior profile
              </Text>
            </View>
            <Text
              className="text-[10px] font-bold tracking-[1.4px] uppercase"
              style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
            >
              Server Synced
            </Text>
          </View>

          <View className="gap-3">
            {metaRows.map((row) => (
              <MetaRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
                accentColor={accentColor}
                theme={theme}
              />
            ))}
          </View>
        </View>

        <View className="rounded-[28px] p-5 border mb-5" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <View className="flex-row items-end justify-between mb-5">
            <View className="flex-1 pr-4">
              <Text
                className="text-[10px] font-bold tracking-[2.4px] uppercase mb-1"
                style={[READABLE_TEXT_STYLE, { color: theme.accentSoft }]}
              >
                Weekly Pulse
              </Text>
              <Text className="text-xl font-bold tracking-tight mb-1" style={[READABLE_TEXT_STYLE, { color: theme.text }]}>
                Recent momentum
              </Text>
              <Text
                className="text-[12px] font-medium leading-5"
                style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}
              >
                {recentCheckins
                  ? `${recentCheckins} completions across ${activeWeeks} active week${
                      activeWeeks === 1 ? "" : "s"
                    }.`
                  : "No weekly activity yet. Your next check-in starts the trend."}
              </Text>
            </View>

            <StatusPill
              label="Last 7 Weeks"
              tone={accentColor}
              background={withOpacity(accentColor, "12")}
              border={withOpacity(accentColor, "28")}
            />
          </View>

          <View className="flex-row items-end justify-between h-28">
            {weeklyBars.map((bar) => (
              <View key={bar.key} className="items-center flex-1">
                <Text
                  className="text-[10px] font-bold mb-2"
                  style={[READABLE_TEXT_STYLE, { color: bar.active ? accentColor : theme.textMuted }]}
                >
                  {bar.count}
                </Text>
                <View className="h-20 w-full items-center justify-end">
                  <View
                    className="w-7 rounded-t-[12px] rounded-b-[8px]"
                    style={{
                      height: `${bar.height}%`,
                      backgroundColor: bar.active ? accentColor : theme.surfaceSoft,
                      opacity: bar.active ? 1 : 0.8,
                    }}
                  />
                </View>
                <Text
                  className="text-[9px] font-bold tracking-[1px] mt-3"
                  style={[READABLE_TEXT_STYLE, { color: theme.textMuted }]}
                >
                  {bar.label.replace("WK ", "")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <HeatmapGrid
          data={heatmap}
          color={accentColor}
          targetValue={loop.target_value}
          targetType={loop.target_type}
        />
      </ScrollView>

      <View
        className="px-4 pb-4 pt-3 border-t"
        style={{ borderColor: theme.border, backgroundColor: theme.background }}
      >
        {canUndoToday ? (
          <UndoActionCard
            accentColor={accentColor}
            title={undoCopy.title}
            subtitle={undoCopy.subtitle}
            buttonLabel={undoCopy.buttonLabel}
            isUndoing={isUndoing}
            onPress={() => setIsRevokeModalVisible(true)}
            theme={theme}
          />
        ) : null}

        <Text
          className="text-[11px] font-semibold tracking-[1.4px] uppercase mb-3 text-center"
          style={[READABLE_TEXT_STYLE, { color: theme.textSoft }]}
        >
          {isCompletedToday
            ? canUndoToday
              ? "Today is secured. Undo is available below if needed."
              : "Today is secured."
            : loop.target_type === "boolean"
              ? "Complete this loop to keep the streak alive."
              : "Swipe to build today's progress in real time."}
        </Text>

        <SlideToComplete
          onComplete={handleComplete}
          isCompleted={isCompletedToday}
          progressPercent={todayPercent}
          trackLabel={loop.target_type === "boolean" ? "Slide to complete" : "Slide to add 1"}
          progressLabel={progressLabel}
          completionLabel={
            loop.target_type === "boolean"
              ? "Loop completed for today"
              : "Target reached for today"
          }
          accentColor={accentColor}
          disabled={isUndoing || isDeleting || isCompleting}
        />
      </View>

      <DeleteLoopModal
        isVisible={isDeleteModalVisible}
        loopName={loop.name}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          handleDeleteLoop();
        }}
      />

      <RevokeLoopModal
        isVisible={isRevokeModalVisible}
        title={undoCopy.title}
        subtitle={undoCopy.subtitle}
        confirmLabel={undoCopy.buttonLabel}
        onCancel={() => setIsRevokeModalVisible(false)}
        onConfirm={() => {
          setIsRevokeModalVisible(false);
          handleUndoToday();
        }}
      />
    </SafeAreaView>
  );
}
