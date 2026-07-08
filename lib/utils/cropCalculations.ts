// lib/utils/cropCalculations.ts
// This file contains PURE calculation functions (NO "use server")

// ========== CALCULATE GROSS MARGIN FOR EACH CROP ==========
export function calculateCropGrossMargin(crop: string, farmerData: any): number {
  // Default values based on crop type
  const defaults: Record<string, any> = {
    maize: {
      yieldPerAcre: 40,
      pricePerBag: farmerData.maizePrice || 6750,
      seedCost: 5625,
      fertilizerCost: 13250,
      labourCost: 24200,
      transportCost: 2000,
      bagCost: 1600
    },
    beans: {
      yieldPerAcre: 15,
      pricePerBag: farmerData.beansPrice || 10350,
      seedCost: 3000,
      fertilizerCost: 3300,
      labourCost: 5200,
      transportCost: 1000,
      bagCost: 400
    },
    coffee: {
      yieldPerAcre: 30,
      pricePerBag: 15000,
      seedCost: 8000,
      fertilizerCost: 18000,
      labourCost: 35000,
      transportCost: 3000,
      bagCost: 2000
    },
    bananas: {
      yieldPerAcre: 50,
      pricePerBag: 800,
      seedCost: 5000,
      fertilizerCost: 3000,
      labourCost: 10000,
      transportCost: 2000,
      bagCost: 1000
    },
    vegetables: {
      yieldPerAcre: 100,
      pricePerBag: 500,
      seedCost: 4000,
      fertilizerCost: 8000,
      labourCost: 15000,
      transportCost: 3000,
      bagCost: 2000
    }
  };

  // Get crop defaults or use maize as fallback
  const cropData = defaults[crop.toLowerCase()] || defaults.maize;

  // Use farmer's actual data if available
  const yieldPerAcre = farmerData.actualYield || cropData.yieldPerAcre;
  const price = cropData.pricePerBag;
  const seedCost = farmerData.seedCost || cropData.seedCost;
  const fertilizerCost = cropData.fertilizerCost;
  const labourCost = farmerData.dailyWageRate ?
    (farmerData.dailyWageRate * 100) : cropData.labourCost;
  const transportCost = farmerData.transportCostPerBag ?
    farmerData.transportCostPerBag * yieldPerAcre : cropData.transportCost;
  const bagCost = farmerData.bagCost ?
    farmerData.bagCost * yieldPerAcre : cropData.bagCost;

  // Calculate revenue and costs
  const revenue = yieldPerAcre * price;
  const totalCosts = seedCost + fertilizerCost + labourCost + transportCost + bagCost;
  const grossMargin = revenue - totalCosts;

  return Math.max(0, grossMargin);
}

// ========== CALCULATE PROFIT FOR ALL CROPS AND RANK THEM ==========
export function calculateRankedCropProfits(sessionData: any): {
  crop: string;
  profit: number;
  rank: number;
  color: string;
  icon: string;
}[] {
  const crops = sessionData?.crops || [];

  if (crops.length === 0) return [];

  // Calculate profit for each crop
  const profits = crops.map((crop: string) => ({
    crop,
    profit: calculateCropGrossMargin(crop, sessionData)
  }));

  // Sort by profit descending (highest first)
  const sorted = profits.sort((a, b) => b.profit - a.profit);

  // Add rank and styling
  const colors = [
    "from-green-500 to-emerald-600",
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-red-500 to-rose-600",
    "from-teal-500 to-cyan-600"
  ];

  const icons = [
    "Crown",
    "Trophy",
    "Award",
    "Star",
    "Target",
    "Flag"
  ];

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
    color: colors[index % colors.length],
    icon: icons[index % icons.length]
  }));
}