import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GreetingHeader from "../../components/dashboard/GreetingHeader";
import MiniStats from "../../components/dashboard/MiniStats";
import StatCards from "../../components/dashboard/StatCards";
import TodayLoopList from "../../components/dashboard/TodayLoopList";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import { isLoopCompletedToday, normalizeLoop } from "../../lib/utils/loopMetrics";

export default function Dashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loops = useLoopStore((state) => state.loops);
  const summary = useLoopStore((state) => state.summary);
  const todayCheckins = useLoopStore((state) => state.todayCheckins);
  const isLoading = useLoopStore((state) => state.isLoading);
  const error = useLoopStore((state) => state.error);
  const fetchLoops = useLoopStore((state) => state.fetchLoops);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);
  const fetchTodayCheckins = useLoopStore((state) => state.fetchTodayCheckins);
  const checkinLoop = useLoopStore((state) => state.checkinLoop);
  const deleteLoop = useLoopStore((state) => state.deleteLoop);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;
    fetchLoops();
    fetchSummary();
    fetchTodayCheckins();
  }, [fetchLoops, fetchSummary, fetchTodayCheckins]);

  const maxTotalCheckins = Math.max(...loops.map((loop) => loop.total_checkins || 0), 0);
  const displayLoops = loops.map((loop) =>
    normalizeLoop(loop, { todayCheckins, maxTotalCheckins })
  );
  const completedToday = displayLoops.filter((loop) =>
    isLoopCompletedToday(loop, todayCheckins)
  ).length;
  const todayCompletionRate = displayLoops.length
    ? Math.round((completedToday / displayLoops.length) * 100)
    : 0;

  async function handleCheckin(loopId) {
    const result = await checkinLoop(loopId);

    if (result.success) {
      await fetchSummary();
    }

    return result;
  }

  async function handleDeleteLoop(loop) {
    const result = await deleteLoop(loop.id);

    if (result.success) {
      await Promise.all([fetchSummary(), fetchTodayCheckins()]);
      return;
    }

    Alert.alert("Delete failed", result.error || "Unable to delete this loop right now.");
  }

  function promptDeleteLoop(loop) {
    Alert.alert(
      "Delete loop now?",
      `Long press detected on ${loop.name}. This will remove it from your active loops.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete now",
          style: "destructive",
          onPress: () => {
            handleDeleteLoop(loop);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
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
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader user={user} />

        <View className="mb-4 mt-2">
          <StatCards
            totalLoops={summary?.total_loops ?? displayLoops.length}
            streakCount={summary?.best_streak_overall ?? 0}
          />
        </View>

        <MiniStats
          totalCheckins={summary?.total_checkins ?? 0}
          todayCompletionRate={todayCompletionRate}
        />

        <View className="flex-row justify-between items-center mb-6 mt-2">
          <Text className="text-xl text-white font-bold tracking-tight">Today&apos;s Loop</Text>
          <Text className="text-[#4F8EF7] text-[11px] font-bold tracking-wide">
            {completedToday} of {displayLoops.length} Completed
          </Text>
        </View>

        {isLoading && !displayLoops.length ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#4F8EF7" />
          </View>
        ) : (
          <TodayLoopList
            loops={displayLoops}
            todayCheckins={todayCheckins}
            onCheckin={handleCheckin}
            onLongPressLoop={promptDeleteLoop}
          />
        )}

        {!!error && !displayLoops.length && (
          <Text className="text-red-300 text-sm mt-4 text-center">{error}</Text>
        )}
      </ScrollView>

      <View className="absolute bottom-6 right-6 z-50">
        <TouchableOpacity
          onPress={() => router.push("/loops/new")}
          activeOpacity={0.85}
          className="w-16 h-16 bg-[#72A6FF] shadow-xl shadow-[#4F8EF7]/50 rounded-full items-center justify-center"
        >
          <Text className="text-[#1A243A] text-3xl font-light mb-1">+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
