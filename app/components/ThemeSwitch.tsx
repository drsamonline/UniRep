import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { THEME_MODES, useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const LABELS: Record<ThemeMode, string> = {
  system: "Auto",
  light: "Light",
  dark: "Dark",
  sepia: "Sepia",
};

const ICONS: Record<ThemeMode, React.ComponentProps<typeof Feather>["name"]> = {
  system: "smartphone",
  light: "sun",
  dark: "moon",
  sepia: "book",
};

export function ThemeSwitch() {
  const colors = useColors();
  const { mode, setMode } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Colour theme"
      style={[styles.row, { backgroundColor: colors.muted, borderColor: colors.border }]}
    >
      {THEME_MODES.map((option) => {
        const active = option === mode;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={LABELS[option]}
            onPress={() => setMode(option)}
            style={({ pressed }) => [
              styles.item,
              active && { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Feather
              name={ICONS[option]}
              size={12}
              color={active ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[styles.label, { color: active ? colors.primaryForeground : colors.mutedForeground }]}
            >
              {LABELS[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 9,
    padding: 2,
    gap: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    minHeight: 28,
  },
  label: { fontSize: 10, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
