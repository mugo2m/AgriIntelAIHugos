// lib/data/cropMaturity.ts
// Crop maturity periods by location (months to harvest)
// COMPLETE DATABASE – COVERS ALL 219 CROPS FROM PEST/DISEASE MAPPING

export interface MaturityInfo {
  min: number;      // Minimum months to harvest
  max: number;      // Maximum months to harvest
  typical: number;  // Typical months to harvest
  notes?: string;
}

export const cropMaturity: Record<string, Record<string, MaturityInfo>> = {
  // ==================== GRAINS & CEREALS ====================
  maize: {
    default: { min: 3, max: 5, typical: 4 },
    kenya: { min: 3, max: 6, typical: 4 },
    uganda: { min: 3, max: 5, typical: 4 },
    tanzania: { min: 3, max: 5, typical: 4 },
    nigeria: { min: 3, max: 5, typical: 4 },
    south_africa: { min: 3, max: 5, typical: 4 }
  },
  beans: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 },
    uganda: { min: 2, max: 4, typical: 3 },
    tanzania: { min: 2, max: 4, typical: 3 }
  },
  wheat: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    south_africa: { min: 4, max: 6, typical: 5 }
  },
  sorghum: {
    default: { min: 3, max: 5, typical: 4 },
    kenya: { min: 3, max: 5, typical: 4 },
    nigeria: { min: 3, max: 5, typical: 4 }
  },
  millet: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    nigeria: { min: 3, max: 4, typical: 3.5 }
  },
  rice: {
    default: { min: 3, max: 6, typical: 4 },
    kenya: { min: 3, max: 5, typical: 4 },
    tanzania: { min: 3, max: 5, typical: 4 },
    nigeria: { min: 3, max: 5, typical: 4 },
    egypt: { min: 4, max: 6, typical: 5 },
    india: { min: 3, max: 5, typical: 4 }
  },
  barley: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    south_africa: { min: 4, max: 5, typical: 4.5 }
  },
  finger_millet: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    uganda: { min: 3, max: 4, typical: 3.5 }
  },
  oats: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 }
  },
  teff: {
    default: { min: 3, max: 4, typical: 3.5 },
    ethiopia: { min: 3, max: 4, typical: 3.5 }
  },
  triticale: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  buckwheat: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  quinoa: {
    default: { min: 3, max: 4, typical: 3.5 },
    peru: { min: 4, max: 5, typical: 4.5 }
  },
  fonio: {
    default: { min: 2, max: 3, typical: 2.5 },
    west_africa: { min: 2, max: 3, typical: 2.5 }
  },
  spelt: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  kamut: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  amaranth_grain: {
    default: { min: 2, max: 3, typical: 2.5 }
  },

  // ==================== PULSES & LEGUMES ====================
  soya_beans: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    nigeria: { min: 3, max: 4, typical: 3.5 }
  },
  cowpeas: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 },
    nigeria: { min: 2, max: 3, typical: 2.5 }
  },
  green_grams: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 }
  },
  bambara_nuts: {
    default: { min: 3, max: 4, typical: 3.5 },
    west_africa: { min: 3, max: 4, typical: 3.5 }
  },
  groundnuts: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    nigeria: { min: 3, max: 4, typical: 3.5 }
  },
  pigeonpeas: {
    default: { min: 4, max: 9, typical: 6 },
    kenya: { min: 4, max: 9, typical: 6 },
    india: { min: 4, max: 8, typical: 6 }
  },
  chickpea: {
    default: { min: 3, max: 4, typical: 3.5 },
    india: { min: 3, max: 4, typical: 3.5 }
  },
  lentil: {
    default: { min: 3, max: 4, typical: 3.5 },
    india: { min: 3, max: 4, typical: 3.5 }
  },
  faba_bean: {
    default: { min: 3, max: 4, typical: 3.5 },
    ethiopia: { min: 4, max: 5, typical: 4.5 }
  },
  peanut: {
    default: { min: 3, max: 4, typical: 3.5 }
  },

  // ==================== VEGETABLES ====================
  tomatoes: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 },
    uganda: { min: 2, max: 4, typical: 3 }
  },
  onions: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    nigeria: { min: 3, max: 4, typical: 3.5 }
  },
  cabbages: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 }
  },
  kales: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 }
  },
  carrots: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 }
  },
  capsicums: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 }
  },
  chillies: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 }
  },
  birds_eye_chili: {
    default: { min: 2, max: 4, typical: 3 }
  },
  cayenne: {
    default: { min: 2, max: 4, typical: 3 }
  },
  jalapeno: {
    default: { min: 2, max: 4, typical: 3 }
  },
  brinjals: {
    default: { min: 2, max: 4, typical: 3 },
    kenya: { min: 2, max: 4, typical: 3 }
  },
  french_beans: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 }
  },
  garden_peas: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  spinach: {
    default: { min: 1.5, max: 2.5, typical: 2 },
    kenya: { min: 1.5, max: 2.5, typical: 2 }
  },
  okra: {
    default: { min: 2, max: 3, typical: 2.5 },
    kenya: { min: 2, max: 3, typical: 2.5 }
  },
  cauliflower: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  lettuce: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  broccoli: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  celery: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  leeks: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  beetroot: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  radish: {
    default: { min: 1, max: 2, typical: 1.5 }
  },
  pumpkin_leaves: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  sweet_potato_leaves: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  jute_mallow: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  spider_plant: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  african_nightshade: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  amaranth: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  ethiopian_kale: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  coriander: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  parsley: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  arugula: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  endive: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  kohlrabi: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  watercress: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  pumpkin: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  courgettes: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  cucumbers: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  artichoke: {
    default: { min: 12, max: 18, typical: 15 }
  },
  asparagus: {
    default: { min: 24, max: 36, typical: 30 } // first harvest after 2 years
  },
  rhubarb: {
    default: { min: 12, max: 24, typical: 18 }
  },
  wasabi: {
    default: { min: 18, max: 24, typical: 20 }
  },
  bok_choy: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  collard_greens: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  mustard_greens: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  swiss_chard: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  radicchio: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  escarole: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  frisee: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  turnip_greens: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  rutabaga: {
    default: { min: 3, max: 4, typical: 3.5 }
  },

  // ==================== TUBERS & ROOTS ====================
  irish_potatoes: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 },
    uganda: { min: 3, max: 4, typical: 3.5 }
  },
  cassava: {
    default: { min: 8, max: 12, typical: 10 },
    kenya: { min: 8, max: 12, typical: 10 },
    nigeria: { min: 8, max: 12, typical: 10 },
    ghana: { min: 8, max: 12, typical: 10 }
  },
  sweet_potatoes: {
    default: { min: 3, max: 5, typical: 4 },
    kenya: { min: 3, max: 5, typical: 4 },
    uganda: { min: 3, max: 5, typical: 4 }
  },
  yams: {
    default: { min: 7, max: 12, typical: 9 },
    nigeria: { min: 7, max: 12, typical: 9 },
    ghana: { min: 7, max: 12, typical: 9 }
  },
  taro: {
    default: { min: 6, max: 12, typical: 8 },
    pacific: { min: 8, max: 12, typical: 10 }
  },
  ginger: {
    default: { min: 8, max: 10, typical: 9 },
    india: { min: 8, max: 10, typical: 9 }
  },
  turmeric: {
    default: { min: 8, max: 10, typical: 9 },
    india: { min: 8, max: 10, typical: 9 }
  },
  horseradish: {
    default: { min: 12, max: 18, typical: 15 }
  },
  parsnip: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  turnip: {
    default: { min: 2, max: 3, typical: 2.5 }
  },

  // ==================== FRUITS ====================
  avocados: {
    default: { min: 36, max: 48, typical: 42 },
    kenya: { min: 36, max: 48, typical: 42 },
    mexico: { min: 36, max: 48, typical: 42 }
  },
  bananas: {
    default: { min: 9, max: 12, typical: 10 },
    kenya: { min: 9, max: 12, typical: 10 },
    uganda: { min: 9, max: 12, typical: 10 },
    philippines: { min: 9, max: 12, typical: 10 }
  },
  mangoes: {
    default: { min: 36, max: 60, typical: 48 },
    kenya: { min: 36, max: 60, typical: 48 },
    india: { min: 36, max: 60, typical: 48 }
  },
  oranges: {
    default: { min: 24, max: 36, typical: 30 },
    kenya: { min: 24, max: 36, typical: 30 }
  },
  lemons: {
    default: { min: 24, max: 36, typical: 30 }
  },
  limes: {
    default: { min: 24, max: 36, typical: 30 }
  },
  grapefruit: {
    default: { min: 24, max: 36, typical: 30 }
  },
  pineapples: {
    default: { min: 18, max: 24, typical: 21 },
    kenya: { min: 18, max: 24, typical: 21 },
    costa_rica: { min: 18, max: 24, typical: 21 }
  },
  watermelons: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  pawpaws: {
    default: { min: 9, max: 12, typical: 10 }
  },
  passion_fruit: {
    default: { min: 18, max: 24, typical: 20 },
    kenya: { min: 18, max: 24, typical: 20 }
  },
  guava: {
    default: { min: 24, max: 36, typical: 30 }
  },
  jackfruit: {
    default: { min: 36, max: 60, typical: 48 }
  },
  breadfruit: {
    default: { min: 36, max: 60, typical: 48 }
  },
  pomegranate: {
    default: { min: 24, max: 36, typical: 30 }
  },
  star_fruit: {
    default: { min: 24, max: 36, typical: 30 }
  },
  coconut: {
    default: { min: 60, max: 84, typical: 72 },
    kenya: { min: 60, max: 84, typical: 72 }
  },
  fig: {
    default: { min: 24, max: 36, typical: 30 }
  },
  date_palm: {
    default: { min: 48, max: 60, typical: 54 }
  },
  mulberry: {
    default: { min: 24, max: 36, typical: 30 }
  },
  lychee: {
    default: { min: 36, max: 48, typical: 42 }
  },
  persimmon: {
    default: { min: 36, max: 48, typical: 42 }
  },
  gooseberry: {
    default: { min: 24, max: 36, typical: 30 }
  },
  currant: {
    default: { min: 24, max: 36, typical: 30 }
  },
  elderberry: {
    default: { min: 24, max: 36, typical: 30 }
  },
  rambutan: {
    default: { min: 36, max: 48, typical: 42 }
  },
  durian: {
    default: { min: 48, max: 60, typical: 54 }
  },
  mangosteen: {
    default: { min: 60, max: 84, typical: 72 }
  },
  longan: {
    default: { min: 36, max: 48, typical: 42 }
  },
  marula: {
    default: { min: 60, max: 84, typical: 72 }
  },

  // ==================== NUTS ====================
  macadamia: {
    default: { min: 48, max: 60, typical: 54 },
    kenya: { min: 48, max: 60, typical: 54 }
  },
  cashew: {
    default: { min: 36, max: 48, typical: 42 },
    kenya: { min: 36, max: 48, typical: 42 },
    india: { min: 36, max: 48, typical: 42 }
  },
  almond: {
    default: { min: 36, max: 48, typical: 42 },
    usa: { min: 36, max: 48, typical: 42 }
  },
  brazil_nut: {
    default: { min: 96, max: 120, typical: 108 }
  },
  chestnut: {
    default: { min: 60, max: 84, typical: 72 }
  },
  hazelnut: {
    default: { min: 36, max: 48, typical: 42 }
  },
  pecan: {
    default: { min: 72, max: 96, typical: 84 }
  },
  pistachio: {
    default: { min: 60, max: 84, typical: 72 }
  },
  shea: {
    default: { min: 120, max: 180, typical: 150 }
  },
  walnut: {
    default: { min: 60, max: 84, typical: 72 }
  },
  pili_nut: {
    default: { min: 60, max: 84, typical: 72 }
  },

  // ==================== CASH CROPS ====================
  coffee: {
    default: { min: 36, max: 48, typical: 42 },
    kenya: { min: 36, max: 48, typical: 42 },
    ethiopia: { min: 36, max: 48, typical: 42 },
    colombia: { min: 36, max: 48, typical: 42 }
  },
  tea: {
    default: { min: 36, max: 48, typical: 42 },
    kenya: { min: 36, max: 48, typical: 42 },
    india: { min: 36, max: 48, typical: 42 }
  },
  cocoa: {
    default: { min: 36, max: 60, typical: 48 },
    ghana: { min: 36, max: 60, typical: 48 },
    cote_divoire: { min: 36, max: 60, typical: 48 }
  },
  cotton: {
    default: { min: 4, max: 6, typical: 5 },
    kenya: { min: 4, max: 6, typical: 5 }
  },
  sugarcane: {
    default: { min: 12, max: 18, typical: 15 },
    kenya: { min: 12, max: 18, typical: 15 },
    brazil: { min: 12, max: 18, typical: 15 }
  },
  tobacco: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 }
  },
  sunflower: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 }
  },
  simsim: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  sesame: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  pyrethrum: {
    default: { min: 12, max: 24, typical: 18 },
    kenya: { min: 12, max: 24, typical: 18 }
  },
  sisal: {
    default: { min: 24, max: 36, typical: 30 },
    kenya: { min: 24, max: 36, typical: 30 }
  },
  oil_palm: {
    default: { min: 36, max: 48, typical: 42 },
    malaysia: { min: 36, max: 48, typical: 42 },
    indonesia: { min: 36, max: 48, typical: 42 }
  },
  rubber: {
    default: { min: 60, max: 84, typical: 72 },
    thailand: { min: 60, max: 84, typical: 72 }
  },

  // ==================== OIL CROPS ====================
  rapeseed: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  safflower: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  mustard: {
    default: { min: 2, max: 3, typical: 2.5 }
  },

  // ==================== HERBS & SPICES ====================
  basil: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  mint: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  rosemary: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  thyme: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  oregano: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  sage: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  lavender: {
    default: { min: 12, max: 18, typical: 15 }
  },
  chamomile: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  echinacea: {
    default: { min: 12, max: 24, typical: 18 }
  },
  ginseng: {
    default: { min: 48, max: 72, typical: 60 }
  },
  goldenseal: {
    default: { min: 36, max: 48, typical: 42 }
  },
  hibiscus: {
    default: { min: 4, max: 5, typical: 4.5 }
  },
  hops: {
    default: { min: 12, max: 24, typical: 18 }
  },
  lemon_grass: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  moringa: {
    default: { min: 6, max: 8, typical: 7 }
  },
  stevia: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  fenugreek: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  cumin: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  caraway: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  anise: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  dill: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  fennel: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  lovage: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  marjoram: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  tarragon: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  sorrel: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  chervil: {
    default: { min: 1.5, max: 2.5, typical: 2 }
  },
  savory: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  calendula: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  nasturtium: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  borage: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  st_johns_wort: {
    default: { min: 12, max: 18, typical: 15 }
  },
  valerian: {
    default: { min: 12, max: 18, typical: 15 }
  },
  vanilla: {
    default: { min: 36, max: 48, typical: 42 },
    madagascar: { min: 36, max: 48, typical: 42 }
  },
  black_pepper: {
    default: { min: 24, max: 36, typical: 30 },
    vietnam: { min: 24, max: 36, typical: 30 }
  },
  cardamom: {
    default: { min: 24, max: 36, typical: 30 },
    guatemala: { min: 24, max: 36, typical: 30 }
  },
  cinnamon: {
    default: { min: 24, max: 36, typical: 30 },
    sri_lanka: { min: 24, max: 36, typical: 30 }
  },
  cloves: {
    default: { min: 48, max: 60, typical: 54 },
    tanzania: { min: 48, max: 60, typical: 54 }
  },

  // ==================== FORAGE & COVER CROPS ====================
  alfalfa: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  lucerne: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  clover: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  white_clover: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  vetch: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  mucuna: {
    default: { min: 4, max: 6, typical: 5 }
  },
  desmodium: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  dolichos: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  canavalia: {
    default: { min: 4, max: 6, typical: 5 }
  },
  crotalaria_paulina: {
    default: { min: 4, max: 5, typical: 4.5 }
  },
  sunn_hemp: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  brachiaria: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  buffel_grass: {
    default: { min: 4, max: 5, typical: 4.5 }
  },
  guinea_grass: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  italian_ryegrass: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  napier_grass: {
    default: { min: 3, max: 4, typical: 3.5 },
    kenya: { min: 3, max: 4, typical: 3.5 }
  },
  napier_hybrid: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  orchard_grass: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  rhodes_grass: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  timothy_grass: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  forage_sorghum: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  calliandra: {
    default: { min: 12, max: 18, typical: 15 }
  },
  leucaena: {
    default: { min: 12, max: 18, typical: 15 }
  },
  sesbania: {
    default: { min: 6, max: 8, typical: 7 }
  },
  cenchrus: {
    default: { min: 4, max: 5, typical: 4.5 }
  },

  // ==================== PERENNIAL GRASSES ====================
  bamboo: {
    default: { min: 36, max: 60, typical: 48 }
  },

  // ==================== MEDICINAL & OTHER ====================
  aloe_vera: {
    default: { min: 24, max: 36, typical: 30 }
  },
  stinging_nettle: {
    default: { min: 2, max: 3, typical: 2.5 }
  },
  mushroom: {
    default: { min: 0.5, max: 1, typical: 0.75, notes: "Weeks to first harvest" }
  },
  oyster_nut: {
    default: { min: 24, max: 36, typical: 30 }
  },
  ramie: {
    default: { min: 12, max: 18, typical: 15 }
  },
  flax: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  hemp: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  jute: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  shallots: {
  default: { min: 4, max: 6, typical: 5 },
  kenya: { min: 4, max: 5, typical: 4.5 },
  uganda: { min: 4, max: 5, typical: 4.5 },
  tanzania: { min: 4, max: 5, typical: 4.5 }
},

chives: {
  default: { min: 3, max: 4, typical: 3.5 },
  kenya: { min: 3, max: 4, typical: 3.5 },
  uganda: { min: 3, max: 4, typical: 3.5 },
  tanzania: { min: 3, max: 4, typical: 3.5 }
},
  garlic: {
  default: { min: 5, max: 9, typical: 7 },
  kenya: { min: 5, max: 7, typical: 6 },
  uganda: { min: 5, max: 7, typical: 6 },
  tanzania: { min: 5, max: 7, typical: 6 },
  egypt: { min: 5, max: 7, typical: 6 },
  spain: { min: 5, max: 7, typical: 6 }
},
  kenaf: {
    default: { min: 3, max: 4, typical: 3.5 }
  },
  slender_leaf: {
    default: { min: 2, max: 3, typical: 2.5 }
  }
};

// Helper functions
export function getCropMaturityPeriod(
  crop: string,
  country: string = 'default',
  region?: string
): number {
  const cropKey = crop.toLowerCase().replace(/\s+/g, '_');
  const cropData = cropMaturity[cropKey];

  if (!cropData) return 4; // Default 4 months

  const countryLower = country.toLowerCase();
  const countryData = cropData[countryLower];
  if (countryData) return countryData.typical;

  // Fallback to default
  return cropData.default?.typical || 4;
}

export function getCropMaturityRange(
  crop: string,
  country: string = 'default'
): { min: number; max: number; typical: number; notes?: string } {
  const cropKey = crop.toLowerCase().replace(/\s+/g, '_');
  const cropData = cropMaturity[cropKey];

  if (!cropData) return { min: 3, max: 5, typical: 4 };

  const countryLower = country.toLowerCase();
  const countryData = cropData[countryLower];
  if (countryData) return countryData;

  // Fallback to default
  return cropData.default || { min: 3, max: 5, typical: 4 };
}