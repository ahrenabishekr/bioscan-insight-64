import { pathogens, type Pathogen, type Biomarker } from "@/data/pathogens";

const symptomMap: { keywords: string[]; pathogenId: string; weight: number }[] = [
  { keywords: ["burn", "green pus", "blue-green", "fruity odour", "ventilator", "cystic fibrosis", "cf lung"], pathogenId: "pa", weight: 3 },
  { keywords: ["wound", "abscess", "boil", "cellulitis", "endocarditis", "bacteraemia"], pathogenId: "sa", weight: 2 },
  { keywords: ["dysuria", "urinary", "uti", "diarrhea", "bloody stool", "hus", "pyelonephritis"], pathogenId: "ec", weight: 2 },
  { keywords: ["pneumonia", "ventilator", "liver abscess", "string test", "sputum currant"], pathogenId: "kp", weight: 2 },
  { keywords: ["icu", "ventilator", "trauma", "combat", "endotracheal", "central line"], pathogenId: "ab", weight: 2 },
];

export interface MatchResult {
  pathogen: Pathogen;
  score: number;
  matched: string[];
  topBiomarker: Biomarker;
}

export function matchSymptoms(text: string): MatchResult[] {
  const t = text.toLowerCase();
  const scores = new Map<string, { score: number; matched: string[] }>();
  for (const rule of symptomMap) {
    for (const kw of rule.keywords) {
      if (t.includes(kw)) {
        const cur = scores.get(rule.pathogenId) ?? { score: 0, matched: [] };
        cur.score += rule.weight;
        cur.matched.push(kw);
        scores.set(rule.pathogenId, cur);
      }
    }
  }
  return Array.from(scores.entries())
    .map(([id, v]) => {
      const p = pathogens.find((x) => x.id === id)!;
      return { pathogen: p, score: v.score, matched: v.matched, topBiomarker: p.biomarkers[0] };
    })
    .sort((a, b) => b.score - a.score);
}

export function matchByBiomarker(biomarkerName: string): MatchResult[] {
  const results: MatchResult[] = [];
  for (const p of pathogens) {
    const b = p.biomarkers.find((bm) => bm.name === biomarkerName);
    if (b) results.push({ pathogen: p, score: 10, matched: [biomarkerName], topBiomarker: b });
  }
  return results;
}

export function allBiomarkerNames(): string[] {
  const set = new Set<string>();
  pathogens.forEach((p) => p.biomarkers.forEach((b) => set.add(b.name)));
  return Array.from(set).sort();
}