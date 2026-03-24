import { View, Text } from "react-native";

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
  const chartBars = bars.length ? bars : defaultBars;

  return (
    <View className="bg-[#0D1017] rounded-[32px] p-6 border border-white/5 mb-[100px] mt-2 relative overflow-hidden">
      <Text className="text-[#4F8EF7] text-[9px] font-bold tracking-widest uppercase mb-4">
        {subhead}
      </Text>

      <Text className="text-white text-[22px] font-bold tracking-tight leading-7">
        {headline}
      </Text>

      <View className="flex-row items-end justify-between mt-8 h-[90px] px-1 relative z-10">
        {chartBars.map((bar) => (
          <View key={bar.key} className="items-center justify-end h-full">
            <View
              style={{ height: `${bar.height}%` }}
              className={`w-[26px] rounded-full ${bar.active ? "bg-[#72A6FF]" : "bg-[#1A1C24]"}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
