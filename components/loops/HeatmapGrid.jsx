import { View, Text, ScrollView } from "react-native";

function getCellLevel(entry, targetValue, targetType) {
  const count = entry?.count ?? entry?.level ?? 0;

  if (targetType === "boolean") {
    return count >= 1 ? 1 : 0;
  }

  const target = Number(targetValue);
  if (target > 0) {
    const ratio = count / target;
    if (ratio >= 1) return 1;
    if (ratio >= 0.75) return 0.8;
    if (ratio >= 0.5) return 0.6;
    if (ratio >= 0.25) return 0.4;
    return ratio > 0 ? 0.2 : 0;
  }

  // Fallback logic for legacy data or missing targets
  if (count >= 4) return 1;
  if (count >= 3) return 0.8;
  if (count >= 2) return 0.6;
  if (count >= 1) return 0.4;
  return 0;
}

export default function HeatmapGrid({ 
  data = [], 
  color = "#4F8EF7", 
  targetValue, 
  targetType,
  title = "Annual Velocity",
  subtitle = "Activity density across this year"
}) {
  const cells = data.length
    ? data
    : Array.from({ length: 365 }, (_, index) => ({
        date: `empty-${index}`,
        count: 0,
      }));

  const columns = [];
  for (let index = 0; index < cells.length; index += 7) {
    columns.push(cells.slice(index, index + 7));
  }

  return (
    <View className="bg-[#0B0D14] rounded-[24px] p-5 border border-white/5 mb-6">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-white text-lg font-bold mb-1 leading-tight tracking-tight">
            {title}
          </Text>
          <Text className="text-white/50 text-[11px] font-semibold tracking-wide">
            {subtitle}
          </Text>
        </View>
        <View className="flex-row items-center gap-[3px] pb-1">
          <Text className="text-white/40 text-[8px] font-bold tracking-widest uppercase mr-1">
            Less
          </Text>
          {[0.1, 0.4, 0.7, 1].map((opacity, index) => (
            <View
              key={index}
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: index === 0 ? "#1A1C24" : color,
                opacity: index === 0 ? 1 : opacity,
              }}
            />
          ))}
          <Text className="text-white/40 text-[8px] font-bold tracking-widest uppercase ml-1">
            More
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
        <View className="flex-row gap-[3px]">
          {columns.map((column, columnIndex) => (
            <View key={columnIndex} className="gap-[3px]">
              {column.map((entry) => {
                const level = getCellLevel(entry, targetValue, targetType);

                return (
                  <View
                    key={entry.date}
                    className="w-3 h-3 rounded-[2px]"
                    style={{
                      backgroundColor: level === 0 ? "#1A1C24" : color,
                      opacity: level || 1,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
