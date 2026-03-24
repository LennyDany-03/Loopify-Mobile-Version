import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import useLoopStore from "../../lib/store/useLoopStore";
import DeleteLoopModal from "../../components/loops/DeleteLoopModal";
import { analyticsAPI, loopsAPI } from "../../lib/api";
import {
  buildWeeklyBars,
  formatNumericValue,
  formatWeekLabel,
  getLoopDescription,
  getRecentWeekKeys,
  getTodayLoopProgress,
  isLoopCompletedToday,
} from "../../lib/utils/loopMetrics";

function withOpacity(color, opacity = "33") {
  if (typeof color !== "string" || !color.startsWith("#")) {
    return color || "#4F8EF7";
  }

  if (color.length === 7) {
    return `${color}${opacity}`;
  }

  return color;
}

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

function buildLoopWeeklyBars(weeks = []) {
  const weekKeys = getRecentWeekKeys(7);
  const countsByWeek = new Map(weeks.map((entry) => [entry.week, entry.count || 0]));

  const trendData = weekKeys.map((weekKey) => ({
    key: weekKey,
    label: formatWeekLabel(weekKey),
    count: countsByWeek.get(weekKey) || 0,
    value: 0,
  }));

  return buildWeeklyBars(trendData, 7);
}

function getTodayProgressLabel(loop, progress) {
  if (loop?.target_type === "boolean") {
    return progress.completed ? "Completed" : "1 / 1 today";
  }

  const current = formatNumericValue(progress.value) || "0";
  const target = formatNumericValue(progress.target) || "0";
  const unit = loop?.target_unit ? ` ${loop.target_unit}` : "";

  return `${current} / ${target}${unit}`;
}

function MetricCard({ label, value, hint, accentColor }) {
  return (
    <View className="flex-1 bg-[#0B0D14] rounded-[24px] p-4 border border-white/5">
      <Text className="text-white/45 text-[10px] font-bold tracking-[2px] uppercase mb-3">
        {label}
      </Text>
      <Text style={{ color: accentColor }} className="text-[28px] font-bold tracking-tight">
        {value}
      </Text>
      <Text className="text-white/45 text-xs font-medium mt-1">{hint}</Text>
    </View>
  );
}

function MetaRow({ icon, label, value, accentColor }) {
  return (
    <View className="flex-row items-center rounded-[22px] bg-[#11131A] px-4 py-4 border border-white/5">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: withOpacity(accentColor, "22") }}
      >
        <Feather name={icon} size={18} color={accentColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white/40 text-[10px] font-bold tracking-[2px] uppercase mb-1">
          {label}
        </Text>
        <Text className="text-white text-[15px] font-semibold">{value}</Text>
      </View>
    </View>
  );
}

export default function LoopDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const loopId = Array.isArray(id) ? id[0] : id;
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const checkinLoop = useLoopStore((state) => state.checkinLoop);
  const deleteLoop = useLoopStore((state) => state.deleteLoop);

  const [loop, setLoop] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [weeklyBars, setWeeklyBars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [error, setError] = useState(null);

  const loadLoopDetail = useCallback(async () => {
    if (!loopId) {
      setError("Missing loop id.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await fetchTodayCheckins();

      const [loopRes, streakRes, heatmapRes, weeklyRes] = await Promise.all([
        loopsAPI.getOne(loopId),
        analyticsAPI.streak(loopId),
        analyticsAPI.heatmap(loopId, new Date().getFullYear()),
        analyticsAPI.weekly(loopId),
      ]);

      const mergedLoop = {
        ...loopRes.data,
        ...streakRes.data,
        title: loopRes.data?.name,
      };

      setLoop(mergedLoop);
      setHeatmap(heatmapRes.data?.heatmap || []);
      setWeeklyBars(buildLoopWeeklyBars(weeklyRes.data?.weeks || []));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load loop details.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchTodayCheckins, loopId]);

  useEffect(() => {
    loadLoopDetail();
  }, [loadLoopDetail]);

  async function handleComplete() {
    const incrementValue = loop?.target_type === "boolean" ? null : 1;
    const result = await checkinLoop(loopId, incrementValue);

    if (result.success) {
      await Promise.all([fetchSummary(), fetchTodayCheckins()]);
      await loadLoopDetail();
      return result;
    }

    Alert.alert("Check-in failed", result.error || "Unable to log progress right now.");
    return result;
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
      <SafeAreaView className="flex-1 bg-[#050508] items-center justify-center">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#4F8EF7" />
      </SafeAreaView>
    );
  }

  if (!loop) {
    return (
      <SafeAreaView className="flex-1 bg-[#050508] items-center justify-center px-6">
        <StatusBar style="light" />
        <Text className="text-white/70 text-base text-center mb-4">
          {error || "Loop details are unavailable right now."}
        </Text>
        <TouchableOpacity
          onPress={loadLoopDetail}
          activeOpacity={0.85}
          className="px-5 py-3 rounded-full bg-[#11131A] border border-white/10"
        >
          <Text className="text-[#7DA7FF] font-semibold">Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const accentColor = loop.color || "#4F8EF7";
  const todayProgress = getTodayLoopProgress(loop, todayCheckins);
  const isCompletedToday = isLoopCompletedToday(loop, todayCheckins);
  const todayPercent = todayProgress.percent || 0;
  const progressLabel = getTodayProgressLabel(loop, todayProgress);
  const recentCheckins = weeklyBars.reduce((sum, item) => sum + (item.count || 0), 0);
  const activeWeeks = weeklyBars.filter((item) => item.count > 0).length;
  const statusLabel = isCompletedToday
    ? "Completed today"
    : todayProgress.value > 0
      ? `${todayPercent}% in progress`
      : "Ready for today";
  const statusTone = isCompletedToday
    ? "#88F0B6"
    : todayProgress.value > 0
      ? accentColor
      : "#DDE8FF";
  const loopDescription = getLoopDescription(loop, todayCheckins);
  const swipeHint =
    loop.target_type === "boolean"
      ? "One swipe completes today's loop."
      : `Each swipe adds 1 ${loop.target_unit || "unit"} toward today's target.`;
  const remainingLabel =
    loop.target_type === "boolean"
      ? isCompletedToday
        ? "Today's completion is locked in."
        : "1 swipe left to finish today."
      : isCompletedToday
        ? "Today's target is complete."
        : `${formatNumericValue(todayProgress.remaining) || "0"} swipe${
            Number(todayProgress.remaining) === 1 ? "" : "s"
          } left to finish.`;
  const metaRows = [
    { icon: "repeat", label: "Cadence", value: getCadenceLabel(loop) },
    { icon: "target", label: "Target", value: getTargetLabel(loop) },
    { icon: "sliders", label: "Tracking", value: getTrackingLabel(loop) },
    { icon: "clock", label: "Last Check-In", value: formatLastCheckin(loop.last_checkin_date) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <StatusBar style="light" />

      <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="w-11 h-11 rounded-full bg-[#0F1218] border border-white/5 items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#DCE8FF" />
        </TouchableOpacity>

        <View className="flex-1 px-4 items-center">
          <Text className="text-[#7DA7FF] text-[10px] font-bold tracking-[3px] uppercase mb-1">
            Loop Detail
          </Text>
          <Text className="text-white text-base font-bold" numberOfLines={1}>
            {loop.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={promptDeleteLoop}
          disabled={isDeleting}
          activeOpacity={0.8}
          className="w-11 h-11 rounded-full bg-[#0F1218] border border-white/5 items-center justify-center"
        >
          <Feather name="trash-2" size={18} color={isDeleting ? "#ffffff40" : "#FF8E92"} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-[32px] overflow-hidden border border-white/5 mb-5">
          <LinearGradient
            colors={[withOpacity(accentColor, "50"), "#112038", "#050508"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 22, paddingVertical: 24, minHeight: 230 }}
          >
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="w-[250px] h-[250px] rounded-full"
                style={{ borderWidth: 1, borderColor: withOpacity(accentColor, "20") }}
              />
            </View>
            <View className="absolute inset-0 items-center justify-center">
              <View
                className="w-[170px] h-[170px] rounded-full"
                style={{ borderWidth: 1, borderColor: withOpacity(accentColor, "28") }}
              />
            </View>

            <View className="flex-row justify-between items-start mb-6">
              <View
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: withOpacity("#08111D", "A6"),
                  borderColor: withOpacity(accentColor, "30"),
                }}
              >
                <Text className="text-[#D7E6FF] text-[11px] font-bold tracking-[2px] uppercase">
                  {loop.category || "General"}
                </Text>
              </View>

              <View
                className="px-4 py-2 rounded-full border"
                style={{
                  backgroundColor: withOpacity("#0C151F", "A6"),
                  borderColor: withOpacity(statusTone, "30"),
                }}
              >
                <Text
                  className="text-[11px] font-bold tracking-[2px] uppercase"
                  style={{ color: statusTone }}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-5"
              style={{
                backgroundColor: withOpacity(accentColor, "22"),
                borderWidth: 1,
                borderColor: withOpacity("#FFFFFF", "24"),
              }}
            >
              <LoopIcon icon={loop.icon} fallback="repeat" size={34} color="#F3F7FF" />
            </View>

            <Text className="text-white text-[29px] font-bold tracking-tight mb-2">
              {loop.name}
            </Text>
            <Text className="text-[#DBE7FF]/70 text-[14px] font-medium leading-6">
              {loopDescription}
            </Text>

            <View className="flex-row flex-wrap gap-3 mt-6">
              <View
                className="px-4 py-3 rounded-[18px] border"
                style={{
                  backgroundColor: withOpacity("#08111D", "A6"),
                  borderColor: withOpacity(accentColor, "24"),
                }}
              >
                <Text className="text-white/45 text-[10px] font-bold tracking-[2px] uppercase mb-1">
                  Cadence
                </Text>
                <Text className="text-white text-sm font-semibold">{getCadenceLabel(loop)}</Text>
              </View>

              <View
                className="px-4 py-3 rounded-[18px] border"
                style={{
                  backgroundColor: withOpacity("#08111D", "A6"),
                  borderColor: withOpacity(accentColor, "24"),
                }}
              >
                <Text className="text-white/45 text-[10px] font-bold tracking-[2px] uppercase mb-1">
                  Target
                </Text>
                <Text className="text-white text-sm font-semibold">{getTargetLabel(loop)}</Text>
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
          />
          <MetricCard
            label="Best Streak"
            value={String(loop.best_streak || 0)}
            hint="personal record"
            accentColor="#9BC0FF"
          />
          <MetricCard
            label="Total Check-Ins"
            value={String(loop.total_checkins || 0)}
            hint="all-time completions"
            accentColor="#88F0B6"
          />
        </View>

        <View className="bg-[#0B0D14] rounded-[28px] p-5 border border-white/5 mb-5">
          <View className="flex-row items-end justify-between mb-4">
            <View className="flex-1 pr-4">
              <Text className="text-[#7DA7FF] text-[10px] font-bold tracking-[3px] uppercase mb-1">
                Today&apos;s Progress
              </Text>
              <Text className="text-white text-xl font-bold tracking-tight mb-1">
                {progressLabel}
              </Text>
              <Text className="text-white/50 text-[12px] font-medium leading-5">
                {remainingLabel}
              </Text>
            </View>

            <View
              className="w-16 h-16 rounded-full items-center justify-center border"
              style={{
                backgroundColor: withOpacity(accentColor, "16"),
                borderColor: withOpacity(accentColor, "28"),
              }}
            >
              <Text style={{ color: accentColor }} className="text-[19px] font-bold tracking-tight">
                {todayPercent}%
              </Text>
            </View>
          </View>

          <View className="h-3 rounded-full bg-[#171B24] overflow-hidden mb-3">
            <View
              className="h-full rounded-full"
              style={{
                width: `${todayPercent}%`,
                backgroundColor: accentColor,
              }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-white/40 text-[11px] font-semibold">{swipeHint}</Text>
            <Text style={{ color: accentColor }} className="text-[11px] font-bold">
              {loop.target_type === "boolean" ? "1 swipe" : "+1 per swipe"}
            </Text>
          </View>
        </View>

        <View className="bg-[#0B0D14] rounded-[28px] p-5 border border-white/5 mb-5">
          <View className="flex-row items-end justify-between mb-4">
            <View>
              <Text className="text-[#7DA7FF] text-[10px] font-bold tracking-[3px] uppercase mb-1">
                Loop DNA
              </Text>
              <Text className="text-white text-xl font-bold tracking-tight">Behavior profile</Text>
            </View>
            <View
              className="px-3 py-2 rounded-full"
              style={{ backgroundColor: withOpacity(accentColor, "1A") }}
            >
              <Text
                style={{ color: accentColor }}
                className="text-[10px] font-bold tracking-[2px] uppercase"
              >
                Active
              </Text>
            </View>
          </View>

          <View className="gap-3">
            {metaRows.map((row) => (
              <MetaRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
                accentColor={accentColor}
              />
            ))}
          </View>
        </View>

        <View className="bg-[#0B0D14] rounded-[28px] p-5 border border-white/5 mb-5">
          <View className="flex-row items-end justify-between mb-5">
            <View className="flex-1 pr-4">
              <Text className="text-[#7DA7FF] text-[10px] font-bold tracking-[3px] uppercase mb-1">
                Weekly Pulse
              </Text>
              <Text className="text-white text-xl font-bold tracking-tight mb-1">
                Recent momentum
              </Text>
              <Text className="text-white/50 text-[12px] font-medium leading-5">
                {recentCheckins
                  ? `${recentCheckins} completions across ${activeWeeks} active week${
                      activeWeeks === 1 ? "" : "s"
                    }.`
                  : "No weekly activity yet. Your next check-in starts the trend."}
              </Text>
            </View>

            <View
              className="px-3 py-2 rounded-full border"
              style={{
                backgroundColor: withOpacity(accentColor, "12"),
                borderColor: withOpacity(accentColor, "28"),
              }}
            >
              <Text
                style={{ color: accentColor }}
                className="text-[10px] font-bold tracking-[2px] uppercase"
              >
                Last 7 Weeks
              </Text>
            </View>
          </View>

          <View className="flex-row items-end justify-between h-28">
            {weeklyBars.map((bar) => (
              <View key={bar.key} className="items-center flex-1">
                <Text
                  className="text-[10px] font-bold mb-2"
                  style={{ color: bar.active ? accentColor : "#FFFFFF40" }}
                >
                  {bar.count}
                </Text>
                <View className="h-20 w-full items-center justify-end">
                  <View
                    className="w-7 rounded-t-[12px] rounded-b-[8px]"
                    style={{
                      height: `${bar.height}%`,
                      backgroundColor: bar.active ? accentColor : "#1A1C24",
                      opacity: bar.active ? 1 : 0.8,
                    }}
                  />
                </View>
                <Text className="text-white/40 text-[9px] font-bold tracking-[1px] mt-3">
                  {bar.label.replace("WK ", "")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <HeatmapGrid data={heatmap} color={accentColor} />
      </ScrollView>

      <View className="px-4 pb-4 pt-3 border-t border-white/5 bg-[#050508]">
        <Text className="text-white/45 text-[11px] font-semibold tracking-[2px] uppercase mb-3 text-center">
          {isCompletedToday
            ? "Today is already secured"
            : loop.target_type === "boolean"
              ? "Complete this loop to keep the streak alive"
              : "Swipe again to build progress toward today's target"}
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
    </SafeAreaView>
  );
}
