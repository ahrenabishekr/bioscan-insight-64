export interface SensorPlatform {
  id: string;
  name: string;
  shortName: string;
  detects: string[];
  howItWorks: string;
  equipment: string;
  costPerTest: string;
  lodRange: string;
  detectionTime: string;
  reusability: string;
  bestSamples: string[];
  pros: string[];
  cons: string[];
}

export const sensors: SensorPlatform[] = [
  {
    id: "echem-aptasensor",
    name: "Electrochemical Aptasensor",
    shortName: "Aptasensor",
    detects: ["Protein A", "Capsule polysaccharides", "Toxin proteins"],
    howItWorks:
      "A DNA aptamer immobilised on a gold electrode binds the target with antibody-like specificity. Binding changes electron transfer at the surface, measured by Square Wave Voltammetry (SWV) or EIS.",
    equipment: "Portable potentiostat (e.g. Sensit Smart) + disposable screen-printed electrode",
    costPerTest: "$2–4",
    lodRange: "0.1 – 10 ng/mL",
    detectionTime: "5 – 12 min",
    reusability: "Single-use electrode",
    bestSamples: ["Serum", "Sputum", "Wound swab eluate"],
    pros: ["Highly specific", "Quantitative", "Portable"],
    cons: ["Requires trained interpretation", "Aptamer storage at 4 °C"],
  },
  {
    id: "frect-qd",
    name: "FRET Quantum-Dot Nanosensor",
    shortName: "FRET QD",
    detects: ["AHLs", "AI-2", "Small QS molecules"],
    howItWorks:
      "Quantum dot donor + dye acceptor pair functionalised with QS-binding aptamer. Target binding changes donor–acceptor distance; ratiometric fluorescence (530/620 nm) is concentration-dependent.",
    equipment: "Compact fluorimeter or smartphone fluorescence reader",
    costPerTest: "$3–6",
    lodRange: "1 – 100 nM",
    detectionTime: "6 – 10 min",
    reusability: "Disposable cartridge",
    bestSamples: ["Wound exudate", "Bronchoalveolar lavage", "Urine"],
    pros: ["Ultra-low LOD for QS molecules", "Ratiometric — robust to intensity drift"],
    cons: ["Requires reader instrument", "QD photobleaching over time"],
  },
  {
    id: "dpv-colorimetric",
    name: "DPV / Colorimetric Sensor",
    shortName: "DPV / Colour",
    detects: ["Pyocyanin", "Indole", "Staphyloxanthin", "Redox metabolites"],
    howItWorks:
      "Differential Pulse Voltammetry detects redox-active metabolites at characteristic potentials. Parallel colorimetric strip gives a visual readout for confirmation.",
    equipment: "Pocket potentiostat OR naked-eye strip",
    costPerTest: "$0.50–2",
    lodRange: "0.2 – 5 µM",
    detectionTime: "3 – 6 min",
    reusability: "Strip single-use; electrode 5–10 uses",
    bestSamples: ["Sputum", "Wound swab", "Urine"],
    pros: ["Very fast", "Cheap", "Visual readout possible"],
    cons: ["Limited to redox-active analytes", "Cross-reactivity with ascorbate"],
  },
  {
    id: "mip-capacitive",
    name: "MIP Capacitive Sensor",
    shortName: "MIP",
    detects: ["AIPs", "Volatile metabolites", "2,3-butanediol"],
    howItWorks:
      "Molecularly Imprinted Polymer with target-shaped cavities is coated on an interdigitated electrode. Binding alters dielectric constant — capacitance change is logarithmic to concentration.",
    equipment: "Impedance analyser or LCR meter",
    costPerTest: "$1.50",
    lodRange: "5 nM – 10 µM",
    detectionTime: "8 – 15 min",
    reusability: "Reusable up to 50 cycles after wash",
    bestSamples: ["Breath condensate", "Wound headspace", "Urine"],
    pros: ["Reusable", "Robust to harsh samples", "Antibody-free"],
    cons: ["Slower kinetics", "Imprinting batch variability"],
  },
  {
    id: "aunp-lateral",
    name: "AuNP Lateral Flow",
    shortName: "Lateral Flow",
    detects: ["Toxins", "Siderophores", "Surface antigens"],
    howItWorks:
      "Gold nanoparticles conjugated to capture antibody. Sample wicks through nitrocellulose; visible red line forms at test zone within minutes if target is present.",
    equipment: "None — visual readout (optional smartphone reader for quantification)",
    costPerTest: "$1–3",
    lodRange: "0.5 – 50 ng/mL",
    detectionTime: "10 – 15 min",
    reusability: "Single-use",
    bestSamples: ["Serum", "Stool eluate", "Wound swab", "Urine"],
    pros: ["No equipment needed", "Bedside / point-of-care", "Trivial training"],
    cons: ["Semi-quantitative", "Higher LOD than electrochemical"],
  },
];

export function findSensor(id: string) {
  return sensors.find((s) => s.id === id);
}