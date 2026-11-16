import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "@/components/SearchBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import type { Medicine } from "@/types";

const CATEGORIES = ["All", "A", "B", "C", "G", "H", "I", "L", "M", "N", "P", "R", "S", "T", "V"];

export default function MedicinesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicines } = useApp();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return medicines;
    const q = search.toLowerCase();
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.commonName.toLowerCase().includes(q) ||
        m.primarySymptoms.some((s) => s.toLowerCase().includes(q))
    );
  }, [medicines, search]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 84 : 0;

  const renderItem = ({ item }: { item: Medicine }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/medicine/[id]", params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={[styles.codeBox, { backgroundColor: "#eff6ff" }]}>
          <Text style={[styles.code, { color: "#3b82f6" }]}>{item.code}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.commonName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.commonName}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
      <View style={styles.potency}>
        <Feather name="droplet" size={11} color={colors.mutedForeground} />
        <Text style={[styles.potencyText, { color: colors.mutedForeground }]}>{item.potencyRange}</Text>
      </View>
      <View style={styles.symptoms}>
        {item.primarySymptoms.slice(0, 3).map((s, i) => (
          <View key={i} style={[styles.symptomChip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.symptomChipText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {s}
            </Text>
          </View>
        ))}
        {item.primarySymptoms.length > 3 && (
          <Text style={[styles.moreSymptoms, { color: colors.mutedForeground }]}>
            +{item.primarySymptoms.length - 3}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Medicine Database</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{medicines.length} remedies</Text>
        <View style={{ marginTop: 12 }}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name, code, symptoms..." />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 16 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No medicines found</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSub: { fontSize: 13, marginTop: 1, marginBottom: 2 },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 0,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  codeBox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
  },
  code: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  nameBlock: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600" },
  commonName: { fontSize: 12, marginTop: 2, fontStyle: "italic" },
  potency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  potencyText: { fontSize: 12 },
  symptoms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  symptomChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 150,
  },
  symptomChipText: { fontSize: 11, fontWeight: "500" },
  moreSymptoms: { fontSize: 11, alignSelf: "center" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15 },
});
