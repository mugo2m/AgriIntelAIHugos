// lib/utils/poultryProfitCalculation.ts

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
export interface PoultryProfitInputs {
  // Core
  country?: string; // defaults to 'kenya'
  enterpriseName?: string; // e.g., "Broiler", "Layer"

  // Layer / Eggs
  eggProductionPerDay?: number; // eggs per day
  eggPricePerTray?: number; // price per tray (30 eggs)
  eggCostPerTray?: number; // cost per tray

  // Meat
  birdsSold?: number; // number of birds sold for meat
  meatWeightKg?: number; // average weight per bird (kg)
  meatPricePerKg?: number;
  meatCostPerKg?: number;

  // Stock
  dayOldChicksCost?: number; // cost per chick
  birdPurchaseCount?: number; // number of birds bought

  // Feed
  feedCostPerKg?: number;
  feedKgPerBird?: number; // total feed per bird over production cycle
  // Or monthly feed: feedKgPerDay, daysInMonth

  // Health
  vaccinationCostPerBird?: number;
  medicationCostPerBird?: number;

  // Labour, utilities, transport
  labourCostTotal?: number; // monthly or per cycle
  utilitiesCostTotal?: number;
  transportCostTotal?: number;
  miscellaneousCostTotal?: number;

  // Optional: cycle duration (days), number of birds, etc.
  cycleDurationDays?: number; // for broilers (e.g., 42 days) or layers (e.g., 365 days)
  numberOfBirds?: number;
}

// ----- Output Interface -----
export interface PoultryProfitOutput {
  revenue: number;
  totalCosts: number;
  grossMargin: number;
  roi: number;
  breakdown: {
    revenue: number;
    chickCost: number;
    feedCost: number;
    healthCost: number;
    labour: number;
    utilities: number;
    transport: number;
    other: number;
  };
  summaryText: string;
}

// ----- Main Function -----
export function calculateAndFormatPoultryProfit(inputs: PoultryProfitInputs): PoultryProfitOutput {
  const country = inputs.country || 'kenya';
  const symbol = getCurrency(country).symbol;

  // ---- 1. REVENUE ----
  const eggRevenue = (inputs.eggProductionPerDay || 0) * (inputs.eggPricePerTray || 0) / 30; // assuming 30 eggs per tray
  const meatRevenue = (inputs.birdsSold || 0) * (inputs.meatWeightKg || 0) * (inputs.meatPricePerKg || 0);
  const revenue = eggRevenue + meatRevenue;

  // ---- 2. COSTS ----
  const chickCost = (inputs.dayOldChicksCost || 0) * (inputs.birdPurchaseCount || 0);
  const feedCost = (inputs.feedCostPerKg || 0) * (inputs.feedKgPerBird || 0) * (inputs.numberOfBirds || 0);
  const healthCost = ((inputs.vaccinationCostPerBird || 0) + (inputs.medicationCostPerBird || 0)) * (inputs.numberOfBirds || 0);
  const labour = inputs.labourCostTotal || 0;
  const utilities = inputs.utilitiesCostTotal || 0;
  const transport = inputs.transportCostTotal || 0;
  const other = inputs.miscellaneousCostTotal || 0;

  const totalCosts = chickCost + feedCost + healthCost + labour + utilities + transport + other;

  // ---- 3. PROFIT ----
  const grossMargin = revenue - totalCosts;
  const roi = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0;

  // ---- 4. SUMMARY TEXT ----
  const summaryText = `
🐔 **Poultry Profit Summary**${inputs.enterpriseName ? ` – ${inputs.enterpriseName}` : ''}

📊 **Revenue**
${inputs.eggProductionPerDay ? `• Eggs: ${formatNumber(inputs.eggProductionPerDay)} eggs/day → ${formatCurrency(eggRevenue, country)}` : ''}
${inputs.birdsSold ? `• Meat: ${formatNumber(inputs.birdsSold)} birds × ${inputs.meatWeightKg} kg × ${formatCurrency(inputs.meatPricePerKg || 0, country)} = ${formatCurrency(meatRevenue, country)}` : ''}
• **Total Revenue: ${formatCurrency(revenue, country)}**

💸 **Costs**
• Day‑old chicks: ${formatCurrency(chickCost, country)}
• Feed: ${formatCurrency(feedCost, country)}
• Health (vaccines + meds): ${formatCurrency(healthCost, country)}
• Labour: ${formatCurrency(labour, country)}
• Utilities: ${formatCurrency(utilities, country)}
• Transport: ${formatCurrency(transport, country)}
• Other: ${formatCurrency(other, country)}
• **Total Costs: ${formatCurrency(totalCosts, country)}**

💰 **Profit**
• Gross Margin = ${formatCurrency(revenue, country)} – ${formatCurrency(totalCosts, country)} = **${formatCurrency(grossMargin, country)}**
• ROI = ${roi.toFixed(0)}%

📈 **Business Insight**
${grossMargin > 0
  ? `Your poultry enterprise is generating a profit of ${formatCurrency(grossMargin, country)}. Focus on feed efficiency and health management to maximise returns!`
  : `Your poultry enterprise is currently making a loss. Review your feed costs, mortality rates, and pricing to improve profitability.`}
  `.trim();

  return {
    revenue,
    totalCosts,
    grossMargin,
    roi,
    breakdown: {
      revenue,
      chickCost,
      feedCost,
      healthCost,
      labour,
      utilities,
      transport,
      other,
    },
    summaryText,
  };
}