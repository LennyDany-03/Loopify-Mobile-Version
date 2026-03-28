import { useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import LoopIcon from "../ui/LoopIcon";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function ActiveLoopCard({ loop, onLongPressLoop }) {
  const { theme, isDark } = useAppTheme();
  const suppressNextPress = useRef(false);

  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = loop.completion_rate / 100 || 0;
  const strokeDashoffset = circumference - progress * circumference;

  function handlePress() {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }

    router.push(`/loops/${loop.id}`);
  }

  function handleLongPress() {
    suppressNextPress.current = true;
    onLongPressLoop?.(loop);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      className="rounded-[28px] p-5 mb-4 flex-row items-center justify-between border"
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      <View className="flex-row items-center flex-1">
        <View className="mr-4 items-center justify-center">
          <Svg width={size} height={size}>
            <Circle
              stroke={isDark ? "#ffffff12" : "#1f33541A"}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke={loop.color || theme.accent}
              fill="none"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View className="absolute">
            <LoopIcon icon={loop.icon} fallback="activity" size={20} color={loop.iconColor || theme.text} />
          </View>
        </View>

        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold tracking-tight mb-1" style={{ color: theme.text }} numberOfLines={1}>
            {loop.title || loop.name}
          </Text>
          <View className="flex-row items-center mb-2">
            <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: loop.color || theme.accent }} />
            <Text className="text-xs font-medium tracking-wide" style={{ color: theme.textMuted }}>
              {loop.category}
            </Text>
          </View>

          <View
            className="self-start px-3 py-1 rounded-full flex-row items-center gap-1"
            style={{ backgroundColor: theme.surfaceSoft }}
          >
            <Text className="text-[10px]" style={{ color: theme.accentSoft }}>
              *
            </Text>
            <Text className="text-[9px] font-bold tracking-widest uppercase ml-0.5" style={{ color: theme.accentSoft }}>
              {loop.current_streak} {loop.current_streak === 1 ? "Day" : "Days"} Streak
            </Text>
          </View>
        </View>
      </View>

      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: theme.surfaceSoft }}
      >
        <Feather name="chevron-right" size={18} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}
