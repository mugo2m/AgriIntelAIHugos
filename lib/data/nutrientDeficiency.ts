// lib/data/nutrientDeficiency.ts
// Nutrient deficiency symptoms database for all crops (219 crops)

export interface DeficiencySymptom {
  id: string;
  nutrient: string;
  nutrientSymbol: string;
  description: string;
  visualCues: string[];
  location: "older leaves" | "younger leaves" | "whole plant" | "specific parts";
  mobility: "mobile" | "immobile" | "partially mobile";
  severity: "mild" | "moderate" | "severe";
  affects: string[];
  correction: {
    fertilizer: string[];
    rate: string;
    application: string;
    organic?: string[];
  };
  imagePrompt?: string;
}

// ========== 12 STANDARD NUTRIENT DEFICIENCY DEFINITIONS ==========
export const nutrientDeficiencies: DeficiencySymptom[] = [
  {
    id: "deficit_nitrogen",
    nutrient: "Nitrogen",
    nutrientSymbol: "N",
    description: "Uniform yellowing (chlorosis) starting from older leaves, stunted growth, thin stems, reduced tillering.",
    visualCues: ["yellowing of older leaves", "pale green color", "stunted growth", "thin stems"],
    location: "older leaves",
    mobility: "mobile",
    severity: "moderate",
    affects: ["leaves", "stems", "overall growth"],
    correction: {
      fertilizer: ["CAN (27% N)", "UREA (46% N)", "NPK blends"],
      rate: "50-100 kg N/ha (split application)",
      application: "Soil application or foliar spray (urea 2% solution)",
      organic: ["Compost (5-10 tons/ha)", "Manure (10-20 tons/ha)", "Legume cover crops"]
    }
  },
  {
    id: "deficit_phosphorus",
    nutrient: "Phosphorus",
    nutrientSymbol: "P",
    description: "Dark green or purplish discoloration on older leaves, delayed maturity, poor root development.",
    visualCues: ["purplish tint on leaves", "dark green color", "stunted growth", "poor root system"],
    location: "older leaves",
    mobility: "mobile",
    severity: "moderate",
    affects: ["leaves", "roots", "flowering", "fruiting"],
    correction: {
      fertilizer: ["DAP (18-46-0)", "TSP (0-46-0)", "NPK 20:20:0"],
      rate: "50-100 kg P2O5/ha",
      application: "Band placement at planting",
      organic: ["Bone meal", "Rock phosphate", "Compost"]
    }
  },
  {
    id: "deficit_potassium",
    nutrient: "Potassium",
    nutrientSymbol: "K",
    description: "Yellowing and scorching (browning) of leaf margins starting on older leaves, weak stems, poor fruit quality.",
    visualCues: ["leaf margin burn", "yellow edges", "brown spots", "weak stems"],
    location: "older leaves",
    mobility: "mobile",
    severity: "moderate",
    affects: ["leaves", "stems", "fruits"],
    correction: {
      fertilizer: ["MOP (0-0-60)", "SOP (0-0-50)", "NPK blends"],
      rate: "50-100 kg K2O/ha",
      application: "Soil application, split",
      organic: ["Wood ash", "Compost", "Kelp meal"]
    }
  },
  {
    id: "deficit_calcium",
    nutrient: "Calcium",
    nutrientSymbol: "Ca",
    description: "Distorted growth of young leaves and growing points, blossom end rot in fruits, poor root tips.",
    visualCues: ["deformed young leaves", "blossom end rot", "stunted roots", "crinkled leaves"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "moderate",
    affects: ["young leaves", "fruits", "roots", "growing points"],
    correction: {
      fertilizer: ["Calcium nitrate (15.5-0-0+19%Ca)", "Gypsum (23%Ca)", "Lime"],
      rate: "50-100 kg Ca/ha",
      application: "Soil application or foliar spray (calcium chloride 0.5%)",
      organic: ["Gypsum", "Eggshell powder", "Lime"]
    }
  },
  {
    id: "deficit_magnesium",
    nutrient: "Magnesium",
    nutrientSymbol: "Mg",
    description: "Interveinal chlorosis (yellowing between veins) on older leaves, leaf curling, premature leaf drop.",
    visualCues: ["yellow between veins", "green veins", "leaf curling", "purplish tints"],
    location: "older leaves",
    mobility: "mobile",
    severity: "moderate",
    affects: ["leaves"],
    correction: {
      fertilizer: ["Magnesium sulphate (Epsom salt)", "Kieserite", "Dolomitic lime"],
      rate: "20-40 kg Mg/ha",
      application: "Soil or foliar (2% Epsom salt)",
      organic: ["Dolomitic lime", "Compost"]
    }
  },
  {
    id: "deficit_sulphur",
    nutrient: "Sulphur",
    nutrientSymbol: "S",
    description: "Uniform yellowing of young leaves (similar to N but on new growth), stunted plants, delayed maturity.",
    visualCues: ["yellow young leaves", "pale color", "stunted growth"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "mild",
    affects: ["young leaves", "overall growth"],
    correction: {
      fertilizer: ["Ammonium sulphate (21-0-0+24%S)", "Gypsum (15%S)", "Single superphosphate (11%S)"],
      rate: "20-40 kg S/ha",
      application: "Soil application",
      organic: ["Gypsum", "Compost"]
    }
  },
  {
    id: "deficit_iron",
    nutrient: "Iron",
    nutrientSymbol: "Fe",
    description: "Interveinal chlorosis on young leaves, leaves may become white or yellow with green veins, stunted growth.",
    visualCues: ["yellow between veins on new leaves", "green veins", "white leaves in severe cases"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "moderate",
    affects: ["young leaves"],
    correction: {
      fertilizer: ["Iron chelate (EDDHA, EDTA)", "Iron sulphate"],
      rate: "2-5 kg Fe/ha",
      application: "Foliar spray (0.5% iron sulphate) or soil drench",
      organic: ["Compost", "Iron sulphate"]
    }
  },
  {
    id: "deficit_zinc",
    nutrient: "Zinc",
    nutrientSymbol: "Zn",
    description: "Small, distorted leaves with interveinal chlorosis, shortened internodes (rosette), poor fruit set.",
    visualCues: ["little leaf", "yellow between veins", "short internodes", "rosette appearance"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "moderate",
    affects: ["young leaves", "internodes", "fruits"],
    correction: {
      fertilizer: ["Zinc sulphate (35%Zn)", "Zinc chelate"],
      rate: "2-5 kg Zn/ha",
      application: "Foliar spray (0.5% zinc sulphate) or soil application",
      organic: ["Compost", "Manure"]
    }
  },
  {
    id: "deficit_boron",
    nutrient: "Boron",
    nutrientSymbol: "B",
    description: "Brittle, distorted young leaves, cracked stems, poor fruit set, hollow heart in roots, fruit cracking.",
    visualCues: ["brittle leaves", "cracked stems", "poor flowering", "hollow fruit", "corky spots"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "moderate",
    affects: ["young leaves", "stems", "fruits", "roots"],
    correction: {
      fertilizer: ["Borax (11%B)", "Boric acid (17%B)", "Solubor"],
      rate: "1-2 kg B/ha",
      application: "Foliar spray (0.1-0.2%) or soil (careful – narrow window)",
      organic: ["Compost", "Manure"]
    }
  },
  {
    id: "deficit_manganese",
    nutrient: "Manganese",
    nutrientSymbol: "Mn",
    description: "Interveinal chlorosis on young leaves with small necrotic spots, leaf drop, reduced growth.",
    visualCues: ["yellow between veins on new leaves", "brown spots", "necrotic flecks"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "mild",
    affects: ["young leaves"],
    correction: {
      fertilizer: ["Manganese sulphate (32%Mn)", "Manganese chelate"],
      rate: "2-4 kg Mn/ha",
      application: "Foliar spray (0.5% manganese sulphate)",
      organic: ["Compost", "Manure"]
    }
  },
  {
    id: "deficit_molybdenum",
    nutrient: "Molybdenum",
    nutrientSymbol: "Mo",
    description: "Interveinal chlorosis and marginal necrosis on older leaves, whiptail in brassicas, poor nitrogen fixation.",
    visualCues: ["yellow between veins", "marginal burn", "whiptail (narrow leaves)"],
    location: "older leaves",
    mobility: "mobile",
    severity: "mild",
    affects: ["older leaves", "nodulation"],
    correction: {
      fertilizer: ["Sodium molybdate (39%Mo)", "Ammonium molybdate (54%Mo)"],
      rate: "0.1-0.2 kg Mo/ha",
      application: "Foliar spray (0.05%) or seed treatment",
      organic: ["Compost", "Lime (raises pH, increases Mo availability)"]
    }
  },
  {
    id: "deficit_copper",
    nutrient: "Copper",
    nutrientSymbol: "Cu",
    description: "Wilting, dieback of shoots, poor pigmentation, delayed flowering, stunted growth.",
    visualCues: ["wilting", "shoot dieback", "pale leaves", "poor flowering"],
    location: "younger leaves",
    mobility: "immobile",
    severity: "mild",
    affects: ["shoots", "leaves", "flowers"],
    correction: {
      fertilizer: ["Copper sulphate (25%Cu)", "Copper chelate"],
      rate: "1-2 kg Cu/ha",
      application: "Foliar spray (0.2% copper sulphate) – use sparingly",
      organic: ["Compost", "Manure"]
    }
  }
];

// ========== COMPLETE CROP DEFICIENCY MAPPING (ALL 219 CROPS) ==========
export const cropDeficiencySymptoms: Record<string, string[]> = {
  // ========== VEGETABLES ==========
  "african nightshade": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "amaranth": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "arugula": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "asparagus": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "beetroot": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "bok choy": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "broccoli": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "brinjals": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "cabbages": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "capsicums": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "carrots": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "cauliflower": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "celery": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron"],
  "chillies": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "collard greens": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "coriander": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "courgettes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium"],
  "cucumbers": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium"],
  "eggplants": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "endive": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "escarole": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "ethiopian kale": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_iron"],
  "french beans": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "frisee": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "garden peas": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "green beans": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "jute mallow": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "kales": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_iron"],
  "kohlrabi": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron"],
  "leeks": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_zinc"],
  "lettuce": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_iron"],
  "mustard greens": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "okra": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "onions": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_zinc"],
  "parsley": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "pumpkin leaves": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "radicchio": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "radish": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "rhubarb": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "slender leaf": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "spider plant": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "spinach": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "sweet potato leaves": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "swiss chard": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "tomatoes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron", "deficit_boron"],
  "turnip": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "turnip greens": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_boron", "deficit_molybdenum"],
  "watercress": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],

  // ========== FRUITS ==========
  "avocados": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese"],
  "bananas": ["deficit_nitrogen", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "breadfruit": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "coconut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "currant": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "date palm": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "durian": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "elderberry": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "fig": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "gooseberry": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "grapefruit": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese", "deficit_boron"],
  "guava": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "jackfruit": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "lemons": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese", "deficit_boron"],
  "limes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese", "deficit_boron"],
  "longan": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "lychee": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "mangoes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese", "deficit_boron"],
  "mangosteen": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "marula": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "mulberry": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "oranges": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron", "deficit_manganese", "deficit_boron"],
  "papayas": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "passion fruit": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_boron"],
  "pawpaws": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "persimmon": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "pineapples": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron", "deficit_zinc"],
  "pomegranate": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "rambutan": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "star fruit": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "watermelons": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "pumpkin": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium"],

  // ========== NUTS ==========
  "almond": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "brazil nut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "cashew": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "chestnut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "hazelnut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "macadamia": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_boron"],
  "pecan": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "pili nut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "pistachio": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "shea": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "walnut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],

  // ========== GRAINS & CEREALS ==========
  "amaranth grain": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "barley": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "buckwheat": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "finger millet": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "fonio": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "kamut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "maize": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_magnesium"],
  "millet": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "oats": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "quinoa": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "rice": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_iron"],
  "sorghum": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_zinc", "deficit_magnesium"],
  "spelt": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "teff": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "triticale": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "wheat": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],

  // ========== PULSES & LEGUMES ==========
  "bambaranuts": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "beans": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "chickpea": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "cowpeas": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "faba bean": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "green grams": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "groundnuts": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "lentil": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "peanut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "pigeonpeas": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "soya beans": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],

  // ========== TUBERS & ROOTS ==========
  "cassava": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "ginger": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "horseradish": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "irish potatoes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_calcium", "deficit_boron"],
  "parsnip": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "rutabaga": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_boron"],
  "sweet potatoes": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "taro": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "turmeric": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "yams": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],

  // ========== CASH CROPS ==========
  "coffee": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_manganese", "deficit_boron"],
  "cotton": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_boron"],
  "oil palm": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_boron"],
  "pyrethrum": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "rubber": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "sisal": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "sugarcane": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "sunflower": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_boron"],
  "tea": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "tobacco": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],

  // ========== OIL CROPS ==========
  "rapeseed": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_boron"],
  "safflower": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "sesame": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "simsim": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],

  // ========== COVER CROPS ==========
  "alfalfa": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "canavalia": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "clover": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "crotalaria juncea": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "crotalaria ochroleuca": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "crotalaria paulina": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "desmodium": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "dolichos": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "lucerne": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "mucuna": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "sunn hemp": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "vetch": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "white clover": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],

  // ========== FORAGE GRASSES ==========
  "brachiaria": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "buffel grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "calliandra": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "cenchrus": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "forage sorghum": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_zinc"],
  "guinea grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "italian ryegrass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "leucaena": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "napier grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "napier hybrid": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "orchard grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "rhodes grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "sesbania": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc", "deficit_molybdenum"],
  "timothy grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],

  // ========== PERENNIAL GRASSES ==========
  "bamboo": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],

  // ========== MEDICINAL PLANTS ==========
  "aloe vera": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "stinging nettle": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],

  // ========== HERBS & SPICES ==========
  "anise": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "basil": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "black pepper": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "borage": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "calendula": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "caraway": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "cardamom": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "chamomile": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "chervil": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "chives": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur"],
  "cinnamon": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "cloves": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "cumin": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "dill": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "echinacea": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "fennel": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "fenugreek": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "garlic": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_zinc"],
  "ginseng": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "goldenseal": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "hibiscus": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "hops": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "lavender": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "lemon grass": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "lovage": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "marjoram": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "mint": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "moringa": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "mustard": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron", "deficit_sulphur"],
  "nasturtium": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "oregano": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "rosemary": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "sage": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "savory": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "sorrel": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "St. John's wort": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "stevia": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "tarragon": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "thyme": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium"],
  "valerian": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "vanilla": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "wasabi": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],

  // ========== OTHER ==========
  "birds eye chili": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "cayenne": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "jalapeno": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_calcium", "deficit_magnesium", "deficit_iron"],
  "mushroom": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "oyster nut": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium"],
  "ramie": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_iron"],
  "flax": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "hemp": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron", "deficit_zinc"],
  "jute": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"],
  "garlic": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_zinc"],
  "shallots": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_zinc"],
"chives": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_sulphur", "deficit_iron"],
  "kenaf": ["deficit_nitrogen", "deficit_phosphorus", "deficit_potassium", "deficit_magnesium", "deficit_iron"]
};

// Helper function to get deficiencies by crop, optionally filtered by symptoms and location
export function getDeficienciesForCrop(
  crop: string,
  symptomText?: string,
  location?: string
): DeficiencySymptom[] {
  const cropKey = crop.toLowerCase();
  const deficiencyIds = cropDeficiencySymptoms[cropKey] || [];
  let deficiencies = deficiencyIds
    .map(id => nutrientDeficiencies.find(d => d.id === id))
    .filter((d): d is DeficiencySymptom => d !== undefined);

  // If no symptoms provided, return all deficiencies for the crop
  if (!symptomText || symptomText.trim() === "") {
    return deficiencies;
  }

  // Normalize inputs
  const lowerSymptom = symptomText.toLowerCase();
  const lowerLocation = location?.toLowerCase() || "";

  // Determine if location is "older" or "younger"
  let locationMatch: "older leaves" | "younger leaves" | "whole plant" | "specific parts" | null = null;
  if (lowerLocation.includes("older") || lowerLocation.includes("bottom")) {
    locationMatch = "older leaves";
  } else if (lowerLocation.includes("younger") || lowerLocation.includes("top") || lowerLocation.includes("new")) {
    locationMatch = "younger leaves";
  } else if (lowerLocation.includes("whole")) {
    locationMatch = "whole plant";
  }

  // Define keyword mapping for symptoms to nutrient IDs
  const symptomKeywords: Record<string, string[]> = {
    "yellow": ["deficit_nitrogen", "deficit_sulphur", "deficit_iron", "deficit_magnesium"],
    "purple": ["deficit_phosphorus"],
    "burn": ["deficit_potassium"],
    "scorch": ["deficit_potassium"],
    "margin": ["deficit_potassium"],
    "interveinal": ["deficit_magnesium", "deficit_iron", "deficit_manganese", "deficit_zinc"],
    "veins": ["deficit_magnesium", "deficit_iron", "deficit_manganese"],
    "stunted": ["deficit_nitrogen", "deficit_phosphorus", "deficit_zinc"],
    "distorted": ["deficit_calcium", "deficit_boron"],
    "brittle": ["deficit_boron"],
    "crack": ["deficit_boron", "deficit_calcium"],
    "rot": ["deficit_calcium"],
    "little leaf": ["deficit_zinc"],
    "rosette": ["deficit_zinc"],
    "dieback": ["deficit_copper"],
    "wilting": ["deficit_copper"]
  };

  // Determine which nutrient IDs are suggested by the symptom text
  let matchedIds = new Set<string>();
  for (const [keyword, ids] of Object.entries(symptomKeywords)) {
    if (lowerSymptom.includes(keyword)) {
      ids.forEach(id => matchedIds.add(id));
    }
  }

  // If no keyword match, fall back to location-based filtering
  let filtered: DeficiencySymptom[];
  if (matchedIds.size === 0) {
    // Fallback: filter by location only
    filtered = deficiencies.filter(def => {
      if (!locationMatch) return true;
      if (locationMatch === "older leaves" && def.location === "older leaves") return true;
      if (locationMatch === "younger leaves" && def.location === "younger leaves") return true;
      if (locationMatch === "whole plant") return true;
      return false;
    });
  } else {
    // Filter by matched IDs and also respect location if available
    filtered = deficiencies.filter(def => {
      const idMatch = matchedIds.has(def.id);
      if (!locationMatch) return idMatch;
      if (locationMatch === "older leaves" && def.location === "older leaves") return idMatch;
      if (locationMatch === "younger leaves" && def.location === "younger leaves") return idMatch;
      if (locationMatch === "whole plant") return idMatch;
      return false;
    });
  }

  // If after filtering we have no results, return the original list
  if (filtered.length === 0) {
    return deficiencies;
  }
  return filtered;
}

// Helper to get deficiencies by visual symptoms (without location)
export function findDeficiencyBySymptom(
  symptomKeyword: string,
  crop?: string
): DeficiencySymptom[] {
  const allDeficiencies = crop
    ? getDeficienciesForCrop(crop)  // no symptoms, returns all
    : nutrientDeficiencies;

  return allDeficiencies.filter(def =>
    def.visualCues.some(cue =>
      cue.toLowerCase().includes(symptomKeyword.toLowerCase())
    ) ||
    def.description.toLowerCase().includes(symptomKeyword.toLowerCase())
  );
}