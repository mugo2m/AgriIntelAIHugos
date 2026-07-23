// lib/data/poultryBiosecurity.ts
// POULTRY BIOSECURITY CHECKLIST – Practical disease prevention steps

export interface BiosecurityItem {
  id: string;
  category: "access_control" | "cleaning_disinfection" | "quarantine" | "waste_disposal" | "feed_water" | "health_monitoring";
  item: string;
  frequency: "daily" | "weekly" | "monthly" | "per_batch" | "continuous";
  importance: "critical" | "recommended" | "optional";
  costEstimate?: number; // KES (if applicable)
  notes?: string;
}

export const poultryBiosecurityChecklist: BiosecurityItem[] = [
  // ========== ACCESS CONTROL ==========
  {
    id: "acc_001",
    category: "access_control",
    item: "Footbath at entrance (Virkon S or bleach)",
    frequency: "daily",
    importance: "critical",
    costEstimate: 200,
    notes: "Replace solution every 3 days or when dirty."
  },
  {
    id: "acc_002",
    category: "access_control",
    item: "Limit visitors to poultry house",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Only essential personnel allowed."
  },
  {
    id: "acc_003",
    category: "access_control",
    item: "Change boots and clothing before entering",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Dedicated farm boots for each worker."
  },
  {
    id: "acc_004",
    category: "access_control",
    item: "Vehicle disinfection at gate",
    frequency: "daily",
    importance: "recommended",
    costEstimate: 300,
    notes: "Spray wheels and undercarriage."
  },
  {
    id: "acc_005",
    category: "access_control",
    item: "Fence perimeter to keep wild birds out",
    frequency: "continuous",
    importance: "recommended",
    costEstimate: 5000,
    notes: "Wild birds carry diseases (AI, NDV)."
  },

  // ========== CLEANING & DISINFECTION ==========
  {
    id: "clean_001",
    category: "cleaning_disinfection",
    item: "Wash drinkers and feeders daily",
    frequency: "daily",
    importance: "critical",
    costEstimate: 0,
    notes: "Use hot water and soap, rinse well."
  },
  {
    id: "clean_002",
    category: "cleaning_disinfection",
    item: "Complete house clean-out between batches",
    frequency: "per_batch",
    importance: "critical",
    costEstimate: 2000,
    notes: "Remove all litter, wash walls, floors, equipment."
  },
  {
    id: "clean_003",
    category: "cleaning_disinfection",
    item: "Disinfect house with Virkon S or formalin",
    frequency: "per_batch",
    importance: "critical",
    costEstimate: 500,
    notes: "Follow label instructions for dilution."
  },
  {
    id: "clean_004",
    category: "cleaning_disinfection",
    item: "Clean nest boxes weekly",
    frequency: "weekly",
    importance: "recommended",
    costEstimate: 0,
    notes: "Remove dirty straw, replace with clean bedding."
  },
  {
    id: "clean_005",
    category: "cleaning_disinfection",
    item: "All-in/all-out production system",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Do not mix age groups in same house."
  },

  // ========== QUARANTINE ==========
  {
    id: "quar_001",
    category: "quarantine",
    item: "Quarantine new birds for 14-21 days",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Observe for signs of disease before introducing to flock."
  },
  {
    id: "quar_002",
    category: "quarantine",
    item: "Quarantine sick birds immediately",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Remove from flock at first sign of illness."
  },
  {
    id: "quar_003",
    category: "quarantine",
    item: "Separate equipment for quarantine area",
    frequency: "continuous",
    importance: "recommended",
    costEstimate: 0,
    notes: "Do not share feeders/drinkers."
  },

  // ========== WASTE DISPOSAL ==========
  {
    id: "waste_001",
    category: "waste_disposal",
    item: "Proper disposal of dead birds (burning or deep burial)",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Do not throw in open fields or feed to dogs."
  },
  {
    id: "waste_002",
    category: "waste_disposal",
    item: "Remove and compost used litter",
    frequency: "per_batch",
    importance: "recommended",
    costEstimate: 0,
    notes: "Compost for 30+ days to kill pathogens."
  },
  {
    id: "waste_003",
    category: "waste_disposal",
    item: "Keep manure away from feed and water",
    frequency: "continuous",
    importance: "recommended",
    costEstimate: 0,
    notes: "Manure attracts flies and contaminates feed."
  },

  // ========== FEED & WATER ==========
  {
    id: "feed_001",
    category: "feed_water",
    item: "Store feed in rodent-proof containers",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 1000,
    notes: "Rodents carry salmonella and other diseases."
  },
  {
    id: "feed_002",
    category: "feed_water",
    item: "Check feed for mould before feeding",
    frequency: "daily",
    importance: "critical",
    costEstimate: 0,
    notes: "Mould causes aflatoxicosis."
  },
  {
    id: "feed_003",
    category: "feed_water",
    item: "Provide clean, fresh water daily",
    frequency: "daily",
    importance: "critical",
    costEstimate: 0,
    notes: "Dirty water spreads E. coli and other diseases."
  },
  {
    id: "feed_004",
    category: "feed_water",
    item: "Use nipple drinkers instead of open troughs",
    frequency: "continuous",
    importance: "recommended",
    costEstimate: 500,
    notes: "Reduces water contamination and prevents wet litter."
  },

  // ========== HEALTH MONITORING ==========
  {
    id: "health_001",
    category: "health_monitoring",
    item: "Monitor birds for signs of illness daily",
    frequency: "daily",
    importance: "critical",
    costEstimate: 0,
    notes: "Check for lethargy, reduced feed intake, abnormal droppings."
  },
  {
    id: "health_002",
    category: "health_monitoring",
    item: "Record mortality daily",
    frequency: "daily",
    importance: "recommended",
    costEstimate: 0,
    notes: "Sudden increase in mortality indicates outbreak."
  },
  {
    id: "health_003",
    category: "health_monitoring",
    item: "Weigh birds weekly to monitor growth",
    frequency: "weekly",
    importance: "recommended",
    costEstimate: 0,
    notes: "Poor weight gain indicates health or feed problem."
  },
  {
    id: "health_004",
    category: "health_monitoring",
    item: "Keep vaccination records",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Records help plan boosters and identify gaps."
  },
  {
    id: "health_005",
    category: "health_monitoring",
    item: "Report unusual deaths to veterinary officer",
    frequency: "continuous",
    importance: "critical",
    costEstimate: 0,
    notes: "Required by law for diseases like Avian Influenza."
  }
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get biosecurity items by category.
 */
export function getBiosecurityItems(
  category?: BiosecurityItem["category"]
): BiosecurityItem[] {
  if (!category) return poultryBiosecurityChecklist;
  return poultryBiosecurityChecklist.filter((item) => item.category === category);
}

/**
 * Get critical biosecurity items.
 */
export function getCriticalBiosecurityItems(): BiosecurityItem[] {
  return poultryBiosecurityChecklist.filter((item) => item.importance === "critical");
}

export const poultryBiosecurity = poultryBiosecurityChecklist;