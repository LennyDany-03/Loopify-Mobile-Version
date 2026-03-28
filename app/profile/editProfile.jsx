import { View, Text, Image, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useAuthStore from "../../lib/store/useAuthStore";
import { useState } from "react";

const SYMBOLS = [
  "zap", "star", "rocket", "award",
  "aperture", "cpu", "sun", "heart",
  "anchor", "hexagon", "cloud-lightning", "globe"
];

function InputField({ label, value, onChangeText, editable = true, icon }) {
  return (
    <View className="mb-5">
      <Text className="text-white/60 text-[10px] font-bold mb-2 ml-1 tracking-wide">
        {label}
      </Text>
      <View className="flex-row items-center bg-[#0F121A] rounded-[20px] px-5 py-4 border border-white/5">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          className="flex-1 text-white text-[15px] font-bold tracking-wide"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        <View className="ml-3 opacity-60">
          <Feather 
            name={icon || (editable ? "edit-2" : "lock")} 
            size={14} 
            color={editable ? "#7DA7FF" : "#FFFFFF"} 
          />
        </View>
      </View>
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [fullName, setFullName] = useState(user?.full_name || "Lenny");
  const [username, setUsername] = useState(`@${(user?.full_name?.split(" ")[0] || "Lenny").toLowerCase()}_loops`);
  const [activeSymbol, setActiveSymbol] = useState("star");

  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = fullName.charAt(0).toUpperCase();

  const handleSave = () => {
    // Optimistic fallback update for the UI if API isn't fully robust for these fields
    if (user) {
      updateUser({ ...user, full_name: fullName });
    }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#090A0E]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Navigation Bar */}
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/5 active:bg-white/10"
          >
            <Feather name="arrow-left" size={18} color="#7CA6FF" />
          </TouchableOpacity>

          <Text className="text-[#88AFFF] text-lg font-black tracking-tight ml-4">Loopify</Text>

          {/* Invisible spacer to perfectly center the logo */}
          <View className="w-10 h-10" />
        </View>

        {/* Profile Image Editor */}
        <View className="items-center mb-8">
          <View className="relative">
            <View className="w-24 h-24 rounded-full border-2 border-[#1E2536] items-center justify-center overflow-hidden bg-[#0B0D14]">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[#7CA6FF] text-4xl font-black">{initial}</Text>
              )}
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#7CA6FF] border-2 border-[#090A0E] items-center justify-center shadow-lg shadow-[#7CA6FF]/50 active:bg-[#4F8EF7]">
              <Feather name="edit-2" size={12} color="#0D1B36" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="mt-4 active:opacity-70">
            <Text className="text-[#7CA6FF] text-[10px] font-bold tracking-[2px] uppercase">
              Edit Profile Image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Forms */}
        <View className="mb-4">
          <InputField 
            label="Username" 
            value={username} 
            onChangeText={setUsername} 
          />
          <InputField 
            label="Email Address" 
            value={user?.email || "lenny@loopify.com"} 
            editable={false} 
          />
          <InputField 
            label="Full Name" 
            value={fullName} 
            onChangeText={setFullName} 
          />
        </View>

        {/* Symbol Grid */}
        <Text className="text-white text-[15px] font-bold mb-4 ml-1">Choose Your Symbol</Text>
        <View className="bg-[#0F121A] rounded-[32px] p-6 border border-white/5 mb-8">
          <View className="flex-row flex-wrap justify-between gap-y-6">
            {SYMBOLS.map((symbol) => {
              const isActive = activeSymbol === symbol;
              return (
                <TouchableOpacity
                  key={symbol}
                  onPress={() => setActiveSymbol(symbol)}
                  className={`w-[52px] h-[52px] rounded-full items-center justify-center border ${
                    isActive ? "bg-[#7CA6FF]/20 border-[#7CA6FF]" : "bg-white/5 border-transparent"
                  }`}
                >
                  <Feather 
                    name={symbol} 
                    size={20} 
                    color={isActive ? "#7CA6FF" : "rgba(255,255,255,0.5)"} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          onPress={handleSave}
          activeOpacity={0.8}
          className="w-full bg-[#7CA6FF] items-center justify-center py-[18px] rounded-full shadow-lg shadow-[#7CA6FF]/30"
        >
          <Text className="text-[#0D1B36] font-bold text-[15px]">Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
