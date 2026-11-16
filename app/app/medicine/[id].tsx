import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MEDICINE_SYMPTOMS } from "@/data/medicineSymptoms";
import { SYMPTOMS } from "@/data/symptoms";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STRENGTH_LABELS: Record<number, string> = { 1: "Minor", 2: "Moderate", 3: "Strong" };
const STRENGTH_COLORS: Record<number, string> = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" };
const STRENGTH_DOTS: Record<number, string> = { 1: "●○○", 2: "●●○", 3: "●●●" };

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicines } = useApp();

  const medicine = medicines.find((m) => m.id === id);

  const medicineSymptomLinks = useMemo(() => {
    if (!medicine) return [];
    return MEDICINE_SYMPTOMS
      .filter((ms) => ms.medicineId === medicine.id)
      .map((ms) => {
        const sym = SYMPTOMS.find((s) => s.id === ms.symptomId);
        return sym ? { symptom: sym, strength: ms.strength } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.strength - a!.strength) as { symptom: (typeof SYMPTOMS)[0]; strength: number }[];
  }, [medicine]);

  const grouped = useMemo(() => {
    const g: Record<string, { symptom: (typeof SYMPTOMS)[0]; strength: number }[]> = {};
    medicineSymptomLinks.forEach((item) => {
      const cat = item.symptom.category;
      if (!g[cat]) g[cat] = [];
      g[cat].push(item);
    });
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [medicineSymptomLinks]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!medicine) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Medicine not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Back header */}
      <View style={[styles.navBar, { paddingTop: topInset + 10, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {medicine.code}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
          <View style={[styles.codeBox]}>
            <Text style={styles.codeText}>{medicine.code}</Text>
          </View>
          <Text style={[styles.heroName, { color: "#1e3a8a" }]}>{medicine.name}</Text>
          <Text style={[styles.heroCommon, { color: "#3b82f6" }]}>{medicine.commonName}</Text>
          <View style={[styles.potencyBadge, { backgroundColor: "#dbeafe" }]}>
            <Feather name="droplet" size={12} color="#3b82f6" />
            <Text style={[styles.potencyText, { color: "#3b82f6" }]}>{medicine.potencyRange}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={14} color="#3b82f6" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Materia Medica</Text>
          </View>
          <Text style={[styles.description, { color: colors.foreground }]}>{medicine.description}</Text>
        </View>

        {/* Primary Symptoms */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="star" size={14} color="#3b82f6" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Key Symptoms</Text>
          </View>
          <View style={styles.chipWrap}>
            {medicine.primarySymptoms.map((s, i) => (
              <View key={i} style={[styles.keyChip, { backgroundColor: "#eff6ff" }]}>
                <Text style={[styles.keyChipText, { color: "#3b82f6" }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Symptom-strength chart */}
        {grouped.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="activity" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Symptom Coverage</Text>
              <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>({medicineSymptomLinks.length})</Text>
            </View>
            {grouped.map(([cat, items]) => (
              <View key={cat} style={styles.catBlock}>
                <Text style={[styles.catTitle, { color: colors.mutedForeground }]}>
                  {cat.toUpperCase()}
                </Text>
                {items.map((item, i) => (
                  <View key={i} style={[styles.symRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.symName, { color: colors.foreground }]}>{item.symptom.name}</Text>
                    <View style={styles.symRight}>
                      <Text style={[styles.strengthDots, { color: STRENGTH_COLORS[item.strength] }]}>
                        {STRENGTH_DOTS[item.strength]}
                      </Text>
                      <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[item.strength] }]}>
                        {STRENGTH_LABELS[item.strength]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Related Medicines */}
        {medicine.relatedMedicines.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="link" size={14} color="#3b82f6" />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Related Medicines</Text>
            </View>
            <View style={styles.chipWrap}>
              {medicine.relatedMedicines.map((code, i) => (
                <View key={i} style={[styles.relChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.relChipText, { color: colors.mutedForeground }]}>{code}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center" },
  content: { padding: 16, gap: 12 },
  hero: {
    borderRadius: 16, borderWidth: 1,
    padding: 20, alignItems: "center", gap: 6,
  },
  codeBox: { backgroundColor: "#3b82f6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  codeText: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  heroName: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  heroCommon: { fontSize: 14, fontStyle: "italic" },
  potencyBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    marginTop: 4,
  },
  potencyText: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  cardCount: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 22 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  keyChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  keyChipText: { fontSize: 13, fontWeight: "500" },
  relChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  relChipText: { fontSize: 13, fontWeight: "600" },
  catBlock: { gap: 0 },
  catTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginTop: 10, marginBottom: 4 },
  symRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symName: { fontSize: 13, flex: 1, marginRight: 8 },
  symRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  strengthDots: { fontSize: 12, letterSpacing: 1 },
  strengthLabel: { fontSize: 11, fontWeight: "600" },
});
