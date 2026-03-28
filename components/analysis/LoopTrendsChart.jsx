import { View, Text } from "react-native";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function LoopTrendsChart({ data = [] }) {
  const { theme, isDark } = useAppTheme();
  const chartHeight = 120;
  const firstLabel = data[0]?.label || "WK 00";
  const middleLabel = data[Math.floor(data.length / 2)]?.label || "WK 00";
  const lastLabel = data[data.length - 1]?.label || "WK 00";

  return (
    <View className="w-full">
      <View className="flex-row items-end justify-between h-[120px] mb-4">
        {data.map((item, index) => {
          const isHighlighted =
            item.count > 0 &&
            (index === data.length - 1 || index === Math.floor(data.length / 2));
          const barHeight = Math.max(item.value * chartHeight, item.count > 0 ? 12 : 4);

          return (
            <View key={item.key || index} className="items-center" style={{ width: "6%" }}>
              <View
                className="w-full rounded-full"
                style={{
                  height: barHeight,
                  backgroundColor: isHighlighted ? theme.accentStrong : isDark ? "#FFFFFF" : theme.accent,
                  opacity: isHighlighted ? 1 : isDark ? 0.15 : 0.22,
                  shadowColor: isHighlighted ? theme.accent : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                }}
              />
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between px-2">
        <Text className="text-[10px] font-bold tracking-widest" style={{ color: theme.textSubtle }}>
          {firstLabel}
        </Text>
        <Text className="text-[10px] font-bold tracking-widest ml-4" style={{ color: theme.textSubtle }}>
          {middleLabel}
        </Text>
        <Text className="text-[10px] font-bold tracking-widest" style={{ color: theme.textSubtle }}>
          {lastLabel}
        </Text>
      </View>
    </View>
  );
}
