import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function MiniStats({ openLoopsToday = 0, todayCompletionRate = 0 }) {
  const { theme, isDark } = useAppTheme();
  const openGradient = isDark ? theme.primaryGradient : ["#FFFFFF", "#EDF4FF"];
  const doneGradient = isDark ? theme.successGradient : ["#F6FFF9", "#E7F8EE"];

  return (
    <View className="flex-row gap-4 mb-8 mt-2">
      <View
        className="flex-1 rounded-[26px] overflow-hidden border shadow-lg"
        style={{ borderColor: theme.border, shadowColor: theme.shadow }}
      >
        <LinearGradient
          colors={openGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
        >
          <View
            className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border"
            style={{
              borderColor: `${theme.accent}33`,
              backgroundColor: `${theme.accent}1A`,
            }}
          >
            <Text className="font-black text-lg pt-[1px]" style={{ color: theme.accentStrong }}>
              O
            </Text>
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-[9px] font-bold tracking-[2px] uppercase mb-1" style={{ color: theme.textMuted }}>
              Open Today
            </Text>
            <Text className="font-black text-[22px] tracking-tight leading-none" style={{ color: theme.text }}>
              {openLoopsToday.toLocaleString()}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View
        className="flex-1 rounded-[26px] overflow-hidden border shadow-lg"
        style={{ borderColor: `${theme.success}22`, shadowColor: theme.success }}
      >
        <LinearGradient
          colors={doneGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
        >
          <View
            className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border"
            style={{
              borderColor: `${theme.success}33`,
              backgroundColor: `${theme.success}1A`,
            }}
          >
            <Text className="font-black text-lg pt-[2px]" style={{ color: theme.success }}>
              %
            </Text>
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-[9px] font-bold tracking-[2px] uppercase mb-1" style={{ color: `${theme.success}AA` }}>
              Done Today
            </Text>
            <Text className="font-black text-[22px] tracking-tight leading-none" style={{ color: theme.success }}>
              {todayCompletionRate}%
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
