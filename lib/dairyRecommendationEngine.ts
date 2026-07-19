// lib/dairyRecommendationEngine.ts
// DAIRY RECOMMENDATION ENGINE
// Generates dairy-specific recommendations based on farmer inputs and modules filter.

import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';
import { dairyPestDiseaseMap } from '@/lib/data/dairyHealthMapping';
import { formulateDairyFeed } from '@/lib/dairyFeedFormulation';
import { formulateDairyConcentrateFeed } from '@/lib/dairyConcentrateFeedFormulation';

// ========== HELPERS ==========

function safeT(translation: any, fallback: string, ...args: any[]): string {
  if (typeof translation === 'function') return translation(...args);
  let result = (translation as string) || fallback;
  for (let i = 0; i < args.length; i++) {
    result = result.replace(new RegExp(`\\{\\{${i}\\}\\}`, 'g'), args[i].toString());
    result = result.replace(new RegExp(`\\{\\{${i}\\?\\?.*?\\}\\}`, 'g'), args[i].toString());
  }
  return result;
}

const replacePlaceholders = (template: string | undefined, params: Record<string, string | number>): string => {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value.toString());
  }
  return result;
};

interface ModuleKeyMap {
  [key: string]: string;
}

const moduleKeyMap: ModuleKeyMap = {
  'confidence': 'confidence',
  'dairy_calf_rearing': 'dairy_calf_rearing',
  'dairy_housing': 'dairy_housing',
  'dairy_feed_per_day': 'dairy_feed_per_day',
  'dairy_feed_formulation': 'dairy_feed_formulation',
  'dairy_concentrate_feed': 'dairy_concentrate_feed',
  'dairy_milk_production': 'dairy_milk_production',
  'dairy_disease_management': 'dairy_disease_management',
  'dairy_parasite_management': 'dairy_parasite_management',
  'dairy_deficiency_analysis': 'dairy_deficiency_analysis',
  'dairy_breeding': 'dairy_breeding',
  'dairy_dos_donts': 'dairy_dos_donts',
  'dairy_financial': 'dairy_financial',
  'dairy_business_tip': 'dairy_business_tip',
  'dairy_reminder': 'dairy_reminder',
};

function shouldIncludeModule(key: string, modules: string[]): boolean {
  if (!modules || modules.length === 0) return true;
  if (modules.includes('complete')) return true;
  const moduleKey = moduleKeyMap[key];
  if (!moduleKey) return false;
  return modules.includes(moduleKey);
}

function formatCurrency(amount: number, country: string, currencySymbol: string): string {
  const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
  const symbol = currencySymbol || currency.symbol;
  const formattedAmount = new Intl.NumberFormat(currency.locale, {
    style: 'decimal',
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);
  return currency.position === 'before' ? `${symbol} ${formattedAmount}` : `${formattedAmount} ${symbol}`;
}

// ========== MAIN GENERATION FUNCTION ==========
export async function generateDairyRecommendations(params: {
  farmerData: any;
  modules: string[];
  country: string;
  currencySymbol: string;
  userLanguage: string;
}): Promise<{
  list: string[];
  structuredList: any[];
  financialAdvice: string;
  structuredFinancialAdvice: any;
}> {
  const { farmerData, modules, country, currencySymbol, userLanguage } = params;
  const isSwahili = userLanguage === 'sw';
  const isFrench = userLanguage === 'fr';
  const isSpanish = userLanguage === 'es';

  const structuredList: any[] = [];
  const addToStructuredList = (item: any) => {
    const key = item.key;
    if (shouldIncludeModule(key, modules)) {
      structuredList.push(item);
    }
  };

  // ============================================================
  // CONFIDENCE
  // ============================================================
  if (shouldIncludeModule('confidence', modules)) {
    let confidenceLabel = '';
    // If they have a soil test or complete data, we could adjust.
    // For dairy, we'll just set medium confidence by default.
    confidenceLabel = isSwahili ? '🟡 IMANI: Wastani (kulingana na maelezo yako)' :
                      isFrench ? '🟡 CONFIANCE: Moyenne (basée sur vos informations)' :
                      isSpanish ? '🟡 CONFIANZA: Media (basada en tus datos)' :
                      '🟡 Confidence: Medium (based on your information)';
    addToStructuredList({ key: 'confidence', params: { content: confidenceLabel } });
  }

  // ============================================================
  // CALF REARING
  // ============================================================
  if (shouldIncludeModule('dairy_calf_rearing', modules)) {
    const age = parseInt(farmerData.calfAgeWeeks) || 0;
    const feeding = farmerData.calfFeedingMethod || 'Not specified';
    const milkLitres = parseFloat(farmerData.calfMilkLitresPerDay) || 0;
    const colostrum = farmerData.calfReceivedColostrum;
    const housing = farmerData.calfHousingType || 'Not specified';
    const healthIssues = farmerData.calfHealthIssues || [];

    let content = `🍼 CALF REARING GUIDE\n`;
    if (age < 1 && colostrum !== true) {
      content += `• ⚠️ Colostrum is critical within the first 6 hours of life. If not given, contact a vet immediately.\n`;
    } else if (age < 1 && colostrum === true) {
      content += `• ✅ Colostrum given – good! Ensure at least 10% of body weight (e.g., 4L for 40kg calf).\n`;
    }
    if (milkLitres > 0) {
      if (age < 4) {
        content += `• 🥛 Feeding ${milkLitres}L/day – appropriate for under 4 weeks. Gradually increase to 10–12% of body weight.\n`;
      } else if (age < 8) {
        content += `• 🥛 Feeding ${milkLitres}L/day – for age 4–8 weeks, aim for 6–8L/day. Introduce calf starter and fresh water.\n`;
      } else {
        content += `• 🥛 Weaning recommended at 8 weeks. Ensure calf eats ≥1kg starter/day before reducing milk.\n`;
      }
    } else {
      content += `• 🥛 No milk amount recorded. For calves under 8 weeks, provide 6–8L of whole milk or replacer daily.\n`;
    }
    content += `• 🏠 Housing: ${housing}. Ensure dry, draft‑free pen with clean bedding. At least 1.5m² per calf.\n`;
    if (healthIssues.includes('Diarrhoea (scours)')) {
      content += `• ⚠️ Scours reported. Check hydration – offer electrolytes. Ensure clean water and milk. Consult vet if severe.\n`;
    }
    if (healthIssues.includes('Cough / pneumonia')) {
      content += `• ⚠️ Cough/pneumonia symptoms. Improve ventilation, reduce stress, consult vet for antibiotics.\n`;
    }
    if (healthIssues.includes('Naval infection')) {
      content += `• ⚠️ Naval infection – clean with 7% iodine at birth. If swollen/discharging, contact vet.\n`;
    }
    content += `• 💉 Vaccinations: At birth: clostridial (if dam unvaccinated); Week 2: BRD vaccine; Week 3: clostridial booster; Week 6: IBR/BVD if indicated; At weaning: revaccinate BRD and clostridial.\n`;
    if (age >= 8) {
      content += `• ✅ Weaning age reached. Ensure calf eating 1.5–2kg starter/grower per day before fully removing milk.\n`;
    } else {
      content += `• ⏳ Weaning recommended at 8 weeks or when calf eats ≥1kg starter daily.\n`;
    }
    content += `• 📅 Deworm at 4 months, and vaccinate against FMD and other local diseases.\n`;

    addToStructuredList({
      key: 'dairy_calf_rearing',
      params: { content }
    });
  }

  // ============================================================
  // HOUSING
  // ============================================================
  if (shouldIncludeModule('dairy_housing', modules)) {
    const housingType = farmerData.dairyHousingType || 'Not specified';
    const cows = parseInt(farmerData.numberOfCowsHoused) || 0;
    const floorSpace = parseFloat(farmerData.floorSpacePerCowM2) || 0;
    const ventilation = farmerData.dairyVentilationRating || 'Not rated';
    const bedding = farmerData.beddingType || 'Not specified';

    let content = `🏠 DAIRY HOUSING MANAGEMENT\n`;
    content += `• Housing type: ${housingType}\n`;
    if (cows > 0 && floorSpace > 0) {
      content += `• Total cows: ${cows}, Space per cow: ${floorSpace} m².\n`;
      if (floorSpace < 3) {
        content += `  – ⚠️ Space is low – increase to ≥3 m² for comfort.\n`;
      } else {
        content += `  – ✅ Space is adequate.\n`;
      }
    }
    content += `• Ventilation: ${ventilation}. ${ventilation === 'Poor' ? 'Improve air flow – open windows, use fans.' : 'Good ventilation reduces respiratory disease.'}\n`;
    content += `• Bedding: ${bedding}. ${bedding === 'None' ? 'Provide dry bedding (straw, sawdust) for cow comfort.' : 'Keep bedding dry and clean.'}\n`;
    content += `• 📅 Weekly: Check for ammonia smell, clean water troughs, ensure dry standing areas.\n`;

    addToStructuredList({
      key: 'dairy_housing',
      params: { content }
    });
  }

  // ============================================================
  // FEED PER DAY
  // ============================================================
  if (shouldIncludeModule('dairy_feed_per_day', modules)) {
    const forageType = farmerData.dairyForageType || 'Not specified';
    const forageKg = parseFloat(farmerData.dairyForageKgPerDay) || 0;
    const concentrateType = farmerData.dairyConcentrateType || 'None';
    const concKg = parseFloat(farmerData.dairyConcentrateKgPerDay) || 0;
    const milkYield = parseFloat(farmerData.dairyMilkYield) || 0;

    let content = `⚖️ DAIRY FEED PER DAY\n`;
    content += `• Forage: ${forageType}, ${forageKg} kg/day.\n`;
    content += `• Concentrate: ${concentrateType}, ${concKg} kg/day.\n`;
    if (milkYield > 0) {
      content += `• Milk yield: ${milkYield} L/day.\n`;
      // Estimate DMI: 0.02 * BW + 0.3 * (FCM/100). We don't have BW here, so we'll skip.
      // We could add a recommendation.
    }
    const totalFeedKg = forageKg + concKg;
    content += `• Total feed: ${totalFeedKg} kg/day (as fed).\n`;
    // We could estimate cost if we had prices.
    content += `• 🧪 Ensure forage is of good quality and concentrate matches production level.\n`;

    addToStructuredList({
      key: 'dairy_feed_per_day',
      params: { content }
    });
  }

  // ============================================================
  // FEED FORMULATION (TMR)
  // ============================================================
  if (shouldIncludeModule('dairy_feed_formulation', modules)) {
    try {
      const result = formulateDairyFeed({
        cowCategory: farmerData.cowCategory || 'lactating',
        bodyWeightKg: parseFloat(farmerData.bodyWeightKg) || 500,
        milkYieldL: parseFloat(farmerData.dairyMilkYield) || 0,
        milkFatPercent: parseFloat(farmerData.milkFatPercent) || 4.0,
        availableForages: farmerData.dairyAvailableForages || [],
        availableGrains: farmerData.dairyAvailableGrains || [],
        availableProteinSources: farmerData.dairyAvailableProtein || [],
        availableMinerals: farmerData.dairyAvailableMinerals || [],
        quantityKgPerCowPerDay: parseFloat(farmerData.dairyQuantityToMix) || 0,
        country: country,
        customPrices: farmerData.customPrices || {},
      });

      const formattedTotal = formatCurrency(result.totalCostPerDay, country, currencySymbol);
      const ingredientLines = result.ingredients.map(ing => {
        const cost = formatCurrency(ing.cost, country, currencySymbol);
        return `• ${ing.name}: ${ing.amountKg.toFixed(2)} kg (${cost})`;
      }).join('\n');

      let content = `🌾 DAIRY TMR FORMULATION\n`;
      content += `• Category: ${farmerData.cowCategory}, BW: ${farmerData.bodyWeightKg} kg, Milk: ${farmerData.dairyMilkYield || 0} L/day\n`;
      content += `• Ingredients:\n${ingredientLines}\n`;
      content += `• Nutritional Summary: DMI ${result.nutritionalSummary.dryMatterKg} kg, CP ${result.nutritionalSummary.cpPercent}%, ME ${result.nutritionalSummary.meMcal} Mcal/kg, NDF ${result.nutritionalSummary.ndfPercent}%, Ca ${result.nutritionalSummary.calciumPercent}%, P ${result.nutritionalSummary.phosphorusPercent}%, Salt ${result.nutritionalSummary.saltPercent}%\n`;
      content += `• Total Daily Cost per Cow: ${formattedTotal}\n`;
      content += `• Mixing Instructions: ${result.mixingInstructions}\n`;
      if (result.warnings.length > 0) {
        content += `⚠️ Warnings: ${result.warnings.join('; ')}\n`;
      }

      addToStructuredList({
        key: 'dairy_feed_formulation',
        params: { content }
      });
    } catch (error: any) {
      addToStructuredList({
        key: 'dairy_feed_formulation',
        params: { content: `⚠️ Feed formulation error: ${error.message}` }
      });
    }
  }

  // ============================================================
  // CONCENTRATE FEED FORMULATION
  // ============================================================
  if (shouldIncludeModule('dairy_concentrate_feed', modules)) {
    try {
      const result = formulateDairyConcentrateFeed({
        cowCategory: farmerData.cowCategory || 'lactating',
        bodyWeightKg: parseFloat(farmerData.bodyWeightKg) || 500,
        milkYieldL: parseFloat(farmerData.dairyMilkYield) || 0,
        milkFatPercent: parseFloat(farmerData.milkFatPercent) || 4.0,
        concentrateBrand: farmerData.dairyConcentrateBrand || '',
        concentrateProduct: farmerData.dairyConcentrateProduct || '',
        forageType: farmerData.dairyForageType || 'napier grass',
        forageKgAsFed: parseFloat(farmerData.dairyForageKgPerDay) || 0,
        maizeKgPerDay: parseFloat(farmerData.dairyConcentrateMaizeKg) || 0,
        saltKgPerDay: parseFloat(farmerData.dairyConcentrateSaltKg) || 0,
        calciumSource: farmerData.dairyConcentrateCalciumSource || 'limestone',
        calciumKgPerDay: parseFloat(farmerData.dairyConcentrateCalciumKg) || 0,
        country: country,
        customPrices: farmerData.customPrices || {},
      });

      const formattedTotal = formatCurrency(result.totalCostPerDay, country, currencySymbol);
      const ingredientLines = result.ingredients.map(ing => {
        const cost = formatCurrency(ing.cost, country, currencySymbol);
        return `• ${ing.name}: ${ing.amountKg.toFixed(2)} kg (${cost})`;
      }).join('\n');

      let content = `🧪 DAIRY CONCENTRATE FORMULATION\n`;
      content += `• Brand: ${farmerData.dairyConcentrateBrand}, Product: ${farmerData.dairyConcentrateProduct}\n`;
      content += `• Forage: ${farmerData.dairyForageType}, ${farmerData.dairyForageKgPerDay} kg/day\n`;
      content += `• Ingredients:\n${ingredientLines}\n`;
      content += `• Nutritional Summary: DMI ${result.totalDMI.toFixed(2)} kg, CP ${result.cpPercent.toFixed(1)}%, ME ${result.meMcal.toFixed(2)} Mcal/kg, NDF ${result.ndfPercent.toFixed(1)}%, Ca ${result.caPercent.toFixed(2)}%, P ${result.pPercent.toFixed(2)}%, Salt ${result.saltPercent.toFixed(2)}%\n`;
      content += `• Total Daily Cost per Cow: ${formattedTotal}\n`;
      content += `• Mixing Instructions: ${result.mixingInstructions}\n`;
      if (result.warnings.length > 0) {
        content += `⚠️ Warnings: ${result.warnings.join('; ')}\n`;
      }

      addToStructuredList({
        key: 'dairy_concentrate_feed',
        params: { content }
      });
    } catch (error: any) {
      addToStructuredList({
        key: 'dairy_concentrate_feed',
        params: { content: `⚠️ Concentrate formulation error: ${error.message}` }
      });
    }
  }

  // ============================================================
  // MILK PRODUCTION ANALYSIS
  // ============================================================
  if (shouldIncludeModule('dairy_milk_production', modules)) {
    const milkYield = parseFloat(farmerData.milkYieldCurrent) || 0;
    const fat = parseFloat(farmerData.milkFatPercent) || 4.0;
    const protein = parseFloat(farmerData.milkProteinPercent) || 3.2;
    const dim = parseInt(farmerData.daysInMilk) || 0;
    const parity = farmerData.parity || '1';

    let content = `🥛 MILK PRODUCTION ANALYSIS\n`;
    content += `• Current yield: ${milkYield} L/day\n`;
    content += `• Fat: ${fat}%, Protein: ${protein}%\n`;
    content += `• Days in milk: ${dim}, Parity: ${parity}\n`;
    // Estimate peak yield based on DIM and parity
    if (dim > 0 && dim < 60) {
      content += `• 🟢 Early lactation – milk yield should be increasing. Expected peak around 60-90 days.\n`;
    } else if (dim >= 60 && dim <= 150) {
      content += `• 🟡 Mid lactation – yield is stable. Monitor for a gradual decline after 150 days.\n`;
    } else if (dim > 150) {
      content += `• 🟠 Late lactation – yield declining. Plan for dry-off around 305 days.\n`;
    }
    if (fat / protein > 1.4) {
      content += `• ⚠️ Fat:protein ratio >1.4 – could indicate energy deficiency. Check ration for adequate energy.\n`;
    } else if (fat / protein < 1.1) {
      content += `• ⚠️ Fat:protein ratio <1.1 – may indicate acidosis or low fibre. Increase fibre in diet.\n`;
    } else {
      content += `• ✅ Fat:protein ratio is balanced.\n`;
    }
    content += `• 📈 To increase yield: ensure adequate DMI, balance ration, and reduce stress.\n`;

    addToStructuredList({
      key: 'dairy_milk_production',
      params: { content }
    });
  }

  // ============================================================
  // DISEASE MANAGEMENT (from dairyHealthMapping)
  // ============================================================
  if (shouldIncludeModule('dairy_disease_management', modules)) {
    const symptoms = farmerData.dairySymptoms || [];
    const mortality = parseInt(farmerData.dairyMortalityCount) || 0;
    const duration = farmerData.dairyHealthDuration || 'Not specified';

    let diseaseMatches: any[] = [];
    if (symptoms.length > 0) {
      const allDiseases = dairyPestDiseaseMap.dairy.filter(item => item.type === 'disease');
      for (const disease of allDiseases) {
        if (disease.symptoms && disease.symptoms.some(s => symptoms.includes(s))) {
          diseaseMatches.push(disease);
        }
      }
    }

    let content = `🦠 DAIRY DISEASE MANAGEMENT\n`;
    if (diseaseMatches.length === 0) {
      content += `• No specific disease matched from your symptoms. Common dairy diseases:\n`;
      content += `  – Mastitis: swollen udder, milk changes\n`;
      content += `  – Milk fever: recumbent, cold ears\n`;
      content += `  – Ketosis: fruity breath, weight loss\n`;
      content += `  – Foot rot: lameness, swollen feet\n`;
      content += `  – Bloat: distended left side\n`;
      content += `  – Pneumonia: coughing, fever\n`;
      content += `• Consult a vet for accurate diagnosis.\n`;
    } else {
      content += `• Possible disease(s) based on symptoms:\n`;
      diseaseMatches.forEach(d => {
        content += `  – ${d.name} (${d.pathogenType})\n`;
        if (d.chemicalControls && d.chemicalControls.length > 0) {
          content += `    – Chemical control: ${d.chemicalControls[0].productName} (${d.chemicalControls[0].rate})\n`;
        }
        if (d.organicControls && d.organicControls.length > 0) {
          content += `    – Organic: ${d.organicControls[0].method}\n`;
        }
        if (d.culturalControls && d.culturalControls.length > 0) {
          content += `    – Cultural: ${d.culturalControls[0]}\n`;
        }
        if (d.businessNote) {
          content += `    – Business note: ${d.businessNote}\n`;
        }
      });
    }
    if (mortality > 0) {
      content += `• Mortality: ${mortality} cows in last month. ${mortality > 2 ? 'High mortality – urgent vet intervention needed.' : 'Monitor closely.'}\n`;
    }
    content += `• Duration: ${duration}\n`;

    addToStructuredList({
      key: 'dairy_disease_management',
      params: { content }
    });
  }

  // ============================================================
  // PARASITE MANAGEMENT (from dairyHealthMapping)
  // ============================================================
  if (shouldIncludeModule('dairy_parasite_management', modules)) {
    const signs = farmerData.dairyParasiteSigns || [];

    let pestMatches: any[] = [];
    if (signs.length > 0) {
      const allPests = dairyPestDiseaseMap.dairy.filter(item => item.type === 'pest');
      for (const pest of allPests) {
        if (pest.symptoms && pest.symptoms.some(s => signs.includes(s))) {
          pestMatches.push(pest);
        }
      }
    }

    let content = `🐛 DAIRY PARASITE & PEST MANAGEMENT\n`;
    if (pestMatches.length === 0) {
      content += `• No specific parasite matched from your signs.\n`;
      content += `  – External: Ticks, flies, lice, mange mites → use pour-ons, fly tags, maintain hygiene.\n`;
      content += `  – Internal: Roundworms, liver fluke, lungworms → deworm strategically, rotate pastures.\n`;
    } else {
      content += `• Possible parasite(s) based on signs:\n`;
      pestMatches.forEach(p => {
        content += `  – ${p.name}\n`;
        if (p.chemicalControls && p.chemicalControls.length > 0) {
          content += `    – Chemical: ${p.chemicalControls[0].productName}\n`;
        }
        if (p.organicControls && p.organicControls.length > 0) {
          content += `    – Organic: ${p.organicControls[0].method}\n`;
        }
        if (p.culturalControls && p.culturalControls.length > 0) {
          content += `    – Cultural: ${p.culturalControls[0]}\n`;
        }
        if (p.businessNote) {
          content += `    – Business note: ${p.businessNote}\n`;
        }
      });
    }

    addToStructuredList({
      key: 'dairy_parasite_management',
      params: { content }
    });
  }

  // ============================================================
  // DEFICIENCY SYMPTOMS
  // ============================================================
  if (shouldIncludeModule('dairy_deficiency_analysis', modules)) {
    const defSymptoms = farmerData.dairyDeficiencySymptoms || [];
    let content = `🧪 DAIRY DEFICIENCY SYMPTOMS\n`;
    if (defSymptoms.length === 0) {
      content += `• No symptoms reported. Ensure a balanced mineral and vitamin supplement is provided.\n`;
    } else {
      content += `• Reported symptoms: ${defSymptoms.join(', ')}\n`;
      // Map symptoms to deficiencies (simplified)
      const deficiencyMap: Record<string, string> = {
        'stiff_gait': 'Calcium / Phosphorus',
        'poor_appetite': 'Energy / Protein',
        'rough_coat': 'Zinc / Copper',
        'muscle_tremors': 'Selenium / Vitamin E',
        'scours': 'Vitamin A / Zinc',
        'nervous_signs': 'Magnesium',
        'reduced_milk_fat': 'Energy / Acidosis',
        'anaemia': 'Copper / Cobalt / Iron',
        'leg_weakness': 'Calcium / Phosphorus',
        'reproductive_problems': 'Phosphorus / Selenium',
      };
      const matchedDeficiencies = defSymptoms.map((s: string) => deficiencyMap[s]).filter(Boolean);
      if (matchedDeficiencies.length > 0) {
        content += `• Possible deficiencies: ${matchedDeficiencies.join(', ')}\n`;
        content += `• Corrective actions:\n`;
        if (matchedDeficiencies.includes('Calcium')) {
          content += `  – Add limestone or DCP to meet Ca requirement (0.7–0.9% of DM for lactating cows).\n`;
        }
        if (matchedDeficiencies.includes('Phosphorus')) {
          content += `  – Add DCP to meet P requirement (0.4–0.5% of DM for lactating cows).\n`;
        }
        if (matchedDeficiencies.includes('Magnesium')) {
          content += `  – Add magnesium oxide (0.2–0.3% of DM) to prevent grass tetany.\n`;
        }
        if (matchedDeficiencies.includes('Selenium')) {
          content += `  – Add selenium premix (0.2–0.3 ppm) and vitamin E.\n`;
        }
        if (matchedDeficiencies.includes('Zinc')) {
          content += `  – Add zinc sulphate (40–60 ppm) to improve skin and hoof health.\n`;
        }
        if (matchedDeficiencies.includes('Energy')) {
          content += `  – Increase starch/energy in diet (maize, barley) or reduce fibre to improve energy density.\n`;
        }
      } else {
        content += `• No specific deficiency matched. Check feed quality and consult a nutritionist.\n`;
      }
    }

    addToStructuredList({
      key: 'dairy_deficiency_analysis',
      params: { content }
    });
  }

  // ============================================================
  // BREEDING & REPRODUCTION
  // ============================================================
  if (shouldIncludeModule('dairy_breeding', modules)) {
    const daysSinceCalving = parseInt(farmerData.daysSinceCalving) || 0;
    const heatObserved = farmerData.heatObserved;
    const lastInsemination = farmerData.lastInseminationDate || 'Not recorded';
    const breedingMethod = farmerData.breedingMethod || 'Not specified';
    const problems = farmerData.reproductiveProblems || [];

    let content = `🧬 DAIRY BREEDING & REPRODUCTION\n`;
    content += `• Days since last calving: ${daysSinceCalving}\n`;
    content += `• Heat observed: ${heatObserved ? 'Yes' : 'No'}\n`;
    if (daysSinceCalving > 80 && daysSinceCalving < 150) {
      content += `• 🟢 Optimal breeding window: Days 80-150 – consider AI.\n`;
    } else if (daysSinceCalving > 150) {
      content += `• 🟠 Late breeding – consult vet to check for reproductive issues.\n`;
    }
    content += `• Last insemination: ${lastInsemination}\n`;
    content += `• Breeding method: ${breedingMethod}\n`;
    if (problems.includes('repeat_breeding')) {
      content += `• ⚠️ Repeat breeding – check heat detection accuracy, nutrition, and consult vet.\n`;
    }
    if (problems.includes('abortion')) {
      content += `• ⚠️ Abortion history – investigate causes (BVD, Neospora, etc.) and vaccinate.\n`;
    }
    if (problems.includes('retained_placenta')) {
      content += `• ⚠️ Retained placenta – ensure adequate selenium/vitamin E, monitor for metritis.\n`;
    }
    if (problems.length === 0) {
      content += `• ✅ No reproductive problems reported. Maintain good records and biosecurity.\n`;
    }

    addToStructuredList({
      key: 'dairy_breeding',
      params: { content }
    });
  }

  // ============================================================
  // DOS AND DON'TS
  // ============================================================
  if (shouldIncludeModule('dairy_dos_donts', modules)) {
    const focus = farmerData.dairyManagementFocus || [];
    let content = `📋 DAIRY DOS AND DON'TS\n`;
    if (focus.length === 0 || focus.includes('calf_rearing')) {
      content += `🍼 Calf Rearing:\n`;
      content += `  ✅ Do: Ensure colostrum within 6h, feed at 10–12% BW, keep dry and clean.\n`;
      content += `  ❌ Don't: Mix calves of different ages, neglect vaccination.\n`;
    }
    if (focus.length === 0 || focus.includes('feeding')) {
      content += `🌾 Feeding:\n`;
      content += `  ✅ Do: Balance ration for protein, energy, fibre, minerals. Provide fresh water.\n`;
      content += `  ❌ Don't: Make sudden feed changes – transition over 7–10 days.\n`;
    }
    if (focus.length === 0 || focus.includes('housing')) {
      content += `🏠 Housing:\n`;
      content += `  ✅ Do: Provide ≥3m²/cow, good ventilation, dry bedding.\n`;
      content += `  ❌ Don't: Overcrowd – leads to disease and stress.\n`;
    }
    if (focus.length === 0 || focus.includes('milking')) {
      content += `🥛 Milking:\n`;
      content += `  ✅ Do: Use clean equipment, pre-milking teat dip, proper milking technique.\n`;
      content += `  ❌ Don't: Milk dirty udders, over-milk, or use faulty equipment.\n`;
    }
    if (focus.length === 0 || focus.includes('health')) {
      content += `💉 Health:\n`;
      content += `  ✅ Do: Vaccinate, deworm regularly, foot trim, and monitor body condition.\n`;
      content += `  ❌ Don't: Ignore early signs of disease – treat promptly.\n`;
    }
    if (focus.length === 0 || focus.includes('breeding')) {
      content += `🧬 Breeding:\n`;
      content += `  ✅ Do: Detect heat accurately, use AI from proven sires, calve by 24 months for heifers.\n`;
      content += `  ❌ Don't: Breed heifers too young or cows too late – aim for 365-day calving interval.\n`;
    }

    addToStructuredList({
      key: 'dairy_dos_donts',
      params: { content }
    });
  }

  // ============================================================
  // FINANCIAL ANALYSIS
  // ============================================================
  if (shouldIncludeModule('dairy_financial', modules)) {
    const feedCost = parseFloat(farmerData.dairyFeedCostPerDay) || 0;
    const milkPrice = parseFloat(farmerData.dairyMilkPrice) || 0;
    const vetCost = parseFloat(farmerData.dairyVetCostMonth) || 0;
    const otherCosts = parseFloat(farmerData.dairyOtherCosts) || 0;
    const milkYield = parseFloat(farmerData.milkYieldCurrent) || 0;

    let content = `💰 DAIRY FINANCIAL ANALYSIS\n`;
    const dailyFeed = feedCost;
    const monthlyFeed = dailyFeed * 30;
    const monthlyVet = vetCost;
    const monthlyOther = otherCosts;
    const totalMonthlyCost = monthlyFeed + monthlyVet + monthlyOther;
    const monthlyRevenue = milkYield * milkPrice * 30;
    const monthlyProfit = monthlyRevenue - totalMonthlyCost;

    content += `• Feed cost per cow per day: ${formatCurrency(dailyFeed, country, currencySymbol)}\n`;
    content += `• Monthly feed cost: ${formatCurrency(monthlyFeed, country, currencySymbol)}\n`;
    content += `• Monthly vet cost: ${formatCurrency(monthlyVet, country, currencySymbol)}\n`;
    content += `• Monthly other costs: ${formatCurrency(monthlyOther, country, currencySymbol)}\n`;
    content += `• Total monthly cost: ${formatCurrency(totalMonthlyCost, country, currencySymbol)}\n`;
    content += `• Monthly revenue (milk): ${formatCurrency(monthlyRevenue, country, currencySymbol)}\n`;
    content += `• Monthly profit: ${formatCurrency(monthlyProfit, country, currencySymbol)}\n`;
    if (monthlyProfit < 0) {
      content += `⚠️ You are making a loss. Consider improving milk yield or reducing feed cost.\n`;
    } else {
      content += `✅ You are profitable. Keep monitoring costs and production.\n`;
    }
    const costPerLitre = milkYield > 0 ? dailyFeed / milkYield : 0;
    content += `• Cost per litre: ${formatCurrency(costPerLitre, country, currencySymbol)}\n`;

    addToStructuredList({
      key: 'dairy_financial',
      params: { content }
    });
  }

  // ============================================================
  // BUSINESS TIPS
  // ============================================================
  if (shouldIncludeModule('dairy_business_tip', modules)) {
    const interests = farmerData.dairyBusinessInterest || [];
    let content = `📈 DAIRY BUSINESS TIPS\n`;
    if (interests.length === 0) {
      content += `• Bulk buying of feed and minerals saves 15–20%.\n`;
      content += `• Join a cooperative for better milk prices.\n`;
      content += `• Add value: make yoghurt, cheese, or butter.\n`;
      content += `• Scale gradually – reinvest profits.\n`;
    } else {
      interests.forEach((topic: string) => {
        if (topic === 'bulk_buying') {
          content += `• Bulk buying: Form a group with neighbours to buy feed, minerals, and vaccines. Save 15–25%.\n`;
        } else if (topic === 'cooperative') {
          content += `• Cooperative: Sell milk together to get better prices – avoid middlemen.\n`;
        } else if (topic === 'value_addition') {
          content += `• Value addition: Process milk into yoghurt, cheese, butter, or ghee – sells at higher price.\n`;
        } else if (topic === 'scaling') {
          content += `• Scaling: Reinvest profits to increase herd size gradually. Start with 20% increase per year.\n`;
        } else if (topic === 'cost_reduction') {
          content += `• Cost reduction: Improve feed efficiency, reduce waste, and use alternative protein sources.\n`;
        }
      });
    }

    addToStructuredList({
      key: 'dairy_business_tip',
      params: { content }
    });
  }

  // ============================================================
  // REMINDER
  // ============================================================
  if (shouldIncludeModule('dairy_reminder', modules)) {
    const deworming = farmerData.dairyLastDeworming || 'Not recorded';
    const hoof = farmerData.dairyLastHoofTrimming || 'Not recorded';
    const vacc = farmerData.dairyLastVaccination || 'Not recorded';
    const nextVacc = farmerData.dairyNextVaccinationDue || 'Not recorded';

    let content = `🔔 DAIRY REMINDERS\n`;
    content += `• Deworming: ${deworming} – next due in 3 months.\n`;
    content += `• Hoof trimming: ${hoof} – trim every 6 months.\n`;
    content += `• Vaccination: ${vacc} – next due ${nextVacc}.\n`;
    content += `• Weekly: check feed quality, water, cow condition, and udder health.\n`;
    content += `• Biosecurity: limit visitors, disinfect equipment, quarantine new animals.\n`;

    addToStructuredList({
      key: 'dairy_reminder',
      params: { content }
    });
  }

  // ============================================================
  // BUILD OUTPUT
  // ============================================================
  const list = structuredList.map(item => item.params?.content || '').filter(c => c);
  const financialAdvice = isSwahili ? "Angalia uchambuzi wa kifedha hapo juu." : isFrench ? "Voyez l'analyse financière ci-dessus." : isSpanish ? "Vea el análisis financiero arriba." : "See financial analysis above.";
  const structuredFinancialAdvice = { key: 'financial_advice', params: { content: financialAdvice } };

  return {
    list,
    structuredList,
    financialAdvice,
    structuredFinancialAdvice,
  };
}