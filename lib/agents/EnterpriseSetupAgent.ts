// lib/agents/EnterpriseSetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";
import { cropSpacingOptions } from "@/lib/data/spacing";

/**
 * Normalize crop name: convert underscores to spaces, lower case, trim.
 * Example: "african_nightshade" → "african nightshade"
 */
function normalizeCropKey(crop: string): string {
  return crop.toLowerCase().replace(/_/g, ' ').trim();
}

/**
 * Build spacing options for the given crop from the spacing database.
 * Returns an array of { label, value } for the select input.
 */
function getSpacingOptionsForCrop(cropKey: string): { label: string; value: string }[] {
  const normalized = normalizeCropKey(cropKey);
  console.log(`🔍 Looking for spacing for crop: "${normalized}"`); // DEBUG – can remove later
  const options = cropSpacingOptions[normalized] || [];
  if (options.length === 0) {
    console.warn(`⚠️ No spacing data for "${normalized}" – using fallback.`);
    return [{ label: "Other (specify manually)", value: "other" }];
  }
  return options.map((opt) => ({
    label: `${opt.label} (${opt.plantsPerAcre.toLocaleString()} plants/acre)`,
    value: `${opt.rowCm}x${opt.plantCm}`,
  }));
}

export class EnterpriseSetupAgent extends BaseInterviewAgent {
  constructor() {
    super();

    // ---- Full list of questions ----
    this.questions = [
      // 1. Country
      {
        id: "country",
        type: "select",
        label: "Which country are you in?",
        options: [
          { value: "kenya", label: "Kenya" },
          { value: "uganda", label: "Uganda" },
          { value: "tanzania", label: "Tanzania" },
          { value: "rwanda", label: "Rwanda" },
          { value: "burundi", label: "Burundi" },
          { value: "south africa", label: "South Africa" },
          { value: "nigeria", label: "Nigeria" },
          { value: "ghana", label: "Ghana" },
          { value: "ethiopia", label: "Ethiopia" },
          { value: "zambia", label: "Zambia" },
          { value: "zimbabwe", label: "Zimbabwe" },
          { value: "malawi", label: "Malawi" },
        ],
        required: true,
      },
      // 2. Main Crop
      {
        id: "crops",
        type: "select",
        label: "What is your main crop?",
        options: [
          // ----- Cereals -----
          { value: "maize", label: "Maize" },
          { value: "rice", label: "Rice" },
          { value: "wheat", label: "Wheat" },
          { value: "barley", label: "Barley" },
          { value: "sorghum", label: "Sorghum" },
          { value: "millet", label: "Millet" },
          { value: "finger_millet", label: "Finger Millet" },
          { value: "oats", label: "Oats" },
          { value: "teff", label: "Teff" },
          { value: "quinoa", label: "Quinoa" },
          { value: "amaranth_grain", label: "Amaranth Grain" },
          { value: "buckwheat", label: "Buckwheat" },
          { value: "triticale", label: "Triticale" },
          // ----- Legumes / Pulses -----
          { value: "beans", label: "Beans" },
          { value: "soya_beans", label: "Soya Beans" },
          { value: "groundnuts", label: "Groundnuts" },
          { value: "cowpeas", label: "Cowpeas" },
          { value: "green_grams", label: "Green Grams" },
          { value: "pigeonpeas", label: "Pigeonpeas" },
          { value: "chickpea", label: "Chickpea" },
          { value: "lentil", label: "Lentil" },
          { value: "faba_bean", label: "Faba Bean" },
          { value: "bambaranuts", label: "Bambaranuts" },
          // ----- Vegetables -----
          { value: "tomatoes", label: "Tomatoes" },
          { value: "cabbages", label: "Cabbages" },
          { value: "kales", label: "Kales" },
          { value: "onions", label: "Onions" },
          { value: "carrots", label: "Carrots" },
          { value: "lettuce", label: "Lettuce" },
          { value: "spinach", label: "Spinach" },
          { value: "broccoli", label: "Broccoli" },
          { value: "cauliflower", label: "Cauliflower" },
          { value: "capsicums", label: "Capsicums" },
          { value: "chillies", label: "Chillies" },
          { value: "brinjals", label: "Brinjals" },
          { value: "cucumbers", label: "Cucumbers" },
          { value: "watermelons", label: "Watermelons" },
          { value: "pumpkin", label: "Pumpkin" },
          { value: "okra", label: "Okra" },
          { value: "celery", label: "Celery" },
          { value: "leeks", label: "Leeks" },
          { value: "radish", label: "Radish" },
          { value: "beetroot", label: "Beetroot" },
          { value: "courgettes", label: "Courgettes" },
          { value: "french_beans", label: "French Beans" },
          { value: "garden_peas", label: "Garden Peas" },
          { value: "african_nightshade", label: "African Nightshade" },
          { value: "amaranth", label: "Amaranth" },
          { value: "spider_plant", label: "Spider Plant" },
          { value: "jute_mallow", label: "Jute Mallow" },
          { value: "ethiopian_kale", label: "Ethiopian Kale" },
          { value: "pumpkin_leaves", label: "Pumpkin Leaves" },
          { value: "sweet_potato_leaves", label: "Sweet Potato Leaves" },
          { value: "slender_leaf", label: "Slender Leaf" },
          { value: "oyster_nut", label: "Oyster Nut" },
          // ----- Tubers & Roots -----
          { value: "cassava", label: "Cassava" },
          { value: "sweet_potatoes", label: "Sweet Potatoes" },
          { value: "irish_potatoes", label: "Irish Potatoes" },
          { value: "yams", label: "Yams" },
          { value: "taro", label: "Taro" },
          { value: "ginger", label: "Ginger" },
          { value: "turmeric", label: "Turmeric" },
          { value: "horseradish", label: "Horseradish" },
          { value: "parsnip", label: "Parsnip" },
          // ----- Fruits -----
          { value: "bananas", label: "Bananas" },
          { value: "mangoes", label: "Mangoes" },
          { value: "avocados", label: "Avocados" },
          { value: "oranges", label: "Oranges" },
          { value: "lemons", label: "Lemons" },
          { value: "limes", label: "Limes" },
          { value: "grapefruit", label: "Grapefruit" },
          { value: "pineapples", label: "Pineapples" },
          { value: "papayas", label: "Papayas" },
          { value: "passion_fruit", label: "Passion Fruit" },
          { value: "guava", label: "Guava" },
          { value: "jackfruit", label: "Jackfruit" },
          { value: "breadfruit", label: "Breadfruit" },
          { value: "pomegranate", label: "Pomegranate" },
          { value: "star_fruit", label: "Star Fruit" },
          { value: "coconut", label: "Coconut" },
          { value: "fig", label: "Fig" },
          { value: "date_palm", label: "Date Palm" },
          { value: "mulberry", label: "Mulberry" },
          { value: "lychee", label: "Lychee" },
          { value: "persimmon", label: "Persimmon" },
          { value: "gooseberry", label: "Gooseberry" },
          { value: "currant", label: "Currant" },
          { value: "elderberry", label: "Elderberry" },
          { value: "rambutan", label: "Rambutan" },
          { value: "durian", label: "Durian" },
          { value: "mangosteen", label: "Mangosteen" },
          { value: "longan", label: "Longan" },
          { value: "marula", label: "Marula" },
          // ----- Nuts & Oils -----
          { value: "macadamia", label: "Macadamia" },
          { value: "cashew", label: "Cashew" },
          { value: "almond", label: "Almond" },
          { value: "walnut", label: "Walnut" },
          { value: "pecan", label: "Pecan" },
          { value: "pistachio", label: "Pistachio" },
          { value: "brazil_nut", label: "Brazil Nut" },
          { value: "chestnut", label: "Chestnut" },
          { value: "hazelnut", label: "Hazelnut" },
          { value: "shea", label: "Shea" },
          { value: "pili_nut", label: "Pili Nut" },
          { value: "sunflower", label: "Sunflower" },
          { value: "sesame", label: "Sesame" },
          { value: "simsim", label: "Simsim" },
          { value: "rapeseed", label: "Rapeseed" },
          { value: "safflower", label: "Safflower" },
          { value: "peanut", label: "Peanut" },
          // ----- Cash Crops -----
          { value: "coffee", label: "Coffee" },
          { value: "tea", label: "Tea" },
          { value: "sugarcane", label: "Sugarcane" },
          { value: "cotton", label: "Cotton" },
          { value: "tobacco", label: "Tobacco" },
          { value: "pyrethrum", label: "Pyrethrum" },
          { value: "sisal", label: "Sisal" },
          { value: "cocoa", label: "Cocoa" },
          { value: "oil_palm", label: "Oil Palm" },
          { value: "rubber", label: "Rubber" },
          // ----- Herbs & Spices -----
          { value: "basil", label: "Basil" },
          { value: "mint", label: "Mint" },
          { value: "rosemary", label: "Rosemary" },
          { value: "thyme", label: "Thyme" },
          { value: "oregano", label: "Oregano" },
          { value: "sage", label: "Sage" },
          { value: "lavender", label: "Lavender" },
          { value: "chamomile", label: "Chamomile" },
          { value: "echinacea", label: "Echinacea" },
          { value: "ginseng", label: "Ginseng" },
          { value: "goldenseal", label: "Goldenseal" },
          { value: "moringa", label: "Moringa" },
          { value: "lemon_grass", label: "Lemon Grass" },
          { value: "coriander", label: "Coriander" },
          { value: "parsley", label: "Parsley" },
          { value: "dill", label: "Dill" },
          { value: "fennel", label: "Fennel" },
          { value: "tarragon", label: "Tarragon" },
          { value: "sorrel", label: "Sorrel" },
          { value: "chervil", label: "Chervil" },
          { value: "savory", label: "Savory" },
          { value: "calendula", label: "Calendula" },
          { value: "nasturtium", label: "Nasturtium" },
          { value: "borage", label: "Borage" },
          { value: "st_johns_wort", label: "St. John's Wort" },
          { value: "valerian", label: "Valerian" },
          { value: "stevia", label: "Stevia" },
          { value: "lovage", label: "Lovage" },
          { value: "marjoram", label: "Marjoram" },
          { value: "black_pepper", label: "Black Pepper" },
          { value: "vanilla", label: "Vanilla" },
          { value: "cardamom", label: "Cardamom" },
          { value: "cinnamon", label: "Cinnamon" },
          { value: "cloves", label: "Cloves" },
          { value: "fenugreek", label: "Fenugreek" },
          { value: "cumin", label: "Cumin" },
          { value: "caraway", label: "Caraway" },
          { value: "anise", label: "Anise" },
          { value: "mustard", label: "Mustard" },
          { value: "wasabi", label: "Wasabi" },
          // ----- Forage & Cover Crops -----
          { value: "napier_grass", label: "Napier Grass" },
          { value: "brachiaria", label: "Brachiaria" },
          { value: "rhodes_grass", label: "Rhodes Grass" },
          { value: "guinea_grass", label: "Guinea Grass" },
          { value: "buffel_grass", label: "Buffel Grass" },
          { value: "orchard_grass", label: "Orchard Grass" },
          { value: "timothy_grass", label: "Timothy Grass" },
          { value: "italian_ryegrass", label: "Italian Ryegrass" },
          { value: "white_clover", label: "White Clover" },
          { value: "clover", label: "Clover" },
          { value: "alfalfa", label: "Alfalfa" },
          { value: "lucerne", label: "Lucerne" },
          { value: "desmodium", label: "Desmodium" },
          { value: "leucaena", label: "Leucaena" },
          { value: "sesbania", label: "Sesbania" },
          { value: "calliandra", label: "Calliandra" },
          { value: "cenchrus", label: "Cenchrus" },
          { value: "forage_sorghum", label: "Forage Sorghum" },
          { value: "mucuna", label: "Mucuna" },
          { value: "canavalia", label: "Canavalia" },
          { value: "dolichos", label: "Dolichos" },
          { value: "sunn_hemp", label: "Sunn Hemp" },
          { value: "crotalaria_paulina", label: "Crotalaria Paulina" },
          { value: "vetch", label: "Vetch" },
          // ----- Other -----
          { value: "bamboo", label: "Bamboo" },
          { value: "mushroom", label: "Mushroom" },
          { value: "aloe_vera", label: "Aloe Vera" },
          { value: "hibiscus", label: "Hibiscus" },
          { value: "kenaf", label: "Kenaf" },
          { value: "jute", label: "Jute" },
          { value: "flax", label: "Flax" },
          { value: "hemp", label: "Hemp" },
          { value: "ramie", label: "Ramie" },
          { value: "hops", label: "Hops" },
          { value: "watercress", label: "Watercress" },
          { value: "artichoke", label: "Artichoke" },
          { value: "asparagus", label: "Asparagus" },
          { value: "rhubarb", label: "Rhubarb" },
          { value: "kohlrabi", label: "Kohlrabi" },
          { value: "endive", label: "Endive" },
          { value: "escarole", label: "Escarole" },
          { value: "frisee", label: "Frisee" },
          { value: "radicchio", label: "Radicchio" },
          { value: "rutabaga", label: "Rutabaga" },
          { value: "turnip", label: "Turnip" },
          { value: "turnip_greens", label: "Turnip Greens" },
          { value: "swiss_chard", label: "Swiss Chard" },
          { value: "mustard_greens", label: "Mustard Greens" },
          { value: "collard_greens", label: "Collard Greens" },
          { value: "bok_choy", label: "Bok Choy" },
          { value: "garlic", label: "Garlic" },
          { value: "shallots", label: "Shallots" },
          { value: "chives", label: "Chives" },
          { value: "cayenne", label: "Cayenne" },
          { value: "jalapeno", label: "Jalapeno" },
          { value: "birds_eye_chili", label: "Birds Eye Chili" },
          // Fallback
          { value: "other", label: "Other (specify)" },
        ],
        required: true,
      },
      // 3. Variety
      {
        id: "cropVarieties",
        type: "text",
        label: "Which variety are you growing? (e.g., H614)",
        placeholder: "e.g., H614",
        required: false,
      },
      // 4. Acres
      {
        id: "cropAcres",
        type: "number",
        label: "How many acres of this crop do you have?",
        placeholder: "e.g., 2.5",
        required: true,
        step: "any",
      },
      // 5. Season
      {
        id: "season",
        type: "select",
        label: "Which season is this crop for?",
        options: [
          { value: "long rains", label: "Long Rains" },
          { value: "short rains", label: "Short Rains" },
          { value: "dry season", label: "Dry Season" },
        ],
        required: false,
      },
      // 6. Planting Date
      {
        id: "plantingDate",
        type: "date",
        label: "When did you plant?",
        required: false,
      },
      // 7. Planting Material
      {
        id: "plantingMaterial",
        type: "select",
        label: "What type of planting material did you use?",
        options: [
          { value: "Seed", label: "Seed" },
          { value: "Seedlings", label: "Seedlings" },
          { value: "Cuttings", label: "Cuttings" },
          { value: "Tubers", label: "Tubers" },
          { value: "Suckers", label: "Suckers" },
          { value: "Other", label: "Other" },
        ],
        required: false,
      },
      // 8. Spacing – options filled dynamically
      {
        id: "spacing",
        type: "select",
        label: "What is your spacing? (row x plant)",
        options: [],
        required: false,
      },
      // 9. Seed Rate (kg/acre)
      {
        id: "seedRate",
        type: "number",
        label: "What is your seed rate (kg per acre)?",
        placeholder: "e.g., 10",
        required: false,
        step: "any",
      },
      // 10. Sale Date
      {
        id: "saleDate",
        type: "date",
        label: "When do you plan to sell?",
        required: false,
      },
      // ---- Personal / Location (these appear after financial section in UI) ----
      {
        id: "farmerName",
        type: "text",
        label: "What is your full name?",
        placeholder: "e.g., John Mugo",
        required: true,
      },
      {
        id: "county",
        type: "text",
        label: "Which county are you in?",
        placeholder: "e.g., Bungoma",
        required: true,
      },
      {
        id: "subCounty",
        type: "text",
        label: "Which sub‑county are you in? (optional)",
        placeholder: "e.g., Kimilili",
        required: false,
      },
      {
        id: "ward",
        type: "text",
        label: "Which ward are you in? (optional)",
        placeholder: "e.g., Kimilili",
        required: false,
      },
      {
        id: "village",
        type: "text",
        label: "Which village are you in? (optional)",
        placeholder: "e.g., Sikulu",
        required: false,
      },
    ];
  }

  /**
   * Override getVisibleQuestions to inject dynamic spacing options
   * based on the selected crop.
   */
  getVisibleQuestions(answers: Record<string, any>): InterviewQuestion[] {
    const crop = answers.crops || "maize";
    const spacingOptions = getSpacingOptionsForCrop(crop);

    return this.questions.map((q) => {
      if (q.id === "spacing") {
        return { ...q, options: spacingOptions };
      }
      return q;
    });
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "EnterpriseSetup",
      collectedData: this.answers,
      message: "Farm setup details collected.",
    };
  }

  getAgentKey(): string {
    return "EnterpriseSetupAgent";
  }

  getAgentName(): string {
    return "Enterprise Setup";
  }
}

// Also export as default for compatibility
export default EnterpriseSetupAgent;