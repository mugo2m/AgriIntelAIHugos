// lib/fertilizerCalculator.ts
import { SoilTestResults, NutrientRequirement, FertilizerRecommendation, FertilizerBlendResult } from '@/types/soilTest';
import { plantingFertilizers, getPlantingFertilizerById } from './fertilizers/plantingFertilizers';
import { topDressingFertilizers, getTopDressingFertilizerById } from './fertilizers/topDressingFertilizers';
import { soilTestInterpreter } from './soilTestInterpreter';
import { calculatePlantsPerAcre, calculateTotalPlants, calculateFertilizerPerPlant, getMeasurementGuide } from './utils';
import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';

export class FertilizerCalculator {

  // Helper to format currency for DISPLAY (symbol only)
  private formatCurrencyForDisplay(amount: number, country: string = 'kenya'): string {
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;

    const formattedAmount = new Intl.NumberFormat(currency.locale, {
      style: 'decimal',
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(amount);

    return currency.position === 'before'
      ? `${currency.symbol} ${formattedAmount}`
      : `${formattedAmount} ${currency.symbol}`;
  }

  // Helper to format currency for SPEECH (full name)
  private formatCurrencyForSpeech(amount: number, country: string = 'kenya'): string {
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
    return `${currency.name} ${amount.toLocaleString()}`;
  }

  // NEW: Parse nutrient string like "5S+3Mg+2Zn" into nutrient object
  private parseNutrientString(nutrientStr: string): { s: number; ca: number; mg: number; zn: number; b: number; cu: number; mn: number } {
    const result = { s: 0, ca: 0, mg: 0, zn: 0, b: 0, cu: 0, mn: 0 };

    if (!nutrientStr || nutrientStr === "No additional nutrients") return result;

    // Split by '+' and parse each component
    const parts = nutrientStr.split('+');
    parts.forEach(part => {
      const match = part.match(/(\d+)([A-Za-z]+)/);
      if (match) {
        const value = parseFloat(match[1]);
        const nutrient = match[2].toLowerCase();

        if (nutrient === 's') result.s = value;
        else if (nutrient === 'ca') result.ca = value;
        else if (nutrient === 'mg') result.mg = value;
        else if (nutrient === 'zn') result.zn = value;
        else if (nutrient === 'b') result.b = value;
        else if (nutrient === 'cu') result.cu = value;
        else if (nutrient === 'mn') result.mn = value;
      }
    });

    return result;
  }

  // Calculate optimal blend from available fertilizers
  calculateOptimalBlend(
    nutrientNeeds: NutrientRequirement,
    availableFertilizerIds: string[],
    applicationType: 'planting' | 'topdressing',
    costs?: { plantingCost?: number; topdressingCost?: number; potassiumCost?: number }
  ): {
    recommendations: FertilizerRecommendation[];
    remaining: NutrientRequirement;
  } {
    const fertilizerDb = applicationType === 'planting' ? plantingFertilizers : topDressingFertilizers;
    const availableFertilizers = fertilizerDb.filter(f => availableFertilizerIds.includes(f.id));

    let remaining = { ...nutrientNeeds };
    const recommendations: FertilizerRecommendation[] = [];

    if (remaining.p > 0.1) {
      const pFertilizers = availableFertilizers.filter(f => (f.nutrients.p || 0) > 0);

      if (pFertilizers.length > 0) {
        const fert = pFertilizers[0];
        const pNeeded = remaining.p;
        const pPercent = fert.nutrients.p / 100;
        const amountKg = Math.round(pNeeded / pPercent);

        if (amountKg > 0) {
          const providesN = amountKg * (fert.nutrients.n / 100);
          const providesP = amountKg * (fert.nutrients.p / 100);
          const providesK = amountKg * (fert.nutrients.k / 100);

          recommendations.push({
            fertilizerId: fert.id,
            brand: fert.brand,
            company: fert.company,
            npk: fert.npk,
            amountKg,
            packageSizes: fert.packageSizes || ["50kg bag"],
            pricePer50kg: fert.pricePer50kg || 0,
            provides: {
              n: providesN,
              p: providesP,
              k: providesK
            }
          });

          remaining.p = Math.max(0, remaining.p - providesP);
          remaining.n = Math.max(0, remaining.n - providesN);
          remaining.k = Math.max(0, remaining.k - providesK);
        }
      }
    }

    if (remaining.k > 0.1) {
      const kFertilizers = availableFertilizers.filter(f =>
        (f.nutrients.k || 0) > 0 && f.id !== recommendations[0]?.fertilizerId
      );

      if (kFertilizers.length > 0) {
        const fert = kFertilizers[0];
        const kNeeded = remaining.k;
        const kPercent = fert.nutrients.k / 100;
        const amountKg = Math.round(kNeeded / kPercent);

        if (amountKg > 0) {
          const providesN = amountKg * (fert.nutrients.n / 100);
          const providesP = amountKg * (fert.nutrients.p / 100);
          const providesK = amountKg * (fert.nutrients.k / 100);

          recommendations.push({
            fertilizerId: fert.id,
            brand: fert.brand,
            company: fert.company,
            npk: fert.npk,
            amountKg,
            packageSizes: fert.packageSizes || ["50kg bag"],
            pricePer50kg: fert.pricePer50kg || 0,
            provides: {
              n: providesN,
              p: providesP,
              k: providesK
            }
          });

          remaining.k = Math.max(0, remaining.k - providesK);
          remaining.n = Math.max(0, remaining.n - providesN);
          remaining.p = Math.max(0, remaining.p - providesP);
        }
      }
    }

    if (remaining.n > 0.1) {
      const nFertilizers = availableFertilizers.filter(f =>
        (f.nutrients.n || 0) > 0 && f.id !== recommendations[0]?.fertilizerId
      );

      if (nFertilizers.length > 0) {
        const fert = nFertilizers[0];
        const nNeeded = remaining.n;
        const nPercent = fert.nutrients.n / 100;
        const amountKg = Math.round(nNeeded / nPercent);

        if (amountKg > 0) {
          const providesN = amountKg * (fert.nutrients.n / 100);
          const providesP = amountKg * (fert.nutrients.p / 100);
          const providesK = amountKg * (fert.nutrients.k / 100);

          recommendations.push({
            fertilizerId: fert.id,
            brand: fert.brand,
            company: fert.company,
            npk: fert.npk,
            amountKg,
            packageSizes: fert.packageSizes || ["50kg bag"],
            pricePer50kg: fert.pricePer50kg || 0,
            provides: {
              n: providesN,
              p: providesP,
              k: providesK
            }
          });

          remaining.n = Math.max(0, remaining.n - providesN);
          remaining.p = Math.max(0, remaining.p - providesP);
          remaining.k = Math.max(0, remaining.k - providesK);
        }
      }
    }

    const roundRemaining = (val: number) => Math.max(0, Math.round(val * 10) / 10);

    return {
      recommendations,
      remaining: {
        n: roundRemaining(remaining.n),
        p: roundRemaining(remaining.p),
        k: roundRemaining(remaining.k),
        s: roundRemaining(remaining.s),
        ca: roundRemaining(remaining.ca),
        mg: roundRemaining(remaining.mg),
        zn: roundRemaining(remaining.zn),
        b: roundRemaining(remaining.b)
      }
    };
  }

  // Calculate from recommendations - UPDATED to include nutrient details
  calculateFromRecommendations(
    recommendations: {
      targetYield: number;
      plantingFertilizer: string;
      plantingQuantity: number;
      topdressingFertilizer: string;
      topdressingQuantity: number;
      potassiumFertilizer: string;
      potassiumQuantity: number;
      // NEW: Nutrient detail fields
      plantingFertilizerNutrients?: string;
      topdressingFertilizerNutrients?: string;
      potassiumFertilizerNutrients?: string;
    },
    availableFertilizers: {
      planting: string[];
      topdressing: string[];
      potassium: string[];
    },
    costs: {
      plantingCost: number;
      topdressingCost: number;
      potassiumCost: number;
    },
    farmSize: number = 1,
    spacing?: { rowCm: number; plantCm: number; seedsPerHole: number; label: string },
    country: string = 'kenya',
    crop?: string // ADDED: Pass crop name for perennial detection
  ): FertilizerBlendResult & {
    perAcrePlanting?: FertilizerRecommendation[];
    perAcreTopdressing?: FertilizerRecommendation[];
    farmSize?: number;
    perPlant?: any;
  } {

    const nutrientsPerAcre = this.extractNutrientsFromRecommendations(recommendations);

    // NEW: Parse nutrient details
    const plantingNutrients = recommendations.plantingFertilizerNutrients ?
      this.parseNutrientString(recommendations.plantingFertilizerNutrients) : null;
    const topdressingNutrients = recommendations.topdressingFertilizerNutrients ?
      this.parseNutrientString(recommendations.topdressingFertilizerNutrients) : null;
    const potassiumNutrients = recommendations.potassiumFertilizerNutrients ?
      this.parseNutrientString(recommendations.potassiumFertilizerNutrients) : null;

    const plantingFertilizer = plantingFertilizers.find(f => f.id === availableFertilizers.planting[0]);
    const topdressingFertilizer = topDressingFertilizers.find(f => f.id === availableFertilizers.topdressing[0]);
    const potassiumFertilizer = topDressingFertilizers.find(f => f.id === availableFertilizers.potassium[0]);

    let remainingNPerAcre = nutrientsPerAcre.n;
    let remainingPPerAcre = nutrientsPerAcre.p;
    let remainingKPerAcre = nutrientsPerAcre.k;

    // NEW: Track remaining secondary nutrients
    let remainingSPerAcre = nutrientsPerAcre.s || 0;
    let remainingCaPerAcre = nutrientsPerAcre.ca || 0;
    let remainingMgPerAcre = nutrientsPerAcre.mg || 0;
    let remainingZnPerAcre = nutrientsPerAcre.zn || 0;
    let remainingBPerAcre = nutrientsPerAcre.b || 0;

    const plantingRecsPerAcre: FertilizerRecommendation[] = [];
    const topdressingRecsPerAcre: FertilizerRecommendation[] = [];

    // ENSURE PLANTING FERTILIZER IS ALWAYS CALCULATED
    if (plantingFertilizer) {
      // If there's P requirement, use that, otherwise still calculate with whatever P is needed
      const pNeeded = Math.max(remainingPPerAcre, 10); // Minimum 10kg P if none specified
      const pPercent = plantingFertilizer.nutrients.p / 100;
      const plantingAmountPerAcre = Math.round(pNeeded / pPercent);

      if (plantingAmountPerAcre > 0) {
        const providesNPerAcre = plantingAmountPerAcre * (plantingFertilizer.nutrients.n / 100);
        const providesPPerAcre = plantingAmountPerAcre * pPercent;
        const providesKPerAcre = plantingAmountPerAcre * ((plantingFertilizer.nutrients.k || 0) / 100);

        // NEW: Calculate secondary nutrient provision
        const providesSPerAcre = plantingNutrients?.s ?
          (plantingNutrients.s / 100) * plantingAmountPerAcre : 0;
        const providesCaPerAcre = plantingNutrients?.ca ?
          (plantingNutrients.ca / 100) * plantingAmountPerAcre : 0;
        const providesMgPerAcre = plantingNutrients?.mg ?
          (plantingNutrients.mg / 100) * plantingAmountPerAcre : 0;
        const providesZnPerAcre = plantingNutrients?.zn ?
          (plantingNutrients.zn / 100) * plantingAmountPerAcre : 0;

        plantingRecsPerAcre.push({
          fertilizerId: plantingFertilizer.id,
          brand: plantingFertilizer.brand,
          company: plantingFertilizer.company,
          npk: plantingFertilizer.npk,
          amountKg: plantingAmountPerAcre,
          packageSizes: plantingFertilizer.packageSizes || ["50kg bag"],
          pricePer50kg: costs.plantingCost || plantingFertilizer.pricePer50kg || 3500,
          provides: {
            n: providesNPerAcre,
            p: providesPPerAcre,
            k: providesKPerAcre,
            s: providesSPerAcre,
            ca: providesCaPerAcre,
            mg: providesMgPerAcre,
            zn: providesZnPerAcre
          }
        });

        remainingNPerAcre -= providesNPerAcre;
        remainingPPerAcre -= providesPPerAcre;
        remainingKPerAcre -= providesKPerAcre;
        remainingSPerAcre -= providesSPerAcre;
        remainingCaPerAcre -= providesCaPerAcre;
        remainingMgPerAcre -= providesMgPerAcre;
        remainingZnPerAcre -= providesZnPerAcre;
      }
    }

    if (remainingNPerAcre > 0.1 && topdressingFertilizer) {
      const nPercent = topdressingFertilizer.nutrients.n / 100;
      const topdressingAmountPerAcre = Math.round(remainingNPerAcre / nPercent);

      const providesNPerAcre = topdressingAmountPerAcre * nPercent;
      const providesKPerAcre = topdressingAmountPerAcre * ((topdressingFertilizer.nutrients.k || 0) / 100);

      // NEW: Calculate secondary nutrient provision from topdressing
      const providesSPerAcre = topdressingNutrients?.s ?
        (topdressingNutrients.s / 100) * topdressingAmountPerAcre : 0;
      const providesCaPerAcre = topdressingNutrients?.ca ?
        (topdressingNutrients.ca / 100) * topdressingAmountPerAcre : 0;
      const providesMgPerAcre = topdressingNutrients?.mg ?
        (topdressingNutrients.mg / 100) * topdressingAmountPerAcre : 0;

      topdressingRecsPerAcre.push({
        fertilizerId: topdressingFertilizer.id,
        brand: topdressingFertilizer.brand,
        company: topdressingFertilizer.company,
        npk: topdressingFertilizer.npk,
        amountKg: topdressingAmountPerAcre,
        packageSizes: topdressingFertilizer.packageSizes || ["50kg bag"],
        pricePer50kg: costs.topdressingCost || topdressingFertilizer.pricePer50kg || 2800,
        provides: {
          n: providesNPerAcre,
          p: 0,
          k: providesKPerAcre,
          s: providesSPerAcre,
          ca: providesCaPerAcre,
          mg: providesMgPerAcre
        }
      });

      remainingNPerAcre -= providesNPerAcre;
      remainingKPerAcre -= providesKPerAcre;
      remainingSPerAcre -= providesSPerAcre;
      remainingCaPerAcre -= providesCaPerAcre;
      remainingMgPerAcre -= providesMgPerAcre;
    }

    if (potassiumFertilizer && remainingKPerAcre > 0 && availableFertilizers.potassium[0] !== "none") {
      const kPercent = potassiumFertilizer.nutrients.k / 100;
      const potassiumAmountPerAcre = Math.round(remainingKPerAcre / kPercent);

      const providesKPerAcre = potassiumAmountPerAcre * kPercent;

      // NEW: Calculate secondary nutrient provision from potassium fertilizer
      const providesSPerAcre = potassiumNutrients?.s ?
        (potassiumNutrients.s / 100) * potassiumAmountPerAcre : 0;
      const providesMgPerAcre = potassiumNutrients?.mg ?
        (potassiumNutrients.mg / 100) * potassiumAmountPerAcre : 0;

      topdressingRecsPerAcre.push({
        fertilizerId: potassiumFertilizer.id,
        brand: potassiumFertilizer.brand,
        company: potassiumFertilizer.company,
        npk: potassiumFertilizer.npk,
        amountKg: potassiumAmountPerAcre,
        packageSizes: potassiumFertilizer.packageSizes || ["50kg bag"],
        pricePer50kg: costs.potassiumCost || potassiumFertilizer.pricePer50kg || 2800,
        provides: {
          n: 0,
          p: 0,
          k: providesKPerAcre,
          s: providesSPerAcre,
          mg: providesMgPerAcre
        }
      });

      remainingKPerAcre -= providesKPerAcre;
      remainingSPerAcre -= providesSPerAcre;
      remainingMgPerAcre -= providesMgPerAcre;
    }

    const plantingRecs = plantingRecsPerAcre.map(rec => ({
      ...rec,
      amountKg: Math.round(rec.amountKg * farmSize)
    }));

    const topdressingRecs = topdressingRecsPerAcre.map(rec => ({
      ...rec,
      amountKg: Math.round(rec.amountKg * farmSize)
    }));

    const allRecs = [...plantingRecs, ...topdressingRecs];
    const totalCost = allRecs.reduce((sum, rec) => {
      const bagsNeeded = Math.floor(rec.amountKg / 50);
      const extraKg = rec.amountKg % 50;
      const fullBagsCost = bagsNeeded * rec.pricePer50kg;
      const extraKgCost = extraKg * (rec.pricePer50kg / 50);
      return sum + fullBagsCost + extraKgCost;
    }, 0);

    const totalNutrientsProvided = {
      n: nutrientsPerAcre.n * farmSize - Math.max(0, remainingNPerAcre * farmSize),
      p: nutrientsPerAcre.p * farmSize - Math.max(0, remainingPPerAcre * farmSize),
      k: nutrientsPerAcre.k * farmSize - Math.max(0, remainingKPerAcre * farmSize),
      s: nutrientsPerAcre.s ? nutrientsPerAcre.s * farmSize - Math.max(0, remainingSPerAcre * farmSize) : 0,
      ca: nutrientsPerAcre.ca ? nutrientsPerAcre.ca * farmSize - Math.max(0, remainingCaPerAcre * farmSize) : 0,
      mg: nutrientsPerAcre.mg ? nutrientsPerAcre.mg * farmSize - Math.max(0, remainingMgPerAcre * farmSize) : 0,
      zn: nutrientsPerAcre.zn ? nutrientsPerAcre.zn * farmSize - Math.max(0, remainingZnPerAcre * farmSize) : 0,
      b: nutrientsPerAcre.b ? nutrientsPerAcre.b * farmSize - Math.max(0, remainingBPerAcre * farmSize) : 0
    };

    let perPlantInfo = null;
    if (spacing) {
      const plantsPerAcre = calculatePlantsPerAcre({
        rowCm: spacing.rowCm,
        plantCm: spacing.plantCm,
        seedsPerHole: spacing.seedsPerHole
      });

      const totalPlants = calculateTotalPlants(plantsPerAcre, farmSize);

      // IMPROVED fertilizer type detection
      const dapPerAcre = plantingRecsPerAcre.find(r =>
        r.brand.toLowerCase().includes('dap') ||
        r.npk.includes('18-46') ||
        r.npk.includes('DAP') ||
        r.brand.toLowerCase().includes('diammonium')
      )?.amountKg || 0;

      const ureaPerAcre = topdressingRecsPerAcre.find(r =>
        r.brand.toLowerCase().includes('urea') ||
        r.npk.includes('46-0-0') ||
        r.brand.toLowerCase().includes('uree')
      )?.amountKg || 0;

      const mopPerAcre = topdressingRecsPerAcre.find(r =>
        r.brand.toLowerCase().includes('mop') ||
        r.npk.includes('0-0-60') ||
        r.brand.toLowerCase().includes('muriate')
      )?.amountKg || 0;

      // FIXED: Use crop parameter for perennial detection
      const cropLower = (crop || '').toLowerCase();
      const isPerennial = ['mangoes', 'avocados', 'oranges', 'coffee', 'tea', 'macadamia', 'cocoa', 'bananas'].includes(cropLower);

      const perPlant = calculateFertilizerPerPlant(
        dapPerAcre * farmSize,
        ureaPerAcre * farmSize,
        mopPerAcre * farmSize,
        totalPlants,
        isPerennial
      );

      // ADDED: Measurement guides for each fertilizer individually
      perPlantInfo = {
        plantsPerAcre,
        totalPlants,
        dapGrams: perPlant.dapGrams,
        ureaGrams: perPlant.ureaGrams,
        mopGrams: perPlant.mopGrams,
        totalGrams: perPlant.totalGrams,
        dapGuide: getMeasurementGuide(perPlant.dapGrams),
        ureaGuide: getMeasurementGuide(perPlant.ureaGrams),
        mopGuide: getMeasurementGuide(perPlant.mopGrams),
        totalGuide: getMeasurementGuide(perPlant.totalGrams)
      };
    }

    return {
      plantingRecommendations: plantingRecs,
      topDressingRecommendations: topdressingRecs,
      perAcrePlanting: plantingRecsPerAcre,
      perAcreTopdressing: topdressingRecsPerAcre,
      totalNutrientsProvided,
      remainingNeeds: {
        n: remainingNPerAcre * farmSize,
        p: remainingPPerAcre * farmSize,
        k: remainingKPerAcre * farmSize,
        s: remainingSPerAcre * farmSize,
        ca: remainingCaPerAcre * farmSize,
        mg: remainingMgPerAcre * farmSize,
        zn: remainingZnPerAcre * farmSize,
        b: remainingBPerAcre * farmSize
      },
      totalCost: Math.round(totalCost),
      farmSize,
      perPlant: perPlantInfo,
      soilTestSummary: null
    };
  }

  // Extract nutrients from fertilizer formulation - UPDATED with crop-specific parsing
  extractNutrientsFromRecommendations(rec: {
    plantingFertilizer: string;
    plantingQuantity: number;
    topdressingFertilizer: string;
    topdressingQuantity: number;
    potassiumFertilizer: string;
    potassiumQuantity: number;
    // NEW: Nutrient detail fields
    plantingFertilizerNutrients?: string;
    topdressingFertilizerNutrients?: string;
    potassiumFertilizerNutrients?: string;
  }): NutrientRequirement {

    // Enhanced parser with crop-specific fertilizer recognition
    const parseFertilizer = (name: string, quantity: number, cropHint?: string) => {
      if (!name || quantity === 0) return { n: 0, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };

      const lowerName = name.toLowerCase();

      // Check for NPK pattern first (e.g., 17-17-17, 20-10-10)
      const match = name.match(/(\d+)[\s-]?(\d+)[\s-]?(\d+)/);
      if (match) {
        const n = parseInt(match[1]) || 0;
        const p = parseInt(match[2]) || 0;
        const k = parseInt(match[3]) || 0;

        return {
          n: (n / 100) * quantity,
          p: (p / 100) * quantity,
          k: (k / 100) * quantity,
          s: 0, ca: 0, mg: 0, zn: 0, b: 0
        };
      }

      // Common fertilizer types
      if (lowerName.includes('urea')) {
        return { n: 0.46 * quantity, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('can')) {
        return { n: 0.27 * quantity, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('dap')) {
        return { n: 0.18 * quantity, p: 0.46 * quantity, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('mop') || lowerName.includes('muriate')) {
        return { n: 0, p: 0, k: 0.6 * quantity, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('sop')) {
        return { n: 0, p: 0, k: 0.5 * quantity, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('tsp')) {
        return { n: 0, p: 0.46 * quantity, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('ssp')) {
        return { n: 0, p: 0.2 * quantity, k: 0, s: 0.12 * quantity, ca: 0, mg: 0, zn: 0, b: 0 };
      }
      if (lowerName.includes('npk')) {
        // Try to extract numbers from NPK string
        const npkMatch = lowerName.match(/npk[\s-]*(\d+)[\s-]*(\d+)[\s-]*(\d+)/);
        if (npkMatch) {
          const n = parseInt(npkMatch[1]) || 0;
          const p = parseInt(npkMatch[2]) || 0;
          const k = parseInt(npkMatch[3]) || 0;
          return {
            n: (n / 100) * quantity,
            p: (p / 100) * quantity,
            k: (k / 100) * quantity,
            s: 0, ca: 0, mg: 0, zn: 0, b: 0
          };
        }
      }

      // Crop-specific fertilizer defaults (for when farmer just says "planting fertilizer")
      const cropSpecificFertilizers: Record<string, { n: number; p: number; k: number; s?: number; ca?: number; mg?: number; zn?: number }> = {
        // New crops
        rice: { n: 0.18, p: 0.46, k: 0 }, // DAP equivalent
        mangoes: { n: 0.18, p: 0.46, k: 0 }, // DAP at planting
        pineapples: { n: 0.15, p: 0.15, k: 0.15 }, // Compound fertilizer
        watermelons: { n: 0.2, p: 0.2, k: 0.2 }, // NPK 20:20:20
        carrots: { n: 0.27, p: 0, k: 0 }, // CAN only
        chillies: { n: 0.18, p: 0.46, k: 0 }, // DAP
        spinach: { n: 0.27, p: 0, k: 0 }, // CAN
        pigeonpeas: { n: 0.18, p: 0.46, k: 0 }, // DAP
        bambaranuts: { n: 0, p: 0.46, k: 0 }, // TSP only
        yams: { n: 0.18, p: 0.46, k: 0 }, // DAP
        taro: { n: 0.18, p: 0.46, k: 0 }, // DAP
        okra: { n: 0.18, p: 0.46, k: 0 }, // DAP
        tea: { n: 0.25, p: 0.05, k: 0.05 }, // NPK 25:5:5
        macadamia: { n: 0.17, p: 0.17, k: 0.17 }, // NPK 17:17:17
        cocoa: { n: 0.2, p: 0.1, k: 0.1 }, // NPK 20:10:10

        // Existing crops (for reference)
        maize: { n: 0.18, p: 0.46, k: 0 }, // DAP
        beans: { n: 0.18, p: 0.46, k: 0 }, // DAP
        onions: { n: 0.18, p: 0.46, k: 0 }, // DAP
        tomatoes: { n: 0.18, p: 0.46, k: 0 }, // DAP
        potatoes: { n: 0.18, p: 0.46, k: 0 }, // DAP
        cabbages: { n: 0.18, p: 0.46, k: 0 }, // DAP
      };

      // If the fertilizer name matches a crop name, use crop-specific defaults
      if (cropHint && cropSpecificFertilizers[cropHint]) {
        const cropFert = cropSpecificFertilizers[cropHint];
        return {
          n: cropFert.n * quantity,
          p: cropFert.p * quantity,
          k: cropFert.k * quantity,
          s: (cropFert.s || 0) * quantity,
          ca: (cropFert.ca || 0) * quantity,
          mg: (cropFert.mg || 0) * quantity,
          zn: (cropFert.zn || 0) * quantity,
          b: 0
        };
      }

      return { n: 0, p: 0, k: 0, s: 0, ca: 0, mg: 0, zn: 0, b: 0 };
    };

    // Try to extract crop hint from fertilizer names
    const getCropHint = (fertilizerName: string): string | undefined => {
      const lowerName = fertilizerName.toLowerCase();
      const crops = [
        'maize', 'beans', 'rice', 'mangoes', 'pineapples', 'watermelons',
        'carrots', 'chillies', 'spinach', 'pigeonpeas', 'bambaranuts',
        'yams', 'taro', 'okra', 'tea', 'macadamia', 'cocoa', 'onions',
        'tomatoes', 'potatoes', 'cabbages', 'avocados'
      ];
      return crops.find(crop => lowerName.includes(crop));
    };

    const cropHint = getCropHint(rec.plantingFertilizer) ||
                     getCropHint(rec.topdressingFertilizer) ||
                     getCropHint(rec.potassiumFertilizer);

    const planting = parseFertilizer(rec.plantingFertilizer, rec.plantingQuantity, cropHint);
    const topdressing = parseFertilizer(rec.topdressingFertilizer, rec.topdressingQuantity, cropHint);
    const potassium = parseFertilizer(rec.potassiumFertilizer, rec.potassiumQuantity, cropHint);

    // NEW: Parse nutrient strings and add to totals
    const plantingNutrients = rec.plantingFertilizerNutrients ?
      this.parseNutrientString(rec.plantingFertilizerNutrients) : null;
    const topdressingNutrients = rec.topdressingFertilizerNutrients ?
      this.parseNutrientString(rec.topdressingFertilizerNutrients) : null;
    const potassiumNutrients = rec.potassiumFertilizerNutrients ?
      this.parseNutrientString(rec.potassiumFertilizerNutrients) : null;

    const totalNutrients = {
      n: planting.n + topdressing.n + potassium.n,
      p: planting.p + topdressing.p + potassium.p,
      k: planting.k + topdressing.k + potassium.k,
      s: (planting.s || 0) + (topdressing.s || 0) + (potassium.s || 0) +
         (plantingNutrients?.s || 0) * rec.plantingQuantity / 100 +
         (topdressingNutrients?.s || 0) * rec.topdressingQuantity / 100 +
         (potassiumNutrients?.s || 0) * rec.potassiumQuantity / 100,
      ca: (planting.ca || 0) + (topdressing.ca || 0) + (potassium.ca || 0) +
          (plantingNutrients?.ca || 0) * rec.plantingQuantity / 100 +
          (topdressingNutrients?.ca || 0) * rec.topdressingQuantity / 100,
      mg: (planting.mg || 0) + (topdressing.mg || 0) + (potassium.mg || 0) +
          (plantingNutrients?.mg || 0) * rec.plantingQuantity / 100 +
          (topdressingNutrients?.mg || 0) * rec.topdressingQuantity / 100 +
          (potassiumNutrients?.mg || 0) * rec.potassiumQuantity / 100,
      zn: (planting.zn || 0) + (topdressing.zn || 0) + (potassium.zn || 0) +
          (plantingNutrients?.zn || 0) * rec.plantingQuantity / 100,
      b: (planting.b || 0) + (topdressing.b || 0) + (potassium.b || 0) +
         (plantingNutrients?.b || 0) * rec.plantingQuantity / 100
    };

    return totalNutrients;
  }

  // Generate recommendation text - UPDATED to include secondary nutrients
  generateRecommendationText(result: any, cropType: string, targetYield?: number, country: string = 'kenya'): string {
    let text = `PRECISION FERTILIZER PLAN FOR YOUR ${cropType.toUpperCase()} ENTERPRISE\n\n`;

    if (result.farmSize) {
      text += `Your farm size: ${result.farmSize} acre(s)\n`;
    }

    if (result.totalCost) {
      text += `Total fertilizer investment: ${this.formatCurrencyForDisplay(result.totalCost, country)} for your entire farm\n\n`;
    }

    // Planting fertilizers
    if (result.plantingRecommendations?.length > 0) {
      text += `🌱 PLANTING FERTILIZERS (apply at planting)\n`;
      result.plantingRecommendations.forEach((rec: any) => {
        const bagsNeeded = Math.floor(rec.amountKg / 50);
        const extraKg = rec.amountKg % 50;
        const pricePerKg = rec.pricePer50kg / 50;

        const totalCost = (bagsNeeded * rec.pricePer50kg) + (extraKg * pricePerKg);

        let bagText = '';
        if (bagsNeeded > 0 && extraKg > 0) {
          bagText = `${bagsNeeded} bag(s) of 50kg + ${extraKg}kg open`;
        } else if (bagsNeeded > 0) {
          bagText = `${bagsNeeded} bag(s) of 50kg`;
        } else {
          bagText = `${extraKg}kg open`;
        }

        text += `\n• Buy ${rec.amountKg} kg of ${rec.brand} (${rec.npk})\n`;
        text += `  This is ${bagText}\n`;
        text += `  Cost: ${this.formatCurrencyForDisplay(Math.round(totalCost), country)}\n`;

        // NEW: Include secondary nutrients in provides line
        const providesParts = [];
        if (rec.provides.n > 0) providesParts.push(`${rec.provides.n.toFixed(1)} kg N`);
        if (rec.provides.p > 0) providesParts.push(`${rec.provides.p.toFixed(1)} kg P`);
        if (rec.provides.k > 0) providesParts.push(`${rec.provides.k.toFixed(1)} kg K`);
        if (rec.provides.s > 0) providesParts.push(`${rec.provides.s.toFixed(1)} kg S`);
        if (rec.provides.ca > 0) providesParts.push(`${rec.provides.ca.toFixed(1)} kg Ca`);
        if (rec.provides.mg > 0) providesParts.push(`${rec.provides.mg.toFixed(1)} kg Mg`);
        if (rec.provides.zn > 0) providesParts.push(`${rec.provides.zn.toFixed(1)} kg Zn`);

        text += `  Provides: ${providesParts.join(', ')}\n`;
      });
      text += '\n';
    }

    // Top dressing fertilizers
    if (result.topDressingRecommendations?.length > 0) {
      text += `🌿 TOP DRESSING FERTILIZERS (apply 3-4 weeks after planting)\n`;
      result.topDressingRecommendations.forEach((rec: any) => {
        const bagsNeeded = Math.floor(rec.amountKg / 50);
        const extraKg = rec.amountKg % 50;
        const pricePerKg = rec.pricePer50kg / 50;

        const totalCost = (bagsNeeded * rec.pricePer50kg) + (extraKg * pricePerKg);

        let bagText = '';
        if (bagsNeeded > 0 && extraKg > 0) {
          bagText = `${bagsNeeded} bag(s) of 50kg + ${extraKg}kg open`;
        } else if (bagsNeeded > 0) {
          bagText = `${bagsNeeded} bag(s) of 50kg`;
        } else {
          bagText = `${extraKg}kg open`;
        }

        text += `\n• Buy ${rec.amountKg} kg of ${rec.brand} (${rec.npk})\n`;
        text += `  This is ${bagText}\n`;
        text += `  Cost: ${this.formatCurrencyForDisplay(Math.round(totalCost), country)}\n`;

        // NEW: Include secondary nutrients in provides line
        const providesParts = [];
        if (rec.provides.n > 0) providesParts.push(`${rec.provides.n.toFixed(1)} kg N`);
        if (rec.provides.k > 0) providesParts.push(`${rec.provides.k.toFixed(1)} kg K`);
        if (rec.provides.s > 0) providesParts.push(`${rec.provides.s.toFixed(1)} kg S`);
        if (rec.provides.ca > 0) providesParts.push(`${rec.provides.ca.toFixed(1)} kg Ca`);
        if (rec.provides.mg > 0) providesParts.push(`${rec.provides.mg.toFixed(1)} kg Mg`);

        text += `  Provides: ${providesParts.join(', ')}\n`;
      });
      text += '\n';
    }

    // Summary - UPDATED to include secondary nutrients
    text += `📊 SUMMARY\n`;
    text += `Total fertilizer investment: ${this.formatCurrencyForDisplay(result.totalCost, country)}\n`;

    const summaryParts = [];
    if (result.totalNutrientsProvided?.n > 0) summaryParts.push(`${result.totalNutrientsProvided.n.toFixed(1)} kg N`);
    if (result.totalNutrientsProvided?.p > 0) summaryParts.push(`${result.totalNutrientsProvided.p.toFixed(1)} kg P`);
    if (result.totalNutrientsProvided?.k > 0) summaryParts.push(`${result.totalNutrientsProvided.k.toFixed(1)} kg K`);
    if (result.totalNutrientsProvided?.s > 0) summaryParts.push(`${result.totalNutrientsProvided.s.toFixed(1)} kg S`);
    if (result.totalNutrientsProvided?.ca > 0) summaryParts.push(`${result.totalNutrientsProvided.ca.toFixed(1)} kg Ca`);
    if (result.totalNutrientsProvided?.mg > 0) summaryParts.push(`${result.totalNutrientsProvided.mg.toFixed(1)} kg Mg`);
    if (result.totalNutrientsProvided?.zn > 0) summaryParts.push(`${result.totalNutrientsProvided.zn.toFixed(1)} kg Zn`);

    text += `Total nutrients provided: ${summaryParts.join(', ')}\n\n`;

    // Per-plant information - UPDATED with measurement guides for each fertilizer
    if (result.perPlant) {
      const pp = result.perPlant;

      text += `🌱 PER-PLANT APPLICATION GUIDE\n`;
      text += `Plant population: ${pp.totalPlants.toLocaleString()} plants on your farm\n\n`;

      text += `Fertilizer per plant:\n`;
      text += `• DAP: ${pp.dapGrams} grams per plant (${pp.dapGuide})\n`;
      text += `• UREA: ${pp.ureaGrams} grams per plant (${pp.ureaGuide})\n`;
      text += `• MOP: ${pp.mopGrams} grams per plant (${pp.mopGuide})\n`;
      text += `• TOTAL: ${pp.totalGrams} grams per plant (${pp.totalGuide})\n\n`;
    }

    // Business tip
    text += `💼 BUSINESS TIP: Every Ksh 1 invested in fertilizer returns Ksh 3-5 in higher yields when combined with good agronomic practices!\n`;

    return text;
  }
}

export const fertilizerCalculator = new FertilizerCalculator();