import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
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

export default function LoopsScreen() {
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

  useEffect(() => {
    if (hasLoaded.current) {
      return;
    }

    hasLoaded.current = true;
    fetchLoops();
    fetchTodayCheckins();
  }, [fetchLoops, fetchTodayCheckins]);

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
          setWeeklyHeadline(
            `${totalRecentCheckins} check-ins across the last ${bars.length} weeks.`
          );
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

  const normalizedLoops = loops.map((loop) =>
    normalizeLoop(loop, { todayCheckins })
  );
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
    <SafeAreaView className="flex-1 bg-[#050508]">
      <View className="flex-row items-center justify-between px-6 pt-4 pb-4">
        <View className="flex-row items-center gap-3">
          <Image
            source={require("../../assets/images/image.png")}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-[#4F8EF7] tracking-tight">My Loops</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center bg-[#11131A] rounded-2xl px-4 py-3.5 mb-6 border border-white/5">
          <Feather name="search" size={18} color="#ffffff40" />
          <TextInput
            className="flex-1 text-white ml-3 font-semibold text-sm"
            placeholder="Search your loops..."
            placeholderTextColor="#ffffff40"
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
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-[20px] flex-row items-center ${
                activeCategory === cat
                  ? "bg-[#151D30] border border-[#4F8EF7]/20"
                  : "bg-[#11131A] border border-transparent"
              }`}
            >
              {activeCategory === cat && <View className="w-2 h-2 rounded-full bg-[#4F8EF7] mr-2" />}
              <Text
                className={`text-sm font-semibold tracking-wide ${
                  activeCategory === cat ? "text-white" : "text-white/50"
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="flex-row justify-between items-end mb-4 px-1">
          <View>
            <Text className="text-[#4F8EF7] text-[10px] font-bold tracking-widest uppercase">
              Active Momentum
            </Text>
            <Text className="text-white/35 text-[10px] font-semibold tracking-wider mt-1">
              Long press any loop to delete it
            </Text>
          </View>
          <Text className="text-white/50 text-[10px] font-semibold tracking-wider">
            {filteredLoops.length} Active
          </Text>
        </View>

        <View className="mb-4">
          {isLoading && !normalizedLoops.length ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#4F8EF7" />
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
            <View className="bg-[#0D1017] rounded-[28px] border border-white/5 p-8 items-center">
              <Text className="text-white text-base font-semibold">No loops match this filter.</Text>
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
          className="w-16 h-16 bg-[#72A6FF] shadow-2xl shadow-[#4F8EF7]/50 rounded-full items-center justify-center"
        >
          <Feather name="plus" size={32} color="#0B0D14" />
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
