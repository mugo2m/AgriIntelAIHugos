// lib/agents/EnterpriseSetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";
import {
  getVarietiesOptions,
  getPlantingMaterialQuestion,
  getPlantingQuantityQuestion,
  getSpacingOptions,
} from "./utils/cropUtils";

const COUNTRY_OPTIONS = [
  "algeria", "anguilla", "antigua and barbuda", "argentina", "australia",
  "bahamas", "barbados", "belgium", "belize", "benin", "bermuda", "bolivia",
  "bonaire", "botswana", "burkina faso", "burundi", "cameroon", "canada",
  "cape verde", "cayman islands", "central african republic", "chad", "chile",
  "colombia", "comoros", "congo (brazzaville)", "congo (kinshasa)", "costa rica",
  "cuba", "curacao", "djibouti", "dominica", "dominican republic", "ecuador",
  "egypt", "el salvador", "equatorial guinea", "eritrea", "eswatini", "ethiopia",
  "fiji", "france", "french guiana", "french polynesia", "gabon", "gambia",
  "ghana", "gibraltar", "grenada", "guadeloupe", "guam", "guatemala", "guernsey",
  "guinea", "guinea-bissau", "guyana", "haiti", "honduras", "india", "ireland",
  "isle of man", "ivory coast", "jamaica", "jersey", "kenya", "kiribati",
  "lesotho", "liberia", "libya", "luxembourg", "madagascar", "malawi", "malaysia",
  "maldives", "mali", "malta", "martinique", "mauritania", "mauritius", "mayotte",
  "mexico", "monaco", "montserrat", "morocco", "mozambique", "namibia",
  "new caledonia", "new zealand", "niger", "nigeria", "niue", "norfolk island",
  "panama", "papua new guinea", "paraguay", "peru", "philippines", "puerto rico",
  "reunion", "rwanda", "saint barthelemy", "saint kitts and nevis", "saint lucia",
  "saint martin", "saint pierre and miquelon", "saint vincent and the grenadines",
  "samoa", "sao tome and principe", "senegal", "seychelles", "sierra leone",
  "singapore", "sint maarten", "solomon islands", "somalia", "south africa",
  "south sudan", "spain", "sudan", "suriname", "switzerland", "tanzania", "togo",
  "tokelau", "trinidad and tobago", "tunisia", "turks and caicos islands",
  "tuvalu", "uganda", "united kingdom", "united states", "uruguay", "vanuatu",
  "venezuela", "zambia", "zimbabwe"
].sort((a, b) => a.localeCompare(b));

const CROP_OPTIONS = [
  "african nightshade", "alfalfa", "almond", "aloe vera", "amaranth", "amaranth grain",
  "anise", "artichoke", "arugula", "asparagus", "avocados", "bambaranuts", "bamboo",
  "bananas", "barley", "basil", "beans", "beetroot", "black pepper", "bok choy", "borage",
  "brachiaria", "brazil nut", "breadfruit", "brinjals", "broccoli", "buckwheat",
  "buffel grass", "cabbages", "calendula", "calliandra", "canavalia", "capsicums",
  "caraway", "cardamom", "carrots", "cashew", "cassava", "cauliflower", "cayenne",
  "celery", "cenchrus", "chamomile", "chervil", "chestnut", "chickpea", "chillies",
  "chives", "cinnamon", "clover", "cloves", "cocoa", "coconut", "coffee", "collard greens",
  "coriander", "cotton", "courgettes", "cowpeas", "crotalaria paulina", "cucumbers",
  "cumin", "currant", "date palm", "desmodium", "dill", "dolichos", "durian",
  "echinacea", "elderberry", "endive", "escarole", "ethiopian kale", "faba bean",
  "fennel", "fenugreek", "fig", "finger millet", "flax", "fonio", "forage sorghum",
  "french beans", "frisee", "garden peas", "garlic", "ginger", "ginseng", "goldenseal",
  "gooseberry", "grapefruit", "green grams", "groundnuts", "guava", "guinea grass",
  "hazelnut", "hemp", "hibiscus", "hops", "horseradish", "irish potatoes", "italian ryegrass",
  "jackfruit", "jalapeno", "jute", "jute mallow", "kales", "kamut", "kenaf", "kohlrabi",
  "lavender", "leeks", "lemon grass", "lemons", "lentil", "lettuce", "leucaena", "limes",
  "longan", "lovage", "lucerne", "lychee", "macadamia", "maize", "mangoes", "mangosteen",
  "marjoram", "marula", "millet", "mint", "moringa", "mucuna", "mulberry", "mushroom",
  "mustard", "mustard greens", "napier grass", "napier hybrid", "nasturtium", "oats",
  "oil palm", "okra", "onions", "oranges", "orchard grass", "oregano", "oyster nut",
  "parsley", "parsnip", "passion fruit", "pawpaws", "peanut", "pecan", "persimmon",
  "pigeonpeas", "pili nut", "pineapples", "pistachio", "pomegranate", "potatoes",
  "pumpkin", "pumpkin leaves", "pyrethrum", "quinoa", "radicchio", "radish", "rambutan",
  "ramie", "rapeseed", "rhodes grass", "rhubarb", "rice", "rosemary", "rubber",
  "rutabaga", "safflower", "sage", "savory", "sesame", "sesbania", "shallots", "shea",
  "simsim", "sisal", "slender leaf", "sorghum", "sorrel", "soya beans", "spelt", "spider plant",
  "spinach", "St. John's wort", "star fruit", "stevia", "stinging nettle", "sugarcane",
  "sunn hemp", "sunflower", "sweet potatoes", "sweet potato leaves", "Swiss chard",
  "tarragon", "taro", "tea", "teff", "thyme", "timothy grass", "tobacco", "tomatoes",
  "triticale", "turmeric", "turnip", "turnip greens", "valerian", "vanilla", "vetch",
  "walnut", "wasabi", "watercress", "watermelons", "wheat", "white clover", "yams"
].sort((a, b) => a.localeCompare(b));

const FOUNDATIONAL_QUESTIONS: InterviewQuestion[] = [
  {
    id: "country",
    type: "dropdown",
    questionKey: "question_country",
    options: COUNTRY_OPTIONS,
    sectionKey: "section_location"
  },
  {
    id: "farmerName",
    type: "text",
    questionKey: "question_farmer_name",
    placeholder: "e.g., John Mugo",
    sectionKey: "section_personal"
  },
  {
    id: "county",
    type: "text",
    questionKey: "question_county",
    placeholder: "e.g., Bungoma",
    sectionKey: "section_location"
  },
  {
    id: "subCounty",
    type: "text",
    questionKey: "question_sub_county",
    placeholder: "e.g., Kimilili",
    sectionKey: "section_location"
  },
  {
    id: "ward",
    type: "text",
    questionKey: "question_ward",
    placeholder: "e.g., Kimilili",
    sectionKey: "section_location"
  },
  {
    id: "village",
    type: "text",
    questionKey: "question_village",
    placeholder: "e.g., Sikulu",
    sectionKey: "section_location"
  },
  {
    id: "crops",
    type: "dropdown",
    questionKey: "question_crop_enterprise",
    options: CROP_OPTIONS,
    sectionKey: "section_crops"
  },
];

class EnterpriseSetupAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "EnterpriseSetupAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    const questions = [...FOUNDATIONAL_QUESTIONS];
    if (context.crops) {
      const crop = context.crops;
      const varietyOptions = getVarietiesOptions(crop);
      const spacingOptions = getSpacingOptions(crop);

      questions.push({
        id: "cropVarieties",
        type: varietyOptions.length > 0 ? "dropdown" : "text",
        questionKey: "question_crop_varieties",
        options: varietyOptions.length > 0 ? varietyOptions : undefined,
        placeholder: varietyOptions.length > 0 ? "Select variety" : "e.g., H614",
        sectionKey: "section_crops"
      });
      questions.push({
        id: "cropAcres",
        type: "number",
        questionKey: "question_crop_acres",
        placeholder: "e.g., 2.5",
        step: "any",
        sectionKey: "section_crops"
      });
      questions.push({
        id: "season",
        type: "dropdown",
        questionKey: "question_season",
        options: ["long rains", "short rains", "dry season"],
        sectionKey: "section_crops"
      });
      questions.push({
        id: "plantingDate",
        type: "date",
        questionKey: "question_planting_date",
        minDate: "2024-01-01",
        maxDate: new Date().toISOString().split('T')[0],
        sectionKey: "section_crops"
      });
      questions.push(getPlantingMaterialQuestion(crop));
      questions.push({
        id: "spacing",
        type: "dropdown",
        questionKey: "question_spacing",
        options: spacingOptions.map(s => s.label),
        sectionKey: "section_planting_density"
      });
      questions.push(getPlantingQuantityQuestion(crop));
      questions.push({
        id: "saleDate",
        type: "date",
        questionKey: "question_sale_date",
        minDate: new Date().toISOString().split('T')[0],
        maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sectionKey: "section_production"
      });
    }
    return questions;
  }
}

export default EnterpriseSetupAgent;