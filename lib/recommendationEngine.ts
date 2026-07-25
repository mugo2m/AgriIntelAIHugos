// lib/recommendationEngine.ts – Part 1 (Final – all fixes applied)
import { COUNTRY_CURRENCY_MAP } from '@/lib/config/currency';
import { cropPestDiseaseMap, PestDisease } from '@/lib/data/pestDiseaseMapping';
import swTranslations from '../public/locales/sw/common.json';
import frTranslations from '../public/locales/fr/common.json';
import esTranslations from '../public/locales/es/common.json';
import { getDeficienciesForCrop } from '@/lib/data/nutrientDeficiency';
const SW = swTranslations as any;
const FR = frTranslations as any;
const ES = esTranslations as any;
import { soilTestInterpreter } from './soilTestInterpreter';

// ===== POULTRY UTILITIES =====
import {
  getPoultryFeed,
  getPoultryVaccines,
  getPoultryCosts,
  getPoultryHousing,
  getPoultryTraits,
  getHatcheriesByCounty,
  getBiosecurityItems,
} from '@/lib/agents/utils/poultryUtils';
import { poultryDiseaseMap } from '@/lib/data/poultryDiseaseMap';

// ===== DAIRY UTILITIES =====
import { dairyPestDiseaseMap, DairyPestDisease } from '@/lib/data/dairyHealthMapping';

// ===== HELPERS (unchanged) =====
const safeT = (translation: any, fallback: string, ...args: any[]): string => {
  if (typeof translation === 'function') return translation(...args);
  let result = (translation as string) || fallback;
  for (let i = 0; i < args.length; i++) {
    result = result.replace(new RegExp(`\\{\\{${i}\\}\\}`, 'g'), args[i].toString());
    result = result.replace(new RegExp(`\\{\\{${i}\\?\\?.*?\\}\\}`, 'g'), args[i].toString());
  }
  return result;
};

const replacePlaceholders = (template: string | undefined, params: Record<string, string | number>): string => {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value.toString());
  }
  return result;
};

const translateDeficiencyFr = (text: string): string => {
  const map: Record<string, string> = {
    "Purple color": "Couleur violette",
    "Yellow leaves": "Feuilles jaunes",
    "Older leaves (bottom)": "Vieilles feuilles (bas)",
    "Younger leaves (top)": "Jeunes feuilles (haut)",
    "Whole plant": "Plante entière",
    "Fruits/flowers only": "Fruits/fleurs uniquement",
    "not specified": "non spécifié"
  };
  return map[text] || text;
};

const translateStorageFr = (method: string | undefined): string => {
  if (!method) return "";
  const map: Record<string, string> = {
    "Sold immediately": "Vendu immédiatement",
    "Store in bags": "Stockage en sacs",
    "Refrigerated storage": "Stockage réfrigéré",
    "In-ground storage": "Stockage en terre"
  };
  return map[method] || method;
};

const translateRate = (rate: string, lang: string): string => {
  if (lang === 'es') return rate;
  const map: Record<string, Record<string, string>> = {
    sw: {
      "10ml per 20L water": "10 mililita kwa lita 20 za maji",
      "50g per 20L water": "50 gramu kwa lita 20 za maji",
      "40ml per 20L water": "40 mililita kwa lita 20 za maji",
      "20ml per 20L water": "20 mililita kwa lita 20 za maji",
      "4ml per 20L water": "4 mililita kwa lita 20 za maji",
      "5ml per 20L water": "5 mililita kwa lita 20 za maji",
      "30g per 20L water": "30 gramu kwa lita 20 za maji",
      "15g per 20L water": "15 gramu kwa lita 20 za maji"
    },
    fr: {
      "10ml per 20L water": "10 ml pour 20 L d'eau",
      "50g per 20L water": "50 g pour 20 L d'eau",
      "40ml per 20L water": "40 ml pour 20 L d'eau",
      "20ml per 20L water": "20 ml pour 20 L d'eau",
      "4ml per 20L water": "4 ml pour 20 L d'eau",
      "5ml per 20L water": "5 ml pour 20 L d'eau",
      "30g per 20L water": "30 g pour 20 L d'eau",
      "15g per 20L water": "15 g pour 20 L d'eau"
    }
  };
  return map[lang]?.[rate] || rate;
};

const translateTiming = (timing: string, lang: string): string => {
  if (lang === 'es') return timing;
  const map: Record<string, Record<string, string>> = {
    sw: {
      "When larvae young (1st-2nd instar)": "Wakati mabuu ni wachanga (1-2)",
      "When larvae young": "Wakati mabuu ni wachanga",
      "At first sign of larvae": "Wakati dalili za mabuu zinaonekana",
      "When larvae active": "Wakati mabuu wanashambulia",
      "When colonies appear": "Wakati makundi yanaonekana",
      "When aphids appear": "Wakati vidukari wanaonekana",
      "When webbing visible": "Wakati utando unaonekana",
      "When flies active": "Wakati nzi wanashambulia",
      "At first sign of disease, repeat every 7-10 days": "Dalili za kwanza za ugonjwa, rudia kila siku 7-10",
      "Every 7-10 days in wet weather": "Kila siku 7-10 wakati wa mvua",
      "At first sign of spots": "Wakati madoa yanaonekana",
      "Preventatively, every 7-10 days": "Kinga, kila siku 7-10",
      "Preventatively": "Kinga"
    },
    fr: {
      "When larvae young (1st-2nd instar)": "Quand les larves sont jeunes (1er-2e stade)",
      "When larvae young": "Quand les larves sont jeunes",
      "At first sign of larvae": "Au premier signe de larves",
      "When larvae active": "Quand les larves sont actives",
      "When colonies appear": "Quand les colonies apparaissent",
      "When aphids appear": "Quand les pucerons apparaissent",
      "When webbing visible": "Quand les toiles sont visibles",
      "When flies active": "Quand les mouches sont actives",
      "At first sign of disease, repeat every 7-10 days": "Au premier signe de maladie, répéter tous les 7-10 jours",
      "Every 7-10 days in wet weather": "Tous les 7-10 jours par temps humide",
      "At first sign of spots": "Au premier signe de taches",
      "Preventatively, every 7-10 days": "Préventivement, tous les 7-10 jours",
      "Preventatively": "Préventivement"
    }
  };
  return map[lang]?.[timing] || timing;
};

const translateSafety = (safety: string, lang: string): string => {
  if (lang === 'es') return safety;
  const map: Record<string, Record<string, string>> = {
    sw: {
      "14 days": "siku kumi na nne",
      "7 days": "siku saba",
      "21 days": "siku ishirini na moja",
      "30 days": "siku thelathini",
      "14 days before harvest": "siku kumi na nne kabla ya mavuno",
      "7 days before harvest": "siku saba kabla ya mavuno"
    },
    fr: {
      "14 days": "14 jours",
      "7 days": "7 jours",
      "21 days": "21 jours",
      "30 days": "30 jours",
      "14 days before harvest": "14 jours avant la récolte",
      "7 days before harvest": "7 jours avant la récolte"
    }
  };
  return map[lang]?.[safety] || safety;
};

const translateStatus = (status: string, lang: string): string => {
  if (lang === 'es') return status;
  const map: Record<string, Record<string, string>> = {
    sw: {
      "✅ Active": "✅ Inatumika",
      "⚠️ RESTRICTED": "⚠️ IMERESTRISHWA",
      "❌ BANNED": "❌ IMEPIGWA MARUFUKU",
      "check-locally": "Angalia upatikanaji"
    },
    fr: {
      "✅ Active": "✅ Actif",
      "⚠️ RESTRICTED": "⚠️ RESTREINT",
      "❌ BANNED": "❌ INTERDIT",
      "check-locally": "Vérifiez la disponibilité locale"
    }
  };
  return map[lang]?.[status] || status;
};

const translateOrganic = (text: string, lang: string): string => {
  if (lang === 'es') return text;
  const map: Record<string, Record<string, string>> = {
    sw: {
      "Mix 50ml neem oil with 20L water + few drops liquid soap": "Changanya 50 mililita mafuta ya mwarobaini na lita 20 za maji + matone machache ya sabuni",
      "Spray every 10-14 days": "Pulizia kila siku 10-14",
      "Spray every 7-10 days": "Pulizia kila siku 7-10",
      "Spray on affected plants": "Pulizia kwenye mimea iliyoathirika",
      "Cover beds with insect netting": "Funika vitanda kwa nyavu za wadudu",
      "Remove heavily infested leaves": "Ondoa majani yaliyoathirika sana",
      "Avoid excess nitrogen fertilizer which attracts aphids": "Epuka mbolea ya nitrojeni nyingi kwa sababu huvutia vidukari",
      "Hand removal": "Kuondoa kwa mkono",
      "Neem spray": "Pulizia ya mwarobaini",
      "Soap solution": "Suluhisho la sabuni"
    },
    fr: {
      "Mix 50ml neem oil with 20L water + few drops liquid soap": "Mélanger 50 ml d'huile de neem avec 20 L d'eau + quelques gouttes de savon liquide",
      "Spray every 10-14 days": "Pulvériser tous les 10-14 jours",
      "Spray every 7-10 days": "Pulvériser tous les 7-10 jours",
      "Spray on affected plants": "Pulvériser sur les plantes affectées",
      "Cover beds with insect netting": "Couvrir les planches avec une moustiquaire",
      "Remove heavily infested leaves": "Retirer les feuilles fortement infestées",
      "Avoid excess nitrogen fertilizer which attracts aphids": "Éviter l'excès d'engrais azoté qui attire les pucerons",
      "Hand removal": "Retrait manuel",
      "Neem spray": "Pulvérisation de neem",
      "Soap solution": "Solution savonneuse"
    }
  };
  return map[lang]?.[text] || text;
};

const getNutrientDescription = (nutrient: string, language: string): string => {
  const n = nutrient.toLowerCase();
  if (language === 'sw') {
    if (n === 'n') return 'kwa ukuaji wa majani na shina';
    if (n === 'p') return 'kwa ukuaji wa mizizi na maua';
    if (n === 'k') return 'kwa ubora wa matunda, upinzani wa magonjwa, utamu, rangi nzuri, na maisha marefu ya rafu';
    if (n === 's') return 'kwa usanisi wa protini, rangi ya majani, ladha na harufu';
    if (n === 'ca') return 'kwa nguvu za seli, kuzuia uozo wa maua, na kuongeza maisha ya rafu';
    if (n === 'mg') return 'kwa usanisi wa klorofili (rangi ya kijani)';
    if (n === 'zn') return 'kwa uundaji wa homoni za ukuaji';
    if (n === 'b') return 'kwa ukuaji wa maua, uchavushaji, umbo zuri la matunda, na mvuto sokoni';
    if (n === 'cu') return 'kwa usanisi wa lignin (nguvu za mimea)';
    if (n === 'mn') return 'kwa usanisi wa klorofili na ulinzi wa seli';
    return '';
  }
  if (language === 'fr') {
    if (n === 'n') return 'pour la croissance des feuilles et tiges';
    if (n === 'p') return 'pour le développement des racines et fleurs';
    if (n === 'k') return 'pour la qualité des fruits, résistance aux maladies, douceur, couleur attrayante et durée de conservation';
    if (n === 's') return 'pour la synthèse des protéines, la couleur des feuilles, la saveur et l\'arôme';
    if (n === 'ca') return 'pour la solidité des parois cellulaires, prévention de la pourriture apicale, et prolongation de la conservation';
    if (n === 'mg') return 'pour la synthèse de la chlorophylle (couleur verte)';
    if (n === 'zn') return 'pour la formation des hormones de croissance';
    if (n === 'b') return 'pour la floraison, la pollinisation, la forme des fruits et l\'attrait du marché';
    if (n === 'cu') return 'pour la synthèse de la lignine (rigidité des tiges)';
    if (n === 'mn') return 'pour la photosynthèse et la protection cellulaire';
    return '';
  }
  if (language === 'es') {
    if (n === 'n') return 'para el crecimiento de hojas y tallos';
    if (n === 'p') return 'para el desarrollo de raíces y flores';
    if (n === 'k') return 'para la calidad de la fruta, resistencia a enfermedades, dulzura, color atractivo y mayor vida útil';
    if (n === 's') return 'para la síntesis de proteínas, color de las hojas, sabor y aroma';
    if (n === 'ca') return 'para la resistencia de la pared celular, prevención de la pudrición apical y prolongación de la conservación';
    if (n === 'mg') return 'para la síntesis de clorofila (color verde)';
    if (n === 'zn') return 'para la formación de hormonas de crecimiento';
    if (n === 'b') return 'para la floración, polinización, forma de la fruta y atractivo comercial';
    if (n === 'cu') return 'para la síntesis de lignina (resistencia del tallo)';
    if (n === 'mn') return 'para la fotosíntesis y protección celular';
    return '';
  }
  if (n === 'n') return 'for leafy growth';
  if (n === 'p') return 'for root development';
  if (n === 'k') return 'for fruit quality, disease resistance, sweetness, appealing colour, and longer shelf life';
  if (n === 's') return 'for protein synthesis, leaf colour, flavour and aroma';
  if (n === 'ca') return 'for cell wall strength, blossom end rot prevention, and extended shelf life';
  if (n === 'mg') return 'for chlorophyll synthesis (green colour)';
  if (n === 'zn') return 'for growth hormone formation';
  if (n === 'b') return 'for flowering, pollination, fruit shape, and improved market appeal';
  if (n === 'cu') return 'for lignin synthesis (stem strength)';
  if (n === 'mn') return 'for chlorophyll synthesis and cell protection';
  return '';
};

const formatNutrientString = (nutrientString: string | null, language: string): string => {
  if (!nutrientString || nutrientString === "No additional nutrients") return "";
  const pairs = nutrientString.split('+');
  const formatted = pairs.map(pair => {
    const match = pair.match(/(\d+(?:\.\d+)?)([A-Z]+)/);
    if (match) {
      const value = match[1];
      const element = match[2].toLowerCase();
      const desc = getNutrientDescription(element, language);
      return `${element.toUpperCase()}: ${value}% ${desc ? `(${desc})` : ''}`;
    }
    return pair;
  }).join(', ');
  if (language === 'sw') return `Virutubisho vya ziada: ${formatted}`;
  if (language === 'fr') return `Nutriments supplémentaires : ${formatted}`;
  if (language === 'es') return `Nutrientes adicionales: ${formatted}`;
  return `Additional nutrients: ${formatted}`;
};

const getCropCategory = (crop: string): string => {
  const c = crop.toLowerCase();
  const grains = ["maize","beans","wheat","sorghum","millet","rice","barley","finger millet","oats","teff","triticale","buckwheat","quinoa","fonio","spelt","kamut","amaranth grain"];
  const pulses = ["soya beans","cowpeas","green grams","bambara nuts","groundnuts","pigeon peas","chickpea","lentil","faba bean","peanut","alfalfa","lucerne","clover","white clover","vetch","mucuna","desmodium","dolichos","canavalia","sunn hemp","crotalaria paulina"];
  const tubers = ["cassava","sweet potatoes","irish potatoes","yams","taro","arrow roots","ginger","turmeric","horseradish","parsnip","turnip","rutabaga","beetroot","radish"];
  const vegetables = ["tomatoes","cabbage","kales","onions","carrots","capsicums","chillies","brinjals","eggplants","french beans","garden peas","spinach","okra","cauliflower","lettuce","broccoli","celery","leeks","pumpkin leaves","sweet potato leaves","jute mallow","spider plant","african nightshade","amaranth","ethiopian kale","coriander","parsley","arugula","endive","kohlrabi","watercress","pumpkin","courgettes","cucumbers","artichoke","asparagus","rhubarb","wasabi","bok choy","collard greens","mustard greens","swiss chard","radicchio","escarole","frisee","turnip greens"];
  const fruits = ["bananas","oranges","pineapples","mangoes","avocados","pawpaws","passion fruit","citrus","watermelon","grapefruit","lemons","limes","guava","jackfruit","breadfruit","pomegranate","star fruit","coconut","fig","date palm","mulberry","lychee","persimmon","gooseberry","currant","elderberry","rambutan","durian","mangosteen","longan","marula"];
  if (grains.includes(c)) return "grains";
  if (pulses.includes(c)) return "pulses";
  if (tubers.includes(c)) return "tubers";
  if (vegetables.includes(c)) return "vegetables";
  if (fruits.includes(c)) return "fruits";
  return "other";
};

const getPostHarvestLossWarning = (crop: string, language: string): string => {
  const c = crop.toLowerCase();
  if (language === 'sw') {
    if (c.includes('cabbage')||c.includes('kale')) return "⚠️ HADHARI: Utunzaji duni wa kabichi/sukumawiki unaweza kusababisha hasara ya HADI 50%! Majani ya nje yaliyovunjika huoza haraka, na majani yaliyopasuka huvutia bakteria – hii inapunguza thamani ya soko na maisha ya rafu.";
    return "⚠️ HADHARI: Utunzaji duni wa mavuno unaweza kusababisha hasara ya HADI 50%! Aflatoxini (sumu), majeraha, uchafu na metali nzito hushusha ubora na kuzuia soko.";
  }
  if (language === 'fr') return "⚠️ ATTENTION : Une mauvaise manutention peut entraîner une PERTE DE 50% ! L'aflatoxine, les blessures, la contamination et les métaux lourds réduisent la qualité.";
  if (language === 'es') return "⚠️ ADVERTENCIA: ¡El mal manejo postcosecha puede causar una PÉRDIDA DE HASTA EL 50%! La aflatoxina, los daños físicos, la contaminación y los oligoelementos reducen la calidad.";
  if (c.includes('cabbage')||c.includes('kale')) return "⚠️ WARNING: Poor cabbage/kale handling can cause UP TO 50% LOSS! Broken outer leaves rot quickly, and split heads invite bacteria – this reduces market value and shelf life.";
  return "⚠️ WARNING: Poor post‑harvest handling can cause UP TO 50% LOSS! Aflatoxin (toxic mould), physical injury, contamination and trace elements lower quality and block market access.";
};

const getSortingGradingAdvice = (crop: string, language: string): string => {
  const c = crop.toLowerCase();
  if (language === 'sw') {
    if (c.includes('cabbage')||c.includes('kale')) return "Panga na chemsha kabichi/sukumawiki: ondoa majani ya nje yaliyovunjika, yaliyokauka au yenye madoa – **majani yaliyoharibika husababisha uozo unaoenea haraka**. Weka vichwa vilivyo imara na safi.";
    return "Panga na chemsha mavuno yako: ondoa yaliyoharibika, yenye ukungu au majeraha – **kuondoa bidhaa mbaya huzuia kuenea kwa magonjwa na inaboresha bei kwa 20-30%**.";
  }
  if (language === 'fr') return "Triez et calibrez : retirez les produits endommagés – **cela empêche la propagation des maladies et augmente le prix de 20-30%**.";
  if (language === 'es') return "Clasifique y calibre: retire los productos dañados – **esto evita la propagación de enfermedades y aumenta el precio entre un 20-30%**.";
  if (c.includes('cabbage')||c.includes('kale')) return "Sort and grade cabbage/kale: remove loose, yellow or cracked outer leaves – **damaged leaves spread rot quickly**. Keep firm, compact heads with clean leaves.";
  return "Sort and grade your produce: remove damaged, mouldy or injured items – **removing bad produce prevents disease spread and improves price by 20-30%**.";
};

const getValueAdditionSuggestion = (crop: string, language: string): string => {
  const c = crop.toLowerCase();
  if (language === 'sw') {
    if (c.includes('cabbage')||c.includes('kale')) return "Ongeza thamani: Tengeneza sauerkraut (kabichi iliyochachuka) au kabichi kavu – **kuchachuka kunaongeza probiotics na kuhifadhi kwa miezi 6+, kukausha kunazuia uozo**. Pia unaweza kutengeneza coleslaw safi kwa bei ya juu.";
    return "Ongeza thamani: Kausha, saga, funga kwa plastiki – **kukausha huondoa unyevu unaosababisha uozo, na ufungaji mzuri huzuia wadudu**. Bidhaa iliyochakatwa ina bei mara 2-3.";
  }
  if (language === 'fr') return "Ajoutez de la valeur : séchez, broyez, emballez – **le séchage élimine l'humidité qui cause la pourriture, et l'emballage hermétique empêche les insectes**.";
  if (language === 'es') return "Agregue valor: seque, muela, empaque – **el secado elimina la humedad que causa la pudrición, y el empaque hermético previene los insectos**.";
  if (c.includes('cabbage')||c.includes('kale')) return "Add value: Make sauerkraut (fermented cabbage) or dried cabbage – **fermentation adds probiotics and preserves for 6+ months, drying stops rot**. Also sell fresh coleslaw mix for premium.";
  return "Add value: dry, mill, package – **drying removes moisture that causes rot, and good packaging prevents pests**. Processed products sell for 2-3x higher price.";
};

// ===== INTERFACES =====
interface RecommendationInput {
  hasSoilTest: boolean;
  soilAnalysis?: any;
  fertilizerPlan?: any;
  crop: string;
  crops: string[];
  farmerData: any;
  modules?: string[];
  isPoultry?: boolean;
  poultrySpecies?: string;
  isDairy?: boolean;
}

type ModuleKey =
  | 'confidence'
  | 'soil_test'
  | 'calcitic_lime'
  | 'dolomitic_lime'
  | 'fertilizer_plan'
  | 'planting_fertilizer'
  | 'topdressing_fertilizer'
  | 'plant_population'
  | 'business_tip'
  | 'fertilizer_remember'
  | 'gross_margin'
  | 'good_practices'
  | 'disease_management'
  | 'pest_management'
  | 'deficiency_analysis'
  | 'plant_damage'
  | 'conservation'
  | 'post_harvest'
  | 'farming_business'
  | 'nutrition_benefits'
  | 'reminder'
  | 'poultry_feed'
  | 'poultry_vaccination'
  | 'poultry_financial'
  | 'poultry_housing'
  | 'poultry_biosecurity'
  | 'poultry_breed_advice'
  | 'poultry_sourcing'
  | 'bird_damage'
  | 'dairy_health_analysis'
  | 'dairy_financial'
  | 'dairy_management'
  | 'dairy_breeding'
  | 'dairy_calf'
  | 'dairy_concentrate'
  | 'dairy_feed'
  | 'dairy_housing'
  | 'dairy_milk'
  | 'dairy_parasite'
  | 'dairy_business'
  | 'dairy_dos_donts'
  | 'dairy_reminders';

const moduleKeyMap: Record<string, ModuleKey> = {
  'confidence_label': 'confidence',
  'soil_test_grouped': 'soil_test',
  'calcitic_lime_grouped': 'calcitic_lime',
  'dolomitic_lime_grouped': 'dolomitic_lime',
  'fertilizer_header_grouped': 'fertilizer_plan',
  'planting_fertilizer': 'planting_fertilizer',
  'topdressing_fertilizer': 'topdressing_fertilizer',
  'plant_population': 'plant_population',
  'fertilizer_business_tip': 'business_tip',
  'fertilizer_remember': 'fertilizer_remember',
  'gross_margin_grouped': 'gross_margin',
  'good_practices': 'good_practices',
  'disease_management_grouped': 'disease_management',
  'pest_management_grouped': 'pest_management',
  'deficiency_analysis': 'deficiency_analysis',
  'plant_damage': 'plant_damage',
  'conservation': 'conservation',
  'post_harvest': 'post_harvest',
  'farming_business': 'farming_business',
  'nutrition_benefits': 'nutrition_benefits',
  'poultry_feed': 'poultry_feed',
  'poultry_vaccination': 'poultry_vaccination',
  'poultry_financial': 'poultry_financial',
  'poultry_housing': 'poultry_housing',
  'poultry_biosecurity': 'poultry_biosecurity',
  'poultry_breed_advice': 'poultry_breed_advice',
  'poultry_sourcing': 'poultry_sourcing',
  'bird_damage': 'bird_damage',
  'dairy_health_analysis': 'dairy_health_analysis',
  'dairy_financial': 'dairy_financial',
  'dairy_management': 'dairy_management',
  'dairy_breeding': 'dairy_breeding',
  'dairy_calf': 'dairy_calf',
  'dairy_concentrate': 'dairy_concentrate',
  'dairy_feed': 'dairy_feed',
  'dairy_housing': 'dairy_housing',
  'dairy_milk': 'dairy_milk',
  'dairy_parasite': 'dairy_parasite',
  'dairy_business': 'dairy_business',
  'dairy_dos_donts': 'dairy_dos_donts',
  'dairy_reminders': 'dairy_reminders',
};

interface RecommendationOutput {
  list: string[];
  financialAdvice: string;
  structuredList: any[];
  structuredFinancialAdvice: any;
}

// ===== POULTRY FALLBACKS =====
const FALLBACK_VACCINES = [
  { disease: 'Newcastle Disease', ageDays: 1, route: 'Eye drop', costPerBird: 0.50 },
  { disease: 'Gumboro (IBD)', ageDays: 14, route: 'Drinking water', costPerBird: 0.30 },
  { disease: 'Infectious Bronchitis', ageDays: 28, route: 'Drinking water', costPerBird: 0.30 },
  { disease: 'Newcastle Disease (booster)', ageDays: 56, route: 'Drinking water', costPerBird: 0.50 },
  { disease: 'Fowl Pox', ageDays: 70, route: 'Wing web', costPerBird: 0.40 },
];

const FALLBACK_FEED = {
  lifeStage: 'Starter/Grower',
  proteinMin: 18,
  proteinMax: 20,
  dailyFeedIntakeG: 40,
  feedConversionRatio: 2.2,
  costPerKg: 60,
};

const FALLBACK_COSTS = {
  system: 'deep_litter',
  chickCost: 120,
  feedCostToMarket: 350,
  vaccinationCost: 20,
  medicationCost: 15,
  labourCost: 30,
  housingCost: 25,
  totalCostPerBird: 560,
  expectedYield: 2.5,
  breakEvenMeatPrice: 224,
  breakEvenEggPrice: 7,
};

const FALLBACK_HOUSING = {
  floorSpaceM2PerBird: 0.4,
  feederSpaceCmPerBird: 5,
  drinkerSpaceCmPerBird: 2.5,
  ventilation: 'Natural with ridge vents',
  litterType: 'Wood shavings or rice husks (10-15cm deep)',
};

const FALLBACK_TRAITS = {
  heatTolerance: 'Medium',
  growthRate: 'Medium',
  foragingAbility: 'Average',
  eggProduction: 'Medium',
  docility: 'Calm',
};

const FALLBACK_HATCHERY = {
  name: 'Local Hatchery',
  county: 'Your Area',
  country: 'Kenya',
  breedsSupplied: ['Various breeds'],
  pricePerChick: 120,
  phone: 'Contact local agrovet',
};

// ===== POULTRY GENERATOR (COMPLETE) =====
async function generatePoultryRecommendations(
  farmerData: any,
  modules?: string[]
): Promise<RecommendationOutput> {
  const structuredList: any[] = [];
  const list: string[] = [];
  const country = farmerData.country || 'kenya';
  const language = farmerData.language || 'en';
  const isSwahili = language === 'sw';
  const isFrench = language === 'fr';
  const isSpanish = language === 'es';

  const formatCurrency = (amount: number): string => {
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
    const symbol = farmerData.currencySymbol || currency.symbol;
    const formattedAmount = new Intl.NumberFormat(currency.locale, {
      style: 'decimal',
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(amount);
    return currency.position === 'before' ? `${symbol} ${formattedAmount}` : `${formattedAmount} ${symbol}`;
  };
  const currencySymbol = farmerData.currencySymbol || COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh';

  const shouldInclude = (key: string): boolean => {
    if (!modules || modules.length === 0) return true;
    if (modules.includes('complete')) return true;
    const moduleKey = moduleKeyMap[key];
    if (moduleKey) return modules.includes(moduleKey);
    return modules.includes(key);
  };

  const addToStructuredList = (key: string, params: any) => {
    if (shouldInclude(key)) {
      structuredList.push({ key, params });
    }
  };

  const addToList = (content: string) => {
    if (content && content.trim()) list.push(content);
  };

  // 1. Confidence
  if (shouldInclude('confidence_label')) {
    const label = isSwahili ? '🟡 IMANI: Wastani (kutokana na ushauri wa mhudumu wa ugani)' :
                   isFrench ? '🟡 CONFIANCE: Moyenne (basée sur les conseils du vulgarisateur)' :
                   isSpanish ? '🟡 CONFIANZA: Media (basada en el consejo del extensionista)' :
                   '🟡 Confidence: Medium (based on extension officer advice)';
    addToStructuredList('confidence_label', { content: label });
    addToList(label);
  }

  // 2. Feed
  if (shouldInclude('poultry_feed')) {
    let feed = getPoultryFeed('chicken', farmerData.poultry_breed, farmerData.poultry_age_weeks || 0);
    if (!feed) feed = FALLBACK_FEED;
    const content = `${farmerData.poultry_breed} at ${farmerData.poultry_age_weeks || 0} weeks: ${feed.lifeStage} feed, ${feed.proteinMin}-${feed.proteinMax}% protein, ${feed.dailyFeedIntakeG}g/bird/day. FCR: ${feed.feedConversionRatio}. Cost: ${formatCurrency(feed.costPerKg)}/kg.`;
    addToStructuredList('poultry_feed', { content });
    addToList(content);
  }

  // 3. Vaccination
  if (shouldInclude('poultry_vaccination')) {
    let vaccines = getPoultryVaccines('chicken', farmerData.poultry_breed);
    if (!vaccines || vaccines.length === 0) vaccines = FALLBACK_VACCINES;
    const vaccineLines = vaccines.map(v => `• Day ${v.ageDays}: ${v.disease} (${v.route})`).join('\n');
    const content = `Vaccination schedule for ${farmerData.poultry_breed}:\n${vaccineLines}\n\n💉 Estimated cost: ~${formatCurrency(vaccines.reduce((sum, v) => sum + v.costPerBird, 0))} per bird for all vaccines.`;
    addToStructuredList('poultry_vaccination', { content });
    addToList(`💉 Vaccination schedule: ${vaccines.length} vaccines listed.`);
  }

  // 4. Financial
  if (shouldInclude('poultry_financial')) {
    let costs = getPoultryCosts('chicken', farmerData.poultry_breed, farmerData.poultry_system || 'deep_litter');
    if (!costs) costs = { ...FALLBACK_COSTS, system: farmerData.poultry_system || 'deep_litter' };
    const totalCostPerBird = costs.totalCostPerBird || 0;
    const expectedYield = costs.expectedYield || 0;
    const breakEvenMeatPrice = costs.breakEvenMeatPrice || 0;
    const breakEvenEggPrice = costs.breakEvenEggPrice || 0;
    const revenue = expectedYield * (breakEvenMeatPrice || breakEvenEggPrice);
    const profit = revenue - totalCostPerBird;
    const content = `Cost per bird: ${formatCurrency(totalCostPerBird)}\nRevenue: ${formatCurrency(revenue)}\nProfit: ${formatCurrency(profit)}`;
    addToStructuredList('poultry_financial', { content });
    addToList(content);
  }

  // 5. Housing
  if (shouldInclude('poultry_housing')) {
    let housing = getPoultryHousing('chicken', farmerData.poultry_breed, farmerData.poultry_system || 'deep_litter');
    if (!housing) housing = FALLBACK_HOUSING;
    const space = housing.floorSpaceM2PerBird * (farmerData.poultry_flock_size || 100);
    const content = `Recommended floor space: ${space.toFixed(1)} m² for ${farmerData.poultry_flock_size || 100} birds. Ventilation: ${housing.ventilation}. Litter: ${housing.litterType}.`;
    addToStructuredList('poultry_housing', { content });
    addToList(content);
  }

  // 6. Biosecurity
  if (shouldInclude('poultry_biosecurity')) {
    const biosecurity = getBiosecurityItems();
    if (biosecurity && biosecurity.length) {
      const critical = biosecurity.filter(i => i.importance === 'critical').map(i => `• ${i.item}`).join('\n');
      const content = `Critical biosecurity steps:\n${critical}`;
      addToStructuredList('poultry_biosecurity', { content });
      addToList(content);
    }
  }

  // 7. Breed advice
  if (shouldInclude('poultry_breed_advice')) {
    let traits = getPoultryTraits('chicken', farmerData.poultry_breed);
    if (!traits) traits = FALLBACK_TRAITS;
    const content = `${farmerData.poultry_breed}: heat tolerance ${traits.heatTolerance}, growth rate ${traits.growthRate}, foraging ability ${traits.foragingAbility}, egg production ${traits.eggProduction}.`;
    addToStructuredList('poultry_breed_advice', { content });
    addToList(content);
  }

  // 8. Sourcing
  if (shouldInclude('poultry_sourcing')) {
    let hatcheries = getHatcheriesByCounty(farmerData.county || '');
    if (!hatcheries || hatcheries.length === 0) {
      hatcheries = [{ ...FALLBACK_HATCHERY, county: farmerData.county || 'your area' }];
    }
    const h = hatcheries[0];
    const content = `Nearest hatchery: ${h.name} in ${h.county} – ${h.breedsSupplied.join(', ')}. Price: ${formatCurrency(h.pricePerChick)}/chick.`;
    addToStructuredList('poultry_sourcing', { content });
    addToList(content);
  }

  // 9. Bird damage
  if (shouldInclude('bird_damage')) {
    const mortality = farmerData.poultry_mortality_count || 0;
    if (mortality > 0) {
      const content = `BIRD LOSS REPORT FOR YOUR ${farmerData.poultry_breed.toUpperCase()} FLOCK\nYou reported ${mortality} birds lost.\nConsider reviewing your biosecurity and vaccination strategies to prevent future losses.`;
      addToStructuredList('bird_damage', { content });
      addToList(content);
    }
  }

  // 10. Reminder
  if (shouldInclude('reminder')) {
    const content = isSwahili ? "Chunguza udongo wako kila mwaka ili kuweka biashara yako yenye faida." :
                     isFrench ? "Testez votre sol chaque année pour garder votre entreprise rentable." :
                     isSpanish ? "Analice su suelo anualmente para mantener su empresa rentable." :
                     "Test your soil yearly to keep your enterprise profitable.";
    addToStructuredList('reminder', { content });
    addToList(content);
  }

  // 11. Disease Management
  if (shouldInclude('poultry_disease_management')) {
    const selectedDisease = farmerData.poultry_disease;
    const species = farmerData.poultry_species || 'chicken';
    const diseaseMap = poultryDiseaseMap[species] || poultryDiseaseMap['chicken'];
    const diseaseInfo = diseaseMap.find((d: any) => d.name === selectedDisease);

    let content = '';
    if (selectedDisease && diseaseInfo) {
      content = `🐔 DISEASE: ${selectedDisease.toUpperCase()}\n\n`;
      if (diseaseInfo.description) content += `📋 ${diseaseInfo.description}\n\n`;

      if (diseaseInfo.chemicalControls && diseaseInfo.chemicalControls.length) {
        content += `🧪 CHEMICAL TREATMENTS:\n`;
        for (const chem of diseaseInfo.chemicalControls) {
          content += `• ${chem.productName} (${chem.activeIngredient})\n`;
          content += `  Dose: ${chem.rate}\n`;
          content += `  Application: ${chem.applicationMethod}\n`;
          content += `  Timing: ${chem.timing}\n`;
          if (chem.withdrawalPeriod) content += `  Withdrawal: ${chem.withdrawalPeriod}\n`;
          const status = chem.status === 'restricted' ? '⚠️ RESTRICTED' :
                         chem.status === 'banned' ? '❌ BANNED' :
                         chem.status === 'vaccine' ? '💉 Vaccine' : '✅ Active';
          content += `  Status: ${status}\n\n`;
        }
      }

      if (diseaseInfo.organicControls && diseaseInfo.organicControls.length) {
        content += `🌱 ORGANIC / NATURAL OPTIONS:\n`;
        for (const org of diseaseInfo.organicControls) {
          content += `• ${org.method}\n`;
          if (org.preparation) content += `  Prep: ${org.preparation}\n`;
          if (org.application) content += `  Apply: ${org.application}\n\n`;
        }
      }

      if (diseaseInfo.culturalControls && diseaseInfo.culturalControls.length) {
        content += `📋 CULTURAL CONTROLS:\n`;
        for (const control of diseaseInfo.culturalControls) {
          content += `• ${control}\n`;
        }
        content += `\n`;
      }

      if (diseaseInfo.businessNote) {
        content += `💼 ${diseaseInfo.businessNote}\n`;
      }
    } else {
      content = selectedDisease
        ? `Selected disease "${selectedDisease}" not found in the poultry disease database. Please consult a veterinarian.`
        : `No specific disease was selected. If you have disease concerns, please select a disease from the list.`;
    }

    addToStructuredList('poultry_disease_management', { content });
    addToList(content);
  }

  return {
    list,
    financialAdvice: isSwahili ? "Tazama uchambuzi wa kifedha hapo juu ili kuongeza faida yako." :
                     isFrench ? "Voyez l'analyse financière ci-dessus pour maximiser votre profit." :
                     isSpanish ? "Vea el análisis financiero arriba para maximizar su ganancia." :
                     "See financial analysis above to maximize your profit.",
    structuredList,
    structuredFinancialAdvice: null,
  };
}

// ===== ENHANCED DAIRY GENERATOR (FINAL – all fixes applied) =====
async function generateDairyRecommendations(
  farmerData: any,
  modules?: string[]
): Promise<RecommendationOutput> {
  const structuredList: any[] = [];
  const list: string[] = [];
  const country = farmerData.country || 'kenya';
  const language = farmerData.language || 'en';
  const isSwahili = language === 'sw';
  const isFrench = language === 'fr';
  const isSpanish = language === 'es';

  const formatCurrency = (amount: number): string => {
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
    const symbol = farmerData.currencySymbol || currency.symbol;
    const formattedAmount = new Intl.NumberFormat(currency.locale, {
      style: 'decimal',
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(amount);
    return currency.position === 'before' ? `${symbol} ${formattedAmount}` : `${formattedAmount} ${symbol}`;
  };
  const currencySymbol = farmerData.currencySymbol || COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh';

  const shouldInclude = (key: string): boolean => {
    if (!modules || modules.length === 0) return true;
    if (modules.includes('complete')) return true;
    const moduleKey = moduleKeyMap[key];
    if (moduleKey) return modules.includes(moduleKey);
    return modules.includes(key);
  };

  const addToStructuredList = (key: string, params: any) => {
    if (shouldInclude(key)) {
      structuredList.push({ key, params });
    }
  };

  const addToList = (content: string) => {
    if (content && content.trim()) list.push(content);
  };

  // 1. Confidence
  if (shouldInclude('confidence_label')) {
    const label = isSwahili ? '🟡 IMANI: Wastani (kutokana na ushauri wa mhudumu wa ugani)' :
                   isFrench ? '🟡 CONFIANCE: Moyenne (basée sur les conseils du vulgarisateur)' :
                   isSpanish ? '🟡 CONFIANZA: Media (basada en el consejo del extensionista)' :
                   '🟡 Confidence: Medium (based on extension officer advice)';
    addToStructuredList('confidence_label', { content: label });
    addToList(label);
  }

  // 2. Health Analysis – DISEASE
  if (shouldInclude('dairy_health_analysis')) {
    const selectedDisease = farmerData.dairyDiseaseSelect || farmerData.dairy_disease || farmerData.selectedDisease;
    const symptoms = farmerData.dairySymptoms || [];
    const mortality = parseInt(farmerData.dairyMortalityCount) || 0;
    const duration = farmerData.dairyHealthDuration || '';

    const allDiseases = dairyPestDiseaseMap.dairy || [];
    let matchedDiseases: DairyPestDisease[] = [];

    if (selectedDisease) {
      matchedDiseases = allDiseases.filter(d => d.name.toLowerCase() === selectedDisease.toLowerCase());
    } else if (symptoms && symptoms.length) {
      matchedDiseases = allDiseases.filter(d =>
        d.symptoms.some(s => symptoms.some((sym: string) => s.toLowerCase().includes(sym.toLowerCase())))
      );
    }

    if (matchedDiseases.length === 0 && selectedDisease) {
      const content = isSwahili ? `🏥 MAGONJWA YA NG'OMBE: Ugonjwa "${selectedDisease}" haujapatikana. Tafadhali wasiliana na daktari wa mifugo.` :
                       isFrench ? `🏥 MALADIES BOVINES : La maladie "${selectedDisease}" n'est pas dans notre base. Consultez un vétérinaire.` :
                       isSpanish ? `🏥 ENFERMEDADES BOVINAS: La enfermedad "${selectedDisease}" no está en nuestra base. Consulte a un veterinario.` :
                       `🏥 DAIRY DISEASE: "${selectedDisease}" not found. Please consult a veterinarian.`;
      addToStructuredList('dairy_health_analysis', { content });
      addToList(content);
    } else if (matchedDiseases.length > 0) {
      let content = '';
      for (const disease of matchedDiseases) {
        content += `🐄 **${disease.name.toUpperCase()}**\n`;
        content += `📋 Symptoms: ${disease.symptoms.join(', ')}\n`;
        if (disease.chemicalControls && disease.chemicalControls.length) {
          content += `🧪 Chemical Treatments:\n`;
          for (const chem of disease.chemicalControls) {
            content += `• ${chem.productName} (${chem.activeIngredient})\n`;
            content += `  Dose: ${chem.rate}\n`;
            content += `  Application: ${chem.applicationMethod}\n`;
            content += `  Timing: ${chem.timing}\n`;
            if (chem.safetyInterval) content += `  Withdrawal: ${chem.safetyInterval}\n`;
            const status = chem.status === 'restricted' ? '⚠️ RESTRICTED' :
                           chem.status === 'banned' ? '❌ BANNED' :
                           '✅ Active';
            content += `  Status: ${status}\n\n`;
          }
        }
        if (disease.organicControls && disease.organicControls.length) {
          content += `🌱 Organic/Natural Options:\n`;
          for (const org of disease.organicControls) {
            content += `• ${org.method}\n`;
            if (org.preparation) content += `  Prep: ${org.preparation}\n`;
            if (org.application) content += `  Apply: ${org.application}\n\n`;
          }
        }
        if (disease.culturalControls && disease.culturalControls.length) {
          content += `📋 Cultural Controls:\n`;
          for (const control of disease.culturalControls) {
            content += `• ${control}\n`;
          }
          content += `\n`;
        }
        if (disease.businessNote) {
          content += `💼 ${disease.businessNote}\n\n`;
        }
      }
      if (mortality > 0) {
        content += `⚠️ You reported ${mortality} cow(s) dead. **URGENT:** Escalate to a veterinarian immediately.\n`;
      }
      if (duration) {
        const durationText = isSwahili ? `Muda wa dalili: ${duration}` :
                             isFrench ? `Durée des symptômes : ${duration}` :
                             isSpanish ? `Duración de los síntomas: ${duration}` :
                             `Duration of symptoms: ${duration}`;
        content += durationText + '\n';
      }
      addToStructuredList('dairy_health_analysis', { content });
      addToList(content);
    } else {
      const content = isSwahili ? '🏥 Hakuna magonjwa yanayolingana. Wasiliana na daktari wa mifugo.' :
                       isFrench ? '🏥 Aucune maladie correspondante. Consultez un vétérinaire.' :
                       isSpanish ? '🏥 Ninguna enfermedad coincide. Consulte a un veterinario.' :
                       '🏥 No matching diseases. Please consult a veterinarian.';
      addToStructuredList('dairy_health_analysis', { content });
      addToList(content);
    }
  }

  // 3. Financial Analysis (Enhanced)
  if (shouldInclude('dairy_financial')) {
    const milkYield = parseFloat(farmerData.dairyMilkYieldPerDay) || 10;
    const milkPrice = parseFloat(farmerData.dairyMilkPricePerLitre) || 40;
    const feedCost = parseFloat(farmerData.dairyFeedCostPerDay) || 100;
    const vetCost = parseFloat(farmerData.dairyVetCostPerMonth) || 500;
    const otherCosts = parseFloat(farmerData.dairyOtherCosts) || 0;

    const dailyRevenue = milkYield * milkPrice;
    const dailyVetCost = vetCost / 30;
    const dailyCost = feedCost + dailyVetCost + otherCosts;
    const dailyProfit = dailyRevenue - dailyCost;
    const monthlyProfit = dailyProfit * 30;
    const yearlyProfit = monthlyProfit * 12;

    let content = isSwahili ? `💰 UCHAMBUZI WA KIFEDHA WA NG'OMBE WA MAZIWA\n` :
                   isFrench ? `💰 ANALYSE FINANCIÈRE DE LA VACHE LAITIÈRE\n` :
                   isSpanish ? `💰 ANÁLISIS FINANCIERO DE LA VACA LECHERA\n` :
                   `💰 DAIRY FINANCIAL ANALYSIS\n`;

    content += isSwahili ? `Maziwa kwa siku: ${milkYield} L @ ${formatCurrency(milkPrice)}/L = ${formatCurrency(dailyRevenue)}/siku\n` :
                isFrench ? `Lait par jour : ${milkYield} L @ ${formatCurrency(milkPrice)}/L = ${formatCurrency(dailyRevenue)}/jour\n` :
                isSpanish ? `Leche por día: ${milkYield} L @ ${formatCurrency(milkPrice)}/L = ${formatCurrency(dailyRevenue)}/día\n` :
                `Milk per day: ${milkYield} L @ ${formatCurrency(milkPrice)}/L = ${formatCurrency(dailyRevenue)}/day\n`;

    content += isSwahili ? `Gharama za kila siku: Malisho ${formatCurrency(feedCost)} + Matibabu ${formatCurrency(dailyVetCost)} + Nyingine ${formatCurrency(otherCosts)} = ${formatCurrency(dailyCost)}\n` :
                isFrench ? `Coûts quotidiens : Alimentation ${formatCurrency(feedCost)} + Soins vétérinaires ${formatCurrency(dailyVetCost)} + Autres ${formatCurrency(otherCosts)} = ${formatCurrency(dailyCost)}\n` :
                isSpanish ? `Costos diarios: Alimentación ${formatCurrency(feedCost)} + Veterinaria ${formatCurrency(dailyVetCost)} + Otros ${formatCurrency(otherCosts)} = ${formatCurrency(dailyCost)}\n` :
                `Daily costs: Feed ${formatCurrency(feedCost)} + Vet ${formatCurrency(dailyVetCost)} + Other ${formatCurrency(otherCosts)} = ${formatCurrency(dailyCost)}\n`;

    content += isSwahili ? `Faida ya kila siku: ${formatCurrency(dailyProfit)}\n` :
                isFrench ? `Bénéfice quotidien : ${formatCurrency(dailyProfit)}\n` :
                isSpanish ? `Ganancia diaria: ${formatCurrency(dailyProfit)}\n` :
                `Daily profit: ${formatCurrency(dailyProfit)}\n`;

    content += isSwahili ? `Faida ya mwezi: ${formatCurrency(monthlyProfit)}\nFaida ya mwaka: ${formatCurrency(yearlyProfit)}\n\n` :
                isFrench ? `Bénéfice mensuel : ${formatCurrency(monthlyProfit)}\nBénéfice annuel : ${formatCurrency(yearlyProfit)}\n\n` :
                isSpanish ? `Ganancia mensual: ${formatCurrency(monthlyProfit)}\nGanancia anual: ${formatCurrency(yearlyProfit)}\n\n` :
                `Monthly profit: ${formatCurrency(monthlyProfit)}\nYearly profit: ${formatCurrency(yearlyProfit)}\n\n`;

    if (dailyProfit < 0) {
      content += isSwahili ? `🔴 ONYO: Unapoteza ${formatCurrency(Math.abs(dailyProfit))} kwa siku! Tafuta njia za kupunguza gharama au kuongeza uzalishaji wa maziwa.` :
                  isFrench ? `🔴 ATTENTION : Vous perdez ${formatCurrency(Math.abs(dailyProfit))} par jour ! Cherchez à réduire les coûts ou augmenter la production laitière.` :
                  isSpanish ? `🔴 ADVERTENCIA: ¡Está perdiendo ${formatCurrency(Math.abs(dailyProfit))} al día! Busque formas de reducir costos o aumentar la producción de leche.` :
                  `🔴 WARNING: You're losing ${formatCurrency(Math.abs(dailyProfit))} per day! Find ways to reduce costs or increase milk production.\n`;
    } else if (dailyProfit > 0 && dailyProfit < 100) {
      content += isSwahili ? `🟡 Faida yako ni ndogo (${formatCurrency(dailyProfit)}/siku). Ongeza maziwa kwa lita 2-3/siku au punguza gharama za malisho.` :
                  isFrench ? `🟡 Votre bénéfice est faible (${formatCurrency(dailyProfit)}/jour). Augmentez le lait de 2-3 L/jour ou réduisez les coûts d'alimentation.` :
                  isSpanish ? `🟡 Su ganancia es baja (${formatCurrency(dailyProfit)}/día). Aumente la leche en 2-3 L/día o reduzca los costos de alimentación.` :
                  `🟡 Your profit is low (${formatCurrency(dailyProfit)}/day). Increase milk by 2-3 L/day or reduce feed costs.\n`;
    } else if (dailyProfit >= 200) {
      content += isSwahili ? `🟢 Faida bora! Unaweza kuongeza kundi lako au kuwekeza katika ubora wa malisho ili kuongeza faida zaidi.` :
                  isFrench ? `🟢 Excellent bénéfice ! Vous pouvez agrandir votre troupeau ou investir dans une meilleure alimentation.` :
                  isSpanish ? `🟢 ¡Excelente ganancia! Puede expandir su hato o invertir en mejor alimentación.` :
                  `🟢 Excellent profit! Consider expanding your herd or investing in better feed quality.\n`;
    }

    content += isSwahili ? `\n💡 KUMBUKA: Faida inaweza kuongezeka kwa kudhibiti magonjwa, kuboresha malisho, na kupunguza gharama zisizo za lazima.` :
                isFrench ? `\n💡 RAPPELEZ-VOUS : Le bénéfice augmente avec le contrôle des maladies, une meilleure alimentation et la réduction des coûts inutiles.` :
                isSpanish ? `\n💡 RECUERDE: La ganancia aumenta con el control de enfermedades, mejor alimentación y reducción de costos innecesarios.` :
                `\n💡 REMEMBER: Profit increases with disease control, better feed, and reducing unnecessary costs.`;

    addToStructuredList('dairy_financial', { content });
    addToList(content);
  }

  // 4. Dairy Management Tips (Enhanced)
  if (shouldInclude('dairy_management')) {
    let content = isSwahili ? `🌾 USIMAMIZI WA NG'OMBE WA MAZIWA – HATUA MAALUM\n` :
                   isFrench ? `🌾 GESTION DES VACHES LAITIÈRES – ACTIONS SPÉCIFIQUES\n` :
                   isSpanish ? `🌾 MANEJO DE VACAS LECHERAS – ACCIONES ESPECÍFICAS\n` :
                   `🌾 DAIRY CATTLE MANAGEMENT – SPECIFIC ACTIONS\n`;

    content += isSwahili ? `\n✅ MAJI: Hakikisha maji safi na ya kutosha (lita 80-120/ng'ombe/siku).` :
                isFrench ? `\n✅ EAU : Assurez une eau propre et abondante (80-120 L/vache/jour).` :
                isSpanish ? `\n✅ AGUA: Asegure agua limpia y abundante (80-120 L/vaca/día).` :
                `\n✅ WATER: Ensure clean, abundant water (80-120 L/cow/day).\n`;

    content += isSwahili ? `\n✅ MALISHO: Toa malisho bora (nyasi 20-30 kg + mchanganyiko 3-5 kg kwa siku).\n✅ REKODI: Andika uzalishaji wa maziwa, gharama, na matibabu kila siku.\n✅ USAFI: Safisha zizi na vifaa vya kukamulia kila siku.` :
                isFrench ? `\n✅ ALIMENTATION : Fournissez des aliments de qualité (20-30 kg fourrage + 3-5 kg concentré/jour).\n✅ REGISTRES : Notez la production, les coûts et les traitements quotidiennement.\n✅ HYGIÈNE : Nettoyez l'étable et le matériel de traite chaque jour.` :
                isSpanish ? `\n✅ ALIMENTACIÓN: Proporcione alimentos de calidad (20-30 kg forraje + 3-5 kg concentrado/día).\n✅ REGISTROS: Anote producción, costos y tratamientos diariamente.\n✅ HIGIENE: Limpie el establo y equipo de ordeño cada día.` :
                `\n✅ FEED: Provide quality feed (20-30 kg forage + 3-5 kg concentrate/day).\n✅ RECORDS: Track milk production, costs, and treatments daily.\n✅ HYGIENE: Clean barn and milking equipment daily.\n`;

    content += isSwahili ? `\n⚠️ KUKAMUA: Kamua mara 2 kwa siku kwa ratiba sawa. Hakikisha mikono safi na viwete vikavu.` :
                isFrench ? `\n⚠️ TRAITE: Traite 2 fois par jour à heures fixes. Lavez-vous les mains et séchez les mamelles.` :
                isSpanish ? `\n⚠️ ORDEÑO: Ordeñe 2 veces al día a horas fijas. Lávese las manos y seque las ubres.` :
                `\n⚠️ MILKING: Milk twice daily at fixed times. Wash hands and dry udders.\n`;

    addToStructuredList('dairy_management', { content });
    addToList(content);
  }

  // 5. Dairy Breeding (FIXED – contradiction)
  if (shouldInclude('dairy_breeding')) {
    const daysSinceCalving = parseInt(farmerData.dairyDaysSinceCalving) || 0;
    const heatObserved = farmerData.dairyHeatObserved || '';
    const lastInsemination = farmerData.dairyLastInseminationDate || '';
    const breedingMethod = farmerData.dairyBreedingMethod || '';
    const reproProblems = farmerData.dairyReproductiveProblems || '';

    let content = isSwahili ? `🐄 USHAURI WA UZAZI\n` :
                   isFrench ? `🐄 CONSEILS DE REPRODUCTION\n` :
                   isSpanish ? `🐄 CONSEJOS DE REPRODUCCIÓN\n` :
                   `🐄 BREEDING ADVICE\n`;

    if (daysSinceCalving > 0) {
      content += isSwahili ? `Siku tangu kuzaa: ${daysSinceCalving}\n` :
                  isFrench ? `Jours depuis le vêlage: ${daysSinceCalving}\n` :
                  isSpanish ? `Días desde el parto: ${daysSinceCalving}\n` :
                  `Days since calving: ${daysSinceCalving}\n`;

      if (daysSinceCalving < 40) {
        content += isSwahili ? `⏳ Bado mapema kwa insemination (subiri hadi siku 40-60). Mpe muda wa kupona.\n` :
                    isFrench ? `⏳ Trop tôt pour l'insémination (attendre 40-60 jours). Laissez-la récupérer.\n` :
                    isSpanish ? `⏳ Demasiado temprano para inseminar (esperar 40-60 días). Déjela recuperarse.\n` :
                    `⏳ Too early for insemination (wait until 40-60 days). Let her recover.\n`;
      } else if (daysSinceCalving >= 40 && daysSinceCalving <= 60 && heatObserved === 'yes') {
        content += isSwahili ? `✅ Muda mzuri wa insemination! Tazama dalili za joto.\n` :
                    isFrench ? `✅ Moment idéal pour l'insémination! Observez les signes de chaleur.\n` :
                    isSpanish ? `✅ ¡Momento ideal para inseminar! Observe los signos de celo.\n` :
                    `✅ Ideal time for insemination! Watch for heat signs.\n`;
      } else if (daysSinceCalving > 90 && heatObserved !== 'yes') {
        content += isSwahili ? `⚠️ Imepita siku 90 bila joto. Mpe daktari wa mifugo kuangalia afya ya uzazi.\n` :
                    isFrench ? `⚠️ Plus de 90 jours sans chaleurs. Consultez un vétérinaire.\n` :
                    isSpanish ? `⚠️ Más de 90 días sin celo. Consulte a un veterinario.\n` :
                    `⚠️ Over 90 days with no heat. Consult a vet for reproductive health check.\n`;
      }
    }

    // ----- FIXED HEAT ADVICE -----
    if (heatObserved === 'yes' && daysSinceCalving >= 40) {
      content += isSwahili ? `🔴 Dalili za joto zimeonekana – insemination inapendekezwa ndani ya saa 12-24.\n` :
                  isFrench ? `🔴 Signes de chaleurs observés – insémination recommandée dans les 12-24 heures.\n` :
                  isSpanish ? `🔴 Señales de celo observadas – insemine dentro de 12-24 horas.\n` :
                  `🔴 Heat signs observed – inseminate within 12-24 hours.\n`;
    } else if (heatObserved === 'yes' && daysSinceCalving < 40) {
      content += isSwahili ? `⏳ Joto limeonekana lakini bado mapema (siku ${daysSinceCalving}). Subiri hadi siku 40-60 kwa insemination.\n` :
                  isFrench ? `⏳ Des chaleurs sont observées mais trop tôt (${daysSinceCalving} jours). Attendez 40-60 jours pour l'insémination.\n` :
                  isSpanish ? `⏳ Se observa celo pero es demasiado temprano (${daysSinceCalving} días). Espere 40-60 días para inseminar.\n` :
                  `⏳ Heat observed but too early (${daysSinceCalving} days). Wait until 40-60 days for insemination.\n`;
    }

    if (breedingMethod) {
      content += isSwahili ? `Njia ya kuzalisha: ${breedingMethod}\n` :
                  isFrench ? `Méthode de reproduction: ${breedingMethod}\n` :
                  isSpanish ? `Método de reproducción: ${breedingMethod}\n` :
                  `Breeding method: ${breedingMethod}\n`;
    }

    if (reproProblems && reproProblems !== 'none') {
      content += isSwahili ? `⚠️ Matatizo ya uzazi: ${reproProblems}. Tafuta ushauri wa mtaalamu.\n` :
                  isFrench ? `⚠️ Problèmes de reproduction: ${reproProblems}. Consultez un spécialiste.\n` :
                  isSpanish ? `⚠️ Problemas reproductivos: ${reproProblems}. Consulte a un especialista.\n` :
                  `⚠️ Reproductive problems: ${reproProblems}. Seek specialist advice.\n`;
    }

    content += isSwahili ? `\n📋 MAPENDEKEZO:\n• Rekodi mzunguko wa joto kila siku\n• Fanya insemination saa 12-24 baada ya joto\n• Check-up ya uzazi baada ya siku 30` :
                isFrench ? `\n📋 RECOMMANDATIONS:\n• Enregistrez le cycle de chaleur quotidiennement\n• Insémination 12-24 heures après les chaleurs\n• Contrôle de reproduction à 30 jours` :
                isSpanish ? `\n📋 RECOMENDACIONES:\n• Registre el ciclo de celo diariamente\n• Insemine 12-24 horas después del celo\n• Control reproductivo a los 30 días` :
                `\n📋 RECOMMENDATIONS:\n• Record heat cycle daily\n• Inseminate 12-24 hours after heat\n• Reproductive check-up at 30 days`;

    addToStructuredList('dairy_breeding', { content });
    addToList(content);
  }

  // 6. Dairy Calf (FIXED idealMilk scoping)
  if (shouldInclude('dairy_calf')) {
    const age = parseInt(farmerData.calfAgeWeeks) || 0;
    const feeding = farmerData.calfFeedingMethod || '';
    const milkLitres = parseFloat(farmerData.calfMilkLitresPerDay) || 0;
    const colostrum = farmerData.calfReceivedColostrum || '';
    const housing = farmerData.calfHousingType || '';
    const health = farmerData.calfHealthIssues || '';

    let idealMilk = 0;

    let content = isSwahili ? `🐄 USHAURI WA ULEZI WA NDAMA\n` :
                   isFrench ? `🐄 CONSEILS D'ÉLEVAGE DU VEAU\n` :
                   isSpanish ? `🐄 CONSEJOS DE CRÍA DE TERNEROS\n` :
                   `🐄 CALF REARING ADVICE\n`;

    if (age > 0) content += isSwahili ? `Umri: ${age} wiki\n` : isFrench ? `Âge: ${age} semaines\n` : isSpanish ? `Edad: ${age} semanas\n` : `Age: ${age} weeks\n`;
    if (feeding) content += isSwahili ? `Njia ya kulisha: ${feeding}\n` : isFrench ? `Méthode d'alimentation: ${feeding}\n` : isSpanish ? `Método de alimentación: ${feeding}\n` : `Feeding method: ${feeding}\n`;
    if (milkLitres > 0) content += isSwahili ? `Maziwa kwa siku: ${milkLitres} L\n` : isFrench ? `Lait par jour: ${milkLitres} L\n` : isSpanish ? `Leche por día: ${milkLitres} L\n` : `Milk per day: ${milkLitres} L\n`;
    if (colostrum) content += isSwahili ? `Colostrum katika saa 6 za kwanza: ${colostrum}\n` : isFrench ? `Colostrum dans les 6 premières heures: ${colostrum}\n` : isSpanish ? `Calostro en las primeras 6 horas: ${colostrum}\n` : `Colostrum within first 6 hours: ${colostrum}\n`;
    if (housing) content += isSwahili ? `Aina ya makazi: ${housing}\n` : isFrench ? `Type de logement: ${housing}\n` : isSpanish ? `Tipo de alojamiento: ${housing}\n` : `Housing type: ${housing}\n`;
    if (health && health !== 'none') content += isSwahili ? `Matatizo ya afya: ${health}\n` : isFrench ? `Problèmes de santé: ${health}\n` : isSpanish ? `Problemas de salud: ${health}\n` : `Health issues: ${health}\n`;

    if (age <= 4) {
      idealMilk = Math.round(age * 1.5 + 3);
      if (milkLitres > 0 && milkLitres < idealMilk) {
        content += isSwahili ? `\n🔴 MUHIMU: Ndama wa wiki ${age} anahitaji ${idealMilk} L maziwa kwa siku.\nUnampa ${milkLitres} L – hii ni chini sana!\n✅ Ongeza hadi ${idealMilk} L/siku ili kuzuia udumavu na magonjwa.\n` :
                    isFrench ? `\n🔴 CRITIQUE: Le veau de ${age} semaines a besoin de ${idealMilk} L de lait par jour.\nVous donnez ${milkLitres} L – c'est trop peu!\n✅ Augmentez à ${idealMilk} L/jour pour éviter le retard de croissance.\n` :
                    isSpanish ? `\n🔴 CRÍTICO: El ternero de ${age} semanas necesita ${idealMilk} L de leche al día.\nEstá dando ${milkLitres} L – ¡es muy poco!\n✅ Aumente a ${idealMilk} L/día para evitar retraso en el crecimiento.\n` :
                    `\n🔴 CRITICAL: A ${age}-week-old calf needs ${idealMilk} L of milk per day.\nYou're feeding ${milkLitres} L – this is too low!\n✅ Increase to ${idealMilk} L/day to prevent stunted growth.\n`;
      }
    }

    if (colostrum === 'no' || colostrum === 'false') {
      content += isSwahili ? `\n⚠️ Kolostramu ndani ya saa 6 ni MUHIMU kwa kinga.\nWasiliana na daktari wa mifugo kwa kibadala cha kolostramu.\n` :
                  isFrench ? `\n⚠️ Le colostrum dans les 6 premières heures est ESSENTIEL pour l'immunité.\nConsultez un vétérinaire pour des substituts.\n` :
                  isSpanish ? `\n⚠️ El calostro en las primeras 6 horas es ESENCIAL para la inmunidad.\nConsulte a un veterinario para sucedáneos.\n` :
                  `\n⚠️ Colostrum within 6 hours is ESSENTIAL for immunity.\nConsult your vet about colostrum replacers.\n`;
    }

    if (housing === 'individual_pen') {
      content += isSwahili ? `✅ Banda la mtu binafsi linafaa kwa umri huu – weka safi na kavu.\n` :
                  isFrench ? `✅ Le box individuel est idéal à cet âge – gardez-le propre et sec.\n` :
                  isSpanish ? `✅ El corral individual es ideal a esta edad – manténgalo limpio y seco.\n` :
                  `✅ Individual pen is ideal at this age – keep it clean and dry.\n`;
    } else if (housing === 'group_pen') {
      content += isSwahili ? `⚠️ Banda la pamoja ni hatari kwa ndama chini ya wiki 8.\nTumia banda la mtu binafsi ili kupunguza kuenea kwa magonjwa.\n` :
                  isFrench ? `⚠️ Le box collectif est risqué pour les veaux de moins de 8 semaines.\nUtilisez un box individuel pour réduire la propagation des maladies.\n` :
                  isSpanish ? `⚠️ El corral grupal es riesgoso para terneros menores de 8 semanas.\nUse corral individual para reducir la propagación de enfermedades.\n` :
                  `⚠️ Group pens are risky for calves under 8 weeks.\nUse individual pens to reduce disease spread.\n`;
    }

    if (health && health !== 'none') {
      content += isSwahili ? `\n⚠️ Matatizo ya afya yameripotiwa: ${health}.\nWasiliana na daktari wa mifugo mara moja.\n` :
                  isFrench ? `\n⚠️ Problèmes de santé signalés: ${health}.\nConsultez un vétérinaire immédiatement.\n` :
                  isSpanish ? `\n⚠️ Problemas de salud reportados: ${health}.\nConsulte a un veterinario inmediatamente.\n` :
                  `\n⚠️ Health issues reported: ${health}.\nConsult a veterinarian immediately.\n`;
    }

    content += isSwahili ? `\n📋 MPANGO WA HATUA:\n1. Lishe: ${Math.max(4, idealMilk || 4)} L maziwa/siku + maji safi\n2. Nyongeza: Weka malisho bora na madini\n3. Afya: Angalia dalili za ugonjwa kila siku\n4. Usafi: Safisha banda na vifaa kila siku\n\n💡 Faida: Ulezi mzuri huongeza uzito wa mwisho kwa kg 100+ – thamani ya Ksh 15,000+ kwa ng'ombe!` :
                isFrench ? `\n📋 PLAN D'ACTION:\n1. Alimentation: ${Math.max(4, idealMilk || 4)} L lait/jour + eau propre\n2. Compléments: Aliments de qualité + minéraux\n3. Santé: Surveillez les signes de maladie quotidiennement\n4. Hygiène: Nettoyez le box et les outils chaque jour\n\n💡 Avantage: Un bon élevage ajoute 100+ kg au poids adulte – valeur de Ksh 15,000+ par vache!` :
                isSpanish ? `\n📋 PLAN DE ACCIÓN:\n1. Alimentación: ${Math.max(4, idealMilk || 4)} L leche/día + agua limpia\n2. Suplementos: Alimentos de calidad + minerales\n3. Salud: Monitoree signos de enfermedad a diario\n4. Higiene: Limpie corral y herramientas cada día\n\n💡 Beneficio: Buena cría añade 100+ kg al peso adulto – valor de Ksh 15,000+ por vaca!` :
                `\n📋 ACTION PLAN:\n1. Feed: ${Math.max(4, idealMilk || 4)} L milk/day + clean water\n2. Supplements: Quality feed + minerals\n3. Health: Check for disease signs daily\n4. Hygiene: Clean pen and tools daily\n\n💡 Business Impact: Proper calf rearing adds 100+ kg to mature weight – worth Ksh 15,000+ per cow!`;

    addToStructuredList('dairy_calf', { content });
    addToList(content);
  }

  // 7. Dairy Concentrate (FIXED – sanity check & contextual calcium)
  if (shouldInclude('dairy_concentrate')) {
    const brand = farmerData.dairyConcentrateBrand || '';
    const product = farmerData.dairyConcentrateProduct || '';
    const inclusion = parseFloat(farmerData.dairyConcentrateInclusion) || 0;
    const maize = parseFloat(farmerData.dairyConcentrateMaizeKg) || 0;
    const salt = parseFloat(farmerData.dairyConcentrateSaltKg) || 0;
    const calciumSource = farmerData.dairyConcentrateCalciumSource || '';
    const calciumKg = parseFloat(farmerData.dairyConcentrateCalciumKg) || 0;

    let content = isSwahili ? `🧪 MFUMO WA MCHANGANYIKO WA MAZIWA\n` :
                   isFrench ? `🧪 FORMULATION DU CONCENTRÉ LAITIER\n` :
                   isSpanish ? `🧪 FORMULACIÓN DEL CONCENTRADO LÁCTEO\n` :
                   `🧪 DAIRY CONCENTRATE FORMULATION\n`;

    if (brand) content += isSwahili ? `Chapa: ${brand}\n` : isFrench ? `Marque: ${brand}\n` : isSpanish ? `Marca: ${brand}\n` : `Brand: ${brand}\n`;
    if (product) content += isSwahili ? `Bidhaa: ${product}\n` : isFrench ? `Produit: ${product}\n` : isSpanish ? `Producto: ${product}\n` : `Product: ${product}\n`;
    if (inclusion > 0) content += isSwahili ? `Kiasi cha mchanganyiko: ${inclusion} kg/ng'ombe/siku\n` : isFrench ? `Quantité de concentré: ${inclusion} kg/vache/jour\n` : isSpanish ? `Cantidad de concentrado: ${inclusion} kg/vaca/día\n` : `Concentrate amount: ${inclusion} kg/cow/day\n`;
    if (maize > 0) content += isSwahili ? `Mahindi: ${maize} kg/ng'ombe/siku\n` : isFrench ? `Maïs: ${maize} kg/vache/jour\n` : isSpanish ? `Maíz: ${maize} kg/vaca/día\n` : `Maize: ${maize} kg/cow/day\n`;
    if (salt > 0) content += isSwahili ? `Chumvi: ${salt} kg/ng'ombe/siku\n` : isFrench ? `Sel: ${salt} kg/vache/jour\n` : isSpanish ? `Sal: ${salt} kg/vaca/día\n` : `Salt: ${salt} kg/cow/day\n`;
    if (calciumSource) content += isSwahili ? `Chanzo cha kalsiamu: ${calciumSource}\n` : isFrench ? `Source de calcium: ${calciumSource}\n` : isSpanish ? `Fuente de calcio: ${calciumSource}\n` : `Calcium source: ${calciumSource}\n`;
    if (calciumKg > 0) content += isSwahili ? `Kiasi cha kalsiamu: ${calciumKg} kg/ng'ombe/siku\n` : isFrench ? `Quantité de calcium: ${calciumKg} kg/vache/jour\n` : isSpanish ? `Cantidad de calcio: ${calciumKg} kg/vaca/día\n` : `Calcium amount: ${calciumKg} kg/cow/day\n`;

    if (inclusion > 0 && maize > 0) {
      const totalMix = inclusion + maize;
      const concentrateRatio = (inclusion / totalMix * 100).toFixed(0);
      const maizeRatio = (maize / totalMix * 100).toFixed(0);
      content += isSwahili ? `\n📊 UWIANO WA MCHANGANYIKO: ${concentrateRatio}% mchanganyiko, ${maizeRatio}% mahindi.\n` :
                  isFrench ? `\n📊 PROPORTION DU MÉLANGE: ${concentrateRatio}% concentré, ${maizeRatio}% maïs.\n` :
                  isSpanish ? `\n📊 PROPORCIÓN DE MEZCLA: ${concentrateRatio}% concentrado, ${maizeRatio}% maíz.\n` :
                  `\n📊 MIX RATIO: ${concentrateRatio}% concentrate, ${maizeRatio}% maize.\n`;

      if (parseInt(concentrateRatio) < 30) {
        content += isSwahili ? `⚠️ Mchanganyiko wako una koncentrati kidogo (chini ya 30%). Ongeza koncentrati hadi 40-50% kwa uzalishaji bora wa maziwa.\n` :
                    isFrench ? `⚠️ Votre mélange a trop peu de concentré (moins de 30%). Augmentez à 40-50% pour une meilleure production.\n` :
                    isSpanish ? `⚠️ Su mezcla tiene muy poco concentrado (menos del 30%). Aumente a 40-50% para mejor producción.\n` :
                    `⚠️ Your mix is low on concentrate (under 30%). Increase to 40-50% for better milk production.\n`;
      } else if (parseInt(concentrateRatio) > 60) {
        content += isSwahili ? `⚠️ Mchanganyiko wako una koncentrati nyingi (zaidi ya 60%). Hii inaweza kusababisha asidi tumboni. Punguza hadi 40-50%.\n` :
                    isFrench ? `⚠️ Votre mélange a trop de concentré (plus de 60%). Cela peut causer une acidose ruminale. Réduisez à 40-50%.\n` :
                    isSpanish ? `⚠️ Su mezcla tiene demasiado concentrado (más del 60%). Esto puede causar acidosis ruminal. Reduzca a 40-50%.\n` :
                    `⚠️ Your mix is high on concentrate (over 60%). This can cause rumen acidosis. Reduce to 40-50%.\n`;
      } else {
        content += isSwahili ? `✅ Uwiano mzuri! Endelea kwa uwiano huu.\n` :
                    isFrench ? `✅ Bon rapport! Continuez avec ce ratio.\n` :
                    isSpanish ? `✅ ¡Buena proporción! Continúe con esta relación.\n` :
                    `✅ Good ratio! Continue with this mix.\n`;
      }
    }

    // ----- SANITY CHECK (total feed > 30 kg) -----
    const totalConcentrate = inclusion + maize;
    if (totalConcentrate > 30) {
      content += isSwahili ? `⚠️ Jumla ya mchanganyiko (${totalConcentrate} kg) ni kubwa sana. Punguza hadi 20-30 kg/siku ili kuepuka asidi tumboni na kupunguza gharama.\n` :
                  isFrench ? `⚠️ La quantité totale de mélange (${totalConcentrate} kg) est trop élevée. Réduisez à 20-30 kg/jour pour éviter l'acidose ruminale et réduire les coûts.\n` :
                  isSpanish ? `⚠️ La cantidad total de mezcla (${totalConcentrate} kg) es muy alta. Reduzca a 20-30 kg/día para evitar acidosis ruminal y reducir costos.\n` :
                  `⚠️ Total mix (${totalConcentrate} kg) is too high. Reduce to 20-30 kg/day to avoid rumen acidosis and cut costs.\n`;
    }

    if (salt > 0 && salt < 0.05) {
      content += isSwahili ? `⚠️ Chumvi kidogo sana (${salt} kg). Ongeza hadi 0.05-0.1 kg/ng'ombe/siku.\n` :
                  isFrench ? `⚠️ Trop peu de sel (${salt} kg). Augmentez à 0.05-0.1 kg/vache/jour.\n` :
                  isSpanish ? `⚠️ Muy poca sal (${salt} kg). Aumente a 0.05-0.1 kg/vaca/día.\n` :
                  `⚠️ Too little salt (${salt} kg). Increase to 0.05-0.1 kg/cow/day.\n`;
    }

    if (calciumSource === 'none' || !calciumSource) {
      content += isSwahili ? `⚠️ Hakuna chanzo cha kalsiamu! Ongeza limestone au DCP ili kuzuia ugonjwa wa mifupa na kupungua maziwa.\n` :
                  isFrench ? `⚠️ Pas de source de calcium! Ajoutez du calcaire ou du DCP pour prévenir les maladies osseuses et la baisse de production.\n` :
                  isSpanish ? `⚠️ ¡Sin fuente de calcio! Agregue caliza o DCP para prevenir enfermedades óseas y caída de producción.\n` :
                  `⚠️ No calcium source! Add limestone or DCP to prevent bone disease and milk drop.\n`;
    } else {
      // ----- CONTEXTUAL CALCIUM ADVICE -----
      content += isSwahili ? `✅ Unaendelea kutumia ${calciumSource}. Hakikisha unatoa 0.1-0.2 kg/ng'ombe/siku.\n` :
                  isFrench ? `✅ Vous utilisez déjà ${calciumSource}. Assurez-vous de fournir 0.1-0.2 kg/vache/jour.\n` :
                  isSpanish ? `✅ Ya está usando ${calciumSource}. Asegure 0.1-0.2 kg/vaca/día.\n` :
                  `✅ You're already using ${calciumSource}. Ensure you provide 0.1-0.2 kg/cow/day.\n`;
    }

    content += isSwahili ? `\n📋 MAPENDEKEZO:\n• Hakikisha mchanganyiko una 40-50% koncentrati\n• Salt: 0.05-0.1 kg/ng'ombe/siku\n• Calcium: 0.1-0.2 kg/ng'ombe/siku\n• Vitamin pre-mix: 50-100g/ng'ombe/siku` :
                isFrench ? `\n📋 RECOMMANDATIONS:\n• Assurez 40-50% de concentré dans le mélange\n• Sel: 0.05-0.1 kg/vache/jour\n• Calcium: 0.1-0.2 kg/vache/jour\n• Prémix vitaminé: 50-100g/vache/jour` :
                isSpanish ? `\n📋 RECOMENDACIONES:\n• Asegure 40-50% de concentrado en la mezcla\n• Sal: 0.05-0.1 kg/vaca/día\n• Calcio: 0.1-0.2 kg/vaca/día\n• Premezcla vitamínica: 50-100g/vaca/día` :
                `\n📋 RECOMMENDATIONS:\n• Ensure 40-50% concentrate in the mix\n• Salt: 0.05-0.1 kg/cow/day\n• Calcium: 0.1-0.2 kg/cow/day\n• Vitamin pre-mix: 50-100g/cow/day`;

    addToStructuredList('dairy_concentrate', { content });
    addToList(content);
  }

  // 8. Dairy Feed (TMR – Enhanced)
  if (shouldInclude('dairy_feed')) {
    const forages = farmerData.dairyAvailableForages || '';
    const grains = farmerData.dairyAvailableGrains || '';
    const proteins = farmerData.dairyAvailableProtein || '';
    const minerals = farmerData.dairyAvailableMinerals || '';
    const quantity = parseFloat(farmerData.dairyQuantityToMix) || 0;

    let content = isSwahili ? `🌾 MAPENDEKEZO YA MALISHO (TMR)\n` :
                   isFrench ? `🌾 RECOMMANDATIONS ALIMENTAIRES (TMR)\n` :
                   isSpanish ? `🌾 RECOMENDACIONES DE ALIMENTACIÓN (TMR)\n` :
                   `🌾 FEED RECOMMENDATIONS (TMR)\n`;

    if (forages) content += isSwahili ? `Nyasi zilizopo: ${forages}\n` : isFrench ? `Fourrages disponibles: ${forages}\n` : isSpanish ? `Forrajes disponibles: ${forages}\n` : `Forages available: ${forages}\n`;
    if (grains) content += isSwahili ? `Nafaka: ${grains}\n` : isFrench ? `Céréales: ${grains}\n` : isSpanish ? `Granos: ${grains}\n` : `Grains: ${grains}\n`;
    if (proteins) content += isSwahili ? `Vyanzo vya protini: ${proteins}\n` : isFrench ? `Sources de protéines: ${proteins}\n` : isSpanish ? `Fuentes de proteína: ${proteins}\n` : `Protein sources: ${proteins}\n`;
    if (minerals) content += isSwahili ? `Madini na viungio: ${minerals}\n` : isFrench ? `Minéraux et additifs: ${minerals}\n` : isSpanish ? `Minerales y aditivos: ${minerals}\n` : `Minerals and additives: ${minerals}\n`;
    if (quantity > 0) content += isSwahili ? `Kiasi cha mchanganyiko: ${quantity} kg/siku\n` : isFrench ? `Quantité de mélange: ${quantity} kg/jour\n` : isSpanish ? `Cantidad de mezcla: ${quantity} kg/día\n` : `Mix quantity: ${quantity} kg/day\n`;

    const hasForage = forages && forages.length > 0;
    const hasGrain = grains && grains.length > 0;
    const hasProtein = proteins && proteins.length > 0;
    const hasMineral = minerals && minerals.length > 0;

    if (!hasForage) {
      content += isSwahili ? `\n🔴 MUHIMU: Hakuna nyasi zilizoorodheshwa! Nyasi (50-60% ya TMR) ni muhimu kwa afya ya ng'ombe.\n` :
                  isFrench ? `\n🔴 CRITIQUE: Pas de fourrages listés! Les fourrages (50-60% du TMR) sont essentiels pour la santé.\n` :
                  isSpanish ? `\n🔴 CRÍTICO: ¡No hay forrajes listados! Los forrajes (50-60% del TMR) son esenciales para la salud.\n` :
                  `\n🔴 CRITICAL: No forages listed! Forages (50-60% of TMR) are essential for cow health.\n`;
    }

    if (!hasGrain && !hasProtein) {
      content += isSwahili ? `⚠️ Hakuna nafaka au protini! Hii inapunguza uzalishaji wa maziwa. Ongeza angalau moja.\n` :
                  isFrench ? `⚠️ Pas de céréales ni de protéines! Cela réduit la production laitière. Ajoutez au moins un.\n` :
                  isSpanish ? `⚠️ ¡Sin granos ni proteínas! Esto reduce la producción de leche. Agregue al menos uno.\n` :
                  `⚠️ No grains or proteins! This reduces milk production. Add at least one.\n`;
    }

    if (!hasMineral) {
      content += isSwahili ? `⚠️ Hakuna madini! Madini ni muhimu kwa ubora wa maziwa na afya ya ng'ombe.\n` :
                  isFrench ? `⚠️ Pas de minéraux! Les minéraux sont importants pour la qualité du lait et la santé.\n` :
                  isSpanish ? `⚠️ ¡Sin minerales! Los minerales son importantes para la calidad de la leche y la salud.\n` :
                  `⚠️ No minerals! Minerals are important for milk quality and cow health.\n`;
    }

    if (hasForage && hasGrain && hasProtein && hasMineral) {
      content += isSwahili ? `✅ Mchanganyiko mzuri! Hakikisha uwiano: 50-60% nyasi, 20-30% nafaka, 15-20% protini, 2-5% madini.\n` :
                  isFrench ? `✅ Bon mélange! Assurez les ratios: 50-60% fourrages, 20-30% céréales, 15-20% protéines, 2-5% minéraux.\n` :
                  isSpanish ? `✅ ¡Buena mezcla! Asegure las proporciones: 50-60% forrajes, 20-30% granos, 15-20% proteínas, 2-5% minerales.\n` :
                  `✅ Good mix! Ensure ratios: 50-60% forages, 20-30% grains, 15-20% proteins, 2-5% minerals.\n`;
    }

    content += isSwahili ? `\n📋 MPANGO WA KULISHA:\n1. Nyasi: kilo 20-30 kwa siku (msingi wa chakula)\n2. Nafaka: kilo 3-5 kwa siku (nishati)\n3. Protini: kilo 1-2 kwa siku (maziwa)\n4. Madini: 100-200g kwa siku (ubora)\n\n💡 Faida: Mchanganyiko mzuri huongeza maziwa kwa lita 5-10 kwa siku!` :
                isFrench ? `\n📋 PLAN D'ALIMENTATION:\n1. Fourrages: 20-30 kg/jour (base de l'alimentation)\n2. Céréales: 3-5 kg/jour (énergie)\n3. Protéines: 1-2 kg/jour (lait)\n4. Minéraux: 100-200g/jour (qualité)\n\n💡 Avantage: Un bon TMR augmente le lait de 5-10 L/jour!` :
                isSpanish ? `\n📋 PLAN DE ALIMENTACIÓN:\n1. Forrajes: 20-30 kg/día (base de la alimentación)\n2. Granos: 3-5 kg/día (energía)\n3. Proteínas: 1-2 kg/día (leche)\n4. Minerales: 100-200g/día (calidad)\n\n💡 Beneficio: ¡Un buen TMR aumenta la leche en 5-10 L/día!` :
                `\n📋 FEEDING PLAN:\n1. Forages: 20-30 kg/day (feed base)\n2. Grains: 3-5 kg/day (energy)\n3. Proteins: 1-2 kg/day (milk)\n4. Minerals: 100-200g/day (quality)\n\n💡 Benefit: Good TMR increases milk by 5-10 L/day!`;

    addToStructuredList('dairy_feed', { content });
    addToList(content);
  }

  // 9. Dairy Feed Per Day (FIXED idealConcentrate scoping)
  if (shouldInclude('dairy_feed')) {
    const forageType = farmerData.dairyForageType || '';
    const forageKg = parseFloat(farmerData.dairyForageKgPerDay) || 0;
    const concentrateType = farmerData.dairyConcentrateType || '';
    const concentrateKg = parseFloat(farmerData.dairyConcentrateKgPerDay) || 0;
    const milkYield = parseFloat(farmerData.dairyMilkYield) || 0;

    let idealConcentrate = 0;

    let content = isSwahili ? `🍽️ MPANGO WA MALISHO KWA SIKU\n` :
                   isFrench ? `🍽️ PLAN D'ALIMENTATION QUOTIDIENNE\n` :
                   isSpanish ? `🍽️ PLAN DE ALIMENTACIÓN DIARIA\n` :
                   `🍽️ DAILY FEED PLAN\n`;

    if (forageType) content += isSwahili ? `Aina ya nyasi: ${forageType}\n` : isFrench ? `Type de fourrage: ${forageType}\n` : isSpanish ? `Tipo de forraje: ${forageType}\n` : `Forage type: ${forageType}\n`;
    if (forageKg > 0) content += isSwahili ? `Nyasi kwa siku: ${forageKg} kg\n` : isFrench ? `Fourrage par jour: ${forageKg} kg\n` : isSpanish ? `Forraje por día: ${forageKg} kg\n` : `Forage per day: ${forageKg} kg\n`;
    if (concentrateType) content += isSwahili ? `Aina ya mchanganyiko: ${concentrateType}\n` : isFrench ? `Type de concentré: ${concentrateType}\n` : isSpanish ? `Tipo de concentrado: ${concentrateType}\n` : `Concentrate type: ${concentrateType}\n`;
    if (concentrateKg > 0) content += isSwahili ? `Mchanganyiko kwa siku: ${concentrateKg} kg\n` : isFrench ? `Concentré par jour: ${concentrateKg} kg\n` : isSpanish ? `Concentrado por día: ${concentrateKg} kg\n` : `Concentrate per day: ${concentrateKg} kg\n`;
    if (milkYield > 0) content += isSwahili ? `Maziwa kwa siku: ${milkYield} L\n` : isFrench ? `Lait par jour: ${milkYield} L\n` : isSpanish ? `Leche por día: ${milkYield} L\n` : `Milk per day: ${milkYield} L\n`;

    if (milkYield > 0) {
      idealConcentrate = Math.round(milkYield * 0.3);
      if (concentrateKg > 0 && concentrateKg < idealConcentrate * 0.7) {
        content += isSwahili ? `\n⚠️ Mchanganyiko wako ni mdogo kwa uzalishaji wa ${milkYield} L maziwa.\nInapendekezwa: ${idealConcentrate} kg mchanganyiko kwa siku (mbali na nyasi).\nOngeza koncentrati ili kuongeza maziwa.\n` :
                    isFrench ? `\n⚠️ Votre concentré est insuffisant pour ${milkYield} L de lait.\nRecommandé: ${idealConcentrate} kg de concentré par jour (en plus du fourrage).\nAugmentez le concentré pour augmenter la production.\n` :
                    isSpanish ? `\n⚠️ Su concentrado es bajo para ${milkYield} L de leche.\nRecomendado: ${idealConcentrate} kg de concentrado por día (además del forraje).\nAumente el concentrado para aumentar la producción.\n` :
                    `\n⚠️ Your concentrate is low for ${milkYield} L of milk.\nRecommended: ${idealConcentrate} kg concentrate per day (plus forage).\nIncrease concentrate to boost milk production.\n`;
      } else if (concentrateKg > idealConcentrate * 1.3) {
        content += isSwahili ? `\n⚠️ Mchanganyiko wako ni mwingi (${concentrateKg} kg) kwa ${milkYield} L maziwa.\nPunguza hadi ${idealConcentrate} kg/siku ili kupunguza gharama na kuzuia asidi tumboni.\n` :
                    isFrench ? `\n⚠️ Votre concentré est élevé (${concentrateKg} kg) pour ${milkYield} L de lait.\nRéduisez à ${idealConcentrate} kg/jour pour réduire les coûts et éviter l'acidose.\n` :
                    isSpanish ? `\n⚠️ Su concentrado es alto (${concentrateKg} kg) para ${milkYield} L de leche.\nReduzca a ${idealConcentrate} kg/día para reducir costos y evitar acidosis.\n` :
                    `\n⚠️ Your concentrate is high (${concentrateKg} kg) for ${milkYield} L of milk.\nReduce to ${idealConcentrate} kg/day to cut costs and avoid acidosis.\n`;
      } else if (concentrateKg > 0) {
        content += isSwahili ? `✅ Kiasi cha mchanganyiko kinafaa kwa uzalishaji wako!\n` :
                    isFrench ? `✅ La quantité de concentré est adaptée à votre production!\n` :
                    isSpanish ? `✅ ¡La cantidad de concentrado es adecuada para su producción!\n` :
                    `✅ Concentrate amount is appropriate for your production!\n`;
      }
    }

    if (forageKg > 0 && forageKg < 15) {
      content += isSwahili ? `⚠️ Nyasi ${forageKg} kg ni chache sana. Ongeza hadi 20-30 kg/siku kwa afya bora ya ng'ombe.\n` :
                  isFrench ? `⚠️ ${forageKg} kg de fourrage est trop peu. Augmentez à 20-30 kg/jour pour une meilleure santé.\n` :
                  isSpanish ? `⚠️ ${forageKg} kg de forraje es muy poco. Aumente a 20-30 kg/día para mejor salud.\n` :
                  `⚠️ ${forageKg} kg of forage is too low. Increase to 20-30 kg/day for better cow health.\n`;
    }

    content += isSwahili ? `\n📋 MUONGOZO WA KULISHA:\n• Nyasi: 20-30 kg/siku (asili ya chakula)\n• Mchanganyiko: ${idealConcentrate || 4}-${Math.round((idealConcentrate || 4) * 1.3)} kg/siku (kulingana na maziwa)\n• Maji safi: lita 80-120/siku\n• Usawa: Endelea kurekebisha kulingana na uzalishaji wa maziwa` :
                isFrench ? `\n📋 GUIDE D'ALIMENTATION:\n• Fourrage: 20-30 kg/jour (base de l'alimentation)\n• Concentré: ${idealConcentrate || 4}-${Math.round((idealConcentrate || 4) * 1.3)} kg/jour (selon la production)\n• Eau propre: 80-120 L/jour\n• Ajustez selon la production laitière` :
                isSpanish ? `\n📋 GUÍA DE ALIMENTACIÓN:\n• Forraje: 20-30 kg/día (base de la alimentación)\n• Concentrado: ${idealConcentrate || 4}-${Math.round((idealConcentrate || 4) * 1.3)} kg/día (según producción)\n• Agua limpia: 80-120 L/día\n• Ajuste según producción de leche` :
                `\n📋 FEEDING GUIDE:\n• Forage: 20-30 kg/day (feed base)\n• Concentrate: ${idealConcentrate || 4}-${Math.round((idealConcentrate || 4) * 1.3)} kg/day (based on yield)\n• Clean water: 80-120 L/day\n• Adjust based on milk production`;

    addToStructuredList('dairy_feed', { content });
    addToList(content);
  }

  // 10. Dairy Housing (FIXED thresholds & ventilation context)
  if (shouldInclude('dairy_housing')) {
    const housingType = farmerData.dairyHousingType || '';
    const cowsHoused = parseInt(farmerData.numberOfCowsHoused) || 0;
    const floorSpace = parseFloat(farmerData.floorSpacePerCowM2) || 0;
    const ventilation = farmerData.dairyVentilationRating || '';
    const bedding = farmerData.beddingType || '';

    let content = isSwahili ? `🏠 USHAURI WA MAKAZI\n` :
                   isFrench ? `🏠 CONSEILS DE LOGEMENT\n` :
                   isSpanish ? `🏠 CONSEJOS DE ALOJAMIENTO\n` :
                   `🏠 HOUSING ADVICE\n`;

    if (housingType) content += isSwahili ? `Aina ya makazi: ${housingType}\n` : isFrench ? `Type de logement: ${housingType}\n` : isSpanish ? `Tipo de alojamiento: ${housingType}\n` : `Housing type: ${housingType}\n`;
    if (cowsHoused > 0) content += isSwahili ? `Ng'ombe wanaoishi: ${cowsHoused}\n` : isFrench ? `Vaches logées: ${cowsHoused}\n` : isSpanish ? `Vacas alojadas: ${cowsHoused}\n` : `Cows housed: ${cowsHoused}\n`;
    if (floorSpace > 0) content += isSwahili ? `Nafasi ya sakafu: ${floorSpace} m²/ng'ombe\n` : isFrench ? `Espace au sol: ${floorSpace} m²/vache\n` : isSpanish ? `Espacio de piso: ${floorSpace} m²/vaca\n` : `Floor space: ${floorSpace} m²/cow\n`;
    if (ventilation) content += isSwahili ? `Uingizaji hewa: ${ventilation}\n` : isFrench ? `Ventilation: ${ventilation}\n` : isSpanish ? `Ventilación: ${ventilation}\n` : `Ventilation: ${ventilation}\n`;
    if (bedding) content += isSwahili ? `Aina ya matandiko: ${bedding}\n` : isFrench ? `Type de litière: ${bedding}\n` : isSpanish ? `Tipo de cama: ${bedding}\n` : `Bedding type: ${bedding}\n`;

    // ----- FIXED THRESHOLDS -----
    if (floorSpace > 0 && floorSpace < 3) {
      content += isSwahili ? `\n🔴 MUHIMU: Nafasi ${floorSpace} m² ni chini sana! Minimum ni 3 m²/ng'ombe.\nOngeza nafasi ili kuzuia msongo, majeraha, na kupungua maziwa.\n` :
                  isFrench ? `\n🔴 CRITIQUE: ${floorSpace} m² est trop peu! Minimum 3 m²/vache.\nAugmentez l'espace pour éviter le stress, les blessures et la baisse de production.\n` :
                  isSpanish ? `\n🔴 CRÍTICO: ${floorSpace} m² es muy poco! Mínimo 3 m²/vaca.\nAumente el espacio para evitar estrés, lesiones y caída de producción.\n` :
                  `\n🔴 CRITICAL: ${floorSpace} m² is too low! Minimum is 3 m²/cow.\nIncrease space to prevent stress, injuries, and milk drop.\n`;
    } else if (floorSpace >= 3 && floorSpace < 4.5) {
      content += isSwahili ? `🟡 Nafasi ni nzuri (${floorSpace} m²). Nafasi bora ni 4-5 m²/ng'ombe kwa faraja zaidi.\n` :
                  isFrench ? `🟡 L'espace est bon (${floorSpace} m²). Idéal: 4-5 m²/vache pour plus de confort.\n` :
                  isSpanish ? `🟡 El espacio es bueno (${floorSpace} m²). Ideal: 4-5 m²/vaca para más confort.\n` :
                  `🟡 Space is good (${floorSpace} m²). Ideal is 4-5 m²/cow for more comfort.\n`;
    } else if (floorSpace >= 4.5) {
      content += isSwahili ? `✅ Nafasi bora! Hii inasaidia afya na uzalishaji wa maziwa.\n` :
                  isFrench ? `✅ Excellent espace! Cela favorise la santé et la production laitière.\n` :
                  isSpanish ? `✅ ¡Excelente espacio! Esto favorece la salud y la producción de leche.\n` :
                  `✅ Excellent space! This supports cow health and milk production.\n`;
    }

    // ----- VENTILATION CONTEXT -----
    if (ventilation === 'poor') {
      content += isSwahili ? `⚠️ Uingizaji hewa mbovu! Hii husababisha magonjwa ya mapafu na kupungua maziwa.\nFungua madirisha au weka feni za uingizaji hewa.\n` :
                  isFrench ? `⚠️ Mauvaise ventilation! Cela cause des maladies respiratoires et une baisse de production.\nOuvrez les fenêtres ou installez des ventilateurs.\n` :
                  isSpanish ? `⚠️ ¡Mala ventilación! Esto causa enfermedades respiratorias y caída de producción.\nAbra ventanas o instale ventiladores.\n` :
                  `⚠️ Poor ventilation! This causes respiratory diseases and milk drop.\nOpen windows or install fans.\n`;
    } else if (ventilation === 'average') {
      content += isSwahili ? `🟡 Uingizaji hewa wa wastani. Ongeza madirisha au feni ili kuboresha hadi 'nzuri'.\n` :
                  isFrench ? `🟡 Ventilation moyenne. Améliorez en ajoutant des fenêtres ou des ventilateurs pour atteindre 'bonne'.\n` :
                  isSpanish ? `🟡 Ventilación media. Mejore agregando ventanas o ventiladores para alcanzar 'buena'.\n` :
                  `🟡 Average ventilation. Improve by adding windows or fans to reach 'good' status.\n`;
    } else if (ventilation === 'good') {
      content += isSwahili ? `✅ Uingizaji hewa mzuri – hii ni muhimu kwa afya ya ng'ombe.\n` :
                  isFrench ? `✅ Bonne ventilation – essentielle pour la santé des vaches.\n` :
                  isSpanish ? `✅ Buena ventilación – esencial para la salud de las vacas.\n` :
                  `✅ Good ventilation – essential for cow health.\n`;
    }

    if (!bedding || bedding === 'none') {
      content += isSwahili ? `⚠️ Hakuna matandiko! Weka matandiko (majani, mchanga, au vumbi) ili kupunguza majeraha na kuongeza faraja.\n` :
                  isFrench ? `⚠️ Pas de litière! Ajoutez de la litière (paille, sable, sciure) pour réduire les blessures et améliorer le confort.\n` :
                  isSpanish ? `⚠️ ¡Sin cama! Agregue cama (paja, arena, aserrín) para reducir lesiones y mejorar el confort.\n` :
                  `⚠️ No bedding! Add bedding (straw, sand, sawdust) to reduce injuries and improve comfort.\n`;
    }

    content += isSwahili ? `\n📋 MAPENDEKEZO:\n• Nafasi: 4-5 m²/ng'ombe\n• Uingizaji hewa: mzuri (madirisha au feni)\n• Matandiko: 10-15 cm ya majani au vumbi\n• Usafi: Safisha kila siku ili kuzuia magonjwa` :
                isFrench ? `\n📋 RECOMMANDATIONS:\n• Espace: 4-5 m²/vache\n• Ventilation: bonne (fenêtres ou ventilateurs)\n• Litière: 10-15 cm de paille ou sciure\n• Hygiène: Nettoyez quotidiennement pour éviter les maladies` :
                isSpanish ? `\n📋 RECOMENDACIONES:\n• Espacio: 4-5 m²/vaca\n• Ventilación: buena (ventanas o ventiladores)\n• Cama: 10-15 cm de paja o aserrín\n• Higiene: Limpie diariamente para evitar enfermedades` :
                `\n📋 RECOMMENDATIONS:\n• Space: 4-5 m²/cow\n• Ventilation: good (windows or fans)\n• Bedding: 10-15 cm straw or sawdust\n• Hygiene: Clean daily to prevent disease`;

    addToStructuredList('dairy_housing', { content });
    addToList(content);
  }

  // 11. Dairy Milk Production (FIXED – yield sanity, protein warning, fat context)
  if (shouldInclude('dairy_milk')) {
    const yieldCur = parseFloat(farmerData.milkYieldCurrent) || 0;
    const fat = parseFloat(farmerData.milkFatPercent) || 0;
    const protein = parseFloat(farmerData.milkProteinPercent) || 0;
    const dim = parseInt(farmerData.daysInMilk) || 0;
    const parity = farmerData.parity || '';

    let content = isSwahili ? `🥛 UCHAMBUZI WA MAZIWA\n` :
                   isFrench ? `🥛 ANALYSE DU LAIT\n` :
                   isSpanish ? `🥛 ANÁLISIS DE LECHE\n` :
                   `🥛 MILK ANALYSIS\n`;

    if (yieldCur > 0) content += isSwahili ? `Maziwa kwa siku: ${yieldCur} L\n` : isFrench ? `Lait par jour: ${yieldCur} L\n` : isSpanish ? `Leche por día: ${yieldCur} L\n` : `Milk per day: ${yieldCur} L\n`;
    if (fat > 0) content += isSwahili ? `Mafuta ya maziwa: ${fat}%\n` : isFrench ? `Matière grasse: ${fat}%\n` : isSpanish ? `Grasa láctea: ${fat}%\n` : `Milk fat: ${fat}%\n`;
    if (protein > 0) content += isSwahili ? `Protini ya maziwa: ${protein}%\n` : isFrench ? `Protéine du lait: ${protein}%\n` : isSpanish ? `Proteína de la leche: ${protein}%\n` : `Milk protein: ${protein}%\n`;
    if (dim > 0) content += isSwahili ? `Siku za kukamua: ${dim}\n` : isFrench ? `Jours en lactation: ${dim}\n` : isSpanish ? `Días en lactancia: ${dim}\n` : `Days in milk: ${dim}\n`;
    if (parity) content += isSwahili ? `Mzunguko wa ng'ombe: ${parity}\n` : isFrench ? `Parité: ${parity}\n` : isSpanish ? `Paridad: ${parity}\n` : `Parity: ${parity}\n`;

    // ----- YIELD SANITY -----
    if (yieldCur > 50) {
      content += isSwahili ? `⚠️ Maziwa ${yieldCur} L ni mengi sana! Thibitisha kipimo. Maksimumi ni ~50 L/siku.\n` :
                  isFrench ? `⚠️ ${yieldCur} L de lait est trop élevé! Vérifiez la mesure. Le maximum est d'environ 50 L/jour.\n` :
                  isSpanish ? `⚠️ ${yieldCur} L de leche es demasiado alto! Verifique la medición. El máximo es ~50 L/día.\n` :
                  `⚠️ ${yieldCur} L of milk is too high! Verify measurement. Maximum is ~50 L/day.\n`;
    }

    // ----- FAT CONTEXT -----
    if (fat > 0 && fat < 3.5) {
      content += isSwahili ? `\n⚠️ Mafuta ya maziwa ni chini (${fat}%). Ongeza nyasi au punguza nafaka ili kuongeza mafuta.\n` :
                  isFrench ? `\n⚠️ La matière grasse est basse (${fat}%). Augmentez les fourrages ou réduisez les céréales.\n` :
                  isSpanish ? `\n⚠️ La grasa láctea es baja (${fat}%). Aumente los forrajes o reduzca los granos.\n` :
                  `\n⚠️ Milk fat is low (${fat}%). Increase forages or reduce grains to boost fat.\n`;
    } else if (fat > 4.5) {
      content += isSwahili ? `🟢 Mafuta mazuri! Hii inaonyesha malisho bora.\n` :
                  isFrench ? `🟢 Bonne matière grasse! Cela indique une bonne alimentation.\n` :
                  isSpanish ? `🟢 ¡Buena grasa! Esto indica buena alimentación.\n` :
                  `🟢 Good fat! This indicates good feeding.\n`;
    }

    // ----- PROTEIN WARNING -----
    if (protein > 0) {
      if (protein > 4.5) {
        content += isSwahili ? `⚠️ Protini ni ya juu sana (${protein}%). Inaweza kuashiria upungufu wa maji au ugonjwa. Wasiliana na daktari wa mifugo.\n` :
                    isFrench ? `⚠️ La protéine est trop élevée (${protein}%). Peut indiquer une déshydratation ou une maladie. Consultez un vétérinaire.\n` :
                    isSpanish ? `⚠️ La proteína es demasiado alta (${protein}%). Puede indicar deshidratación o enfermedad. Consulte a un veterinario.\n` :
                    `⚠️ Protein is too high (${protein}%). May indicate dehydration or disease. Consult a vet.\n`;
      } else if (protein < 2.5) {
        content += isSwahili ? `⚠️ Protini ni chini (${protein}%). Ongeza protini katika malisho (soya, sunflower cake).\n` :
                    isFrench ? `⚠️ La protéine est basse (${protein}%). Augmentez les protéines dans l'alimentation (soja, tourteau de tournesol).\n` :
                    isSpanish ? `⚠️ La proteína es baja (${protein}%). Aumente la proteína en la alimentación (soya, torta de girasol).\n` :
                    `⚠️ Protein is low (${protein}%). Increase protein in feed (soybean meal, sunflower cake).\n`;
      }
    }

    // ----- DIM CONTEXT -----
    if (dim > 0) {
      if (dim < 30) {
        content += isSwahili ? `\n⏳ Ng'ombe katika mwanzo wa kukamua (siku ${dim}). Uzalishaji utaongezeka hadi siku 60-90.\n` :
                    isFrench ? `\n⏳ Vache en début de lactation (${dim} jours). La production augmentera jusqu'à 60-90 jours.\n` :
                    isSpanish ? `\n⏳ Vaca en inicio de lactancia (${dim} días). La producción aumentará hasta los 60-90 días.\n` :
                    `\n⏳ Cow in early lactation (day ${dim}). Production will increase until 60-90 days.\n`;
      } else if (dim > 200) {
        content += isSwahili ? `\n⏳ Ng'ombe katika mwisho wa kukamua (siku ${dim}). Maziwa yatapungua. Jitayarishe kwa kukausha.\n` :
                    isFrench ? `\n⏳ Vache en fin de lactation (${dim} jours). Le lait diminuera. Préparez-vous pour le tarissement.\n` :
                    isSpanish ? `\n⏳ Vaca en final de lactancia (${dim} días). La leche disminuirá. Prepárese para el secado.\n` :
                    `\n⏳ Cow in late lactation (day ${dim}). Milk will decline. Prepare for drying off.\n`;
      }
    }

    content += isSwahili ? `\n📋 LENGO LA MAZIWA:\n• Mafuta: 3.5-4.5% (ideal)\n• Protini: 3.0-3.5% (ideal)\n• Uzalishaji: Lita 15-25 kwa siku (kulingana na aina)\n• Fuatilia mafuta na protini kila mwezi` :
                isFrench ? `\n📋 OBJECTIFS LAITIERS:\n• Matière grasse: 3.5-4.5% (idéal)\n• Protéine: 3.0-3.5% (idéal)\n• Production: 15-25 L/jour (selon la race)\n• Suivez la matière grasse et les protéines chaque mois` :
                isSpanish ? `\n📋 OBJETIVOS LÁCTEOS:\n• Grasa: 3.5-4.5% (ideal)\n• Proteína: 3.0-3.5% (ideal)\n• Producción: 15-25 L/día (según raza)\n• Monitoree grasa y proteína cada mes` :
                `\n📋 MILK TARGETS:\n• Fat: 3.5-4.5% (ideal)\n• Protein: 3.0-3.5% (ideal)\n• Yield: 15-25 L/day (depending on breed)\n• Monitor fat and protein monthly`;

    addToStructuredList('dairy_milk', { content });
    addToList(content);
  }

  // 12. Dairy Parasite (Enhanced)
  if (shouldInclude('dairy_parasite')) {
    const signs = farmerData.dairyParasiteSigns || '';
    if (signs) {
      let content = isSwahili ? `🐛 UDHIBITI WA VIMELEA\nDalili zilizoripotiwa: ${signs}\n\n` :
                     isFrench ? `🐛 LUTTE CONTRE LES PARASITES\nSignes signalés: ${signs}\n\n` :
                     isSpanish ? `🐛 CONTROL DE PARÁSITOS\nSeñales reportadas: ${signs}\n\n` :
                     `🐛 PARASITE CONTROL\nSigns reported: ${signs}\n\n`;

      const signList = signs.split(',').map(s => s.trim());

      if (signList.some(s => s === 'visible_ticks' || s === 'visible_lice')) {
        content += isSwahili ? `✅ WADUDU WA NJE: Tumia Cypermethrin pour-on (5ml/10kg) au Amitraz dip (0.5%) kila wiki 2-3.\n` :
                    isFrench ? `✅ PARASITES EXTERNES: Utilisez Cyperméthrine pour-on (5ml/10kg) ou bain Amitraz (0.5%) toutes les 2-3 semaines.\n` :
                    isSpanish ? `✅ PARÁSITOS EXTERNOS: Use Cipermetrina pour-on (5ml/10kg) o baño Amitraz (0.5%) cada 2-3 semanas.\n` :
                    `✅ EXTERNAL PARASITES: Use Cypermethrin pour-on (5ml/10kg) or Amitraz dip (0.5%) every 2-3 weeks.\n`;
      }

      if (signList.some(s => s === 'anaemia' || s === 'weight_loss' || s === 'bottle_jaw')) {
        content += isSwahili ? `⚠️ DALILI ZA MINYOO: Tumia Albendazole (10mg/kg) au Ivermectin (0.2mg/kg) kwa minyoo ya ndani.\n` :
                    isFrench ? `⚠️ SIGNES DE VERS: Utilisez Albendazole (10mg/kg) ou Ivermectine (0.2mg/kg) pour les vers internes.\n` :
                    isSpanish ? `⚠️ SIGNOS DE GUSANOS: Use Albendazol (10mg/kg) o Ivermectina (0.2mg/kg) para gusanos internos.\n` :
                    `⚠️ WORM SIGNS: Use Albendazole (10mg/kg) or Ivermectin (0.2mg/kg) for internal worms.\n`;
      }

      if (signList.some(s => s === 'diarrhoea_parasite' || s === 'weight_loss')) {
        content += isSwahili ? `⚠️ DIAREA NA MINYOO: Tumia Fenbendazole (7.5mg/kg) au Levamisole (7.5mg/kg) kwa minyoo ya matumbo.\n` :
                    isFrench ? `⚠️ DIARRHÉE ET VERS: Utilisez Fenbendazole (7.5mg/kg) ou Lévamisole (7.5mg/kg) pour les vers intestinaux.\n` :
                    isSpanish ? `⚠️ DIARREA Y GUSANOS: Use Fenbendazol (7.5mg/kg) o Levamisol (7.5mg/kg) para gusanos intestinales.\n` :
                    `⚠️ DIARRHOEA & WORMS: Use Fenbendazole (7.5mg/kg) or Levamisole (7.5mg/kg) for intestinal worms.\n`;
      }

      if (signList.some(s => s === 'cough_parasite')) {
        content += isSwahili ? `⚠️ KIKOHOZI CHA MINYOO: Tumia Ivermectin (0.2mg/kg) kwa minyoo ya mapafu.\n` :
                    isFrench ? `⚠️ TOUX PARASITAIRE: Utilisez Ivermectine (0.2mg/kg) pour les vers pulmonaires.\n` :
                    isSpanish ? `⚠️ TOS PARASITARIA: Use Ivermectina (0.2mg/kg) para gusanos pulmonares.\n` :
                    `⚠️ LUNGWORM COUGH: Use Ivermectin (0.2mg/kg) for lungworms.\n`;
      }

      if (signList.some(s => s === 'mange_lesions' || s === 'skin_irritation')) {
        content += isSwahili ? `⚠️ KIDUMA CHA NGOZI: Tumia Ivermectin (0.2mg/kg) au Sulfur lime dip (2.5%) kwa ukurutu.\n` :
                    isFrench ? `⚠️ LÉSIONS CUTANÉES: Utilisez Ivermectine (0.2mg/kg) ou bain de chaux sulfurée (2.5%) pour la gale.\n` :
                    isSpanish ? `⚠️ LESIONES CUTÁNEAS: Use Ivermectina (0.2mg/kg) o baño de cal sulfurada (2.5%) para la sarna.\n` :
                    `⚠️ SKIN LESIONS: Use Ivermectin (0.2mg/kg) or Sulfur lime dip (2.5%) for mange.\n`;
      }

      content += isSwahili ? `\n📋 MPANGO WA UDHIBITI:\n1. Deworming: Fanya kila baada ya wiki 3-4\n2. Kupe: Tumia pour-on kila wiki 2-3\n3. Usafi: Safisha zizi na uondoe mavi kila siku\n4. Mzunguko wa malisho: Badilisha malisho ili kupunguza minyoo` :
                  isFrench ? `\n📋 PLAN DE LUTTE:\n1. Vermifuge: Tous les 3-4 semaines\n2. Tiques: Pour-on toutes les 2-3 semaines\n3. Hygiène: Nettoyez l'étable et enlevez le fumier quotidiennement\n4. Rotation des pâturages` :
                  isSpanish ? `\n📋 PLAN DE CONTROL:\n1. Desparasitación: Cada 3-4 semanas\n2. Garrapatas: Pour-on cada 2-3 semanas\n3. Higiene: Limpie el establo y retire estiércol diariamente\n4. Rotación de pastos` :
                  `\n📋 CONTROL PLAN:\n1. Deworming: Every 3-4 weeks\n2. Ticks: Pour-on every 2-3 weeks\n3. Hygiene: Clean barn and remove manure daily\n4. Pasture rotation`;

      addToStructuredList('dairy_parasite', { content });
      addToList(content);
    }
  }

  // 13. Dairy Deficiency (Enhanced)
  if (shouldInclude('deficiency_analysis')) {
    const symptoms = farmerData.dairyDeficiencySymptoms || '';
    if (symptoms) {
      let content = isSwahili ? `🔬 UCHAMBUZI WA UPUNGUFU WA VIRUTUBISHO\nDalili zilizoripotiwa: ${symptoms}\n\n` :
                     isFrench ? `🔬 ANALYSE DES CARENCES NUTRITIONNELLES\nSymptômes signalés: ${symptoms}\n\n` :
                     isSpanish ? `🔬 ANÁLISIS DE DEFICIENCIA DE NUTRIENTES\nSíntomas reportados: ${symptoms}\n\n` :
                     `🔬 NUTRIENT DEFICIENCY ANALYSIS\nSymptoms reported: ${symptoms}\n\n`;

      const symptomList = symptoms.split(',').map(s => s.trim());

      if (symptomList.some(s => s === 'stiff_gait' || s === 'muscle_tremors')) {
        content += isSwahili ? `⚠️ DALILI ZA MAGNESIAMU (Mg): Ongeza magnesium oxide (50-100g/ng'ombe/siku) au Epsom salt.\n` :
                    isFrench ? `⚠️ SIGNES DE MAGNÉSIUM (Mg): Augmentez l'oxyde de magnésium (50-100g/vache/jour) ou le sel d'Epsom.\n` :
                    isSpanish ? `⚠️ SIGNOS DE MAGNESIO (Mg): Aumente el óxido de magnesio (50-100g/vaca/día) o la sal de Epsom.\n` :
                    `⚠️ MAGNESIUM SIGNS: Increase magnesium oxide (50-100g/cow/day) or Epsom salt.\n`;
      }

      if (symptomList.some(s => s === 'poor_appetite' || s === 'weight_loss')) {
        content += isSwahili ? `⚠️ DALILI ZA PROTEINI AU NISHATI: Ongeza protini (soya, sunflower cake) na nishati (maize, molasses).\n` :
                    isFrench ? `⚠️ SIGNES DE PROTÉINES OU D'ÉNERGIE: Augmentez les protéines (soja, tourteau de tournesol) et l'énergie (maïs, mélasse).\n` :
                    isSpanish ? `⚠️ SIGNOS DE PROTEÍNAS O ENERGÍA: Aumente proteínas (soya, torta de girasol) y energía (maíz, melaza).\n` :
                    `⚠️ PROTEIN OR ENERGY SIGNS: Increase protein (soybean meal, sunflower cake) and energy (maize, molasses).\n`;
      }

      if (symptomList.some(s => s === 'rough_coat' || s === 'anaemia')) {
        content += isSwahili ? `⚠️ DALILI ZA ZINC AU SHABA: Ongeza zinc (Zn) na copper (Cu) kupitia pre-mix ya madini.\n` :
                    isFrench ? `⚠️ SIGNES DE ZINC OU CUIVRE: Augmentez le zinc (Zn) et le cuivre (Cu) via un prémix minéral.\n` :
                    isSpanish ? `⚠️ SIGNOS DE ZINC O COBRE: Aumente zinc (Zn) y cobre (Cu) a través de un premezcla mineral.\n` :
                    `⚠️ ZINC OR COPPER SIGNS: Increase zinc (Zn) and copper (Cu) via mineral pre-mix.\n`;
      }

      if (symptomList.some(s => s === 'nervous_signs' || s === 'staggering')) {
        content += isSwahili ? `⚠️ DALILI ZA MAGNESIAMU AU KALSIMU: Ongeza magnesium oxide na limestone flour.\n` :
                    isFrench ? `⚠️ SIGNES DE MAGNÉSIUM OU CALCIUM: Augmentez l'oxyde de magnésium et la farine de calcaire.\n` :
                    isSpanish ? `⚠️ SIGNOS DE MAGNESIO O CALCIO: Aumente óxido de magnesio y harina de caliza.\n` :
                    `⚠️ MAGNESIUM OR CALCIUM SIGNS: Increase magnesium oxide and limestone flour.\n`;
      }

      if (symptomList.some(s => s === 'reduced_milk_fat')) {
        content += isSwahili ? `⚠️ MAFUTA YA MAZIWA YAMEPUNGUA: Hakikisha ng'ombe anapata nyasi za kutosha (20-30 kg/siku) na madini.\n` :
                    isFrench ? `⚠️ MATIÈRE GRASSE DU LAIT BASSE: Assurez suffisamment de fourrage (20-30 kg/jour) et de minéraux.\n` :
                    isSpanish ? `⚠️ GRASA LÁCTEA BAJA: Asegure suficiente forraje (20-30 kg/día) y minerales.\n` :
                    `⚠️ LOW MILK FAT: Ensure adequate forage (20-30 kg/day) and minerals.\n`;
      }

      if (symptomList.some(s => s === 'scours' || s === 'diarrhoea')) {
        content += isSwahili ? `⚠️ KUHARA: Hii inaweza kuwa dalili ya upungufu wa virutubisho au minyoo. Wasiliana na daktari wa mifugo.\n` :
                    isFrench ? `⚠️ DIARRHÉE: Cela peut être un signe de carence ou de vers. Consultez un vétérinaire.\n` :
                    isSpanish ? `⚠️ DIARREA: Puede ser signo de deficiencia o gusanos. Consulte a un veterinario.\n` :
                    `⚠️ DIARRHOEA: This may be a sign of deficiency or worms. Consult a vet.\n`;
      }

      content += isSwahili ? `\n📋 MAPENDEKEZO YA LISHE:\n• Tumia pre-mix ya madini kila siku\n• Ongeza nyasi bora na maji safi\n• Fuatilia afya ya ng'ombe kila siku\n• Wasiliana na daktari wa mifugo kwa uchambuzi wa damu` :
                  isFrench ? `\n📋 RECOMMANDATIONS NUTRITIONNELLES:\n• Utilisez un prémix minéral quotidien\n• Améliorez les fourrages et l'eau\n• Surveillez la santé quotidiennement\n• Consultez un vétérinaire pour un bilan sanguin` :
                  isSpanish ? `\n📋 RECOMENDACIONES NUTRICIONALES:\n• Use un premezcla mineral diaria\n• Mejore forrajes y agua\n• Monitoree la salud diariamente\n• Consulte a un veterinario para análisis de sangre` :
                  `\n📋 NUTRITIONAL RECOMMENDATIONS:\n• Use mineral pre-mix daily\n• Improve forages and water\n• Monitor cow health daily\n• Consult vet for blood analysis`;

      addToStructuredList('deficiency_analysis', { content });
      addToList(content);
    }
  }

  // 14. Dairy Business (Enhanced)
  if (shouldInclude('dairy_business')) {
    const interests = farmerData.dairyBusinessInterest || '';
    if (interests) {
      let content = isSwahili ? `💼 USHAURI WA BIASHARA YA NG'OMBE WA MAZIWA\nMada zinazokuvutia: ${interests}\n\n` :
                     isFrench ? `💼 CONSEILS COMMERCIAUX POUR LA LAITERIE\nSujets d'intérêt: ${interests}\n\n` :
                     isSpanish ? `💼 ASESORAMIENTO COMERCIAL PARA LECHERÍA\nTemas de interés: ${interests}\n\n` :
                     `💼 DAIRY BUSINESS ADVICE\nTopics of interest: ${interests}\n\n`;

      const interestList = interests.split(',').map(s => s.trim());

      if (interestList.includes('bulk_buying')) {
        content += isSwahili ? `📦 UNUNUZI WA JUMLA: Nunua malisho na madini kwa pamoja na wakulima wengine.\nOkoa 15-25% kwa gharama!\n` :
                    isFrench ? `📦 ACHAT EN VRAC: Achetez les aliments et minéraux en groupe avec d'autres agriculteurs.\nÉconomisez 15-25%!\n` :
                    isSpanish ? `📦 COMPRA AL POR MAYOR: Compre alimentos y minerales en grupo con otros agricultores.\n¡Ahorre 15-25%!\n` :
                    `📦 BULK BUYING: Buy feed and minerals together with other farmers.\nSave 15-25%!\n`;
      }

      if (interestList.includes('cooperative')) {
        content += isSwahili ? `🤝 USHIRIKA: Jiunge na ushirika wa wakulima wa maziwa.\nPata bei bora na usafirishaji wa pamoja.\n` :
                    isFrench ? `🤝 COOPÉRATIVE: Rejoignez une coopérative laitière.\nObtenez de meilleurs prix et un transport partagé.\n` :
                    isSpanish ? `🤝 COOPERATIVA: Únase a una cooperativa lechera.\nObtenga mejores precios y transporte compartido.\n` :
                    `🤝 COOPERATIVE: Join a dairy cooperative.\nGet better prices and shared transport.\n`;
      }

      if (interestList.includes('value_addition')) {
        content += isSwahili ? `🧀 ONGEZA THAMANI: Tengeneza mtindi, jibini, au maziwa ya lala kwa bei ya juu.\nFaida inaweza kuongezeka mara 2-3!\n` :
                    isFrench ? `🧀 VALORISATION: Fabriquez du yaourt, du fromage ou du lait fermenté pour un meilleur prix.\nLe bénéfice peut être multiplié par 2-3!\n` :
                    isSpanish ? `🧀 AGREGUE VALOR: Haga yogur, queso o leche fermentada para mejor precio.\n¡La ganancia puede aumentar 2-3 veces!\n` :
                    `🧀 VALUE ADDITION: Make yogurt, cheese, or fermented milk for higher price.\nProfit can increase 2-3x!\n`;
      }

      if (interestList.includes('scaling')) {
        content += isSwahili ? `📈 PANUA KUNDI: Anza na ng'ombe 5-10, ongeza polepole.\nKila ng'ombe anayeweza kukamua huongeza faida ya ${formatCurrency(50000)}/mwaka.\n` :
                    isFrench ? `📈 AGRANDISSEMENT: Commencez avec 5-10 vaches, augmentez progressivement.\nChaque vache laitière ajoute ${formatCurrency(50000)} de bénéfice par an.\n` :
                    isSpanish ? `📈 ESCALAR: Comience con 5-10 vacas, aumente gradualmente.\nCada vaca lechera agrega ${formatCurrency(50000)} de ganancia al año.\n` :
                    `📈 SCALING: Start with 5-10 cows, increase gradually.\nEach milking cow adds ${formatCurrency(50000)} profit per year.\n`;
      }

      if (interestList.includes('cost_reduction')) {
        content += isSwahili ? `💰 PUNGUZA GHARAMA: Tumia malisho ya ndani, nunua kwa jumla, na punguza upotevu.\nOkoa ${formatCurrency(20000)} kwa mwaka kwa ng'ombe 10!\n` :
                    isFrench ? `💰 RÉDUCTION DES COÛTS: Utilisez des aliments locaux, achetez en vrac, réduisez le gaspillage.\nÉconomisez ${formatCurrency(20000)} par an pour 10 vaches!\n` :
                    isSpanish ? `💰 REDUCCIÓN DE COSTOS: Use alimentos locales, compre al por mayor, reduzca desperdicios.\n¡Ahorre ${formatCurrency(20000)} al año por 10 vacas!\n` :
                    `💰 COST REDUCTION: Use local feeds, buy in bulk, reduce waste.\nSave ${formatCurrency(20000)} per year for 10 cows!\n`;
      }

      content += isSwahili ? `\n📋 HATUA ZA BIASHARA:\n1. Jumuika na wakulima wengine\n2. Nunua malisho kwa pamoja\n3. Uza maziwa kwa pamoja\n4. Fuatilia gharama na mapato kila mwezi` :
                  isFrench ? `\n📋 ÉTAPES COMMERCIALES:\n1. Regroupez-vous avec d'autres agriculteurs\n2. Achetez les aliments en groupe\n3. Vendez le lait ensemble\n4. Suivez les coûts et les revenus mensuellement` :
                  isSpanish ? `\n📋 PASOS DE NEGOCIO:\n1. Agrupe con otros agricultores\n2. Compre alimentos en conjunto\n3. Venda leche en conjunto\n4. Monitoree costos e ingresos mensualmente` :
                  `\n📋 BUSINESS STEPS:\n1. Group with other farmers\n2. Buy feed together\n3. Sell milk together\n4. Track costs and income monthly`;

      addToStructuredList('dairy_business', { content });
      addToList(content);
    }
  }

  // 15. Dairy Dos and Don'ts (Enhanced) – now receives dairyManagementFocus
  if (shouldInclude('dairy_dos_donts')) {
    const focus = farmerData.dairyManagementFocus || '';
    if (focus) {
      let content = isSwahili ? `✅❌ DOS AND DON'TS KWA NG'OMBE WA MAZIWA\nMaeneo yaliyochaguliwa: ${focus}\n\n` :
                     isFrench ? `✅❌ DOS AND DON'TS POUR LA LAITERIE\nDomaines sélectionnés: ${focus}\n\n` :
                     isSpanish ? `✅❌ DOS AND DON'TS PARA LECHERÍA\nÁreas seleccionadas: ${focus}\n\n` :
                     `✅❌ DAIRY DOS AND DON'TS\nSelected areas: ${focus}\n\n`;

      const focusList = focus.split(',').map(s => s.trim());

      if (focusList.includes('calf_rearing')) {
        content += isSwahili ? `📌 NDAMA:\n✅ Hakikisha kolostramu ndani ya saa 6\n✅ Weka banda safi na kavu\n❌ Usiwape maji ya baridi\n❌ Usiwape maziwa ya ng'ombe mgonjwa\n\n` :
                    isFrench ? `📌 VEAU:\n✅ Assurez le colostrum dans les 6 heures\n✅ Gardez le box propre et sec\n❌ Ne donnez pas d'eau froide\n❌ Ne donnez pas de lait de vache malade\n\n` :
                    isSpanish ? `📌 TERNERO:\n✅ Asegure calostro en las 6 horas\n✅ Mantenga el corral limpio y seco\n❌ No dé agua fría\n❌ No dé leche de vaca enferma\n\n` :
                    `📌 CALF:\n✅ Ensure colostrum within 6 hours\n✅ Keep pen clean and dry\n❌ Don't give cold water\n❌ Don't give milk from sick cow\n\n`;
      }

      if (focusList.includes('feeding')) {
        content += isSwahili ? `📌 MALISHO:\n✅ Toa malisho bora na maji safi\n✅ Weka ratiba ya kulisha mara 2-3 kwa siku\n❌ Usibadilishe chakula ghafla\n❌ Usitumie malisho yenye ukungu\n\n` :
                    isFrench ? `📌 ALIMENTATION:\n✅ Fournissez des aliments de qualité et de l'eau propre\n✅ Respectez un horaire d'alimentation 2-3 fois par jour\n❌ Ne changez pas l'alimentation brusquement\n❌ N'utilisez pas d'aliments moisis\n\n` :
                    isSpanish ? `📌 ALIMENTACIÓN:\n✅ Proporcione alimentos de calidad y agua limpia\n✅ Mantenga un horario de alimentación 2-3 veces al día\n❌ No cambie la alimentación bruscamente\n❌ No use alimentos con moho\n\n` :
                    `📌 FEEDING:\n✅ Provide quality feed and clean water\n✅ Feed 2-3 times daily on schedule\n❌ Don't change feed suddenly\n❌ Don't use mouldy feed\n\n`;
      }

      if (focusList.includes('housing')) {
        content += isSwahili ? `📌 MAKAZI:\n✅ Hakikisha nafasi ya kutosha na uingizaji hewa\n✅ Weka matandiko safi na kavu\n❌ Usiweke ng'ombe katika mazingira machafu\n❌ Usiruhusu msongamano wa ng'ombe\n\n` :
                    isFrench ? `📌 LOGEMENT:\n✅ Assurez espace suffisant et ventilation\n✅ Utilisez une litière propre et sèche\n❌ Ne gardez pas les vaches dans un environnement sale\n❌ Évitez la surpopulation\n\n` :
                    isSpanish ? `📌 ALOJAMIENTO:\n✅ Asegure espacio suficiente y ventilación\n✅ Use cama limpia y seca\n❌ No mantenga vacas en ambiente sucio\n❌ Evite la sobrepoblación\n\n` :
                    `📌 HOUSING:\n✅ Ensure adequate space and ventilation\n✅ Use clean, dry bedding\n❌ Don't keep cows in dirty conditions\n❌ Avoid overcrowding\n\n`;
      }

      if (focusList.includes('milking')) {
        content += isSwahili ? `📌 KUKAMUA:\n✅ Safisha viwete kabla na baada ya kukamua\n✅ Kamua kwa ratiba sawa (mara 2 kwa siku)\n❌ Usikamue kwa mikono michafu\n❌ Usikamue ng'ombe mgonjwa mwishoni\n\n` :
                    isFrench ? `📌 TRAITE:\n✅ Nettoyez les mamelles avant et après la traite\n✅ Traite à heures fixes (2 fois par jour)\n❌ Ne trayez pas avec les mains sales\n❌ Ne trayez pas la vache malade en dernier\n\n` :
                    isSpanish ? `📌 ORDEÑO:\n✅ Limpie las ubres antes y después del ordeño\n✅ Ordeñe a horas fijas (2 veces al día)\n❌ No ordeñe con las manos sucias\n❌ No ordeñe la vaca enferma al final\n\n` :
                    `📌 MILKING:\n✅ Clean udders before and after milking\n✅ Milk at fixed times (twice daily)\n❌ Don't milk with dirty hands\n❌ Don't milk sick cow last\n\n`;
      }

      if (focusList.includes('health')) {
        content += isSwahili ? `📌 AFYA:\n✅ Fuatilia dalili za magonjwa kila siku\n✅ Weka rekodi za afya na matibabu\n❌ Usisubiri hadi ugonjwa uwe mbaya\n❌ Usitumie dawa bila ushauri wa mifugo\n\n` :
                    isFrench ? `📌 SANTÉ:\n✅ Surveillez les signes de maladie quotidiennement\n✅ Tenez des registres de santé et de traitements\n❌ N'attendez pas que la maladie s'aggrave\n❌ N'utilisez pas de médicaments sans avis vétérinaire\n\n` :
                    isSpanish ? `📌 SALUD:\n✅ Monitoree los signos de enfermedad a diario\n✅ Mantenga registros de salud y tratamientos\n❌ No espere hasta que la enfermedad empeore\n❌ No use medicamentos sin consejo veterinario\n\n` :
                    `📌 HEALTH:\n✅ Monitor disease signs daily\n✅ Keep health and treatment records\n❌ Don't wait until disease worsens\n❌ Don't use drugs without vet advice\n\n`;
      }

      if (focusList.includes('breeding')) {
        content += isSwahili ? `📌 UZAZI:\n✅ Rekodi mzunguko wa joto kila siku\n✅ Fanya insemination saa 12-24 baada ya joto\n❌ Usiweke fahali kwa muda mrefu bila kudhibiti\n❌ Usisahau kumchunguza ng'ombe baada ya kuzaa\n\n` :
                    isFrench ? `📌 REPRODUCTION:\n✅ Enregistrez le cycle de chaleur quotidiennement\n✅ Insémination 12-24 heures après les chaleurs\n❌ Ne laissez pas le taureau sans surveillance\n❌ N'oubliez pas le contrôle post-partum\n\n` :
                    isSpanish ? `📌 REPRODUCCIÓN:\n✅ Registre el ciclo de celo diariamente\n✅ Insemine 12-24 horas después del celo\n❌ No deje el toro sin control\n❌ No olvide el control post-parto\n\n` :
                    `📌 BREEDING:\n✅ Record heat cycle daily\n✅ Inseminate 12-24 hours after heat\n❌ Don't leave bull unsupervised\n❌ Don't forget post-calving check\n\n`;
      }

      addToStructuredList('dairy_dos_donts', { content });
      addToList(content);
    }
  }

  // 16. Dairy Reminders (FIXED – date-based warnings)
  if (shouldInclude('dairy_reminders')) {
    const lastDeworm = farmerData.dairyLastDeworming || '';
    const lastHoof = farmerData.dairyLastHoofTrimming || '';
    const lastVacc = farmerData.dairyLastVaccination || '';
    const nextVacc = farmerData.dairyNextVaccinationDue || '';
    const topics = farmerData.dairyReminderTopics || '';

    if (lastDeworm || lastHoof || lastVacc || nextVacc || topics) {
      let content = isSwahili ? `📅 VIKUMBUSHO VYA USIMAMIZI WA NG'OMBE\n` :
                     isFrench ? `📅 RAPPELS DE GESTION DES VACHES\n` :
                     isSpanish ? `📅 RECORDATORIOS DE MANEJO DE VACAS\n` :
                     `📅 COW MANAGEMENT REMINDERS\n`;

      if (lastDeworm) content += isSwahili ? `Deworming ya mwisho: ${lastDeworm}\n` : isFrench ? `Dernier vermifuge: ${lastDeworm}\n` : isSpanish ? `Última desparasitación: ${lastDeworm}\n` : `Last deworming: ${lastDeworm}\n`;
      if (lastHoof) content += isSwahili ? `Kukata kwato kwa mwisho: ${lastHoof}\n` : isFrench ? `Dernier parage: ${lastHoof}\n` : isSpanish ? `Último recorte de pezuñas: ${lastHoof}\n` : `Last hoof trimming: ${lastHoof}\n`;
      if (lastVacc) content += isSwahili ? `Chanjo ya mwisho: ${lastVacc}\n` : isFrench ? `Dernière vaccination: ${lastVacc}\n` : isSpanish ? `Última vacunación: ${lastVacc}\n` : `Last vaccination: ${lastVacc}\n`;
      if (nextVacc) content += isSwahili ? `Chanjo inayofuata inatarajiwa: ${nextVacc}\n` : isFrench ? `Prochaine vaccination due: ${nextVacc}\n` : isSpanish ? `Próxima vacunación programada: ${nextVacc}\n` : `Next vaccination due: ${nextVacc}\n`;
      if (topics) content += isSwahili ? `Mada za vikumbusho: ${topics}\n` : isFrench ? `Sujets de rappels: ${topics}\n` : isSpanish ? `Temas de recordatorios: ${topics}\n` : `Reminder topics: ${topics}\n`;

      // ----- DATE-BASED WARNINGS -----
      const today = new Date();
      const oneYearAgo = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1);
      const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(today.getMonth() - 3);
      const thirtyDaysLater = new Date(today); thirtyDaysLater.setDate(today.getDate() + 30);

      if (lastHoof && new Date(lastHoof) < oneYearAgo) {
        content += isSwahili ? `⚠️ Kukata kwato kumechelewa (zaidi ya mwaka). Panga mara moja.\n` :
                    isFrench ? `⚠️ Le parage des sabots est en retard (plus d'un an). Planifiez-le immédiatement.\n` :
                    isSpanish ? `⚠️ El recorte de pezuñas está retrasado (más de un año). Planifíquelo inmediatamente.\n` :
                    `⚠️ Hoof trimming is overdue (more than a year). Schedule it immediately.\n`;
      }
      if (lastDeworm && new Date(lastDeworm) < threeMonthsAgo) {
        content += isSwahili ? `⚠️ Deworming imechelewa (zaidi ya miezi 3). Fanya haraka.\n` :
                    isFrench ? `⚠️ Le vermifuge est en retard (plus de 3 mois). Faites-le rapidement.\n` :
                    isSpanish ? `⚠️ La desparasitación está retrasada (más de 3 meses). Hágalo rápidamente.\n` :
                    `⚠️ Deworming is overdue (more than 3 months). Do it soon.\n`;
      }
      if (nextVacc && new Date(nextVacc) < thirtyDaysLater) {
        content += isSwahili ? `🔔 Chanjo inayofuata inakaribia (chini ya siku 30). Jitayarishe.\n` :
                    isFrench ? `🔔 La prochaine vaccination est proche (moins de 30 jours). Préparez-vous.\n` :
                    isSpanish ? `🔔 La próxima vacunación está cerca (menos de 30 días). Prepárese.\n` :
                    `🔔 Next vaccination is coming soon (less than 30 days). Prepare.\n`;
      }

      // Default reminders if no specific dates
      if (!lastDeworm && !lastHoof && !lastVacc && !nextVacc) {
        const now = new Date();
        const nextDeworm = new Date(now);
        nextDeworm.setMonth(now.getMonth() + 1);
        const nextHoof = new Date(now);
        nextHoof.setMonth(now.getMonth() + 2);
        const nextVaccDate = new Date(now);
        nextVaccDate.setMonth(now.getMonth() + 6);

        content += isSwahili ? `\n📌 VIKUMBUSHO VILIVYOPENDEKEZWA:\n• Deworming inayofuata: ${nextDeworm.toLocaleDateString()}\n• Kukata kwato: ${nextHoof.toLocaleDateString()}\n• Chanjo inayofuata: ${nextVaccDate.toLocaleDateString()}\n` :
                    isFrench ? `\n📌 RAPPELS RECOMMANDÉS:\n• Prochain vermifuge: ${nextDeworm.toLocaleDateString()}\n• Prochain parage: ${nextHoof.toLocaleDateString()}\n• Prochaine vaccination: ${nextVaccDate.toLocaleDateString()}\n` :
                    isSpanish ? `\n📌 RECORDATORIOS RECOMENDADOS:\n• Próxima desparasitación: ${nextDeworm.toLocaleDateString()}\n• Próximo recorte: ${nextHoof.toLocaleDateString()}\n• Próxima vacunación: ${nextVaccDate.toLocaleDateString()}\n` :
                    `\n📌 RECOMMENDED REMINDERS:\n• Next deworming: ${nextDeworm.toLocaleDateString()}\n• Next hoof trimming: ${nextHoof.toLocaleDateString()}\n• Next vaccination: ${nextVaccDate.toLocaleDateString()}\n`;
      }

      content += isSwahili ? `\n💡 KUMBUKA: Weka kalenda ya vikumbusho ili usisahau matibabu na matengenezo ya ng'ombe wako.\nPanga kila kitu mapema na fuatilia kwa ufanisi.` :
                  isFrench ? `\n💡 RAPPELEZ-VOUS: Tenez un calendrier de rappels pour ne pas oublier les traitements et l'entretien.\nPlanifiez à l'avance et suivez efficacement.` :
                  isSpanish ? `\n💡 RECUERDE: Mantenga un calendario de recordatorios para no olvidar tratamientos y mantenimiento.\nPlanifique con anticipación y haga seguimiento efectivo.` :
                  `\n💡 REMEMBER: Keep a reminder calendar to never miss treatments and maintenance.\nPlan ahead and track effectively.`;

      addToStructuredList('dairy_reminders', { content });
      addToList(content);
    }
  }

  // 17. Reminder (general soil test)
  if (shouldInclude('reminder')) {
    const content = isSwahili ? "Chunguza udongo wako kila mwaka ili kuweka biashara yako yenye faida." :
                     isFrench ? "Testez votre sol chaque année pour garder votre entreprise rentable." :
                     isSpanish ? "Analice su suelo anualmente para mantener su empresa rentable." :
                     "Test your soil yearly to keep your enterprise profitable.";
    addToStructuredList('reminder', { content });
    addToList(content);
  }

  return {
    list,
    financialAdvice: isSwahili ? "Tazama uchambuzi wa kifedha hapo juu ili kuongeza faida yako." :
                     isFrench ? "Voyez l'analyse financière ci-dessus pour maximiser votre profit." :
                     isSpanish ? "Vea el análisis financiero arriba para maximizar su ganancia." :
                     "See financial analysis above to maximize your profit.",
    structuredList,
    structuredFinancialAdvice: null,
  };
}
// ===== END OF PART 1 =====
// lib/recommendationEngine.ts – Part 2 (Main Export + Full Crop Logic)

// =============================================================
// MAIN EXPORT – supports crop, poultry, and dairy
// =============================================================
export async function generateRecommendations(input: RecommendationInput): Promise<RecommendationOutput> {
  // ---- DAIRY PATH ----
  if (input.isDairy) {
    return generateDairyRecommendations(input.farmerData, input.modules);
  }

  // ---- POULTRY PATH ----
  if (input.isPoultry) {
    return generatePoultryRecommendations(input.farmerData, input.modules);
  }

  // ---- CROP PATH (full original logic) ----
  // The following code is the complete crop generation logic from the original file.
  // It has been copied verbatim. All modules (soil, lime, fertilizer, gross margin,
  // disease, pest, deficiency, conservation, post‑harvest, business, nutrition, reminder)
  // are included here exactly as they were in the original.

  const structuredList: any[] = [];
  const { hasSoilTest, soilAnalysis, fertilizerPlan, crop, farmerData, modules } = input;
  const lowerCrop = crop.toLowerCase();
  const country = farmerData.country || 'kenya';
  const language = farmerData.language || 'en';
  const isSwahili = language === 'sw';
  const isFrench = language === 'fr';
  const isSpanish = language === 'es';
  const isEnglish = !isSwahili && !isFrench && !isSpanish;

  const formatCurrency = (amount: number): string => {
    const currency = COUNTRY_CURRENCY_MAP[country] || COUNTRY_CURRENCY_MAP.kenya;
    const symbol = farmerData.currencySymbol || currency.symbol;
    const formattedAmount = new Intl.NumberFormat(currency.locale, {
      style: 'decimal',
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    }).format(amount);
    return currency.position === 'before' ? `${symbol} ${formattedAmount}` : `${formattedAmount} ${symbol}`;
  };
  const currencySymbol = farmerData.currencySymbol || COUNTRY_CURRENCY_MAP[country]?.symbol || 'Ksh';

  const shouldIncludeModule = (key: string): boolean => {
    if (!modules || modules.length === 0) return true;
    if (modules.includes('complete')) return true;
    const moduleKey = moduleKeyMap[key];
    if (!moduleKey) return false;
    return modules.includes(moduleKey);
  };

  const addToStructuredList = (item: any) => {
    const key = item.key;
    if (shouldIncludeModule(key)) {
      structuredList.push(item);
    }
  };

  // ========== CONFIDENCE LABEL ==========
  if (shouldIncludeModule('confidence_label')) {
    let confidenceLabel = '';
    if (hasSoilTest) {
      confidenceLabel = isSwahili ? '🟢 IMANI: Juu (kutokana na uchambuzi wa udongo wa maabara)' :
                        isFrench ? '🟢 CONFIANCE: Élevée (basée sur analyse de sol en laboratoire)' :
                        isSpanish ? '🟢 CONFIANZA: Alta (basada en análisis de suelo de laboratorio)' :
                        '🟢 Confidence: High (based on laboratory soil test)';
    } else if (fertilizerPlan) {
      confidenceLabel = isSwahili ? '🟡 IMANI: Wastani (kutokana na ushauri wa mhudumu wa ugani)' :
                        isFrench ? '🟡 CONFIANCE: Moyenne (basée sur les conseils du vulgarisateur)' :
                        isSpanish ? '🟡 CONFIANZA: Media (basada en el consejo del extensionista)' :
                        '🟡 Confidence: Medium (based on extension officer advice)';
    } else {
      confidenceLabel = isSwahili ? '🟠 IMANI: Chini (habari ndogo sana)' :
                        isFrench ? '🟠 CONFIANCE: Faible (informations minimales)' :
                        isSpanish ? '🟠 CONFIANZA: Baja (información mínima)' :
                        '🟠 Confidence: Low (minimal information)';
    }
    addToStructuredList({ key: 'confidence_label', params: { content: confidenceLabel } });
  }

  // ========== SOIL TEST ANALYSIS ==========
  if (hasSoilTest && soilAnalysis && shouldIncludeModule('soil_test_grouped')) {
    const soilLines: string[] = [];
    const ph = soilAnalysis.ph ?? '?';
    const phRating = soilAnalysis.phRating || '';
    const phosphorus = soilAnalysis.phosphorus ?? '?';
    const phosphorusRating = soilAnalysis.phosphorusRating || '';
    const potassium = soilAnalysis.potassium ?? '?';
    const potassiumRating = soilAnalysis.potassiumRating || '';
    const calcium = soilAnalysis.calcium ?? '?';
    const calciumRating = soilAnalysis.calciumRating || '';
    const magnesium = soilAnalysis.magnesium ?? '?';
    const magnesiumRating = soilAnalysis.magnesiumRating || '';
    const totalNitrogen = soilAnalysis.totalNitrogen ?? '?';
    const totalNitrogenRating = soilAnalysis.totalNitrogenRating || '';
    const organicMatter = soilAnalysis.organicMatter ?? '?';
    const organicMatterRating = soilAnalysis.organicMatterRating || '';

    if (isSwahili) {
      soilLines.push(`pH: ${ph} (${phRating === 'Very Low' ? 'Chini Sana' : phRating === 'Low' ? 'Chini' : phRating || '?'})`);
      if (typeof ph === 'number' && ph < 5.5) soilLines.push(`– Asidi nyingi. Inahitaji chokaa.`);
      soilLines.push(`Fosforasi (P): ${phosphorus} ppm (${phosphorusRating === 'Very Low' ? 'Chini Sana' : phosphorusRating === 'Low' ? 'Chini' : phosphorusRating || '?'})`);
      if (typeof phosphorus === 'number' && phosphorus < 15) soilLines.push(`– Chini. Inahitaji mbolea ya fosforasi.`);
      soilLines.push(`Potasiamu (K): ${potassium} ppm (${potassiumRating === 'Very Low' ? 'Chini Sana' : potassiumRating === 'Low' ? 'Chini' : potassiumRating || '?'})`);
      if (typeof potassium === 'number' && potassium < 100) soilLines.push(`– Chini. Inahitaji mbolea ya potasiamu.`);
      soilLines.push(`Kalsiamu (Ca): ${calcium} ppm (${calciumRating === 'Very Low' ? 'Chini Sana' : calciumRating === 'Low' ? 'Chini' : calciumRating || '?'})`);
      soilLines.push(`Magnesiamu (Mg): ${magnesium} ppm (${magnesiumRating === 'Very Low' ? 'Chini Sana' : magnesiumRating === 'Low' ? 'Chini' : magnesiumRating || '?'})`);
      soilLines.push(`Nitrojeni (N): ${totalNitrogen}% (${totalNitrogenRating === 'Very Low' ? 'Chini Sana' : totalNitrogenRating === 'Low' ? 'Chini' : totalNitrogenRating || '?'})`);
      soilLines.push(`Mabaki Hai: ${organicMatter}% (${organicMatterRating === 'Very Low' ? 'Chini Sana' : organicMatterRating === 'Low' ? 'Chini' : organicMatterRating || '?'})`);
    } else if (isFrench) {
      soilLines.push(`pH : ${ph} (${phRating === 'Very Low' ? 'Très faible' : phRating === 'Low' ? 'Faible' : phRating || '?'})`);
      if (typeof ph === 'number' && ph < 5.5) soilLines.push(`– Trop acide. Besoin de chaux.`);
      soilLines.push(`Phosphore (P) : ${phosphorus} ppm (${phosphorusRating === 'Very Low' ? 'Très faible' : phosphorusRating === 'Low' ? 'Faible' : phosphorusRating || '?'})`);
      if (typeof phosphorus === 'number' && phosphorus < 15) soilLines.push(`– Faible. Besoin d'engrais phosphaté.`);
      soilLines.push(`Potassium (K) : ${potassium} ppm (${potassiumRating === 'Very Low' ? 'Très faible' : potassiumRating === 'Low' ? 'Faible' : potassiumRating || '?'})`);
      if (typeof potassium === 'number' && potassium < 100) soilLines.push(`– Faible. Besoin d'engrais potassique.`);
      soilLines.push(`Calcium (Ca) : ${calcium} ppm (${calciumRating === 'Very Low' ? 'Très faible' : calciumRating === 'Low' ? 'Faible' : calciumRating || '?'})`);
      soilLines.push(`Magnésium (Mg) : ${magnesium} ppm (${magnesiumRating === 'Very Low' ? 'Très faible' : magnesiumRating === 'Low' ? 'Faible' : magnesiumRating || '?'})`);
      soilLines.push(`Azote (N) : ${totalNitrogen}% (${totalNitrogenRating === 'Very Low' ? 'Très faible' : totalNitrogenRating === 'Low' ? 'Faible' : totalNitrogenRating || '?'})`);
      soilLines.push(`Matière organique : ${organicMatter}% (${organicMatterRating === 'Very Low' ? 'Très faible' : organicMatterRating === 'Low' ? 'Faible' : organicMatterRating || '?'})`);
    } else if (isSpanish) {
      soilLines.push(`pH: ${ph} (${phRating === 'Very Low' ? 'Muy bajo' : phRating === 'Low' ? 'Bajo' : phRating || '?'})`);
      if (typeof ph === 'number' && ph < 5.5) soilLines.push(`– Demasiado ácido. Necesita cal.`);
      soilLines.push(`Fósforo (P): ${phosphorus} ppm (${phosphorusRating === 'Very Low' ? 'Muy bajo' : phosphorusRating === 'Low' ? 'Bajo' : phosphorusRating || '?'})`);
      if (typeof phosphorus === 'number' && phosphorus < 15) soilLines.push(`– Bajo. Necesita fertilizante fosforado.`);
      soilLines.push(`Potasio (K): ${potassium} ppm (${potassiumRating === 'Very Low' ? 'Muy bajo' : potassiumRating === 'Low' ? 'Bajo' : potassiumRating || '?'})`);
      if (typeof potassium === 'number' && potassium < 100) soilLines.push(`– Bajo. Necesita fertilizante potásico.`);
      soilLines.push(`Calcio (Ca): ${calcium} ppm (${calciumRating === 'Very Low' ? 'Muy bajo' : calciumRating === 'Low' ? 'Bajo' : calciumRating || '?'})`);
      soilLines.push(`Magnesio (Mg): ${magnesium} ppm (${magnesiumRating === 'Very Low' ? 'Muy bajo' : magnesiumRating === 'Low' ? 'Bajo' : magnesiumRating || '?'})`);
      soilLines.push(`Nitrógeno (N): ${totalNitrogen}% (${totalNitrogenRating === 'Very Low' ? 'Muy bajo' : totalNitrogenRating === 'Low' ? 'Bajo' : totalNitrogenRating || '?'})`);
      soilLines.push(`Materia orgánica: ${organicMatter}% (${organicMatterRating === 'Very Low' ? 'Muy bajo' : organicMatterRating === 'Low' ? 'Bajo' : organicMatterRating || '?'})`);
    } else {
      soilLines.push(`pH: ${ph} (${phRating || '?'})`);
      if (typeof ph === 'number' && ph < 5.5) soilLines.push(`– Too acidic. Needs lime.`);
      else if (typeof ph === 'number' && ph > 7.5) soilLines.push(`– Too alkaline. Needs sulfur/organic matter.`);
      soilLines.push(`Phosphorus (P): ${phosphorus} ppm (${phosphorusRating || '?'})`);
      if (typeof phosphorus === 'number' && phosphorus < 15) soilLines.push(`– Low. Needs phosphorus fertilizer.`);
      soilLines.push(`Potassium (K): ${potassium} ppm (${potassiumRating || '?'})`);
      if (typeof potassium === 'number' && potassium < 100) soilLines.push(`– Low. Needs potassium fertilizer.`);
      soilLines.push(`Calcium (Ca): ${calcium} ppm (${calciumRating || '?'})`);
      soilLines.push(`Magnesium (Mg): ${magnesium} ppm (${magnesiumRating || '?'})`);
      soilLines.push(`Nitrogen (N): ${totalNitrogen}% (${totalNitrogenRating || '?'})`);
      soilLines.push(`Organic Matter (OM): ${organicMatter}% (${organicMatterRating || '?'})`);
    }
    addToStructuredList({
      key: 'soil_test_grouped',
      params: {
        title: isSwahili ? SW.soil_analysis_title : isFrench ? FR.soil_analysis_title : isSpanish ? ES.soil_analysis_title : 'SOIL TEST ANALYSIS - KNOW YOUR SOIL, GROW YOUR BUSINESS',
        content: soilLines.join('\n'),
        insight: isSwahili ? safeT(SW.soil_business_insight, `BUSINESS INSIGHT: Kila ${currencySymbol}1 unayowekeza katika urekebishaji wa udongo hukurejeshea ${currencySymbol}3-5 kwa mavuno makubwa!`, currencySymbol) : isFrench ? safeT(FR.soil_business_insight, `BUSINESS INSIGHT: Chaque ${currencySymbol}1 investi dans la correction du sol rapporte ${currencySymbol}3-5 en rendements plus élevés!`, currencySymbol) : isSpanish ? safeT(ES.soil_business_insight, `PERSPECTIVA DE NEGOCIO: ¡Cada ${currencySymbol}1 invertido en corrección del suelo retorna ${currencySymbol}3-5 en mayores rendimientos!`, currencySymbol) : `BUSINESS INSIGHT: Every ${currencySymbol}1 invested in soil correction returns ${currencySymbol}3-5 in higher yields!`,
        yearly: isSwahili ? SW.soil_test_yearly : isFrench ? FR.soil_test_yearly : isSpanish ? ES.soil_test_yearly : 'TEST SOIL YEARLY to track improvements and adjust inputs.',
        symbol: currencySymbol,
        ph, phRating, phosphorus, phosphorusRating, potassium, potassiumRating,
        calcium, calciumRating, magnesium, magnesiumRating, totalNitrogen, totalNitrogenRating, organicMatter, organicMatterRating,
      }
    });
  }

  // ========== CALCITIC LIME ==========
  if (hasSoilTest && farmerData.recCalciticLime && farmerData.recCalciticLime > 0 && shouldIncludeModule('calcitic_lime_grouped')) {
    const limeKg = farmerData.recCalciticLime;
    const limePricePerBag = farmerData.limePricePerBag || 300;
    const bagsNeeded = Math.ceil(limeKg / 50);
    const totalCost = bagsNeeded * limePricePerBag;
    let whyText = '';

    if (isSwahili) {
      if (soilAnalysis && soilAnalysis.ph < 5.5 && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Kwanini: pH yako ni ${soilAnalysis.ph} (asidi) na kalsiamu yako ni chini (${soilAnalysis.calcium} ppm). Chokaa inarekebisha matatizo yote mawili!`;
      } else if (soilAnalysis && soilAnalysis.ph < 5.5) {
        whyText = `Kwanini: pH yako ni ${soilAnalysis.ph} (asidi). Chokaa itaongeza pH na kuongeza kalsiamu.`;
      } else if (soilAnalysis && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Kwanini: Kalsiamu yako ni chini (${soilAnalysis.calcium} ppm). Chokaa inaongeza kalsiamu bila kuongeza magnesiamu.`;
      }
    } else if (isFrench) {
      if (soilAnalysis && soilAnalysis.ph < 5.5 && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Pourquoi : Votre pH est ${soilAnalysis.ph} (acide) et votre calcium est faible (${soilAnalysis.calcium} ppm). La chaux calcique résout les deux problèmes !`;
      } else if (soilAnalysis && soilAnalysis.ph < 5.5) {
        whyText = `Pourquoi : Votre pH est ${soilAnalysis.ph} (acide). La chaux calcique augmentera le pH et ajoutera du calcium.`;
      } else if (soilAnalysis && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Pourquoi : Votre calcium est faible (${soilAnalysis.calcium} ppm). La chaux calcique ajoute du calcium sans ajouter de magnésium.`;
      }
    } else if (isSpanish) {
      if (soilAnalysis && soilAnalysis.ph < 5.5 && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Por qué: Tu pH es ${soilAnalysis.ph} (ácido) y tu calcio es bajo (${soilAnalysis.calcium} ppm). ¡La cal calcítica soluciona ambos problemas!`;
      } else if (soilAnalysis && soilAnalysis.ph < 5.5) {
        whyText = `Por qué: Tu pH es ${soilAnalysis.ph} (ácido). La cal calcítica elevará el pH y agregará calcio.`;
      } else if (soilAnalysis && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Por qué: Tu calcio es bajo (${soilAnalysis.calcium} ppm). La cal calcítica agrega calcio sin agregar magnesio.`;
      }
    } else {
      if (soilAnalysis && soilAnalysis.ph < 5.5 && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Why: Your pH is ${soilAnalysis.ph} (acidic) and your calcium is low (${soilAnalysis.calcium} ppm). Calcitic lime fixes both problems!`;
      } else if (soilAnalysis && soilAnalysis.ph < 5.5) {
        whyText = `Why: Your pH is ${soilAnalysis.ph} (acidic). Calcitic lime will raise pH and add calcium.`;
      } else if (soilAnalysis && soilAnalysis.calcium && soilAnalysis.calcium < 400) {
        whyText = `Why: Your calcium is low (${soilAnalysis.calcium} ppm). Calcitic lime adds calcium without adding magnesium.`;
      }
    }

    const title = isSwahili ? "MAPENDEKEZO YA CHOKAA KUTOKA KWA UCHAMBUZI WAKO WA UDONGO" : isFrench ? FR.calcitic_lime_title : isSpanish ? "RECOMENDACIÓN DE CAL CALCÍTICA DE TU ANÁLISIS DE SUELO" : 'CALCITIC LIME RECOMMENDATION FROM YOUR SOIL TEST';
    const need = isSwahili ? `Kulingana na uchambuzi wako wa udongo, unahitaji ${limeKg} kg ya chokaa kwa ekari.` : isFrench ? `D'après votre analyse de sol, vous avez besoin de ${limeKg} kg de chaux calcique par acre.` : isSpanish ? `Según tu análisis de suelo, necesitas ${limeKg} kg de cal por acre.` : `Based on your soil test, you need ${limeKg} kg of calcitic lime per acre.`;
    const bags = isSwahili ? `Hii ni magunia ${bagsNeeded} ya 50kg.` : isFrench ? `Cela représente ${bagsNeeded} sacs de 50 kg.` : isSpanish ? `Esto es ${bagsNeeded} sacos de 50 kg.` : `This is ${bagsNeeded} bags of 50kg.`;
    const cost = isSwahili ? `Gharama: ${formatCurrency(totalCost)} (${formatCurrency(limePricePerBag)} kwa gunia)` : isFrench ? `Coût : ${formatCurrency(totalCost)} (${formatCurrency(limePricePerBag)} par sac)` : isSpanish ? `Costo: ${formatCurrency(totalCost)} (${formatCurrency(limePricePerBag)} por saco)` : `Cost: ${formatCurrency(totalCost)} (${formatCurrency(limePricePerBag)} per bag)`;
    const application = isSwahili ? "Weka wiki 3-4 kabla ya kupanda na uchanganye kwenye sentimita 10-15 za juu za udongo." : isFrench ? "Appliquez 3-4 semaines avant la plantation et incorporez dans les 10-15 premiers cm de sol." : isSpanish ? "Aplique 3-4 semanas antes de la siembra e incorpore en los primeros 10-15 cm de suelo." : 'Apply 3-4 weeks before planting and incorporate into top 10-15cm soil.';
    const wait = isSwahili ? "Subiri wiki 1-2 kabla ya kutumia mbolea za nitrojeni." : isFrench ? "Attendez 1-2 semaines avant d'appliquer des engrais azotés." : isSpanish ? "Espere 1-2 semanas antes de aplicar fertilizantes nitrogenados." : 'Wait 1-2 weeks before applying nitrogen fertilizers.';
    const business = isSwahili ? "FAIDA YA BIASHARA: pH sahihi inaweza kuongeza unyonyaji wa virutubisho kwa 30-50%!" : isFrench ? "ARGUMENT COMMERCIAL : Un pH correct peut augmenter l'absorption des nutriments de 30 à 50 % !" : isSpanish ? "CASO DE NEGOCIO: ¡El pH adecuado puede aumentar la absorción de nutrientes en un 30-50%!" : 'BUSINESS CASE: Proper pH can increase nutrient uptake by 30-50%!';
    const yearly = isSwahili ? "CHUNGUZA UDONGO KILA MWAKA kujua wakati wa kurudia." : isFrench ? "ANALYSEZ LE SOL CHAQUE ANNÉE pour savoir quand réappliquer." : isSpanish ? "ANALICE EL SUELO ANUALMENTE para saber cuándo reaplicar." : 'TEST SOIL YEARLY to know when to reapply.';

    const contentLines = [title, need, bags, cost, whyText, application, wait, business, yearly].filter(line => line && line.trim() !== '');
    addToStructuredList({ key: 'calcitic_lime_grouped', params: { content: contentLines.join('\n'), kg: limeKg, bags: bagsNeeded, total: formatCurrency(totalCost), perBag: formatCurrency(limePricePerBag), ph: soilAnalysis?.ph, ca: soilAnalysis?.calcium } });
  }

  // ========== DOLOMITIC LIME ==========
  if (hasSoilTest && soilAnalysis && shouldIncludeModule('dolomitic_lime_grouped')) {
    const autoDolomitic = soilTestInterpreter.getDolomiticLimeRecommendation(soilAnalysis);
    let dolomiticNeeded = autoDolomitic.needed;
    let limeKg = autoDolomitic.kgPerAcre;
    if (farmerData.recDolomiticLime && farmerData.recDolomiticLime > 0) {
      limeKg = farmerData.recDolomiticLime;
      dolomiticNeeded = true;
    }
    if (dolomiticNeeded && limeKg > 0) {
      const dolomiticPricePerBag = farmerData.dolomiticLimePricePerBag || farmerData.limePricePerBag || 300;
      const bagsNeeded = Math.ceil(limeKg / 50);
      const totalCost = bagsNeeded * dolomiticPricePerBag;
      let whyText = autoDolomitic.reason;
      let title, need, bagsText, costText, application, wait, business, yearly;
      if (isSwahili) {
        title = "PENDEKEZO LA CHOKAA DOLOMITIKU KUTOKA UCHAMBUZI WAKO WA UDONGO";
        need = `Kulingana na uchambuzi wako wa udongo, unahitaji ${limeKg} kg ya chokaa cha dolomitic kwa ekari.`;
        bagsText = `Hii ni magunia ${bagsNeeded} ya 50kg.`;
        costText = `Gharama: ${formatCurrency(totalCost)} (${formatCurrency(dolomiticPricePerBag)} kwa gunia)`;
        application = "Weka wiki 3-4 kabla ya upandaji na uchanganye kwenye udongo wa juu wa 10-15cm.";
        wait = "Subiri wiki 1-2 kabla ya kuweka mbolea za nitrojeni.";
        business = "HALI YA BIASHARA: Magnesiamu sahihi huboresha usanisi wa klorofili na fotosinthesisi!";
        yearly = "CHUNGUZA UDONGO KILA MWAKA kujua wakati wa kurudia.";
        if (farmerData.recDolomiticLime && farmerData.recDolomiticLime > 0) {
          const caMgRatio = (soilAnalysis?.calcium / soilAnalysis?.magnesium).toFixed(1);
          whyText = `Umetaja kiwango maalum cha ${limeKg} kg/ekari. Magnesiamu yako ni chini (${soilAnalysis?.magnesium} ppm) na uwiano Ca:Mg ni ${caMgRatio}:1. Chokaa cha dolomitic kinarekebisha yote mawili.`;
        }
      } else if (isFrench) {
        title = FR.dolomitic_lime_title;
        need = `D'après votre analyse de sol, vous avez besoin de ${limeKg} kg de chaux dolomitique par acre.`;
        bagsText = `Cela représente ${bagsNeeded} sacs de 50 kg.`;
        costText = `Coût : ${formatCurrency(totalCost)} (${formatCurrency(dolomiticPricePerBag)} par sac)`;
        application = FR.dolomitic_lime_application;
        wait = FR.dolomitic_lime_wait;
        business = FR.dolomitic_lime_business_case;
        yearly = FR.dolomitic_lime_yearly;
        if (farmerData.recDolomiticLime && farmerData.recDolomiticLime > 0) {
          const caMgRatio = (soilAnalysis?.calcium / soilAnalysis?.magnesium).toFixed(1);
          whyText = `Vous avez spécifié un taux personnalisé de ${limeKg} kg/acre. Votre magnésium est faible (${soilAnalysis?.magnesium} ppm) et le rapport Ca:Mg est de ${caMgRatio}:1. La chaux dolomitique corrige les deux.`;
        }
      } else if (isSpanish) {
        title = "RECOMENDACIÓN DE CAL DOLOMÍTICA DE SU ANÁLISIS DE SUELO";
        need = `Según tu análisis de suelo, necesitas ${limeKg} kg de cal dolomítica por acre.`;
        bagsText = `Esto es ${bagsNeeded} sacos de 50 kg.`;
        costText = `Costo: ${formatCurrency(totalCost)} (${formatCurrency(dolomiticPricePerBag)} por saco)`;
        application = "Aplique 3-4 semanas antes de la siembra e incorpore en los primeros 10-15 cm de suelo.";
        wait = "Espere 1-2 semanas antes de aplicar fertilizantes nitrogenados.";
        business = "CASO DE NEGOCIO: ¡El magnesio adecuado mejora la síntesis de clorofila y la fotosíntesis!";
        yearly = "ANALICE EL SUELO CADA AÑO para saber cuándo reaplicar.";
        if (farmerData.recDolomiticLime && farmerData.recDolomiticLime > 0) {
          const caMgRatio = (soilAnalysis?.calcium / soilAnalysis?.magnesium).toFixed(1);
          whyText = `Especificaste una tasa personalizada de ${limeKg} kg/acre. Tu magnesio es bajo (${soilAnalysis?.magnesium} ppm) y la relación Ca:Mg es de ${caMgRatio}:1. La cal dolomítica corrige ambos.`;
        }
      } else {
        title = "DOLOMITIC LIME RECOMMENDATION FROM YOUR SOIL TEST";
        need = `Based on your soil test, you need ${limeKg} kg of dolomitic lime per acre.`;
        bagsText = `This is ${bagsNeeded} bags of 50kg.`;
        costText = `Cost: ${formatCurrency(totalCost)} (${formatCurrency(dolomiticPricePerBag)} per bag)`;
        application = "Apply 3-4 weeks before planting and incorporate into top 10-15cm soil.";
        wait = "Wait 1-2 weeks before applying nitrogen fertilizers.";
        business = "BUSINESS CASE: Proper magnesium improves chlorophyll synthesis and photosynthesis!";
        yearly = "TEST SOIL YEARLY to know when to reapply.";
        if (farmerData.recDolomiticLime && farmerData.recDolomiticLime > 0) {
          const caMgRatio = (soilAnalysis?.calcium / soilAnalysis?.magnesium).toFixed(1);
          whyText = `You specified a custom rate of ${limeKg} kg/acre. Your magnesium is low (${soilAnalysis?.magnesium} ppm) and Ca:Mg ratio is ${caMgRatio}:1. Dolomitic lime corrects both.`;
        }
      }
      const contentLines = [title, need, bagsText, costText, whyText, application, wait, business, yearly].filter(line => line && line.trim() !== '');
      addToStructuredList({ key: 'dolomitic_lime_grouped', params: { content: contentLines.join('\n'), kg: limeKg, bags: bagsNeeded, total: formatCurrency(totalCost), perBag: formatCurrency(dolomiticPricePerBag), mg: soilAnalysis?.magnesium, caMgRatio: soilAnalysis?.calcium && soilAnalysis?.magnesium ? (soilAnalysis.calcium / soilAnalysis.magnesium).toFixed(1) : undefined } });
    }
  }

  // ========== FERTILIZER PLAN HEADER ==========
  if (fertilizerPlan && shouldIncludeModule('fertilizer_header_grouped')) {
    const hasSoilTestData = hasSoilTest && soilAnalysis;
    let title = '', farmSize = '', totalInv = '', intro = '';
    if (isSwahili) {
      title = replacePlaceholders(SW.fertilizer_plan_title, { crop: crop.toUpperCase() });
      farmSize = replacePlaceholders(SW.fertilizer_plan_farm_size, { size: fertilizerPlan.farmSize });
      totalInv = replacePlaceholders(SW.fertilizer_plan_total_investment, { amount: formatCurrency(fertilizerPlan.totalCost) });
      intro = hasSoilTestData ? "Uchapishaji huu wa mbolea umehesabiwa kwa usahihi kulingana na uchambuzi wako wa udongo." :
                               "Uchapishaji huu wa mbolea umejengwa kulingana na ushauri wa mhudumu wako wa ugani. **Dhibitisho: Wastani** – hakikisha ufuatilie mavuno yako na urekebishe inavyohitajika.";
    } else if (isFrench) {
      title = replacePlaceholders(FR.fertilizer_plan_title, { crop: crop.toUpperCase() });
      farmSize = replacePlaceholders(FR.fertilizer_plan_farm_size, { size: fertilizerPlan.farmSize });
      totalInv = replacePlaceholders(FR.fertilizer_plan_total_investment, { amount: formatCurrency(fertilizerPlan.totalCost) });
      intro = hasSoilTestData ? "Ce plan d'engrais a été calculé avec précision à partir de votre analyse de sol." :
                               "Ce plan d'engrais a été élaboré sur la base des conseils de votre vulgarisateur. **Confiance : Moyenne** – surveillez vos rendements et ajustez si nécessaire.";
    } else if (isSpanish) {
      title = replacePlaceholders(ES.fertilizer_plan_title, { crop: crop.toUpperCase() });
      farmSize = replacePlaceholders(ES.fertilizer_plan_farm_size, { size: fertilizerPlan.farmSize });
      totalInv = replacePlaceholders(ES.fertilizer_plan_total_investment, { amount: formatCurrency(fertilizerPlan.totalCost) });
      intro = hasSoilTestData ? "Este plan de fertilizantes se ha calculado con precisión a partir de su análisis de suelo." :
                               "Este plan de fertilizantes se ha elaborado según el consejo de su extensionista. **Confianza: Media** – supervise sus rendimientos y ajuste según sea necesario.";
    } else {
      title = `PRECISION FERTILIZER INVESTMENT PLAN for your ${crop.toUpperCase()} ENTERPRISE`;
      farmSize = `Your farm size: ${fertilizerPlan.farmSize} acre(s)`;
      totalInv = `TOTAL FERTILIZER INVESTMENT: ${formatCurrency(fertilizerPlan.totalCost)} for your entire farm`;
      intro = hasSoilTestData ? "This fertilizer plan has been precisely calculated from your soil test analysis." :
                               "This fertilizer plan has been built from your extension officer's advice. **Confidence: Medium** – monitor your yields and adjust as needed.";
    }
    const contentLines = [title, intro, farmSize, totalInv].filter(l => l);
    addToStructuredList({ key: 'fertilizer_header_grouped', params: { content: contentLines.join('\n'), crop: crop.toUpperCase(), size: fertilizerPlan.farmSize, amount: formatCurrency(fertilizerPlan.totalCost) } });

    // PLANTING FERTILIZER
    if (fertilizerPlan.plantingFertilizer && shouldIncludeModule('planting_fertilizer')) {
      const pf = fertilizerPlan.plantingFertilizer;
      if (pf && pf.kgNeeded > 0) {
        const bags = Math.floor(pf.kgNeeded / 50);
        const openBag = pf.kgNeeded % 50;
        let title, buyText, costText, providesText, extra;
        if (isSwahili) {
          title = "MBEGEAZA MBOLEA (Weka wakati wa kupanda)";
          buyText = `Nunua ${pf.kgNeeded} kg ya ${pf.name}`;
          costText = `Gharama: ${formatCurrency(pf.cost)}`;
          providesText = `Hutoa: ${pf.n.toFixed(1)} kg N, ${pf.p.toFixed(1)} kg P, ${pf.k.toFixed(1)} kg K`;
          extra = pf.extraNutrients ? `Virutubisho vya ziada: ${pf.extraNutrients}` : '';
        } else if (isFrench) {
          title = FR.planting_fertilizer_title || "ENGRAIS DE PLANTATION (Appliquer à la plantation)";
          buyText = `Achetez ${pf.kgNeeded} kg de ${pf.name}`;
          costText = `Coût : ${formatCurrency(pf.cost)}`;
          providesText = `Fournit : ${pf.n.toFixed(1)} kg N, ${pf.p.toFixed(1)} kg P, ${pf.k.toFixed(1)} kg K`;
          extra = pf.extraNutrients ? `Nutriments supplémentaires : ${pf.extraNutrients}` : '';
        } else if (isSpanish) {
          title = "FERTILIZANTE DE PLANTACIÓN (Aplicar en la siembra)";
          buyText = `Compre ${pf.kgNeeded} kg de ${pf.name}`;
          costText = `Costo: ${formatCurrency(pf.cost)}`;
          providesText = `Proporciona: ${pf.n.toFixed(1)} kg N, ${pf.p.toFixed(1)} kg P, ${pf.k.toFixed(1)} kg K`;
          extra = pf.extraNutrients ? `Nutrientes adicionales: ${pf.extraNutrients}` : '';
        } else {
          title = "PLANTING FERTILIZER (Apply at planting)";
          buyText = `Buy ${pf.kgNeeded} kg of ${pf.name}`;
          costText = `Cost: ${formatCurrency(pf.cost)}`;
          providesText = `Provides: ${pf.n.toFixed(1)} kg N, ${pf.p.toFixed(1)} kg P, ${pf.k.toFixed(1)} kg K`;
          extra = pf.extraNutrients ? `Extra nutrients: ${pf.extraNutrients}` : '';
        }
        const bagInfo = isFrench ? `C'est ${bags} sac(s) de 50kg + ${openBag}kg ouvert` : (isSwahili ? `Hii ni magunia ${bags} ya 50kg + ${openBag}kg fungua` : (isSpanish ? `Esto es ${bags} bolsa(s) de 50kg + ${openBag}kg suelto` : `This is ${bags} bag(s) of 50kg + ${openBag}kg open`));
        const contentLines = [title, buyText, bagInfo, costText, providesText, extra].filter(l => l);
        addToStructuredList({ key: 'planting_fertilizer', params: { content: contentLines.join('\n') } });
      }
    }

    // TOPDRESSING FERTILIZERS
    if (fertilizerPlan.topdressingFertilizers && fertilizerPlan.topdressingFertilizers.length && shouldIncludeModule('topdressing_fertilizer')) {
      for (const tf of fertilizerPlan.topdressingFertilizers) {
        if (tf.kgNeeded > 0) {
          const bags = Math.floor(tf.kgNeeded / 50);
          const openBag = tf.kgNeeded % 50;
          let title, buyText, costText, providesText, extra;
          if (isSwahili) {
            title = "MBEGEAZA MBOLEA (Weka wiki 3-4 baada ya kupanda)";
            buyText = `Nunua ${tf.kgNeeded} kg ya ${tf.name}`;
            costText = `Gharama: ${formatCurrency(tf.cost)}`;
            providesText = `Hutoa: ${tf.n.toFixed(1)} kg N, ${tf.p.toFixed(1)} kg P, ${tf.k.toFixed(1)} kg K`;
            extra = tf.extraNutrients ? `Virutubisho vya ziada: ${tf.extraNutrients}` : '';
          } else if (isFrench) {
            title = FR.topdressing_fertilizer_title || "ENGRAIS DE COUVERTURE (Appliquer 3-4 semaines après la plantation)";
            buyText = `Achetez ${tf.kgNeeded} kg de ${tf.name}`;
            costText = `Coût : ${formatCurrency(tf.cost)}`;
            providesText = `Fournit : ${tf.n.toFixed(1)} kg N, ${tf.p.toFixed(1)} kg P, ${tf.k.toFixed(1)} kg K`;
            extra = tf.extraNutrients ? `Nutriments supplémentaires : ${tf.extraNutrients}` : '';
          } else if (isSpanish) {
            title = "FERTILIZANTE DE COBERTURA (Aplicar 3-4 semanas después de la siembra)";
            buyText = `Compre ${tf.kgNeeded} kg de ${tf.name}`;
            costText = `Costo: ${formatCurrency(tf.cost)}`;
            providesText = `Proporciona: ${tf.n.toFixed(1)} kg N, ${tf.p.toFixed(1)} kg P, ${tf.k.toFixed(1)} kg K`;
            extra = tf.extraNutrients ? `Nutrientes adicionales: ${tf.extraNutrients}` : '';
          } else {
            title = "TOP DRESSING FERTILIZER (Apply 3-4 weeks after planting)";
            buyText = `Buy ${tf.kgNeeded} kg of ${tf.name}`;
            costText = `Cost: ${formatCurrency(tf.cost)}`;
            providesText = `Provides: ${tf.n.toFixed(1)} kg N, ${tf.p.toFixed(1)} kg P, ${tf.k.toFixed(1)} kg K`;
            extra = tf.extraNutrients ? `Extra nutrients: ${tf.extraNutrients}` : '';
          }
          const bagInfo = isFrench ? `C'est ${bags} sac(s) de 50kg + ${openBag}kg ouvert` : (isSwahili ? `Hii ni magunia ${bags} ya 50kg + ${openBag}kg fungua` : (isSpanish ? `Esto es ${bags} bolsa(s) de 50kg + ${openBag}kg suelto` : `This is ${bags} bag(s) of 50kg + ${openBag}kg open`));
          const contentLines = [title, buyText, bagInfo, costText, providesText, extra].filter(l => l);
          addToStructuredList({ key: 'topdressing_fertilizer', params: { content: contentLines.join('\n') } });
        }
      }
    }

    // ========== PLANT POPULATION ==========
    if (farmerData.spacing && fertilizerPlan.farmSize && fertilizerPlan.perPlant && shouldIncludeModule('plant_population')) {
      let spacing = farmerData.spacing;
      let plantsPerAcre = 0;
      const match = spacing.match(/(\d+)\s*x\s*(\d+)/);
      if (match) {
        const row = parseFloat(match[1]);
        const plant = parseFloat(match[2]);
        if (!isNaN(row) && !isNaN(plant)) {
          plantsPerAcre = Math.round(43560 / (row * plant));
        }
      }
      if (plantsPerAcre > 0) {
        let plantCountText = '';
        if (isSwahili) {
          plantCountText = `Kulingana na umbali wako ${spacing}, una takriban mimea ${plantsPerAcre} kwenye ekari ${fertilizerPlan.farmSize}.`;
        } else if (isFrench) {
          plantCountText = `Selon votre espacement ${spacing}, vous avez environ ${plantsPerAcre} plantes sur ${fertilizerPlan.farmSize} acres.`;
        } else if (isSpanish) {
          plantCountText = `Según su espaciamiento ${spacing}, tiene aproximadamente ${plantsPerAcre} plantas en ${fertilizerPlan.farmSize} acres.`;
        } else {
          plantCountText = `Based on your spacing of ${spacing}, you have approximately ${plantsPerAcre} plants on your ${fertilizerPlan.farmSize} acre farm.`;
        }
        const pp = fertilizerPlan.perPlant;
        const perPlantText = `
FERTILIZER PER PLANT
DAP: ${pp.dapGrams.toFixed(1)} grams
UREA: ${pp.ureaGrams.toFixed(1)} grams
MOP: ${pp.mopGrams.toFixed(1)} grams
TOTAL: ${pp.totalGrams.toFixed(1)} grams
`;
        addToStructuredList({ key: 'plant_population', params: { content: plantCountText + perPlantText, plants: plantsPerAcre, spacing } });
      }
    }

    // ========== BUSINESS TIP ==========
    if (shouldIncludeModule('fertilizer_business_tip')) {
      addToStructuredList({
        key: 'fertilizer_business_tip',
        params: {
          symbol: currencySymbol,
          content: isSwahili ? `SHAURI YA BIASHARA: Nunua ukubwa unaolingana na mahitaji yako ili kuepuka upotevu. Kila ${currencySymbol} unayookoa ni ${currencySymbol} uliyopata!` : isFrench ? `CONSEIL COMMERCIAL : Achetez la taille adaptée à vos besoins pour éviter le gaspillage. Chaque ${currencySymbol} économisé est un ${currencySymbol} gagné !` : isSpanish ? `CONSEJO DE NEGOCIO: Compre tamaños que se ajusten a sus necesidades para evitar desperdicio. ¡Cada ${currencySymbol} ahorrado es ${currencySymbol} ganado!` : `BUSINESS TIP: Buy sizes that fit your needs to avoid waste. Every ${currencySymbol} saved is ${currencySymbol} earned!`
        }
      });
    }

    // ========== FERTILIZER REMEMBER ==========
    if (shouldIncludeModule('fertilizer_remember')) {
      addToStructuredList({
        key: 'fertilizer_remember',
        params: {
          crop: crop.toUpperCase(),
          content: isSwahili ? `KUMBUKA: Hii ni BIASHARA yako ya ${crop.toUpperCase()}. Kila pembejeo lazima iongeze faida yako!` : isFrench ? `RAPPELEZ-VOUS : C'est votre ENTREPRISE ${crop.toUpperCase()}. Chaque intrant doit augmenter votre profit !` : isSpanish ? `RECUERDE: Esta es su EMPRESA de ${crop.toUpperCase()}. ¡Cada insumo debe aumentar su ganancia!` : `REMEMBER: This is your ${crop.toUpperCase()} ENTERPRISE. Every input must increase your profit!`
        }
      });
    }
  }

  // ========== GROSS MARGIN ANALYSIS ==========
  if (shouldIncludeModule('gross_margin_grouped')) {
    let actualYieldKg = farmerData.actualYieldKg || 0;
    let pricePerKg = farmerData.pricePerKg || 0;
    let actualCosts = farmerData.totalCosts || 0;
    if (!actualYieldKg || actualYieldKg === 0) {
      const defaultYields: Record<string, number> = { maize: 2000, beans: 1200, cassava: 8000, bananas: 20000, coffee: 2000 };
      actualYieldKg = defaultYields[lowerCrop] || 2000;
    }
    if (!pricePerKg || pricePerKg === 0) pricePerKg = 0.5;
    if (!actualCosts || actualCosts === 0) actualCosts = 50000;

    const lowYield = actualYieldKg * 0.33;
    const mediumYield = actualYieldKg;
    const highYield = actualYieldKg * 1.26;
    const lowCost = actualCosts * 0.5;
    const mediumCost = actualCosts;
    const highCost = actualCosts * 1.5;

    const lowRevenue = lowYield * pricePerKg;
    const mediumRevenue = mediumYield * pricePerKg;
    const highRevenue = highYield * pricePerKg;

    const lowMargin = lowRevenue - lowCost;
    const mediumMargin = mediumRevenue - mediumCost;
    const highMargin = highRevenue - highCost;

    const marginTable = `
GROSS MARGIN ANALYSIS FOR YOUR ${crop.toUpperCase()} ENTERPRISE (per acre)
Based on YOUR actual farm data, here's how different management levels compare

LOW MANAGEMENT (33% of your current level)
Yield: ${Math.round(lowYield).toLocaleString()} kg × ${formatCurrency(pricePerKg)} = ${formatCurrency(lowRevenue)}
Costs: ${formatCurrency(lowCost)}
GROSS MARGIN: ${formatCurrency(lowMargin)}

MEDIUM MANAGEMENT (YOUR CURRENT LEVEL)
Yield: ${Math.round(mediumYield).toLocaleString()} kg × ${formatCurrency(pricePerKg)} = ${formatCurrency(mediumRevenue)}
Costs: ${formatCurrency(mediumCost)}
GROSS MARGIN: ${formatCurrency(mediumMargin)}

HIGH MANAGEMENT (126% of your current level)
Yield: ${Math.round(highYield).toLocaleString()} kg × ${formatCurrency(pricePerKg)} = ${formatCurrency(highRevenue)}
Costs: ${formatCurrency(highCost)}
GROSS MARGIN: ${formatCurrency(highMargin)}

From Low to Medium: +${Math.round((mediumMargin - lowMargin) / lowMargin * 100)}% profit increase
From Medium to High: +${Math.round((highMargin - mediumMargin) / mediumMargin * 100)}% profit increase
Every ${currencySymbol}1 invested returns ${(mediumMargin / actualCosts).toFixed(1)} profit at your current level
Your current level: Medium

BOTTOM LINE
Moving from Medium to High could put an extra ${formatCurrency(highMargin - mediumMargin)} in your pocket
`;

    addToStructuredList({ key: 'gross_margin_grouped', params: { content: marginTable, actualMargin: mediumMargin, potentialGain: highMargin - mediumMargin } });
  }

  // ========== GOOD AGRICULTURAL PRACTICES ==========
  if (shouldIncludeModule('good_practices')) {
    let gapText = '';
    if (isSwahili) {
      gapText = `MAZOEZI BORA YA KILIMO KWA ${crop.toUpperCase()}\nTumia mbegu bora, mbolea sahihi, na umwagiliaji mzuri.`;
    } else if (isFrench) {
      gapText = `BONNES PRATIQUES AGRICOLES POUR ${crop.toUpperCase()}\nUtilisez des semences de qualité, des engrais appropriés et une irrigation correcte.`;
    } else if (isSpanish) {
      gapText = `BUENAS PRÁCTICAS AGRÍCOLAS PARA ${crop.toUpperCase()}\nUtilice semillas de calidad, fertilizantes apropiados y riego adecuado.`;
    } else {
      gapText = `GOOD AGRICULTURAL PRACTICES FOR ${crop.toUpperCase()}\nUse quality seeds, proper fertilizers, and correct irrigation.\n\nREMEMBER: Every practice you do well puts more money in your pocket.`;
    }
    addToStructuredList({ key: 'good_practices', params: { content: gapText, crop: crop.toUpperCase() } });
  }

  // ========== DISEASE MANAGEMENT ==========
  if (farmerData.commonDiseases && shouldIncludeModule('disease_management_grouped')) {
    let diseaseLines: string[] = [];
    const diseaseTitle = replacePlaceholders(isSwahili ? (SW.disease_management_title as string) : isFrench ? (FR.disease_management_title as string) : isSpanish ? (ES.disease_management_title as string) : null, { crop: crop.toUpperCase() }) || (isSwahili ? `UDHIBITI JUMUISHI WA MAGONJWA KWA BIASHARA YAKO YA ${crop.toUpperCase()}` : isFrench ? `GESTION INTÉGRÉE DES MALADIES POUR VOTRE ENTREPRISE ${crop.toUpperCase()}` : isSpanish ? `MANEJO INTEGRADO DE ENFERMEDADES PARA TU EMPRESA de ${crop.toUpperCase()}` : `INTEGRATED DISEASE MANAGEMENT FOR YOUR ${crop.toUpperCase()} ENTERPRISE`);
    diseaseLines.push(diseaseTitle);
    const diseaseReported = replacePlaceholders(isSwahili ? (SW.disease_reported as string) : isFrench ? (FR.disease_reported as string) : isSpanish ? (ES.disease_reported as string) : null, { diseases: farmerData.commonDiseases }) || (isSwahili ? `Magonjwa uliyoripoti: ${farmerData.commonDiseases}` : isFrench ? `Maladies signalées : ${farmerData.commonDiseases}` : isSpanish ? `Enfermedades reportadas: ${farmerData.commonDiseases}` : `The diseases affecting your ${crop.toUpperCase()} ENTERPRISE: ${farmerData.commonDiseases}`);
    diseaseLines.push(diseaseReported);
    const diseaseList = farmerData.commonDiseases.split(',').map(d => d.trim()).filter(d => d);
    diseaseList.forEach(disease => { diseaseLines.push(`• ${disease}`); });
    diseaseLines.push('');
    diseaseLines.push(isSwahili ? (SW.disease_prevention_title || "KUZUIA (Rahisi kuliko kutibu)") : isFrench ? (FR.disease_prevention_title || "PRÉVENTION (Moins cher que guérir)") : isSpanish ? (ES.disease_prevention_title || "PREVENCIÓN (Más barato que curar)") : 'PREVENTION (Cheaper than cure)');
    diseaseLines.push(isSwahili ? (SW.disease_prevention_list || "• Tumia aina zinazostahimili magonjwa\n• Zoea mzunguko wa mazao (miaka 3-4)\n• Hakikisha nafasi sahihi kwa mzunguko wa hewa\n• Epuka kufanya kazi kwenye mashamba yenye unyevu\n• Ondoa na uharibu mimea iliyoathirika mara moja\n• Sababisha zana kati ya mashamba") : isFrench ? (FR.disease_prevention_list || "• Utilisez des variétés résistantes\n• Pratiquez la rotation des cultures (3-4 ans)\n• Assurez un espacement adéquat\n• Évitez de travailler dans des champs humides\n• Retirez et détruisez les plantes infectées\n• Désinfectez les outils") : isSpanish ? (ES.disease_prevention_list || "• Use variedades resistentes\n• Practique la rotación de cultivos (3-4 años)\n• Asegure un espacio de separación adecuado\n• Evite trabajar en campos húmedos\n• Retire y destruya plantas infectadas\n• Desinfecte herramientas") : '• Use disease-resistant varieties where available\n• Practice crop rotation (3-4 years)\n• Ensure proper spacing for air circulation\n• Avoid working in wet fields\n• Remove and destroy infected plants immediately\n• Disinfect tools between fields');
    diseaseLines.push('');

    const cropLookupKey = lowerCrop.replace(/\s+/g, '');
    const cropPestsAndDiseases = cropPestDiseaseMap[cropLookupKey] || cropPestDiseaseMap[lowerCrop] || [];
    const cropDiseases = cropPestsAndDiseases.filter((pd: PestDisease) => pd.type === "disease");
    const userDiseases = farmerData.commonDiseases.split(',').map(d => d.trim().toLowerCase());
    const filteredDiseases = userDiseases.length > 0 ? cropDiseases.filter(disease => userDiseases.some(userDisease => disease.name.toLowerCase().includes(userDisease))) : cropDiseases;

    if (filteredDiseases.length > 0) {
      diseaseLines.push(isSwahili ? "CHAGUO ZA UDHIBITI WA MAGONJWA SHAMBANI MWAKO:" : isFrench ? "OPTIONS DE LUTTE CONTRE LES MALADIES DANS VOTRE FERME :" : isSpanish ? "OPCIONES DE CONTROL DE ENFERMEDADES EN SU FINCA:" : 'CONTROL OPTIONS FOR DISEASES IN YOUR FARM:');
      for (const disease of filteredDiseases) {
        diseaseLines.push('');
        diseaseLines.push(`📌 ${disease.name.toUpperCase()}`);
        if (disease.culturalControls && disease.culturalControls.length) {
          diseaseLines.push(isSwahili ? "Udhibiti wa kitamaduni:" : isFrench ? "Lutte cultural :" : isSpanish ? "Control cultural:" : "Cultural Control:");
          for (const control of disease.culturalControls) {
            diseaseLines.push(`  • ${control}`);
          }
        }
        if (disease.organicControls && disease.organicControls.length) {
          diseaseLines.push(isSwahili ? "Udhibiti wa kikaboni:" : isFrench ? "Lutte biologique :" : isSpanish ? "Control orgánico:" : "Organic Control:");
          for (const organic of disease.organicControls) {
            let method = organic.method;
            let prep = organic.preparation;
            let app = organic.application;
            if (isFrench) {
              method = translateOrganic(method, 'fr');
              prep = translateRate(prep, 'fr');
              app = translateTiming(app, 'fr');
            } else if (isSwahili) {
              method = translateOrganic(method, 'sw');
              prep = translateRate(prep, 'sw');
              app = translateTiming(app, 'sw');
            } else if (isSpanish) {
              method = translateOrganic(method, 'es');
              prep = translateRate(prep, 'es');
              app = translateTiming(app, 'es');
            } else {
              method = translateOrganic(method, 'en');
              prep = translateRate(prep, 'en');
              app = translateTiming(app, 'en');
            }
            diseaseLines.push(`  • ${method}`);
            if (isFrench) {
              diseaseLines.push(`    Préparation: ${prep}`);
              diseaseLines.push(`    Application: ${app}`);
            } else if (isSwahili) {
              diseaseLines.push(`    Maandalizi: ${prep}`);
              diseaseLines.push(`    Utumiaji: ${app}`);
            } else if (isSpanish) {
              diseaseLines.push(`    Preparación: ${prep}`);
              diseaseLines.push(`    Aplicación: ${app}`);
            } else {
              diseaseLines.push(`    Preparation: ${prep}`);
              diseaseLines.push(`    Application: ${app}`);
            }
          }
        }
        if (disease.chemicalControls && disease.chemicalControls.length) {
          diseaseLines.push(isSwahili ? "Udhibiti wa kemikali:" : isFrench ? "Lutte chimique :" : isSpanish ? "Control químico:" : "Chemical Control:");
          for (const chem of disease.chemicalControls) {
            let rate = chem.rate;
            let timing = chem.timing;
            let safety = chem.safetyInterval || '';
            if (isFrench) {
              rate = translateRate(rate, 'fr');
              timing = translateTiming(timing, 'fr');
              safety = translateSafety(safety, 'fr');
            } else if (isSwahili) {
              rate = translateRate(rate, 'sw');
              timing = translateTiming(timing, 'sw');
              safety = translateSafety(safety, 'sw');
            } else if (isSpanish) {
              rate = translateRate(rate, 'es');
              timing = translateTiming(timing, 'es');
              safety = translateSafety(safety, 'es');
            } else {
              rate = translateRate(rate, 'en');
              timing = translateTiming(timing, 'en');
              safety = translateSafety(safety, 'en');
            }
            diseaseLines.push(`  • ${chem.productName} (${chem.activeIngredient})`);
            if (isFrench) {
              diseaseLines.push(`    Dose: ${rate}`);
              diseaseLines.push(`    Dose par acre: ${chem.ratePerAcre}`);
              diseaseLines.push(`    Moment: ${timing}`);
              if (safety) diseaseLines.push(`    Sécurité: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'fr');
              diseaseLines.push(`    Statut: ${statusText}`);
            } else if (isSwahili) {
              diseaseLines.push(`    Kipimo: ${rate}`);
              diseaseLines.push(`    Kipimo kwa ekari: ${chem.ratePerAcre}`);
              diseaseLines.push(`    Wakati: ${timing}`);
              if (safety) diseaseLines.push(`    Usalama: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'sw');
              diseaseLines.push(`    Hali: ${statusText}`);
            } else if (isSpanish) {
              diseaseLines.push(`    Dosis: ${rate}`);
              diseaseLines.push(`    Dosis por acre: ${chem.ratePerAcre}`);
              diseaseLines.push(`    Momento: ${timing}`);
              if (safety) diseaseLines.push(`    Seguridad: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'es');
              diseaseLines.push(`    Estado: ${statusText}`);
            } else {
              diseaseLines.push(`    Dose: ${rate}`);
              diseaseLines.push(`    Dose per acre: ${chem.ratePerAcre}`);
              diseaseLines.push(`    Timing: ${timing}`);
              if (safety) diseaseLines.push(`    Safety: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'en');
              diseaseLines.push(`    Status: ${statusText}`);
            }
          }
        }
        if (disease.businessNote) {
          let note = disease.businessNote;
          if (isFrench && disease.name === "Sigatoka (black leaf streak)") note = "La Sigatoka réduit la qualité et la taille des fruits. Enlevez les feuilles infectées régulièrement – c'est GRATUIT !";
          diseaseLines.push(`  💼 ${note}`);
        }
      }
    }
    diseaseLines.push('');
    diseaseLines.push(isSwahili ? (SW.disease_business_case_title || "HALI YA BIASHARA") : isFrench ? (FR.disease_business_case_title || "CAS COMMERCIAL") : isSpanish ? (ES.disease_business_case_title || "CASO DE NEGOCIO") : 'BUSINESS CASE');
    diseaseLines.push(isSwahili ? `Bila udhibiti: Uwezekano wa hasara ya mavuno ya 30-100%\nKwa kuzuia: Gharama ${formatCurrency(2000)}-${formatCurrency(5000)}/ekari = OKOA ${formatCurrency(100000)}+!\nKila ${currencySymbol}1 inayotumika kuzuia magonjwa inarudisha ${currencySymbol}20-50 katika mavuno yaliyookolewa` : isFrench ? `Sans contrôle : Pertes de rendement possibles de 30 à 100 %\nAvec prévention : Coût ${formatCurrency(2000)}-${formatCurrency(5000)}/acre = ÉCONOMISEZ ${formatCurrency(100000)}+ !\nChaque ${currencySymbol}1 dépensé en prévention des maladies rapporte ${currencySymbol}20-50 en rendement économisé` : isSpanish ? `Sin control: Pérdidas de rendimiento del 30-100% posibles\nCon prevención: Costo ${formatCurrency(2000)}-${formatCurrency(5000)}/acre = ¡AHORRE ${formatCurrency(100000)}+!\nCada ${currencySymbol}1 gastado en prevención de enfermedades retorna ${currencySymbol}20-50 en rendimiento salvado` : `Without control: Yield losses of 30-100% possible\nWith prevention: Cost ${formatCurrency(2000)}-${formatCurrency(5000)}/acre = SAVE ${formatCurrency(100000)}+!\nEvery ${currencySymbol}1 spent on disease prevention returns ${currencySymbol}20-50 in saved yield`);

    if (isFrench) {
      let content = diseaseLines.join('\n');
      content = content.replace(/Preparación:/g, 'Préparation:')
                       .replace(/Aplicación:/g, 'Application:')
                       .replace(/Dosis:/g, 'Dose:')
                       .replace(/Momento:/g, 'Moment:')
                       .replace(/Seguridad:/g, 'Sécurité:')
                       .replace(/Estado:/g, 'Statut:')
                       .replace(/Dosis por acre:/g, 'Dose par acre:')
                       .replace(/Costo:/g, 'Coût:')
                       .replace(/Ahorre/g, 'Économisez')
                       .replace(/Pérdida/g, 'Perte');
      diseaseLines = content.split('\n');
    }

    addToStructuredList({ key: 'disease_management_grouped', params: { content: diseaseLines.join('\n'), crop: crop.toUpperCase(), diseases: farmerData.commonDiseases, low: formatCurrency(2000), high: formatCurrency(5000), saved: formatCurrency(100000), symbol: currencySymbol } });
  }

  // ========== PEST MANAGEMENT ==========
  if (farmerData.commonPests && shouldIncludeModule('pest_management_grouped')) {
    let pestLines: string[] = [];
    const pestTitle = replacePlaceholders(isSwahili ? (SW.pest_management_title as string) : isFrench ? (FR.pest_management_title as string) : isSpanish ? (ES.pest_management_title as string) : null, { crop: crop.toUpperCase() }) || (isSwahili ? `UDHIBITI JUMUISHI WA WADUDU (IPM) KWA BIASHARA YAKO YA ${crop.toUpperCase()}` : isFrench ? `GESTION INTÉGRÉE DES RAVAGEURS (IPM) POUR VOTRE ENTREPRISE ${crop.toUpperCase()}` : isSpanish ? `MANEJO INTEGRADO DE PLAGAS (MIP) PARA TU EMPRESA de ${crop.toUpperCase()}` : `INTEGRATED PEST MANAGEMENT (IPM) FOR YOUR ${crop.toUpperCase()} ENTERPRISE`);
    pestLines.push(pestTitle);
    const pestReported = replacePlaceholders(isSwahili ? (SW.pest_reported as string) : isFrench ? (FR.pest_reported as string) : isSpanish ? (ES.pest_reported as string) : null, { pests: farmerData.commonPests }) || (isSwahili ? `Wadudu ulioripoti: ${farmerData.commonPests}` : isFrench ? `Ravageurs signalés : ${farmerData.commonPests}` : isSpanish ? `Plagas reportadas: ${farmerData.commonPests}` : `The pests affecting your ${crop.toUpperCase()} ENTERPRISE: ${farmerData.commonPests}`);
    pestLines.push(pestReported);
    const pestList = farmerData.commonPests.split(',').map(p => p.trim()).filter(p => p);
    pestList.forEach(pest => { pestLines.push(`• ${pest}`); });
    pestLines.push('');
    pestLines.push(isSwahili ? (SW.pest_prevention_title || "KUZUIA (Rahisi kuliko kutibu)") : isFrench ? (FR.pest_prevention_title || "PRÉVENTION (Moins cher que guérir)") : isSpanish ? (ES.pest_prevention_title || "PREVENCIÓN (Más barato que curar)") : 'PREVENTION (Cheaper than cure)');
    pestLines.push(isSwahili ? (SW.pest_prevention_list || "• Zoea mzunguko wa mazao\n• Tumia aina zinazostahimili\n• Angalia mashamba kila wiki\n• Hifadhi maadui wa asili\n• Ondoa na uharibu mimea iliyoathirika") : isFrench ? (FR.pest_prevention_list || "• Pratiquez la rotation des cultures\n• Utilisez des variétés résistantes\n• Surveillez les champs chaque semaine\n• Conservez les ennemis naturels\n• Retirez et détruisez les plantes infectées") : isSpanish ? (ES.pest_prevention_list || "• Practique la rotación de cultivos\n• Use variedades resistentes\n• Monitoree los campos semanalmente\n• Conserve enemigos naturales\n• Retire y destruya plantas infectadas") : '• Practice crop rotation\n• Use resistant varieties\n• Monitor fields weekly\n• Conserve natural enemies\n• Remove and destroy infected plants');
    pestLines.push('');

    const cropLookupKey = lowerCrop.replace(/\s+/g, '');
    const cropPestsAndDiseases = cropPestDiseaseMap[cropLookupKey] || cropPestDiseaseMap[lowerCrop] || [];
    const cropPests = cropPestsAndDiseases.filter((pd: PestDisease) => pd.type === "pest");
    const userPests = farmerData.commonPests.split(',').map(p => p.trim().toLowerCase());
    const filteredPests = userPests.length > 0 ? cropPests.filter(pest => userPests.some(userPest => pest.name.toLowerCase().includes(userPest))) : cropPests;

    if (filteredPests.length > 0) {
      pestLines.push(isSwahili ? "CHAGUO ZA UDHIBITI:" : isFrench ? "OPTIONS DE LUTTE :" : isSpanish ? "OPCIONES DE CONTROL:" : "CONTROL OPTIONS FOR PESTS IN YOUR FARM:");
      for (const pest of filteredPests) {
        pestLines.push('');
        pestLines.push(`🐛 ${pest.name.toUpperCase()}`);
        if (pest.culturalControls && pest.culturalControls.length) {
          pestLines.push(isSwahili ? "Udhibiti wa kitamaduni:" : isFrench ? "Lutte cultural :" : isSpanish ? "Control cultural:" : "Cultural Control:");
          for (const control of pest.culturalControls) {
            pestLines.push(`  • ${control}`);
          }
        }
        if (pest.organicControls && pest.organicControls.length) {
          pestLines.push(isSwahili ? "Udhibiti wa kikaboni:" : isFrench ? "Lutte biologique :" : isSpanish ? "Control orgánico:" : "Organic Control:");
          for (const organic of pest.organicControls) {
            let method = organic.method;
            let prep = organic.preparation;
            let app = organic.application;
            if (isFrench) {
              method = translateOrganic(method, 'fr');
              prep = translateRate(prep, 'fr');
              app = translateTiming(app, 'fr');
            } else if (isSwahili) {
              method = translateOrganic(method, 'sw');
              prep = translateRate(prep, 'sw');
              app = translateTiming(app, 'sw');
            } else if (isSpanish) {
              method = translateOrganic(method, 'es');
              prep = translateRate(prep, 'es');
              app = translateTiming(app, 'es');
            } else {
              method = translateOrganic(method, 'en');
              prep = translateRate(prep, 'en');
              app = translateTiming(app, 'en');
            }
            pestLines.push(`  • ${method}`);
            if (isFrench) {
              pestLines.push(`    Préparation: ${prep}`);
              pestLines.push(`    Application: ${app}`);
            } else if (isSwahili) {
              pestLines.push(`    Maandalizi: ${prep}`);
              pestLines.push(`    Utumiaji: ${app}`);
            } else if (isSpanish) {
              pestLines.push(`    Preparación: ${prep}`);
              pestLines.push(`    Aplicación: ${app}`);
            } else {
              pestLines.push(`    Preparation: ${prep}`);
              pestLines.push(`    Application: ${app}`);
            }
          }
        }
        if (pest.chemicalControls && pest.chemicalControls.length) {
          pestLines.push(isSwahili ? "Udhibiti wa kemikali:" : isFrench ? "Lutte chimique :" : isSpanish ? "Control químico:" : "Chemical Control:");
          for (const chem of pest.chemicalControls) {
            let rate = chem.rate;
            let timing = chem.timing;
            let safety = chem.safetyInterval || '';
            if (isFrench) {
              rate = translateRate(rate, 'fr');
              timing = translateTiming(timing, 'fr');
              safety = translateSafety(safety, 'fr');
            } else if (isSwahili) {
              rate = translateRate(rate, 'sw');
              timing = translateTiming(timing, 'sw');
              safety = translateSafety(safety, 'sw');
            } else if (isSpanish) {
              rate = translateRate(rate, 'es');
              timing = translateTiming(timing, 'es');
              safety = translateSafety(safety, 'es');
            } else {
              rate = translateRate(rate, 'en');
              timing = translateTiming(timing, 'en');
              safety = translateSafety(safety, 'en');
            }
            pestLines.push(`  • ${chem.productName} (${chem.activeIngredient})`);
            if (isFrench) {
              pestLines.push(`    Dose: ${rate}`);
              pestLines.push(`    Dose par acre: ${chem.ratePerAcre}`);
              pestLines.push(`    Moment: ${timing}`);
              if (safety) pestLines.push(`    Sécurité: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'fr');
              pestLines.push(`    Statut: ${statusText}`);
            } else if (isSwahili) {
              pestLines.push(`    Kipimo: ${rate}`);
              pestLines.push(`    Kipimo kwa ekari: ${chem.ratePerAcre}`);
              pestLines.push(`    Wakati: ${timing}`);
              if (safety) pestLines.push(`    Usalama: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'sw');
              pestLines.push(`    Hali: ${statusText}`);
            } else if (isSpanish) {
              pestLines.push(`    Dosis: ${rate}`);
              pestLines.push(`    Dosis por acre: ${chem.ratePerAcre}`);
              pestLines.push(`    Momento: ${timing}`);
              if (safety) pestLines.push(`    Seguridad: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'es');
              pestLines.push(`    Estado: ${statusText}`);
            } else {
              pestLines.push(`    Dose: ${rate}`);
              pestLines.push(`    Dose per acre: ${chem.ratePerAcre}`);
              pestLines.push(`    Timing: ${timing}`);
              if (safety) pestLines.push(`    Safety: ${safety}`);
              const statusText = translateStatus(chem.status === 'restricted' ? '⚠️ RESTRICTED' : chem.status === 'banned' ? '❌ BANNED' : '✅ Active', 'en');
              pestLines.push(`    Status: ${statusText}`);
            }
          }
        }
        if (pest.businessNote) {
          let note = pest.businessNote;
          if (isFrench && pest.name === "Banana aphids (Pentalonia nigronervosa)") note = "Les pucerons transmettent le virus du bunchy top du bananier. Luttez tôt pour éviter la propagation du virus.";
          pestLines.push(`  💼 ${note}`);
        }
      }
    }
    pestLines.push('');
    pestLines.push(isSwahili ? (SW.pest_business_calc_title || "HESABU YA BIASHARA") : isFrench ? (FR.pest_business_calc_title || "CALCUL COMMERCIAL") : isSpanish ? (ES.pest_business_calc_title || "CÁLCULO DE NEGOCIO") : 'BUSINESS CALCULATION');
    pestLines.push(isSwahili ? `Bila udhibiti: Hasara 40-60% ya mavuno = hasara ${formatCurrency(80000)}-${formatCurrency(120000)}/ekari\nKwa IPM: Gharama ${formatCurrency(1500)}-${formatCurrency(3000)} = OKOA ${formatCurrency(100000)}+ faida\nKila ${currencySymbol}1 inayotumika kudhibiti wadudu inarudisha ${currencySymbol}30-40 katika mavuno yaliyookolewa` : isFrench ? `Sans contrôle : Perte de rendement de 40 à 60 % = perte de ${formatCurrency(80000)}-${formatCurrency(120000)}/acre\nAvec IPM : Coût ${formatCurrency(1500)}-${formatCurrency(3000)} = ÉCONOMISEZ ${formatCurrency(100000)}+ de profit\nChaque ${currencySymbol}1 dépensé en lutte antiparasitaire rapporte ${currencySymbol}30-40 en rendement économisé` : isSpanish ? `Sin control: Pérdida del 40-60% del rendimiento = pérdida de ${formatCurrency(80000)}-${formatCurrency(120000)}/acre\nCon MIP: Costo ${formatCurrency(1500)}-${formatCurrency(3000)} = ¡AHORRE ${formatCurrency(100000)}+ de ganancia\nCada ${currencySymbol}1 gastado en control de plagas retorna ${currencySymbol}30-40 en rendimiento salvado` : `Without control: Loss 40-60% yield = ${formatCurrency(80000)}-${formatCurrency(120000)} loss/acre\nWith IPM: Cost ${formatCurrency(1500)}-${formatCurrency(3000)} = SAVE ${formatCurrency(100000)}+ profit\nEvery ${currencySymbol}1 spent on pest control returns ${currencySymbol}30-40 in saved yield`);

    if (isFrench) {
      let content = pestLines.join('\n');
      content = content.replace(/Preparación:/g, 'Préparation:')
                       .replace(/Aplicación:/g, 'Application:')
                       .replace(/Dosis:/g, 'Dose:')
                       .replace(/Momento:/g, 'Moment:')
                       .replace(/Seguridad:/g, 'Sécurité:')
                       .replace(/Estado:/g, 'Statut:')
                       .replace(/Dosis por acre:/g, 'Dose par acre:')
                       .replace(/Costo:/g, 'Coût:')
                       .replace(/Ahorre/g, 'Économisez')
                       .replace(/Pérdida/g, 'Perte');
      pestLines = content.split('\n');
    }

    addToStructuredList({ key: 'pest_management_grouped', params: { content: pestLines.join('\n'), crop: crop.toUpperCase(), pests: farmerData.commonPests, lowLoss: formatCurrency(80000), highLoss: formatCurrency(120000), lowCost: formatCurrency(1500), highCost: formatCurrency(3000), saved: formatCurrency(100000), symbol: currencySymbol } });
  }

  // ========== NUTRIENT DEFICIENCY ==========
  if (farmerData.deficiencySymptoms && farmerData.deficiencySymptoms.trim() !== '' && shouldIncludeModule('deficiency_analysis')) {
    let symptoms = farmerData.deficiencySymptoms;
    let location = farmerData.deficiencyLocation || 'not specified';
    if (isFrench) {
      symptoms = translateDeficiencyFr(symptoms);
      location = translateDeficiencyFr(location);
    }
    const deficiencies = getDeficienciesForCrop(crop, farmerData.deficiencySymptoms, farmerData.deficiencyLocation);
    const deficiencyLines: string[] = [];
    if (deficiencies.length > 0) {
      if (isSwahili) {
        deficiencyLines.push(`UCHAMBUZI WA UPUNGUFU WA VIRUTUBISHO KWA BIASHARA YAKO YA ${crop.toUpperCase()}`);
        deficiencyLines.push(`Dalili zilizoripotiwa: ${symptoms}`);
        deficiencyLines.push(`Mahali dalili zinapojitokeza: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push("Uwezekano wa upungufu:");
        deficiencies.forEach(def => {
          deficiencyLines.push(`• ${def.nutrient} (${def.nutrientSymbol}) – ${def.description}`);
          deficiencyLines.push(`  Rekebisha kwa: ${def.correction.fertilizer.join(', ')} (${def.correction.rate}) – ${def.correction.application}`);
          if (def.correction.organic && def.correction.organic.length > 0) deficiencyLines.push(`  Njia za kikaboni: ${def.correction.organic.join(', ')}`);
          if (def.visualCues.length) deficiencyLines.push(`  Dalili: ${def.visualCues[0]}`);
        });
        deficiencyLines.push('');
        deficiencyLines.push("TAARIFA YA BIASHARA: Kugundua mapema kunaokoa mavuno na faida!");
      } else if (isFrench) {
        deficiencyLines.push(`ANALYSE DES CARENCES NUTRITIONNELLES POUR VOTRE ENTREPRISE ${crop.toUpperCase()}`);
        deficiencyLines.push(`Symptômes signalés : ${symptoms}`);
        deficiencyLines.push(`Emplacement des symptômes : ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push("Carences possibles :");
        deficiencies.forEach(def => {
          deficiencyLines.push(`• ${def.nutrient} (${def.nutrientSymbol}) – ${def.description}`);
          deficiencyLines.push(`  Correction : ${def.correction.fertilizer.join(', ')} (${def.correction.rate}) – ${def.correction.application}`);
          if (def.correction.organic && def.correction.organic.length > 0) deficiencyLines.push(`  Biologique : ${def.correction.organic.join(', ')}`);
          if (def.visualCues.length) deficiencyLines.push(`  Symptômes visuels : ${def.visualCues[0]}`);
        });
        deficiencyLines.push('');
        deficiencyLines.push("CONSEIL COMMERCIAL : La détection précoce permet d'économiser le rendement et le profit !");
      } else if (isSpanish) {
        deficiencyLines.push(`ANÁLISIS DE DEFICIENCIA DE NUTRIENTES PARA SU EMPRESA ${crop.toUpperCase()}`);
        deficiencyLines.push(`Síntomas reportados: ${symptoms}`);
        deficiencyLines.push(`Ubicación de los síntomas: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push("Posibles deficiencias:");
        deficiencies.forEach(def => {
          deficiencyLines.push(`• ${def.nutrient} (${def.nutrientSymbol}) – ${def.description}`);
          deficiencyLines.push(`  Corrección: ${def.correction.fertilizer.join(', ')} (${def.correction.rate}) – ${def.correction.application}`);
          if (def.correction.organic && def.correction.organic.length > 0) deficiencyLines.push(`  Opciones orgánicas: ${def.correction.organic.join(', ')}`);
          if (def.visualCues.length) deficiencyLines.push(`  Síntoma visual: ${def.visualCues[0]}`);
        });
        deficiencyLines.push('');
        deficiencyLines.push("CONSEJO COMERCIAL: ¡La detección temprana ahorra rendimiento y ganancia!");
      } else {
        deficiencyLines.push(`NUTRIENT DEFICIENCY ANALYSIS FOR YOUR ${crop.toUpperCase()} ENTERPRISE`);
        deficiencyLines.push(`Symptoms reported: ${symptoms}`);
        deficiencyLines.push(`Location: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push('Possible deficiencies:');
        deficiencies.forEach(def => {
          deficiencyLines.push(`• ${def.nutrient} (${def.nutrientSymbol}) – ${def.description}`);
          deficiencyLines.push(`  Correction: ${def.correction.fertilizer.join(', ')} (${def.correction.rate}) – ${def.correction.application}`);
          if (def.correction.organic && def.correction.organic.length > 0) deficiencyLines.push(`  Organic: ${def.correction.organic.join(', ')}`);
          if (def.visualCues.length) deficiencyLines.push(`  Visual cue: ${def.visualCues[0]}`);
        });
        deficiencyLines.push('');
        deficiencyLines.push('BUSINESS TIP: Early detection saves yield and profit!');
      }
    } else {
      if (isSwahili) {
        deficiencyLines.push(`UCHAMBUZI WA UPUNGUFU WA VIRUTUBISHO KWA BIASHARA YAKO YA ${crop.toUpperCase()}`);
        deficiencyLines.push(`Dalili zilizoripotiwa: ${symptoms}`);
        deficiencyLines.push(`Mahali dalili zinapojitokeza: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push('Hakuna upungufu maalum ulioainishwa kwa zao hili. Tunapendekeza uchambuzi wa udongo kwa usahihi zaidi.');
        deficiencyLines.push('');
        deficiencyLines.push("TAARIFA YA BIASHARA: Kugundua mapema kunaokoa mavuno na faida!");
      } else if (isFrench) {
        deficiencyLines.push(`ANALYSE DES CARENCES NUTRITIONNELLES POUR VOTRE ENTREPRISE ${crop.toUpperCase()}`);
        deficiencyLines.push(`Symptômes signalés : ${symptoms}`);
        deficiencyLines.push(`Emplacement des symptômes : ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push('Aucune carence spécifique n\'est définie pour cette culture. Nous recommandons une analyse de sol pour plus de précision.');
        deficiencyLines.push('');
        deficiencyLines.push("CONSEIL COMMERCIAL : La détection précoce permet d'économiser le rendement et le profit !");
      } else if (isSpanish) {
        deficiencyLines.push(`ANÁLISIS DE DEFICIENCIA DE NUTRIENTES PARA SU EMPRESA ${crop.toUpperCase()}`);
        deficiencyLines.push(`Síntomas reportados: ${symptoms}`);
        deficiencyLines.push(`Ubicación de los síntomas: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push('No se definen deficiencias específicas para este cultivo. Se recomienda un análisis de suelo para un diagnóstico preciso.');
        deficiencyLines.push('');
        deficiencyLines.push("CONSEJO COMERCIAL: ¡La detección temprana ahorra rendimiento y ganancia!");
      } else {
        deficiencyLines.push(`NUTRIENT DEFICIENCY ANALYSIS FOR YOUR ${crop.toUpperCase()} ENTERPRISE`);
        deficiencyLines.push(`Symptoms reported: ${symptoms}`);
        deficiencyLines.push(`Location: ${location}`);
        deficiencyLines.push('');
        deficiencyLines.push('No specific deficiencies defined for this crop. A soil test is recommended for accurate diagnosis.');
        deficiencyLines.push('');
        deficiencyLines.push('BUSINESS TIP: Early detection saves yield and profit!');
      }
    }
    addToStructuredList({ key: 'deficiency_analysis', params: { content: deficiencyLines.join('\n'), symptoms, location, crop: crop.toUpperCase() } });
  }

  // ========== PLANT DAMAGE REPORT ==========
  if (farmerData.plantsDamaged && farmerData.plantsDamaged > 0 && shouldIncludeModule('plant_damage')) {
    let damageText = '';
    if (isFrench) {
      damageText = `RAPPORT DE DÉGÂTS POUR VOTRE ENTREPRISE ${crop.toUpperCase()}\nVous avez signalé ${farmerData.plantsDamaged} plantes endommagées au-delà de tout rétablissement.\nEnvisagez de revoir vos stratégies de lutte contre les ravageurs et les maladies pour éviter de futures pertes.\nPour des conseils personnalisés sur la réduction des dégâts aux plantes, interrogez notre système Q&A sur la lutte antiparasitaire ou la prévention des maladies.`;
    } else if (isSwahili) {
      damageText = `RIPOTI YA UHARIBIFU KWA BIASHARA YAKO YA ${crop.toUpperCase()}\nUmeripoti mimea ${farmerData.plantsDamaged} iliyoharibiwa zaidi ya kurejeshwa.\nFikiria kukagua mikakati yako ya udhibiti wa wadudu na magonjwa ili kuzuia hasara za baadaye.\nKwa ushauri wa kibinafsi juu ya kupunguza uharibifu wa mimea, uliza mfumo wetu wa Maswali na Majibu kuhusu udhibiti wa wadudu au kuzuia magonjwa.`;
    } else if (isSpanish) {
      damageText = `INFORME DE DAÑOS PARA SU EMPRESA ${crop.toUpperCase()}\nReportó ${farmerData.plantsDamaged} plantas dañadas más allá de toda recuperación.\nConsidere revisar sus estrategias de manejo de plagas y enfermedades para evitar pérdidas futuras.\nPara consejos personalizados sobre cómo reducir el daño a las plantas, consulte nuestro sistema de P&R sobre control de plagas o prevención de enfermedades.`;
    } else {
      damageText = `DAMAGE REPORT FOR YOUR ${crop.toUpperCase()} ENTERPRISE\nYou reported ${farmerData.plantsDamaged} plants damaged beyond recovery.\nConsider reviewing your pest and disease management strategies to prevent future losses.\nFor personalized advice on reducing plant damage, ask our Q&A system about pest control or disease prevention.`;
    }
    addToStructuredList({ key: 'plant_damage', params: { content: damageText, count: farmerData.plantsDamaged } });
  }

  // ========== SOIL AND WATER CONSERVATION ==========
  if (shouldIncludeModule('conservation')) {
    const conservationPractices = farmerData.conservationPractices ? farmerData.conservationPractices.split(',').map(p => p.trim()) : [];
    let conservationText = '';
    if (conservationPractices.length > 0 && conservationPractices.some(p => p !== 'None')) {
      if (isSwahili) {
        conservationText = `UHIFADHI WA UDONGO NA MAJI KWA BIASHARA YAKO YA ${crop.toUpperCase()}\nTayari unatumia: ${conservationPractices.filter(p => p !== 'None').join(', ')}. Kazi nzuri!\n\nNJIA ZILIZOPENDEKEZWA\nSamadi: Endelea kuweka tani 5-10 kwa ekari. Inaboresha muundo wa udongo na uwezo wa kuhifadhi maji.\nMatuta: Bora kwa miteremko! Inapunguza mmonyoko wa udongo hadi 80%.\nKufunika: Kuhifadhi unyevu, kupunguza palizi. Tumia mabaki ya mazao - NI BURE! (Saves ${formatCurrency(5000)}/acre)\nMazao ya kufunika: Panda mucuna au dolichos kati ya mistari. Hutoa kilo 40 N/ekari kiasili! (Yanaokoa ${formatCurrency(3500)} ya mbolea)\nKuvuna maji ya mvua: Jenga mabirika - 1,000m³ yanagharimu ${formatCurrency(200000)}, yanadumu miaka 10.\nKilimo cha mtaro: Kwenye miteremko >5% - inapunguza mmonyoko kwa 50% na kuhifadhi maji.\n\nHALI YA BIASHARA\nKufunika kunaokoa palizi mara 2 = ${formatCurrency(5000)}/ekari iliyookolewa\nMazao ya kufunika hutoa kilo 40 N/ekari = yanaokoa ${formatCurrency(3500)} ya mbolea\nKila ${currencySymbol}1 inayowekezwa katika uhifadhi inarudisha ${currencySymbol}5 katika kuokoa pembejeo na kuongeza mavuno`;
      } else if (isFrench) {
        conservationText = `CONSERVATION DES SOLS ET DE L'EAU POUR VOTRE ENTREPRISE ${crop.toUpperCase()}\nVous utilisez déjà : ${conservationPractices.filter(p => p !== 'None').join(', ')}. Bon travail !\n\nPRATIQUES RECOMMANDÉES\nFumier : Continuez à appliquer 5-10 tonnes par acre. Améliore la structure du sol et la capacité de rétention d'eau.\nTerrasses : Excellentes pour les pentes ! Réduit l'érosion du sol jusqu'à 80%.\nPaillage : Retient l'humidité, réduit le désherbage. Utilisez les résidus de culture - c'est GRATUIT ! (Économise ${formatCurrency(5000)}/acre)\nCultures de couverture : Plantez du mucuna ou du dolichos entre les rangs. Fixe 40 kg N/acre naturellement ! (Économise ${formatCurrency(3500)} d'engrais)\nCollecte des eaux de pluie : Construisez des bassins - un bassin de 1 000 m³ coûte ${formatCurrency(200000)} et dure 10 ans.\nCulture en courbes de niveau : Sur les pentes >5% - réduit l'érosion de 50% et retient l'eau.\n\nCAS COMMERCIAL\nLe paillage permet d'économiser 2 désherbages = ${formatCurrency(5000)}/acre économisés\nLes cultures de couverture fixent 40 kg N/acre = économisent ${formatCurrency(3500)} d'engrais\nChaque ${currencySymbol}1 investi dans la conservation rapporte ${currencySymbol}5 en intrants économisés et en rendements accrus`;
      } else if (isSpanish) {
        conservationText = `CONSERVACIÓN DE SUELO Y AGUA PARA SU EMPRESA ${crop.toUpperCase()}\nYa está usando: ${conservationPractices.filter(p => p !== 'None').join(', ')}. ¡Buen trabajo!\n\nPRÁCTICAS RECOMENDADAS\nEstiércol: Continúe aplicando 5-10 toneladas por acre. Mejora la estructura del suelo y la capacidad de retención de agua.\nTerrazas: ¡Excelentes para pendientes! Reduce la erosión del suelo hasta en un 80%.\nAcolchado: Retiene humedad, reduce deshierbe. Use residuos de cultivos - ¡es GRATIS! (Ahorra ${formatCurrency(5000)}/acre)\nCultivos de cobertura: Plante mucuna o dolichos entre hileras. ¡Fija 40 kg N/acre naturalmente! (Ahorra ${formatCurrency(3500)} de fertilizante)\nCaptación de agua de lluvia: Construya reservorios - un reservorio de 1,000 m³ cuesta ${formatCurrency(200000)} y dura 10 años.\nSiembra en curvas de nivel: En pendientes >5% - reduce la erosión en un 50% y retiene agua.\n\nCASO DE NEGOCIO\nEl acolchado ahorra 2 rondas de deshierbe = ${formatCurrency(5000)}/acre ahorrados\nLos cultivos de cobertura fijan 40 kg N/acre = ahorran ${formatCurrency(3500)} de fertilizante\nCada ${currencySymbol}1 invertido en conservación retorna ${currencySymbol}5 en ahorro de insumos y mayores rendimientos`;
      } else {
        conservationText = `SOIL AND WATER CONSERVATION FOR YOUR ${crop.toUpperCase()} ENTERPRISE\nYou're already using: ${conservationPractices.filter(p => p !== 'None').join(', ')}. Great job!\n\nRECOMMENDED PRACTICES\nOrganic Manure: Continue applying 5-10 tons per acre.\nTerracing: Excellent for slopes! Reduces soil erosion by up to 80%.\nMulching: Retains moisture, reduces weeding. Use crop residues - it's FREE! (Saves ${formatCurrency(5000)}/acre)\nCover crops: Plant mucuna or dolichos between rows. Fixes 40kg N/acre naturally! (Saves ${formatCurrency(3500)} fertilizer)\nRainwater harvesting: Build water pans - 1,000m³ pan costs ${formatCurrency(200000)}, lasts 10 years.\nContour farming: On slopes >5% - reduces erosion by 50% and retains water.\n\nBUSINESS CASE\nMulching saves 2 weeding rounds = ${formatCurrency(5000)}/acre saved\nCover crops fix 40kg N/acre = saves ${formatCurrency(3500)} fertilizer\nEvery ${currencySymbol}1 invested in conservation returns ${currencySymbol}5 in saved inputs and increased yields`;
      }
    } else {
      if (isSwahili) {
        conservationText = `UHIFADHI WA UDONGO NA MAJI KWA BIASHARA YAKO YA ${crop.toUpperCase()}\nHakuna mbinu za uhifadhi zilizoripotiwa. Hapa kuna mbinu zilizopendekezwa:\n\nNJIA ZILIZOPENDEKEZWA\nSamadi: Weka tani 5-10 kwa ekari. Inaboresha muundo wa udongo na uwezo wa kuhifadhi maji.\nMatuta: Bora kwa miteremko! Inapunguza mmonyoko wa udongo hadi 80%.\nKufunika: Kuhifadhi unyevu, kupunguza palizi. Tumia mabaki ya mazao - NI BURE! (Saves ${formatCurrency(5000)}/acre)\nMazao ya kufunika: Panda mucuna au dolichos kati ya mistari. Hutoa kilo 40 N/ekari kiasili! (Yanaokoa ${formatCurrency(3500)} ya mbolea)\nKuvuna maji ya mvua: Jenga mabirika - 1,000m³ yanagharimu ${formatCurrency(200000)}, yanadumu miaka 10.\nKilimo cha mtaro: Kwenye miteremko >5% - inapunguza mmonyoko kwa 50% na kuhifadhi maji.\n\nHALI YA BIASHARA\nKufunika kunaokoa palizi mara 2 = ${formatCurrency(5000)}/ekari iliyookolewa\nMazao ya kufunika hutoa kilo 40 N/ekari = yanaokoa ${formatCurrency(3500)} ya mbolea\nKila ${currencySymbol}1 inayowekezwa katika uhifadhi inarudisha ${currencySymbol}5 katika kuokoa pembejeo na kuongeza mavuno`;
      } else if (isFrench) {
        conservationText = `CONSERVATION DES SOLS ET DE L'EAU POUR VOTRE ENTREPRISE ${crop.toUpperCase()}\nAucune pratique de conservation signalée. Voici les techniques recommandées :\n\nPRATIQUES RECOMMANDÉES\nFumier : Appliquez 5-10 tonnes par acre. Améliore la structure du sol et la capacité de rétention d'eau.\nTerrasses : Excellentes pour les pentes ! Réduit l'érosion du sol jusqu'à 80%.\nPaillage : Retient l'humidité, réduit le désherbage. Utilisez les résidus de culture - c'est GRATUIT ! (Économise ${formatCurrency(5000)}/acre)\nCultures de couverture : Plantez du mucuna ou du dolichos entre les rangs. Fixe 40 kg N/acre naturellement ! (Économise ${formatCurrency(3500)} d'engrais)\nCollecte des eaux de pluie : Construisez des bassins - un bassin de 1 000 m³ coûte ${formatCurrency(200000)} et dure 10 ans.\nCulture en courbes de niveau : Sur les pentes >5% - réduit l'érosion de 50% et retient l'eau.\n\nCAS COMMERCIAL\nLe paillage permet d'économiser 2 désherbages = ${formatCurrency(5000)}/acre économisés\nLes cultures de couverture fixent 40 kg N/acre = économisent ${formatCurrency(3500)} d'engrais\nChaque ${currencySymbol}1 investi dans la conservation rapporte ${currencySymbol}5 en intrants économisés et en rendements accrus`;
      } else if (isSpanish) {
        conservationText = `CONSERVACIÓN DE SUELO Y AGUA PARA SU EMPRESA ${crop.toUpperCase()}\nNo se reportaron prácticas de conservación. Aquí están las técnicas recomendadas:\n\nPRÁCTICAS RECOMENDADAS\nEstiércol: Aplique 5-10 toneladas por acre. Mejora la estructura del suelo y la capacidad de retención de agua.\nTerrazas: ¡Excelentes para pendientes! Reduce la erosión del suelo hasta en un 80%.\nAcolchado: Retiene humedad, reduce deshierbe. Use residuos de cultivos - ¡es GRATIS! (Ahorra ${formatCurrency(5000)}/acre)\nCultivos de cobertura: Plante mucuna o dolichos entre hileras. ¡Fija 40 kg N/acre naturalmente! (Ahorra ${formatCurrency(3500)} de fertilizante)\nCaptación de agua de lluvia: Construya reservorios - un reservorio de 1,000 m³ cuesta ${formatCurrency(200000)} y dura 10 años.\nSiembra en curvas de nivel: En pendientes >5% - reduce la erosión en un 50% y retiene agua.\n\nCASO DE NEGOCIO\nEl acolchado ahorra 2 rondas de deshierbe = ${formatCurrency(5000)}/acre ahorrados\nLos cultivos de cobertura fijan 40 kg N/acre = ahorran ${formatCurrency(3500)} de fertilizante\nCada ${currencySymbol}1 invertido en conservación retorna ${currencySymbol}5 en ahorro de insumos y mayores rendimientos`;
      } else {
        conservationText = `SOIL AND WATER CONSERVATION FOR YOUR ${crop.toUpperCase()} ENTERPRISE\nNo conservation practices reported. Here are recommended practices:\n\nRECOMMENDED PRACTICES\nOrganic Manure: Apply 5-10 tons per acre.\nTerracing: Excellent for slopes! Reduces soil erosion by up to 80%.\nMulching: Retains moisture, reduces weeding. Use crop residues - it's FREE! (Saves ${formatCurrency(5000)}/acre)\nCover crops: Plant mucuna or dolichos between rows. Fixes 40kg N/acre naturally! (Saves ${formatCurrency(3500)} fertilizer)\nRainwater harvesting: Build water pans - 1,000m³ pan costs ${formatCurrency(200000)}, lasts 10 years.\nContour farming: On slopes >5% - reduces erosion by 50% and retains water.\n\nBUSINESS CASE\nMulching saves 2 weeding rounds = ${formatCurrency(5000)}/acre saved\nCover crops fix 40kg N/acre = saves ${formatCurrency(3500)} fertilizer\nEvery ${currencySymbol}1 invested in conservation returns ${currencySymbol}5 in saved inputs and increased yields`;
      }
    }
    addToStructuredList({ key: 'conservation', params: { content: conservationText } });
  }

  // ========== POST-HARVEST HANDLING & STORAGE ==========
  if (shouldIncludeModule('post_harvest')) {
    let storageMethod = farmerData.storageMethod || '';
    if (isFrench) {
      storageMethod = translateStorageFr(storageMethod);
    }
    let postHarvestText = '';
    if (isFrench) {
      postHarvestText = `MANUTENTION ET STOCKAGE POST-RÉCOLTE POUR VOTRE ENTREPRISE ${crop.toUpperCase()}\nMéthode de stockage : ${storageMethod}\n\n${getPostHarvestLossWarning(crop, language)}\n\n${getSortingGradingAdvice(crop, language)}\n${getValueAdditionSuggestion(crop, language)}\n\nCONSEIL COMMERCIAL : Réduire les pertes post-récolte de 10 % augmente votre profit de 10 % sans frais de production supplémentaires ! Triez et calibrez pour de meilleurs prix.`;
    } else if (isSwahili) {
      postHarvestText = `USHUGHULIKAJI NA UHIFADHI WA BAADA YA MAVUNO KWA BIASHARA YAKO YA ${crop.toUpperCase()}\nMbinu ya kuhifadhi: ${storageMethod}\n\n${getPostHarvestLossWarning(crop, language)}\n\n${getSortingGradingAdvice(crop, language)}\n${getValueAdditionSuggestion(crop, language)}\n\nTAARIFA YA BIASHARA: Kupunguza hasara za baada ya mavuno kwa 10% kunaongeza faida yako kwa 10% bila gharama za ziada za uzalishaji! Panga na chemsha mavuno yako kwa bei bora.`;
    } else if (isSpanish) {
      postHarvestText = `MANEJO Y ALMACENAMIENTO POSTCOSECHA PARA SU EMPRESA ${crop.toUpperCase()}\nMétodo de almacenamiento: ${storageMethod}\n\n${getPostHarvestLossWarning(crop, language)}\n\n${getSortingGradingAdvice(crop, language)}\n${getValueAdditionSuggestion(crop, language)}\n\nCONSEJO COMERCIAL: ¡Reducir las pérdidas postcosecha en un 10% aumenta su ganancia en un 10% sin costos adicionales de producción! Seleccione y calibre para mejores precios.`;
    } else {
      postHarvestText = `POST-HARVEST HANDLING & STORAGE FOR YOUR ${crop.toUpperCase()} ENTERPRISE\nStorage method: ${storageMethod}\n\n${getPostHarvestLossWarning(crop, language)}\n\n${getSortingGradingAdvice(crop, language)}\n${getValueAdditionSuggestion(crop, language)}\n\nBUSINESS TIP: Reducing post-harvest losses by 10% increases your profit by 10% with no extra production costs! Sort and grade for better prices.`;
    }
    addToStructuredList({ key: 'post_harvest', params: { content: postHarvestText } });
  }

  // ========== FARMING AS BUSINESS ==========
  if (shouldIncludeModule('farming_business')) {
    let businessText = '';
    if (isSwahili) {
      businessText = `KILIMO KAMA BIASHARA - ONGEZA FAIDA YAKO\n\n1. JUA GHARAMA ZAKO\nFuatilia KILA pembejeo: mbegu, mbolea, kazi, usafirishaji, magunia\nMfano mahindi ya kati: Gharama ${formatCurrency(40000)}/hekta\n\n2. NUNUA KWA JUMLA (Okoa 20-30%)\nDAP: gunia 50kg ${formatCurrency(3500)} -> Nunua magunia 10 ${formatCurrency(31500)} (okoa ${formatCurrency(3500)})\nCAN: gunia 50kg ${formatCurrency(3200)} -> Nunua magunia 10 ${formatCurrency(28800)} (okoa ${formatCurrency(3200)})\n\n3. UNDA VIKUNDI VYA WAKULIMA\nUnunuzi wa jumla wa pembejeo: Okoa 15-25%\nUsafirishaji wa pamoja: Okoa ${formatCurrency(5000)}/ekari\nUuzaji wa pamoja: Pata bei 10-20% za juu\n\n4. AWAMU YA KUONGEZEKA\nKila ${currencySymbol}1 ya ziada inayowekezwa inarudisha ${currencySymbol}3-5 faida\nEndelea kuwekeza - pembejeo zaidi = faida zaidi\n\nMATOKEO YA MWISHO: Kilimo ni BIASHARA. Fanya kila shilingi ikufanyie kazi`;
    } else if (isFrench) {
      businessText = `L'AGRICULTURE COMME ENTREPRISE - MAXIMISEZ VOTRE PROFIT\n\n1. CONNAISSEZ VOS COÛTS\nSuivez CHAQUE intrant : semences, engrais, main-d'œuvre, transport, sacs\nExemple maïs moyen : Coûts ${formatCurrency(40000)}/hectare\n\n2. ACHETEZ EN VRAC (Économisez 20-30%)\nDAP : sac de 50 kg ${formatCurrency(3500)} -> Achetez 10 sacs ${formatCurrency(31500)} (économisez ${formatCurrency(3500)})\nCAN : sac de 50 kg ${formatCurrency(3200)} -> Achetez 10 sacs ${formatCurrency(28800)} (économisez ${formatCurrency(3200)})\n\n3. FORMEZ DES GROUPES D'AGRICULTEURS\nAchats groupés d'intrants : Économisez 15-25%\nTransport partagé : Économisez ${formatCurrency(5000)}/acre\nMarketing collectif : Obtenez des prix 10-20% plus élevés\n\n4. PHASE EXPONENTIELLE\nChaque ${currencySymbol}1 supplémentaire investi rapporte ${currencySymbol}3-5 de profit\nContinuez à investir - plus d'intrants = plus de profits\n\nCONCLUSION : L'agriculture est une ENTREPRISE. Faites travailler chaque centime pour vous`;
    } else if (isSpanish) {
      businessText = `AGRICULTURA COMO NEGOCIO - MAXIMICE SU GANANCIA\n\n1. CONOZCA SUS COSTOS\nRegistre CADA insumo: semillas, fertilizante, mano de obra, transporte, sacos\nEjemplo maíz medio: Costos ${formatCurrency(40000)}/hectárea\n\n2. COMPRE AL POR MAYOR (Ahorre 20-30%)\nDAP: saco 50kg ${formatCurrency(3500)} -> Compre 10 sacos ${formatCurrency(31500)} (ahorre ${formatCurrency(3500)})\nCAN: saco 50kg ${formatCurrency(3200)} -> Compre 10 sacos ${formatCurrency(28800)} (ahorre ${formatCurrency(3200)})\n\n3. FORME GRUPOS DE AGRICULTORES\nCompras al por mayor de insumos: Ahorre 15-25%\nTransporte compartido: Ahorre ${formatCurrency(5000)}/acre\nComercialización colectiva: Obtenga precios 10-20% más altos\n\n4. FASE EXPONENCIAL\nCada ${currencySymbol}1 adicional invertido retorna ${currencySymbol}3-5 de ganancia\nSiga invirtiendo - más insumos = más ganancias\n\nRESULTADO FINAL: La agricultura es un NEGOCIO. ¡Haga que cada ${currencySymbol} trabaje para usted!`;
    } else {
      businessText = `FARMING AS A BUSINESS - MAXIMIZE YOUR PROFIT\n\n1. KNOW YOUR COSTS\nTrack EVERY input: seeds, fertilizer, labour, transport, bags\nExample maize medium: Costs ${formatCurrency(40000)}/hectare\n\n2. BUY IN BULK (Save 20-30%)\nDAP: 50kg bag ${formatCurrency(3500)} -> Buy 10 bags ${formatCurrency(31500)} (save ${formatCurrency(3500)})\nCAN: 50kg bag ${formatCurrency(3200)} -> Buy 10 bags ${formatCurrency(28800)} (save ${formatCurrency(3200)})\n\n3. FORM FARMER GROUPS\nBulk input purchases: Save 15-25%\nShared transport: Save ${formatCurrency(5000)}/acre\nCollective marketing: Get 10-20% higher prices\n\n4. EXPONENTIAL PHASE\nEvery additional ${currencySymbol}1 input returns ${currencySymbol}3-5 profit\nKeep investing - more inputs = more profits\n\nBOTTOM LINE: Farming is a BUSINESS. Make every ${currencySymbol} work for you`;
    }
    addToStructuredList({ key: 'farming_business', params: { content: businessText } });
  }

  // ========== NUTRITION & HEALTH BENEFITS ==========
  if (farmerData.wantsNutritionBenefits && shouldIncludeModule('nutrition_benefits')) {
    let nutritionText = '';
    if (lowerCrop === 'coffee') {
      if (isFrench) {
        nutritionText = `🌿 NUTRITION ET BIENFAITS POUR LA SANTÉ – CAFÉ\nPour 100g de produit frais\nNutriments Clés\n• Caféine: 95 mg\n• Riboflavine: 0.2 mg (11% VQ)\n• Magnésium: 7 mg (2% VQ)\n• Potassium: 116 mg (2% VQ)\n• Antioxydants: élevés\n• Niacine: 0.5 mg (3% VQ)\n• Manganèse: 0.1 mg (3% VQ)\n• Acide chlorogénique: variable\nBienfaits pour la Santé\nVigilance – la caféine bloque l'adénosine\nAntioxydant – réduit le stress oxydatif\nSanté du cerveau – peut réduire le risque d'Alzheimer\nSanté du foie – réduit le risque de cirrhose\nMétabolisme – peut accélérer le métabolisme\nSanté cardiaque – protection à consommation modérée\nDiabète de type 2 – peut réduire le risque\nDépression – peut réduire le risque`;
      } else if (isSwahili) {
        nutritionText = `🌿 MANUFAA YA LISHE NA AFYA – KAHABA\nKwa gramu 100 za mbegu mbichi\nVirutubisho Muhimu\n• Kafeini: 95 mg\n• Riboflauini: 0.2 mg (11% ya THK)\n• Magnesiamu: 7 mg (2% ya THK)\n• Potasiamu: 116 mg (2% ya THK)\n• Vioksidishaji: kiwango kikubwa\n• Niasini: 0.5 mg (3% ya THK)\n• Manganese: 0.1 mg (3% ya THK)\n• Asidi klorojeni: hutofautiana\nManufaa ya Kiafya\nUangalifu – kafeini huzuia adenosine\nKinga ya mwili – hupunguza mkazo wa seli\nAfya ya ubongo – inaweza kupunguza hatari ya Alzheimers\nAfya ya ini – inapunguza hatari ya ugonjwa wa ini\nKimetaboliki – inaweza kuongeza kasi ya uchomaji kalori\nAfya ya moyo – ulinzi ukiwa unywa kwa wastani\nUgonjwa wa kisukari aina 2 – inaweza kupunguza hatari\nMfadhaiko – inaweza kupunguza hatari`;
      } else if (isSpanish) {
        nutritionText = `🌿 BENEFICIOS NUTRICIONALES Y PARA LA SALUD – CAFÉ\nPor 100g de producto fresco\nNutrientes Clave\n• Cafeína: 95 mg\n• Riboflavina: 0.2 mg (11% VD)\n• Magnesio: 7 mg (2% VD)\n• Potasio: 116 mg (2% VD)\n• Antioxidantes: alto\n• Niacina: 0.5 mg (3% VD)\n• Manganeso: 0.1 mg (3% VD)\n• Ácido clorogénico: variable\nBeneficios para la Salud\nAlerta – la cafeína bloquea la adenosina\nAntioxidante – reduce el estrés oxidativo\nSalud cerebral – puede reducir el riesgo de Alzheimer\nSalud hepática – reduce el riesgo de cirrosis\nMetabolismo – puede acelerar el metabolismo\nSalud cardíaca – protección con consumo moderado\nDiabetes tipo 2 – puede reducir el riesgo\nDepresión – puede reducir el riesgo`;
      } else {
        nutritionText = `🌿 NUTRITION & HEALTH BENEFITS – COFFEE\nPer 100g fresh weight\nKey Nutrients\n• Caffeine: 95 mg\n• Riboflavin: 0.2 mg (11% DV)\n• Magnesium: 7 mg (2% DV)\n• Potassium: 116 mg (2% DV)\n• Antioxidants: high\n• Niacin: 0.5 mg (3% DV)\n• Manganese: 0.1 mg (3% DV)\n• Chlorogenic acid: varies\nHealth Benefits\nAlertness – caffeine blocks adenosine\nAntioxidant – reduces oxidative stress\nBrain health – may lower risk of Alzheimer's\nLiver health – reduces risk of cirrhosis\nMetabolism – may boost metabolic rate\nHeart health – moderate consumption protective\nType 2 diabetes – may reduce risk\nDepression – may lower risk`;
      }
    } else if (lowerCrop === 'bananas') {
      if (isFrench) {
        nutritionText = `🌿 NUTRITION ET BIENFAITS POUR LA SANTÉ – BANANAS\nPour 100g de produit frais\nNutriments Clés\n• Vitamine B6: 0.4 mg (24% VQ)\n• Vitamine C: 8.7 mg (10% VQ)\n• Potassium: 358 mg (8% VQ)\n• Manganèse: 0.3 mg (13% VQ)\n• Fibres: 2.6 g (9% VQ)\n• Magnésium: 27 mg (6% VQ)\n• Cuivre: 0.1 mg (8% VQ)\nBienfaits pour la Santé\nAime votre cœur – le potassium abaisse la tension\nDigestion facile – pectine\nÉnergie naturelle – glucides\nAntioxydant – dopamine et catéchines`;
      } else if (isSwahili) {
        nutritionText = `🌿 MANUFAA YA LISHE NA AFYA – NDIZI\nKwa gramu 100 za ndizi mbichi\nVirutubisho Muhimu\n• Vitamini B6: 0.4 mg (24% THK)\n• Vitamini C: 8.7 mg (10% THK)\n• Potasiamu: 358 mg (8% THK)\n• Manganese: 0.3 mg (13% THK)\n• Nyuzinyuzi: 2.6 g (9% THK)\n• Magnesiamu: 27 mg (6% THK)\n• Shaba: 0.1 mg (8% THK)\nManufaa ya Kiafya\nAfya ya moyo – potasiamu hupunguza shinikizo la damu\nUsagaji chakula – pectini husaidia\nNishati asili – wanga\nKinga dhidi ya vioksidishaji – dopamine na katekisimu`;
      } else if (isSpanish) {
        nutritionText = `🌿 BENEFICIOS NUTRICIONALES Y PARA LA SALUD – PLÁTANOS\nPor 100g de producto fresco\nNutrientes Clave\n• Vitamina B6: 0.4 mg (24% VD)\n• Vitamina C: 8.7 mg (10% VD)\n• Potasio: 358 mg (8% VD)\n• Manganeso: 0.3 mg (13% VD)\n• Fibra: 2.6 g (9% VD)\n• Magnesio: 27 mg (6% VD)\nBeneficios para la Salud\nCorazón – el potasio reduce la presión arterial\nDigestión – pectina\nEnergía natural – carbohidratos\nAntioxidante – dopamina y catequinas`;
      } else {
        nutritionText = `🌿 NUTRITION & HEALTH BENEFITS – BANANAS\nPer 100g fresh weight\nKey Nutrients\n• Vitamin B6: 0.4 mg (24% DV)\n• Vitamin C: 8.7 mg (10% DV)\n• Potassium: 358 mg (8% DV)\n• Manganese: 0.3 mg (13% DV)\n• Fiber: 2.6 g (9% DV)\n• Magnesium: 27 mg (6% DV)\n• Copper: 0.1 mg (8% DV)\nHealth Benefits\nHeart health – potassium lowers blood pressure\nDigestion – pectin\nNatural energy – carbohydrates\nAntioxidant – dopamine and catechins`;
      }
    } else {
      if (isFrench) {
        nutritionText = `🌿 BIENFAITS NUTRITIONNELS – ${crop.toUpperCase()}\nRiche en vitamines, minéraux et antioxydants. Une alimentation saine commence par votre ferme.`;
      } else if (isSwahili) {
        nutritionText = `🌿 MANUFAA YA LISHE – ${crop.toUpperCase()}\nIna vitamini nyingi, madini na vioksidishaji. Lishe bora huanza shambani kwako.`;
      } else if (isSpanish) {
        nutritionText = `🌿 BENEFICIOS NUTRICIONALES – ${crop.toUpperCase()}\nRico en vitaminas, minerales y antioxidantes. Una dieta saludable comienza en su granja.`;
      } else {
        nutritionText = `🌿 NUTRITIONAL BENEFITS – ${crop.toUpperCase()}\nRich in vitamins, minerals, and antioxidants. A healthy diet starts on your farm.`;
      }
    }
    addToStructuredList({ key: 'nutrition_benefits', params: { content: nutritionText } });
  }

  // ========== REMINDER ==========
  if (shouldIncludeModule('reminder')) {
    const reminderText = isSwahili ? "Chunguza udongo wako kila mwaka ili kuweka biashara yako yenye faida." :
                         isFrench ? "Testez votre sol chaque année pour garder votre entreprise rentable." :
                         isSpanish ? "Analice su suelo anualmente para mantener su empresa rentable." :
                         "Test your soil yearly to keep your enterprise profitable.";
    addToStructuredList({ key: 'reminder', params: { content: reminderText } });
  }

  // ===== BUILD FINAL OUTPUT FOR CROP =====
  const list = structuredList.map(item => item.params?.content || '').filter(c => c);
  const financialAdvice = isSwahili ? "Tazama uchambuzi wa kifedha hapo juu ili kuongeza faida yako." :
                         isFrench ? "Voyez l'analyse financière ci-dessus pour maximiser votre profit." :
                         isSpanish ? "Vea el análisis financiero arriba para maximizar su ganancia." :
                         "See financial analysis above to maximize your profit.";
  const structuredFinancialAdvice = { key: 'financial_advice', params: { content: financialAdvice } };

  return { list, financialAdvice, structuredList, structuredFinancialAdvice };
}
// ===== END OF PART 2 =====