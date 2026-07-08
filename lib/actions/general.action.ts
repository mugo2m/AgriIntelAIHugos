// lib/actions/general.action.ts
"use server";

import { db } from "@/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { hybridSearch } from "@/lib/rag/hybridSearch";
import { CacheManager } from "@/lib/rag/cacheManager";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { FieldValue } from "firebase-admin/firestore";
import { soilTestInterpreter } from "@/lib/soilTestInterpreter";
import { fertilizerCalculator } from "@/lib/fertilizerCalculator";
import { calculateRankedCropProfits } from "@/lib/utils/cropCalculations";
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";

let genAI: GoogleGenerativeAI | null = null;
try {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }
} catch (error) {
  console.log("⚠️ Gemini AI initialization skipped");
}

function cleanGeminiJson(text: string) {
  if (!text) return "{}";
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

// 🌾 Build Q&A history from farmer session with financial context
function buildFarmerQaHistory(messages: any[]) {
  const pairs: { question: string; answer: string; isFinancial?: boolean; isSoilTest?: boolean; isDamage?: boolean }[] = [];

  if (Array.isArray(messages)) {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i]?.role === "user" && messages[i + 1]?.role === "assistant") {
        const question = messages[i].content;
        const isFinancial =
          question.toLowerCase().includes('cost') ||
          question.toLowerCase().includes('price') ||
          question.toLowerCase().includes('profit') ||
          question.toLowerCase().includes('margin');

        const isSoilTest =
          question.toLowerCase().includes('soil') ||
          question.toLowerCase().includes('fertilizer') ||
          question.toLowerCase().includes('ph') ||
          question.toLowerCase().includes('nutrient');

        const isDamage =
          question.toLowerCase().includes('damaged') ||
          question.toLowerCase().includes('plants lost') ||
          question.toLowerCase().includes('beyond recovery');

        pairs.push({
          question: question,
          answer: messages[i + 1].content,
          isFinancial,
          isSoilTest,
          isDamage
        });
        i++;
      }
    }
  }

  console.log(`🌾 Built ${pairs.length} Q&A pairs from farmer session (${pairs.filter(p => p.isFinancial).length} financial, ${pairs.filter(p => p.isSoilTest).length} soil test, ${pairs.filter(p => p.isDamage).length} damage reports)`);
  return pairs;
}

// 🌾 Format currency helper - Uses the country from session data
function formatCurrencyForCountry(amount: number, country: string = 'kenya'): string {
  const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);
}

// 🌾 Format currency for speech
function formatCurrencyForSpeech(amount: number, country: string = 'kenya'): string {
  const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
  return `${currency.name} ${amount.toLocaleString()}`;
}

// ========== CROP DEFAULTS FOR ALL 219 CROPS ==========
// Default yields (kg per acre) – same as in recommendationEngine.ts
const defaultYields: Record<string, number> = {
  // Cereals & grains
  maize: 2000, rice: 3000, wheat: 2000, barley: 2000, sorghum: 1500, millet: 1200,
  "finger millet": 1200, teff: 1000, triticale: 2000, oats: 1500, buckwheat: 1000,
  quinoa: 1200, fonio: 800, spelt: 1500, kamut: 1500, "amaranth grain": 800,
  // Pulses & legumes
  beans: 1200, cowpeas: 800, "green grams": 800, groundnuts: 1000, "soya beans": 1000,
  pigeonpeas: 1000, bambaranuts: 800, chickpea: 800, lentil: 800, "faba bean": 1000,
  peanut: 1000, alfalfa: 8000, lucerne: 8000, clover: 5000, "white clover": 5000,
  vetch: 2000, mucuna: 2000, desmodium: 5000, dolichos: 2000, canavalia: 2000,
  "sunn hemp": 2000, "crotalaria paulina": 2000,
  // Root & tuber crops
  cassava: 8000, "sweet potatoes": 7000, "irish potatoes": 10000, yams: 12000, taro: 10000,
  ginger: 8000, turmeric: 6000, horseradish: 5000, parsnip: 8000, turnip: 8000, rutabaga: 8000,
  // Vegetables
  tomatoes: 15000, onions: 8000, carrots: 10000, cabbages: 12000, kales: 8000,
  capsicums: 8000, chillies: 6000, brinjals: 10000, "french beans": 5000, "garden peas": 4000,
  spinach: 8000, okra: 7000, lettuce: 8000, broccoli: 6000, cauliflower: 6000,
  celery: 8000, leeks: 8000, beetroot: 8000, radish: 8000, pumpkin: 10000,
  courgettes: 8000, cucumbers: 10000, "pumpkin leaves": 8000, "sweet potato leaves": 8000,
  "ethiopian kale": 8000, "jute mallow": 6000, "spider plant": 6000, "african nightshade": 5000,
  amaranth: 4000, arugula: 5000, asparagus: 3000, artichoke: 5000, rhubarb: 8000,
  wasabi: 5000, "bok choy": 8000, "collard greens": 8000, "mustard greens": 6000,
  "swiss chard": 8000, radicchio: 6000, escarole: 6000, frisee: 6000, "turnip greens": 6000,
  // Fruits
  bananas: 6000, mangoes: 8000, avocados: 2000, oranges: 10000, pineapples: 20000,
  watermelons: 15000, pawpaws: 10000, "passion fruit": 8000, grapefruit: 10000, lemons: 10000,
  limes: 8000, guava: 8000, jackfruit: 5000, breadfruit: 5000, pomegranate: 6000,
  "star fruit": 8000, coconut: 3000, cashew: 2000, macadamia: 4000, fig: 6000,
  "date palm": 5000, mulberry: 4000, lychee: 5000, persimmon: 6000, gooseberry: 4000,
  currant: 3000, elderberry: 3000, rambutan: 5000, durian: 8000, mangosteen: 4000,
  longan: 5000, marula: 4000,
  // Cash crops
  coffee: 2000, tea: 2500, cocoa: 800, cotton: 2000, sunflower: 1500, simsim: 500,
  sugarcane: 40000, tobacco: 2000, sisal: 5000, pyrethrum: 1000, "oil palm": 8000,
  rubber: 500,
  // Herbs & spices
  vanilla: 1000, "black pepper": 2000, cardamom: 1000, cinnamon: 2000, cloves: 1000,
  coriander: 1000, basil: 2000, mint: 2000, rosemary: 2000, thyme: 2000, oregano: 2000,
  sage: 2000, dill: 1000, fennel: 2000, lavender: 1000, chamomile: 1000, echinacea: 1000,
  ginseng: 1000, goldenseal: 1000, "stinging nettle": 5000, moringa: 5000, stevia: 1000,
  fenugreek: 800, cumin: 500, caraway: 500, anise: 500, lovage: 2000, marjoram: 2000,
  tarragon: 2000, sorrel: 2000, chervil: 2000, savory: 2000, calendula: 1000, nasturtium: 2000,
  borage: 2000, "st. john's wort": 1000, valerian: 1000,
  // Forage grasses
  brachiaria: 10000, "buffel grass": 6000, "guinea grass": 8000, "italian ryegrass": 8000,
  "napier grass": 20000, "napier hybrid": 25000, "orchard grass": 8000, "rhodes grass": 8000,
  "timothy grass": 8000, "forage sorghum": 15000, leucaena: 8000, calliandra: 8000,
  sesbania: 8000, cenchrus: 6000,
  // Other
  bamboo: 5000, "aloe vera": 10000, "oyster nut": 2000, watercress: 5000, ramie: 3000,
  flax: 1000, hemp: 2000, jute: 2000, kenaf: 2000, "slender leaf": 4000
};

// Default prices (per kg) – same as in recommendationEngine.ts
const defaultPrices: Record<string, number> = {
  // Cereals & grains
  maize: 40, rice: 60, wheat: 45, barley: 40, sorghum: 45, millet: 50,
  "finger millet": 50, teff: 60, triticale: 45, oats: 35, buckwheat: 50,
  quinoa: 80, fonio: 60, spelt: 55, kamut: 60, "amaranth grain": 50,
  // Pulses & legumes
  beans: 80, cowpeas: 70, "green grams": 70, groundnuts: 120, "soya beans": 60,
  pigeonpeas: 70, bambaranuts: 80, chickpea: 80, lentil: 70, "faba bean": 60,
  peanut: 120, alfalfa: 10, lucerne: 10, clover: 10, "white clover": 10,
  vetch: 30, mucuna: 30, desmodium: 30, dolichos: 40, canavalia: 30,
  "sunn hemp": 30, "crotalaria paulina": 30,
  // Root & tuber crops
  cassava: 20, "sweet potatoes": 25, "irish potatoes": 30, yams: 50, taro: 40,
  ginger: 80, turmeric: 100, horseradish: 40, parsnip: 30, turnip: 25, rutabaga: 25,
  // Vegetables
  tomatoes: 40, onions: 50, carrots: 40, cabbages: 25, kales: 20,
  capsicums: 50, chillies: 80, brinjals: 40, "french beans": 60, "garden peas": 50,
  spinach: 25, okra: 35, lettuce: 30, broccoli: 50, cauliflower: 40,
  celery: 30, leeks: 40, beetroot: 30, radish: 25, pumpkin: 30,
  courgettes: 40, cucumbers: 30, "pumpkin leaves": 20, "sweet potato leaves": 20,
  "ethiopian kale": 20, "jute mallow": 20, "spider plant": 20, "african nightshade": 30,
  amaranth: 20, arugula: 30, asparagus: 100, artichoke: 80, rhubarb: 50,
  wasabi: 200, "bok choy": 30, "collard greens": 20, "mustard greens": 20,
  "swiss chard": 25, radicchio: 40, escarole: 30, frisee: 30, "turnip greens": 20,
  // Fruits
  bananas: 30, mangoes: 50, avocados: 40, oranges: 40, pineapples: 40,
  watermelons: 30, pawpaws: 30, "passion fruit": 50, grapefruit: 30, lemons: 30,
  limes: 30, guava: 30, jackfruit: 40, breadfruit: 30, pomegranate: 50,
  "star fruit": 40, coconut: 20, cashew: 100, macadamia: 150, fig: 60,
  "date palm": 80, mulberry: 40, lychee: 80, persimmon: 60, gooseberry: 40,
  currant: 50, elderberry: 40, rambutan: 80, durian: 100, mangosteen: 120,
  longan: 70, marula: 50,
  // Cash crops
  coffee: 300, tea: 200, cocoa: 300, cotton: 100, sunflower: 60, simsim: 80,
  sugarcane: 5, tobacco: 200, sisal: 10, pyrethrum: 200, "oil palm": 300,
  rubber: 100,
  // Herbs & spices
  vanilla: 500, "black pepper": 300, cardamom: 200, cinnamon: 200, cloves: 300,
  coriander: 50, basil: 50, mint: 40, rosemary: 60, thyme: 60, oregano: 50,
  sage: 50, dill: 40, fennel: 50, lavender: 100, chamomile: 100, echinacea: 80,
  ginseng: 500, goldenseal: 200, "stinging nettle": 20, moringa: 30, stevia: 100,
  fenugreek: 50, cumin: 80, caraway: 60, anise: 70, lovage: 40, marjoram: 50,
  tarragon: 60, sorrel: 30, chervil: 40, savory: 50, calendula: 40, nasturtium: 30,
  borage: 30, "st. john's wort": 40, valerian: 50,
  // Forage grasses
  brachiaria: 8, "buffel grass": 8, "guinea grass": 8, "italian ryegrass": 8,
  "napier grass": 5, "napier hybrid": 6, "orchard grass": 8, "rhodes grass": 8,
  "timothy grass": 8, "forage sorghum": 6, leucaena: 8, calliandra: 8,
  sesbania: 8, cenchrus: 8,
  // Other
  bamboo: 50, "aloe vera": 10, "oyster nut": 100, watercress: 30, ramie: 20,
  flax: 40, hemp: 50, jute: 30, kenaf: 30, "slender leaf": 20
};

// Helper to get crop category for cost estimation
function getCropCategoryForCosts(crop: string): string {
  const c = crop.toLowerCase();
  const cereals = ["maize", "wheat", "barley", "rice", "sorghum", "millet", "finger millet", "oats", "teff", "triticale", "buckwheat", "quinoa", "fonio", "spelt", "kamut", "amaranth grain"];
  const pulses = ["beans", "soya beans", "cowpeas", "green grams", "groundnuts", "pigeonpeas", "bambaranuts", "chickpea", "lentil", "faba bean", "peanut", "alfalfa", "lucerne", "clover", "white clover", "vetch", "mucuna", "desmodium", "dolichos", "canavalia", "sunn hemp"];
  const tubers = ["cassava", "sweet potatoes", "irish potatoes", "yams", "taro", "ginger", "turmeric", "horseradish", "parsnip", "turnip", "rutabaga"];
  const vegetables = ["tomatoes", "onions", "cabbages", "kales", "carrots", "capsicums", "chillies", "brinjals", "french beans", "garden peas", "spinach", "okra", "lettuce", "broccoli", "cauliflower", "celery", "leeks", "beetroot", "radish", "pumpkin", "courgettes", "cucumbers", "pumpkin leaves", "sweet potato leaves", "jute mallow", "spider plant", "african nightshade", "amaranth", "ethiopian kale", "arugula", "asparagus", "artichoke", "rhubarb", "wasabi", "bok choy", "collard greens", "mustard greens", "swiss chard", "radicchio", "escarole", "frisee", "turnip greens"];
  const fruits = ["bananas", "mangoes", "avocados", "oranges", "pineapples", "watermelons", "pawpaws", "passion fruit", "grapefruit", "lemons", "limes", "guava", "jackfruit", "breadfruit", "pomegranate", "star fruit", "coconut", "fig", "date palm", "mulberry", "lychee", "persimmon", "gooseberry", "currant", "elderberry", "rambutan", "durian", "mangosteen", "longan", "marula"];
  const cash = ["coffee", "tea", "cocoa", "cotton", "sunflower", "simsim", "sugarcane", "tobacco", "sisal", "pyrethrum", "oil palm", "rubber"];
  const forage = ["brachiaria", "buffel grass", "guinea grass", "italian ryegrass", "napier grass", "napier hybrid", "orchard grass", "rhodes grass", "timothy grass", "forage sorghum", "leucaena", "calliandra", "sesbania", "cenchrus"];

  if (cereals.includes(c)) return "cereal";
  if (pulses.includes(c)) return "pulse";
  if (tubers.includes(c)) return "tuber";
  if (vegetables.includes(c)) return "vegetable";
  if (fruits.includes(c)) return "fruit";
  if (cash.includes(c)) return "cash";
  if (forage.includes(c)) return "forage";
  return "other";
}

// Estimate costs based on crop category and input level
function estimateCosts(category: string, level: 'low' | 'medium' | 'high'): { seedCost: number; fertilizerCost: number; labourCost: number; transportCost: number; bagCost: number } {
  const multipliers = { low: 0.5, medium: 1, high: 1.5 };
  const factor = multipliers[level];

  // Base costs for medium input (per acre)
  let baseSeed = 2000, baseFertilizer = 8000, baseLabour = 15000, baseTransport = 2000, baseBagCost = 1000;

  switch (category) {
    case 'cereal':
      baseSeed = 2500; baseFertilizer = 10000; baseLabour = 18000; baseTransport = 2500; baseBagCost = 1500;
      break;
    case 'pulse':
      baseSeed = 3000; baseFertilizer = 5000; baseLabour = 12000; baseTransport = 1500; baseBagCost = 1000;
      break;
    case 'tuber':
      baseSeed = 8000; baseFertilizer = 15000; baseLabour = 20000; baseTransport = 3000; baseBagCost = 2000;
      break;
    case 'vegetable':
      baseSeed = 10000; baseFertilizer = 20000; baseLabour = 25000; baseTransport = 5000; baseBagCost = 3000;
      break;
    case 'fruit':
      baseSeed = 15000; baseFertilizer = 12000; baseLabour = 18000; baseTransport = 4000; baseBagCost = 2000;
      break;
    case 'cash':
      baseSeed = 8000; baseFertilizer = 15000; baseLabour = 20000; baseTransport = 3000; baseBagCost = 2000;
      break;
    case 'forage':
      baseSeed = 2000; baseFertilizer = 8000; baseLabour = 10000; baseTransport = 1000; baseBagCost = 500;
      break;
    default:
      baseSeed = 2000; baseFertilizer = 8000; baseLabour = 15000; baseTransport = 2000; baseBagCost = 1000;
  }

  return {
    seedCost: Math.round(baseSeed * factor),
    fertilizerCost: Math.round(baseFertilizer * factor),
    labourCost: Math.round(baseLabour * factor),
    transportCost: Math.round(baseTransport * factor),
    bagCost: Math.round(baseBagCost * factor)
  };
}

// 🌾 Calculate gross margin based on crop defaults (supports all 219 crops)
function calculateGrossMargin(session: any) {
  if (!session) return null;

  const crop = session.crops?.[0] || 'maize';
  const lowerCrop = crop.toLowerCase();
  const country = session.country || 'kenya';

  // Get default yield and price for this crop
  const yieldKg = defaultYields[lowerCrop] || 2000;
  const pricePerKg = defaultPrices[lowerCrop] || 40;

  const category = getCropCategoryForCosts(lowerCrop);
  const pricePerBag = pricePerKg * 90; // 90kg bag assumed

  const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  const result: any = {};

  for (const level of levels) {
    const costs = estimateCosts(category, level);
    const bags = Math.round(yieldKg / 90);
    const grossOutput = bags * pricePerBag;
    const totalCost = costs.seedCost + costs.fertilizerCost + costs.labourCost + costs.transportCost + costs.bagCost;
    const grossMargin = grossOutput - totalCost;

    result[level] = {
      bags,
      pricePerBag,
      grossOutput,
      seedCost: costs.seedCost,
      fertilizerCost: costs.fertilizerCost,
      labourCost: costs.labourCost,
      transportCost: costs.transportCost,
      bagCost: costs.bagCost,
      totalCost,
      grossMargin,
      costPerBag: Math.round(totalCost / bags)
    };
  }

  return {
    crop,
    low: result.low,
    medium: result.medium,
    high: result.high,
    farmerLevel: session.managementLevel || "Medium input",
    recommendation: getFinancialRecommendation(session.managementLevel, result.low, result.medium, result.high, country)
  };
}

// 🌾 Generate financial recommendation (currency aware)
function getFinancialRecommendation(level: string, low: any, medium: any, high: any, country: string = 'kenya'): string {
  if (level?.toLowerCase().includes('low')) {
    return `Based on your low-input farming, you're currently earning ${formatCurrencyForCountry(low.grossMargin, country)} per hectare. By adopting medium-input practices, you could increase your profit to ${formatCurrencyForCountry(medium.grossMargin, country)}. Remember: Every ${COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh'} 1 invested returns ${COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh'} 3-5 profit!`;
  } else if (level?.toLowerCase().includes('high')) {
    return `Excellent! Your high-input farming is generating ${formatCurrencyForCountry(high.grossMargin, country)} per hectare. You're maximizing your profits!`;
  } else {
    return `At your current medium-input level, you're earning ${formatCurrencyForCountry(medium.grossMargin, country)} per hectare. Upgrading to high-input practices could increase profit to ${formatCurrencyForCountry(high.grossMargin, country)}. Farming is still in exponential phase - more inputs = more profits!`;
  }
}

// 🌾 ENHANCED: Generate farmer session summary
export async function generateFarmerSessionSummary(params: {
  sessionId: string;
  userId: string;
  messages: any[];
}) {
  const { sessionId, userId, messages } = params;

  try {
    const session = await CacheManager.getOrSet(
      `session:${sessionId}`,
      async () => {
        const sessionDoc = await db.collection("farmer_sessions").doc(sessionId).get();
        return sessionDoc.data() || null;
      },
      3600
    );

    if (!session) {
      throw new Error("Session not found");
    }

    const country = session.country || 'kenya';
    const qaPairs = buildFarmerQaHistory(messages);
    const financialPairs = qaPairs.filter(p => p.isFinancial);
    const soilTestPairs = qaPairs.filter(p => p.isSoilTest);
    const damageReports = qaPairs.filter(p => p.isDamage);

    if (qaPairs.length === 0) {
      return {
        success: false,
        error: "No Q&A history found"
      };
    }

    const topics = qaPairs.map(p => p.question).join(' ');
    const relevantKnowledge = await hybridSearch(topics, {
      cropType: session?.crops || [],
      region: session?.county
    });

    const grossMargin = calculateGrossMargin(session);

    // Process soil test data if available
    let soilTestSummary = null;
    if (session.soilTest) {
      const ageStatus = soilTestInterpreter.getTestAgeStatus(session.soilTest.testAge || 0);
      soilTestSummary = {
        ...session.soilTest,
        ageStatus
      };
    }

    let summary = null;
    let source = "fallback";

    if (genAI) {
      try {
        const formattedHistory = qaPairs
          .map((pair, index) => `Q${index + 1}: ${pair.question}\nA${index + 1}: ${pair.answer}\n`)
          .join("");

        const knowledgeContext = relevantKnowledge
          .map(k => k.content)
          .join('\n\n');

        const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

        const financialContext = grossMargin ? `
GROSS MARGIN ANALYSIS:
- Low input: ${formatCurrencyForCountry(grossMargin.low.grossMargin, country)}
- Medium input: ${formatCurrencyForCountry(grossMargin.medium.grossMargin, country)}
- High input: ${formatCurrencyForCountry(grossMargin.high.grossMargin, country)}
- Farmer's current level: ${session.managementLevel || "Medium input"}
` : "";

        const soilContext = soilTestSummary ? `
SOIL TEST SUMMARY:
- Date: ${soilTestSummary.testDate}
- Status: ${soilTestSummary.ageStatus?.message}
- pH: ${soilTestSummary.ph} (${soilTestSummary.phRating})
- Phosphorus: ${soilTestSummary.phosphorus} ppm (${soilTestSummary.phosphorusRating})
- Potassium: ${soilTestSummary.potassium} ppm (${soilTestSummary.potassiumRating})
- Organic Matter: ${soilTestSummary.organicMatter}% (${soilTestSummary.organicMatterRating})
- Planting Nutrients: ${soilTestSummary.plantingNutrients ? JSON.stringify(soilTestSummary.plantingNutrients) : 'Not specified'}
- Topdressing Nutrients: ${soilTestSummary.topdressingNutrients ? JSON.stringify(soilTestSummary.topdressingNutrients) : 'Not specified'}
- Potassium Nutrients: ${soilTestSummary.potassiumNutrients ? JSON.stringify(soilTestSummary.potassiumNutrients) : 'Not specified'}
` : "";

        const damageContext = session.plantsDamaged ? `
DAMAGE REPORT:
- Plants damaged beyond recovery: ${session.plantsDamaged} plants
` : "";

        const prompt = `
You are an agricultural extension officer. Based on this farmer's Q&A session, provide a comprehensive summary.

FARMER DETAILS:
- Name: ${session.farmerName || "Not specified"}
- Crops: ${session?.crops?.join(", ") || "Not specified"}
- Location: ${session?.county || "Not specified"}
- Farm size: ${session?.cultivatedAcres || session?.acres || "Not specified"} acres
- Management level: ${session?.managementLevel || "Not specified"}

${soilContext}
${damageContext}
${financialContext}

SESSION HISTORY (${qaPairs.length} questions):
${formattedHistory}

RETRIEVED KNOWLEDGE:
${knowledgeContext || "No specific knowledge retrieved."}

INSTRUCTIONS:
1. Summarize what the farmer learned in 3-4 sentences
2. Provide 3 follow-up recommendations
3. Include financial advice based on their questions
4. If soil test data exists, highlight key findings
5. If damage reports exist, acknowledge them and provide recovery advice
6. Emphasize farming as a BUSINESS - every input should maximize profit

Return as JSON:
{
  "summary": "string",
  "recommendations": ["string", "string", "string"],
  "financialAdvice": "string",
  "soilTestAdvice": "string",
  "damageAdvice": "string",
  "topics": ["string"],
  "nextSteps": "string"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = cleanGeminiJson(response?.text());

        try {
          summary = JSON.parse(text);
          source = "gemini-rag";
        } catch (parseError) {
          console.error("❌ Failed to parse Gemini response:", parseError);
        }
      } catch (geminiError) {
        console.log("⚠️ Gemini failed, using fallback summary");
      }
    }

    if (!summary) {
      summary = {
        summary: `You asked ${qaPairs.length} questions about your farm. Based on agronomic guidelines, focus on optimizing your inputs for maximum profit.`,
        recommendations: [
          `Learn more about pest management for your crops using integrated methods`,
          `Ask about optimal planting times for your location`,
          `Explore soil testing options in your area for precision fertilizer recommendations`
        ],
        financialAdvice: grossMargin?.recommendation || "Track all input costs (seeds, fertilizer, labour) to calculate your actual profit margins. Farming is a BUSINESS!",
        soilTestAdvice: soilTestSummary ? `Your soil test from ${soilTestSummary.testDate} shows ${soilTestSummary.phRating} pH and ${soilTestSummary.phosphorusRating} phosphorus.` : "Consider doing a soil test for precise fertilizer recommendations - it can save you up to 30% on fertilizer costs!",
        damageAdvice: session.plantsDamaged ? `You reported ${session.plantsDamaged} plants damaged beyond recovery. Consider reviewing your pest and disease management strategies.` : "",
        topics: session?.crops || ["general farming"],
        nextSteps: "Continue asking questions about your specific crops to maximize profitability."
      };
    }

    const summaryRef = db.collection("farmer_sessions").doc(sessionId).collection("summaries").doc();
    await summaryRef.set({
      id: summaryRef.id,
      sessionId,
      userId,
      summary: summary.summary,
      recommendations: summary.recommendations,
      financialAdvice: summary.financialAdvice || null,
      soilTestAdvice: summary.soilTestAdvice || null,
      damageAdvice: summary.damageAdvice || null,
      topics: summary.topics,
      nextSteps: summary.nextSteps,
      questionCount: qaPairs.length,
      financialQuestionCount: financialPairs.length,
      soilTestQuestionCount: soilTestPairs.length,
      damageReportCount: damageReports.length,
      createdAt: new Date().toISOString(),
      source
    });

    return {
      success: true,
      summaryId: summaryRef.id,
      ...summary
    };

  } catch (error: any) {
    console.error("❌ Error generating farmer summary:", error);
    return { success: false, error: error.message };
  }
}

// 🌾 UPDATED: Get farmer session by ID with language support
export async function getFarmerSessionById(id: string, language: string = 'en'): Promise<any> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    console.error("Invalid session ID provided:", id);
    return null;
  }

  try {
    const session = await CacheManager.getOrSet(
      `session:${id}:lang:${language}`,
      async () => {
        const sessionDoc = await db.collection("farmer_sessions").doc(id).get();
        const data = sessionDoc.data();

        // ✅ Only add Bungoma defaults if grossMarginAnalysis is missing AND it's an old session
        if (data && !data.grossMarginAnalysis && data.crops && data.crops.length > 0) {
          console.log("📊 Adding default gross margin for old session (no real data)");
          data.grossMarginAnalysis = calculateGrossMargin(data);
        } else if (data && data.grossMarginAnalysis) {
          console.log("✅ Using existing gross margin data from farmer's actual inputs");
        }

        // Add language to the session data for use in the frontend
        if (data) {
          data.language = language;
        }

        return data || null;
      },
      3600
    );

    return session;
  } catch (error) {
    console.error("Error fetching farmer session:", error);
    return null;
  }
}

// 🌾 ENHANCED: Get farmer sessions by user ID - Handles both string and timestamp dates
export async function getFarmerSessionsByUserId(userId: string): Promise<any[]> {
  if (!userId) {
    console.log("No userId provided, returning empty array");
    return [];
  }

  console.log(`🔍 [DEBUG] Fetching sessions for userId: ${userId}`);

  try {
    // First, get all sessions without orderBy to see what's in the database
    const sessionsWithoutOrder = await db
      .collection("farmer_sessions")
      .where("userId", "==", userId)
      .get();

    console.log(`🔍 [DEBUG] Total sessions found in DB: ${sessionsWithoutOrder.size}`);

    // Log all sessions found
    sessionsWithoutOrder.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`🔍 [DEBUG] Session ${index + 1}:`, {
        id: doc.id,
        crops: data.crops,
        farmerName: data.farmerName,
        createdAt: data.createdAt,
        createdAtType: typeof data.createdAt,
        userId: data.userId
      });
    });

    // Convert all sessions to array and sort manually to handle mixed date types
    let allSessions = sessionsWithoutOrder.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Manual sorting to handle both string and timestamp dates
    allSessions.sort((a, b) => {
      let dateA: Date;
      let dateB: Date;

      // Convert a.createdAt to Date
      if (a.createdAt) {
        if (a.createdAt.toDate && typeof a.createdAt.toDate === 'function') {
          // Firestore Timestamp
          dateA = a.createdAt.toDate();
        } else if (typeof a.createdAt === 'string') {
          // String date
          dateA = new Date(a.createdAt);
        } else {
          dateA = new Date(0); // fallback
        }
      } else {
        dateA = new Date(0);
      }

      // Convert b.createdAt to Date
      if (b.createdAt) {
        if (b.createdAt.toDate && typeof b.createdAt.toDate === 'function') {
          dateB = b.createdAt.toDate();
        } else if (typeof b.createdAt === 'string') {
          dateB = new Date(b.createdAt);
        } else {
          dateB = new Date(0);
        }
      } else {
        dateB = new Date(0);
      }

      return dateB.getTime() - dateA.getTime(); // descending order
    });

    console.log(`🔍 [DEBUG] After manual sort: ${allSessions.length} sessions`);
    allSessions.forEach((session, index) => {
      console.log(`🔍 [DEBUG] Sorted session ${index + 1}:`, {
        id: session.id,
        crops: session.crops,
        farmerName: session.farmerName,
        createdAt: session.createdAt
      });
    });

    // Cache the sorted results
    return await CacheManager.getOrSet(
      `user-sessions:${userId}`,
      async () => {
        console.log(`🔍 [DEBUG] Cache miss - returning ${allSessions.length} sessions`);
        return allSessions;
      },
      1800
    );
  } catch (error) {
    console.error("Error fetching farmer sessions:", error);
    return [];
  }
}

// 🌾 ENHANCED: Get session summary
export async function getSessionSummary(params: {
  sessionId: string;
  userId: string;
}): Promise<any> {
  const { sessionId, userId } = params;

  if (!userId || !sessionId) {
    return null;
  }

  try {
    return await CacheManager.getOrSet(
      `summary:${sessionId}`,
      async () => {
        const summaries = await db
          .collection("farmer_sessions")
          .doc(sessionId)
          .collection("summaries")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (summaries.empty) return null;

        const summaryDoc = summaries.docs[0];
        return { id: summaryDoc.id, ...summaryDoc.data() };
      },
      86400
    );
  } catch (error) {
    console.error("Error fetching session summary:", error);
    return null;
  }
}

// 🌾 ENHANCED: Save farmer query
export async function saveFarmerQuery(params: {
  sessionId: string;
  userId: string;
  question: string;
  answer: string;
  images?: any[];
  ragUsed?: boolean;
  chunksUsed?: number;
  isFinancial?: boolean;
  isSoilTest?: boolean;
  isDamage?: boolean;
}) {
  const { sessionId, userId, question, answer, images, ragUsed, chunksUsed, isFinancial, isSoilTest, isDamage } = params;

  try {
    const queryRef = db.collection("farmer_sessions").doc(sessionId).collection("queries").doc();

    await queryRef.set({
      id: queryRef.id,
      sessionId,
      userId,
      question,
      answer,
      images: images || [],
      ragUsed: ragUsed || false,
      chunksUsed: chunksUsed || 0,
      isFinancial: isFinancial || false,
      isSoilTest: isSoilTest || false,
      isDamage: isDamage || false,
      timestamp: new Date().toISOString()
    });

    await db.collection("farmer_sessions").doc(sessionId).update({
      queryCount: FieldValue.increment(1),
      financialQueryCount: isFinancial ? FieldValue.increment(1) : FieldValue.increment(0),
      soilTestQueryCount: isSoilTest ? FieldValue.increment(1) : FieldValue.increment(0),
      damageReportCount: isDamage ? FieldValue.increment(1) : FieldValue.increment(0),
      lastQueryAt: new Date().toISOString()
    });

    await CacheManager.invalidate(`session:${sessionId}`);

    return { success: true, queryId: queryRef.id };
  } catch (error) {
    console.error("Error saving farmer query:", error);
    return { success: false, error };
  }
}

// 🌾 Get fertilizer recommendations from soil test
export async function getFertilizerRecommendations(params: {
  sessionId: string;
  userId: string;
}) {
  try {
    const session = await getFarmerSessionById(params.sessionId);
    if (!session || !session.soilTest) {
      return { success: false, error: "No soil test data found" };
    }

    return {
      success: true,
      soilTest: session.soilTest,
      fertilizerRecommendations: session.soilTest.fertilizerRecommendations
    };
  } catch (error: any) {
    console.error("Error getting fertilizer recommendations:", error);
    return { success: false, error: error.message };
  }
}

// Keep existing functions for backward compatibility
export async function getInterviewById(id: string): Promise<any> {
  console.warn("⚠️ getInterviewById is deprecated. Use getFarmerSessionById instead.");
  if (!id) return null;
  try {
    const interview = await db.collection("interviews").doc(id).get();
    return interview.data() || null;
  } catch (error) {
    return null;
  }
}

export async function getInterviewsByUserId(userId: string): Promise<any[]> {
  console.warn("⚠️ getInterviewsByUserId is deprecated. Use getFarmerSessionsByUserId instead.");
  if (!userId) return [];
  try {
    const interviews = await db.collection("interviews").where("userId", "==", userId).orderBy("createdAt", "desc").get();
    return interviews.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    return [];
  }
}

export async function getFeedbackByInterviewId(params: {
  interviewId: string;
  userId: string;
}): Promise<any> {
  console.log("📝 getFeedbackByInterviewId called (returning null)");
  return null;
}

export async function createFeedback(params: any): Promise<any> {
  return { success: false, error: "Feedback creation is deprecated. Use generateFarmerSessionSummary instead." };
}

export async function getLatestInterviews(params: any): Promise<any[]> {
  return [];
}