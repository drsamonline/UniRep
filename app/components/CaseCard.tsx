import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import type { Case } from "@/types";

interface Props {
  item: Case;
}

export function CaseCard({ item }: Props) {
  const colors = useColors();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/case/[id]", params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={styles.top}>
        <View style={styles.caseInfo}>
          <Text style={[styles.caseNumber, { color: "#3b82f6" }]}>{item.caseNumber}</Text>
          <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName}</Text>
          <Text style={[styles.age, { color: colors.mutedForeground }]}>
            {item.patientAge} yrs • {item.patientGender}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <StatusBadge status={item.status} small />
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>
      </View>
      {item.chiefComplaint ? (
        <Text style={[styles.complaint, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.chiefComplaint}
        </Text>
      ) : null}
      {item.selectedRemedies.length > 0 && (
        <View style={styles.remediesRow}>
          {item.selectedRemedies.slice(0, 4).map((code) => (
            <View key={code} style={[styles.remedyChip, { backgroundColor: "#eff6ff" }]}>
              <Text style={[styles.remedyChipText, { color: "#3b82f6" }]}>{code}</Text>
            </View>
          ))}
          {item.selectedRemedies.length > 4 && (
            <Text style={[styles.more, { color: colors.mutedForeground }]}>+{item.selectedRemedies.length - 4}</Text>
          )}
        </View>
      )}
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={styles.arrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  caseInfo: {
    flex: 1,
  },
  caseNumber: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
  },
  age: {
    fontSize: 12,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 6,
  },
  date: {
    fontSize: 11,
  },
  complaint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  remediesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  remedyChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  remedyChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  more: {
    fontSize: 11,
    alignSelf: "center",
  },
  arrow: {
    position: "absolute",
    right: 14,
    top: "50%",
  },
});
