import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function DeleteLoopModal({ isVisible, onCancel, onConfirm, loopName }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <Pressable 
        className="flex-1 bg-black/80 items-center justify-center px-6" 
        onPress={onCancel}
      >
        <View 
          className="w-full bg-[#0B0D14] rounded-[32px] p-8 items-center border border-white/10"
          onStartShouldSetResponder={() => true}
        >
          <View className="w-20 h-20 rounded-full bg-[#FF8E92]/10 items-center justify-center mb-6 border border-[#FF8E92]/20">
            <Feather name="trash-2" size={32} color="#FF8E92" />
          </View>
          
          <Text className="text-white text-2xl font-bold mb-3 text-center tracking-tight">
            Delete Loop Now?
          </Text>
          
          <Text className="text-white/50 text-[15px] text-center leading-6 mb-8 px-2 font-medium">
            {loopName ? (
              <Text className="text-white font-bold">"{loopName}"</Text>
            ) : "This loop"} will be removed from your active loops. This action cannot be reversed.
          </Text>
          
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 bg-[#11131A] py-4 rounded-[20px] border border-white/5 items-center justify-center"
            >
              <Text className="text-white text-base font-bold">Keep it</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={onConfirm}
              className="flex-1 bg-[#FF8E92] py-4 rounded-[20px] items-center justify-center"
            >
              <Text className="text-[#050508] text-base font-extrabold uppercase tracking-wide">
                Delete Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
