import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import { Redirect, withLayoutContext } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import useAuthStore from "../../lib/store/useAuthStore";
import useNavStore from "../../lib/store/useNavStore";
import useLoopLiveSync from "../../lib/hooks/useLoopLiveSync";
import useDailyReminderSync from "../../lib/hooks/useDailyReminderSync";
import useAppTheme from "../../lib/hooks/useAppTheme";

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

function createStyles(theme) {
  return StyleSheet.create({
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
      backgroundColor: theme.tabBar,
      borderRadius: 37,
      borderWidth: 1.5,
      borderColor: theme.borderStrong,
      elevation: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.5 : 0.16,
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
      backgroundColor: theme.tabPill,
      shadowColor: theme.tabPill,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.5 : 0.24,
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
      backgroundColor: theme.tabActiveIcon,
      shadowColor: theme.tabActiveIcon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
  });
}

function CustomTabBar({ state, navigation, theme }) {
  const layout = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const setTabIndex = useNavStore((store) => store.setTabIndex);
  const user = useAuthStore((store) => store.user);
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
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: focused ? theme.tabActiveIcon : theme.borderStrong,
                        backgroundColor: focused ? "transparent" : theme.surfaceSoft,
                      }}
                    >
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          style={{
                            color: focused ? theme.tabActiveIcon : theme.textMuted,
                            fontSize: 12,
                            fontWeight: "900",
                            paddingTop: 2,
                          }}
                        >
                          {initial}
                        </Text>
                      )}
                    </View>
                  ) : meta.type === "material" ? (
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={route.name === "loops" ? 24 : 20}
                      color={focused ? theme.tabActiveIcon : theme.tabIcon}
                    />
                  ) : (
                    <Ionicons
                      name={meta.icon}
                      size={20}
                      color={focused ? theme.tabActiveIcon : theme.tabIcon}
                    />
                  )}

                  {!meta.isProfile && (
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: focused ? theme.tabActiveIcon : theme.tabIcon },
                      ]}
                    >
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
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isReady = useAuthStore((state) => state.isReady);

  useLoopLiveSync({ enabled: isReady && isLoggedIn });
  useDailyReminderSync({ enabled: isReady && isLoggedIn });

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <StatusBar style={theme.statusBarStyle} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <SwipeTabs
        tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
          lazy: false,
          tabBarPosition: "bottom",
          tabBarScrollEnabled: false,
          tabBarStyle: styles.nativeTabBarHost,
          sceneStyle: { backgroundColor: theme.background },
        }}
      >
        <SwipeTabs.Screen name="dashboard" />
        <SwipeTabs.Screen name="loops" />
        <SwipeTabs.Screen name="analysis" />
        <SwipeTabs.Screen name="profile" />
      </SwipeTabs>
    </>
  );
}
