import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the active theme.
 *
 * The palette is chosen by ThemeContext (system, light, dark or sepia), so a
 * user's explicit choice wins over the device setting and is remembered between
 * launches.
 */
export function useColors() {
  const { resolved } = useTheme();
  const palette = colors[resolved] ?? colors.light;
  return { ...palette, radius: colors.radius };
}
