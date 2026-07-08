// lib/fertilizerPrices.ts
// Fertilizer price tracking with package sizes - UPDATED with nutrient-enhanced fertilizers

export interface FertilizerPrice {
  fertilizerId: string;
  brand: string;
  pricePer50kg: number;
  packageSizes: {
    size: string; // e.g., "50kg bag", "1 ton"
    price: number;
    retailer?: string;
    location?: string;
  }[];
  lastUpdated: string;
  // NEW: Nutrient composition for display
  nutrients?: {
    n?: number;
    p?: number;
    k?: number;
    s?: number;
    ca?: number;
    mg?: number;
    zn?: number;
    b?: number;
  };
}

export const fertilizerPrices: Record<string, FertilizerPrice> = {
  // Base fertilizers
  dap: {
    fertilizerId: "dap",
    brand: "DAP (18-46-0)",
    pricePer50kg: 3500,
    packageSizes: [
      { size: "50kg bag", price: 3500, retailer: "Agrovet", location: "Bungoma" },
      { size: "50kg bag", price: 3400, retailer: "NCPB", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 66000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 18, p: 46, k: 0 }
  },

  can: {
    fertilizerId: "ss_can",
    brand: "CAN (27-0-0)",
    pricePer50kg: 2600,
    packageSizes: [
      { size: "50kg bag", price: 2600, retailer: "Agrovet", location: "Bungoma" },
      { size: "50kg bag", price: 2500, retailer: "NCPB", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 50000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 27, p: 0, k: 0, ca: 8 }
  },

  urea: {
    fertilizerId: "ss_urea",
    brand: "UREA (46-0-0)",
    pricePer50kg: 2900,
    packageSizes: [
      { size: "50kg bag", price: 2900, retailer: "Agrovet", location: "Bungoma" },
      { size: "50kg bag", price: 2800, retailer: "NCPB", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 56000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 46, p: 0, k: 0 }
  },

  mop: {
    fertilizerId: "mop",
    brand: "MOP (0-0-60)",
    pricePer50kg: 2850,
    packageSizes: [
      { size: "50kg bag", price: 2850, retailer: "Agrovet", location: "Bungoma" },
      { size: "50kg bag", price: 2800, retailer: "NCPB", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 55000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 0, p: 0, k: 60 }
  },

  sop: {
    fertilizerId: "sop",
    brand: "SOP (0-0-50)",
    pricePer50kg: 3300,
    packageSizes: [
      { size: "50kg bag", price: 3300, retailer: "Agrovet", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 64000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 0, p: 0, k: 50, s: 18 }
  },

  npk_2323: {
    fertilizerId: "npk_2323",
    brand: "NPK 23-23-0",
    pricePer50kg: 3100,
    packageSizes: [
      { size: "50kg bag", price: 3100, retailer: "Agrovet", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 60000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 23, p: 23, k: 0 }
  },

  npk_171717: {
    fertilizerId: "npk_171717",
    brand: "NPK 17-17-17",
    pricePer50kg: 3600,
    packageSizes: [
      { size: "50kg bag", price: 3600, retailer: "Agrovet", location: "Bungoma" },
      { size: "1 ton (20 bags)", price: 70000, retailer: "Wholesale", location: "Bungoma" }
    ],
    lastUpdated: "2024-01-15",
    nutrients: { n: 17, p: 17, k: 17 }
  },

  // NEW: Yara fertilizers with secondary nutrients
  yara_power: {
    fertilizerId: "yara_power",
    brand: "Yara Mila Power (13-24-12)",
    pricePer50kg: 3900,
    packageSizes: [
      { size: "50kg bag", price: 3900, retailer: "Yara", location: "Nationwide" },
      { size: "1 ton (20 bags)", price: 76000, retailer: "Yara Bulk", location: "Nairobi" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 13, p: 24, k: 12, mg: 2, s: 4.5, zn: 0.02 }
  },

  yara_microp_planting: {
    fertilizerId: "yara_microp_planting",
    brand: "MiCrop + Planting (11-28-4.5)",
    pricePer50kg: 3700,
    packageSizes: [
      { size: "50kg bag", price: 3700, retailer: "Yara", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 11, p: 28, k: 4.5, ca: 6, mg: 2, s: 7, zn: 0.1 }
  },

  // NEW: Elgon Kenya fertilizers
  elgon_thabiti_1730: {
    fertilizerId: "elgon_thabiti_1730",
    brand: "Thabiti Planting Cereal (17-30-6)",
    pricePer50kg: 3600,
    packageSizes: [
      { size: "50kg bag", price: 3600, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 17, p: 30, k: 6, s: 3.5, ca: 2, zn: 0.4 }
  },

  elgon_thabiti_1326_potato: {
    fertilizerId: "elgon_thabiti_1326_potato",
    brand: "Thabiti Planting Potato (13-26-13)",
    pricePer50kg: 3700,
    packageSizes: [
      { size: "50kg bag", price: 3700, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 13, p: 26, k: 13, s: 3, ca: 2, mg: 1, zn: 0.2, b: 0.1, mn: 0.2 }
  },

  elgon_thabiti_hort: {
    fertilizerId: "elgon_thabiti_hort",
    brand: "Thabiti Hort Special (12-24-12)",
    pricePer50kg: 3600,
    packageSizes: [
      { size: "50kg bag", price: 3600, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 12, p: 24, k: 12, s: 3, ca: 2, mg: 1.5, zn: 0.3, b: 0.1 }
  },

  elgon_thabiti_fruit: {
    fertilizerId: "elgon_thabiti_fruit",
    brand: "Thabiti Fruit Special (10-20-20)",
    pricePer50kg: 3900,
    packageSizes: [
      { size: "50kg bag", price: 3900, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 10, p: 20, k: 20, s: 2.5, mg: 1.5, zn: 0.3, b: 0.2 }
  },

  // NEW: ETG fertilizers
  etg_kynopanda: {
    fertilizerId: "etg_kynopanda",
    brand: "KynoPanda Power (10-25-10)",
    pricePer50kg: 3500,
    packageSizes: [
      { size: "50kg bag", price: 3500, retailer: "ETG", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 10, p: 25, k: 10, s: 7, zn: 0.5, ca: 4.5, mg: 1.3 }
  },

  etg_kynomaizeic: {
    fertilizerId: "etg_kynomaizeic",
    brand: "KynoMaizeic (16-29-2)",
    pricePer50kg: 3600,
    packageSizes: [
      { size: "50kg bag", price: 3600, retailer: "ETG", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 16, p: 29, k: 2, s: 5.7, ca: 3.9 }
  },

  etg_kynovegetable: {
    fertilizerId: "etg_kynovegetable",
    brand: "KynoVegetable (15-15-15)",
    pricePer50kg: 3400,
    packageSizes: [
      { size: "50kg bag", price: 3400, retailer: "ETG", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 15, p: 15, k: 15, s: 3, zn: 0.2, b: 0.1 }
  },

  etg_kynofruit: {
    fertilizerId: "etg_kynofruit",
    brand: "KynoFruit (12-12-17)",
    pricePer50kg: 3700,
    packageSizes: [
      { size: "50kg bag", price: 3700, retailer: "ETG", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 12, p: 12, k: 17, s: 2, mg: 1.5, zn: 0.2 }
  },

  // NEW: OCP fertilizers
  ocp_npsb: {
    fertilizerId: "ocp_npsb",
    brand: "OCP NPSB (18.9-37.7-0)",
    pricePer50kg: 3700,
    packageSizes: [
      { size: "50kg bag", price: 3700, retailer: "OCP", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 18.9, p: 37.7, k: 0, s: 6.9, b: 0.1 }
  },

  // NEW: Potassium fertilizers with secondary nutrients
  kplus_korn_kali: {
    fertilizerId: "kplus_korn_kali",
    brand: "Korn-Kali (0-0-40)",
    pricePer50kg: 3000,
    packageSizes: [
      { size: "50kg bag", price: 3000, retailer: "KPLUS", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 0, p: 0, k: 40, mg: 6, s: 5, na: 3, b: 0.25 }
  },

  kplus_patentkali: {
    fertilizerId: "kplus_patentkali",
    brand: "Patentkali (0-0-30)",
    pricePer50kg: 3100,
    packageSizes: [
      { size: "50kg bag", price: 3100, retailer: "KPLUS", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 0, p: 0, k: 30, mg: 10, s: 17 }
  },

  // NEW: Topdressing fertilizers
  yara_microp_topdressing: {
    fertilizerId: "yara_microp_topdressing",
    brand: "MiCrop + Topdressing (34-0-3)",
    pricePer50kg: 3100,
    packageSizes: [
      { size: "50kg bag", price: 3100, retailer: "Yara", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 34, p: 0, k: 3, ca: 4, mg: 1, s: 4, zn: 0.1 }
  },

  yara_bela_sulfan: {
    fertilizerId: "yara_bela_sulfan",
    brand: "Yara Bela Sulfan (24-0-0)",
    pricePer50kg: 2900,
    packageSizes: [
      { size: "50kg bag", price: 2900, retailer: "Yara", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 24, p: 0, k: 0, s: 6 }
  },

  elgon_thabiti_top_potato: {
    fertilizerId: "elgon_thabiti_top_potato",
    brand: "Thabiti Top Dressing Potato (24-0-24)",
    pricePer50kg: 3300,
    packageSizes: [
      { size: "50kg bag", price: 3300, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 24, p: 0, k: 24, s: 4, ca: 1, mg: 0.2, zn: 0.1, b: 0.1, mn: 0.1 }
  },

  elgon_thabiti_top_sugar: {
    fertilizerId: "elgon_thabiti_top_sugar",
    brand: "Thabiti Top Dressing Sugar Cane (26-0-20)",
    pricePer50kg: 3200,
    packageSizes: [
      { size: "50kg bag", price: 3200, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 26, p: 0, k: 20, s: 2, ca: 2, zn: 0.5 }
  },

  elgon_thabiti_top_veg: {
    fertilizerId: "elgon_thabiti_top_veg",
    brand: "Thabiti Top Dressing Vegetables (20-0-15)",
    pricePer50kg: 3100,
    packageSizes: [
      { size: "50kg bag", price: 3100, retailer: "Elgon", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 20, p: 0, k: 15, s: 2, mg: 1, zn: 0.2, b: 0.1 }
  },

  etg_kynogrowmax: {
    fertilizerId: "etg_kynogrowmax",
    brand: "KynoGrowMax (30-0-10)",
    pricePer50kg: 3100,
    packageSizes: [
      { size: "50kg bag", price: 3100, retailer: "ETG", location: "Nationwide" }
    ],
    lastUpdated: "2024-06-15",
    nutrients: { n: 30, p: 0, k: 10, s: 4, b: 0.3, ca: 2, mg: 1 }
  },

  // Regional price variations
  regional_prices: {
    "Bungoma": {
      dap: 3500,
      can: 2600,
      urea: 2900,
      mop: 2850
    },
    "Kitale": {
      dap: 3550,
      can: 2650,
      urea: 2950,
      mop: 2900
    },
    "Eldoret": {
      dap: 3450,
      can: 2550,
      urea: 2850,
      mop: 2800
    },
    "Nakuru": {
      dap: 3400,
      can: 2500,
      urea: 2800,
      mop: 2750
    },
    "Nairobi": {
      dap: 3600,
      can: 2700,
      urea: 3000,
      mop: 2950
    }
  }
};

export const defaultFertilizerPrices: Record<string, number> = {
  dap: 3500,
  ss_urea: 2900,
  ss_can: 2600,
  ss_as: 2300,
  npk_2323: 3100,
  npk_171717: 3600,
  mop: 2850,
  sop: 3300,
  yara_power: 3900,
  yara_microp_planting: 3700,
  elgon_thabiti_1730: 3600,
  elgon_thabiti_1326_potato: 3700,
  elgon_thabiti_hort: 3600,
  elgon_thabiti_fruit: 3900,
  etg_kynopanda: 3500,
  etg_kynomaizeic: 3600,
  etg_kynovegetable: 3400,
  etg_kynofruit: 3700,
  ocp_npsb: 3700,
  kplus_korn_kali: 3000,
  kplus_patentkali: 3100,
  yara_microp_topdressing: 3100,
  yara_bela_sulfan: 2900,
  elgon_thabiti_top_potato: 3300,
  elgon_thabiti_top_sugar: 3200,
  elgon_thabiti_top_veg: 3100,
  etg_kynogrowmax: 3100
};

export function getFertilizerPrice(fertilizerId: string): number {
  return defaultFertilizerPrices[fertilizerId] || 0;
}

export function getFertilizerPriceWithPackages(fertilizerId: string): FertilizerPrice | undefined {
  return fertilizerPrices[fertilizerId];
}

// NEW: Get fertilizer price by location
export function getFertilizerPriceByLocation(fertilizerId: string, location: string): number {
  // Try to get regional price first
  const regionKey = location.split(',')[0].trim(); // Get first part of location
  const regionPrices = (fertilizerPrices as any).regional_prices?.[regionKey];

  if (regionPrices && regionPrices[fertilizerId]) {
    return regionPrices[fertilizerId];
  }

  // Fallback to default price
  return defaultFertilizerPrices[fertilizerId] || 0;
}

export function calculateTotalCost(recommendations: any[]): number {
  return recommendations.reduce((total, rec) => {
    const pricePerKg = (getFertilizerPrice(rec.fertilizerId) || 0) / 50;
    const cost = rec.amountKg * pricePerKg;

    // Add package size recommendation
    const bagsNeeded = Math.ceil(rec.amountKg / 50);
    const bulkBagsNeeded = Math.floor(rec.amountKg / 50);
    const bulkPrice = fertilizerPrices[rec.fertilizerId]?.packageSizes.find(p => p.size.includes("ton"))?.price;

    rec.purchaseRecommendation = {
      exactNeeded: `${rec.amountKg}kg (${bagsNeeded} bag(s) of 50kg)`,
      bulkOption: bulkPrice ? `Consider buying ${bulkBagsNeeded} bags with neighbors to save` : undefined
      // Removed hardcoded costBreakdown string with "Ksh". Caller should format using currency system.
    };

    return total + cost;
  }, 0);
}

// Calculate savings from bulk purchase
export function calculateBulkSavings(fertilizerId: string, quantityKg: number): { normalPrice: number; bulkPrice: number; savings: number } {
  const fertilizer = fertilizerPrices[fertilizerId];
  if (!fertilizer) return { normalPrice: 0, bulkPrice: 0, savings: 0 };

  const bagsNeeded = Math.ceil(quantityKg / 50);
  const normalPrice = bagsNeeded * fertilizer.pricePer50kg;

  // Check if bulk option exists (1 ton = 20 bags)
  const bulkOption = fertilizer.packageSizes.find(p => p.size.includes("ton"));
  if (bulkOption && bagsNeeded >= 20) {
    const bulkBagsNeeded = Math.floor(bagsNeeded / 20) * 20;
    const remainingBags = bagsNeeded % 20;
    const bulkPrice = (bulkBagsNeeded / 20) * bulkOption.price;
    const remainingPrice = remainingBags * fertilizer.pricePer50kg;
    const totalBulkPrice = bulkPrice + remainingPrice;

    return {
      normalPrice,
      bulkPrice: totalBulkPrice,
      savings: normalPrice - totalBulkPrice
    };
  }

  return { normalPrice, bulkPrice: normalPrice, savings: 0 };
}

// NEW: Calculate total cost including nutrient composition
export function calculateCostPerNutrient(fertilizerId: string, quantityKg: number): {
  totalCost: number;
  costPerKgNutrient: {
    n?: number;
    p?: number;
    k?: number;
    s?: number;
    ca?: number;
    mg?: number;
    zn?: number;
    b?: number;
  };
} {
  const fertilizer = fertilizerPrices[fertilizerId];
  if (!fertilizer || !fertilizer.nutrients) {
    return { totalCost: 0, costPerKgNutrient: {} };
  }

  const totalCost = (getFertilizerPrice(fertilizerId) / 50) * quantityKg;
  const nutrients = fertilizer.nutrients;

  const costPerKgNutrient: any = {};

  if (nutrients.n) costPerKgNutrient.n = totalCost / (nutrients.n / 100 * quantityKg);
  if (nutrients.p) costPerKgNutrient.p = totalCost / (nutrients.p / 100 * quantityKg);
  if (nutrients.k) costPerKgNutrient.k = totalCost / (nutrients.k / 100 * quantityKg);
  if (nutrients.s) costPerKgNutrient.s = totalCost / (nutrients.s / 100 * quantityKg);
  if (nutrients.ca) costPerKgNutrient.ca = totalCost / (nutrients.ca / 100 * quantityKg);
  if (nutrients.mg) costPerKgNutrient.mg = totalCost / (nutrients.mg / 100 * quantityKg);
  if (nutrients.zn) costPerKgNutrient.zn = totalCost / (nutrients.zn / 100 * quantityKg);
  if (nutrients.b) costPerKgNutrient.b = totalCost / (nutrients.b / 100 * quantityKg);

  return { totalCost, costPerKgNutrient };
}