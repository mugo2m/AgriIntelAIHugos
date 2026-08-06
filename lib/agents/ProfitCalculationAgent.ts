import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class ProfitCalculationAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "ProfitCalculationAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    if (!context.crops) return [];

    return [
      // Revenue
      {
        id: "actualYieldKg",
        type: "number",
        questionKey: "question_actual_yield_kg",
        placeholder: "e.g., 2000",
        step: "any",
        sectionKey: "section_production",
      },
      {
        id: "pricePerKg",
        type: "number",
        questionKey: "question_price_per_kg",
        placeholder: "e.g., 40",
        step: "any",
        sectionKey: "section_production",
      },

      // Planting material / Seed
      {
        id: "seedCost",
        type: "number",
        questionKey: "question_seed_cost",
        placeholder: "e.g., 180",
        step: "any",
        sectionKey: "section_finance",
      },

      // Planting fertiliser
      {
        id: "plantingFertilizerCost",
        type: "number",
        questionKey: "question_planting_fertilizer_cost",
        placeholder: "e.g., 3500",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },
      {
        id: "plantingFertilizerQuantity",
        type: "number",
        questionKey: "question_planting_fertilizer_quantity",
        placeholder: "e.g., 50",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },

      // Topdressing fertiliser
      {
        id: "topdressingFertilizerCost",
        type: "number",
        questionKey: "question_topdressing_fertilizer_cost",
        placeholder: "e.g., 2800",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },
      {
        id: "topdressingFertilizerQuantity",
        type: "number",
        questionKey: "question_topdressing_fertilizer_quantity",
        placeholder: "e.g., 50",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },

      // Potassium fertiliser
      {
        id: "potassiumFertilizerCost",
        type: "number",
        questionKey: "question_potassium_fertilizer_cost",
        placeholder: "e.g., 2200",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },
      {
        id: "potassiumFertilizerQuantity",
        type: "number",
        questionKey: "question_potassium_fertilizer_quantity",
        placeholder: "e.g., 25",
        step: "any",
        sectionKey: "section_fertilizer_selection",
      },

      // Lime
      {
        id: "recCalciticLime",
        type: "number",
        questionKey: "question_rec_calcitic_lime",
        placeholder: "e.g., 120",
        step: "any",
        sectionKey: "section_soil_test_recommendations",
      },
      {
        id: "calciticLimePricePerBag",
        type: "number",
        questionKey: "question_lime_price",
        placeholder: "e.g., 300",
        step: "any",
        sectionKey: "section_finance",
      },

      // Labour
      {
        id: "ploughingCost",
        type: "number",
        questionKey: "question_ploughing_cost",
        placeholder: "e.g., 10000",
        step: "any",
        sectionKey: "section_finance",
      },
      {
        id: "plantingLabourCost",
        type: "number",
        questionKey: "question_planting_labour_cost",
        placeholder: "e.g., 8000",
        step: "any",
        sectionKey: "section_finance",
      },
      {
        id: "weedingCost",
        type: "number",
        questionKey: "question_weeding_cost",
        placeholder: "e.g., 12000",
        step: "any",
        sectionKey: "section_finance",
      },
      {
        id: "harvestingCost",
        type: "number",
        questionKey: "question_harvesting_cost",
        placeholder: "e.g., 15000",
        step: "any",
        sectionKey: "section_finance",
      },

      // Logistics & Other
      {
        id: "transportCostTotal",
        type: "number",
        questionKey: "question_transport_cost_total",
        placeholder: "e.g., 20000",
        step: "any",
        sectionKey: "section_finance",
      },
      {
        id: "packagingCostTotal",
        type: "number",
        questionKey: "question_packaging_cost_total",
        placeholder: "e.g., 10000",
        step: "any",
        sectionKey: "section_finance",
      },
      {
        id: "miscellaneousCostTotal",
        type: "number",
        questionKey: "question_miscellaneous_cost_total",
        placeholder: "e.g., 25000",
        step: "any",
        sectionKey: "section_finance",
      },
    ];
  }
}