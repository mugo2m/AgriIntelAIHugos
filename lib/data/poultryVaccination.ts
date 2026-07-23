// lib/data/poultryVaccination.ts
// POULTRY VACCINATION SCHEDULES – Breed and region-specific
// Based on KALRO, FAO, and Kenyan veterinary recommendations

export interface VaccinationRecord {
  disease: string;
  vaccineType: "live" | "inactivated" | "recombinant" | "toxoid";
  ageDays: number;          // Days from hatch when vaccine should be given
  route: "eye_drop" | "drinking_water" | "spray" | "subcutaneous_injection" | "intramuscular_injection" | "wing_web" | "in_ovo";
  boosterInterval?: number; // Days after primary vaccination
  boosterRoute?: string;
  costPerDose: number;      // KES per bird
  coldChainRequired: boolean;
  packageSize: string;      // e.g., "200 doses", "1000 doses"
  notes?: string;
  isOptional?: boolean;
  regionSpecific?: string[];
}

export const poultryVaccinationSchedules: Record<string, Record<string, VaccinationRecord[]>> = {
  // ==================== CHICKENS ====================
  chicken: {
    // --- LAYERS & DUAL-PURPOSE (Standard schedule) ---
    "KARI Improved Kienyeji": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses",
        notes: "Given at hatchery. Critical for protection against Marek's."
      },
      {
        disease: "Infectious Bursal Disease (IBD / Gumboro)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        boosterInterval: 28,
        boosterRoute: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Intermediate strain recommended for high maternal antibody levels."
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Lasota strain. Must be kept cold. Use within 2 hours of reconstitution."
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        boosterInterval: 90,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Repeat every 3 months in high-risk areas."
      },
      {
        disease: "Fowl Pox",
        vaccineType: "live",
        ageDays: 56,
        route: "wing_web",
        costPerDose: 1.75,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Check for take (small scab) 7-10 days post-vaccination."
      },
      {
        disease: "Infectious Bronchitis (IB)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.25,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Massachusetts strain. Often combined with NDV vaccine."
      },
      {
        disease: "Egg Drop Syndrome (EDS-76)",
        vaccineType: "inactivated",
        ageDays: 112,
        route: "subcutaneous_injection",
        costPerDose: 1.0,
        coldChainRequired: true,
        packageSize: "500ml = 1,000 doses",
        notes: "For layers only. Given at point of lay (16-18 weeks)."
      }
    ],
    "Kuroiler": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses",
        notes: "Given at hatchery."
      },
      {
        disease: "Infectious Bursal Disease (IBD)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        boosterInterval: 28,
        boosterRoute: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        boosterInterval: 90,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Fowl Pox",
        vaccineType: "live",
        ageDays: 56,
        route: "wing_web",
        costPerDose: 1.75,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Infectious Bronchitis (IB)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.25,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ],
    "Kenbrew (Kenbro)": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses"
      },
      {
        disease: "Infectious Bursal Disease (IBD)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        boosterInterval: 28,
        boosterRoute: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        boosterInterval: 90,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ],
    "Sussex": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses"
      },
      {
        disease: "Infectious Bursal Disease (IBD)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        boosterInterval: 28,
        boosterRoute: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        boosterInterval: 90,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Fowl Pox",
        vaccineType: "live",
        ageDays: 56,
        route: "wing_web",
        costPerDose: 1.75,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ],
    // --- BROILERS (Shortened schedule) ---
    "Cobb 500": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses"
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Broilers only need one NDV vaccination before market."
      },
      {
        disease: "Infectious Bronchitis (IB)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        costPerDose: 2.25,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Often combined with NDV."
      },
      {
        disease: "Infectious Bursal Disease (IBD)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ],
    "Ross 308": [
      {
        disease: "Marek's Disease",
        vaccineType: "live",
        ageDays: 1,
        route: "subcutaneous_injection",
        costPerDose: 1.5,
        coldChainRequired: true,
        packageSize: "1,000 doses"
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Infectious Bronchitis (IB)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        costPerDose: 2.25,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Infectious Bursal Disease (IBD)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ],
    // --- INDIGENOUS (Minimal schedule) ---
    "Local Kienyeji": [
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Minimum recommended for indigenous chickens."
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        boosterInterval: 90,
        boosterRoute: "drinking_water",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Repeat every 3 months in high-risk areas."
      },
      {
        disease: "Fowl Pox",
        vaccineType: "live",
        ageDays: 56,
        route: "wing_web",
        costPerDose: 1.75,
        coldChainRequired: true,
        packageSize: "200 doses",
        isOptional: true
      }
    ]
  },
  // ==================== TURKEYS ====================
  turkey: {
    "Broad Breasted White": [
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        boosterInterval: 14,
        boosterRoute: "drinking_water",
        costPerDose: 3.0,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Turkeys are susceptible – vaccinate."
      },
      {
        disease: "Newcastle Disease (NDV) Booster",
        vaccineType: "live",
        ageDays: 56,
        route: "drinking_water",
        costPerDose: 3.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      },
      {
        disease: "Fowl Pox",
        vaccineType: "live",
        ageDays: 56,
        route: "wing_web",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ]
  },
  // ==================== DUCKS ====================
  duck: {
    "Pekin": [
      {
        disease: "Duck Plague (Duck Enteritis)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        costPerDose: 3.0,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Vaccinate in endemic areas."
      },
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "eye_drop",
        costPerDose: 2.5,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Ducks are less susceptible but can carry virus."
      }
    ],
    "Khaki Campbell": [
      {
        disease: "Duck Plague (Duck Enteritis)",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        costPerDose: 3.0,
        coldChainRequired: true,
        packageSize: "200 doses"
      }
    ]
  },
  // ==================== QUAIL ====================
  quail: {
    "Japanese Quail": [
      {
        disease: "Newcastle Disease (NDV)",
        vaccineType: "live",
        ageDays: 7,
        route: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses",
        notes: "Quail are susceptible – vaccinate if there is risk."
      },
      {
        disease: "Ulcerative Enteritis",
        vaccineType: "live",
        ageDays: 14,
        route: "drinking_water",
        costPerDose: 2.0,
        coldChainRequired: true,
        packageSize: "200 doses",
        isOptional: true
      }
    ]
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the vaccination schedule for a specific breed and species.
 */
export function getPoultryVaccinationSchedule(
  species: string,
  breed: string
): VaccinationRecord[] {
  const speciesKey = species.toLowerCase();
  const speciesData = poultryVaccinationSchedules[speciesKey];
  if (!speciesData) return [];

  return speciesData[breed] || [];
}

/**
 * Get vaccines due at a specific age (in days).
 */
export function getVaccinesDueAtAge(
  species: string,
  breed: string,
  ageDays: number
): VaccinationRecord[] {
  const schedule = getPoultryVaccinationSchedule(species, breed);
  return schedule.filter((v) => v.ageDays <= ageDays && v.ageDays + 7 >= ageDays);
}

export const poultryVaccination = poultryVaccinationSchedules;