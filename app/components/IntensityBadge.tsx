import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  intensity: 1 | 2 | 3;
  small?: boolean;
}

const INTENSITY = {
  1: { label: "Mild", bg: "#dcfce7", text: "#15803d" },
  2: { label: "Moderate", bg: "#fef3c7", text: "#b45309" },
  3: { label: "Severe", bg: "#fee2e2", text: "#dc2626" },
};

export function IntensityBadge({ intensity, small = false }: Props) {
  const cfg = INTENSITY[intensity];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: cfg.text }, small && styles.smallText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  smallText: {
    fontSize: 10,
  },
});
