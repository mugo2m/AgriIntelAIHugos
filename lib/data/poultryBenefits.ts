// lib/data/poultryBenefits.ts
// POULTRY BREED BENEFITS – Nutritional value of eggs and meat
// Data based on USDA, FAO, and Kenyan poultry research
// Each entry shows nutrients per 100g serving and health benefits

export interface PoultryNutrientFact {
  name: string;
  amount: string;
  dailyValuePercent: number;
}

export interface PoultryBenefit {
  nutrients: PoultryNutrientFact[];
  healthBenefits: string[];
  productType: "eggs" | "meat" | "both";
}

export const poultryBenefits: Record<string, Record<string, PoultryBenefit>> = {
  // ==================== CHICKEN BREEDS ====================
  chicken: {
    // --- LAYERS (Egg Production) ---
    "KARI Improved Kienyeji": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Vitamin A", amount: "160 µg", dailyValuePercent: 18 },
        { name: "Vitamin D", amount: "82 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
        { name: "Selenium", amount: "30.8 µg", dailyValuePercent: 56 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3 (egg)", amount: "0.1 g", dailyValuePercent: 4 }
      ],
      healthBenefits: [
        "Supports brain health – rich in choline and B12",
        "Strengthens bones – vitamin D and selenium",
        "Builds muscle – high-quality protein",
        "Boosts immunity – selenium",
        "Loves your heart – healthy fats",
        "Supports eye health – vitamin A",
        "Great for pregnancy – folate",
        "Sustained energy – protein and vitamins"
      ]
    },
    "Kuroiler": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "87 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Selenium", amount: "31.5 µg", dailyValuePercent: 57 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 },
        { name: "Choline", amount: "150 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "47 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "High egg production – supports family nutrition",
        "Builds muscle – high protein content",
        "Boosts immunity – selenium and B12",
        "Supports brain health – choline",
        "Strengthens bones – vitamin D",
        "Loves your heart – healthy fats",
        "Great for pregnancy – folate",
        "Sustained energy throughout the day"
      ]
    },
    "Sussex": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.6 g", dailyValuePercent: 25 },
        { name: "Vitamin A", amount: "165 µg", dailyValuePercent: 18 },
        { name: "Vitamin D", amount: "85 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
        { name: "Selenium", amount: "30.5 µg", dailyValuePercent: 55 },
        { name: "Choline", amount: "148 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.11 g", dailyValuePercent: 5 }
      ],
      healthBenefits: [
        "Dual-purpose breed – meat and eggs",
        "Builds strong bones – vitamin D and selenium",
        "Supports brain function – choline and B12",
        "Boosts immunity – selenium and vitamin A",
        "Builds muscle – protein",
        "Loves your heart – healthy fats",
        "Great for growing children – protein and vitamins",
        "Sustained energy"
      ]
    },
    "Kenbrew (Kenbro)": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.8 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "86 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.15 µg", dailyValuePercent: 48 },
        { name: "Selenium", amount: "31 µg", dailyValuePercent: 56 },
        { name: "Iron", amount: "1.85 mg", dailyValuePercent: 10 },
        { name: "Choline", amount: "149 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "46 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "Hardy breed – good for free-range",
        "Supports bone health – vitamin D",
        "Boosts immunity – selenium",
        "Builds muscle – protein",
        "Supports brain health – choline",
        "Loves your heart – healthy fats",
        "Great for pregnancy – folate",
        "Sustained energy"
      ]
    },
    "Brown Leghorn": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.2 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "90 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.25 µg", dailyValuePercent: 52 },
        { name: "Selenium", amount: "32 µg", dailyValuePercent: 58 },
        { name: "Choline", amount: "152 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "48 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 }
      ],
      healthBenefits: [
        "Excellent layer – consistent eggs",
        "Supports brain health – choline and B12",
        "Boosts immunity – selenium and vitamin D",
        "Builds muscle – protein",
        "Great for pregnancy – folate",
        "Sustained energy",
        "Eye health – vitamin A",
        "Strong bones – vitamin D"
      ]
    },
    "Hy-Line Brown": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "88 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Selenium", amount: "31.5 µg", dailyValuePercent: 57 },
        { name: "Choline", amount: "150 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "47 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.85 mg", dailyValuePercent: 10 }
      ],
      healthBenefits: [
        "High egg production – 280-300 eggs/year",
        "Supports brain health",
        "Boosts immunity",
        "Strong bones – vitamin D",
        "Builds muscle",
        "Great for pregnancy – folate",
        "Sustained energy",
        "Loves your heart"
      ]
    },
    "Isa Brown": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.1 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "89 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.22 µg", dailyValuePercent: 51 },
        { name: "Selenium", amount: "31.8 µg", dailyValuePercent: 58 },
        { name: "Choline", amount: "151 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "47.5 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.88 mg", dailyValuePercent: 10 }
      ],
      healthBenefits: [
        "Top egg producer in tropics",
        "Brain health – choline and B12",
        "Immunity boost",
        "Bone health – vitamin D",
        "Muscle building",
        "Pregnancy support – folate",
        "Energy",
        "Heart health"
      ]
    },
    "Lohmann Brown": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.1 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "89 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.22 µg", dailyValuePercent: 51 },
        { name: "Selenium", amount: "31.8 µg", dailyValuePercent: 58 },
        { name: "Choline", amount: "151 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "47.5 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.88 mg", dailyValuePercent: 10 }
      ],
      healthBenefits: [
        "Commercial layer",
        "Brain health – choline",
        "Immunity boost",
        "Bone health",
        "Muscle building",
        "Pregnancy support",
        "Energy",
        "Heart health"
      ]
    },
    "Bovans Brown": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "88 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Selenium", amount: "31.5 µg", dailyValuePercent: 57 },
        { name: "Choline", amount: "150 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "47 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.85 mg", dailyValuePercent: 10 }
      ],
      healthBenefits: [
        "Commercial layer",
        "Brain health",
        "Immunity boost",
        "Bone health",
        "Muscle building",
        "Pregnancy support",
        "Energy",
        "Heart health"
      ]
    },
    "Dekalb White": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.2 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "90 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.25 µg", dailyValuePercent: 52 },
        { name: "Selenium", amount: "32 µg", dailyValuePercent: 58 },
        { name: "Choline", amount: "152 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "48 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 }
      ],
      healthBenefits: [
        "White egg layer",
        "Brain health – choline",
        "Immunity boost",
        "Bone health",
        "Muscle building",
        "Pregnancy support",
        "Energy",
        "Heart health"
      ]
    },
    "Babcock White": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.2 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "90 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.25 µg", dailyValuePercent: 52 },
        { name: "Selenium", amount: "32 µg", dailyValuePercent: 58 },
        { name: "Choline", amount: "152 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "48 µg", dailyValuePercent: 12 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 }
      ],
      healthBenefits: [
        "White egg commercial layer",
        "Brain health",
        "Immunity boost",
        "Bone health",
        "Muscle building",
        "Pregnancy support",
        "Energy",
        "Heart health"
      ]
    },

    // --- BROILERS (Meat Production) ---
    "Cobb 500": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.3 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "8.9 mg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22.4 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "185 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.6 mg", dailyValuePercent: 15 },
        { name: "Iron", amount: "1.3 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.3 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Builds muscle – high protein content",
        "Supports metabolism – B vitamins",
        "Strengthens bones – phosphorus",
        "Boosts immunity – selenium and zinc",
        "Helps with weight management – lean protein",
        "Loves your heart – low saturated fat",
        "Sustained energy – protein and B vitamins",
        "Fast growth – ideal for meat production"
      ]
    },
    "Ross 308": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.5 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "9 mg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.52 mg", dailyValuePercent: 30 },
        { name: "Selenium", amount: "22.6 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "188 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.65 mg", dailyValuePercent: 15 },
        { name: "Iron", amount: "1.35 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.32 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Industry standard broiler",
        "Muscle building",
        "Metabolism boost",
        "Bone strength",
        "Immunity",
        "Weight management",
        "Heart health",
        "Energy"
      ]
    },
    "Arbor Acres": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.4 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "8.95 mg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.51 mg", dailyValuePercent: 30 },
        { name: "Selenium", amount: "22.5 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "186 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.62 mg", dailyValuePercent: 15 },
        { name: "Iron", amount: "1.32 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.31 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Fast-growing broiler",
        "Muscle building",
        "Metabolism boost",
        "Bone health",
        "Immunity",
        "Weight management",
        "Heart health",
        "Energy"
      ]
    },
    "Hubbard": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.6 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "9.1 mg", dailyValuePercent: 57 },
        { name: "Vitamin B6", amount: "0.53 mg", dailyValuePercent: 31 },
        { name: "Selenium", amount: "22.8 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "190 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.68 mg", dailyValuePercent: 15 },
        { name: "Iron", amount: "1.38 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.33 µg", dailyValuePercent: 14 }
      ],
      healthBenefits: [
        "Versatile broiler",
        "Muscle building",
        "Metabolism",
        "Bone strength",
        "Immunity",
        "Weight management",
        "Heart health",
        "Energy"
      ]
    },
    "Indian River": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.3 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "8.85 mg", dailyValuePercent: 55 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22.3 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "184 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.58 mg", dailyValuePercent: 14 },
        { name: "Iron", amount: "1.28 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.3 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Broiler breed",
        "Muscle building",
        "Metabolism boost",
        "Bone health",
        "Immunity",
        "Weight management",
        "Heart health",
        "Energy"
      ]
    },

    // --- DUAL-PURPOSE (Meat & Eggs) ---
    "Sasso": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Protein (meat)", amount: "26 g", dailyValuePercent: 52 },
        { name: "Vitamin D", amount: "85 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Selenium", amount: "30 µg", dailyValuePercent: 55 },
        { name: "Iron", amount: "1.7 mg", dailyValuePercent: 9 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.11 g", dailyValuePercent: 5 }
      ],
      healthBenefits: [
        "Dual-purpose – ideal for small farms",
        "Builds muscle – protein",
        "Boosts immunity – selenium",
        "Supports brain health – choline",
        "Strong bones – vitamin D",
        "Loves your heart",
        "Sustained energy",
        "Great for family nutrition"
      ]
    },
    "Kenya Broiler": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27 g", dailyValuePercent: 54 },
        { name: "Niacin", amount: "8.8 mg", dailyValuePercent: 55 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22 µg", dailyValuePercent: 40 },
        { name: "Phosphorus", amount: "183 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "1.55 mg", dailyValuePercent: 14 },
        { name: "Iron", amount: "1.25 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.3 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Kenyan broiler",
        "Muscle building",
        "Metabolism boost",
        "Bone health",
        "Immunity",
        "Weight management",
        "Heart health",
        "Energy"
      ]
    },
    "KARI Kienyeji": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.4 g", dailyValuePercent: 25 },
        { name: "Vitamin A", amount: "155 µg", dailyValuePercent: 17 },
        { name: "Vitamin D", amount: "84 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.05 µg", dailyValuePercent: 44 },
        { name: "Iron", amount: "1.7 mg", dailyValuePercent: 9 },
        { name: "Selenium", amount: "29.5 µg", dailyValuePercent: 54 },
        { name: "Choline", amount: "146 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.1 g", dailyValuePercent: 4 }
      ],
      healthBenefits: [
        "Improved indigenous breed",
        "Family nutrition – eggs and meat",
        "Immunity support – selenium",
        "Brain health – choline and B12",
        "Bone health – vitamin D",
        "Eye health – vitamin A",
        "Muscle building – protein",
        "Energy"
      ]
    },

    // --- INDIGENOUS / LOCAL ---
    "Local Kienyeji": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12 g", dailyValuePercent: 24 },
        { name: "Vitamin A", amount: "150 µg", dailyValuePercent: 17 },
        { name: "Vitamin D", amount: "80 IU", dailyValuePercent: 13 },
        { name: "Vitamin B12", amount: "1 µg", dailyValuePercent: 42 },
        { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 },
        { name: "Selenium", amount: "28 µg", dailyValuePercent: 51 },
        { name: "Choline", amount: "145 mg", dailyValuePercent: 26 },
        { name: "Omega-3", amount: "0.09 g", dailyValuePercent: 4 }
      ],
      healthBenefits: [
        "Hardy, free-range local breed",
        "Nutrient-rich eggs – good yolk colour",
        "Boosts immunity",
        "Supports brain health",
        "Family nutrition",
        "Sustained energy",
        "Traditional medicinal value",
        "Good for smallholder farmers"
      ]
    },
    "Local Turkana": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.2 g", dailyValuePercent: 24 },
        { name: "Vitamin A", amount: "152 µg", dailyValuePercent: 17 },
        { name: "Vitamin D", amount: "82 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.02 µg", dailyValuePercent: 43 },
        { name: "Iron", amount: "1.65 mg", dailyValuePercent: 9 },
        { name: "Selenium", amount: "28.5 µg", dailyValuePercent: 52 },
        { name: "Choline", amount: "146 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.1 g", dailyValuePercent: 4 }
      ],
      healthBenefits: [
        "Hardy breed adapted to dry areas",
        "Nutrient-rich eggs",
        "Immune support",
        "Brain health",
        "Family nutrition",
        "Energy",
        "Good for harsh environments",
        "Traditional value"
      ]
    },
    "Local Bantam": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Vitamin A", amount: "158 µg", dailyValuePercent: 18 },
        { name: "Vitamin D", amount: "83 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.05 µg", dailyValuePercent: 44 },
        { name: "Iron", amount: "1.68 mg", dailyValuePercent: 9 },
        { name: "Selenium", amount: "29 µg", dailyValuePercent: 53 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.1 g", dailyValuePercent: 4 }
      ],
      healthBenefits: [
        "Small, broody breed",
        "Good for ornamental and eggs",
        "Nutrient-rich eggs",
        "Family nutrition",
        "Supports immunity",
        "Brain health",
        "Energy",
        "Good for small spaces"
      ]
    },

    // --- OTHER ---
    "Other": {
      productType: "both",
      nutrients: [
        { name: "Protein", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "85 IU", dailyValuePercent: 14 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Selenium", amount: "30 µg", dailyValuePercent: 55 },
        { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.1 g", dailyValuePercent: 4 },
        { name: "Folate", amount: "47 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "Unknown breed – nutritional value varies",
        "Generally good protein source",
        "Supports immune health",
        "Good for brain function",
        "Family nutrition",
        "Energy",
        "Consult local extension for specific advice"
      ]
    }
  },

  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "28.2 g", dailyValuePercent: 56 },
        { name: "Niacin", amount: "9.2 mg", dailyValuePercent: 58 },
        { name: "Vitamin B6", amount: "0.6 mg", dailyValuePercent: 35 },
        { name: "Selenium", amount: "24 µg", dailyValuePercent: 44 },
        { name: "Phosphorus", amount: "200 mg", dailyValuePercent: 16 },
        { name: "Zinc", amount: "2.8 mg", dailyValuePercent: 25 },
        { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.4 µg", dailyValuePercent: 17 }
      ],
      healthBenefits: [
        "Lean meat – good for heart health",
        "High protein – builds muscle",
        "Immunity support – selenium and zinc",
        "Bone health – phosphorus",
        "Metabolism boost – B vitamins",
        "Weight management – low fat",
        "Energy",
        "Great for festive meals"
      ]
    },
    "Broad Breasted Bronze": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "28.5 g", dailyValuePercent: 57 },
        { name: "Niacin", amount: "9.4 mg", dailyValuePercent: 59 },
        { name: "Vitamin B6", amount: "0.62 mg", dailyValuePercent: 36 },
        { name: "Selenium", amount: "24.5 µg", dailyValuePercent: 45 },
        { name: "Phosphorus", amount: "205 mg", dailyValuePercent: 16 },
        { name: "Zinc", amount: "2.9 mg", dailyValuePercent: 26 },
        { name: "Iron", amount: "1.55 mg", dailyValuePercent: 9 },
        { name: "Vitamin B12", amount: "0.42 µg", dailyValuePercent: 18 }
      ],
      healthBenefits: [
        "Heritage turkey breed",
        "Lean protein",
        "Muscle building",
        "Immunity",
        "Bone health",
        "Energy",
        "Heart health",
        "Great for special occasions"
      ]
    },
    "Narragansett": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.8 g", dailyValuePercent: 56 },
        { name: "Niacin", amount: "9 µg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.58 mg", dailyValuePercent: 34 },
        { name: "Selenium", amount: "23.5 µg", dailyValuePercent: 43 },
        { name: "Phosphorus", amount: "195 mg", dailyValuePercent: 16 },
        { name: "Zinc", amount: "2.7 mg", dailyValuePercent: 25 },
        { name: "Iron", amount: "1.45 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.38 µg", dailyValuePercent: 16 }
      ],
      healthBenefits: [
        "Heritage turkey",
        "Lean protein",
        "Muscle building",
        "Immunity",
        "Bone health",
        "Energy",
        "Heart health",
        "Great flavour"
      ]
    },
    "Royal Palm": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27.5 g", dailyValuePercent: 55 },
        { name: "Niacin", amount: "8.8 mg", dailyValuePercent: 55 },
        { name: "Vitamin B6", amount: "0.55 mg", dailyValuePercent: 32 },
        { name: "Selenium", amount: "23 µg", dailyValuePercent: 42 },
        { name: "Phosphorus", amount: "190 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "2.6 mg", dailyValuePercent: 24 },
        { name: "Iron", amount: "1.4 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.36 µg", dailyValuePercent: 15 }
      ],
      healthBenefits: [
        "Ornamental and meat turkey",
        "Lean protein",
        "Muscle building",
        "Immunity",
        "Bone health",
        "Energy",
        "Heart health",
        "Great flavour"
      ]
    },
    "Local Turkey": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27 g", dailyValuePercent: 54 },
        { name: "Niacin", amount: "8.5 mg", dailyValuePercent: 53 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22 µg", dailyValuePercent: 40 },
        { name: "Phosphorus", amount: "180 mg", dailyValuePercent: 14 },
        { name: "Zinc", amount: "2.4 mg", dailyValuePercent: 22 },
        { name: "Iron", amount: "1.3 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.3 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Hardy local turkey",
        "Lean protein",
        "Muscle building",
        "Immunity",
        "Bone health",
        "Energy",
        "Heart health",
        "Great for local farming"
      ]
    },
    "Other": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27 g", dailyValuePercent: 54 },
        { name: "Niacin", amount: "8.5 mg", dailyValuePercent: 53 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22 µg", dailyValuePercent: 40 },
        { name: "Phosphorus", amount: "180 mg", dailyValuePercent: 14 },
        { name: "Zinc", amount: "2.4 mg", dailyValuePercent: 22 },
        { name: "Iron", amount: "1.3 mg", dailyValuePercent: 7 },
        { name: "Vitamin B12", amount: "0.3 µg", dailyValuePercent: 13 }
      ],
      healthBenefits: [
        "Unknown turkey breed",
        "Lean protein",
        "Muscle building",
        "Immunity",
        "Bone health",
        "Energy",
        "Heart health",
        "Consult local extension"
      ]
    }
  },

  // ==================== DUCKS ====================
  duck: {
    "Khaki Campbell": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "12.8 g", dailyValuePercent: 26 },
        { name: "Vitamin A", amount: "160 µg", dailyValuePercent: 18 },
        { name: "Vitamin D", amount: "100 IU", dailyValuePercent: 17 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Iron", amount: "2.1 mg", dailyValuePercent: 12 },
        { name: "Selenium", amount: "35 µg", dailyValuePercent: 64 },
        { name: "Choline", amount: "150 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.15 g", dailyValuePercent: 6 }
      ],
      healthBenefits: [
        "Excellent layer – 250-300 eggs/year",
        "Rich in omega-3 – good for heart",
        "Supports brain health – choline",
        "Boosts immunity – selenium and B12",
        "Strong bones – vitamin D",
        "Eye health – vitamin A",
        "Muscle building – protein",
        "Energy"
      ]
    },
    "Pekin": {
      productType: "both",
      nutrients: [
        { name: "Protein (meat)", amount: "24 g", dailyValuePercent: 48 },
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Vitamin D", amount: "95 IU", dailyValuePercent: 16 },
        { name: "Vitamin B12", amount: "1.15 µg", dailyValuePercent: 48 },
        { name: "Selenium", amount: "33 µg", dailyValuePercent: 60 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 },
        { name: "Choline", amount: "148 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.14 g", dailyValuePercent: 6 }
      ],
      healthBenefits: [
        "Popular meat duck",
        "Nutrient-rich meat and eggs",
        "Immunity support",
        "Brain health – choline",
        "Bone health – vitamin D",
        "Muscle building",
        "Heart health",
        "Energy"
      ]
    },
    "Rouen": {
      productType: "both",
      nutrients: [
        { name: "Protein (meat)", amount: "24.5 g", dailyValuePercent: 49 },
        { name: "Protein (egg)", amount: "12.6 g", dailyValuePercent: 25 },
        { name: "Vitamin D", amount: "96 IU", dailyValuePercent: 16 },
        { name: "Vitamin B12", amount: "1.18 µg", dailyValuePercent: 49 },
        { name: "Selenium", amount: "34 µg", dailyValuePercent: 62 },
        { name: "Iron", amount: "1.95 mg", dailyValuePercent: 11 },
        { name: "Choline", amount: "149 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.14 g", dailyValuePercent: 6 }
      ],
      healthBenefits: [
        "Dual-purpose duck",
        "Nutrient-rich",
        "Immunity",
        "Brain health",
        "Bone health",
        "Muscle building",
        "Heart health",
        "Energy"
      ]
    },
    "Muscovy": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "27 g", dailyValuePercent: 54 },
        { name: "Niacin", amount: "9 mg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.55 mg", dailyValuePercent: 32 },
        { name: "Selenium", amount: "24 µg", dailyValuePercent: 44 },
        { name: "Phosphorus", amount: "190 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "2.8 mg", dailyValuePercent: 25 },
        { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.38 µg", dailyValuePercent: 16 }
      ],
      healthBenefits: [
        "Lean, gamey meat – low fat",
        "High protein",
        "Immunity support – selenium and zinc",
        "Bone health – phosphorus",
        "Metabolism – B vitamins",
        "Weight management",
        "Energy",
        "Good for free-range"
      ]
    },
    "Indian Runner": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin A", amount: "165 µg", dailyValuePercent: 18 },
        { name: "Vitamin D", amount: "105 IU", dailyValuePercent: 18 },
        { name: "Vitamin B12", amount: "1.25 µg", dailyValuePercent: 52 },
        { name: "Iron", amount: "2.2 mg", dailyValuePercent: 12 },
        { name: "Selenium", amount: "36 µg", dailyValuePercent: 65 },
        { name: "Choline", amount: "152 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.16 g", dailyValuePercent: 7 }
      ],
      healthBenefits: [
        "Excellent layer – 200-250 eggs/year",
        "Rich in omega-3",
        "Brain health",
        "Immunity",
        "Bone health",
        "Eye health",
        "Muscle building",
        "Energy"
      ]
    },
    "Local Duck": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.4 g", dailyValuePercent: 25 },
        { name: "Vitamin A", amount: "155 µg", dailyValuePercent: 17 },
        { name: "Vitamin D", amount: "90 IU", dailyValuePercent: 15 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Iron", amount: "1.85 mg", dailyValuePercent: 10 },
        { name: "Selenium", amount: "31 µg", dailyValuePercent: 56 },
        { name: "Choline", amount: "146 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.12 g", dailyValuePercent: 5 }
      ],
      healthBenefits: [
        "Local hardy duck",
        "Nutrient-rich eggs and meat",
        "Immunity",
        "Brain health",
        "Bone health",
        "Family nutrition",
        "Energy",
        "Good for smallholders"
      ]
    },
    "Other": {
      productType: "both",
      nutrients: [
        { name: "Protein", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Vitamin D", amount: "95 IU", dailyValuePercent: 16 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Selenium", amount: "33 µg", dailyValuePercent: 60 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "46 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "Unknown duck breed",
        "Good nutrition",
        "Immunity",
        "Brain health",
        "Bone health",
        "Energy",
        "Consult local extension"
      ]
    }
  },

  // ==================== GEESE ====================
  goose: {
    "African Grey": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "25 g", dailyValuePercent: 50 },
        { name: "Niacin", amount: "8.5 mg", dailyValuePercent: 53 },
        { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 29 },
        { name: "Selenium", amount: "22 µg", dailyValuePercent: 40 },
        { name: "Phosphorus", amount: "180 mg", dailyValuePercent: 14 },
        { name: "Zinc", amount: "2.5 mg", dailyValuePercent: 23 },
        { name: "Iron", amount: "1.4 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.35 µg", dailyValuePercent: 15 }
      ],
      healthBenefits: [
        "Lean meat – good for heart",
        "High protein – muscle building",
        "Immunity – selenium and zinc",
        "Bone health",
        "Metabolism – B vitamins",
        "Weight management",
        "Energy",
        "Great flavour"
      ]
    },
    "Toulouse": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "25.5 g", dailyValuePercent: 51 },
        { name: "Niacin", amount: "8.8 mg", dailyValuePercent: 55 },
        { name: "Vitamin B6", amount: "0.52 mg", dailyValuePercent: 31 },
        { name: "Selenium", amount: "22.5 µg", dailyValuePercent: 41 },
        { name: "Phosphorus", amount: "185 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "2.6 mg", dailyValuePercent: 24 },
        { name: "Iron", amount: "1.45 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.36 µg", dailyValuePercent: 15 }
      ],
      healthBenefits: [
        "Heavy breed for meat",
        "High protein",
        "Immunity",
        "Bone health",
        "Metabolism",
        "Weight management",
        "Energy",
        "Great for roasting"
      ]
    },
    "Embden": {
      productType: "meat",
      nutrients: [
        { name: "Protein", amount: "26 g", dailyValuePercent: 52 },
        { name: "Niacin", amount: "9 mg", dailyValuePercent: 56 },
        { name: "Vitamin B6", amount: "0.55 mg", dailyValuePercent: 32 },
        { name: "Selenium", amount: "23 µg", dailyValuePercent: 42 },
        { name: "Phosphorus", amount: "190 mg", dailyValuePercent: 15 },
        { name: "Zinc", amount: "2.7 mg", dailyValuePercent: 25 },
        { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
        { name: "Vitamin B12", amount: "0.38 µg", dailyValuePercent: 16 }
      ],
      healthBenefits: [
        "Large white goose",
        "High protein",
        "Immunity",
        "Bone health",
        "Metabolism",
        "Weight management",
        "Energy",
        "Great for meat production"
      ]
    },
    "Chinese": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Protein (meat)", amount: "24 g", dailyValuePercent: 48 },
        { name: "Vitamin D", amount: "100 IU", dailyValuePercent: 17 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Selenium", amount: "34 µg", dailyValuePercent: 62 },
        { name: "Iron", amount: "1.9 mg", dailyValuePercent: 11 },
        { name: "Choline", amount: "148 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.14 g", dailyValuePercent: 6 }
      ],
      healthBenefits: [
        "Dual-purpose goose",
        "Nutrient-rich eggs and meat",
        "Immunity",
        "Brain health",
        "Bone health",
        "Muscle building",
        "Heart health",
        "Energy"
      ]
    },
    "Local Goose": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Protein (meat)", amount: "24.5 g", dailyValuePercent: 49 },
        { name: "Vitamin D", amount: "95 IU", dailyValuePercent: 16 },
        { name: "Vitamin B12", amount: "1.15 µg", dailyValuePercent: 48 },
        { name: "Selenium", amount: "32 µg", dailyValuePercent: 58 },
        { name: "Iron", amount: "1.85 mg", dailyValuePercent: 10 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 }
      ],
      healthBenefits: [
        "Hardy local goose",
        "Nutrient-rich",
        "Immunity",
        "Brain health",
        "Bone health",
        "Family nutrition",
        "Energy",
        "Good for smallholders"
      ]
    },
    "Other": {
      productType: "both",
      nutrients: [
        { name: "Protein", amount: "25 g", dailyValuePercent: 50 },
        { name: "Vitamin D", amount: "95 IU", dailyValuePercent: 16 },
        { name: "Vitamin B12", amount: "1.1 µg", dailyValuePercent: 46 },
        { name: "Selenium", amount: "33 µg", dailyValuePercent: 60 },
        { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
        { name: "Choline", amount: "147 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.13 g", dailyValuePercent: 5 },
        { name: "Folate", amount: "46 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "Unknown goose breed",
        "Good nutrition",
        "Immunity",
        "Brain health",
        "Bone health",
        "Energy",
        "Consult local extension"
      ]
    }
  },

  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin A", amount: "170 µg", dailyValuePercent: 19 },
        { name: "Vitamin D", amount: "110 IU", dailyValuePercent: 18 },
        { name: "Vitamin B12", amount: "1.3 µg", dailyValuePercent: 54 },
        { name: "Iron", amount: "2.3 mg", dailyValuePercent: 13 },
        { name: "Selenium", amount: "38 µg", dailyValuePercent: 69 },
        { name: "Choline", amount: "155 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.18 g", dailyValuePercent: 7 }
      ],
      healthBenefits: [
        "Nutrient-dense eggs – small but powerful",
        "Rich in omega-3 – heart health",
        "Supports brain health – choline and B12",
        "Boosts immunity – selenium",
        "Strong bones – vitamin D",
        "Eye health – vitamin A",
        "Energy",
        "Good for weight management"
      ]
    },
    "Coturnix Quail": {
      productType: "eggs",
      nutrients: [
        { name: "Protein (egg)", amount: "13.2 g", dailyValuePercent: 26 },
        { name: "Vitamin A", amount: "175 µg", dailyValuePercent: 19 },
        { name: "Vitamin D", amount: "112 IU", dailyValuePercent: 19 },
        { name: "Vitamin B12", amount: "1.35 µg", dailyValuePercent: 56 },
        { name: "Iron", amount: "2.35 mg", dailyValuePercent: 13 },
        { name: "Selenium", amount: "39 µg", dailyValuePercent: 71 },
        { name: "Choline", amount: "158 mg", dailyValuePercent: 29 },
        { name: "Omega-3", amount: "0.19 g", dailyValuePercent: 8 }
      ],
      healthBenefits: [
        "High egg production",
        "Nutrient-dense",
        "Heart health",
        "Brain health",
        "Immunity",
        "Bone health",
        "Eye health",
        "Energy"
      ]
    },
    "Bobwhite Quail": {
      productType: "both",
      nutrients: [
        { name: "Protein (egg)", amount: "12.5 g", dailyValuePercent: 25 },
        { name: "Protein (meat)", amount: "24 g", dailyValuePercent: 48 },
        { name: "Vitamin D", amount: "100 IU", dailyValuePercent: 17 },
        { name: "Vitamin B12", amount: "1.2 µg", dailyValuePercent: 50 },
        { name: "Selenium", amount: "35 µg", dailyValuePercent: 64 },
        { name: "Iron", amount: "2.1 mg", dailyValuePercent: 12 },
        { name: "Choline", amount: "150 mg", dailyValuePercent: 27 },
        { name: "Omega-3", amount: "0.16 g", dailyValuePercent: 7 }
      ],
      healthBenefits: [
        "Dual-purpose quail",
        "Nutrient-rich eggs and meat",
        "Immunity",
        "Brain health",
        "Bone health",
        "Muscle building",
        "Heart health",
        "Energy"
      ]
    },
    "Other": {
      productType: "both",
      nutrients: [
        { name: "Protein", amount: "13 g", dailyValuePercent: 26 },
        { name: "Vitamin D", amount: "105 IU", dailyValuePercent: 18 },
        { name: "Vitamin B12", amount: "1.25 µg", dailyValuePercent: 52 },
        { name: "Selenium", amount: "36 µg", dailyValuePercent: 65 },
        { name: "Iron", amount: "2.2 mg", dailyValuePercent: 12 },
        { name: "Choline", amount: "152 mg", dailyValuePercent: 28 },
        { name: "Omega-3", amount: "0.17 g", dailyValuePercent: 7 },
        { name: "Folate", amount: "48 µg", dailyValuePercent: 12 }
      ],
      healthBenefits: [
        "Unknown quail breed",
        "Good nutrition",
        "Immunity",
        "Brain health",
        "Bone health",
        "Energy",
        "Consult local extension"
      ]
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the nutritional benefits for a specific poultry breed and species.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param breed - The specific breed name
 * @returns PoultryBenefit object or null if not found
 */
export function getPoultryBenefits(
  species: string,
  breed: string
): PoultryBenefit | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryBenefits[speciesKey];
  if (!speciesData) return null;

  const breedData = speciesData[breed];
  if (!breedData) {
    // Try to match partial
    const matchedBreed = Object.keys(speciesData).find(key =>
      breed.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(breed.toLowerCase())
    );
    if (matchedBreed) return speciesData[matchedBreed];
    // Fallback to "Other" or first entry
    if (speciesData["Other"]) return speciesData["Other"];
    const firstBreed = Object.keys(speciesData)[0];
    if (firstBreed) return speciesData[firstBreed];
    return null;
  }
  return breedData;
}

/**
 * Get all breeds for a species with their benefits.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @returns Array of { breed, benefit }
 */
export function getPoultryBreedsWithBenefits(
  species: string
): { breed: string; benefit: PoultryBenefit }[] {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryBenefits[speciesKey];
  if (!speciesData) return [];

  return Object.entries(speciesData).map(([breed, benefit]) => ({
    breed,
    benefit
  }));
}

/**
 * Get the product type for a breed (eggs, meat, or both).
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param breed - The specific breed name
 * @returns "eggs", "meat", "both", or null
 */
export function getPoultryProductType(
  species: string,
  breed: string
): "eggs" | "meat" | "both" | null {
  const benefit = getPoultryBenefits(species, breed);
  return benefit ? benefit.productType : null;
}

export const poultryBenefitsData = poultryBenefits;