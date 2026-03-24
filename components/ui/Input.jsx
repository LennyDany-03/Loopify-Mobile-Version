import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  leftIcon = null,
  error = null,
  className = "",
  ...props
}) {
  const [focused, setFocused]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View className={`mb-4 ${className}`}>
      {/* Label */}
      {label && (
        <Text className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
          {label}
        </Text>
      )}

      {/* Input row */}
      <View
        className={`
          flex-row items-center
          bg-[#13131f] rounded-2xl px-4 h-14
          border
          ${focused ? "border-[#4F8EF7]" : "border-[#ffffff0f]"}
          ${error ? "border-[#f87171]" : ""}
        `}
      >
        {/* Left icon */}
        {leftIcon && (
          <View className="mr-3 opacity-40">{leftIcon}</View>
        )}

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#ffffff25"
          secureTextEntry={isPassword && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 text-white text-base"
          {...props}
        />

        {/* Show/hide password toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPass(!showPass)}
            className="ml-2 opacity-40"
          >
            <Text className="text-white text-sm">
              {showPass ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {error && (
        <Text className="text-[#f87171] text-xs mt-1.5 ml-1">{error}</Text>
      )}
    </View>
  );
}