// lib/data/fertilizerRates.ts
// Based on Bungoma Farm Management Guidelines 2017 & East African agronomy standards
// COMPLETE DATABASE – COVERS ALL 219 CROPS FROM PEST/DISEASE MAPPING

export const fertilizerRates = {
  // ========== VEGETABLES (Leafy, Fruit, Root) ==========
  "african nightshade": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (after each harvest)", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "amaranth": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (after each harvest)", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "arugula": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "asparagus": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } },
      { name: "Compost", rate: 20, unit: "tons/ha", provides: { n: 100, p: 40, k: 100 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha/year", provides: { n: 40.5 } },
      { name: "NPK 15:15:15", rate: 200, unit: "kg/ha/year", provides: { n: 30, p: 30, k: 30 } }
    ]
  },
  "beetroot": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "broccoli": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "brinjals": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "cabbages": {
    planting: [
      { name: "DAP/TSP", rate: 200, unit: "kg/ha", provides: { p: 92 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (4-6 weeks)", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "capsicums": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "carrots": {
    planting: [],
    topdressing: [
      { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "cauliflower": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "celery": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "chillies": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "coriander": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "courgettes": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "cucumbers": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "eggplants": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "endive": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "ethiopian kale": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "french beans": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
    ],
    topdressing: []
  },
  "garden peas": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
    ],
    topdressing: []
  },
  "green beans": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
    ],
    topdressing: []
  },
  "kales": {
    planting: [
      { name: "TSP/DSP", rate: 200, unit: "kg/ha", provides: { p: 92 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (4-6 weeks)", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "kohlrabi": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "leeks": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "lettuce": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "okra": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (after each harvest)", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "onions": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "kg/ha", provides: { n: 81 } }
    ]
  },
  "parsley": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "pumpkin leaves": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "radish": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "rhubarb": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "spinach": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } },
      { name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (after each harvest)", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "spider plant": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "sweet potato leaves": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "tomatoes": {
    planting: [
      { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "CAN (at flowering)", rate: 200, unit: "kg/ha", provides: { n: 54 } }
    ]
  },
  "turnip": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "watercress": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  // Additional vegetables
  "bok choy": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "collard greens": {
    planting: [{ name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }],
    topdressing: [{ name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }]
  },
  "mustard greens": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "swiss chard": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "radicchio": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "escarole": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "frisee": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "turnip greens": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "rutabaga": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "jute mallow": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "slender leaf": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },

  // ========== FRUITS ==========
  "avocados": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 17:17:17", rate: 1, unit: "kg/tree/year", provides: { n: 170, p: 170, k: 170 } }
    ]
  },
  "bananas": {
    planting: [
      { name: "TSP", rate: 100, unit: "g/hole", provides: { p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 125, unit: "g/stool/year", provides: { n: 33.75 } }
    ]
  },
  "breadfruit": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "coconut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "grapefruit": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "guava": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "jackfruit": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "lemons": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "limes": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "mangoes": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 17:17:17", rate: 1, unit: "kg/tree/year", provides: { n: 170, p: 170, k: 170 } }
    ]
  },
  "oranges": {
    planting: [
      { name: "TSP", rate: 1, unit: "bag", provides: { p: 46 } }
    ],
    topdressing: [
      { name: "DAP", rate: 1, unit: "bag", provides: { n: 18, p: 46 } },
      { name: "CAN", rate: 1, unit: "bag", provides: { n: 27 } }
    ]
  },
  "papayas": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "g/tree", provides: { n: 27 } },
      { name: "NPK 15:15:15", rate: 200, unit: "g/tree", provides: { n: 30, p: 30, k: 30 } }
    ]
  },
  "passion fruit": {
    planting: [
      { name: "DAP", rate: 175, unit: "g/hole", provides: { n: 31.5, p: 80.5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 120, unit: "g/plant", provides: { n: 32.4 } }
    ]
  },
  "pawpaws": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "g/tree", provides: { n: 27 } },
      { name: "NPK 15:15:15", rate: 200, unit: "g/tree", provides: { n: 30, p: 30, k: 30 } }
    ]
  },
  "pineapples": {
    planting: [
      { name: "Compound fertilizer", rate: 300, unit: "kg/ha", provides: { n: 45, p: 45, k: 45 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "kg/ha", provides: { n: 81 } }
    ]
  },
  "pomegranate": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "pumpkin": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } },
      { name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "NPK 15:15:15", rate: 150, unit: "kg/ha", provides: { n: 22.5, p: 22.5, k: 22.5 } }
    ]
  },
  "star fruit": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "watermelons": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "NPK 20:20:20", rate: 200, unit: "kg/ha", provides: { n: 40, p: 40, k: 40 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } },
      { name: "NPK at flowering", rate: 150, unit: "kg/ha", provides: { n: 30, p: 30, k: 30 } }
    ]
  },
  // Additional fruits
  "fig": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "date palm": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "mulberry": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "lychee": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "persimmon": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "gooseberry": {
    planting: [
      { name: "DAP", rate: 200, unit: "g/hole", provides: { n: 36, p: 92 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "currant": {
    planting: [
      { name: "DAP", rate: 200, unit: "g/hole", provides: { n: 36, p: 92 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "elderberry": {
    planting: [
      { name: "DAP", rate: 200, unit: "g/hole", provides: { n: 36, p: 92 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "rambutan": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "durian": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "mangosteen": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "longan": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "marula": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },

  // ========== NUTS & TREE CROPS ==========
  "almond": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "brazil nut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "NPK 15:15:15", rate: 1.5, unit: "kg/tree/year", provides: { n: 225, p: 225, k: 225 } }
    ]
  },
  "cashew": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 10, unit: "kg/hole", provides: { n: 10, p: 5, k: 10 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "g/tree/year", provides: { n: 81 } },
      { name: "NPK 15:15:15", rate: 0.5, unit: "kg/tree/year", provides: { n: 75, p: 75, k: 75 } }
    ]
  },
  "chestnut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "hazelnut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 0.8, unit: "kg/tree/year", provides: { n: 120, p: 120, k: 120 } }
    ]
  },
  "macadamia": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "NPK 17:17:17", rate: 1, unit: "kg/tree/year", provides: { n: 170, p: 170, k: 170 } },
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } }
    ]
  },
  "pecan": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1.2, unit: "kg/tree/year", provides: { n: 180, p: 180, k: 180 } }
    ]
  },
  "pistachio": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 400, unit: "g/tree/year", provides: { n: 108 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "shea": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "walnut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 20, unit: "kg/hole", provides: { n: 20, p: 10, k: 20 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "pili nut": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },

  // ========== GRAINS & CEREALS ==========
  "barley": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "buckwheat": {
    planting: [
      { name: "DAP", rate: 80, unit: "kg/ha", provides: { n: 14.4, p: 36.8 } }
    ],
    topdressing: []
  },
  "finger millet": {
    planting: [
      { name: "DAP", rate: 50, unit: "kg/ha", provides: { n: 9, p: 23 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "maize": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } },
      { name: "20:20:0", rate: 300, unit: "kg/ha", provides: { n: 60, p: 60 } },
      { name: "23:23:0", rate: 250, unit: "kg/ha", provides: { n: 57.5, p: 57.5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "kg/ha", provides: { n: 81 } },
      { name: "UREA", rate: 150, unit: "kg/ha", provides: { n: 69 } }
    ]
  },
  "millet": {
    planting: [
      { name: "DAP", rate: 50, unit: "kg/ha", provides: { n: 9, p: 23 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "oats": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "quinoa": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "rice": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "NPK 20:20:0", rate: 200, unit: "kg/ha", provides: { n: 40, p: 40 } }
    ],
    topdressing: [
      { name: "UREA", rate: 150, unit: "kg/ha", provides: { n: 69 } },
      { name: "UREA (at tillering)", rate: 100, unit: "kg/ha", provides: { n: 46 } }
    ]
  },
  "sorghum": {
    planting: [
      { name: "DAP", rate: 50, unit: "kg/ha", provides: { n: 9, p: 23 } },
      { name: "NPK 20:20:0", rate: 180, unit: "kg/ha", provides: { n: 36, p: 36 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "teff": {
    planting: [
      { name: "DAP", rate: 50, unit: "kg/ha", provides: { n: 9, p: 23 } }
    ],
    topdressing: [
      { name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "triticale": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "wheat": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  // Additional grains
  "fonio": {
    planting: [{ name: "DAP", rate: 80, unit: "kg/ha", provides: { n: 14.4, p: 36.8 } }],
    topdressing: []
  },
  "spelt": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "kamut": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "amaranth grain": {
    planting: [{ name: "DAP", rate: 80, unit: "kg/ha", provides: { n: 14.4, p: 36.8 } }],
    topdressing: [{ name: "CAN", rate: 80, unit: "kg/ha", provides: { n: 21.6 } }]
  },

  // ========== PULSES & LEGUMES ==========
  "bambaranuts": {
    planting: [
      { name: "TSP", rate: 150, unit: "kg/ha", provides: { p: 69 } },
      { name: "Farmyard manure", rate: 5, unit: "tons/ha", provides: { n: 25, p: 10, k: 25 } }
    ],
    topdressing: []
  },
  "beans": {
    planting: [
      { name: "DAP", rate: 250, unit: "kg/ha", provides: { n: 45, p: 115 } }
    ],
    topdressing: []
  },
  "chickpea": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "cowpeas": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "faba bean": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "green grams": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "groundnuts": {
    planting: [
      { name: "TSP", rate: 200, unit: "kg/ha", provides: { p: 92 } }
    ],
    topdressing: []
  },
  "lentil": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "peanut": {
    planting: [
      { name: "TSP", rate: 200, unit: "kg/ha", provides: { p: 92 } }
    ],
    topdressing: []
  },
  "pigeonpeas": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "soya beans": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },

  // ========== TUBERS & ROOTS ==========
  "cassava": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "KCL", rate: 100, unit: "kg/ha", provides: { k: 60 } }
    ]
  },
  "ginger": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "horseradish": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "irish potatoes": {
    planting: [
      { name: "DAP", rate: 500, unit: "kg/ha", provides: { n: 90, p: 230 } }
    ],
    topdressing: [
      { name: "CAN", rate: 300, unit: "kg/ha", provides: { n: 81 } }
    ]
  },
  "parsnip": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "sweet potatoes": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "KCL", rate: 100, unit: "kg/ha", provides: { k: 60 } }
    ]
  },
  "taro": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 2, unit: "kg/hole", provides: { n: 2, p: 1, k: 2 } }
    ],
    topdressing: [
      { name: "CAN", rate: 50, unit: "g/hole", provides: { n: 13.5 } }
    ]
  },
  "turmeric": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "yams": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 3, unit: "kg/hole", provides: { n: 3, p: 1.5, k: 3 } }
    ],
    topdressing: [
      { name: "CAN", rate: 50, unit: "g/hole", provides: { n: 13.5 } },
      { name: "NPK 15:15:15", rate: 100, unit: "g/hole", provides: { n: 15, p: 15, k: 15 } }
    ]
  },

  // ========== CASH CROPS ==========
  "coffee": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "NPK 17:17:17", rate: 150, unit: "kg/ha", provides: { n: 25.5, p: 25.5, k: 25.5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 150, unit: "kg/ha", provides: { n: 40.5 } }
    ]
  },
  "cotton": {
    planting: [
      { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
    ],
    topdressing: []
  },
  "pyrethrum": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "sisal": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "sugarcane": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "UREA", rate: 100, unit: "kg/ha", provides: { n: 46 } }
    ]
  },
  "sunflower": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "tea": {
    planting: [
      { name: "TSP", rate: 100, unit: "g/hole", provides: { p: 46 } },
      { name: "NPK 25:5:5", rate: 100, unit: "g/hole", provides: { n: 25, p: 5, k: 5 } }
    ],
    topdressing: [
      { name: "NPK 25:5:5", rate: 200, unit: "g/tree/year", provides: { n: 50, p: 10, k: 10 } },
      { name: "UREA", rate: 100, unit: "g/tree/year", provides: { n: 46 } }
    ]
  },
  "tobacco": {
    planting: [
      { name: "NPK 6:18:20+4HGB+0.1B", rate: 500, unit: "kg/ha", provides: { n: 30, p: 90, k: 100 } }
    ],
    topdressing: []
  },
  "oil palm": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },
  "rubber": {
    planting: [
      { name: "DAP", rate: 250, unit: "g/hole", provides: { n: 45, p: 115 } },
      { name: "Farmyard manure", rate: 15, unit: "kg/hole", provides: { n: 15, p: 7.5, k: 15 } }
    ],
    topdressing: [
      { name: "CAN", rate: 500, unit: "g/tree/year", provides: { n: 135 } },
      { name: "NPK 15:15:15", rate: 1, unit: "kg/tree/year", provides: { n: 150, p: 150, k: 150 } }
    ]
  },

  // ========== OIL CROPS ==========
  "rapeseed": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "safflower": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "sesame": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "simsim": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },

  // ========== COVER CROPS ==========
  "alfalfa": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "canavalia": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "clover": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "crotalaria juncea": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "crotalaria ochroleuca": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "crotalaria paulina": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "desmodium": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "dolichos": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "lucerne": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "mucuna": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "vetch": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "white clover": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },
  "sunn hemp": {
    planting: [
      { name: "TSP", rate: 100, unit: "kg/ha", provides: { p: 46 } }
    ],
    topdressing: []
  },

  // ========== FORAGE GRASSES ==========
  "brachiaria": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "buffel grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "cenchrus": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }
    ]
  },
  "forage sorghum": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "guinea grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "italian ryegrass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "napier grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "napier hybrid": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "orchard grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "rhodes grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "timothy grass": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },
  "calliandra": {
    planting: [
      { name: "TSP", rate: 100, unit: "g/hole", provides: { p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: []
  },
  "leucaena": {
    planting: [
      { name: "TSP", rate: 100, unit: "g/hole", provides: { p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: []
  },
  "sesbania": {
    planting: [
      { name: "TSP", rate: 100, unit: "g/hole", provides: { p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: []
  },

  // ========== PERENNIAL GRASSES ==========
  "bamboo": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "g/clump", provides: { n: 27 } }
    ]
  },

  // ========== MEDICINAL PLANTS ==========
  "aloe vera": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: []
  },
  "stinging nettle": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
    ]
  },

  // ========== HERBS & SPICES ==========
  "basil": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "black pepper": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [
      { name: "CAN", rate: 100, unit: "g/plant", provides: { n: 27 } },
      { name: "NPK 15:15:15", rate: 200, unit: "g/plant", provides: { n: 30, p: 30, k: 30 } }
    ]
  },
  "cardamom": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 2, unit: "kg/hole", provides: { n: 2, p: 1, k: 2 } }
    ],
    topdressing: [{ name: "CAN", rate: 50, unit: "g/plant", provides: { n: 13.5 } }]
  },
  "chamomile": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "cinnamon": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [{ name: "CAN", rate: 100, unit: "g/tree", provides: { n: 27 } }]
  },
  "cloves": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [{ name: "CAN", rate: 100, unit: "g/tree", provides: { n: 27 } }]
  },
  "dill": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }]
  },
  "echinacea": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }]
  },
  "fennel": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "ginseng": {
    planting: [{ name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }],
    topdressing: []
  },
  "goldenseal": {
    planting: [{ name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }],
    topdressing: []
  },
  "hibiscus": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "hops": {
    planting: [
      { name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }
    ],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "lavender": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "lemon grass": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "mint": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "moringa": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "mustard": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "oregano": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "rosemary": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "sage": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "thyme": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "vanilla": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 2, unit: "kg/hole", provides: { n: 2, p: 1, k: 2 } }
    ],
    topdressing: [{ name: "CAN", rate: 50, unit: "g/plant", provides: { n: 13.5 } }]
  },
  "wasabi": {
    planting: [{ name: "Compost", rate: 10, unit: "tons/ha", provides: { n: 50, p: 20, k: 50 } }],
    topdressing: []
  },
  // Additional herbs/spices
  "stevia": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "fenugreek": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "cumin": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "caraway": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "anise": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "lovage": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "marjoram": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "tarragon": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "sorrel": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "chervil": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 50, unit: "kg/ha", provides: { n: 13.5 } }]
  },
  "savory": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "calendula": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "nasturtium": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "borage": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "st. john's wort": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "valerian": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },

  // ========== OTHER ==========
  "mushroom": {
    planting: [
      { name: "Compost", rate: 20, unit: "tons/ha", provides: { n: 100, p: 40, k: 100 } },
      { name: "Urea (as nitrogen supplement)", rate: 50, unit: "kg/ha", provides: { n: 23 } }
    ],
    topdressing: []
  },
  "oyster nut": {
    planting: [
      { name: "DAP", rate: 100, unit: "g/hole", provides: { n: 18, p: 46 } },
      { name: "Farmyard manure", rate: 5, unit: "kg/hole", provides: { n: 5, p: 2.5, k: 5 } }
    ],
    topdressing: [{ name: "CAN", rate: 50, unit: "g/plant", provides: { n: 13.5 } }]
  },
  "ramie": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "flax": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: []
  },
  "hemp": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "jute": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  },
  "shallots": {
  planting: [
    { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
  ],
  topdressing: [
    { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } },
    { name: "MOP", rate: 100, unit: "kg/ha", provides: { k: 60 } }
  ]
},

"chives": {
  planting: [
    { name: "DAP", rate: 150, unit: "kg/ha", provides: { n: 27, p: 69 } }
  ],
  topdressing: [
    { name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }
  ]
},
  "garlic": {
  planting: [
    { name: "DAP", rate: 200, unit: "kg/ha", provides: { n: 36, p: 92 } }
  ],
  topdressing: [
    { name: "CAN", rate: 200, unit: "kg/ha", provides: { n: 54 } },
    { name: "MOP", rate: 100, unit: "kg/ha", provides: { k: 60 } }
  ]
},
  "kenaf": {
    planting: [{ name: "DAP", rate: 100, unit: "kg/ha", provides: { n: 18, p: 46 } }],
    topdressing: [{ name: "CAN", rate: 100, unit: "kg/ha", provides: { n: 27 } }]
  }
};

// Helper functions
export function getFertilizerRates(crop: string) {
  const normalizedCrop = crop.toLowerCase().trim();
  return fertilizerRates[normalizedCrop as keyof typeof fertilizerRates] || null;
}

export function convertToPerAcre(rateKgHa: number): number {
  return rateKgHa / 2.471; // 1 hectare = 2.471 acres
}

export function calculateFertilizerNeeded(
  crop: string,
  farmSizeAcres: number,
  fertilizerType: "planting" | "topdressing"
): Array<{ name: string; amountKg: number; provides: any }> {
  const rates = getFertilizerRates(crop);
  if (!rates) return [];

  const fertilizerList = rates[fertilizerType] || [];

  return fertilizerList.map(fert => {
    let amountKg = 0;
    if (fert.unit === "kg/ha") {
      amountKg = Math.round((fert.rate / 2.471) * farmSizeAcres);
    } else if (fert.unit === "g/hole" || fert.unit === "g/plant" || fert.unit === "g/tree") {
      amountKg = fert.rate / 1000;
    } else if (fert.unit === "tons/ha") {
      amountKg = Math.round((fert.rate * 1000 / 2.471) * farmSizeAcres);
    } else {
      amountKg = Math.round(fert.rate * farmSizeAcres);
    }
    return {
      name: fert.name,
      amountKg,
      provides: fert.provides
    };
  });
}

export function getTotalNutrientRecommendation(crop: string, farmSizeAcres: number) {
  const rates = getFertilizerRates(crop);
  if (!rates) return null;

  let totalN = 0;
  let totalP = 0;
  let totalK = 0;

  const addNutrients = (ferts: any[]) => {
    ferts?.forEach(fert => {
      let amountPerAcre = 0;
      if (fert.unit === "kg/ha") {
        amountPerAcre = fert.rate / 2.471;
      } else if (fert.unit === "g/hole" || fert.unit === "g/plant" || fert.unit === "g/tree") {
        return;
      } else if (fert.unit === "tons/ha") {
        amountPerAcre = fert.rate * 1000 / 2.471;
      } else {
        amountPerAcre = fert.rate;
      }
      const factor = amountPerAcre / fert.rate;
      totalN += (fert.provides.n || 0) * factor;
      totalP += (fert.provides.p || 0) * factor;
      totalK += (fert.provides.k || 0) * factor;
    });
  };

  addNutrients(rates.planting);
  addNutrients(rates.topdressing);

  return {
    n: Math.round(totalN * farmSizeAcres),
    p: Math.round(totalP * farmSizeAcres),
    k: Math.round(totalK * farmSizeAcres)
  };
}