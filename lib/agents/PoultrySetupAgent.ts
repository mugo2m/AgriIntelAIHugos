// lib/agents/PoultrySetupAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const POULTRY_BREED_GROUPS = [
  { label: "🐔 LAYERS (Egg Production)", breeds: ["KARI Improved Kienyeji", "Kuroiler", "Rainbow Rooster", "Brown Leghorn", "Hy-Line Brown", "Isa Brown", "Lohmann Brown", "Bovans Brown", "Dekalb White", "Babcock White"] },
  { label: "🐔 BROILERS (Meat Production)", breeds: ["Cobb 500", "Ross 308", "Arbor Acres", "Hubbard", "Indian River"] },
  { label: "🐔 MEAT & EGGS (Both)", breeds: ["Sussex", "Kenbrew (Kenbro)", "Sasso", "Kenya Broiler", "KARI Kienyeji"] },
  { label: "🐔 INDIGENOUS / LOCAL", breeds: ["Local Kienyeji", "Local Turkana", "Local Bantam"] },
  { label: "🦃 TURKEYS", breeds: ["Broad Breasted White", "Broad Breasted Bronze", "Narragansett", "Royal Palm", "Local Turkey"] },
  { label: "🦆 DUCKS", breeds: ["Khaki Campbell", "Pekin", "Rouen", "Muscovy", "Indian Runner", "Local Duck"] },
  { label: "🦢 GEESE", breeds: ["African Grey", "Toulouse", "Embden", "Chinese", "Local Goose"] },
  { label: "🐦 QUAIL", breeds: ["Japanese Quail", "Coturnix Quail", "Bobwhite Quail"] },
  { label: "➕ OTHER", breeds: ["Other"] }
];

const POULTRY_SYSTEMS = ["deep_litter", "battery_cage", "free_range", "pastured"];

class PoultrySetupAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "PoultrySetupAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    const allBreeds = POULTRY_BREED_GROUPS.flatMap(g => g.breeds);
    return [
      // Location & Personal
      { id: "country", type: "dropdown", questionKey: "question_country", options: ["Kenya", "Uganda", "Tanzania", "Rwanda", "Burundi", "South Africa", "Other"], sectionKey: "section_location" },
      { id: "farmerName", type: "text", questionKey: "question_farmer_name", placeholder: "e.g., John Mugo", sectionKey: "section_personal" },
      { id: "county", type: "text", questionKey: "question_county", placeholder: "e.g., Bungoma", sectionKey: "section_location" },
      // Poultry-specific
      { id: "poultry_breed", type: "dropdown", questionKey: "question_poultry_breed", options: allBreeds, sectionKey: "section_poultry" },
      { id: "poultry_system", type: "dropdown", questionKey: "question_poultry_system", options: POULTRY_SYSTEMS, sectionKey: "section_poultry" },
      { id: "poultry_flock_size", type: "number", questionKey: "question_poultry_flock_size", placeholder: "e.g., 500", step: "any", sectionKey: "section_poultry" },
      { id: "poultry_age_weeks", type: "number", questionKey: "question_poultry_age_weeks", placeholder: "e.g., 6", step: "any", sectionKey: "section_poultry" },
      { id: "poultry_farming_goal", type: "dropdown", questionKey: "question_poultry_farming_goal", options: ["Egg production", "Meat production", "Both"], sectionKey: "section_poultry" },
      // Climate
      { id: "poultry_location_region", type: "dropdown", questionKey: "question_poultry_location_region", options: ["Hot", "Cold", "Moderate"], sectionKey: "section_location" },
      { id: "poultry_rainfall_pattern", type: "dropdown", questionKey: "question_poultry_rainfall_pattern", options: ["Dry", "Semi-arid", "Wet"], sectionKey: "section_location" },
      { id: "poultry_altitude", type: "dropdown", questionKey: "question_poultry_altitude", options: ["Highland", "Lowland", "Coastal"], sectionKey: "section_location" },
      // Feed & Nutrition
      { id: "poultry_feed_type", type: "dropdown", questionKey: "question_poultry_feed_type", options: ["Mash", "Pellets", "Crumbles", "Whole grain"], sectionKey: "section_feed" },
      { id: "poultry_feed_cost_kg", type: "number", questionKey: "question_poultry_feed_cost_kg", placeholder: "e.g., 65", step: "any", sectionKey: "section_feed" },
      // Health
      { id: "poultry_vaccination_done", type: "dropdown", questionKey: "question_poultry_vaccination_done", options: ["Yes", "No"], sectionKey: "section_health" },
      { id: "poultry_mortality_count", type: "number", questionKey: "question_poultry_mortality_count", placeholder: "e.g., 5", step: "any", sectionKey: "section_health" },
      // Financial
      { id: "poultry_chick_cost", type: "number", questionKey: "question_poultry_chick_cost", placeholder: "e.g., 120", step: "any", sectionKey: "section_finance" },
      { id: "poultry_egg_price", type: "number", questionKey: "question_poultry_egg_price", placeholder: "e.g., 280", step: "any", sectionKey: "section_finance" },
      { id: "poultry_meat_price", type: "number", questionKey: "question_poultry_meat_price", placeholder: "e.g., 350", step: "any", sectionKey: "section_finance" },
      // Housing
      { id: "poultry_house_size_m2", type: "number", questionKey: "question_poultry_house_size_m2", placeholder: "e.g., 40", step: "any", sectionKey: "section_housing" },
    ];
  }
}

export default PoultrySetupAgent;