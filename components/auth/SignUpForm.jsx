import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SignUpForm({ onSubmit, isLoading, error }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    agreed: false,
  });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const e = {};
    if (!form.full_name)       e.full_name = "Full name is required";
    if (!form.email)           e.email     = "Email is required";
    if (!form.password)        e.password  = "Password is required";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm_password)
      e.confirm_password = "Passwords do not match";
    if (!form.agreed)
      e.agreed = "You must agree to the Terms of Service";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      full_name: form.full_name,
      email:     form.email,
      password:  form.password,
    });
  }

  return (
    <View className="w-full">

      {/* API error banner */}
      {error && (
        <View className="bg-[#f87171]/10 border border-[#f87171]/20 rounded-2xl px-4 py-3 mb-5">
          <Text className="text-[#f87171] text-sm">{error}</Text>
        </View>
      )}

      <Input
        label="Full Name"
        value={form.full_name}
        onChangeText={(v) => set("full_name", v)}
        placeholder="John Doe"
        autoCapitalize="words"
        error={errors.full_name}
      />

      <Input
        label="Email Address"
        value={form.email}
        onChangeText={(v) => set("email", v)}
        placeholder="hello@loopify.io"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />

      <Input
        label="Password"
        value={form.password}
        onChangeText={(v) => set("password", v)}
        placeholder="••••••••"
        secureTextEntry
        error={errors.password}
      />

      <Input
        label="Confirm Password"
        value={form.confirm_password}
        onChangeText={(v) => set("confirm_password", v)}
        placeholder="••••••••"
        secureTextEntry
        error={errors.confirm_password}
      />

      {/* Terms agreement */}
      <TouchableOpacity
        onPress={() => set("agreed", !form.agreed)}
        className="flex-row items-start gap-3 mb-6"
        activeOpacity={0.7}
      >
        <View
          className={`
            w-5 h-5 mt-0.5 rounded-md border-2 items-center justify-center
            ${form.agreed
              ? "bg-[#4F8EF7] border-[#4F8EF7]"
              : "bg-transparent border-white/20"}
          `}
        >
          {form.agreed && (
            <Text className="text-white text-[10px] font-bold">✓</Text>
          )}
        </View>
        <Text className="text-white/40 text-sm flex-1">
          I agree to the{" "}
          <Text className="text-[#4F8EF7]">Terms of Service</Text>
          {" "}and{" "}
          <Text className="text-[#4F8EF7]">Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      {errors.agreed && (
        <Text className="text-[#f87171] text-xs -mt-4 mb-4 ml-1">
          {errors.agreed}
        </Text>
      )}

      {/* Create account button */}
      <Button onPress={handleSubmit} loading={isLoading} size="lg" className="w-full">
        Create Account
      </Button>

    </View>
  );
}