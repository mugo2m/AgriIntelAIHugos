// lib/agents/HomePoultryFeedAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

// Generate batch size options: 5 to 500 kg in steps of 5
const batchSizeOptions = Array.from({ length: 100 }, (_, i) => `${(i + 1) * 5} kg`);

// All 24 ingredients grouped by category
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

export class PoultryFeedFormulationAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "PoultryFeedFormulationAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      // Q1: Country (reuse existing key)
      {
        id: "country",
        questionKey: "question_country",
        type: "dropdown",
        options: context.countryOptions || [], // Will be populated from CreateInterviewAgent
        sectionKey: "section_location",
      },
      // Q2: Breed
      {
        id: "poultryBreed",
        questionKey: "question_poultry_breed",
        type: "dropdown",
        options: ["Local", "Layers", "Sasso", "Kenbrew", "Kroiler", "Broiler", "Sussex"],
        sectionKey: "section_poultry",
      },
      // Q3: Stage
      {
        id: "poultryStage",
        questionKey: "question_poultry_stage",
        type: "dropdown",
        options: ["Starter", "Grower", "Layer", "Finisher"],
        sectionKey: "section_poultry",
      },
      // Q4: Batch Size
      {
        id: "batchSize",
        questionKey: "question_poultry_batch_size",
        type: "dropdown",
        options: batchSizeOptions,
        sectionKey: "section_poultry",
      },
      // Q5: Coccidiostat (skip for Layers)
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
      // Q6: Available Ingredients (multiselect)
      {
        id: "availableIngredients",
        questionKey: "question_poultry_available_ingredients",
        type: "multiselect",
        options: allIngredients,
        sectionKey: "section_poultry",
      },
      // Q7: Bulk Price Form (custom renderer)
      {
        id: "ingredientPrices",
        questionKey: "question_poultry_ingredient_prices",
        type: "custom",
        renderCustom: true,
        sectionKey: "section_poultry",
        dependsOn: {
          field: "availableIngredients",
          valueNot: "", // Only show if at least one ingredient selected
        },
      },
      // Q8: Age (optional)
      {
        id: "ageWeeks",
        questionKey: "question_poultry_age_weeks",
        type: "number",
        placeholder: "e.g., 6 (leave blank for default)",
        step: "any",
        sectionKey: "section_poultry",
      },
    ];
  }
}