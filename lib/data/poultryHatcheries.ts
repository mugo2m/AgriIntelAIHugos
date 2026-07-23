// lib/data/poultryHatcheries.ts
// POULTRY HATCHERIES – Sources for day‑old chicks in Kenya
// For future expansion: add more countries

export interface Hatchery {
  name: string;
  location: string;
  county: string;
  country: string;
  breedsSupplied: string[];
  pricePerChick: number; // KES
  minimumOrder: number;
  vaccinationStatus: string[];
  phone: string;
  email?: string;
  website?: string;
  notes?: string;
}

export const poultryHatcheries: Hatchery[] = [
  // ========== KENYA ==========
  {
    name: "Kenchic Ltd",
    location: "Nairobi",
    county: "Nairobi",
    country: "Kenya",
    breedsSupplied: ["Cobb 500", "Ross 308", "Kuroiler", "Hy-Line Brown"],
    pricePerChick: 120,
    minimumOrder: 500,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 720 123 456",
    email: "info@kenchic.co.ke",
    website: "https://kenchic.co.ke",
    notes: "Largest commercial hatchery in Kenya."
  },
  {
    name: "KUKU (Kisumu Urban Agriculture)",
    location: "Kisumu",
    county: "Kisumu",
    country: "Kenya",
    breedsSupplied: ["KARI Improved Kienyeji", "Local Kienyeji", "Kuroiler"],
    pricePerChick: 80,
    minimumOrder: 100,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 715 123 456",
    notes: "Focus on indigenous breeds for smallholder farmers."
  },
  {
    name: "KALRO (Kenya Agricultural & Livestock Research Organisation)",
    location: "Naivasha",
    county: "Nakuru",
    country: "Kenya",
    breedsSupplied: ["KARI Improved Kienyeji", "Kenbrew (Kenbro)", "Sussex"],
    pricePerChick: 70,
    minimumOrder: 100,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 722 123 456",
    email: "info@kalro.org",
    website: "https://kalro.org",
    notes: "Government research institution – sells improved breeds."
  },
  {
    name: "Alpha Broilers Ltd",
    location: "Thika",
    county: "Kiambu",
    country: "Kenya",
    breedsSupplied: ["Cobb 500", "Ross 308"],
    pricePerChick: 115,
    minimumOrder: 300,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 733 123 456",
    notes: "Specialises in broiler chicks."
  },
  {
    name: "Poultry Plus Hatchery",
    location: "Nakuru",
    county: "Nakuru",
    country: "Kenya",
    breedsSupplied: ["Kuroiler", "KARI Improved Kienyeji", "Hy-Line Brown"],
    pricePerChick: 90,
    minimumOrder: 50,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 721 123 456",
    notes: "Serves smallholder farmers in Rift Valley."
  },
  {
    name: "Eldoret Poultry Farm",
    location: "Eldoret",
    county: "Uasin Gishu",
    country: "Kenya",
    breedsSupplied: ["Kenbrew (Kenbro)", "Sussex", "Local Kienyeji"],
    pricePerChick: 85,
    minimumOrder: 100,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+254 733 456 789",
    notes: "Specialises in dual-purpose breeds for highland areas."
  },
  {
    name: "Coast Poultry",
    location: "Mombasa",
    county: "Mombasa",
    country: "Kenya",
    breedsSupplied: ["KARI Improved Kienyeji", "Local Kienyeji", "Kuroiler"],
    pricePerChick: 90,
    minimumOrder: 50,
    vaccinationStatus: ["Marek's Disease"],
    phone: "+254 722 456 789",
    notes: "Serves coastal farmers, good heat-adapted breeds."
  },
  // ========== UGANDA ==========
  {
    name: "UGAFAC Hatchery",
    location: "Kampala",
    county: "Kampala",
    country: "Uganda",
    breedsSupplied: ["Kuroiler", "Sussex", "Local Kienyeji"],
    pricePerChick: 120,
    minimumOrder: 100,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+256 700 123 456",
    notes: "Largest hatchery in Uganda."
  },
  // ========== TANZANIA ==========
  {
    name: "TANZANIA Poultry Ltd",
    location: "Dar es Salaam",
    county: "Dar es Salaam",
    country: "Tanzania",
    breedsSupplied: ["Cobb 500", "Ross 308", "Kuroiler"],
    pricePerChick: 110,
    minimumOrder: 200,
    vaccinationStatus: ["Marek's Disease", "Newcastle Disease"],
    phone: "+255 712 123 456",
    notes: "Commercial hatchery in Tanzania."
  }
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get hatcheries by country.
 */
export function getHatcheriesByCountry(country: string): Hatchery[] {
  return poultryHatcheries.filter((h) => h.country.toLowerCase() === country.toLowerCase());
}

/**
 * Get hatcheries supplying a specific breed.
 */
export function getHatcheriesByBreed(breed: string): Hatchery[] {
  return poultryHatcheries.filter((h) =>
    h.breedsSupplied.some((b) => b.toLowerCase().includes(breed.toLowerCase()))
  );
}

/**
 * Get hatcheries by county.
 */
export function getHatcheriesByCounty(county: string): Hatchery[] {
  return poultryHatcheries.filter((h) =>
    h.county.toLowerCase().includes(county.toLowerCase())
  );
}

export const hatcheries = poultryHatcheries;