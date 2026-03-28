import { useMemo } from "react";
import useAuthStore from "../store/useAuthStore";
import { getThemePalette, getThemePreference } from "../theme";

export default function useAppTheme() {
  const preferenceValue = useAuthStore((state) => state.user?.theme);

  return useMemo(() => {
    const themeName = getThemePreference(preferenceValue);
    const theme = getThemePalette(themeName);

    return {
      theme,
      themeName,
      isDark: theme.isDark,
      isLight: !theme.isDark,
    };
  }, [preferenceValue]);
}
