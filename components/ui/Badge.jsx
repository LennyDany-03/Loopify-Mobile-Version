import { View, Text } from "react-native";

// variant: "violet" | "blue" | "green" | "orange" | "red" | "gray"

export default function Badge({ label, variant = "violet", className = "" }) {
  const variants = {
    violet: "bg-[#7c6cfc]/15 border border-[#7c6cfc]/30",
    blue:   "bg-[#4F8EF7]/15 border border-[#4F8EF7]/30",
    green:  "bg-[#4ade80]/15 border border-[#4ade80]/30",
    orange: "bg-[#fb923c]/15 border border-[#fb923c]/30",
    red:    "bg-[#f87171]/15 border border-[#f87171]/30",
    gray:   "bg-white/[0.06] border border-white/[0.10]",
  };

  const textVariants = {
    violet: "text-[#a78bfa]",
    blue:   "text-[#4F8EF7]",
    green:  "text-[#4ade80]",
    orange: "text-[#fb923c]",
    red:    "text-[#f87171]",
    gray:   "text-white/50",
  };

  return (
    <View
      className={`
        self-start px-3 py-1 rounded-full
        ${variants[variant]}
        ${className}
      `}
    >
      <Text className={`text-xs font-semibold ${textVariants[variant]}`}>
        {label}
      </Text>
    </View>
  );
}