import { View, Text } from "react-native";
import useAppTheme from "../../lib/hooks/useAppTheme";

const defaultBars = Array.from({ length: 7 }, (_, index) => ({
  key: `empty-${index}`,
  label: `WK ${String(index + 1).padStart(2, "0")}`,
  active: false,
  height: 12,
  count: 0,
}));

export default function WeeklySummaryCard({
  bars = defaultBars,
  headline = "Weekly momentum will show up after your first few check-ins.",
  subhead = "Recent weeks",
}) {
  const { theme, isDark } = useAppTheme();
  const chartBars = bars.length ? bars : defaultBars;

  return (
    <View
      className="rounded-[32px] p-6 border mb-[100px] mt-2 relative overflow-hidden"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <Text className="text-[9px] font-bold tracking-widest uppercase mb-4" style={{ color: theme.accent }}>
        {subhead}
      </Text>

      <Text className="text-[22px] font-bold tracking-tight leading-7" style={{ color: theme.text }}>
        {headline}
      </Text>

      <View className="flex-row items-end justify-between mt-8 h-[90px] px-1 relative z-10">
        {chartBars.map((bar) => (
          <View key={bar.key} className="items-center justify-end h-full">
            <View
              style={{
                height: `${bar.height}%`,
                width: 26,
                borderRadius: 999,
                backgroundColor: bar.active
                  ? theme.accentStrong
                  : isDark
                    ? "#1A1C24"
                    : theme.surfaceSoft,
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
