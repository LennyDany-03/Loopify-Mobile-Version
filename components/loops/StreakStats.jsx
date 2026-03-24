import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function StreakStats({ loop }) {
  if (!loop) return null;

  const { current_streak = 14, best_streak = 42 } = loop;
  const streakPercent = best_streak > 0
    ? Math.round((current_streak / best_streak) * 100)
    : 0;

  return (
    <View className="flex-row gap-4 mb-5">
      {/* Current Streak */}
      <View className="flex-1 bg-[#0B0D14] rounded-[24px] p-5 border border-white/5 relative overflow-hidden">
        {/* Absolute Fire Icon Watermark */}
        <View className="absolute -right-3 top-2 opacity-5">
           <MaterialCommunityIcons name="fire" size={100} color="#ffffff" /> 
        </View>
        
        <Text className="text-[#72A6FF] text-[10px] font-bold uppercase tracking-widest leading-4 mb-2">
          Current{"\n"}Streak
        </Text>
        <Text className="text-white text-[42px] font-bold tracking-tighter leading-10 my-1">
          {current_streak}
        </Text>
        <Text className="text-[#ffffff60] text-xs mt-3 tracking-wide">Days consistent</Text>
      </View>

      {/* Best Streak */}
      <View className="flex-1 bg-[#0B0D14] rounded-[24px] p-5 border border-white/5">
        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-4 mb-2 pb-4">
          Best Streak
        </Text>
        <Text className="text-white text-[42px] font-bold tracking-tighter leading-10 my-1">
          {best_streak}
        </Text>
        <View className="flex-row items-center justify-between mt-3">
           <View className="flex-1 h-[3px] bg-[#1A1C24] rounded-full mr-3 overflow-hidden">
             <View className="h-full bg-[#72A6FF] rounded-full" style={{ width: `${streakPercent}%` }} />
           </View>
           <Text className="text-[#ffffff60] text-[10px] font-bold">{streakPercent}%</Text>
        </View>
      </View>
    </View>
  );
}