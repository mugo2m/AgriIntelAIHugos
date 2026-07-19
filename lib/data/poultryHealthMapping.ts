// lib/data/poultryHealthMapping.ts
// EXHAUSTIVE POULTRY PEST AND DISEASE DATABASE – COMPLETE VERSION with SYMPTOMS/SIGNS
// Each pest has feedingType ("chewing" / "sucking") and signs (visible indicators)
// Each disease has pathogenType and symptoms (observable signs)
// Each chemical control has mode ("systemic" / "contact" / "both") and action ("preventive" / "curative" / "both")

export interface PoultryPestDisease {
  name: string;
  type: "pest" | "disease";
  feedingType?: "chewing" | "sucking";
  pathogenType?: "bacterial" | "fungal" | "viral" | "protozoa" | "parasitic" | "metabolic" | "toxic";
  symptoms?: string[];        // for diseases – observable clinical signs
  signs?: string[];           // for pests – visible indicators
  chemicalControls: {
    productName: string;
    activeIngredient: string;
    rate: string;
    ratePerAcre?: string;
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
  biologicalControls?: { method: string; description: string }[];
  culturalControls: string[];
  businessNote?: string;
}

export const poultryPestDiseaseMap: Record<string, PoultryPestDisease[]> = {
  poultry: [
    // ============================================================
    // PESTS (15) – each with 'signs' array
    // ============================================================
    {
      name: "Red mite (Dermanyssus gallinae)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Visible mites on perches (clusters of red/black dots)",
        "Anaemia / pale comb and wattles",
        "Feather loss and ruffled appearance",
        "Drop in egg production (15–20%)",
        "Birds restless, scratching excessively"
      ],
      chemicalControls: [
        {
          productName: "Permethrin 10%",
          activeIngredient: "Permethrin",
          rate: "5ml per 2L water",
          applicationMethod: "Spray house, perches, and birds",
          timing: "Evening (when mites are active)",
          safetyInterval: "7 days",
          packageSizes: ["250ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Malathion 5% dust",
          activeIngredient: "Malathion",
          rate: "Dust lightly on birds",
          applicationMethod: "Dust nest boxes and birds",
          timing: "After cleaning house",
          safetyInterval: "14 days",
          packageSizes: ["500g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust nest boxes and perches weekly" },
        { method: "Wood ash", preparation: "Fine ash", application: "Dust birds and litter" }
      ],
      biologicalControls: [
        { method: "Predatory mites (Androlaelaps casalis)", description: "Introduce into litter to control red mite populations." }
      ],
      culturalControls: [
        "Clean houses between batches",
        "Seal cracks and crevices in walls",
        "Use smooth perches to prevent hiding",
        "Regularly change litter"
      ],
      businessNote: "Red mites cause anaemia and 15–20% egg drop. A Ksh 500 spray saves Ksh 5,000 in lost eggs."
    },
    {
      name: "Poultry louse (Menacanthus stramineus)",
      type: "pest",
      feedingType: "chewing",
      signs: [
        "Visible lice (small, fast‑moving insects) on skin and feathers",
        "Feather damage – broken, ruffled, or missing",
        "Skin irritation – birds constantly preening and scratching",
        "Restlessness and reduced feed intake",
        "Anaemia in heavy infestations"
      ],
      chemicalControls: [
        {
          productName: "Carbaryl 5% dust",
          activeIngredient: "Carbaryl",
          rate: "Apply dust to vent and under wings",
          applicationMethod: "Dust application",
          timing: "After cleaning house",
          safetyInterval: "14 days",
          packageSizes: ["500g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Wood ash + sand", preparation: "Mix equal parts", application: "Provide dust baths weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Provide dry dust baths",
        "Avoid overcrowding",
        "Clean litter regularly"
      ],
      businessNote: "Lice cause restlessness, feather loss, and reduced feed efficiency. Ash baths are FREE!"
    },
    {
      name: "Roundworm (Ascaridia galli)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Weight loss despite normal appetite",
        "Reduced growth and feed conversion",
        "Diarrhoea and pasty vents",
        "Visible worms in droppings (long, white/cream)",
        "Anaemia and pale combs"
      ],
      chemicalControls: [
        {
          productName: "Piperazine citrate",
          activeIngredient: "Piperazine",
          rate: "1g per 1L drinking water",
          applicationMethod: "Add to drinking water for 24 hours",
          timing: "After 6 weeks of age",
          safetyInterval: "7 days",
          packageSizes: ["100g (Ksh 300)"],
          costPerPackage: 300,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Levamisole hydrochloride",
          activeIngredient: "Levamisole",
          rate: "0.2mg per bird (oral)",
          applicationMethod: "Oral drench or feed",
          timing: "After 8 weeks",
          safetyInterval: "14 days",
          packageSizes: ["100ml (Ksh 450)"],
          costPerPackage: 450,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Garlic + pumpkin seeds", preparation: "Crush 100g seeds per 10 birds", application: "Mix into feed" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Deworm every 3 months",
        "Keep litter completely dry",
        "Rotate pasture if free‑ranging"
      ],
      businessNote: "Heavy roundworm load reduces weight gain by 20–40%. A Ksh 300 dewormer saves Ksh 3,000 in growth."
    },
    {
      name: "Tapeworm (Raillietina spp.)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Weight loss and poor condition",
        "Diarrhoea with mucus",
        "Visible segments in droppings (rice‑like)",
        "Reduced egg production",
        "Increased thirst"
      ],
      chemicalControls: [
        {
          productName: "Praziquantel",
          activeIngredient: "Praziquantel",
          rate: "10mg per kg body weight",
          applicationMethod: "In feed or directly into beak",
          timing: "When beetles present",
          safetyInterval: "14 days",
          packageSizes: ["50g (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Frequent litter change", preparation: "Remove wet litter daily", application: "Break lifecycle by removing beetles" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Control intermediate hosts (beetles, flies)",
        "Keep feed off the ground",
        "Clean feeders regularly"
      ],
      businessNote: "Tapeworms cause poor growth and reduced egg production. Prevent beetles to break lifecycle."
    },
    {
      name: "Scaly leg mite (Knemidocoptes mutans)",
      type: "pest",
      feedingType: "chewing",
      signs: [
        "Lifting of leg scales (rough, crusty appearance)",
        "Thickening of legs and feet",
        "Lameness and reluctance to walk",
        "Deformed toes (in severe cases)",
        "Legs appear whitish/grey"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin 1%",
          activeIngredient: "Ivermectin",
          rate: "0.2mg per kg body weight",
          applicationMethod: "Oral or topical",
          timing: "When scales lift",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "White oil + Sulfur",
          activeIngredient: "Sulfur",
          rate: "Dab on legs",
          applicationMethod: "Brush on affected legs",
          timing: "Weekly until healed",
          packageSizes: ["Ready‑to‑use (Ksh 250)"],
          costPerPackage: 250,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Vegetable oil + vaseline", preparation: "Mix equal parts", application: "Smear on legs daily" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Disinfect equipment",
        "Avoid introducing infected birds",
        "Clean perches regularly"
      ],
      businessNote: "Scaly leg causes lameness and reduces walking to feed. Early treatment costs Ksh 250 – lost growth costs Ksh 1,000."
    },
    {
      name: "Northern fowl mite (Ornithonyssus sylviarum)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Visible mites on birds (rapid, dark specks)",
        "Anaemia – pale comb and wattles",
        "Restlessness and reduced feed intake",
        "Egg production drop (up to 20%)",
        "Black specks in litter (mite droppings)"
      ],
      chemicalControls: [
        {
          productName: "Permethrin 10%",
          activeIngredient: "Permethrin",
          rate: "5ml per 2L water",
          applicationMethod: "Spray birds and house",
          timing: "Early morning",
          safetyInterval: "7 days",
          packageSizes: ["250ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Ivermectin 1%",
          activeIngredient: "Ivermectin",
          rate: "0.2mg per kg body weight",
          applicationMethod: "Oral or topical",
          timing: "When mites visible",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust birds and litter weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Clean houses between batches",
        "Remove wild birds from house area",
        "Maintain dry litter"
      ],
      businessNote: "Northern fowl mites cause anaemia and reduced egg production. Early treatment saves Ksh 3,000 in lost eggs."
    },
    {
      name: "Sticktight flea (Echidnophaga gallinacea)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Fleas firmly attached to head, comb, and around eyes",
        "Dark spots on skin (flea excrement)",
        "Anaemia – pale combs and wattles",
        "Restlessness and scratching",
        "Chicks may die from severe infestation"
      ],
      chemicalControls: [
        {
          productName: "Malathion 5% dust",
          activeIngredient: "Malathion",
          rate: "Dust lightly on birds",
          applicationMethod: "Dust birds and nest boxes",
          timing: "After cleaning house",
          safetyInterval: "14 days",
          packageSizes: ["500g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Wood ash", preparation: "Fine ash", application: "Sprinkle heavily in nest boxes and dust baths" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Remove wild birds from house area",
        "Clean nest boxes weekly",
        "Seal cracks in walls"
      ],
      businessNote: "Fleas cause irritation, anaemia, and death in chicks. Ash is FREE and effective."
    },
    {
      name: "Fowl tick (Argas persicus)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Ticks visible in cracks and perches (brown/oval)",
        "Anaemia – pale combs and wattles",
        "Restlessness and reduced egg production",
        "Paralysis in heavy infestations (toxin)",
        "Birds may show weakness"
      ],
      chemicalControls: [
        {
          productName: "Carbaryl 5% dust",
          activeIngredient: "Carbaryl",
          rate: "Dust house and perches",
          applicationMethod: "Apply to cracks and perches",
          timing: "After cleaning",
          safetyInterval: "14 days",
          packageSizes: ["500g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust perches and cracks weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Seal cracks and crevices",
        "Clean houses between batches",
        "Remove wild birds from house area"
      ],
      businessNote: "Fowl ticks cause anaemia and transmit diseases. Sealing cracks is a one‑time investment that saves Ksh 2,000 per cycle."
    },
    {
      name: "Cecal worm (Heterakis gallinarum)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Weight loss and poor condition",
        "Diarrhoea with mucus",
        "Reduced growth and feed efficiency",
        "Visible worms in caeca (post‑mortem only)",
        "Secondary blackhead disease may appear"
      ],
      chemicalControls: [
        {
          productName: "Fenbendazole",
          activeIngredient: "Fenbendazole",
          rate: "10mg per kg body weight",
          applicationMethod: "In feed or drinking water",
          timing: "When earthworms present",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Levamisole",
          activeIngredient: "Levamisole",
          rate: "0.2mg per bird",
          applicationMethod: "Oral drench or feed",
          timing: "Every 3 months",
          safetyInterval: "14 days",
          packageSizes: ["100ml (Ksh 450)"],
          costPerPackage: 450,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Control earthworm populations (drain wet areas)",
        "Keep litter dry",
        "Rotate pasture if free‑ranging"
      ],
      businessNote: "Cecal worms carry blackhead disease (Histomoniasis). Controlling them saves Ksh 4,000 in potential losses."
    },
    {
      name: "Capillary worm (Capillaria spp.)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Weight loss and poor condition",
        "Diarrhoea and pasty vents",
        "Reduced egg production",
        "Visible worms in droppings (thin, thread‑like)",
        "Anaemia and pale combs"
      ],
      chemicalControls: [
        {
          productName: "Fenbendazole",
          activeIngredient: "Fenbendazole",
          rate: "10mg per kg body weight",
          applicationMethod: "In feed or drinking water",
          timing: "When signs appear",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Garlic + pumpkin seeds", preparation: "Crush 100g seeds per 10 birds", application: "Mix into feed weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Keep litter completely dry",
        "Avoid overcrowding",
        "Clean feeders and drinkers daily"
      ],
      businessNote: "Capillary worms cause weight loss and reduced egg production. A Ksh 500 dewormer saves Ksh 3,000 in lost production."
    },
    {
      name: "Depluming mite (Knemidokoptes laevis)",
      type: "pest",
      feedingType: "chewing",
      signs: [
        "Severe feather loss (especially on head, neck, back)",
        "Bare skin areas with crusts",
        "Intense itching – birds constantly preening",
        "Reduced feed intake and weight loss",
        "Birds appear 'moth‑eaten'"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin 1%",
          activeIngredient: "Ivermectin",
          rate: "0.2mg per kg body weight",
          applicationMethod: "Oral or topical",
          timing: "When feather loss appears",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Wood ash", preparation: "Fine ash", application: "Provide dust baths regularly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Clean houses between batches",
        "Provide dust baths",
        "Avoid overcrowding"
      ],
      businessNote: "Depluming mites cause feather loss, exposing birds to cold and injury. Treat early – costs Ksh 350, saves Ksh 2,000 in lost condition."
    },
    {
      name: "Feather mite (Epidermoptes bilobatus)",
      type: "pest",
      feedingType: "chewing",
      signs: [
        "Intense itching and scratching",
        "Skin lesions and crusts",
        "Feather damage and loss",
        "Restlessness and reduced feed intake",
        "Birds appear irritable"
      ],
      chemicalControls: [
        {
          productName: "Permethrin 10%",
          activeIngredient: "Permethrin",
          rate: "5ml per 2L water",
          applicationMethod: "Spray birds",
          timing: "When skin irritation appears",
          safetyInterval: "7 days",
          packageSizes: ["250ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust birds and perches weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Provide dust baths",
        "Maintain good hygiene"
      ],
      businessNote: "Feather mites cause intense itching and skin lesions. A Ksh 500 spray saves Ksh 3,000 in bird condition."
    },
    {
      name: "Gapeworm (Syngamus trachea)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Birds gaping (opening beak wide) frequently",
        "Gasping and laboured breathing",
        "Head shaking to dislodge worms",
        "Weight loss and stunted growth",
        "Young chicks may die suddenly"
      ],
      chemicalControls: [
        {
          productName: "Fenbendazole",
          activeIngredient: "Fenbendazole",
          rate: "10mg per kg body weight",
          applicationMethod: "In feed or drinking water",
          timing: "When gasping or gaping appears",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Prevent access to earthworms and slugs (intermediate hosts)",
        "Keep birds off damp ground",
        "Rotate pasture"
      ],
      businessNote: "Gapeworms cause respiratory distress and death in chicks. Preventing access to earthworms is key – saves Ksh 4,000 per batch."
    },
    {
      name: "Eye worm (Oxyspirura mansoni)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Eye irritation – birds rubbing eyes on perches",
        "Watery or cloudy eyes",
        "Visible worms in the eye (thin, white)",
        "Swollen eyelids",
        "Reduced vision and feed intake"
      ],
      chemicalControls: [
        {
          productName: "Ivermectin 1%",
          activeIngredient: "Ivermectin",
          rate: "0.2mg per kg body weight",
          applicationMethod: "Oral or topical",
          timing: "When eye irritation appears",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Control cockroaches (intermediate hosts)",
        "Remove wild birds from area",
        "Maintain good hygiene"
      ],
      businessNote: "Eye worms cause eye irritation and blindness. Controlling cockroaches breaks the lifecycle – saves Ksh 2,000 in treatment."
    },
    {
      name: "Chigger mite (Trombiculidae)",
      type: "pest",
      feedingType: "sucking",
      signs: [
        "Intense itching and scratching",
        "Red, raised welts on skin (especially legs and vent)",
        "Restlessness and reduced feed intake",
        "Skin lesions and crusts",
        "Anaemia in heavy infestations"
      ],
      chemicalControls: [
        {
          productName: "Permethrin 10%",
          activeIngredient: "Permethrin",
          rate: "5ml per 2L water",
          applicationMethod: "Spray birds and litter",
          timing: "When skin irritation appears",
          safetyInterval: "7 days",
          packageSizes: ["250ml (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [
        { method: "Diatomaceous earth", preparation: "Dust powder", application: "Dust birds and perches weekly" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Keep grass short around poultry houses",
        "Avoid wet areas",
        "Maintain clean litter"
      ],
      businessNote: "Chigger mites cause intense itching and skin damage. Treatment costs Ksh 500 – saves Ksh 3,000 in bird health."
    },

    // ============================================================
    // DISEASES (25) – each with 'symptoms' array
    // ============================================================
    {
      name: "Newcastle Disease",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Drop of wings (paralysis/ataxia)",
        "Loss of appetite",
        "Green diarrhoea",
        "Shaking of neck and head (torticollis/tremors)",
        "Massive death (80–100% mortality)"
      ],
      chemicalControls: [
        {
          productName: "No chemical medicine – NO CURE",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Immediately upon diagnosis",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate PREVENTIVELY – Day 1 (hatchery), Week 1 (eye drop), Week 3 (drinking water booster).",
        "If symptoms appear: DO NOT vaccinate – it will kill the birds.",
        "Boost birds with multivitamins + electrolytes in drinking water for 2–3 days.",
        "Isolate and cull severely affected birds immediately.",
        "Strict biosecurity – footbaths, limit visitors, quarantine new birds."
      ],
      businessNote: "80–100% mortality in unvaccinated flocks. Prevention costs Ksh 500/batch. An outbreak costs Ksh 50,000+ in losses. NEVER vaccinate during an active outbreak – it accelerates death."
    },
    {
      name: "Gumboro (Infectious Bursal Disease)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Shedding of feathers (ruffled, poor appearance)",
        "Chocolate / bloody diarrhoea",
        "Birds piling together (huddling for warmth, fever/chills)",
        "Massive death (high mortality)"
      ],
      chemicalControls: [
        {
          productName: "No antibiotics – will kill the birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "N/A",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [
        {
          method: "Sugar + Salt Emergency Therapy",
          preparation: "Mix 0.25 kg (250g) of sugar + 6 tablespoons of salt in 20 litres of clean drinking water.",
          application: "Provide this solution as the only drinking water for 2–3 days. Response is seen within 30 minutes. Use multivitamins alongside."
        }
      ],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate preventively – Week 2 (drinking water).",
        "If symptoms appear: DO NOT vaccinate – it will kill the birds.",
        "Do NOT use antibiotics – they will kill the birds during a viral outbreak.",
        "Boost with multivitamins + electrolytes for 2–3 days.",
        "Isolate sick birds, disinfect equipment, avoid moving birds between houses."
      ],
      businessNote: "Gumboro damages the immune system. This sugar‑salt therapy stabilises birds within 30 minutes. Outbreak costs Ksh 50,000+ per flock. Prevention through vaccination is cheaper (Ksh 450 per 100 birds)."
    },
    {
      name: "Fowl Typhoid",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Yellowish diarrhoea (greenish‑yellow)",
        "Anaemia – pale comb and wattles",
        "Loss of appetite and weight loss",
        "Drop in egg production (up to 50%)",
        "Increased thirst",
        "Sudden death in acute cases"
      ],
      chemicalControls: [
        {
          productName: "Tetracycline",
          activeIngredient: "Tetracycline HCl",
          rate: "1g per 5L drinking water",
          applicationMethod: "In drinking water for 7 days",
          timing: "At first signs (yellowish diarrhoea)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Enrofloxacin 10%",
          activeIngredient: "Enrofloxacin",
          rate: "5ml per 1L water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early signs",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Good sanitation",
        "Avoid overcrowding",
        "Dispose of dead birds immediately",
        "Clean feeders and drinkers daily"
      ],
      businessNote: "Can cause 20–50% mortality in growers. Early antibiotic treatment is critical. Cost Ksh 800/batch."
    },
    {
      name: "Coccidiosis",
      type: "disease",
      pathogenType: "protozoa",
      symptoms: [
        "Chocolate / bloody diarrhoea",
        "Anaemia – pale comb and wattles",
        "Weight loss and stunted growth",
        "Birds huddling and depressed",
        "Sudden death in severe cases"
      ],
      chemicalControls: [
        {
          productName: "Amprolium",
          activeIngredient: "Amprolium HCl",
          rate: "1g per 2L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (blood in droppings)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Sulphaquinoxaline",
          activeIngredient: "Sulphoquinoxaline",
          rate: "1g per 1L water",
          applicationMethod: "In drinking water for 3 days",
          timing: "Early signs",
          safetyInterval: "7 days",
          packageSizes: ["100g (Ksh 400)"],
          costPerPackage: 400,
          status: "active",
          mode: "systemic",
          action: "both"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Change wet litter daily",
        "Use raised drinkers (nipple drinkers)",
        "Avoid overcrowding",
        "Rotate litter completely between batches"
      ],
      businessNote: "Causes blood in droppings, stunted growth, 30–50% mortality. Prevention is cheaper than cure."
    },
    {
      name: "Infectious Bronchitis",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Respiratory distress – gasping, coughing, sneezing",
        "Nasal discharge",
        "Drop in egg production (up to 50%)",
        "Watery egg whites",
        "Increased thirst"
      ],
      chemicalControls: [
        {
          productName: "No cure – prevent secondary infections",
          activeIngredient: "Antibiotics + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water",
          timing: "When respiratory signs appear",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate Week 1 (IB strain)",
        "Maintain good ventilation (no ammonia)",
        "Reduce stress (overcrowding, extreme temperatures)",
        "Keep house dust levels low"
      ],
      businessNote: "Causes egg drop (up to 50%) in layers and respiratory distress. Vaccine cost Ksh 500 for 100 birds."
    },
    {
      name: "Fowl Pox",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Scabs / skin lesions on comb, wattles, and around eyes",
        "White spots in mouth and throat (wet form)",
        "Reduced feed intake",
        "Weight loss",
        "Drop in egg production"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care",
          activeIngredient: "Iodine + antiseptic",
          rate: "Apply to scabs",
          applicationMethod: "Topical on lesions",
          timing: "When scabs appear",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [
        { method: "Aloe vera gel", preparation: "Squeeze fresh", application: "Apply to scabs to promote healing" }
      ],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate Week 4 (wing web – high‑risk areas only)",
        "Control mosquitoes (vectors)",
        "Isolate affected birds",
        "Clean and disinfect house"
      ],
      businessNote: "Causes scabs and reduced growth. Fowl Pox vaccine costs Ksh 600 for 100 birds."
    },
    {
      name: "Marek's Disease",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Paralysis of wings and legs (ataxia)",
        "Weight loss and emaciation",
        "Pale combs and wattles",
        "Tumours in organs (post‑mortem)",
        "Drop in egg production"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull affected birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "At first signs (paralysis)",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate Day 1 (at hatchery – Marek's)",
        "Disinfect equipment",
        "Buy birds from vaccinated flocks",
        "Do not mix age groups"
      ],
      businessNote: "Causes tumours and paralysis. Marek's is 100% preventable with a cheap Ksh 300 per 100 chicks vaccine."
    },
    {
      name: "Avian Influenza (Highly Pathogenic)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Sudden death (without warning)",
        "Respiratory distress – gasping, coughing",
        "Swollen face and wattles",
        "Greenish diarrhoea",
        "Drop in egg production to zero"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull entire flock (mandatory)",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Immediately upon suspicion",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Strict biosecurity – limit all visitors",
        "Cover feed to prevent wild bird access",
        "Report suspicious deaths to authorities immediately",
        "Disinfect all equipment and vehicles"
      ],
      businessNote: "Highly fatal (90–100%). Outbreak causes total loss and quarantine. Prevention is the only defence."
    },
    {
      name: "Chronic Respiratory Disease (CRD)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Coughing and sneezing",
        "Nasal discharge (clear to thick)",
        "Watery eyes",
        "Reduced growth and feed conversion",
        "Drop in egg production (up to 20%)"
      ],
      chemicalControls: [
        {
          productName: "Tylosin tartrate",
          activeIngredient: "Tylosin",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 5–7 days",
          timing: "At first signs (coughing, nasal discharge)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Tiamulin",
          activeIngredient: "Tiamulin hydrogen fumarate",
          rate: "1ml per 2L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early respiratory signs",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "both"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Maintain good ventilation",
        "Avoid overcrowding",
        "Reduce ammonia levels (change litter)",
        "Isolate affected birds"
      ],
      businessNote: "CRD reduces growth and egg production. A Ksh 600 treatment saves Ksh 5,000 in lost performance."
    },
    {
      name: "Infectious Coryza",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Swollen face (especially around eyes)",
        "Nasal discharge (foul‑smelling)",
        "Watery eyes and eye discharge",
        "Drop in egg production (up to 40%)",
        "Loss of appetite and weight loss"
      ],
      chemicalControls: [
        {
          productName: "Sulphadimethoxine",
          activeIngredient: "Sulphadimethoxine",
          rate: "1g per 2L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (swollen face, nasal discharge)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Erythromycin",
          activeIngredient: "Erythromycin",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early signs",
          safetyInterval: "7 days",
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
        "Quarantine new birds",
        "Avoid overcrowding",
        "Disinfect equipment between groups",
        "Good ventilation"
      ],
      businessNote: "Causes facial swelling and reduced egg production. Early treatment costs Ksh 500 – saves Ksh 3,000 in egg loss."
    },
    {
      name: "Fowl Cholera",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Sudden death (often without prior signs)",
        "Fever (birds appear depressed and huddled)",
        "Swollen wattles and face",
        "Greenish diarrhoea",
        "Drop in egg production"
      ],
      chemicalControls: [
        {
          productName: "Sulphadimidine",
          activeIngredient: "Sulphadimidine",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (sudden death, fever)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Penicillin + Streptomycin",
          activeIngredient: "Penicillin/Streptomycin",
          rate: "As per label (injection)",
          applicationMethod: "Intramuscular injection",
          timing: "Early signs",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Good sanitation",
        "Avoid overcrowding",
        "Control rodents (carriers)",
        "Dispose of dead birds immediately"
      ],
      businessNote: "Fowl cholera causes sudden death in adult birds. Early treatment saves Ksh 5,000 per 100 birds."
    },
    {
      name: "Pullorum Disease (Salmonellosis)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "White / chalky diarrhoea (pasty vents)",
        "Depression and huddling (chicks)",
        "Loss of appetite and weight loss",
        "Anaemia – pale combs",
        "High chick mortality"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull and destroy infected birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "Upon diagnosis",
          status: "active",
          mode: "contact",
          action: "preventive"
        },
        {
          productName: "Enrofloxacin 10% (for treatment of survivors)",
          activeIngredient: "Enrofloxacin",
          rate: "5ml per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early signs",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Buy chicks from Pullorum‑free hatcheries",
        "Practice strict biosecurity",
        "Clean and disinfect equipment",
        "Isolate new birds"
      ],
      businessNote: "Causes high mortality in chicks. Buying from certified hatcheries is the best prevention."
    },
    {
      name: "Aspergillosis",
      type: "disease",
      pathogenType: "fungal",
      symptoms: [
        "Gasping and laboured breathing",
        "Depression and loss of appetite",
        "Weight loss",
        "Visible white nodules in lungs (post‑mortem)",
        "Sudden death in severe cases"
      ],
      chemicalControls: [
        {
          productName: "No effective treatment – cull affected birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "At first signs (gasping, depression)",
          status: "active",
          mode: "contact",
          action: "preventive"
        },
        {
          productName: "Nystatin (for mild cases)",
          activeIngredient: "Nystatin",
          rate: "As per label in feed",
          applicationMethod: "In feed for 7 days",
          timing: "Early signs",
          packageSizes: ["100g (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "contact",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Prevent mouldy feed and litter",
        "Store feed in dry, cool place",
        "Avoid wet litter",
        "Good ventilation"
      ],
      businessNote: "Aspergillosis is caused by mouldy feed/litter. Prevention is cheaper than treatment. Cost Ksh 800 per batch."
    },
    {
      name: "Egg Drop Syndrome (EDS)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Drop in egg production (up to 50%)",
        "Soft‑shelled or shell‑less eggs",
        "Pale eggshells",
        "Reduced egg size",
        "No other significant clinical signs"
      ],
      chemicalControls: [
        {
          productName: "No cure – support layers",
          activeIngredient: "Vitamins + calcium",
          rate: "As per label",
          applicationMethod: "In feed or drinking water",
          timing: "When eggs soft or misshapen",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate at Week 16 (EDS vaccine – injection)",
        "Maintain good biosecurity",
        "Avoid stress during peak lay",
        "Buy birds from vaccinated flocks"
      ],
      businessNote: "EDS causes up to 50% egg drop. Vaccine costs Ksh 800 for 100 birds – saves Ksh 20,000 in egg revenue."
    },
    {
      name: "Necrotic Enteritis",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Sudden death (often without prior signs)",
        "Dark, foul‑smelling diarrhoea",
        "Depression and loss of appetite",
        "Reduced growth",
        "Lesions in the small intestine (post‑mortem)"
      ],
      chemicalControls: [
        {
          productName: "Bacitracin",
          activeIngredient: "Bacitracin zinc",
          rate: "As per label in feed",
          applicationMethod: "In feed for 7 days",
          timing: "At first signs (dark diarrhoea, sudden death)",
          safetyInterval: "7 days",
          packageSizes: ["100g (Ksh 500)"],
          costPerPackage: 500,
          status: "active",
          mode: "contact",
          action: "curative"
        },
        {
          productName: "Amoxicillin",
          activeIngredient: "Amoxicillin trihydrate",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early signs",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Prevent coccidiosis (predisposes birds)",
        "Maintain good litter quality",
        "Avoid overcrowding",
        "Disinfect water lines"
      ],
      businessNote: "Necrotic enteritis causes sudden death. Preventing coccidiosis prevents this disease. Saves Ksh 4,000 per batch."
    },
    {
      name: "Infectious Laryngotracheitis (ILT)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Gasping and laboured breathing",
        "Coughing up blood (blood in trachea)",
        "Nasal discharge",
        "Drop in egg production",
        "Reduced feed intake and weight loss"
      ],
      chemicalControls: [
        {
          productName: "No cure – prevent secondary infections",
          activeIngredient: "Antibiotics + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water",
          timing: "When respiratory signs (gasping, blood in trachea)",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate against ILT in endemic areas",
        "Maintain strict biosecurity",
        "Isolate affected birds immediately",
        "Good ventilation"
      ],
      businessNote: "ILT causes severe respiratory distress and mortality. Vaccination costs Ksh 600 for 100 birds – saves Ksh 10,000 in losses."
    },
    {
      name: "Avian Encephalomyelitis (AE)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Tremors (especially in chicks)",
        "Paralysis of wings and legs",
        "Loss of appetite and weight loss",
        "Depression and huddling",
        "Egg production drop in breeders"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care",
          activeIngredient: "Electrolytes + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water",
          timing: "When tremors or paralysis appear",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate breeders (prevents egg transmission)",
        "Buy chicks from AE‑free hatcheries",
        "Strict biosecurity"
      ],
      businessNote: "AE causes tremors and paralysis in chicks. Prevention through breeder vaccination costs Ksh 500 per 100 breeders."
    },
    {
      name: "Reovirus Infection (Viral Arthritis)",
      type: "disease",
      pathogenType: "viral",
      symptoms: [
        "Lameness and reluctance to walk",
        "Swollen joints (hocks, feet)",
        "Weight loss and reduced growth",
        "Ruffled feathers and depression",
        "Reduced feed efficiency"
      ],
      chemicalControls: [
        {
          productName: "No cure – cull severely affected birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "When lameness and swollen joints appear",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Vaccinate breeders against reovirus",
        "Maintain good litter quality",
        "Avoid overcrowding",
        "Disinfect equipment"
      ],
      businessNote: "Causes lameness and reduced weight gain. Vaccinating breeders costs Ksh 600 per 100 birds."
    },
    {
      name: "Colibacillosis (E. coli)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Respiratory distress – gasping, coughing",
        "Diarrhoea (greenish or watery)",
        "Depression and loss of appetite",
        "Drop in egg production",
        "Sudden death in acute cases"
      ],
      chemicalControls: [
        {
          productName: "Enrofloxacin 10%",
          activeIngredient: "Enrofloxacin",
          rate: "5ml per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (respiratory, diarrhoea)",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Tetracycline",
          activeIngredient: "Tetracycline HCl",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 7 days",
          timing: "Early signs",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Maintain good hygiene",
        "Avoid overcrowding",
        "Keep litter dry",
        "Disinfect water lines"
      ],
      businessNote: "E. coli causes respiratory and systemic infections. Good hygiene prevents outbreaks – saves Ksh 5,000 per batch."
    },
    {
      name: "Omphalitis (Yolk Sac Infection)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Swollen navel (unhealed yolk sac)",
        "Depression and huddling in chicks",
        "Loss of appetite and weight loss",
        "Pasty vents",
        "High chick mortality"
      ],
      chemicalControls: [
        {
          productName: "Enrofloxacin 10%",
          activeIngredient: "Enrofloxacin",
          rate: "5ml per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (swollen navel, depression)",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 1,200)"],
          costPerPackage: 1200,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Ensure clean hatchery conditions",
        "Disinfect incubators and hatchers",
        "Purchase chicks from clean hatcheries",
        "Keep brooder warm and dry"
      ],
      businessNote: "Omphalitis causes high chick mortality. Prevention starts at the hatchery. Saves Ksh 3,000 per 100 chicks."
    },
    {
      name: "Gangrenous Dermatitis",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Dark, necrotic skin lesions (black/brown)",
        "Swollen and reddened skin",
        "Depression and loss of appetite",
        "Sudden death (within hours)",
        "Foul‑smelling lesions"
      ],
      chemicalControls: [
        {
          productName: "Penicillin + Streptomycin",
          activeIngredient: "Penicillin/Streptomycin",
          rate: "As per label (injection)",
          applicationMethod: "Intramuscular injection",
          timing: "At first signs (dark skin lesions)",
          safetyInterval: "21 days",
          packageSizes: ["10ml (Ksh 350)"],
          costPerPackage: 350,
          status: "active",
          mode: "systemic",
          action: "curative"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Prevent skin injuries (sharp objects)",
        "Avoid overcrowding",
        "Maintain good litter quality",
        "Control wet litter"
      ],
      businessNote: "Gangrenous dermatitis causes rapid death. Preventing injuries and keeping litter dry saves Ksh 4,000 per batch."
    },
    {
      name: "Mycoplasma synoviae (MS)",
      type: "disease",
      pathogenType: "bacterial",
      symptoms: [
        "Lameness and swollen joints (hocks, feet)",
        "Reduced growth and feed conversion",
        "Egg production drop",
        "Ruffled feathers and depression",
        "Weight loss"
      ],
      chemicalControls: [
        {
          productName: "Tylosin tartrate",
          activeIngredient: "Tylosin",
          rate: "1g per 1L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "At first signs (lameness, swollen joints)",
          safetyInterval: "14 days",
          packageSizes: ["100g (Ksh 600)"],
          costPerPackage: 600,
          status: "active",
          mode: "systemic",
          action: "curative"
        },
        {
          productName: "Tiamulin",
          activeIngredient: "Tiamulin hydrogen fumarate",
          rate: "1ml per 2L drinking water",
          applicationMethod: "In drinking water for 5 days",
          timing: "Early signs",
          safetyInterval: "21 days",
          packageSizes: ["100ml (Ksh 800)"],
          costPerPackage: 800,
          status: "active",
          mode: "systemic",
          action: "both"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Buy chicks from MS‑free flocks",
        "Good ventilation",
        "Avoid overcrowding",
        "Disinfect equipment"
      ],
      businessNote: "MS causes lameness and reduced growth. Prevention through clean source saves Ksh 5,000 per batch."
    },
    {
      name: "Histomoniasis (Blackhead)",
      type: "disease",
      pathogenType: "protozoa",
      symptoms: [
        "Yellowish diarrhoea (classic sign)",
        "Depression and loss of appetite",
        "Weight loss and emaciation",
        "Darkening of the head (blackhead)",
        "Sudden death in turkeys"
      ],
      chemicalControls: [
        {
          productName: "No effective treatment – cull affected birds",
          activeIngredient: "N/A",
          rate: "N/A",
          applicationMethod: "N/A",
          timing: "At first signs (yellow droppings, depression)",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Control cecal worms (carriers)",
        "Keep litter dry",
        "Prevent access to earthworms",
        "Separate turkeys from chickens"
      ],
      businessNote: "Blackhead is fatal in turkeys and chickens. Controlling cecal worms prevents it. Saves Ksh 10,000 per flock."
    },
    {
      name: "Botulism",
      type: "disease",
      pathogenType: "toxic",
      symptoms: [
        "Progressive paralysis (wings, neck, legs)",
        "Limp neck (floppy neck)",
        "Difficulty breathing",
        "Diarrhoea",
        "Sudden death"
      ],
      chemicalControls: [
        {
          productName: "No cure – supportive care",
          activeIngredient: "Electrolytes + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water",
          timing: "When paralysis appears",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Remove dead birds immediately",
        "Do not feed spoiled feed",
        "Prevent maggots (carry toxin)",
        "Good hygiene"
      ],
      businessNote: "Botulism causes paralysis and death. Removing dead birds immediately prevents outbreaks. Saves Ksh 5,000 per flock."
    },
    {
      name: "Acute Death Syndrome (Sudden Death)",
      type: "disease",
      pathogenType: "metabolic",
      symptoms: [
        "Sudden death (apparently healthy birds)",
        "No prior signs",
        "Usually in fast‑growing broilers",
        "Often occurs during stress (heat, crowding)",
        "Post‑mortem: enlarged heart, fluid accumulation"
      ],
      chemicalControls: [
        {
          productName: "No cure – manage stress",
          activeIngredient: "Electrolytes + vitamins",
          rate: "As per label",
          applicationMethod: "In drinking water",
          timing: "When sudden deaths occur",
          status: "active",
          mode: "contact",
          action: "preventive"
        }
      ],
      organicControls: [],
      biologicalControls: [],
      culturalControls: [
        "Reduce stress (avoid overcrowding)",
        "Maintain good ventilation",
        "Gradual lighting changes",
        "Good nutrition"
      ],
      businessNote: "Acute death syndrome is stress‑related. Managing stress saves Ksh 5,000 per batch in losses."
    }
  ]
};