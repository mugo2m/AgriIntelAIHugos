// lib/agents/DairyHousingAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

const HOUSING_TYPES = ["zero_grazing", "free_stall", "tie_stall", "pasture_shelter"];
const VENTILATION_RATINGS = ["good", "average", "poor"];
const BEDDING_TYPES = ["straw", "sand", "sawdust", "none"];

export class DairyHousingAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyHousingAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    return [
      {
        id: "dairyHousingType",
        type: "dropdown",
        questionKey: "question_dairy_housing_type",
        options: HOUSING_TYPES,
        sectionKey: "section_dairy_housing",
      },
      {
        id: "numberOfCowsHoused",
        type: "number",
        questionKey: "question_dairy_number_of_cows_housed",
        placeholder: "e.g., 10",
        step: "any",
        sectionKey: "section_dairy_housing",
      },
      {
        id: "floorSpacePerCowM2",
        type: "number",
        questionKey: "question_dairy_floor_space_per_cow_m2",
        placeholder: "e.g., 4",
        step: "any",
        sectionKey: "section_dairy_housing",
      },
      {
        id: "dairyVentilationRating",
        type: "dropdown",
        questionKey: "question_dairy_ventilation_rating",
        options: VENTILATION_RATINGS,
        sectionKey: "section_dairy_housing",
      },
      {
        id: "beddingType",
        type: "dropdown",
        questionKey: "question_dairy_bedding_type",
        options: BEDDING_TYPES,
        sectionKey: "section_dairy_housing",
      },
    ];
  }
}