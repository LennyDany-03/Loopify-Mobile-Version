import { ActivityIndicator, Animated, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, Image } from "react-native";
import { Redirect, withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import useAuthStore from "../../lib/store/useAuthStore";
import useNavStore from "../../lib/store/useNavStore";
import useLoopLiveSync from "../../lib/hooks/useLoopLiveSync";

const TAB_META = {
  dashboard: {
    title: "DASHBOARD",
    icon: "view-dashboard",
    type: "material",
  },
  loops: {
    title: "LOOPS",
    icon: "infinity",
    type: "material",
  },
  analysis: {
    title: "ANALYSIS",
    icon: "google-analytics",
    type: "material",
  },
  profile: {
    isProfile: true,
  },
};

const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

function CustomTabBar({ state, navigation }) {
  const layout = useWindowDimensions();
  const setTabIndex = useNavStore((store) => store.setTabIndex);
  const user = useAuthStore((state) => state.user);
  
  const avatarUrl = user?.picture || user?.avatar_url || user?.profile_pic;
  const initial = user?.full_name?.split(" ")[0]?.charAt(0).toUpperCase() || "L";

  const animatedIndex = useRef(new Animated.Value(state.index)).current;
  const inputRange = useMemo(
    () => state.routes.map((_, routeIndex) => routeIndex),
    [state.routes]
  );

  useEffect(() => {
    setTabIndex(state.index);

    Animated.spring(animatedIndex, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [animatedIndex, setTabIndex, state.index]);

  if (!state.routes.length) {
    return null;
  }

  const barWidth = layout.width - 36;
  const contentWidth = barWidth - 16;
  const tabWidth = contentWidth / state.routes.length;

  const translateX = animatedIndex.interpolate({
    inputRange,
    outputRange: inputRange.map((routeIndex) => routeIndex * tabWidth),
  });

  return (
    <View pointerEvents="box-none" style={styles.tabBarLayer}>
      <View style={styles.tabBar}>
        <View style={styles.tabBarContent}>
          <Animated.View
            style={[
              styles.animatedPill,
              {
                width: tabWidth,
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.pillInner}>
              <View style={styles.activeIndicator} />
            </View>
          </Animated.View>

          {state.routes.map((route, routeIndex) => {
            const focused = state.index === routeIndex;
            const meta = TAB_META[route.name] ?? {
              title: route.name.toUpperCase(),
              icon: "ellipse",
              type: "ionicons",
            };

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.tabContainer}>
                  {meta.isProfile ? (
                    <View className={`w-[38px] h-[38px] rounded-full items-center justify-center overflow-hidden border ${focused ? 'border-white' : 'border-white/20'}`}>
                      {avatarUrl ? (
                         <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      ) : (
                         <Text className={`text-[12px] font-black ${focused ? 'text-white' : 'text-white/60'} pt-[2px]`}>{initial}</Text>
                      )}
                    </View>
                  ) : meta.type === "material" ? (
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={route.name === "loops" ? 24 : 20}
                      color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"}
                    />
                  ) : (
                    <Ionicons
                      name={meta.icon}
                      size={20}
                      color={focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)"}
                    />
                  )}
                  
                  {!meta.isProfile && (
                    <Text style={[styles.tabLabel, { color: focused ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)" }]}>
                      {meta.title}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);

  useLoopLiveSync({ enabled: isReady && isLoggedIn });

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
    <SwipeTabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: false,
        tabBarPosition: "bottom",
        tabBarScrollEnabled: false,
        tabBarStyle: styles.nativeTabBarHost,
        sceneStyle: { backgroundColor: "#050508" },
      }}
    >
      <SwipeTabs.Screen name="dashboard" />
      <SwipeTabs.Screen name="loops" />
      <SwipeTabs.Screen name="analysis" />
      <SwipeTabs.Screen name="profile" />
    </SwipeTabs>
  );
}

const styles = StyleSheet.create({
  tabBarLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  tabBar: {
    marginHorizontal: 18,
    marginBottom: Platform.OS === "ios" ? 34 : 24,
    height: 74,
    backgroundColor: "rgba(11, 13, 22, 0.82)",
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.14)",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    overflow: "hidden",
  },
  nativeTabBarHost: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "ios" ? 124 : 108,
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "center",
  },
  animatedPill: {
    position: "absolute",
    left: 8,
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
