// lib/data/dairyHealthMapping.ts
// EXHAUSTIVE DAIRY PEST AND DISEASE DATABASE – FULL VERSION
// Each disease has pathogenType ("bacterial" / "viral" / "parasitic" / "metabolic" / "fungal" / "protozoal" / "physical")
// Each pest has feedingType ("external" / "internal" / "intestinal" / "respiratory" / "subcutaneous")
// Each chemical control has mode ("systemic" / "contact" / "both") and action ("preventive" / "curative" / "both")

export interface DairyPestDisease {
  name: string;
  type: "disease" | "pest";
  pathogenType?: "bacterial" | "viral" | "parasitic" | "metabolic" | "fungal" | "protozoal" | "physical";
  feedingType?: "external" | "internal" | "intestinal" | "respiratory" | "subcutaneous";
  symptoms: string[];
  chemicalControls: {
    productName: string;
    activeIngredient: string;
    rate: string;
    applicationMethod: string;
    timing: string;
    safetyInterval?: string;
    packageSizes?: string[];
    costPerPackage?: number;
    status?: "active" | "restricted" | "banned" | "check-locally";
    notes?: string;
    mode: "systemic" | "contact" | "both";
    action: "preventive" | "curative" | "both";
  }[];
  organicControls?: { method: string; preparation: string; application: string }[];
  culturalControls: string[];
  businessNote?: string;
}

export const dairyPestDiseaseMap: Record<string, DairyPestDisease[]> = {
  dairy: [
    // ============================================================
    // BACTERIAL DISEASES
    // ============================================================
    {
      name: "Mastitis",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Swollen, hot, painful udder",
        "Milk appears watery, clotted, or with flakes",
        "Reduced milk yield",
        "Cow is feverish and off-feed",
        "Milk may contain blood or pus"
      ],
      chemicalControls: [
        {
          productName: "Intramammary antibiotics (e.g., penicillin, cloxacillin)",
          activeIngredient: "Benzylpenicillin, Cloxacillin",
          rate: "One syringe per infected quarter",
          applicationMethod: "Intramammary infusion after milking",
          timing: "At first signs of mastitis, repeat after 12 hours if needed",
          safetyInterval: "48 hours (milk withdrawal)",
          packageSizes: ["20 syringes (Ksh 2,500)"],
          costPerPackage: 2500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Oxytetracycline injection",
          activeIngredient: "Oxytetracycline",
          rate: "10 mg/kg body weight",
          applicationMethod: "Intramuscular or intravenous",
          timing: "At first signs",
          safetyInterval: "14 days (milk), 21 days (meat)",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Tea tree oil", preparation: "Dilute 5ml in 100ml coconut oil", application: "Massage into udder twice daily" },
        { method: "Aloe vera gel", preparation: "Fresh gel", application: "Apply to swollen quarters" }
      ],
      culturalControls: [
        "Ensure clean milking environment",
        "Use pre-milking teat dips (iodine, chlorhexidine)",
        "Dry cow therapy at drying off",
        "Cull chronic cows",
        "Maintain good udder hygiene"
      ],
      businessNote: "Mastitis costs Ksh 10,000 per cow per year in lost milk and treatment. Prevention is cheaper than cure."
    },
    {
      name: "Foot Rot (Fusobacterium necrophorum)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Lameness, severe pain",
        "Swelling between the claws",
        "Necrotic, foul-smelling tissue",
        "Reluctance to walk or stand",
        "Reduced feed intake and milk yield"
      ],
      chemicalControls: [
        {
          productName: "Oxytetracycline spray or footbath",
          activeIngredient: "Oxytetracycline",
          rate: "1g/L in footbath or spray directly",
          applicationMethod: "Footbath or topical spray",
          timing: "At first signs, repeat daily for 3-5 days",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Zinc sulfate footbath",
          activeIngredient: "Zinc sulfate",
          rate: "5% solution",
          applicationMethod: "Footbath daily for 5 days",
          timing: "Early stage",
          safetyInterval: "N/A",
          packageSizes: ["5kg (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Copper sulfate footbath", preparation: "5% solution", application: "Footbath weekly" },
        { method: "Wood ash", preparation: "Dry ash", application: "Sprinkle in dry areas" }
      ],
      culturalControls: [
        "Keep feet clean and dry",
        "Regular hoof trimming",
        "Avoid wet, muddy areas",
        "Footbath at entry to milking parlour",
        "Provide dry standing areas"
      ],
      businessNote: "Lameness costs Ksh 5,000 per cow per year. A Ksh 500 footbath saves Ksh 10,000 in lost milk and treatment."
    },
    {
      name: "Johne's Disease (Paratuberculosis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Chronic diarrhoea (not responsive to deworming)",
        "Weight loss despite good appetite",
        "Reduced milk production",
        "Rough coat, bottle jaw (intermandibular oedema)",
        "Emaciation, eventually death"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull affected cows",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Test replacement stock (ELISA or PCR)",
        "Cull positive cows",
        "Maintain strict hygiene in calving area",
        "Prevent calves from contact with adult faeces",
        "Consider vaccination in high-risk herds"
      ],
      businessNote: "Johne's causes chronic production losses. A Ksh 500 test per cow saves Ksh 30,000 in long-term losses."
    },
    {
      name: "Leptospirosis",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Sudden fever, anorexia",
        "Reduced milk production (up to 50%)",
        "Jaundice (yellowish mucous membranes)",
        "Bloody milk (red milk)",
        "Abortion in pregnant cows"
      ],
      chemicalControls: [
        {
          productName: "Penicillin/Streptomycin injection",
          activeIngredient: "Penicillin G + Dihydrostreptomycin",
          rate: "20,000 IU/kg Penicillin + 5mg/kg Streptomycin",
          applicationMethod: "Intramuscular",
          timing: "Early stage",
          safetyInterval: "14 days (milk), 28 days (meat)",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate annually against Leptospirosis",
        "Control rodents (vectors)",
        "Avoid contact with water contaminated by urine",
        "Quarantine new animals"
      ],
      businessNote: "Leptospirosis causes abortion and milk drop. Vaccination costs Ksh 500/cow/year – saves Ksh 20,000 in losses."
    },
    {
      name: "Brucellosis (Contagious Abortion)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Abortion (usually 5-7 months of gestation)",
        "Retained placenta",
        "Reduced milk yield",
        "Swollen joints (in bulls)",
        "Orchitis (testicular inflammation in bulls)"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull infected animals",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate heifers with S19 vaccine (4-8 months of age)",
        "Test all animals annually (Rose Bengal test)",
        "Cull positive animals",
        "Strict biosecurity – quarantine new stock",
        "Do not buy from unknown source"
      ],
      businessNote: "Brucellosis is zoonotic – it also causes undulant fever in humans. Culling costs Ksh 50,000 per cow but prevents spread."
    },
    {
      name: "Bovine Respiratory Disease (Pneumonia)",
      type: "disease",
      pathogenType: "bacterial/viral",
      symptoms: [
        "Coughing, nasal discharge",
        "Fever (40-41°C)",
        "Rapid breathing, laboured",
        "Loss of appetite, weight loss",
        "Reduced milk yield"
      ],
      chemicalControls: [
        {
          productName: "Tulathromycin (Draxxin)",
          activeIngredient: "Tulathromycin",
          rate: "2.5mg/kg body weight",
          applicationMethod: "Subcutaneous injection",
          timing: "At first signs",
          safetyInterval: "14 days (meat), 48 hours (milk)",
          packageSizes: ["50ml (Ksh 3,500)"],
          costPerPackage: 3500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Oxytetracycline",
          activeIngredient: "Oxytetracycline",
          rate: "10mg/kg body weight",
          applicationMethod: "Intramuscular",
          timing: "Early signs",
          safetyInterval: "14 days (milk), 21 days (meat)",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Provide good ventilation in housing",
        "Avoid overcrowding",
        "Reduce stress (transport, dehorning, etc.)",
        "Vaccinate against respiratory viruses",
        "Separate sick cows"
      ],
      businessNote: "Pneumonia reduces milk yield by 30-50% and can be fatal. A Ksh 3,500 treatment saves Ksh 10,000 in lost production."
    },
    {
      name: "Pink Eye (Infectious Bovine Keratoconjunctivitis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Excessive tear production (epiphora)",
        "Red, swollen conjunctiva",
        "Cloudy cornea (ulceration)",
        "Squinting, photophobia",
        "Reduced grazing and weight loss"
      ],
      chemicalControls: [
        {
          productName: "Oxytetracycline spray",
          activeIngredient: "Oxytetracycline",
          rate: "Spray directly on eye",
          applicationMethod: "Topical spray",
          timing: "At first signs, repeat daily",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Procaine penicillin injection (subconjunctival)",
          activeIngredient: "Procaine penicillin",
          rate: "0.5ml per eye",
          applicationMethod: "Subconjunctival injection by vet",
          timing: "Severe cases",
          safetyInterval: "7 days (milk)",
          packageSizes: ["10ml (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Aloe vera gel", preparation: "Fresh gel", application: "Apply to eye twice daily" }
      ],
      culturalControls: [
        "Control flies (vectors)",
        "Provide shade (reduce UV damage)",
        "Trim long grass (reduce trauma)",
        "Isolate affected cows",
        "Vaccinate against Moraxella bovis in endemic areas"
      ],
      businessNote: "Pink eye reduces weight gain and milk yield. Treatment costs Ksh 600 – saves Ksh 2,000 in lost production."
    },
    {
      name: "Wooden Tongue (Actinobacillosis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Hard, swollen tongue (wooden texture)",
        "Excessive drooling",
        "Difficulty eating and drinking",
        "Weight loss",
        "Swollen lymph nodes under the jaw"
      ],
      chemicalControls: [
        {
          productName: "Sodium iodide IV",
          activeIngredient: "Sodium iodide",
          rate: "30-60ml of 20% solution per cow",
          applicationMethod: "Slow intravenous injection",
          timing: "At first signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["250ml (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Streptomycin injection",
          activeIngredient: "Streptomycin",
          rate: "10mg/kg",
          applicationMethod: "Intramuscular",
          timing: "Early stage",
          safetyInterval: "21 days (milk)",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Provide soft feeds (avoid harsh, fibrous feeds)",
        "Ensure good oral hygiene",
        "Avoid injury to mouth from sharp objects"
      ],
      businessNote: "Wooden tongue causes severe weight loss. Early treatment with iodine is effective."
    },
    {
      name: "Lumpy Jaw (Actinomycosis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Hard, painless swelling on the lower jaw",
        "Loose teeth",
        "Difficulty eating",
        "Weight loss",
        "Foul-smelling discharge from the swelling"
      ],
      chemicalControls: [
        {
          productName: "Sodium iodide IV",
          activeIngredient: "Sodium iodide",
          rate: "30-60ml of 20% solution per cow",
          applicationMethod: "Slow intravenous",
          timing: "Early stage",
          safetyInterval: "14 days (milk)",
          packageSizes: ["250ml (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Penicillin injection",
          activeIngredient: "Penicillin G",
          rate: "20,000 IU/kg",
          applicationMethod: "Intramuscular",
          timing: "Early stage",
          safetyInterval: "7 days (milk)",
          packageSizes: ["100ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Avoid feeding rough, unpalatable fibrous materials",
        "Remove sharp objects from feed",
        "Good dental hygiene"
      ],
      businessNote: "Lumpy jaw causes permanent damage and reduced productivity. Early treatment prevents culling."
    },
    {
      name: "Salmonellosis",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Acute diarrhoea (often bloody)",
        "High fever (40-42°C)",
        "Loss of appetite, depression",
        "Abortion (in pregnant cows)",
        "Sudden death in severe cases"
      ],
      chemicalControls: [
        {
          productName: "Enrofloxacin injection",
          activeIngredient: "Enrofloxacin",
          rate: "5mg/kg",
          applicationMethod: "Intramuscular",
          timing: "At first signs",
          safetyInterval: "14 days (milk), 28 days (meat)",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Trimethoprim-sulfa",
          activeIngredient: "Trimethoprim + Sulphadiazine",
          rate: "10mg/kg of each",
          applicationMethod: "Intravenous",
          timing: "Early signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Maintain strict hygiene",
        "Avoid overcrowding",
        "Separate sick cows",
        "Disinfect housing regularly"
      ],
      businessNote: "Salmonellosis is zoonotic. Good hygiene prevents outbreaks – saves Ksh 20,000 per herd."
    },
    {
      name: "Anthrax",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Sudden death (often within 24 hours)",
        "Unclotted blood from nose, mouth, anus",
        "Bloated carcass",
        "Fever, trembling",
        "Laboured breathing"
      ],
      chemicalControls: [
        {
          productName: "No effective treatment – immediate culling and reporting to vet",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon suspicion",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate annually in endemic areas",
        "Do not open carcasses (spores spread)",
        "Burn or bury affected animals deep",
        "Report to authorities immediately"
      ],
      businessNote: "Anthrax is highly fatal and zoonotic. Vaccination costs Ksh 200/cow – saves Ksh 50,000+ per outbreak."
    },
    {
      name: "Blackleg (Clostridial Myositis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Sudden lameness",
        "Swollen, crepitant muscle (gas under skin)",
        "Fever, loss of appetite",
        "Rapid breathing",
        "Death within 24-48 hours"
      ],
      chemicalControls: [
        {
          productName: "Penicillin injection",
          activeIngredient: "Penicillin G",
          rate: "20,000 IU/kg",
          applicationMethod: "Intravenous or intramuscular",
          timing: "At first signs",
          safetyInterval: "14 days (milk), 21 days (meat)",
          packageSizes: ["100ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Oxytetracycline",
          activeIngredient: "Oxytetracycline",
          rate: "10mg/kg",
          applicationMethod: "Intravenous",
          timing: "Early signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate with 7‑way clostridial vaccine",
        "Avoid wounds and bruises",
        "Carcass disposal: burn or bury deep"
      ],
      businessNote: "Blackleg has high mortality. Vaccination costs Ksh 500/cow – prevents Ksh 30,000 loss."
    },
    {
      name: "Tetanus (Lockjaw)",
      type: "disease",
      pathogenType: "bacterial (toxin)",
      symptoms: [
        "Muscle stiffness and rigidity",
        "Locked jaw (trismus)",
        "Sensitivity to noise, light, touch",
        "Prolapsed third eyelid",
        "Difficulty breathing, bloat"
      ],
      chemicalControls: [
        {
          productName: "Tetanus antitoxin (ATS)",
          activeIngredient: "Antibodies",
          rate: "10,000-20,000 IU per cow",
          applicationMethod: "Subcutaneous injection",
          timing: "At first signs",
          safetyInterval: "N/A",
          packageSizes: ["1 dose (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Penicillin",
          activeIngredient: "Penicillin G",
          rate: "20,000 IU/kg",
          applicationMethod: "Intravenous",
          timing: "At first signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate annually (tetanus toxoid)",
        "Maintain good hygiene around wounds",
        "Castration and dehorning should be clean and wound care provided"
      ],
      businessNote: "Tetanus is often fatal. Prevention through vaccination costs Ksh 300/cow/year – saves Ksh 20,000."
    },

    // ============================================================
    // VIRAL DISEASES
    // ============================================================
    {
      name: "Foot and Mouth Disease (FMD)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Fever (40-41°C)",
        "Salivation, drooling",
        "Blisters (vesicles) on tongue, gums, lips, and feet",
        "Lameness",
        "Drop in milk production",
        "Abortion in pregnant cows"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care",
          activeIngredient: "Antibiotics + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water or feed",
          timing: "During outbreak",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate every 6 months (polyvalent vaccine)",
        "Quarantine new animals for 14 days",
        "Strict biosecurity (footbaths, limit visitors)",
        "Report to veterinary authorities immediately",
        "Cull severely affected animals"
      ],
      businessNote: "FMD causes huge production losses and trade bans. Vaccination costs Ksh 500/cow/year – saves Ksh 50,000 in losses."
    },
    {
      name: "Lumpy Skin Disease (LSD)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Fever, loss of appetite",
        "Skin nodules (lumps) up to 5cm diameter",
        "Swollen lymph nodes",
        "Reduced milk yield",
        "Weight loss"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care (antipyretics, antibiotics for secondary infection)",
          activeIngredient: "NSAIDs + antibiotics",
          rate: "As per label",
          applicationMethod: "Injection or feed",
          timing: "At first signs",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate annually (LSD vaccine)",
        "Control flies (vectors)",
        "Quarantine new animals",
        "Treat wounds promptly"
      ],
      businessNote: "LSD reduces milk and meat production. Vaccination costs Ksh 400/cow – saves Ksh 15,000."
    },
    {
      name: "Bovine Viral Diarrhoea (BVD)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Diarrhoea (often bloody)",
        "Fever, depression",
        "Reduced milk yield",
        "Abortion or weak calves",
        "Loss of appetite, weight loss"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care",
          activeIngredient: "Electrolytes + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water or feed",
          timing: "At first signs",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate against BVD",
        "Test and cull persistently infected (PI) animals",
        "Good biosecurity",
        "Quarantine new stock"
      ],
      businessNote: "BVD causes reproductive losses. PI animals shed virus continuously – culling them saves Ksh 30,000/herd."
    },
    {
      name: "Infectious Bovine Rhinotracheitis (IBR)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Red, swollen nose (rhinitis)",
        "Fever, depression",
        "Reduced milk yield",
        "Abortion",
        "Conjunctivitis, corneal ulcers"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care (antibiotics for secondary)",
          activeIngredient: "Antibiotics + anti-inflammatories",
          rate: "As per label",
          applicationMethod: "Injection or feed",
          timing: "At first signs",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Vaccinate against IBR",
        "Good ventilation",
        "Reduce stress",
        "Quarantine new animals"
      ],
      businessNote: "IBR causes respiratory and reproductive losses. Vaccination costs Ksh 300/cow – saves Ksh 10,000."
    },
    {
      name: "Bovine Leukosis (BLV)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Weight loss, inappetence",
        "Enlarged lymph nodes (not painful)",
        "Anaemia, pale mucous membranes",
        "Reduced milk production",
        "Tumours in various organs (post-mortem)"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull affected animals",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Test herd annually (ELISA)",
        "Cull positive animals",
        "Prevent transmission via blood (use clean needles)",
        "Do not use contaminated equipment"
      ],
      businessNote: "BLV is incurable but management reduces spread. Testing costs Ksh 500/cow – saves Ksh 20,000 in long-term losses."
    },

    // ============================================================
    // METABOLIC DISEASES
    // ============================================================
    {
      name: "Milk Fever (Hypocalcemia)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Sudden onset around calving",
        "Recumbent (down), unable to rise",
        "Cold ears, dry nose",
        "Weak pulse, shallow breathing",
        "Constipation"
      ],
      chemicalControls: [
        {
          productName: "Calcium borogluconate 40% IV",
          activeIngredient: "Calcium borogluconate",
          rate: "500ml – 1L per cow",
          applicationMethod: "Slow intravenous injection",
          timing: "Immediately when signs appear",
          safetyInterval: "N/A",
          packageSizes: ["500ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Preventive: feed low-potassium dry cow diet (avoid lucerne, lush grass)",
        "Supplement with magnesium oxide before calving",
        "Provide calcium boluses at calving",
        "Monitor cows closely in the first 24 hours after calving"
      ],
      businessNote: "Milk fever can kill within 12 hours. Early treatment is critical. Preventive strategies cost Ksh 500/cow/year – saves Ksh 15,000 in losses."
    },
    {
      name: "Ketosis (Acetonemia)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Reduced appetite, especially for concentrates",
        "Rapid weight loss",
        "Fruity smell on breath (acetone)",
        "Drop in milk production",
        "Dull, lethargic, stiff gait"
      ],
      chemicalControls: [
        {
          productName: "Propylene glycol oral drench",
          activeIngredient: "Propylene glycol",
          rate: "300ml per cow per day",
          applicationMethod: "Oral drench",
          timing: "For 2-3 days",
          safetyInterval: "N/A",
          packageSizes: ["5L (Ksh 2,500)"],
          costPerPackage: 2500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Dexamethasone injection",
          activeIngredient: "Dexamethasone",
          rate: "5-10mg per cow",
          applicationMethod: "Intramuscular",
          timing: "Single dose",
          safetyInterval: "14 days (milk)",
          packageSizes: ["50ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Molasses + yeast", preparation: "1kg molasses + 50g yeast in 10L water", application: "Provide as a drench daily" }
      ],
      culturalControls: [
        "Preventive: ensure good body condition at dry-off",
        "Feed a balanced ration with adequate energy",
        "Avoid over-conditioning during dry period",
        "Monitor cows in early lactation"
      ],
      businessNote: "Ketosis reduces milk yield by 20-30% and increases calving interval. Prevention costs Ksh 200/cow/year – saves Ksh 10,000 in lost production."
    },
    {
      name: "Bloat (Rumen Tympany)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Distended left side (rumen)",
        "Pain, discomfort",
        "Laboured breathing",
        "Salivation, frequent urination",
        "Cow may collapse and die if untreated"
      ],
      chemicalControls: [
        {
          productName: "Antifrothing agent (e.g., Poloxalene)",
          activeIngredient: "Poloxalene",
          rate: "5-10g per cow in feed or drench",
          applicationMethod: "Oral drench or feed",
          timing: "Immediately when signs appear",
          safetyInterval: "N/A",
          packageSizes: ["1kg (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Mineral oil",
          activeIngredient: "Liquid paraffin",
          rate: "1-2L per cow",
          applicationMethod: "Oral drench",
          timing: "Emergency",
          safetyInterval: "N/A",
          packageSizes: ["5L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Vegetable oil", preparation: "1L oil per cow", application: "Oral drench" },
        { method: "Baking soda (sodium bicarbonate)", preparation: "100g in 5L water", application: "Drench" }
      ],
      culturalControls: [
        "Avoid lush, legume-rich pastures (alfalfa, clover)",
        "Introduce cattle to pasture gradually",
        "Ensure adequate fibre in diet",
        "Provide anti-bloat blocks in grazing areas"
      ],
      businessNote: "Bloat can kill within 1-2 hours. Prevention is key. A single cow lost costs Ksh 50,000+."
    },
    {
      name: "Subclinical Acidosis (SARA)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Reduced feed intake",
        "Milk fat depression (fat % drops)",
        "Loose stools",
        "Weight loss",
        "Lameness (due to laminitis)"
      ],
      chemicalControls: [
        {
          productName: "Sodium bicarbonate (buffer)",
          activeIngredient: "Sodium bicarbonate",
          rate: "0.75-1.5% of total DM intake",
          applicationMethod: "In feed as a TMR top-dress",
          timing: "Long-term",
          safetyInterval: "N/A",
          packageSizes: ["25kg (Ksh 1,800)"],
          costPerPackage: 1800,
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Ensure adequate fibre (NDF > 25%)",
        "Limit non-fibre carbohydrates (starch) to 35-40%",
        "Feed total mixed ration (TMR) not separate concentrates",
        "Avoid sudden feed changes",
        "Monitor pH of rumen fluid (target > 6.0)"
      ],
      businessNote: "SARA reduces milk fat and health. A Ksh 1,800 buffer saves Ksh 15,000 in lost milk and reduced culling."
    },
    {
      name: "Grass Tetany (Hypomagnesemia)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Sudden onset, especially when animals are grazing lush grass",
        "Excitable, nervous",
        "Muscle twitching, staggering",
        "Collapse, paddling, death"
      ],
      chemicalControls: [
        {
          productName: "Magnesium sulphate (Epsom salt) IV",
          activeIngredient: "Magnesium sulphate",
          rate: "250ml of 20% solution",
          applicationMethod: "Slow intravenous injection",
          timing: "Emergency",
          safetyInterval: "N/A",
          packageSizes: ["500ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Calcium/magnesium oral drench",
          activeIngredient: "Calcium + Magnesium",
          rate: "1L per cow",
          applicationMethod: "Oral drench",
          timing: "At first signs",
          safetyInterval: "N/A",
          packageSizes: ["5L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Preventive: provide magnesium oxide in mineral mix",
        "Avoid grazing lush, low-fibre pastures at high risk times",
        "Feed high-fibre hay before turning out",
        "Monitor high-risk cows (older, lactating)"
      ],
      businessNote: "Grass tetany can kill quickly. Prevention with magnesium costs Ksh 200/cow/year – saves Ksh 20,000."
    },
    {
      name: "Downer Cow Syndrome",
      type: "disease",
      pathogenType: "metabolic/neurological",
      symptoms: [
        "Cow is unable to rise (recumbent)",
        "No obvious cause",
        "May be alert or depressed",
        "Secondary muscle damage (if down > 6 hours)",
        "Often follows milk fever or other illness"
      ],
      chemicalControls: [
        {
          productName: "Supportive therapy – treat underlying cause",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Immediately",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Regularly turn recumbent cows (prevent muscle damage)",
        "Provide good bedding (deep straw)",
        "Diagnose and treat underlying cause (milk fever, ketosis, etc.)",
        "Avoid over-conditioning cows pre-calving"
      ],
      businessNote: "Downer cow syndrome leads to culling if not treated quickly. Preventing primary diseases is key."
    },
    {
      name: "Fatty Liver (Hepatic Lipidosis)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Sudden weight loss",
        "Reduced appetite, depression",
        "Reduced milk yield",
        "Liver enlargement (diagnosed post‑mortem)",
        "Often follows high-fat diet or negative energy balance"
      ],
      chemicalControls: [
        {
          productName: "No specific treatment – supportive care",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "N/A",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Prevent over-conditioning in dry period",
        "Ensure gradual weight loss post-calving",
        "Provide a balanced ration (avoid extreme energy deficit)",
        "Monitor body condition score regularly"
      ],
      businessNote: "Fatty liver reduces productivity. Prevention is cheaper than treatment."
    },
    {
      name: "Displaced Abomasum (LDA/RDA)",
      type: "disease",
      pathogenType: "physical/metabolic",
      symptoms: [
        "Reduced appetite, especially for concentrates",
        "Drop in milk production",
        "Ping sound on percussion (left side)",
        "Ketone smell on breath",
        "Faeces may be firm and dark"
      ],
      chemicalControls: [
        {
          productName: "Surgery (abomasopexy) – only effective treatment",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "Surgical repositioning by vet",
          timing: "As soon as diagnosed",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Preventive: feed long fibre (hay) pre-calving",
        "Avoid over-conditioning",
        "Minimize concentrate feeding early lactation",
        "Monitor cows for early signs"
      ],
      businessNote: "Displaced abomasum requires surgery – costs Ksh 5,000 – but saves the cow's life and production."
    },

    // ============================================================
    // REPRODUCTIVE DISEASES
    // ============================================================
    {
      name: "Retained Placenta",
      type: "disease",
      pathogenType: "metabolic/reproductive",
      symptoms: [
        "Fetal membranes not expelled within 12 hours of calving",
        "Foul-smelling vaginal discharge",
        "Fever, depression",
        "Reduced milk yield",
        "May lead to metritis"
      ],
      chemicalControls: [
        {
          productName: "Oxytocin injection",
          activeIngredient: "Oxytocin",
          rate: "10-20 IU per cow",
          applicationMethod: "Intramuscular or intravenous",
          timing: "At 12-24 hours post-calving",
          safetyInterval: "N/A",
          packageSizes: ["100ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Antibiotic intrauterine bolus",
          activeIngredient: "Tetracycline",
          rate: "1 bolus",
          applicationMethod: "Intrauterine",
          timing: "After membrane removal",
          safetyInterval: "14 days (milk)",
          packageSizes: ["5 boluses (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Ensure adequate selenium and vitamin E pre-calving",
        "Provide clean calving area",
        "Avoid over-conditioning",
        "Monitor cows closely post-calving"
      ],
      businessNote: "Retained placenta leads to metritis and reduced fertility. Prevention with mineral supplementation costs Ksh 200/cow – saves Ksh 5,000."
    },
    {
      name: "Dystocia (Calving Difficulty)",
      type: "disease",
      pathogenType: "physical/reproductive",
      symptoms: [
        "Calving does not progress within 2 hours of water bag appearance",
        "Cow is straining without progress",
        "Fetal presentation abnormal (legs back, etc.)",
        "Exhaustion, distress"
      ],
      chemicalControls: [
        {
          productName: "No medicine – veterinary assistance required",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "Obstetrical manipulation or C‑section",
          timing: "Immediate",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Proper heifer development (avoid overfeeding)",
        "Monitor cows in late pregnancy",
        "Have a calving kit ready (lubricants, chains, etc.)",
        "Know when to call the vet"
      ],
      businessNote: "Dystocia can kill cow and calf. Veterinary assistance costs Ksh 3,000 – but saves Ksh 50,000 in potential loss."
    },
    {
      name: "Abortion (non-brucellosis – Neospora, BVDV, etc.)",
      type: "disease",
      pathogenType: "viral/protozoal",
      symptoms: [
        "Abortion at any stage of pregnancy",
        "Often without warning signs",
        "May have retained placenta",
        "Fetus may be autolysed",
        "Reduced future fertility"
      ],
      chemicalControls: [
        {
          productName: "No specific treatment – supportive care",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "N/A",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Test herd for Neospora, BVD, etc.",
        "Cull positive animals",
        "Biosecurity to prevent introduction",
        "Vaccinate against BVD and other reproductive viruses"
      ],
      businessNote: "Abortion costs Ksh 30,000 per incident. Prevention through testing and vaccination is cheaper."
    },
    {
      name: "Vibriosis (Campylobacteriosis)",
      type: "disease",
      pathogenType: "bacterial (reproductive)",
      symptoms: [
        "Infertility, returns to oestrus (repeat breeding)",
        "Early embryonic death",
        "Irregular heat cycles",
        "Abortion (rare)",
        "May have no other clinical signs"
      ],
      chemicalControls: [
        {
          productName: "No specific cure – culling infected animals",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        },
        {
          productName: "Antibiotic treatment (tetracycline) – but not reliable",
          activeIngredient: "Tetracycline",
          rate: "10mg/kg",
          applicationMethod: "In feed or injection",
          timing: "Early signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Use artificial insemination (AI) with clean semen",
        "Quarantine and test new bulls",
        "Maintain good hygiene during AI",
        "Vaccination available (campylobacter vaccine) in some countries"
      ],
      businessNote: "Vibriosis reduces conception rates. AI and hygiene reduce risk – saves Ksh 10,000 per breeding season."
    },
    {
      name: "Trichomoniasis",
      type: "disease",
      pathogenType: "protozoal (reproductive)",
      symptoms: [
        "Infertility, repeat breeding",
        "Early embryonic death",
        "Pyometra (pus in uterus)",
        "Abortion (rare)",
        "Often no systemic signs"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull infected bulls",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          safetyInterval: "N/A",
          packageSizes: [],
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Use AI to avoid transmission from bulls",
        "Test bulls before breeding season",
        "Cull positive bulls",
        "Maintain good hygiene during service"
      ],
      businessNote: "Trichomoniasis causes huge fertility losses. Testing bulls costs Ksh 2,000 – saves Ksh 50,000 in lost calves."
    },

    // ============================================================
    // FUNGAL DISEASES
    // ============================================================
    {
      name: "Ringworm (Dermatophytosis)",
      type: "disease",
      pathogenType: "fungal",
      symptoms: [
        "Round, grey-white scaly patches on skin",
        "Hair loss (alopecia) in lesions",
        "Itching (moderate)",
        "Lesions often on head, neck, and legs",
        "Contagious to humans (zoonotic)"
      ],
      chemicalControls: [
        {
          productName: "Topical antifungal (e.g., miconazole, clotrimazole)",
          activeIngredient: "Miconazole, Clotrimazole",
          rate: "Apply twice daily",
          applicationMethod: "Topical cream or spray",
          timing: "Until lesions heal (2-4 weeks)",
          safetyInterval: "N/A (topical)",
          packageSizes: ["15g tube (Ksh 300)"],
          costPerPackage: 300,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Lime sulfur dip",
          activeIngredient: "Calcium polysulfide",
          rate: "2.5% solution",
          applicationMethod: "Spray or dip",
          timing: "Weekly, 3-4 treatments",
          safetyInterval: "14 days (milk)",
          packageSizes: ["1L (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Vinegar (apple cider)", preparation: "1:1 dilution with water", application: "Apply to lesions daily" },
        { method: "Garlic paste", preparation: "Crushed garlic", application: "Apply to lesions" }
      ],
      culturalControls: [
        "Isolate affected animals",
        "Disinfect equipment",
        "Improve hygiene (clean dry bedding)",
        "Wear gloves when handling lesions (zoonotic)"
      ],
      businessNote: "Ringworm is zoonotic and reduces hide value. Topical treatment costs Ksh 300 – saves Ksh 1,000 in hide damage."
    },

    // ============================================================
    // PESTS – EXTERNAL
    // ============================================================
    {
      name: "Ticks (Rhipicephalus, Boophilus, Amblyomma)",
      type: "pest",
      feedingType: "external",
      symptoms: [
        "Visible ticks attached to skin (especially legs, udder, ears)",
        "Skin irritation, hair loss",
        "Anaemia (pale mucous membranes)",
        "Reduced weight gain and milk yield",
        "Transmission of tick-borne diseases (Ehrlichiosis, Theileriosis, Babesiosis)"
      ],
      chemicalControls: [
        {
          productName: "Cypermethrin pour-on",
          activeIngredient: "Cypermethrin",
          rate: "5ml per 10kg body weight",
          applicationMethod: "Apply along back",
          timing: "Every 2-3 weeks during high tick season",
          safetyInterval: "7 days (milk)",
          packageSizes: ["1L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "contact",
          action: "preventive"
        },
        {
          productName: "Amitraz dip or spray",
          activeIngredient: "Amitraz",
          rate: "0.5% solution",
          applicationMethod: "Spray or dip cattle",
          timing: "Every 3 weeks",
          safetyInterval: "10 days (milk)",
          packageSizes: ["500ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [
        { method: "Neem oil", preparation: "Dilute 10% in water", application: "Spray weekly" },
        { method: "Wood ash", preparation: "Dry ash", application: "Dust on animals" }
      ],
      culturalControls: [
        "Rotate pastures",
        "Maintain short grass (ticks hide in long grass)",
        "Remove vegetation around housing",
        "Use tick-resistant breeds if possible"
      ],
      businessNote: "Ticks cost Ksh 5,000 per cow per year in lost productivity. A Ksh 1,500 pour-on saves Ksh 10,000 in control and treatment."
    },
    {
      name: "Flies (Stable flies, Horn flies, Face flies)",
      type: "pest",
      feedingType: "external",
      symptoms: [
        "Visible flies swarming around the animal",
        "Skin irritation, restlessness",
        "Reduced grazing time (flies cause stress)",
        "Weight loss and reduced milk yield",
        "Spread of diseases (e.g., Eye infections, Summer mastitis)"
      ],
      chemicalControls: [
        {
          productName: "Permethrin pour-on or spray",
          activeIngredient: "Permethrin",
          rate: "5ml per 10kg body weight (pour-on)",
          applicationMethod: "Apply along back or spray",
          timing: "Weekly during fly season",
          safetyInterval: "7 days (milk)",
          packageSizes: ["1L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "contact",
          action: "preventive"
        },
        {
          productName: "Fly tags (ear tags with insecticide)",
          activeIngredient: "Pyrethroids (e.g., Cyfluthrin)",
          rate: "One tag per animal",
          applicationMethod: "Attach to ear",
          timing: "At start of fly season",
          safetyInterval: "N/A",
          packageSizes: ["50 tags (Ksh 2,500)"],
          costPerPackage: 2500,
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [
        { method: "Citronella oil spray", preparation: "Dilute 10% in water", application: "Spray daily" },
        { method: "Fly traps", preparation: "Baited with attractant", application: "Place around housing" }
      ],
      culturalControls: [
        "Remove manure regularly (flies breed in dung)",
        "Keep feed and water clean",
        "Provide shade (flies prefer hot, sunny areas)",
        "Use biological control (parasitoid wasps) to target pupae"
      ],
      businessNote: "Flies cost Ksh 3,000 per cow per year through reduced milk production. A Ksh 1,500 pour-on saves Ksh 6,000."
    },
    {
      name: "Mange Mites (Chorioptes, Sarcoptes, Psoroptes)",
      type: "pest",
      feedingType: "external",
      symptoms: [
        "Intense itching, restlessness",
        "Skin lesions, crusts, hair loss",
        "Thickened, wrinkled skin",
        "Weight loss, reduced milk yield",
        "Lesions often start on the tail, legs, or head"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin injection",
          activeIngredient: "Ivermectin",
          rate: "0.2mg/kg body weight",
          applicationMethod: "Subcutaneous",
          timing: "Twice, 10-14 days apart",
          safetyInterval: "21 days (milk), 35 days (meat)",
          packageSizes: ["50ml (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Sulfur lime dip (lime sulfur)",
          activeIngredient: "Calcium polysulfide",
          rate: "2.5% solution",
          applicationMethod: "Spray or dip",
          timing: "Weekly, 3-4 treatments",
          safetyInterval: "14 days (milk)",
          packageSizes: ["1L (Ksh 1,000)"],
          costPerPackage: 1000,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Neem oil", preparation: "10% solution", application: "Spray affected areas" },
        { method: "Garlic oil", preparation: "Dilute with carrier oil", application: "Rub onto lesions" }
      ],
      culturalControls: [
        "Quarantine new animals",
        "Clean housing and equipment",
        "Provide good nutrition to improve skin health",
        "Treat all animals in the group"
      ],
      businessNote: "Mange reduces growth and milk production. A Ksh 1,500 treatment saves Ksh 5,000 in losses."
    },
    {
      name: "Lice (Haematopinus, Linognathus, Bovicola)",
      type: "pest",
      feedingType: "external",
      symptoms: [
        "Visible lice (small, moving insects) on skin",
        "Intense itching, rubbing against objects",
        "Hair loss, scruffy coat",
        "Anaemia (sucking lice)",
        "Reduced weight gain and milk yield"
      ],
      chemicalControls: [
        {
          productName: "Permethrin pour-on",
          activeIngredient: "Permethrin",
          rate: "5ml per 10kg body weight",
          applicationMethod: "Apply along back",
          timing: "Once, repeat after 10 days if needed",
          safetyInterval: "7 days (milk)",
          packageSizes: ["1L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Ivermectin pour-on",
          activeIngredient: "Ivermectin",
          rate: "0.5mg/kg (pour-on)",
          applicationMethod: "Apply along back",
          timing: "Once, repeat after 14 days",
          safetyInterval: "21 days (milk)",
          packageSizes: ["500ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Wood ash", preparation: "Dry ash", application: "Dust on animals" },
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust on animals" }
      ],
      culturalControls: [
        "Good hygiene and clean housing",
        "Isolate infected animals",
        "Maintain good nutrition",
        "Treat all animals in the group"
      ],
      businessNote: "Lice reduce productivity. A Ksh 1,500 pour-on saves Ksh 3,000 in lost growth."
    },
    {
      name: "Cattle Grubs (Hypoderma – Warble flies)",
      type: "pest",
      feedingType: "subcutaneous",
      symptoms: [
        "Visible lumps under the skin (often along the back)",
        "Swollen, painful lumps (may have breathing hole)",
        "Restlessness, reduced grazing",
        "Weight loss",
        "Milk yield reduction"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin pour-on",
          activeIngredient: "Ivermectin",
          rate: "0.5mg/kg (pour-on)",
          applicationMethod: "Apply along back",
          timing: "After fly season (when grubs are in skin)",
          safetyInterval: "35 days (meat), 21 days (milk)",
          packageSizes: ["500ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Maintain good hygiene",
        "Monitor cattle for grubs",
        "Treat after fly season to avoid shock"
      ],
      businessNote: "Warble flies reduce hide quality and growth. Treatment with ivermectin is effective."
    },

    // ============================================================
    // PESTS – INTERNAL (Gastrointestinal & Respiratory)
    // ============================================================
    {
      name: "Roundworms (Haemonchus, Ostertagia, Trichostrongylus, Cooperia)",
      type: "pest",
      feedingType: "internal",
      symptoms: [
        "Diarrhoea (sometimes black, tarry)",
        "Weight loss",
        "Anaemia (pale mucous membranes)",
        "Rough coat",
        "Reduced milk yield",
        "Bottle jaw (submandibular oedema) – especially in Haemonchus"
      ],
      chemicalControls: [
        {
          productName: "Albendazole oral drench",
          activeIngredient: "Albendazole",
          rate: "10mg/kg body weight",
          applicationMethod: "Oral drench",
          timing: "At turnout and again in autumn (twice yearly)",
          safetyInterval: "14 days (milk), 28 days (meat)",
          packageSizes: ["1L (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Ivermectin injection or pour-on",
          activeIngredient: "Ivermectin",
          rate: "0.2mg/kg (inject) or 0.5mg/kg (pour-on)",
          applicationMethod: "Subcutaneous injection or pour-on",
          timing: "Twice yearly",
          safetyInterval: "21 days (milk), 35 days (meat)",
          packageSizes: ["50ml (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [
        { method: "Nematophagous fungi (Duddingtonia flagrans)", description: "Feed spores to reduce infective larvae in dung." }
      ],
      culturalControls: [
        "Rotate pastures with sheep or horses",
        "Deworm at strategic times (e.g., before calving)",
        "Avoid overgrazing",
        "Maintain good nutrition to improve resistance"
      ],
      businessNote: "Worm infestations cost Ksh 2,000 per cow per year. A Ksh 1,200 drench saves Ksh 5,000 in lost production."
    },
    {
      name: "Liver Fluke (Fasciola hepatica)",
      type: "pest",
      feedingType: "internal",
      symptoms: [
        "Chronic weight loss",
        "Anaemia, pale mucous membranes",
        "Diarrhoea (intermittent)",
        "Reduced milk yield",
        "Submandibular oedema (bottle jaw)"
      ],
      chemicalControls: [
        {
          productName: "Triclabendazole (Fasinex)",
          activeIngredient: "Triclabendazole",
          rate: "12mg/kg body weight",
          applicationMethod: "Oral drench",
          timing: "After first frost (to kill adult fluke)",
          safetyInterval: "28 days (milk), 56 days (meat)",
          packageSizes: ["1L (Ksh 2,000)"],
          costPerPackage: 2000,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Drain wet pastures",
        "Avoid grazing wet areas (where snails, intermediate host, live)",
        "Fence off watercourses",
        "Apply copper sulfate to kill snails"
      ],
      businessNote: "Liver fluke can reduce milk yield by 20-30%. A Ksh 2,000 drench saves Ksh 8,000 in lost production."
    },
    {
      name: "Lungworms (Dictyocaulus viviparus)",
      type: "pest",
      feedingType: "respiratory",
      symptoms: [
        "Cough (especially when moving)",
        "Laboured breathing",
        "Nasal discharge",
        "Reduced feed intake, weight loss",
        "Reduced milk yield"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin pour-on",
          activeIngredient: "Ivermectin",
          rate: "0.5mg/kg",
          applicationMethod: "Pour-on",
          timing: "When cough appears",
          safetyInterval: "21 days (milk), 35 days (meat)",
          packageSizes: ["500ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Fenbendazole",
          activeIngredient: "Fenbendazole",
          rate: "7.5mg/kg",
          applicationMethod: "Oral drench",
          timing: "At first signs",
          safetyInterval: "14 days (milk), 28 days (meat)",
          packageSizes: ["1L (Ksh 1,000)"],
          costPerPackage: 1000,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Grazing management (avoid overstocking)",
        "Vaccinate against lungworm (if available)",
        "Rotate pastures",
        "Treat and move to clean pasture"
      ],
      businessNote: "Lungworms cause chronic respiratory disease. Early treatment with ivermectin saves Ksh 4,000 in lost production."
    },
    {
      name: "Coccidia (Eimeria spp.)",
      type: "pest",
      feedingType: "intestinal",
      symptoms: [
        "Diarrhoea (sometimes bloody)",
        "Weight loss, stunted growth",
        "Loss of appetite, depression",
        "Reduced milk yield",
        "Rough coat, dehydration"
      ],
      chemicalControls: [
        {
          productName: "Sulphaquinoxaline oral drench",
          activeIngredient: "Sulphaquinoxaline",
          rate: "10mg/kg",
          applicationMethod: "Oral drench",
          timing: "At first signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Amprolium oral drench",
          activeIngredient: "Amprolium",
          rate: "5mg/kg",
          applicationMethod: "Oral drench",
          timing: "At first signs",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100g (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Maintain dry, clean bedding",
        "Avoid overcrowding",
        "Regularly clean water troughs",
        "Rotate pastures"
      ],
      businessNote: "Coccidiosis causes production losses. Prevention through hygiene costs Ksh 100/cow – saves Ksh 3,000."
    },
    {
      name: "Tapeworms (Moniezia)",
      type: "pest",
      feedingType: "internal",
      symptoms: [
        "Weight loss, poor growth",
        "Diarrhoea (intermittent)",
        "Visible segments in faeces (rice‑like)",
        "Colic, restlessness",
        "Reduced milk yield"
      ],
      chemicalControls: [
        {
          productName: "Praziquantel oral drench",
          activeIngredient: "Praziquantel",
          rate: "5mg/kg",
          applicationMethod: "Oral drench",
          timing: "When segments are seen",
          safetyInterval: "14 days (milk)",
          packageSizes: ["100ml (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Pumpkin seeds", preparation: "Crush and mix with feed", application: "100g per cow daily" }
      ],
      culturalControls: [
        "Control intermediate hosts (oribatid mites in pasture)",
        "Rotate pastures",
        "Avoid overgrazing"
      ],
      businessNote: "Tapeworms reduce growth in young stock. A Ksh 600 treatment saves Ksh 2,000 in lost growth."
    },
    {
      name: "Rumen Fluke (Paramphistomum)",
      type: "pest",
      feedingType: "internal",
      symptoms: [
        "Chronic diarrhoea",
        "Weight loss",
        "Reduced milk yield",
        "Anaemia (pale mucous membranes)",
        "Submandibular oedema"
      ],
      chemicalControls: [
        {
          productName: "Oxyclozanide oral drench",
          activeIngredient: "Oxyclozanide",
          rate: "15mg/kg",
          applicationMethod: "Oral drench",
          timing: "When fluke eggs are found in faeces",
          safetyInterval: "28 days (milk)",
          packageSizes: ["1L (Ksh 1,500)"],
          costPerPackage: 1500,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      culturalControls: [
        "Drain wet pastures",
        "Avoid grazing near snail habitats",
        "Rotate pasture",
        "Fence off water sources"
      ],
      businessNote: "Rumen fluke causes production losses. Treatment costs Ksh 1,500 – saves Ksh 3,000 in lost production."
    }
  ]
};