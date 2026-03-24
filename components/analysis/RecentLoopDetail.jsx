import { View, Text, TouchableOpacity } from 'react-native';

export default function RecentLoopDetail({ data = [] }) {
  return (
    <View className="gap-3">
      {data.map((item, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          className="flex-row items-center bg-[#0B0D14] border border-white/5 rounded-[24px] px-5 py-5"
        >
          {/* Icon Box */}
          <View className="w-11 h-11 rounded-2xl bg-[#1A1C24] items-center justify-center mr-4">
             <Text className="text-xl">{item.icon}</Text>
          </View>

          {/* Text Content */}
          <View className="flex-1">
             <Text className="text-white font-bold text-base tracking-tight mb-0.5">{item.name}</Text>
             <Text className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{item.goal}</Text>
          </View>

          {/* Trend Delta */}
          <View className="items-end">
             <Text className={`text-[12px] font-bold ${item.positive ? 'text-[#72A6FF]' : 'text-white/60'}`}>
                {item.positive ? '+' : ''}{item.delta}%
             </Text>
             <Text className="text-white/30 text-[8px] font-bold tracking-widest uppercase mt-0.5">
                vs prev week
             </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
