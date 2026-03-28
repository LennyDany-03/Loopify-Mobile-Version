import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import useLoopStore from "../../lib/store/useLoopStore";

const CATEGORY_OPTIONS = [
  { label: "Health", value: "Health" },
  { label: "Fitness", value: "Fitness" },
  { label: "Work", value: "Work" },
  { label: "Study", value: "Study" },
  { label: "Mindfulness", value: "Mindfulness" },
  { label: "Finance", value: "Finance" },
  { label: "Creative", value: "Creative" },
  { label: "Social", value: "Social" },
  { label: "General", value: "General" },
];

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily", icon: "calendar-today" },
  { label: "Weekly", value: "weekly", icon: "view-week" },
  { label: "Custom", value: "custom", icon: "calendar-month" },
];

const TARGET_OPTIONS = [
  {
    label: "Yes/No",
    value: "boolean",
    description: "Binary completion tracking",
    icon: "check-circle",
  },
  {
    label: "Duration",
    value: "duration",
    description: "Track hours and minutes",
    icon: "clock-outline",
  },
  {
    label: "Number",
    value: "number",
    description: "Track a measurable amount",
    icon: "counter",
  },
];

const CUSTOM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ICON_OPTIONS = [
  "heart",
  "activity",
  "briefcase",
  "book-open",
  "dollar-sign",
  "moon",
  "edit-3",
  "users",
  "droplet",
  "target",
  "music",
  "coffee",
  "sun",
  "zap",
  "repeat",
  "clock",
  "bar-chart-2",
];

function getAccentColor(category) {
  switch (category) {
    case "Health":
      return "#7DA7FF";
    case "Fitness":
      return "#72C9FF";
    case "Work":
      return "#4F8EF7";
    case "Study":
      return "#8B9BFF";
    case "Mindfulness":
      return "#77D6C5";
    case "Finance":
      return "#7DDC9A";
    case "Creative":
      return "#FF9C73";
    case "Social":
      return "#F59BE7";
    case "General":
      return "#92A1B5";
    default:
      return "#4F8EF7";
  }
}

function getSuggestedIcon(category, targetType) {
  if (targetType === "duration") {
    return "clock";
  }

  if (targetType === "number") {
    return "bar-chart-2";
  }

  if (category === "Health") {
    return "heart";
  }

  if (category === "Fitness") {
    return "activity";
  }

  if (category === "Work") {
    return "briefcase";
  }

  if (category === "Study") {
    return "book-open";
  }

  if (category === "Mindfulness") {
    return "moon";
  }

  if (category === "Finance") {
    return "dollar-sign";
  }

  if (category === "Creative") {
    return "edit-3";
  }

  if (category === "Social") {
    return "users";
  }

  return "repeat";
}

function getDefaultUnit(targetType) {
  if (targetType === "duration") {
    return "mins";
  }

  if (targetType === "number") {
    return "count";
  }

  return null;
}

export default function CreateLoopScreen() {
  const router = useRouter();
  const createLoop = useLoopStore((state) => state.createLoop);
  const fetchSummary = useLoopStore((state) => state.fetchSummary);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Health");
  const [frequency, setFrequency] = useState("weekly");
  const [targetType, setTargetType] = useState("boolean");
  const [iconName, setIconName] = useState(getSuggestedIcon("Health", "boolean"));
  const [hasCustomIcon, setHasCustomIcon] = useState(false);
  const [targetValue, setTargetValue] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [customDays, setCustomDays] = useState(["Mon", "Wed", "Fri"]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accentColor = getAccentColor(category);
  const previewLabel = name.trim() ? name.trim().toUpperCase() : "INITIALIZING NEW LOOP";

  useEffect(() => {
    if (!hasCustomIcon) {
      setIconName(getSuggestedIcon(category, targetType));
    }
  }, [category, hasCustomIcon, targetType]);

  function toggleCustomDay(day) {
    setCustomDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day]
    );
  }

  function handleIconSelect(icon) {
    setIconName(icon);
    setHasCustomIcon(icon !== getSuggestedIcon(category, targetType));
  }

  function resetSuggestedIcon() {
    setIconName(getSuggestedIcon(category, targetType));
    setHasCustomIcon(false);
  }

  async function handleCreateLoop() {
    if (isSubmitting) {
      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Loop name is required.");
      return;
    }

    if (frequency === "custom" && !customDays.length) {
      setError("Choose at least one day for a custom cadence.");
      return;
    }

    if (targetType !== "boolean") {
      const numericValue = Number(targetValue);

      if (!targetValue || Number.isNaN(numericValue) || numericValue <= 0) {
        setError("Enter a valid target value.");
        return;
      }
    }

    setError("");
    Keyboard.dismiss();
    setIsSubmitting(true);

    const result = await createLoop({
      name: trimmedName,
      category,
      color: accentColor,
      icon: iconName,
      frequency,
      custom_days: frequency === "custom" ? customDays : [],
      target_type: targetType,
      target_value: targetType === "boolean" ? null : Number(targetValue),
      target_unit:
        targetType === "boolean"
          ? null
          : targetUnit.trim() || getDefaultUnit(targetType),
    });

    if (!result.success) {
      setError(result.error || "Failed to create loop.");
      setIsSubmitting(false);
      return;
    }

    const nextLoopId = result.loop?.id;

    if (!nextLoopId) {
      setError("Loop was created, but opening it failed. You can find it in My Loops.");
      setIsSubmitting(false);
      return;
    }

    InteractionManager.runAfterInteractions(() => {
      try {
        router.replace(`/loops/${nextLoopId}`);
        void fetchSummary();
      } catch {
        setError("Loop was created, but opening it failed. You can find it in My Loops.");
        setIsSubmitting(false);
      }
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0D]">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center mr-1"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={22} color="#7DA7FF" />
            </TouchableOpacity>
            <Text className="text-[32px] font-bold text-[#6FA1F8] tracking-tight">
              Create New Loop
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            activeOpacity={0.7}
          >
            <Feather name="more-vertical" size={20} color="#ffffff80" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[30px] overflow-hidden mb-8 border border-[#1F3354]">
            <LinearGradient
              colors={["#05101D", "#0C2A4D", "#08111C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ minHeight: 172, paddingHorizontal: 24, paddingVertical: 22 }}
            >
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className="w-[280px] h-[280px] rounded-full"
                  style={{ borderWidth: 1, borderColor: "#4F8EF71A" }}
                />
              </View>
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className="w-[210px] h-[210px] rounded-full"
                  style={{ borderWidth: 1, borderColor: "#72A6FF20" }}
                />
              </View>
              <View className="absolute inset-0 items-center justify-center">
                <View
                  className="w-[120px] h-[120px] rounded-full"
                  style={{
                    backgroundColor: "#8AB4FF22",
                    borderWidth: 1,
                    borderColor: "#D9E6FF30",
                  }}
                />
              </View>

              <View className="items-center justify-center flex-1">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-5"
                  style={{
                    backgroundColor: "#B6D0FF22",
                    borderWidth: 1,
                    borderColor: "#D9E6FF40",
                  }}
                >
                  <Feather name={iconName} size={32} color={accentColor} />
                </View>
                <Text className="text-[#D9E5F7] text-[15px] font-bold tracking-[2px] text-center">
                  {previewLabel}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View className="mb-8">
            <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
              Loop Name
            </Text>
            <View className="bg-[#171718] rounded-[26px] px-5 py-5 border border-white/5">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter loop identity..."
                placeholderTextColor="#FFFFFF40"
                className="text-white text-base font-semibold"
              />
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {CATEGORY_OPTIONS.map((option) => {
                const isActive = category === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setCategory(option.value)}
                    activeOpacity={0.8}
                    className={`rounded-full px-4 py-4 border ${
                      isActive
                        ? "bg-[#222A3D] border-[#4F8EF7]"
                        : "bg-[#151515] border-white/5"
                    }`}
                  >
                    <View className="flex-row items-center justify-center">
                      <View
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: isActive ? accentColor : "#4C4C4C" }}
                      />
                      <Text className={`font-semibold ${isActive ? "text-white" : "text-white/55"}`}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase">
                Loop Icon
              </Text>
              <TouchableOpacity
                onPress={resetSuggestedIcon}
                activeOpacity={0.8}
                className="px-3 py-2 rounded-full bg-[#171718] border border-white/5"
              >
                <Text className="text-white/55 text-[11px] font-semibold">
                  Use Suggested
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {ICON_OPTIONS.map((icon) => {
                const isActive = iconName === icon;

                return (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => handleIconSelect(icon)}
                    activeOpacity={0.8}
                    className={`w-14 h-14 rounded-2xl items-center justify-center border ${
                      isActive
                        ? "bg-[#223251] border-[#4F8EF7]"
                        : "bg-[#171718] border-white/5"
                    }`}
                  >
                    <Feather
                      name={icon}
                      size={20}
                      color={isActive ? accentColor : "#ffffff80"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
              Frequency
            </Text>
            <View className="flex-row gap-3">
              {FREQUENCY_OPTIONS.map((option) => {
                const isActive = frequency === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setFrequency(option.value)}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-[24px] px-4 py-5 border ${
                      isActive
                        ? "bg-[#253250] border-[#4F8EF7]"
                        : "bg-[#171718] border-white/5"
                    }`}
                  >
                    <View className="items-center">
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={22}
                        color={isActive ? "#CFE0FF" : "#ffffff90"}
                      />
                      <Text className={`mt-3 text-sm font-bold ${isActive ? "text-white" : "text-white/80"}`}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {frequency === "custom" && (
            <View className="mb-8">
              <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
                Active Days
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CUSTOM_DAYS.map((day) => {
                  const selected = customDays.includes(day);

                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleCustomDay(day)}
                      activeOpacity={0.8}
                      className={`rounded-full px-4 py-3 border ${
                        selected
                          ? "bg-[#223251] border-[#4F8EF7]"
                          : "bg-[#171718] border-white/5"
                      }`}
                    >
                      <Text className={`font-semibold ${selected ? "text-white" : "text-white/65"}`}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
              Target Type
            </Text>
            <View className="gap-3">
              {TARGET_OPTIONS.map((option) => {
                const isActive = targetType === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setTargetType(option.value)}
                    activeOpacity={0.8}
                    className={`rounded-[24px] px-5 py-5 border ${
                      isActive
                        ? "bg-[#1E2433] border-[#4F8EF7]"
                        : "bg-[#171718] border-white/5"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-4">
                        <MaterialCommunityIcons
                          name={option.icon}
                          size={20}
                          color={isActive ? accentColor : "#D6D6D6"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base font-bold">{option.label}</Text>
                        <Text className="text-white/45 text-sm mt-0.5">{option.description}</Text>
                      </View>
                      <Feather
                        name={isActive ? "check" : "chevron-right"}
                        size={18}
                        color={isActive ? accentColor : "#ffffff60"}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {targetType !== "boolean" && (
            <View className="mb-6">
              <Text className="text-[#6FA1F8] text-[11px] font-bold tracking-[3px] uppercase mb-4">
                Target Details
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1 bg-[#171718] rounded-[24px] px-5 py-4 border border-white/5">
                  <Text className="text-white/45 text-xs font-bold tracking-[2px] uppercase mb-2">
                    Value
                  </Text>
                  <TextInput
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder={targetType === "duration" ? "45" : "10"}
                    placeholderTextColor="#FFFFFF40"
                    keyboardType="numeric"
                    className="text-white text-lg font-bold"
                  />
                </View>
                <View className="w-[42%] bg-[#171718] rounded-[24px] px-5 py-4 border border-white/5">
                  <Text className="text-white/45 text-xs font-bold tracking-[2px] uppercase mb-2">
                    Unit
                  </Text>
                  <TextInput
                    value={targetUnit}
                    onChangeText={setTargetUnit}
                    placeholder={getDefaultUnit(targetType) || "unit"}
                    placeholderTextColor="#FFFFFF40"
                    className="text-white text-lg font-bold"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>
          )}

          {!!error && (
            <Text className="text-red-300 text-sm font-medium mb-4 px-1">
              {error}
            </Text>
          )}
        </ScrollView>

        <View className="px-4 pb-4 pt-2">
          <TouchableOpacity
            onPress={handleCreateLoop}
            activeOpacity={0.85}
            disabled={isSubmitting}
            className="rounded-full overflow-hidden"
          >
            <LinearGradient
              colors={["#8FB3FF", "#6E9AF7", "#7FB1FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                minHeight: 58,
                alignItems: "center",
                justifyContent: "center",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0A1930" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-[#13284A] text-xl font-bold tracking-tight mr-3">
                    Create Loop
                  </Text>
                  <View className="w-7 h-7 rounded-full bg-[#21457E] items-center justify-center">
                    <Ionicons name="add" size={18} color="#DCE8FF" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
