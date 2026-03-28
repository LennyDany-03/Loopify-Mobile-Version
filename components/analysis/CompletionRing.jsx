import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function CompletionRing({ percentage = 85, activeLoops = 12, streak = 14 }) {
  const { theme, isDark } = useAppTheme();
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center">
      <View className="items-center justify-center mb-10 relative">
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(20, 54, 109, 0.08)"}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={theme.accent}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
          />
        </Svg>

        <View className="absolute items-center justify-center">
          <View className="flex-row items-baseline">
            <Text className="text-[56px] font-bold tracking-tighter" style={{ color: theme.text }}>
              {percentage}
            </Text>
            <Text className="text-2xl font-bold ml-1" style={{ color: theme.accent }}>
              %
            </Text>
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-[3px] -mt-1" style={{ color: theme.textMuted }}>
            Completed
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 w-full">
        <View
          className="flex-1 rounded-[24px] p-5 border items-center"
          style={{ backgroundColor: theme.input, borderColor: theme.border }}
        >
          <Text className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: theme.accentStrong }}>
            Active Loops
          </Text>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            {activeLoops}
          </Text>
        </View>

        <View
          className="flex-1 rounded-[24px] p-5 border items-center"
          style={{ backgroundColor: theme.input, borderColor: theme.border }}
        >
          <Text className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: theme.accentStrong }}>
            Streak
          </Text>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            {streak}d
          </Text>
        </View>
      </View>
    </View>
  );
}
