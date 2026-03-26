import { Text, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Button from "../ui/Button";

export default function GoogleAuthButton({
  onPress,
  loading,
  disabled = false,
  helperText,
  label = "Continue with Google",
}) {
  return (
    <View>
      <Button
        onPress={onPress}
        loading={loading}
        disabled={loading || disabled}
        size="lg"
        variant="secondary"
        className="w-full bg-[#13151A] border border-white/5"
        icon={<AntDesign name="google" size={18} color="#FFFFFF" />}
      >
        {label}
      </Button>

      {helperText ? (
        <Text className="text-white/40 text-xs leading-5 mt-3 px-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
