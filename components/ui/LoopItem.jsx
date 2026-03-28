import { View, Text, TouchableOpacity } from "react-native";
import { useRef } from "react";
import LoopIcon from "./LoopIcon";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function LoopItem({
  loop,
  isChecked = false,
  onPress,
  onLongPressLoop,
}) {
  const { theme, isDark } = useAppTheme();
  const suppressNextPress = useRef(false);

  function handlePress() {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }

    onPress?.();
  }

  function handleLongPress() {
    suppressNextPress.current = true;
    onLongPressLoop?.(loop);
  }

  const title = loop.title || loop.name;
  const subtitle = loop.description ||
    (loop.target_value
      ? `${loop.target_value} ${loop.target_unit || ""} Target`.trim()
      : loop.category);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      activeOpacity={0.78}
      className="flex-row items-center px-4 py-4 mb-3 rounded-[24px] border"
      style={{
        backgroundColor: isChecked
          ? isDark ? "#0F1522" : "#EAF2FF"
          : theme.surface,
        borderColor: isChecked
          ? isDark ? "rgba(122, 167, 255, 0.25)" : "rgba(47, 111, 214, 0.18)"
          : theme.border,
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4 border"
        style={{
          backgroundColor: isChecked
            ? isDark ? "#121B2E" : "#DDE8FA"
            : theme.surfaceAlt,
          borderColor: isChecked
            ? isDark ? "rgba(122, 167, 255, 0.4)" : "rgba(47, 111, 214, 0.24)"
            : theme.border,
        }}
      >
        <LoopIcon
          icon={loop.icon}
          fallback="repeat"
          size={20}
          color={isChecked ? theme.accentSoft : theme.textMuted}
        />
      </View>

      <View className="flex-1 min-w-0 pr-2">
        <Text
          className="font-bold text-[16px] tracking-tight"
          style={{ color: theme.text }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text className="text-[12px] mt-1" style={{ color: theme.textMuted }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
