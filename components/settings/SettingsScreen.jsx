import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../ui/Button";
import { useAuth } from "../../lib/hooks/useAuth";
import useAuthStore from "../../lib/store/useAuthStore";

export default function SettingsScreen() {
  const { logout, isLoading } = useAuth();
  const user = useAuthStore((state) => state.user);

  return (
    <SafeAreaView className="flex-1 bg-[#050508] p-6 justify-center items-center">
      <Text className="text-white text-4xl font-bold mb-2">Settings</Text>
      <Text className="text-white/50 text-base mb-2">Manage your Loopify preferences.</Text>
      <Text className="text-white/70 text-base mb-10">
        Signed in as {user?.full_name || user?.email || "your account"}
      </Text>

      <Button variant="danger" size="lg" className="w-full" loading={isLoading} onPress={logout}>
        Sign Out
      </Button>
    </SafeAreaView>
  );
}
