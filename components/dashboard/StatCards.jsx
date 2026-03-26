import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function MetricPill({ icon, label, value, unit, accent = "#FFFFFF" }) {
  return (
    <View className="flex-1 flex-row items-center gap-3">
      <View className="w-12 h-12 rounded-full bg-white/6 items-center justify-center border border-white/5">
        <MaterialCommunityIcons name={icon} size={18} color={accent} />
      </View>

      <View className="flex-1">
        <Text className="text-white/35 text-[11px] font-bold tracking-[2px] uppercase leading-4">
          {label}
        </Text>
        <Text className="text-white text-[30px] font-black leading-[30px] mt-1">
          {value}
        </Text>
        {unit ? (
          <Text className="text-white text-[15px] font-bold mt-1">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function StatCards({
  totalLoops = 0,
  streakCount = 0,
  bestStreak = 0,
  activeLoops = 0,
}) {
  return (
    <View>
      <View className="flex-row gap-4">
        <View className="flex-[1.05] bg-[#06080D] border border-white/5 rounded-[34px] px-5 py-6 min-h-[188px] justify-between">
          <Text className="text-[#7DA7FF] text-[18px] font-bold tracking-tight">
            Total Loops
          </Text>
          <Text className="text-white text-[56px] font-black tracking-[-2px] leading-[58px]">
            {totalLoops.toLocaleString()}
          </Text>
        </View>

        <View className="flex-[0.95] bg-[#7EA9FF] rounded-[34px] px-5 py-6 min-h-[188px] justify-between shadow-2xl shadow-[#4F8EF7]/40">
          <View className="flex-row items-start justify-between">
            <Text className="text-[#1B3E76] text-[11px] font-black tracking-[2px] leading-4">
              STREAK{"\n"}COUNT
            </Text>
            <MaterialCommunityIcons name="fire" size={22} color="#1B3E76" />
          </View>

          <Text className="text-[#14366D] text-[58px] font-black italic tracking-[-3px] leading-[60px]">
            {streakCount}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-5 mt-6 px-1">
        <MetricPill
          icon="bookmark-check-outline"
          label={"Best\nStreak"}
          value={bestStreak}
          unit="Days"
          accent="#87AFFF"
        />
        <MetricPill
          icon="lightning-bolt"
          label={"Active\nLoops"}
          value={activeLoops}
          unit={activeLoops === 1 ? "Loop" : "Loops"}
          accent="#87AFFF"
        />
      </View>
    </View>
  );
}
