import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SignInForm({ onSubmit, isLoading, error }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const e = {};
    if (!form.email)    e.email    = "Email is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit(form);
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

      {/* Forgot password */}
      <TouchableOpacity className="self-end mb-6 -mt-2">
        <Text className="text-[#4F8EF7] text-xs font-semibold tracking-wide">
          FORGOT PASSWORD?
        </Text>
      </TouchableOpacity>

      {/* Sign in button */}
      <Button onPress={handleSubmit} loading={isLoading} size="lg" className="w-full">
        Sign In
      </Button>

    </View>
  );
}