import { View, Text, Image } from "react-native";
import useAppTheme from "../../lib/hooks/useAppTheme";

export default function GreetingHeader({ user }) {
  const { theme } = useAppTheme();
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const initial = firstName.charAt(0).toUpperCase();
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;

  return (
    <View
      className="mb-8 mt-2 rounded-[30px] border px-5 py-5 shadow-2xl"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        shadowColor: theme.shadow,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1 pr-4">
          <Text className="text-[14px] font-semibold tracking-wide mb-2" style={{ color: theme.textSoft }}>
            Welcome back,
          </Text>
          <Text className="text-[38px] font-black leading-[42px] tracking-tight" style={{ color: theme.text }}>
            {firstName}
          </Text>
          <Text className="text-[14px] mt-3 leading-6" style={{ color: theme.textMuted }}>
            Your kinetic loops are ready for execution.
          </Text>
        </View>

        <View
          className="w-[76px] h-[76px] rounded-full items-center justify-center border overflow-hidden"
          style={{
            backgroundColor: theme.surfaceRaised,
            borderColor: theme.borderStrong,
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-2xl font-black pt-1" style={{ color: theme.accentSoft }}>
              {initial}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
