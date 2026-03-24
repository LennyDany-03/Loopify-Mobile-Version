import { View, Text } from "react-native";

export default function MiniStats({ totalCheckins = 0, todayCompletionRate = 0 }) {
  return (
    <View className="flex-row gap-6 mb-8 mt-2 px-2">
      <View className="flex-1 flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <Text className="text-xl">#</Text>
        </View>
        <View>
          <Text className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-1">
            Total{"\n"}Check-ins
          </Text>
          <Text className="text-white font-bold text-lg leading-none">
            {totalCheckins}
          </Text>
        </View>
      </View>

      <View className="flex-1 flex-row items-center gap-4">
        <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <Text className="text-xl">%</Text>
        </View>
        <View>
          <Text className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-1">
            Done{"\n"}Today
          </Text>
          <Text className="font-bold text-xl leading-none text-white">
            {todayCompletionRate}%
          </Text>
        </View>
      </View>
    </View>
  );
}
