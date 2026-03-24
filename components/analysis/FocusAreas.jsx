import { View, Text } from "react-native";

export default function FocusAreas({ data = [] }) {
  return (
    <View className="gap-6">
      {data.map((item, i) => (
        <View key={i}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {item.category}
            </Text>
            <Text className="text-white font-bold text-xs">
              {item.percent}%
            </Text>
          </View>
          <View className="h-[3px] bg-white/5 rounded-full overflow-hidden">
            <View 
              className="h-full bg-[#4F8EF7] rounded-full" 
              style={{ width: `${item.percent}%` }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}