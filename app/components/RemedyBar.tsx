import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { RemedyResult } from "@/types";

interface Props {
  result: RemedyResult;
  rank: number;
}

export function RemedyBar({ result, rank }: Props) {
  const colors = useColors();
  const isTop3 = rank <= 3;
  const barColor = rank === 1 ? "#3b82f6" : rank === 2 ? "#60a5fa" : rank === 3 ? "#93c5fd" : "#bfdbfe";

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.rankNameRow}>
          <View style={[styles.rankBadge, { backgroundColor: isTop3 ? "#3b82f6" : colors.muted }]}>
            <Text style={[styles.rankText, { color: isTop3 ? "#fff" : colors.mutedForeground }]}>
              {rank}
            </Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={[styles.code, { color: "#3b82f6" }]}>{result.medicineCode}</Text>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {result.medicineName}
            </Text>
          </View>
        </View>
        <View style={styles.scores}>
          <Text style={[styles.score, { color: colors.foreground }]}>{result.score.toFixed(1)}</Text>
          <Text style={[styles.coverage, { color: colors.mutedForeground }]}>{result.coverage}% cov</Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.fill, { width: `${result.normalizedScore}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "700",
  },
  nameBlock: {
    flex: 1,
  },
  code: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
  },
  scores: {
    alignItems: "flex-end",
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
  },
  coverage: {
    fontSize: 11,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
