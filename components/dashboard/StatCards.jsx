import { View, Text } from "react-native";

// The two large hero stat cards from the dashboard:
// Total Loops (dark) + Streak Count (blue highlight)

export default function StatCards({ totalLoops = 0, streakCount = 0 }) {
  return (
    <View className="flex-row gap-4 mb-2">

      {/* Total Loops card */}
      <View className="flex-1 bg-transparent pr-4 justify-center">
        <Text className="text-[#4F8EF7] text-xs font-bold mb-3 tracking-wide">
          Total Loops
        </Text>
        <Text className="text-white text-4xl font-bold tracking-tight">
          {totalLoops.toLocaleString()}
        </Text>
      </View>

      {/* Streak Count card — blue highlight */}
      <View className="flex-1 bg-[#72A6FF] rounded-[32px] p-5 justify-between min-h-[140px] shadow-lg shadow-[#4F8EF7]/30">
        <View className="flex-row items-start justify-between">
          <Text className="text-[#1A243A] text-[10px] font-bold tracking-widest leading-4">
            STREAK{"\n"}COUNT
          </Text>
          <Text className="text-base text-[#1A243A]">🔥</Text>
        </View>
        <Text className="text-[#1A243A] text-5xl font-black italic tracking-tighter mt-2">
          {streakCount}
        </Text>
      </View>

    </View>
  );
}