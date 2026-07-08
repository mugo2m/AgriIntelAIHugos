// lib/fertilizers/topDressingFertilizers.ts
// Complete database of top dressing fertilizers from Kenyan suppliers
// UPDATED: Covers all 219 crops from the pest/disease database

import { Fertilizer } from './plantingFertilizers';

export const topDressingFertilizers: Fertilizer[] = [
  // ========== COMMON TOP DRESSING ==========
  {
    id: "ss_can",
    brand: "CAN 27%N",
    company: "Various",
    type: "topdressing",
    npk: "27-0-0",
    nutrients: { n: 27, p: 0, k: 0, ca: 8 },
    crops: [
      "maize", "wheat", "barley", "sorghum", "finger millet", "rice",
      "tomatoes", "onions", "cabbages", "kales", "spinach", "carrots",
      "chillies", "capsicums", "potatoes", "coffee", "tea",
      "bananas", "pineapples", "all crops", "cereals", "vegetables",
      // All vegetables
      "african nightshade", "amaranth", "arugula", "asparagus", "beetroot",
      "broccoli", "brinjals", "cauliflower", "celery", "coriander",
      "courgettes", "cucumbers", "eggplants", "endive", "ethiopian kale",
      "french beans", "garden peas", "green beans", "kohlrabi", "leeks",
      "lettuce", "okra", "parsley", "pumpkin leaves", "radish",
      "rhubarb", "spider plant", "sweet potato leaves", "turnip", "watercress",
      "bok choy", "collard greens", "mustard greens", "swiss chard", "radicchio",
      "escarole", "frisee", "turnip greens", "rutabaga", "jute mallow",
      "slender leaf", "artichoke", "wasabi",
      // Fruits
      "mangoes", "avocados", "oranges", "lemons", "limes", "grapefruit",
      "guava", "jackfruit", "breadfruit", "coconut", "pawpaws", "passion fruit",
      "pomegranate", "star fruit", "watermelons", "pumpkin", "fig", "date palm",
      "mulberry", "lychee", "persimmon", "gooseberry", "currant", "elderberry",
      "rambutan", "durian", "mangosteen", "longan", "marula",
      // Tubers
      "cassava", "sweet potatoes", "yams", "taro", "ginger", "turmeric",
      "horseradish", "parsnip", "irish potatoes",
      // Cash crops
      "sugarcane", "cotton", "tobacco", "sunflower", "sisal", "pyrethrum",
      "cocoa", "oil palm", "rubber",
      // Legumes
      "beans", "soya beans", "cowpeas", "green grams", "groundnuts",
      "pigeonpeas", "bambaranuts", "chickpea", "lentil", "faba bean", "peanut",
      // Nuts
      "macadamia", "cashew", "almond", "brazil nut", "chestnut", "hazelnut",
      "pecan", "pistachio", "shea", "walnut", "pili nut",
      // Herbs & spices
      "basil", "black pepper", "cardamom", "chamomile", "cinnamon", "cloves",
      "dill", "echinacea", "fennel", "ginseng", "goldenseal", "hibiscus",
      "hops", "lavender", "lemon grass", "mint", "moringa", "mustard",
      "oregano", "rosemary", "sage", "thyme", "vanilla", "stevia",
      "fenugreek", "cumin", "caraway", "anise", "lovage", "marjoram",
      "tarragon", "sorrel", "chervil", "savory", "calendula", "nasturtium",
      "borage", "st. john's wort", "valerian",
      // Forage & cover crops
      "alfalfa", "brachiaria", "buffel grass", "cenchrus", "forage sorghum",
      "guinea grass", "italian ryegrass", "lucerne", "napier grass",
      "napier hybrid", "orchard grass", "rhodes grass", "timothy grass",
      "white clover", "clover", "vetch", "desmodium", "dolichos", "canavalia",
      "crotalaria juncea", "crotalaria ochroleuca", "crotalaria paulina",
      "leucaena", "sesbania", "calliandra", "sunn hemp",
      // Other
      "bamboo", "aloe vera", "oyster nut", "stinging nettle", "mushroom",
      "ramie", "flax", "hemp", "jute", "kenaf"
    ],
    description: "Calcium Ammonium Nitrate - most common top dressing, provides both N and Ca",
    packageSizes: ["50kg bag (Ksh 2,500)", "50kg bag (Ksh 2,600)", "50kg bag (Ksh 2,700)"],
    pricePer50kg: 2600,
    applicationRate: "50-100 kg/acre",
    timing: "4-6 weeks after planting, side-dress near plants"
  },

  {
    id: "ss_urea",
    brand: "UREA 46%N",
    company: "Various",
    type: "topdressing",
    npk: "46-0-0",
    nutrients: { n: 46, p: 0, k: 0 },
    crops: [
      "maize", "wheat", "barley", "sorghum", "finger millet", "rice",
      "sugarcane", "bananas", "pineapples", "coffee", "tea",
      "all crops", "cereals",
      "forage sorghum", "napier grass", "napier hybrid", "brachiaria",
      "guinea grass", "buffel grass", "rhodes grass", "orchard grass",
      "timothy grass", "italian ryegrass", "cenchrus", "bamboo"
    ],
    description: "Urea - highest nitrogen content, best for cereals and grasses",
    packageSizes: ["50kg bag (Ksh 2,800)", "50kg bag (Ksh 2,900)", "50kg bag (Ksh 3,000)"],
    pricePer50kg: 2900,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting, incorporate into soil to avoid volatilization"
  },

  {
    id: "ss_as",
    brand: "AS 21%N",
    company: "Various",
    type: "topdressing",
    npk: "21-0-0",
    nutrients: { n: 21, p: 0, k: 0, s: 23 },
    crops: [
      "maize", "wheat", "barley", "onions", "garlic", "cabbages",
      "potatoes", "tea", "coffee", "oil crops", "sunflower",
      "all crops", "cereals", "vegetables",
      "cocoa", "macadamia", "cashew", "mustard", "rapeseed", "safflower",
      "broccoli", "cauliflower", "kales", "spinach", "leeks"
    ],
    description: "Ammonium Sulphate - nitrogen with sulphur for crops needing S",
    packageSizes: ["50kg bag (Ksh 2,200)", "50kg bag (Ksh 2,300)", "50kg bag (Ksh 2,400)"],
    pricePer50kg: 2300,
    applicationRate: "50-100 kg/acre",
    timing: "4-6 weeks after planting, good for sulphur-loving crops"
  },

  // ========== YARA TOP DRESSING ==========
  {
    id: "yara_microp_topdressing",
    brand: "MiCrop + Topdressing",
    company: "YARA",
    type: "topdressing",
    npk: "34-0-3",
    nutrients: { n: 34, p: 0, k: 3, ca: 4, mg: 1, s: 4, zn: 0.1 },
    crops: ["maize", "wheat", "barley", "sorghum", "sugarcane", "cereals"],
    description: "High nitrogen with potassium and micronutrients",
    packageSizes: ["50kg bag (Ksh 3,000)", "50kg bag (Ksh 3,200)"],
    pricePer50kg: 3100,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting"
  },

  {
    id: "yara_bela_sulfan",
    brand: "Yara Bela Sulfan",
    company: "YARA",
    type: "topdressing",
    npk: "24-0-0",
    nutrients: { n: 24, p: 0, k: 0, s: 6 },
    crops: [
      "maize", "wheat", "barley", "onions", "garlic", "cabbages",
      "potatoes", "tea", "cereals", "vegetables",
      "sugarcane", "coffee"
    ],
    description: "Nitrogen with sulphur - ideal for crops needing both",
    packageSizes: ["50kg bag (Ksh 2,800)", "50kg bag (Ksh 3,000)"],
    pricePer50kg: 2900,
    applicationRate: "50-100 kg/acre",
    timing: "4-6 weeks after planting"
  },

  {
    id: "yara_npk_15_15_15",
    brand: "Yara NPK 15-15-15",
    company: "YARA",
    type: "topdressing",
    npk: "15-15-15",
    nutrients: { n: 15, p: 15, k: 15, s: 2, mg: 1.2 },
    crops: [
      "tomatoes", "capsicums", "chillies", "onions", "cabbages", "kales",
      "spinach", "okra", "french beans", "garden peas", "vegetables",
      "fruits", "general", "all crops"
    ],
    description: "Balanced NPK for general top dressing",
    packageSizes: ["50kg bag (Ksh 3,200)", "50kg bag (Ksh 3,400)"],
    pricePer50kg: 3300,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting, repeat after 4 weeks"
  },

  // ========== ELGON TOP DRESSING ==========
  {
    id: "elgon_thabiti_top_40",
    brand: "Thabiti Top Dressing Cereal",
    company: "ELGON",
    type: "topdressing",
    npk: "40-0-0",
    nutrients: { n: 40, p: 0, k: 0, s: 6.5 },
    crops: ["maize", "sorghum", "finger millet", "wheat", "barley", "rice", "cereals"],
    description: "High nitrogen for cereals with sulphur",
    packageSizes: ["50kg bag (Ksh 2,900)", "50kg bag (Ksh 3,100)"],
    pricePer50kg: 3000,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting"
  },

  {
    id: "elgon_thabiti_top_potato",
    brand: "Thabiti Top Dressing Potato",
    company: "ELGON",
    type: "topdressing",
    npk: "24-0-24",
    nutrients: { n: 24, p: 0, k: 24, s: 4, ca: 1, mg: 0.2, zn: 0.1, b: 0.1, mn: 0.1 },
    crops: ["potatoes", "yams", "taro", "cassava", "sweet potatoes", "tubers",
            "irish potatoes", "ginger", "turmeric", "horseradish", "parsnip"],
    description: "Balanced NK for potatoes and tuber crops",
    packageSizes: ["50kg bag (Ksh 3,200)", "50kg bag (Ksh 3,400)"],
    pricePer50kg: 3300,
    applicationRate: "100-150 kg/acre",
    timing: "At tuber initiation stage"
  },

  {
    id: "elgon_thabiti_top_sugar",
    brand: "Thabiti Top Dressing Sugar Cane",
    company: "ELGON",
    type: "topdressing",
    npk: "26-0-20",
    nutrients: { n: 26, p: 0, k: 20, s: 2, ca: 2, zn: 0.5 },
    crops: ["sugarcane"],
    description: "High nitrogen and potassium for sugarcane",
    packageSizes: ["50kg bag (Ksh 3,100)", "50kg bag (Ksh 3,300)"],
    pricePer50kg: 3200,
    applicationRate: "100-150 kg/acre",
    timing: "At tillering and grand growth stage"
  },

  {
    id: "elgon_thabiti_top_veg",
    brand: "Thabiti Top Dressing Vegetables",
    company: "ELGON",
    type: "topdressing",
    npk: "20-0-15",
    nutrients: { n: 20, p: 0, k: 15, s: 2, mg: 1, zn: 0.2, b: 0.1 },
    crops: [
      "tomatoes", "onions", "cabbages", "kales", "capsicums", "chillies",
      "spinach", "okra", "french beans", "garden peas", "carrots", "vegetables",
      "african nightshade", "amaranth", "arugula", "asparagus", "beetroot",
      "broccoli", "brinjals", "cauliflower", "celery", "coriander",
      "courgettes", "cucumbers", "eggplants", "endive", "ethiopian kale",
      "green beans", "kohlrabi", "leeks", "lettuce", "parsley",
      "pumpkin leaves", "radish", "rhubarb", "spider plant", "sweet potato leaves",
      "turnip", "watercress", "bok choy", "collard greens", "mustard greens",
      "swiss chard", "radicchio", "escarole", "frisee", "turnip greens",
      "rutabaga", "jute mallow", "slender leaf", "artichoke", "wasabi"
    ],
    description: "NK blend for vegetable crops",
    packageSizes: ["50kg bag (Ksh 3,000)", "50kg bag (Ksh 3,200)"],
    pricePer50kg: 3100,
    applicationRate: "50-100 kg/acre",
    timing: "4-6 weeks after planting, repeat every 3-4 weeks"
  },

  {
    id: "elgon_thabiti_top_fruit",
    brand: "Thabiti Top Dressing Fruit",
    company: "ELGON",
    type: "topdressing",
    npk: "15-0-25",
    nutrients: { n: 15, p: 0, k: 25, s: 2, mg: 1.5, zn: 0.3, b: 0.2 },
    crops: [
      "bananas", "oranges", "mangoes", "avocados", "pineapples", "pawpaws",
      "passion fruit", "citrus", "watermelons", "macadamia", "fruits",
      "breadfruit", "coconut", "grapefruit", "guava", "jackfruit",
      "lemons", "limes", "pomegranate", "star fruit", "pumpkin",
      "almond", "cashew", "pecan", "pistachio", "walnut", "shea",
      "fig", "date palm", "mulberry", "lychee", "persimmon", "gooseberry",
      "currant", "elderberry", "rambutan", "durian", "mangosteen", "longan", "marula"
    ],
    description: "High potassium for fruit development and quality",
    packageSizes: ["50kg bag (Ksh 3,400)", "50kg bag (Ksh 3,600)"],
    pricePer50kg: 3500,
    applicationRate: "200-500g per tree",
    timing: "At flowering and fruit development stages"
  },

  // ========== ETG TOP DRESSING ==========
  {
    id: "etg_kynogrowmax",
    brand: "KynoGrowMax",
    company: "ETG",
    type: "topdressing",
    npk: "30-0-10",
    nutrients: { n: 30, p: 0, k: 10, s: 4, b: 0.3, ca: 2, mg: 1 },
    crops: ["maize", "sorghum", "wheat", "rice", "cereals", "grasses"],
    description: "Nitrogen and potassium with boron",
    packageSizes: ["50kg bag (Ksh 3,000)", "50kg bag (Ksh 3,200)"],
    pricePer50kg: 3100,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting"
  },

  {
    id: "etg_falcon_urea",
    brand: "Falcon Urea",
    company: "ETG",
    type: "topdressing",
    npk: "46-0-0",
    nutrients: { n: 46, p: 0, k: 0 },
    crops: ["maize", "wheat", "barley", "sugarcane", "cereals", "all crops"],
    description: "Pure urea - highest nitrogen content",
    packageSizes: ["50kg bag (Ksh 2,850)", "50kg bag (Ksh 2,950)"],
    pricePer50kg: 2900,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting, incorporate into soil"
  },

  {
    id: "etg_kyno_top_nk",
    brand: "Kyno Top NK",
    company: "ETG",
    type: "topdressing",
    npk: "20-0-20",
    nutrients: { n: 20, p: 0, k: 20, s: 2, mg: 1, zn: 0.2 },
    crops: [
      "potatoes", "sweet potatoes", "cassava", "yams", "taro", "tubers",
      "bananas", "pineapples", "fruits",
      "ginger", "turmeric", "horseradish", "parsnip", "irish potatoes"
    ],
    description: "Balanced NK for tuber and fruit crops",
    packageSizes: ["50kg bag (Ksh 3,200)", "50kg bag (Ksh 3,400)"],
    pricePer50kg: 3300,
    applicationRate: "75-100 kg/acre",
    timing: "At tuber initiation or flowering stage"
  },

  {
    id: "etg_kyno_sulphur",
    brand: "Kyno Sulphur",
    company: "ETG",
    type: "topdressing",
    npk: "0-0-0",
    nutrients: { s: 90 },
    crops: [
      "onions", "garlic", "cabbages", "tea", "coffee", "oil crops",
      "mustard", "rapeseed", "safflower", "broccoli", "cauliflower",
      "kales", "spinach", "leeks"
    ],
    description: "Pure sulphur for crops with high S requirement",
    packageSizes: ["50kg bag (Ksh 2,500)", "50kg bag (Ksh 2,700)"],
    pricePer50kg: 2600,
    applicationRate: "25-50 kg/acre",
    timing: "At planting or early growth"
  },

  // ========== POTASSIUM FERTILIZERS ==========
  {
    id: "mop",
    brand: "MOP",
    company: "Various",
    type: "topdressing",
    npk: "0-0-60",
    nutrients: { n: 0, p: 0, k: 60 },
    crops: [
      "potatoes", "tomatoes", "onions", "bananas", "oranges", "mangoes",
      "avocados", "pineapples", "watermelons", "macadamia", "coffee",
      "sugarcane", "cocoa", "fruits", "vegetables", "all crops",
      "yams", "taro", "cassava", "sweet potatoes", "ginger", "turmeric",
      "pumpkin", "cucumbers", "eggplants", "capsicums", "chillies",
      "pigeonpeas", "beans", "soya beans", "groundnuts",
      "almond", "cashew", "pecan", "pistachio", "walnut", "shea",
      "fig", "date palm", "lychee", "rambutan", "durian", "mangosteen"
    ],
    description: "Muriate of Potash - high potassium for fruit and tuber development",
    packageSizes: ["50kg bag (Ksh 2,800)", "50kg bag (Ksh 2,900)"],
    pricePer50kg: 2850,
    applicationRate: "25-100 kg/acre depending on crop",
    timing: "At flowering, fruit set, or tuber initiation"
  },

  {
    id: "sop",
    brand: "SOP",
    company: "Various",
    type: "topdressing",
    npk: "0-0-50",
    nutrients: { n: 0, p: 0, k: 50, s: 18 },
    crops: [
      "potatoes", "tomatoes", "onions", "garlic", "capsicums", "chillies",
      "fruits", "vegetables", "tobacco", "horticulture",
      "cocoa", "coffee", "tea", "macadamia", "cashew",
      "avocados", "mangoes", "oranges", "lemons", "limes", "grapefruit",
      "passion fruit", "guava", "pineapples"
    ],
    description: "Sulphate of Potash - potassium with sulphur, chloride-free",
    packageSizes: ["50kg bag (Ksh 3,200)", "50kg bag (Ksh 3,400)"],
    pricePer50kg: 3300,
    applicationRate: "25-75 kg/acre",
    timing: "At flowering and fruit development"
  },

  {
    id: "kplus_korn_kali",
    brand: "Korn-Kali",
    company: "KPLUS",
    type: "topdressing",
    npk: "0-0-40",
    nutrients: { n: 0, p: 0, k: 40, mg: 6, s: 5, na: 3, b: 0.25 },
    crops: [
      "potatoes", "sugarcane", "bananas", "pineapples", "coffee",
      "fruits", "vegetables", "all crops"
    ],
    description: "Potassium with magnesium and sulphur - complete K source",
    packageSizes: ["50kg bag (Ksh 2,900)", "50kg bag (Ksh 3,100)"],
    pricePer50kg: 3000,
    applicationRate: "50-100 kg/acre",
    timing: "At flowering and fruit development"
  },

  {
    id: "kplus_patentkali",
    brand: "Patentkali",
    company: "KPLUS",
    type: "topdressing",
    npk: "0-0-30",
    nutrients: { n: 0, p: 0, k: 30, mg: 10, s: 17 },
    crops: [
      "potatoes", "tomatoes", "capsicums", "chillies", "onions",
      "fruits", "vegetables", "horticulture"
    ],
    description: "Potassium with high magnesium and sulphur",
    packageSizes: ["50kg bag (Ksh 3,000)", "50kg bag (Ksh 3,200)"],
    pricePer50kg: 3100,
    applicationRate: "50-75 kg/acre",
    timing: "At flowering and fruit development"
  },

  // ========== CROP-SPECIFIC SPECIALTY FERTILIZERS ==========
  // Rice
  {
    id: "mea_rice_top",
    brand: "MEA Rice Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "30-0-0",
    nutrients: { n: 30, p: 0, k: 0, zn: 1 },
    crops: ["rice"],
    description: "High nitrogen with zinc for rice",
    packageSizes: ["50kg bag (Ksh 3,000)", "50kg bag (Ksh 3,200)"],
    pricePer50kg: 3100,
    applicationRate: "50-75 kg/acre",
    timing: "At tillering and panicle initiation"
  },

  // Pineapple
  {
    id: "mea_pineapple_top",
    brand: "MEA Pineapple Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "12-0-18",
    nutrients: { n: 12, p: 0, k: 18, mg: 2, zn: 0.3 },
    crops: ["pineapples"],
    description: "High potassium for pineapple fruit development",
    packageSizes: ["50kg bag (Ksh 3,500)", "50kg bag (Ksh 3,700)"],
    pricePer50kg: 3600,
    applicationRate: "150-200 kg/acre split",
    timing: "At 6 months and 12 months after planting"
  },

  // Tea
  {
    id: "mea_tea_top",
    brand: "MEA Tea Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "25-0-5",
    nutrients: { n: 25, p: 0, k: 5, s: 3, mg: 1 },
    crops: ["tea"],
    description: "High nitrogen for tea with potassium and sulphur",
    packageSizes: ["50kg bag (Ksh 3,200)", "50kg bag (Ksh 3,400)"],
    pricePer50kg: 3300,
    applicationRate: "100-200 kg/acre annually",
    timing: "Split during rainy seasons"
  },

  // Coffee
  {
    id: "mea_coffee_top",
    brand: "MEA Coffee Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "17-0-17",
    nutrients: { n: 17, p: 0, k: 17, s: 2, mg: 1.5, zn: 0.2, b: 0.1 },
    crops: ["coffee"],
    description: "Balanced NK for coffee with micronutrients",
    packageSizes: ["50kg bag (Ksh 3,400)", "50kg bag (Ksh 3,600)"],
    pricePer50kg: 3500,
    applicationRate: "150-250g per tree",
    timing: "At flowering and after harvest"
  },

  // Macadamia
  {
    id: "mea_macadamia_top",
    brand: "MEA Macadamia Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "12-0-20",
    nutrients: { n: 12, p: 0, k: 20, s: 2, mg: 2, zn: 0.3, b: 0.2 },
    crops: ["macadamia"],
    description: "High potassium for nut development",
    packageSizes: ["50kg bag (Ksh 3,800)", "50kg bag (Ksh 4,000)"],
    pricePer50kg: 3900,
    applicationRate: "200-400g per tree",
    timing: "At flowering and nut fill"
  },

  // Cocoa
  {
    id: "mea_cocoa_top",
    brand: "MEA Cocoa Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "15-0-15",
    nutrients: { n: 15, p: 0, k: 15, mg: 1.5, zn: 0.2 },
    crops: ["cocoa"],
    description: "Balanced NK for cocoa pod development",
    packageSizes: ["50kg bag (Ksh 3,500)", "50kg bag (Ksh 3,700)"],
    pricePer50kg: 3600,
    applicationRate: "150-200g per tree",
    timing: "At flowering and pod filling"
  },

  // Watermelon
  {
    id: "mea_watermelon_top",
    brand: "MEA Watermelon Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "15-0-20",
    nutrients: { n: 15, p: 0, k: 20, mg: 1.5, zn: 0.2, b: 0.1 },
    crops: ["watermelons"],
    description: "High potassium for fruit sweetness and size",
    packageSizes: ["50kg bag (Ksh 3,600)", "50kg bag (Ksh 3,800)"],
    pricePer50kg: 3700,
    applicationRate: "50-75 kg/acre",
    timing: "At flowering and fruit set"
  },

  // Carrots
  {
    id: "mea_carrots_top",
    brand: "MEA Carrots Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "15-0-20",
    nutrients: { n: 15, p: 0, k: 20, s: 2, b: 0.2 },
    crops: ["carrots"],
    description: "High potassium for root development",
    packageSizes: ["50kg bag (Ksh 3,400)", "50kg bag (Ksh 3,600)"],
    pricePer50kg: 3500,
    applicationRate: "50-75 kg/acre",
    timing: "4-6 weeks after planting"
  },

  // Chillies
  {
    id: "mea_chillies_top",
    brand: "MEA Chillies Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "15-0-20",
    nutrients: { n: 15, p: 0, k: 20, mg: 1.5, zn: 0.2, b: 0.1 },
    crops: ["chillies", "capsicums", "birds eye chili", "cayenne", "jalapeno"],
    description: "High potassium for fruit quality and heat",
    packageSizes: ["50kg bag (Ksh 3,600)", "50kg bag (Ksh 3,800)"],
    pricePer50kg: 3700,
    applicationRate: "50-75 kg/acre",
    timing: "At flowering and fruit set"
  },

  // Onions
  {
    id: "mea_onions_top",
    brand: "MEA Onions Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "20-0-15",
    nutrients: { n: 20, p: 0, k: 15, s: 3, zn: 0.2 },
    crops: ["onions", "garlic", "leeks", "shallots"],
    description: "NK blend for bulb development with sulphur",
    packageSizes: ["50kg bag (Ksh 3,300)", "50kg bag (Ksh 3,500)"],
    pricePer50kg: 3400,
    applicationRate: "50-75 kg/acre",
    timing: "At bulb initiation stage"
  },

  // Tomatoes
  {
    id: "mea_tomatoes_top",
    brand: "MEA Tomatoes Topdressing",
    company: "MEA Fertilizers",
    type: "topdressing",
    npk: "15-0-20",
    nutrients: { n: 15, p: 0, k: 20, ca: 3, mg: 1.5, zn: 0.2, b: 0.1 },
    crops: ["tomatoes"],
    description: "High potassium with calcium for blossom end rot prevention",
    packageSizes: ["50kg bag (Ksh 3,500)", "50kg bag (Ksh 3,700)"],
    pricePer50kg: 3600,
    applicationRate: "50-75 kg/acre",
    timing: "At flowering and fruit set"
  }
];

// Helper function to get top dressing fertilizers by crop (expanded to cover all 219 crops)
export function getTopDressingFertilizersByCrop(crop: string): Fertilizer[] {
  const lowerCrop = crop.toLowerCase();

  return topDressingFertilizers.filter(f => {
    // Direct match
    if (f.crops.includes(lowerCrop)) return true;

    // All crops
    if (f.crops.includes("all crops")) return true;
    if (f.crops.includes("general")) return true;

    // Cereals
    const cereals = [
      "maize", "sorghum", "finger millet", "wheat", "barley", "rice", "millet",
      "oats", "teff", "triticale", "buckwheat", "quinoa", "fonio", "spelt", "kamut",
      "amaranth grain"
    ];
    if (cereals.includes(lowerCrop) && f.crops.includes("cereals")) return true;

    // Vegetables (all leafy, fruit, root vegetables)
    const vegetables = [
      "tomatoes", "kales", "cabbages", "onions", "capsicums", "chillies", "spinach",
      "okra", "french beans", "garden peas", "carrots", "african nightshade",
      "amaranth", "arugula", "asparagus", "beetroot", "broccoli", "brinjals",
      "cauliflower", "celery", "coriander", "courgettes", "cucumbers", "eggplants",
      "endive", "ethiopian kale", "green beans", "kohlrabi", "leeks", "lettuce",
      "parsley", "pumpkin leaves", "radish", "rhubarb", "spider plant",
      "sweet potato leaves", "turnip", "watercress", "bok choy", "collard greens",
      "mustard greens", "swiss chard", "radicchio", "escarole", "frisee",
      "turnip greens", "rutabaga", "jute mallow", "slender leaf", "artichoke",
      "wasabi", "garlic", "shallots", "chives"
    ];
    if (vegetables.includes(lowerCrop) && (f.crops.includes("vegetables") || f.id === "elgon_thabiti_top_veg" || f.id === "ss_can" || f.id === "yara_npk_15_15_15")) return true;

    // Fruits (all tropical and temperate)
    const fruits = [
      "bananas", "oranges", "mangoes", "avocados", "pineapples", "pawpaws",
      "passion fruit", "citrus", "watermelons", "breadfruit", "coconut",
      "grapefruit", "guava", "jackfruit", "lemons", "limes", "pomegranate",
      "star fruit", "pumpkin", "papayas", "fig", "date palm", "mulberry",
      "lychee", "persimmon", "gooseberry", "currant", "elderberry", "rambutan",
      "durian", "mangosteen", "longan", "marula"
    ];
    if (fruits.includes(lowerCrop) && (f.crops.includes("fruits") || f.id === "elgon_thabiti_top_fruit" || f.id === "mop" || f.id === "sop")) return true;

    // Tree nuts
    const nuts = [
      "macadamia", "cashew", "almond", "brazil nut", "chestnut", "hazelnut",
      "pecan", "pistachio", "shea", "walnut", "pili nut"
    ];
    if (nuts.includes(lowerCrop) && (f.crops.includes("fruits") || f.id === "mea_macadamia_top" || f.id === "mop" || f.id === "sop")) return true;

    // Tubers and root crops
    const tubers = [
      "potatoes", "irish potatoes", "sweet potatoes", "cassava", "yams", "taro",
      "ginger", "turmeric", "horseradish", "parsnip"
    ];
    if (tubers.includes(lowerCrop) && (f.crops.includes("tubers") || f.id === "elgon_thabiti_top_potato" || f.id === "etg_kyno_top_nk")) return true;

    // Cash crops
    const cash = ["coffee", "tea", "cocoa", "cotton", "sugarcane", "tobacco", "pyrethrum", "sisal", "oil palm", "rubber"];
    if (cash.includes(lowerCrop) && (f.crops.includes("coffee") || f.crops.includes("tea") || f.id === "mea_coffee_top" || f.id === "mea_tea_top" || f.id === "elgon_thabiti_top_sugar")) return true;

    // Oil crops
    const oilCrops = ["sunflower", "rapeseed", "safflower", "sesame", "simsim", "mustard"];
    if (oilCrops.includes(lowerCrop) && (f.crops.includes("oil crops") || f.id === "ss_as" || f.id === "yara_bela_sulfan")) return true;

    // Herbs and spices
    const herbs = [
      "basil", "mint", "rosemary", "thyme", "oregano", "sage", "lavender",
      "chamomile", "echinacea", "ginseng", "goldenseal", "hibiscus", "hops",
      "lemon grass", "moringa", "stevia", "fenugreek", "cumin", "caraway",
      "anise", "dill", "fennel", "lovage", "marjoram", "tarragon", "sorrel",
      "chervil", "savory", "calendula", "nasturtium", "borage", "st. john's wort",
      "valerian", "vanilla", "black pepper", "cardamom", "cinnamon", "cloves",
      "wasabi", "coriander", "parsley"
    ];
    if (herbs.includes(lowerCrop) && (f.crops.includes("vegetables") || f.id === "ss_can" || f.id === "elgon_thabiti_top_veg")) return true;

    // Forage and cover crops
    const forage = [
      "alfalfa", "lucerne", "clover", "white clover", "vetch", "mucuna",
      "desmodium", "dolichos", "canavalia", "crotalaria paulina", "sunn hemp",
      "brachiaria", "buffel grass", "guinea grass", "italian ryegrass",
      "napier grass", "napier hybrid", "orchard grass", "rhodes grass",
      "timothy grass", "forage sorghum", "calliandra", "leucaena", "sesbania", "cenchrus"
    ];
    if (forage.includes(lowerCrop) && (f.crops.includes("cereals") || f.id === "ss_urea" || f.id === "ss_can")) return true;

    // Other crops
    const other = ["mushroom", "bamboo", "aloe vera", "stinging nettle", "oyster nut", "ramie", "flax", "hemp", "jute", "kenaf"];
    if (other.includes(lowerCrop) && (f.id === "ss_can" || f.id === "ss_urea")) return true;

    return false;
  });
}

// Helper function to get top dressing fertilizer by ID
export function getTopDressingFertilizerById(id: string): Fertilizer | undefined {
  return topDressingFertilizers.find(f => f.id === id);
}

// Helper function to get potassium fertilizers (MOP, SOP, etc.)
export function getPotassiumFertilizers(): Fertilizer[] {
  return topDressingFertilizers.filter(f =>
    f.id.includes("mop") ||
    f.id.includes("sop") ||
    f.id.includes("kplus") ||
    f.nutrients.k > 30
  );
}

// Helper function to get recommended top dressing for specific crop and growth stage
export function getRecommendedTopDressing(
  crop: string,
  stage: "vegetative" | "flowering" | "fruiting" | "tuber" = "vegetative"
): Fertilizer[] {
  const allForCrop = getTopDressingFertilizersByCrop(crop);

  // Filter based on growth stage
  return allForCrop.filter(f => {
    if (stage === "vegetative" && f.nutrients.n > 25) return true;
    if (stage === "flowering" && f.nutrients.k > 15) return true;
    if (stage === "fruiting" && f.nutrients.k > 20) return true;
    if (stage === "tuber" && f.nutrients.k > 20) return true;
    return false;
  });
}