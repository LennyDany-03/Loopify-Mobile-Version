import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WeeklySummaryCard from "./WeeklySummaryCard";
import ActiveLoopCard from "./ActiveLoopCard";
import DeleteLoopModal from "./DeleteLoopModal";
import { analyticsAPI } from "../../lib/api";
import useLoopStore from "../../lib/store/useLoopStore";
import {
  aggregateWeeklyCounts,
  buildWeeklyBars,
  normalizeLoop,
} from "../../lib/utils/loopMetrics";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function LoopsScreen() {
  const { theme, isDark } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [weeklyBars, setWeeklyBars] = useState([]);
  const [weeklyHeadline, setWeeklyHeadline] = useState(
    "Weekly momentum will show up after your first few check-ins."
  );
  const [weeklySubhead, setWeeklySubhead] = useState("Recent weeks");
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

  const loops = useLoopStore((state) => state.loops);
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const isLoading = useLoopStore((state) => state.isLoading);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const deleteLoop = useLoopStore((state) => state.deleteLoop);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [loopToDelete, setLoopToDelete] = useState(null);
  const hasLoaded = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;
    fetchLoops();
    fetchTodayCheckins();
  }, [fetchLoops, fetchTodayCheckins]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLoops(), fetchTodayCheckins()]);
    setRefreshing(false);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadWeeklySummary() {
      if (!loops.length) {
        setWeeklyBars([]);
        setWeeklyHeadline("Weekly momentum will show up after your first few check-ins.");
        setWeeklySubhead("Recent weeks");
        return;
      }

      setIsWeeklyLoading(true);

      try {
        const weeklyData = await Promise.all(
          loops.map(async (loop) => {
            const res = await analyticsAPI.weekly(loop.id);
            return { loop, weeks: res.data?.weeks || [] };
          })
        );

        if (isCancelled) {
          return;
        }

        const trendData = aggregateWeeklyCounts(weeklyData);
        const bars = buildWeeklyBars(trendData);
        const totalRecentCheckins = bars.reduce((sum, item) => sum + item.count, 0);
        const activeWeeks = bars.filter((item) => item.count > 0).length;

        setWeeklyBars(bars);

        if (totalRecentCheckins > 0) {
          setWeeklyHeadline(`${totalRecentCheckins} check-ins across the last ${bars.length} weeks.`);
          setWeeklySubhead(
            activeWeeks > 0
              ? `${activeWeeks} active week${activeWeeks === 1 ? "" : "s"}`
              : "Recent weeks"
          );
        } else {
          setWeeklyHeadline("No weekly activity yet. Your next check-in starts the curve.");
          setWeeklySubhead("Recent weeks");
        }
      } catch {
        if (!isCancelled) {
          setWeeklyBars([]);
          setWeeklyHeadline("Weekly summary is unavailable right now.");
          setWeeklySubhead("Recent weeks");
        }
      } finally {
        if (!isCancelled) {
          setIsWeeklyLoading(false);
        }
      }
    }

    loadWeeklySummary();

    return () => {
      isCancelled = true;
    };
  }, [loops]);

  const normalizedLoops = loops.map((loop) => normalizeLoop(loop, { todayCheckins }));
  const categories = ["All", ...new Set(normalizedLoops.map((loop) => loop.category || "General"))];
  const filteredLoops = normalizedLoops.filter((loop) => {
    const matchesCategory =
      activeCategory === "All" || (loop.category || "General") === activeCategory;
    const matchesSearch = (loop.name || "")
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    return matchesCategory && matchesSearch;
  });

  async function handleDeleteLoop(loop) {
    const result = await deleteLoop(loop.id);

    if (result.success) {
      await Promise.all([fetchSummary(), fetchTodayCheckins()]);
      return;
    }

    Alert.alert("Delete failed", result.error || "Unable to delete this loop right now.");
  }

  function promptDeleteLoop(loop) {
    setLoopToDelete(loop);
    setIsDeleteModalVisible(true);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
        <View className="flex-row items-center gap-3">
          <Image
            source={require("../../assets/images/image.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <Text className="text-[22px] font-bold tracking-tight" style={{ color: theme.logo }}>
            My Loops
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.refreshBackground}
          />
        }
      >
        <View
          className="flex-row items-center rounded-2xl px-4 py-3.5 mb-6 border"
          style={{ backgroundColor: theme.input, borderColor: theme.border }}
        >
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            className="flex-1 ml-3 font-semibold text-sm"
            style={{ color: theme.text }}
            placeholder="Search your loops..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          contentContainerStyle={{ gap: 10 }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                className="px-5 py-2.5 rounded-[20px] flex-row items-center border"
                style={{
                  backgroundColor: isActive
                    ? isDark ? "#151D30" : "#EAF2FF"
                    : theme.input,
                  borderColor: isActive ? `${theme.accent}33` : "transparent",
                }}
              >
                {isActive && (
                  <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: theme.accent }} />
                )}
                <Text
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: isActive ? theme.text : theme.textMuted }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View className="flex-row justify-between items-end mb-4 px-1">
          <View>
            <Text className="text-[10px] font-bold tracking-widest uppercase" style={{ color: theme.accent }}>
              Active Momentum
            </Text>
            <Text className="text-[10px] font-semibold tracking-wider mt-1" style={{ color: theme.textMuted }}>
              Long press any loop to delete it
            </Text>
          </View>
          <Text className="text-[10px] font-semibold tracking-wider" style={{ color: theme.textMuted }}>
            {filteredLoops.length} Active
          </Text>
        </View>

        <View className="mb-4">
          {isLoading && !normalizedLoops.length ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : filteredLoops.length ? (
            filteredLoops.map((loop) => (
              <ActiveLoopCard
                key={loop.id}
                loop={loop}
                onLongPressLoop={promptDeleteLoop}
              />
            ))
          ) : (
            <View
              className="rounded-[28px] border p-8 items-center"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <Text className="text-base font-semibold" style={{ color: theme.text }}>
                No loops match this filter.
              </Text>
            </View>
          )}
        </View>

        <WeeklySummaryCard
          bars={weeklyBars}
          headline={isWeeklyLoading ? "Loading weekly activity..." : weeklyHeadline}
          subhead={weeklySubhead}
        />
      </ScrollView>

      <View style={{ position: "absolute", bottom: 110, right: 24, zIndex: 50 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/loops/new")}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: theme.plusButton }}
        >
          <Feather name="plus" size={32} color={theme.plusButtonText} />
        </TouchableOpacity>
      </View>

      <DeleteLoopModal
        isVisible={isDeleteModalVisible}
        loopName={loopToDelete?.name}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setLoopToDelete(null);
        }}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          handleDeleteLoop(loopToDelete);
          setLoopToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}
