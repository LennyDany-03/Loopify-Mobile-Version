import { View, Text, Image } from "react-native";

// size: "sm" | "md" | "lg" | "xl"
// Shows image if uri provided, otherwise shows initials

export default function Avatar({ name = "", uri = null, size = "md", className = "" }) {
  const sizes = {
    sm: { container: "w-8 h-8",   text: "text-xs"  },
    md: { container: "w-10 h-10", text: "text-sm"  },
    lg: { container: "w-14 h-14", text: "text-lg"  },
    xl: { container: "w-20 h-20", text: "text-2xl" },
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      className={`
        ${sizes[size].container}
        rounded-full
        bg-[#4F8EF7]/20
        border border-[#4F8EF7]/30
        items-center justify-center
        overflow-hidden
        ${className}
      `}
    >
      {uri ? (
        <Image
          source={{ uri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <Text className={`text-[#4F8EF7] font-bold ${sizes[size].text}`}>
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}