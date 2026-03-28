import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function DeleteLoopModal({ isVisible, onCancel, onConfirm, loopName }) {
  const { theme } = useAppTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: theme.overlay }}
        onPress={onCancel}
      >
        <View
          className="w-full rounded-[32px] p-8 items-center border"
          style={{ backgroundColor: theme.surface, borderColor: theme.borderStrong }}
          onStartShouldSetResponder={() => true}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6 border"
            style={{
              backgroundColor: `${theme.danger}1A`,
              borderColor: `${theme.danger}33`,
            }}
          >
            <Feather name="trash-2" size={32} color={theme.danger} />
          </View>

          <Text className="text-2xl font-bold mb-3 text-center tracking-tight" style={{ color: theme.text }}>
            Delete Loop Now?
          </Text>

          <Text className="text-[15px] text-center leading-6 mb-8 px-2 font-medium" style={{ color: theme.textMuted }}>
            {loopName ? (
              <Text style={{ color: theme.text, fontWeight: "700" }}>{loopName}</Text>
            ) : "This loop"}{" "}
            will be removed from your active loops. This action cannot be reversed.
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 py-4 rounded-[20px] border items-center justify-center"
              style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
            >
              <Text className="text-base font-bold" style={{ color: theme.text }}>
                Keep it
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              className="flex-1 py-4 rounded-[20px] items-center justify-center"
              style={{ backgroundColor: theme.danger }}
            >
              <Text className="text-base font-extrabold uppercase tracking-wide" style={{ color: "#050508" }}>
                Delete Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
