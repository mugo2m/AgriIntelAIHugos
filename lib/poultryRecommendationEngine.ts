// lib/poultryRecommendationEngine.ts
// POULTRY RECOMMENDATION ENGINE
// Generates poultry-specific recommendations based on farmer inputs and modules filter.

import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';
import { poultryPestDiseaseMap } from '@/lib/data/poultryHealthMapping';
import { formulateFeed } from '@/lib/feedFormulation';
import { formulateWithConcentrate } from '@/lib/poultryFeedConcentrate';

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
  'poultry_brooding_guide': 'poultry_brooding_guide',
  'poultry_housing': 'poultry_housing',
  'poultry_feed_per_day': 'poultry_feed_per_day',
  'poultry_feed_formulation': 'poultry_feed_formulation',
  'poultry_concentrate_feed': 'poultry_concentrate_feed',
  'poultry_vaccination': 'poultry_vaccination',
  'poultry_disease_management': 'poultry_disease_management',
  'poultry_pest_management': 'poultry_pest_management',
  'poultry_deficiency_analysis': 'poultry_deficiency_analysis',
  'poultry_dos_donts': 'poultry_dos_donts',
  'poultry_financial': 'poultry_financial',
  'poultry_business_tip': 'poultry_business_tip',
  'poultry_reminder': 'poultry_reminder',
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
export async function generatePoultryRecommendations(params: {
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
  // CONFIDENCE – Poultry-specific
  // ============================================================
  if (shouldIncludeModule('confidence', modules)) {
    let confidenceLabel = '';
    const poultryType = farmerData.poultryType;
    const flockSize = farmerData.flockSize;
    const breed = farmerData.breed;
    const ageWeeks = farmerData.ageWeeks;

    // Check if all key fields are present
    const hasAll = poultryType && flockSize && breed && ageWeeks;
    const hasPartial = poultryType && flockSize;

    if (hasAll) {
      confidenceLabel = isSwahili ? '🟢 IMANI: Juu (taarifa zote muhimu zipo)' :
                        isFrench ? '🟢 CONFIANCE: Élevée (toutes les informations essentielles sont disponibles)' :
                        isSpanish ? '🟢 CONFIANZA: Alta (toda la información clave está presente)' :
                        '🟢 Confidence: High (all key information provided)';
    } else if (hasPartial) {
      confidenceLabel = isSwahili ? '🟡 IMANI: Wastani (taarifa zingine hazipo)' :
                        isFrench ? '🟡 CONFIANCE: Moyenne (certaines informations manquent)' :
                        isSpanish ? '🟡 CONFIANZA: Media (falta alguna información)' :
                        '🟡 Confidence: Medium (some information missing)';
    } else {
      confidenceLabel = isSwahili ? '🟠 IMANI: Chini (taarifa chache sana)' :
                        isFrench ? '🟠 CONFIANCE: Faible (très peu d\'informations)' :
                        isSpanish ? '🟠 CONFIANZA: Baja (información mínima)' :
                        '🟠 Confidence: Low (minimal information)';
    }
    addToStructuredList({ key: 'confidence', params: { content: confidenceLabel } });
  }

  // ============================================================
  // BROODING GUIDE
  // ============================================================
  if (shouldIncludeModule('poultry_brooding_guide', modules)) {
    const week = parseInt(farmerData.broodingWeek) || 1;
    const temp = parseInt(farmerData.brooderTemperature) || 0;
    const litter = farmerData.litterType || 'Not specified';
    const behaviour = farmerData.chickBehaviour || 'Not observed';
    const vaccinations = farmerData.vaccinationDone || [];
    const mortality = parseInt(farmerData.mortalityCount) || 0;

    let content = `🐣 BROODING GUIDE – Week ${week}\n`;

    const targetTemp = 35 - (week - 1) * 2.5;
    if (temp > 0) {
      if (temp > targetTemp + 2) {
        content += `• 🌡️ Temperature is ${temp}°C – this is too high. Reduce to ${targetTemp}°C. Chicks pant and spread out when too hot.\n`;
      } else if (temp < targetTemp - 2) {
        content += `• 🌡️ Temperature is ${temp}°C – this is too low. Increase to ${targetTemp}°C. Chicks huddle when too cold.\n`;
      } else {
        content += `• 🌡️ Temperature is ${temp}°C – this is good for Week ${week}. Continue maintaining this range.\n`;
      }
    } else {
      content += `• 🌡️ Target temperature for Week ${week} is ${targetTemp}°C. Reduce by 2–3°C each week from 35°C at Week 1.\n`;
    }

    if (behaviour === 'Huddling together') {
      content += `• 🐥 Chicks are huddling – they are too cold. Raise the heat source or lower the brooder guard.\n`;
    } else if (behaviour === 'Panting/spreading out') {
      content += `• 🐥 Chicks are panting and spreading out – they are too hot. Raise the heat source or increase ventilation.\n`;
    } else if (behaviour === 'Active and spread evenly') {
      content += `• 🐥 Chicks are active and spread evenly – ideal conditions. Keep up the good work!\n`;
    } else if (behaviour === 'Lethargic') {
      content += `• 🐥 Chicks are lethargic – this could indicate illness or poor brooding conditions. Check temperature, feed, and water. Consult a vet if needed.\n`;
    }

    if (litter === 'None') {
      content += `• 🧹 No litter reported. Use 5–10cm of dry, absorbent litter (wood shavings or rice hulls) to prevent coccidiosis and ammonia burns.\n`;
    } else {
      content += `• 🧹 Litter: ${litter}. Keep it dry – wet litter causes disease. Stir daily, replace wet spots immediately.\n`;
    }

    if (week <= 1) {
      content += `• 💡 Week 1: Provide 23–24 hours of bright light to encourage eating and drinking.\n`;
    } else if (week <= 3) {
      content += `• 💡 Weeks 2–3: Reduce to 18 hours of light per day.\n`;
    } else {
      content += `• 💡 Week ${week}: Reduce gradually to 12 hours (natural day length). Gradual changes reduce stress.\n`;
    }

    if (week <= 2) {
      content += `• 📏 Provide 0.5 sq.ft per chick. Use a circular brooder guard to keep chicks near heat and feed.\n`;
    } else {
      content += `• 📏 Provide 1 sq.ft per chick. Expand the brooder guard as chicks grow.\n`;
    }

    content += `• 💉 Vaccination status:\n`;
    if (vaccinations.length === 0 || vaccinations.includes('None yet')) {
      content += `  – No vaccinations recorded. Schedule: Day 1 Marek's, Week 1 Newcastle+IB, Week 2 Gumboro.\n`;
    } else {
      vaccinations.forEach((v: string) => {
        content += `  – ✅ ${v} done.\n`;
      });
      if (!vaccinations.includes('Newcastle + IB (Week 1)') && week >= 1) {
        content += `  – ⚠️ Newcastle + IB is due at Week 1 (Day 7–10).\n`;
      }
      if (!vaccinations.includes('Gumboro (Week 2)') && week >= 2) {
        content += `  – ⚠️ Gumboro is due at Week 2 (Day 14).\n`;
      }
    }

    if (mortality > 0) {
      content += `• ⚠️ You reported ${mortality} deaths. Investigate causes – check temperature, litter, feed, and water quality. Consult a vet if mortality exceeds 5%.\n`;
    }

    content += `• 🧼 Clean and disinfect the brooder house 7 days before the next batch arrives. Pre‑heat to 35°C 24 hours before placement.\n`;

    addToStructuredList({
      key: 'poultry_brooding_guide',
      params: { content }
    });
  }

  // ============================================================
  // HOUSING
  // ============================================================
  if (shouldIncludeModule('poultry_housing', modules)) {
    const housingType = farmerData.housingType || 'Not specified';
    const floorSpaceM2 = parseFloat(farmerData.floorSpaceM2) || 0;
    const ventilation = farmerData.ventilationRating || 'Not rated';
    const roofType = farmerData.roofType || 'Not specified';
    const drainage = farmerData.drainageRating || 'Not rated';
    const predatorRisk = farmerData.predatorRisk || 'Not specified';

    let content = `🏠 POULTRY HOUSING MANAGEMENT\n`;
    content += `• Housing type: ${housingType}\n`;
    if (floorSpaceM2 > 0) {
      const birds = parseInt(farmerData.flockSize) || 50;
      const spacePerBird = floorSpaceM2 / birds;
      content += `• Floor space: ${floorSpaceM2} m² total – ${spacePerBird.toFixed(2)} m² per bird.\n`;
      if (housingType === 'Deep litter') {
        if (spacePerBird < 0.07) {
          content += `  – ⚠️ Space is too low for deep litter (need >0.07 m²/bird). Consider reducing flock size.\n`;
        } else {
          content += `  – ✅ Space is adequate for deep litter.\n`;
        }
      } else if (housingType === 'Battery cage') {
        if (spacePerBird < 0.05) {
          content += `  – ⚠️ Cage space should be >0.05 m²/bird for layers.\n`;
        }
      }
    }
    content += `• Ventilation: ${ventilation}. ${ventilation === 'Poor' ? 'Improve air flow – open windows, use fans.' : 'Good ventilation helps reduce disease.'}\n`;
    content += `• Roof: ${roofType}. ${roofType === 'Iron sheets' ? 'Add insulation to reduce heat stress.' : ''}\n`;
    content += `• Drainage: ${drainage}. ${drainage === 'Poor' ? 'Improve drainage – dig trenches, raise foundation.' : 'Good drainage keeps litter dry.'}\n`;
    content += `• Predator risk: ${predatorRisk}. ${predatorRisk === 'High' ? 'Reinforce wire mesh, seal all gaps, use lighting.' : 'Regular checks still needed.'}\n`;
    content += `• 📅 Weekly: Check for holes, leaks, and ammonia smell. Clean feeders and drinkers.\n`;

    addToStructuredList({
      key: 'poultry_housing',
      params: { content }
    });
  }

  // ============================================================
  // FEED PER DAY
  // ============================================================
  if (shouldIncludeModule('poultry_feed_per_day', modules)) {
    const birds = parseInt(farmerData.flockSize) || 0;
    const dailyFeedPerBird = parseFloat(farmerData.dailyFeedPerBird) || 0;
    const feedCostPerKg = parseFloat(farmerData.feedCostPerKg) || 0;
    const waste = farmerData.feedWasteEstimate || 'medium';

    let content = `⚖️ FEED PER DAY\n`;
    if (birds > 0 && dailyFeedPerBird > 0) {
      const totalDaily = (birds * dailyFeedPerBird) / 1000; // kg
      const monthly = totalDaily * 30;
      const costPerDay = totalDaily * feedCostPerKg;
      const costPerMonth = monthly * feedCostPerKg;

      content += `• Birds: ${birds}, Daily feed per bird: ${dailyFeedPerBird}g.\n`;
      content += `• Total daily feed: ${totalDaily.toFixed(2)} kg.\n`;
      content += `• Monthly feed: ${monthly.toFixed(2)} kg.\n`;
      content += `• Daily feed cost: ${formatCurrency(costPerDay, country, currencySymbol)}.\n`;
      content += `• Monthly feed cost: ${formatCurrency(costPerMonth, country, currencySymbol)}.\n`;
      if (waste === 'high') {
        content += `⚠️ You reported high feed waste. Use feeders with rims, adjust height, avoid overfilling.\n`;
      } else if (waste === 'medium') {
        content += `🔄 Medium waste – reduce spillage by checking feeder design.\n`;
      } else {
        content += `✅ Low waste – good management!\n`;
      }
    } else {
      content += `• Enter flock size and daily feed per bird to calculate consumption.\n`;
    }

    addToStructuredList({
      key: 'poultry_feed_per_day',
      params: { content }
    });
  }

  // ============================================================
  // FEED FORMULATION (Home-mix)
  // ============================================================
  if (shouldIncludeModule('poultry_feed_formulation', modules)) {
    try {
      const result = formulateFeed({
        breed: farmerData.breed || 'broiler',
        stage: farmerData.stage || 'starter',
        quantityKg: parseFloat(farmerData.quantityKg) || 100,
        includeCoccidiostat: farmerData.includeCoccidiostat === true,
        availableIngredients: farmerData.availableIngredients || [],
        country: country,
        ingredientPrices: farmerData.customPrices || {},
      });
      const formattedTotal = formatCurrency(result.totalCost, country, currencySymbol);
      const ingredientLines = result.ingredients.map(ing => {
        const cost = formatCurrency(ing.cost, country, currencySymbol);
        return `• ${ing.name}: ${ing.amountKg.toFixed(2)} kg (${cost})`;
      }).join('\n');

      let content = `🌾 HOME-MIX FEED FORMULATION\n`;
      content += `• Breed: ${farmerData.breed}, Stage: ${farmerData.stage}, Batch: ${farmerData.quantityKg} kg\n`;
      content += `• Ingredients:\n${ingredientLines}\n`;
      content += `• Nutritional Summary: Protein ~${result.nutritionalSummary.protein}%, Calcium ~${result.nutritionalSummary.calcium}%, Energy ~${result.nutritionalSummary.energy} kcal/kg\n`;
      content += `• Total Cost: ${formattedTotal}\n`;
      content += `• Mixing Instructions: ${result.mixingInstructions}\n`;
      if (result.warnings.length > 0) {
        content += `⚠️ Warnings: ${result.warnings.join('; ')}\n`;
      }

      addToStructuredList({
        key: 'poultry_feed_formulation',
        params: { content }
      });
    } catch (error: any) {
      addToStructuredList({
        key: 'poultry_feed_formulation',
        params: { content: `⚠️ Feed formulation error: ${error.message}` }
      });
    }
  }

  // ============================================================
  // CONCENTRATE FEED FORMULATION
  // ============================================================
  if (shouldIncludeModule('poultry_concentrate_feed', modules)) {
    try {
      const result = formulateWithConcentrate({
        breed: farmerData.breed || 'broiler',
        stage: farmerData.stage || 'starter',
        quantityKg: parseFloat(farmerData.quantityKg) || 100,
        concentrateBrand: farmerData.concentrateBrand || '',
        concentrateProduct: farmerData.concentrateProduct || '',
        inclusionRate: farmerData.inclusionRate ? parseFloat(farmerData.inclusionRate) : undefined,
        concentrateProtein: farmerData.concentrateProtein ? parseFloat(farmerData.concentrateProtein) : undefined,
        farmerIngredients: {
          maizeKg: parseFloat(farmerData.maizeKg) || 0,
          saltKg: parseFloat(farmerData.saltKg) || 0,
          calciumSource: farmerData.calciumSource || 'limestone',
          calciumKg: parseFloat(farmerData.calciumKg) || 0,
          otherIngredients: [],
        },
        country: country,
        customPrices: farmerData.customPrices || {},
      });

      const formattedTotal = formatCurrency(result.totalCost, country, currencySymbol);
      const ingredientLines = result.ingredients.map(ing => {
        const cost = formatCurrency(ing.cost, country, currencySymbol);
        return `• ${ing.name}: ${ing.amountKg.toFixed(2)} kg (${cost})`;
      }).join('\n');

      let content = `🧪 CONCENTRATE FEED FORMULATION\n`;
      content += `• Brand: ${farmerData.concentrateBrand}, Product: ${farmerData.concentrateProduct}, Batch: ${farmerData.quantityKg} kg\n`;
      content += `• Ingredients:\n${ingredientLines}\n`;
      content += `• Nutritional Summary: Protein ~${result.nutritionalSummary.protein}%, Calcium ~${result.nutritionalSummary.calcium}%, Energy ~${result.nutritionalSummary.energy} kcal/kg\n`;
      content += `• Total Cost: ${formattedTotal}\n`;
      if (result.warnings.length > 0) {
        content += `⚠️ Warnings: ${result.warnings.join('; ')}\n`;
      }

      addToStructuredList({
        key: 'poultry_concentrate_feed',
        params: { content }
      });
    } catch (error: any) {
      addToStructuredList({
        key: 'poultry_concentrate_feed',
        params: { content: `⚠️ Concentrate formulation error: ${error.message}` }
      });
    }
  }

  // ============================================================
  // VACCINATION MANAGEMENT
  // ============================================================
  if (shouldIncludeModule('poultry_vaccination', modules)) {
    const vaccinations = farmerData.vaccinationType || [];
    const lastVaccination = farmerData.lastVaccinationDate || 'Not recorded';
    const cost = parseFloat(farmerData.vaccinationCost) || 0;

    let content = `💉 VACCINATION MANAGEMENT\n`;
    content += `• Vaccinations recorded:\n`;
    if (vaccinations.length === 0) {
      content += `  – None recorded. Follow the standard schedule: Day 1 Marek's, Week 1 Newcastle+IB, Week 2 Gumboro, Week 3 Newcastle booster, Week 4 Fowl Pox (if high-risk), Week 8 Fowl Typhoid, Week 16 EDS for layers.\n`;
    } else {
      vaccinations.forEach((v: string) => {
        content += `  – ✅ ${v}\n`;
      });
    }
    content += `• Last vaccination: ${lastVaccination}\n`;
    if (cost > 0) {
      content += `• Total vaccination cost: ${formatCurrency(cost, country, currencySymbol)}\n`;
    }
    content += `• Cold chain: Keep vaccines between 2–8°C. Do not freeze. Protect from light.\n`;
    content += `• Reminder: Never vaccinate sick birds – treat first, then vaccinate after recovery.\n`;

    addToStructuredList({
      key: 'poultry_vaccination',
      params: { content }
    });
  }

  // ============================================================
  // DISEASE MANAGEMENT (from poultryHealthMapping)
  // ============================================================
  if (shouldIncludeModule('poultry_disease_management', modules)) {
    const symptoms = farmerData.symptomsObserved || [];
    const mortality = parseInt(farmerData.mortalityCountDisease) || 0;
    const duration = farmerData.diseaseDuration || 'Not specified';

    let diseaseMatches: any[] = [];
    if (symptoms.length > 0) {
      const allDiseases = poultryPestDiseaseMap.poultry.filter(item => item.type === 'disease');
      for (const disease of allDiseases) {
        if (disease.symptoms && disease.symptoms.some(s => symptoms.includes(s))) {
          diseaseMatches.push(disease);
        }
      }
    }

    let content = `🦠 DISEASE MANAGEMENT\n`;
    if (diseaseMatches.length === 0) {
      content += `• No specific disease matched from your symptoms. Common diseases:\n`;
      content += `  – Newcastle: green diarrhoea, paralysis, death\n`;
      content += `  – Gumboro: chocolate diarrhoea, piling, death\n`;
      content += `  – Fowl Typhoid: yellowish diarrhoea, drop in eggs\n`;
      content += `  – Coccidiosis: bloody diarrhoea, stunted growth\n`;
      content += `  – Infectious Bronchitis: respiratory distress, egg drop\n`;
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
      content += `• Mortality: ${mortality} birds in last 7 days. ${mortality > 5 ? 'High mortality – urgent vet intervention needed.' : 'Monitor closely.'}\n`;
    }
    content += `• Duration: ${duration}\n`;

    addToStructuredList({
      key: 'poultry_disease_management',
      params: { content }
    });
  }

  // ============================================================
  // PEST MANAGEMENT (from poultryHealthMapping)
  // ============================================================
  if (shouldIncludeModule('poultry_pest_management', modules)) {
    const signs = farmerData.pestSignsObserved || [];

    let pestMatches: any[] = [];
    if (signs.length > 0) {
      const allPests = poultryPestDiseaseMap.poultry.filter(item => item.type === 'pest');
      for (const pest of allPests) {
        if (pest.signs && pest.signs.some(s => signs.includes(s))) {
          pestMatches.push(pest);
        }
      }
    }

    let content = `🐛 PEST MANAGEMENT\n`;
    if (pestMatches.length === 0) {
      content += `• No specific pest matched from your signs.\n`;
      content += `  – External: Red mite, Lice, Fleas, Mites → check skin/feathers, use ash/diatomaceous earth.\n`;
      content += `  – Internal: Roundworm, Tapeworm, Cecal worm → deworm every 3 months.\n`;
    } else {
      content += `• Possible pest(s) based on signs:\n`;
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
      key: 'poultry_pest_management',
      params: { content }
    });
  }

  // ============================================================
  // DEFICIENCY SYMPTOMS
  // ============================================================
  if (shouldIncludeModule('poultry_deficiency_analysis', modules)) {
    const defSymptoms = farmerData.deficiencySymptoms || [];
    const feedType = farmerData.currentFeedTypeDef || 'Not specified';
    const duration = farmerData.symptomDurationDef || 'Not specified';

    let content = `🧪 DEFICIENCY SYMPTOMS\n`;
    if (defSymptoms.length === 0) {
      content += `• No symptoms reported. Ensure your feed is balanced for your birds' stage.\n`;
      content += `  – Starter (0–4w): 22% protein, 1% Ca\n`;
      content += `  – Grower (4–8w): 18% protein, 1.2% Ca\n`;
      content += `  – Layer (18+w): 17% protein, 3.8% Ca\n`;
    } else {
      content += `• Reported symptoms: ${defSymptoms.join(', ')}\n`;
      const deficiencyMap: Record<string, string> = {
        'stunted_growth': 'Protein / Lysine / Methionine',
        'poor_feathering': 'Methionine / Zinc',
        'feather_pecking': 'Lysine / Salt',
        'thin_eggs': 'Calcium / Phosphorus / Vitamin D',
        'leg_weakness': 'Calcium / Phosphorus / Manganese',
        'perosis': 'Manganese',
        'scaly_skin': 'Zinc',
        'fluid_under_skin': 'Selenium / Vitamin E',
        'ruffled_feathers': 'Arginine / Protein',
        'curled_toes': 'Riboflavin (Vitamin B2)',
        'twisted_neck': 'Vitamin B1 (Thiamine)',
      };
      const matchedDeficiencies = defSymptoms.map((s: string) => deficiencyMap[s]).filter(Boolean);
      if (matchedDeficiencies.length > 0) {
        content += `• Possible deficiencies: ${matchedDeficiencies.join(', ')}\n`;
        content += `• Corrective actions:\n`;
        if (matchedDeficiencies.includes('Calcium')) {
          content += `  – Add oyster shell or limestone (3.5–4% of feed for layers).\n`;
        }
        if (matchedDeficiencies.includes('Methionine') || matchedDeficiencies.includes('Lysine')) {
          content += `  – Add synthetic lysine/methionine or increase soybean meal/fishmeal.\n`;
        }
        if (matchedDeficiencies.includes('Salt')) {
          content += `  – Add salt at 0.3–0.5% of feed.\n`;
        }
        if (matchedDeficiencies.includes('Selenium')) {
          content += `  – Add selenium premix (0.2–0.3g per 100kg feed).\n`;
        }
        if (matchedDeficiencies.includes('Zinc')) {
          content += `  – Add zinc oxide/sulphate (40–60g per 100kg feed).\n`;
        }
      } else {
        content += `• No specific deficiency matched. Check feed quality and consult a nutritionist.\n`;
      }
    }
    content += `• Feed type: ${feedType}\n`;
    content += `• Symptom duration: ${duration}\n`;

    addToStructuredList({
      key: 'poultry_deficiency_analysis',
      params: { content }
    });
  }

  // ============================================================
  // DOS AND DON'TS
  // ============================================================
  if (shouldIncludeModule('poultry_dos_donts', modules)) {
    const focus = farmerData.managementFocus || [];
    let content = `📋 POULTRY DOS AND DON'TS\n`;
    if (focus.length === 0 || focus.includes('brooding')) {
      content += `🐣 Brooding:\n`;
      content += `  ✅ Do: Pre-heat brooder to 35°C 24h before chicks arrive. Keep litter dry.\n`;
      content += `  ❌ Don't: Overcrowd – provide 0.5–1 sq.ft per chick.\n`;
    }
    if (focus.length === 0 || focus.includes('feeding')) {
      content += `🍽️ Feeding:\n`;
      content += `  ✅ Do: Provide fresh water and feed ad libitum. Use feeders with rims.\n`;
      content += `  ❌ Don't: Change feed abruptly – mix old and new over 3 days.\n`;
    }
    if (focus.length === 0 || focus.includes('housing')) {
      content += `🏠 Housing:\n`;
      content += `  ✅ Do: Ensure good ventilation, keep litter dry, clean regularly.\n`;
      content += `  ❌ Don't: Allow ammonia smell – it harms respiratory health.\n`;
    }
    if (focus.length === 0 || focus.includes('health')) {
      content += `💉 Health:\n`;
      content += `  ✅ Do: Vaccinate on schedule, isolate sick birds, practice biosecurity.\n`;
      content += `  ❌ Don't: Vaccinate sick birds – wait until they recover.\n`;
    }
    if (focus.length === 0 || focus.includes('financial')) {
      content += `💰 Financial:\n`;
      content += `  ✅ Do: Buy feed in bulk, keep records, sell at market peak.\n`;
      content += `  ❌ Don't: Ignore feed waste – it eats your profit.\n`;
    }
    if (focus.length === 0 || focus.includes('record_keeping')) {
      content += `📝 Record Keeping:\n`;
      content += `  ✅ Do: Track feed consumption, mortality, egg production daily.\n`;
      content += `  ❌ Don't: Rely on memory – accurate records save money.\n`;
    }

    addToStructuredList({
      key: 'poultry_dos_donts',
      params: { content }
    });
  }

  // ============================================================
  // FINANCIAL ANALYSIS
  // ============================================================
  if (shouldIncludeModule('poultry_financial', modules)) {
    const chickPrice = parseFloat(farmerData.chickPrice) || 0;
    const totalFeedCost = parseFloat(farmerData.totalFeedCost) || 0;
    const medicationCost = parseFloat(farmerData.medicationCost) || 0;
    const salePricePerBird = parseFloat(farmerData.salePricePerBird) || 0;
    const saleWeightKg = parseFloat(farmerData.saleWeightKg) || 0;
    const eggProduction = parseInt(farmerData.eggProduction) || 0;
    const birds = parseInt(farmerData.flockSize) || 0;
    const eggPrice = parseFloat(farmerData.eggPrice) || 10; // default if not provided

    let content = `💰 FINANCIAL ANALYSIS\n`;
    let totalCost = chickPrice * birds + totalFeedCost + medicationCost;
    let revenue = 0;
    if (salePricePerBird > 0 && saleWeightKg > 0) {
      revenue = salePricePerBird * saleWeightKg * birds;
    } else if (salePricePerBird > 0) {
      revenue = salePricePerBird * birds;
    } else if (eggProduction > 0) {
      revenue = eggProduction * eggPrice * 30; // monthly estimate
    }
    const profit = revenue - totalCost;
    const margin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    content += `• Flock size: ${birds}\n`;
    content += `• Chick cost: ${formatCurrency(chickPrice * birds, country, currencySymbol)}\n`;
    content += `• Total feed cost: ${formatCurrency(totalFeedCost, country, currencySymbol)}\n`;
    content += `• Medication cost: ${formatCurrency(medicationCost, country, currencySymbol)}\n`;
    content += `• Total cost: ${formatCurrency(totalCost, country, currencySymbol)}\n`;
    content += `• Revenue: ${formatCurrency(revenue, country, currencySymbol)}\n`;
    content += `• Profit: ${formatCurrency(profit, country, currencySymbol)}\n`;
    content += `• Margin: ${margin.toFixed(1)}%\n`;
    if (profit < 0) {
      content += `⚠️ You are making a loss. Consider reducing feed cost or increasing sale price.\n`;
    } else {
      content += `✅ You are profitable. Keep monitoring costs.\n`;
    }

    addToStructuredList({
      key: 'poultry_financial',
      params: { content }
    });
  }

  // ============================================================
  // BUSINESS TIPS
  // ============================================================
  if (shouldIncludeModule('poultry_business_tip', modules)) {
    const interests = farmerData.businessInterest || [];
    let content = `📈 BUSINESS TIPS\n`;
    if (interests.length === 0) {
      content += `• Bulk buying of feed and supplies saves 15–20%.\n`;
      content += `• Join a cooperative for better market prices.\n`;
      content += `• Add value: process eggs, sell packaged chicken, make sausages.\n`;
      content += `• Scale gradually – reinvest profits.\n`;
    } else {
      interests.forEach((topic: string) => {
        if (topic === 'bulk_buying') {
          content += `• Bulk buying: Form a group with neighbours to buy feed, vaccines, and equipment. Save 15–25%.\n`;
        } else if (topic === 'group_marketing') {
          content += `• Group marketing: Sell together to get better prices – avoid middlemen.\n`;
        } else if (topic === 'value_addition') {
          content += `• Value addition: Process eggs into powder, make smoked chicken, sell marinated portions.\n`;
        } else if (topic === 'scaling') {
          content += `• Scaling: Reinvest profits to increase flock size gradually. Start with 20% increase per cycle.\n`;
        } else if (topic === 'cost_reduction') {
          content += `• Cost reduction: Reduce feed waste by 10% – saves money. Use alternative protein sources like omena.\n`;
        }
      });
    }

    addToStructuredList({
      key: 'poultry_business_tip',
      params: { content }
    });
  }

  // ============================================================
  // REMINDER
  // ============================================================
  if (shouldIncludeModule('poultry_reminder', modules)) {
    const deworming = farmerData.lastDeworming || 'Not recorded';
    const vaccination = farmerData.lastVaccinationDateReminder || 'Not recorded';
    const nextVacc = farmerData.nextVaccinationDue || 'Not recorded';
    const cleaning = farmerData.lastHouseCleaning || 'Not recorded';

    let content = `🔔 REMINDERS\n`;
    content += `• Deworming: ${deworming} – next due in 3 months.\n`;
    content += `• Vaccination: ${vaccination} – next due ${nextVacc}.\n`;
    content += `• House cleaning: ${cleaning} – disinfect before next batch.\n`;
    content += `• Weekly check: feed quality, water cleanliness, bird behaviour.\n`;
    content += `• Biosecurity: footbaths at entrance, limit visitors.\n`;

    addToStructuredList({
      key: 'poultry_reminder',
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