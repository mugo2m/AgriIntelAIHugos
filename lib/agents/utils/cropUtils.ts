// lib/agents/utils/cropUtils.ts
import { cropVarieties } from "@/lib/data/varieties";
import { getSpacingOptions } from "@/lib/data/spacing";
import { cropPestDiseaseMap } from "@/lib/data/pestDiseaseMapping";

export { getSpacingOptions } from "@/lib/data/spacing";

export const cropCategories = {
  grains: [
    "maize", "beans", "wheat", "sorghum", "millet", "rice", "barley", "finger millet",
    "oats", "teff", "triticale", "buckwheat", "quinoa", "fonio", "spelt", "kamut", "amaranth grain"
  ],
  pulses: [
    "soya beans", "cowpeas", "green grams", "bambara nuts", "groundnuts", "pigeonpeas",
    "chickpea", "lentil", "faba bean", "peanut", "fenugreek", "caraway", "anise", "cumin"
  ],
  cash: [
    "coffee", "cotton", "sugarcane", "tobacco", "sunflower", "simsim", "pyrethrum",
    "tea", "cocoa", "sisal", "oil palm", "rubber", "kenaf", "jute", "flax", "hemp"
  ],
  tubers: [
    "cassava", "sweet potatoes", "irish potatoes", "yams", "taro", "ginger", "turmeric",
    "horseradish", "parsnip", "turnip", "rutabaga", "radish", "beetroot", "carrots"
  ],
  vegetables: [
    "tomatoes", "cabbage", "kales", "onions", "capsicums", "chillies", "brinjals",
    "french beans", "garden peas", "spinach", "okra", "cauliflower", "lettuce", "broccoli",
    "celery", "leeks", "pumpkin", "courgettes", "cucumbers", "artichoke", "asparagus",
    "arugula", "endive", "kohlrabi", "watercress", "pumpkin leaves", "sweet potato leaves",
    "jute mallow", "spider plant", "african nightshade", "amaranth", "ethiopian kale",
    "coriander", "parsley", "dill", "fennel", "radicchio", "escarole", "frisee",
    "turnip greens", "mustard greens", "collard greens", "bok choy", "Swiss chard"
  ],
  fruits: [
    "bananas", "oranges", "pineapples", "mangoes", "avocados", "pawpaws", "passion fruit",
    "citrus", "watermelon", "grapefruit", "lemons", "limes", "guava", "jackfruit",
    "breadfruit", "pomegranate", "star fruit", "coconut", "fig", "date palm", "mulberry",
    "lychee", "persimmon", "gooseberry", "currant", "elderberry", "rambutan", "durian",
    "mangosteen", "longan", "marula"
  ],
  nuts: [
    "macadamia", "cashew", "almond", "brazil nut", "chestnut", "hazelnut", "pecan",
    "pistachio", "shea", "walnut", "pili nut"
  ],
  cover: [
    "mucuna", "desmodium", "dolichos", "canavalia", "crotalaria ochroleuca",
    "crotalaria juncea", "crotalaria paulina", "vetch", "clover", "alfalfa", "lucerne"
  ],
  herbs: [
    "basil", "mint", "rosemary", "thyme", "oregano", "sage", "lavender", "chamomile",
    "echinacea", "ginseng", "goldenseal", "hibiscus", "hops", "lemon grass", "moringa",
    "mustard", "rapeseed", "safflower", "wasabi", "stevia", "lovage", "marjoram",
    "tarragon", "sorrel", "chervil", "savory", "calendula", "nasturtium", "borage",
    "St. John's wort", "valerian"
  ],
  forage: [
    "brachiaria", "buffel_grass", "guinea_grass", "italian_ryegrass", "lucerne",
    "napier grass", "napier_hybrid", "orchard_grass", "rhodes grass", "timothy_grass",
    "white_clover", "alfalfa", "forage_sorghum", "calliandra", "cenchrus", "leucaena", "sesbania"
  ],
  medicinal: ["aloe vera", "stinging nettle", "watercress", "echinacea", "ginseng", "goldenseal"],
  other: ["bamboo", "oyster nut", "mushroom", "ramie"]
};

export function getCropType(crop: string): string {
  const lowerCrop = crop.toLowerCase();
  for (const [type, crops] of Object.entries(cropCategories)) {
    if (crops.includes(lowerCrop)) return type;
  }
  if (lowerCrop.includes("potato")) return "tubers";
  if (lowerCrop.includes("banana")) return "fruits";
  if (lowerCrop.includes("coffee")) return "cash";
  if (lowerCrop.includes("sugar")) return "cash";
  if (lowerCrop.includes("tomato")) return "vegetables";
  if (lowerCrop.includes("macadamia")) return "nuts";
  if (lowerCrop.includes("tea")) return "cash";
  if (lowerCrop.includes("cocoa")) return "cash";
  return "grains";
}

export function getVarietiesOptions(crop: string): string[] {
  const varieties = cropVarieties[crop.toLowerCase() as keyof typeof cropVarieties] || [];
  return varieties;
}

export function needsPlantingMaterialCost(crop: string): boolean {
  const lowerCrop = crop.toLowerCase();
  const vegetativeCrops = [
    "sweet potatoes", "cassava", "bananas", "sugarcane", "irish potatoes",
    "yams", "taro", "pineapples", "coffee", "tea", "cocoa", "mangoes",
    "avocados", "oranges", "macadamia", "passion fruit", "ginger", "turmeric",
    "vanilla", "black pepper", "cardamom", "cinnamon", "cloves", "lemon grass",
    "moringa", "aloe vera", "sisal", "bamboo", "garlic", "shallots", "chives",
    "stevia", "fig", "date palm", "mulberry", "lychee", "persimmon", "gooseberry",
    "currant", "elderberry", "rambutan", "durian", "mangosteen", "longan", "marula",
    "pili nut", "ramie", "calendula", "nasturtium", "borage", "St. John's wort",
    "valerian", "echinacea", "ginseng", "goldenseal", "horseradish", "artichoke",
    "asparagus", "rhubarb", "wasabi", "lavender", "rosemary", "thyme", "oregano",
    "sage", "mint", "basil", "coriander", "parsley", "dill", "fennel", "lovage",
    "marjoram", "tarragon", "sorrel", "chervil", "savory", "watercress", "arugula"
  ];
  return vegetativeCrops.includes(lowerCrop);
}

export function getPlantingMaterialCostQuestion(crop: string) {
  const lowerCrop = crop.toLowerCase();
  let unit = "seedling";
  let placeholder = "e.g., 30";

  if (lowerCrop.includes("sweet potato") || lowerCrop.includes("cassava")) {
    unit = "cutting";
    placeholder = "e.g., 5";
  } else if (lowerCrop.includes("banana")) {
    unit = "sucker";
    placeholder = "e.g., 100";
  } else if (lowerCrop.includes("sugarcane")) {
    unit = "sett";
    placeholder = "e.g., 12";
  } else if (lowerCrop.includes("potato") || lowerCrop.includes("yam") || lowerCrop.includes("taro")) {
    unit = "kg";
    placeholder = "e.g., 50";
  } else if (lowerCrop.includes("pineapple")) {
    unit = "crown/slip";
    placeholder = "e.g., 20";
  } else if (lowerCrop.includes("coffee") || lowerCrop.includes("tea") || lowerCrop.includes("cocoa")) {
    unit = "seedling";
    placeholder = "e.g., 30";
  } else if (lowerCrop.includes("mango") || lowerCrop.includes("avocado") || lowerCrop.includes("orange") || lowerCrop.includes("macadamia")) {
    unit = "seedling";
    placeholder = "e.g., 150";
  } else if (lowerCrop.includes("ginger") || lowerCrop.includes("turmeric")) {
    unit = "kg";
    placeholder = "e.g., 200";
  } else if (lowerCrop.includes("vanilla")) {
    unit = "cutting";
    placeholder = "e.g., 50";
  } else if (lowerCrop.includes("black pepper") || lowerCrop.includes("cardamom")) {
    unit = "cutting";
    placeholder = "e.g., 30";
  } else if (lowerCrop.includes("cinnamon") || lowerCrop.includes("cloves")) {
    unit = "seedling";
    placeholder = "e.g., 20";
  } else if (lowerCrop.includes("lemon grass") || lowerCrop.includes("moringa")) {
    unit = "cutting";
    placeholder = "e.g., 10";
  } else if (lowerCrop.includes("aloe vera") || lowerCrop.includes("sisal") || lowerCrop.includes("bamboo")) {
    unit = "offset/sucker";
    placeholder = "e.g., 15";
  } else if (lowerCrop.includes("garlic") || lowerCrop.includes("shallots") || lowerCrop.includes("chives")) {
    unit = "clove/bulb";
    placeholder = "e.g., 500";
  } else if (lowerCrop.includes("stevia") || lowerCrop.includes("basil") || lowerCrop.includes("mint") ||
             lowerCrop.includes("rosemary") || lowerCrop.includes("thyme") || lowerCrop.includes("oregano") ||
             lowerCrop.includes("sage") || lowerCrop.includes("lavender") || lowerCrop.includes("chamomile") ||
             lowerCrop.includes("echinacea") || lowerCrop.includes("ginseng") || lowerCrop.includes("goldenseal") ||
             lowerCrop.includes("calendula") || lowerCrop.includes("nasturtium") || lowerCrop.includes("borage") ||
             lowerCrop.includes("st. john's wort") || lowerCrop.includes("valerian")) {
    unit = "seedling/cutting";
    placeholder = "e.g., 10";
  } else if (lowerCrop.includes("fig") || lowerCrop.includes("date palm") || lowerCrop.includes("mulberry") ||
             lowerCrop.includes("lychee") || lowerCrop.includes("persimmon") || lowerCrop.includes("gooseberry") ||
             lowerCrop.includes("currant") || lowerCrop.includes("elderberry") || lowerCrop.includes("rambutan") ||
             lowerCrop.includes("durian") || lowerCrop.includes("mangosteen") || lowerCrop.includes("longan") ||
             lowerCrop.includes("marula") || lowerCrop.includes("pili nut")) {
    unit = "seedling";
    placeholder = "e.g., 100";
  } else if (lowerCrop.includes("ramie") || lowerCrop.includes("kenaf") || lowerCrop.includes("jute")) {
    unit = "cutting/seed";
    placeholder = "e.g., 20";
  }

  return {
    id: "plantingMaterialCost",
    questionKey: "question_planting_material_cost",
    type: "number" as const,
    placeholder,
    step: "any",
    sectionKey: "section_finance"
  };
}

export function getPlantingMaterialQuestion(crop: string) {
  const lowerCrop = crop.toLowerCase();
  const cropType = getCropType(crop);

  if (lowerCrop === "rice") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_rice",
      type: "dropdown" as const,
      options: ["Direct seeding", "Transplanting seedlings", "Broadcasting", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "mangoes" || lowerCrop === "macadamia" || lowerCrop === "avocados" ||
      lowerCrop === "oranges" || lowerCrop === "lemons" || lowerCrop === "limes" ||
      lowerCrop === "grapefruit" || lowerCrop === "fig" || lowerCrop === "date palm" ||
      lowerCrop === "mulberry" || lowerCrop === "lychee" || lowerCrop === "persimmon" ||
      lowerCrop === "gooseberry" || lowerCrop === "currant" || lowerCrop === "elderberry" ||
      lowerCrop === "rambutan" || lowerCrop === "durian" || lowerCrop === "mangosteen" ||
      lowerCrop === "longan" || lowerCrop === "marula" || lowerCrop === "pili nut" ||
      lowerCrop === "pomegranate" || lowerCrop === "star fruit" || lowerCrop === "guava") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_fruits",
      type: "dropdown" as const,
      options: ["Grafted seedlings", "Seedlings", "Cuttings", "Air layers", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "pineapples") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_pineapples",
      type: "dropdown" as const,
      options: ["Crowns", "Slips", "Suckers", "Tissue culture", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "watermelons" || lowerCrop === "carrots" || lowerCrop === "spinach" ||
      lowerCrop === "okra" || lowerCrop === "cucumbers" || lowerCrop === "courgettes" ||
      lowerCrop === "pumpkin" || lowerCrop === "radish" || lowerCrop === "beetroot" ||
      lowerCrop === "parsnip" || lowerCrop === "turnip" || lowerCrop === "rutabaga" ||
      lowerCrop === "amaranth" || lowerCrop === "african nightshade" || lowerCrop === "jute mallow" ||
      lowerCrop === "spider plant" || lowerCrop === "ethiopian kale" || lowerCrop === "collard greens" ||
      lowerCrop === "bok choy" || lowerCrop === "mustard greens" || lowerCrop === "Swiss chard" ||
      lowerCrop === "endive" || lowerCrop === "escarole" || lowerCrop === "frisee" ||
      lowerCrop === "radicchio" || lowerCrop === "watercress" || lowerCrop === "arugula" ||
      lowerCrop === "celery" || lowerCrop === "leeks" || lowerCrop === "kohlrabi" ||
      lowerCrop === "broccoli" || lowerCrop === "cauliflower" || lowerCrop === "cabbage") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_vegetables",
      type: "dropdown" as const,
      options: ["Direct seeding", "Transplanting seedlings", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "chillies" || lowerCrop === "capsicums" || lowerCrop === "tomatoes" ||
      lowerCrop === "brinjals" || lowerCrop === "french beans" || lowerCrop === "garden peas") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_vegetables",
      type: "dropdown" as const,
      options: ["Transplanting seedlings", "Direct seeding", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "pigeon peas" || lowerCrop === "bambara nuts" || lowerCrop === "cowpeas" ||
      lowerCrop === "green grams" || lowerCrop === "groundnuts" || lowerCrop === "soya beans" ||
      lowerCrop === "chickpea" || lowerCrop === "lentil" || lowerCrop === "faba bean" ||
      lowerCrop === "peanut" || lowerCrop === "fenugreek" || lowerCrop === "caraway" ||
      lowerCrop === "anise" || lowerCrop === "cumin") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_legumes",
      type: "dropdown" as const,
      options: ["Direct seeding", "Certified seed", "Farm-saved seed", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "yams" || lowerCrop === "taro" || lowerCrop === "irish potatoes" ||
      lowerCrop === "sweet potatoes" || lowerCrop === "cassava" || lowerCrop === "ginger" ||
      lowerCrop === "turmeric" || lowerCrop === "horseradish" || lowerCrop === "artichoke" ||
      lowerCrop === "asparagus" || lowerCrop === "rhubarb") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_tubers",
      type: "dropdown" as const,
      options: ["Tubers", "Sets", "Cormels", "Certified seed", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "tea") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_tea",
      type: "dropdown" as const,
      options: ["Clonal cuttings", "Seedlings", "Tissue culture", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "cocoa") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_cocoa",
      type: "dropdown" as const,
      options: ["Hybrid seedlings", "Cuttings", "Grafted seedlings", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "bananas") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_bananas",
      type: "dropdown" as const,
      options: ["Sword suckers", "Tissue culture seedlings", "Mother plant corms", "Bits", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "coffee") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_coffee",
      type: "dropdown" as const,
      options: ["Grafted seedlings", "Cuttings", "Seeds", "Tissue culture", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "sugarcane") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_sugarcane",
      type: "dropdown" as const,
      options: ["Setts (cane cuttings)", "Ratoon (regrowth)", "Tissue culture", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (lowerCrop === "basil" || lowerCrop === "mint" || lowerCrop === "rosemary" ||
      lowerCrop === "thyme" || lowerCrop === "oregano" || lowerCrop === "sage" ||
      lowerCrop === "lavender" || lowerCrop === "chamomile" || lowerCrop === "echinacea" ||
      lowerCrop === "ginseng" || lowerCrop === "goldenseal" || lowerCrop === "stevia" ||
      lowerCrop === "lovage" || lowerCrop === "marjoram" || lowerCrop === "tarragon" ||
      lowerCrop === "sorrel" || lowerCrop === "chervil" || lowerCrop === "savory" ||
      lowerCrop === "calendula" || lowerCrop === "nasturtium" || lowerCrop === "borage" ||
      lowerCrop === "st. john's wort" || lowerCrop === "valerian" || lowerCrop === "moringa" ||
      lowerCrop === "lemon grass" || lowerCrop === "parsley" || lowerCrop === "coriander" ||
      lowerCrop === "dill" || lowerCrop === "fennel") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_vegetables",
      type: "dropdown" as const,
      options: ["Cuttings", "Seedlings", "Direct seeding", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (cropType === "forage") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_vegetables",
      type: "dropdown" as const,
      options: ["Cuttings", "Seed", "Splits", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  if (cropType === "cover") {
    return {
      id: "plantingMaterial",
      questionKey: "question_planting_material_legumes",
      type: "dropdown" as const,
      options: ["Direct seeding", "Certified seed", "Other"],
      sectionKey: "section_planting_material"
    };
  }
  return {
    id: "seedSource",
    questionKey: "question_seed_source",
    type: "dropdown" as const,
    options: ["Certified seed dealer", "Farm-saved seed", "Local market", "Neighbors", "Agrovet", "Other"],
    sectionKey: "section_seeds"
  };
}

export function getPlantingQuantityQuestion(crop: string) {
  const lowerCrop = crop.toLowerCase();
  return {
    id: "seedRate",
    questionKey: `question_seed_rate_${lowerCrop.replace(/ /g, '_')}`,
    type: "number" as const,
    placeholder: "e.g., 10 kg",
    step: "any",
    sectionKey: "section_seeds"
  };
}

export function getStorageQuestion(crop: string) {
  const lowerCrop = crop.toLowerCase();
  const cropType = getCropType(crop);

  if (lowerCrop === "maize" || lowerCrop === "sorghum" || lowerCrop === "finger millet" || lowerCrop === "rice") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_grain",
      type: "dropdown" as const,
      options: ["Hermetic bags", "Metallic silos", "Gunny bags", "Local cribs", "Sold immediately", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (lowerCrop === "beans" || lowerCrop === "cowpeas" || lowerCrop === "green grams" || lowerCrop === "groundnuts" || lowerCrop === "pigeon peas" || lowerCrop === "bambara nuts") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_pulses",
      type: "dropdown" as const,
      options: ["Hermetic bags", "Gunny bags", "Plastic containers", "Sold immediately", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (lowerCrop === "irish potatoes" || lowerCrop === "sweet potatoes" || lowerCrop === "cassava" || lowerCrop === "yams" || lowerCrop === "taro") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_tubers",
      type: "dropdown" as const,
      options: ["Cool dark room", "In-ground storage", "Sold immediately", "Processed into flour", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (lowerCrop === "tomatoes" || lowerCrop === "onions" || lowerCrop === "cabbages" || lowerCrop === "chillies" || lowerCrop === "capsicums" || lowerCrop === "okra") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_vegetables",
      type: "dropdown" as const,
      options: ["Sold immediately", "Cool storage", "Market delivery", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (lowerCrop === "mangoes" || lowerCrop === "avocados" || lowerCrop === "oranges" || lowerCrop === "macadamia") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_fruits",
      type: "dropdown" as const,
      options: ["Sold immediately", "Cool storage", "Processing", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (lowerCrop === "tea" || lowerCrop === "coffee" || lowerCrop === "cocoa") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_perishable",
      type: "dropdown" as const,
      options: ["Sold immediately", "Processing facility", "Drying and storage", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (cropType === "herbs") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_perishable",
      type: "dropdown" as const,
      options: ["Sold immediately", "Drying", "Cool storage", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (cropType === "forage") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_generic",
      type: "dropdown" as const,
      options: ["Fresh use", "Hay", "Silage", "Sold immediately", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (cropType === "cover") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_generic",
      type: "dropdown" as const,
      options: ["Left in field", "Sold as seed", "Other"],
      sectionKey: "section_storage"
    };
  }
  if (cropType === "medicinal") {
    return {
      id: "storageMethod",
      questionKey: "question_storage_perishable",
      type: "dropdown" as const,
      options: ["Sold immediately", "Processing", "Cool storage", "Other"],
      sectionKey: "section_storage"
    };
  }
  return {
    id: "storageMethod",
    questionKey: "question_storage_generic",
    type: "dropdown" as const,
    options: ["Sold immediately", "Storage facility", "Cold storage", "Other"],
    sectionKey: "section_storage"
  };
}

export function getPestsOptions(crop: string): string[] {
  const entries = cropPestDiseaseMap[crop.toLowerCase()] || [];
  return entries.filter(item => item.type === "pest").map(item => item.name);
}

export function getDiseasesOptions(crop: string): string[] {
  const entries = cropPestDiseaseMap[crop.toLowerCase()] || [];
  return entries.filter(item => item.type === "disease").map(item => item.name);
}