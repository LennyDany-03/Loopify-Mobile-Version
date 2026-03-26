import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import SignInForm from "../../components/auth/SignInForm";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { getGoogleAuthAvailability } from "../../lib/googleAuth";
import { useAuth } from "../../lib/hooks/useAuth";

export default function SignIn() {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const googleAuth = getGoogleAuthAvailability();

  const handleSignIn = async (form) => {
    clearError();
    await login(form);
  };

  const handleGoogleSignIn = async () => {
    clearError();
    await loginWithGoogle();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#050508]">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 pt-16 pb-8">
        <View className="items-center mb-10 w-full">
          <View className="w-14 h-14 rounded-full bg-[#11131A] border border-white/5 items-center justify-center mb-5">
            <Text className="text-white text-2xl font-bold">∞</Text>
          </View>
          <Text className="text-4xl font-bold text-[#4F8EF7] tracking-tight">Loopify</Text>
          <Text className="text-white/50 text-base mt-2">Precision productivity.</Text>
        </View>

        <View className="bg-[#0B0D14] border border-white/5 rounded-[40px] p-6 w-full mb-8 shadow-2xl shadow-black">
          <View className="flex-row items-center mb-8 mt-2">
            <View className="w-1 h-6 bg-[#4F8EF7] rounded-full mr-3" />
            <Text className="text-2xl text-white font-bold">Sign In</Text>
          </View>

          <SignInForm onSubmit={handleSignIn} isLoading={isLoading} error={error} />

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-white/5" />
            <Text className="text-white/30 text-xs px-4 font-semibold tracking-wider">OR CONTINUE WITH</Text>
            <View className="flex-1 h-[1px] bg-white/5" />
          </View>

          <GoogleAuthButton
            onPress={handleGoogleSignIn}
            loading={isLoading}
            disabled={!googleAuth.available}
            helperText={!googleAuth.available ? googleAuth.error : null}
          />
        </View>

        <View className="flex-1" />

        <View className="items-center mt-6">
          <Link href="/sign-up" asChild>
            <TouchableOpacity className="flex-row gap-1">
              <Text className="text-white/50">New to Loopify?</Text>
              <Text className="text-[#4F8EF7] font-semibold">Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
