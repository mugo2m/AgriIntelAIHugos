// lib/data/poultryBreeds.ts
// COMPLETE POULTRY BREED DATABASE
// Sources: KALRO, ILRI, Kenya Agricultural and Livestock Research Organization,
//          Kenchic, KUKU, local farmers, and international poultry breed standards.

export const poultryBreeds: Record<string, string[]> = {
  // ==================== CHICKENS ====================
  chicken: [
    // LAYERS (Egg Production)
    "KARI Improved Kienyeji",
    "Kuroiler",
    "Rainbow Rooster",
    "Brown Leghorn",
    "Hy-Line Brown",
    "Isa Brown",
    "Lohmann Brown",
    "Bovans Brown",
    "Dekalb White",
    "Babcock White",
    // BROILERS (Meat Production)
    "Cobb 500",
    "Ross 308",
    "Arbor Acres",
    "Hubbard",
    "Indian River",
    // MEAT & EGGS (Both)
    "Sussex",
    "Kenbrew (Kenbro)",
    "Sasso",
    "Kenya Broiler",
    "KARI Kienyeji",
    // INDIGENOUS / LOCAL
    "Local Kienyeji",
    "Local Turkana",
    "Local Bantam",
    // OTHER
    "Other"
  ],

  // ==================== TURKEYS ====================
  turkey: [
    "Broad Breasted White",
    "Broad Breasted Bronze",
    "Narragansett",
    "Royal Palm",
    "Local Turkey",
    "Other"
  ],

  // ==================== DUCKS ====================
  duck: [
    "Khaki Campbell",
    "Pekin",
    "Rouen",
    "Muscovy",
    "Indian Runner",
    "Local Duck",
    "Other"
  ],

  // ==================== GEESE ====================
  goose: [
    "African Grey",
    "Toulouse",
    "Embden",
    "Chinese",
    "Local Goose",
    "Other"
  ],

  // ==================== QUAIL ====================
  quail: [
    "Japanese Quail",
    "Coturnix Quail",
    "Bobwhite Quail",
    "Other"
  ]
};