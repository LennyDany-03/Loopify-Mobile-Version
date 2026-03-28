import { ActivityIndicator, Platform, StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, Animated } from "react-native";
import { TabView, SceneMap } from "react-native-tab-view";
import { Redirect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useMemo } from "react";
import useAuthStore from "../../lib/store/useAuthStore";
import useNavStore from "../../lib/store/useNavStore";
import useLoopLiveSync from "../../lib/hooks/useLoopLiveSync";

import Dashboard from "./dashboard";
import Loops from "./loops";
import Analysis from "./analysis";
import Settings from "./settings";

export default function TabLayout() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);
  const layout = useWindowDimensions();
  const routes = useMemo(() => [
    { key: "dashboard", title: "DASHBOARD", icon: "view-dashboard", type: "material" },
    { key: "loops", title: "LOOPS", icon: "repeat", type: "custom" },
    { key: "analysis", title: "ANALYSIS", icon: "google-analytics", type: "material" },
    { key: "settings", title: "SETTINGS", icon: "settings-sharp", type: "ionicons" },
  ], []);

  const index = useNavStore((state) => state.tabIndex);
  const setIndex = useNavStore((state) => state.setTabIndex);

  useLoopLiveSync({ enabled: isReady && isLoggedIn });

  // Sync index on initial mount only
  const [hasSyncedOnMount, setHasSyncedOnMount] = useState(false);
  useEffect(() => {
    if (!hasSyncedOnMount) {
      setHasSyncedOnMount(true);
    }
  }, [hasSyncedOnMount]);

  const renderScene = useMemo(() => SceneMap({
    dashboard: Dashboard,
    loops: Loops,
    analysis: Analysis,
    settings: Settings,
  }), []);

  const renderTabBar = (props) => {
    // Total physical width of the bar
    const barWidth = layout.width - 36;
    // Internal content width (barWidth - internal margins)
    const contentWidth = barWidth - 16; 
    const tabWidth = contentWidth / 4;

    const translateX = props.position.interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: [0, tabWidth, tabWidth * 2, tabWidth * 3],
    });

    return (
      <View style={styles.tabBar}>
        <View style={styles.tabBarContent}>
          {/* Animated Traveling Pill Wrapper */}
          <Animated.View 
            style={[
              styles.animatedPill, 
              { 
                width: tabWidth,
                transform: [{ translateX }] 
              }
            ]} 
          >
            <View style={styles.pillInner}>
               <View style={styles.activeIndicator} />
            </View>
          </Animated.View>
          
          {props.navigationState.routes.map((route, i) => {
            const focused = i === index;
            
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => setIndex(i)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.tabContainer}>
                  {route.type === "material" && (
                    <MaterialCommunityIcons
                      name={route.icon}
                      size={20}
                      color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"}
                    />
                  )}
                  {route.type === "ionicons" && (
                    <Ionicons
                      name={route.icon}
                      size={20}
                      color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"}
                    />
                  )}
                  {route.type === "custom" && (
                    <MaterialCommunityIcons
                      name="infinity"
                      size={24}
                      color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"}
                    />
                  )}
                  <Text style={[styles.tabLabel, { color: focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)" }]}>
                    {route.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
    <View style={{ flex: 1, backgroundColor: "#050508" }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={renderTabBar}
        swipeEnabled={true}
        animationEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 24,
    left: 18,
    right: 18,
    height: 74,
    backgroundColor: "rgba(11, 13, 22, 0.82)", // Translucent dark
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.14)", // Glassy edge
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    overflow: "hidden", // Ensure glass effect stays in bounds
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  animatedPill: {
    position: "absolute",
    left: 8, // Center within the content padding
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  pillInner: {
    width: "92%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(79, 142, 247, 0.98)",
    shadowColor: "#4F8EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  tabLabel: {
    fontSize: 8,
    fontWeight: "900",
    marginTop: 1,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 6,
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
