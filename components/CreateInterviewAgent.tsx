// components/CreateInterviewAgent.tsx – COMPLETE with fix for poultry/dairy business plan context
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Sprout,
  MapPin,
  Droplets,
  Sun,
  Leaf,
  Wheat,
  Flower2,
  Loader2,
  Mic,
  Send,
  CheckCircle,
  ArrowRight,
  Zap,
  Heart,
  Volume2,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Package,
  Tractor,
  Calendar,
  Droplet,
  Thermometer,
  Cloud,
  Home,
  Phone,
  Users,
  Shield,
  AlertCircle,
  Beaker,
  FlaskConical,
  Scale,
  Gauge,
  Globe,
  Smartphone,
  PhoneCall
} from "lucide-react";
import { plantingFertilizers } from "@/lib/fertilizers/plantingFertilizers";
import { topDressingFertilizers } from "@/lib/fertilizers/topDressingFertilizers";
import { cropVarieties } from "@/lib/data/varieties";
import { cropPestDiseaseMap } from "@/lib/data/pestDiseaseMapping";
import { getSpacingOptions } from "@/lib/data/spacing";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { COUNTRY_CURRENCY_MAP } from "@/lib/config/currency";
import { getLanguageFromCountry } from "@/lib/config/language";

// ===== FIREBASE IMPORTS =====
import { db } from "@/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";

// ===== POULTRY DISEASE MAP =====
import { poultryDiseaseMap } from "@/lib/data/poultryDiseaseMap";

// ===== DAIRY DISEASE MAP (for dropdown) =====
import { dairyPestDiseaseMap } from "@/lib/data/dairyHealthMapping";

// ===== AGENT REGISTRY (to get questions from agents) =====
import { getQuestionsForAgents } from "@/lib/agents/agentRegistry";

// ===== FEED FORMULATION BREEDS =====
const FEED_FORMULATION_BREEDS = ["Local", "Layers", "Sasso", "Kenbrew", "Kroiler", "Broiler", "Sussex"];

// ===== BATCH SIZE OPTIONS (5 to 500 kg) =====
const batchSizeOptions = Array.from({ length: 100 }, (_, i) => `${(i + 1) * 5} kg`);

// ===== ALL INGREDIENTS FOR FEED FORMULATION =====
const allIngredients = [
  // Energy
  "Broken maize", "Maize bran", "Maize germ", "Sorghum", "Millet", "Cassava",
  "Wheat bran", "Rice bran",
  // Protein
  "Soya bean meal", "Fish meal", "Omena", "Meat and bone meal",
  "Sunflower cake", "Groundnut cake", "Cottonseed cake",
  // Minerals & Additives
  "Lime", "Oyster shell grit", "DCP", "Bone meal",
  "Premix", "Methionine", "Lysine", "Salt", "Toxin binder"
];

// ===== POULTRY PRODUCT OPTIONS (translation keys) =====
const POULTRY_PRODUCT_OPTIONS = [
  "poultry_product_fresh_eggs",
  "poultry_product_table_eggs",
  "poultry_product_day_old_chicks",
  "poultry_product_growers",
  "poultry_product_point_of_lay",
  "poultry_product_spent_hens",
  "poultry_product_broiler_whole",
  "poultry_product_broiler_pieces",
  "poultry_product_manure",
];

// ===== DAIRY PRODUCT OPTIONS (translation keys) =====
const DAIRY_PRODUCT_OPTIONS = [
  "dairy_product_raw_milk",
  "dairy_product_pasteurised_milk",
  "dairy_product_yoghurt_plain",
  "dairy_product_yoghurt_flavoured",
  "dairy_product_cheese_soft",
  "dairy_product_cheese_hard",
  "dairy_product_ghee",
  "dairy_product_butter",
  "dairy_product_cream",
  "dairy_product_fermented_milk",
  "dairy_product_manure",
  "dairy_product_calves",
  "dairy_product_heifers",
  "dairy_product_culled_cows",
];

interface CreateInterviewAgentProps {
  userName: string;
  userId?: string;
  profileImage?: string;
  filter?: string;
  agents?: string[];
  modules?: string[];
}

// Helper function for crop template variables
const translateWithCrop = (t: any, key: string, crop: string | undefined) => {
  return String(t(key, { crop: crop?.toUpperCase() || 'your crop' }));
};

// Country codes
const countryCodes = [
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" }
];

// Crop categories (unchanged)
const cropCategories = {
  grains: ["maize", "beans", "wheat", "sorghum", "millet", "rice", "barley", "finger millet", "oats", "teff", "triticale", "buckwheat", "quinoa", "fonio", "spelt", "kamut", "amaranth grain"],
  pulses: ["soya beans", "cowpeas", "green grams", "bambara nuts", "groundnuts", "pigeonpeas", "chickpea", "lentil", "faba bean", "peanut", "fenugreek", "caraway", "anise", "cumin"],
  cash: ["coffee", "cotton", "sugarcane", "tobacco", "sunflower", "simsim", "pyrethrum", "tea", "cocoa", "sisal", "oil palm", "rubber", "kenaf", "jute", "flax", "hemp"],
  tubers: ["cassava", "sweet potatoes", "irish potatoes", "yams", "taro", "ginger", "turmeric", "horseradish", "parsnip", "turnip", "rutabaga", "radish", "beetroot", "carrots"],
  vegetables: ["tomatoes", "cabbage", "kales", "onions", "capsicums", "chillies", "brinjals", "french beans", "garden peas", "spinach", "okra", "cauliflower", "lettuce", "broccoli", "celery", "leeks", "pumpkin", "courgettes", "cucumbers", "artichoke", "asparagus", "arugula", "endive", "kohlrabi", "watercress", "pumpkin leaves", "sweet potato leaves", "jute mallow", "spider plant", "african nightshade", "amaranth", "ethiopian kale", "coriander", "parsley", "dill", "fennel", "radicchio", "escarole", "frisee", "turnip greens", "mustard greens", "collard greens", "bok choy", "Swiss chard"],
  fruits: ["bananas", "oranges", "pineapples", "mangoes", "avocados", "pawpaws", "passion fruit", "citrus", "watermelon", "grapefruit", "lemons", "limes", "guava", "jackfruit", "breadfruit", "pomegranate", "star fruit", "coconut", "fig", "date palm", "mulberry", "lychee", "persimmon", "gooseberry", "currant", "elderberry", "rambutan", "durian", "mangosteen", "longan", "marula"],
  nuts: ["macadamia", "cashew", "almond", "brazil nut", "chestnut", "hazelnut", "pecan", "pistachio", "shea", "walnut", "pili nut"],
  cover: ["mucuna", "desmodium", "dolichos", "canavalia", "crotalaria ochroleuca", "crotalaria juncea", "crotalaria paulina", "vetch", "clover", "alfalfa", "lucerne"],
  herbs: ["basil", "mint", "rosemary", "thyme", "oregano", "sage", "lavender", "chamomile", "echinacea", "ginseng", "goldenseal", "hibiscus", "hops", "lemon grass", "moringa", "mustard", "rapeseed", "safflower", "wasabi", "stevia", "lovage", "marjoram", "tarragon", "sorrel", "chervil", "savory", "calendula", "nasturtium", "borage", "St. John's wort", "valerian"],
  forage: ["brachiaria", "buffel_grass", "guinea_grass", "italian_ryegrass", "lucerne", "napier grass", "napier_hybrid", "orchard_grass", "rhodes grass", "timothy_grass", "white_clover", "alfalfa", "forage_sorghum", "calliandra", "cenchrus", "leucaena", "sesbania"],
  medicinal: ["aloe vera", "stinging nettle", "watercress", "echinacea", "ginseng", "goldenseal"],
  other: ["bamboo", "oyster nut", "mushroom", "ramie"]
};

const getCropType = (crop: string): string => {
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
};

const getVarietiesOptions = (crop: string) => {
  const varieties = cropVarieties[crop.toLowerCase() as keyof typeof cropVarieties] || [];
  return varieties;
};

const getPestsOptions = (crop: string) => {
  const pests = cropPestDiseaseMap[crop.toLowerCase()]?.filter(p => p.type === "pest").map(p => p.name) || [];
  return pests;
};

const getDiseasesOptions = (crop: string) => {
  const diseases = cropPestDiseaseMap[crop.toLowerCase()]?.filter(p => p.type === "disease").map(p => p.name) || [];
  return diseases;
};

// Helper to determine if crop needs planting material cost question
const needsPlantingMaterialCost = (crop: string): boolean => {
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
};

const getPlantingMaterialCostQuestion = (crop: string) => {
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
    type: "number",
    placeholder: placeholder,
    step: "any",
    sectionKey: "section_finance"
  };
};

const getPlantingMaterialQuestion = (crop: string) => {
  const cropType = getCropType(crop);
  const lowerCrop = crop.toLowerCase();
  if (lowerCrop === "rice") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_rice", type: "dropdown", options: ["Direct seeding", "Transplanting seedlings", "Broadcasting", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "mangoes" || lowerCrop === "macadamia" || lowerCrop === "avocados" ||
      lowerCrop === "oranges" || lowerCrop === "lemons" || lowerCrop === "limes" ||
      lowerCrop === "grapefruit" || lowerCrop === "fig" || lowerCrop === "date palm" ||
      lowerCrop === "mulberry" || lowerCrop === "lychee" || lowerCrop === "persimmon" ||
      lowerCrop === "gooseberry" || lowerCrop === "currant" || lowerCrop === "elderberry" ||
      lowerCrop === "rambutan" || lowerCrop === "durian" || lowerCrop === "mangosteen" ||
      lowerCrop === "longan" || lowerCrop === "marula" || lowerCrop === "pili nut" ||
      lowerCrop === "pomegranate" || lowerCrop === "star fruit" || lowerCrop === "guava") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_fruits", type: "dropdown", options: ["Grafted seedlings", "Seedlings", "Cuttings", "Air layers", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "pineapples") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_pineapples", type: "dropdown", options: ["Crowns", "Slips", "Suckers", "Tissue culture", "Other"], sectionKey: "section_planting_material" };
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
    return { id: "plantingMaterial", questionKey: "question_planting_material_vegetables", type: "dropdown", options: ["Direct seeding", "Transplanting seedlings", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "chillies" || lowerCrop === "capsicums" || lowerCrop === "tomatoes" ||
      lowerCrop === "brinjals" || lowerCrop === "french beans" || lowerCrop === "garden peas") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_vegetables", type: "dropdown", options: ["Transplanting seedlings", "Direct seeding", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "pigeon peas" || lowerCrop === "bambara nuts" || lowerCrop === "cowpeas" ||
      lowerCrop === "green grams" || lowerCrop === "groundnuts" || lowerCrop === "soya beans" ||
      lowerCrop === "chickpea" || lowerCrop === "lentil" || lowerCrop === "faba bean" ||
      lowerCrop === "peanut" || lowerCrop === "fenugreek" || lowerCrop === "caraway" ||
      lowerCrop === "anise" || lowerCrop === "cumin") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_legumes", type: "dropdown", options: ["Direct seeding", "Certified seed", "Farm-saved seed", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "yams" || lowerCrop === "taro" || lowerCrop === "irish potatoes" ||
      lowerCrop === "sweet potatoes" || lowerCrop === "cassava" || lowerCrop === "ginger" ||
      lowerCrop === "turmeric" || lowerCrop === "horseradish" || lowerCrop === "artichoke" ||
      lowerCrop === "asparagus" || lowerCrop === "rhubarb") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_tubers", type: "dropdown", options: ["Tubers", "Sets", "Cormels", "Certified seed", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "tea") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_tea", type: "dropdown", options: ["Clonal cuttings", "Seedlings", "Tissue culture", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "cocoa") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_cocoa", type: "dropdown", options: ["Hybrid seedlings", "Cuttings", "Grafted seedlings", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "bananas") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_bananas", type: "dropdown", options: ["Sword suckers", "Tissue culture seedlings", "Mother plant corms", "Bits", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "coffee") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_coffee", type: "dropdown", options: ["Grafted seedlings", "Cuttings", "Seeds", "Tissue culture", "Other"], sectionKey: "section_planting_material" };
  }
  if (lowerCrop === "sugarcane") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_sugarcane", type: "dropdown", options: ["Setts (cane cuttings)", "Ratoon (regrowth)", "Tissue culture", "Other"], sectionKey: "section_planting_material" };
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
    return { id: "plantingMaterial", questionKey: "question_planting_material_vegetables", type: "dropdown", options: ["Cuttings", "Seedlings", "Direct seeding", "Other"], sectionKey: "section_planting_material" };
  }
  if (cropType === "forage") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_vegetables", type: "dropdown", options: ["Cuttings", "Seed", "Splits", "Other"], sectionKey: "section_planting_material" };
  }
  if (cropType === "cover") {
    return { id: "plantingMaterial", questionKey: "question_planting_material_legumes", type: "dropdown", options: ["Direct seeding", "Certified seed", "Other"], sectionKey: "section_planting_material" };
  }
  return { id: "seedSource", questionKey: "question_seed_source", type: "dropdown", options: ["Certified seed dealer", "Farm-saved seed", "Local market", "Neighbors", "Agrovet", "Other"], sectionKey: "section_seeds" };
};

const getPlantingQuantityQuestion = (crop: string) => {
  const lowerCrop = crop.toLowerCase();
  return { id: "seedRate", questionKey: `question_seed_rate_${lowerCrop.replace(/ /g, '_')}`, type: "number", placeholder: "e.g., 10 kg", step: "any", sectionKey: "section_seeds" };
};

const getStorageQuestion = (crop: string) => {
  const lowerCrop = crop.toLowerCase();
  if (lowerCrop === "maize" || lowerCrop === "sorghum" || lowerCrop === "finger millet" || lowerCrop === "rice") {
    return { id: "storageMethod", questionKey: "question_storage_grain", type: "dropdown", options: ["Hermetic bags", "Metallic silos", "Gunny bags", "Local cribs", "Sold immediately", "Other"], sectionKey: "section_storage" };
  }
  if (lowerCrop === "beans" || lowerCrop === "cowpeas" || lowerCrop === "green grams" || lowerCrop === "groundnuts" || lowerCrop === "pigeon peas" || lowerCrop === "bambara nuts") {
    return { id: "storageMethod", questionKey: "question_storage_pulses", type: "dropdown", options: ["Hermetic bags", "Gunny bags", "Plastic containers", "Sold immediately", "Other"], sectionKey: "section_storage" };
  }
  if (lowerCrop === "irish potatoes" || lowerCrop === "sweet potatoes" || lowerCrop === "cassava" || lowerCrop === "yams" || lowerCrop === "taro") {
    return { id: "storageMethod", questionKey: "question_storage_tubers", type: "dropdown", options: ["Cool dark room", "In-ground storage", "Sold immediately", "Processed into flour", "Other"], sectionKey: "section_storage" };
  }
  if (lowerCrop === "tomatoes" || lowerCrop === "onions" || lowerCrop === "cabbages" || lowerCrop === "chillies" || lowerCrop === "capsicums" || lowerCrop === "okra") {
    return { id: "storageMethod", questionKey: "question_storage_vegetables", type: "dropdown", options: ["Sold immediately", "Cool storage", "Market delivery", "Other"], sectionKey: "section_storage" };
  }
  if (lowerCrop === "mangoes" || lowerCrop === "avocados" || lowerCrop === "oranges" || lowerCrop === "macadamia") {
    return { id: "storageMethod", questionKey: "question_storage_fruits", type: "dropdown", options: ["Sold immediately", "Cool storage", "Processing", "Other"], sectionKey: "section_storage" };
  }
  if (lowerCrop === "tea" || lowerCrop === "coffee" || lowerCrop === "cocoa") {
    return { id: "storageMethod", questionKey: "question_storage_perishable", type: "dropdown", options: ["Sold immediately", "Processing facility", "Drying and storage", "Other"], sectionKey: "section_storage" };
  }
  const cropType = getCropType(crop);
  if (cropType === "herbs") {
    return { id: "storageMethod", questionKey: "question_storage_perishable", type: "dropdown", options: ["Sold immediately", "Drying", "Cool storage", "Other"], sectionKey: "section_storage" };
  }
  if (cropType === "forage") {
    return { id: "storageMethod", questionKey: "question_storage_generic", type: "dropdown", options: ["Fresh use", "Hay", "Silage", "Sold immediately", "Other"], sectionKey: "section_storage" };
  }
  if (cropType === "cover") {
    return { id: "storageMethod", questionKey: "question_storage_generic", type: "dropdown", options: ["Left in field", "Sold as seed", "Other"], sectionKey: "section_storage" };
  }
  if (cropType === "medicinal") {
    return { id: "storageMethod", questionKey: "question_storage_perishable", type: "dropdown", options: ["Sold immediately", "Processing", "Cool storage", "Other"], sectionKey: "section_storage" };
  }
  return { id: "storageMethod", questionKey: "question_storage_generic", type: "dropdown", options: ["Sold immediately", "Storage facility", "Cold storage", "Other"], sectionKey: "section_storage" };
};

// Nutrient dropdown component
const NutrientDropdown = ({ nutrient, value, onChange }: { nutrient: string; value: string; onChange: (value: string) => void }) => {
  const { t } = useTranslation();
  const nutrientLabels: Record<string, string> = { s: "Sulfur (S)", ca: "Calcium (Ca)", mg: "Magnesium (Mg)", zn: "Zinc (Zn)", b: "Boron (B)", cu: "Copper (Cu)", mn: "Manganese (Mn)" };
  const percentageOptions = ["0%", "2%", "3%", "4%", "5%", "6%", "7%", "8%", "10%", "12%"];
  return (
    <div className="flex items-center gap-3 mb-2">
      <label className="w-32 text-sm font-medium text-gray-800">{nutrientLabels[nutrient]}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
        <option value="" className="text-gray-600">Select %</option>
        {percentageOptions.map(opt => <option key={opt} value={opt} className="text-gray-800">{opt}</option>)}
        <option value="other" className="text-gray-800">Other (specify)</option>
      </select>
      {value === "other" && <input type="text" placeholder="e.g., 15%" className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
};

// ========== MAIN COMPONENT ==========
const CreateInterviewAgent = ({ userName, userId, profileImage, filter = "complete", agents = [], modules = [] }: CreateInterviewAgentProps) => {
  const { t, i18n } = useTranslation();
  const { setCountry, currency } = useCurrency();
  const { user } = useAuth();

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+254");
  const [recognitionLanguage, setRecognitionLanguage] = useState('en-US');
  const nameUsageCountRef = useRef(0);

  // ========== SPECIES SELECTION ==========
  const [selectedSpecies, setSelectedSpecies] = useState<"crop" | "poultry" | "dairy">("crop");

  // ========== POULTRY STATE ==========
  const [poultryBreed, setPoultryBreed] = useState<string>("");
  const [poultrySystem, setPoultrySystem] = useState<string>("deep_litter");
  const [poultryFlockSize, setPoultryFlockSize] = useState<number>(0);
  const [poultryAgeWeeks, setPoultryAgeWeeks] = useState<number>(0);
  const [poultryFarmingGoal, setPoultryFarmingGoal] = useState<string>("Both");
  const [poultryLocationRegion, setPoultryLocationRegion] = useState<string>("Moderate");
  const [poultryRainfallPattern, setPoultryRainfallPattern] = useState<string>("Wet");
  const [poultryAltitude, setPoultryAltitude] = useState<string>("Lowland");
  const [poultryFeedType, setPoultryFeedType] = useState<string>("Mash");
  const [poultryFeedCostKg, setPoultryFeedCostKg] = useState<number>(65);
  const [poultryVaccinationDone, setPoultryVaccinationDone] = useState<string>("No");
  const [poultryMortalityCount, setPoultryMortalityCount] = useState<number>(0);
  const [poultryChickCost, setPoultryChickCost] = useState<number>(120);
  const [poultryEggPrice, setPoultryEggPrice] = useState<number>(280);
  const [poultryMeatPrice, setPoultryMeatPrice] = useState<number>(350);
  const [poultryHouseSizeM2, setPoultryHouseSizeM2] = useState<number>(40);

  // ========== DAIRY STATE ==========
  const [dairyCowCategory, setDairyCowCategory] = useState<string>("lactating");
  const [dairyBodyWeightKg, setDairyBodyWeightKg] = useState<number>(500);
  const [dairyBreed, setDairyBreed] = useState<string>("fh");
  const [dairyDiseaseSelect, setDairyDiseaseSelect] = useState<string>("");
  const [dairySymptoms, setDairySymptoms] = useState<string[]>([]);
  const [dairyMortalityCount, setDairyMortalityCount] = useState<number>(0);
  const [dairyHealthDuration, setDairyHealthDuration] = useState<string>("less_than_3_days");
  const [dairyMilkYieldPerDay, setDairyMilkYieldPerDay] = useState<number>(10);
  const [dairyMilkPricePerLitre, setDairyMilkPricePerLitre] = useState<number>(40);
  const [dairyFeedCostPerDay, setDairyFeedCostPerDay] = useState<number>(100);
  const [dairyVetCostPerMonth, setDairyVetCostPerMonth] = useState<number>(500);

  // ========== FEED FORMULATION SPECIFIC STATE ==========
  const [poultryStage, setPoultryStage] = useState<string>("");
  const [batchSize, setBatchSize] = useState<string>("");
  const [includeCoccidiostat, setIncludeCoccidiostat] = useState<string>("No");
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [ingredientPrices, setIngredientPrices] = useState<Record<string, number>>({});
  const [ageWeeks, setAgeWeeks] = useState<string>("");

  // ========== BUSINESS PLAN / PRODUCTS TABLE STATE (Crop) ==========
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productRows, setProductRows] = useState<{
    product: string;
    quantity: string;
    price: string;
    cost: string;
  }[]>([]);
  const [productsSubmitted, setProductsSubmitted] = useState(false);

  // ========== POULTRY PRODUCTS TABLE STATE ==========
  const [selectedPoultryProducts, setSelectedPoultryProducts] = useState<string[]>([]);
  const [poultryProductRows, setPoultryProductRows] = useState<{
    product: string;
    quantity: string;
    price: string;
    cost: string;
  }[]>([]);
  const [poultryProductsSubmitted, setPoultryProductsSubmitted] = useState(false);

  // ========== DAIRY PRODUCTS TABLE STATE ==========
  const [selectedDairyProducts, setSelectedDairyProducts] = useState<string[]>([]);
  const [dairyProductRows, setDairyProductRows] = useState<{
    product: string;
    quantity: string;
    price: string;
    cost: string;
  }[]>([]);
  const [dairyProductsSubmitted, setDairyProductsSubmitted] = useState(false);

  // ========== AUTO-DETECT FROM FILTER ==========
  useEffect(() => {
    if (filter && filter.startsWith("poultry_")) {
      setSelectedSpecies("poultry");
    } else if (filter && filter.startsWith("dairy_")) {
      setSelectedSpecies("dairy");
    } else if (filter && filter.startsWith("crop_")) {
      setSelectedSpecies("crop");
    }
  }, [filter]);

  const getSpokenCurrencyName = (): string => currency.name;
  const getDisplaySymbol = (): string => currency.symbol;

  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      if (result && typeof result.then === 'function') { console.warn(`Translation for "${key}" returned a Promise`); return key; }
      return typeof result === 'string' ? result : String(result || '');
    } catch (e) { console.error('Translation error for key:', key, e); return key; }
  };

  const [currentStep, setCurrentStep] = useState<"idle" | "configuring" | "generating" | "redirecting" | "error">("idle");
  const [configStep, setConfigStep] = useState(0);

  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const questionWordsRef = useRef<string[]>([]);

  const voiceServiceRef = useRef<any>(null);

  const plantingFertilizerOptions = [
    { label: "DAP (18-46-0)", id: "dap" },
    { label: "TSP (0-46-0)", id: "tsp" },
    { label: "SSP (0-20-0)", id: "ssp" },
    { label: "NPK 23-23-0 (23-23-0)", id: "npk_2323" },
    { label: "NPK 17-17-17 (17-17-17)", id: "npk_171717" },
    { label: "NPK 12.24.12+5S (12-24-12+5S)", id: "elgon_thabiti_1225_hort_special" },
    { label: "Yara Mila Power (13-24-12)", id: "yara_power" },
    { label: "MEA NPK 10-26-10", id: "mea_102610" },
    { label: "OCP NPSB (18.9-37.7-0)", id: "ocp_npsb" },
    { label: "Other", id: "other" }
  ];

  const topdressingFertilizerOptions = [
    { label: "UREA (46-0-0)", id: "ss_urea" },
    { label: "CAN (27-0-0)", id: "ss_can" },
    { label: "ASN (21-0-0-23S)", id: "ss_as" },
    { label: "Yara Bela Sulfan (24-0-0+6S)", id: "yara_bela_sulfan" },
    { label: "KynoKuza (20-4-20)", id: "etg_kynokuza" },
    { label: "KynoGrowMax (30-0-10)", id: "etg_kynogrowmax" },
    { label: "NPK 23-10-10", id: "mea_231010" },
    { label: "NPK 26-0-20", id: "elgon_thabiti_top_sugar" },
    { label: "Other", id: "other" }
  ];

  const potassiumFertilizerOptions = [
    { label: "MOP (0-0-60)", id: "mop" },
    { label: "SOP (0-0-50)", id: "sop" },
    { label: "Korn-Kali (0-0-40)", id: "kplus_korn_kali" },
    { label: "Patentkali (0-0-30)", id: "kplus_patentkali" },
    { label: "None - I don't use potassium", id: "none" }
  ];

  const [farmerDetails, setFarmerDetails] = useState({
    country: "", farmerName: "", county: "", subCounty: "", ward: "", village: "",
    totalFarmSize: "", cultivatedAcres: "", waterSources: "", hasDoneSoilTest: "", crops: "",
    saleDate: "", cropVarieties: "", cropAcres: "", season: "", plantingDate: "",
    plantingMaterial: "", plantingQuantity: "", seedSource: "", spacing: "",
    commonPests: "", pestControlMethod: "", commonDiseases: "", diseaseControlMethod: "",
    deficiencySymptoms: "", deficiencyLocation: "", harvestUnit: "kg", pricePerKg: "",
    actualYieldKg: "", storageMethod: "", npkCost: "", ploughingCost: "", plantingLabourCost: "",
    weedingCost: "", harvestingCost: "", transportCostTotal: "", packagingCostTotal: "",
    miscellaneousCostTotal: "", seedCost: "", plantingMaterialCost: "", calciticLimePricePerBag: "",
    recCalciticLime: "", livestockTypes: "", cattle: "", cattleBreed: "", milkYield: "",
    postHarvestPractices: "", postHarvestLosses: "", valueAddition: "", storageAccess: "",
    productionChallenges: "", marketingChallenges: "", climateChallenges: "", financialChallenges: "",
    conservationPractices: "", soilTestDate: "", soilTestPH: "", soilTestPHRating: "",
    soilTestP: "", soilTestPRating: "", soilTestK: "", soilTestKRating: "", soilTestNPercent: "",
    soilTestNPercentRating: "", soilTestOC: "", soilTestOCRating: "", soilTestOM: "",
    soilTestOMRating: "", soilTestCEC: "", soilTestCECRating: "", soilTestCa: "",
    soilTestCaRating: "", soilTestMg: "", soilTestMgRating: "", soilTestNa: "",
    soilTestNaRating: "", targetYield: "", recCalciticLime: "", recDolomiticLime: "",
    recPlantingFertilizer: "", recPlantingQuantity: "", recTopdressingFertilizer: "",
    recTopdressingQuantity: "", recPotassiumFertilizer: "", recPotassiumQuantity: "",
    plantingFertilizerToUse: "", plantingFertilizerCost: "", topdressingFertilizerToUse: "",
    topdressingFertilizerCost: "", potassiumFertilizerToUse: "", potassiumFertilizerCost: "",
    plantingFertilizerType: "", plantingFertilizerQuantity: "", topdressingFertilizerType: "",
    topdressingFertilizerQuantity: "", potassiumFertilizerType: "", potassiumFertilizerQuantity: "",
    plantingFertilizerNutrients: "", topdressingFertilizerNutrients: "", potassiumFertilizerNutrients: "",
    plantsDamaged: "", recDolomiticLime: "", dolomiticLimePricePerBag: "", wantsNutritionBenefits: "",
    poultry_species: "chicken",
    poultry_disease: "",
    symptomsObserved: "",
    mortalityCountDisease: "",
    diseaseDuration: "",
    // Dairy fields
    dairyDiseaseSelect: "",
    dairyDaysSinceCalving: "",
    dairyHeatObserved: "",
    dairyLastInseminationDate: "",
    dairyBreedingMethod: "",
    dairyReproductiveProblems: "",
    dairyBusinessInterest: "",
    calfAgeWeeks: "",
    calfFeedingMethod: "",
    calfMilkLitresPerDay: "",
    calfReceivedColostrum: "",
    calfHousingType: "",
    calfHealthIssues: "",
    dairyConcentrateBrand: "",
    dairyConcentrateProduct: "",
    dairyConcentrateInclusion: "",
    dairyConcentrateMaizeKg: "",
    dairyConcentrateSaltKg: "",
    dairyConcentrateCalciumSource: "",
    dairyConcentrateCalciumKg: "",
    dairyDeficiencySymptoms: "",
    dairyManagementFocus: "",
    dairyAvailableForages: "",
    dairyAvailableGrains: "",
    dairyAvailableProtein: "",
    dairyAvailableMinerals: "",
    dairyQuantityToMix: "",
    dairyForageType: "",
    dairyForageKgPerDay: "",
    dairyConcentrateType: "",
    dairyConcentrateKgPerDay: "",
    dairyMilkYield: "",
    dairyMilkPrice: "",
    dairyVetCostMonth: "",
    dairyOtherCosts: "",
    dairyHousingType: "",
    numberOfCowsHoused: "",
    floorSpacePerCowM2: "",
    dairyVentilationRating: "",
    beddingType: "",
    milkYieldCurrent: "",
    milkFatPercent: "",
    milkProteinPercent: "",
    daysInMilk: "",
    parity: "",
    dairyParasiteSigns: "",
    dairyLastDeworming: "",
    dairyLastHoofTrimming: "",
    dairyLastVaccination: "",
    dairyNextVaccinationDue: "",
    dairyReminderTopics: "",
    // Feed formulation fields
    poultryStage: "",
    batchSize: "",
    includeCoccidiostat: "",
    availableIngredients: "",
    ingredientPrices: "",
    ageWeeks: "",
    // ===== Business Plan fields =====
    businessName: "",
    businessVision: "",
    businessMission: "",
    shortTermGoals: "",
    midTermGoals: "",
    longTermGoals: "",
    targetCustomers: "",
    communicationChannels: "",
    fallbackPlan: "",
    competitiveAdvantage: "",
    paymentModes: "",
    businessPositions: "",
    positionHeads: "",
    products: "",
    productionInputs: "",
    // ===== Poultry & Dairy Business Plan extra fields =====
    poultryProducts: "",
    dairyProducts: "",
    poultryProductionInputs: "",
    dairyProductionInputs: "",
  });

  const [plantingNutrients, setPlantingNutrients] = useState({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });
  const [topdressingNutrients, setTopdressingNutrients] = useState({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });
  const [potassiumNutrients, setPotassiumNutrients] = useState({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });

  const [debugInfo, setDebugInfo] = useState({
    callStatus: "INACTIVE",
    currentQuestion: 0,
    totalQuestions: 0,
    isListening: false,
    userId: userId || "MISSING",
    voiceMode: "SIMULATED" as "REAL" | "SIMULATED",
    generatedSessionId: "",
  });

  const voiceAssistantRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const mapI18nToVoiceLanguage = (i18nLang: string): string => {
    switch (i18nLang) {
      case 'sw': return 'sw-KE';
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'en-GB': return 'en-GB';
      case 'en-US': return 'en-US';
      case 'en': return 'en-US';
      default: return 'en-US';
    }
  };

  const previousLangRef = useRef<string>('');
  useEffect(() => {
    if (currentStep !== "idle") return;
    const newLang = i18n.language;
    if (!newLang || newLang === previousLangRef.current) return;
    previousLangRef.current = newLang;
    const voiceLang = mapI18nToVoiceLanguage(newLang);
    setRecognitionLanguage(voiceLang);
    console.log(`CreateInterviewAgent: Voice language set to ${voiceLang} from i18n language ${newLang}`);
    if (recognitionRef.current) recognitionRef.current.lang = voiceLang;
  }, [i18n.language, currentStep]);

  // ========== FIREBASE PROFILE FUNCTIONS ==========
  const loadProfileFromFirestore = useCallback(async (uid: string) => {
    try {
      const docRef = doc(db, "farmers", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile = data.profile || {};

        // Load crop fields
        setFarmerDetails(prev => ({ ...prev, ...profile }));

        // Load poultry fields
        if (profile.poultry) {
          const p = profile.poultry;
          setPoultryBreed(p.breed || "");
          setPoultrySystem(p.system || "deep_litter");
          setPoultryFlockSize(p.flockSize || 0);
          setPoultryAgeWeeks(p.ageWeeks || 0);
          setPoultryFarmingGoal(p.farmingGoal || "Both");
          setPoultryLocationRegion(p.locationRegion || "Moderate");
          setPoultryRainfallPattern(p.rainfallPattern || "Wet");
          setPoultryAltitude(p.altitude || "Lowland");
          setPoultryFeedType(p.feedType || "Mash");
          setPoultryFeedCostKg(p.feedCostKg || 65);
          setPoultryVaccinationDone(p.vaccinationDone || "No");
          setPoultryMortalityCount(p.mortalityCount || 0);
          setPoultryChickCost(p.chickCost || 120);
          setPoultryEggPrice(p.eggPrice || 280);
          setPoultryMeatPrice(p.meatPrice || 350);
          setPoultryHouseSizeM2(p.houseSizeM2 || 40);
          setFarmerDetails(prev => ({
            ...prev,
            poultry_breed: p.breed || "",
            poultry_system: p.system || "deep_litter",
            poultry_flock_size: p.flockSize || 0,
            poultry_age_weeks: p.ageWeeks || 0,
            poultry_farming_goal: p.farmingGoal || "Both",
            poultry_location_region: p.locationRegion || "Moderate",
            poultry_rainfall_pattern: p.rainfallPattern || "Wet",
            poultry_altitude: p.altitude || "Lowland",
            poultry_feed_type: p.feedType || "Mash",
            poultry_feed_cost_kg: p.feedCostKg || 65,
            poultry_vaccination_done: p.vaccinationDone || "No",
            poultry_mortality_count: p.mortalityCount || 0,
            poultry_chick_cost: p.chickCost || 120,
            poultry_egg_price: p.eggPrice || 280,
            poultry_meat_price: p.meatPrice || 350,
            poultry_house_size_m2: p.houseSizeM2 || 40,
          }));
        }

        // Load dairy fields
        if (profile.dairy) {
          const d = profile.dairy;
          setDairyCowCategory(d.cowCategory || "lactating");
          setDairyBodyWeightKg(d.bodyWeightKg || 500);
          setDairyBreed(d.breed || "fh");
          setDairyDiseaseSelect(d.diseaseSelect || "");
          setDairySymptoms(d.symptoms || []);
          setDairyMortalityCount(d.mortalityCount || 0);
          setDairyHealthDuration(d.healthDuration || "less_than_3_days");
          setDairyMilkYieldPerDay(d.milkYieldPerDay || 10);
          setDairyMilkPricePerLitre(d.milkPricePerLitre || 40);
          setDairyFeedCostPerDay(d.feedCostPerDay || 100);
          setDairyVetCostPerMonth(d.vetCostPerMonth || 500);
          setFarmerDetails(prev => ({
            ...prev,
            dairyDiseaseSelect: d.diseaseSelect || "",
            dairyDaysSinceCalving: d.daysSinceCalving || "",
            dairyHeatObserved: d.heatObserved || "",
            dairyLastInseminationDate: d.lastInseminationDate || "",
            dairyBreedingMethod: d.breedingMethod || "",
            dairyReproductiveProblems: d.reproductiveProblems || "",
            dairyBusinessInterest: d.businessInterest || "",
            calfAgeWeeks: d.calfAgeWeeks || "",
            calfFeedingMethod: d.calfFeedingMethod || "",
            calfMilkLitresPerDay: d.calfMilkLitresPerDay || "",
            calfReceivedColostrum: d.calfReceivedColostrum || "",
            calfHousingType: d.calfHousingType || "",
            calfHealthIssues: d.calfHealthIssues || "",
            dairyConcentrateBrand: d.concentrateBrand || "",
            dairyConcentrateProduct: d.concentrateProduct || "",
            dairyConcentrateInclusion: d.concentrateInclusion || "",
            dairyConcentrateMaizeKg: d.concentrateMaizeKg || "",
            dairyConcentrateSaltKg: d.concentrateSaltKg || "",
            dairyConcentrateCalciumSource: d.concentrateCalciumSource || "",
            dairyConcentrateCalciumKg: d.concentrateCalciumKg || "",
            dairyDeficiencySymptoms: d.deficiencySymptoms || "",
            dairyManagementFocus: d.managementFocus || "",
            dairyAvailableForages: d.availableForages || "",
            dairyAvailableGrains: d.availableGrains || "",
            dairyAvailableProtein: d.availableProtein || "",
            dairyAvailableMinerals: d.availableMinerals || "",
            dairyQuantityToMix: d.quantityToMix || "",
            dairyForageType: d.forageType || "",
            dairyForageKgPerDay: d.forageKgPerDay || "",
            dairyConcentrateType: d.concentrateType || "",
            dairyConcentrateKgPerDay: d.concentrateKgPerDay || "",
            dairyMilkYield: d.milkYield || "",
            dairyMilkPrice: d.milkPrice || "",
            dairyVetCostMonth: d.vetCostMonth || "",
            dairyOtherCosts: d.otherCosts || "",
            dairyHousingType: d.housingType || "",
            numberOfCowsHoused: d.numberOfCowsHoused || "",
            floorSpacePerCowM2: d.floorSpacePerCowM2 || "",
            dairyVentilationRating: d.ventilationRating || "",
            beddingType: d.beddingType || "",
            milkYieldCurrent: d.milkYieldCurrent || "",
            milkFatPercent: d.milkFatPercent || "",
            milkProteinPercent: d.milkProteinPercent || "",
            daysInMilk: d.daysInMilk || "",
            parity: d.parity || "",
            dairyParasiteSigns: d.parasiteSigns || "",
            dairyLastDeworming: d.lastDeworming || "",
            dairyLastHoofTrimming: d.lastHoofTrimming || "",
            dairyLastVaccination: d.lastVaccination || "",
            dairyNextVaccinationDue: d.nextVaccinationDue || "",
            dairyReminderTopics: d.reminderTopics || "",
          }));
        }

        console.log("✅ Loaded farmer profile from Firestore");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading profile:", error);
      return false;
    }
  }, []);

  const saveProfileToFirestore = useCallback(async (uid: string, details: any) => {
    try {
      const docRef = doc(db, "farmers", uid);

      const profile = {
        ...details,
        poultry: {
          breed: poultryBreed,
          system: poultrySystem,
          flockSize: poultryFlockSize,
          ageWeeks: poultryAgeWeeks,
          farmingGoal: poultryFarmingGoal,
          locationRegion: poultryLocationRegion,
          rainfallPattern: poultryRainfallPattern,
          altitude: poultryAltitude,
          feedType: poultryFeedType,
          feedCostKg: poultryFeedCostKg,
          vaccinationDone: poultryVaccinationDone,
          mortalityCount: poultryMortalityCount,
          chickCost: poultryChickCost,
          eggPrice: poultryEggPrice,
          meatPrice: poultryMeatPrice,
          houseSizeM2: poultryHouseSizeM2,
          disease: details.poultry_disease || "",
          symptomsObserved: details.symptomsObserved || "",
          mortalityCountDisease: details.mortalityCountDisease || "",
          diseaseDuration: details.diseaseDuration || "",
          // Feed formulation fields
          stage: details.poultryStage || "",
          batchSize: details.batchSize || "",
          includeCoccidiostat: details.includeCoccidiostat || "",
          availableIngredients: details.availableIngredients ? details.availableIngredients.split(',') : [],
          ingredientPrices: details.ingredientPrices ? JSON.parse(details.ingredientPrices) : {},
          ageWeeks: details.ageWeeks || "",
        },
        dairy: {
          cowCategory: dairyCowCategory,
          bodyWeightKg: dairyBodyWeightKg,
          breed: dairyBreed,
          diseaseSelect: details.dairyDiseaseSelect || dairyDiseaseSelect,
          symptoms: dairySymptoms,
          mortalityCount: dairyMortalityCount,
          healthDuration: dairyHealthDuration,
          milkYieldPerDay: dairyMilkYieldPerDay,
          milkPricePerLitre: dairyMilkPricePerLitre,
          feedCostPerDay: dairyFeedCostPerDay,
          vetCostPerMonth: dairyVetCostPerMonth,
          daysSinceCalving: details.dairyDaysSinceCalving || "",
          heatObserved: details.dairyHeatObserved || "",
          lastInseminationDate: details.dairyLastInseminationDate || "",
          breedingMethod: details.dairyBreedingMethod || "",
          reproductiveProblems: details.dairyReproductiveProblems || "",
          businessInterest: details.dairyBusinessInterest || "",
          calfAgeWeeks: details.calfAgeWeeks || "",
          calfFeedingMethod: details.calfFeedingMethod || "",
          calfMilkLitresPerDay: details.calfMilkLitresPerDay || "",
          calfReceivedColostrum: details.calfReceivedColostrum || "",
          calfHousingType: details.calfHousingType || "",
          calfHealthIssues: details.calfHealthIssues || "",
          concentrateBrand: details.dairyConcentrateBrand || "",
          concentrateProduct: details.dairyConcentrateProduct || "",
          concentrateInclusion: details.dairyConcentrateInclusion || "",
          concentrateMaizeKg: details.dairyConcentrateMaizeKg || "",
          concentrateSaltKg: details.dairyConcentrateSaltKg || "",
          concentrateCalciumSource: details.dairyConcentrateCalciumSource || "",
          concentrateCalciumKg: details.dairyConcentrateCalciumKg || "",
          deficiencySymptoms: details.dairyDeficiencySymptoms || "",
          managementFocus: details.dairyManagementFocus || "",
          availableForages: details.dairyAvailableForages || "",
          availableGrains: details.dairyAvailableGrains || "",
          availableProtein: details.dairyAvailableProtein || "",
          availableMinerals: details.dairyAvailableMinerals || "",
          quantityToMix: details.dairyQuantityToMix || "",
          forageType: details.dairyForageType || "",
          forageKgPerDay: details.dairyForageKgPerDay || "",
          concentrateType: details.dairyConcentrateType || "",
          concentrateKgPerDay: details.dairyConcentrateKgPerDay || "",
          milkYield: details.dairyMilkYield || "",
          milkPrice: details.dairyMilkPrice || "",
          vetCostMonth: details.dairyVetCostMonth || "",
          otherCosts: details.dairyOtherCosts || "",
          housingType: details.dairyHousingType || "",
          numberOfCowsHoused: details.numberOfCowsHoused || "",
          floorSpacePerCowM2: details.floorSpacePerCowM2 || "",
          ventilationRating: details.dairyVentilationRating || "",
          beddingType: details.beddingType || "",
          milkYieldCurrent: details.milkYieldCurrent || "",
          milkFatPercent: details.milkFatPercent || "",
          milkProteinPercent: details.milkProteinPercent || "",
          daysInMilk: details.daysInMilk || "",
          parity: details.parity || "",
          parasiteSigns: details.dairyParasiteSigns || "",
          lastDeworming: details.dairyLastDeworming || "",
          lastHoofTrimming: details.dairyLastHoofTrimming || "",
          lastVaccination: details.dairyLastVaccination || "",
          nextVaccinationDue: details.dairyNextVaccinationDue || "",
          reminderTopics: details.dairyReminderTopics || "",
        }
      };

      await setDoc(docRef, { profile }, { merge: true });
      console.log("✅ Saved farmer profile to Firestore");
      return true;
    } catch (error) {
      console.error("Error saving profile:", error);
      return false;
    }
  }, [poultryBreed, poultrySystem, poultryFlockSize, poultryAgeWeeks, poultryFarmingGoal, poultryLocationRegion, poultryRainfallPattern, poultryAltitude, poultryFeedType, poultryFeedCostKg, poultryVaccinationDone, poultryMortalityCount, poultryChickCost, poultryEggPrice, poultryMeatPrice, poultryHouseSizeM2, dairyCowCategory, dairyBodyWeightKg, dairyBreed, dairyDiseaseSelect, dairySymptoms, dairyMortalityCount, dairyHealthDuration, dairyMilkYieldPerDay, dairyMilkPricePerLitre, dairyFeedCostPerDay, dairyVetCostPerMonth]);

  useEffect(() => {
    if (user?.uid) loadProfileFromFirestore(user.uid);
  }, [user, loadProfileFromFirestore]);

  // ========== AGENT-TO-QUESTION MAPPING ==========
  const agentQuestionMap: Record<string, string[]> = {
    EnterpriseSetupAgent: ["country", "crops", "cropVarieties", "cropAcres", "season", "plantingDate", "plantingMaterial", "spacing", "seedRate", "saleDate"],
    FertilizerInterviewAgent: ["hasDoneSoilTest", "soilTestDate", "soilTestPH", "soilTestPHRating", "soilTestP", "soilTestPRating", "soilTestK", "soilTestKRating", "soilTestNPercent", "soilTestNPercentRating", "soilTestCa", "soilTestCaRating", "soilTestMg", "soilTestMgRating", "soilTestNa", "soilTestNaRating", "soilTestOC", "soilTestOCRating", "soilTestOM", "soilTestOMRating", "soilTestCEC", "soilTestCECRating", "targetYield", "recCalciticLime", "recDolomiticLime", "recPlantingFertilizer", "recPlantingQuantity", "recTopdressingFertilizer", "recTopdressingQuantity", "recPotassiumFertilizer", "recPotassiumQuantity", "plantingFertilizerToUse", "plantingFertilizerCost", "topdressingFertilizerToUse", "topdressingFertilizerCost", "potassiumFertilizerToUse", "potassiumFertilizerCost", "plantingFertilizerType", "plantingFertilizerQuantity", "topdressingFertilizerType", "topdressingFertilizerQuantity", "potassiumFertilizerType", "potassiumFertilizerQuantity", "plantingFertilizerNutrients", "topdressingFertilizerNutrients", "potassiumFertilizerNutrients", "calciticLimePricePerBag", "dolomiticLimePricePerBag"],
    PestInterviewAgent: ["commonPests", "plantsDamaged"],
    DiseaseInterviewAgent: ["commonDiseases", "plantsDamaged"],
    NutrientInterviewAgent: ["deficiencySymptoms", "deficiencyLocation"],
    GrossMarginInterviewAgent: ["seedCost", "plantingMaterialCost", "ploughingCost", "plantingLabourCost", "weedingCost", "harvestingCost", "transportCostTotal", "packagingCostTotal", "miscellaneousCostTotal"],
    StorageInterviewAgent: ["storageMethod"],
    ConservationInterviewAgent: ["conservationPractices", "waterSources"],
    GAPInterviewAgent: ["productionChallenges", "marketingChallenges", "climateChallenges", "financialChallenges"],
    PoultrySetupAgent: ["poultry_breed", "poultry_system", "poultry_flock_size", "poultry_age_weeks", "poultry_farming_goal", "poultry_location_region", "poultry_rainfall_pattern", "poultry_altitude", "poultry_feed_type", "poultry_feed_cost_kg", "poultry_vaccination_done", "poultry_mortality_count", "poultry_chick_cost", "poultry_egg_price", "poultry_meat_price", "poultry_house_size_m2"],
    PoultryDiseaseAgent: ["poultry_disease", "symptomsObserved", "mortalityCountDisease", "diseaseDuration"],
    // ===== NEW: HomePoultryFeedAgent =====
    HomePoultryFeedAgent: [
      "country", // Ensures country is asked (already essential)
      "poultryBreed",
      "poultryStage",
      "batchSize",
      "includeCoccidiostat",
      "availableIngredients",
      "ingredientPrices",
      "ageWeeks",
    ],
    // DAIRY AGENTS (15 total)
    DairySetupAgent: ["dairyCowCategory", "dairyBodyWeightKg", "dairyBreed", "dairyMilkYieldPerDay", "dairyMilkPricePerLitre", "dairyFeedCostPerDay", "dairyVetCostPerMonth"],
    DairyHealthAgent: ["dairyDiseaseSelect", "dairySymptoms", "dairyMortalityCount", "dairyHealthDuration"],
    DairyBreedingAgent: ["dairyDaysSinceCalving", "dairyHeatObserved", "dairyLastInseminationDate", "dairyBreedingMethod", "dairyReproductiveProblems"],
    DairyBusinessAgent: ["dairyBusinessInterest"],
    DairyCalfAgent: ["calfAgeWeeks", "calfFeedingMethod", "calfMilkLitresPerDay", "calfReceivedColostrum", "calfHousingType", "calfHealthIssues"],
    DairyConcentrateAgent: ["dairyConcentrateBrand", "dairyConcentrateProduct", "dairyConcentrateInclusion", "dairyConcentrateMaizeKg", "dairyConcentrateSaltKg", "dairyConcentrateCalciumSource", "dairyConcentrateCalciumKg"],
    DairyDeficiencyAgent: ["dairyDeficiencySymptoms"],
    DairyDosDontsAgent: ["dairyManagementFocus"],
    DairyFeedAgent: ["dairyAvailableForages", "dairyAvailableGrains", "dairyAvailableProtein", "dairyAvailableMinerals", "dairyQuantityToMix"],
    DairyFeedPerDayAgent: ["dairyForageType", "dairyForageKgPerDay", "dairyConcentrateType", "dairyConcentrateKgPerDay", "dairyMilkYield"],
    DairyFinancialAgent: ["dairyFeedCostPerDay", "dairyMilkPrice", "dairyVetCostMonth", "dairyOtherCosts"],
    DairyHousingAgent: ["dairyHousingType", "numberOfCowsHoused", "floorSpacePerCowM2", "dairyVentilationRating", "beddingType"],
    DairyMilkAgent: ["milkYieldCurrent", "milkFatPercent", "milkProteinPercent", "daysInMilk", "parity"],
    DairyParasiteAgent: ["dairyParasiteSigns"],
    DairyReminderAgent: ["dairyLastDeworming", "dairyLastHoofTrimming", "dairyLastVaccination", "dairyNextVaccinationDue", "dairyReminderTopics"],

    // ========== NEW CROP AGENTS ==========
    GAPAgent: [],
    ProfitCalculationAgent: [
      "actualYieldKg",
      "pricePerKg",
      "seedCost",
      "plantingFertilizerCost",
      "plantingFertilizerQuantity",
      "topdressingFertilizerCost",
      "topdressingFertilizerQuantity",
      "potassiumFertilizerCost",
      "potassiumFertilizerQuantity",
      "recCalciticLime",
      "calciticLimePricePerBag",
      "ploughingCost",
      "plantingLabourCost",
      "weedingCost",
      "harvestingCost",
      "transportCostTotal",
      "packagingCostTotal",
      "miscellaneousCostTotal",
    ],
    BusinessPlanAgent: [
      "businessName",
      "businessVision",
      "businessMission",
      "shortTermGoals",
      "midTermGoals",
      "longTermGoals",
      "targetCustomers",
      "communicationChannels",
      "fallbackPlan",
      "competitiveAdvantage",
      "paymentModes",
      "businessPositions",
      "positionHeads",
      "products",
      "productionInputs",
    ],

    // ========== NEW POULTRY & DAIRY BUSINESS PLAN AGENTS ==========
    PoultryBusinessPlanAgent: [
      "businessName",
      "businessVision",
      "businessMission",
      "shortTermGoals",
      "midTermGoals",
      "longTermGoals",
      "targetCustomers",
      "communicationChannels",
      "fallbackPlan",
      "competitiveAdvantage",
      "paymentModes",
      "businessPositions",
      "positionHeads",
      "poultryProducts",
      "poultryProductionInputs",
    ],
    DairyBusinessPlanAgent: [
      "businessName",
      "businessVision",
      "businessMission",
      "shortTermGoals",
      "midTermGoals",
      "longTermGoals",
      "targetCustomers",
      "communicationChannels",
      "fallbackPlan",
      "competitiveAdvantage",
      "paymentModes",
      "businessPositions",
      "positionHeads",
      "dairyProducts",
      "dairyProductionInputs",
    ],
  };

  const getAllowedQuestionIds = useCallback((): string[] => {
    if (!filter || filter === "complete" || !agents || agents.length === 0) return [];
    const allowed: string[] = [];
    for (const agentName of agents) {
      const ids = agentQuestionMap[agentName] || [];
      console.log(`🔍 Agent "${agentName}" has ${ids.length} questions:`, ids);
      allowed.push(...ids);
    }
    const essential = ["country", "county", "subCounty", "village", "farmerName"];
    for (const field of essential) { if (!allowed.includes(field)) allowed.push(field); }
    console.log("✅ Allowed question IDs:", allowed);
    return allowed;
  }, [filter, agents]);

  // ========== Helper to generate crop‑specific product options ==========
  const getProductOptionsForCrop = (crop: string): string[] => {
    const cropLower = crop.toLowerCase();
    const productMap: Record<string, string[]> = {
      banana: ["Fresh Bananas", "Banana Flour", "Banana Crisps", "Banana Wine", "Dried Bananas"],
      maize: ["Fresh Maize", "Dry Grain", "Maize Flour", "Maize Bran", "Maize Silage"],
      tomato: ["Fresh Tomatoes", "Tomato Paste", "Tomato Sauce", "Dried Tomatoes"],
      coffee: ["Fresh Cherries", "Dry Parchment", "Roasted Beans", "Ground Coffee"],
      mango: ["Fresh Mangoes", "Dried Mango", "Mango Juice", "Mango Chutney"],
      avocado: ["Fresh Avocados", "Avocado Oil", "Guacamole"],
      beans: ["Fresh Beans", "Dry Beans", "Bean Flour"],
      potato: ["Fresh Potatoes", "Chips", "Potato Flour"],
      pineapple: ["Fresh Pineapples", "Pineapple Juice", "Dried Pineapple"],
      onion: ["Fresh Onions", "Dried Onion Flakes"],
      cabbage: ["Fresh Cabbage", "Coleslaw", "Fermented Cabbage"],
      watermelon: ["Fresh Watermelon", "Watermelon Juice"],
      carrot: ["Fresh Carrots", "Carrot Juice", "Grated Carrots"],
      passion_fruit: ["Fresh Passion Fruit", "Passion Juice", "Concentrate"],
      macadamia: ["Raw Nuts", "Roasted Nuts", "Macadamia Oil"],
      cashew: ["Raw Nuts", "Roasted Nuts", "Cashew Butter"],
    };
    // Fallback: generic options for any other crop
    return productMap[cropLower] || [`Fresh ${crop}`, `Processed ${crop}`, `${crop} Flour`];
  };

  // ========== QUESTION DEFINITIONS ==========
  const countryQuestion = [
    { id: "country", questionKey: "question_country", type: "dropdown", options: ["algeria", "anguilla", "antigua and barbuda", "argentina", "australia", "bahamas", "barbados", "belgium", "belize", "benin", "bermuda", "bolivia", "bonaire", "botswana", "burkina faso", "burundi", "cameroon", "canada", "cape verde", "cayman islands", "central african republic", "chad", "chile", "colombia", "comoros", "congo (brazzaville)", "congo (kinshasa)", "costa rica", "cuba", "curacao", "djibouti", "dominica", "dominican republic", "ecuador", "egypt", "el salvador", "equatorial guinea", "eritrea", "eswatini", "ethiopia", "fiji", "france", "french guiana", "french polynesia", "gabon", "gambia", "ghana", "gibraltar", "grenada", "guadeloupe", "guam", "guatemala", "guernsey", "guinea", "guinea-bissau", "guyana", "haiti", "honduras", "india", "ireland", "isle of man", "ivory coast", "jamaica", "jersey", "kenya", "kiribati", "lesotho", "liberia", "libya", "luxembourg", "madagascar", "malawi", "malaysia", "maldives", "mali", "malta", "martinique", "mauritania", "mauritius", "mayotte", "mexico", "monaco", "montserrat", "morocco", "mozambique", "namibia", "new caledonia", "new zealand", "niger", "nigeria", "niue", "norfolk island", "panama", "papua new guinea", "paraguay", "peru", "philippines", "puerto rico", "reunion", "rwanda", "saint barthelemy", "saint kitts and nevis", "saint lucia", "saint martin", "saint pierre and miquelon", "saint vincent and the grenadines", "samoa", "sao tome and principe", "senegal", "seychelles", "sierra leone", "singapore", "sint maarten", "solomon islands", "somalia", "south africa", "south sudan", "spain", "sudan", "suriname", "switzerland", "tanzania", "togo", "tokelau", "trinidad and tobago", "tunisia", "turks and caicos islands", "tuvalu", "uganda", "united kingdom", "united states", "uruguay", "vanuatu", "venezuela", "zambia", "zimbabwe"].sort((a, b) => a.localeCompare(b)),
      sectionKey: "section_location"
    }
  ];

  const soilTestGatekeeperQuestion = [
    { id: "hasDoneSoilTest", questionKey: "question_soil_test", type: "dropdown", options: ["Yes", "No"], sectionKey: "section_soil_test" }
  ];

  const cropSelectionQuestion = {
    id: "crops",
    questionKey: "question_crop_enterprise",
    type: "dropdown",
    options: ["african nightshade", "alfalfa", "almond", "aloe vera", "amaranth", "amaranth grain", "anise", "artichoke", "arugula", "asparagus", "avocados", "bambaranuts", "bamboo", "bananas", "barley", "basil", "beans", "beetroot", "black pepper", "bok choy", "borage", "brachiaria", "brazil nut", "breadfruit", "brinjals", "broccoli", "buckwheat", "buffel grass", "cabbages", "calendula", "calliandra", "canavalia", "capsicums", "caraway", "cardamom", "carrots", "cashew", "cassava", "cauliflower", "cayenne", "celery", "cenchrus", "chamomile", "chervil", "chestnut", "chickpea", "chillies", "chives", "cinnamon", "clover", "cloves", "cocoa", "coconut", "coffee", "collard greens", "coriander", "cotton", "courgettes", "cowpeas", "crotalaria paulina", "cucumbers", "cumin", "currant", "date palm", "desmodium", "dill", "dolichos", "durian", "echinacea", "elderberry", "endive", "escarole", "ethiopian kale", "faba bean", "fennel", "fenugreek", "fig", "finger millet", "flax", "fonio", "forage sorghum", "french beans", "frisee", "garden peas", "garlic", "ginger", "ginseng", "goldenseal", "gooseberry", "grapefruit", "green grams", "groundnuts", "guava", "guinea grass", "hazelnut", "hemp", "hibiscus", "hops", "horseradish", "irish potatoes", "italian ryegrass", "jackfruit", "jalapeno", "jute", "jute mallow", "kales", "kamut", "kenaf", "kohlrabi", "lavender", "leeks", "lemon grass", "lemons", "lentil", "lettuce", "leucaena", "limes", "longan", "lovage", "lucerne", "lychee", "macadamia", "maize", "mangoes", "mangosteen", "marjoram", "marula", "millet", "mint", "moringa", "mucuna", "mulberry", "mushroom", "mustard", "mustard greens", "napier grass", "napier hybrid", "nasturtium", "oats", "oil palm", "okra", "onions", "oranges", "orchard grass", "oregano", "oyster nut", "parsley", "parsnip", "passion fruit", "pawpaws", "peanut", "pecan", "persimmon", "pigeonpeas", "pili nut", "pineapples", "pistachio", "pomegranate", "potatoes", "pumpkin", "pumpkin leaves", "pyrethrum", "quinoa", "radicchio", "radish", "rambutan", "ramie", "rapeseed", "rhodes grass", "rhubarb", "rice", "rosemary", "rubber", "rutabaga", "safflower", "sage", "savory", "sesame", "sesbania", "shallots", "shea", "simsim", "sisal", "slender leaf", "sorghum", "sorrel", "soya beans", "spelt", "spider plant", "spinach", "St. John's wort", "star fruit", "stevia", "stinging nettle", "sugarcane", "sunn hemp", "sunflower", "sweet potatoes", "sweet potato leaves", "Swiss chard", "tarragon", "taro", "tea", "teff", "thyme", "timothy grass", "tobacco", "tomatoes", "triticale", "turmeric", "turnip", "turnip greens", "valerian", "vanilla", "vetch", "walnut", "wasabi", "watercress", "watermelons", "wheat", "white clover", "yams"].sort((a, b) => a.localeCompare(b)),
    sectionKey: "section_crops"
  };

  const saleDateQuestion = { id: "saleDate", questionKey: "question_sale_date", type: "date", minDate: new Date().toISOString().split('T')[0], maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sectionKey: "section_production" };

  const deficiencyQuestions = [
    { id: "deficiencySymptoms", questionKey: "question_deficiency_symptoms", type: "dropdown", options: ["Yellow leaves", "Purple color", "Burned edges", "Yellow between veins", "Stunted growth", "Blossom end rot", "Distorted new leaves", "Other (specify)"], sectionKey: "section_nutrition" },
    { id: "deficiencyLocation", questionKey: "question_deficiency_location", type: "dropdown", options: ["Older leaves (bottom)", "Younger leaves (top)", "Whole plant", "Fruits/flowers only"], sectionKey: "section_nutrition" }
  ];

  const nutrientDetailQuestions = [
    { id: "plantingFertilizerNutrients", questionKey: "question_planting_fertilizer_nutrients", type: "custom", renderCustom: true, sectionKey: "section_fertilizer_selection" },
    { id: "topdressingFertilizerNutrients", questionKey: "question_topdressing_fertilizer_nutrients", type: "custom", renderCustom: true, sectionKey: "section_fertilizer_selection" },
    { id: "potassiumFertilizerNutrients", questionKey: "question_potassium_fertilizer_nutrients", type: "custom", renderCustom: true, sectionKey: "section_fertilizer_selection" },
  ];

  const plantsDamagedQuestion = { id: "plantsDamaged", questionKey: "question_plants_damaged", type: "number", placeholder: "e.g., 50", step: "any", sectionKey: "section_pests" };
  const nutritionBenefitsQuestion = { id: "wantsNutritionBenefits", questionKey: "question_wants_nutrition_benefits", type: "button", options: ["Yes"], sectionKey: "section_nutrition" };

  // ---- Feed formulation questions ----
  const getFeedFormulationQuestions = () => {
    const isFeedFormulation = filter === "poultry_feed_formulation" || agents.includes("HomePoultryFeedAgent");
    if (!isFeedFormulation) return [];

    return [
      {
        id: "poultryBreed",
        questionKey: "question_poultry_breed",
        type: "dropdown",
        options: FEED_FORMULATION_BREEDS,
        sectionKey: "section_poultry",
      },
      {
        id: "poultryStage",
        questionKey: "question_poultry_stage",
        type: "dropdown",
        options: ["Starter", "Grower", "Layer", "Finisher"],
        sectionKey: "section_poultry",
      },
      {
        id: "batchSize",
        questionKey: "question_poultry_batch_size",
        type: "dropdown",
        options: batchSizeOptions,
        sectionKey: "section_poultry",
      },
      {
        id: "includeCoccidiostat",
        questionKey: "question_poultry_coccidiostat",
        type: "dropdown",
        options: ["Yes", "No"],
        sectionKey: "section_poultry",
        dependsOn: {
          field: "poultryStage",
          valueNot: "Layer",
        },
      },
      {
        id: "availableIngredients",
        questionKey: "question_poultry_available_ingredients",
        type: "multiselect",
        options: allIngredients,
        sectionKey: "section_poultry",
      },
      {
        id: "ingredientPrices",
        questionKey: "question_poultry_ingredient_prices",
        type: "custom",
        renderCustom: true,
        sectionKey: "section_poultry",
        dependsOn: {
          field: "availableIngredients",
          valueNot: "",
        },
      },
      {
        id: "ageWeeks",
        questionKey: "question_poultry_age_weeks",
        type: "number",
        placeholder: "e.g., 6 (leave blank for default)",
        step: "any",
        sectionKey: "section_poultry",
      },
    ];
  };

  const getCropSpecificQuestions = () => {
    if (!farmerDetails.crops) return [];
    const crop = farmerDetails.crops;
    const spacingOptions = getSpacingOptions(crop);
    const varietyOptions = getVarietiesOptions(crop);
    const hasVarieties = varietyOptions.length > 0;
    return [
      { id: "cropVarieties", questionKey: "question_crop_varieties", type: hasVarieties ? "dropdown" : "text", options: hasVarieties ? varietyOptions : [], placeholder: hasVarieties ? "Select variety" : "e.g., H614", sectionKey: "section_crops" },
      { id: "cropAcres", questionKey: "question_crop_acres", type: "number", step: "any", placeholder: "e.g., 2.5", sectionKey: "section_crops" },
      { id: "season", questionKey: "question_season", type: "dropdown", options: ["long rains", "short rains", "dry season"], sectionKey: "section_crops" },
      { id: "plantingDate", questionKey: "question_planting_date", type: "date", minDate: "2024-01-01", maxDate: new Date().toISOString().split('T')[0], sectionKey: "section_crops" },
      getPlantingMaterialQuestion(crop),
      { id: "spacing", questionKey: "question_spacing", type: "dropdown", options: spacingOptions.map(s => s.label), sectionKey: "section_planting_density" },
      getPlantingQuantityQuestion(crop),
    ];
  };

  const getProductionQuestions = () => {
    if (!farmerDetails.crops) return [];
    const crop = farmerDetails.crops;
    return [
      { id: "harvestUnit", questionKey: "question_harvest_unit", type: "dropdown", options: ["kg"], sectionKey: "section_production" },
      { id: "actualYieldKg", questionKey: "question_actual_yield_kg", type: "number", step: "any", placeholder: safeT('enter_yield_kg_placeholder'), sectionKey: "section_production" },
      { id: "pricePerKg", questionKey: "question_price_per_kg", type: "number", step: "any", placeholder: safeT('enter_price_kg_placeholder'), sectionKey: "section_production" },
      getStorageQuestion(crop)
    ];
  };

  const farmWaterQuestions = [
    { id: "totalFarmSize", questionKey: "question_total_farm_size", type: "number", step: "any", placeholder: "e.g., 5", sectionKey: "section_farm" },
    { id: "waterSources", questionKey: "question_water_sources", type: "multiselect", options: ["Rainwater only", "River only", "Borehole only", "River + Borehole", "River + Borehole + Rainwater", "None (dryland farming)"], sectionKey: "section_water" }
  ];

  const getPestQuestions = () => {
    if (!farmerDetails.crops) return [];
    const crop = farmerDetails.crops;
    return [
      { id: "commonPests", questionKey: "question_common_pests", type: "multiselect", options: getPestsOptions(crop), sectionKey: "section_pests" },
      { id: "commonDiseases", questionKey: "question_common_diseases", type: "multiselect", options: getDiseasesOptions(crop), sectionKey: "section_diseases" },
    ];
  };

  const getFinancialQuestions = () => {
    if (!farmerDetails.crops) return [];
    const crop = farmerDetails.crops;
    let questions = [
      { id: "ploughingCost", questionKey: "question_ploughing_cost", type: "number", step: "any", placeholder: "e.g., 7000", sectionKey: "section_finance" },
      { id: "plantingLabourCost", questionKey: "question_planting_labour_cost", type: "number", step: "any", placeholder: "e.g., 2000", sectionKey: "section_finance" },
      { id: "weedingCost", questionKey: "question_weeding_cost", type: "number", step: "any", placeholder: "e.g., 2500", sectionKey: "section_finance" },
      { id: "harvestingCost", questionKey: "question_harvesting_cost", type: "number", step: "any", placeholder: "e.g., 2000", sectionKey: "section_finance" },
      { id: "transportCostTotal", questionKey: "question_transport_cost_total", type: "number", step: "any", placeholder: "e.g., 5000", sectionKey: "section_finance" },
      { id: "packagingCostTotal", questionKey: "question_packaging_cost_total", type: "number", step: "any", placeholder: "e.g., 2000", sectionKey: "section_finance" },
      { id: "miscellaneousCostTotal", questionKey: "question_miscellaneous_cost_total", type: "number", step: "any", placeholder: "e.g., 1000", sectionKey: "section_finance" },
    ];
    if (!needsPlantingMaterialCost(crop)) {
      questions.unshift({ id: "seedCost", questionKey: "question_seed_cost", type: "number", placeholder: "e.g., 180", step: "any", sectionKey: "section_finance" });
    }
    if (needsPlantingMaterialCost(crop)) {
      questions.unshift(getPlantingMaterialCostQuestion(crop));
    }
    questions.push({ id: "calciticLimePricePerBag", questionKey: "question_lime_price", type: "number", placeholder: "e.g., 300", step: "any", sectionKey: "section_finance" });
    questions.push({ id: "dolomiticLimePricePerBag", questionKey: "question_dolomitic_lime_price", type: "number", placeholder: "e.g., 300", step: "any", sectionKey: "section_finance" });
    return questions;
  };

  const conservationQuestion = [
    { id: "conservationPractices", questionKey: "question_conservation_practices", type: "multiselect", options: ["Organic manure", "Terracing", "Mulching", "Cover crops", "Rainwater harvesting", "Contour farming", "None"], sectionKey: "section_conservation" }
  ];

  const challengesQuestions = [
    { id: "productionChallenges", questionKey: "question_production_challenges", type: "multiselect", options: ["Pests", "Diseases", "Drought", "Floods", "Poor soil fertility", "High input costs", "Labor shortage", "Weeds", "Wild animals", "Fall armyworm", "Stalk borers", "Aphids", "Whiteflies", "Maize streak virus", "Leaf rust", "Blight", "Other"], sectionKey: "section_challenges" },
    { id: "marketingChallenges", questionKey: "question_marketing_challenges", type: "multiselect", options: ["Low prices", "Price fluctuations", "No reliable buyer", "Transport costs", "Brokers/middlemen", "Post-harvest losses", "No storage", "Perishability", "Other"], sectionKey: "section_challenges" },
    { id: "climateChallenges", questionKey: "question_climate_challenges", type: "multiselect", options: ["Unreliable rains", "Drought", "Floods", "Hailstorms", "Strong winds", "Extreme heat", "Late rains", "Early cessation", "Other"], sectionKey: "section_challenges" },
    { id: "financialChallenges", questionKey: "question_financial_challenges", type: "multiselect", options: ["No capital", "No loans", "High interest rates", "No subsidies", "High input costs", "Cash flow problems", "Debt", "Other"], sectionKey: "section_challenges" },
  ];

  const personalLocationQuestions = [
    { id: "farmerName", questionKey: "question_farmer_name", type: "text", placeholder: "e.g., John Mugo", sectionKey: "section_personal" },
    { id: "county", questionKey: "question_county", type: "text", placeholder: "e.g., Bungoma", sectionKey: "section_location" },
    { id: "subCounty", questionKey: "question_sub_county", type: "text", placeholder: "e.g., Kimilili", sectionKey: "section_location" },
    { id: "ward", questionKey: "question_ward", type: "text", placeholder: "e.g., Kimilili", sectionKey: "section_location" },
    { id: "village", questionKey: "question_village", type: "text", placeholder: "e.g., Sikulu", sectionKey: "section_location" },
  ];

  const soilTestDetailsQuestions = [
    { id: "soilTestDate", questionKey: "question_soil_test_date", type: "date", minDate: "2020-01-01", maxDate: new Date().toISOString().split('T')[0], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestPH", questionKey: "question_soil_test_ph", type: "number", min: 0, max: 14, step: 0.1, dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestPHRating", questionKey: "question_soil_test_ph_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestP", questionKey: "question_soil_test_p", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestPRating", questionKey: "question_soil_test_p_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestK", questionKey: "question_soil_test_k", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestKRating", questionKey: "question_soil_test_k_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestNPercent", questionKey: "question_soil_test_n", type: "number", min: 0, max: 5, step: 0.01, dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestNPercentRating", questionKey: "question_soil_test_n_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestCa", questionKey: "question_soil_test_ca", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestCaRating", questionKey: "question_soil_test_ca_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestMg", questionKey: "question_soil_test_mg", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestMgRating", questionKey: "question_soil_test_mg_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestNa", questionKey: "question_soil_test_na", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestNaRating", questionKey: "question_soil_test_na_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestOC", questionKey: "question_soil_test_oc", type: "number", step: 0.01, dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestOCRating", questionKey: "question_soil_test_oc_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestOM", questionKey: "question_soil_test_om", type: "number", step: 0.01, dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestOMRating", questionKey: "question_soil_test_om_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestCEC", questionKey: "question_soil_test_cec", type: "number", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "soilTestCECRating", questionKey: "question_soil_test_cec_rating", type: "dropdown", options: ["Very Low", "Low", "Optimum", "High", "Very High"], dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test" },
    { id: "targetYield", questionKey: "question_target_yield_kg", type: "number", step: "any", placeholder: safeT('enter_target_yield_kg'), dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recCalciticLime", questionKey: "question_rec_calcitic_lime", type: "number", step: "any", placeholder: "e.g., 120", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recDolomiticLime", questionKey: "question_rec_dolomitic_lime", type: "number", step: "any", placeholder: "e.g., 120", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recPlantingFertilizer", questionKey: "question_rec_planting_fertilizer", type: "text", placeholder: "e.g., NPK 12.24.12+5S", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recPlantingQuantity", questionKey: "question_rec_planting_quantity", type: "number", step: "any", placeholder: "e.g., 100", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recTopdressingFertilizer", questionKey: "question_rec_topdressing_fertilizer", type: "text", placeholder: "e.g., UREA 46-0-0", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recTopdressingQuantity", questionKey: "question_rec_topdressing_quantity", type: "number", step: "any", placeholder: "e.g., 90", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recPotassiumFertilizer", questionKey: "question_rec_potassium_fertilizer", type: "text", placeholder: "e.g., MOP 0-0-60", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recPotassiumQuantity", questionKey: "question_rec_potassium_quantity", type: "number", step: "any", placeholder: "e.g., 30", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_soil_test_recommendations" },
  ];

  const fertilizerSelectionQuestions = [
    { id: "plantingFertilizerToUse", questionKey: "question_planting_fertilizer_to_use", type: "dropdown", options: plantingFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_fertilizer_selection" },
    { id: "plantingFertilizerCost", questionKey: "question_planting_fertilizer_cost", type: "number", placeholder: "e.g., 3,500", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_fertilizer_selection" },
    { id: "topdressingFertilizerToUse", questionKey: "question_topdressing_fertilizer_to_use", type: "dropdown", options: topdressingFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_fertilizer_selection" },
    { id: "topdressingFertilizerCost", questionKey: "question_topdressing_fertilizer_cost", type: "number", placeholder: "e.g., 2,800", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_fertilizer_selection" },
    { id: "potassiumFertilizerToUse", questionKey: "question_potassium_fertilizer_to_use", type: "dropdown", options: potassiumFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "Yes" }, sectionKey: "section_fertilizer_selection" },
    { id: "potassiumFertilizerCost", questionKey: "question_potassium_fertilizer_cost", type: "number", placeholder: "e.g., 2,800", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "Yes", field2: "potassiumFertilizerToUse", valueNot: "None - I don't use potassium" }, sectionKey: "section_fertilizer_selection" },
  ];

  const fertilizerQuestionsWithoutSoilTest = [
    { id: "plantingFertilizerType", questionKey: "question_planting_fertilizer_type", type: "dropdown", options: plantingFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_fertilizer_selection" },
    { id: "plantingFertilizerQuantity", questionKey: "question_planting_fertilizer_quantity", type: "number", placeholder: "e.g., 50 kg", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_fertilizer_selection" },
    { id: "topdressingFertilizerType", questionKey: "question_topdressing_fertilizer_type", type: "dropdown", options: topdressingFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_fertilizer_selection" },
    { id: "topdressingFertilizerQuantity", questionKey: "question_topdressing_fertilizer_quantity", type: "number", placeholder: "e.g., 50 kg", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_fertilizer_selection" },
    { id: "potassiumFertilizerType", questionKey: "question_potassium_fertilizer_type", type: "dropdown", options: potassiumFertilizerOptions.map(opt => opt.label), dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_fertilizer_selection" },
    { id: "potassiumFertilizerQuantity", questionKey: "question_potassium_fertilizer_quantity", type: "number", placeholder: "e.g., 50 kg", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "No", field2: "potassiumFertilizerType", valueNot: "None - I don't use potassium" }, sectionKey: "section_fertilizer_selection" },
    { id: "recCalciticLime", questionKey: "question_rec_calcitic_lime", type: "number", placeholder: "e.g., 120 (kg/acre)", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_soil_test_recommendations" },
    { id: "recDolomiticLime", questionKey: "question_rec_dolomitic_lime", type: "number", placeholder: "e.g., 120 (kg/acre)", step: "any", dependsOn: { field: "hasDoneSoilTest", value: "No" }, sectionKey: "section_soil_test_recommendations" },
  ];

  const getFertilizerIdFromLabel = (label: string, options: any[]): string => {
    const found = options.find(opt => opt.label === label);
    return found ? found.id : "other";
  };

  // ========== UPDATED filterQuestions to handle valueNot for a single field ==========
  const filterQuestions = useCallback((questions: any[]) => {
    return questions.filter(q => {
      if (!q.dependsOn) return true;
      // If field2 and valueNot are present, use that condition
      if (q.dependsOn.field2 && q.dependsOn.valueNot) {
        const dependsOnField = q.dependsOn.field;
        const dependsOnField2 = q.dependsOn.field2;
        const expectedValue = q.dependsOn.value;
        const valueNot = q.dependsOn.valueNot;
        const actualValue = farmerDetails[dependsOnField as keyof typeof farmerDetails];
        const actualValue2 = farmerDetails[dependsOnField2 as keyof typeof farmerDetails];
        return actualValue === expectedValue && actualValue2 !== valueNot;
      }
      if (q.dependsOn.field) {
        const dependsOnField = q.dependsOn.field;
        // If value is defined, check equality
        if (q.dependsOn.value !== undefined) {
          const expectedValue = q.dependsOn.value;
          const actualValue = farmerDetails[dependsOnField as keyof typeof farmerDetails];
          return actualValue === expectedValue;
        }
        // If valueNot is defined, check inequality (FIX for ingredientPrices)
        if (q.dependsOn.valueNot !== undefined) {
          const notValue = q.dependsOn.valueNot;
          const actualValue = farmerDetails[dependsOnField as keyof typeof farmerDetails];
          return actualValue !== notValue;
        }
        // If neither, include
        return true;
      }
      return true;
    });
  }, [farmerDetails]);

  // ========== GET ALL QUESTIONS ==========
  const getAllQuestions = useCallback(() => {
    let questions: any[] = [];
    const allowedIds = getAllowedQuestionIds();
    const isFiltered = allowedIds.length > 0;

    const shouldInclude = (id: string): boolean => {
      return !isFiltered || allowedIds.includes(id);
    };

    // Country
    if (shouldInclude("country")) questions = [...questions, ...countryQuestion];

    // Soil test gatekeeper
    if (shouldInclude("hasDoneSoilTest")) questions = [...questions, ...soilTestGatekeeperQuestion];

    // ===== CROP PATH =====
    if (selectedSpecies === "crop") {
      // Crop selection
      if (shouldInclude("crops")) questions = [...questions, cropSelectionQuestion];
      if (shouldInclude("saleDate")) questions = [...questions, saleDateQuestion];

      // Crop-specific questions
      if (farmerDetails.crops) {
        const cropQuestions = getCropSpecificQuestions();
        for (const q of cropQuestions) if (shouldInclude(q.id)) questions.push(q);
      }

      // Production questions
      if (farmerDetails.crops) {
        const prodQuestions = getProductionQuestions();
        for (const q of prodQuestions) if (shouldInclude(q.id)) questions.push(q);
      }

      // Soil test details
      if (farmerDetails.hasDoneSoilTest === "Yes") {
        const soilQuestions = soilTestDetailsQuestions;
        for (const q of soilQuestions) if (shouldInclude(q.id)) questions.push(q);
        for (const q of fertilizerSelectionQuestions) if (shouldInclude(q.id)) questions.push(q);
      } else if (farmerDetails.hasDoneSoilTest === "No") {
        for (const q of fertilizerQuestionsWithoutSoilTest) if (shouldInclude(q.id)) questions.push(q);
      }

      // Nutrient questions
      for (const q of nutrientDetailQuestions) {
        if (shouldInclude(q.id)) {
          let show = false;
          if (q.id === "plantingFertilizerNutrients") {
            const type = farmerDetails.hasDoneSoilTest === "Yes" ? farmerDetails.plantingFertilizerToUse : farmerDetails.plantingFertilizerType;
            show = !!type && type !== "";
          } else if (q.id === "topdressingFertilizerNutrients") {
            const type = farmerDetails.hasDoneSoilTest === "Yes" ? farmerDetails.topdressingFertilizerToUse : farmerDetails.topdressingFertilizerType;
            show = !!type && type !== "";
          } else if (q.id === "potassiumFertilizerNutrients") {
            const type = farmerDetails.hasDoneSoilTest === "Yes" ? farmerDetails.potassiumFertilizerToUse : farmerDetails.potassiumFertilizerType;
            show = !!type && type !== "" && type !== "None - I don't use potassium";
          }
          if (show) questions.push(q);
        }
      }

      // Farm & water
      for (const q of farmWaterQuestions) if (shouldInclude(q.id)) questions.push(q);

      // Pest questions
      if (farmerDetails.crops) {
        const pestQuestions = getPestQuestions();
        for (const q of pestQuestions) if (shouldInclude(q.id)) questions.push(q);
      }

      // Plants damaged
      if (shouldInclude("plantsDamaged")) questions.push(plantsDamagedQuestion);

      // Financial questions
      if (farmerDetails.crops) {
        const finQuestions = getFinancialQuestions();
        for (const q of finQuestions) if (shouldInclude(q.id)) questions.push(q);
      }

      // Deficiency questions
      if (farmerDetails.crops) {
        for (const q of deficiencyQuestions) if (shouldInclude(q.id)) questions.push(q);
      }

      // Nutrition benefits
      if (shouldInclude("wantsNutritionBenefits")) questions.push(nutritionBenefitsQuestion);

      // Conservation
      for (const q of conservationQuestion) if (shouldInclude(q.id)) questions.push(q);

      // Challenges
      for (const q of challengesQuestions) if (shouldInclude(q.id)) questions.push(q);

      // Personal & location
      for (const q of personalLocationQuestions) if (shouldInclude(q.id)) questions.push(q);
    }

    // ===== POULTRY PATH =====
    if (selectedSpecies === "poultry") {
      const isFeedFormulation = filter === "poultry_feed_formulation" || agents.includes("HomePoultryFeedAgent");

      if (isFeedFormulation) {
        // Add feed formulation questions
        const feedQuestions = getFeedFormulationQuestions();
        for (const q of feedQuestions) {
          if (shouldInclude(q.id)) {
            questions.push(q);
          }
        }
      } else {
        // Original poultry setup questions
        const poultryFields = [
          "poultry_breed", "poultry_system", "poultry_flock_size", "poultry_age_weeks",
          "poultry_farming_goal", "poultry_location_region", "poultry_rainfall_pattern",
          "poultry_altitude", "poultry_feed_type", "poultry_feed_cost_kg",
          "poultry_vaccination_done", "poultry_mortality_count", "poultry_chick_cost",
          "poultry_egg_price", "poultry_meat_price", "poultry_house_size_m2"
        ];
        const allBreeds = (() => {
          const groups = [
            { breeds: ["KARI Improved Kienyeji", "Kuroiler", "Rainbow Rooster", "Brown Leghorn", "Hy-Line Brown", "Isa Brown", "Lohmann Brown", "Bovans Brown", "Dekalb White", "Babcock White"] },
            { breeds: ["Cobb 500", "Ross 308", "Arbor Acres", "Hubbard", "Indian River"] },
            { breeds: ["Sussex", "Kenbrew (Kenbro)", "Sasso", "Kenya Broiler", "KARI Kienyeji"] },
            { breeds: ["Local Kienyeji", "Local Turkana", "Local Bantam"] },
            { breeds: ["Broad Breasted White", "Broad Breasted Bronze", "Narragansett", "Royal Palm", "Local Turkey"] },
            { breeds: ["Khaki Campbell", "Pekin", "Rouen", "Muscovy", "Indian Runner", "Local Duck"] },
            { breeds: ["African Grey", "Toulouse", "Embden", "Chinese", "Local Goose"] },
            { breeds: ["Japanese Quail", "Coturnix Quail", "Bobwhite Quail"] },
            { breeds: ["Other"] }
          ];
          return groups.flatMap(g => g.breeds);
        })();

        const poultryQuestionMap: Record<string, any> = {
          poultry_breed: { id: "poultry_breed", questionKey: "question_poultry_breed", type: "dropdown", options: allBreeds, sectionKey: "section_poultry" },
          poultry_system: { id: "poultry_system", questionKey: "question_poultry_system", type: "dropdown", options: ["deep_litter", "battery_cage", "free_range", "pastured"], sectionKey: "section_poultry" },
          poultry_flock_size: { id: "poultry_flock_size", questionKey: "question_poultry_flock_size", type: "number", placeholder: "e.g., 500", step: "any", sectionKey: "section_poultry" },
          poultry_age_weeks: { id: "poultry_age_weeks", questionKey: "question_poultry_age_weeks", type: "number", placeholder: "e.g., 6", step: "any", sectionKey: "section_poultry" },
          poultry_farming_goal: { id: "poultry_farming_goal", questionKey: "question_poultry_farming_goal", type: "dropdown", options: ["Egg production", "Meat production", "Both"], sectionKey: "section_poultry" },
          poultry_location_region: { id: "poultry_location_region", questionKey: "question_poultry_location_region", type: "dropdown", options: ["Hot", "Cold", "Moderate"], sectionKey: "section_location" },
          poultry_rainfall_pattern: { id: "poultry_rainfall_pattern", questionKey: "question_poultry_rainfall_pattern", type: "dropdown", options: ["Dry", "Semi-arid", "Wet"], sectionKey: "section_location" },
          poultry_altitude: { id: "poultry_altitude", questionKey: "question_poultry_altitude", type: "dropdown", options: ["Highland", "Lowland", "Coastal"], sectionKey: "section_location" },
          poultry_feed_type: { id: "poultry_feed_type", questionKey: "question_poultry_feed_type", type: "dropdown", options: ["Mash", "Pellets", "Crumbles", "Whole grain"], sectionKey: "section_feed" },
          poultry_feed_cost_kg: { id: "poultry_feed_cost_kg", questionKey: "question_poultry_feed_cost_kg", type: "number", placeholder: "e.g., 65", step: "any", sectionKey: "section_feed" },
          poultry_vaccination_done: { id: "poultry_vaccination_done", questionKey: "question_poultry_vaccination_done", type: "dropdown", options: ["Yes", "No"], sectionKey: "section_health" },
          poultry_mortality_count: { id: "poultry_mortality_count", questionKey: "question_poultry_mortality_count", type: "number", placeholder: "e.g., 5", step: "any", sectionKey: "section_health" },
          poultry_chick_cost: { id: "poultry_chick_cost", questionKey: "question_poultry_chick_cost", type: "number", placeholder: "e.g., 120", step: "any", sectionKey: "section_finance" },
          poultry_egg_price: { id: "poultry_egg_price", questionKey: "question_poultry_egg_price", type: "number", placeholder: "e.g., 280", step: "any", sectionKey: "section_finance" },
          poultry_meat_price: { id: "poultry_meat_price", questionKey: "question_poultry_meat_price", type: "number", placeholder: "e.g., 350", step: "any", sectionKey: "section_finance" },
          poultry_house_size_m2: { id: "poultry_house_size_m2", questionKey: "question_poultry_house_size_m2", type: "number", placeholder: "e.g., 40", step: "any", sectionKey: "section_housing" },
        };

        for (const field of poultryFields) {
          if (shouldInclude(field) && poultryQuestionMap[field]) {
            questions.push(poultryQuestionMap[field]);
          }
        }

        // Poultry disease questions
        const species = farmerDetails.poultry_species || 'chicken';
        const diseaseNames = (poultryDiseaseMap[species] || poultryDiseaseMap['chicken']).map((d: any) => d.name);

        if (shouldInclude("poultry_disease")) {
          questions.push({
            id: "poultry_disease",
            questionKey: "question_poultry_disease_select",
            type: "dropdown",
            options: diseaseNames,
            sectionKey: "section_poultry"
          });
        }

        if (shouldInclude("symptomsObserved")) {
          questions.push({
            id: "symptomsObserved",
            questionKey: "question_poultry_disease_symptoms",
            type: "multiselect",
            options: [
              "poultry_symptom_respiratory",
              "poultry_symptom_green_diarrhoea",
              "poultry_symptom_white_diarrhoea",
              "poultry_symptom_chocolate_diarrhoea",
              "poultry_symptom_paralysis",
              "poultry_symptom_scabs",
              "poultry_symptom_lameness",
              "poultry_symptom_sudden_death",
              "poultry_symptom_swollen_face",
              "poultry_symptom_egg_drop",
              "poultry_symptom_tremors",
              "poultry_symptom_depression",
            ],
            sectionKey: "section_poultry"
          });
        }

        if (shouldInclude("mortalityCountDisease")) {
          questions.push({
            id: "mortalityCountDisease",
            questionKey: "question_poultry_mortality_count_disease",
            type: "number",
            placeholder: "e.g., 5",
            sectionKey: "section_poultry"
          });
        }

        if (shouldInclude("diseaseDuration")) {
          questions.push({
            id: "diseaseDuration",
            questionKey: "question_poultry_disease_duration",
            type: "dropdown",
            options: [
              "poultry_duration_less_than_3_days",
              "poultry_duration_3_to_7_days",
              "poultry_duration_more_than_1_week",
            ],
            sectionKey: "section_poultry"
          });
        }
      }

      // Include personal location if not already included
      if (shouldInclude("farmerName")) questions.push(personalLocationQuestions[0]);
      if (shouldInclude("county")) questions.push(personalLocationQuestions[1]);
    }

    // ===== DAIRY PATH =====
    if (selectedSpecies === "dairy") {
      // Dairy setup questions
      const dairySetupQuestions = [
        { id: "dairyCowCategory", questionKey: "question_dairy_cow_category", type: "dropdown", options: ["lactating", "dry", "heifer", "calf"], sectionKey: "section_dairy" },
        { id: "dairyBodyWeightKg", questionKey: "question_dairy_body_weight_kg", type: "number", placeholder: "e.g., 500", step: "any", sectionKey: "section_dairy" },
        { id: "dairyBreed", questionKey: "question_dairy_breed", type: "dropdown", options: ["fh", "ayrshire", "jersey", "guernsey", "sahiwal", "zebu", "cross"], sectionKey: "section_dairy" },
        { id: "dairyMilkYieldPerDay", questionKey: "question_dairy_milk_yield_per_day", type: "number", placeholder: "e.g., 10", step: "any", sectionKey: "section_dairy" },
        { id: "dairyMilkPricePerLitre", questionKey: "question_dairy_milk_price_per_litre", type: "number", placeholder: "e.g., 40", step: "any", sectionKey: "section_dairy" },
        { id: "dairyFeedCostPerDay", questionKey: "question_dairy_feed_cost_per_day", type: "number", placeholder: "e.g., 100", step: "any", sectionKey: "section_dairy" },
        { id: "dairyVetCostPerMonth", questionKey: "question_dairy_vet_cost_per_month", type: "number", placeholder: "e.g., 500", step: "any", sectionKey: "section_dairy" },
      ];
      for (const q of dairySetupQuestions) if (shouldInclude(q.id)) questions.push(q);

      // Dairy disease selection (dropdown)
      if (shouldInclude("dairyDiseaseSelect")) {
        const allDiseases = dairyPestDiseaseMap.dairy || [];
        const diseaseNames = allDiseases.map((d: any) => d.name).sort();
        questions.push({
          id: "dairyDiseaseSelect",
          questionKey: "question_dairy_disease_select",
          type: "dropdown",
          options: diseaseNames,
          sectionKey: "section_dairy",
        });
      }

      // Dairy health questions (symptoms, mortality, duration)
      const dairyHealthQuestions = [
        { id: "dairySymptoms", questionKey: "question_dairy_symptoms", type: "multiselect", options: ["swollen_udder", "milk_changes", "recumbent", "fever", "coughing", "diarrhoea", "lameness", "bloat", "ketosis", "abortion"], sectionKey: "section_dairy" },
        { id: "dairyMortalityCount", questionKey: "question_dairy_mortality_count", type: "number", placeholder: "e.g., 1", step: "any", sectionKey: "section_dairy" },
        { id: "dairyHealthDuration", questionKey: "question_dairy_health_duration", type: "dropdown", options: ["less_than_3_days", "3_to_7_days", "more_than_1_week"], sectionKey: "section_dairy" },
      ];
      for (const q of dairyHealthQuestions) if (shouldInclude(q.id)) questions.push(q);

      // ----- DairyBreedingAgent -----
      if (shouldInclude("dairyDaysSinceCalving")) {
        questions.push({ id: "dairyDaysSinceCalving", questionKey: "question_dairy_days_since_calving", type: "number", placeholder: "e.g., 60", step: "any", sectionKey: "section_dairy_breeding" });
      }
      if (shouldInclude("dairyHeatObserved")) {
        questions.push({ id: "dairyHeatObserved", questionKey: "question_dairy_heat_observed", type: "dropdown", options: ["yes", "no"], sectionKey: "section_dairy_breeding" });
      }
      if (shouldInclude("dairyLastInseminationDate")) {
        questions.push({ id: "dairyLastInseminationDate", questionKey: "question_dairy_last_insemination_date", type: "date", sectionKey: "section_dairy_breeding" });
      }
      if (shouldInclude("dairyBreedingMethod")) {
        questions.push({ id: "dairyBreedingMethod", questionKey: "question_dairy_breeding_method", type: "dropdown", options: ["ai", "bull", "both"], sectionKey: "section_dairy_breeding" });
      }
      if (shouldInclude("dairyReproductiveProblems")) {
        questions.push({ id: "dairyReproductiveProblems", questionKey: "question_dairy_reproductive_problems", type: "multiselect", options: ["repeat_breeding", "abortion", "retained_placenta", "none"], sectionKey: "section_dairy_breeding" });
      }

      // ----- DairyBusinessAgent -----
      if (shouldInclude("dairyBusinessInterest")) {
        questions.push({ id: "dairyBusinessInterest", questionKey: "question_dairy_business_interest", type: "multiselect", options: ["bulk_buying", "cooperative", "value_addition", "scaling", "cost_reduction"], sectionKey: "section_dairy_business" });
      }

      // ----- DairyCalfAgent -----
      if (shouldInclude("calfAgeWeeks")) {
        questions.push({ id: "calfAgeWeeks", questionKey: "question_dairy_calf_age_weeks", type: "number", placeholder: "e.g., 4", step: "any", sectionKey: "section_dairy_calf" });
      }
      if (shouldInclude("calfFeedingMethod")) {
        questions.push({ id: "calfFeedingMethod", questionKey: "question_dairy_calf_feeding_method", type: "dropdown", options: ["bucket", "bottle", "dam", "other"], sectionKey: "section_dairy_calf" });
      }
      if (shouldInclude("calfMilkLitresPerDay")) {
        questions.push({ id: "calfMilkLitresPerDay", questionKey: "question_dairy_calf_milk_litres_per_day", type: "number", placeholder: "e.g., 6", step: "any", sectionKey: "section_dairy_calf" });
      }
      if (shouldInclude("calfReceivedColostrum")) {
        questions.push({ id: "calfReceivedColostrum", questionKey: "question_dairy_calf_received_colostrum", type: "dropdown", options: ["yes", "no"], sectionKey: "section_dairy_calf" });
      }
      if (shouldInclude("calfHousingType")) {
        questions.push({ id: "calfHousingType", questionKey: "question_dairy_calf_housing_type", type: "dropdown", options: ["individual_pen", "group_pen", "tether", "other"], sectionKey: "section_dairy_calf" });
      }
      if (shouldInclude("calfHealthIssues")) {
        questions.push({ id: "calfHealthIssues", questionKey: "question_dairy_calf_health_issues", type: "multiselect", options: ["diarrhoea", "cough", "dullness", "naval_infection", "none"], sectionKey: "section_dairy_calf" });
      }

      // ----- DairyConcentrateAgent -----
      if (shouldInclude("dairyConcentrateBrand")) {
        questions.push({ id: "dairyConcentrateBrand", questionKey: "question_dairy_concentrate_brand", type: "dropdown", options: ["koudijs", "unga", "afrimach", "jubaili", "farmers_choice", "royal_dutch", "hendrix", "intraco", "cargill"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateProduct")) {
        questions.push({ id: "dairyConcentrateProduct", questionKey: "question_dairy_concentrate_product", type: "dropdown", options: ["16pc", "18pc", "layer", "dairy_meal"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateInclusion")) {
        questions.push({ id: "dairyConcentrateInclusion", questionKey: "question_dairy_concentrate_inclusion", type: "number", placeholder: "e.g., 3", step: "any", sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateMaizeKg")) {
        questions.push({ id: "dairyConcentrateMaizeKg", questionKey: "question_dairy_concentrate_maize_kg", type: "number", placeholder: "e.g., 2", step: "any", sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateSaltKg")) {
        questions.push({ id: "dairyConcentrateSaltKg", questionKey: "question_dairy_concentrate_salt_kg", type: "number", placeholder: "e.g., 0.05", step: "any", sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateCalciumSource")) {
        questions.push({ id: "dairyConcentrateCalciumSource", questionKey: "question_dairy_concentrate_calcium_source", type: "dropdown", options: ["limestone", "dcp", "oyster_shell", "none"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateCalciumKg")) {
        questions.push({ id: "dairyConcentrateCalciumKg", questionKey: "question_dairy_concentrate_calcium_kg", type: "number", placeholder: "e.g., 0.1", step: "any", sectionKey: "section_dairy_feed" });
      }

      // ----- DairyDeficiencyAgent -----
      if (shouldInclude("dairyDeficiencySymptoms")) {
        questions.push({ id: "dairyDeficiencySymptoms", questionKey: "question_dairy_deficiency_symptoms", type: "multiselect", options: ["stiff_gait", "poor_appetite", "rough_coat", "muscle_tremors", "scours", "nervous_signs", "reduced_milk_fat", "anaemia", "leg_weakness", "reproductive_problems"], sectionKey: "section_dairy_nutrition" });
      }

      // ----- DairyDosDontsAgent -----
      if (shouldInclude("dairyManagementFocus")) {
        questions.push({ id: "dairyManagementFocus", questionKey: "question_dairy_management_focus", type: "multiselect", options: ["calf_rearing", "feeding", "housing", "milking", "health", "breeding"], sectionKey: "section_dairy_management" });
      }

      // ----- DairyFeedAgent -----
      if (shouldInclude("dairyAvailableForages")) {
        questions.push({ id: "dairyAvailableForages", questionKey: "question_dairy_available_forages", type: "multiselect", options: ["napier_grass", "rhodes_hay", "lucerne_hay", "maize_silage", "oat_hay", "desmodium", "banana_leaves", "maize_stover"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyAvailableGrains")) {
        questions.push({ id: "dairyAvailableGrains", questionKey: "question_dairy_available_grains", type: "multiselect", options: ["maize", "sorghum", "millet", "wheat_bran", "pollard", "rice_bran", "molasses"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyAvailableProtein")) {
        questions.push({ id: "dairyAvailableProtein", questionKey: "question_dairy_available_protein", type: "multiselect", options: ["soybean_meal", "sunflower_cake", "cottonseed_cake", "groundnut_cake", "canola_meal", "fishmeal"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyAvailableMinerals")) {
        questions.push({ id: "dairyAvailableMinerals", questionKey: "question_dairy_available_minerals", type: "multiselect", options: ["salt", "limestone", "dcp", "magnesium_oxide", "dairy_premix", "sodium_bicarbonate"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyQuantityToMix")) {
        questions.push({ id: "dairyQuantityToMix", questionKey: "question_dairy_quantity_to_mix", type: "number", placeholder: "e.g., 40", step: "any", sectionKey: "section_dairy_feed" });
      }

      // ----- DairyFeedPerDayAgent -----
      if (shouldInclude("dairyForageType")) {
        questions.push({ id: "dairyForageType", questionKey: "question_dairy_forage_type", type: "dropdown", options: ["napier_grass", "rhodes_hay", "lucerne_hay", "maize_silage", "oat_hay", "desmodium"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyForageKgPerDay")) {
        questions.push({ id: "dairyForageKgPerDay", questionKey: "question_dairy_forage_kg_per_day", type: "number", placeholder: "e.g., 30", step: "any", sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateType")) {
        questions.push({ id: "dairyConcentrateType", questionKey: "question_dairy_concentrate_type", type: "dropdown", options: ["commercial_dairy", "home_mix", "none"], sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyConcentrateKgPerDay")) {
        questions.push({ id: "dairyConcentrateKgPerDay", questionKey: "question_dairy_concentrate_kg_per_day", type: "number", placeholder: "e.g., 4", step: "any", sectionKey: "section_dairy_feed" });
      }
      if (shouldInclude("dairyMilkYield")) {
        questions.push({ id: "dairyMilkYield", questionKey: "question_dairy_milk_yield", type: "number", placeholder: "e.g., 15", step: "any", sectionKey: "section_dairy_production" });
      }

      // ----- DairyFinancialAgent -----
      if (shouldInclude("dairyFeedCostPerDay")) {
        // Already covered in setup, skip
      }
      if (shouldInclude("dairyMilkPrice")) {
        // Already covered in setup, skip
      }
      if (shouldInclude("dairyVetCostMonth")) {
        questions.push({ id: "dairyVetCostMonth", questionKey: "question_dairy_vet_cost_month", type: "number", placeholder: "e.g., 2000", step: "any", sectionKey: "section_dairy_finance" });
      }
      if (shouldInclude("dairyOtherCosts")) {
        questions.push({ id: "dairyOtherCosts", questionKey: "question_dairy_other_costs", type: "number", placeholder: "e.g., 3000", step: "any", sectionKey: "section_dairy_finance" });
      }

      // ----- DairyHousingAgent -----
      if (shouldInclude("dairyHousingType")) {
        questions.push({ id: "dairyHousingType", questionKey: "question_dairy_housing_type", type: "dropdown", options: ["zero_grazing", "free_stall", "tie_stall", "pasture_shelter"], sectionKey: "section_dairy_housing" });
      }
      if (shouldInclude("numberOfCowsHoused")) {
        questions.push({ id: "numberOfCowsHoused", questionKey: "question_dairy_number_of_cows_housed", type: "number", placeholder: "e.g., 10", step: "any", sectionKey: "section_dairy_housing" });
      }
      if (shouldInclude("floorSpacePerCowM2")) {
        questions.push({ id: "floorSpacePerCowM2", questionKey: "question_dairy_floor_space_per_cow_m2", type: "number", placeholder: "e.g., 4", step: "any", sectionKey: "section_dairy_housing" });
      }
      if (shouldInclude("dairyVentilationRating")) {
        questions.push({ id: "dairyVentilationRating", questionKey: "question_dairy_ventilation_rating", type: "dropdown", options: ["good", "average", "poor"], sectionKey: "section_dairy_housing" });
      }
      if (shouldInclude("beddingType")) {
        questions.push({ id: "beddingType", questionKey: "question_dairy_bedding_type", type: "dropdown", options: ["straw", "sand", "sawdust", "none"], sectionKey: "section_dairy_housing" });
      }

      // ----- DairyMilkAgent -----
      if (shouldInclude("milkYieldCurrent")) {
        questions.push({ id: "milkYieldCurrent", questionKey: "question_dairy_milk_yield_current", type: "number", placeholder: "e.g., 15", step: "any", sectionKey: "section_dairy_production" });
      }
      if (shouldInclude("milkFatPercent")) {
        questions.push({ id: "milkFatPercent", questionKey: "question_dairy_milk_fat_percent", type: "number", placeholder: "e.g., 4.0", step: "any", sectionKey: "section_dairy_production" });
      }
      if (shouldInclude("milkProteinPercent")) {
        questions.push({ id: "milkProteinPercent", questionKey: "question_dairy_milk_protein_percent", type: "number", placeholder: "e.g., 3.2", step: "any", sectionKey: "section_dairy_production" });
      }
      if (shouldInclude("daysInMilk")) {
        questions.push({ id: "daysInMilk", questionKey: "question_dairy_days_in_milk", type: "number", placeholder: "e.g., 120", step: "any", sectionKey: "section_dairy_production" });
      }
      if (shouldInclude("parity")) {
        questions.push({ id: "parity", questionKey: "question_dairy_parity", type: "dropdown", options: ["1", "2", "3", "4+"], sectionKey: "section_dairy_production" });
      }

      // ----- DairyParasiteAgent -----
      if (shouldInclude("dairyParasiteSigns")) {
        questions.push({ id: "dairyParasiteSigns", questionKey: "question_dairy_parasite_signs", type: "multiselect", options: ["visible_ticks", "visible_lice", "skin_irritation", "anaemia", "diarrhoea_parasite", "weight_loss", "bottle_jaw", "cough_parasite", "flies_swarming", "mange_lesions"], sectionKey: "section_dairy_health" });
      }

      // ----- DairyReminderAgent -----
      if (shouldInclude("dairyLastDeworming")) {
        questions.push({ id: "dairyLastDeworming", questionKey: "question_dairy_last_deworming", type: "date", sectionKey: "section_dairy_reminders" });
      }
      if (shouldInclude("dairyLastHoofTrimming")) {
        questions.push({ id: "dairyLastHoofTrimming", questionKey: "question_dairy_last_hoof_trimming", type: "date", sectionKey: "section_dairy_reminders" });
      }
      if (shouldInclude("dairyLastVaccination")) {
        questions.push({ id: "dairyLastVaccination", questionKey: "question_dairy_last_vaccination", type: "date", sectionKey: "section_dairy_reminders" });
      }
      if (shouldInclude("dairyNextVaccinationDue")) {
        questions.push({ id: "dairyNextVaccinationDue", questionKey: "question_dairy_next_vaccination_due", type: "date", sectionKey: "section_dairy_reminders" });
      }
      if (shouldInclude("dairyReminderTopics")) {
        questions.push({ id: "dairyReminderTopics", questionKey: "question_dairy_reminder_topics", type: "multiselect", options: ["deworming", "hoof_trimming", "vaccination", "ai_scheduling", "biosecurity"], sectionKey: "section_dairy_reminders" });
      }

      // Include personal location if not already included
      if (shouldInclude("farmerName")) questions.push(personalLocationQuestions[0]);
      if (shouldInclude("county")) questions.push(personalLocationQuestions[1]);
    }

    // ============================================================
    // ADD QUESTIONS FROM AGENTS (Business Plan, etc.)
    // ============================================================
    // Build context for agent questions – FIX: include species and flags
    const context: FarmerContext = {
      crops: farmerDetails.crops ? [farmerDetails.crops] : [],
      country: farmerDetails.country,
      county: farmerDetails.county,
      species: selectedSpecies,
      isDairy: selectedSpecies === "dairy",
      isPoultry: selectedSpecies === "poultry",
    };

    // Use the agent registry to get questions from all agents
    // We pass the current agents list and the context.
    const agentQuestions = getQuestionsForAgents(agents, context);

    // Deduplicate by id (keep first occurrence – hardcoded questions take precedence)
    const seen = new Set<string>();
    for (const q of questions) {
      seen.add(q.id);
    }
    for (const q of agentQuestions) {
      if (!seen.has(q.id)) {
        questions.push(q);
        seen.add(q.id);
      }
    }

    console.log("📋 Total questions generated:", questions.length);
    console.log("📋 First few questions:", questions.slice(0, 3));
    return questions;
  }, [farmerDetails, getAllowedQuestionIds, selectedSpecies, filter, agents, safeT]);

  const allQuestions = useMemo(() => getAllQuestions(), [getAllQuestions]);
  const visibleQuestions = useMemo(() => filterQuestions(allQuestions), [allQuestions, filterQuestions]);
  const totalQuestions = visibleQuestions.length;

  useEffect(() => {
    setDebugInfo(prev => ({ ...prev, totalQuestions: visibleQuestions.length }));
  }, [visibleQuestions.length]);

  // ========== REF FOR DAIRY MANAGEMENT FOCUS ==========
  const lastDairyManagementFocusRef = useRef("");
  const lastDairyParasiteSignsRef = useRef("");
  const lastDairyDeficiencySymptomsRef = useRef("");
  const lastDairyBusinessInterestRef = useRef("");

  // ========== SPEECH RECOGNITION ==========
  useEffect(() => {
    let isMounted = true;
    const checkVoiceSupport = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && isMounted) {
        const voices = window.speechSynthesis.getVoices();
        setDebugInfo(prev => {
          const newMode = voices.length > 0 ? "REAL" : "SIMULATED";
          if (prev.voiceMode === newMode) return prev;
          return { ...prev, voiceMode: newMode };
        });
      }
    };
    checkVoiceSupport();
    const timeoutId = setTimeout(checkVoiceSupport, 500);
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && !recognitionRef.current) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = recognitionLanguage;
      recognitionRef.current.timeout = 15000;
      recognitionRef.current.onresult = (event: any) => {
        retryCountRef.current = 0;
        if (isRecognitionActiveRef.current) { isRecognitionActiveRef.current = false; setDebugInfo(prev => ({ ...prev, isListening: false })); }
        const transcript = event.results[0][0].transcript;
        setUserTranscript(transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        if (isRecognitionActiveRef.current) { isRecognitionActiveRef.current = false; setDebugInfo(prev => ({ ...prev, isListening: false })); }
        if (event.error === 'no-speech') {
          retryCountRef.current++;
          if (retryCountRef.current <= maxRetries) {
            toast.info(safeT('no_speech_detected', { current: retryCountRef.current, max: maxRetries }));
            setTimeout(() => safeStartListening(), 2000);
          }
        }
      };
      recognitionRef.current.onend = () => {
        if (isRecognitionActiveRef.current) { isRecognitionActiveRef.current = false; setDebugInfo(prev => ({ ...prev, isListening: false })); }
      };
      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        setDebugInfo(prev => ({ ...prev, isListening: true }));
        retryCountRef.current = 0;
      };
    }
    return () => { isMounted = false; clearTimeout(timeoutId); if (recognitionRef.current && isRecognitionActiveRef.current) { try { recognitionRef.current.stop(); } catch {} } };
  }, [recognitionLanguage, safeT]);

  useEffect(() => {
    if (recognitionRef.current && recognitionLanguage) {
      recognitionRef.current.lang = recognitionLanguage;
      console.log(`🔄 Recognition language updated to: ${recognitionLanguage}`);
    }
  }, [recognitionLanguage]);

  // ========== VOICE ASSISTANT REF SETUP ==========
  useEffect(() => {
    let isMounted = true;
    if (!voiceEnabled) { voiceAssistantRef.current = null; return; }
    voiceAssistantRef.current = { speak: async (text: string) => streamQuestionWithVoice(text) };
    if (isMounted && voiceEnabled) toast.success(safeT('voice_ready'));
    return () => { isMounted = false; };
  }, [voiceEnabled, safeT, recognitionLanguage]);

  // ========== GET BEST VOICE ==========
  const getBestVoiceForLanguage = async (language: string): Promise<SpeechSynthesisVoice | null> => {
    console.log(`getBestVoiceForLanguage: looking for ${language}`);
    const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
      return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length) { console.log(`Initial voices loaded: ${voices.length}`); resolve(voices); return; }
        const onChanged = () => {
          const newVoices = window.speechSynthesis.getVoices();
          if (newVoices.length) { window.speechSynthesis.onvoiceschanged = null; console.log(`Voices loaded via onvoiceschanged: ${newVoices.length}`); resolve(newVoices); }
        };
        window.speechSynthesis.onvoiceschanged = onChanged;
        setTimeout(() => { window.speechSynthesis.onvoiceschanged = null; console.log('Voices load timeout, using current list'); resolve(window.speechSynthesis.getVoices()); }, 3000);
      });
    };

    const findBritishEnglishFemale = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      const femaleNames = ['libby', 'hazel', 'susan', 'maisie', 'sonia', 'kate', 'victoria', 'millie', 'olivia', 'google uk english female', 'microsoft hazel', 'microsoft susan', 'microsoft libby', 'microsoft maisie', 'microsoft sonia', 'british english female', 'uk english female'];
      for (const name of femaleNames) { const voice = voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes(name)); if (voice) { console.log(`✅ Found British female voice: ${voice.name} (${voice.lang})`); return voice; } }
      const maleIndicators = ['george', 'ryan', 'thomas', 'david', 'mark', 'james', 'john', 'paul', 'michael'];
      const anyBritishFemale = voices.find(v => v.lang === 'en-GB' && !maleIndicators.some(m => v.name.toLowerCase().includes(m)));
      if (anyBritishFemale) { console.log(`⚠️ Using non-male British voice: ${anyBritishFemale.name}`); return anyBritishFemale; }
      const anyBritish = voices.find(v => v.lang === 'en-GB');
      if (anyBritish) console.log(`⚠️ Falling back to any British voice: ${anyBritish.name}`);
      return anyBritish || null;
    };

    const findAmericanEnglishFemale = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      const femaleNames = ['zira', 'samantha', 'victoria', 'jenny', 'aria', 'google us english female', 'microsoft jenny', 'microsoft zira', 'microsoft aria', 'us english female'];
      for (const name of femaleNames) { const voice = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes(name)); if (voice) { console.log(`✅ Found American female voice: ${voice.name} (${voice.lang})`); return voice; } }
      const maleIndicators = ['david', 'mark', 'james', 'john', 'paul', 'michael', 'alex', 'thomas'];
      const anyFemale = voices.find(v => v.lang === 'en-US' && !maleIndicators.some(m => v.name.toLowerCase().includes(m)));
      if (anyFemale) { console.log(`⚠️ Using non-male American voice: ${anyFemale.name}`); return anyFemale; }
      const anyUS = voices.find(v => v.lang === 'en-US');
      if (anyUS) console.log(`⚠️ Falling back to any American voice: ${anyUS.name}`);
      return anyUS || null;
    };

    const findFrenchVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      let vivienne = voices.find(v => v.lang.startsWith('fr') && v.name.toLowerCase().includes('vivienne'));
      if (vivienne) return vivienne;
      const frenchFemale = voices.find(v => v.lang.startsWith('fr') && (v.name.toLowerCase().includes('denise') || v.name.toLowerCase().includes('google français female') || v.name.toLowerCase().includes('marie') || v.name.toLowerCase().includes('chloe')));
      if (frenchFemale) return frenchFemale;
      const anyFrench = voices.find(v => v.lang.startsWith('fr'));
      return anyFrench || null;
    };

    const findSpanishVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      const femaleNames = ['helena', 'elena', 'ximena', 'maria', 'paloma', 'sofia', 'catalina', 'salome', 'belkys', 'ramona', 'andrea', 'lorena', 'teresa', 'marta', 'karla', 'dalia', 'yolanda', 'margarita', 'tania', 'camila', 'karina', 'elvira', 'valentina', 'paola', 'michelle', 'gabriela', 'lucia', 'laura', 'fernanda', 'victoria', 'monica', 'paulina', 'sabina', 'florencia', 'josefina', 'marcela', 'beatriz'];
      for (const name of femaleNames) { const voice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes(name)); if (voice) { console.log(`✅ Found female Spanish voice: ${voice.name} (${voice.lang})`); return voice; } }
      const nonMale = voices.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('alvaro') && !v.name.toLowerCase().includes('jorge') && !v.name.toLowerCase().includes('manuel') && !v.name.toLowerCase().includes('andres') && !v.name.toLowerCase().includes('carlos') && !v.name.toLowerCase().includes('juan') && !v.name.toLowerCase().includes('luis') && !v.name.toLowerCase().includes('rodrigo') && !v.name.toLowerCase().includes('javier') && !v.name.toLowerCase().includes('federico') && !v.name.toLowerCase().includes('victor') && !v.name.toLowerCase().includes('mateo') && !v.name.toLowerCase().includes('sebastian') && !v.name.toLowerCase().includes('gonzalo') && !v.name.toLowerCase().includes('lorenzo') && !v.name.toLowerCase().includes('marcelo') && !v.name.toLowerCase().includes('tomas') && !v.name.toLowerCase().includes('emilio') && !v.name.toLowerCase().includes('alonso'));
      if (nonMale) { console.log(`⚠️ No exact female Spanish voice, using fallback: ${nonMale.name}`); return nonMale; }
      console.warn('❌ No female Spanish voice found – skipping Spanish');
      return null;
    };

    const findSwahiliVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      let rafiki = voices.find(v => v.lang === 'sw-KE' && v.name.toLowerCase().includes('rafiki'));
      if (rafiki) return rafiki;
      const anySwahili = voices.find(v => v.lang === 'sw-KE');
      return anySwahili || null;
    };

    let voices = await waitForVoices();
    if (!voices.length) return null;

    if (language === 'en-GB' || language === 'en-UK' || language.toLowerCase().includes('british')) {
      let britishVoice = findBritishEnglishFemale(voices);
      let attempts = 0;
      while (!britishVoice && attempts < 5) { await new Promise(resolve => setTimeout(resolve, 1000)); voices = window.speechSynthesis.getVoices(); britishVoice = findBritishEnglishFemale(voices); attempts++; }
      if (britishVoice) return britishVoice;
    }

    if (language === 'en-US') {
      let usVoice = findAmericanEnglishFemale(voices);
      let attempts = 0;
      while (!usVoice && attempts < 5) { await new Promise(resolve => setTimeout(resolve, 1000)); voices = window.speechSynthesis.getVoices(); usVoice = findAmericanEnglishFemale(voices); attempts++; }
      if (usVoice) return usVoice;
    }

    if (language === 'fr-FR' || language === 'fr-CA' || language.startsWith('fr')) {
      let frenchVoice = findFrenchVoice(voices);
      let attempts = 0;
      while (!frenchVoice && attempts < 5) { await new Promise(resolve => setTimeout(resolve, 1000)); voices = window.speechSynthesis.getVoices(); frenchVoice = findFrenchVoice(voices); attempts++; }
      if (frenchVoice) return frenchVoice;
    }

    if (language === 'es-ES' || language.startsWith('es')) {
      let spanishVoice = findSpanishVoice(voices);
      let attempts = 0;
      while (!spanishVoice && attempts < 5) { await new Promise(resolve => setTimeout(resolve, 1000)); voices = window.speechSynthesis.getVoices(); spanishVoice = findSpanishVoice(voices); attempts++; }
      if (spanishVoice) return spanishVoice;
      console.warn('No female Spanish voice available – falling back to next language');
    }

    if (language === 'sw-KE' || language === 'sw-TZ' || language.startsWith('sw')) {
      let swahiliVoice = findSwahiliVoice(voices);
      let attempts = 0;
      while (!swahiliVoice && attempts < 5) { await new Promise(resolve => setTimeout(resolve, 1000)); voices = window.speechSynthesis.getVoices(); swahiliVoice = findSwahiliVoice(voices); attempts++; }
      if (swahiliVoice) return swahiliVoice;
    }

    const anyEnglish = voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'));
    if (anyEnglish) return anyEnglish;
    return voices[0] || null;
  };

  // ========== STREAM QUESTION WITH VOICE ==========
  const streamQuestionWithVoice = async (fullText: string) => {
    if (!voiceEnabled || !window.speechSynthesis) { setStreamingQuestion(fullText); return; }
    setIsStreaming(true);
    setStreamingQuestion("");
    setCurrentWordIndex(0);
    setUserTranscript("");

    const spokenCurrencyName = getSpokenCurrencyName();
    const currencySymbol = currency.symbol;
    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let speechText = fullText.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${spokenCurrencyName} `);
    speechText = speechText.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), spokenCurrencyName);

    if (recognitionRef.current && isRecognitionActiveRef.current) { try { recognitionRef.current.stop(); } catch {} isRecognitionActiveRef.current = false; setDebugInfo(prev => ({ ...prev, isListening: false })); }

    const words = speechText.split(' ');
    questionWordsRef.current = words;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.lang = recognitionLanguage;

    const bestVoice = await getBestVoiceForLanguage(recognitionLanguage);
    if (bestVoice) { utterance.voice = bestVoice; console.log(`🔊 Speaking with voice: ${bestVoice.name} (${bestVoice.lang})`); }
    setIsSpeaking(true);

    let wordIndex = 0;
    let currentText = '';
    let safetyTimeout: NodeJS.Timeout | null = setTimeout(() => { if (isSpeaking) { console.warn("⚠️ Speech took too long – forcing continue"); if (utterance.onend) utterance.onend({} as any); } }, 20000);
    let finished = false;

    utterance.onboundary = (event) => {
      if (event.name === 'word' && wordIndex < words.length) {
        currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
        let displayText = currentText;
        const displaySymbol = getDisplaySymbol();
        if (displaySymbol !== currencySymbol) displayText = displayText.replace(new RegExp(spokenCurrencyName, 'g'), displaySymbol);
        setStreamingQuestion(displayText);
        setCurrentWordIndex(wordIndex + 1);
        wordIndex++;
      }
    };

    utterance.onend = () => {
      if (finished) return;
      finished = true;
      if (safetyTimeout) clearTimeout(safetyTimeout);
      let finalDisplay = fullText;
      const displaySymbol = getDisplaySymbol();
      if (displaySymbol !== currencySymbol) finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), displaySymbol);
      setStreamingQuestion(finalDisplay);
      setIsStreaming(false);
      setIsSpeaking(false);
      setTimeout(() => safeStartListening(), 1500);
    };

    utterance.onerror = (event) => {
      if (finished) return;
      finished = true;
      if (safetyTimeout) clearTimeout(safetyTimeout);
      console.error("Speech error:", event);
      const fallbackUtterance = new SpeechSynthesisUtterance(speechText);
      fallbackUtterance.rate = 1.0;
      fallbackUtterance.pitch = 1.1;
      fallbackUtterance.lang = recognitionLanguage;
      fallbackUtterance.onend = () => { let finalDisplay = fullText; const ds = getDisplaySymbol(); if (ds !== currencySymbol) finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), ds); setStreamingQuestion(finalDisplay); setIsStreaming(false); setIsSpeaking(false); setTimeout(() => safeStartListening(), 1500); };
      fallbackUtterance.onerror = () => { let finalDisplay = fullText; const ds = getDisplaySymbol(); if (ds !== currencySymbol) finalDisplay = finalDisplay.replace(new RegExp(escapedSymbol, 'g'), ds); setStreamingQuestion(finalDisplay); setIsStreaming(false); setIsSpeaking(false); setTimeout(() => safeStartListening(), 500); };
      window.speechSynthesis.speak(fallbackUtterance);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakAcknowledgment = async (answer: string, fieldId: string) => {
    const spokenCurrencyName = getSpokenCurrencyName();
    const currencySymbol = currency.symbol;
    const escapedSymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let spokenAnswer = answer.replace(new RegExp(`${escapedSymbol}\\s`, 'g'), `${spokenCurrencyName} `);
    spokenAnswer = spokenAnswer.replace(new RegExp(`\\b${escapedSymbol}\\b`, 'g'), spokenCurrencyName);

    let acknowledgment = "";
    if (fieldId === "plantingFertilizerToUse") acknowledgment = safeT('ack_planting_fertilizer', { answer: spokenAnswer });
    else if (fieldId === "topdressingFertilizerToUse") acknowledgment = safeT('ack_topdressing_fertilizer', { answer: spokenAnswer });
    else if (fieldId === "potassiumFertilizerToUse") acknowledgment = safeT('ack_potassium_fertilizer', { answer: spokenAnswer });
    else if (fieldId === "plantingFertilizerCost" || fieldId === "topdressingFertilizerCost" || fieldId === "potassiumFertilizerCost") acknowledgment = safeT('ack_cost', { answer: spokenAnswer });
    else if (fieldId === "recPlantingFertilizer") acknowledgment = safeT('ack_rec_planting', { answer: spokenAnswer });
    else if (fieldId === "recTopdressingFertilizer") acknowledgment = safeT('ack_rec_topdressing', { answer: spokenAnswer });
    else if (fieldId === "recPotassiumFertilizer") acknowledgment = safeT('ack_rec_potassium', { answer: spokenAnswer });
    else if (fieldId === "recCalciticLime") acknowledgment = safeT('ack_rec_lime', { answer: spokenAnswer });
    else if (fieldId === "recDolomiticLime") acknowledgment = safeT('ack_rec_dolomitic_lime', { answer: spokenAnswer });
    else if (fieldId === "dolomiticLimePricePerBag") acknowledgment = safeT('ack_dolomitic_lime_price', { answer: spokenAnswer });
    else if (fieldId === "targetYield") acknowledgment = safeT('ack_target_yield_kg', { answer: spokenAnswer });
    else if (fieldId === "actualYieldKg") acknowledgment = safeT('ack_actual_yield_kg', { answer: spokenAnswer });
    else if (fieldId === "pricePerKg") acknowledgment = safeT('ack_price_per_kg', { answer: spokenAnswer });
    else if (fieldId === "country") { acknowledgment = safeT('ack_country', { answer: spokenAnswer }); setCountry(answer); }
    else if (fieldId === "crops") acknowledgment = safeT('ack_crops', { answer: spokenAnswer });
    else if (fieldId === "plantingDate") { const date = new Date(answer).toLocaleDateString(); acknowledgment = safeT('ack_planting_date', { date }); }
    else if (fieldId === "deficiencySymptoms") acknowledgment = safeT('ack_deficiency_symptoms', { answer: spokenAnswer });
    else if (fieldId === "deficiencyLocation") acknowledgment = safeT('ack_deficiency_location', { answer: spokenAnswer });
    else if (fieldId === "plantsDamaged") acknowledgment = safeT('ack_plants_damaged', { answer: spokenAnswer });
    else if (fieldId === "wantsNutritionBenefits") acknowledgment = safeT('ack_wants_nutrition_benefits', { answer: spokenAnswer });
    else if (fieldId === "poultry_breed") acknowledgment = safeT('ack_poultry_breed', { answer: spokenAnswer });
    else if (fieldId === "poultry_flock_size") acknowledgment = safeT('ack_poultry_flock_size', { answer: spokenAnswer });
    else if (fieldId === "poultry_chick_cost") acknowledgment = safeT('ack_poultry_chick_cost', { answer: spokenAnswer });
    // Feed formulation acknowledgments
    else if (fieldId === "poultryStage") acknowledgment = safeT('ack_poultry_stage', { answer: spokenAnswer });
    else if (fieldId === "batchSize") acknowledgment = safeT('ack_batch_size', { answer: spokenAnswer });
    else if (fieldId === "includeCoccidiostat") acknowledgment = safeT('ack_include_coccidiostat', { answer: spokenAnswer });
    else if (fieldId === "availableIngredients") acknowledgment = safeT('ack_available_ingredients', { answer: spokenAnswer });
    else if (fieldId === "ageWeeks") acknowledgment = safeT('ack_age_weeks', { answer: spokenAnswer });
    else acknowledgment = safeT('ack_generic', { answer: spokenAnswer });

    await voiceAssistantRef.current?.speak(acknowledgment);
    toast.success(safeT('recorded', { answer }));
  };

  const handleVoiceToggle = (enabled: boolean) => {
    setVoiceEnabled(enabled);
    toast.success(enabled ? safeT('voice_mode_on') : safeT('voice_mode_off'));
  };

  const handleNutrientSubmit = (type: string, nutrients: any) => {
    const nutrientString = Object.entries(nutrients).filter(([_, value]) => value && value !== "" && value !== "0" && value !== "0%").map(([key, value]) => { const percent = value.toString().replace('%', ''); return `${percent}${key.toUpperCase()}`; }).join('+');
    setFarmerDetails(prev => ({ ...prev, [type]: nutrientString || "No additional nutrients" }));
    toast.success(safeT('nutrients_recorded'));
  };

  const processAnswer = async (answer: string) => {
    if (currentStep !== "configuring") return;
    const currentConfig = visibleQuestions[configStep];
    console.log('🔍 processAnswer called for:', currentConfig.id, 'answer:', answer);
    let cleanAnswer = answer;
    let finalValue = cleanAnswer;

    // ===== CAPTURE DAIRY MODULE ANSWERS IN REFS =====
    if (currentConfig.id === "dairyManagementFocus") {
      lastDairyManagementFocusRef.current = finalValue;
      console.log('📌 Stored dairyManagementFocus in ref:', lastDairyManagementFocusRef.current);
    }
    if (currentConfig.id === "dairyParasiteSigns") {
      lastDairyParasiteSignsRef.current = finalValue;
      console.log('📌 Stored dairyParasiteSigns in ref:', lastDairyParasiteSignsRef.current);
    }
    if (currentConfig.id === "dairyDeficiencySymptoms") {
      lastDairyDeficiencySymptomsRef.current = finalValue;
      console.log('📌 Stored dairyDeficiencySymptoms in ref:', lastDairyDeficiencySymptomsRef.current);
    }
    if (currentConfig.id === "dairyBusinessInterest") {
      lastDairyBusinessInterestRef.current = finalValue;
      console.log('📌 Stored dairyBusinessInterest in ref:', lastDairyBusinessInterestRef.current);
    }

    // ===== NUTRIENT SUBMITS =====
    if (currentConfig.id === "plantingFertilizerNutrients") {
      handleNutrientSubmit("plantingFertilizerNutrients", plantingNutrients);
      if (configStep < visibleQuestions.length - 1) { setConfigStep(prev => prev + 1); setTimeout(() => askQuestion(configStep + 1), 2500); }
      return;
    }
    if (currentConfig.id === "topdressingFertilizerNutrients") {
      handleNutrientSubmit("topdressingFertilizerNutrients", topdressingNutrients);
      if (configStep < visibleQuestions.length - 1) { setConfigStep(prev => prev + 1); setTimeout(() => askQuestion(configStep + 1), 2500); }
      return;
    }
    if (currentConfig.id === "potassiumFertilizerNutrients") {
      handleNutrientSubmit("potassiumFertilizerNutrients", potassiumNutrients);
      if (configStep < visibleQuestions.length - 1) { setConfigStep(prev => prev + 1); setTimeout(() => askQuestion(configStep + 1), 2500); }
      return;
    }

    // ===== WANTS NUTRITION BENEFITS =====
    if (currentConfig.id === "wantsNutritionBenefits") {
      finalValue = "Yes";
      setFarmerDetails(prev => ({ ...prev, wantsNutritionBenefits: finalValue }));
      setLastSubmittedAnswer("Yes");
      await speakAcknowledgment("Yes", currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) { setConfigStep(prev => prev + 1); setTimeout(() => askQuestion(configStep + 1), 2500); }
      return;
    }

    // ===== YIELD VALIDATION =====
    if (currentConfig.id === "actualYieldKg") {
      const yieldKg = parseFloat(cleanAnswer);
      if (!isNaN(yieldKg) && yieldKg < 100 && yieldKg > 0) {
        const bagsEquivalent = Math.round(yieldKg / 90);
        const convertedKg = bagsEquivalent * 90;
        toast.warning(safeT('yield_seems_low_warning'), { description: safeT('yield_seems_low_detail', { yield: yieldKg, bags: bagsEquivalent, converted: convertedKg }), duration: 10000, action: { label: safeT('use_converted'), onClick: () => { setUserTranscript(convertedKg.toString()); } } });
        const confirmed = window.confirm(safeT('yield_seems_low_confirm', { yield: yieldKg, bags: bagsEquivalent, converted: convertedKg }));
        if (!confirmed) return;
      }
    }

    // ===== AVAILABLE INGREDIENTS =====
    if (currentConfig.id === "availableIngredients") {
      const ingredientsArray = cleanAnswer.split(',').map(s => s.trim()).filter(Boolean);
      setAvailableIngredients(ingredientsArray);
      setFarmerDetails(prev => ({ ...prev, availableIngredients: cleanAnswer }));
      setLastSubmittedAnswer(cleanAnswer);
      await speakAcknowledgment(cleanAnswer, currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) {
        setConfigStep(prev => prev + 1);
        setTimeout(() => askQuestion(configStep + 1), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    // ===== PRODUCTS TABLES =====
    if (currentConfig.id === "products") {
      setFarmerDetails(prev => ({ ...prev, products: finalValue }));
      setLastSubmittedAnswer(cleanAnswer);
      await speakAcknowledgment(cleanAnswer, currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) {
        setConfigStep(prev => prev + 1);
        setTimeout(() => askQuestion(configStep + 1), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    if (currentConfig.id === "poultryProducts") {
      setFarmerDetails(prev => ({ ...prev, poultryProducts: finalValue }));
      setLastSubmittedAnswer(cleanAnswer);
      await speakAcknowledgment(cleanAnswer, currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) {
        setConfigStep(prev => prev + 1);
        setTimeout(() => askQuestion(configStep + 1), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    if (currentConfig.id === "dairyProducts") {
      setFarmerDetails(prev => ({ ...prev, dairyProducts: finalValue }));
      setLastSubmittedAnswer(cleanAnswer);
      await speakAcknowledgment(cleanAnswer, currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) {
        setConfigStep(prev => prev + 1);
        setTimeout(() => askQuestion(configStep + 1), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    // ============================================================
    // ===== BUSINESS PLAN FIELDS (including poultry/dairy inputs) =====
    // ============================================================
    const businessPlanFields = [
      "businessName",
      "businessVision",
      "businessMission",
      "shortTermGoals",
      "midTermGoals",
      "longTermGoals",
      "targetCustomers",
      "communicationChannels",
      "fallbackPlan",
      "competitiveAdvantage",
      "paymentModes",
      "businessPositions",
      "positionHeads",
      "productionInputs",
      "poultryProductionInputs",
      "dairyProductionInputs",
    ];

    if (businessPlanFields.includes(currentConfig.id)) {
      setFarmerDetails(prev => ({ ...prev, [currentConfig.id]: finalValue }));
      setLastSubmittedAnswer(cleanAnswer);
      await speakAcknowledgment(cleanAnswer, currentConfig.id);
      setUserTranscript("");
      if (configStep < visibleQuestions.length - 1) {
        setConfigStep(prev => prev + 1);
        setTimeout(() => askQuestion(configStep + 1), 2500);
      } else {
        setCurrentStep("generating");
        generateSession();
      }
      return;
    }

    // ===== DEFAULT: Set farmer details for other fields =====
    setFarmerDetails(prev => ({ ...prev, [currentConfig.id]: finalValue }));
    setLastSubmittedAnswer(cleanAnswer);
    await speakAcknowledgment(cleanAnswer, currentConfig.id);
    setUserTranscript("");

    if (configStep < visibleQuestions.length - 1) {
      setConfigStep(prev => prev + 1);
      setTimeout(() => askQuestion(configStep + 1), 2500);
    } else {
      setCurrentStep("generating");
      generateSession();
    }
  };

  const safeStartListening = () => {
    if (isSpeaking || isStreaming) { console.log("AI is speaking, waiting to listen..."); return; }
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;
    if (recognitionRef.current.lang !== recognitionLanguage) { recognitionRef.current.lang = recognitionLanguage; console.log(`🔄 Forced recognition language to ${recognitionLanguage} before start`); }
    try { recognitionRef.current.start(); setDebugInfo(prev => ({ ...prev, isListening: true })); console.log(`Started listening for answer with language: ${recognitionLanguage}`); } catch (error) {}
  };

  const safeStopListening = () => {
    if (recognitionRef.current && isRecognitionActiveRef.current) { try { recognitionRef.current.stop(); } catch {} isRecognitionActiveRef.current = false; setDebugInfo(prev => ({ ...prev, isListening: false })); }
  };

  const startVoiceSetup = async () => {
    if (!voiceEnabled || !voiceAssistantRef.current) { toast.error(safeT('enable_voice_first')); return; }
    safeStopListening();
    if (user?.uid) await loadProfileFromFirestore(user.uid);
    setCurrentStep("configuring");
    setConfigStep(0);
    setUserTranscript("");
    setLastSubmittedAnswer("");
    nameUsageCountRef.current = 0;
    setPlantingNutrients({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });
    setTopdressingNutrients({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });
    setPotassiumNutrients({ s: "", ca: "", mg: "", zn: "", b: "", cu: "", mn: "" });
    askQuestion(0);
  };

  const askQuestion = async (step: number) => {
    if (!voiceAssistantRef.current || step >= visibleQuestions.length) return;
    if (isSpeaking) await new Promise(resolve => setTimeout(resolve, 500));
    const currentQ = visibleQuestions[step];
    if (currentQ && farmerDetails[currentQ.id as keyof typeof farmerDetails]) {
      console.log(`⏭️ Skipping already answered question: ${currentQ.id}`);
      if (step < visibleQuestions.length - 1) { setConfigStep(step + 1); setTimeout(() => askQuestion(step + 1), 300); } else { setCurrentStep("generating"); generateSession(); }
      return;
    }
    const questionKey = visibleQuestions[step].questionKey;
    let question = translateWithCrop(safeT, questionKey, farmerDetails.crops);
    if (questionKey === "question_wants_nutrition_benefits" && farmerDetails.crops) {
      question = safeT("question_wants_nutrition_benefits_crop", { crop: farmerDetails.crops.toUpperCase() });
    }
    setDebugInfo(prev => ({ ...prev, currentQuestion: step + 1 }));
    setUserTranscript("");
    setLastSubmittedAnswer("");
    await voiceAssistantRef.current.speak(question);
    if (visibleQuestions[step].type !== "multiselect" && visibleQuestions[step].type !== "button" && !visibleQuestions[step].renderCustom) {
      safeStartListening();
    }
  };

  // ========== generateSession ==========
  const generateSession = async () => {
    if (!voiceAssistantRef.current) return;
    setIsLoading(true);
    await voiceAssistantRef.current.speak(safeT('creating_profile'));

    let currentUserId = userId || localStorage.getItem('userId') || `user-${Date.now()}`;
    localStorage.setItem('userId', currentUserId);

    if (!farmerDetails.county) farmerDetails.county = farmerDetails.country || "Unknown";
    if (!farmerDetails.subCounty) farmerDetails.subCounty = "Unknown";
    if (!farmerDetails.village) farmerDetails.village = "Unknown";

    if (user?.uid) await saveProfileToFirestore(user.uid, farmerDetails);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const payload = {
      ...farmerDetails,
      dairyManagementFocus: lastDairyManagementFocusRef.current || farmerDetails.dairyManagementFocus || "",
      userid: currentUserId,
      modules: modules,
      species: selectedSpecies,
      isPoultry: selectedSpecies === "poultry",
      isDairy: selectedSpecies === "dairy",
      poultry_breed: poultryBreed,
      poultry_system: poultrySystem,
      poultry_flock_size: poultryFlockSize,
      poultry_age_weeks: poultryAgeWeeks,
      poultry_farming_goal: poultryFarmingGoal,
      poultry_location_region: poultryLocationRegion,
      poultry_rainfall_pattern: poultryRainfallPattern,
      poultry_altitude: poultryAltitude,
      poultry_feed_type: poultryFeedType,
      poultry_feed_cost_kg: poultryFeedCostKg,
      poultry_vaccination_done: poultryVaccinationDone,
      poultry_mortality_count: poultryMortalityCount,
      poultry_chick_cost: poultryChickCost,
      poultry_egg_price: poultryEggPrice,
      poultry_meat_price: poultryMeatPrice,
      poultry_house_size_m2: poultryHouseSizeM2,
      poultry_disease: farmerDetails.poultry_disease || "",
      symptomsObserved: farmerDetails.symptomsObserved || "",
      mortalityCountDisease: farmerDetails.mortalityCountDisease || "",
      diseaseDuration: farmerDetails.diseaseDuration || "",
      // Feed formulation fields – OVERRIDE WITH THE ARRAY
      poultryStage: farmerDetails.poultryStage || "",
      batchSize: farmerDetails.batchSize || "",
      includeCoccidiostat: farmerDetails.includeCoccidiostat || "",
      availableIngredients: availableIngredients, // the array state
      ingredientPrices: JSON.stringify(ingredientPrices), // the object state
      ageWeeks: farmerDetails.ageWeeks || "",
      // DAIRY fields
      dairyCowCategory,
      dairyBodyWeightKg,
      dairyBreed,
      dairyDiseaseSelect,
      dairySymptoms: dairySymptoms.join(','),
      dairyMortalityCount,
      dairyHealthDuration,
      dairyMilkYieldPerDay,
      dairyMilkPricePerLitre,
      dairyFeedCostPerDay,
      dairyVetCostPerMonth,
      dairyDaysSinceCalving: farmerDetails.dairyDaysSinceCalving || "",
      dairyHeatObserved: farmerDetails.dairyHeatObserved || "",
      dairyLastInseminationDate: farmerDetails.dairyLastInseminationDate || "",
      dairyBreedingMethod: farmerDetails.dairyBreedingMethod || "",
      dairyReproductiveProblems: farmerDetails.dairyReproductiveProblems || "",
      dairyBusinessInterest: lastDairyBusinessInterestRef.current || farmerDetails.dairyBusinessInterest || "",
      calfAgeWeeks: farmerDetails.calfAgeWeeks || "",
      calfFeedingMethod: farmerDetails.calfFeedingMethod || "",
      calfMilkLitresPerDay: farmerDetails.calfMilkLitresPerDay || "",
      calfReceivedColostrum: farmerDetails.calfReceivedColostrum || "",
      calfHousingType: farmerDetails.calfHousingType || "",
      calfHealthIssues: farmerDetails.calfHealthIssues || "",
      dairyConcentrateBrand: farmerDetails.dairyConcentrateBrand || "",
      dairyConcentrateProduct: farmerDetails.dairyConcentrateProduct || "",
      dairyConcentrateInclusion: farmerDetails.dairyConcentrateInclusion || "",
      dairyConcentrateMaizeKg: farmerDetails.dairyConcentrateMaizeKg || "",
      dairyConcentrateSaltKg: farmerDetails.dairyConcentrateSaltKg || "",
      dairyConcentrateCalciumSource: farmerDetails.dairyConcentrateCalciumSource || "",
      dairyConcentrateCalciumKg: farmerDetails.dairyConcentrateCalciumKg || "",
      dairyDeficiencySymptoms: lastDairyDeficiencySymptomsRef.current || farmerDetails.dairyDeficiencySymptoms || "",
      dairyManagementFocus: lastDairyManagementFocusRef.current || farmerDetails.dairyManagementFocus || "",
      dairyAvailableForages: farmerDetails.dairyAvailableForages || "",
      dairyAvailableGrains: farmerDetails.dairyAvailableGrains || "",
      dairyAvailableProtein: farmerDetails.dairyAvailableProtein || "",
      dairyAvailableMinerals: farmerDetails.dairyAvailableMinerals || "",
      dairyQuantityToMix: farmerDetails.dairyQuantityToMix || "",
      dairyForageType: farmerDetails.dairyForageType || "",
      dairyForageKgPerDay: farmerDetails.dairyForageKgPerDay || "",
      dairyConcentrateType: farmerDetails.dairyConcentrateType || "",
      dairyConcentrateKgPerDay: farmerDetails.dairyConcentrateKgPerDay || "",
      dairyMilkYield: farmerDetails.dairyMilkYield || "",
      dairyMilkPrice: farmerDetails.dairyMilkPrice || "",
      dairyVetCostMonth: farmerDetails.dairyVetCostMonth || "",
      dairyOtherCosts: farmerDetails.dairyOtherCosts || "",
      dairyHousingType: farmerDetails.dairyHousingType || "",
      numberOfCowsHoused: farmerDetails.numberOfCowsHoused || "",
      floorSpacePerCowM2: farmerDetails.floorSpacePerCowM2 || "",
      dairyVentilationRating: farmerDetails.dairyVentilationRating || "",
      beddingType: farmerDetails.beddingType || "",
      milkYieldCurrent: farmerDetails.milkYieldCurrent || "",
      milkFatPercent: farmerDetails.milkFatPercent || "",
      milkProteinPercent: farmerDetails.milkProteinPercent || "",
      daysInMilk: farmerDetails.daysInMilk || "",
      parity: farmerDetails.parity || "",
      dairyParasiteSigns: lastDairyParasiteSignsRef.current || farmerDetails.dairyParasiteSigns || "",
      dairyLastDeworming: farmerDetails.dairyLastDeworming || "",
      dairyLastHoofTrimming: farmerDetails.dairyLastHoofTrimming || "",
      dairyLastVaccination: farmerDetails.dairyLastVaccination || "",
      dairyNextVaccinationDue: farmerDetails.dairyNextVaccinationDue || "",
      dairyReminderTopics: farmerDetails.dairyReminderTopics || "",
    };
    console.log('📦 API Payload:', JSON.stringify(payload, null, 2));
    console.log("🔍 PAYLOAD CHECK:");

    console.log("availableIngredients:", payload.availableIngredients);
    console.log("ingredientPrices:", payload.ingredientPrices);
    console.log("📦 Raw state before payload:", { availableIngredients, ingredientPrices });
    alert(`Sending: ${availableIngredients.length} ingredients, prices: ${JSON.stringify(ingredientPrices)}`);
    try {
      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data.success && data.sessionId) {
        await voiceAssistantRef.current.speak(safeT('ready_redirect'));
        setTimeout(() => window.location.href = `/interview/${data.sessionId}`, 2000);
        setCurrentStep("redirecting");
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Generate session error:", error);
      if (error.name === 'AbortError') {
        toast.error(safeT('request_timeout') || "Request timed out. Please try again.");
      } else {
        toast.error(safeT('error_creating_profile') || "Failed to create farm profile. Please try again.");
      }
      setCurrentStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const stopEverything = () => {
    safeStopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setCurrentStep("idle");
    setStreamingQuestion("");
    setIsStreaming(false);
    setUserTranscript("");
  };

  const skipQuestion = () => {
    if (currentStep === "configuring" && configStep < visibleQuestions.length) {
      processAnswer("not specified");
      toast.info(safeT('skipped'));
    }
  };

  const submitAnswer = () => {
    if (userTranscript.trim()) processAnswer(userTranscript);
  };

  const colors = { primary: "from-emerald-400 to-cyan-400", secondary: "from-purple-400 to-pink-400", background: "bg-gradient-to-br from-slate-50 to-white", card: "bg-white/80 backdrop-blur-sm" };

  const currentSectionKey = visibleQuestions[configStep]?.sectionKey;
  const currentSection = currentSectionKey ? safeT(currentSectionKey) : "";
  const wordProgress = currentWordIndex > 0 && questionWordsRef.current.length > 0 ? `${currentWordIndex}/${questionWordsRef.current.length} ${safeT('words')}` : '';

  const renderNutrientSelector = useCallback((type: string, nutrients: any, setNutrients: any) => {
    const nutrientList = ['s', 'ca', 'mg', 'zn', 'b', 'cu', 'mn'];
    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="font-medium text-blue-900">{safeT(`question_${type}_fertilizer_nutrients`)}</p>
        <div className="space-y-2">
          {nutrientList.map(nutrient => <NutrientDropdown key={nutrient} nutrient={nutrient} value={nutrients[nutrient]} onChange={(value) => setNutrients((prev: any) => ({ ...prev, [nutrient]: value }))} />)}
        </div>
        <button onClick={() => { if (type === "planting") handleNutrientSubmit("plantingFertilizerNutrients", plantingNutrients); else if (type === "topdressing") handleNutrientSubmit("topdressingFertilizerNutrients", topdressingNutrients); else if (type === "potassium") handleNutrientSubmit("potassiumFertilizerNutrients", potassiumNutrients); if (configStep < visibleQuestions.length - 1) { setConfigStep(prev => prev + 1); setTimeout(() => askQuestion(configStep + 1), 1500); } }} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{safeT('continue')}</button>
      </div>
    );
  }, [plantingNutrients, topdressingNutrients, potassiumNutrients, configStep, visibleQuestions.length, safeT, handleNutrientSubmit]);

  // ===== RENDER INGREDIENT PRICES =====
  const renderIngredientPrices = useCallback(() => {
    const selectedIngredients = availableIngredients;
    if (selectedIngredients.length === 0) return null;

    const symbol = getDisplaySymbol();
    const handlePriceChange = (ingredient: string, value: string) => {
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0) {
        setIngredientPrices(prev => ({ ...prev, [ingredient]: num }));
      } else {
        setIngredientPrices(prev => {
          const newPrices = { ...prev };
          delete newPrices[ingredient];
          return newPrices;
        });
      }
    };

    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="font-medium text-blue-900">
          Enter the price per kg for each ingredient you selected. Use numbers only.
        </p>
        <p className="text-sm text-blue-700">
          Currency is set to {symbol} (based on your country: {farmerDetails.country || 'Kenya'})
        </p>
        <div className="space-y-2">
          {selectedIngredients.map((ing) => (
            <div key={ing} className="flex items-center gap-2">
              <span className="w-40 text-sm font-medium text-gray-800">{ing}</span>
              <input
                type="number"
                step="any"
                placeholder="Price per kg"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={ingredientPrices[ing] ?? ''}
                onChange={(e) => handlePriceChange(ing, e.target.value)}
              />
              <span className="text-sm font-medium text-gray-600">{symbol} / kg</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            console.log("🟢 Submitting ingredientPrices object:", ingredientPrices);
            const pricesString = JSON.stringify(ingredientPrices);
            setFarmerDetails(prev => ({ ...prev, ingredientPrices: pricesString }));
            if (configStep < visibleQuestions.length - 1) {
              setConfigStep(prev => prev + 1);
              setTimeout(() => askQuestion(configStep + 1), 1500);
            }
          }}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Submit all prices
        </button>
        <p className="text-xs text-gray-500">Leave blank to use default market prices.</p>
      </div>
    );
  }, [availableIngredients, ingredientPrices, configStep, visibleQuestions.length, getDisplaySymbol]);

  // ========== Custom renderer for Crop Products Table (Q14) ==========
  const renderProductsTable = () => {
    const crop = farmerDetails.crops || "";
    const productOptions = getProductOptionsForCrop(crop);

    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
      setSelectedProducts(selected);
      setProductRows(
        selected.map((product) => ({
          product,
          quantity: "",
          price: "",
          cost: "",
        }))
      );
    };

    const handleRowChange = (index: number, field: "quantity" | "price" | "cost", value: string) => {
      const updated = [...productRows];
      updated[index][field] = value;
      setProductRows(updated);
    };

    const handleSubmitProducts = () => {
      const allFilled = productRows.every(
        (row) => row.quantity.trim() && row.price.trim() && row.cost.trim()
      );
      if (!allFilled) {
        toast.error("Please fill in quantity, price, and cost for all products.");
        return;
      }
      const formatted = productRows
        .map((row) => `${row.product}: ${row.quantity}kg @ ${row.price}/kg, cost ${row.cost}/kg`)
        .join("; ");
      setProductsSubmitted(true);
      processAnswer(formatted);
    };

    return (
      <div className="space-y-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-300">
        <p className="font-medium text-purple-900">{safeT("question_products")}</p>
        <select
          multiple
          value={selectedProducts}
          onChange={handleProductSelect}
          className="w-full p-3 border-2 rounded-xl text-purple-900 bg-white"
        >
          {productOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">Hold Ctrl (or Cmd) to select multiple products</p>

        {productRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl">
              <thead>
                <tr className="bg-purple-200">
                  <th className="p-2 text-left text-purple-900">Product</th>
                  <th className="p-2 text-left text-purple-900">Qty (kg)</th>
                  <th className="p-2 text-left text-purple-900">Price/kg</th>
                  <th className="p-2 text-left text-purple-900">Cost/kg</th>
                </tr>
              </thead>
              <tbody>
                {productRows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 font-medium text-purple-900">{row.product}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(idx, "quantity", e.target.value)}
                        placeholder="e.g., 15000"
                        className="w-full p-2 border rounded-lg text-purple-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.price}
                        onChange={(e) => handleRowChange(idx, "price", e.target.value)}
                        placeholder="e.g., 40"
                        className="w-full p-2 border rounded-lg text-purple-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.cost}
                        onChange={(e) => handleRowChange(idx, "cost", e.target.value)}
                        placeholder="e.g., 25"
                        className="w-full p-2 border rounded-lg text-purple-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleSubmitProducts}
              disabled={productsSubmitted}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {productsSubmitted ? "✓ Products Submitted" : "Submit Products"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ========== Custom renderer for Poultry Products Table ==========
  const renderPoultryProductsTable = () => {
    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
      setSelectedPoultryProducts(selected);
      setPoultryProductRows(
        selected.map((product) => ({
          product,
          quantity: "",
          price: "",
          cost: "",
        }))
      );
    };

    const handleRowChange = (index: number, field: "quantity" | "price" | "cost", value: string) => {
      const updated = [...poultryProductRows];
      updated[index][field] = value;
      setPoultryProductRows(updated);
    };

    const handleSubmitPoultryProducts = () => {
      const allFilled = poultryProductRows.every(
        (row) => row.quantity.trim() && row.price.trim() && row.cost.trim()
      );
      if (!allFilled) {
        toast.error("Please fill in quantity, price, and cost for all poultry products.");
        return;
      }
      const formatted = poultryProductRows
        .map((row) => `${row.product}: ${row.quantity} units @ ${row.price}/unit, cost ${row.cost}/unit`)
        .join("; ");
      setPoultryProductsSubmitted(true);
      processAnswer(formatted);
    };

    return (
      <div className="space-y-4 p-4 bg-orange-50 rounded-xl border-2 border-orange-300">
        <p className="font-medium text-orange-900">{safeT("question_poultry_products")}</p>
        <select
          multiple
          value={selectedPoultryProducts}
          onChange={handleProductSelect}
          className="w-full p-3 border-2 rounded-xl text-orange-900 bg-white"
        >
          {POULTRY_PRODUCT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {safeT(opt)}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">Hold Ctrl (or Cmd) to select multiple products</p>

        {poultryProductRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl">
              <thead>
                <tr className="bg-orange-200">
                  <th className="p-2 text-left text-orange-900">{safeT("poultry_product_name")}</th>
                  <th className="p-2 text-left text-orange-900">{safeT("poultry_product_quantity")}</th>
                  <th className="p-2 text-left text-orange-900">{safeT("poultry_product_price")}</th>
                  <th className="p-2 text-left text-orange-900">{safeT("poultry_product_cost")}</th>
                </tr>
              </thead>
              <tbody>
                {poultryProductRows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 font-medium text-orange-900">{safeT(row.product)}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(idx, "quantity", e.target.value)}
                        placeholder="e.g., 1000"
                        className="w-full p-2 border rounded-lg text-orange-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.price}
                        onChange={(e) => handleRowChange(idx, "price", e.target.value)}
                        placeholder="e.g., 280"
                        className="w-full p-2 border rounded-lg text-orange-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.cost}
                        onChange={(e) => handleRowChange(idx, "cost", e.target.value)}
                        placeholder="e.g., 200"
                        className="w-full p-2 border rounded-lg text-orange-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleSubmitPoultryProducts}
              disabled={poultryProductsSubmitted}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {poultryProductsSubmitted ? "✓ Products Submitted" : "Submit Products"}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ========== Custom renderer for Dairy Products Table ==========
  const renderDairyProductsTable = () => {
    const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
      setSelectedDairyProducts(selected);
      setDairyProductRows(
        selected.map((product) => ({
          product,
          quantity: "",
          price: "",
          cost: "",
        }))
      );
    };

    const handleRowChange = (index: number, field: "quantity" | "price" | "cost", value: string) => {
      const updated = [...dairyProductRows];
      updated[index][field] = value;
      setDairyProductRows(updated);
    };

    const handleSubmitDairyProducts = () => {
      const allFilled = dairyProductRows.every(
        (row) => row.quantity.trim() && row.price.trim() && row.cost.trim()
      );
      if (!allFilled) {
        toast.error("Please fill in quantity, price, and cost for all dairy products.");
        return;
      }
      const formatted = dairyProductRows
        .map((row) => `${row.product}: ${row.quantity} units @ ${row.price}/unit, cost ${row.cost}/unit`)
        .join("; ");
      setDairyProductsSubmitted(true);
      processAnswer(formatted);
    };

    return (
      <div className="space-y-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
        <p className="font-medium text-blue-900">{safeT("question_dairy_products")}</p>
        <select
          multiple
          value={selectedDairyProducts}
          onChange={handleProductSelect}
          className="w-full p-3 border-2 rounded-xl text-blue-900 bg-white"
        >
          {DAIRY_PRODUCT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {safeT(opt)}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">Hold Ctrl (or Cmd) to select multiple products</p>

        {dairyProductRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl">
              <thead>
                <tr className="bg-blue-200">
                  <th className="p-2 text-left text-blue-900">{safeT("dairy_product_name")}</th>
                  <th className="p-2 text-left text-blue-900">{safeT("dairy_product_quantity")}</th>
                  <th className="p-2 text-left text-blue-900">{safeT("dairy_product_price")}</th>
                  <th className="p-2 text-left text-blue-900">{safeT("dairy_product_cost")}</th>
                </tr>
              </thead>
              <tbody>
                {dairyProductRows.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 font-medium text-blue-900">{safeT(row.product)}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(idx, "quantity", e.target.value)}
                        placeholder="e.g., 5000"
                        className="w-full p-2 border rounded-lg text-blue-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.price}
                        onChange={(e) => handleRowChange(idx, "price", e.target.value)}
                        placeholder="e.g., 40"
                        className="w-full p-2 border rounded-lg text-blue-900"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={row.cost}
                        onChange={(e) => handleRowChange(idx, "cost", e.target.value)}
                        placeholder="e.g., 25"
                        className="w-full p-2 border rounded-lg text-blue-900"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleSubmitDairyProducts}
              disabled={dairyProductsSubmitted}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {dairyProductsSubmitted ? "✓ Products Submitted" : "Submit Products"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderInput = useCallback(() => {
    const q = visibleQuestions[configStep];
    if (!q) return null;

    // ===== Custom render for products tables =====
    if (q.id === "products") {
      return renderProductsTable();
    }
    if (q.id === "poultryProducts") {
      return renderPoultryProductsTable();
    }
    if (q.id === "dairyProducts") {
      return renderDairyProductsTable();
    }

    if (q.id === "plantingFertilizerNutrients") return renderNutrientSelector("planting", plantingNutrients, setPlantingNutrients);
    if (q.id === "topdressingFertilizerNutrients") return renderNutrientSelector("topdressing", topdressingNutrients, setTopdressingNutrients);
    if (q.id === "potassiumFertilizerNutrients") return renderNutrientSelector("potassium", potassiumNutrients, setPotassiumNutrients);
    if (q.id === "ingredientPrices") return renderIngredientPrices();

    if (q.type === "button" && q.id === "wantsNutritionBenefits") {
      return (
        <div className="flex justify-center">
          <button onClick={() => processAnswer("Yes")} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-2xl font-bold rounded-2xl hover:scale-105 transition-all shadow-lg">{safeT('yes')}</button>
        </div>
      );
    }
    if (q.type === "date") {
      return (
        <div className="relative">
          <input type="date" value={userTranscript} onChange={(e) => setUserTranscript(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600" />
          <Calendar className="absolute right-3 top-3 w-5 h-5 text-blue-600" />
        </div>
      );
    }
    if (q.type === "dropdown") {
      return (
        <div className="relative">
          <select value={userTranscript} onChange={(e) => setUserTranscript(e.target.value)} className="w-full px-4 py-3 border-2 rounded-xl appearance-none text-blue-900 font-medium focus:border-blue-600">
            <option value="" className="text-gray-500">{safeT('select_option')}</option>
            {q.options?.map((opt: string, index: number) => <option key={`${opt}-${index}`} value={opt} className="text-blue-900">{opt}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-blue-600" />
        </div>
      );
    }
    if (q.type === "text") {
      return <input type="text" value={userTranscript} onChange={(e) => setUserTranscript(e.target.value)} placeholder={q.placeholder || safeT('type_answer')} className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400" />;
    }
    if (q.type === "number") {
      return <input type="number" value={userTranscript} onChange={(e) => setUserTranscript(e.target.value)} placeholder={q.placeholder || safeT('type_answer')} step={q.step || "any"} className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400" />;
    }
    if (q.type === "multiselect") {
      return (
        <div className="space-y-2 max-h-60 overflow-y-auto p-2 border-2 rounded-xl">
          {q.options?.map((opt: string, index: number) => (
            <label key={`${opt}-${index}`} className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg">
              <input type="checkbox" value={opt} checked={userTranscript.includes(opt)} onChange={(e) => { const values = userTranscript ? userTranscript.split(',') : []; e.target.checked ? values.push(opt) : values.splice(values.indexOf(opt), 1); setUserTranscript(values.join(',')); }} className="w-4 h-4 accent-blue-600" />
              <span className="text-blue-900">{safeT(opt)}</span>
            </label>
          ))}
        </div>
      );
    }
    let defaultValue = userTranscript;
    const displaySymbol = getDisplaySymbol();
    if (displaySymbol !== 'Ksh') defaultValue = defaultValue.replace(/Ksh/g, displaySymbol);
    return <input type={q.type || "text"} value={defaultValue} onChange={(e) => setUserTranscript(e.target.value)} placeholder={q.placeholder || safeT('type_answer')} step={q.step || "any"} className="w-full px-4 py-3 border-2 rounded-xl text-blue-900 font-medium focus:border-blue-600 placeholder-gray-400" />;
  }, [configStep, visibleQuestions, userTranscript, plantingNutrients, topdressingNutrients, potassiumNutrients, renderNutrientSelector, renderIngredientPrices, safeT, setPlantingNutrients, setTopdressingNutrients, setPotassiumNutrients, processAnswer, renderProductsTable, renderPoultryProductsTable, renderDairyProductsTable]);

  // ========== RENDER ==========
  return (
    <div className={`flex flex-col gap-6 p-4 ${colors.background} rounded-2xl min-h-screen`}>
      <div className={`${colors.card} rounded-2xl p-5 shadow-xl border`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src={profileImage || "/farmer-avatar.png"} alt="Farmer" width={48} height={48} className="rounded-full ring-4" />
            <div>
              <h4 className="font-bold text-xl">{userName || safeT('farmer')}</h4>
              <p className="text-sm text-gray-500">{safeT('smart_farmer_building')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl px-3 py-2 border border-white-30">
              <Mic className={`w-5 h-5 text-white ${isSpeaking ? 'animate-pulse' : ''}`} />
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-white font-medium text-sm focus:outline-none">{voiceEnabled ? safeT('voice_on') : safeT('voice_off')}</button>
            </div>
            <button onClick={startVoiceSetup} disabled={!voiceEnabled || currentStep !== "idle"} className={`px-6 py-2 rounded-xl font-bold text-sm ${voiceEnabled && currentStep === "idle" ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 transition-all' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{currentStep === "idle" ? safeT('start_setup') : safeT('loading')}</button>
          </div>
        </div>
        {isSpeaking && <div className="mt-2 text-xs text-blue-600 flex items-center gap-1"><Volume2 className="w-3 h-3 animate-pulse" /><span>{safeT('speaking')} {wordProgress}</span></div>}
      </div>

      {/* ===== SPECIES TOGGLE ===== */}
      {currentStep === "idle" && (
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-xl mb-4">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-blue-800">{safeT("select_species") || "What are you farming?"}</h3>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setSelectedSpecies("crop")} className={`px-6 py-3 rounded-xl font-bold transition ${selectedSpecies === "crop" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>🌾 Crops</button>
            <button onClick={() => setSelectedSpecies("poultry")} className={`px-6 py-3 rounded-xl font-bold transition ${selectedSpecies === "poultry" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>🐔 Poultry</button>
            <button onClick={() => setSelectedSpecies("dairy")} className={`px-6 py-3 rounded-xl font-bold transition ${selectedSpecies === "dairy" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>🐄 Dairy</button>
          </div>
        </div>
      )}

      {currentStep === "configuring" && visibleQuestions.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-green-300 min-h-[300px]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold">{configStep + 1}</span>
            <h4 className="font-bold text-xl text-emerald-800">{safeT('question_x_of_y', { current: configStep + 1, total: visibleQuestions.length })}</h4>
            {currentSection && <p className="text-sm text-emerald-600 ml-auto">{currentSection}</p>}
            {isStreaming && <span className="ml-auto flex items-center gap-2 text-emerald-600"><Volume2 className="w-5 h-5 animate-pulse" /><span className="text-sm">{wordProgress}</span></span>}
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 min-h-[120px]">
            {streamingQuestion ? (
              <p className="text-3xl text-gray-800">{streamingQuestion.split(' ').map((word, wordIdx, arr) => <span key={wordIdx}><span className="text-emerald-700 font-bold">{word}</span>{wordIdx < arr.length - 1 ? ' ' : ''}</span>)}</p>
            ) : <p className="text-3xl text-gray-400 italic">{isStreaming ? safeT('speaking_dots') : safeT('ready_for_answer')}</p>}
          </div>

          {!isStreaming && streamingQuestion && (
            <div className="mt-6">
              <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
                {renderInput()}
                {!visibleQuestions[configStep]?.renderCustom && visibleQuestions[configStep]?.type !== "button" && (
                  <div className="flex gap-2 mt-4">
                    <button onClick={submitAnswer} disabled={!userTranscript.trim()} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"><Send className="w-4 h-4" />{safeT('submit_answer')}</button>
                    <button onClick={skipQuestion} className="px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-medium">{safeT('skip')}</button>
                  </div>
                )}
              </div>
              {lastSubmittedAnswer && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-blue-800 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-600" />{safeT('your_answer')}: <span className="font-bold text-blue-900">{lastSubmittedAnswer}</span></p>
                  <p className="text-xs text-blue-600 mt-1">{safeT('voice_confirmation_sent')}</p>
                </div>
              )}
              {debugInfo.isListening && (
                <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600">{safeT('listening_speak_now')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(currentStep === "configuring" || currentStep === "generating") && (
        <button onClick={stopEverything} className="px-5 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-xl mx-auto w-48 font-medium flex items-center justify-center gap-2"><span>{safeT('stop_setup')}</span></button>
      )}
    </div>
  );
};

export default CreateInterviewAgent;