import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Status = "active" | "completed" | "follow-up" | "temporary";

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string }> = {
  active: { label: "Active", bg: "#dbeafe", text: "#1d4ed8" },
  completed: { label: "Completed", bg: "#dcfce7", text: "#15803d" },
  "follow-up": { label: "Follow-up", bg: "#fef3c7", text: "#b45309" },
  temporary: { label: "Temporary", bg: "#f3f4f6", text: "#6b7280" },
};

interface Props {
  status: Status;
  small?: boolean;
}

export function StatusBadge({ status, small = false }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: config.text }, small && styles.smallText]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  smallText: {
    fontSize: 11,
  },
});
