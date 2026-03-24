import { Tabs, Redirect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import useAuthStore from "../../lib/store/useAuthStore";

export default function TabLayout() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050508]">
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#05070A",
          borderTopWidth: 1,
          borderTopColor: "#ffffff0a",
          elevation: 0,
          height: Platform.OS === "ios" ? 100 : 85,
          paddingBottom: Platform.OS === "ios" ? 30 : 15,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "DASHBOARD",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabContainer, focused ? styles.tabContainerFocused : null]}>
              <MaterialCommunityIcons
                name="view-dashboard"
                size={22}
                color={focused ? "#4F8EF7" : "#ffffff50"}
              />
              <Text style={[styles.tabLabel, { color: focused ? "#4F8EF7" : "#ffffff50" }]}>
                DASHBOARD
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="loops"
        options={{
          title: "LOOPS",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabContainer, focused ? styles.tabContainerFocused : null]}>
              <Text
                style={{
                  color: focused ? "#4F8EF7" : "#ffffff50",
                  fontSize: 26,
                  fontWeight: "bold",
                  lineHeight: 28,
                  marginTop: -4,
                }}
              >
                ∞
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? "#4F8EF7" : "#ffffff50", marginTop: 0 },
                ]}
              >
                LOOPS
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: "ANALYSIS",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabContainer, focused ? styles.tabContainerFocused : null]}>
              <MaterialCommunityIcons
                name="google-analytics"
                size={22}
                color={focused ? "#4F8EF7" : "#ffffff50"}
              />
              <Text style={[styles.tabLabel, { color: focused ? "#4F8EF7" : "#ffffff50" }]}>
                ANALYSIS
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "SETTINGS",
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabContainer, focused ? styles.tabContainerFocused : null]}>
              <Ionicons
                name="settings-sharp"
                size={22}
                color={focused ? "#4F8EF7" : "#ffffff50"}
              />
              <Text style={[styles.tabLabel, { color: focused ? "#4F8EF7" : "#ffffff50" }]}>
                SETTINGS
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 60,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  tabContainerFocused: {
    backgroundColor: "#151D30",
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
