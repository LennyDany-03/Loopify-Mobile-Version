import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CompletionRing from "../../components/analysis/CompletionRing";
import FocusAreas from "../../components/analysis/FocusAreas";
import LoopTrendsChart from "../../components/analysis/LoopTrendsChart";
import RecentLoopDetail from "../../components/analysis/RecentLoopDetail";
import { analyticsAPI } from "../../lib/api";
import useLoopStore from "../../lib/store/useLoopStore";
import {
    aggregateWeeklyCounts,
    buildCategoryPercents,
    buildRecentLoopInsights,
} from "../../lib/utils/loopMetrics";

export default function Analysis() {
  const summary = useLoopStore((state) => state.summary);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);

  const [completionRate, setCompletionRate] = useState(0);
  const [focusData, setFocusData] = useState([]);
  const [trendData, setTrendData] = useState(aggregateWeeklyCounts([]));
  const [recentLoops, setRecentLoops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;
    let isCancelled = false;

    async function loadAnalysis() {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([fetchLoops(), fetchSummary()]);
        const liveLoops = useLoopStore.getState().loops;

        const [completionRes, categoryRes, weeklyData] = await Promise.all([
          analyticsAPI.completionRate(),
          analyticsAPI.categoryBreakdown(),
          Promise.all(
            liveLoops.map(async (loop) => {
              const res = await analyticsAPI.weekly(loop.id);
              return { loop, weeks: res.data?.weeks || [] };
            })
          ),
        ]);

        if (isCancelled) {
          return;
        }

        setCompletionRate(Math.round(completionRes.data?.completion_rate_percent || 0));
        setFocusData(buildCategoryPercents(categoryRes.data?.categories || []));
        setTrendData(aggregateWeeklyCounts(weeklyData));
        setRecentLoops(buildRecentLoopInsights(weeklyData));
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.detail || "Failed to load analysis.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [fetchLoops, fetchSummary]);

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
              activeLoops={summary?.total_loops ?? 0}
              streak={summary?.best_streak_overall ?? 0}
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
              <View className="w-2 h-2 rounded-full bg-[#4F8EF7] mr-2" />
              <Text className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                Live
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

        <View className="mb-4 px-2">
          <Text className="text-white text-xl font-bold tracking-tight">Recent Loop Detail</Text>
        </View>

        {recentLoops.length ? (
          <RecentLoopDetail data={recentLoops} />
        ) : (
          <View className="bg-[#0B0D14] border border-white/5 rounded-[24px] px-5 py-5">
            <Text className="text-white/40 text-sm">Recent loop insights will appear after a few check-ins.</Text>
          </View>
        )}

        {!!error && <Text className="text-red-300 text-sm mt-4 px-2">{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
