// lib/qaEngine.ts
// 100% LOGIC-BASED Q&A ENGINE - STRUCTURED OUTPUT FOR I18N
// UPDATED: Supports all 219 crops dynamically using data files

import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';
import { cropPestDiseaseMap, PestDisease } from '@/lib/data/pestDiseaseMapping';
import { getPlantingAdvice, getPlantingAdviceText } from '@/lib/data/plantingDates';
import { getCropMaturityPeriod, getCropMaturityRange } from '@/lib/data/cropMaturity';
import { getSpacingOptions } from '@/lib/data/spacing';
import {cropVarieties} from '@/lib/data/varieties'; // Assuming the file exports the object directly
import { getFertilizerRates } from '@/lib/data/fertilizerRates';

interface QaOutput {
  key: string;
  params?: Record<string, any>;
}

// Helper to format currency for display (symbol only) – kept for internal use, not for output
function formatCurrencyForCountry(amount: number, country: string = 'kenya'): string {
  const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
  const formatted = new Intl.NumberFormat(currency.locale, {
    style: 'decimal',
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces
  }).format(amount);
  return currency.position === 'before'
    ? `${currency.symbol} ${formatted}`
    : `${formatted} ${currency.symbol}`;
}

function getCountryFromData(data: any): string {
  return data?.country || 'kenya';
}

function getFarmerName(data: any): string {
  return data?.farmerName || 'Farmer';
}

// Helper to get control methods for a specific pest/disease (unchanged, already dynamic)
function getControlMethods(pestName: string, crop: string, type: 'pest' | 'disease'): string {
  const cropLookupKey = crop.toLowerCase().replace(/\s+/g, '');
  const cropPestsAndDiseases = cropPestDiseaseMap[cropLookupKey] || cropPestDiseaseMap[crop.toLowerCase()] || [];

  const item = cropPestsAndDiseases.find((pd: PestDisease) =>
    pd.type === type && pd.name.toLowerCase().includes(pestName.toLowerCase())
  );

  if (!item) return '';

  let methods = '';

  // Cultural controls
  if (item.culturalControls.length > 0) {
    methods += '  • Cultural: ' + item.culturalControls.slice(0, 2).join('; ') + '\n';
  }

  // Chemical controls
  if (item.chemicalControls.length > 0) {
    const chem = item.chemicalControls[0];
    methods += `  • Chemical: ${chem.productName} (${chem.rate}) - ${chem.timing}\n`;
    if (chem.packageSizes) {
      methods += `    Pack sizes: ${chem.packageSizes.join(', ')}\n`;
    }
  }

  // Organic controls
  if (item.organicControls && item.organicControls.length > 0) {
    const organic = item.organicControls[0];
    methods += `  • Organic: ${organic.method}\n`;
  }

  // Business note
  if (item.businessNote) {
    methods += `  💼 ${item.businessNote}\n`;
  }

  return methods;
}

const qaTemplates: Record<string, (data: any, question: string, farmerName: string) => QaOutput> = {
  // Varieties – now uses the cropVarieties lookup
  varieties: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || '';
    const lowerCrop = crop.toLowerCase();
    const county = data?.county || 'your area';
    const farmerVariety = data?.cropVarieties || '';

    // Get the list of varieties for this crop from the central file
    const varietyList = cropVarieties[lowerCrop] || [];

    let varietiesText = '';
    if (varietyList.length > 0) {
      varietiesText = varietyList.slice(0, 8).map(v => `• ${v}`).join('\n');
      if (varietyList.length > 8) {
        varietiesText += `\n• …and ${varietyList.length - 8} more (see your agrovet)`;
      }
    } else {
      varietiesText = '• Many certified varieties are available at your local agrovet.';
    }

    return {
      key: 'qa_varieties_dynamic',
      params: { farmerName, crop, county, farmerVariety, varietiesText }
    };
  },

  // Fertilizer – uses the existing fertilizer plan if available, otherwise generic advice
  fertilizer: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'your crops';
    const lowerCrop = crop.toLowerCase();
    const country = getCountryFromData(data);

    if (data?.soilTest?.fertilizerPlan) {
      const plan = data.soilTest.fertilizerPlan;

      const computeItemCost = (item: any) => {
        const bags = Math.floor(item.amountKg / 50);
        const extraKg = item.amountKg % 50;
        const total = (bags * item.pricePer50kg) + (extraKg * (item.pricePer50kg / 50));
        return formatCurrencyForCountry(total, country);
      };

      const plantingItems = plan.planting?.map((p: any) => ({
        name: p.brand || p.name || 'Unknown',
        amount: p.amountKg,
        bags: Math.ceil(p.amountKg / 50),
        cost: computeItemCost(p),
        provides: p.provides ? Object.entries(p.provides).map(([k, v]) => `${v}kg ${k}`).join(', ') : ''
      })) || [];

      const topdressingItems = plan.topdressing?.map((t: any) => ({
        name: t.brand || t.name || 'Unknown',
        amount: t.amountKg,
        bags: Math.ceil(t.amountKg / 50),
        cost: computeItemCost(t),
        provides: t.provides ? Object.entries(t.provides).map(([k, v]) => `${v}kg ${k}`).join(', ') : ''
      })) || [];

      const totalCost = formatCurrencyForCountry(plan.totalCost || 0, country);

      return {
        key: 'qa_fertilizer_plan',
        params: { farmerName, crop, plantingItems, topdressingItems, totalCost }
      };
    }

    // Generic advice: we can check if the crop has specific fertilizer rates
    const rates = getFertilizerRates(lowerCrop);
    if (rates) {
      const plantingRec = rates.planting?.[0];
      const topdressingRec = rates.topdressing?.[0];
      return {
        key: 'qa_fertilizer_generic_with_data',
        params: {
          farmerName,
          crop,
          plantingFert: plantingRec ? `${plantingRec.name} ${plantingRec.rate}${plantingRec.unit}` : 'None recommended',
          topdressingFert: topdressingRec ? `${topdressingRec.name} ${topdressingRec.rate}${topdressingRec.unit}` : 'None recommended'
        }
      };
    }

    return {
      key: 'qa_fertilizer_generic',
      params: { farmerName, crop }
    };
  },

  // Nutrients – uses the fertilizer plan or returns generic info
  nutrients: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'your crops';
    const lowerCrop = crop.toLowerCase();
    const fertilizerPlan = data?.soilTest?.fertilizerPlan;

    if (fertilizerPlan) {
      const plantingRecs = fertilizerPlan.plantingRecommendations || [];
      const topdressingRecs = fertilizerPlan.topDressingRecommendations || [];

      const nutrientLines = [];

      if (plantingRecs.length > 0) {
        nutrientLines.push(`🌱 ${plantingRecs[0].brand} (${plantingRecs[0].npk}):`);
        if (plantingRecs[0].provides.n > 0) nutrientLines.push(`  • Nitrogen (N): ${plantingRecs[0].provides.n.toFixed(1)} kg`);
        if (plantingRecs[0].provides.p > 0) nutrientLines.push(`  • Phosphorus (P): ${plantingRecs[0].provides.p.toFixed(1)} kg`);
        if (plantingRecs[0].provides.k > 0) nutrientLines.push(`  • Potassium (K): ${plantingRecs[0].provides.k.toFixed(1)} kg`);
        if (plantingRecs[0].provides.s > 0) nutrientLines.push(`  • Sulfur (S): ${plantingRecs[0].provides.s.toFixed(1)} kg`);
        if (plantingRecs[0].provides.ca > 0) nutrientLines.push(`  • Calcium (Ca): ${plantingRecs[0].provides.ca.toFixed(1)} kg`);
        if (plantingRecs[0].provides.mg > 0) nutrientLines.push(`  • Magnesium (Mg): ${plantingRecs[0].provides.mg.toFixed(1)} kg`);
        if (plantingRecs[0].provides.zn > 0) nutrientLines.push(`  • Zinc (Zn): ${plantingRecs[0].provides.zn.toFixed(1)} kg`);
        nutrientLines.push('');
      }

      if (topdressingRecs.length > 0) {
        topdressingRecs.forEach((rec: any) => {
          nutrientLines.push(`🌿 ${rec.brand} (${rec.npk}):`);
          if (rec.provides.n > 0) nutrientLines.push(`  • Nitrogen (N): ${rec.provides.n.toFixed(1)} kg`);
          if (rec.provides.k > 0) nutrientLines.push(`  • Potassium (K): ${rec.provides.k.toFixed(1)} kg`);
          if (rec.provides.s > 0) nutrientLines.push(`  • Sulfur (S): ${rec.provides.s.toFixed(1)} kg`);
          if (rec.provides.ca > 0) nutrientLines.push(`  • Calcium (Ca): ${rec.provides.ca.toFixed(1)} kg`);
          if (rec.provides.mg > 0) nutrientLines.push(`  • Magnesium (Mg): ${rec.provides.mg.toFixed(1)} kg`);
          nutrientLines.push('');
        });
      }

      if (fertilizerPlan.totalNutrientsProvided) {
        const total = fertilizerPlan.totalNutrientsProvided;
        nutrientLines.push(`📊 TOTAL NUTRIENTS PROVIDED:`);
        if (total.n > 0) nutrientLines.push(`  • Nitrogen (N): ${total.n.toFixed(1)} kg`);
        if (total.p > 0) nutrientLines.push(`  • Phosphorus (P): ${total.p.toFixed(1)} kg`);
        if (total.k > 0) nutrientLines.push(`  • Potassium (K): ${total.k.toFixed(1)} kg`);
        if (total.s > 0) nutrientLines.push(`  • Sulfur (S): ${total.s.toFixed(1)} kg`);
        if (total.ca > 0) nutrientLines.push(`  • Calcium (Ca): ${total.ca.toFixed(1)} kg`);
        if (total.mg > 0) nutrientLines.push(`  • Magnesium (Mg): ${total.mg.toFixed(1)} kg`);
        if (total.zn > 0) nutrientLines.push(`  • Zinc (Zn): ${total.zn.toFixed(1)} kg`);
      }

      return {
        key: 'qa_nutrients_personalized',
        params: {
          farmerName,
          crop,
          nutrientList: nutrientLines.join('\n')
        }
      };
    }

    return {
      key: 'qa_nutrients_generic',
      params: { farmerName, crop }
    };
  },

  // Damage – uses reported plantsDamaged
  damage: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const plantsDamaged = data?.plantsDamaged;

    if (plantsDamaged && plantsDamaged > 0) {
      return {
        key: 'qa_damage_with_data',
        params: {
          farmerName,
          crop,
          plantsDamaged,
          advice: "Consider reviewing your pest and disease management strategies to prevent future losses."
        }
      };
    }

    return {
      key: 'qa_damage_generic',
      params: { farmerName, crop }
    };
  },

  // Seed – uses generic seed rate advice, can be extended with crop-specific data
  seed: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'your crops';
    const lowerCrop = crop.toLowerCase();
    const country = getCountryFromData(data);

    // Provide a generic seed rate message; specific crops can be handled if we have a seedRates map.
    // For now, keep the existing key but make it dynamic.
    return {
      key: 'qa_seed_dynamic',
      params: {
        farmerName,
        crop,
        generalAdvice: `For ${crop}, use certified seed. Seed rates vary by variety – consult your local agrovet.`
      }
    };
  },

  // Spacing – uses the spacing.ts data file
  spacing: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const lowerCrop = crop.toLowerCase();

    const spacingInfo = data?.spacingInfo;
    const chosenSpacing = spacingInfo ?
      `${spacingInfo.rowCm}cm x ${spacingInfo.plantCm}cm (${spacingInfo.plantsPerAcre?.toLocaleString() || '?'} plants/acre)` :
      'your chosen spacing';

    // Get all spacing options for this crop from the data file
    const allOptions = getSpacingOptions(lowerCrop);
    let optionsText = '';
    if (allOptions.length > 0) {
      optionsText = allOptions.slice(0, 3).map(opt => `• ${opt.label}: ${opt.description || ''}`).join('\n');
      if (allOptions.length > 3) {
        optionsText += `\n• …and ${allOptions.length - 3} more options`;
      }
    } else {
      optionsText = '• No specific spacing data available – consult local extension.';
    }

    return {
      key: 'qa_spacing_dynamic',
      params: {
        farmerName,
        crop,
        chosenSpacing,
        spacingOptions: optionsText,
        reminder: "For more details on any spacing option, visit the question-answering section."
      }
    };
  },

  // Pest – uses reported pests and pestDiseaseMapping
  pest: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const lowerCrop = crop.toLowerCase();
    const farmerPests = data?.commonPests || [];
    let pestList: string[] = [];

    if (Array.isArray(farmerPests)) {
      pestList = farmerPests;
    } else if (typeof farmerPests === 'string') {
      pestList = farmerPests.split(',').map((p: string) => p.trim()).filter(p => p);
    }

    if (pestList.length === 0) {
      // Provide a generic response with common pests for the crop if available
      const cropKey = lowerCrop.replace(/\s+/g, '');
      const pestsForCrop = (cropPestDiseaseMap[cropKey] || []).filter(pd => pd.type === 'pest').map(pd => pd.name);
      let commonPestsText = '';
      if (pestsForCrop.length > 0) {
        commonPestsText = `Common pests for ${crop} include: ${pestsForCrop.slice(0, 5).join(', ')}.`;
      }
      return {
        key: 'qa_pest_generic',
        params: { farmerName, crop, commonPestsText }
      };
    }

    let controlMethods = '';
    pestList.forEach(pest => {
      const methods = getControlMethods(pest, lowerCrop, 'pest');
      if (methods) {
        controlMethods += `🐛 ${pest}:\n${methods}\n`;
      } else {
        controlMethods += `🐛 ${pest}:\n  • Consult your local agricultural extension for specific control methods.\n\n`;
      }
    });

    return {
      key: 'qa_pest_personalized',
      params: {
        farmerName,
        crop: crop.toUpperCase(),
        pestList: pestList.join(', '),
        controlMethods,
        reminder: "For more details on any specific pest, visit the question-answering section."
      }
    };
  },

  // Disease – similar to pest
  disease: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const lowerCrop = crop.toLowerCase();
    const farmerDiseases = data?.commonDiseases || [];
    let diseaseList: string[] = [];

    if (Array.isArray(farmerDiseases)) {
      diseaseList = farmerDiseases;
    } else if (typeof farmerDiseases === 'string') {
      diseaseList = farmerDiseases.split(',').map((d: string) => d.trim()).filter(d => d);
    }

    if (diseaseList.length === 0) {
      const cropKey = lowerCrop.replace(/\s+/g, '');
      const diseasesForCrop = (cropPestDiseaseMap[cropKey] || []).filter(pd => pd.type === 'disease').map(pd => pd.name);
      let commonDiseasesText = '';
      if (diseasesForCrop.length > 0) {
        commonDiseasesText = `Common diseases for ${crop} include: ${diseasesForCrop.slice(0, 5).join(', ')}.`;
      }
      return {
        key: 'qa_disease_generic',
        params: { farmerName, crop, commonDiseasesText }
      };
    }

    let controlMethods = '';
    diseaseList.forEach(disease => {
      const methods = getControlMethods(disease, lowerCrop, 'disease');
      if (methods) {
        controlMethods += `🦠 ${disease}:\n${methods}\n`;
      } else {
        controlMethods += `🦠 ${disease}:\n  • Consult your local agricultural extension for specific control methods.\n\n`;
      }
    });

    return {
      key: 'qa_disease_personalized',
      params: {
        farmerName,
        crop: crop.toUpperCase(),
        diseaseList: diseaseList.join(', '),
        controlMethods,
        reminder: "For more details on any specific disease, visit the question-answering section."
      }
    };
  },

  // Harvest – uses maturity data
  harvest: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const lowerCrop = crop.toLowerCase();
    const country = getCountryFromData(data);

    const maturityRange = getCropMaturityRange(lowerCrop, country);
    const maturityMin = maturityRange.min;
    const maturityMax = maturityRange.max;
    const typical = maturityRange.typical;

    return {
      key: 'qa_harvest_dynamic',
      params: {
        farmerName,
        crop,
        maturityMin,
        maturityMax,
        typical,
        advice: `Harvest when the crop reaches maturity (${typical} months on average). For precise indicators, refer to the crop guide.`
      }
    };
  },

  // Water – generic water management advice
  water: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    return {
      key: 'qa_water',
      params: { farmerName, crop }
    };
  },

  // Margin – uses grossMarginAnalysis if available
  margin: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'maize';
    const country = getCountryFromData(data);

    if (data?.grossMarginAnalysis) {
      const gm = data.grossMarginAnalysis;
      const revenue = formatCurrencyForCountry(gm.revenue || 0, country);
      const totalCosts = formatCurrencyForCountry(gm.totalCosts || 0, country);
      const grossMargin = formatCurrencyForCountry(gm.grossMargin || 0, country);
      const roi = ((gm.grossMargin || 0) / (gm.totalCosts || 1) * 100).toFixed(1);
      const returnPerInvested = (gm.revenue / gm.totalCosts).toFixed(1);
      const currencySymbol = COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh';

      let roiMessageKey = 'qa_margin_roi_excellent';
      if (Number(roi) <= 50) roiMessageKey = 'qa_margin_roi_low';
      else if (Number(roi) <= 100) roiMessageKey = 'qa_margin_roi_medium';

      return {
        key: 'qa_margin_with_data',
        params: {
          farmerName,
          crop,
          revenue,
          totalCosts,
          grossMargin,
          roi,
          returnPerInvested,
          currencySymbol,
          roiMessageKey
        }
      };
    }

    return { key: 'qa_margin_generic', params: { farmerName } };
  },

  // Business – generic business advice
  business: (data, question, farmerName) => {
    const country = getCountryFromData(data);
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
    const symbol = currency.symbol;
    return {
      key: 'qa_business',
      params: { farmerName, symbol }
    };
  },

  // Planting – uses plantingDates and cropMaturity
  planting: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'crops';
    const lowerCrop = crop.toLowerCase();
    const country = data?.country || 'kenya';
    const region = data?.county || 'your area';
    const plantingDate = data?.plantingDate;

    if (plantingDate) {
      try {
        const advice = getPlantingAdvice(crop, country, region, plantingDate);
        const adviceText = getPlantingAdviceText(crop, country, region, plantingDate);
        const maturityMonths = getCropMaturityPeriod(crop, country);

        return {
          key: 'qa_planting_personalized',
          params: {
            farmerName,
            crop,
            country,
            region,
            plantingDate,
            advice,
            adviceText,
            maturityMonths
          }
        };
      } catch (error) {
        console.error("Error getting planting advice:", error);
      }
    }

    return {
      key: 'qa_planting_generic',
      params: { farmerName, crop }
    };
  },

  // Default – fallback
  default: (data, question, farmerName) => {
    const crop = data?.crops?.[0] || 'your crops';
    const county = data?.county || 'your area';
    const plantsDamaged = data?.plantsDamaged;

    const params: any = { farmerName, question, crop, county };
    if (plantsDamaged && plantsDamaged > 0) {
      params.damageNote = ` You reported ${plantsDamaged} plants damaged beyond recovery.`;
    }

    return {
      key: 'qa_default',
      params
    };
  }
};

// Helper to detect category (unchanged, but keywords expanded for coverage)
function detectCategory(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('variet') || q.includes('varity') ||
      q.includes('which type') || q.includes('what type of seed') ||
      q.includes('what seed') || q.includes('which seed') ||
      q.includes('recommended variety') || q.includes('best variety')) {
    return 'varieties';
  }

  if (q.includes('fertilizer') || q.includes('dap') || q.includes('can') ||
      q.includes('npk') || q.includes('manure') || q.includes('topdress')) {
    return 'fertilizer';
  }

  if (q.includes('nutrient') || q.includes('what nutrients') ||
      q.includes('n p k') || q.includes('what does my fertilizer contain') ||
      q.includes('fertilizer composition') || q.includes('secondary nutrients') ||
      q.includes('sulfur') || q.includes('calcium') || q.includes('magnesium') ||
      q.includes('zinc') || q.includes('boron') || q.includes('micronutrient')) {
    return 'nutrients';
  }

  if (q.includes('damage') || q.includes('plants damaged') ||
      q.includes('lost plants') || q.includes('plants died') ||
      q.includes('beyond recovery') || q.includes('crop loss')) {
    return 'damage';
  }

  if (q.includes('seed rate') || q.includes('how many kg') || q.includes('seed per acre')) {
    return 'seed';
  }

  if (q.includes('spacing') || q.includes('distance') || q.includes('how far')) {
    return 'spacing';
  }

  if (q.includes('pest') || q.includes('insect') || q.includes('worm') ||
      q.includes('borer') || q.includes('armyworm')) {
    return 'pest';
  }

  if (q.includes('disease') || q.includes('blight') || q.includes('rust') ||
      q.includes('virus') || q.includes('smut')) {
    return 'disease';
  }

  if (q.includes('harvest') || q.includes('when to pick') || q.includes('storage')) {
    return 'harvest';
  }

  if (q.includes('water') || q.includes('irrigation') || q.includes('drought')) {
    return 'water';
  }

  if (q.includes('gross margin') || q.includes('profit') || q.includes('revenue') ||
      q.includes('cost') || q.includes('roi')) {
    return 'margin';
  }

  if (q.includes('business') || q.includes('money') || q.includes('invest')) {
    return 'business';
  }

  if (q.includes('plant') || q.includes('when to plant') || q.includes('planting time') ||
      q.includes('sow') || q.includes('sowing') || q.includes('best time to plant')) {
    return 'planting';
  }

  return 'default';
}

export function generateAnswer(question: string, sessionData: any): QaOutput {
  const category = detectCategory(question);
  console.log(`📋 Question category: ${category}`);

  const farmerName = getFarmerName(sessionData);
  const handler = qaTemplates[category] || qaTemplates.default;

  return handler(sessionData, question, farmerName);
}