// lib/data/poultrySpacing.ts
// POULTRY STOCKING DENSITY AND HOUSING SPACING
// Based on recommended commercial and smallholder practices
// For free‑range, deep litter, battery cages, and brooding

export interface PoultrySpacingOption {
  label: string;
  birdsPerSqM: number;      // Birds per square metre (stocking density)
  birdsPerAcre: number;     // Calculated from birdsPerSqM (1 acre = 4046.86 m²)
  floorSpaceSqFt?: number;  // Square feet per bird (optional, for US/UK users)
  description: string;
}

function calculateBirdsPerAcre(birdsPerSqM: number): number {
  return Math.floor(birdsPerSqM * 4046.86);
}

export const poultrySpacingOptions: Record<string, PoultrySpacingOption[]> = {
  // ==================== CHICKENS ====================
  chicken: [
    // --- BROODING (0-2 weeks) ---
    {
      label: "Brooding (0-2 weeks) – 50 birds/m²",
      birdsPerSqM: 50,
      birdsPerAcre: calculateBirdsPerAcre(50),
      floorSpaceSqFt: 0.2,
      description: "For chicks up to 2 weeks – use brooder rings, heat lamp. Reduce density as they grow."
    },
    {
      label: "Brooding (0-2 weeks) – 40 birds/m² (low density)",
      birdsPerSqM: 40,
      birdsPerAcre: calculateBirdsPerAcre(40),
      floorSpaceSqFt: 0.25,
      description: "Lower density reduces stress and mortality in early weeks."
    },

    // --- GROWING (3-6 weeks) ---
    {
      label: "Growing (3-6 weeks) – 20 birds/m² (deep litter)",
      birdsPerSqM: 20,
      birdsPerAcre: calculateBirdsPerAcre(20),
      floorSpaceSqFt: 0.5,
      description: "For broilers up to 6 weeks. Maintain clean litter."
    },
    {
      label: "Growing (3-6 weeks) – 15 birds/m² (low density)",
      birdsPerSqM: 15,
      birdsPerAcre: calculateBirdsPerAcre(15),
      floorSpaceSqFt: 0.7,
      description: "Better air quality and slower growth (for free‑range systems)."
    },

    // --- LAYERS (deep litter / floor) ---
    {
      label: "Layers – 7 birds/m² (deep litter, standard)",
      birdsPerSqM: 7,
      birdsPerAcre: calculateBirdsPerAcre(7),
      floorSpaceSqFt: 1.4,
      description: "Recommended for commercial layer houses with deep litter."
    },
    {
      label: "Layers – 5 birds/m² (free‑range / low density)",
      birdsPerSqM: 5,
      birdsPerAcre: calculateBirdsPerAcre(5),
      floorSpaceSqFt: 2.0,
      description: "For free‑range, organic, or enriched systems – better welfare."
    },
    {
      label: "Layers – 3 birds/m² (very low density / pastured)",
      birdsPerSqM: 3,
      birdsPerAcre: calculateBirdsPerAcre(3),
      floorSpaceSqFt: 3.3,
      description: "For pastured poultry – excellent feather condition and health."
    },

    // --- BATTERY CAGES (layers) ---
    {
      label: "Layers – Battery cages (standard – 4-6 birds/cage)",
      birdsPerSqM: 25,
      birdsPerAcre: calculateBirdsPerAcre(25),
      floorSpaceSqFt: 0.4,
      description: "Intensive system – 400‑600 cm² per bird. Legal in many countries but requires strict management."
    },
    {
      label: "Layers – Enriched cages (50% more space)",
      birdsPerSqM: 16,
      birdsPerAcre: calculateBirdsPerAcre(16),
      floorSpaceSqFt: 0.6,
      description: "Enriched cages with perches, nests, scratch pads – better welfare."
    },

    // --- BROILERS (finishing) ---
    {
      label: "Broilers (finishing) – 12 birds/m² (standard commercial)",
      birdsPerSqM: 12,
      birdsPerAcre: calculateBirdsPerAcre(12),
      floorSpaceSqFt: 0.8,
      description: "For broilers 6‑8 weeks. Requires good ventilation and litter management."
    },
    {
      label: "Broilers (finishing) – 10 birds/m² (better welfare)",
      birdsPerSqM: 10,
      birdsPerAcre: calculateBirdsPerAcre(10),
      floorSpaceSqFt: 1.0,
      description: "Improved animal welfare and reduced mortality."
    },
    {
      label: "Broilers (finishing) – 8 birds/m² (organic / slow‑growing)",
      birdsPerSqM: 8,
      birdsPerAcre: calculateBirdsPerAcre(8),
      floorSpaceSqFt: 1.2,
      description: "For slow‑growing breeds, free‑range, or organic production."
    },

    // --- INDIGENOUS / FREE‑RANGE ---
    {
      label: "Indigenous breeds – 3 birds/m² (free‑range with shelter)",
      birdsPerSqM: 3,
      birdsPerAcre: calculateBirdsPerAcre(3),
      floorSpaceSqFt: 3.3,
      description: "For improved indigenous breeds in semi‑intensive systems."
    },
    {
      label: "Local Kienyeji – 2 birds/m² (traditional free‑range)",
      birdsPerSqM: 2,
      birdsPerAcre: calculateBirdsPerAcre(2),
      floorSpaceSqFt: 5.0,
      description: "For traditional free‑range with minimal housing – birds forage most of the day."
    },

    // --- DUAL-PURPOSE / MEAT & EGGS ---
    {
      label: "Dual‑purpose breeds – 6 birds/m² (deep litter)",
      birdsPerSqM: 6,
      birdsPerAcre: calculateBirdsPerAcre(6),
      floorSpaceSqFt: 1.7,
      description: "For breeds like Sussex, Kenbrew, Sasso – good for both meat and eggs."
    },
    {
      label: "Dual‑purpose breeds – 4 birds/m² (free‑range / low density)",
      birdsPerSqM: 4,
      birdsPerAcre: calculateBirdsPerAcre(4),
      floorSpaceSqFt: 2.5,
      description: "For improved dual‑purpose breeds with outdoor access."
    },

    // --- BREEDERS ---
    {
      label: "Breeders – 5 birds/m² (deep litter)",
      birdsPerSqM: 5,
      birdsPerAcre: calculateBirdsPerAcre(5),
      floorSpaceSqFt: 2.0,
      description: "For broiler or layer breeder flocks – lower density for fertility."
    },
    {
      label: "Breeders – 3 birds/m² (free‑range)",
      birdsPerSqM: 3,
      birdsPerAcre: calculateBirdsPerAcre(3),
      floorSpaceSqFt: 3.3,
      description: "For breeder flocks with outdoor access – improves reproductive performance."
    }
  ],

  // ==================== TURKEYS ====================
  turkey: [
    {
      label: "Brooding (0-4 weeks) – 25 birds/m²",
      birdsPerSqM: 25,
      birdsPerAcre: calculateBirdsPerAcre(25),
      floorSpaceSqFt: 0.4,
      description: "For poults up to 4 weeks."
    },
    {
      label: "Growing (4-8 weeks) – 10 birds/m²",
      birdsPerSqM: 10,
      birdsPerAcre: calculateBirdsPerAcre(10),
      floorSpaceSqFt: 1.0,
      description: "For turkeys 4‑8 weeks old."
    },
    {
      label: "Finishing (8-16 weeks) – 5 birds/m²",
      birdsPerSqM: 5,
      birdsPerAcre: calculateBirdsPerAcre(5),
      floorSpaceSqFt: 2.0,
      description: "For market turkeys – floor space increases as they grow."
    },
    {
      label: "Breeders (adults) – 2 birds/m²",
      birdsPerSqM: 2,
      birdsPerAcre: calculateBirdsPerAcre(2),
      floorSpaceSqFt: 5.0,
      description: "For breeding flocks – lower density for fertility."
    },
    {
      label: "Free‑range turkeys – 1 bird/m²",
      birdsPerSqM: 1,
      birdsPerAcre: calculateBirdsPerAcre(1),
      floorSpaceSqFt: 10.0,
      description: "For pastured turkeys with outdoor access."
    }
  ],

  // ==================== DUCKS ====================
  duck: [
    {
      label: "Brooding (0-2 weeks) – 30 birds/m²",
      birdsPerSqM: 30,
      birdsPerAcre: calculateBirdsPerAcre(30),
      floorSpaceSqFt: 0.3,
      description: "For ducklings up to 2 weeks."
    },
    {
      label: "Growing (2-6 weeks) – 12 birds/m² (deep litter)",
      birdsPerSqM: 12,
      birdsPerAcre: calculateBirdsPerAcre(12),
      floorSpaceSqFt: 0.8,
      description: "For meat ducks (Pekin, Muscovy) 2‑6 weeks."
    },
    {
      label: "Layers (adults) – 6 birds/m² (deep litter)",
      birdsPerSqM: 6,
      birdsPerAcre: calculateBirdsPerAcre(6),
      floorSpaceSqFt: 1.7,
      description: "For laying ducks (Khaki Campbell, Indian Runner)."
    },
    {
      label: "Free‑range ducks – 3 birds/m²",
      birdsPerSqM: 3,
      birdsPerAcre: calculateBirdsPerAcre(3),
      floorSpaceSqFt: 3.3,
      description: "For free‑range ducks with access to water."
    },
    {
      label: "Breeders – 4 birds/m²",
      birdsPerSqM: 4,
      birdsPerAcre: calculateBirdsPerAcre(4),
      floorSpaceSqFt: 2.5,
      description: "For breeding duck flocks."
    }
  ],

  // ==================== GEESE ====================
  goose: [
    {
      label: "Brooding (0-2 weeks) – 15 birds/m²",
      birdsPerSqM: 15,
      birdsPerAcre: calculateBirdsPerAcre(15),
      floorSpaceSqFt: 0.7,
      description: "For goslings up to 2 weeks."
    },
    {
      label: "Growing (2-8 weeks) – 6 birds/m² (deep litter)",
      birdsPerSqM: 6,
      birdsPerAcre: calculateBirdsPerAcre(6),
      floorSpaceSqFt: 1.7,
      description: "For growing geese."
    },
    {
      label: "Adults (breeders/layers) – 3 birds/m²",
      birdsPerSqM: 3,
      birdsPerAcre: calculateBirdsPerAcre(3),
      floorSpaceSqFt: 3.3,
      description: "For mature geese – they need more space."
    },
    {
      label: "Free‑range geese – 1 bird/m²",
      birdsPerSqM: 1,
      birdsPerAcre: calculateBirdsPerAcre(1),
      floorSpaceSqFt: 10.0,
      description: "For pastured geese with abundant grazing."
    }
  ],

  // ==================== QUAIL ====================
  quail: [
    {
      label: "Brooding (0-2 weeks) – 100 birds/m²",
      birdsPerSqM: 100,
      birdsPerAcre: calculateBirdsPerAcre(100),
      floorSpaceSqFt: 0.1,
      description: "For quail chicks up to 2 weeks – small brooder pens."
    },
    {
      label: "Growing (2-5 weeks) – 50 birds/m² (deep litter)",
      birdsPerSqM: 50,
      birdsPerAcre: calculateBirdsPerAcre(50),
      floorSpaceSqFt: 0.2,
      description: "For quail 2‑5 weeks old."
    },
    {
      label: "Layers (adults) – 30 birds/m² (battery cages)",
      birdsPerSqM: 30,
      birdsPerAcre: calculateBirdsPerAcre(30),
      floorSpaceSqFt: 0.3,
      description: "For laying quail in battery cages – common commercial practice."
    },
    {
      label: "Layers (adults) – 20 birds/m² (floor / deep litter)",
      birdsPerSqM: 20,
      birdsPerAcre: calculateBirdsPerAcre(20),
      floorSpaceSqFt: 0.5,
      description: "For quail kept on floor litter systems."
    },
    {
      label: "Breeders – 15 birds/m²",
      birdsPerSqM: 15,
      birdsPerAcre: calculateBirdsPerAcre(15),
      floorSpaceSqFt: 0.7,
      description: "For breeding quail – lower density improves fertility."
    }
  ]
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get spacing options for a poultry species.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @returns Array of PoultrySpacingOption
 */
export function getPoultrySpacingOptions(species: string): PoultrySpacingOption[] {
  const normalized = species.toLowerCase().trim();
  return poultrySpacingOptions[normalized] || [];
}

/**
 * Get a specific spacing option by label for a given species.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param label - The full label of the option
 * @returns The matching PoultrySpacingOption or undefined
 */
export function getPoultrySpacingByLabel(species: string, label: string): PoultrySpacingOption | undefined {
  const options = getPoultrySpacingOptions(species);
  return options.find(opt => opt.label === label);
}

/**
 * Get the typical stocking density (birds/m²) for a species and system.
 * @param species - "chicken", "turkey", "duck", "goose", "quail"
 * @param systemType - "brooding", "growing", "finishing", "laying", "breeder", "free_range"
 * @returns birds per square metre (falls back to first option)
 */
export function getPoultryStockingDensity(
  species: string,
  systemType: "brooding" | "growing" | "finishing" | "laying" | "breeder" | "free_range"
): number {
  const options = getPoultrySpacingOptions(species);
  if (options.length === 0) return 10;
  // Find best match by system type in label
  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(systemType) ||
    (systemType === "free_range" && opt.label.toLowerCase().includes("free-range"))
  );
  if (filtered.length > 0) return filtered[0].birdsPerSqM;
  // Fallback to first option
  return options[0].birdsPerSqM;
}

export const poultrySpacing = poultrySpacingOptions;