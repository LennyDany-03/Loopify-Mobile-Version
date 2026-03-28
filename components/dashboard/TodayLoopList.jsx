import { View, Text } from "react-native";
import LoopItem from "../ui/LoopItem";
import { router } from "expo-router";
import { isLoopCompletedToday } from "../../lib/utils/loopMetrics";

export default function TodayLoopList({
  loops = [],
  todayCheckins = {},
  onLongPressLoop,
}) {
  // Unchecked first, checked sink to bottom
  const sorted = [...loops].sort((a, b) => {
    const ac = isLoopCompletedToday(a, todayCheckins);
    const bc = isLoopCompletedToday(b, todayCheckins);
    if (ac === bc) return 0;
    return ac ? 1 : -1;
  });

  return (
    <View>
      {/* Loop rows */}
      {sorted.length === 0 ? (
        <View className="bg-[#0f0f1a] border border-[#ffffff08] rounded-3xl p-8 items-center">
          <Text className="text-4xl mb-3">🔁</Text>
          <Text className="text-white font-semibold">No loops yet</Text>
          <Text className="text-white/30 text-sm mt-1 text-center">
            Create your first loop to start tracking
          </Text>
        </View>
      ) : (
        sorted.map((loop) => (
          <LoopItem
            key={loop.id}
            loop={loop}
            isChecked={isLoopCompletedToday(loop, todayCheckins)}
            onLongPressLoop={onLongPressLoop}
            onPress={() => router.push(`/loops/${loop.id}`)}
          />
        ))
      )}
    </View>
  );
}
