// lib/agents/PoultryBusinessPlanAgent.ts

import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class PoultryBusinessPlanAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "PoultryBusinessPlanAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    // Only show if poultry is selected
    if (!context.isPoultry && context.species !== 'poultry') {
      return [];
    }

    return [
      // Q1 – Business Name
      {
        id: "businessName",
        type: "text",
        questionKey: "question_business_name",
        placeholder: "e.g., Green Valley Poultry Farm",
        sectionKey: "section_business",
      },
      // Q2 – Vision
      {
        id: "businessVision",
        type: "text",
        questionKey: "question_business_vision",
        placeholder: "e.g., To become the leading supplier of quality eggs in the region",
        sectionKey: "section_business",
      },
      // Q3 – Mission
      {
        id: "businessMission",
        type: "text",
        questionKey: "question_business_mission",
        placeholder: "e.g., To produce healthy, affordable eggs using sustainable practices",
        sectionKey: "section_business",
      },
      // Q4 – Short-term goals
      {
        id: "shortTermGoals",
        type: "text",
        questionKey: "question_short_term_goals",
        placeholder: "e.g., Increase flock to 500 layers, secure first contract",
        sectionKey: "section_business",
      },
      // Q5 – Mid-term goals
      {
        id: "midTermGoals",
        type: "text",
        questionKey: "question_mid_term_goals",
        placeholder: "e.g., Reach 1,000 layers, start selling day-old chicks",
        sectionKey: "section_business",
      },
      // Q6 – Long-term goals
      {
        id: "longTermGoals",
        type: "text",
        questionKey: "question_long_term_goals",
        placeholder: "e.g., Expand to 5,000 layers, build own feed mill",
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
          "Unique / rare breeds",
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
        options: ["Farm Manager", "Accountant", "Sales/Marketing", "Field Supervisor", "Logistics", "Admin", "Quality Control", "Owner/Operator"],
        sectionKey: "section_business",
      },
      // Q13 – Position heads (free text)
      {
        id: "positionHeads",
        type: "text",
        questionKey: "question_position_heads",
        placeholder: "e.g., Farm Manager: John, Sales: Mary",
        sectionKey: "section_business",
      },
      // Q14 – Poultry Products (custom table – rendered in CreateInterviewAgent)
      {
        id: "poultryProducts",
        type: "custom",
        questionKey: "question_poultry_products",
        renderCustom: true,
        sectionKey: "section_business",
      },
      // Q15 – Poultry Production Inputs (multi-select – triggers profit calc)
      {
        id: "poultryProductionInputs",
        type: "multiselect",
        questionKey: "question_poultry_production_inputs",
        options: [
          "poultry_input_day_old_chicks",
          "poultry_input_starter_feed",
          "poultry_input_grower_feed",
          "poultry_input_layer_feed",
          "poultry_input_finisher_feed",
          "poultry_input_vaccines",
          "poultry_input_medications",
          "poultry_input_bedding",
          "poultry_input_water",
          "poultry_input_electricity",
          "poultry_input_labour",
          "poultry_input_transport",
        ],
        sectionKey: "section_business",
      },
    ];
  }
}