// lib/agents/DairyBusinessPlanAgent.ts

import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class DairyBusinessPlanAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "DairyBusinessPlanAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    // Only show if dairy is selected
    if (!context.isDairy && context.species !== 'dairy') {
      return [];
    }

    return [
      // Q1 – Business Name
      {
        id: "businessName",
        type: "text",
        questionKey: "question_business_name",
        placeholder: "e.g., Mugo Dairy Farm",
        sectionKey: "section_business",
      },
      // Q2 – Vision
      {
        id: "businessVision",
        type: "text",
        questionKey: "question_business_vision",
        placeholder: "e.g., To produce the highest quality milk in the county",
        sectionKey: "section_business",
      },
      // Q3 – Mission
      {
        id: "businessMission",
        type: "text",
        questionKey: "question_business_mission",
        placeholder: "e.g., To provide fresh, safe milk to our community through ethical farming",
        sectionKey: "section_business",
      },
      // Q4 – Short-term goals
      {
        id: "shortTermGoals",
        type: "text",
        questionKey: "question_short_term_goals",
        placeholder: "e.g., Increase milk yield to 20 L/cow/day, secure cooperative membership",
        sectionKey: "section_business",
      },
      // Q5 – Mid-term goals
      {
        id: "midTermGoals",
        type: "text",
        questionKey: "question_mid_term_goals",
        placeholder: "e.g., Expand herd to 10 cows, start selling yoghurt",
        sectionKey: "section_business",
      },
      // Q6 – Long-term goals
      {
        id: "longTermGoals",
        type: "text",
        questionKey: "question_long_term_goals",
        placeholder: "e.g., Build a processing plant, export to regional markets",
        sectionKey: "section_business",
      },
      // Q7 – Target customers (multi-select)
      {
        id: "targetCustomers",
        type: "multiselect",
        questionKey: "question_target_customers",
        options: ["Wholesalers", "Retailers", "Direct consumers", "Exporters", "Processors", "Cooperatives", "Institutions"],
        sectionKey: "section_business",
      },
      // Q8 – Communication channels (multi-select)
      {
        id: "communicationChannels",
        type: "multiselect",
        questionKey: "question_communication_channels",
        options: ["Phone calls", "SMS / WhatsApp", "Radio", "Social media", "Farmer groups", "Direct visits", "Email", "Market days"],
        sectionKey: "section_business",
      },
      // Q9 – Fallback plan (multi-select)
      {
        id: "fallbackPlan",
        type: "multiselect",
        questionKey: "question_fallback_plan",
        options: [
          "Process into value‑added products",
          "Find alternative buyers",
          "Store and wait for better prices",
          "Reduce price",
          "Sell to cooperatives",
          "Donate / compost",
        ],
        sectionKey: "section_business",
      },
      // Q10 – Competitive advantage (multi-select)
      {
        id: "competitiveAdvantage",
        type: "multiselect",
        questionKey: "question_competitive_advantage",
        options: [
          "Organic certification",
          "Higher quality",
          "Lower price",
          "Reliable year‑round supply",
          "Pure breed",
          "Direct farm‑to‑consumer delivery",
          "Established buyer relationships",
        ],
        sectionKey: "section_business",
      },
      // Q11 – Payment modes (multi-select)
      {
        id: "paymentModes",
        type: "multiselect",
        questionKey: "question_payment_modes",
        options: ["Cash", "MPESA / Mobile money", "Bank transfer", "Credit (30 days)", "Bar trade", "Partial upfront + balance on delivery"],
        sectionKey: "section_business",
      },
      // Q12 – Positions (multi-select)
      {
        id: "businessPositions",
        type: "multiselect",
        questionKey: "question_business_positions",
        options: ["Farm Manager", "Accountant", "Sales/Marketing", "Field Supervisor", "Logistics", "Admin", "Quality Control", "Owner/Operator", "Vet Technician"],
        sectionKey: "section_business",
      },
      // Q13 – Position heads (free text)
      {
        id: "positionHeads",
        type: "text",
        questionKey: "question_position_heads",
        placeholder: "e.g., Farm Manager: Jane, Vet: David",
        sectionKey: "section_business",
      },
      // Q14 – Dairy Products (custom table – rendered in CreateInterviewAgent)
      {
        id: "dairyProducts",
        type: "custom",
        questionKey: "question_dairy_products",
        renderCustom: true,
        sectionKey: "section_business",
      },
      // Q15 – Dairy Production Inputs (multi-select – triggers profit calc)
      {
        id: "dairyProductionInputs",
        type: "multiselect",
        questionKey: "question_dairy_production_inputs",
        options: [
          "dairy_input_forage",
          "dairy_input_hay",
          "dairy_input_silage",
          "dairy_input_concentrate",
          "dairy_input_minerals",
          "dairy_input_water",
          "dairy_input_veterinary",
          "dairy_input_medicines",
          "dairy_input_ai",
          "dairy_input_bedding",
          "dairy_input_labour",
          "dairy_input_transport",
          "dairy_input_milking_equipment",
          "dairy_input_electricity",
        ],
        sectionKey: "section_business",
      },
    ];
  }
}