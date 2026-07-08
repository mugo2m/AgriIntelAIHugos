// app/api/vapi/generate/route.ts – FINAL: costs fixed + sentence line breaks (safe null checks)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { soilTestInterpreter } from "@/lib/soilTestInterpreter";
import { fertilizerCalculator } from "@/lib/fertilizerCalculator";
import { generateRecommendations } from "@/lib/recommendationEngine";
import { getSpacingOptions } from "@/lib/data/spacing";
import { getPlantingAdvice, getPlantingAdviceText } from "@/lib/data/plantingDates";
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";

console.log("Farmer Session Generation Route Loaded");

// ========== TIMEOUT UTILITY ==========
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string = "Operation timed out"): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// ========== CACHING ==========
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCacheKey(inputs: any): string {
  const {
    userLanguage,
    primaryCrop,
    hasDoneSoilTest,
    farmSize,
    soilTestPH,
    soilTestP,
    soilTestK,
    actualYieldKg,
    pricePerKg,
    totalCosts,
    country,
    plantsDamaged,
    deficiencySymptoms,
    deficiencyLocation,
    spacing,
    storageMethod,
    wantsNutritionBenefits,
  } = inputs;
  return JSON.stringify({
    lang: userLanguage,
    crop: primaryCrop,
    soilTest: hasDoneSoilTest,
    size: farmSize,
    ph: soilTestPH,
    p: soilTestP,
    k: soilTestK,
    yield: actualYieldKg,
    price: pricePerKg,
    costs: totalCosts,
    country,
    damaged: plantsDamaged,
    defSym: deficiencySymptoms,
    defLoc: deficiencyLocation,
    spacing,
    storage: storageMethod,
    wants: wantsNutritionBenefits,
  });
}

function cleanUserInput(input: string | undefined): string | undefined {
  if (!input) return input;
  return input.split(',')
    .map(item => item.trim())
    .filter(item =>
      item.length > 0 &&
      !item.includes('_') &&
      !item.toLowerCase().includes('underscore') &&
      !/^[A-Z][a-z]+ [A-Z][a-z]+\.?$/.test(item)
    )
    .join(', ');
}

const defaultYieldsKg: Record<string, number> = {
  maize: 2700, rice: 2700, wheat: 2000, barley: 2000, sorghum: 1500, millet: 1200,
  beans: 1200, cowpeas: 800, "green grams": 800, groundnuts: 1000, "soya beans": 1000,
  tomatoes: 15000, onions: 8000, carrots: 10000, cabbages: 12000, kales: 8000,
  brinjals: 10000, capsicums: 8000, chillies: 6000, "french beans": 5000,
  bananas: 6000, mangoes: 8000, avocados: 2000, oranges: 10000, pineapples: 20000,
  cassava: 8000, "sweet potatoes": 7000, "irish potatoes": 10000,
  coffee: 2000, tea: 2500, sugarcane: 40000, sunflower: 1500,
  asparagus: 3000, spinach: 8000, okra: 7000, lettuce: 8000,
  ginger: 8000, turmeric: 6000, garlic: 5000,
  watermelon: 15000, pawpaws: 10000, "passion fruit": 8000,
  macadamia: 4000, cashew: 2000, coconut: 3000, cayenne: 8000,
};

function getCropDefaultYieldKg(crop: string): number {
  const key = crop.toLowerCase();
  return defaultYieldsKg[key] || 2000;
}

function getDefaultPricePerKg(crop: string): number {
  const defaultPrices: Record<string, number> = {
    maize: 40, beans: 80, tomatoes: 40, onions: 50, cabbages: 25,
    kales: 20, brinjals: 30, capsicums: 50, chillies: 80, carrots: 40,
    bananas: 30, mangoes: 50, avocados: 40, oranges: 40, pineapples: 40,
    cassava: 20, sweet_potatoes: 25, irish_potatoes: 30, coffee: 300,
    tea: 200, sugarcane: 5, sunflower: 60, asparagus: 100, spinach: 25,
    okra: 35, lettuce: 30, ginger: 80, turmeric: 100, garlic: 200,
    watermelon: 30, pawpaws: 30, passion_fruit: 50, macadamia: 150,
    cashew: 100, coconut: 20, rice: 60, wheat: 45, sorghum: 45,
    millet: 50, groundnuts: 120, soya_beans: 60, cowpeas: 70,
    green_grams: 70, pigeonpeas: 70, cayenne: 80
  };
  const key = crop.toLowerCase().replace(/ /g, '_');
  return defaultPrices[key] || 40;
}

function formatCurrencyForCountry(amount: number, country: string = 'kenya'): string {
  const normalizedCountry = country.toLowerCase();
  const currency = COUNTRY_CURRENCY_MAP[normalizedCountry] || COUNTRY_CURRENCY_MAP.kenya;
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);
}

function getCurrencyForCountry(country: string = 'kenya'): { symbol: string; name: string; code: string } {
  const normalized = country.toLowerCase();
  const currency = COUNTRY_CURRENCY_MAP[normalized] || COUNTRY_CURRENCY_MAP.kenya;
  return {
    symbol: currency.symbol,
    name: currency.name,
    code: currency.code,
  };
}

function buildDefaultFertilizerPlan(crop: string, farmSize: number, spacingInfo: any | null) {
  const dapKg = 50;
  const ureaKg = 50;
  const dapCost = 3500;
  const ureaCost = 2800;
  let plantsPerAcre = 20000;
  if (spacingInfo && spacingInfo.plantsPerAcre) plantsPerAcre = spacingInfo.plantsPerAcre;
  const totalPlants = plantsPerAcre * farmSize;
  return {
    totalCost: dapCost + ureaCost,
    farmSize,
    plantingRecommendations: [
      { kgNeeded: dapKg, name: "DAP", cost: dapCost, n: 18, p: 46, k: 0, extraNutrients: "" }
    ],
    topDressingRecommendations: [
      { kgNeeded: ureaKg, name: "UREA", cost: ureaCost, n: 46, p: 0, k: 0, extraNutrients: "" }
    ],
    perPlant: {
      dapGrams: totalPlants ? (dapKg * 1000) / totalPlants : 0,
      ureaGrams: totalPlants ? (ureaKg * 1000) / totalPlants : 0,
      mopGrams: 0,
      totalGrams: totalPlants ? ((dapKg + ureaKg) * 1000) / totalPlants : 0,
    }
  };
}

// ========== TRANSFORMATION WITH COST CALCULATION (FIXES NaN) ==========
function transformFertilizerPlanForEngine(plan: any): any {
  if (!plan) return null;
  const transformed: any = {
    totalCost: plan.totalCost,
    farmSize: plan.farmSize,
    perPlant: plan.perPlant,
  };

  // Planting fertilizer
  if (plan.plantingRecommendations && plan.plantingRecommendations.length > 0) {
    const pf = plan.plantingRecommendations[0];
    const amountKg = pf.amountKg ?? pf.kgNeeded ?? 0;
    const pricePer50kg = pf.pricePer50kg ?? 0;
    const totalCost = (amountKg / 50) * pricePer50kg;
    transformed.plantingFertilizer = {
      fertilizerId: pf.fertilizerId,
      brand: pf.brand,
      name: pf.brand,
      npk: pf.npk,
      kgNeeded: amountKg,
      cost: totalCost,
      pricePer50kg: pf.pricePer50kg,
      packageSizes: pf.packageSizes,
      n: pf.provides?.n ?? 0,
      p: pf.provides?.p ?? 0,
      k: pf.provides?.k ?? 0,
      extraNutrients: pf.extraNutrients || "",
    };
  }

  // Topdressing fertilizers (both CAN and MOP will be processed)
  if (plan.topDressingRecommendations && plan.topDressingRecommendations.length > 0) {
    transformed.topdressingFertilizers = plan.topDressingRecommendations.map((tf: any) => {
      const amountKg = tf.amountKg ?? tf.kgNeeded ?? 0;
      const pricePer50kg = tf.pricePer50kg ?? 0;
      const totalCost = (amountKg / 50) * pricePer50kg;
      return {
        fertilizerId: tf.fertilizerId,
        brand: tf.brand,
        name: tf.brand,
        npk: tf.npk,
        kgNeeded: amountKg,
        cost: totalCost,
        pricePer50kg: tf.pricePer50kg,
        packageSizes: tf.packageSizes,
        n: tf.provides?.n ?? 0,
        p: tf.provides?.p ?? 0,
        k: tf.provides?.k ?? 0,
        extraNutrients: tf.extraNutrients || "",
      };
    });
  }

  return transformed;
}

// ========== VOICE-FRIENDLY LINE BREAKS (sentence boundaries, no decimal breakage, safe null checks) ==========
function addLineBreaksForVoice(recommendations: any): any {
  if (!recommendations) return recommendations;

  const processText = (text: string): string => {
    if (!text) return text;
    let result = text
      // Bullet points
      .replace(/([^•])(• )/g, '$1\n$2')
      // Warning symbol
      .replace(/([^⚠️])(⚠️)/g, '$1\n$2')
      // Numbered lists (e.g., "1. ", "2. ")
      .replace(/([^0-9])(\d+\. )/g, '$1\n$2')
      // Sentence endings: period, exclamation, question mark followed by space
      // Negative lookbehind ensures we don't break decimal numbers (e.g., 1,520.64)
      .replace(/(?<!\d)([.!?]) /g, '$1\n ');
    if (result.startsWith('\n')) result = result.substring(1);
    return result;
  };

  // Process structuredList safely
  if (recommendations.structuredList && Array.isArray(recommendations.structuredList)) {
    recommendations.structuredList = recommendations.structuredList.map((item: any) => {
      if (!item || !item.params) return item;
      return {
        ...item,
        params: {
          ...item.params,
          content: item.params.content ? processText(item.params.content) : item.params.content
        }
      };
    });
  }

  // Process list safely
  if (recommendations.list && Array.isArray(recommendations.list)) {
    recommendations.list = recommendations.list.map((item: any) => {
      if (!item || !item.params) return item;
      return {
        ...item,
        params: {
          ...item.params,
          content: item.params.content ? processText(item.params.content) : item.params.content
        }
      };
    });
  }

  // Process financialAdvice safely
  if (recommendations.financialAdvice && typeof recommendations.financialAdvice === 'string') {
    recommendations.financialAdvice = processText(recommendations.financialAdvice);
  }

  return recommendations;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀🚀🚀 USING V4.3 ROUTE (Costs Fixed + Sentence Pauses) 🚀🚀🚀");
    const body = await request.json();
    const cookieLanguage = request.cookies.get('preferred-language')?.value;
    const bodyLanguage = body.language;
    const userLanguage = bodyLanguage || cookieLanguage || 'en';
    console.log(`🌐 Generating recommendations in language: ${userLanguage}`);

    const {
      farmerName, phoneNumber, subCounty, ward, village, totalFarmSize, cultivatedAcres, waterSources,
      crops, cropVarieties, cropAcres, plantingDate, seedSource, spacing, seedRate,
      usePlantingFertilizer, plantingFertilizerType, plantingFertilizerQuantity,
      useTopdressingFertilizer, topdressingFertilizerType, topdressingFertilizerQuantity,
      commonPests, commonDiseases, actualYieldKg, pricePerKg, storageMethod,
      ploughingCost, plantingLabourCost, weedingCost, harvestingCost,
      transportCostTotal, packagingCostTotal, miscellaneousCostTotal,
      hasDoneSoilTest, soilTestDate, soilTestPH, soilTestPHRating, soilTestP, soilTestPRating,
      soilTestK, soilTestKRating, soilTestNPercent, soilTestNPercentRating,
      soilTestCa, soilTestCaRating, soilTestMg, soilTestMgRating, soilTestNa, soilTestNaRating,
      soilTestOC, soilTestOCRating, soilTestOM, soilTestOMRating, soilTestCEC, soilTestCECRating,
      targetYield, recCalciticLime, recDolomiticLime,
      recPlantingFertilizer, recPlantingQuantity,
      recTopdressingFertilizer, recTopdressingQuantity,
      recPotassiumFertilizer, recPotassiumQuantity,
      plantingFertilizerNutrients, topdressingFertilizerNutrients, potassiumFertilizerNutrients,
      plantingFertilizerToUse, plantingFertilizerCost,
      topdressingFertilizerToUse, topdressingFertilizerCost,
      potassiumFertilizerToUse, potassiumFertilizerCost,
      plantingFertilizerQuantity: plantingFertilizerQuantityKg,
      topdressingFertilizerQuantity: topdressingFertilizerQuantityKg,
      potassiumFertilizerQuantity: potassiumFertilizerQuantityKg,
      calciticLimePricePerBag, dolomiticLimePricePerBag,
      plantsDamaged, seedCost, season, county, acres, conservationPractices,
      useCertifiedSeed, seedQuantity, userid, country,
      deficiencySymptoms, deficiencyLocation, wantsNutritionBenefits,
    } = body;

    const cleanedCommonPests = cleanUserInput(commonPests);
    const cleanedCommonDiseases = cleanUserInput(commonDiseases);
    const cleanedConservationPractices = cleanUserInput(conservationPractices);

    if (!crops || !county || !userid) {
      console.error("Missing required fields:", { crops, county, userid });
      return NextResponse.json({ error: "Missing required fields: crops, county, userid are required" }, { status: 400 });
    }

    const currencyConfig = getCurrencyForCountry(country);
    const cropsArray = crops.split(",").map((c: string) => c.trim());
    const primaryCrop = cropsArray[0];
    const farmSize = parseFloat(cropAcres) || parseFloat(acres) || 1;

    let plantingAdvice = null;
    let plantingAdviceText = null;
    if (plantingDate && primaryCrop && country) {
      plantingAdvice = getPlantingAdvice(primaryCrop, country, county, plantingDate);
      plantingAdviceText = getPlantingAdviceText(primaryCrop, country, county, plantingDate);
      console.log(`🌱 Planting advice for ${primaryCrop} in ${country}/${county}: ${plantingAdvice}`);
    }

    let spacingInfo = null;
    let spacingWarning: string | null = null;
    if (spacing && primaryCrop) {
      const spacingOptions = getSpacingOptions(primaryCrop);
      const selectedSpacing = spacingOptions.find(s => s.label === spacing);
      if (selectedSpacing) {
        spacingInfo = {
          rowCm: selectedSpacing.rowCm,
          plantCm: selectedSpacing.plantCm,
          seedsPerHole: selectedSpacing.seedsPerHole,
          label: selectedSpacing.label,
          plantsPerAcre: selectedSpacing.plantsPerAcre
        };
        console.log(`📏 Spacing info: ${selectedSpacing.label} = ${selectedSpacing.plantsPerAcre.toLocaleString()} plants/acre`);
      }
    }

    let validatedYieldKg = parseFloat(actualYieldKg) || 0;
    let validatedPricePerKg = parseFloat(pricePerKg) || 0;
    let yieldWarnings: string[] = [];
    let priceWarnings: string[] = [];

    if (validatedYieldKg === 0 && primaryCrop) {
      validatedYieldKg = getCropDefaultYieldKg(primaryCrop) * farmSize;
      yieldWarnings.push(`Using default yield of ${validatedYieldKg.toLocaleString()} kg for ${primaryCrop}`);
    }
    if (validatedPricePerKg === 0 && primaryCrop) {
      validatedPricePerKg = getDefaultPricePerKg(primaryCrop);
      priceWarnings.push(`Using default price of ${validatedPricePerKg} ${currencyConfig.symbol}/kg for ${primaryCrop}`);
    }

    const revenue = validatedYieldKg * validatedPricePerKg;
    const seedCostValue = parseFloat(seedCost) || 0;
    const ploughingCostValue = parseFloat(ploughingCost) || 0;
    const plantingLabourCostValue = parseFloat(plantingLabourCost) || 0;
    const weedingCostValue = parseFloat(weedingCost) || 0;
    const harvestingCostValue = parseFloat(harvestingCost) || 0;
    const transportCostValue = parseFloat(transportCostTotal) || 0;
    const packagingCostValue = parseFloat(packagingCostTotal) || 0;
    const miscellaneousCostValue = parseFloat(miscellaneousCostTotal) || 0;

    const totalCosts = seedCostValue + ploughingCostValue + plantingLabourCostValue +
                       weedingCostValue + harvestingCostValue + transportCostValue +
                       packagingCostValue + miscellaneousCostValue;

    const grossMargin = revenue - totalCosts;
    const marginPercentage = totalCosts > 0 ? (grossMargin / revenue) * 100 : 0;

    const grossMarginAnalysis = {
      crop: primaryCrop, farmSize, yieldKg: validatedYieldKg, pricePerKg: validatedPricePerKg,
      revenue, seedCost: seedCostValue,
      labourCosts: {
        ploughing: ploughingCostValue, planting: plantingLabourCostValue,
        weeding: weedingCostValue, harvesting: harvestingCostValue,
        total: ploughingCostValue + plantingLabourCostValue + weedingCostValue + harvestingCostValue
      },
      transportCost: transportCostValue, packagingCost: packagingCostValue,
      miscellaneousCost: miscellaneousCostValue, totalCosts, grossMargin, marginPercentage
    };

    let soilAnalysis = null;
    let fertilizerPlan = null;

    if (hasDoneSoilTest === "Yes" && soilTestDate) {
      try {
        const soilTestData = {
          testDate: soilTestDate, ph: parseFloat(soilTestPH) || 0,
          phosphorus: parseFloat(soilTestP) || 0, potassium: parseFloat(soilTestK) || 0,
          calcium: parseFloat(soilTestCa) || 0, magnesium: parseFloat(soilTestMg) || 0,
          sodium: parseFloat(soilTestNa) || 0, totalNitrogen: parseFloat(soilTestNPercent) || 0,
          organicCarbon: parseFloat(soilTestOC) || 0, organicMatter: parseFloat(soilTestOM) || 0,
          cec: parseFloat(soilTestCEC) || 0, phRating: soilTestPHRating || '',
          phosphorusRating: soilTestPRating || '', potassiumRating: soilTestKRating || '',
          calciumRating: soilTestCaRating || '', magnesiumRating: soilTestMgRating || '',
          sodiumRating: soilTestNaRating || '', totalNitrogenRating: soilTestNPercentRating || '',
          organicCarbonRating: soilTestOCRating || '', organicMatterRating: soilTestOMRating || '',
          cecRating: soilTestCECRating || '', targetYield: targetYield ? parseFloat(targetYield) : null,
          recCalciticLime: recCalciticLime ? parseFloat(recCalciticLime) : null,
          recPlantingFertilizer: recPlantingFertilizer || null,
          recPlantingQuantity: recPlantingQuantity ? parseFloat(recPlantingQuantity) : null,
          recTopdressingFertilizer: recTopdressingFertilizer || null,
          recTopdressingQuantity: recTopdressingQuantity ? parseFloat(recTopdressingQuantity) : null,
          recPotassiumFertilizer: recPotassiumFertilizer || null,
          recPotassiumQuantity: recPotassiumQuantity ? parseFloat(recPotassiumQuantity) : null,
          plantingFertilizerNutrients: plantingFertilizerNutrients || null,
          topdressingFertilizerNutrients: topdressingFertilizerNutrients || null,
          potassiumFertilizerNutrients: potassiumFertilizerNutrients || null,
          crops: primaryCrop, cropAcres: farmSize
        };
        soilAnalysis = soilTestInterpreter.interpretSoilTest(soilTestData);
        soilAnalysis = { ...soilAnalysis, ...soilTestData };
        console.log("📊 Soil Analysis created");

        const hasRecommendations = recPlantingFertilizer || recTopdressingFertilizer || recPotassiumFertilizer;
        const hasUserSelections = plantingFertilizerToUse || topdressingFertilizerToUse || potassiumFertilizerToUse;

        if (hasRecommendations || hasUserSelections) {
          console.log("📊 Calculating fertilizer plan with:", {
            recPlantingFertilizer, recPlantingQuantity,
            recTopdressingFertilizer, recTopdressingQuantity,
            recPotassiumFertilizer, recPotassiumQuantity,
            plantingFertilizerToUse, topdressingFertilizerToUse, potassiumFertilizerToUse
          });
          fertilizerPlan = fertilizerCalculator.calculateFromRecommendations(
            {
              targetYield: soilTestData.targetYield || 2000,
              plantingFertilizer: recPlantingFertilizer || "",
              plantingQuantity: recPlantingQuantity ? parseFloat(recPlantingQuantity) : 50,
              topdressingFertilizer: recTopdressingFertilizer || "",
              topdressingQuantity: recTopdressingQuantity ? parseFloat(recTopdressingQuantity) : 0,
              potassiumFertilizer: recPotassiumFertilizer || "",
              potassiumQuantity: recPotassiumQuantity ? parseFloat(recPotassiumQuantity) : 0
            },
            {
              planting: plantingFertilizerToUse ? [plantingFertilizerToUse] : [],
              topdressing: topdressingFertilizerToUse ? [topdressingFertilizerToUse] : [],
              potassium: potassiumFertilizerToUse ? [potassiumFertilizerToUse] : []
            },
            {
              plantingCost: plantingFertilizerCost ? parseFloat(plantingFertilizerCost) : 0,
              topdressingCost: topdressingFertilizerCost ? parseFloat(topdressingFertilizerCost) : 0,
              potassiumCost: potassiumFertilizerCost ? parseFloat(potassiumFertilizerCost) : 0
            },
            farmSize, spacingInfo, country || 'kenya', primaryCrop
          );
          console.log("✅ Fertilizer plan calculated:", fertilizerPlan ? {
            totalCost: fertilizerPlan.totalCost,
            plantingCount: fertilizerPlan.plantingRecommendations?.length,
            topdressingCount: fertilizerPlan.topDressingRecommendations?.length
          } : "No plan generated");
        }
      } catch (error) {
        console.error("Error processing soil test:", error);
      }
    }

    if (!fertilizerPlan) {
      console.log("⚠️ No fertilizer plan from soil test, using default plan");
      fertilizerPlan = buildDefaultFertilizerPlan(primaryCrop, farmSize, spacingInfo);
    }

    console.log("🔍 Raw fertilizerPlan before transform:", JSON.stringify(fertilizerPlan, null, 2));
    const engineFertilizerPlan = transformFertilizerPlanForEngine(fertilizerPlan);
    console.log("🔍 Transformed engineFertilizerPlan:", JSON.stringify(engineFertilizerPlan, null, 2));

    let recommendationsOutput = null;
    const cacheKey = getCacheKey({
      userLanguage, primaryCrop, hasDoneSoilTest, farmSize,
      soilTestPH, soilTestP, soilTestK, actualYieldKg: validatedYieldKg,
      pricePerKg: validatedPricePerKg, totalCosts, country, plantsDamaged,
      deficiencySymptoms, deficiencyLocation, spacing, storageMethod, wantsNutritionBenefits
    });

    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("✅ Using cached recommendations");
        recommendationsOutput = cached.data;
      } else {
        cache.delete(cacheKey);
      }
    }

    if (!recommendationsOutput) {
      console.log("📋 Generating fresh recommendations for:", primaryCrop);
      try {
        recommendationsOutput = await withTimeout(
          generateRecommendations({
            hasSoilTest: hasDoneSoilTest === "Yes",
            soilAnalysis,
            fertilizerPlan: engineFertilizerPlan,
            crop: primaryCrop,
            crops: cropsArray,
            farmerData: {
              farmerName: farmerName || 'Farmer',
              usePlantingFertilizer, useTopdressingFertilizer,
              conservationPractices: cleanedConservationPractices,
              commonPests: cleanedCommonPests,
              commonDiseases: cleanedCommonDiseases,
              managementLevel: "Medium",
              actualYieldKg: validatedYieldKg,
              pricePerKg: validatedPricePerKg,
              totalCosts: totalCosts,
              country: country || 'kenya',
              limePricePerBag: calciticLimePricePerBag ? parseFloat(calciticLimePricePerBag) : 300,
              recCalciticLime: recCalciticLime ? parseFloat(recCalciticLime) : 0,
              recDolomiticLime: recDolomiticLime ? parseFloat(recDolomiticLime) : 0,
              dolomiticLimePricePerBag: dolomiticLimePricePerBag ? parseFloat(dolomiticLimePricePerBag) : 300,
              plantsDamaged: plantsDamaged ? parseInt(plantsDamaged) : null,
              language: userLanguage,
              deficiencySymptoms, deficiencyLocation,
              spacing: spacing,
              storageMethod: storageMethod,
              wantsNutritionBenefits: wantsNutritionBenefits === true || wantsNutritionBenefits === "Yes",
              currencySymbol: currencyConfig.symbol,
              currencyName: currencyConfig.name,
            }
          }),
          600000,
          "Recommendation generation timed out after 600 seconds"
        );
        cache.set(cacheKey, { data: recommendationsOutput, timestamp: Date.now() });
        console.log("✅ Recommendations generated and cached");
      } catch (error: any) {
        console.error("❌ Error generating recommendations:", error);
        const profitStatus = grossMargin >= 0 ? "profit" : "loss";
        recommendationsOutput = {
          list: [
            { key: "welcome_message", params: { content: `Welcome ${farmerName || "Farmer"}! I've analyzed your ${primaryCrop} farm.` } },
            { key: "financial_summary", params: { content: `Revenue: ${formatCurrencyForCountry(revenue, country)} | Costs: ${formatCurrencyForCountry(totalCosts, country)} | ${profitStatus === "profit" ? "Profit" : "Loss"}: ${formatCurrencyForCountry(Math.abs(grossMargin), country)}` } }
          ],
          financialAdvice: `Keep tracking your costs and yields. Every kilogram counts!`,
          structuredList: [
            { key: "quick_summary", params: { content: `${primaryCrop.toUpperCase()} Enterprise: ${validatedYieldKg.toLocaleString()} kg @ ${formatCurrencyForCountry(validatedPricePerKg, country)}/kg = ${formatCurrencyForCountry(revenue, country)} revenue` } }
          ],
          structuredFinancialAdvice: null
        };
      }
    }

    // ========== APPLY VOICE-FRIENDLY LINE BREAKS (sentence boundaries) ==========
    if (recommendationsOutput) {
      recommendationsOutput = addLineBreaksForVoice(recommendationsOutput);
    }

    const sessionRef = db.collection("farmer_sessions").doc();
    const sessionId = sessionRef.id;

    const farmerSession = {
      id: sessionId,
      userId: userid,
      language: userLanguage,
      farmerName,
      phoneNumber,
      county,
      subCounty,
      ward,
      village,
      country: country || 'kenya',
      crops: cropsArray,
      primaryCrop,
      cropAcres: farmSize,
      yieldData: { actualKg: validatedYieldKg, pricePerKg: validatedPricePerKg, revenue, warnings: [...yieldWarnings, ...priceWarnings] },
      seedCost: seedCostValue,
      seedRate: parseFloat(seedRate) || parseFloat(seedQuantity) || null,
      labourCosts: { ploughing: ploughingCostValue, planting: plantingLabourCostValue, weeding: weedingCostValue, harvesting: harvestingCostValue },
      transportCostTotal: transportCostValue,
      packagingCostTotal: packagingCostValue,
      miscellaneousCostTotal: miscellaneousCostValue,
      spacing,
      spacingInfo,
      spacingWarning,
      grossMarginAnalysis,
      plantingDate,
      plantingAdvice,
      plantingAdviceText,
      commonPests: cleanedCommonPests ? cleanedCommonPests.split(',').map((p: string) => p.trim()) : [],
      commonDiseases: cleanedCommonDiseases ? cleanedCommonDiseases.split(',').map((d: string) => d.trim()) : [],
      storageMethod,
      conservationPractices: cleanedConservationPractices ? cleanedConservationPractices.split(',').map((p: string) => p.trim()) : [],
      recommendations: recommendationsOutput.list,
      financialAdvice: recommendationsOutput.financialAdvice,
      structuredList: recommendationsOutput.structuredList || [],
      structuredFinancialAdvice: recommendationsOutput.structuredFinancialAdvice || null,
      fertilizerPlan: fertilizerPlan ? {
        totalCost: fertilizerPlan.totalCost,
        farmSize: fertilizerPlan.farmSize,
        plantingRecommendations: fertilizerPlan.plantingRecommendations,
        topDressingRecommendations: fertilizerPlan.topDressingRecommendations,
        perPlant: fertilizerPlan.perPlant
      } : null,
      soilTest: hasDoneSoilTest === "Yes" ? {
        testDate: soilTestDate, ph: soilTestPH ? parseFloat(soilTestPH) : null, phRating: soilTestPHRating,
        phosphorus: soilTestP ? parseFloat(soilTestP) : null, phosphorusRating: soilTestPRating,
        potassium: soilTestK ? parseFloat(soilTestK) : null, potassiumRating: soilTestKRating,
        totalNitrogen: soilTestNPercent ? parseFloat(soilTestNPercent) : null, totalNitrogenRating: soilTestNPercentRating,
        calcium: soilTestCa ? parseFloat(soilTestCa) : null, calciumRating: soilTestCaRating,
        magnesium: soilTestMg ? parseFloat(soilTestMg) : null, magnesiumRating: soilTestMgRating,
        sodium: soilTestNa ? parseFloat(soilTestNa) : null, sodiumRating: soilTestNaRating,
        organicCarbon: soilTestOC ? parseFloat(soilTestOC) : null, organicCarbonRating: soilTestOCRating,
        organicMatter: soilTestOM ? parseFloat(soilTestOM) : null, organicMatterRating: soilTestOMRating,
        cec: soilTestCEC ? parseFloat(soilTestCEC) : null, cecRating: soilTestCECRating,
        targetYield: targetYield ? parseFloat(targetYield) : null,
        recCalciticLime: recCalciticLime ? parseFloat(recCalciticLime) : null,
        recDolomiticLime: recDolomiticLime ? parseFloat(recDolomiticLime) : null,
        recPlantingFertilizer, recPlantingQuantity, recTopdressingFertilizer, recTopdressingQuantity,
        recPotassiumFertilizer, recPotassiumQuantity,
        plantingFertilizerNutrients, topdressingFertilizerNutrients, potassiumFertilizerNutrients,
        plantingFertilizerToUse, plantingFertilizerCost, topdressingFertilizerToUse, topdressingFertilizerCost,
        potassiumFertilizerToUse, potassiumFertilizerCost,
      } : null,
      useCertifiedSeed: useCertifiedSeed === "yes",
      deficiencySymptoms: deficiencySymptoms || null,
      deficiencyLocation: deficiencyLocation || null,
      wantsNutritionBenefits: wantsNutritionBenefits === true || wantsNutritionBenefits === "Yes",
      plantsDamaged: plantsDamaged ? parseInt(plantsDamaged) : null,
      metadata: {
        warnings: { yield: yieldWarnings, price: priceWarnings, spacing: spacingWarning ? [spacingWarning] : [] },
        createdAt: new Date().toISOString(),
        source: "logic-based",
        version: "4.3-voice-friendly"
      }
    };

    await sessionRef.set(farmerSession);
    console.log(`✅ Saved farmer session ${sessionId} for ${primaryCrop}. Recommendations count: ${recommendationsOutput.structuredList?.length || 0}`);

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      grossMarginAnalysis,
      recommendations: recommendationsOutput.list,
      structuredList: recommendationsOutput.structuredList,
      structuredFinancialAdvice: recommendationsOutput.structuredFinancialAdvice,
      financialAdvice: recommendationsOutput.financialAdvice,
      fertilizerPlan: fertilizerPlan,
      warnings: { yield: yieldWarnings, price: priceWarnings, spacing: spacingWarning },
      welcomeMessage: `Welcome ${farmerName || "Farmer"}! I've prepared your recommendations for ${primaryCrop}.`
    }, { status: 200 });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown error occurred" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    message: "Farmer Session Generation API - FULL 19-SLOT OUTPUT + COSTS FIXED + SENTENCE PAUSES",
    version: "4.3"
  });
}