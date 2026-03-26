import { View, Text, TouchableOpacity } from "react-native";
import { useRef } from "react";
import LoopIcon from "./LoopIcon";

export default function LoopItem({
  loop,
  isChecked = false,
  onPress,
  onLongPressLoop,
}) {
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
      className={`
        flex-row items-center px-4 py-4 mb-3 rounded-[24px] border
        ${isChecked
          ? "bg-[#0F1522] border-[#7AA7FF]/25"
          : "bg-[#0A0D13] border-white/5"}
      `}
    >
      <View
        className={`
          w-12 h-12 rounded-full items-center justify-center mr-4 border
          ${isChecked
            ? "bg-[#121B2E] border-[#7AA7FF]/40"
            : "bg-[#12151C] border-white/5"}
        `}
      >
        <LoopIcon
          icon={loop.icon}
          fallback="repeat"
          size={20}
          color={isChecked ? "#7AA7FF" : "#FFFFFF80"}
        />
      </View>

      <View className="flex-1 min-w-0 pr-2">
        <Text
          className="font-bold text-[16px] text-white tracking-tight"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text className="text-white/40 text-[12px] mt-1" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
