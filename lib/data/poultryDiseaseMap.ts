// lib/data/poultryDiseaseMap.ts
// EXHAUSTIVE POULTRY DISEASE AND PEST DATABASE
// Follows the exact same schema as pestDiseaseMapping.ts
// Each disease has pathogenType ("viral" / "bacterial" / "fungal" / "parasitic")
// Each pest has feedingType ("external" / "internal")
// Chemical controls include mode ("systemic" / "contact" / "both") and action ("preventive" / "curative" / "both")

export interface PoultryPestDisease {
  name: string;
  type: "disease" | "pest";
  pathogenType?: "viral" | "bacterial" | "fungal" | "parasitic" | "nutritional" | "metabolic";
  feedingType?: "external" | "internal" | "biting" | "sucking";
  chemicalControls: {
    productName: string;
    activeIngredient: string;
    rate: string;
    ratePerFlock?: string;
    applicationMethod: string;
    timing: string;
    withdrawalPeriod?: string;
    packageSizes?: string[];
    costPerPackage?: number;
    status?: "active" | "restricted" | "banned" | "check-locally" | "vaccine";
    notes?: string;
    mode: "systemic" | "contact" | "both" | "preventive";
    action: "preventive" | "curative" | "both";
  }[];
  organicControls?: { method: string; preparation: string; application: string }[];
  biologicalControls?: { method: string; description: string }[];
  culturalControls: string[];
  businessNote?: string;
  zoonotic?: boolean; // Can it spread to humans?
}

// ============================================================================
// VIRAL DISEASES
// ============================================================================

const viralDiseases: PoultryPestDisease[] = [
  {
    name: "Newcastle Disease (NDV)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "NDV Live Vaccine (Lasota strain)",
        activeIngredient: "Live attenuated virus",
        rate: "1 dose per bird",
        ratePerFlock: "200 doses per pack",
        applicationMethod: "Eye drop or drinking water",
        timing: "Day 1, 21, 56, then every 3 months",
        withdrawalPeriod: "N/A",
        packageSizes: ["200 doses (Ksh 500)", "500 doses"],
        costPerPackage: 500,
        status: "vaccine",
        notes: "Must be kept cold (2-8°C). Use within 2 hours of reconstitution.",
        mode: "preventive",
        action: "preventive"
      },
      {
        productName: "NDV Inactivated Oil Vaccine",
        activeIngredient: "Inactivated virus",
        rate: "0.5ml per bird (subcutaneous)",
        ratePerFlock: "500ml bottle = 1,000 doses",
        applicationMethod: "Subcutaneous injection",
        timing: "Week 8-10, booster at point of lay",
        withdrawalPeriod: "N/A",
        packageSizes: ["500ml (Ksh 1,200)"],
        costPerPackage: 1200,
        status: "vaccine",
        notes: "For layers and breeders only. Gives long-lasting immunity.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [
      {
        method: "Garlic + Ginger infusion",
        preparation: "Crush 5 garlic cloves + 1 inch ginger in 1L water, steep 24hrs",
        application: "Add to drinking water for 3 days (1 part infusion : 4 parts water)"
      },
      {
        method: "Neem leaf extract",
        preparation: "Boil 500g neem leaves in 2L water for 15min, cool, strain",
        application: "Add to drinking water for 5 days"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Strict biosecurity: disinfect boots, vehicles, equipment",
      "Quarantine new birds for 14–21 days",
      "Vaccinate all birds according to schedule",
      "Report sudden deaths (more than 5 in 24hrs) to veterinary officer",
      "Do not mix birds of different ages or sources",
      "Dispose of dead birds by deep burial or burning"
    ],
    businessNote: "Vaccination costs Ksh 500–1,200 per flock of 200 birds. An outbreak can wipe out 80–100% of your flock – vaccination is the cheapest insurance. A single outbreak can cost Ksh 100,000+ in losses."
  },
  {
    name: "Infectious Bursal Disease (IBD / Gumboro)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "IBD Live Vaccine (Intermediate strain)",
        activeIngredient: "Live attenuated virus",
        rate: "1 dose per bird",
        ratePerFlock: "200 doses per pack",
        applicationMethod: "Eye drop or drinking water",
        timing: "Day 14–21 (when maternal antibodies decline)",
        withdrawalPeriod: "N/A",
        packageSizes: ["200 doses (Ksh 400)", "500 doses"],
        costPerPackage: 400,
        status: "vaccine",
        notes: "Use intermediate strain where maternal antibodies are high.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Thorough cleaning and disinfection between flocks (use Virkon S or bleach)",
      "Reduce stress (overcrowding, temperature extremes)",
      "Maintain good litter hygiene",
      "Vaccinate at correct age"
    ],
    businessNote: "IBD attacks the immune system, making birds susceptible to secondary infections. Vaccination at Ksh 400/200 doses is far cheaper than treating secondary infections."
  },
  {
    name: "Marek's Disease",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Marek's Disease Vaccine (HVT strain)",
        activeIngredient: "Live attenuated turkey herpesvirus",
        rate: "1 dose per bird",
        ratePerFlock: "1,000 doses per pack",
        applicationMethod: "Subcutaneous injection at day-old",
        timing: "Day 1 (at hatchery)",
        withdrawalPeriod: "N/A",
        packageSizes: ["1,000 doses (Ksh 1,500)"],
        costPerPackage: 1500,
        status: "vaccine",
        notes: "Must be administered at day-old. Delayed vaccination is ineffective.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Only buy vaccinated day-old chicks",
      "Avoid rearing birds that shed the virus (carriers)",
      "Maintain strict biosecurity",
      "Breeding for genetic resistance"
    ],
    businessNote: "Marek's causes paralysis and tumours. There is no treatment – only prevention. Vaccination at day-old costs Ksh 1.50 per bird and can save your entire flock."
  },
  {
    name: "Infectious Bronchitis (IB)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "IB Live Vaccine (Massachusetts strain)",
        activeIngredient: "Live attenuated virus",
        rate: "1 dose per bird",
        ratePerFlock: "200 doses per pack",
        applicationMethod: "Eye drop or drinking water",
        timing: "Day 7–14, booster at point of lay",
        withdrawalPeriod: "N/A",
        packageSizes: ["200 doses (Ksh 450)", "500 doses"],
        costPerPackage: 450,
        status: "vaccine",
        notes: "Many strains exist – match vaccine to circulating strain where possible.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [
      {
        method: "Garlic + honey",
        preparation: "Crush 5 garlic cloves, add 1 tbsp honey, steep in 1L warm water",
        application: "Add to drinking water (1 part : 5 parts water) for 3 days"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Good ventilation (reduces ammonia and humidity)",
      "Avoid overcrowding",
      "Clean and disinfect drinkers regularly",
      "Vaccinate all birds"
    ],
    businessNote: "IB causes poor egg quality (thin, wrinkled, pale shells) in layers. Layers affected by IB can lose 30–50% of their egg production."
  },
  {
    name: "Infectious Laryngotracheitis (ILT)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "ILT Live Vaccine",
        activeIngredient: "Live attenuated virus",
        rate: "1 dose per bird",
        ratePerFlock: "1,000 doses per pack",
        applicationMethod: "Eye drop",
        timing: "Week 8–12",
        withdrawalPeriod: "N/A",
        packageSizes: ["1,000 doses (Ksh 800)"],
        costPerPackage: 800,
        status: "vaccine",
        notes: "Do not vaccinate if disease is already present (can cause severe reaction).",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Quarantine new birds",
      "Good ventilation",
      "Reduce ammonia levels",
      "Do not mix flocks of different ages"
    ],
    businessNote: "ILT causes severe breathing difficulty and coughing blood. Mortality can reach 20–30%. Vaccination at Ksh 0.80/bird is highly cost-effective."
  },
  {
    name: "Fowl Pox",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Fowl Pox Vaccine",
        activeIngredient: "Live attenuated fowl pox virus",
        rate: "1 dose per bird",
        ratePerFlock: "200 doses per pack",
        applicationMethod: "Wing web stab (needle dipped in vaccine)",
        timing: "Week 8–10 (or anytime)",
        withdrawalPeriod: "N/A",
        packageSizes: ["200 doses (Ksh 350)", "500 doses"],
        costPerPackage: 350,
        status: "vaccine",
        notes: "Check for take (small scab) 7–10 days post-vaccination.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Control mosquitoes (they spread the virus)",
      "Remove and burn affected birds",
      "Biosecurity – disinfect equipment"
    ],
    businessNote: "Fowl Pox causes scabs on comb and wattles. Mild in layers but can cause 30–50% mortality in young birds. Prevention via vaccination costs Ksh 1.75/bird."
  },
  {
    name: "Egg Drop Syndrome (EDS-76)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "EDS Inactivated Vaccine",
        activeIngredient: "Inactivated virus",
        rate: "0.5ml per bird (subcutaneous)",
        ratePerFlock: "500ml = 1,000 doses",
        applicationMethod: "Subcutaneous injection",
        timing: "Week 16–18 (at point of lay)",
        withdrawalPeriod: "N/A",
        packageSizes: ["500ml (Ksh 1,000)"],
        costPerPackage: 1000,
        status: "vaccine",
        notes: "For layers only. Often combined with other vaccines.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Buy vaccinated pullets",
      "Avoid stress during lay (move, feed changes)",
      "Maintain consistent lighting schedule"
    ],
    businessNote: "EDS causes a sudden drop in egg production (up to 40%). Vaccination at Ksh 1/bird protects your entire lay cycle."
  },
  {
    name: "Avian Influenza (HPAI / LPAI)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: true,
    chemicalControls: [
      {
        productName: "Avian Influenza Vaccine",
        activeIngredient: "Inactivated virus",
        rate: "0.5ml per bird",
        ratePerFlock: "500ml = 1,000 doses",
        applicationMethod: "Subcutaneous injection",
        timing: "As per government guidelines",
        withdrawalPeriod: "N/A",
        packageSizes: ["500ml (Ksh 1,500)"],
        costPerPackage: 1500,
        status: "check-locally",
        notes: "Not available in all countries. Check with veterinary authorities.",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Strict biosecurity (no visitors, no wild birds)",
      "Report any suspicious deaths to authorities",
      "Disinfect all vehicles entering farm",
      "Do not share equipment between farms"
    ],
    businessNote: "HPAI can cause 100% mortality. Immediate reporting is required by law. A single outbreak can bankrupt a farm."
  },
  {
    name: "Avian Encephalomyelitis (AE)",
    type: "disease",
    pathogenType: "viral",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "AE Live Vaccine",
        activeIngredient: "Live attenuated virus",
        rate: "1 dose per bird",
        ratePerFlock: "200 doses per pack",
        applicationMethod: "Drinking water",
        timing: "Week 8–12 (breeders only)",
        withdrawalPeriod: "N/A",
        packageSizes: ["200 doses (Ksh 300)"],
        costPerPackage: 300,
        status: "vaccine",
        notes: "Vaccinate breeders to protect chicks (maternal antibodies).",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Only vaccinate breeders (layers usually not needed)",
      "Avoid stress during lay"
    ],
    businessNote: "AE causes head tremors in young chicks. Prevent by vaccinating breeders."
  }
];

// ============================================================================
// BACTERIAL DISEASES
// ============================================================================

const bacterialDiseases: PoultryPestDisease[] = [
  {
    name: "Fowl Cholera (Pasteurellosis)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Oxytetracycline 20%",
        activeIngredient: "Oxytetracycline",
        rate: "1g per litre of water",
        ratePerFlock: "100g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5–7 days",
        withdrawalPeriod: "14 days",
        packageSizes: ["100g (Ksh 600)", "1kg"],
        costPerPackage: 600,
        status: "active",
        mode: "systemic",
        action: "curative"
      },
      {
        productName: "Sulfadimethoxine (Sulphastop)",
        activeIngredient: "Sulfadimethoxine",
        rate: "250mg per litre of water",
        ratePerFlock: "25g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5 days",
        withdrawalPeriod: "10 days",
        packageSizes: ["50g (Ksh 450)", "200g"],
        costPerPackage: 450,
        status: "active",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Remove dead birds immediately",
      "Disinfect drinkers and feeders daily",
      "Reduce overcrowding",
      "Control rodents (they carry Pasteurella)"
    ],
    businessNote: "Fowl Cholera causes sudden death. Treat early. Lost birds = lost profit."
  },
  {
    name: "Fowl Typhoid (Salmonella gallinarum)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Sulfadimethoxine (Sulphastop)",
        activeIngredient: "Sulfadimethoxine",
        rate: "250mg per litre water",
        ratePerFlock: "25g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5–7 days",
        withdrawalPeriod: "10 days",
        packageSizes: ["50g (Ksh 450)", "200g"],
        costPerPackage: 450,
        status: "active",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Buy from reputable hatcheries (Salmonella-free)",
      "Clean and disinfect houses between flocks",
      "Do not mix poultry with other birds"
    ],
    businessNote: "Fowl Typhoid causes high mortality in adult birds. Prevention is key – buy clean stock."
  },
  {
    name: "Pullorum Disease (Salmonella pullorum)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Enrofloxacin 10%",
        activeIngredient: "Enrofloxacin",
        rate: "1ml per litre water",
        ratePerFlock: "100ml per 100L water",
        applicationMethod: "Drinking water",
        timing: "3–5 days",
        withdrawalPeriod: "10 days",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "restricted",
        notes: "Use only under veterinary guidance (fluoroquinolone)",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Buy vaccinated chicks",
      "Use strict biosecurity",
      "Cull positive carriers"
    ],
    businessNote: "Pullorum causes white diarrhoea in chicks with high mortality. Eradicate by testing and culling."
  },
  {
    name: "Colibacillosis (E. coli)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Oxytetracycline 20%",
        activeIngredient: "Oxytetracycline",
        rate: "1g per litre water",
        ratePerFlock: "100g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5 days",
        withdrawalPeriod: "14 days",
        packageSizes: ["100g (Ksh 600)"],
        costPerPackage: 600,
        status: "active",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Apple cider vinegar",
        preparation: "10ml per litre water",
        application: "Drinking water once per week"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Clean drinkers daily",
      "Avoid overcrowding",
      "Good ventilation",
      "Reduce dust and ammonia"
    ],
    businessNote: "E. coli is everywhere – it strikes when birds are stressed. Focus on management."
  },
  {
    name: "Infectious Coryza",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Sulfamethazine + TMP",
        activeIngredient: "Sulfamethazine + Trimethoprim",
        rate: "1g per 2 litres water",
        ratePerFlock: "50g per 100L water",
        applicationMethod: "Drinking water",
        timing: "3–5 days",
        withdrawalPeriod: "10 days",
        packageSizes: ["50g (Ksh 400)"],
        costPerPackage: 400,
        status: "active",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Garlic infusion",
        preparation: "Crush 10 cloves garlic, steep in 1L water 24hrs",
        application: "Add to drinking water (1:5) for 3 days"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "All-in/all-out management",
      "Clean and disinfect houses between flocks",
      "Vaccinate (where available)",
      "Separate age groups"
    ],
    businessNote: "Coryza causes facial swelling and discharge. Treat early or lose production."
  },
  {
    name: "Chronic Respiratory Disease (CRD – Mycoplasma gallisepticum)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Tylosin 10%",
        activeIngredient: "Tylosin",
        rate: "1ml per 2 litres water",
        ratePerFlock: "50ml per 100L water",
        applicationMethod: "Drinking water",
        timing: "3–5 days",
        withdrawalPeriod: "5 days",
        packageSizes: ["100ml (Ksh 800)"],
        costPerPackage: 800,
        status: "active",
        mode: "both",
        action: "both"
      }
    ],
    organicControls: [
      {
        method: "Garlic infusion",
        preparation: "Crush 5 cloves garlic, steep in 1L water 24hrs",
        application: "Add to drinking water (1:5) for 5 days"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Buy Mycoplasma-free stock",
      "Good ventilation",
      "Reduce stress",
      "Vaccinate where available"
    ],
    businessNote: "CRD causes chronic coughing and poor performance. Prevention is better than treatment."
  },
  {
    name: "Mycoplasma Synoviae (MS)",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Tylosin 10%",
        activeIngredient: "Tylosin",
        rate: "1ml per 2 litres water",
        ratePerFlock: "50ml per 100L water",
        applicationMethod: "Drinking water",
        timing: "5 days",
        withdrawalPeriod: "5 days",
        packageSizes: ["100ml (Ksh 800)"],
        costPerPackage: 800,
        status: "active",
        mode: "both",
        action: "both"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Buy Mycoplasma-free stock",
      "Vaccinate where available",
      "Reduce stress"
    ],
    businessNote: "MS causes lameness and swollen joints. Affects growth and egg production."
  },
  {
    name: "Necrotic Enteritis",
    type: "disease",
    pathogenType: "bacterial",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Amoxicillin 50%",
        activeIngredient: "Amoxicillin",
        rate: "1g per litre water",
        ratePerFlock: "100g per 100L water",
        applicationMethod: "Drinking water",
        timing: "3–5 days",
        withdrawalPeriod: "7 days",
        packageSizes: ["100g (Ksh 700)"],
        costPerPackage: 700,
        status: "active",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Good litter management (dry, not too wet)",
      "Avoid sudden feed changes",
      "Use coccidiostats in feed"
    ],
    businessNote: "Necrotic Enteritis causes sudden death in broilers. Prevent with good management."
  }
];

// ============================================================================
// PARASITIC DISEASES (Internal)
// ============================================================================

const parasiticDiseases: PoultryPestDisease[] = [
  {
    name: "Coccidiosis",
    type: "disease",
    pathogenType: "parasitic",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Amprolium (Coccivet)",
        activeIngredient: "Amprolium",
        rate: "1g per litre water",
        ratePerFlock: "100g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5–7 days",
        withdrawalPeriod: "14 days",
        packageSizes: ["100g (Ksh 800)", "250g"],
        costPerPackage: 800,
        status: "active",
        mode: "contact",
        action: "curative"
      },
      {
        productName: "Toltrazuril (Baycox)",
        activeIngredient: "Toltrazuril",
        rate: "0.5ml per litre water",
        ratePerFlock: "50ml per 100L water",
        applicationMethod: "Drinking water",
        timing: "Single dose (2 days)",
        withdrawalPeriod: "14 days",
        packageSizes: ["100ml (Ksh 1,200)"],
        costPerPackage: 1200,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Apple cider vinegar",
        preparation: "10ml per litre water",
        application: "Drinking water once per week"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Clean and change litter regularly",
      "Avoid overcrowding",
      "Use coccidiostats in starter feed",
      "Rotate pastures"
    ],
    businessNote: "Coccidiosis causes bloody diarrhoea and stunted growth. Toltrazuril is expensive but highly effective."
  },
  {
    name: "Histomoniasis (Blackhead)",
    type: "disease",
    pathogenType: "parasitic",
    zoonotic: false,
    chemicalControls: [
      {
        productName: "Metronidazole",
        activeIngredient: "Metronidazole",
        rate: "1g per 2 litres water",
        ratePerFlock: "50g per 100L water",
        applicationMethod: "Drinking water",
        timing: "5 days",
        withdrawalPeriod: "14 days",
        packageSizes: ["50g (Ksh 600)"],
        costPerPackage: 600,
        status: "restricted",
        notes: "Use only under veterinary guidance",
        mode: "systemic",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Do not mix turkeys with chickens",
      "Control cecal worms (they carry Histomonas)",
      "Deworm regularly"
    ],
    businessNote: "Blackhead is a serious threat to turkeys. Prevention is best."
  }
];

// ============================================================================
// EXTERNAL PESTS (Parasites)
// ============================================================================

const externalPests: PoultryPestDisease[] = [
  {
    name: "Red Mite (Dermanyssus gallinae)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin (Exaltox)",
        activeIngredient: "Permethrin",
        rate: "10ml per 1L water",
        ratePerFlock: "1L solution per 10 birds",
        applicationMethod: "Spray on birds and perches",
        timing: "Repeat every 7–10 days",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      },
      {
        productName: "Diatomaceous Earth (DE)",
        activeIngredient: "Silica",
        rate: "Dust lightly",
        ratePerFlock: "1kg per house",
        applicationMethod: "Dust birds and perches",
        timing: "As needed",
        withdrawalPeriod: "N/A",
        packageSizes: ["1kg (Ksh 300)"],
        costPerPackage: 300,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Neem oil spray",
        preparation: "50ml neem oil + 2L water",
        application: "Spray perches and houses weekly"
      },
      {
        method: "Garlic + chilli spray",
        preparation: "Crush 5 cloves garlic + 2 chilli in 2L water",
        application: "Spray on birds"
      }
    ],
    biologicalControls: [
      {
        method: "Predatory mites (Hypoaspis miles)",
        description: "Release in litter to control mite populations."
      }
    ],
    culturalControls: [
      "Clean houses thoroughly between flocks",
      "Use smooth perches (mites hide in cracks)",
      "Apply old engine oil to wooden perches",
      "Burn old litter"
    ],
    businessNote: "Red mites cause anaemia, stress, and reduce egg production. DE is safe and cheap."
  },
  {
    name: "Northern Fowl Mite (Ornithonyssus sylviarum)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin (Exaltox)",
        activeIngredient: "Permethrin",
        rate: "10ml per 1L water",
        ratePerFlock: "1L solution per 10 birds",
        applicationMethod: "Spray on birds",
        timing: "Repeat weekly",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Diatomaceous Earth",
        preparation: "Dust lightly",
        application: "Dust birds and nest boxes"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Clean houses regularly",
      "Remove old nesting material",
      "Treat before new flock arrives"
    ],
    businessNote: "Northern fowl mites live on birds and cause skin irritation. Control is similar to red mites."
  },
  {
    name: "Scaly Leg Mite (Knemidocoptes mutans)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin dip",
        activeIngredient: "Permethrin",
        rate: "5ml per 1L water",
        ratePerFlock: "Dip affected birds only",
        applicationMethod: "Dip legs",
        timing: "Repeat weekly",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Vaseline + sulfur",
        preparation: "Mix with sulfur powder",
        application: "Apply to legs daily for 7 days"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Clean houses",
      "Quarantine affected birds",
      "Cull severe cases"
    ],
    businessNote: "Scaly leg mites cause crusty, deformed legs. Treat early or the bird will suffer."
  },
  {
    name: "Chicken Lice (Menopon, Lipeurus, Goniodes)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin (Exaltox)",
        activeIngredient: "Permethrin",
        rate: "10ml per 1L water",
        ratePerFlock: "1L solution per 10 birds",
        applicationMethod: "Spray on birds",
        timing: "Repeat after 14 days",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [
      {
        method: "Diatomaceous Earth",
        preparation: "Dust lightly",
        application: "Dust birds and nest boxes"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Clean houses regularly",
      "Remove old litter",
      "Separate affected birds"
    ],
    businessNote: "Lice cause irritation, feather loss, and reduced productivity."
  },
  {
    name: "Sticktight Flea (Echidnophaga gallinacea)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin (Exaltox)",
        activeIngredient: "Permethrin",
        rate: "10ml per 1L water",
        ratePerFlock: "1L solution per 10 birds",
        applicationMethod: "Spray on birds",
        timing: "Repeat weekly",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Clean houses",
      "Eliminate wild birds",
      "Treat dogs/cats (they carry fleas)"
    ],
    businessNote: "Sticktight fleas embed in the face and comb. Use tweezers for severe cases."
  },
  {
    name: "Fowl Tick (Argas persicus)",
    type: "pest",
    feedingType: "external",
    chemicalControls: [
      {
        productName: "Permethrin (Exaltox)",
        activeIngredient: "Permethrin",
        rate: "15ml per 1L water",
        ratePerFlock: "Spray house thoroughly",
        applicationMethod: "Spray walls, perches, cracks",
        timing: "Repeat weekly",
        withdrawalPeriod: "N/A",
        packageSizes: ["100ml (Ksh 500)"],
        costPerPackage: 500,
        status: "active",
        mode: "contact",
        action: "curative"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Seal cracks in walls",
      "Remove wild bird nests",
      "Burn old litter"
    ],
    businessNote: "Fowl ticks transmit diseases. Control with acaricides."
  }
];

// ============================================================================
// NUTRITIONAL / METABOLIC DISORDERS
// ============================================================================

const nutritionalDisorders: PoultryPestDisease[] = [
  {
    name: "Rickets (Ca/P/Vit D Deficiency)",
    type: "disease",
    pathogenType: "nutritional",
    chemicalControls: [
      {
        productName: "Calcium supplement",
        activeIngredient: "Calcium carbonate",
        rate: "2g per kg feed",
        ratePerFlock: "Add to feed",
        applicationMethod: "Mix in feed",
        timing: "Continuous",
        withdrawalPeriod: "N/A",
        packageSizes: ["1kg (Ksh 200)"],
        costPerPackage: 200,
        status: "active",
        notes: "Use oyster shell or limestone flour",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [
      {
        method: "Crushed eggshells",
        preparation: "Wash, dry, crush",
        application: "Add to feed (2%)"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Provide balanced feed",
      "Ensure adequate sunlight",
      "Add vitamin D3 to feed"
    ],
    businessNote: "Rickets causes soft, rubbery bones. Prevention is cheaper than treatment."
  },
  {
    name: "Fatty Liver Hemorrhagic Syndrome",
    type: "disease",
    pathogenType: "metabolic",
    chemicalControls: [],
    organicControls: [
      {
        method: "Choline chloride",
        preparation: "Add to feed",
        application: "Mix in feed per label"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Avoid overfeeding",
      "Encourage exercise",
      "Use balanced feed"
    ],
    businessNote: "Fatty Liver causes sudden death in layers. Manage feed intake."
  },
  {
    name: "Gout (Visceral / Articular)",
    type: "disease",
    pathogenType: "metabolic",
    chemicalControls: [],
    organicControls: [
      {
        method: "Apple cider vinegar",
        preparation: "10ml per litre water",
        application: "Drinking water weekly"
      }
    ],
    biologicalControls: [],
    culturalControls: [
      "Avoid high protein diets",
      "Ensure adequate drinking water",
      "Reduce stress"
    ],
    businessNote: "Gout causes white deposits in joints. Reduce protein levels."
  },
  {
    name: "Vitamin E / Selenium Deficiency",
    type: "disease",
    pathogenType: "nutritional",
    chemicalControls: [
      {
        productName: "Vitamin E + Selenium supplement",
        activeIngredient: "Vitamin E + Selenium",
        rate: "As per label",
        ratePerFlock: "Add to feed",
        applicationMethod: "Mix in feed",
        timing: "Continuous",
        withdrawalPeriod: "N/A",
        packageSizes: ["100g (Ksh 300)"],
        costPerPackage: 300,
        status: "active",
        mode: "preventive",
        action: "preventive"
      }
    ],
    organicControls: [],
    biologicalControls: [],
    culturalControls: [
      "Use balanced feed",
      "Avoid stale feed (selenium degrades)"
    ],
    businessNote: "Deficiency causes muscular weakness. Supplement is cheap."
  }
];

// ============================================================================
// EXPORT: All poultry diseases combined
// ============================================================================

export const poultryDiseaseMap: Record<string, PoultryPestDisease[]> = {
  "chicken": [
    ...viralDiseases,
    ...bacterialDiseases,
    ...parasiticDiseases,
    ...externalPests,
    ...nutritionalDisorders
  ],
  "turkey": [
    ...viralDiseases.filter(d => d.name !== "Egg Drop Syndrome (EDS-76)" && d.name !== "Marek's Disease"),
    ...bacterialDiseases,
    ...parasiticDiseases,
    ...externalPests,
    ...nutritionalDisorders
  ],
  "duck": [
    ...viralDiseases.filter(d => ["Newcastle Disease (NDV)", "Duck Plague (Duck Enteritis)", "Avian Influenza (HPAI / LPAI)"].includes(d.name)),
    ...bacterialDiseases.filter(d => ["Fowl Cholera (Pasteurellosis)", "Colibacillosis (E. coli)", "Salmonellosis (non-typhoid)"].includes(d.name)),
    ...externalPests,
    ...nutritionalDisorders
  ],
  "goose": [
    ...viralDiseases.filter(d => ["Goose Parvovirus (Derzsy's Disease)", "Avian Influenza (HPAI / LPAI)"].includes(d.name)),
    ...bacterialDiseases.filter(d => ["Fowl Cholera (Pasteurellosis)"].includes(d.name)),
    ...externalPests
  ],
  "quail": [
    ...viralDiseases.filter(d => ["Newcastle Disease (NDV)", "Fowl Pox", "Avian Encephalomyelitis (AE)"].includes(d.name)),
    ...bacterialDiseases.filter(d => ["Fowl Cholera (Pasteurellosis)", "Ulcerative Enteritis"].includes(d.name)),
    ...externalPests
  ]
};

// Helper function to get diseases for a specific poultry species
export function getPoultryDiseaseOptions(species: string = "chicken"): string[] {
  const lowerSpecies = species.toLowerCase();
  const diseases = poultryDiseaseMap[lowerSpecies] || poultryDiseaseMap["chicken"];
  return diseases
    .filter(d => d.type === "disease")
    .map(d => d.name);
}

// Helper function to get pests for a specific poultry species
export function getPoultryPestOptions(species: string = "chicken"): string[] {
  const lowerSpecies = species.toLowerCase();
  const pests = poultryDiseaseMap[lowerSpecies] || poultryDiseaseMap["chicken"];
  return pests
    .filter(d => d.type === "pest")
    .map(d => d.name);
}

// Helper function to get all options (diseases + pests) for a species
export function getPoultryAllOptions(species: string = "chicken"): string[] {
  const lowerSpecies = species.toLowerCase();
  const items = poultryDiseaseMap[lowerSpecies] || poultryDiseaseMap["chicken"];
  return items.map(d => d.name);
}

// Helper to get a specific disease by name
export function getPoultryDiseaseByName(name: string, species: string = "chicken"): PoultryPestDisease | undefined {
  const lowerSpecies = species.toLowerCase();
  const items = poultryDiseaseMap[lowerSpecies] || poultryDiseaseMap["chicken"];
  return items.find(d => d.name.toLowerCase() === name.toLowerCase());
}