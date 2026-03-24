import { View, TouchableOpacity } from "react-native";

// variant: "default" | "highlight" | "glass"
// Use onPress to make it tappable

export default function Card({
  children,
  variant = "default",
  onPress,
  className = "",
}) {
  const variants = {
    default:   "bg-[#0f0f1a] border border-[#ffffff0a]",
    highlight: "bg-[#4F8EF7]/10 border border-[#4F8EF7]/20",
    glass:     "bg-[#ffffff06] border border-[#ffffff0f]",
  };

  const base = `rounded-3xl p-5 ${variants[variant]} ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} className={base}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View className={base}>{children}</View>;
}