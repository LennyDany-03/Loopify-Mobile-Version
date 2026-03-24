import { View, Text, TouchableOpacity } from "react-native";
import { useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import LoopIcon from "./LoopIcon";

// Single loop row used in Today's Loop list on dashboard
// Shows icon, name, subtitle, and a checkin circle button

export default function LoopItem({ loop, isChecked = false, onCheckin, onPress, onLongPressLoop }) {
  const [checking, setChecking] = useState(false);
  const suppressNextPress = useRef(false);

  async function handleCheckin(e) {
    if (isChecked || checking) return;
    setChecking(true);
    await onCheckin?.(loop.id);
    setChecking(false);
  }

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
  const subtitle = loop.description || (loop.target_value ? `${loop.target_value} ${loop.target_unit || ""} Target` : loop.category);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      activeOpacity={0.7}
      className={`
        flex-row items-center px-4 py-4 mb-3
        ${isChecked ? 'bg-transparent pl-2' : 'bg-[#0D1017] rounded-[28px] border border-white/5'}
      `}
    >
      {/* Loop icon circle */}
      {isChecked ? (
        <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-[#0B0D14] border-2 border-[#4F8EF7]">
          <LoopIcon icon={loop.icon} fallback="repeat" size={20} color="#4F8EF7" />
        </View>
      ) : (
        <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-[#1A1C24]">
          <LoopIcon icon={loop.icon} fallback="repeat" size={20} color="#ffffff50" />
        </View>
      )}

      {/* Name + subtitle */}
      <View className="flex-1 min-w-0 pr-2">
        <Text
          className={`font-bold tracking-wide text-[16px] ${isChecked ? "text-white" : "text-white"}`}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text className="text-white/40 text-[13px] mt-0.5" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Streak badge */}
      {loop.current_streak > 0 && !isChecked && (
        <View className="mr-3 flex-row items-center gap-1">
          <Text className="text-orange-400 text-xs">🔥</Text>
          <Text className="text-orange-400/80 text-xs font-semibold">
            {loop.current_streak}
          </Text>
        </View>
      )}

      {/* Checkin button */}
      <TouchableOpacity
        onPress={handleCheckin}
        disabled={isChecked || checking}
        activeOpacity={0.7}
      >
        {isChecked ? (
          <View className="w-8 h-8 rounded-full border border-white/10 bg-[#0B0D14] items-center justify-center">
            <Feather name="check" size={14} color="#4F8EF7" />
          </View>
        ) : (
          <View className="w-8 h-8 rounded-full border-2 border-[#4F8EF7]/30 bg-transparent items-center justify-center">
            {checking && <View className="w-3 h-3 rounded-full bg-[#4F8EF7]/50" />}
          </View>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
