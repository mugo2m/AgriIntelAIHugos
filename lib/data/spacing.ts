// lib/data/spacing.ts – Complete with all 219 crops
// Updated to use space-separated crop names (matching pest/disease map)

export interface SpacingOption {
  label: string;
  rowCm: number;
  plantCm: number;
  seedsPerHole: number;
  plantsPerAcre: number;
  description?: string;
}

function calculatePlantsPerAcre(rowCm: number, plantCm: number, seedsPerHole: number): number {
  const rowM = rowCm / 100;
  const plantM = plantCm / 100;
  const areaPerPlant = rowM * plantM;
  return Math.floor(4046.86 / areaPerPlant) * seedsPerHole;
}

export const cropSpacingOptions: Record<string, SpacingOption[]> = {
  // ========== VEGETABLES ==========
  "african nightshade": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "0.5 kg seed/acre – for leaf production"
    },
    {
      label: "60cm x 45cm - Wide spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "0.3 kg seed/acre – for larger plants"
    }
  ],

  "amaranth": [
    {
      label: "30cm rows x 15cm between plants - Cut-and-come-again",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "0.5 kg seed/acre – multiple harvests"
    },
    {
      label: "45cm x 30cm - Wide spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "0.3 kg seed/acre – for seed production"
    }
  ],

  "arugula": [
    {
      label: "30cm rows x 15cm between plants - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For baby leaf harvest"
    }
  ],

  "asparagus": [
    {
      label: "50cm x 30cm - Standard",
      rowCm: 50, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 30, 1),
      description: "15,000 plants/acre – for perennial production"
    }
  ],

  "beetroot": [
    {
      label: "30cm rows x 10cm between plants - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "67,000 plants/acre – thin to 10cm"
    },
    {
      label: "30cm rows x 15cm between plants - Wide spacing",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "45,000 plants/acre – for larger roots"
    }
  ],

  "broccoli": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for main heads"
    },
    {
      label: "75cm x 60cm - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "6,700 plants/acre – for side‑shoot production"
    },
    {
      label: "45cm x 30cm - High density",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for baby broccoli"
    }
  ],

  "cabbages": [
    {
      label: "60cm x 45cm (medium heads) - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "For medium-sized cabbage heads"
    },
    {
      label: "75cm x 60cm (large heads) - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "For large cabbage varieties"
    }
  ],

  "capsicums": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ],

  "carrots": [
  {
    label: "30cm rows x 5cm between plants - High density (baby carrots)",
    rowCm: 30, plantCm: 5, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 5, 1),
    description: "Thin to 5cm → 270,000 plants/acre, for baby carrots"
  },
  {
    label: "30cm rows x 8cm between plants - Medium density (small carrots)",
    rowCm: 30, plantCm: 8, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 8, 1),
    description: "Thin to 8cm → 168,000 plants/acre, for small market carrots"
  },
  {
    label: "30cm rows x 13cm between plants - Standard fresh market",
    rowCm: 30, plantCm: 13, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 13, 1),
    description: "100,000 plants/acre – recommended for standard carrots"
  },
  {
    label: "30cm rows x 17cm between plants - Large carrots",
    rowCm: 30, plantCm: 17, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 17, 1),
    description: "80,000 plants/acre – for jumbo carrots"
  }
],
  "cauliflower": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for medium heads"
    },
    {
      label: "75cm x 60cm - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "6,700 plants/acre – for large heads"
    },
    {
      label: "45cm x 30cm - High density",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for baby cauliflower"
    }
  ],

  "celery": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    },
    {
      label: "50cm x 35cm - Wide spacing",
      rowCm: 50, plantCm: 35, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 35, 1),
      description: "18,000 plants/acre – for larger stalks"
    }
  ],

  "chillies": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for most varieties"
    },
    {
      label: "75cm x 60cm - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "6,700 plants/acre – for vigorous varieties"
    },
    {
      label: "45cm x 30cm - High density",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for small varieties"
    }
  ],

  "coriander": [
    {
      label: "30cm x 15cm (direct seeded) - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "45,000 plants/acre – for leaf production"
    },
    {
      label: "45cm x 20cm - Wide rows",
      rowCm: 45, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 20, 2),
      description: "27,000 plants/acre – for seed production"
    }
  ],

  "courgettes": [
    {
      label: "1m x 0.5m - Standard",
      rowCm: 100, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 50, 1),
      description: "8,000 plants/acre – for bush types"
    }
  ],

  "cucumbers": [
    {
      label: "1.5m x 0.5m (trailing) - Standard",
      rowCm: 150, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 50, 1),
      description: "5,300 plants/acre – allow vines to spread"
    }
  ],

  "eggplants": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ],
  // Alias for brinjals
  "brinjals": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – same as eggplants"
    }
  ],

  "endive": [
    {
      label: "30cm x 30cm - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre"
    }
  ],

  "ethiopian kale": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for leaf harvest"
    }
  ],

  "french beans": [
    {
      label: "45cm x 10cm - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "High density for French beans"
    }
  ],

  "garden peas": [
    {
      label: "45cm x 10cm (on trellis) - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 2),
      description: "Plant 2 seeds, thin to 1, 70,000 plants/acre"
    },
    {
      label: "60cm x 10cm - Wide rows",
      rowCm: 60, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 10, 2),
      description: "53,000 plants/acre – easier mechanical cultivation"
    }
  ],

  "green beans": [
    {
      label: "45cm x 10cm - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "For bush beans"
    }
  ],

  "kales": [
    {
      label: "60cm x 60cm - Standard",
      rowCm: 60, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 60, 1),
      description: "Standard kale spacing"
    }
  ],

  "kohlrabi": [
    {
      label: "30cm x 30cm - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre"
    }
  ],

  "leeks": [
    {
      label: "30cm x 15cm (transplanted) - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "45,000 plants/acre"
    },
    {
      label: "30cm x 10cm - High density",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "67,000 plants/acre – for thin leeks"
    }
  ],

  "lettuce": [
    {
      label: "30cm x 30cm (head lettuce) - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre – for head lettuce"
    },
    {
      label: "25cm x 25cm (leaf lettuce) - High density",
      rowCm: 25, plantCm: 25, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(25, 25, 1),
      description: "64,000 plants/acre – for leaf harvest"
    }
  ],

  "okra": [
    {
      label: "60cm x 30cm - Standard spacing",
      rowCm: 60, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 2),
      description: "Plant 2 seeds, thin to 1, 18,000 plants/acre"
    },
    {
      label: "75cm x 45cm - Wide spacing",
      rowCm: 75, plantCm: 45, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 45, 2),
      description: "8,000 plants/acre – for vigorous varieties"
    },
    {
      label: "45cm x 20cm - High density",
      rowCm: 45, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 20, 2),
      description: "36,000 plants/acre – for early harvest"
    }
  ],

  "onions": [
    {
      label: "30cm x 10cm (transplanted) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "Transplant seedlings at this spacing"
    }
  ],

  "parsley": [
    {
      label: "30cm x 15cm - Standard spacing",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "45,000 plants/acre"
    },
    {
      label: "45cm x 20cm - Wide spacing",
      rowCm: 45, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 20, 2),
      description: "27,000 plants/acre – for larger bunches"
    }
  ],

  "pumpkin leaves": [
    {
      label: "2m x 1m (vining) - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 2),
      description: "For leaf harvest, 2 seeds/hole"
    }
  ],

  "radish": [
    {
      label: "30cm rows x 10cm between plants - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "67,000 plants/acre – for root production"
    },
    {
      label: "30cm rows x 5cm between plants - High density",
      rowCm: 30, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 5, 1),
      description: "135,000 plants/acre – for small radishes"
    }
  ],

  "rhubarb": [
    {
      label: "90cm x 90cm - Standard spacing",
      rowCm: 90, plantCm: 90, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 90, 1),
      description: "5,000 plants/acre – for perennial harvest"
    }
  ],

  "spinach": [
    {
      label: "30cm rows x 15cm between plants - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "45,000 plants/acre – for cut-and-come-again"
    },
    {
      label: "30cm rows x 10cm between plants - High density",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "67,000 plants/acre – for baby leaf production"
    },
    {
      label: "20cm rows x 20cm between plants - Square planting",
      rowCm: 20, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 20, 1),
      description: "67,000 plants/acre – uniform spacing"
    }
  ],

  "spider plant": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "For leaf production"
    }
  ],

  "sweet potato leaves": [
    {
      label: "1m x 0.3m (leaf harvest) - Standard",
      rowCm: 100, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 30, 1),
      description: "For leaf production"
    }
  ],

  "tomatoes": [
    {
      label: "60cm x 45cm (determinate varieties) - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "For bush/determinate tomatoes"
    },
    {
      label: "90cm x 60cm (indeterminate with staking) - Wide",
      rowCm: 90, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 60, 1),
      description: "For staked indeterminate varieties"
    }
  ],

  "turnip": [
    {
      label: "30cm rows x 10cm between plants - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "For roots and greens"
    }
  ],

  "watercress": [
    {
      label: "15cm x 15cm (in flowing water) - Standard",
      rowCm: 15, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(15, 15, 1),
      description: "180,000 plants/acre – for hydroponic beds"
    }
  ],

  // Additional vegetables
  "artichoke": [
    {
      label: "1m x 1m - Standard spacing",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "4,000 plants/acre – perennial"
    }
  ],
  "bok choy": [
    {
      label: "30cm x 20cm - Standard",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre"
    }
  ],
  "collard greens": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ],
  "mustard greens": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For greens"
    }
  ],
  "swiss chard": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    }
  ],
  "radicchio": [
    {
      label: "30cm x 30cm - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre"
    }
  ],
  "escarole": [
    {
      label: "30cm x 30cm - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre"
    }
  ],
  "frisee": [
    {
      label: "30cm x 30cm - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre"
    }
  ],
  "turnip greens": [
    {
      label: "30cm rows x 10cm between plants - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "For greens"
    }
  ],
  "rutabaga": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For roots"
    }
  ],

  // ========== FRUITS ==========
  "avocados": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre"
    }
  ],

  "bananas": [
    {
      label: "3m x 3m (short varieties) - Standard",
      rowCm: 300, plantCm: 300, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 300, 1),
      description: "For dwarf and short varieties"
    },
    {
      label: "4m x 4m (tall varieties) - Wide",
      rowCm: 400, plantCm: 400, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(400, 400, 1),
      description: "For tall banana varieties"
    }
  ],

  "breadfruit": [
    {
      label: "12m x 12m - Standard",
      rowCm: 1200, plantCm: 1200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1200, 1200, 1),
      description: "28 trees/acre"
    },
    {
      label: "10m x 10m - High density",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre – for dwarf varieties"
    }
  ],

  "coconut": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre – for tall varieties"
    },
    {
      label: "7m x 7m - High density",
      rowCm: 700, plantCm: 700, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(700, 700, 1),
      description: "88 trees/acre – for dwarf varieties"
    },
    {
      label: "9m x 9m - Wide spacing",
      rowCm: 900, plantCm: 900, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(900, 900, 1),
      description: "54 trees/acre – for intercropping"
    }
  ],

  "grapefruit": [
    {
      label: "6m x 6m - Standard",
      rowCm: 600, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 600, 1),
      description: "120 trees/acre"
    },
    {
      label: "7m x 6m - Wide spacing",
      rowCm: 700, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(700, 600, 1),
      description: "96 trees/acre"
    }
  ],

  "guava": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre"
    }
  ],

  "jackfruit": [
    {
      label: "12m x 12m - Standard",
      rowCm: 1200, plantCm: 1200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1200, 1200, 1),
      description: "28 trees/acre"
    },
    {
      label: "15m x 12m - Wide spacing",
      rowCm: 1500, plantCm: 1200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1500, 1200, 1),
      description: "22 trees/acre – for very large trees"
    }
  ],

  "lemons": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre"
    },
    {
      label: "6m x 5m - Wide spacing",
      rowCm: 600, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 500, 1),
      description: "134 trees/acre – for vigorous rootstocks"
    }
  ],

  "limes": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre"
    },
    {
      label: "6m x 5m - Wide spacing",
      rowCm: 600, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 500, 1),
      description: "134 trees/acre – for vigorous rootstocks"
    }
  ],

  "mangoes": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre – for vigorous varieties"
    },
    {
      label: "10m x 10m - Wide spacing",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre – for very large varieties"
    },
    {
      label: "5m x 5m - High density",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre – for dwarf varieties"
    }
  ],

  "oranges": [
    {
      label: "4.5m x 4.5m - Standard",
      rowCm: 450, plantCm: 450, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(450, 450, 1),
      description: "Standard citrus spacing"
    }
  ],

  "papayas": [
    {
      label: "2.5m x 2.5m - Standard",
      rowCm: 250, plantCm: 250, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(250, 250, 1),
      description: "Standard papaya spacing"
    }
  ],

  "passion fruit": [
    {
      label: "2m x 3m (trellised) - Standard",
      rowCm: 200, plantCm: 300, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 300, 1),
      description: "For trellised passion fruit"
    }
  ],

  "pawpaws": [
    {
      label: "2.5m x 2.5m - Standard",
      rowCm: 250, plantCm: 250, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(250, 250, 1),
      description: "Standard pawpaw spacing"
    }
  ],

  "pineapples": [
    {
      label: "30cm x 60cm (double rows) - High density",
      rowCm: 30, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 60, 1),
      description: "Double row planting, 30cm between plants"
    },
    {
      label: "45cm x 45cm (single rows) - Standard",
      rowCm: 45, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 45, 1),
      description: "Single row planting"
    },
    {
      label: "60cm x 30cm (bed planting) - On raised beds",
      rowCm: 60, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 1),
      description: "Plant on raised beds for better drainage"
    }
  ],

  "pomegranate": [
    {
      label: "4m x 4m - Standard",
      rowCm: 400, plantCm: 400, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(400, 400, 1),
      description: "270 trees/acre"
    }
  ],

  "pumpkin": [
    {
      label: "2m x 1m (vining) - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 2),
      description: "For fruit production"
    }
  ],

  "star fruit": [
    {
      label: "6m x 6m - Standard",
      rowCm: 600, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 600, 1),
      description: "120 trees/acre"
    }
  ],

  "watermelons": [
    {
      label: "2m x 1m (trailing) - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 1),
      description: "2,000 plants/acre – allow vines to spread"
    },
    {
      label: "2.5m x 1m (large varieties) - Wide",
      rowCm: 250, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(250, 100, 1),
      description: "1,600 plants/acre – for vigorous varieties"
    },
    {
      label: "1.5m x 0.5m (bush varieties) - Compact",
      rowCm: 150, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 50, 1),
      description: "5,300 plants/acre – for bush-type varieties"
    }
  ],

  // Additional fruits
  "fig": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre"
    }
  ],
  "date palm": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],
  "mulberry": [
    {
      label: "3m x 2m - Standard (for leaf harvest)",
      rowCm: 300, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 200, 1),
      description: "For silkworm rearing"
    }
  ],
  "lychee": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],
  "persimmon": [
    {
      label: "6m x 6m - Standard",
      rowCm: 600, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 600, 1),
      description: "120 trees/acre"
    }
  ],
  "gooseberry": [
    {
      label: "2m x 1.5m - Standard",
      rowCm: 200, plantCm: 150, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 150, 1),
      description: "13,000 plants/acre"
    }
  ],
  "currant": [
    {
      label: "2m x 1m - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 1),
      description: "20,000 plants/acre"
    }
  ],
  "elderberry": [
    {
      label: "3m x 2m - Standard",
      rowCm: 300, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 200, 1),
      description: "6,700 plants/acre"
    }
  ],
  "rambutan": [
    {
      label: "10m x 10m - Standard",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    }
  ],
  "durian": [
    {
      label: "12m x 12m - Standard",
      rowCm: 1200, plantCm: 1200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1200, 1200, 1),
      description: "28 trees/acre"
    }
  ],
  "mangosteen": [
    {
      label: "10m x 10m - Standard",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    }
  ],
  "longan": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],
  "marula": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],

  // ========== GRAINS & CEREALS ==========
  "barley": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "80-100 kg seed/acre"
    }
  ],

  "buckwheat": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "40-50 kg seed/acre"
    }
  ],

  "finger millet": [
    {
      label: "30cm x 15cm (drilled and thinned) - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "Drill and thin to 15cm spacing"
    }
  ],

  "maize": [
    {
      label: "75cm x 25cm (1 seed/hole) - High density",
      rowCm: 75, plantCm: 25, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 25, 1),
      description: "Recommended for high fertility soils"
    },
    {
      label: "75cm x 30cm (1 seed/hole) - Standard density",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "Most common spacing for maize"
    },
    {
      label: "75cm x 50cm (2 seeds/hole) - Low density",
      rowCm: 75, plantCm: 50, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 50, 2),
      description: "For intercropping or low fertility"
    },
    {
      label: "90cm x 30cm (1 seed/hole) - Wide rows",
      rowCm: 90, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 30, 1),
      description: "For mechanized farming"
    }
  ],

  "millet": [
    {
      label: "45cm x 15cm - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
      description: "For pearl millet"
    }
  ],

  "oats": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "80-100 kg seed/acre – for silage or grain"
    }
  ],

  "quinoa": [
    {
      label: "50cm x 20cm - Standard",
      rowCm: 50, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 20, 1),
      description: "2-3 kg seed/acre"
    }
  ],

  "rice": [
    {
      label: "20cm x 20cm (transplanted) - High density",
      rowCm: 20, plantCm: 20, seedsPerHole: 3,
      plantsPerAcre: calculatePlantsPerAcre(20, 20, 3),
      description: "Transplant 3 seedlings per hill"
    },
    {
      label: "25cm x 25cm (transplanted) - Standard",
      rowCm: 25, plantCm: 25, seedsPerHole: 3,
      plantsPerAcre: calculatePlantsPerAcre(25, 25, 3),
      description: "Standard spacing for transplanted rice"
    },
    {
      label: "20cm rows (direct seeded) - Drilled",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "For direct seeded rice, drill in rows"
    }
  ],

  "sorghum": [
    {
      label: "60cm x 15cm (drilled and thinned) - Standard",
      rowCm: 60, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 15, 1),
      description: "Standard spacing for sorghum"
    }
  ],

  "teff": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "For grain production"
    }
  ],

  "triticale": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "For grain or forage"
    }
  ],

  "wheat": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "100 kg seed/acre – for grain production"
    }
  ],

  // Additional grains
  "amaranth grain": [
    {
      label: "50cm x 20cm - Standard",
      rowCm: 50, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(50, 20, 2),
      description: "For grain production"
    }
  ],
  "fonio": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "10-15 kg seed/acre"
    }
  ],
  "spelt": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "80-100 kg seed/acre"
    }
  ],
  "kamut": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "80-100 kg seed/acre"
    }
  ],

  // ========== PULSES & LEGUMES ==========
  "bambaranuts": [
    {
      label: "45cm x 20cm (bunch type) - Standard",
      rowCm: 45, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 20, 2),
      description: "Plant 2 seeds per hole, 35,000 plants/acre"
    },
    {
      label: "60cm x 30cm (spreader type) - Wide spacing",
      rowCm: 60, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 2),
      description: "For spreading varieties, 15,000 plants/acre"
    },
    {
      label: "50cm x 15cm (high density) - Dense planting",
      rowCm: 50, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(50, 15, 2),
      description: "43,000 plants/acre – maximum yield"
    }
  ],

  "beans": [
    {
      label: "50cm x 10cm (2 seeds/hole) - Pure stand",
      rowCm: 50, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(50, 10, 2),
      description: "For pure stand beans"
    },
    {
      label: "50cm x 15cm (2 seeds/hole) - Intercrop with maize",
      rowCm: 50, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(50, 15, 2),
      description: "When planting between maize rows"
    }
  ],

  "chickpea": [
    {
      label: "45cm x 15cm - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 2),
      description: "Plant 2 seeds, thin to 1"
    }
  ],

  "cowpeas": [
    {
      label: "45cm x 15cm - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 2),
      description: "Standard cowpea spacing"
    },
    {
      label: "75cm x drill - Intercrop (cover crop)",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "14 kg seed/acre – intercropped"
    },
    {
      label: "45cm x drill - Pure stand (cover crop)",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "24 kg seed/acre – pure stand"
    }
  ],

  "faba bean": [
    {
      label: "60cm x 20cm - Standard",
      rowCm: 60, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 20, 2),
      description: "Plant 2 seeds per hole"
    }
  ],

  "green grams": [
    {
      label: "45cm x 10cm - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "Standard green gram spacing"
    }
  ],

  "groundnuts": [
    {
      label: "45cm x 10cm (bunch type) - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "For bunch type varieties"
    },
    {
      label: "60cm x 10cm (spreader type) - Wide spacing",
      rowCm: 60, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 10, 1),
      description: "For spreading type varieties"
    },
    {
      label: "75cm x drill - Intercrop (cover crop)",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "16 kg seed/acre – intercropped"
    },
    {
      label: "45cm x drill - Pure stand (cover crop)",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "22 kg seed/acre – pure stand"
    }
  ],

  "lentil": [
    {
      label: "45cm x 15cm - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 2),
      description: "Plant 2 seeds, thin to 1"
    }
  ],

  "peanut": [
    {
      label: "45cm x 10cm (bunch type) - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "For bunch type varieties"
    },
    {
      label: "60cm x 10cm (spreader type) - Wide spacing",
      rowCm: 60, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 10, 1),
      description: "For spreading type varieties"
    }
  ],

  "pigeonpeas": [
    {
      label: "75cm x 30cm (short duration) - Standard",
      rowCm: 75, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 2),
      description: "Plant 2 seeds, thin to 1, 15,000 plants/acre"
    },
    {
      label: "100cm x 50cm (long duration) - Wide spacing",
      rowCm: 100, plantCm: 50, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(100, 50, 2),
      description: "5,000 plants/acre – for perennial types"
    },
    {
      label: "150cm x 50cm (intercrop with maize) - Intercropping",
      rowCm: 150, plantCm: 50, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(150, 50, 2),
      description: "For planting with maize, 2,600 plants/acre"
    }
  ],

  "soya beans": [
    {
      label: "45cm x 10cm (3 seeds/hole, thin to 1) - Standard",
      rowCm: 45, plantCm: 10, seedsPerHole: 3,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 3),
      description: "Plant 3 seeds, thin to 1 plant"
    }
  ],

  // ========== TUBERS & ROOTS ==========
  "cassava": [
    {
      label: "1m x 1m - Standard",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "Standard cassava spacing"
    }
  ],

  "ginger": [
    {
      label: "30cm x 20cm - Standard spacing",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre – for medium rhizomes"
    },
    {
      label: "40cm x 25cm - Wide spacing",
      rowCm: 40, plantCm: 25, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(40, 25, 1),
      description: "40,000 plants/acre – for large rhizomes"
    },
    {
      label: "25cm x 20cm - High density",
      rowCm: 25, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(25, 20, 1),
      description: "80,000 plants/acre – for early harvest"
    }
  ],

  "horseradish": [
    {
      label: "60cm x 30cm - Standard",
      rowCm: 60, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 1),
      description: "18,000 plants/acre – for root production"
    }
  ],

  "irish potatoes": [
    {
      label: "75cm x 30cm - Standard",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "Standard potato spacing"
    }
  ],

  "parsnip": [
    {
      label: "30cm rows x 10cm between plants - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "For root production"
    }
  ],

  "sweet potatoes": [
    {
      label: "90cm x 30cm on ridges - Standard",
      rowCm: 90, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 30, 1),
      description: "Plant vines on ridges"
    }
  ],

  "taro": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for dryland cultivation"
    },
    {
      label: "75cm x 60cm - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "6,700 plants/acre – for vigorous varieties"
    },
    {
      label: "45cm x 30cm - High density",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for small corm production"
    }
  ],

  "turmeric": [
    {
      label: "30cm x 25cm - Standard spacing",
      rowCm: 30, plantCm: 25, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 25, 1),
      description: "54,000 plants/acre"
    },
    {
      label: "40cm x 30cm - Wide spacing",
      rowCm: 40, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(40, 30, 1),
      description: "33,000 plants/acre – for larger rhizomes"
    }
  ],

  "yams": [
    {
      label: "1m x 1m - Standard spacing",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "4,000 plants/acre – for most varieties"
    },
    {
      label: "1.5m x 1m - Wide spacing",
      rowCm: 150, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 100, 1),
      description: "2,600 plants/acre – for vigorous varieties"
    },
    {
      label: "2m x 1m - Extra wide (with staking)",
      rowCm: 200, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 1),
      description: "2,000 plants/acre – when staking individually"
    }
  ],

  // ========== CASH CROPS ==========
  "coffee": [
    {
      label: "2.75m x 2.75m (SL28, SL34) - Standard",
      rowCm: 275, plantCm: 275, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(275, 275, 1),
      description: "For traditional coffee varieties"
    },
    {
      label: "2m x 2m (Ruiru 11) - High density",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "For Ruiru 11 and compact varieties"
    }
  ],

  "cotton": [
    {
      label: "90cm x 30cm (5-6 seeds/hole, thin to 2) - Standard",
      rowCm: 90, plantCm: 30, seedsPerHole: 6,
      plantsPerAcre: calculatePlantsPerAcre(90, 30, 6),
      description: "Plant 5-6 seeds, thin to 2 plants"
    }
  ],

  "pyrethrum": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ],

  "sisal": [
    {
      label: "1.5m x 1.5m - Standard",
      rowCm: 150, plantCm: 150, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 150, 1),
      description: "4,000 plants/acre"
    }
  ],

  "sugarcane": [
    {
      label: "1.5m x 0.5m (setts) - Standard",
      rowCm: 150, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 50, 1),
      description: "Plant cane setts at this spacing"
    }
  ],

  "tea": [
    {
      label: "1.2m x 0.75m (high density) - Clonal tea",
      rowCm: 120, plantCm: 75, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(120, 75, 1),
      description: "4,500 plants/acre – for high yield"
    },
    {
      label: "1.5m x 0.75m (standard) - Seedling tea",
      rowCm: 150, plantCm: 75, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(150, 75, 1),
      description: "3,600 plants/acre – traditional spacing"
    },
    {
      label: "1.2m x 1.2m (square planting) - Wide spacing",
      rowCm: 120, plantCm: 120, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(120, 120, 1),
      description: "2,800 plants/acre – for mechanical harvesting"
    }
  ],

  "tobacco": [
    {
      label: "1m x 0.6m (transplanted) - Standard",
      rowCm: 100, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 60, 1),
      description: "6,666 plants/acre"
    },
    {
      label: "90cm x 50cm - High density",
      rowCm: 90, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 50, 1),
      description: "8,888 plants/acre"
    }
  ],

  // Additional cash crops
  "cocoa": [
    {
      label: "3m x 3m - Standard spacing",
      rowCm: 300, plantCm: 300, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 300, 1),
      description: "450 trees/acre – under shade"
    }
  ],
  "oil palm": [
    {
      label: "9m x 9m triangular - Standard",
      rowCm: 900, plantCm: 900, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(900, 900, 1),
      description: "55 trees/acre"
    }
  ],
  "rubber": [
    {
      label: "6m x 3m - Standard",
      rowCm: 600, plantCm: 300, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 300, 1),
      description: "220 trees/acre"
    }
  ],

  // ========== NUTS & OIL CROPS ==========
  "almond": [
    {
      label: "7m x 7m - Standard",
      rowCm: 700, plantCm: 700, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(700, 700, 1),
      description: "85 trees/acre"
    }
  ],

  "brazil nut": [
    {
      label: "10m x 10m - Standard",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    }
  ],

  "cashew": [
    {
      label: "10m x 10m - Standard spacing",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    },
    {
      label: "12m x 10m - Wide spacing",
      rowCm: 1200, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1200, 1000, 1),
      description: "33 trees/acre – for vigorous varieties"
    }
  ],

  "chestnut": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],

  "hazelnut": [
    {
      label: "6m x 5m - Standard",
      rowCm: 600, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 500, 1),
      description: "130 trees/acre"
    }
  ],

  "macadamia": [
    {
      label: "8m x 8m - Standard spacing",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre – for most varieties"
    },
    {
      label: "10m x 8m - Wide spacing",
      rowCm: 1000, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 800, 1),
      description: "50 trees/acre – for vigorous varieties"
    },
    {
      label: "6m x 6m (high density) - Dense planting",
      rowCm: 600, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 600, 1),
      description: "120 trees/acre – for dwarf varieties"
    }
  ],

  "pecan": [
    {
      label: "12m x 12m - Standard",
      rowCm: 1200, plantCm: 1200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1200, 1200, 1),
      description: "30 trees/acre"
    }
  ],

  "pistachio": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],

  "shea": [
    {
      label: "10m x 10m - Standard",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    }
  ],

  "walnut": [
    {
      label: "10m x 10m - Standard",
      rowCm: 1000, plantCm: 1000, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(1000, 1000, 1),
      description: "40 trees/acre"
    }
  ],

  "pili nut": [
    {
      label: "8m x 8m - Standard",
      rowCm: 800, plantCm: 800, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(800, 800, 1),
      description: "68 trees/acre"
    }
  ],

  // ========== OIL CROPS (annual) ==========
  "rapeseed": [
    {
      label: "30cm rows x 10cm (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "For oilseed production"
    }
  ],

  "safflower": [
    {
      label: "45cm x 15cm - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
      description: "5-7 kg seed/acre"
    }
  ],

  "sesame": [
    {
      label: "45cm x 15cm (2 seeds/hole) - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 2),
      description: "Standard spacing for sesame"
    },
    {
      label: "60cm x 20cm - Wide spacing",
      rowCm: 60, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 20, 2),
      description: "For vigorous varieties"
    }
  ],

  "simsim": [
    {
      label: "45cm x 15cm (2 seeds/hole) - Standard",
      rowCm: 45, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 2),
      description: "Standard spacing for sesame"
    },
    {
      label: "60cm x 20cm - Wide spacing",
      rowCm: 60, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(60, 20, 2),
      description: "For vigorous varieties"
    }
  ],

  "sunflower": [
    {
      label: "75cm x 30cm (2 seeds/hole, thin to 1) - Standard",
      rowCm: 75, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 2),
      description: "Plant 2 seeds, thin to 1 plant"
    }
  ],

  // ========== COVER CROPS ==========
  "alfalfa": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "10-15 kg seed/acre – for hay and pasture"
    }
  ],

  "canavalia": [
    {
      label: "75cm x 40cm - Intercrop",
      rowCm: 75, plantCm: 40, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 40, 1),
      description: "6 kg seed/acre – intercropped"
    },
    {
      label: "75cm x 30cm - Pure stand",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "7 kg seed/acre – pure stand"
    }
  ],

  "clover": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "2-3 kg seed/acre – for pasture"
    }
  ],

  "crotalaria juncea": [
    {
      label: "75cm x drill - Intercrop",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "16 kg seed/acre – intercropped"
    },
    {
      label: "45cm x drill - Pure stand",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "22 kg seed/acre – pure stand"
    }
  ],

  "crotalaria ochroleuca": [
    {
      label: "75cm x drill - Intercrop",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "14 kg seed/acre – intercropped"
    }
  ],

  "crotalaria paulina": [
    {
      label: "75cm x drill - Intercrop",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "16 kg seed/acre – intercropped"
    },
    {
      label: "45cm x drill - Pure stand",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "22 kg seed/acre – pure stand"
    }
  ],

  "desmodium": [
    {
      label: "30cm x drill (pure stand) - 2 kg seed/acre",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "For pure stand desmodium"
    },
    {
      label: "75cm x drill (intercrop) - 2 kg seed/acre",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "For intercropping with maize"
    }
  ],

  "dolichos": [
    {
      label: "45cm x 30cm (pure stand) - 24 kg seed/acre",
      rowCm: 45, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 2),
      description: "For pure stand dolichos"
    },
    {
      label: "75cm x 40cm (intercrop) - Brown dolichos",
      rowCm: 75, plantCm: 40, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 40, 2),
      description: "Intercrop with maize"
    },
    {
      label: "75cm x 30cm (intercrop) - Black dolichos",
      rowCm: 75, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 2),
      description: "Intercrop with maize"
    }
  ],

  "lucerne": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "10-15 kg seed/acre – for hay and pasture"
    }
  ],

  "mucuna": [
    {
      label: "75cm x 50cm - Intercrop",
      rowCm: 75, plantCm: 50, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 50, 2),
      description: "5 kg seed/acre – intercropped"
    },
    {
      label: "75cm x 30cm - Pure stand",
      rowCm: 75, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 2),
      description: "7 kg seed/acre – pure stand"
    }
  ],

  "vetch": [
    {
      label: "75cm rows x drill (cover crop) - Standard",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "For green manure"
    }
  ],

  "white clover": [
    {
      label: "30cm rows (drilled) - Pasture",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "2-3 kg seed/acre – for mixed pastures"
    },
    {
      label: "Broadcast - Overseeding",
      rowCm: 20, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 10, 1),
      description: "3-5 kg seed/acre – for overseeding existing pastures"
    }
  ],

  // ========== FORAGE GRASSES ==========
  "brachiaria": [
    {
      label: "75cm x 50cm (high density) - Cut-and-carry",
      rowCm: 75, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 50, 1),
      description: "2-4 kg seed/acre – for high biomass"
    },
    {
      label: "100cm x 60cm (grazing) - Wide spacing",
      rowCm: 100, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 60, 1),
      description: "For rotational grazing"
    }
  ],

  "buffel grass": [
    {
      label: "75cm x 30cm (drilled) - Dryland",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "2-3 kg seed/acre – for arid areas"
    }
  ],

  "forage sorghum": [
    {
      label: "75cm x 20cm (drilled) - Silage",
      rowCm: 75, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 20, 1),
      description: "8-10 kg seed/acre – for silage"
    },
    {
      label: "90cm x 30cm - Grazing",
      rowCm: 90, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 30, 1),
      description: "Lower density for grazing"
    }
  ],

  "guinea grass": [
    {
      label: "50cm rows (drilled) - High density",
      rowCm: 50, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 5, 1),
      description: "2-3 kg seed/acre – for pasture"
    },
    {
      label: "75cm rows - Grazing",
      rowCm: 75, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 5, 1),
      description: "Wider rows for grazing"
    }
  ],

  "italian ryegrass": [
    {
      label: "20cm rows (drilled) - High density",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "25-30 kg seed/acre – for forage"
    }
  ],

  "leucaena": [
    {
      label: "2m x 1m (alley cropping) - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 1),
      description: "5,000 plants/acre – for fodder"
    },
    {
      label: "1m x 1m (high density) - Fodder bank",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "10,000 plants/acre – for intensive fodder"
    }
  ],

  "napier grass": [
    {
      label: "1m x 0.5m (cut-and-carry) - Standard",
      rowCm: 100, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 50, 1),
      description: "8,000 plants/acre – for high fodder yield"
    }
  ],

  "napier hybrid": [
    {
      label: "1m x 0.5m (cut-and-carry) - Standard",
      rowCm: 100, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 50, 1),
      description: "8,000 plants/acre – high yield"
    }
  ],

  "orchard grass": [
    {
      label: "30cm rows (drilled) - Pasture",
      rowCm: 30, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 5, 1),
      description: "3-4 kg seed/acre – for grazing"
    }
  ],

  "rhodes grass": [
    {
      label: "30cm rows (drilled) - Pasture",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "2-3 kg seed/acre – for hay and pasture"
    }
  ],

  "sesbania": [
    {
      label: "1m x 1m (alley cropping) - Standard",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "4,000 plants/acre – for green manure"
    },
    {
      label: "50cm x 50cm (green manure) - High density",
      rowCm: 50, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 50, 1),
      description: "16,000 plants/acre – for biomass"
    }
  ],

  "timothy grass": [
    {
      label: "30cm rows (drilled) - Hay",
      rowCm: 30, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 5, 1),
      description: "2-3 kg seed/acre – for hay production"
    }
  ],

  "calliandra": [
    {
      label: "2m x 1m (alley cropping) - Standard",
      rowCm: 200, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 100, 1),
      description: "5,000 plants/acre – for fodder and green manure"
    },
    {
      label: "1m x 1m (high density) - Fodder bank",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "10,000 plants/acre – for intensive fodder"
    },
    {
      label: "3m x 2m (wide spacing) - For intercropping",
      rowCm: 300, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 200, 1),
      description: "2,600 plants/acre – allows intercropping with maize"
    }
  ],
  "cenchrus": [
    {
      label: "75cm x 30cm (drilled) - Dryland pasture",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "2-3 kg seed/acre – for arid and semi-arid areas"
    }
  ],
  "sunn hemp": [
    {
      label: "75cm rows (drilled) - Intercrop",
      rowCm: 75, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 10, 1),
      description: "16-22 kg seed/acre – for green manure"
    },
    {
      label: "45cm rows (drilled) - Pure stand",
      rowCm: 45, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 10, 1),
      description: "22-30 kg seed/acre – for maximum biomass"
    }
  ],

  // ========== HERBS & SPICES ==========
  "aloe vera": [
    {
      label: "50cm x 50cm - Standard spacing",
      rowCm: 50, plantCm: 50, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(50, 50, 1),
      description: "17,000 plants/acre – for leaf production"
    },
    {
      label: "60cm x 60cm - Wide spacing",
      rowCm: 60, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 60, 1),
      description: "11,200 plants/acre – for larger plants"
    }
  ],

  "basil": [
    {
      label: "30cm x 15cm - Standard spacing",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "45,000 plants/acre – for leaf harvest"
    },
    {
      label: "45cm x 30cm - Wide spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 2),
      description: "24,000 plants/acre – for larger plants"
    }
  ],

  "black pepper": [
    {
      label: "2m x 2m (with support trees) - Standard",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "1,000 plants/acre – plant at base of support trees"
    },
    {
      label: "2.5m x 2.5m - Wide spacing",
      rowCm: 250, plantCm: 250, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(250, 250, 1),
      description: "640 plants/acre – for vigorous varieties"
    }
  ],

  "cardamom": [
    {
      label: "2m x 2m (under shade) - Standard",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "1,000 plants/acre – under 50% shade"
    },
    {
      label: "2.5m x 2.5m - Wide spacing",
      rowCm: 250, plantCm: 250, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(250, 250, 1),
      description: "640 plants/acre – for better airflow"
    }
  ],

  "chamomile": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "For flower production"
    }
  ],

  "cinnamon": [
    {
      label: "5m x 5m - Standard spacing",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 trees/acre – for bark production"
    },
    {
      label: "4m x 4m - High density",
      rowCm: 400, plantCm: 400, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(400, 400, 1),
      description: "270 trees/acre – for coppice management"
    }
  ],

  "cloves": [
    {
      label: "6m x 6m - Standard spacing",
      rowCm: 600, plantCm: 600, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(600, 600, 1),
      description: "120 trees/acre – for clove production"
    }
  ],

  "dill": [
    {
      label: "30cm x 15cm - Standard spacing",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "45,000 plants/acre – for leaf and seed"
    }
  ],

  "echinacea": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for root harvest"
    }
  ],

  "fennel": [
    {
      label: "45cm x 20cm - Standard spacing",
      rowCm: 45, plantCm: 20, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(45, 20, 2),
      description: "27,000 plants/acre – for bulbs and seeds"
    }
  ],

  "flax": [
    {
      label: "20cm rows (drilled) - Standard",
      rowCm: 20, plantCm: 5, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 5, 1),
      description: "100 kg seed/acre – for fibre or seed"
    }
  ],

  "ginseng": [
    {
      label: "20cm x 20cm (under shade) - Standard",
      rowCm: 20, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(20, 20, 1),
      description: "100,000 plants/acre – under 75% shade"
    }
  ],

  "goldenseal": [
    {
      label: "30cm x 30cm (under shade) - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre – under 75% shade"
    }
  ],

  "hemp": [
    {
      label: "75cm x 30cm (fibre) - Standard",
      rowCm: 75, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 30, 1),
      description: "18,000 plants/acre – for fibre production"
    },
    {
      label: "100cm x 60cm (seed) - Wide spacing",
      rowCm: 100, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 60, 1),
      description: "6,700 plants/acre – for seed production"
    }
  ],

  "hibiscus": [
    {
      label: "1m x 1m - Standard",
      rowCm: 100, plantCm: 100, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(100, 100, 1),
      description: "4,000 plants/acre – for calyx production"
    }
  ],

  "hops": [
    {
      label: "2m x 2m (trellised) - Standard",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "2,500 plants/acre – for cone production"
    }
  ],

  "kenaf": [
    {
      label: "75cm x 15cm - Standard spacing",
      rowCm: 75, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 15, 1),
      description: "36,000 plants/acre – for fibre"
    }
  ],

  "lavender": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for oil production"
    }
  ],

  "lemon grass": [
    {
      label: "60cm x 60cm - Standard spacing",
      rowCm: 60, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 60, 1),
      description: "12,000 plants/acre – for leaf harvest"
    }
  ],

  "mint": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for leaf production"
    }
  ],

  "moringa": [
    {
      label: "2m x 2m (leaf production) - Standard",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "2,500 plants/acre – for intensive leaf harvest"
    },
    {
      label: "3m x 3m (seed/pod production) - Wide spacing",
      rowCm: 300, plantCm: 300, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 300, 1),
      description: "1,100 plants/acre – for seed and pods"
    }
  ],

  "mustard": [
    {
      label: "30cm rows x 10cm (direct seeded) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "67,000 plants/acre – for greens or seed"
    }
  ],

  "oregano": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for herb production"
    }
  ],

  "rosemary": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for bush growth"
    },
    {
      label: "90cm x 60cm - Wide spacing",
      rowCm: 90, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(90, 60, 1),
      description: "6,700 plants/acre – for large bushes"
    }
  ],

  "sage": [
    {
      label: "60cm x 45cm - Standard spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for herb production"
    }
  ],

  "thyme": [
    {
      label: "45cm x 30cm - Standard spacing",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre – for ground cover"
    },
    {
      label: "60cm x 45cm - Wide spacing",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for larger plants"
    }
  ],

  "vanilla": [
    {
      label: "2m x 2m (with support trees) - Standard",
      rowCm: 200, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(200, 200, 1),
      description: "1,000 plants/acre – under shade"
    }
  ],

  "wasabi": [
    {
      label: "30cm x 30cm (in flowing water) - Standard",
      rowCm: 30, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 30, 1),
      description: "45,000 plants/acre – for aquatic cultivation"
    }
  ],

  // Additional herbs/spices
  "stevia": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "45,000 plants/acre"
    }
  ],
  "fenugreek": [
    {
      label: "30cm x 10cm - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "For seed production"
    }
  ],
  "cumin": [
    {
      label: "30cm x 10cm - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "For seed"
    }
  ],
  "caraway": [
    {
      label: "30cm x 10cm - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 2),
      description: "For seed"
    }
  ],
  "anise": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For seed"
    }
  ],
  "lovage": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    }
  ],
  "marjoram": [
    {
      label: "30cm x 20cm - Standard",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre"
    }
  ],
  "tarragon": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    }
  ],
  "sorrel": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For leaf harvest"
    }
  ],
  "chervil": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 2,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 2),
      description: "For leaf harvest"
    }
  ],
  "savory": [
    {
      label: "30cm x 15cm - Standard",
      rowCm: 30, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
      description: "45,000 plants/acre"
    }
  ],
  "calendula": [
    {
      label: "30cm x 20cm - Standard",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre – for flowers"
    }
  ],
  "nasturtium": [
    {
      label: "30cm x 20cm - Standard",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre"
    }
  ],
  "borage": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    }
  ],
  "st. john's wort": [
    {
      label: "45cm x 30cm - Standard",
      rowCm: 45, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 30, 1),
      description: "24,000 plants/acre"
    }
  ],
  "valerian": [
    {
      label: "30cm x 20cm - Standard",
      rowCm: 30, plantCm: 20, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 20, 1),
      description: "67,000 plants/acre"
    }
  ],

  // ========== MEDICINAL PLANTS ==========
  "stinging nettle": [
    {
      label: "60cm x 30cm - Standard spacing",
      rowCm: 60, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 1),
      description: "18,000 plants/acre – for leaf harvest"
    }
  ],

  // ========== OTHER ==========
  "bamboo": [
    {
      label: "5m x 5m - Standard",
      rowCm: 500, plantCm: 500, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(500, 500, 1),
      description: "174 clumps/acre – for timber"
    }
  ],

  "mushroom": [
    {
      label: "N/A - Grown on substrate (bags/shelves)",
      rowCm: 0, plantCm: 0, seedsPerHole: 0,
      plantsPerAcre: 0,
      description: "Mushrooms are grown on pasteurized substrate in bags or shelves, not spaced in rows"
    }
  ],

  "oyster nut": [
    {
      label: "3m x 2m (trellised) - Standard",
      rowCm: 300, plantCm: 200, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(300, 200, 1),
      description: "For trellised leaf harvest"
    }
  ],

  "slender leaf": [
    {
      label: "45cm x 15cm - Standard spacing",
      rowCm: 45, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
      description: "For leaf harvest"
    }
  ],

  "jute mallow": [
    {
      label: "45cm x 15cm - Standard spacing",
      rowCm: 45, plantCm: 15, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
      description: "For leaf harvest"
    }
  ],

  "ramie": [
    {
      label: "60cm x 30cm - Standard",
      rowCm: 60, plantCm: 30, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 30, 1),
      description: "18,000 plants/acre – for fibre"
    }
  ],
  "jute": [
    {
      label: "30cm rows (drilled) - Standard",
      rowCm: 30, plantCm: 10, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
      description: "For fibre"
    }
  ],

  "birds eye chili": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre – for most varieties"
    },
    {
      label: "75cm x 60cm - Wide spacing",
      rowCm: 75, plantCm: 60, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(75, 60, 1),
      description: "6,700 plants/acre – for vigorous varieties"
    }
  ],

  "cayenne": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ],
  "garlic": [
  {
    label: "30cm x 10cm (transplanted) - Standard",
    rowCm: 30, plantCm: 10, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
    description: "Transplant cloves at this spacing, 50,000 plants/acre"
  },
  {
    label: "45cm x 15cm - Wide spacing (for larger bulbs)",
    rowCm: 45, plantCm: 15, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
    description: "33,000 plants/acre – for jumbo bulbs"
  }
],
"shallots": [
  {
    label: "30cm x 10cm (transplanted) - Standard",
    rowCm: 30, plantCm: 10, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 10, 1),
    description: "Transplant bulbs at this spacing, 50,000 plants/acre"
  },
  {
    label: "45cm x 15cm - Wide spacing",
    rowCm: 45, plantCm: 15, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(45, 15, 1),
    description: "33,000 plants/acre – for larger bulbs"
  }
],

"chives": [
  {
    label: "30cm x 15cm (transplanted) - Standard",
    rowCm: 30, plantCm: 15, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(30, 15, 1),
    description: "45,000 plants/acre – for leaf harvest"
  },
  {
    label: "45cm x 20cm - Wide spacing",
    rowCm: 45, plantCm: 20, seedsPerHole: 1,
    plantsPerAcre: calculatePlantsPerAcre(45, 20, 1),
    description: "27,000 plants/acre – for larger clumps"
  }
],

  "jalapeno": [
    {
      label: "60cm x 45cm - Standard",
      rowCm: 60, plantCm: 45, seedsPerHole: 1,
      plantsPerAcre: calculatePlantsPerAcre(60, 45, 1),
      description: "12,000 plants/acre"
    }
  ]
};

export function getSpacingOptions(crop: string): SpacingOption[] {
  const normalized = crop.toLowerCase().trim();
  return cropSpacingOptions[normalized] || [];
}

export function getSpacingByLabel(crop: string, label: string): SpacingOption | undefined {
  const options = getSpacingOptions(crop);
  return options.find(opt => opt.label === label);
}

export const cropSpacing = cropSpacingOptions;