// lib/utils/profitCalculation.ts

import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";

// ----- Helpers -----
function getCurrency(country: string = 'kenya') {
  const normalized = country.toLowerCase();
  return COUNTRY_CURRENCY_MAP[normalized] || COUNTRY_CURRENCY_MAP.kenya;
}

function formatCurrency(amount: number, country: string = 'kenya'): string {
  const currency = getCurrency(country);
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount);
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

// ----- Input Interface -----
export interface ProfitInputs {
  cropName: string;
  country?: string; // defaults to 'kenya'

  // Revenue
  actualYieldKg: number;
  pricePerKg: number;

  // Planting material (or seed)
  plantingMaterialCost?: number;
  seedCost?: number; // fallback if plantingMaterialCost not provided

  // Fertilizers
  plantingFertilizerCost?: number; // per 50kg bag
  plantingFertilizerQuantity?: number; // total kg used
  topdressingFertilizerCost?: number;
  topdressingFertilizerQuantity?: number;
  potassiumFertilizerCost?: number;
  potassiumFertilizerQuantity?: number;

  // Lime
  calciticLimePricePerBag?: number;
  recCalciticLime?: number; // total kg
  dolomiticLimePricePerBag?: number;
  recDolomiticLime?: number; // total kg

  // Labour
  ploughingCost?: number;
  plantingLabourCost?: number;
  weedingCost?: number;
  harvestingCost?: number;

  // Logistics & Packaging
  transportCostTotal?: number;
  packagingCostTotal?: number;

  // Other (agrochemicals, irrigation, etc.)
  miscellaneousCostTotal?: number;
}

// ----- Output Interface -----
export interface ProfitOutput {
  revenue: number;
  totalCosts: number;
  grossMargin: number;
  roi: number;
  breakdown: {
    revenue: number;
    inputs: number; // planting material
    fertilizers: number; // planting + topdressing + potassium
    lime: number; // calcitic + dolomitic
    labour: number; // all labour combined
    logistics: number; // transport + packaging
    other: number; // miscellaneous
  };
  summaryText: string; // Fully formatted text for the UI
}

// ----- Main Function -----
export function calculateAndFormatProfit(inputs: ProfitInputs): ProfitOutput {
  const country = inputs.country || 'kenya';
  const symbol = getCurrency(country).symbol;

  // ---- 1. REVENUE ----
  const yieldKg = inputs.actualYieldKg || 0;
  const price = inputs.pricePerKg || 0;
  const revenue = yieldKg * price;

  // ---- 2. INPUTS (Planting Material / Seed) ----
  const plantingMaterial = inputs.plantingMaterialCost || inputs.seedCost || 0;

  // ---- 3. FERTILIZERS ----
  // Planting
  const pfQty = inputs.plantingFertilizerQuantity || 0;
  const pfCost = inputs.plantingFertilizerCost || 0;
  const plantingFertCost = pfQty > 0 ? (pfQty / 50) * pfCost : 0;

  // Topdressing
  const tfQty = inputs.topdressingFertilizerQuantity || 0;
  const tfCost = inputs.topdressingFertilizerCost || 0;
  const topdressingFertCost = tfQty > 0 ? (tfQty / 50) * tfCost : 0;

  // Potassium
  const kfQty = inputs.potassiumFertilizerQuantity || 0;
  const kfCost = inputs.potassiumFertilizerCost || 0;
  const potassiumFertCost = kfQty > 0 ? (kfQty / 50) * kfCost : 0;

  const totalFertilizerCost = plantingFertCost + topdressingFertCost + potassiumFertCost;

  // ---- 4. LIME ----
  const calciticQty = inputs.recCalciticLime || 0;
  const calciticPrice = inputs.calciticLimePricePerBag || 0;
  const calciticCost = calciticQty > 0 ? (calciticQty / 50) * calciticPrice : 0;

  const dolomiticQty = inputs.recDolomiticLime || 0;
  const dolomiticPrice = inputs.dolomiticLimePricePerBag || 0;
  const dolomiticCost = dolomiticQty > 0 ? (dolomiticQty / 50) * dolomiticPrice : 0;

  const totalLimeCost = calciticCost + dolomiticCost;

  // ---- 5. LABOUR ----
  const labour =
    (inputs.ploughingCost || 0) +
    (inputs.plantingLabourCost || 0) +
    (inputs.weedingCost || 0) +
    (inputs.harvestingCost || 0);

  // ---- 6. LOGISTICS ----
  const logistics =
    (inputs.transportCostTotal || 0) +
    (inputs.packagingCostTotal || 0);

  // ---- 7. OTHER (Agrochemicals, irrigation, etc.) ----
  const other = inputs.miscellaneousCostTotal || 0;

  // ---- 8. TOTAL COSTS & PROFIT ----
  const totalCosts =
    plantingMaterial +
    totalFertilizerCost +
    totalLimeCost +
    labour +
    logistics +
    other;

  const grossMargin = revenue - totalCosts;
  const roi = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0;

  // ---- 9. BUILD SUMMARY TEXT ----
  const summaryText = `
🌾 **${inputs.cropName || 'Crop'} – Profit Summary (per acre)**

📊 **Revenue**
• Yield: ${formatNumber(yieldKg)} kg
• Price: ${formatCurrency(price, country)}
• Total Revenue: **${formatCurrency(revenue, country)}**

💸 **Costs**
**Inputs**
• Planting material: ${formatCurrency(plantingMaterial, country)}

**Fertilizers**
• Planting: ${formatCurrency(plantingFertCost, country)}
• Topdressing: ${formatCurrency(topdressingFertCost, country)}
• Potassium: ${formatCurrency(potassiumFertCost, country)}
• **Total Fertilizers: ${formatCurrency(totalFertilizerCost, country)}**

**Lime**
• Calcitic: ${formatCurrency(calciticCost, country)}
• Dolomitic: ${formatCurrency(dolomiticCost, country)}
• **Total Lime: ${formatCurrency(totalLimeCost, country)}**

**Labour & Operations**
• Ploughing: ${formatCurrency(inputs.ploughingCost || 0, country)}
• Planting: ${formatCurrency(inputs.plantingLabourCost || 0, country)}
• Weeding: ${formatCurrency(inputs.weedingCost || 0, country)}
• Harvesting: ${formatCurrency(inputs.harvestingCost || 0, country)}
• **Total Labour: ${formatCurrency(labour, country)}**

**Logistics & Other**
• Transport: ${formatCurrency(inputs.transportCostTotal || 0, country)}
• Packaging: ${formatCurrency(inputs.packagingCostTotal || 0, country)}
• Agrochemicals/Other: ${formatCurrency(other, country)}

• **Total Costs: ${formatCurrency(totalCosts, country)}**

💰 **Profit**
• Gross Margin = ${formatCurrency(revenue, country)} – ${formatCurrency(totalCosts, country)} = **${formatCurrency(grossMargin, country)}**
• ROI = (${formatNumber(grossMargin)} / ${formatNumber(totalCosts)}) × 100 = **${roi.toFixed(0)}%**

📈 **Business Insight**:
${grossMargin > 0
  ? `Your ${inputs.cropName} enterprise is generating a ${formatCurrency(grossMargin, country)} profit. Keep optimizing your inputs to maximize returns!`
  : `Your ${inputs.cropName} enterprise is currently making a loss. Review your costs and yield to improve profitability.`}
  `.trim();

  // ---- 10. RETURN ----
  return {
    revenue,
    totalCosts,
    grossMargin,
    roi,
    breakdown: {
      revenue,
      inputs: plantingMaterial,
      fertilizers: totalFertilizerCost,
      lime: totalLimeCost,
      labour,
      logistics,
      other,
    },
    summaryText,
  };
}