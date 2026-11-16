import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useResponsive } from "@/hooks/useResponsive";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import type {
  Case,
  CoreSearchResult,
  RemedyResult,
  SelectedSymptom,
  Symptom,
  SymptomCategory,
} from "@/types";
import { MEDICINE_SYMPTOMS } from "@/data/medicineSymptoms";
import { calculateRepertorisation } from "@/utils/repertory";

type Pane = "index" | "engine" | "vault";
type IndexMode = "symptoms" | "remedies";
type EngineMode = "acute" | "chronic";

const CATEGORIES: Array<"all" | SymptomCategory> = [
  "all",
  "mind",
  "head",
  "eye",
  "ear",
  "nose",
  "mouth",
  "throat",
  "chest",
  "stomach",
  "abdomen",
  "back",
  "extremities",
  "skin",
  "fever",
  "sleep",
  "generals",
];

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function PaneTab({
  active,
  icon,
  label,
  meta,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  meta?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.paneTab,
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card },
        pressed && styles.pressed,
      ]}
    >
      <Feather name={icon} size={15} color={active ? colors.primaryForeground : colors.mutedForeground} />
      <Text style={[styles.paneTabLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>{label}</Text>
      {meta ? <Text style={[styles.paneTabMeta, { color: active ? colors.headerSub : colors.mutedForeground }]}>{meta}</Text> : null}
    </Pressable>
  );
}

function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.searchField, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={17} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.searchInput, { color: colors.foreground }]}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText("")}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  detail,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.sectionHeadingCopy}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow.toUpperCase()}</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {detail ? <Text style={[styles.headingDetail, { color: colors.mutedForeground }]}>{detail}</Text> : null}
    </View>
  );
}

function SymptomResult({
  symptom,
  onAdd,
  onRemove,
  selected,
}: {
  symptom: Symptom;
  onAdd: () => void;
  onRemove?: () => void;
  selected?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={selected ? onRemove : onAdd}
      style={({ pressed }) => [
        styles.resultRow,
        { borderBottomColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.resultRowCopy}>
        <Text style={[styles.resultRowTitle, { color: colors.foreground }]} numberOfLines={1}>{symptom.name}</Text>
        <Text style={[styles.resultRowMeta, { color: colors.mutedForeground }]}>{symptom.code}  /  {symptom.category}</Text>
      </View>
      <Feather name={selected ? "check" : "plus"} size={17} color={selected ? colors.primary : colors.warm} />
    </Pressable>
  );
}

function IntensityControl({
  value,
  onChange,
}: {
  value: 1 | 2 | 3;
  onChange: (value: 1 | 2 | 3) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.intensityControl, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {[1, 2, 3].map((level) => (
        <Pressable
          key={level}
          accessibilityLabel={`Intensity ${level}`}
          onPress={() => onChange(level as 1 | 2 | 3)}
          style={[styles.intensityButton, { backgroundColor: value === level ? colors.primary : "transparent" }]}
        >
          <Text style={[styles.intensityText, { color: value === level ? colors.primaryForeground : colors.mutedForeground }]}>{level}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SelectedSymptomRow({
  item,
  onRemove,
  onChangeIntensity,
}: {
  item: SelectedSymptom;
  onRemove: () => void;
  onChangeIntensity: (value: 1 | 2 | 3) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.selectedSymptom, { backgroundColor: colors.panel, borderColor: colors.border }]}>
      <View style={styles.selectedSymptomCopy}>
        <Text style={[styles.selectedSymptomName, { color: colors.foreground }]} numberOfLines={2}>{item.symptom.name}</Text>
        <Text style={[styles.resultRowMeta, { color: colors.mutedForeground }]}>{item.symptom.category} rubric</Text>
      </View>
      <IntensityControl value={item.intensity} onChange={onChangeIntensity} />
      <Pressable accessibilityLabel={`Remove ${item.symptom.name}`} hitSlop={8} onPress={onRemove}>
        <Feather name="x" size={17} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

function RemedyResultRow({ result, rank }: { result: RemedyResult; rank: number }) {
  const colors = useColors();
  return (
    <View style={[styles.remedyRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.rank, { backgroundColor: rank === 1 ? colors.signal : colors.secondary }]}>
        <Text style={[styles.rankText, { color: rank === 1 ? colors.accentForeground : colors.primary }]}>{String(rank).padStart(2, "0")}</Text>
      </View>
      <View style={styles.remedyCopy}>
        <Text style={[styles.remedyName, { color: colors.foreground }]} numberOfLines={1}>{result.medicineName}</Text>
        <Text style={[styles.resultRowMeta, { color: colors.mutedForeground }]}>{result.medicineCode}  /  {result.coverage}% coverage</Text>
      </View>
      <View style={styles.scoreBlock}>
        <Text style={[styles.score, { color: colors.primary }]}>{result.normalizedScore}</Text>
        <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>INDEX</Text>
      </View>
    </View>
  );
}

function StatusChip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "positive" | "warm" }) {
  const colors = useColors();
  const backgroundColor = tone === "positive" ? colors.signalSoft : tone === "warm" ? colors.warmSoft : colors.secondary;
  const textColor = tone === "positive" ? colors.accentForeground : tone === "warm" ? colors.warm : colors.slate;
  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <View style={[styles.statusDot, { backgroundColor: textColor }]} />
      <Text style={[styles.statusChipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function CaseCard({
  item,
  remedyNames,
  symptomCount,
  onDelete,
  onCycleStatus,
}: {
  item: Case;
  remedyNames: string[];
  symptomCount: number;
  onDelete: () => void;
  onCycleStatus: () => void;
}) {
  const colors = useColors();
  const statusTone = item.status === "completed" ? "positive" : item.status === "follow-up" ? "warm" : "neutral";
  const dateLabel = new Date(item.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  return (
    <View style={[styles.caseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.caseCardTop}>
        <View style={styles.caseIdentity}>
          <View style={[styles.caseMark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.caseMarkText, { color: colors.primaryForeground }]}>{item.patientName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.casePatient, { color: colors.foreground }]}>{item.patientName}</Text>
            <Text style={[styles.resultRowMeta, { color: colors.mutedForeground }]}>{item.caseNumber}  /  {dateLabel}</Text>
          </View>
        </View>
        <StatusChip label={item.status} tone={statusTone} />
      </View>
      <Text style={[styles.caseComplaint, { color: colors.foreground }]} numberOfLines={2}>
        {item.chiefComplaint || "No chief complaint recorded"}
      </Text>
      <View style={styles.caseMetaLine}>
        <View style={styles.caseMetaItem}>
          <Feather name="activity" size={13} color={colors.mutedForeground} />
          <Text style={[styles.caseMetaText, { color: colors.mutedForeground }]}>{symptomCount} rubrics</Text>
        </View>
        <View style={styles.caseMetaItem}>
          <Feather name="crosshair" size={13} color={colors.mutedForeground} />
          <Text style={[styles.caseMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>{remedyNames.join(", ") || "No result saved"}</Text>
        </View>
      </View>
      <View style={[styles.caseActions, { borderTopColor: colors.border }]}>
        <Pressable onPress={onCycleStatus} style={({ pressed }) => [styles.caseAction, pressed && styles.pressed]}>
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={[styles.caseActionText, { color: colors.primary }]}>Set status</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={({ pressed }) => [styles.caseAction, pressed && styles.pressed]}>
          <Feather name="trash-2" size={14} color={colors.destructive} />
          <Text style={[styles.caseActionText, { color: colors.destructive }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MateriaWorkspace() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { symptoms, medicines, cases, caseSymptoms, repertorisations, addCase, addCaseSymptoms, saveRepertorisation, deleteCase, updateCase, coreReady, coreCounts, searchCore } = useApp();
  const { contentWidth } = useResponsive();

  const [activePane, setActivePane] = useState<Pane>("index");
  const [indexMode, setIndexMode] = useState<IndexMode>("symptoms");
  const [indexQuery, setIndexQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | SymptomCategory>("all");
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [engineMode, setEngineMode] = useState<EngineMode>("acute");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [acuteResults, setAcuteResults] = useState<RemedyResult[]>([]);
  const [chronicResults, setChronicResults] = useState<RemedyResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [vaultQuery, setVaultQuery] = useState("");
  const [showAllIndex, setShowAllIndex] = useState(false);
  const [coreResults, setCoreResults] = useState<CoreSearchResult[]>([]);

  const selectedIds = useMemo(() => new Set(selectedSymptoms.map((item) => item.symptom.id)), [selectedSymptoms]);
  const selectedMedicine = useMemo(() => medicines.find((item) => item.id === selectedMedicineId) ?? null, [medicines, selectedMedicineId]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void searchCore(indexQuery).then((results) => { if (active) setCoreResults(results); });
    }, 180);
    return () => { active = false; clearTimeout(timer); };
  }, [indexQuery, searchCore]);

  const filteredSymptoms = useMemo(() => {
    const query = indexQuery.trim().toLowerCase();
    return symptoms.filter((symptom) => {
      const matchesCategory = selectedCategory === "all" || symptom.category === selectedCategory;
      const matchesQuery = !query || `${symptom.name} ${symptom.code} ${symptom.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [indexQuery, selectedCategory, symptoms]);

  const filteredMedicines = useMemo(() => {
    const query = indexQuery.trim().toLowerCase();
    return medicines.filter((medicine) => !query || `${medicine.name} ${medicine.code} ${medicine.commonName} ${medicine.description}`.toLowerCase().includes(query));
  }, [indexQuery, medicines]);

  const reverseSymptoms = useMemo(() => {
    if (!selectedMedicine) return [];
    const relatedIds = MEDICINE_SYMPTOMS.filter((entry) => entry.medicineId === selectedMedicine.id).sort((a, b) => b.strength - a.strength).map((entry) => entry.symptomId);
    return relatedIds.map((id) => symptoms.find((symptom) => symptom.id === id)).filter((symptom): symptom is Symptom => Boolean(symptom));
  }, [selectedMedicine, symptoms]);

  const vaultCases = useMemo(() => {
    const query = vaultQuery.trim().toLowerCase();
    return cases.filter((item) => !query || `${item.patientName} ${item.caseNumber} ${item.chiefComplaint}`.toLowerCase().includes(query));
  }, [cases, vaultQuery]);

  const addSymptom = (symptom: Symptom) => {
    if (selectedIds.has(symptom.id)) return;
    Haptics.selectionAsync();
    setSelectedSymptoms((current) => [...current, { symptom, intensity: 2 }]);
    setHasCalculated(false);
  };

  const removeSymptom = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSymptoms((current) => current.filter((item) => item.symptom.id !== id));
    setHasCalculated(false);
  };

  const changeIntensity = (id: string, intensity: 1 | 2 | 3) => {
    setSelectedSymptoms((current) => current.map((item) => item.symptom.id === id ? { ...item, intensity } : item));
    setHasCalculated(false);
  };

  const clearWorkspace = () => {
    setPatientName("");
    setPatientAge("");
    setChiefComplaint("");
    setSelectedSymptoms([]);
    setAcuteResults([]);
    setChronicResults([]);
    setHasCalculated(false);
  };

  const runAnalysis = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("Add a rubric", "Select at least one symptom before running the local analysis.");
      return;
    }
    const acute = calculateRepertorisation(selectedSymptoms);
    const chronicLayer = selectedSymptoms.filter((item) => item.symptom.category === "mind" || item.symptom.category === "generals");
    const chronic = calculateRepertorisation(chronicLayer.length > 0 ? chronicLayer : selectedSymptoms);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAcuteResults(acute);
    setChronicResults(chronic);
    setHasCalculated(true);
  };

  const saveCurrentCase = async () => {
    if (!patientName.trim()) {
      Alert.alert("Patient name required", "Add a patient name before saving this private case.");
      return;
    }
    if (!hasCalculated || acuteResults.length === 0) {
      Alert.alert("Run analysis first", "Calculate the dual result before saving this case.");
      return;
    }
    const combinedRemedies = Array.from(new Set([...acuteResults, ...chronicResults].map((result) => result.medicineCode))).slice(0, 5);
    const date = new Date().toISOString();
    const newCase = await addCase({
      patientId: "",
      patientName: patientName.trim(),
      patientAge: Number(patientAge) || 0,
      patientGender: "other",
      date,
      status: "active",
      notes: "Local deterministic analysis. Clinical interpretation remains with the practitioner.",
      selectedRemedies: combinedRemedies,
      chiefComplaint: chiefComplaint.trim(),
    });
    await addCaseSymptoms(newCase.id, selectedSymptoms.map((item) => ({ caseId: newCase.id, symptomId: item.symptom.id, intensity: item.intensity })));
    await saveRepertorisation({
      caseId: newCase.id,
      symptoms: selectedSymptoms.map((item) => ({ symptomId: item.symptom.id, name: item.symptom.name, intensity: item.intensity })),
      results: acuteResults.map((result) => ({ medicineId: result.medicineId, medicineCode: result.medicineCode, medicineName: result.medicineName, score: result.score, coverage: result.coverage })),
      topRemedies: combinedRemedies,
      notes: "Dual engine: acute triage plus chronic miasmatic layer.",
      date,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Case stored", `${newCase.caseNumber} is now available in the local vault.`);
    clearWorkspace();
    setActivePane("vault");
  };

  const cycleStatus = async (item: Case) => {
    const nextStatus = item.status === "active" ? "follow-up" : item.status === "follow-up" ? "completed" : "active";
    await updateCase(item.id, { status: nextStatus });
  };

  const removeCase = (item: Case) => {
    Alert.alert("Delete local case?", `${item.caseNumber} and its repertorisation will be removed from this device.`, [
      { text: "Keep case", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { void deleteCase(item.id); } },
    ]);
  };

  const resultForCase = (item: Case) => {
    const repertory = repertorisations.find((entry) => entry.caseId === item.id);
    return item.selectedRemedies.map((code) => medicines.find((medicine) => medicine.code === code)?.name ?? code).slice(0, 2)
      .concat(repertory ? [] : []);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 34, maxWidth: contentWidth, width: "100%", alignSelf: "center" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Feather name="crosshair" size={19} color={colors.signal} />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>UniRep</Text>
              <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Dr. Sohil Momin  /  clinical workspace</Text>
            </View>
          </View>
          <View style={styles.statusStack}>
            <View style={styles.statusLine}>
              <View style={[styles.liveDot, { backgroundColor: colors.signal }]} />
              <Text style={[styles.statusLineText, { color: colors.foreground }]}>LOCAL ONLY</Text>
            </View>
            <Text style={[styles.statusLineSub, { color: colors.mutedForeground }]}>no network</Text>
            <View style={{ marginTop: 6 }}>
              <ThemeSwitch />
            </View>
          </View>
        </View>

        <View style={[styles.paneSwitcher, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <PaneTab active={activePane === "index"} icon="book-open" label="Unified Index" meta={`${symptoms.length}`} onPress={() => setActivePane("index")} />
          <PaneTab active={activePane === "engine"} icon="activity" label="Dual Engine" meta={selectedSymptoms.length ? `${selectedSymptoms.length}R` : "ready"} onPress={() => setActivePane("engine")} />
          <PaneTab active={activePane === "vault"} icon="lock" label="Encrypted Vault" meta={`${cases.length}`} onPress={() => setActivePane("vault")} />
        </View>

        {activePane === "index" ? (
          <View style={styles.paneContent}>
            <View style={styles.introRow}>
              <View style={styles.introCopy}>
                <Text style={[styles.kicker, { color: colors.warm }]}>01  /  FIND THE SIGNAL</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Unified index</Text>
               <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>Search rubrics, inspect materia medica, then carry a finding into the active engine.</Text>
              </View>
              <View style={[styles.countStamp, { borderColor: colors.border }]}>
                <Text style={[styles.countStampValue, { color: colors.primary }]}>{medicines.length}</Text>
                 <Text style={[styles.countStampLabel, { color: colors.mutedForeground }]}>{coreReady ? `${coreCounts.remedies} core` : "local"}</Text>
              </View>
            </View>

            <SearchField value={indexQuery} onChangeText={setIndexQuery} placeholder="Search rubric, remedy, or code" />

            <View style={[styles.modeBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Pressable onPress={() => setIndexMode("symptoms")} style={[styles.modeButton, indexMode === "symptoms" && { backgroundColor: colors.primary }]}>
                <Feather name="list" size={14} color={indexMode === "symptoms" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.modeButtonText, { color: indexMode === "symptoms" ? colors.primaryForeground : colors.mutedForeground }]}>Rubrics</Text>
              </Pressable>
              <Pressable onPress={() => setIndexMode("remedies")} style={[styles.modeButton, indexMode === "remedies" && { backgroundColor: colors.primary }]}>
                <Feather name="book" size={14} color={indexMode === "remedies" ? colors.primaryForeground : colors.mutedForeground} />
                <Text style={[styles.modeButtonText, { color: indexMode === "remedies" ? colors.primaryForeground : colors.mutedForeground }]}>Remedies</Text>
              </Pressable>
            </View>

            {indexMode === "symptoms" ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
                  {CATEGORIES.map((category) => (
                    <Pressable key={category} onPress={() => setSelectedCategory(category)} style={[styles.categoryChip, { borderColor: selectedCategory === category ? colors.primary : colors.border, backgroundColor: selectedCategory === category ? colors.secondary : colors.card }]}>
                      <Text style={[styles.categoryText, { color: selectedCategory === category ? colors.primary : colors.mutedForeground }]}>{titleCase(category)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.listHeader}>
                  <Text style={[styles.listHeaderText, { color: colors.mutedForeground }]}>{filteredSymptoms.length} rubrics indexed</Text>
                  <Text style={[styles.listHeaderHint, { color: colors.mutedForeground }]}>tap to stage in engine</Text>
                </View>
                <View style={[styles.resultList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filteredSymptoms.slice(0, showAllIndex ? 80 : 20).map((symptom) => (
                    <SymptomResult key={symptom.id} symptom={symptom} selected={selectedIds.has(symptom.id)} onAdd={() => addSymptom(symptom)} onRemove={() => removeSymptom(symptom.id)} />
                  ))}
                  {filteredSymptoms.length === 0 ? <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No local rubric matches this search.</Text> : null}
                </View>
                {filteredSymptoms.length > 20 ? (
                  <Pressable onPress={() => setShowAllIndex((value) => !value)} style={styles.textButton}>
                    <Text style={[styles.textButtonLabel, { color: colors.primary }]}>{showAllIndex ? "Show fewer rubrics" : `Show ${Math.min(filteredSymptoms.length, 80) - 20} more rubrics`}</Text>
                    <Feather name={showAllIndex ? "chevron-up" : "chevron-down"} size={15} color={colors.primary} />
                  </Pressable>
                ) : null}
                {coreResults.length > 0 ? (
                  <View style={[styles.coreResultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.listHeader}>
                      <Text style={[styles.listHeaderText, { color: colors.foreground }]}>Classic library matches</Text>
                      <Text style={[styles.listHeaderHint, { color: colors.mutedForeground }]}>{coreCounts.paragraphs.toLocaleString()} paragraphs</Text>
                    </View>
                    {coreResults.map((result) => (
                      <View key={`${result.bookKey}-${result.paragraphNumber}`} style={[styles.coreResult, { borderTopColor: colors.border }]}>
                        <Text style={[styles.coreResultMeta, { color: colors.warm }]}>{result.bookKey.toUpperCase()}  /  §{result.paragraphNumber}</Text>
                        <Text style={[styles.coreResultText, { color: colors.foreground }]} numberOfLines={3}>{result.content}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <Text style={[styles.listHeaderText, { color: colors.mutedForeground }]}>{filteredMedicines.length} remedies indexed</Text>
                  <Text style={[styles.listHeaderHint, { color: colors.mutedForeground }]}>tap for reverse lookup</Text>
                </View>
                <View style={[styles.resultList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filteredMedicines.slice(0, showAllIndex ? 80 : 20).map((medicine) => (
                    <Pressable key={medicine.id} onPress={() => setSelectedMedicineId(medicine.id)} style={({ pressed }) => [styles.medicineRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}>
                      <View style={[styles.medicineCode, { backgroundColor: colors.panel }]}>
                        <Text style={[styles.medicineCodeText, { color: colors.primary }]}>{medicine.code}</Text>
                      </View>
                      <View style={styles.resultRowCopy}>
                        <Text style={[styles.resultRowTitle, { color: colors.foreground }]} numberOfLines={1}>{medicine.name}</Text>
                        <Text style={[styles.resultRowMeta, { color: colors.mutedForeground }]}>{medicine.commonName}  /  {medicine.potencyRange}</Text>
                      </View>
                      <Feather name="arrow-up-right" size={16} color={colors.warm} />
                    </Pressable>
                  ))}
                  {filteredMedicines.length === 0 ? <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No local remedy matches this search.</Text> : null}
                </View>
              </>
            )}

            {selectedMedicine ? (
              <View style={[styles.reverseCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <View style={styles.reverseHeading}>
                  <View>
                    <Text style={[styles.eyebrow, { color: colors.headerSub }]}>REVERSE LOOKUP</Text>
                    <Text style={[styles.reverseTitle, { color: colors.headerText }]}>{selectedMedicine.name}</Text>
                  </View>
                  <Pressable accessibilityLabel="Close reverse lookup" hitSlop={8} onPress={() => setSelectedMedicineId(null)}>
                    <Feather name="x" size={19} color={colors.headerSub} />
                  </Pressable>
                </View>
                <Text style={[styles.reverseDescription, { color: colors.headerSub }]} numberOfLines={3}>{selectedMedicine.description}</Text>
                <Text style={[styles.reverseHint, { color: colors.signal }]}>Matched rubrics  /  tap any row to stage it</Text>
                <View style={[styles.reverseList, { borderColor: colors.headerSub }]}>
                  {reverseSymptoms.slice(0, 8).map((symptom) => (
                    <SymptomResult key={symptom.id} symptom={symptom} selected={selectedIds.has(symptom.id)} onAdd={() => addSymptom(symptom)} onRemove={() => removeSymptom(symptom.id)} />
                  ))}
                </View>
                <Pressable onPress={() => setActivePane("engine")} style={[styles.reverseAction, { backgroundColor: colors.signal }]}>
                  <Text style={[styles.reverseActionText, { color: colors.accentForeground }]}>Open in dual engine</Text>
                  <Feather name="arrow-right" size={16} color={colors.accentForeground} />
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {activePane === "engine" ? (
          <View style={styles.paneContent}>
            <View style={styles.introRow}>
              <View style={styles.introCopy}>
                <Text style={[styles.kicker, { color: colors.warm }]}>02  /  READ THE PATTERN</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Dual engine</Text>
                <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>A fast, deterministic local calculation. Acute triage stays distinct from the chronic layer.</Text>
              </View>
              <View style={[styles.engineBadge, { backgroundColor: colors.signalSoft }]}>
                <Feather name="cpu" size={17} color={colors.accentForeground} />
                <Text style={[styles.engineBadgeText, { color: colors.accentForeground }]}>LOCAL</Text>
              </View>
            </View>

            <View style={[styles.caseForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeading icon="user" eyebrow="Active case" title="Patient context" detail="not required to calculate" />
              <View style={styles.formRow}>
                <TextInput value={patientName} onChangeText={setPatientName} placeholder="Patient name" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, styles.formInputWide, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
                <TextInput value={patientAge} onChangeText={setPatientAge} placeholder="Age" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad" style={[styles.formInput, styles.formInputAge, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
              </View>
              <TextInput value={chiefComplaint} onChangeText={setChiefComplaint} placeholder="Chief complaint or working note" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
            </View>

            <View style={[styles.engineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.engineCardHeader}>
                <SectionHeading icon="sliders" eyebrow="Input layer" title="Selected rubrics" detail={`${selectedSymptoms.length} staged`} />
                <Pressable onPress={() => setActivePane("index")} style={({ pressed }) => [styles.iconTextButton, pressed && styles.pressed]}>
                  <Feather name="plus" size={15} color={colors.primary} />
                  <Text style={[styles.iconTextButtonLabel, { color: colors.primary }]}>Add from index</Text>
                </Pressable>
              </View>
              {selectedSymptoms.length > 0 ? (
                <View style={styles.selectedList}>
                  {selectedSymptoms.map((item) => (
                    <SelectedSymptomRow key={item.symptom.id} item={item} onRemove={() => removeSymptom(item.symptom.id)} onChangeIntensity={(value) => changeIntensity(item.symptom.id, value)} />
                  ))}
                </View>
              ) : (
                <Pressable onPress={() => setActivePane("index")} style={[styles.emptyEngine, { borderColor: colors.border, backgroundColor: colors.panel }]}>
                  <Feather name="corner-up-left" size={18} color={colors.warm} />
                  <Text style={[styles.emptyEngineTitle, { color: colors.foreground }]}>No rubrics staged</Text>
                  <Text style={[styles.emptyEngineCopy, { color: colors.mutedForeground }]}>Use the unified index to bring a symptom into this working set.</Text>
                </Pressable>
              )}
              <Pressable onPress={runAnalysis} style={({ pressed }) => [styles.calculateButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
                <Feather name="play" size={16} color={colors.primaryForeground} />
                <Text style={[styles.calculateButtonText, { color: colors.primaryForeground }]}>Run dual analysis</Text>
                <Text style={[styles.calculateButtonMeta, { color: colors.headerSub }]}>{selectedSymptoms.length ? `${selectedSymptoms.length} rubrics` : "awaiting input"}</Text>
              </Pressable>
            </View>

            {hasCalculated ? (
              <View style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.analysisHeader}>
                  <View>
                    <Text style={[styles.eyebrow, { color: colors.warm }]}>DETERMINISTIC RESULT</Text>
                    <Text style={[styles.analysisTitle, { color: colors.foreground }]}>Two readings, one workspace</Text>
                  </View>
                  <Pressable onPress={saveCurrentCase} style={[styles.saveButton, { backgroundColor: colors.signal }]}>
                    <Feather name="save" size={14} color={colors.accentForeground} />
                    <Text style={[styles.saveButtonText, { color: colors.accentForeground }]}>Save</Text>
                  </Pressable>
                </View>
                <View style={[styles.engineModeBar, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Pressable onPress={() => setEngineMode("acute")} style={[styles.engineModeButton, engineMode === "acute" && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.engineModeTitle, { color: engineMode === "acute" ? colors.primaryForeground : colors.foreground }]}>Acute triage</Text>
                    <Text style={[styles.engineModeSub, { color: engineMode === "acute" ? colors.headerSub : colors.mutedForeground }]}>{acuteResults.length} leading remedies</Text>
                  </Pressable>
                  <Pressable onPress={() => setEngineMode("chronic")} style={[styles.engineModeButton, engineMode === "chronic" && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.engineModeTitle, { color: engineMode === "chronic" ? colors.primaryForeground : colors.foreground }]}>Chronic layer</Text>
                    <Text style={[styles.engineModeSub, { color: engineMode === "chronic" ? colors.headerSub : colors.mutedForeground }]}>mind + generals</Text>
                  </Pressable>
                </View>
                <View style={styles.analysisNote}>
                  <Feather name="info" size={14} color={colors.warm} />
                  <Text style={[styles.analysisNoteText, { color: colors.mutedForeground }]}>
                    {engineMode === "acute" ? "All staged rubrics contribute to the acute triage score." : "The chronic view uses mind and generals first, falling back to the full working set."}
                  </Text>
                </View>
                <View style={styles.resultStack}>
                  {(engineMode === "acute" ? acuteResults : chronicResults).slice(0, 5).map((result, index) => <RemedyResultRow key={result.medicineId} result={result} rank={index + 1} />)}
                </View>
              </View>
            ) : null}

            <Pressable onPress={clearWorkspace} style={styles.clearButton}>
              <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
              <Text style={[styles.clearButtonText, { color: colors.mutedForeground }]}>Clear active workspace</Text>
            </Pressable>
          </View>
        ) : null}

        {activePane === "vault" ? (
          <View style={styles.paneContent}>
            <View style={styles.introRow}>
              <View style={styles.introCopy}>
                <Text style={[styles.kicker, { color: colors.warm }]}>03  /  KEEP IT PRIVATE</Text>
                <Text style={[styles.pageTitle, { color: colors.foreground }]}>Encrypted vault</Text>
                <Text style={[styles.pageDescription, { color: colors.mutedForeground }]}>Your working cases remain on this device. No account, sync, or network dependency.</Text>
              </View>
              <View style={[styles.lockStamp, { backgroundColor: colors.primary }]}>
                <Feather name="lock" size={18} color={colors.signal} />
              </View>
            </View>
            <View style={[styles.privacyBanner, { backgroundColor: colors.primary }]}>
              <View style={[styles.privacyIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="shield" size={18} color={colors.primary} />
              </View>
              <View style={styles.privacyCopy}>
                <Text style={[styles.privacyTitle, { color: colors.headerText }]}>Private by default</Text>
                <Text style={[styles.privacyText, { color: colors.headerSub }]}>Device-local AsyncStorage  /  no cloud transport</Text>
              </View>
              <StatusChip label="OFFLINE" tone="positive" />
            </View>
            <SearchField value={vaultQuery} onChangeText={setVaultQuery} placeholder="Find a case by name or number" />
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderText, { color: colors.mutedForeground }]}>{vaultCases.length} stored {vaultCases.length === 1 ? "case" : "cases"}</Text>
              <Text style={[styles.listHeaderHint, { color: colors.mutedForeground }]}>local records</Text>
            </View>
            {vaultCases.length > 0 ? vaultCases.map((item) => (
              <CaseCard
                key={item.id}
                item={item}
                symptomCount={caseSymptoms.filter((symptom) => symptom.caseId === item.id).length || repertorisations.find((entry) => entry.caseId === item.id)?.symptoms.length || 0}
                remedyNames={resultForCase(item)}
                onDelete={() => removeCase(item)}
                onCycleStatus={() => { void cycleStatus(item); }}
              />
            )) : (
              <View style={[styles.vaultEmpty, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.vaultEmptyMark, { backgroundColor: colors.secondary }]}>
                  <Feather name="archive" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.vaultEmptyTitle, { color: colors.foreground }]}>No local cases yet</Text>
                <Text style={[styles.vaultEmptyCopy, { color: colors.mutedForeground }]}>Run a dual analysis, then save the case to keep its rubrics and result together.</Text>
                <Pressable onPress={() => setActivePane("engine")} style={[styles.outlineButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.outlineButtonText, { color: colors.primary }]}>Open dual engine</Text>
                  <Feather name="arrow-right" size={15} color={colors.primary} />
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandBlock: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  brandMark: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontWeight: "700", letterSpacing: -0.5 },
  brandSub: { fontSize: 10, marginTop: 2, letterSpacing: 0.2 },
  statusStack: { alignItems: "flex-end", gap: 2 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusLineText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  statusLineSub: { fontSize: 10 },
  paneSwitcher: { flexDirection: "row", padding: 4, borderRadius: 14, borderWidth: 1, gap: 4 },
  paneTab: { flex: 1, minHeight: 57, borderRadius: 10, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 8, justifyContent: "center", alignItems: "center", gap: 3 },
  paneTabLabel: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  paneTabMeta: { fontSize: 9, letterSpacing: 0.4 },
  pressed: { opacity: 0.72 },
  paneContent: { gap: 14 },
  introRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  introCopy: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: "700", letterSpacing: 1.3, marginBottom: 5 },
  pageTitle: { fontSize: 29, fontWeight: "700", letterSpacing: -1 },
  pageDescription: { fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 310 },
  countStamp: { width: 66, height: 66, borderWidth: 1, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  countStampValue: { fontSize: 24, fontWeight: "700", letterSpacing: -1 },
  countStampLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.6 },
  searchField: { borderWidth: 1, borderRadius: 12, minHeight: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
  modeBar: { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 3 },
  modeButton: { flex: 1, minHeight: 36, borderRadius: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  modeButtonText: { fontSize: 12, fontWeight: "700" },
  categoryStrip: { gap: 7, paddingVertical: 1 },
  categoryChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  categoryText: { fontSize: 11, fontWeight: "600" },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listHeaderText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  listHeaderHint: { fontSize: 10 },
  resultList: { borderWidth: 1, borderRadius: 13, overflow: "hidden" },
  coreResultsCard: { borderWidth: 1, borderRadius: 13, overflow: "hidden", paddingHorizontal: 13, paddingTop: 13 },
  coreResult: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 11, marginTop: 10 },
  coreResultMeta: { fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 5 },
  coreResultText: { fontSize: 12, lineHeight: 17 },
  resultRow: { minHeight: 57, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  resultRowCopy: { flex: 1, minWidth: 0 },
  resultRowTitle: { fontSize: 13, fontWeight: "600" },
  resultRowMeta: { fontSize: 10, marginTop: 3, textTransform: "capitalize" },
  emptyText: { padding: 18, textAlign: "center", fontSize: 12 },
  textButton: { minHeight: 34, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  textButtonLabel: { fontSize: 12, fontWeight: "700" },
  medicineRow: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  medicineCode: { width: 54, minHeight: 33, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  medicineCodeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  reverseCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 11 },
  reverseHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reverseTitle: { fontSize: 19, fontWeight: "700", marginTop: 3 },
  reverseDescription: { fontSize: 12, lineHeight: 18 },
  reverseHint: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  reverseList: { borderTopWidth: 1, borderBottomWidth: 1 },
  reverseAction: { borderRadius: 9, minHeight: 42, paddingHorizontal: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reverseActionText: { fontSize: 12, fontWeight: "700" },
  engineBadge: { width: 60, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", gap: 3 },
  engineBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  caseForm: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  sectionIcon: { width: 31, height: 31, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  sectionHeadingCopy: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  headingDetail: { fontSize: 9, alignSelf: "center" },
  formRow: { flexDirection: "row", gap: 8 },
  formInput: { minHeight: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 13 },
  formInputWide: { flex: 1 },
  formInputAge: { width: 64 },
  engineCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  engineCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconTextButton: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4 },
  iconTextButtonLabel: { fontSize: 11, fontWeight: "700" },
  selectedList: { gap: 8 },
  selectedSymptom: { borderWidth: 1, borderRadius: 10, minHeight: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  selectedSymptomCopy: { flex: 1, minWidth: 0 },
  selectedSymptomName: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
  intensityControl: { flexDirection: "row", borderWidth: 1, borderRadius: 7, padding: 2, gap: 2 },
  intensityButton: { width: 22, height: 22, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  intensityText: { fontSize: 10, fontWeight: "800" },
  emptyEngine: { minHeight: 105, borderWidth: 1, borderRadius: 10, borderStyle: "dashed", alignItems: "center", justifyContent: "center", padding: 14, gap: 5 },
  emptyEngineTitle: { fontSize: 13, fontWeight: "700" },
  emptyEngineCopy: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  calculateButton: { minHeight: 48, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  calculateButtonText: { fontSize: 13, fontWeight: "800" },
  calculateButtonMeta: { fontSize: 10, marginLeft: 3 },
  analysisCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
  analysisHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  analysisTitle: { fontSize: 16, fontWeight: "700", marginTop: 3 },
  saveButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  saveButtonText: { fontSize: 11, fontWeight: "800" },
  engineModeBar: { borderWidth: 1, borderRadius: 10, padding: 3, flexDirection: "row" },
  engineModeButton: { flex: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 8 },
  engineModeTitle: { fontSize: 11, fontWeight: "800" },
  engineModeSub: { fontSize: 9, marginTop: 3 },
  analysisNote: { flexDirection: "row", gap: 7, alignItems: "flex-start", paddingHorizontal: 2 },
  analysisNoteText: { flex: 1, fontSize: 10, lineHeight: 15 },
  resultStack: { borderTopWidth: 0 },
  remedyRow: { minHeight: 59, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  rank: { width: 29, height: 29, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 10, fontWeight: "800" },
  remedyCopy: { flex: 1, minWidth: 0 },
  remedyName: { fontSize: 12, fontWeight: "700" },
  scoreBlock: { width: 42, alignItems: "flex-end" },
  score: { fontSize: 17, fontWeight: "800", letterSpacing: -0.4 },
  scoreLabel: { fontSize: 8, letterSpacing: 0.5 },
  clearButton: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  clearButtonText: { fontSize: 11, fontWeight: "600" },
  lockStamp: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  privacyBanner: { borderRadius: 14, padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  privacyIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  privacyCopy: { flex: 1 },
  privacyTitle: { fontSize: 13, fontWeight: "800" },
  privacyText: { fontSize: 10, marginTop: 3 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusChipText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  caseCard: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 11 },
  caseCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  caseIdentity: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  caseMark: { width: 32, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  caseMarkText: { fontSize: 14, fontWeight: "800" },
  casePatient: { fontSize: 14, fontWeight: "700" },
  caseComplaint: { fontSize: 12, lineHeight: 17 },
  caseMetaLine: { flexDirection: "row", alignItems: "center", gap: 12 },
  caseMetaItem: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  caseMetaText: { fontSize: 10, flexShrink: 1 },
  caseActions: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9, flexDirection: "row", justifyContent: "flex-end", gap: 16 },
  caseAction: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 24 },
  caseActionText: { fontSize: 10, fontWeight: "700" },
  vaultEmpty: { borderWidth: 1, borderRadius: 14, minHeight: 240, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },
  vaultEmptyMark: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 3 },
  vaultEmptyTitle: { fontSize: 16, fontWeight: "700" },
  vaultEmptyCopy: { textAlign: "center", fontSize: 12, lineHeight: 18, maxWidth: 260 },
  outlineButton: { minHeight: 40, borderWidth: 1, borderRadius: 9, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  outlineButtonText: { fontSize: 12, fontWeight: "800" },
});