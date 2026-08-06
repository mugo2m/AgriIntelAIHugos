// lib/agents/BusinessPlanAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";

export class BusinessPlanAgent extends BaseInterviewAgent {
  getAgentKey(): string {
    return "BusinessPlanAgent";
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    // ── REMOVED the early return ──
    // if (!context.crops) return [];

    return [
      // Q1 – Business Name
      {
        id: "businessName",
        type: "text",
        questionKey: "question_business_name",
        placeholder: "e.g., Mwangi's Organic Farm",
        sectionKey: "section_business",
      },
      // Q2 – Vision
      {
        id: "businessVision",
        type: "text",
        questionKey: "question_business_vision",
        placeholder: "e.g., To become the leading organic supplier",
        sectionKey: "section_business",
      },
      // Q3 – Mission
      {
        id: "businessMission",
        type: "text",
        questionKey: "question_business_mission",
        placeholder: "e.g., To produce high‑quality sustainably",
        sectionKey: "section_business",
      },
      // Q4 – Short‑term goals
      {
        id: "shortTermGoals",
        type: "text",
        questionKey: "question_short_term_goals",
        placeholder: "e.g., Plant 2 acres, secure first buyer",
        sectionKey: "section_business",
      },
      // Q5 – Mid‑term goals
      {
        id: "midTermGoals",
        type: "text",
        questionKey: "question_mid_term_goals",
        placeholder: "e.g., Harvest 25 tons, build storage",
        sectionKey: "section_business",
      },
      // Q6 – Long‑term goals
      {
        id: "longTermGoals",
        type: "text",
        questionKey: "question_long_term_goals",
        placeholder: "e.g., Expand to 10 acres, start processing",
        sectionKey: "section_business",
      },
      // Q7 – Target customers
      {
        id: "targetCustomers",
        type: "multiselect",
        questionKey: "question_target_customers",
        options: ["Wholesalers", "Retailers", "Direct consumers", "Exporters", "Processors", "Cooperatives", "Institutions"],
        sectionKey: "section_business",
      },
      // Q8 – Communication channels
      {
        id: "communicationChannels",
        type: "multiselect",
        questionKey: "question_communication_channels",
        options: ["Phone calls", "SMS / WhatsApp", "Radio", "Social media", "Farmer groups", "Direct visits", "Email", "Market days"],
        sectionKey: "section_business",
      },
      // Q9 – Fallback plan
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
      // Q10 – Competitive advantage
      {
        id: "competitiveAdvantage",
        type: "multiselect",
        questionKey: "question_competitive_advantage",
        options: [
          "Organic certification",
          "Higher quality",
          "Lower price",
          "Reliable year‑round supply",
          "Unique / rare varieties",
          "Direct farm‑to‑consumer delivery",
          "Established buyer relationships",
        ],
        sectionKey: "section_business",
      },
      // Q11 – Payment modes
      {
        id: "paymentModes",
        type: "multiselect",
        questionKey: "question_payment_modes",
        options: ["Cash", "MPESA / Mobile money", "Bank transfer", "Credit (30 days)", "Bar trade", "Partial upfront + balance on delivery"],
        sectionKey: "section_business",
      },
      // Q12 – Positions
      {
        id: "businessPositions",
        type: "multiselect",
        questionKey: "question_business_positions",
        options: ["Farm Manager", "Accountant", "Sales/Marketing", "Field Supervisor", "Logistics", "Admin", "Quality Control", "Owner/Operator"],
        sectionKey: "section_business",
      },
      // Q13 – Position heads
      {
        id: "positionHeads",
        type: "text",
        questionKey: "question_position_heads",
        placeholder: "e.g., Farm Manager: John, Sales: Mary",
        sectionKey: "section_business",
      },
      // Q14 – Products (custom table)
      {
        id: "products",
        type: "custom",
        questionKey: "question_products",
        renderCustom: true,
        sectionKey: "section_business",
      },
      // Q15 – Production inputs
      {
        id: "productionInputs",
        type: "multiselect",
        questionKey: "question_production_inputs",
        options: [
          "Seeds / suckers / cuttings",
          "Planting fertiliser",
          "Topdressing fertiliser",
          "Potassium fertiliser",
          "Lime (Calcitic / Dolomitic)",
          "Organic manure",
          "Pesticides",
          "Fungicides",
          "Herbicides",
          "Hired labour",
          "Irrigation",
          "Machinery hire",
        ],
        sectionKey: "section_business",
      },
    ];
  }
}