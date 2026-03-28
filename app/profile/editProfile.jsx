import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { requireOptionalNativeModule } from "expo-modules-core";
import useAuthStore from "../../lib/store/useAuthStore";
import { usersAPI } from "../../lib/api";
import { useEffect, useState } from "react";

const SYMBOLS = [
  "zap", "star", "navigation", "award",
  "aperture", "cpu", "sun", "heart",
  "anchor", "hexagon", "cloud-lightning", "globe"
];

function sanitizeUsername(value = "") {
  return value
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildDisplayUsername(user) {
  const fallback =
    user?.username ||
    user?.email?.split("@")[0] ||
    user?.full_name ||
    "";

  const normalized = sanitizeUsername(fallback);
  return normalized ? `@${normalized}` : "";
}

function InputField({ label, value, onChangeText, editable = true, icon }) {
// ... existing InputField
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
            color={editable ? "#7CA6FF" : "#FFFFFF"} 
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

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(buildDisplayUsername(user));
  const [activeSymbol, setActiveSymbol] = useState(user?.symbol || "star");
  const [newAvatarBase64, setNewAvatarBase64] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayAvatar = newAvatarBase64 || user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = (fullName || user?.full_name || user?.email || "L").charAt(0).toUpperCase();

  useEffect(() => {
    const profileIdentity = {
      username: user?.username,
      email: user?.email,
      full_name: user?.full_name,
    };

    setFullName(user?.full_name || "");
    setUsername(buildDisplayUsername(profileIdentity));
    setActiveSymbol(user?.symbol || "star");
  }, [user?.email, user?.full_name, user?.symbol, user?.username]);

  useEffect(() => {
    let isMounted = true;

    async function refreshProfile() {
      if (!user?.id || (user?.email && user?.username)) {
        return;
      }

      try {
        const profileRes = await usersAPI.getMe();
        if (!isMounted || !profileRes?.data) {
          return;
        }

        await updateUser({ ...user, ...profileRes.data });
      } catch (error) {
        console.log("Profile refresh error:", error);
      }
    }

    refreshProfile();

    return () => {
      isMounted = false;
    };
  }, [updateUser, user]);

  const pickImage = async () => {
    let ImagePicker;

    if (!requireOptionalNativeModule("ExponentImagePicker")) {
      Alert.alert(
        "Image picker unavailable",
        "This development build does not include expo-image-picker yet. Rebuild the dev client to enable profile photo uploads."
      );
      return;
    }

    try {
      const imagePickerModule = require("expo-image-picker");
      ImagePicker = imagePickerModule?.default ?? imagePickerModule;
    } catch (e) {
      console.log("Image picker load error:", e);
      Alert.alert(
        "Image picker unavailable",
        "This development build does not include expo-image-picker yet. Rebuild the dev client to enable profile photo uploads."
      );
      return;
    }

    if (
      !ImagePicker?.requestMediaLibraryPermissionsAsync ||
      !ImagePicker?.launchImageLibraryAsync
    ) {
      Alert.alert(
        "Image picker unavailable",
        "This development build does not include expo-image-picker yet. Rebuild the dev client to enable profile photo uploads."
      );
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo library access to update your profile image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2, // Keep it extremely small for db base64 save
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        setNewAvatarBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e) {
      console.log("Image picker error:", e);
      Alert.alert(
        "Photo selection failed",
        "We couldn't open the photo library right now."
      );
    }
  };

  const handleSave = async () => {
    const normalizedFullName = fullName.trim();
    const normalizedUsername = sanitizeUsername(username);

    if (!normalizedFullName) {
      Alert.alert("Missing full name", "Please enter your full name before saving.");
      return;
    }

    if (!normalizedUsername) {
      Alert.alert("Missing username", "Please enter a valid username before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        username: normalizedUsername,
        full_name: normalizedFullName,
        symbol: activeSymbol
      };
      
      if (newAvatarBase64) {
        payload.avatar_url = newAvatarBase64;
      }
      
      const response = await usersAPI.updateMe(payload);
      const profile = response?.data?.profile || payload;
      
      if (user) {
        // Update local Zustand store so app UI reflects changes immediately
        await updateUser({
          ...user,
          ...profile,
          avatar_url: profile.avatar_url || newAvatarBase64 || user.avatar_url,
        });
      }
      
      router.back();
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-[#7CA6FF] text-4xl font-black">{initial}</Text>
              )}
            </View>
            <TouchableOpacity onPress={pickImage} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#7CA6FF] border-2 border-[#090A0E] items-center justify-center shadow-lg shadow-[#7CA6FF]/50 active:bg-[#4F8EF7]">
              <Feather name="edit-2" size={12} color="#0D1B36" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={pickImage} className="mt-4 active:opacity-70">
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
            icon="at-sign"
          />
          <InputField 
            label="Email Address" 
            value={user?.email || ""} 
            editable={false} 
            icon="mail"
          />
          <InputField 
            label="Full Name" 
            value={fullName} 
            onChangeText={setFullName} 
            icon="user"
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
          disabled={isSaving}
          activeOpacity={0.8}
          className={`w-full bg-[#7CA6FF] items-center justify-center py-[18px] rounded-full shadow-lg shadow-[#7CA6FF]/30 ${isSaving ? 'opacity-50' : 'opacity-100'}`}
        >
          <Text className="text-[#0D1B36] font-bold text-[15px]">{isSaving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
