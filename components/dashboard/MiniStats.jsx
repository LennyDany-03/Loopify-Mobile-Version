import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function MiniStats({ totalCheckins = 0, todayCompletionRate = 0 }) {
  return (
    <View className="flex-row gap-4 mb-8 mt-2">
      <View className="flex-1 rounded-[26px] overflow-hidden border border-white/5 shadow-lg shadow-black/80">
        <LinearGradient
          colors={["#0D121F", "#080B14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
        >
          <View className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border border-[#4F8EF7]/20 bg-[#4F8EF7]/10">
            <Text className="text-[#72A6FF] font-black text-lg pt-[2px]">#</Text>
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-1">
              All Check-ins
            </Text>
            <Text className="text-white font-black text-[22px] tracking-tight leading-none">
              {totalCheckins.toLocaleString()}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View className="flex-1 rounded-[26px] overflow-hidden border border-[#88F0B6]/10 shadow-lg shadow-[#88F0B6]/5">
        <LinearGradient
          colors={["#0C1613", "#070C0A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
        >
          <View className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border border-[#88F0B6]/20 bg-[#88F0B6]/10">
            <Text className="text-[#88F0B6] font-black text-lg pt-[2px]">%</Text>
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-[#88F0B6]/50 text-[9px] font-bold tracking-[2px] uppercase mb-1">
              Done Today
            </Text>
            <Text className="text-[#88F0B6] font-black text-[22px] tracking-tight leading-none">
              {todayCompletionRate}%
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
