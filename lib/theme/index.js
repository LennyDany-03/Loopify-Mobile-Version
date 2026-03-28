const DARK_THEME = {
  name: "dark",
  isDark: true,
  statusBarStyle: "light",
  background: "#050508",
  backgroundAlt: "#090A0E",
  surface: "#0B0D14",
  surfaceAlt: "#0F121A",
  surfaceMuted: "#11131A",
  surfaceSoft: "#1A1C24",
  surfaceRaised: "#162032",
  panel: "#0D1017",
  card: "#121626",
  input: "#11131A",
  border: "rgba(255, 255, 255, 0.05)",
  borderStrong: "rgba(255, 255, 255, 0.1)",
  text: "#FFFFFF",
  textSoft: "rgba(255, 255, 255, 0.72)",
  textMuted: "rgba(255, 255, 255, 0.45)",
  textSubtle: "rgba(255, 255, 255, 0.35)",
  accent: "#4F8EF7",
  accentSoft: "#7DA7FF",
  accentStrong: "#72A6FF",
  accentText: "#8FB2FF",
  accentContrast: "#14366D",
  logo: "#4F8EF7",
  success: "#88F0B6",
  successSoft: "#2A513D",
  danger: "#FF8E92",
  warning: "#FFD88B",
  overlay: "rgba(0, 0, 0, 0.8)",
  shadow: "#000000",
  tabBar: "rgba(11, 13, 22, 0.82)",
  tabPill: "#4F8EF7",
  tabIcon: "rgba(255, 255, 255, 0.4)",
  tabActiveIcon: "#FFFFFF",
  emptyIconBackground: "#12151C",
  plusButton: "#72A6FF",
  plusButtonText: "#1A243A",
  refreshBackground: "#1A253A",
  primaryGradient: ["#0D121F", "#080B14"],
  successGradient: ["#0C1613", "#070C0A"],
  cardGradient: ["#09101A", "#0C0F17"],
  panelGradient: ["#0A1020", "#0A0E17"],
  actionGradient: ["#8FB3FF", "#6E9AF7", "#7FB1FF"],
};

const LIGHT_THEME = {
  name: "light",
  isDark: false,
  statusBarStyle: "dark",
  background: "#F4F7FC",
  backgroundAlt: "#EEF3FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F7FAFF",
  surfaceMuted: "#F0F5FD",
  surfaceSoft: "#E5ECF7",
  surfaceRaised: "#D9E5F6",
  panel: "#F7FAFF",
  card: "#FFFFFF",
  input: "#EEF4FB",
  border: "rgba(20, 54, 109, 0.08)",
  borderStrong: "rgba(20, 54, 109, 0.14)",
  text: "#122033",
  textSoft: "rgba(18, 32, 51, 0.82)",
  textMuted: "rgba(18, 32, 51, 0.6)",
  textSubtle: "rgba(18, 32, 51, 0.46)",
  accent: "#2F6FD6",
  accentSoft: "#5389E6",
  accentStrong: "#3B7BE6",
  accentText: "#2F6FD6",
  accentContrast: "#EAF2FF",
  logo: "#2F6FD6",
  success: "#2E9E6F",
  successSoft: "#D9F2E6",
  danger: "#D55564",
  warning: "#C98910",
  overlay: "rgba(9, 17, 30, 0.42)",
  shadow: "#9FB2CD",
  tabBar: "rgba(255, 255, 255, 0.96)",
  tabPill: "#2F6FD6",
  tabIcon: "rgba(18, 32, 51, 0.45)",
  tabActiveIcon: "#FFFFFF",
  emptyIconBackground: "#E8EEF7",
  plusButton: "#2F6FD6",
  plusButtonText: "#FFFFFF",
  refreshBackground: "#E5ECF7",
  primaryGradient: ["#FFFFFF", "#EDF4FF"],
  successGradient: ["#F4FFF9", "#E6F8EF"],
  cardGradient: ["#FFFFFF", "#F3F7FF"],
  panelGradient: ["#FFFFFF", "#F6FAFF"],
  actionGradient: ["#4D84E0", "#2F6FD6", "#5C91E6"],
};

export function getThemePreference(value) {
  return value === "light" ? "light" : "dark";
}

export function getThemePalette(preference) {
  return getThemePreference(preference) === "light" ? LIGHT_THEME : DARK_THEME;
}

export function withOpacity(color, opacity = 1) {
  if (typeof color !== "string") {
    return color;
  }

  if (!color.startsWith("#")) {
    return color;
  }

  let normalized = color.slice(1);

  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((value) => `${value}${value}`)
      .join("");
  }

  if (normalized.length !== 6) {
    return color;
  }

  const alpha = Math.max(0, Math.min(1, opacity));
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export { DARK_THEME, LIGHT_THEME };
