import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LoopIcon from '../ui/LoopIcon';

export default function LoopDetailHeader({ loop }) {
  const router = useRouter();

  if (!loop) return null;

  return (
    <View className="mb-6">
      {/* Top Bar matching dashboard */}
      <View className="flex-row items-center justify-between mb-8 mt-4">
        <View className="flex-row items-center gap-2">
           <TouchableOpacity onPress={() => router.back()} className="mr-2">
             <Feather name="arrow-left" size={24} color="#ffffff80" />
           </TouchableOpacity>
           <View className="w-8 h-8 rounded-full bg-[#11131A] border border-white/5 items-center justify-center overflow-hidden">
             {/* Simple avatar mock */}
             <View className="w-full h-full bg-[#3d7068] items-center justify-end">
               <View className="w-4 h-4 rounded-full bg-[#ffeed9] mb-0.5" />
             </View>
           </View>
           <Text className="text-xl font-bold text-[#4F8EF7] italic tracking-tight">Loopify</Text>
        </View>
        <Ionicons name="flash" size={20} color="#ffffff60" />
      </View>

      {/* Protocol Badge */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-8 h-8 rounded-full bg-[#A2C3FF] items-center justify-center">
            <LoopIcon icon={loop.icon} fallback="droplet" size={14} color="#050508" />
        </View>
        <Text className="text-[#72A6FF] text-[10px] font-bold tracking-widest uppercase">
          Active Protocol
        </Text>
      </View>

      {/* Title & Desc */}
      <Text className="text-white text-[38px] font-bold leading-[44px] tracking-tight mb-4">
        {loop.title || loop.name}
      </Text>
      <Text className="text-[#ffffff80] text-[15px] leading-6 tracking-wide pr-4">
        {loop.description || loop.category || "Track your consistency one session at a time."}
      </Text>
    </View>
  );
}
