import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { MEDICINES } from "@/data/medicines";
import { MEDICINE_SYMPTOMS } from "@/data/medicineSymptoms";
import { SYMPTOMS } from "@/data/symptoms";
import type { Case, CaseSymptom, CoreSearchResult, Medicine, MedicineSymptom, Patient, Repertorisation, Symptom } from "@/types";
import { useCoreDatabase } from "@/context/CoreDatabaseContext";
import { readSecure, writeSecure } from "@/lib/secureStorage";

const KEYS = {
  PATIENTS: "unirep_patients",
  CASES: "unirep_cases",
  CASE_SYMPTOMS: "unirep_case_symptoms",
  REPERTORISATIONS: "unirep_repertorisations",
  CASE_COUNTER: "unirep_case_counter",
};

/** Keys used before the rename; read once so no existing case is lost. */
const LEGACY_KEYS: Record<string, string> = {
  PATIENTS: "homeo_patients",
  CASES: "homeo_cases",
  CASE_SYMPTOMS: "homeo_case_symptoms",
  REPERTORISATIONS: "homeo_repertorisations",
};

async function migrateLegacyStorage(): Promise<void> {
  await Promise.all(
    Object.entries(LEGACY_KEYS).map(async ([name, legacy]) => {
      const target = KEYS[name as keyof typeof KEYS];
      const [current, previous] = await Promise.all([
        AsyncStorage.getItem(target),
        AsyncStorage.getItem(legacy),
      ]);
      if (current === null && previous !== null) {
        await AsyncStorage.setItem(target, previous);
      }
    }),
  );
}

interface AppContextType {
  medicines: Medicine[];
  symptoms: Symptom[];
  medicineSymptoms: MedicineSymptom[];
  patients: Patient[];
  cases: Case[];
  caseSymptoms: CaseSymptom[];
  repertorisations: Repertorisation[];
  addCase: (c: Omit<Case, "id" | "caseNumber">) => Promise<Case>;
  updateCase: (id: string, updates: Partial<Case>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addCaseSymptoms: (caseId: string, symptoms: CaseSymptom[]) => Promise<void>;
  saveRepertorisation: (r: Omit<Repertorisation, "id">) => Promise<Repertorisation>;
  getCasesForAnalytics: () => {
    total: number;
    thisMonth: number;
    active: number;
    completed: number;
    followUp: number;
    topRemedies: { code: string; name: string; count: number }[];
    monthlyData: { month: string; count: number }[];
  };
  coreReady: boolean;
  coreCounts: { remedies: number; rubrics: number; paragraphs: number };
  searchCore: (query: string) => Promise<CoreSearchResult[]>;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

async function getNextCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const key = `${KEYS.CASE_COUNTER}_${year}`;
  const raw = await AsyncStorage.getItem(key);
  const next = raw ? parseInt(raw, 10) + 1 : 1;
  await AsyncStorage.setItem(key, next.toString());
  return `REP-${year}-${String(next).padStart(3, "0")}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { ready: coreReady, counts: coreCounts, search: searchCore } = useCoreDatabase();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [caseSymptoms, setCaseSymptoms] = useState<CaseSymptom[]>([]);
  const [repertorisations, setRepertorisations] = useState<Repertorisation[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        await migrateLegacyStorage();
        const [p, c, cs, r] = await Promise.all([
          readSecure<Patient[]>(KEYS.PATIENTS),
          readSecure<Case[]>(KEYS.CASES),
          readSecure<CaseSymptom[]>(KEYS.CASE_SYMPTOMS),
          readSecure<Repertorisation[]>(KEYS.REPERTORISATIONS),
        ]);
        if (p) setPatients(p);
        if (c) setCases(c);
        if (cs) setCaseSymptoms(cs);
        if (r) setRepertorisations(r);
      } catch (e) {}
    };
    load();
  }, []);


  const addCase = useCallback(async (c: Omit<Case, "id" | "caseNumber">): Promise<Case> => {
    const caseNumber = await getNextCaseNumber();
    const newCase: Case = { ...c, id: generateId(), caseNumber };
    const updated = [newCase, ...cases];
    setCases(updated);
    await writeSecure(KEYS.CASES, updated);
    return newCase;
  }, [cases]);

  const updateCase = useCallback(async (id: string, updates: Partial<Case>) => {
    const updated = cases.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCases(updated);
    await writeSecure(KEYS.CASES, updated);
  }, [cases]);

  const deleteCase = useCallback(async (id: string) => {
    const updated = cases.filter((c) => c.id !== id);
    const updatedSymptoms = caseSymptoms.filter((cs) => cs.caseId !== id);
    const updatedReps = repertorisations.filter((r) => r.caseId !== id);
    setCases(updated);
    setCaseSymptoms(updatedSymptoms);
    setRepertorisations(updatedReps);
    await Promise.all([
      writeSecure(KEYS.CASES, updated),
      writeSecure(KEYS.CASE_SYMPTOMS, updatedSymptoms),
      writeSecure(KEYS.REPERTORISATIONS, updatedReps),
    ]);
  }, [cases, caseSymptoms, repertorisations]);

  const addCaseSymptoms = useCallback(async (caseId: string, newSymptoms: CaseSymptom[]) => {
    const filtered = caseSymptoms.filter((cs) => cs.caseId !== caseId);
    const updated = [...filtered, ...newSymptoms];
    setCaseSymptoms(updated);
    await writeSecure(KEYS.CASE_SYMPTOMS, updated);
  }, [caseSymptoms]);

  const saveRepertorisation = useCallback(async (r: Omit<Repertorisation, "id">): Promise<Repertorisation> => {
    const newRep: Repertorisation = { ...r, id: generateId() };
    const updated = [newRep, ...repertorisations];
    setRepertorisations(updated);
    await writeSecure(KEYS.REPERTORISATIONS, updated);
    return newRep;
  }, [repertorisations]);

  const getCasesForAnalytics = useCallback(() => {
    const total = cases.length;
    const now = new Date();
    const thisMonth = cases.filter((c) => {
      const d = new Date(c.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const active = cases.filter((c) => c.status === "active").length;
    const completed = cases.filter((c) => c.status === "completed").length;
    const followUp = cases.filter((c) => c.status === "follow-up").length;

    const remedyCount: Record<string, number> = {};
    cases.forEach((c) => {
      c.selectedRemedies.forEach((code) => {
        remedyCount[code] = (remedyCount[code] ?? 0) + 1;
      });
    });
    const topRemedies = Object.entries(remedyCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([code, count]) => {
        const med = MEDICINES.find((m) => m.code === code);
        return { code, name: med?.name ?? code, count };
      });

    const monthlyData: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const count = cases.filter((c) => {
        const cd = new Date(c.date);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
      }).length;
      monthlyData.push({ month: label, count });
    }

    return { total, thisMonth, active, completed, followUp, topRemedies, monthlyData };
  }, [cases]);

  return (
    <AppContext.Provider value={{
      medicines: MEDICINES,
      symptoms: SYMPTOMS,
      medicineSymptoms: MEDICINE_SYMPTOMS,
      patients,
      cases,
      caseSymptoms,
      repertorisations,
      addCase,
      updateCase,
      deleteCase,
      addCaseSymptoms,
      saveRepertorisation,
      getCasesForAnalytics,
      coreReady,
      coreCounts,
      searchCore,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
