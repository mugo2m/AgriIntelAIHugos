// lib/data/cropBenefits.ts

export interface NutrientFact {
  name: string;
  amount: string;
  dailyValuePercent: number;
}

export interface CropBenefit {
  nutrients: NutrientFact[];
  healthBenefits: string[];
}

// ========== NUTRITION & HEALTH BENEFITS DATABASE – SIMPLE EDITION ==========
export const cropBenefits: Record<string, CropBenefit> = {
  // ========== LEAFY GREENS ==========
  kale: {
    nutrients: [
      { name: "Vitamin K", amount: "817 µg", dailyValuePercent: 681 },
      { name: "Vitamin A", amount: "500 µg", dailyValuePercent: 56 },
      { name: "Vitamin C", amount: "120 mg", dailyValuePercent: 133 },
      { name: "Manganese", amount: "0.8 mg", dailyValuePercent: 35 },
      { name: "Copper", amount: "0.3 mg", dailyValuePercent: 33 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Strengthens your bones – vitamin K builds strong, dense bones",
      "Protects your cells – packed with antioxidants that fight damage",
      "Loves your heart – helps lower cholesterol naturally",
      "Calms inflammation – reduces swelling and joint pain",
      "Sharpens your vision – lutein keeps eyes healthy",
      "Boosts your immunity – high vitamin C fights off colds",
      "Detoxifies your body – supports liver cleansing",
      "Helps you feel full – low calorie, high fiber for weight management"
    ]
  },
  spinach: {
    nutrients: [
      { name: "Vitamin K", amount: "483 µg", dailyValuePercent: 403 },
      { name: "Vitamin A", amount: "469 µg", dailyValuePercent: 52 },
      { name: "Folate (B9)", amount: "194 µg", dailyValuePercent: 49 },
      { name: "Manganese", amount: "0.9 mg", dailyValuePercent: 39 },
      { name: "Iron", amount: "2.7 mg", dailyValuePercent: 15 },
      { name: "Magnesium", amount: "79 mg", dailyValuePercent: 20 },
      { name: "Vitamin C", amount: "28 mg", dailyValuePercent: 31 },
      { name: "Calcium", amount: "99 mg", dailyValuePercent: 8 }
    ],
    healthBenefits: [
      "Protects your eyes – lutein and zeaxanthin keep vision clear",
      "Builds strong bones – vitamin K is essential for bone formation",
      "Gently lowers blood pressure – nitrates improve blood flow",
      "Slows down aging – powerful antioxidants protect your skin",
      "Boosts immunity – vitamin C and beta-carotene",
      "Helps prevent anemia – iron plus vitamin C for better absorption",
      "Supports a healthy heart – reduces homocysteine",
      "Gives you glowing skin – vitamin A repairs and renews"
    ]
  },
  lettuce: {
    nutrients: [
      { name: "Vitamin K", amount: "126 µg", dailyValuePercent: 105 },
      { name: "Vitamin A", amount: "370 µg", dailyValuePercent: 41 },
      { name: "Folate (B9)", amount: "136 µg", dailyValuePercent: 34 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Iron", amount: "0.9 mg", dailyValuePercent: 5 },
      { name: "Vitamin C", amount: "9 mg", dailyValuePercent: 10 },
      { name: "Potassium", amount: "194 mg", dailyValuePercent: 4 },
      { name: "Fiber", amount: "1.3 g", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Keeps you hydrated – 95% water, perfect for hot days",
      "Helps you sleep better – lactucarium has mild sedative effects",
      "Supports bone strength – vitamin K helps calcium absorption",
      "Protects your cells – antioxidants fight free radicals",
      "Good for your eyes – beta-carotene supports vision",
      "Helps with weight control – low calories, high volume",
      "Aids digestion – fiber keeps things moving",
      "Lowers homocysteine – folate protects your heart"
    ]
  },
  "collard greens": {
    nutrients: [
      { name: "Vitamin K", amount: "437 µg", dailyValuePercent: 364 },
      { name: "Vitamin A", amount: "251 µg", dailyValuePercent: 28 },
      { name: "Vitamin C", amount: "35 mg", dailyValuePercent: 39 },
      { name: "Folate (B9)", amount: "129 µg", dailyValuePercent: 32 },
      { name: "Calcium", amount: "232 mg", dailyValuePercent: 18 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 8 }
    ],
    healthBenefits: [
      "Builds rock-solid bones – vitamin K activates bone-building proteins",
      "Strengthens your immune system – high vitamin C",
      "Protects your eyes – vitamin A and lutein",
      "Loves your heart – fiber and folate keep it healthy",
      "Fights inflammation – glucosinolates calm your body",
      "Supports digestion – fiber keeps you regular",
      "Balances blood sugar – slows glucose absorption",
      "May help prevent cancer – sulforaphane is a powerful protector"
    ]
  },
  "african nightshade": {
    nutrients: [
      { name: "Vitamin A", amount: "766 µg", dailyValuePercent: 85 },
      { name: "Vitamin C", amount: "80 mg", dailyValuePercent: 89 },
      { name: "Iron", amount: "2.5 mg", dailyValuePercent: 14 },
      { name: "Calcium", amount: "180 mg", dailyValuePercent: 14 },
      { name: "Protein", amount: "2.3 g", dailyValuePercent: 5 },
      { name: "Fiber", amount: "3.5 g", dailyValuePercent: 13 },
      { name: "Potassium", amount: "380 mg", dailyValuePercent: 8 },
      { name: "Magnesium", amount: "70 mg", dailyValuePercent: 17 }
    ],
    healthBenefits: [
      "Boosts your immunity – high vitamin C keeps you healthy",
      "Sharpens your vision – rich in beta-carotene",
      "Strengthens your bones – calcium and vitamin K",
      "Fights anemia – good source of iron",
      "Aids digestion – dietary fiber",
      "Gently lowers blood pressure – potassium balances fluids",
      "Reduces inflammation – traditional healing properties",
      "Protects your cells – phenolic antioxidants"
    ]
  },
  amaranth: {
    nutrients: [
      { name: "Vitamin K", amount: "1140 µg", dailyValuePercent: 950 },
      { name: "Vitamin A", amount: "292 µg", dailyValuePercent: 32 },
      { name: "Vitamin C", amount: "43 mg", dailyValuePercent: 48 },
      { name: "Calcium", amount: "215 mg", dailyValuePercent: 17 },
      { name: "Iron", amount: "2.3 mg", dailyValuePercent: 13 },
      { name: "Manganese", amount: "0.9 mg", dailyValuePercent: 39 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Protein", amount: "2.5 g", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Builds incredibly strong bones – extremely high vitamin K",
      "Slows down aging – antioxidants protect every cell",
      "Loves your heart – may help lower cholesterol",
      "Boosts immunity – vitamin C keeps germs away",
      "Protects your vision – vitamin A",
      "Aids digestion – fiber keeps you regular",
      "Helps with weight management – nutrient-dense, low calorie",
      "Prevents anemia – good source of iron"
    ]
  },
  "spider plant": {
    nutrients: [
      { name: "Vitamin A", amount: "500 µg", dailyValuePercent: 56 },
      { name: "Vitamin C", amount: "45 mg", dailyValuePercent: 50 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Protein", amount: "2.8 g", dailyValuePercent: 6 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Potassium", amount: "400 mg", dailyValuePercent: 9 },
      { name: "Magnesium", amount: "60 mg", dailyValuePercent: 14 }
    ],
    healthBenefits: [
      "Sharpens your eyesight – high vitamin A",
      "Boosts your immunity – vitamin C",
      "Strengthens bones – calcium and vitamin K",
      "Prevents anemia – iron",
      "Aids digestion – fiber",
      "Gently lowers blood pressure – potassium",
      "Protects your cells – flavonoids",
      "Helps balance blood sugar"
    ]
  },
  "ethiopian kale": {
    nutrients: [
      { name: "Vitamin A", amount: "400 µg", dailyValuePercent: 44 },
      { name: "Vitamin C", amount: "50 mg", dailyValuePercent: 56 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "2 mg", dailyValuePercent: 11 },
      { name: "Fiber", amount: "3.5 g", dailyValuePercent: 13 },
      { name: "Protein", amount: "2.5 g", dailyValuePercent: 5 },
      { name: "Potassium", amount: "350 mg", dailyValuePercent: 7 },
      { name: "Magnesium", amount: "55 mg", dailyValuePercent: 13 }
    ],
    healthBenefits: [
      "Protects your eyes – vitamin A",
      "Boosts immunity – vitamin C",
      "Strengthens bones – calcium",
      "Aids digestion – fiber",
      "Loves your heart – potassium",
      "Fights anemia – iron",
      "Antioxidant power",
      "Helps with weight control"
    ]
  },
  "pumpkin leaves": {
    nutrients: [
      { name: "Vitamin A", amount: "800 µg", dailyValuePercent: 89 },
      { name: "Vitamin C", amount: "25 mg", dailyValuePercent: 28 },
      { name: "Calcium", amount: "120 mg", dailyValuePercent: 9 },
      { name: "Iron", amount: "3.5 mg", dailyValuePercent: 19 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Magnesium", amount: "50 mg", dailyValuePercent: 12 },
      { name: "Protein", amount: "2 g", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Sharpens vision – vitamin A",
      "Boosts immunity – vitamin C",
      "Prevents anemia – iron",
      "Strengthens bones – calcium",
      "Loves your heart – potassium",
      "Aids digestion – fiber",
      "Antioxidant",
      "Reduces inflammation"
    ]
  },
  "sweet potato leaves": {
    nutrients: [
      { name: "Vitamin A", amount: "787 µg", dailyValuePercent: 87 },
      { name: "Vitamin C", amount: "35 mg", dailyValuePercent: 39 },
      { name: "Vitamin K", amount: "150 µg", dailyValuePercent: 125 },
      { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
      { name: "Calcium", amount: "80 mg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "3 g", dailyValuePercent: 11 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "60 mg", dailyValuePercent: 14 }
    ],
    healthBenefits: [
      "Protects your eyes – vitamin A",
      "Strengthens bones – vitamin K",
      "Boosts immunity – vitamin C",
      "Loves your heart – potassium",
      "Aids digestion – fiber",
      "Antioxidant flavonoids",
      "Gently lowers blood pressure",
      "Helps with weight control"
    ]
  },
  "jute mallow": {
    nutrients: [
      { name: "Vitamin A", amount: "800 µg", dailyValuePercent: 89 },
      { name: "Vitamin C", amount: "40 mg", dailyValuePercent: 44 },
      { name: "Calcium", amount: "180 mg", dailyValuePercent: 14 },
      { name: "Iron", amount: "4 mg", dailyValuePercent: 22 },
      { name: "Fiber", amount: "4.5 g", dailyValuePercent: 16 },
      { name: "Protein", amount: "3 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "250 mg", dailyValuePercent: 5 },
      { name: "Magnesium", amount: "70 mg", dailyValuePercent: 17 }
    ],
    healthBenefits: [
      "Sharpens vision – vitamin A",
      "Boosts immunity – vitamin C",
      "Prevents anemia – iron",
      "Strengthens bones – calcium",
      "Aids digestion – fiber",
      "Loves your heart – potassium",
      "Antioxidant",
      "Reduces inflammation"
    ]
  },
  "swiss chard": {
    nutrients: [
      { name: "Vitamin K", amount: "830 µg", dailyValuePercent: 692 },
      { name: "Vitamin A", amount: "306 µg", dailyValuePercent: 34 },
      { name: "Vitamin C", amount: "30 mg", dailyValuePercent: 33 },
      { name: "Magnesium", amount: "81 mg", dailyValuePercent: 19 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "379 mg", dailyValuePercent: 8 }
    ],
    healthBenefits: [
      "Builds strong bones – high vitamin K",
      "Protects your cells – betalains are powerful antioxidants",
      "Gently lowers blood pressure – potassium",
      "Protects your eyes – lutein",
      "Boosts immunity – vitamin C",
      "Reduces inflammation",
      "Loves your heart – fiber",
      "Detoxifies your body"
    ]
  },
  "mustard greens": {
    nutrients: [
      { name: "Vitamin K", amount: "593 µg", dailyValuePercent: 494 },
      { name: "Vitamin A", amount: "588 µg", dailyValuePercent: 65 },
      { name: "Vitamin C", amount: "70 mg", dailyValuePercent: 78 },
      { name: "Folate", amount: "187 µg", dailyValuePercent: 47 },
      { name: "Calcium", amount: "115 mg", dailyValuePercent: 9 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Fiber", amount: "3.2 g", dailyValuePercent: 11 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Antioxidant power – glucosinolates",
      "Loves your heart – may lower cholesterol",
      "Protects your eyes – vitamin A",
      "Boosts immunity – vitamin C",
      "May help prevent cancer – sulforaphane",
      "Aids digestion – fiber",
      "Detoxifies your body"
    ]
  },
  "bok choy": {
    nutrients: [
      { name: "Vitamin K", amount: "45 µg", dailyValuePercent: 38 },
      { name: "Vitamin A", amount: "243 µg", dailyValuePercent: 27 },
      { name: "Vitamin C", amount: "45 mg", dailyValuePercent: 50 },
      { name: "Calcium", amount: "105 mg", dailyValuePercent: 8 },
      { name: "Folate", amount: "66 µg", dailyValuePercent: 17 },
      { name: "Fiber", amount: "1 g", dailyValuePercent: 4 },
      { name: "Potassium", amount: "252 mg", dailyValuePercent: 5 },
      { name: "Iron", amount: "0.8 mg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Builds strong bones – vitamin K and calcium",
      "Rich in selenium – powerful antioxidant",
      "Boosts immunity – vitamin C",
      "Loves your heart – potassium",
      "Reduces inflammation",
      "Aids digestion – fiber",
      "Protects your eyes – vitamin A",
      "Low calorie – great for weight management"
    ]
  },

  // ========== VEGETABLES ==========
  tomatoes: {
    nutrients: [
      { name: "Vitamin C", amount: "14 mg", dailyValuePercent: 16 },
      { name: "Vitamin A", amount: "42 µg", dailyValuePercent: 5 },
      { name: "Vitamin K", amount: "7.9 µg", dailyValuePercent: 7 },
      { name: "Potassium", amount: "237 mg", dailyValuePercent: 5 },
      { name: "Folate", amount: "15 µg", dailyValuePercent: 4 },
      { name: "Lycopene", amount: "2573 µg", dailyValuePercent: 0 },
      { name: "Fiber", amount: "1.2 g", dailyValuePercent: 4 },
      { name: "Vitamin E", amount: "0.5 mg", dailyValuePercent: 3 }
    ],
    healthBenefits: [
      "Protects your heart – lycopene reduces LDL oxidation",
      "May help prevent prostate cancer – lycopene is a powerful ally for men's health",
      "Slows down skin aging – protects against UV damage",
      "Supports eye health – lutein and zeaxanthin",
      "Strengthens bones – vitamin K",
      "Boosts immunity – vitamin C",
      "Gently lowers blood pressure – potassium",
      "Reduces inflammation"
    ]
  },
  onions: {
    nutrients: [
      { name: "Vitamin C", amount: "7.4 mg", dailyValuePercent: 8 },
      { name: "Folate", amount: "19 µg", dailyValuePercent: 5 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "146 mg", dailyValuePercent: 3 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Fiber", amount: "1.7 g", dailyValuePercent: 6 },
      { name: "Quercetin", amount: "20 mg", dailyValuePercent: 0 },
      { name: "Sulfur compounds", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – quercetin improves blood flow",
      "Balances blood sugar – may lower glucose levels",
      "Protects your bones – reduces oxidative stress",
      "Fights harmful bacteria – natural antibacterial",
      "Supports digestion – prebiotic fiber",
      "May help prevent cancer – sulfur compounds",
      "Boosts immunity – vitamin C",
      "Reduces inflammation"
    ]
  },
  carrots: {
    nutrients: [
      { name: "Vitamin A", amount: "835 µg", dailyValuePercent: 93 },
      { name: "Vitamin K", amount: "13.2 µg", dailyValuePercent: 11 },
      { name: "Vitamin C", amount: "5.9 mg", dailyValuePercent: 7 },
      { name: "Potassium", amount: "320 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "2.8 g", dailyValuePercent: 10 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Beta-carotene", amount: "8285 µg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Sharpens your vision – beta-carotene turns into vitamin A",
      "Boosts immunity – vitamin C and antioxidants",
      "Gives you glowing skin – protects from sun damage",
      "Loves your heart – fiber and potassium",
      "Strengthens bones – vitamin K",
      "Aids digestion – fiber",
      "May help prevent cancer – carotenoids",
      "Balances blood sugar"
    ]
  },
  cabbages: {
    nutrients: [
      { name: "Vitamin K", amount: "76 µg", dailyValuePercent: 63 },
      { name: "Vitamin C", amount: "36 mg", dailyValuePercent: 40 },
      { name: "Folate", amount: "43 µg", dailyValuePercent: 11 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "2.5 g", dailyValuePercent: 9 },
      { name: "Potassium", amount: "170 mg", dailyValuePercent: 4 },
      { name: "Calcium", amount: "40 mg", dailyValuePercent: 3 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Aids digestion – fiber",
      "Loves your heart – may lower cholesterol",
      "Anti-inflammatory – anthocyanins (red cabbage)",
      "Boosts immunity – vitamin C",
      "May help prevent cancer – glucosinolates",
      "Helps with weight control – low calorie",
      "Gently lowers blood pressure – potassium"
    ]
  },
  kales: {
    nutrients: [
      { name: "Vitamin K", amount: "817 µg", dailyValuePercent: 681 },
      { name: "Vitamin A", amount: "500 µg", dailyValuePercent: 56 },
      { name: "Vitamin C", amount: "120 mg", dailyValuePercent: 133 },
      { name: "Manganese", amount: "0.8 mg", dailyValuePercent: 35 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 },
      { name: "Copper", amount: "0.3 mg", dailyValuePercent: 33 }
    ],
    healthBenefits: [
      "Builds incredibly strong bones – extremely high vitamin K",
      "Antioxidant power – rich in flavonoids",
      "Loves your heart – lowers cholesterol",
      "Reduces inflammation",
      "Protects your eyes – lutein",
      "Boosts immunity – vitamin C",
      "Detoxifies your body",
      "Helps with weight control"
    ]
  },
  broccoli: {
    nutrients: [
      { name: "Vitamin K", amount: "101.6 µg", dailyValuePercent: 85 },
      { name: "Vitamin C", amount: "89.2 mg", dailyValuePercent: 99 },
      { name: "Folate", amount: "63 µg", dailyValuePercent: 16 },
      { name: "Fiber", amount: "2.6 g", dailyValuePercent: 9 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 11 },
      { name: "Potassium", amount: "316 mg", dailyValuePercent: 7 },
      { name: "Vitamin A", amount: "31 µg", dailyValuePercent: 3 },
      { name: "Sulforaphane", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "May help prevent cancer – sulforaphane is a powerful protector",
      "Strengthens bones – vitamin K",
      "Boosts immunity – vitamin C",
      "Loves your heart – fiber",
      "Protects your eyes – lutein",
      "Aids digestion – fiber",
      "Detoxifies your body",
      "Reduces inflammation"
    ]
  },
  cauliflower: {
    nutrients: [
      { name: "Vitamin C", amount: "48.2 mg", dailyValuePercent: 54 },
      { name: "Vitamin K", amount: "15.5 µg", dailyValuePercent: 13 },
      { name: "Folate", amount: "57 µg", dailyValuePercent: 14 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 11 },
      { name: "Potassium", amount: "299 mg", dailyValuePercent: 6 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 8 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "May help prevent cancer – sulforaphane",
      "Loves your heart – may lower cholesterol",
      "Aids digestion – fiber",
      "Boosts immunity – vitamin C",
      "Strengthens bones – vitamin K",
      "Reduces inflammation",
      "Helps with weight control – low carb",
      "Supports brain health – choline"
    ]
  },
  capsicums: {
    nutrients: [
      { name: "Vitamin C", amount: "80 mg", dailyValuePercent: 89 },
      { name: "Vitamin A", amount: "157 µg", dailyValuePercent: 17 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Folate", amount: "37 µg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "1.5 g", dailyValuePercent: 5 },
      { name: "Potassium", amount: "175 mg", dailyValuePercent: 4 },
      { name: "Vitamin E", amount: "1.6 mg", dailyValuePercent: 11 },
      { name: "Capsanthin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Protects your eyes – carotenoids",
      "Boosts immunity – high vitamin C",
      "Loves your heart – potassium",
      "Reduces inflammation",
      "Gives you glowing skin – vitamin C for collagen",
      "May help prevent cancer – antioxidants",
      "Helps with weight control – low calorie",
      "Helps prevent anemia – vitamin C boosts iron absorption"
    ]
  },
  chillies: {
    nutrients: [
      { name: "Vitamin C", amount: "144 mg", dailyValuePercent: 160 },
      { name: "Vitamin A", amount: "59 µg", dailyValuePercent: 7 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Fiber", amount: "1.5 g", dailyValuePercent: 5 },
      { name: "Potassium", amount: "322 mg", dailyValuePercent: 7 },
      { name: "Capsaicin", amount: "varies", dailyValuePercent: 0 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Magnesium", amount: "23 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Relieves pain – capsaicin reduces substance P",
      "Ignites your metabolism – increases thermogenesis",
      "Loves your heart – may lower blood pressure",
      "Boosts immunity – vitamin C",
      "Reduces inflammation",
      "Aids digestion – stimulates gastric juices",
      "Helps with weight control – suppresses appetite",
      "May help prevent cancer – capsaicin"
    ]
  },
  brinjals: {
    nutrients: [
      { name: "Fiber", amount: "3 g", dailyValuePercent: 11 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 11 },
      { name: "Folate", amount: "22 µg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "229 mg", dailyValuePercent: 5 },
      { name: "Vitamin K", amount: "3.5 µg", dailyValuePercent: 3 },
      { name: "Vitamin C", amount: "2.2 mg", dailyValuePercent: 2 },
      { name: "Nasunin", amount: "varies", dailyValuePercent: 0 },
      { name: "Chlorogenic acid", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Protects your brain – nasunin guards cell membranes",
      "Loves your heart – may lower LDL cholesterol",
      "Balances blood sugar – fiber",
      "Helps with weight control – low calorie",
      "Aids digestion – fiber",
      "Antioxidant – anthocyanins",
      "Reduces inflammation",
      "Strengthens bones – manganese"
    ]
  },
  "french beans": {
    nutrients: [
      { name: "Vitamin K", amount: "14.4 µg", dailyValuePercent: 12 },
      { name: "Vitamin C", amount: "12.2 mg", dailyValuePercent: 14 },
      { name: "Folate", amount: "33 µg", dailyValuePercent: 8 },
      { name: "Fiber", amount: "2.7 g", dailyValuePercent: 10 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "209 mg", dailyValuePercent: 4 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Magnesium", amount: "25 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Loves your heart – fiber",
      "Aids digestion – fiber",
      "Boosts immunity – vitamin C",
      "Balances blood sugar",
      "Helps with weight control",
      "Prevents anemia – iron",
      "Antioxidant"
    ]
  },
  "garden peas": {
    nutrients: [
      { name: "Fiber", amount: "5.7 g", dailyValuePercent: 20 },
      { name: "Vitamin K", amount: "24.8 µg", dailyValuePercent: 21 },
      { name: "Vitamin C", amount: "40 mg", dailyValuePercent: 44 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Folate", amount: "65 µg", dailyValuePercent: 16 },
      { name: "Thiamin", amount: "0.3 mg", dailyValuePercent: 22 },
      { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
      { name: "Protein", amount: "5.4 g", dailyValuePercent: 11 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Loves your heart – may lower cholesterol",
      "Balances blood sugar",
      "Strengthens bones – vitamin K",
      "Boosts immunity – vitamin C",
      "Helps with weight control – protein and fiber",
      "Prevents anemia – iron",
      "Protects your eyes – lutein"
    ]
  },
  okra: {
    nutrients: [
      { name: "Vitamin K", amount: "31.3 µg", dailyValuePercent: 26 },
      { name: "Vitamin C", amount: "23 mg", dailyValuePercent: 26 },
      { name: "Folate", amount: "60 µg", dailyValuePercent: 15 },
      { name: "Fiber", amount: "3.2 g", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "57 mg", dailyValuePercent: 14 },
      { name: "Manganese", amount: "0.8 mg", dailyValuePercent: 35 },
      { name: "Potassium", amount: "299 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 11 }
    ],
    healthBenefits: [
      "Balances blood sugar – soluble fiber",
      "Soothes digestion – mucilage calms the gut",
      "Loves your heart – may lower cholesterol",
      "Strengthens bones – vitamin K",
      "Boosts immunity – vitamin C",
      "Great for pregnancy – high folate",
      "Helps with weight control – low calorie",
      "Antioxidant – protects cells from damage, slows aging, reduces inflammation"
    ]
  },
  "sweet potatoes": {
    nutrients: [
      { name: "Vitamin A", amount: "961 µg", dailyValuePercent: 107 },
      { name: "Vitamin C", amount: "2.4 mg", dailyValuePercent: 3 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Fiber", amount: "3 g", dailyValuePercent: 11 },
      { name: "Potassium", amount: "337 mg", dailyValuePercent: 7 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 18 },
      { name: "Magnesium", amount: "25 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Protects your eyes – high beta-carotene",
      "Boosts immunity – vitamin A and C",
      "Aids digestion – fiber",
      "Balances blood sugar – slower digestion than white potatoes",
      "Loves your heart – potassium",
      "Supports brain health – vitamin B6",
      "Gives you glowing skin – vitamin C for collagen",
      "Reduces inflammation"
    ]
  },
  "irish potatoes": {
    nutrients: [
      { name: "Vitamin C", amount: "19.7 mg", dailyValuePercent: 22 },
      { name: "Potassium", amount: "421 mg", dailyValuePercent: 9 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 17 },
      { name: "Fiber", amount: "2.2 g", dailyValuePercent: 8 },
      { name: "Iron", amount: "0.8 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "23 mg", dailyValuePercent: 5 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Folate", amount: "15 µg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Gently lowers blood pressure – high potassium",
      "Aids digestion – resistant starch (when cooled)",
      "Loves your heart – may lower cholesterol",
      "Boosts immunity – vitamin C",
      "Gives you energy – complex carbohydrates",
      "Strengthens bones – iron and magnesium",
      "Helps with weight control – satiety",
      "Antioxidant – flavonoids"
    ]
  },
  cassava: {
    nutrients: [
      { name: "Vitamin C", amount: "20.6 mg", dailyValuePercent: 23 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 10 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "271 mg", dailyValuePercent: 6 },
      { name: "Magnesium", amount: "21 mg", dailyValuePercent: 5 },
      { name: "Iron", amount: "0.3 mg", dailyValuePercent: 2 },
      { name: "Carbohydrates", amount: "38 g", dailyValuePercent: 14 }
    ],
    healthBenefits: [
      "Gives you energy – high carbohydrate",
      "Aids digestion – resistant starch",
      "Helps with weight control – satiety",
      "Gluten-free – great for celiacs",
      "Boosts immunity – vitamin C",
      "Strengthens bones – magnesium",
      "Loves your heart – potassium",
      "Antioxidant – phenolic compounds"
    ]
  },
  yams: {
    nutrients: [
      { name: "Vitamin C", amount: "17.1 mg", dailyValuePercent: 19 },
      { name: "Potassium", amount: "816 mg", dailyValuePercent: 17 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Fiber", amount: "4.1 g", dailyValuePercent: 15 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 17 },
      { name: "Magnesium", amount: "21 mg", dailyValuePercent: 5 },
      { name: "Thiamin", amount: "0.1 mg", dailyValuePercent: 9 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 18 }
    ],
    healthBenefits: [
      "Supports brain health – vitamin B6",
      "Loves your heart – potassium",
      "Aids digestion – fiber",
      "Balances blood sugar",
      "Helps hormone balance – diosgenin",
      "Reduces inflammation",
      "Gives you energy – complex carbs",
      "Strengthens bones – manganese"
    ]
  },
  taro: {
    nutrients: [
      { name: "Fiber", amount: "4.1 g", dailyValuePercent: 15 },
      { name: "Vitamin E", amount: "2.4 mg", dailyValuePercent: 16 },
      { name: "Potassium", amount: "484 mg", dailyValuePercent: 10 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 17 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 16 },
      { name: "Magnesium", amount: "33 mg", dailyValuePercent: 8 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 17 },
      { name: "Vitamin C", amount: "4.5 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Aids digestion – resistant starch",
      "Loves your heart – potassium",
      "Balances blood sugar",
      "Antioxidant – vitamin E",
      "Strengthens bones – manganese",
      "Gluten-free",
      "Gives you energy – carbohydrates",
      "Boosts immunity – vitamin C"
    ]
  },
  ginger: {
    nutrients: [
      { name: "Gingerol", amount: "varies", dailyValuePercent: 0 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 10 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "415 mg", dailyValuePercent: 9 },
      { name: "Magnesium", amount: "43 mg", dailyValuePercent: 10 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 10 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 }
    ],
    healthBenefits: [
      "Eases nausea – great for morning sickness and motion sickness",
      "Reduces inflammation – gingerol is a powerful anti-inflammatory",
      "Relieves pain – muscle soreness and osteoarthritis",
      "Aids digestion – speeds up gastric emptying",
      "Loves your heart – may lower blood pressure",
      "Fights germs – antimicrobial",
      "Balances blood sugar",
      "Eases menstrual pain – reduces prostaglandins"
    ]
  },
  turmeric: {
    nutrients: [
      { name: "Curcumin", amount: "varies", dailyValuePercent: 0 },
      { name: "Manganese", amount: "7.8 mg", dailyValuePercent: 339 },
      { name: "Iron", amount: "41.4 mg", dailyValuePercent: 230 },
      { name: "Fiber", amount: "22.7 g", dailyValuePercent: 81 },
      { name: "Potassium", amount: "2080 mg", dailyValuePercent: 44 },
      { name: "Vitamin B6", amount: "1.8 mg", dailyValuePercent: 106 },
      { name: "Magnesium", amount: "193 mg", dailyValuePercent: 46 },
      { name: "Copper", amount: "0.6 mg", dailyValuePercent: 67 }
    ],
    healthBenefits: [
      "Reduces inflammation – curcumin is nature's anti-inflammatory",
      "Protects your cells – powerful antioxidant",
      "Supports brain health – may increase BDNF",
      "Loves your heart – improves endothelial function",
      "Eases arthritis – reduces symptoms",
      "Lifts your mood – may boost serotonin",
      "May help prevent cancer – inhibits tumor growth",
      "Fights viruses – immune support"
    ]
  },
  garlic: {
    nutrients: [
      { name: "Allicin", amount: "varies", dailyValuePercent: 0 },
      { name: "Manganese", amount: "1.7 mg", dailyValuePercent: 74 },
      { name: "Vitamin B6", amount: "1.2 mg", dailyValuePercent: 72 },
      { name: "Vitamin C", amount: "31.2 mg", dailyValuePercent: 35 },
      { name: "Selenium", amount: "14.2 µg", dailyValuePercent: 20 },
      { name: "Fiber", amount: "2.1 g", dailyValuePercent: 8 },
      { name: "Calcium", amount: "181 mg", dailyValuePercent: 14 },
      { name: "Iron", amount: "1.7 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Boosts immunity – reduces cold severity",
      "Loves your heart – lowers blood pressure",
      "Lowers cholesterol – reduces LDL",
      "Fights bacteria – allicin is a natural antibiotic",
      "May help prevent cancer – organosulfur compounds",
      "Detoxifies your body – supports liver health",
      "Strengthens bones – may increase estrogen",
      "Boosts athletic performance – reduces fatigue"
    ]
  },
  shallots: {
    nutrients: [
      { name: "Vitamin C", amount: "8 mg", dailyValuePercent: 9 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 20 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Folate", amount: "34 µg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "334 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "3.2 g", dailyValuePercent: 11 },
      { name: "Iron", amount: "1.2 mg", dailyValuePercent: 7 },
      { name: "Quercetin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – quercetin",
      "Balances blood sugar",
      "Antioxidant",
      "Boosts immunity",
      "Supports digestion – prebiotic",
      "Reduces inflammation",
      "Strengthens bones",
      "Antibacterial"
    ]
  },
  chives: {
    nutrients: [
      { name: "Vitamin K", amount: "212.7 µg", dailyValuePercent: 177 },
      { name: "Vitamin C", amount: "58.1 mg", dailyValuePercent: 65 },
      { name: "Vitamin A", amount: "218 µg", dailyValuePercent: 24 },
      { name: "Folate", amount: "105 µg", dailyValuePercent: 26 },
      { name: "Fiber", amount: "2.5 g", dailyValuePercent: 9 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 },
      { name: "Calcium", amount: "92 mg", dailyValuePercent: 7 }
    ],
    healthBenefits: [
      "Strengthens bones – high vitamin K",
      "Boosts immunity – vitamin C",
      "Protects your eyes – vitamin A",
      "Loves your heart – folate",
      "Aids digestion – fiber",
      "Antibacterial – allicin",
      "Reduces inflammation",
      "Helps you sleep – mild sedative"
    ]
  },
  "leek": {
    nutrients: [
      { name: "Vitamin K", amount: "47 µg", dailyValuePercent: 39 },
      { name: "Vitamin A", amount: "83 µg", dailyValuePercent: 9 },
      { name: "Vitamin C", amount: "12 mg", dailyValuePercent: 13 },
      { name: "Folate", amount: "64 µg", dailyValuePercent: 16 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Iron", amount: "2.1 mg", dailyValuePercent: 12 },
      { name: "Potassium", amount: "180 mg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Loves your heart – may lower cholesterol",
      "Supports digestion – prebiotic inulin",
      "Boosts immunity – vitamin C",
      "Antioxidant – kaempferol",
      "Gently lowers blood pressure – potassium",
      "May help prevent cancer – sulfur compounds",
      "Helps with weight control – low calorie"
    ]
  },
  celery: {
    nutrients: [
      { name: "Vitamin K", amount: "29.3 µg", dailyValuePercent: 24 },
      { name: "Folate", amount: "36 µg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "260 mg", dailyValuePercent: 6 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Vitamin A", amount: "22 µg", dailyValuePercent: 2 },
      { name: "Vitamin C", amount: "3.1 mg", dailyValuePercent: 3 },
      { name: "Luteolin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Reduces inflammation – luteolin",
      "Gently lowers blood pressure – phthalides",
      "Aids digestion – fiber",
      "Keeps you hydrated – high water content",
      "Loves your heart – potassium",
      "Helps with weight control – low calorie",
      "Strengthens bones – vitamin K",
      "Antioxidant"
    ]
  },
  "asparagus": {
    nutrients: [
      { name: "Vitamin K", amount: "41.6 µg", dailyValuePercent: 35 },
      { name: "Folate", amount: "52 µg", dailyValuePercent: 13 },
      { name: "Vitamin A", amount: "38 µg", dailyValuePercent: 4 },
      { name: "Vitamin C", amount: "5.6 mg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "2.1 g", dailyValuePercent: 8 },
      { name: "Iron", amount: "2.1 mg", dailyValuePercent: 12 },
      { name: "Potassium", amount: "202 mg", dailyValuePercent: 4 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 8 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Great for pregnancy – high folate",
      "Aids digestion – inulin",
      "Helps hangovers – speeds alcohol metabolism",
      "Loves your heart – may lower blood pressure",
      "Antioxidant – glutathione",
      "Helps with weight control – low calorie",
      "Reduces water retention – natural diuretic"
    ]
  },
  "artichoke": {
    nutrients: [
      { name: "Fiber", amount: "5.4 g", dailyValuePercent: 19 },
      { name: "Vitamin K", amount: "14.8 µg", dailyValuePercent: 12 },
      { name: "Folate", amount: "68 µg", dailyValuePercent: 17 },
      { name: "Vitamin C", amount: "7.4 mg", dailyValuePercent: 8 },
      { name: "Magnesium", amount: "60 mg", dailyValuePercent: 14 },
      { name: "Potassium", amount: "370 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Cynarin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your liver – cynarin stimulates bile production",
      "Aids digestion – high fiber",
      "Lowers cholesterol – may reduce LDL",
      "Loves your heart – potassium",
      "Antioxidant – silymarin",
      "Balances blood sugar",
      "Helps with weight control – fiber",
      "Reduces inflammation"
    ]
  },
  rhubarb: {
    nutrients: [
      { name: "Vitamin K", amount: "29.3 µg", dailyValuePercent: 24 },
      { name: "Vitamin C", amount: "8 mg", dailyValuePercent: 9 },
      { name: "Calcium", amount: "86 mg", dailyValuePercent: 7 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "288 mg", dailyValuePercent: 6 },
      { name: "Lutein", amount: "varies", dailyValuePercent: 0 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Aids digestion – natural laxative (high fiber)",
      "Antioxidant – anthocyanins",
      "Loves your heart – may reduce cholesterol",
      "Protects your eyes – lutein",
      "Reduces inflammation",
      "Helps with weight control – low calorie",
      "Balances blood sugar"
    ]
  },
  "watercress": {
    nutrients: [
      { name: "Vitamin K", amount: "250 µg", dailyValuePercent: 208 },
      { name: "Vitamin C", amount: "43 mg", dailyValuePercent: 48 },
      { name: "Vitamin A", amount: "160 µg", dailyValuePercent: 18 },
      { name: "Calcium", amount: "120 mg", dailyValuePercent: 9 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "0.7 g", dailyValuePercent: 3 },
      { name: "Iron", amount: "0.2 mg", dailyValuePercent: 1 },
      { name: "PEITC", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "May help prevent cancer – PEITC",
      "Strengthens bones – vitamin K",
      "Protects your eyes – lutein",
      "Boosts immunity – vitamin C",
      "Loves your heart – may lower blood pressure",
      "Antioxidant – flavonoids",
      "Reduces inflammation",
      "Gives you glowing skin – vitamin A"
    ]
  },
  "arugula": {
    nutrients: [
      { name: "Vitamin K", amount: "108.6 µg", dailyValuePercent: 91 },
      { name: "Vitamin A", amount: "119 µg", dailyValuePercent: 13 },
      { name: "Vitamin C", amount: "15 mg", dailyValuePercent: 17 },
      { name: "Folate", amount: "97 µg", dailyValuePercent: 24 },
      { name: "Calcium", amount: "160 mg", dailyValuePercent: 12 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Potassium", amount: "369 mg", dailyValuePercent: 8 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "May help prevent cancer – glucosinolates",
      "Protects your eyes – carotenoids",
      "Loves your heart – folate",
      "Boosts immunity – vitamin C",
      "Helps with weight control – low calorie",
      "Aids digestion – fiber",
      "Antioxidant"
    ]
  },
  "radicchio": {
    nutrients: [
      { name: "Vitamin K", amount: "255 µg", dailyValuePercent: 213 },
      { name: "Vitamin C", amount: "8 mg", dailyValuePercent: 9 },
      { name: "Folate", amount: "60 µg", dailyValuePercent: 15 },
      { name: "Fiber", amount: "0.9 g", dailyValuePercent: 3 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "302 mg", dailyValuePercent: 6 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 },
      { name: "Intybin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Stimulates appetite – intybin",
      "Loves your heart – anthocyanins",
      "Antioxidant – polyphenols",
      "Supports liver health – may help detox",
      "Reduces inflammation",
      "Helps with weight control – low calorie",
      "Balances blood sugar"
    ]
  },
  "escarole": {
    nutrients: [
      { name: "Vitamin K", amount: "231 µg", dailyValuePercent: 193 },
      { name: "Vitamin A", amount: "130 µg", dailyValuePercent: 14 },
      { name: "Folate", amount: "142 µg", dailyValuePercent: 36 },
      { name: "Fiber", amount: "3.1 g", dailyValuePercent: 11 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 },
      { name: "Potassium", amount: "314 mg", dailyValuePercent: 7 },
      { name: "Vitamin C", amount: "6.5 mg", dailyValuePercent: 7 },
      { name: "Calcium", amount: "52 mg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Protects your eyes – vitamin A",
      "Loves your heart – folate",
      "Aids digestion – fiber",
      "Boosts immunity – vitamin C",
      "Helps with weight control – low calorie",
      "Antioxidant",
      "Gently lowers blood pressure – potassium"
    ]
  },
  "frisee": {
    nutrients: [
      { name: "Vitamin K", amount: "231 µg", dailyValuePercent: 193 },
      { name: "Vitamin A", amount: "130 µg", dailyValuePercent: 14 },
      { name: "Folate", amount: "142 µg", dailyValuePercent: 36 },
      { name: "Fiber", amount: "3.1 g", dailyValuePercent: 11 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 },
      { name: "Potassium", amount: "314 mg", dailyValuePercent: 7 },
      { name: "Vitamin C", amount: "6.5 mg", dailyValuePercent: 7 },
      { name: "Calcium", amount: "52 mg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Strengthens bones – vitamin K",
      "Protects your eyes – vitamin A",
      "Loves your heart – folate",
      "Aids digestion – fiber",
      "Boosts immunity – vitamin C",
      "Helps with weight control – low calorie",
      "Antioxidant",
      "Gently lowers blood pressure – potassium"
    ]
  },
  "turnip greens": {
    nutrients: [
      { name: "Vitamin K", amount: "368 µg", dailyValuePercent: 307 },
      { name: "Vitamin A", amount: "579 µg", dailyValuePercent: 64 },
      { name: "Vitamin C", amount: "60 mg", dailyValuePercent: 67 },
      { name: "Folate", amount: "194 µg", dailyValuePercent: 49 },
      { name: "Calcium", amount: "190 mg", dailyValuePercent: 15 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 19 },
      { name: "Fiber", amount: "3.2 g", dailyValuePercent: 11 },
      { name: "Iron", amount: "1.1 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Strengthens bones – high vitamin K",
      "Protects your eyes – vitamin A",
      "Boosts immunity – vitamin C",
      "Loves your heart – folate",
      "Aids digestion – fiber",
      "Prevents anemia – iron",
      "Antioxidant",
      "Helps with weight control"
    ]
  },
  "courgettes": {
    nutrients: [
      { name: "Vitamin C", amount: "17.9 mg", dailyValuePercent: 20 },
      { name: "Vitamin A", amount: "10 µg", dailyValuePercent: 1 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "1 g", dailyValuePercent: 4 },
      { name: "Potassium", amount: "261 mg", dailyValuePercent: 6 },
      { name: "Folate", amount: "24 µg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Lutein", amount: "2125 µg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Protects your eyes – lutein",
      "Aids digestion – fiber",
      "Loves your heart – potassium",
      "Helps with weight control – low calorie",
      "Boosts immunity – vitamin C",
      "Strengthens bones – manganese",
      "Keeps you hydrated – high water content",
      "Antioxidant"
    ]
  },
  cucumbers: {
    nutrients: [
      { name: "Vitamin K", amount: "16.4 µg", dailyValuePercent: 14 },
      { name: "Vitamin C", amount: "2.8 mg", dailyValuePercent: 3 },
      { name: "Potassium", amount: "147 mg", dailyValuePercent: 3 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 4 },
      { name: "Fiber", amount: "0.5 g", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "13 mg", dailyValuePercent: 3 },
      { name: "Vitamin A", amount: "5 µg", dailyValuePercent: 1 },
      { name: "Silica", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Keeps you hydrated – 96% water",
      "Gives you glowing skin – silica for collagen",
      "Strengthens bones – vitamin K",
      "Helps with weight control – low calorie",
      "Aids digestion – fiber",
      "Antioxidant – flavonoids",
      "Loves your heart – potassium",
      "Reduces inflammation"
    ]
  },
  pumpkin: {
    nutrients: [
      { name: "Vitamin A", amount: "426 µg", dailyValuePercent: 47 },
      { name: "Vitamin C", amount: "9 mg", dailyValuePercent: 10 },
      { name: "Vitamin E", amount: "1.1 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "0.5 g", dailyValuePercent: 2 },
      { name: "Potassium", amount: "340 mg", dailyValuePercent: 7 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Lutein", amount: "1500 µg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Protects your eyes – vitamin A and lutein",
      "Boosts immunity – vitamin C",
      "Loves your heart – potassium",
      "Gives you glowing skin – vitamin E",
      "Helps with weight control – low calorie",
      "Antioxidant – beta-carotene",
      "Aids digestion – fiber",
      "May help prevent cancer – carotenoids"
    ]
  },
  watermelons: {
    nutrients: [
      { name: "Vitamin C", amount: "8.1 mg", dailyValuePercent: 9 },
      { name: "Vitamin A", amount: "28 µg", dailyValuePercent: 3 },
      { name: "Potassium", amount: "112 mg", dailyValuePercent: 2 },
      { name: "Lycopene", amount: "4532 µg", dailyValuePercent: 0 },
      { name: "Citrulline", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin B5", amount: "0.2 mg", dailyValuePercent: 4 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "0.4 g", dailyValuePercent: 1 }
    ],
    healthBenefits: [
      "Keeps you hydrated – 92% water",
      "Loves your heart – lycopene",
      "Boosts exercise recovery – citrulline",
      "Protects your eyes – lycopene and beta-carotene",
      "Boosts immunity – vitamin C",
      "Helps with weight control – low calorie",
      "Reduces inflammation",
      "Gives you glowing skin – vitamin A"
    ]
  },
  // Only ONE passion fruit entry (keeping the FRUITS version, moving it here)
  "passion fruit": {
    nutrients: [
      { name: "Fiber", amount: "10.4 g", dailyValuePercent: 37 },
      { name: "Vitamin C", amount: "30 mg", dailyValuePercent: 33 },
      { name: "Vitamin A", amount: "64 µg", dailyValuePercent: 7 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "348 mg", dailyValuePercent: 7 },
      { name: "Magnesium", amount: "29 mg", dailyValuePercent: 7 },
      { name: "Niacin", amount: "1.5 mg", dailyValuePercent: 9 },
      { name: "Phosphorus", amount: "68 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Loves your heart – potassium",
      "Boosts immunity – vitamin C",
      "Antioxidant – polyphenols",
      "Balances blood sugar – fiber slows absorption",
      "Helps with weight control – satiety",
      "Strengthens bones – magnesium",
      "Helps you sleep – contains magnesium"
    ]
  },
  "star fruit": {
    nutrients: [
      { name: "Vitamin C", amount: "34.4 mg", dailyValuePercent: 38 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "2.8 g", dailyValuePercent: 10 },
      { name: "Vitamin B5", amount: "0.4 mg", dailyValuePercent: 7 },
      { name: "Potassium", amount: "133 mg", dailyValuePercent: 3 },
      { name: "Folate", amount: "12 µg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Oxalic acid", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Aids digestion – fiber",
      "Loves your heart – potassium",
      "Antioxidant – flavonoids",
      "Helps with weight control – low calorie",
      "Keeps you hydrated – high water content",
      "Strengthens bones – copper",
      "Caution – kidney patients avoid (oxalates)"
    ]
  },
  "date palm": {
    nutrients: [
      { name: "Fiber", amount: "8 g", dailyValuePercent: 29 },
      { name: "Potassium", amount: "696 mg", dailyValuePercent: 15 },
      { name: "Copper", amount: "0.4 mg", dailyValuePercent: 40 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Magnesium", amount: "54 mg", dailyValuePercent: 13 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 14 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Loves your heart – potassium",
      "Strengthens bones – copper and magnesium",
      "Supports brain health – may reduce inflammation",
      "Natural sweetener – replaces refined sugar",
      "Gives you energy – natural sugars",
      "Great for pregnancy – may help with labor",
      "Antioxidant – protects cells"
    ]
  },
  mulberry: {
    nutrients: [
      { name: "Vitamin C", amount: "36.4 mg", dailyValuePercent: 40 },
      { name: "Iron", amount: "1.8 mg", dailyValuePercent: 10 },
      { name: "Vitamin K", amount: "7.8 µg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "1.7 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "194 mg", dailyValuePercent: 4 },
      { name: "Resveratrol", amount: "varies", dailyValuePercent: 0 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 },
      { name: "Rutin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – resveratrol",
      "Balances blood sugar – may reduce spikes",
      "Antioxidant – anthocyanins",
      "Boosts immunity – vitamin C",
      "Aids digestion – fiber",
      "Strengthens bones – vitamin K",
      "Reduces inflammation",
      "Helps with weight control – low calorie"
    ]
  },
  lychee: {
    nutrients: [
      { name: "Vitamin C", amount: "71.5 mg", dailyValuePercent: 79 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 15 },
      { name: "Potassium", amount: "171 mg", dailyValuePercent: 4 },
      { name: "Fiber", amount: "1.3 g", dailyValuePercent: 5 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Folate", amount: "14 µg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Oligonol", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – high vitamin C",
      "Antioxidant – oligonol",
      "Loves your heart – potassium",
      "Gives you glowing skin – promotes collagen",
      "Helps with weight control – low calorie",
      "Keeps you hydrated – high water content",
      "Aids digestion – fiber",
      "Reduces inflammation"
    ]
  },
  persimmon: {
    nutrients: [
      { name: "Vitamin A", amount: "81 µg", dailyValuePercent: 9 },
      { name: "Vitamin C", amount: "7.5 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "0.4 mg", dailyValuePercent: 16 },
      { name: "Fiber", amount: "3.6 g", dailyValuePercent: 13 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 11 },
      { name: "Potassium", amount: "161 mg", dailyValuePercent: 3 },
      { name: "Vitamin E", amount: "0.7 mg", dailyValuePercent: 5 },
      { name: "Tannins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Protects your eyes – vitamin A",
      "Aids digestion – high fiber",
      "Loves your heart – may reduce cholesterol",
      "Antioxidant – carotenoids",
      "Boosts immunity – vitamin C",
      "Strengthens bones – manganese",
      "Reduces inflammation",
      "Balances blood sugar"
    ]
  },
  gooseberry: {
    nutrients: [
      { name: "Vitamin C", amount: "27.7 mg", dailyValuePercent: 31 },
      { name: "Fiber", amount: "4.3 g", dailyValuePercent: 15 },
      { name: "Potassium", amount: "198 mg", dailyValuePercent: 4 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Vitamin B5", amount: "0.3 mg", dailyValuePercent: 6 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Vitamin E", amount: "0.4 mg", dailyValuePercent: 3 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Aids digestion – fiber",
      "Loves your heart – potassium",
      "Antioxidant – anthocyanins",
      "Protects your eyes – vitamin A",
      "Strengthens bones – manganese",
      "Reduces inflammation",
      "Helps with weight control – low calorie"
    ]
  },
  currant: {
    nutrients: [
      { name: "Vitamin C", amount: "41 mg", dailyValuePercent: 46 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "4.3 g", dailyValuePercent: 15 },
      { name: "Potassium", amount: "322 mg", dailyValuePercent: 7 },
      { name: "Vitamin K", amount: "11 µg", dailyValuePercent: 9 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Loves your heart – may lower blood pressure",
      "Protects your eyes – anthocyanins",
      "Aids digestion – fiber",
      "Strengthens bones – vitamin K",
      "Antioxidant – polyphenols",
      "Reduces inflammation",
      "Helps with weight control – low calorie"
    ]
  },
  elderberry: {
    nutrients: [
      { name: "Vitamin C", amount: "36 mg", dailyValuePercent: 40 },
      { name: "Fiber", amount: "7 g", dailyValuePercent: 25 },
      { name: "Potassium", amount: "280 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "1.6 mg", dailyValuePercent: 9 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 },
      { name: "Flavonoids", amount: "varies", dailyValuePercent: 0 },
      { name: "Quercetin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Fights cold and flu – reduces duration and severity",
      "Boosts immunity – antiviral properties",
      "Loves your heart – may lower cholesterol",
      "Antioxidant – high ORAC score",
      "Aids digestion – fiber",
      "Reduces inflammation",
      "Gives you glowing skin – may reduce wrinkles",
      "Balances blood sugar"
    ]
  },
  rambutan: {
    nutrients: [
      { name: "Vitamin C", amount: "4.9 mg", dailyValuePercent: 5 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Fiber", amount: "0.9 g", dailyValuePercent: 3 },
      { name: "Potassium", amount: "42 mg", dailyValuePercent: 1 },
      { name: "Iron", amount: "0.4 mg", dailyValuePercent: 2 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 4 },
      { name: "Vitamin B3", amount: "0.3 mg", dailyValuePercent: 2 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Aids digestion – fiber",
      "Loves your heart – copper",
      "Antioxidant – protects cells",
      "Helps with weight control – low calorie",
      "Keeps you hydrated – high water content",
      "Strengthens bones – manganese",
      "Reduces inflammation"
    ]
  },
  durian: {
    nutrients: [
      { name: "Vitamin C", amount: "19.7 mg", dailyValuePercent: 22 },
      { name: "Potassium", amount: "436 mg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "3.8 g", dailyValuePercent: 14 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 18 },
      { name: "Thiamin", amount: "0.4 mg", dailyValuePercent: 30 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 22 },
      { name: "Folate", amount: "36 µg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Loves your heart – potassium",
      "Aids digestion – fiber",
      "Strengthens bones – copper and manganese",
      "Gives you energy – carbohydrates",
      "Boosts immunity – vitamin C",
      "Antioxidant – carotenoids",
      "Helps you sleep – tryptophan",
      "Gently lowers blood pressure"
    ]
  },
  mangosteen: {
    nutrients: [
      { name: "Vitamin C", amount: "7.2 mg", dailyValuePercent: 8 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Folate", amount: "31 µg", dailyValuePercent: 8 },
      { name: "Potassium", amount: "48 mg", dailyValuePercent: 1 },
      { name: "Xanthones", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin B1", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Antioxidant – xanthones",
      "Reduces inflammation – chronic inflammation",
      "Boosts immunity – increases white blood cells",
      "Loves your heart – may lower cholesterol",
      "Helps with weight control – may aid fat loss",
      "Aids digestion – fiber",
      "Gives you glowing skin – anti-aging",
      "Balances blood sugar"
    ]
  },
  longan: {
    nutrients: [
      { name: "Vitamin C", amount: "84 mg", dailyValuePercent: 93 },
      { name: "Iron", amount: "1.3 mg", dailyValuePercent: 7 },
      { name: "Potassium", amount: "266 mg", dailyValuePercent: 6 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Fiber", amount: "1.1 g", dailyValuePercent: 4 },
      { name: "Vitamin B2", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Niacin", amount: "0.3 mg", dailyValuePercent: 2 },
      { name: "Polyphenols", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – high vitamin C",
      "Loves your heart – potassium",
      "Antioxidant – polyphenols",
      "Gives you energy – natural sugars",
      "Helps you sleep – traditionally used for insomnia",
      "Reduces stress – adaptogenic properties",
      "Gives you glowing skin – promotes collagen",
      "Improves circulation – iron"
    ]
  },
  marula: {
    nutrients: [
      { name: "Vitamin C", amount: "61 mg", dailyValuePercent: 68 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Magnesium", amount: "60 mg", dailyValuePercent: 14 },
      { name: "Iron", amount: "2 mg", dailyValuePercent: 11 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Vitamin E", amount: "2 mg", dailyValuePercent: 13 },
      { name: "Tannins", amount: "varies", dailyValuePercent: 0 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Loves your heart – magnesium",
      "Gives you glowing skin – vitamin E",
      "Aids digestion – fiber",
      "Reduces inflammation",
      "Antioxidant – protects cells",
      "Strengthens bones – magnesium",
      "Gives you energy – natural sugars"
    ]
  },

  // ========== FRUITS (excluding duplicates already listed above) ==========
  bananas: {
    nutrients: [
      { name: "Vitamin B6", amount: "0.4 mg", dailyValuePercent: 24 },
      { name: "Vitamin C", amount: "8.7 mg", dailyValuePercent: 10 },
      { name: "Potassium", amount: "358 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Fiber", amount: "2.6 g", dailyValuePercent: 9 },
      { name: "Magnesium", amount: "27 mg", dailyValuePercent: 6 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Vitamin A", amount: "3 µg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – potassium lowers blood pressure",
      "Gently lowers blood pressure – potassium balances fluids",
      "Aids digestion – pectin and resistant starch",
      "Boosts exercise recovery – carbohydrates and potassium",
      "Lifts your mood – vitamin B6 aids serotonin production",
      "Helps with weight control – satiety",
      "Strengthens bones – manganese",
      "Protects your kidneys – may reduce risk of kidney stones",
      "Antioxidant – dopamine and catechins"
    ]
  },
  mangoes: {
    nutrients: [
      { name: "Vitamin C", amount: "36.4 mg", dailyValuePercent: 40 },
      { name: "Vitamin A", amount: "54 µg", dailyValuePercent: 6 },
      { name: "Folate", amount: "43 µg", dailyValuePercent: 11 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Potassium", amount: "168 mg", dailyValuePercent: 4 },
      { name: "Vitamin E", amount: "0.9 mg", dailyValuePercent: 6 },
      { name: "Mangiferin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – high vitamin C",
      "Protects your eyes – zeaxanthin and lutein",
      "Aids digestion – enzymes like amylase",
      "Gives you glowing skin – vitamin A and C for collagen",
      "Loves your heart – may lower cholesterol",
      "Antioxidant – mangiferin",
      "Balances body pH – alkalizing",
      "Strengthens hair – vitamin C for iron absorption"
    ]
  },
  oranges: {
    nutrients: [
      { name: "Vitamin C", amount: "53.2 mg", dailyValuePercent: 59 },
      { name: "Folate", amount: "30 µg", dailyValuePercent: 8 },
      { name: "Fiber", amount: "2.4 g", dailyValuePercent: 9 },
      { name: "Potassium", amount: "181 mg", dailyValuePercent: 4 },
      { name: "Thiamin", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Vitamin A", amount: "11 µg", dailyValuePercent: 1 },
      { name: "Calcium", amount: "40 mg", dailyValuePercent: 3 },
      { name: "Hesperidin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Loves your heart – hesperidin may lower blood pressure",
      "Gives you glowing skin – collagen production",
      "Prevents kidney stones – citric acid",
      "Helps prevent anemia – enhances iron absorption",
      "Aids digestion – fiber",
      "Protects your eyes – carotenoids",
      "Reduces inflammation"
    ]
  },
  pineapples: {
    nutrients: [
      { name: "Vitamin C", amount: "47.8 mg", dailyValuePercent: 53 },
      { name: "Manganese", amount: "0.9 mg", dailyValuePercent: 41 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "1.4 g", dailyValuePercent: 5 },
      { name: "Thiamin", amount: "0.1 mg", dailyValuePercent: 7 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 11 },
      { name: "Folate", amount: "18 µg", dailyValuePercent: 5 },
      { name: "Bromelain", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Aids digestion – bromelain breaks down protein",
      "Reduces inflammation – reduces swelling and pain",
      "Boosts immunity – vitamin C",
      "Clears sinuses – bromelain reduces mucus",
      "Strengthens bones – manganese",
      "Heals wounds – promotes tissue repair",
      "Eases arthritis – may reduce symptoms",
      "Antioxidant – protects cells"
    ]
  },
  avocados: {
    nutrients: [
      { name: "Fiber", amount: "6.7 g", dailyValuePercent: 24 },
      { name: "Vitamin K", amount: "21 µg", dailyValuePercent: 18 },
      { name: "Folate", amount: "81 µg", dailyValuePercent: 20 },
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 },
      { name: "Potassium", amount: "485 mg", dailyValuePercent: 10 },
      { name: "Vitamin E", amount: "2.1 mg", dailyValuePercent: 14 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 16 },
      { name: "Healthy fats", amount: "15 g", dailyValuePercent: 23 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats lower LDL",
      "Helps with weight control – high fiber and fat increase satiety",
      "Protects your eyes – lutein and zeaxanthin",
      "Balances blood sugar – may improve insulin sensitivity",
      "Strengthens bones – vitamin K",
      "Gives you glowing skin – vitamin E",
      "Great for pregnancy – high folate",
      "Boosts nutrient absorption – fat helps absorb carotenoids"
    ]
  },
  pawpaws: {
    nutrients: [
      { name: "Vitamin C", amount: "60.9 mg", dailyValuePercent: 68 },
      { name: "Vitamin A", amount: "47 µg", dailyValuePercent: 5 },
      { name: "Folate", amount: "37 µg", dailyValuePercent: 9 },
      { name: "Fiber", amount: "1.7 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "182 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "21 mg", dailyValuePercent: 5 },
      { name: "Papain", amount: "varies", dailyValuePercent: 0 },
      { name: "Lycopene", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Aids digestion – papain breaks down protein",
      "Boosts immunity – high vitamin C",
      "Loves your heart – lycopene and potassium",
      "Gives you glowing skin – vitamin A and C",
      "Reduces inflammation – reduces oxidative stress",
      "Heals wounds – topical use",
      "Protects your eyes – vitamin A",
      "May help prevent cancer"
    ]
  },
  "grapefruit": {
    nutrients: [
      { name: "Vitamin C", amount: "31.2 mg", dailyValuePercent: 35 },
      { name: "Vitamin A", amount: "58 µg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "135 mg", dailyValuePercent: 3 },
      { name: "Lycopene", amount: "1419 µg", dailyValuePercent: 0 },
      { name: "Naringenin", amount: "varies", dailyValuePercent: 0 },
      { name: "Folate", amount: "13 µg", dailyValuePercent: 3 },
      { name: "Thiamin", amount: "0.1 mg", dailyValuePercent: 4 }
    ],
    healthBenefits: [
      "Loves your heart – may lower cholesterol",
      "Helps with weight loss – may boost metabolism",
      "Boosts immunity – vitamin C",
      "Antioxidant – naringenin",
      "Balances blood sugar – may improve insulin resistance",
      "Prevents kidney stones – citric acid",
      "Gives you glowing skin – vitamin A",
      "Keeps you hydrated – high water content"
    ]
  },
  lemons: {
    nutrients: [
      { name: "Vitamin C", amount: "53 mg", dailyValuePercent: 59 },
      { name: "Fiber", amount: "2.8 g", dailyValuePercent: 10 },
      { name: "Potassium", amount: "138 mg", dailyValuePercent: 3 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 4 },
      { name: "Folate", amount: "11 µg", dailyValuePercent: 3 },
      { name: "Calcium", amount: "26 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "8 mg", dailyValuePercent: 2 },
      { name: "Citric acid", amount: "1.4 g", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Aids digestion – citric acid stimulates enzymes",
      "Prevents kidney stones – citrate",
      "Boosts iron absorption – enhances non‑heme iron",
      "Helps with weight management – may boost metabolism",
      "Gives you glowing skin – antioxidants",
      "Loves your heart – may lower blood pressure",
      "Fights bacteria – antibacterial"
    ]
  },
  limes: {
    nutrients: [
      { name: "Vitamin C", amount: "29.1 mg", dailyValuePercent: 32 },
      { name: "Fiber", amount: "2.8 g", dailyValuePercent: 10 },
      { name: "Potassium", amount: "102 mg", dailyValuePercent: 2 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 4 },
      { name: "Folate", amount: "8 µg", dailyValuePercent: 2 },
      { name: "Calcium", amount: "33 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "6 mg", dailyValuePercent: 1 },
      { name: "Citric acid", amount: "1.4 g", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – vitamin C",
      "Prevents nausea – aids digestion",
      "Gives you glowing skin – antioxidants reduce wrinkles",
      "Boosts iron absorption",
      "Helps with weight management – may boost metabolism",
      "Prevents kidney stones – citrate",
      "Loves your heart – potassium",
      "Fights oral bacteria – antibacterial"
    ]
  },
  guava: {
    nutrients: [
      { name: "Vitamin C", amount: "228 mg", dailyValuePercent: 253 },
      { name: "Fiber", amount: "5.4 g", dailyValuePercent: 19 },
      { name: "Folate", amount: "49 µg", dailyValuePercent: 12 },
      { name: "Vitamin A", amount: "31 µg", dailyValuePercent: 3 },
      { name: "Potassium", amount: "417 mg", dailyValuePercent: 9 },
      { name: "Copper", amount: "0.2 mg", dailyValuePercent: 23 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 8 },
      { name: "Lycopene", amount: "5204 µg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – extremely high vitamin C",
      "Aids digestion – fiber",
      "Loves your heart – lycopene and potassium",
      "Balances blood sugar – may lower glucose",
      "Antioxidant – protects cells",
      "Gives you glowing skin – vitamin C for collagen",
      "Reduces inflammation",
      "Helps with weight control – low calorie"
    ]
  },
  jackfruit: {
    nutrients: [
      { name: "Vitamin C", amount: "13.7 mg", dailyValuePercent: 15 },
      { name: "Fiber", amount: "1.5 g", dailyValuePercent: 5 },
      { name: "Potassium", amount: "448 mg", dailyValuePercent: 10 },
      { name: "Magnesium", amount: "29 mg", dailyValuePercent: 7 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 19 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 8 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – potassium",
      "Aids digestion – fiber",
      "Gives you energy – carbohydrates",
      "Boosts immunity – vitamin C",
      "Strengthens bones – magnesium",
      "Balances blood sugar – moderate glycemic index",
      "Helps with weight control – satiety",
      "Gives you glowing skin – vitamin C"
    ]
  },
  breadfruit: {
    nutrients: [
      { name: "Vitamin C", amount: "29 mg", dailyValuePercent: 32 },
      { name: "Fiber", amount: "4.9 g", dailyValuePercent: 18 },
      { name: "Potassium", amount: "490 mg", dailyValuePercent: 10 },
      { name: "Magnesium", amount: "25 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Thiamin", amount: "0.1 mg", dailyValuePercent: 9 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Loves your heart – potassium",
      "Aids digestion – high fiber",
      "Gives you energy – complex carbohydrates",
      "Boosts immunity – vitamin C",
      "Balances blood sugar – resistant starch",
      "Helps with weight control – satiety",
      "Strengthens bones – magnesium",
      "Antioxidant – carotenoids"
    ]
  },
  pomegranate: {
    nutrients: [
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Vitamin C", amount: "10.2 mg", dailyValuePercent: 11 },
      { name: "Vitamin K", amount: "16.4 µg", dailyValuePercent: 14 },
      { name: "Folate", amount: "38 µg", dailyValuePercent: 10 },
      { name: "Potassium", amount: "236 mg", dailyValuePercent: 5 },
      { name: "Punicalagins", amount: "varies", dailyValuePercent: 0 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 },
      { name: "Ellagitannins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Loves your heart – may lower blood pressure",
      "Antioxidant – punicalagins",
      "Reduces inflammation – reduces oxidative stress",
      "Eases joint pain – may reduce arthritis symptoms",
      "Protects your memory – may help against Alzheimer's",
      "Speeds exercise recovery – reduces muscle soreness",
      "Aids digestion – fiber",
      "Supports prostate health – may slow cancer growth"
    ]
  },
  coconut: {
    nutrients: [
      { name: "Fiber", amount: "9 g", dailyValuePercent: 32 },
      { name: "Manganese", amount: "1.4 mg", dailyValuePercent: 61 },
      { name: "Copper", amount: "0.4 mg", dailyValuePercent: 44 },
      { name: "Selenium", amount: "10.1 µg", dailyValuePercent: 18 },
      { name: "Iron", amount: "2.4 mg", dailyValuePercent: 13 },
      { name: "Potassium", amount: "356 mg", dailyValuePercent: 8 },
      { name: "Medium-chain triglycerides", amount: "11 g", dailyValuePercent: 0 },
      { name: "Lauric acid", amount: "7 g", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Supports brain health – MCTs provide ketones",
      "Loves your heart – may raise HDL",
      "Fights germs – lauric acid fights bacteria",
      "Helps with weight control – MCTs increase satiety",
      "Aids digestion – fiber",
      "Moisturizes skin – healthy fats",
      "Strengthens bones – manganese",
      "Balances blood sugar – may improve insulin sensitivity"
    ]
  },
  cashew: {
    nutrients: [
      { name: "Copper", amount: "2.2 mg", dailyValuePercent: 244 },
      { name: "Manganese", amount: "1.7 mg", dailyValuePercent: 74 },
      { name: "Magnesium", amount: "292 mg", dailyValuePercent: 70 },
      { name: "Phosphorus", amount: "593 mg", dailyValuePercent: 47 },
      { name: "Iron", amount: "6.7 mg", dailyValuePercent: 37 },
      { name: "Zinc", amount: "5.8 mg", dailyValuePercent: 53 },
      { name: "Vitamin K", amount: "34.1 µg", dailyValuePercent: 28 },
      { name: "Healthy fats", amount: "44 g", dailyValuePercent: 56 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats",
      "Strengthens bones – magnesium and copper",
      "Gently lowers blood pressure – magnesium",
      "Boosts immunity – zinc",
      "Protects your eyes – lutein and zeaxanthin",
      "Helps with weight control – satiety",
      "Balances blood sugar – may improve insulin sensitivity",
      "Antioxidant – selenium"
    ]
  },
  macadamia: {
    nutrients: [
      { name: "Manganese", amount: "4.1 mg", dailyValuePercent: 178 },
      { name: "Thiamin", amount: "1.2 mg", dailyValuePercent: 100 },
      { name: "Copper", amount: "0.8 mg", dailyValuePercent: 89 },
      { name: "Magnesium", amount: "130 mg", dailyValuePercent: 31 },
      { name: "Iron", amount: "3.7 mg", dailyValuePercent: 21 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 15 },
      { name: "Healthy fats", amount: "76 g", dailyValuePercent: 97 },
      { name: "Fiber", amount: "8.6 g", dailyValuePercent: 31 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats reduce LDL",
      "Strengthens bones – manganese",
      "Aids digestion – fiber",
      "Helps with weight control – satiety",
      "Antioxidant – tocotrienols",
      "Balances blood sugar – may reduce metabolic syndrome risk",
      "Gives you glowing skin – healthy fats",
      "Supports brain health – vitamin B1"
    ]
  },
  fig: {
    nutrients: [
      { name: "Fiber", amount: "2.9 g", dailyValuePercent: 10 },
      { name: "Potassium", amount: "232 mg", dailyValuePercent: 5 },
      { name: "Calcium", amount: "35 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "17 mg", dailyValuePercent: 4 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Vitamin K", amount: "4.7 µg", dailyValuePercent: 4 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Strengthens bones – calcium and potassium",
      "Loves your heart – may lower blood pressure",
      "Balances blood sugar – may improve insulin sensitivity",
      "Helps with weight control – fiber increases satiety",
      "Antioxidant – phenols",
      "Gives you glowing skin – may reduce wrinkles",
      "Relieves constipation – natural laxative"
    ]
  },
  walnut: {
    nutrients: [
      { name: "Manganese", amount: "3.4 mg", dailyValuePercent: 148 },
      { name: "Copper", amount: "1.6 mg", dailyValuePercent: 178 },
      { name: "Omega-3 (ALA)", amount: "9.1 g", dailyValuePercent: 0 },
      { name: "Magnesium", amount: "158 mg", dailyValuePercent: 38 },
      { name: "Folate", amount: "98 µg", dailyValuePercent: 25 },
      { name: "Phosphorus", amount: "346 mg", dailyValuePercent: 28 },
      { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 32 },
      { name: "Healthy fats", amount: "65 g", dailyValuePercent: 84 }
    ],
    healthBenefits: [
      "Supports brain health – ALA omega-3",
      "Loves your heart – may lower LDL",
      "Antioxidant – ellagic acid",
      "Supports gut health – prebiotic fiber",
      "Helps with weight control – satiety",
      "Balances blood sugar – may improve insulin sensitivity",
      "Reduces inflammation",
      "May help prevent breast cancer"
    ]
  },

  // ========== GRAINS & LEGUMES ==========
  maize: {
    nutrients: [
      { name: "Fiber", amount: "7.3 g", dailyValuePercent: 26 },
      { name: "Vitamin C", amount: "6.8 mg", dailyValuePercent: 8 },
      { name: "Thiamin", amount: "0.4 mg", dailyValuePercent: 31 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 },
      { name: "Magnesium", amount: "127 mg", dailyValuePercent: 30 },
      { name: "Phosphorus", amount: "210 mg", dailyValuePercent: 17 },
      { name: "Potassium", amount: "270 mg", dailyValuePercent: 6 },
      { name: "Iron", amount: "2.7 mg", dailyValuePercent: 15 }
    ],
    healthBenefits: [
      "Aids digestion – fiber",
      "Gives you energy – complex carbohydrates",
      "Loves your heart – magnesium",
      "Strengthens bones – phosphorus",
      "Antioxidant – carotenoids (yellow corn)",
      "Protects your eyes – lutein",
      "Helps with weight control – fiber increases satiety",
      "Balances blood sugar – moderate glycemic index"
    ]
  },
  beans: {
    nutrients: [
      { name: "Fiber", amount: "15.2 g", dailyValuePercent: 54 },
      { name: "Protein", amount: "21 g", dailyValuePercent: 42 },
      { name: "Folate", amount: "394 µg", dailyValuePercent: 99 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Magnesium", amount: "140 mg", dailyValuePercent: 33 },
      { name: "Potassium", amount: "1393 mg", dailyValuePercent: 30 },
      { name: "Thiamin", amount: "0.5 mg", dailyValuePercent: 39 }
    ],
    healthBenefits: [
      "Loves your heart – lowers cholesterol",
      "Balances blood sugar – low glycemic index",
      "Aids digestion – high fiber",
      "Helps with weight control – protein and fiber",
      "Prevents anemia – iron",
      "Strengthens bones – magnesium",
      "Great for pregnancy – high folate",
      "Antioxidant – polyphenols"
    ]
  },
  rice: {
    nutrients: [
      { name: "Manganese", amount: "1.1 mg", dailyValuePercent: 48 },
      { name: "Folate", amount: "80 µg", dailyValuePercent: 20 },
      { name: "Thiamin", amount: "0.4 mg", dailyValuePercent: 31 },
      { name: "Selenium", amount: "15.1 µg", dailyValuePercent: 27 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Iron", amount: "1.5 mg", dailyValuePercent: 8 },
      { name: "Magnesium", amount: "43 mg", dailyValuePercent: 10 },
      { name: "Phosphorus", amount: "115 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Gives you energy – carbohydrates",
      "Aids digestion – easy to digest",
      "Gluten-free – safe for celiacs",
      "Strengthens bones – manganese",
      "Gently lowers blood pressure – low sodium",
      "Helps with weight control – satiety",
      "Loves your heart – selenium",
      "Supports brain health – thiamin"
    ]
  },
  wheat: {
    nutrients: [
      { name: "Selenium", amount: "70.7 µg", dailyValuePercent: 129 },
      { name: "Manganese", amount: "4 mg", dailyValuePercent: 174 },
      { name: "Phosphorus", amount: "508 mg", dailyValuePercent: 41 },
      { name: "Fiber", amount: "12.2 g", dailyValuePercent: 44 },
      { name: "Magnesium", amount: "138 mg", dailyValuePercent: 33 },
      { name: "Iron", amount: "4.7 mg", dailyValuePercent: 26 },
      { name: "Niacin", amount: "6.7 mg", dailyValuePercent: 42 },
      { name: "Thiamin", amount: "0.5 mg", dailyValuePercent: 39 }
    ],
    healthBenefits: [
      "Aids digestion – fiber (whole wheat)",
      "Loves your heart – may reduce cholesterol",
      "Gives you energy – complex carbohydrates",
      "Strengthens bones – phosphorus",
      "Antioxidant – selenium",
      "Balances blood sugar – whole grains improve insulin sensitivity",
      "Helps with weight control – satiety",
      "Supports brain health – B vitamins"
    ]
  },
  sorghum: {
    nutrients: [
      { name: "Fiber", amount: "6.7 g", dailyValuePercent: 24 },
      { name: "Protein", amount: "11 g", dailyValuePercent: 22 },
      { name: "Iron", amount: "4.4 mg", dailyValuePercent: 24 },
      { name: "Magnesium", amount: "165 mg", dailyValuePercent: 39 },
      { name: "Potassium", amount: "363 mg", dailyValuePercent: 8 },
      { name: "Manganese", amount: "1.6 mg", dailyValuePercent: 70 },
      { name: "Phosphorus", amount: "287 mg", dailyValuePercent: 23 },
      { name: "Zinc", amount: "1.7 mg", dailyValuePercent: 15 }
    ],
    healthBenefits: [
      "Aids digestion – fiber",
      "Loves your heart – may lower cholesterol",
      "Balances blood sugar – low glycemic index",
      "Gluten-free",
      "Strengthens bones – magnesium",
      "Prevents anemia – iron",
      "Antioxidant – phenolic compounds",
      "Helps with weight control – satiety"
    ]
  },
  millet: {
    nutrients: [
      { name: "Manganese", amount: "1.6 mg", dailyValuePercent: 70 },
      { name: "Magnesium", amount: "114 mg", dailyValuePercent: 27 },
      { name: "Phosphorus", amount: "285 mg", dailyValuePercent: 23 },
      { name: "Fiber", amount: "8.5 g", dailyValuePercent: 30 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Niacin", amount: "4.7 mg", dailyValuePercent: 29 },
      { name: "Zinc", amount: "1.7 mg", dailyValuePercent: 15 },
      { name: "Protein", amount: "11 g", dailyValuePercent: 22 }
    ],
    healthBenefits: [
      "Balances blood sugar – low glycemic index",
      "Loves your heart – magnesium",
      "Aids digestion – fiber",
      "Strengthens bones – phosphorus",
      "Gluten-free",
      "Antioxidant – polyphenols",
      "Helps with weight control – satiety",
      "Gives you energy – complex carbohydrates"
    ]
  },
  "finger millet": {
    nutrients: [
      { name: "Calcium", amount: "344 mg", dailyValuePercent: 26 },
      { name: "Fiber", amount: "11.5 g", dailyValuePercent: 41 },
      { name: "Iron", amount: "3.9 mg", dailyValuePercent: 22 },
      { name: "Manganese", amount: "5.2 mg", dailyValuePercent: 226 },
      { name: "Magnesium", amount: "137 mg", dailyValuePercent: 33 },
      { name: "Phosphorus", amount: "283 mg", dailyValuePercent: 23 },
      { name: "Protein", amount: "7.3 g", dailyValuePercent: 15 },
      { name: "Thiamin", amount: "0.4 mg", dailyValuePercent: 33 }
    ],
    healthBenefits: [
      "Strengthens bones – high calcium",
      "Aids digestion – high fiber",
      "Balances blood sugar – low glycemic index",
      "Prevents anemia – iron",
      "Loves your heart – magnesium",
      "Helps with weight control – satiety",
      "Gluten-free",
      "Antioxidant – phenolic compounds"
    ]
  },
  "soya beans": {
    nutrients: [
      { name: "Protein", amount: "36 g", dailyValuePercent: 72 },
      { name: "Fiber", amount: "9.3 g", dailyValuePercent: 33 },
      { name: "Iron", amount: "15.7 mg", dailyValuePercent: 87 },
      { name: "Magnesium", amount: "280 mg", dailyValuePercent: 67 },
      { name: "Phosphorus", amount: "704 mg", dailyValuePercent: 56 },
      { name: "Potassium", amount: "1797 mg", dailyValuePercent: 38 },
      { name: "Folate", amount: "375 µg", dailyValuePercent: 94 },
      { name: "Manganese", amount: "2.5 mg", dailyValuePercent: 109 }
    ],
    healthBenefits: [
      "Loves your heart – may lower LDL",
      "Strengthens bones – isoflavones",
      "Eases menopause – reduces hot flashes",
      "High-quality protein – complete plant protein",
      "Balances blood sugar – may improve insulin sensitivity",
      "May help prevent breast cancer",
      "Aids digestion – fiber",
      "Helps with weight control – protein and fiber"
    ]
  },
  cowpeas: {
    nutrients: [
      { name: "Fiber", amount: "11.1 g", dailyValuePercent: 40 },
      { name: "Protein", amount: "24 g", dailyValuePercent: 48 },
      { name: "Folate", amount: "633 µg", dailyValuePercent: 158 },
      { name: "Manganese", amount: "1.5 mg", dailyValuePercent: 65 },
      { name: "Iron", amount: "8.3 mg", dailyValuePercent: 46 },
      { name: "Magnesium", amount: "184 mg", dailyValuePercent: 44 },
      { name: "Potassium", amount: "1112 mg", dailyValuePercent: 24 },
      { name: "Thiamin", amount: "0.9 mg", dailyValuePercent: 71 }
    ],
    healthBenefits: [
      "Loves your heart – fiber and potassium",
      "Aids digestion – high fiber",
      "Prevents anemia – iron",
      "Great for pregnancy – high folate",
      "Helps with weight control – protein and fiber",
      "Balances blood sugar – low glycemic index",
      "Strengthens bones – magnesium",
      "Antioxidant – polyphenols"
    ]
  },
  "green grams": {
    nutrients: [
      { name: "Fiber", amount: "16.3 g", dailyValuePercent: 58 },
      { name: "Protein", amount: "23.9 g", dailyValuePercent: 48 },
      { name: "Folate", amount: "625 µg", dailyValuePercent: 156 },
      { name: "Manganese", amount: "1.1 mg", dailyValuePercent: 48 },
      { name: "Iron", amount: "6.7 mg", dailyValuePercent: 37 },
      { name: "Magnesium", amount: "189 mg", dailyValuePercent: 45 },
      { name: "Potassium", amount: "1246 mg", dailyValuePercent: 27 },
      { name: "Vitamin B6", amount: "0.4 mg", dailyValuePercent: 23 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Loves your heart – may lower cholesterol",
      "Balances blood sugar – low glycemic index",
      "Prevents anemia – iron",
      "Great for pregnancy – folate",
      "Helps with weight control – protein and fiber",
      "Strengthens bones – magnesium",
      "Antioxidant – flavonoids"
    ]
  },
  groundnuts: {
    nutrients: [
      { name: "Niacin", amount: "12.1 mg", dailyValuePercent: 76 },
      { name: "Manganese", amount: "1.9 mg", dailyValuePercent: 83 },
      { name: "Vitamin E", amount: "8.3 mg", dailyValuePercent: 55 },
      { name: "Magnesium", amount: "168 mg", dailyValuePercent: 40 },
      { name: "Folate", amount: "240 µg", dailyValuePercent: 60 },
      { name: "Phosphorus", amount: "376 mg", dailyValuePercent: 30 },
      { name: "Protein", amount: "26 g", dailyValuePercent: 52 },
      { name: "Healthy fats", amount: "49 g", dailyValuePercent: 63 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats",
      "Helps with weight control – satiety",
      "Balances blood sugar – may reduce diabetes risk",
      "Strengthens bones – magnesium",
      "Antioxidant – resveratrol",
      "Aids digestion – fiber",
      "Supports brain health – niacin",
      "Gives you glowing skin – vitamin E"
    ]
  },
  pigeonpeas: {
    nutrients: [
      { name: "Fiber", amount: "15 g", dailyValuePercent: 54 },
      { name: "Protein", amount: "21 g", dailyValuePercent: 42 },
      { name: "Folate", amount: "456 µg", dailyValuePercent: 114 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Magnesium", amount: "183 mg", dailyValuePercent: 44 },
      { name: "Potassium", amount: "1392 mg", dailyValuePercent: 30 },
      { name: "Iron", amount: "5.2 mg", dailyValuePercent: 29 },
      { name: "Thiamin", amount: "0.7 mg", dailyValuePercent: 55 }
    ],
    healthBenefits: [
      "Aids digestion – high fiber",
      "Loves your heart – magnesium",
      "Prevents anemia – iron",
      "Great for pregnancy – folate",
      "Helps with weight control – protein and fiber",
      "Balances blood sugar – low glycemic index",
      "Strengthens bones – magnesium",
      "Gives you energy – complex carbohydrates"
    ]
  },
  "bambara nuts": {
    nutrients: [
      { name: "Protein", amount: "19 g", dailyValuePercent: 38 },
      { name: "Fiber", amount: "12 g", dailyValuePercent: 43 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Magnesium", amount: "150 mg", dailyValuePercent: 36 },
      { name: "Potassium", amount: "1200 mg", dailyValuePercent: 26 },
      { name: "Zinc", amount: "3 mg", dailyValuePercent: 27 },
      { name: "Folate", amount: "150 µg", dailyValuePercent: 38 },
      { name: "Manganese", amount: "1.5 mg", dailyValuePercent: 65 }
    ],
    healthBenefits: [
      "High-quality protein – complete protein",
      "Aids digestion – high fiber",
      "Loves your heart – potassium",
      "Strengthens bones – magnesium",
      "Prevents anemia – iron",
      "Helps with weight control – satiety",
      "Balances blood sugar – low glycemic index",
      "Antioxidant – phenolic compounds"
    ]
  },
  chickpea: {
    nutrients: [
      { name: "Fiber", amount: "12.2 g", dailyValuePercent: 44 },
      { name: "Protein", amount: "20.5 g", dailyValuePercent: 41 },
      { name: "Folate", amount: "557 µg", dailyValuePercent: 139 },
      { name: "Manganese", amount: "2.1 mg", dailyValuePercent: 91 },
      { name: "Iron", amount: "6.2 mg", dailyValuePercent: 34 },
      { name: "Magnesium", amount: "115 mg", dailyValuePercent: 27 },
      { name: "Potassium", amount: "875 mg", dailyValuePercent: 19 },
      { name: "Vitamin B6", amount: "0.5 mg", dailyValuePercent: 32 }
    ],
    healthBenefits: [
      "Balances blood sugar – low glycemic index",
      "Aids digestion – high fiber",
      "Loves your heart – may lower cholesterol",
      "Helps with weight control – protein and fiber",
      "Great for pregnancy – high folate",
      "Strengthens bones – magnesium",
      "Prevents anemia – iron",
      "Antioxidant – polyphenols"
    ]
  },
  lentil: {
    nutrients: [
      { name: "Fiber", amount: "15.6 g", dailyValuePercent: 56 },
      { name: "Protein", amount: "25.8 g", dailyValuePercent: 52 },
      { name: "Folate", amount: "479 µg", dailyValuePercent: 120 },
      { name: "Manganese", amount: "1.3 mg", dailyValuePercent: 57 },
      { name: "Iron", amount: "6.6 mg", dailyValuePercent: 37 },
      { name: "Magnesium", amount: "107 mg", dailyValuePercent: 25 },
      { name: "Potassium", amount: "1380 mg", dailyValuePercent: 29 },
      { name: "Thiamin", amount: "0.9 mg", dailyValuePercent: 71 }
    ],
    healthBenefits: [
      "Loves your heart – lowers cholesterol",
      "Balances blood sugar – low glycemic index",
      "Aids digestion – high fiber",
      "Helps with weight control – protein and fiber",
      "Prevents anemia – iron",
      "Great for pregnancy – folate",
      "Strengthens bones – magnesium",
      "Antioxidant – polyphenols"
    ]
  },
  "faba bean": {
    nutrients: [
      { name: "Fiber", amount: "25 g", dailyValuePercent: 89 },
      { name: "Protein", amount: "26 g", dailyValuePercent: 52 },
      { name: "Folate", amount: "423 µg", dailyValuePercent: 106 },
      { name: "Manganese", amount: "1.6 mg", dailyValuePercent: 70 },
      { name: "Iron", amount: "6.7 mg", dailyValuePercent: 37 },
      { name: "Magnesium", amount: "192 mg", dailyValuePercent: 46 },
      { name: "Potassium", amount: "1062 mg", dailyValuePercent: 23 },
      { name: "Copper", amount: "0.8 mg", dailyValuePercent: 89 }
    ],
    healthBenefits: [
      "Loves your heart – may lower LDL",
      "Aids digestion – high fiber",
      "Supports Parkinson's – levodopa precursor",
      "Prevents anemia – iron",
      "Strengthens bones – magnesium",
      "Helps with weight control – satiety",
      "Balances blood sugar – low glycemic index",
      "Great for pregnancy – folate"
    ]
  },
  peanut: {
    nutrients: [
      { name: "Niacin", amount: "12.1 mg", dailyValuePercent: 76 },
      { name: "Manganese", amount: "1.9 mg", dailyValuePercent: 83 },
      { name: "Vitamin E", amount: "8.3 mg", dailyValuePercent: 55 },
      { name: "Magnesium", amount: "168 mg", dailyValuePercent: 40 },
      { name: "Folate", amount: "240 µg", dailyValuePercent: 60 },
      { name: "Phosphorus", amount: "376 mg", dailyValuePercent: 30 },
      { name: "Protein", amount: "26 g", dailyValuePercent: 52 },
      { name: "Healthy fats", amount: "49 g", dailyValuePercent: 63 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats",
      "Helps with weight control – satiety",
      "Balances blood sugar – may reduce diabetes risk",
      "Strengthens bones – magnesium",
      "Antioxidant – resveratrol",
      "Aids digestion – fiber",
      "Supports brain health – niacin",
      "Gives you glowing skin – vitamin E"
    ]
  },
  sunflower: {
    nutrients: [
      { name: "Vitamin E", amount: "35.2 mg", dailyValuePercent: 235 },
      { name: "Selenium", amount: "53 µg", dailyValuePercent: 96 },
      { name: "Manganese", amount: "1.9 mg", dailyValuePercent: 83 },
      { name: "Magnesium", amount: "325 mg", dailyValuePercent: 77 },
      { name: "Niacin", amount: "8.3 mg", dailyValuePercent: 52 },
      { name: "Phosphorus", amount: "660 mg", dailyValuePercent: 53 },
      { name: "Folate", amount: "227 µg", dailyValuePercent: 57 },
      { name: "Healthy fats", amount: "51 g", dailyValuePercent: 66 }
    ],
    healthBenefits: [
      "Gives you glowing skin – high vitamin E",
      "Loves your heart – may lower LDL",
      "Antioxidant – selenium",
      "Strengthens bones – magnesium",
      "Helps with weight control – satiety",
      "Balances blood sugar – may improve insulin sensitivity",
      "Aids digestion – fiber",
      "Gives you energy – protein and healthy fats"
    ]
  },
  simsim: {
    nutrients: [
      { name: "Copper", amount: "4.1 mg", dailyValuePercent: 456 },
      { name: "Manganese", amount: "2.5 mg", dailyValuePercent: 109 },
      { name: "Calcium", amount: "975 mg", dailyValuePercent: 75 },
      { name: "Magnesium", amount: "351 mg", dailyValuePercent: 84 },
      { name: "Phosphorus", amount: "629 mg", dailyValuePercent: 50 },
      { name: "Iron", amount: "14.6 mg", dailyValuePercent: 81 },
      { name: "Zinc", amount: "7.8 mg", dailyValuePercent: 71 },
      { name: "Vitamin B1", amount: "1.2 mg", dailyValuePercent: 100 }
    ],
    healthBenefits: [
      "Strengthens bones – high calcium",
      "Loves your heart – may lower cholesterol",
      "Prevents anemia – iron",
      "Gently lowers blood pressure – magnesium",
      "Antioxidant – sesamin and sesamolin",
      "Gives you glowing skin – vitamin E",
      "Aids digestion – fiber",
      "Balances hormones – phytoestrogens"
    ]
  },
  sugarcane: {
    nutrients: [
      { name: "Sugar", amount: "varies", dailyValuePercent: 0 },
      { name: "Calcium", amount: "11 mg", dailyValuePercent: 1 },
      { name: "Iron", amount: "0.4 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "44 mg", dailyValuePercent: 1 },
      { name: "Magnesium", amount: "4 mg", dailyValuePercent: 1 },
      { name: "Antioxidants", amount: "varies", dailyValuePercent: 0 },
      { name: "Flavonoids", amount: "varies", dailyValuePercent: 0 },
      { name: "Polyphenols", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Gives you energy – natural sugars",
      "Keeps you hydrated – sugarcane juice",
      "Supports liver health – may help detox",
      "Antioxidant – protects cells",
      "Supports kidney health – diuretic",
      "Aids digestion – may relieve constipation",
      "Boosts immunity – vitamin C in juice",
      "Replenishes electrolytes – potassium"
    ]
  },
  tobacco: {
    nutrients: [
      { name: "Nicotine", amount: "varies", dailyValuePercent: 0 },
      { name: "Protein", amount: "20 g", dailyValuePercent: 40 },
      { name: "Fiber", amount: "15 g", dailyValuePercent: 54 },
      { name: "Potassium", amount: "2000 mg", dailyValuePercent: 43 },
      { name: "Calcium", amount: "300 mg", dailyValuePercent: 23 },
      { name: "Magnesium", amount: "80 mg", dailyValuePercent: 19 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Vitamin C", amount: "0 mg", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "WARNING: No health benefits – harmful and addictive",
      "Contains carcinogens and nicotine",
      "Causes cancer, heart disease, and lung disease",
      "Not recommended for consumption"
    ]
  },
  sisal: {
    nutrients: [
      { name: "Fiber", amount: "75 g", dailyValuePercent: 268 },
      { name: "Protein", amount: "2 g", dailyValuePercent: 4 },
      { name: "Calcium", amount: "500 mg", dailyValuePercent: 38 },
      { name: "Magnesium", amount: "100 mg", dailyValuePercent: 24 },
      { name: "Potassium", amount: "1000 mg", dailyValuePercent: 21 },
      { name: "Iron", amount: "2 mg", dailyValuePercent: 11 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 },
      { name: "Manganese", amount: "0.5 mg", dailyValuePercent: 22 }
    ],
    healthBenefits: [
      "Not for human consumption",
      "Used for fibre production (ropes, mats)",
      "May have traditional medicinal uses (rare)",
      "No significant nutritional benefits"
    ]
  },
  pyrethrum: {
    nutrients: [
      { name: "Pyrethrins", amount: "varies", dailyValuePercent: 0 },
      { name: "Fiber", amount: "20 g", dailyValuePercent: 71 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "50 mg", dailyValuePercent: 12 },
      { name: "Protein", amount: "5 g", dailyValuePercent: 10 },
      { name: "Fat", amount: "1 g", dailyValuePercent: 1 }
    ],
    healthBenefits: [
      "Not for human consumption",
      "Used as natural insecticide",
      "Toxic if ingested",
      "No nutritional benefits"
    ]
  },

  // ========== FORAGE & COVER CROPS ==========
  "napier grass": {
    nutrients: [
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Protein", amount: "10 g", dailyValuePercent: 20 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Magnesium", amount: "150 mg", dailyValuePercent: 36 },
      { name: "Potassium", amount: "2000 mg", dailyValuePercent: 43 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Phosphorus", amount: "300 mg", dailyValuePercent: 24 },
      { name: "Zinc", amount: "2 mg", dailyValuePercent: 18 }
    ],
    healthBenefits: [
      "High-quality forage for cattle",
      "Improves milk production",
      "Good energy source for livestock",
      "Not intended for human consumption"
    ]
  },
  lucerne: {
    nutrients: [
      { name: "Protein", amount: "18 g", dailyValuePercent: 36 },
      { name: "Fiber", amount: "25 g", dailyValuePercent: 89 },
      { name: "Calcium", amount: "300 mg", dailyValuePercent: 23 },
      { name: "Magnesium", amount: "120 mg", dailyValuePercent: 29 },
      { name: "Potassium", amount: "1500 mg", dailyValuePercent: 32 },
      { name: "Iron", amount: "4 mg", dailyValuePercent: 22 },
      { name: "Vitamin K", amount: "500 µg", dailyValuePercent: 417 },
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 }
    ],
    healthBenefits: [
      "High-protein forage for livestock",
      "Improves soil nitrogen (legume)",
      "May have medicinal uses for humans (sprouts)",
      "Supports bone health (vitamin K)"
    ]
  },
  desmodium: {
    nutrients: [
      { name: "Protein", amount: "15 g", dailyValuePercent: 30 },
      { name: "Fiber", amount: "35 g", dailyValuePercent: 125 },
      { name: "Calcium", amount: "250 mg", dailyValuePercent: 19 },
      { name: "Magnesium", amount: "100 mg", dailyValuePercent: 24 },
      { name: "Potassium", amount: "1200 mg", dailyValuePercent: 26 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Phosphorus", amount: "200 mg", dailyValuePercent: 16 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Used in push-pull technology for pest control",
      "Nitrogen-fixing cover crop",
      "Good forage for livestock",
      "Improves soil health"
    ]
  },
  mucuna: {
    nutrients: [
      { name: "Protein", amount: "25 g", dailyValuePercent: 50 },
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Iron", amount: "10 mg", dailyValuePercent: 56 },
      { name: "Magnesium", amount: "250 mg", dailyValuePercent: 60 },
      { name: "Potassium", amount: "1500 mg", dailyValuePercent: 32 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Zinc", amount: "3 mg", dailyValuePercent: 27 },
      { name: "L-DOPA", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Cover crop improves soil fertility",
      "Seeds contain L-DOPA (Parkinson's treatment)",
      "Must be processed to remove toxins",
      "Not for direct human consumption without treatment"
    ]
  },
  dolichos: {
    nutrients: [
      { name: "Protein", amount: "22 g", dailyValuePercent: 44 },
      { name: "Fiber", amount: "20 g", dailyValuePercent: 71 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Magnesium", amount: "180 mg", dailyValuePercent: 43 },
      { name: "Potassium", amount: "1200 mg", dailyValuePercent: 26 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Zinc", amount: "2 mg", dailyValuePercent: 18 },
      { name: "Folate", amount: "200 µg", dailyValuePercent: 50 }
    ],
    healthBenefits: [
      "Cover crop and forage",
      "Edible beans after cooking",
      "Improves soil nitrogen",
      "High in protein and fiber"
    ]
  },
  canavalia: {
    nutrients: [
      { name: "Protein", amount: "28 g", dailyValuePercent: 56 },
      { name: "Fiber", amount: "25 g", dailyValuePercent: 89 },
      { name: "Iron", amount: "8 mg", dailyValuePercent: 44 },
      { name: "Magnesium", amount: "200 mg", dailyValuePercent: 48 },
      { name: "Potassium", amount: "1500 mg", dailyValuePercent: 32 },
      { name: "Calcium", amount: "130 mg", dailyValuePercent: 10 },
      { name: "Zinc", amount: "2.5 mg", dailyValuePercent: 23 },
      { name: "Canavanine", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Cover crop, fixes nitrogen",
      "Seeds require thorough cooking to remove toxins",
      "Not for raw consumption",
      "Good for green manure"
    ]
  },
  "sunn hemp": {
    nutrients: [
      { name: "Protein", amount: "20 g", dailyValuePercent: 40 },
      { name: "Fiber", amount: "40 g", dailyValuePercent: 143 },
      { name: "Calcium", amount: "300 mg", dailyValuePercent: 23 },
      { name: "Magnesium", amount: "150 mg", dailyValuePercent: 36 },
      { name: "Potassium", amount: "1000 mg", dailyValuePercent: 21 },
      { name: "Iron", amount: "6 mg", dailyValuePercent: 33 },
      { name: "Zinc", amount: "2 mg", dailyValuePercent: 18 },
      { name: "Manganese", amount: "1 mg", dailyValuePercent: 43 }
    ],
    healthBenefits: [
      "Green manure cover crop",
      "Fast biomass production",
      "Not for human consumption (toxic seeds)",
      "Excellent nitrogen fixer"
    ]
  },

  // ========== REMAINING CROPS (GENERIC BENEFITS) ==========
  // Note: cabbage is already defined above in VEGETABLES, so we skip it here to avoid duplicate.
  almond: {
    nutrients: [
      { name: "Vitamin E", amount: "25.6 mg", dailyValuePercent: 171 },
      { name: "Magnesium", amount: "268 mg", dailyValuePercent: 64 },
      { name: "Riboflavin", amount: "1 mg", dailyValuePercent: 77 },
      { name: "Copper", amount: "1 mg", dailyValuePercent: 111 },
      { name: "Manganese", amount: "2.3 mg", dailyValuePercent: 100 },
      { name: "Healthy fats", amount: "49 g", dailyValuePercent: 63 },
      { name: "Fiber", amount: "12 g", dailyValuePercent: 43 },
      { name: "Protein", amount: "21 g", dailyValuePercent: 42 }
    ],
    healthBenefits: [
      "Loves your heart – monounsaturated fats lower LDL",
      "Balances blood sugar – may improve insulin sensitivity",
      "Strengthens bones – magnesium and phosphorus",
      "Gives you glowing skin – vitamin E",
      "Helps with weight control – satiety",
      "Aids digestion – fiber",
      "Antioxidant – flavonoids",
      "Supports brain health – riboflavin"
    ]
  },
  barley: {
    nutrients: [
      { name: "Fiber", amount: "17 g", dailyValuePercent: 61 },
      { name: "Manganese", amount: "1.9 mg", dailyValuePercent: 83 },
      { name: "Selenium", amount: "37.7 µg", dailyValuePercent: 69 },
      { name: "Magnesium", amount: "133 mg", dailyValuePercent: 32 },
      { name: "Iron", amount: "3.6 mg", dailyValuePercent: 20 },
      { name: "Niacin", amount: "4.6 mg", dailyValuePercent: 29 },
      { name: "Vitamin B6", amount: "0.3 mg", dailyValuePercent: 18 },
      { name: "Copper", amount: "0.5 mg", dailyValuePercent: 56 }
    ],
    healthBenefits: [
      "Loves your heart – beta-glucan lowers cholesterol",
      "Balances blood sugar – low glycemic index",
      "Aids digestion – high fiber",
      "Helps with weight control – satiety",
      "Strengthens bones – magnesium",
      "Boosts immunity – selenium",
      "Gives you energy – complex carbs",
      "Antioxidant – lignans"
    ]
  },
  basil: {
    nutrients: [
      { name: "Vitamin K", amount: "414 µg", dailyValuePercent: 345 },
      { name: "Vitamin A", amount: "264 µg", dailyValuePercent: 29 },
      { name: "Manganese", amount: "1.1 mg", dailyValuePercent: 48 },
      { name: "Iron", amount: "3.2 mg", dailyValuePercent: 18 },
      { name: "Calcium", amount: "177 mg", dailyValuePercent: 14 },
      { name: "Vitamin C", amount: "18 mg", dailyValuePercent: 20 },
      { name: "Magnesium", amount: "64 mg", dailyValuePercent: 15 },
      { name: "Potassium", amount: "295 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Strengthens bones – high vitamin K",
      "Reduces inflammation – eugenol",
      "Antioxidant – flavonoids",
      "Soothes digestion – calms stomach",
      "Fights germs – antimicrobial",
      "Loves your heart – may lower blood pressure",
      "Reduces stress – adaptogen",
      "Fights bacteria – antibacterial"
    ]
  },
  beetroot: {
    nutrients: [
      { name: "Folate", amount: "109 µg", dailyValuePercent: 27 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 14 },
      { name: "Potassium", amount: "325 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "2.8 g", dailyValuePercent: 10 },
      { name: "Vitamin C", amount: "4.9 mg", dailyValuePercent: 5 },
      { name: "Iron", amount: "0.8 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "23 mg", dailyValuePercent: 5 },
      { name: "Nitrates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Gently lowers blood pressure – nitrates improve flow",
      "Boosts exercise performance – increases stamina",
      "Aids digestion – fiber",
      "Reduces inflammation – betalains",
      "Loves your heart – may lower cholesterol",
      "Detoxifies your body – supports liver",
      "Supports brain health – improves blood flow",
      "Prevents anemia – iron and folate"
    ]
  },
  blueberry: {
    nutrients: [
      { name: "Vitamin C", amount: "9.7 mg", dailyValuePercent: 11 },
      { name: "Vitamin K", amount: "19.3 µg", dailyValuePercent: 16 },
      { name: "Manganese", amount: "0.3 mg", dailyValuePercent: 13 },
      { name: "Fiber", amount: "2.4 g", dailyValuePercent: 9 },
      { name: "Anthocyanins", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin E", amount: "0.6 mg", dailyValuePercent: 4 },
      { name: "Copper", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Supports brain health – improves memory",
      "Loves your heart – may lower blood pressure",
      "Antioxidant – high ORAC score",
      "Balances blood sugar – improves insulin sensitivity",
      "Reduces inflammation",
      "Protects your eyes – anthocyanins",
      "Aids digestion – fiber",
      "Prevents UTIs – urinary tract health"
    ]
  },
  "brazil nut": {
    nutrients: [
      { name: "Selenium", amount: "1917 µg", dailyValuePercent: 3485 },
      { name: "Magnesium", amount: "376 mg", dailyValuePercent: 90 },
      { name: "Phosphorus", amount: "725 mg", dailyValuePercent: 58 },
      { name: "Copper", amount: "1.7 mg", dailyValuePercent: 189 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Vitamin E", amount: "5.7 mg", dailyValuePercent: 38 },
      { name: "Thiamin", amount: "0.6 mg", dailyValuePercent: 50 },
      { name: "Healthy fats", amount: "66 g", dailyValuePercent: 85 }
    ],
    healthBenefits: [
      "Supports thyroid health – high selenium",
      "Antioxidant – protects cells",
      "Loves your heart – may lower LDL",
      "Strengthens bones – magnesium and phosphorus",
      "Reduces inflammation",
      "Supports brain health – selenium",
      "Helps with weight control – satiety",
      "Boosts immunity"
    ]
  },
    chamomile: {
    nutrients: [
      { name: "Apigenin", amount: "varies", dailyValuePercent: 0 },
      { name: "Calcium", amount: "50 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "12 mg", dailyValuePercent: 3 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Vitamin A", amount: "15 µg", dailyValuePercent: 2 },
      { name: "Folate", amount: "5 µg", dailyValuePercent: 1 },
      { name: "Antioxidants", amount: "present", dailyValuePercent: 0 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Promotes restful sleep – apigenin acts as a mild sedative",
      "Reduces anxiety and stress – naturally calming",
      "Soothes digestion – relieves upset stomach and gas",
      "Anti‑inflammatory – reduces swelling and pain",
      "Supports skin health – soothes irritation and minor burns",
      "Boosts immune system – antimicrobial properties",
      "Eases menstrual cramps – antispasmodic effects",
      "Rich in antioxidants – protects cells from damage"
    ]
  },
    "black pepper": {
    nutrients: [
      { name: "Manganese", amount: "12.3 mg", dailyValuePercent: 535 },
      { name: "Vitamin K", amount: "163.7 µg", dailyValuePercent: 136 },
      { name: "Iron", amount: "9.7 mg", dailyValuePercent: 54 },
      { name: "Fiber", amount: "25.3 g", dailyValuePercent: 90 },
      { name: "Piperine", amount: "varies", dailyValuePercent: 0 },
      { name: "Calcium", amount: "443 mg", dailyValuePercent: 34 },
      { name: "Magnesium", amount: "171 mg", dailyValuePercent: 41 },
      { name: "Potassium", amount: "1329 mg", dailyValuePercent: 28 }
    ],
    healthBenefits: [
      "Boosts nutrient absorption – piperine enhances curcumin and selenium absorption by up to 2000%",
      "Aids digestion – stimulates digestive enzymes and reduces gas",
      "Powerful antioxidant – protects cells from free radical damage",
      "Reduces inflammation – piperine has anti‑inflammatory properties",
      "Supports brain health – may improve cognitive function and memory",
      "Helps with weight management – may boost metabolism",
      "Balances blood sugar – improves insulin sensitivity",
      "Relieves respiratory congestion – natural expectorant"
    ]
  },
    // ========== MISSING HERBS & SPICES ==========
  lavender: {
    nutrients: [
      { name: "Calcium", amount: "50 mg", dailyValuePercent: 4 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Vitamin A", amount: "10 µg", dailyValuePercent: 1 },
      { name: "Linalool", amount: "varies", dailyValuePercent: 0 },
      { name: "Linalyl acetate", amount: "varies", dailyValuePercent: 0 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Reduces anxiety and stress – naturally calming",
      "Promotes restful sleep – improves sleep quality",
      "Soothes skin irritation – treats minor burns and bites",
      "Relieves headaches – mild analgesic",
      "Anti‑inflammatory – reduces swelling",
      "Antimicrobial – fights bacteria",
      "Eases digestion – relieves upset stomach",
      "Supports hair health – may promote growth"
    ]
  },
  echinacea: {
    nutrients: [
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "15 mg", dailyValuePercent: 4 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Calcium", amount: "20 mg", dailyValuePercent: 2 },
      { name: "Echinacosides", amount: "varies", dailyValuePercent: 0 },
      { name: "Alkamides", amount: "varies", dailyValuePercent: 0 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immune system – reduces cold duration and severity",
      "Anti‑inflammatory – reduces swelling",
      "Antioxidant – protects cells",
      "Wound healing – speeds tissue repair",
      "Fights infections – antimicrobial properties",
      "Reduces sore throat – soothing",
      "Supports respiratory health",
      "May help prevent upper respiratory infections"
    ]
  },
  ginseng: {
    nutrients: [
      { name: "Ginsenosides", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "15 mg", dailyValuePercent: 4 },
      { name: "Potassium", amount: "200 mg", dailyValuePercent: 4 },
      { name: "Zinc", amount: "0.2 mg", dailyValuePercent: 2 },
      { name: "B vitamins", amount: "trace", dailyValuePercent: 0 },
      { name: "Polysaccharides", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts energy – reduces fatigue",
      "Supports immune system – enhances immune cells",
      "Improves brain function – memory and focus",
      "Lowers blood sugar – may improve insulin sensitivity",
      "Reduces stress – adaptogenic properties",
      "May improve erectile dysfunction",
      "Anti‑inflammatory",
      "Heart health – may lower blood pressure"
    ]
  },
  goldenseal: {
    nutrients: [
      { name: "Berberine", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Calcium", amount: "20 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Zinc", amount: "0.1 mg", dailyValuePercent: 1 },
      { name: "Alkaloids", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Antimicrobial – fights bacteria and fungi",
      "Digestive aid – helps diarrhea",
      "Immune support – may reduce cold symptoms",
      "Anti‑inflammatory",
      "Liver health – may protect",
      "Blood sugar – may improve insulin sensitivity",
      "Skin health – treats minor infections",
      "Respiratory – may help sinusitis"
    ]
  },
  valerian: {
    nutrients: [
      { name: "Valerenic acid", amount: "varies", dailyValuePercent: 0 },
      { name: "Calcium", amount: "20 mg", dailyValuePercent: 2 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "50 mg", dailyValuePercent: 1 },
      { name: "Zinc", amount: "0.1 mg", dailyValuePercent: 1 },
      { name: "B vitamins", amount: "trace", dailyValuePercent: 0 },
      { name: "Antioxidants", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Promotes restful sleep – reduces time to fall asleep",
      "Reduces anxiety – calming effects",
      "Relieves stress – adaptogenic",
      "Eases menstrual cramps – antispasmodic",
      "Reduces headaches – mild sedative",
      "Lowers blood pressure – may help",
      "Soothes digestion – antispasmodic",
      "Helps with withdrawal – may aid benzodiazepine discontinuation"
    ]
  },
  "st. john's wort": {
    nutrients: [
      { name: "Hypericin", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Calcium", amount: "20 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 },
      { name: "Tannins", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Lifts mood – may help with mild to moderate depression",
      "Reduces anxiety – calming effects",
      "Anti‑inflammatory",
      "Antioxidant – protects cells",
      "Wound healing – topical use",
      "Antiviral – may fight certain viruses",
      "Supports nerve health",
      "May help with seasonal affective disorder (SAD)"
    ]
  },
  calendula: {
    nutrients: [
      { name: "Vitamin A", amount: "300 µg", dailyValuePercent: 33 },
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Calcium", amount: "50 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "20 mg", dailyValuePercent: 5 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 },
      { name: "Carotenoids", amount: "present", dailyValuePercent: 0 },
      { name: "Saponins", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Heals wounds – speeds skin repair",
      "Reduces inflammation – soothes irritated skin",
      "Antimicrobial – fights bacteria and fungi",
      "Soothes diaper rash and burns",
      "Boosts immune system",
      "Antioxidant – protects cells",
      "Soothes sore throat – as a gargle",
      "Supports lymphatic system"
    ]
  },
  nasturtium: {
    nutrients: [
      { name: "Vitamin C", amount: "100 mg", dailyValuePercent: 111 },
      { name: "Vitamin A", amount: "500 µg", dailyValuePercent: 56 },
      { name: "Iron", amount: "2 mg", dailyValuePercent: 11 },
      { name: "Calcium", amount: "50 mg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "20 mg", dailyValuePercent: 5 },
      { name: "Potassium", amount: "200 mg", dailyValuePercent: 4 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 },
      { name: "Glucosinolates", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Boosts immunity – high vitamin C",
      "Antimicrobial – natural antibiotic",
      "Clears respiratory congestion – expectorant",
      "Antioxidant",
      "Promotes skin healing",
      "Mild diuretic – aids digestion",
      "Supports eye health – vitamin A",
      "Anti‑inflammatory"
    ]
  },
  borage: {
    nutrients: [
      { name: "Gamma‑linolenic acid", amount: "varies", dailyValuePercent: 0 },
      { name: "Vitamin C", amount: "35 mg", dailyValuePercent: 39 },
      { name: "Vitamin A", amount: "210 µg", dailyValuePercent: 23 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "50 mg", dailyValuePercent: 12 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 }
    ],
    healthBenefits: [
      "Anti‑inflammatory – GLA reduces joint pain",
      "Skin health – treats eczema and acne",
      "Hormone balance – relieves PMS symptoms",
      "Heart health – may lower cholesterol",
      "Antioxidant",
      "Respiratory – soothes cough",
      "Arthritis – reduces joint pain",
      "Digestion – mild laxative"
    ]
  },
  stevia: {
    nutrients: [
      { name: "Steviol glycosides", amount: "varies", dailyValuePercent: 0 },
      { name: "Calcium", amount: "10 mg", dailyValuePercent: 1 },
      { name: "Iron", amount: "0.1 mg", dailyValuePercent: 1 },
      { name: "Potassium", amount: "10 mg", dailyValuePercent: 0 },
      { name: "Magnesium", amount: "1 mg", dailyValuePercent: 0 },
      { name: "Fiber", amount: "0.1 g", dailyValuePercent: 0 },
      { name: "Vitamin C", amount: "0.5 mg", dailyValuePercent: 1 },
      { name: "Antioxidants", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Zero‑calorie sweetener – natural sugar alternative",
      "Blood sugar – does not raise glucose",
      "Dental health – no cavity risk",
      "Weight management – reduces sugar intake",
      "Antioxidant – may protect cells",
      "Anti‑inflammatory",
      "Blood pressure – may lower slightly",
      "Safe for diabetics"
    ]
  },
  fenugreek: {
    nutrients: [
      { name: "Fiber", amount: "24 g", dailyValuePercent: 86 },
      { name: "Iron", amount: "33 mg", dailyValuePercent: 183 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Magnesium", amount: "191 mg", dailyValuePercent: 45 },
      { name: "Protein", amount: "23 g", dailyValuePercent: 46 },
      { name: "Vitamin B6", amount: "0.6 mg", dailyValuePercent: 35 },
      { name: "Copper", amount: "1.1 mg", dailyValuePercent: 122 },
      { name: "Saponins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Blood sugar – improves insulin sensitivity",
      "Increases breast milk production – galactagogue",
      "Supports digestion – relieves heartburn",
      "Heart health – may lower cholesterol",
      "Anti‑inflammatory",
      "Boosts testosterone – traditional use",
      "Reduces menstrual pain",
      "Antioxidant"
    ]
  },
  caraway: {
    nutrients: [
      { name: "Fiber", amount: "38 g", dailyValuePercent: 136 },
      { name: "Iron", amount: "16 mg", dailyValuePercent: 89 },
      { name: "Manganese", amount: "1.3 mg", dailyValuePercent: 57 },
      { name: "Calcium", amount: "689 mg", dailyValuePercent: 53 },
      { name: "Magnesium", amount: "258 mg", dailyValuePercent: 61 },
      { name: "Vitamin C", amount: "21 mg", dailyValuePercent: 23 },
      { name: "Vitamin B6", amount: "0.4 mg", dailyValuePercent: 22 },
      { name: "Carvone", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Aids digestion – relieves gas and bloating",
      "Anti‑inflammatory",
      "Antioxidant",
      "Heart health – may lower cholesterol",
      "Blood sugar – may improve insulin sensitivity",
      "Respiratory – expectorant",
      "Antimicrobial – fights bacteria",
      "Soothes menstrual cramps"
    ]
  },
  anise: {
    nutrients: [
      { name: "Iron", amount: "36 mg", dailyValuePercent: 200 },
      { name: "Manganese", amount: "2.3 mg", dailyValuePercent: 100 },
      { name: "Calcium", amount: "646 mg", dailyValuePercent: 50 },
      { name: "Magnesium", amount: "170 mg", dailyValuePercent: 40 },
      { name: "Phosphorus", amount: "440 mg", dailyValuePercent: 35 },
      { name: "Potassium", amount: "1441 mg", dailyValuePercent: 31 },
      { name: "Zinc", amount: "5.3 mg", dailyValuePercent: 48 },
      { name: "Anethole", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – relieves gas and nausea",
      "Lactation – may increase milk supply",
      "Antioxidant",
      "Anti‑inflammatory",
      "Antimicrobial – fights bacteria and fungi",
      "Respiratory – expectorant",
      "Sleep aid – mild sedative",
      "Menstrual pain – antispasmodic"
    ]
  },
  cumin: {
    nutrients: [
      { name: "Iron", amount: "66 mg", dailyValuePercent: 367 },
      { name: "Manganese", amount: "3.3 mg", dailyValuePercent: 143 },
      { name: "Copper", amount: "0.9 mg", dailyValuePercent: 100 },
      { name: "Magnesium", amount: "366 mg", dailyValuePercent: 87 },
      { name: "Calcium", amount: "931 mg", dailyValuePercent: 72 },
      { name: "Phosphorus", amount: "499 mg", dailyValuePercent: 40 },
      { name: "Zinc", amount: "4.8 mg", dailyValuePercent: 44 },
      { name: "Cuminaldehyde", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – stimulates digestive enzymes",
      "Iron source – helps prevent anemia",
      "Antioxidant",
      "Blood sugar – may improve insulin sensitivity",
      "Anti‑inflammatory – cuminaldehyde",
      "Heart health – may lower cholesterol",
      "Weight loss – may boost metabolism",
      "Memory – may improve cognitive function"
    ]
  },
  lovage: {
    nutrients: [
      { name: "Vitamin C", amount: "35 mg", dailyValuePercent: 39 },
      { name: "Vitamin A", amount: "200 µg", dailyValuePercent: 22 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Potassium", amount: "600 mg", dailyValuePercent: 13 },
      { name: "Magnesium", amount: "50 mg", dailyValuePercent: 12 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Coumarins", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – relieves gas",
      "Anti‑inflammatory",
      "Diuretic – reduces water retention",
      "Immune support – vitamin C",
      "Bone health – vitamin K",
      "Heart health – potassium",
      "Respiratory – expectorant",
      "Antioxidant"
    ]
  },
  marjoram: {
    nutrients: [
      { name: "Vitamin K", amount: "621 µg", dailyValuePercent: 518 },
      { name: "Vitamin A", amount: "200 µg", dailyValuePercent: 22 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Manganese", amount: "1.5 mg", dailyValuePercent: 65 },
      { name: "Vitamin C", amount: "20 mg", dailyValuePercent: 22 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Potassium", amount: "400 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Bone health – high vitamin K",
      "Digestion – relieves gas",
      "Antioxidant – flavonoids",
      "Heart health – may lower blood pressure",
      "Anti‑inflammatory",
      "Immune support – antimicrobial",
      "Menstrual pain – reduces cramps",
      "Sleep aid – mild sedative"
    ]
  },
  tarragon: {
    nutrients: [
      { name: "Manganese", amount: "0.8 mg", dailyValuePercent: 35 },
      { name: "Iron", amount: "3.2 mg", dailyValuePercent: 18 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Potassium", amount: "302 mg", dailyValuePercent: 6 },
      { name: "Vitamin A", amount: "210 µg", dailyValuePercent: 23 },
      { name: "Vitamin C", amount: "50 mg", dailyValuePercent: 56 },
      { name: "Folate", amount: "274 µg", dailyValuePercent: 69 },
      { name: "Estragole", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – stimulates appetite",
      "Antioxidant – flavonoids",
      "Anti‑inflammatory",
      "Sleep aid – mild sedative",
      "Heart health – may lower blood pressure",
      "Blood sugar – may improve insulin sensitivity",
      "Immune support – vitamin C",
      "Oral health – antimicrobial"
    ]
  },
  sorrel: {
    nutrients: [
      { name: "Vitamin C", amount: "48 mg", dailyValuePercent: 53 },
      { name: "Vitamin A", amount: "200 µg", dailyValuePercent: 22 },
      { name: "Magnesium", amount: "100 mg", dailyValuePercent: 24 },
      { name: "Iron", amount: "2.5 mg", dailyValuePercent: 14 },
      { name: "Potassium", amount: "390 mg", dailyValuePercent: 8 },
      { name: "Calcium", amount: "44 mg", dailyValuePercent: 3 },
      { name: "Oxalic acid", amount: "varies", dailyValuePercent: 0 },
      { name: "Anthraquinones", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Immune support – high vitamin C",
      "Digestion – mild laxative",
      "Antioxidant – anthocyanins",
      "Anti‑inflammatory",
      "Heart health – potassium",
      "Bone health – vitamin K",
      "Caution – oxalates may cause kidney stones",
      "Skin health – vitamin A"
    ]
  },
  chervil: {
    nutrients: [
      { name: "Vitamin C", amount: "50 mg", dailyValuePercent: 56 },
      { name: "Vitamin A", amount: "200 µg", dailyValuePercent: 22 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Magnesium", amount: "50 mg", dailyValuePercent: 12 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Flavonoids", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – relieves gas",
      "Antioxidant",
      "Anti‑inflammatory",
      "Immune support – vitamin C",
      "Bone health – calcium",
      "Heart health – potassium",
      "Skin health – vitamin A",
      "Blood pressure – may lower"
    ]
  },
  savory: {
    nutrients: [
      { name: "Vitamin A", amount: "300 µg", dailyValuePercent: 33 },
      { name: "Vitamin C", amount: "30 mg", dailyValuePercent: 33 },
      { name: "Iron", amount: "10 mg", dailyValuePercent: 56 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Manganese", amount: "1 mg", dailyValuePercent: 43 },
      { name: "Fiber", amount: "10 g", dailyValuePercent: 36 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Carvacrol", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – relieves gas",
      "Antimicrobial – carvacrol",
      "Antioxidant",
      "Anti‑inflammatory",
      "Respiratory – expectorant",
      "Heart health – may lower blood pressure",
      "Immune support",
      "Pain relief – mild analgesic"
    ]
  },

  // ========== MISSING NUTS ==========
  hazelnut: {
    nutrients: [
      { name: "Vitamin E", amount: "15 mg", dailyValuePercent: 100 },
      { name: "Manganese", amount: "6.2 mg", dailyValuePercent: 270 },
      { name: "Copper", amount: "1.7 mg", dailyValuePercent: 189 },
      { name: "Magnesium", amount: "163 mg", dailyValuePercent: 39 },
      { name: "Healthy fats", amount: "61 g", dailyValuePercent: 78 },
      { name: "Fiber", amount: "9.7 g", dailyValuePercent: 35 },
      { name: "Thiamin", amount: "0.6 mg", dailyValuePercent: 50 },
      { name: "Vitamin B6", amount: "0.6 mg", dailyValuePercent: 35 }
    ],
    healthBenefits: [
      "Heart health – monounsaturated fats",
      "Antioxidant – vitamin E",
      "Bone health – manganese and copper",
      "Weight management – satiety",
      "Blood sugar – may improve insulin sensitivity",
      "Brain health – vitamin B6",
      "Skin health – vitamin E",
      "Anti‑inflammatory"
    ]
  },
  chestnut: {
    nutrients: [
      { name: "Vitamin C", amount: "43 mg", dailyValuePercent: 48 },
      { name: "Fiber", amount: "8 g", dailyValuePercent: 29 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Copper", amount: "0.4 mg", dailyValuePercent: 44 },
      { name: "Potassium", amount: "518 mg", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "84 mg", dailyValuePercent: 20 },
      { name: "Phosphorus", amount: "87 mg", dailyValuePercent: 7 },
      { name: "Carbohydrates", amount: "44 g", dailyValuePercent: 16 }
    ],
    healthBenefits: [
      "Heart health – low in fat",
      "Digestion – high fiber",
      "Bone health – magnesium and copper",
      "Energy – complex carbohydrates",
      "Antioxidant – vitamin C",
      "Gluten‑free",
      "Blood sugar – low glycemic index",
      "Weight management – satiety"
    ]
  },
  pecan: {
    nutrients: [
      { name: "Manganese", amount: "4.5 mg", dailyValuePercent: 196 },
      { name: "Copper", amount: "1.2 mg", dailyValuePercent: 133 },
      { name: "Thiamin", amount: "0.7 mg", dailyValuePercent: 58 },
      { name: "Magnesium", amount: "121 mg", dailyValuePercent: 29 },
      { name: "Zinc", amount: "4.5 mg", dailyValuePercent: 41 },
      { name: "Healthy fats", amount: "72 g", dailyValuePercent: 92 },
      { name: "Fiber", amount: "9.6 g", dailyValuePercent: 34 },
      { name: "Vitamin E", amount: "1.4 mg", dailyValuePercent: 9 }
    ],
    healthBenefits: [
      "Heart health – monounsaturated fats",
      "Antioxidant – ellagic acid",
      "Bone health – manganese and copper",
      "Weight management – satiety",
      "Brain health – thiamin",
      "Digestion – fiber",
      "Blood sugar – may improve insulin sensitivity",
      "Anti‑inflammatory"
    ]
  },
  pistachio: {
    nutrients: [
      { name: "Vitamin B6", amount: "1.7 mg", dailyValuePercent: 100 },
      { name: "Thiamin", amount: "0.9 mg", dailyValuePercent: 75 },
      { name: "Copper", amount: "1.3 mg", dailyValuePercent: 144 },
      { name: "Manganese", amount: "1.2 mg", dailyValuePercent: 52 },
      { name: "Phosphorus", amount: "490 mg", dailyValuePercent: 39 },
      { name: "Healthy fats", amount: "45 g", dailyValuePercent: 58 },
      { name: "Fiber", amount: "10.3 g", dailyValuePercent: 37 },
      { name: "Protein", amount: "20 g", dailyValuePercent: 40 }
    ],
    healthBenefits: [
      "Heart health – may lower LDL",
      "Blood sugar – may reduce glycemic response",
      "Weight management – satiety",
      "Eye health – lutein and zeaxanthin",
      "Digestion – fiber",
      "Antioxidant – vitamin E",
      "Bone health – phosphorus",
      "Gut health – prebiotic fiber"
    ]
  },
  "pili nut": {
    nutrients: [
      { name: "Magnesium", amount: "300 mg", dailyValuePercent: 71 },
      { name: "Phosphorus", amount: "500 mg", dailyValuePercent: 40 },
      { name: "Potassium", amount: "600 mg", dailyValuePercent: 13 },
      { name: "Healthy fats", amount: "70 g", dailyValuePercent: 90 },
      { name: "Fiber", amount: "8 g", dailyValuePercent: 29 },
      { name: "Protein", amount: "11 g", dailyValuePercent: 22 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Vitamin E", amount: "2 mg", dailyValuePercent: 13 }
    ],
    healthBenefits: [
      "Heart health – healthy fats",
      "Bone health – magnesium and phosphorus",
      "Digestion – fiber",
      "Weight management – satiety",
      "Antioxidant – vitamin E",
      "Blood sugar – may improve insulin sensitivity",
      "Skin health",
      "Energy – protein and fats"
    ]
  },
  shea: {
    nutrients: [
      { name: "Fat", amount: "100 g", dailyValuePercent: 128 },
      { name: "Vitamin E", amount: "15 mg", dailyValuePercent: 100 },
      { name: "Vitamin K", amount: "1 µg", dailyValuePercent: 1 },
      { name: "Iron", amount: "0.1 mg", dailyValuePercent: 1 },
      { name: "Calcium", amount: "5 mg", dailyValuePercent: 0 },
      { name: "Magnesium", amount: "0.5 mg", dailyValuePercent: 0 },
      { name: "Triterpenes", amount: "varies", dailyValuePercent: 0 },
      { name: "Cinnamic acid", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Skin moisturizer – shea butter",
      "Anti‑inflammatory",
      "Antioxidant",
      "Wound healing",
      "Hair conditioner",
      "Sun protection (mild)",
      "Lip balm",
      "Not for direct consumption"
    ]
  },

  // ========== MISSING CASH & INDUSTRIAL CROPS ==========
  cocoa: {
    nutrients: [
      { name: "Fiber", amount: "37 g", dailyValuePercent: 132 },
      { name: "Iron", amount: "13.9 mg", dailyValuePercent: 77 },
      { name: "Magnesium", amount: "499 mg", dailyValuePercent: 119 },
      { name: "Copper", amount: "3.8 mg", dailyValuePercent: 422 },
      { name: "Manganese", amount: "3.8 mg", dailyValuePercent: 165 },
      { name: "Phosphorus", amount: "734 mg", dailyValuePercent: 59 },
      { name: "Zinc", amount: "6.8 mg", dailyValuePercent: 62 },
      { name: "Flavonols", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Heart health – improves blood flow",
      "Brain health – may enhance cognitive function",
      "Mood booster – contains theobromine",
      "Antioxidant – high in flavanols",
      "Blood pressure – may lower",
      "Skin health – protects from UV damage",
      "Anti‑inflammatory",
      "Cholesterol – may improve HDL/LDL ratio"
    ]
  },
  coffee: {
    nutrients: [
      { name: "Caffeine", amount: "95 mg", dailyValuePercent: 0 },
      { name: "Riboflavin", amount: "0.2 mg", dailyValuePercent: 11 },
      { name: "Magnesium", amount: "7 mg", dailyValuePercent: 2 },
      { name: "Potassium", amount: "116 mg", dailyValuePercent: 2 },
      { name: "Antioxidants", amount: "high", dailyValuePercent: 0 },
      { name: "Niacin", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 3 },
      { name: "Chlorogenic acid", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Alertness – caffeine blocks adenosine",
      "Antioxidant – reduces oxidative stress",
      "Brain health – may lower risk of Alzheimer's",
      "Liver health – reduces risk of cirrhosis",
      "Metabolism – may boost metabolic rate",
      "Heart health – moderate consumption protective",
      "Type 2 diabetes – may reduce risk",
      "Depression – may lower risk"
    ]
  },
  tea: {
    nutrients: [
      { name: "Caffeine", amount: "11 mg", dailyValuePercent: 0 },
      { name: "Antioxidants", amount: "high", dailyValuePercent: 0 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "20 mg", dailyValuePercent: 0 },
      { name: "Folate", amount: "5 µg", dailyValuePercent: 1 },
      { name: "Vitamin B2", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Catechins", amount: "varies", dailyValuePercent: 0 },
      { name: "Theanine", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Antioxidant – catechins",
      "Heart health – may lower cholesterol",
      "Brain health – improves alertness (caffeine)",
      "Weight management – may boost metabolism",
      "Cancer prevention – polyphenols",
      "Bone health – may improve density",
      "Hydration – fluid intake",
      "Stress reduction – theanine"
    ]
  },
  cotton: {
    nutrients: [
      { name: "Fiber", amount: "50 g", dailyValuePercent: 179 },
      { name: "Protein", amount: "20 g", dailyValuePercent: 40 },
      { name: "Iron", amount: "3 mg", dailyValuePercent: 17 },
      { name: "Magnesium", amount: "100 mg", dailyValuePercent: 24 },
      { name: "Potassium", amount: "500 mg", dailyValuePercent: 11 },
      { name: "Calcium", amount: "100 mg", dailyValuePercent: 8 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 },
      { name: "Gossypol", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Not for human consumption (toxic gossypol)",
      "Used for fibre and oil production",
      "Cottonseed oil is edible after refining",
      "No direct health benefits as food"
    ]
  },
  rubber: {
    nutrients: [
      { name: "Latex", amount: "varies", dailyValuePercent: 0 },
      { name: "Protein", amount: "2 g", dailyValuePercent: 4 },
      { name: "Fiber", amount: "10 g", dailyValuePercent: 36 },
      { name: "Calcium", amount: "50 mg", dailyValuePercent: 4 },
      { name: "Iron", amount: "1 mg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "20 mg", dailyValuePercent: 5 },
      { name: "Zinc", amount: "0.5 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Not for human consumption",
      "Used for latex production",
      "Allergenic to some individuals",
      "No nutritional benefits"
    ]
  },
  "oil palm": {
    nutrients: [
      { name: "Vitamin E", amount: "15 mg", dailyValuePercent: 100 },
      { name: "Vitamin K", amount: "8 µg", dailyValuePercent: 7 },
      { name: "Healthy fats", amount: "100 g", dailyValuePercent: 128 },
      { name: "Saturated fat", amount: "49 g", dailyValuePercent: 245 },
      { name: "Monounsaturated fat", amount: "37 g", dailyValuePercent: 0 },
      { name: "Polyunsaturated fat", amount: "9 g", dailyValuePercent: 0 },
      { name: "Carotenoids", amount: "present", dailyValuePercent: 0 },
      { name: "Tocotrienols", amount: "present", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Cooking oil – high in vitamin E",
      "Antioxidant – tocotrienols",
      "Heart health – may improve cholesterol ratios (red palm oil)",
      "Skin health – vitamin E",
      "Brain health – may protect against stroke",
      "Vitamin A – red palm oil contains carotenoids",
      "Energy – high calorie",
      "Used in food processing"
    ]
  },
  hemp: {
    nutrients: [
      { name: "Protein", amount: "31.6 g", dailyValuePercent: 63 },
      { name: "Fiber", amount: "4 g", dailyValuePercent: 14 },
      { name: "Magnesium", amount: "700 mg", dailyValuePercent: 167 },
      { name: "Iron", amount: "8 mg", dailyValuePercent: 44 },
      { name: "Zinc", amount: "9.9 mg", dailyValuePercent: 90 },
      { name: "Omega-3 (ALA)", amount: "8.7 g", dailyValuePercent: 0 },
      { name: "Omega-6 (LA)", amount: "27.5 g", dailyValuePercent: 0 },
      { name: "Vitamin E", amount: "0.8 mg", dailyValuePercent: 5 }
    ],
    healthBenefits: [
      "Heart health – balanced omega-3/6 ratio",
      "Skin health – essential fatty acids",
      "Brain health – may reduce inflammation",
      "Protein source – complete amino acid profile",
      "Bone health – magnesium",
      "Hormone balance – gamma‑linolenic acid",
      "Digestion – fiber",
      "Anemia – iron"
    ]
  },
  flax: {
    nutrients: [
      { name: "Fiber", amount: "27.3 g", dailyValuePercent: 98 },
      { name: "Manganese", amount: "2.5 mg", dailyValuePercent: 109 },
      { name: "Thiamin", amount: "1.6 mg", dailyValuePercent: 133 },
      { name: "Magnesium", amount: "392 mg", dailyValuePercent: 93 },
      { name: "Phosphorus", amount: "642 mg", dailyValuePercent: 51 },
      { name: "Copper", amount: "1.2 mg", dailyValuePercent: 133 },
      { name: "Omega-3 (ALA)", amount: "22.8 g", dailyValuePercent: 0 },
      { name: "Lignans", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – high fiber",
      "Heart health – ALA reduces inflammation",
      "Hormone balance – lignans",
      "Blood sugar – may improve insulin sensitivity",
      "Weight management – satiety",
      "Skin health – omega-3s",
      "Cancer prevention – may reduce breast cancer risk",
      "Constipation – natural laxative"
    ]
  },
  jute: {
    nutrients: [
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Protein", amount: "8 g", dailyValuePercent: 16 },
      { name: "Calcium", amount: "200 mg", dailyValuePercent: 15 },
      { name: "Iron", amount: "5 mg", dailyValuePercent: 28 },
      { name: "Magnesium", amount: "100 mg", dailyValuePercent: 24 },
      { name: "Potassium", amount: "400 mg", dailyValuePercent: 9 },
      { name: "Zinc", amount: "2 mg", dailyValuePercent: 18 },
      { name: "Manganese", amount: "1 mg", dailyValuePercent: 43 }
    ],
    healthBenefits: [
      "Used for fibre production",
      "Not for human consumption",
      "Leaves are edible in some cultures",
      "Good source of fiber and minerals"
    ]
  },
  kenaf: {
    nutrients: [
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Protein", amount: "10 g", dailyValuePercent: 20 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "4 mg", dailyValuePercent: 22 },
      { name: "Magnesium", amount: "80 mg", dailyValuePercent: 19 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Fibre crop",
      "Leaves edible (similar to spinach)",
      "Good source of fiber and minerals",
      "Antioxidant properties"
    ]
  },
  ramie: {
    nutrients: [
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Protein", amount: "10 g", dailyValuePercent: 20 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "4 mg", dailyValuePercent: 22 },
      { name: "Magnesium", amount: "80 mg", dailyValuePercent: 19 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Fibre crop",
      "Not for human consumption",
      "Used for textiles",
      "No nutritional benefits"
    ]
  },
  bamboo: {
    nutrients: [
      { name: "Fiber", amount: "30 g", dailyValuePercent: 107 },
      { name: "Protein", amount: "10 g", dailyValuePercent: 20 },
      { name: "Calcium", amount: "150 mg", dailyValuePercent: 12 },
      { name: "Iron", amount: "4 mg", dailyValuePercent: 22 },
      { name: "Magnesium", amount: "80 mg", dailyValuePercent: 19 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Zinc", amount: "1 mg", dailyValuePercent: 9 },
      { name: "Vitamin C", amount: "5 mg", dailyValuePercent: 6 }
    ],
    healthBenefits: [
      "Bamboo shoots are edible – low in calories",
      "Rich in fiber – aids digestion",
      "Heart health – potassium",
      "Antioxidant – phenolic compounds",
      "Bone health – calcium and magnesium",
      "Weight management – low calorie",
      "Cholesterol – may lower LDL",
      "Traditional medicine uses"
    ]
  },
  mushroom: {
    nutrients: [
      { name: "Selenium", amount: "9.3 µg", dailyValuePercent: 17 },
      { name: "Riboflavin", amount: "0.4 mg", dailyValuePercent: 31 },
      { name: "Niacin", amount: "3.6 mg", dailyValuePercent: 23 },
      { name: "Copper", amount: "0.3 mg", dailyValuePercent: 33 },
      { name: "Vitamin D", amount: "7 IU", dailyValuePercent: 1 },
      { name: "Potassium", amount: "318 mg", dailyValuePercent: 7 },
      { name: "Fiber", amount: "1 g", dailyValuePercent: 4 },
      { name: "Ergothioneine", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Immune support – beta‑glucans",
      "Antioxidant – ergothioneine",
      "Bone health – vitamin D (if UV‑exposed)",
      "Heart health – may lower cholesterol",
      "Weight management – low calorie",
      "Brain health – may reduce cognitive decline",
      "Digestion – fiber",
      "Anti‑inflammatory"
    ]
  },
  aloe_vera: {
    nutrients: [
      { name: "Vitamin C", amount: "9.1 mg", dailyValuePercent: 10 },
      { name: "Vitamin A", amount: "6 µg", dailyValuePercent: 1 },
      { name: "Folate", amount: "3 µg", dailyValuePercent: 1 },
      { name: "Calcium", amount: "8 mg", dailyValuePercent: 1 },
      { name: "Magnesium", amount: "4 mg", dailyValuePercent: 1 },
      { name: "Zinc", amount: "0.1 mg", dailyValuePercent: 1 },
      { name: "Polysaccharides", amount: "varies", dailyValuePercent: 0 },
      { name: "Anthraquinones", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Skin healing – treats burns and wounds",
      "Digestion – soothes acid reflux",
      "Hydration – high water content",
      "Antioxidant – protects skin from UV",
      "Immune support – acemannan",
      "Dental health – reduces plaque",
      "Blood sugar – may lower fasting glucose",
      "Constipation – natural laxative (latex)"
    ]
  },
  wasabi: {
    nutrients: [
      { name: "Vitamin C", amount: "10 mg", dailyValuePercent: 11 },
      { name: "Fiber", amount: "2 g", dailyValuePercent: 7 },
      { name: "Potassium", amount: "100 mg", dailyValuePercent: 2 },
      { name: "Calcium", amount: "20 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "10 mg", dailyValuePercent: 2 },
      { name: "Iron", amount: "0.5 mg", dailyValuePercent: 3 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 },
      { name: "Allyl isothiocyanate", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Antimicrobial – fights bacteria",
      "Anti‑inflammatory",
      "Respiratory – clears sinuses",
      "Anti‑cancer – isothiocyanates",
      "Digestion – stimulates appetite",
      "Immune support – vitamin C",
      "Blood clotting – vitamin K",
      "Pain relief – mild analgesic"
    ]
  },

  // ========== MISSING VEGETABLES & ROOTS ==========
  radish: {
    nutrients: [
      { name: "Vitamin C", amount: "14.8 mg", dailyValuePercent: 16 },
      { name: "Folate", amount: "25 µg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "1.6 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "233 mg", dailyValuePercent: 5 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Calcium", amount: "25 mg", dailyValuePercent: 2 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Digestion – stimulates bile production",
      "Antioxidant – anthocyanins (red radish)",
      "Heart health – potassium",
      "Anti‑cancer – glucosinolates",
      "Hydration – high water content",
      "Immune support – vitamin C",
      "Weight management – low calorie",
      "Skin health – vitamin C"
    ]
  },
  parsnip: {
    nutrients: [
      { name: "Vitamin C", amount: "17 mg", dailyValuePercent: 19 },
      { name: "Fiber", amount: "4.9 g", dailyValuePercent: 18 },
      { name: "Folate", amount: "67 µg", dailyValuePercent: 17 },
      { name: "Manganese", amount: "0.6 mg", dailyValuePercent: 26 },
      { name: "Potassium", amount: "375 mg", dailyValuePercent: 8 },
      { name: "Vitamin K", amount: "22.5 µg", dailyValuePercent: 19 },
      { name: "Magnesium", amount: "29 mg", dailyValuePercent: 7 },
      { name: "Vitamin E", amount: "1.5 mg", dailyValuePercent: 10 }
    ],
    healthBenefits: [
      "Digestion – high fiber",
      "Heart health – potassium",
      "Immune support – vitamin C",
      "Bone health – vitamin K",
      "Antioxidant – polyacetylenes",
      "Weight management – low calorie",
      "Blood sugar – may improve insulin sensitivity",
      "Eye health – vitamin A"
    ]
  },
  turnip: {
    nutrients: [
      { name: "Vitamin C", amount: "21 mg", dailyValuePercent: 23 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Potassium", amount: "191 mg", dailyValuePercent: 4 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 5 },
      { name: "Calcium", amount: "30 mg", dailyValuePercent: 2 },
      { name: "Magnesium", amount: "11 mg", dailyValuePercent: 3 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Immune support – vitamin C",
      "Digestion – fiber",
      "Heart health – potassium",
      "Anti‑cancer – glucosinolates",
      "Bone health – vitamin K",
      "Weight management – low calorie",
      "Blood pressure – potassium",
      "Antioxidant"
    ]
  },
  rutabaga: {
    nutrients: [
      { name: "Vitamin C", amount: "25 mg", dailyValuePercent: 28 },
      { name: "Fiber", amount: "2.5 g", dailyValuePercent: 9 },
      { name: "Potassium", amount: "305 mg", dailyValuePercent: 6 },
      { name: "Manganese", amount: "0.1 mg", dailyValuePercent: 6 },
      { name: "Vitamin B6", amount: "0.1 mg", dailyValuePercent: 8 },
      { name: "Calcium", amount: "43 mg", dailyValuePercent: 3 },
      { name: "Magnesium", amount: "20 mg", dailyValuePercent: 5 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Immune support – vitamin C",
      "Digestion – fiber",
      "Heart health – potassium",
      "Anti‑cancer – glucosinolates",
      "Bone health – vitamin K",
      "Weight management – low calorie",
      "Blood pressure – potassium",
      "Antioxidant"
    ]
  },
  horseradish: {
    nutrients: [
      { name: "Vitamin C", amount: "24.9 mg", dailyValuePercent: 28 },
      { name: "Folate", amount: "57 µg", dailyValuePercent: 14 },
      { name: "Fiber", amount: "3.3 g", dailyValuePercent: 12 },
      { name: "Magnesium", amount: "27 mg", dailyValuePercent: 6 },
      { name: "Potassium", amount: "246 mg", dailyValuePercent: 5 },
      { name: "Calcium", amount: "56 mg", dailyValuePercent: 4 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 },
      { name: "Sinigrin", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Antimicrobial – fights bacteria",
      "Respiratory – clears sinuses",
      "Digestion – stimulates appetite",
      "Anti‑inflammatory",
      "Immune support – vitamin C",
      "Cancer prevention – glucosinolates",
      "Urinary tract – may prevent UTIs",
      "Pain relief – mild analgesic"
    ]
  },
  kohlrabi: {
    nutrients: [
      { name: "Vitamin C", amount: "62 mg", dailyValuePercent: 69 },
      { name: "Fiber", amount: "3.6 g", dailyValuePercent: 13 },
      { name: "Potassium", amount: "350 mg", dailyValuePercent: 7 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 12 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 9 },
      { name: "Folate", amount: "16 µg", dailyValuePercent: 4 },
      { name: "Magnesium", amount: "19 mg", dailyValuePercent: 5 },
      { name: "Glucosinolates", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Immune support – high vitamin C",
      "Digestion – fiber",
      "Bone health – vitamin K",
      "Anti‑inflammatory",
      "Heart health – potassium",
      "Weight management – low calorie",
      "Antioxidant",
      "Blood sugar regulation"
    ]
  },
  celeriac: {
    nutrients: [
      { name: "Vitamin K", amount: "41 µg", dailyValuePercent: 34 },
      { name: "Phosphorus", amount: "115 mg", dailyValuePercent: 9 },
      { name: "Potassium", amount: "300 mg", dailyValuePercent: 6 },
      { name: "Fiber", amount: "1.8 g", dailyValuePercent: 6 },
      { name: "Vitamin C", amount: "8 mg", dailyValuePercent: 9 },
      { name: "Vitamin B6", amount: "0.2 mg", dailyValuePercent: 10 },
      { name: "Magnesium", amount: "20 mg", dailyValuePercent: 5 },
      { name: "Manganese", amount: "0.2 mg", dailyValuePercent: 8 }
    ],
    healthBenefits: [
      "Bone health – vitamin K",
      "Digestion – fiber",
      "Heart health – potassium",
      "Antioxidant",
      "Immune support – vitamin C",
      "Weight management – low calorie",
      "Anti‑inflammatory",
      "Blood pressure regulation"
    ]
  },

  buckwheat: {
    nutrients: [
      { name: "Manganese", amount: "1.3 mg", dailyValuePercent: 57 },
      { name: "Magnesium", amount: "231 mg", dailyValuePercent: 55 },
      { name: "Copper", amount: "0.4 mg", dailyValuePercent: 44 },
      { name: "Fiber", amount: "10 g", dailyValuePercent: 36 },
      { name: "Phosphorus", amount: "347 mg", dailyValuePercent: 28 },
      { name: "Iron", amount: "2.2 mg", dailyValuePercent: 12 },
      { name: "Zinc", amount: "2.4 mg", dailyValuePercent: 22 },
      { name: "Protein", amount: "13 g", dailyValuePercent: 26 }
    ],
    healthBenefits: [
      "Loves your heart – may lower cholesterol",
      "Balances blood sugar – low glycemic index",
      "Aids digestion – high fiber",
      "Gluten-free",
      "Strengthens bones – magnesium",
      "Antioxidant – rutin",
      "Helps with weight control – satiety",
      "Gently lowers blood pressure – magnesium"
    ]
  }
  // Note: cabbage is NOT duplicated here – it already exists in VEGETABLES section.
};

// ========== END OF cropBenefits ==========

// Helper to get crop benefits with fallback
export function getCropBenefits(cropKey: string): CropBenefit | null {
  const lowerKey = cropKey.toLowerCase();
  if (cropBenefits[lowerKey]) {
    return cropBenefits[lowerKey];
  }
  // Return a generic benefits object if not found
  return {
    nutrients: [
      { name: "Varied nutrients", amount: "depends on variety", dailyValuePercent: 0 },
      { name: "Fiber", amount: "2‑5 g", dailyValuePercent: 8 },
      { name: "Vitamins", amount: "A, C, B‑complex", dailyValuePercent: 0 },
      { name: "Minerals", amount: "Potassium, magnesium", dailyValuePercent: 0 },
      { name: "Antioxidants", amount: "present", dailyValuePercent: 0 },
      { name: "Protein", amount: "1‑3 g", dailyValuePercent: 2 },
      { name: "Carbohydrates", amount: "10‑20 g", dailyValuePercent: 4 },
      { name: "Healthy fats", amount: "varies", dailyValuePercent: 0 }
    ],
    healthBenefits: [
      "Supports overall health with essential nutrients",
      "May help prevent chronic diseases",
      "Contributes to a balanced diet",
      "Hydration (high water content in many crops)",
      "Digestive health due to fiber",
      "Immune support from vitamins and antioxidants",
      "Heart health from potassium and fiber",
      "Weight management due to low calorie density"
    ]
  };
}