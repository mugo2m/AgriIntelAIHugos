// lib/utils/dairyProfitCalculation.ts

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
export interface DairyProfitInputs {
  country?: string;
  enterpriseName?: string; // e.g., "Friesian", "Jersey"

  // Milk
  milkYieldPerCowPerDay?: number; // litres
  numberOfLactatingCows?: number;
  milkPricePerLitre?: number;
  milkCostPerLitre?: number;

  // Other products (yoghurt, ghee, etc.) – optional
  otherProductsRevenue?: number; // total from other products

  // Feed
  feedCostPerCowPerDay?: number;
  concentrateCostPerCowPerDay?: number;
  forageCostPerCowPerDay?: number;

  // Health
  vetCostPerMonth?: number;
  medicineCostPerMonth?: number;

  // Labour, utilities, transport
  labourCostPerMonth?: number;
  utilitiesCostPerMonth?: number;
  transportCostPerMonth?: number;
  miscellaneousCostPerMonth?: number;

  // Breeding
  aiCostPerMonth?: number;
  // optional: other costs
}

// ----- Output Interface -----
export interface DairyProfitOutput {
  revenue: number;
  totalCosts: number;
  grossMargin: number;
  roi: number;
  breakdown: {
    milkRevenue: number;
    otherRevenue: number;
    feedCost: number;
    healthCost: number;
    labour: number;
    utilities: number;
    transport: number;
    breedingCost: number;
    other: number;
  };
  summaryText: string;
}

// ----- Main Function -----
export function calculateAndFormatDairyProfit(inputs: DairyProfitInputs): DairyProfitOutput {
  const country = inputs.country || 'kenya';
  const symbol = getCurrency(country).symbol;

  // ---- 1. REVENUE ----
  const milkRevenue = (inputs.milkYieldPerCowPerDay || 0)
                     * (inputs.numberOfLactatingCows || 0)
                     * 30 // monthly
                     * (inputs.milkPricePerLitre || 0);
  const otherRevenue = inputs.otherProductsRevenue || 0;
  const revenue = milkRevenue + otherRevenue;

  // ---- 2. COSTS ----
  const feedCost = ((inputs.feedCostPerCowPerDay || 0) + (inputs.concentrateCostPerCowPerDay || 0) + (inputs.forageCostPerCowPerDay || 0))
                   * (inputs.numberOfLactatingCows || 0) * 30;

  const healthCost = (inputs.vetCostPerMonth || 0) + (inputs.medicineCostPerMonth || 0);
  const labour = inputs.labourCostPerMonth || 0;
  const utilities = inputs.utilitiesCostPerMonth || 0;
  const transport = inputs.transportCostPerMonth || 0;
  const breedingCost = inputs.aiCostPerMonth || 0;
  const other = inputs.miscellaneousCostPerMonth || 0;

  const totalCosts = feedCost + healthCost + labour + utilities + transport + breedingCost + other;

  // ---- 3. PROFIT ----
  const grossMargin = revenue - totalCosts;
  const roi = totalCosts > 0 ? (grossMargin / totalCosts) * 100 : 0;

  // ---- 4. SUMMARY TEXT ----
  const summaryText = `
🐄 **Dairy Profit Summary**${inputs.enterpriseName ? ` – ${inputs.enterpriseName}` : ''}

📊 **Revenue**
• Milk: ${formatNumber(inputs.numberOfLactatingCows || 0)} cows × ${inputs.milkYieldPerCowPerDay} L/cow/day × 30 days × ${formatCurrency(inputs.milkPricePerLitre || 0, country)} = ${formatCurrency(milkRevenue, country)}
${otherRevenue > 0 ? `• Other products: ${formatCurrency(otherRevenue, country)}` : ''}
• **Total Revenue: ${formatCurrency(revenue, country)}**

💸 **Costs**
• Feed: ${formatCurrency(feedCost, country)}
• Health (vet + meds): ${formatCurrency(healthCost, country)}
• Labour: ${formatCurrency(labour, country)}
• Utilities: ${formatCurrency(utilities, country)}
• Transport: ${formatCurrency(transport, country)}
• Breeding: ${formatCurrency(breedingCost, country)}
• Other: ${formatCurrency(other, country)}
• **Total Costs: ${formatCurrency(totalCosts, country)}**

💰 **Profit**
• Gross Margin = ${formatCurrency(revenue, country)} – ${formatCurrency(totalCosts, country)} = **${formatCurrency(grossMargin, country)}**
• ROI = ${roi.toFixed(0)}%

📈 **Business Insight**
${grossMargin > 0
  ? `Your dairy enterprise is generating a profit of ${formatCurrency(grossMargin, country)}. Focus on feed efficiency and herd health to maximise returns!`
  : `Your dairy enterprise is currently making a loss. Review your feed costs, milk yield, and pricing to improve profitability.`}
  `.trim();

  return {
    revenue,
    totalCosts,
    grossMargin,
    roi,
    breakdown: {
      milkRevenue,
      otherRevenue,
      feedCost,
      healthCost,
      labour,
      utilities,
      transport,
      breedingCost,
      other,
    },
    summaryText,
  };
}