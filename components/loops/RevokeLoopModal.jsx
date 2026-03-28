import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function RevokeLoopModal({
  isVisible,
  onCancel,
  onConfirm,
  title = "Undo today's progress?",
  subtitle = "This removes today's check-in and unlocks the loop again.",
  confirmLabel = "Undo",
}) {
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
              backgroundColor: `${theme.warning}1A`,
              borderColor: `${theme.warning}33`,
            }}
          >
            <Feather name="rotate-ccw" size={32} color={theme.warning} />
          </View>

          <Text className="text-2xl font-bold mb-3 text-center tracking-tight" style={{ color: theme.text }}>
            {title}
          </Text>

          <Text className="text-[15px] text-center leading-6 mb-8 px-2 font-medium" style={{ color: theme.textMuted }}>
            {subtitle}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onCancel}
              className="flex-1 py-4 rounded-[20px] border items-center justify-center"
              style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.border }}
            >
              <Text className="text-base font-bold" style={{ color: theme.text }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onConfirm}
              className="flex-1 py-4 rounded-[20px] items-center justify-center"
              style={{ backgroundColor: theme.warning }}
            >
              <Text className="text-base font-extrabold uppercase tracking-wide" style={{ color: "#050508" }}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
