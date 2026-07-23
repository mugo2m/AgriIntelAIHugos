// lib/data/poultryProductionCalendar.ts
// POULTRY PRODUCTION CALENDAR – When to start, when to harvest, when to expect eggs
// Based on Kenyan agro-ecological zones and global poultry best practices
// Timings are in weeks/months from hatch/arrival

export interface ProductionTimingInfo {
  earliest: string;       // e.g., "8 weeks"
  latest: string;         // e.g., "12 weeks"
  optimal: string;        // e.g., "10 weeks"
  notes?: string;
}

export interface CountryProductionData {
  regions?: Record<string, ProductionTimingInfo>;
  default: ProductionTimingInfo;
}

export const poultryProductionCalendar: Record<string, Record<string, { countries?: Record<string, CountryProductionData>; default: ProductionTimingInfo }>> = {
  // ==================== CHICKENS ====================
  chicken: {
    // --- LAYERS (Egg Production – First Egg) ---
    "KARI Improved Kienyeji": {
      countries: {
        kenya: {
          regions: {
            "Western": { earliest: "5 months", latest: "7 months", optimal: "6 months", notes: "First egg at 5-6 months. Improved indigenous." },
            "Rift Valley": { earliest: "5 months", latest: "7 months", optimal: "6 months" },
            "Eastern": { earliest: "5 months", latest: "7 months", optimal: "6 months" },
            "Coast": { earliest: "5 months", latest: "7 months", optimal: "6 months" }
          },
          default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
        },
        default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
      },
      default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
    },
    "Kuroiler": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months", notes: "First egg at 4-5 months. 250-300 eggs/year." } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Sussex": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "Dual-purpose. Eggs + meat." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },
    "Kenbrew (Kenbro)": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "Hardy dual-purpose, free-range." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },
    "Brown Leghorn": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months", notes: "First egg at 4-5 months. 280-300 eggs/year." } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Hy-Line Brown": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months", notes: "Commercial layer." } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Isa Brown": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months", notes: "Top performer in tropics." } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Lohmann Brown": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Bovans Brown": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Dekalb White": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Babcock White": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },

    // --- BROILERS (Meat Production – Market Weight) ---
    "Cobb 500": {
      countries: {
        kenya: { default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks", notes: "2-2.5kg market weight." } },
        default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks" }
      },
      default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks" }
    },
    "Ross 308": {
      countries: {
        kenya: { default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks" } },
        default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks" }
      },
      default: { earliest: "5 weeks", latest: "6 weeks", optimal: "5.5 weeks" }
    },
    "Arbor Acres": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" } },
        default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
      },
      default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
    },
    "Hubbard": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" } },
        default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
      },
      default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
    },
    "Indian River": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" } },
        default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
      },
      default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
    },

    // --- DUAL-PURPOSE (Meat & Eggs – First Egg) ---
    "Sasso": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "First egg at 5-6 months." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },
    "Kenya Broiler": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks", notes: "Market weight at 6-7 weeks." } },
        default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
      },
      default: { earliest: "6 weeks", latest: "7 weeks", optimal: "6.5 weeks" }
    },
    "KARI Kienyeji": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "Improved indigenous cross." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },

    // --- INDIGENOUS / LOCAL (First Egg) ---
    "Local Kienyeji": {
      countries: {
        kenya: {
          regions: {
            "Western": { earliest: "6 months", latest: "8 months", optimal: "7 months", notes: "Hardy, free-range." },
            "Rift Valley": { earliest: "6 months", latest: "8 months", optimal: "7 months" },
            "Eastern": { earliest: "6 months", latest: "8 months", optimal: "7 months" },
            "Coast": { earliest: "6 months", latest: "8 months", optimal: "7 months" }
          },
          default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
        },
        default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
      },
      default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
    },
    "Local Turkana": {
      countries: {
        kenya: { default: { earliest: "6 months", latest: "9 months", optimal: "7.5 months", notes: "Very hardy for dry areas." } },
        default: { earliest: "6 months", latest: "9 months", optimal: "7.5 months" }
      },
      default: { earliest: "6 months", latest: "9 months", optimal: "7.5 months" }
    },
    "Local Bantam": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "7 months", optimal: "6 months", notes: "Small breed, broody." } },
        default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
      },
      default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
    },

    // --- OTHER ---
    "Other": {
      countries: { default: { earliest: "5 months", latest: "7 months", optimal: "6 months", notes: "Unknown breed – consult local extension." } },
      default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
    }
  },

  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": {
      countries: {
        kenya: { default: { earliest: "6 months", latest: "8 months", optimal: "7 months", notes: "Market weight at 6-8 months (8-10kg)." } },
        default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
      },
      default: { earliest: "5 months", latest: "7 months", optimal: "6 months" }
    },
    "Broad Breasted Bronze": {
      countries: {
        kenya: { default: { earliest: "7 months", latest: "9 months", optimal: "8 months", notes: "Heritage breed." } },
        default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
      },
      default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
    },
    "Narragansett": {
      countries: {
        kenya: { default: { earliest: "7 months", latest: "9 months", optimal: "8 months" } },
        default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
      },
      default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
    },
    "Royal Palm": {
      countries: {
        kenya: { default: { earliest: "7 months", latest: "9 months", optimal: "8 months" } },
        default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
      },
      default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
    },
    "Local Turkey": {
      countries: {
        kenya: { default: { earliest: "8 months", latest: "12 months", optimal: "10 months", notes: "Local breeds. Market weight at 10-12 months." } },
        default: { earliest: "8 months", latest: "12 months", optimal: "10 months" }
      },
      default: { earliest: "8 months", latest: "12 months", optimal: "10 months" }
    },
    "Other": {
      countries: { default: { earliest: "6 months", latest: "10 months", optimal: "8 months", notes: "Unknown breed – consult local extension." } },
      default: { earliest: "6 months", latest: "10 months", optimal: "8 months" }
    }
  },

  // ==================== DUCKS ====================
  duck: {
    "Khaki Campbell": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "First egg at 5-6 months. 250-300 eggs/year." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },
    "Pekin": {
      countries: {
        kenya: { default: { earliest: "6 months", latest: "7 months", optimal: "6.5 months", notes: "Market weight at 6-7 months." } },
        default: { earliest: "6 months", latest: "7 months", optimal: "6.5 months" }
      },
      default: { earliest: "6 months", latest: "7 months", optimal: "6.5 months" }
    },
    "Rouen": {
      countries: {
        kenya: { default: { earliest: "7 months", latest: "8 months", optimal: "7.5 months", notes: "Market weight at 7-8 months." } },
        default: { earliest: "7 months", latest: "8 months", optimal: "7.5 months" }
      },
      default: { earliest: "7 months", latest: "8 months", optimal: "7.5 months" }
    },
    "Muscovy": {
      countries: {
        kenya: { default: { earliest: "7 months", latest: "9 months", optimal: "8 months", notes: "First egg at 7-9 months. Meat breed." } },
        default: { earliest: "7 months", latest: "9 months", optimal: "8 months" }
      },
      default: { earliest: "7 months", latest: "9 months", optimal: "8 months" }
    },
    "Indian Runner": {
      countries: {
        kenya: { default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months", notes: "First egg at 5-6 months. 200-250 eggs/year." } },
        default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
      },
      default: { earliest: "5 months", latest: "6 months", optimal: "5.5 months" }
    },
    "Local Duck": {
      countries: {
        kenya: { default: { earliest: "6 months", latest: "8 months", optimal: "7 months", notes: "Local breeds. First egg at 7-8 months." } },
        default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
      },
      default: { earliest: "6 months", latest: "8 months", optimal: "7 months" }
    },
    "Other": {
      countries: { default: { earliest: "5 months", latest: "8 months", optimal: "6.5 months", notes: "Unknown breed – consult local extension." } },
      default: { earliest: "5 months", latest: "8 months", optimal: "6.5 months" }
    }
  },

  // ==================== GEESE ====================
  goose: {
    "African Grey": {
      countries: {
        kenya: { default: { earliest: "10 months", latest: "12 months", optimal: "11 months", notes: "First eggs at 10-12 months." } },
        default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
      },
      default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
    },
    "Toulouse": {
      countries: {
        kenya: { default: { earliest: "10 months", latest: "12 months", optimal: "11 months" } },
        default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
      },
      default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
    },
    "Embden": {
      countries: {
        kenya: { default: { earliest: "10 months", latest: "12 months", optimal: "11 months" } },
        default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
      },
      default: { earliest: "10 months", latest: "12 months", optimal: "11 months" }
    },
    "Chinese": {
      countries: {
        kenya: { default: { earliest: "8 months", latest: "10 months", optimal: "9 months", notes: "First eggs at 8-10 months. Good layers." } },
        default: { earliest: "8 months", latest: "10 months", optimal: "9 months" }
      },
      default: { earliest: "8 months", latest: "10 months", optimal: "9 months" }
    },
    "Local Goose": {
      countries: {
        kenya: { default: { earliest: "10 months", latest: "14 months", optimal: "12 months", notes: "Local breeds. First eggs at 12-14 months." } },
        default: { earliest: "10 months", latest: "14 months", optimal: "12 months" }
      },
      default: { earliest: "10 months", latest: "14 months", optimal: "12 months" }
    },
    "Other": {
      countries: { default: { earliest: "9 months", latest: "12 months", optimal: "10.5 months", notes: "Unknown breed – consult local extension." } },
      default: { earliest: "9 months", latest: "12 months", optimal: "10.5 months" }
    }
  },

  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks", notes: "First eggs at 6-8 weeks. 250-300 eggs/year." } },
        default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks" }
      },
      default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks" }
    },
    "Coturnix Quail": {
      countries: {
        kenya: { default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks", notes: "First eggs at 6-8 weeks." } },
        default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks" }
      },
      default: { earliest: "6 weeks", latest: "8 weeks", optimal: "7 weeks" }
    },
    "Bobwhite Quail": {
      countries: {
        kenya: { default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months", notes: "First eggs at 4-5 months. Game bird." } },
        default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
      },
      default: { earliest: "4 months", latest: "5 months", optimal: "4.5 months" }
    },
    "Other": {
      countries: { default: { earliest: "2 months", latest: "3 months", optimal: "2.5 months", notes: "Unknown breed – consult local extension." } },
      default: { earliest: "2 months", latest: "3 months", optimal: "2.5 months" }
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the production timing advice for a specific poultry breed and species.
 * Returns one of: "optimal", "acceptable", "late", or "no-data"
 */
export function getPoultryProductionAdvice(
  species: string,
  breed: string,
  ageWeeks: number,
  country: string = "kenya",
  region?: string
): "optimal" | "acceptable" | "late" | "no-data" {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryProductionCalendar[speciesKey];
  if (!speciesData) return "no-data";

  const breedData = speciesData[breed];
  if (!breedData) return "no-data";

  const countryData = breedData.countries?.[country.toLowerCase()];
  if (!countryData) return "no-data";

  const regionData = region ? countryData.regions?.[region] : null;
  const timingData = regionData || countryData.default;
  if (!timingData) return "no-data";

  // Parse earliest, latest, optimal into weeks
  const parseWeeks = (str: string): number => {
    const match = str.match(/(\d+\.?\d*)\s*(?:months?|weeks?)/i);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    if (str.toLowerCase().includes("month")) return value * 4.3;
    return value;
  };

  const earliest = parseWeeks(timingData.earliest);
  const latest = parseWeeks(timingData.latest);
  const optimal = parseWeeks(timingData.optimal);

  if (earliest === 0 || latest === 0) return "no-data";

  if (ageWeeks >= earliest && ageWeeks <= latest) {
    if (ageWeeks >= earliest && ageWeeks <= optimal + 2) return "optimal";
    return "acceptable";
  }
  if (ageWeeks > latest) return "late";
  return "no-data";
}

/**
 * Get the production timing text for display.
 */
export function getPoultryProductionText(
  species: string,
  breed: string,
  ageWeeks: number,
  country: string = "kenya",
  region?: string
): string {
  const status = getPoultryProductionAdvice(species, breed, ageWeeks, country, region);
  switch (status) {
    case "optimal": return "✅ Optimal – Birds are at the right age!";
    case "acceptable": return "⚠️ Acceptable – Production may be slightly lower.";
    case "late": return "❌ Late – Consider adjusting management or selling sooner.";
    case "no-data": return "Production advice not available for this breed/location.";
    default: return "Production advice not available for this breed/location.";
  }
}

/**
 * Get the full production timing info for a breed.
 */
export function getPoultryProductionTiming(
  species: string,
  breed: string,
  country: string = "kenya",
  region?: string
): ProductionTimingInfo | null {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryProductionCalendar[speciesKey];
  if (!speciesData) return null;

  const breedData = speciesData[breed];
  if (!breedData) return null;

  const countryData = breedData.countries?.[country.toLowerCase()];
  if (!countryData) return null;

  const regionData = region ? countryData.regions?.[region] : null;
  return regionData || countryData.default || null;
}

export const poultryCalendar = poultryProductionCalendar;