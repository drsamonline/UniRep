import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaseCard } from "@/components/CaseCard";
import { SearchBar } from "@/components/SearchBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Case } from "@/types";

type FilterStatus = "all" | "active" | "completed" | "follow-up" | "temporary";

export default function CasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cases, addCase } = useApp();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showNewCase, setShowNewCase] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [phone, setPhone] = useState("");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let result = cases;
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.patientName.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q) ||
          c.chiefComplaint?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cases, filterStatus, search]);

  const total = cases.length;
  const active = cases.filter((c) => c.status === "active").length;
  const completed = cases.filter((c) => c.status === "completed").length;
  const followUp = cases.filter((c) => c.status === "follow-up").length;

  const createCase = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter the patient name.");
      return;
    }
    setSaving(true);
    try {
      const newCase = await addCase({
        patientId: "",
        patientName: name.trim(),
        patientAge: parseInt(age) || 0,
        patientGender: gender,
        date: new Date().toISOString(),
        status: "active",
        notes: notes.trim(),
        selectedRemedies: [],
        chiefComplaint: complaint.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowNewCase(false);
      setName(""); setAge(""); setPhone(""); setComplaint(""); setNotes("");
      router.push({ pathname: "/case/[id]", params: { id: newCase.id } });
    } finally {
      setSaving(false);
    }
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 0;
  const modalTopInset = Platform.OS === "web" ? 67 : insets.top;

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "follow-up", label: "Follow-up" },
    { key: "temporary", label: "Temporary" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cases</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{total} total cases</Text>
          </View>
          <TouchableOpacity
            style={[styles.newBtn, { backgroundColor: "#3b82f6" }]}
            onPress={() => setShowNewCase(true)}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.newBtnText}>New Case</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={styles.statsRow}>
          {[
            { label: "Total", value: total, color: "#3b82f6" },
            { label: "Active", value: active, color: "#2563eb" },
            { label: "Completed", value: completed, color: "#16a34a" },
            { label: "Follow-up", value: followUp, color: "#d97706" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={{ marginTop: 12 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or case number..." />
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, { backgroundColor: filterStatus === f.key ? "#3b82f6" : colors.muted }]}
              onPress={() => setFilterStatus(f.key)}
            >
              <Text style={[styles.filterText, { color: filterStatus === f.key ? "#fff" : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CaseCard item={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 16 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filterStatus === "all" ? "No cases yet" : `No ${filterStatus} cases`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {filterStatus === "all" ? "Create a new case or use the Repertory tab to get started." : "Change filter to view other cases."}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* New Case Modal */}
      <Modal visible={showNewCase} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: modalTopInset + 12, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Patient Case</Text>
            <TouchableOpacity onPress={() => setShowNewCase(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Patient Name *</Text>
            <TextInput style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.mutedForeground} />

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Age</Text>
                <TextInput style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]} value={age} onChangeText={setAge} placeholder="Years" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" maxLength={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Phone</Text>
                <TextInput style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]} value={phone} onChangeText={setPhone} placeholder="Contact number" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Gender</Text>
            <View style={styles.genderRow}>
              {(["male", "female", "other"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, { backgroundColor: gender === g ? "#3b82f6" : colors.muted }]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderText, { color: gender === g ? "#fff" : colors.mutedForeground }]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Chief Complaint</Text>
            <TextInput style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]} value={complaint} onChangeText={setComplaint} placeholder="Main presenting complaint" placeholderTextColor={colors.mutedForeground} />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Notes</Text>
            <TextInput style={[styles.modalInput, styles.textArea, { borderColor: colors.border, backgroundColor: colors.card, color: colors.foreground }]} value={notes} onChangeText={setNotes} placeholder="Additional notes, history, observations..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} textAlignVertical="top" />

            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: saving ? colors.muted : "#3b82f6" }]}
              onPress={createCase}
              disabled={saving}
            >
              <Text style={styles.createBtnText}>{saving ? "Saving..." : "Create Case"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 1 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  newBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  statsRow: { gap: 8, paddingRight: 4 },
  statCard: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", minWidth: 75 },
  statValue: { fontSize: 22, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  filterScroll: { marginTop: 10 },
  filterRow: { gap: 6, paddingRight: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  filterText: { fontSize: 13, fontWeight: "500" },
  list: { padding: 16 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginTop: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  rowFields: { flexDirection: "row", gap: 10 },
  textArea: { minHeight: 100 },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  genderText: { fontSize: 14, fontWeight: "500" },
  createBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
