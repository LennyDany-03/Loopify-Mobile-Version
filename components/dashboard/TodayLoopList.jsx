import { View, Text } from "react-native";
import LoopItem from "../ui/LoopItem";
import { router } from "expo-router";
import { isLoopCompletedToday } from "../../lib/utils/loopMetrics";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function TodayLoopList({
  loops = [],
  todayCheckins = {},
  onLongPressLoop,
}) {
  const { theme } = useAppTheme();

  const sorted = [...loops].sort((a, b) => {
    const ac = isLoopCompletedToday(a, todayCheckins);
    const bc = isLoopCompletedToday(b, todayCheckins);
    if (ac === bc) return 0;
    return ac ? 1 : -1;
  });

  return (
    <View>
      {sorted.length === 0 ? (
        <View
          className="border rounded-3xl p-8 items-center"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Text className="text-4xl mb-3" style={{ color: theme.accent }}>
            O
          </Text>
          <Text className="font-semibold" style={{ color: theme.text }}>
            No loops yet
          </Text>
          <Text className="text-sm mt-1 text-center" style={{ color: theme.textSubtle }}>
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
