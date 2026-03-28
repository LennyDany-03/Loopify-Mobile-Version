import { useRef } from "react";
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import LoopIcon from '../ui/LoopIcon';

export default function ActiveLoopCard({ loop, onLongPressLoop }) {
  const suppressNextPress = useRef(false);

  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = loop.completion_rate / 100 || 0;
  const strokeDashoffset = circumference - progress * circumference;

  function handlePress() {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }

    router.push(`/loops/${loop.id}`);
  }

  function handleLongPress() {
    suppressNextPress.current = true;
    onLongPressLoop?.(loop);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={320}
      className="bg-[#0D1017] rounded-[28px] p-5 mb-4 flex-row items-center justify-between border border-white/5"
    >
      {/* Left items (Ring + Texts) */}
      <View className="flex-row items-center flex-1">
        {/* Progress Ring */}
        <View className="mr-4 items-center justify-center">
          <Svg width={size} height={size}>
            <Circle 
               stroke="#ffffff08" 
               fill="none" 
               cx={size/2} 
               cy={size/2} 
               r={radius} 
               strokeWidth={strokeWidth} 
            />
            <Circle 
               stroke={loop.color || "#4F8EF7"} 
               fill="none" 
               cx={size/2} 
               cy={size/2} 
               r={radius} 
               strokeWidth={strokeWidth} 
               strokeDasharray={circumference} 
               strokeDashoffset={strokeDashoffset} 
               strokeLinecap="round" 
               transform={`rotate(-90 ${size/2} ${size/2})`} 
            />
          </Svg>
          <View className="absolute">
             <LoopIcon icon={loop.icon} fallback="activity" size={20} color={loop.iconColor || "#fff"} />
          </View>
        </View>

        {/* Text Area */}
        <View className="flex-1 pr-2">
           <Text className="text-white text-lg font-bold tracking-tight mb-1" numberOfLines={1}>
             {loop.title || loop.name}
           </Text>
           <View className="flex-row items-center mb-2">
             <View className={`w-1.5 h-1.5 rounded-full mr-2`} style={{ backgroundColor: loop.color || "#4F8EF7" }} />
             <Text className="text-white/40 text-xs font-medium tracking-wide">
               {loop.category}
             </Text>
           </View>
           
           {/* Streak Badge */}
           <View className="self-start px-3 py-1 bg-[#1A1C24] rounded-full flex-row items-center gap-1">
             <Text className="text-[#A2C3FF] text-[10px]">🔥</Text>
             <Text className="text-[#A2C3FF] text-[9px] font-bold tracking-widest uppercase ml-0.5">
               {loop.current_streak} {loop.current_streak === 1 ? "Day" : "Days"} Streak
             </Text>
           </View>
        </View>
      </View>

      {/* Right chevron */}
      <View className="w-10 h-10 rounded-full bg-[#1A1C24] items-center justify-center">
         <Feather name="chevron-right" size={18} color="#ffffff60" />
      </View>

    </TouchableOpacity>
  );
}
