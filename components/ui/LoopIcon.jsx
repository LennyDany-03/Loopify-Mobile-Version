import { Text } from "react-native";
import { Feather } from "@expo/vector-icons";

function isFeatherIconName(icon) {
  return typeof icon === "string" && /^[a-z0-9-]+$/i.test(icon.trim());
}

export default function LoopIcon({ icon, fallback = "repeat", size = 20, color = "#ffffff" }) {
  if (typeof icon === "string" && icon.trim()) {
    if (isFeatherIconName(icon)) {
      return <Feather name={icon.trim()} size={size} color={color} />;
    }

    return <Text style={{ fontSize: size }}>{icon}</Text>;
  }

  return <Feather name={fallback} size={size} color={color} />;
}
