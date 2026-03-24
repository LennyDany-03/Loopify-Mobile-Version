import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import SignUpForm from "../../components/auth/SignUpForm";
import { useAuth } from "../../lib/hooks/useAuth";

export default function SignUp() {
  const { register, isLoading, error, clearError } = useAuth();

  const handleSignUp = async (form) => {
    clearError();
    await register(form);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-12 pb-8">
        <View className="mb-8 mt-4">
          <Text className="text-5xl font-bold text-[#4F8EF7] tracking-tighter">Loopify</Text>
          <Text className="text-white/60 text-lg mt-2 font-medium">Begin your kinetic journey.</Text>
        </View>

        <View className="bg-[#0B0D14] border border-white/5 rounded-[40px] p-6 mb-8 w-full shadow-2xl shadow-black/50">
          <SignUpForm onSubmit={handleSignUp} isLoading={isLoading} error={error} />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-white/5" />
            <Text className="text-white/30 text-xs px-4 font-semibold tracking-wider">OR CONTINUE WITH</Text>
            <View className="flex-1 h-[1px] bg-white/5" />
          </View>

          <TouchableOpacity
            className="w-full flex-row items-center justify-center bg-[#13151A] rounded-2xl py-4 border border-white/5"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">
              <Text className="text-[#DB4437] font-bold">G</Text>  Google
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1" />

        <View className="items-center mt-2">
          <Link href="/sign-in" asChild>
            <TouchableOpacity className="flex-row gap-1">
              <Text className="text-white/50">Already have an account?</Text>
              <Text className="text-[#4F8EF7] font-semibold">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
