import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function TotalSessionsCard({ total = 0 }) {
  return (
    <View className="bg-[#0B0D14] rounded-[24px] p-5 mb-5 flex-row items-center border border-white/5">
      {/* Icon Area */}
      <View className="w-12 h-12 rounded-full bg-[#1A1C24] items-center justify-center mr-4">
        <View className="w-6 h-6 rounded-full bg-[#4F8EF7] items-center justify-center">
          <Feather name="check" size={14} color="#0B0D14" />
        </View>
      </View>

      {/* Text Area */}
      <View className="flex-1">
        <Text className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">
          Total Sessions
        </Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-white text-3xl font-bold tracking-tight">{total}</Text>
          <Text className="text-white/40 text-sm font-semibold">cycles</Text>
        </View>
      </View>

      {/* Right Trend Icon */}
      <Feather name="trending-up" size={20} color="#ffffff60" />
    </View>
  );
}
