import { MEDICINE_SYMPTOMS } from "@/data/medicineSymptoms";
import { MEDICINES } from "@/data/medicines";
import type { RemedyResult, SelectedSymptom } from "@/types";

export function calculateRepertorisation(selected: SelectedSymptom[]): RemedyResult[] {
  if (selected.length === 0) return [];

  const results: RemedyResult[] = [];

  for (const med of MEDICINES) {
    let rawScore = 0;
    let coveredCount = 0;

    for (const sel of selected) {
      const ms = MEDICINE_SYMPTOMS.find(
        (ms) => ms.medicineId === med.id && ms.symptomId === sel.symptom.id
      );
      if (ms) {
        rawScore += sel.intensity * ms.strength;
        coveredCount++;
      }
    }

    if (coveredCount === 0) continue;

    const coverage = coveredCount / selected.length;
    const finalScore = rawScore * coverage;

    results.push({
      medicineId: med.id,
      medicineCode: med.code,
      medicineName: med.name,
      score: parseFloat(finalScore.toFixed(2)),
      coverage: parseFloat((coverage * 100).toFixed(1)),
      normalizedScore: 0,
    });
  }

  results.sort((a, b) => b.score - a.score);

  const top = results.slice(0, 10);
  const maxScore = top[0]?.score ?? 1;

  return top.map((r) => ({
    ...r,
    normalizedScore: parseFloat(((r.score / maxScore) * 100).toFixed(1)),
  }));
}
