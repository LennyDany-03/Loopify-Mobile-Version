import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import useAppTheme from "../../lib/hooks/useAppTheme";

function MetricPill({ icon, label, value, unit, accent = "#FFFFFF" }) {
  const { theme, isDark } = useAppTheme();

  return (
    <View
      className="flex-1 rounded-[26px] overflow-hidden border shadow-lg"
      style={{ borderColor: theme.border, shadowColor: theme.shadow }}
    >
      <LinearGradient
        colors={theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
      >
        <View
          className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border"
          style={{
            backgroundColor: `${accent}1A`,
            borderColor: `${accent}33`,
          }}
        >
          <MaterialCommunityIcons name={icon} size={22} color={accent} />
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-[9px] font-bold tracking-[2px] uppercase mb-1 leading-tight" style={{ color: theme.textMuted }}>
            {label}
          </Text>
          <View className="flex-row items-baseline gap-1 mt-0.5">
            <Text className="font-black text-[22px] tracking-tight leading-none" style={{ color: theme.text }}>
              {value}
            </Text>
            {unit ? (
              <Text
                className="font-bold text-[12px] leading-none tracking-wide ml-0.5"
                style={{ color: isDark ? "#87AFFF" : theme.accent }}
              >
                {unit}
              </Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function StatCards({
  totalLoops = 0,
  streakCount = 0,
  bestStreak = 0,
  activeLoops = 0,
}) {
  const { theme, isDark } = useAppTheme();
  const totalLoopsCardBackground = isDark ? "#7DA7FF" : "#CFE0FF";
  const totalLoopsCardInk = isDark ? theme.accentContrast : "#173A73";

  return (
    <View>
      <View className="flex-row gap-4">
        <View
          className="flex-1 rounded-[32px] p-5 min-h-[178px] justify-between relative"
          style={{ backgroundColor: totalLoopsCardBackground }}
        >
          <View className="flex-row items-start justify-between">
            <Text className="text-[11px] font-black tracking-[2px] leading-[14px]" style={{ color: totalLoopsCardInk }}>
              TOTAL{"\n"}LOOPS
            </Text>
            <MaterialCommunityIcons name="all-inclusive" size={22} color={totalLoopsCardInk} />
          </View>

          <Text className="text-[64px] font-black italic tracking-tighter leading-[66px] mt-1" style={{ color: totalLoopsCardInk }}>
            {totalLoops.toLocaleString()}
          </Text>
        </View>

        <View
          className="flex-1 border rounded-[32px] p-5 min-h-[178px] overflow-hidden justify-between relative shadow-lg"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          }}
        >
          <View className="absolute -right-5 -top-4 opacity-[0.06]">
            <MaterialCommunityIcons name="fire" size={150} color={theme.text} />
          </View>

          <View>
            <Text className="text-[10px] font-bold tracking-[2px] uppercase leading-[14px]" style={{ color: theme.accentSoft }}>
              CURRENT{"\n"}STREAK
            </Text>
            <Text className="text-[64px] font-black tracking-[-3px] leading-[66px] mt-1 relative z-10" style={{ color: theme.text }}>
              {streakCount}
            </Text>
          </View>

          <Text className="text-[13px] font-medium tracking-wide relative z-10 mt-auto" style={{ color: theme.textMuted }}>
            Days consistent
          </Text>
        </View>
      </View>

      <View className="flex-row gap-5 mt-6 px-1">
        <MetricPill
          icon="bookmark-check-outline"
          label={"Best\nStreak"}
          value={bestStreak}
          unit="Days"
          accent={isDark ? "#87AFFF" : theme.accent}
        />
        <MetricPill
          icon="lightning-bolt"
          label={"Active\nLoops"}
          value={activeLoops}
          unit={activeLoops === 1 ? "Loop" : "Loops"}
          accent={isDark ? "#87AFFF" : theme.accent}
        />
      </View>
    </View>
  );
}
