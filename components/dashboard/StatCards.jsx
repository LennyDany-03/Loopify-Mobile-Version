import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

function MetricPill({ icon, label, value, unit, accent = "#FFFFFF" }) {
  return (
    <View className="flex-1 rounded-[26px] overflow-hidden border border-white/5 shadow-lg shadow-black/80">
      <LinearGradient
        colors={["#0D121F", "#080B14"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: "row", alignItems: "center" }}
      >
        <View 
          className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 border"
          style={{ 
            backgroundColor: `${accent}1A`,
            borderColor: `${accent}33`
          }}
        >
          <MaterialCommunityIcons name={icon} size={22} color={accent} />
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-white/40 text-[9px] font-bold tracking-[2px] uppercase mb-1 leading-tight">
            {label}
          </Text>
          <View className="flex-row items-baseline gap-1 mt-0.5">
            <Text className="text-white font-black text-[22px] tracking-tight leading-none">
              {value}
            </Text>
            {unit ? (
              <Text className="text-[#87AFFF] font-bold text-[12px] leading-none tracking-wide ml-0.5">
                {unit}
              </Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>
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
        <View className="flex-1 bg-[#7DA7FF] rounded-[32px] p-5 min-h-[178px] justify-between relative">
          <View className="flex-row items-start justify-between">
            <Text className="text-[#14366D] text-[11px] font-black tracking-[2px] leading-[14px]">
              TOTAL{"\n"}LOOPS
            </Text>
            <MaterialCommunityIcons name="all-inclusive" size={22} color="#14366D" />
          </View>

          <Text className="text-[#14366D] text-[64px] font-black italic tracking-tighter leading-[66px] mt-1">
            {totalLoops.toLocaleString()}
          </Text>
        </View>

        <View className="flex-1 bg-[#0A0D14] border border-white/5 rounded-[32px] p-5 min-h-[178px] overflow-hidden justify-between relative shadow-lg shadow-black/80">
          <View className="absolute -right-5 -top-4 opacity-[0.06]">
            <MaterialCommunityIcons name="fire" size={150} color="#FFFFFF" />
          </View>

          <View>
            <Text className="text-[#7DA7FF] text-[10px] font-bold tracking-[2px] uppercase leading-[14px]">
              CURRENT{"\n"}STREAK
            </Text>
            <Text className="text-white text-[64px] font-black tracking-[-3px] leading-[66px] mt-1 relative z-10">
              {streakCount}
            </Text>
          </View>

          <Text className="text-white/40 text-[13px] font-medium tracking-wide relative z-10 mt-auto">
            Days consistent
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
