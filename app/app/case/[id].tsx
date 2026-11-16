import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IntensityBadge } from "@/components/IntensityBadge";
import { RemedyBar } from "@/components/RemedyBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { MEDICINES } from "@/data/medicines";
import { SYMPTOMS } from "@/data/symptoms";
import { useColors } from "@/hooks/useColors";
import type { Case } from "@/types";

const STATUS_OPTIONS: Case["status"][] = ["active", "completed", "follow-up", "temporary"];

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cases, updateCase, deleteCase, caseSymptoms, repertorisations } = useApp();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const caseData = cases.find((c) => c.id === id);
  const caseSympList = caseSymptoms.filter((cs) => cs.caseId === id);
  const reps = repertorisations.filter((r) => r.caseId === id);
  const latestRep = reps[0];

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!caseData) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Case not found</Text>
      </View>
    );
  }

  const handleStatusChange = async (status: Case["status"]) => {
    await updateCase(id, { status });
    setShowStatusMenu(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Case",
      `Are you sure you want to delete case ${caseData.caseNumber}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCase(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: topInset + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>{caseData.caseNumber}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Patient card */}
        <View style={[styles.patientCard, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
          <View style={styles.patientTop}>
            <View>
              <Text style={[styles.patientName, { color: "#1e3a8a" }]}>{caseData.patientName}</Text>
              <Text style={[styles.patientMeta, { color: "#3b82f6" }]}>
                {caseData.patientAge > 0 ? `${caseData.patientAge} years` : "Age not specified"} • {caseData.patientGender}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.statusBtn, { borderColor: "#bfdbfe", backgroundColor: "#dbeafe" }]}
              onPress={() => setShowStatusMenu(!showStatusMenu)}
            >
              <StatusBadge status={caseData.status} small />
              <Feather name="chevron-down" size={12} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {showStatusMenu && (
            <View style={[styles.statusMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleStatusChange(s)}
                >
                  <StatusBadge status={s} small />
                  {caseData.status === s && <Feather name="check" size={14} color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.caseMetaRow}>
            <View style={[styles.metaChip, { backgroundColor: "#dbeafe" }]}>
              <Feather name="calendar" size={11} color="#3b82f6" />
              <Text style={[styles.metaText, { color: "#3b82f6" }]}>
                {new Date(caseData.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </Text>
            </View>
          </View>

          {caseData.chiefComplaint ? (
            <View style={[styles.complaintBox, { backgroundColor: "#dbeafe" }]}>
              <Text style={[styles.complaintLabel, { color: "#1e3a8a" }]}>Chief Complaint</Text>
              <Text style={[styles.complaintText, { color: "#1e3a8a" }]}>{caseData.chiefComplaint}</Text>
            </View>
          ) : null}
        </View>

        {/* Prescribed remedies */}
        {caseData.selectedRemedies.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="award" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Prescribed Remedies</Text>
            </View>
            <View style={styles.remediesWrap}>
              {caseData.selectedRemedies.map((code, i) => {
                const med = MEDICINES.find((m) => m.code === code);
                return (
                  <View key={i} style={[styles.remedyItem, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
                    <Text style={[styles.remedyCode, { color: "#3b82f6" }]}>{code}</Text>
                    {med && <Text style={[styles.remedyName, { color: "#1e3a8a" }]}>{med.name}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Symptoms from case */}
        {caseSympList.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="list" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recorded Symptoms</Text>
              <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>({caseSympList.length})</Text>
            </View>
            {caseSympList.map((cs, i) => {
              const sym = SYMPTOMS.find((s) => s.id === cs.symptomId);
              if (!sym) return null;
              return (
                <View key={i} style={[styles.symptomRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.symInfo}>
                    <Text style={[styles.symName, { color: colors.foreground }]}>{sym.name}</Text>
                    <Text style={[styles.symCat, { color: colors.mutedForeground }]}>{sym.category}</Text>
                  </View>
                  <IntensityBadge intensity={cs.intensity} small />
                </View>
              );
            })}
          </View>
        )}

        {/* Latest Repertorisation */}
        {latestRep && latestRep.results.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="bar-chart-2" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Repertorisation Results</Text>
            </View>
            <Text style={[styles.repDate, { color: colors.mutedForeground }]}>
              {new Date(latestRep.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </Text>
            {latestRep.results.slice(0, 5).map((r, i) => (
              <RemedyBar
                key={r.medicineId}
                result={{
                  ...r,
                  normalizedScore: latestRep.results[0]?.score > 0 ? (r.score / latestRep.results[0].score) * 100 : 0,
                }}
                rank={i + 1}
              />
            ))}
          </View>
        )}

        {/* Notes */}
        {caseData.notes ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="edit-3" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Notes</Text>
            </View>
            <Text style={[styles.notes, { color: colors.foreground }]}>{caseData.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 60, fontSize: 16 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "600" },
  content: { padding: 16, gap: 12 },
  patientCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 10,
  },
  patientTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  patientName: { fontSize: 20, fontWeight: "700" },
  patientMeta: { fontSize: 13, marginTop: 2, textTransform: "capitalize" },
  statusBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  statusMenu: {
    borderRadius: 12, borderWidth: 1,
    overflow: "hidden",
  },
  statusOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  caseMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  metaText: { fontSize: 12, fontWeight: "500" },
  complaintBox: { borderRadius: 10, padding: 10 },
  complaintLabel: { fontSize: 11, fontWeight: "700", marginBottom: 3 },
  complaintText: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  cardCount: { fontSize: 13 },
  remediesWrap: { gap: 8 },
  remedyItem: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  remedyCode: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  remedyName: { fontSize: 13, marginTop: 2 },
  symptomRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symInfo: { flex: 1, marginRight: 8 },
  symName: { fontSize: 13, fontWeight: "500" },
  symCat: { fontSize: 11, textTransform: "capitalize", marginTop: 2 },
  repDate: { fontSize: 12, marginTop: -4 },
  notes: { fontSize: 14, lineHeight: 22 },
});
