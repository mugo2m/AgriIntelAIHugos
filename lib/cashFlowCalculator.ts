// lib/cashFlowCalculator.ts
// Calculate monthly cash flow projections based on planting and harvest dates

import { getCropMaturityPeriod } from '@/lib/data/cropMaturity';
import { parseNutrientString } from '@/lib/utils';
import { FieldValue } from "firebase-admin/firestore";

export interface CashFlowMonth {
  month: number;
  monthName: string;
  activities: string[];
  costs: number;
  revenue: number;
  netCash: number;
  cumulativeCash: number;
  costBreakdown?: {
    seed?: number;
    plantingMaterial?: number;
    fertilizer?: number;
    labour?: number;
    transport?: number;
    packaging?: number;
    miscellaneous?: number;
  };
  fertilizerApplications?: {
    type: 'planting' | 'topdressing' | 'potassium';
    product: string;
    amountKg: number;
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
  }[];
}

export interface CashFlowResult {
  crop: string;
  country: string;
  region: string;
  farmSize: number;
  plantingDate: string;
  harvestDate: string;
  maturityMonths: number;
  months: CashFlowMonth[];
  totalCosts: number;
  totalRevenue: number;
  netProfit: number;
  roi: number;
  peakDeficit: number;
  loanNeeded: number;
  repaymentCapacity: number;
  breakevenYield: number;
  costBreakdown: {
    seed: number;
    fertilizer: number;
    labour: number;
    transport: number;
    packaging: number;
    miscellaneous: number;
  };
  totalNutrients: {
    n: number;
    p: number;
    k: number;
    s?: number;
    ca?: number;
    mg?: number;
    zn?: number;
    b?: number;
  };
  plantsDamaged?: number;
}

export function calculateCashFlow(
  crop: string,
  country: string,
  region: string,
  farmSize: number,
  plantingDate: string,
  harvestDate: string,
  costs: {
    seedCost: number;
    plantingMaterialCost?: number;
    plantingMaterialQuantity?: number;
    plantingFertilizerCost: number;
    topdressingFertilizerCost: number;
    potassiumFertilizerCost: number;
    ploughingCost: number;
    plantingLabourCost: number;
    weedingCost: number;
    harvestingCost: number;
    transportCostTotal: number;      // ✅ CHANGED: total transport cost
    packagingCostTotal: number;      // ✅ CHANGED: total packaging cost
    miscellaneousCostTotal: number;  // ✅ NEW: miscellaneous costs
    otherCosts?: { name: string; amount: number }[];
    plantingFertilizer?: {
      brand: string;
      amountKg: number;
      nutrients?: any;
    };
    topdressingFertilizer?: {
      brand: string;
      amountKg: number;
      nutrients?: any;
    };
    potassiumFertilizer?: {
      brand: string;
      amountKg: number;
      nutrients?: any;
    };
    usesSeed?: boolean;
    seedRate?: number;
  },
  yield: {
    actualYieldKg: number;
    pricePerKg: number;
  },
  plantsDamaged?: number
): CashFlowResult {

  const usesSeed = costs.usesSeed ?? true;

  let plantingMaterialTotal = 0;
  if (usesSeed && costs.seedCost && costs.seedRate) {
    plantingMaterialTotal = costs.seedCost * costs.seedRate * farmSize;
  } else if (!usesSeed && costs.plantingMaterialCost && costs.plantingMaterialQuantity) {
    plantingMaterialTotal = costs.plantingMaterialCost * costs.plantingMaterialQuantity;
  }

  const fertilizerCost =
    (costs.plantingFertilizerCost || 0) * farmSize +
    (costs.topdressingFertilizerCost || 0) * farmSize +
    (costs.potassiumFertilizerCost || 0) * farmSize;

  const totalNutrients = {
    n: 0, p: 0, k: 0,
    s: 0, ca: 0, mg: 0, zn: 0, b: 0
  };

  if (costs.plantingFertilizer) {
    const fert = costs.plantingFertilizer;
    const factor = fert.amountKg / 100;
    if (fert.nutrients) {
      if (fert.nutrients.n) totalNutrients.n += fert.nutrients.n * factor;
      if (fert.nutrients.p) totalNutrients.p += fert.nutrients.p * factor;
      if (fert.nutrients.k) totalNutrients.k += fert.nutrients.k * factor;
      if (fert.nutrients.s) totalNutrients.s += fert.nutrients.s * factor;
      if (fert.nutrients.ca) totalNutrients.ca += fert.nutrients.ca * factor;
      if (fert.nutrients.mg) totalNutrients.mg += fert.nutrients.mg * factor;
      if (fert.nutrients.zn) totalNutrients.zn += fert.nutrients.zn * factor;
      if (fert.nutrients.b) totalNutrients.b += fert.nutrients.b * factor;
    }
  }

  if (costs.topdressingFertilizer) {
    const fert = costs.topdressingFertilizer;
    const factor = fert.amountKg / 100;
    if (fert.nutrients) {
      if (fert.nutrients.n) totalNutrients.n += fert.nutrients.n * factor;
      if (fert.nutrients.p) totalNutrients.p += fert.nutrients.p * factor;
      if (fert.nutrients.k) totalNutrients.k += fert.nutrients.k * factor;
      if (fert.nutrients.s) totalNutrients.s += fert.nutrients.s * factor;
      if (fert.nutrients.ca) totalNutrients.ca += fert.nutrients.ca * factor;
      if (fert.nutrients.mg) totalNutrients.mg += fert.nutrients.mg * factor;
      if (fert.nutrients.zn) totalNutrients.zn += fert.nutrients.zn * factor;
      if (fert.nutrients.b) totalNutrients.b += fert.nutrients.b * factor;
    }
  }

  if (costs.potassiumFertilizer) {
    const fert = costs.potassiumFertilizer;
    const factor = fert.amountKg / 100;
    if (fert.nutrients) {
      if (fert.nutrients.n) totalNutrients.n += fert.nutrients.n * factor;
      if (fert.nutrients.p) totalNutrients.p += fert.nutrients.p * factor;
      if (fert.nutrients.k) totalNutrients.k += fert.nutrients.k * factor;
      if (fert.nutrients.s) totalNutrients.s += fert.nutrients.s * factor;
      if (fert.nutrients.ca) totalNutrients.ca += fert.nutrients.ca * factor;
      if (fert.nutrients.mg) totalNutrients.mg += fert.nutrients.mg * factor;
      if (fert.nutrients.zn) totalNutrients.zn += fert.nutrients.zn * factor;
      if (fert.nutrients.b) totalNutrients.b += fert.nutrients.b * factor;
    }
  }

  const labourCost =
    (costs.ploughingCost || 0) * farmSize +
    (costs.plantingLabourCost || 0) * farmSize +
    (costs.weedingCost || 0) * farmSize +
    (costs.harvestingCost || 0) * farmSize;

  const transportCostValue = costs.transportCostTotal || 0;      // ✅ CHANGED: total transport cost
  const packagingCostValue = costs.packagingCostTotal || 0;      // ✅ CHANGED: total packaging cost
  const miscellaneousCostValue = costs.miscellaneousCostTotal || 0; // ✅ NEW: miscellaneous costs

  const otherCostsTotal = costs.otherCosts
    ? costs.otherCosts.reduce((sum, item) => sum + item.amount, 0)
    : 0;

  const totalCosts =
    plantingMaterialTotal +
    fertilizerCost +
    labourCost +
    transportCostValue +
    packagingCostValue +
    miscellaneousCostValue +
    otherCostsTotal;

  const costBreakdown = {
    seed: plantingMaterialTotal,
    fertilizer: fertilizerCost,
    labour: labourCost,
    transport: transportCostValue,
    packaging: packagingCostValue,
    miscellaneous: miscellaneousCostValue
  };

  const totalRevenue = (yield.actualYieldKg || 0) * (yield.pricePerKg || 0) * farmSize;
  const netProfit = totalRevenue - totalCosts;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

  const maturityMonths = getCropMaturityPeriod(crop, country, region) ||
    Math.ceil((new Date(harvestDate).getTime() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24 * 30));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const months: CashFlowMonth[] = [];
  let cumulativeCash = 0;
  let peakDeficit = 0;

  for (let i = 0; i < maturityMonths; i++) {
    const currentDate = new Date(plantingDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    const monthName = monthNames[currentDate.getMonth()];
    const monthNum = i + 1;

    let monthCosts = 0;
    const activities: string[] = [];
    const costBreakdownMonth: any = { seed: 0, fertilizer: 0, labour: 0, transport: 0, packaging: 0, miscellaneous: 0 };
    const fertilizerApplications: any[] = [];

    if (i === 0) {
      monthCosts += (costs.ploughingCost || 0) * farmSize;
      monthCosts += (costs.plantingLabourCost || 0) * farmSize;
      monthCosts += plantingMaterialTotal;
      monthCosts += (costs.plantingFertilizerCost || 0) * farmSize;

      costBreakdownMonth.seed += plantingMaterialTotal;
      costBreakdownMonth.labour += ((costs.ploughingCost || 0) + (costs.plantingLabourCost || 0)) * farmSize;
      costBreakdownMonth.fertilizer += (costs.plantingFertilizerCost || 0) * farmSize;

      activities.push('Land preparation', 'Planting', usesSeed ? 'Seed purchase' : 'Planting material purchase', 'Planting fertilizer');

      if (costs.plantingFertilizer) {
        fertilizerApplications.push({
          type: 'planting',
          product: costs.plantingFertilizer.brand,
          amountKg: costs.plantingFertilizer.amountKg,
          nutrients: costs.plantingFertilizer.nutrients
        });
      }

    } else if (i === 1) {
      monthCosts += (costs.weedingCost || 0) * farmSize * 0.5;
      monthCosts += (costs.topdressingFertilizerCost || 0) * farmSize * 0.5;

      costBreakdownMonth.labour += (costs.weedingCost || 0) * farmSize * 0.5;
      costBreakdownMonth.fertilizer += (costs.topdressingFertilizerCost || 0) * farmSize * 0.5;

      activities.push('Weeding (1st)', 'Topdressing (1st application)');

      if (costs.topdressingFertilizer && maturityMonths > 2) {
        fertilizerApplications.push({
          type: 'topdressing',
          product: costs.topdressingFertilizer.brand,
          amountKg: costs.topdressingFertilizer.amountKg * 0.5,
          nutrients: costs.topdressingFertilizer.nutrients
        });
      }

    } else if (i === 2 && maturityMonths > 3) {
      monthCosts += (costs.weedingCost || 0) * farmSize * 0.5;
      monthCosts += (costs.topdressingFertilizerCost || 0) * farmSize * 0.5;

      costBreakdownMonth.labour += (costs.weedingCost || 0) * farmSize * 0.5;
      costBreakdownMonth.fertilizer += (costs.topdressingFertilizerCost || 0) * farmSize * 0.5;

      activities.push('Weeding (2nd)', 'Topdressing (2nd application)');

      if (costs.topdressingFertilizer && maturityMonths > 3) {
        fertilizerApplications.push({
          type: 'topdressing',
          product: costs.topdressingFertilizer.brand,
          amountKg: costs.topdressingFertilizer.amountKg * 0.5,
          nutrients: costs.topdressingFertilizer.nutrients
        });
      }

    } else if (i === maturityMonths - 1) {
      monthCosts += (costs.harvestingCost || 0) * farmSize;
      monthCosts += transportCostValue;
      monthCosts += packagingCostValue;
      monthCosts += miscellaneousCostValue;

      costBreakdownMonth.labour += (costs.harvestingCost || 0) * farmSize;
      costBreakdownMonth.transport += transportCostValue;
      costBreakdownMonth.packaging += packagingCostValue;
      costBreakdownMonth.miscellaneous += miscellaneousCostValue;

      activities.push('Harvesting', 'Transport', 'Packaging');

      if (costs.potassiumFertilizer) {
        const kMonth = Math.floor(maturityMonths * 0.6);
        if (i === kMonth) {
          monthCosts += (costs.potassiumFertilizerCost || 0) * farmSize;
          costBreakdownMonth.fertilizer += (costs.potassiumFertilizerCost || 0) * farmSize;
          activities.push('Potassium application');

          fertilizerApplications.push({
            type: 'potassium',
            product: costs.potassiumFertilizer.brand,
            amountKg: costs.potassiumFertilizer.amountKg,
            nutrients: costs.potassiumFertilizer.nutrients
          });
        }
      }

    } else if (i === Math.floor(maturityMonths * 0.6) && costs.potassiumFertilizer && i < maturityMonths - 1) {
      monthCosts += (costs.potassiumFertilizerCost || 0) * farmSize;
      costBreakdownMonth.fertilizer += (costs.potassiumFertilizerCost || 0) * farmSize;
      activities.push('Potassium application');

      fertilizerApplications.push({
        type: 'potassium',
        product: costs.potassiumFertilizer.brand,
        amountKg: costs.potassiumFertilizer.amountKg,
        nutrients: costs.potassiumFertilizer.nutrients
      });

    } else {
      monthCosts += (costs.weedingCost || 0) * farmSize * 0.3;
      costBreakdownMonth.labour += (costs.weedingCost || 0) * farmSize * 0.3;
      activities.push('Routine maintenance');
    }

    monthCosts += otherCostsTotal / maturityMonths;
    costBreakdownMonth.miscellaneous += otherCostsTotal / maturityMonths;

    const monthRevenue = (i === maturityMonths - 1) ? totalRevenue : 0;

    const netCash = monthRevenue - monthCosts;
    cumulativeCash += netCash;

    if (cumulativeCash < peakDeficit) {
      peakDeficit = cumulativeCash;
    }

    months.push({
      month: monthNum,
      monthName,
      activities,
      costs: Math.round(monthCosts),
      revenue: Math.round(monthRevenue),
      netCash: Math.round(netCash),
      cumulativeCash: Math.round(cumulativeCash),
      costBreakdown: {
        seed: Math.round(costBreakdownMonth.seed),
        fertilizer: Math.round(costBreakdownMonth.fertilizer),
        labour: Math.round(costBreakdownMonth.labour),
        transport: Math.round(costBreakdownMonth.transport),
        packaging: Math.round(costBreakdownMonth.packaging),
        miscellaneous: Math.round(costBreakdownMonth.miscellaneous)
      },
      fertilizerApplications: fertilizerApplications.length > 0 ? fertilizerApplications : undefined
    });
  }

  const loanNeeded = Math.abs(peakDeficit);
  const repaymentCapacity = totalRevenue - (totalCosts - loanNeeded);
  const breakevenYield = totalCosts / (yield.pricePerKg || 1) / farmSize;

  const roundedNutrients = {
    n: Math.round(totalNutrients.n * 10) / 10,
    p: Math.round(totalNutrients.p * 10) / 10,
    k: Math.round(totalNutrients.k * 10) / 10,
    s: totalNutrients.s ? Math.round(totalNutrients.s * 10) / 10 : undefined,
    ca: totalNutrients.ca ? Math.round(totalNutrients.ca * 10) / 10 : undefined,
    mg: totalNutrients.mg ? Math.round(totalNutrients.mg * 10) / 10 : undefined,
    zn: totalNutrients.zn ? Math.round(totalNutrients.zn * 10) / 10 : undefined,
    b: totalNutrients.b ? Math.round(totalNutrients.b * 10) / 10 : undefined
  };

  return {
    crop,
    country,
    region,
    farmSize,
    plantingDate,
    harvestDate,
    maturityMonths,
    months,
    totalCosts: Math.round(totalCosts),
    totalRevenue: Math.round(totalRevenue),
    netProfit: Math.round(netProfit),
    roi: Math.round(roi * 10) / 10,
    peakDeficit: Math.round(peakDeficit),
    loanNeeded: Math.round(loanNeeded),
    repaymentCapacity: Math.round(repaymentCapacity),
    breakevenYield: Math.round(breakevenYield * 10) / 10,
    costBreakdown: {
      seed: Math.round(plantingMaterialTotal),
      fertilizer: Math.round(fertilizerCost),
      labour: Math.round(labourCost),
      transport: Math.round(transportCostValue),
      packaging: Math.round(packagingCostValue),
      miscellaneous: Math.round(miscellaneousCostValue)
    },
    totalNutrients: roundedNutrients,
    plantsDamaged
  };
}