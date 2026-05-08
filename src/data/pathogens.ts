export type RiskLevel = "Critical" | "High" | "Moderate" | "Low";

export interface Biomarker {
  name: string;
  type: "Metabolite" | "Toxin" | "QS Molecule" | "Volatile" | "Enzyme";
  recommendedSensor: string; // sensor id
  lod: string;
  detectionTime: string;
  mechanism: string;
  clinicalMeaning: string;
}

export interface Pathogen {
  id: string;
  name: string;
  shortName: string;
  gram: "Gram-negative" | "Gram-positive";
  riskLevel: RiskLevel;
  infectionSites: string[];
  qsSystem: { name: string; molecules: string[]; clinicalNote: string };
  amrGenes: { gene: string; resistance: string }[];
  empiricalTreatment: string[];
  biomarkers: Biomarker[];
  summary: string;
}

export const pathogens: Pathogen[] = [
  {
    id: "pa",
    name: "Pseudomonas aeruginosa",
    shortName: "P. aeruginosa",
    gram: "Gram-negative",
    riskLevel: "Critical",
    infectionSites: ["Burn wounds", "Cystic fibrosis lungs", "VAP", "UTI", "Catheter biofilm"],
    qsSystem: {
      name: "LasI/LasR + RhlI/RhlR",
      molecules: ["3-oxo-C12-HSL", "C4-HSL", "PQS"],
      clinicalNote:
        "AHL detection indicates active quorum sensing — biofilm formation and virulence factor production are imminent. Early intervention before biofilm maturation is critical.",
    },
    amrGenes: [
      { gene: "blaVIM / blaIMP", resistance: "Carbapenem (MBL)" },
      { gene: "mexAB-oprM", resistance: "Multi-drug efflux" },
      { gene: "ampC", resistance: "Cephalosporins" },
    ],
    empiricalTreatment: [
      "Piperacillin-tazobactam 4.5 g IV q6h",
      "Ceftolozane-tazobactam if MDR suspected",
      "Add tobramycin for severe sepsis",
    ],
    biomarkers: [
      {
        name: "Pyocyanin",
        type: "Metabolite",
        recommendedSensor: "dpv-colorimetric",
        lod: "0.5 µM",
        detectionTime: "< 5 min",
        mechanism: "Redox-active phenazine; produces a characteristic blue-green signal at 690 nm. DPV peak shift at -0.25 V vs Ag/AgCl confirms presence.",
        clinicalMeaning: "Pathognomonic for P. aeruginosa. Indicates active infection, not colonisation.",
      },
      {
        name: "3-oxo-C12-HSL (AHL)",
        type: "QS Molecule",
        recommendedSensor: "frect-qd",
        lod: "10 nM",
        detectionTime: "8 min",
        mechanism: "AHL binds aptamer-functionalised QD; FRET quenching is proportional to concentration.",
        clinicalMeaning: "QS active — biofilm and virulence cascade engaged. Treat aggressively.",
      },
      {
        name: "Pyoverdine",
        type: "Metabolite",
        recommendedSensor: "aunp-lateral",
        lod: "1 µM",
        detectionTime: "10 min",
        mechanism: "Iron-chelating siderophore; fluorescent at 460 nm under UV. AuNP aggregation produces visible red→blue shift.",
        clinicalMeaning: "Confirms iron-stressed environment typical of chronic CF lung colonisation.",
      },
    ],
    summary:
      "Opportunistic Gram-negative pathogen; intrinsic multidrug resistance; major cause of healthcare-associated infections.",
  },
  {
    id: "sa",
    name: "Staphylococcus aureus (MRSA)",
    shortName: "S. aureus",
    gram: "Gram-positive",
    riskLevel: "High",
    infectionSites: ["Skin/soft tissue", "Bloodstream", "Endocarditis", "Surgical site", "Bone (osteomyelitis)"],
    qsSystem: {
      name: "Agr (accessory gene regulator)",
      molecules: ["AIP-I", "AIP-II", "AIP-III", "AIP-IV"],
      clinicalNote:
        "AIP detection signals switch from adhesion to toxin production. Type matters — AIP-I dominant in MRSA USA300.",
    },
    amrGenes: [
      { gene: "mecA", resistance: "Methicillin / all beta-lactams" },
      { gene: "vanA", resistance: "Vancomycin (rare, VRSA)" },
      { gene: "ermC", resistance: "Macrolides, clindamycin" },
    ],
    empiricalTreatment: [
      "Vancomycin 15-20 mg/kg IV q8-12h (MRSA)",
      "Daptomycin 6 mg/kg if bacteraemia",
      "Linezolid 600 mg IV/PO q12h alternative",
    ],
    biomarkers: [
      {
        name: "AIP-I (autoinducing peptide)",
        type: "QS Molecule",
        recommendedSensor: "mip-capacitive",
        lod: "5 nM",
        detectionTime: "12 min",
        mechanism: "Molecularly imprinted polymer cavity binds AIP-I; capacitance change measured by impedance spectroscopy.",
        clinicalMeaning: "Confirms agr quorum activation — toxin production imminent.",
      },
      {
        name: "Staphyloxanthin",
        type: "Metabolite",
        recommendedSensor: "dpv-colorimetric",
        lod: "0.2 µM",
        detectionTime: "6 min",
        mechanism: "Carotenoid pigment; absorbance peak at 462 nm. Confers oxidative stress resistance.",
        clinicalMeaning: "Marker of virulent S. aureus strain; correlates with neutrophil resistance.",
      },
      {
        name: "Protein A",
        type: "Toxin",
        recommendedSensor: "echem-aptasensor",
        lod: "0.1 ng/mL",
        detectionTime: "9 min",
        mechanism: "Aptasensor surface captures Protein A; SWV current change quantifies binding.",
        clinicalMeaning: "Species-specific S. aureus identification.",
      },
    ],
    summary:
      "Leading cause of skin and bloodstream infection. MRSA represents a WHO high-priority resistant pathogen.",
  },
  {
    id: "ec",
    name: "Escherichia coli",
    shortName: "E. coli",
    gram: "Gram-negative",
    riskLevel: "High",
    infectionSites: ["UTI", "Bacteraemia", "Neonatal meningitis", "Gastroenteritis (STEC)"],
    qsSystem: {
      name: "LuxS / AI-2 + SdiA",
      molecules: ["AI-2 (autoinducer-2)", "Indole"],
      clinicalNote: "Indole modulates biofilm and acid resistance; AI-2 mediates inter-species crosstalk in gut and urinary tract.",
    },
    amrGenes: [
      { gene: "blaCTX-M", resistance: "ESBL — 3rd gen cephalosporins" },
      { gene: "blaNDM / blaKPC", resistance: "Carbapenem" },
      { gene: "mcr-1", resistance: "Colistin" },
    ],
    empiricalTreatment: [
      "Nitrofurantoin 100 mg PO BID (uncomplicated UTI)",
      "Ceftriaxone 1-2 g IV daily (pyelonephritis)",
      "Meropenem 1 g IV q8h if ESBL/CRE risk",
    ],
    biomarkers: [
      {
        name: "Indole",
        type: "Metabolite",
        recommendedSensor: "dpv-colorimetric",
        lod: "1 µM",
        detectionTime: "4 min",
        mechanism: "Kovac's reaction analogue; pink chromophore at 540 nm. Direct DPV oxidation peak at +0.65 V.",
        clinicalMeaning: "Positive indole strongly suggests E. coli over Klebsiella in urine culture.",
      },
      {
        name: "AI-2",
        type: "QS Molecule",
        recommendedSensor: "frect-qd",
        lod: "20 nM",
        detectionTime: "10 min",
        mechanism: "Boronate-functionalised QD binds AI-2 furanone diol; FRET ratio change.",
        clinicalMeaning: "Cross-kingdom QS active — polymicrobial biofilm likely.",
      },
      {
        name: "Shiga toxin (Stx1/2)",
        type: "Toxin",
        recommendedSensor: "aunp-lateral",
        lod: "0.5 ng/mL",
        detectionTime: "15 min",
        mechanism: "Antibody-conjugated AuNP lateral flow strip; visible test line in 15 min.",
        clinicalMeaning: "STEC confirmed — avoid antibiotics, risk of HUS.",
      },
    ],
    summary:
      "Most common cause of UTI and Gram-negative bacteraemia. ESBL and carbapenem resistance rising globally.",
  },
  {
    id: "kp",
    name: "Klebsiella pneumoniae",
    shortName: "K. pneumoniae",
    gram: "Gram-negative",
    riskLevel: "Critical",
    infectionSites: ["HAP/VAP", "UTI", "Liver abscess", "Bacteraemia"],
    qsSystem: {
      name: "LuxS / AI-2",
      molecules: ["AI-2", "2,3-butanediol"],
      clinicalNote: "Hypervirulent strains (hvKP) produce hypermucoviscous capsule under QS regulation — string test positive.",
    },
    amrGenes: [
      { gene: "blaKPC", resistance: "Carbapenem" },
      { gene: "blaOXA-48", resistance: "Carbapenem" },
      { gene: "rmpA", resistance: "Hypervirulence (capsule)" },
    ],
    empiricalTreatment: [
      "Meropenem 2 g IV q8h (extended infusion)",
      "Ceftazidime-avibactam if KPC",
      "Polymyxin B + tigecycline for XDR",
    ],
    biomarkers: [
      {
        name: "2,3-butanediol",
        type: "Volatile",
        recommendedSensor: "mip-capacitive",
        lod: "10 µM",
        detectionTime: "11 min",
        mechanism: "Volatile organic compound; MIP cavity binds diol — capacitance shift correlates linearly to log[concentration].",
        clinicalMeaning: "Differentiates Klebsiella from E. coli in respiratory samples.",
      },
      {
        name: "Capsular polysaccharide (K1/K2)",
        type: "Toxin",
        recommendedSensor: "echem-aptasensor",
        lod: "0.3 ng/mL",
        detectionTime: "10 min",
        mechanism: "Lectin-functionalised electrode binds capsule sugars; SWV current change.",
        clinicalMeaning: "K1/K2 detection = hypervirulent strain — risk of metastatic infection.",
      },
    ],
    summary:
      "Major cause of nosocomial pneumonia and CRE outbreaks. Hypervirulent strains cause community liver abscess.",
  },
  {
    id: "ab",
    name: "Acinetobacter baumannii",
    shortName: "A. baumannii",
    gram: "Gram-negative",
    riskLevel: "Critical",
    infectionSites: ["VAP (ICU)", "Wound infection", "Bacteraemia", "Combat trauma"],
    qsSystem: {
      name: "AbaI/AbaR",
      molecules: ["3-OH-C12-HSL"],
      clinicalNote: "QS controls biofilm on endotracheal tubes and central lines. Detection signals device colonisation.",
    },
    amrGenes: [
      { gene: "blaOXA-23 / OXA-24", resistance: "Carbapenem" },
      { gene: "armA", resistance: "All aminoglycosides" },
      { gene: "adeABC", resistance: "Multi-drug efflux" },
    ],
    empiricalTreatment: [
      "Sulbactam-durlobactam (preferred for CRAB)",
      "Polymyxin B 1.25 mg/kg IV q12h",
      "Add minocycline or tigecycline",
    ],
    biomarkers: [
      {
        name: "3-OH-C12-HSL",
        type: "QS Molecule",
        recommendedSensor: "frect-qd",
        lod: "8 nM",
        detectionTime: "9 min",
        mechanism: "Aptamer-QD FRET; AHL binding restores donor emission.",
        clinicalMeaning: "Confirms A. baumannii biofilm activity on indwelling device.",
      },
      {
        name: "Acinetobactin",
        type: "Metabolite",
        recommendedSensor: "aunp-lateral",
        lod: "0.8 µM",
        detectionTime: "12 min",
        mechanism: "Catechol siderophore; chelates Fe(III) on AuNP — colour shift.",
        clinicalMeaning: "Active iron acquisition — virulent phenotype.",
      },
    ],
    summary:
      "WHO critical-priority pathogen. Survives weeks on dry surfaces; CRAB outbreaks devastate ICUs.",
  },
  {
    id: "ent",
    name: "Enterococcus faecium (VRE)",
    shortName: "E. faecium",
    gram: "Gram-positive",
    riskLevel: "High",
    infectionSites: ["Bloodstream", "UTI", "Endocarditis", "Intra-abdominal"],
    qsSystem: {
      name: "Fsr (fsrA/B/C)",
      molecules: ["GBAP (gelatinase biosynthesis-activating pheromone)"],
      clinicalNote: "Fsr controls gelatinase and serine protease — biofilm and tissue invasion.",
    },
    amrGenes: [
      { gene: "vanA / vanB", resistance: "Vancomycin (VRE)" },
      { gene: "aac(6')-Ie-aph(2'')", resistance: "High-level aminoglycoside" },
    ],
    empiricalTreatment: [
      "Linezolid 600 mg IV/PO q12h",
      "Daptomycin 8-12 mg/kg IV daily",
      "Tigecycline if abdominal source",
    ],
    biomarkers: [
      {
        name: "GBAP",
        type: "QS Molecule",
        recommendedSensor: "mip-capacitive",
        lod: "15 nM",
        detectionTime: "12 min",
        mechanism: "MIP cavity binds cyclic peptide; impedance shift correlates with concentration.",
        clinicalMeaning: "Active QS — biofilm forming on prosthetic valves or catheters.",
      },
      {
        name: "D-lactate",
        type: "Metabolite",
        recommendedSensor: "dpv-colorimetric",
        lod: "0.5 mM",
        detectionTime: "4 min",
        mechanism: "Enzymatic D-LDH coupled with NAD+ reduction; UV at 340 nm or DPV oxidation.",
        clinicalMeaning: "Elevated D-lactate suggests Gram-positive overgrowth; supports VRE in bacteraemia.",
      },
    ],
    summary: "Vancomycin-resistant enterococci (VRE) — major HAI in oncology and transplant units.",
  },
  {
    id: "mtb",
    name: "Mycobacterium tuberculosis",
    shortName: "M. tuberculosis",
    gram: "Gram-positive",
    riskLevel: "Critical",
    infectionSites: ["Lungs (pulmonary TB)", "Lymph nodes", "Bone (Pott)", "CNS (meningitis)"],
    qsSystem: {
      name: "MprAB / SigE (stress-response)",
      molecules: ["Mycolic acids", "Tuberculostearic acid"],
      clinicalNote: "Cell-wall lipids modulate granuloma persistence and drug tolerance.",
    },
    amrGenes: [
      { gene: "rpoB", resistance: "Rifampicin (RIF-R = MDR marker)" },
      { gene: "katG / inhA", resistance: "Isoniazid" },
      { gene: "gyrA", resistance: "Fluoroquinolones (XDR)" },
    ],
    empiricalTreatment: [
      "RIPE: Rifampicin + Isoniazid + Pyrazinamide + Ethambutol × 2 mo",
      "Then RIF + INH × 4 mo",
      "Bedaquiline + linezolid for MDR/XDR",
    ],
    biomarkers: [
      {
        name: "Tuberculostearic acid (TBSA)",
        type: "Volatile",
        recommendedSensor: "mip-capacitive",
        lod: "50 ng/mL",
        detectionTime: "20 min",
        mechanism: "MIP-electrode array detects 10-methyloctadecanoic acid in breath condensate.",
        clinicalMeaning: "Highly specific for mycobacterial cell wall — bypasses sputum collection.",
      },
      {
        name: "LAM (lipoarabinomannan)",
        type: "Toxin",
        recommendedSensor: "aunp-lateral",
        lod: "1 ng/mL",
        detectionTime: "25 min",
        mechanism: "AuNP lateral flow with anti-LAM mAb; visible band in urine.",
        clinicalMeaning: "Urine LAM positive → active TB, esp. in HIV co-infection.",
      },
    ],
    summary: "Slow-growing acid-fast bacillus; leading cause of infectious death globally; MDR rising.",
  },
  {
    id: "vc",
    name: "Vibrio cholerae",
    shortName: "V. cholerae",
    gram: "Gram-negative",
    riskLevel: "High",
    infectionSites: ["Small intestine", "Bloodstream (rare)"],
    qsSystem: {
      name: "CqsA/CqsS + LuxS/AI-2",
      molecules: ["CAI-1 (cholera autoinducer)", "AI-2"],
      clinicalNote: "High-cell-density QS represses virulence — paradoxically signals dispersal phase.",
    },
    amrGenes: [
      { gene: "SXT element", resistance: "Sulphonamides, trimethoprim" },
      { gene: "qnrVC", resistance: "Quinolones" },
    ],
    empiricalTreatment: [
      "Aggressive ORS / IV Ringer's lactate",
      "Doxycycline 300 mg PO single dose (adults)",
      "Azithromycin 1 g if pregnant",
    ],
    biomarkers: [
      {
        name: "Cholera toxin (CT)",
        type: "Toxin",
        recommendedSensor: "echem-aptasensor",
        lod: "0.05 ng/mL",
        detectionTime: "8 min",
        mechanism: "GM1-ganglioside-functionalised electrode binds CT-B subunit; SWV current change.",
        clinicalMeaning: "Confirms toxigenic V. cholerae (O1/O139) — rice-water diarrhoea.",
      },
      {
        name: "CAI-1",
        type: "QS Molecule",
        recommendedSensor: "frect-qd",
        lod: "5 nM",
        detectionTime: "10 min",
        mechanism: "Aptamer-QD FRET; α-hydroxyketone binding.",
        clinicalMeaning: "Late-stage outbreak signal — predicts shedding burden.",
      },
    ],
    summary: "Causes acute watery diarrhoea; outbreak pathogen in low-sanitation settings.",
  },
];

export function findPathogen(id: string) {
  return pathogens.find((p) => p.id === id);
}