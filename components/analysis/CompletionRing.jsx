import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function CompletionRing({ percentage = 85, activeLoops = 12, streak = 14 }) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center">
      {/* Donut Chart */}
      <View className="items-center justify-center mb-10 relative">
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          {/* Track */}
          <Circle
            cx={cx} cy={cy} r={radius}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc with glow */}
          <Circle
            cx={cx} cy={cy} r={radius}
            stroke="#4F8EF7"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
          />
        </Svg>

        {/* Center label */}
        <View className="absolute items-center justify-center">
          <View className="flex-row items-baseline">
            <Text className="text-white text-[56px] font-bold tracking-tighter">{percentage}</Text>
            <Text className="text-[#4F8EF7] text-2xl font-bold ml-1">%</Text>
          </View>
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-[3px] -mt-1">
            Completed
          </Text>
        </View>
      </View>

      {/* Stats Cards Row */}
      <View className="flex-row gap-4 w-full">
         <View className="flex-1 bg-[#11131A] rounded-[24px] p-5 border border-white/5 items-center">
            <Text className="text-[#72A6FF] text-[9px] font-bold tracking-widest uppercase mb-1">Active Loops</Text>
            <Text className="text-white text-2xl font-bold">{activeLoops}</Text>
         </View>
         
         <View className="flex-1 bg-[#11131A] rounded-[24px] p-5 border border-white/5 items-center">
            <Text className="text-[#72A6FF] text-[9px] font-bold tracking-widest uppercase mb-1">Streak</Text>
            <Text className="text-white text-2xl font-bold">{streak}d</Text>
         </View>
      </View>
    </View>
  );
}