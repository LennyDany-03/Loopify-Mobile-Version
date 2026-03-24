import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

function withOpacity(color, opacity = "22") {
  if (typeof color !== "string" || !color.startsWith("#")) {
    return color || "#72A6FF";
  }

  if (color.length === 7) {
    return `${color}${opacity}`;
  }

  return color;
}

export default function SlideToComplete({
  onComplete,
  isCompleted,
  progressPercent = 0,
  trackLabel = "Slide to Complete",
  progressLabel = "",
  completionLabel = "Target reached for today",
  accentColor = "#72A6FF",
  disabled = false,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(isCompleted ? 1 : 0.5)).current;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const maxSlide = screenWidth - 48 - 64;
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);

  function resetThumb() {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !isCompleted && !isSubmitting && !disabled,
    onMoveShouldSetPanResponder: () => !isCompleted && !isSubmitting && !disabled,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (event, gesture) => {
      if (gesture.dx > maxSlide * 0.6) {
        Animated.spring(pan, {
          toValue: { x: maxSlide, y: 0 },
          useNativeDriver: false,
        }).start(async () => {
          setIsSubmitting(true);

          try {
            await onComplete?.();
          } finally {
            setIsSubmitting(false);
            resetThumb();
          }
        });
      } else {
        resetThumb();
      }
    },
  });

  useEffect(() => {
    if (isCompleted) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
  }, [fadeAnim, isCompleted, scaleAnim]);

  if (isCompleted) {
    return (
      <View
        style={[
          styles.completedContainer,
          {
            borderColor: withOpacity(accentColor, "55"),
            shadowColor: accentColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.completedContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.checkIconContainer, { backgroundColor: accentColor }]}>
            <Feather name="check" size={16} color="#08111D" />
          </View>
          <View>
            <Text style={[styles.masteredText, { color: accentColor }]}>{completionLabel}</Text>
            {!!progressLabel && <Text style={styles.completedSubtext}>{progressLabel}</Text>}
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.trackContainer}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: withOpacity(accentColor, "26"),
          },
        ]}
      />

      <View style={styles.trackTextWrap}>
        <Text style={styles.trackText}>
          {isSubmitting ? "Logging progress..." : trackLabel}
        </Text>
        {!!progressLabel && <Text style={styles.progressText}>{progressLabel}</Text>}
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: accentColor,
            transform: [
              {
                translateX: pan.x.interpolate({
                  inputRange: [0, maxSlide],
                  outputRange: [0, maxSlide],
                  extrapolate: "clamp",
                }),
              },
            ],
            opacity: isSubmitting || disabled ? 0.7 : 1,
          },
        ]}
      >
        {isSubmitting ? (
          <Feather name="loader" size={18} color="#08111D" />
        ) : (
          <Feather name="chevron-right" size={24} color="#08111D" />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  completedContainer: {
    backgroundColor: "#11131A",
    borderRadius: 32,
    minHeight: 70,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  completedContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  masteredText: {
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  completedSubtext: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  trackContainer: {
    backgroundColor: "#11131A",
    borderRadius: 32,
    height: 74,
    justifyContent: "center",
    paddingHorizontal: 8,
    position: "relative",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  trackTextWrap: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 64,
  },
  trackText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  progressText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.48)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
