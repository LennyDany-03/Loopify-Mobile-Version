import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

// variant: "primary" | "secondary" | "ghost" | "danger"
// size: "sm" | "md" | "lg"

export default function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  className = "",
}) {
  const base = "flex-row items-center justify-center rounded-2xl";

  const variants = {
    primary:   "bg-[#4F8EF7]",
    secondary: "bg-[#1a1a2e] border border-[#ffffff15]",
    ghost:     "bg-transparent border border-[#ffffff15]",
    danger:    "bg-[#f87171]/20 border border-[#f87171]/30",
  };

  const sizes = {
    sm: "px-4 py-2",
    md: "px-6 py-4",
    lg: "px-8 py-5",
  };

  const textVariants = {
    primary:   "text-white font-bold",
    secondary: "text-white/80 font-semibold",
    ghost:     "text-white/60 font-semibold",
    danger:    "text-[#f87171] font-semibold",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? "opacity-50" : "opacity-100"}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#fff" : "#4F8EF7"}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && icon}
          <Text className={`${textVariants[variant]} ${textSizes[size]}`}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}