import { InterviewQuestion } from "@/types/interview";

export const GrossMarginInterviewAgent: InterviewQuestion[] = [

  // ===========================================================
  // SEED OR PLANTING MATERIAL COST
  // ===========================================================

  {
    id: "seedCost",
    key: "question_seed_cost",
    type: "number"
  },

  // ===========================================================
  // LAND PREPARATION
  // ===========================================================

  {
    id: "ploughingCost",
    key: "question_ploughing_cost",
    type: "number"
  },

  // ===========================================================
  // PLANTING LABOUR
  // ===========================================================

  {
    id: "plantingLabourCost",
    key: "question_planting_labour_cost",
    type: "number"
  },

  // ===========================================================
  // WEEDING
  // ===========================================================

  {
    id: "weedingCost",
    key: "question_weeding_cost",
    type: "number"
  },

  // ===========================================================
  // HARVESTING
  // ===========================================================

  {
    id: "harvestingCost",
    key: "question_harvesting_cost",
    type: "number"
  },

  // ===========================================================
  // TRANSPORT
  // ===========================================================

  {
    id: "transportCostTotal",
    key: "question_transport_cost_total",
    type: "number"
  },

  // ===========================================================
  // PACKAGING
  // ===========================================================

  {
    id: "packagingCostTotal",
    key: "question_packaging_cost_total",
    type: "number"
  },

  // ===========================================================
  // OTHER COSTS
  // ===========================================================

  {
    id: "miscellaneousCostTotal",
    key: "question_miscellaneous_cost_total",
    type: "number",
    optional: true
  }

];