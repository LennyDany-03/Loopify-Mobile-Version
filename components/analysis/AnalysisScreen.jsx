import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, Image, ScrollView, Text, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CompletionRing from "./CompletionRing";
import FocusAreas from "./FocusAreas";
import LoopTrendsChart from "./LoopTrendsChart";
import HeatmapGrid from "../loops/HeatmapGrid";
import { analyticsAPI } from "../../lib/api";
import useNavStore from "../../lib/store/useNavStore";
import useLoopStore from "../../lib/store/useLoopStore";
import {
  aggregateWeeklyCounts,
  buildCategoryPercents,
  isLoopCompletedToday,
} from "../../lib/utils/loopMetrics";

function getReferenceDate(serverDate) {
  if (!serverDate) {
    return new Date();
  }

  const parsedDate = new Date(`${serverDate}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

function buildCategoryTotals(loops = []) {
  const totalsByCategory = new Map();

  loops.forEach((loop) => {
    const category = loop?.category || "General";
    const totalCheckins = Number(loop?.total_checkins || 0);

    totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + totalCheckins);
  });

  return Array.from(totalsByCategory.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => {
      if (right.total !== left.total) {
        return right.total - left.total;
      }

      return left.category.localeCompare(right.category);
    });
}

export default function AnalysisScreen() {
  const tabIndex = useNavStore((state) => state.tabIndex);
  const loops = useLoopStore((state) => state.loops);
  const summary = useLoopStore((state) => state.summary);
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const serverDate = useLoopStore((state) => state.serverDate);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);

  const [trendData, setTrendData] = useState(() => aggregateWeeklyCounts([]));
  const [globalHeatmap, setGlobalHeatmap] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const loopsRef = useRef(loops);
  const isAnalysisActive = tabIndex === 2;

  const referenceDate = useMemo(() => getReferenceDate(serverDate), [serverDate]);
  const analysisKey = useMemo(
    () =>
      loops
        .map((loop) =>
          [
            loop.id,
            loop.category || "General",
            loop.total_checkins || 0,
            loop.current_streak || 0,
            loop.last_checkin_date || "",
          ].join(":")
        )
        .join("|"),
    [loops]
  );

  const completionRate = useMemo(() => {
    if (!loops.length) {
      return 0;
    }

    const completedToday = loops.reduce(
      (count, loop) => count + (isLoopCompletedToday(loop, todayCheckins) ? 1 : 0),
      0
    );

    return Math.round((completedToday / loops.length) * 100);
  }, [loops, todayCheckins]);

  const focusData = useMemo(
    () => buildCategoryPercents(buildCategoryTotals(loops)),
    [loops]
  );

  useEffect(() => {
    loopsRef.current = loops;
  }, [loops]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAnalysis = useCallback(
    async ({ silent = false, syncCollections = false, sourceLoops } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        let activeLoops = Array.isArray(sourceLoops) ? sourceLoops : useLoopStore.getState().loops;

        if (syncCollections || (!hasLoadedRef.current && !activeLoops.length)) {
          const [nextLoops] = await Promise.all([
            fetchLoops(),
            fetchSummary(),
            fetchTodayCheckins(),
          ]);
          const storeLoops = useLoopStore.getState().loops;

          activeLoops =
            Array.isArray(nextLoops) && (nextLoops.length || !storeLoops.length)
              ? nextLoops
              : storeLoops;
        }

        if (!activeLoops.length) {
          if (!isMountedRef.current || requestId !== requestIdRef.current) {
            return;
          }

          setTrendData(aggregateWeeklyCounts([], 12, referenceDate));
          setGlobalHeatmap([]);
          setError(null);
          hasLoadedRef.current = true;
          return;
        }

        const weeklyData = await Promise.all(
          activeLoops.map(async (loop) => {
            const res = await analyticsAPI.weekly(loop.id);
            return { loop, weeks: res.data?.weeks || [] };
          })
        );

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        const heatmapData = await Promise.all(
          activeLoops.map(async (loop) => {
            try {
              const res = await analyticsAPI.heatmap(loop.id, referenceDate.getFullYear());
              return res.data?.heatmap || [];
            } catch {
              return [];
            }
          })
        );

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        const aggregatedMap = new Map();
        heatmapData.forEach((heatmap) => {
          heatmap.forEach((entry) => {
            const count = entry.count || 0;
            aggregatedMap.set(entry.date, (aggregatedMap.get(entry.date) || 0) + count);
          });
        });
        const combinedHeatmap = Array.from(aggregatedMap.entries()).map(([date, count]) => ({ date, count }));

        setTrendData(aggregateWeeklyCounts(weeklyData, 12, referenceDate));
        setGlobalHeatmap(combinedHeatmap);
        setError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setError(err.response?.data?.detail || "Failed to load analysis.");
      } finally {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchLoops, fetchSummary, fetchTodayCheckins, referenceDate]
  );

  useEffect(() => {
    if (!isAnalysisActive) {
      return;
    }

    loadAnalysis({
      silent: hasLoadedRef.current,
      syncCollections: !hasLoadedRef.current,
      sourceLoops: loopsRef.current,
    });
  }, [analysisKey, isAnalysisActive, loadAnalysis, serverDate]);

  useEffect(() => {
    if (!isAnalysisActive) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadAnalysis({ silent: true, syncCollections: true });
    }, 60000);

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadAnalysis({ silent: true, syncCollections: true });
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isAnalysisActive, loadAnalysis]);

  const onRefresh = async () => {
    await loadAnalysis({ silent: true, syncCollections: true });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-3">
          <Image
            source={require("../../assets/images/image.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <Text className="text-xl font-bold text-[#4F8EF7] italic tracking-tight">Loopify</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="#4F8EF7" 
            colors={["#4F8EF7"]}
            progressBackgroundColor="#1A253A"
          />
        }
      >
        <View className="bg-[#0B0D14] border border-white/5 rounded-[40px] p-8 mb-6 mt-2">
          <Text className="text-white/60 text-sm font-bold tracking-tight mb-8">
            Performance Summary
          </Text>
          {isLoading && !summary ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#4F8EF7" />
            </View>
          ) : (
            <CompletionRing
              percentage={completionRate}
              activeLoops={summary?.total_loops ?? loops.length}
              streak={summary?.current_streak_overall ?? 0}
            />
          )}
        </View>

        <View className="bg-[#0B0D14] border border-white/5 rounded-[40px] p-8 mb-6">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-white text-xl font-bold tracking-tight">Loop Trends</Text>
              <Text className="text-white/40 text-xs mt-1">Last 12 weeks performance</Text>
            </View>
            <View className="flex-row items-center bg-[#1A1C24] px-3 py-1.5 rounded-full">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${isRefreshing ? "bg-[#FFD88B]" : "bg-[#4F8EF7]"}`}
              />
              <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                {isRefreshing ? "Syncing" : "Live"}
              </Text>
            </View>
          </View>
          <LoopTrendsChart data={trendData} />
        </View>

        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-[#0B0D14] border border-white/5 rounded-[40px] p-6">
            <Text className="text-white font-bold text-base mb-6">Focus Areas</Text>
            {focusData.length ? (
              <FocusAreas data={focusData} />
            ) : (
              <Text className="text-white/40 text-sm">No category data yet.</Text>
            )}
          </View>

          <View className="w-[35%] bg-[#0B0D14] border border-white/5 rounded-[40px] items-center justify-center p-4">
            <View className="w-16 h-16 rounded-full border-2 border-[#4F8EF7]/20 items-center justify-center mb-4">
              <View className="w-12 h-12 rounded-full border-2 border-[#4F8EF7] items-center justify-center">
                <Ionicons name="sparkles" size={16} color="#72A6FF" />
              </View>
            </View>
            <Text className="text-[#72A6FF] text-[10px] font-bold text-center tracking-widest uppercase">
              {summary?.loops_on_streak_today ?? 0}{"\n"}Loops{"\n"}On Streak
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <HeatmapGrid
            data={globalHeatmap}
            color="#4F8EF7"
            title="Global Velocity"
            subtitle="Overall activity density across all loops"
            targetValue={loops.length > 0 ? loops.length : 1}
            targetType="numeric"
          />
        </View>

        {!!error && <Text className="text-red-300 text-sm mt-4 px-2">{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
