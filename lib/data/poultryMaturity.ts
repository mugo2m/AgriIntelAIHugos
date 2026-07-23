// lib/data/poultryMaturity.ts
// POULTRY MATURITY PERIODS – Months to maturity / production
// Includes: Age to first egg (layers), market weight (broilers), and full production (turkeys, ducks, geese, quail)
// Country-specific data based on climate, management, and local production systems

export interface PoultryMaturityInfo {
  min: number;      // Minimum months to production
  max: number;      // Maximum months to production
  typical: number;  // Typical months to production
  notes?: string;   // Additional details (e.g., first egg age, market weight)
}

export const poultryMaturity: Record<string, Record<string, PoultryMaturityInfo>> = {
  // ==================== CHICKENS ====================
  chicken: {
    // --- LAYERS (Egg Production) ---
    "KARI Improved Kienyeji": {
      default: { min: 5, max: 7, typical: 6, notes: "First egg at 5-6 months. Indigenous cross – hardy, free-range." },
      kenya: { min: 5, max: 7, typical: 6, notes: "First egg at 5-6 months. Indigenous cross – hardy, free-range." }
    },
    "Kuroiler": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. High egg production (250-300/year)." },
      kenya: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. High egg production (250-300/year)." }
    },
    "Rainbow Rooster": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Dual-purpose breed." },
      kenya: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Dual-purpose breed." }
    },
    "Brown Leghorn": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. Excellent layers (280-300/year)." },
      kenya: { min: 4, max: 5, typical: 4.5 }
    },
    "Hy-Line Brown": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. Premium commercial layer." },
      kenya: { min: 4, max: 5, typical: 4.5 }
    },
    "Isa Brown": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. Top performer in tropics." },
      kenya: { min: 4, max: 5, typical: 4.5 }
    },
    "Lohmann Brown": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. High egg production." },
      kenya: { min: 4, max: 5, typical: 4.5 }
    },
    "Bovans Brown": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. Commercial brown layer." }
    },
    "Dekalb White": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. White egg layer." }
    },
    "Babcock White": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First egg at 4-5 months. White egg commercial layer." }
    },

    // --- BROILERS (Meat Production) ---
    "Cobb 500": {
      default: { min: 0.4, max: 0.6, typical: 0.5, notes: "Market weight at 5-6 weeks (2-2.5kg). Fastest broiler." },
      kenya: { min: 0.4, max: 0.6, typical: 0.5, notes: "Market weight at 5-6 weeks (2-2.5kg)." }
    },
    "Ross 308": {
      default: { min: 0.4, max: 0.6, typical: 0.5, notes: "Market weight at 5-6 weeks (2-2.5kg). Industry standard." },
      kenya: { min: 0.4, max: 0.6, typical: 0.5 }
    },
    "Arbor Acres": {
      default: { min: 0.5, max: 0.7, typical: 0.6, notes: "Market weight at 6-7 weeks (2-2.5kg)." }
    },
    "Hubbard": {
      default: { min: 0.5, max: 0.7, typical: 0.6, notes: "Market weight at 6-7 weeks (2-2.5kg)." }
    },
    "Indian River": {
      default: { min: 0.5, max: 0.7, typical: 0.6, notes: "Market weight at 6-7 weeks (2-2.5kg)." }
    },

    // --- MEAT & EGGS (Both) ---
    "Sussex": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Dual-purpose: eggs (200/year) + meat (3-4kg)." },
      kenya: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Eggs + meat. Hardy breed." }
    },
    "Kenbrew (Kenbro)": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Hardy dual-purpose breed. Free-range adapted." },
      kenya: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Hardy dual-purpose breed. Free-range adapted." }
    },
    "Sasso": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Dual-purpose. Hardy in free-range." }
    },
    "Kenya Broiler": {
      default: { min: 0.5, max: 0.7, typical: 0.6, notes: "Market weight at 6-7 weeks (2-2.5kg)." },
      kenya: { min: 0.5, max: 0.7, typical: 0.6 }
    },
    "KARI Kienyeji": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Improved indigenous cross." },
      kenya: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Improved indigenous cross." }
    },

    // --- INDIGENOUS / LOCAL ---
    "Local Kienyeji": {
      default: { min: 6, max: 8, typical: 7, notes: "First egg at 6-8 months. Hardy, free-range. Low egg production (100-150/year)." },
      kenya: { min: 6, max: 8, typical: 7, notes: "First egg at 6-8 months. Hardy, free-range." }
    },
    "Local Turkana": {
      default: { min: 6, max: 9, typical: 7.5, notes: "First egg at 6-9 months. Very hardy for dry areas." },
      kenya: { min: 6, max: 9, typical: 7.5 }
    },
    "Local Bantam": {
      default: { min: 5, max: 7, typical: 6, notes: "First egg at 5-7 months. Small breed, broody, ornamental." }
    },

    // --- OTHER ---
    "Other": {
      default: { min: 5, max: 7, typical: 6, notes: "Unknown breed – consult local extension officer." }
    }
  },

  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": {
      default: { min: 5, max: 7, typical: 6, notes: "Market weight at 16-20 weeks (10-12kg). Commercial turkey." },
      kenya: { min: 6, max: 8, typical: 7, notes: "Market weight at 6-8 months (8-10kg)." }
    },
    "Broad Breasted Bronze": {
      default: { min: 6, max: 8, typical: 7, notes: "Market weight at 20-24 weeks (8-10kg). Heritage breed." },
      kenya: { min: 7, max: 9, typical: 8 }
    },
    "Narragansett": {
      default: { min: 6, max: 8, typical: 7, notes: "Heritage breed. Market weight at 24-28 weeks (6-8kg)." }
    },
    "Royal Palm": {
      default: { min: 6, max: 8, typical: 7, notes: "Heritage breed. Market weight at 24-28 weeks (5-7kg)." }
    },
    "Local Turkey": {
      default: { min: 8, max: 12, typical: 10, notes: "Local breeds. Market weight at 10-12 months (4-6kg)." },
      kenya: { min: 8, max: 12, typical: 10 }
    },
    "Other": {
      default: { min: 6, max: 10, typical: 8, notes: "Unknown breed – consult local extension officer." }
    }
  },

  // ==================== DUCKS ====================
  duck: {
    "Khaki Campbell": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Excellent layer (250-300 eggs/year)." },
      kenya: { min: 5, max: 6, typical: 5.5 }
    },
    "Pekin": {
      default: { min: 6, max: 7, typical: 6.5, notes: "Market weight at 6-7 months (3-4kg). Also good eggs (150-200/year)." },
      kenya: { min: 6, max: 7, typical: 6.5 }
    },
    "Rouen": {
      default: { min: 6, max: 8, typical: 7, notes: "Market weight at 7-8 months (3-4kg). Dual-purpose." }
    },
    "Muscovy": {
      default: { min: 7, max: 9, typical: 8, notes: "First egg at 7-9 months. Meat breed (4-5kg). Quiet, good foragers." },
      kenya: { min: 7, max: 9, typical: 8 }
    },
    "Indian Runner": {
      default: { min: 5, max: 6, typical: 5.5, notes: "First egg at 5-6 months. Excellent layer (200-250 eggs/year). Upright stance." }
    },
    "Local Duck": {
      default: { min: 6, max: 8, typical: 7, notes: "Local breeds. First egg at 7-8 months." },
      kenya: { min: 6, max: 8, typical: 7 }
    },
    "Other": {
      default: { min: 5, max: 8, typical: 6.5, notes: "Unknown breed – consult local extension officer." }
    }
  },

  // ==================== GEESE ====================
  goose: {
    "African Grey": {
      default: { min: 10, max: 12, typical: 11, notes: "First eggs at 10-12 months. Large breed (6-8kg)." }
    },
    "Toulouse": {
      default: { min: 10, max: 12, typical: 11, notes: "First eggs at 10-12 months. Heavy breed (7-9kg)." }
    },
    "Embden": {
      default: { min: 10, max: 12, typical: 11, notes: "First eggs at 10-12 months. Large white breed (8-10kg)." }
    },
    "Chinese": {
      default: { min: 8, max: 10, typical: 9, notes: "First eggs at 8-10 months. Medium breed (4-5kg). Good layers." }
    },
    "Local Goose": {
      default: { min: 10, max: 14, typical: 12, notes: "Local breeds. First eggs at 12-14 months." },
      kenya: { min: 10, max: 14, typical: 12 }
    },
    "Other": {
      default: { min: 9, max: 12, typical: 10.5, notes: "Unknown breed – consult local extension officer." }
    }
  },

  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": {
      default: { min: 1.5, max: 2, typical: 1.75, notes: "First eggs at 6-8 weeks. Lays 250-300 eggs/year." },
      kenya: { min: 1.5, max: 2, typical: 1.75 }
    },
    "Coturnix Quail": {
      default: { min: 1.5, max: 2, typical: 1.75, notes: "First eggs at 6-8 weeks. High egg production." }
    },
    "Bobwhite Quail": {
      default: { min: 4, max: 5, typical: 4.5, notes: "First eggs at 4-5 months. Game bird. Eggs 50-100/year." }
    },
    "Other": {
      default: { min: 2, max: 3, typical: 2.5, notes: "Unknown breed – consult local extension officer." }
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the typical time to first egg or market weight for a poultry breed.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param breed - The specific breed name
 * @param country - Country code (e.g., "kenya") for region-specific data
 * @returns Typical months to production
 */
export function getPoultryMaturity(
  species: string,
  breed: string,
  country: string = 'default'
): number {
  const speciesKey = species.toLowerCase();
  const breedData = poultryMaturity[speciesKey];

  if (!breedData) {
    // Fallback defaults by species
    if (speciesKey === 'chicken') return 6;
    if (speciesKey === 'turkey') return 7;
    if (speciesKey === 'duck') return 6.5;
    if (speciesKey === 'goose') return 11;
    if (speciesKey === 'quail') return 2;
    return 6;
  }

  const countryLower = country.toLowerCase();
  const breedEntry = breedData[breed];

  if (!breedEntry) {
    // Fallback: try to match partial breed name
    const matchedBreed = Object.keys(breedData).find(key =>
      breed.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(breed.toLowerCase())
    );
    if (matchedBreed) {
      const matched = breedData[matchedBreed];
      if (matched[countryLower]) return matched[countryLower].typical;
      if (matched.default) return matched.default.typical;
    }
    // Ultimate fallback: first breed in species
    const firstBreed = Object.keys(breedData)[0];
    if (firstBreed) {
      const firstEntry = breedData[firstBreed];
      if (firstEntry[countryLower]) return firstEntry[countryLower].typical;
      if (firstEntry.default) return firstEntry.default.typical;
    }
    return 6;
  }

  // Check country-specific data
  if (breedEntry[countryLower]) {
    return breedEntry[countryLower].typical;
  }

  // Fallback to default
  if (breedEntry.default) {
    return breedEntry.default.typical;
  }

  return 6;
}

/**
 * Get full maturity range for a poultry breed.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param breed - The specific breed name
 * @param country - Country code (e.g., "kenya")
 * @returns { min, max, typical, notes }
 */
export function getPoultryMaturityRange(
  species: string,
  breed: string,
  country: string = 'default'
): { min: number; max: number; typical: number; notes?: string } {
  const speciesKey = species.toLowerCase();
  const breedData = poultryMaturity[speciesKey];

  if (!breedData) {
    return { min: 4, max: 8, typical: 6, notes: 'No maturity data available' };
  }

  const countryLower = country.toLowerCase();
  const breedEntry = breedData[breed];

  if (!breedEntry) {
    // Try partial match
    const matchedBreed = Object.keys(breedData).find(key =>
      breed.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(breed.toLowerCase())
    );
    if (matchedBreed) {
      const matched = breedData[matchedBreed];
      if (matched[countryLower]) return matched[countryLower];
      if (matched.default) return matched.default;
    }
    // Fallback to first breed
    const firstBreed = Object.keys(breedData)[0];
    if (firstBreed) {
      const firstEntry = breedData[firstBreed];
      if (firstEntry[countryLower]) return firstEntry[countryLower];
      if (firstEntry.default) return firstEntry.default;
    }
    return { min: 4, max: 8, typical: 6, notes: 'No maturity data available' };
  }

  if (breedEntry[countryLower]) {
    return breedEntry[countryLower];
  }

  if (breedEntry.default) {
    return breedEntry.default;
  }

  return { min: 4, max: 8, typical: 6, notes: 'No maturity data available' };
}

/**
 * Get all breeds for a species with their typical maturity times.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param country - Country code (e.g., "kenya")
 * @returns Array of { breed, typicalMonths, notes }
 */
export function getPoultryBreedsWithMaturity(
  species: string,
  country: string = 'default'
): { breed: string; typicalMonths: number; notes?: string }[] {
  const speciesKey = species.toLowerCase();
  const breedData = poultryMaturity[speciesKey];

  if (!breedData) return [];

  const countryLower = country.toLowerCase();

  return Object.entries(breedData).map(([breed, entries]) => {
    const entry = entries[countryLower] || entries.default;
    return {
      breed,
      typicalMonths: entry?.typical || 6,
      notes: entry?.notes || ''
    };
  });
}