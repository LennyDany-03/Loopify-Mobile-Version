import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GreetingHeader from "./GreetingHeader";
import MiniStats from "./MiniStats";
import StatCards from "./StatCards";
import TodayLoopList from "./TodayLoopList";
import DeleteLoopModal from "../loops/DeleteLoopModal";
import useAuthStore from "../../lib/store/useAuthStore";
import useLoopStore from "../../lib/store/useLoopStore";
import { isLoopCompletedToday, normalizeLoop } from "../../lib/utils/loopMetrics";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function DashboardScreen() {
  const { theme } = useAppTheme();
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
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [loopToDelete, setLoopToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLoops(), fetchSummary(), fetchTodayCheckins()]);
    setRefreshing(false);
  };

  const displayLoops = loops.map((loop) => normalizeLoop(loop, { todayCheckins }));
  const completedToday = displayLoops.filter((loop) =>
    isLoopCompletedToday(loop, todayCheckins)
  ).length;
  const openLoopsToday = Math.max(displayLoops.length - completedToday, 0);
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
    setLoopToDelete(loop);
    setIsDeleteModalVisible(true);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <View className="flex-row items-center gap-3">
          <Image
            source={require("../../assets/images/image.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <Text className="text-[22px] font-bold italic tracking-tight" style={{ color: theme.logo }}>
            Loopify
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
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
        <GreetingHeader user={user} />

        <View className="mb-4 mt-2">
          <StatCards
            totalLoops={summary?.total_loops ?? displayLoops.length}
            streakCount={summary?.current_streak_overall ?? 0}
            bestStreak={summary?.best_streak_overall ?? 0}
            activeLoops={summary?.loops_on_streak_today ?? 0}
          />
        </View>

        <MiniStats
          openLoopsToday={openLoopsToday}
          todayCompletionRate={todayCompletionRate}
        />

        <View className="flex-row justify-between items-center mb-6 mt-2">
          <Text className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>
            Today&apos;s Loop
          </Text>
          <Text className="text-[11px] font-bold tracking-wide" style={{ color: theme.accent }}>
            {completedToday} of {displayLoops.length} Completed
          </Text>
        </View>

        {isLoading && !displayLoops.length ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={theme.accent} />
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
          <Text className="text-sm mt-4 text-center" style={{ color: theme.danger }}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 110, right: 24, zIndex: 50 }}>
        <TouchableOpacity
          onPress={() => router.push("/loops/new")}
          activeOpacity={0.85}
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{
            backgroundColor: theme.plusButton,
            shadowColor: theme.plusButton,
          }}
        >
          <Text className="text-3xl font-light mb-1" style={{ color: theme.plusButtonText }}>
            +
          </Text>
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
