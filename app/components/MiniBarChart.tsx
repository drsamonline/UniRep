import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BarItem {
  label: string;
  value: number;
}

interface Props {
  data: BarItem[];
  color?: string;
  height?: number;
}

export function MiniBarChart({ data, color = "#3b82f6", height = 120 }: Props) {
  const colors = useColors();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.bars, { height }]}>
        {data.map((item, i) => {
          const barH = Math.max((item.value / max) * height, item.value > 0 ? 4 : 0);
          return (
            <View key={i} style={styles.barCol}>
              <View style={[styles.track, { height }]}>
                <View style={[styles.bar, { height: barH, backgroundColor: color }]} />
              </View>
              <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function HorizontalBarChart({ data, color = "#3b82f6" }: { data: BarItem[]; color?: string }) {
  const colors = useColors();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.hWrapper}>
      {data.map((item, i) => (
        <View key={i} style={styles.hRow}>
          <Text style={[styles.hLabel, { color: colors.foreground }]} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={[styles.hTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.hBar,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={[styles.hValue, { color: colors.mutedForeground }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  track: {
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 3,
  },
  label: {
    fontSize: 9,
    textAlign: "center",
  },
  hWrapper: {
    gap: 10,
  },
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hLabel: {
    width: 90,
    fontSize: 12,
    fontWeight: "500",
  },
  hTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  hBar: {
    height: 8,
    borderRadius: 4,
  },
  hValue: {
    width: 24,
    fontSize: 12,
    textAlign: "right",
  },
});
