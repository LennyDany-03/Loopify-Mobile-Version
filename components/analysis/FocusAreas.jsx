import { View, Text } from "react-native";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function FocusAreas({ data = [] }) {
  const { theme, isDark } = useAppTheme();

  return (
    <View className="gap-6">
      {data.map((item, index) => (
        <View key={index}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
              {item.category}
            </Text>
            <Text className="font-bold text-xs" style={{ color: theme.text }}>
              {item.percent}%
            </Text>
          </View>
          <View
            className="h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(20,54,109,0.08)" }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${item.percent}%`, backgroundColor: theme.accent }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
