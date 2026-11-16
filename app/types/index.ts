export interface Medicine {
  id: string;
  code: string;
  name: string;
  commonName: string;
  potencyRange: string;
  description: string;
  primarySymptoms: string[];
  relatedMedicines: string[];
}

export interface Symptom {
  id: string;
  code: string;
  name: string;
  category: SymptomCategory;
  description: string;
}

export type SymptomCategory =
  | "mind"
  | "head"
  | "eye"
  | "ear"
  | "nose"
  | "mouth"
  | "throat"
  | "chest"
  | "stomach"
  | "abdomen"
  | "rectum"
  | "urinary"
  | "male"
  | "female"
  | "back"
  | "extremities"
  | "skin"
  | "fever"
  | "sleep"
  | "generals";

export interface MedicineSymptom {
  medicineId: string;
  symptomId: string;
  strength: 1 | 2 | 3;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  address: string;
  chiefComplaint: string;
}

export interface Case {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "male" | "female" | "other";
  caseNumber: string;
  date: string;
  status: "active" | "completed" | "follow-up" | "temporary";
  notes: string;
  selectedRemedies: string[];
  chiefComplaint: string;
}

export interface CaseSymptom {
  caseId: string;
  symptomId: string;
  intensity: 1 | 2 | 3;
}

export interface Repertorisation {
  id: string;
  caseId: string;
  symptoms: { symptomId: string; name: string; intensity: number }[];
  results: { medicineId: string; medicineCode: string; medicineName: string; score: number; coverage: number }[];
  topRemedies: string[];
  notes: string;
  date: string;
}

export interface SelectedSymptom {
  symptom: Symptom;
  intensity: 1 | 2 | 3;
}

export interface RemedyResult {
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  score: number;
  coverage: number;
  normalizedScore: number;
}

export interface CoreSearchResult {
  bookKey: string;
  edition: string;
  paragraphNumber: number;
  content: string;
}
