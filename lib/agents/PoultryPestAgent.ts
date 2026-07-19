// lib/agents/PoultryPestAgent.ts
import { BaseInterviewAgent, InterviewQuestion } from "./BaseInterviewAgent";

export class PoultryPestAgent extends BaseInterviewAgent {
  constructor() {
    super();
    this.questions = [
      {
        id: "pestSignsObserved",
        type: "multiselect",
        label: "What signs are you seeing that might indicate pests?",
        options: [
          { value: "visible_mites", label: "Visible mites on perches" },
          { value: "visible_lice", label: "Visible lice on birds" },
          { value: "anaemia", label: "Anaemia / pale comb" },
          { value: "feather_loss", label: "Feather loss" },
          { value: "egg_drop_pest", label: "Egg drop" },
          { value: "irritated_birds", label: "Irritated birds, scratching" },
          { value: "scaly_legs", label: "Scaly, crusty legs" },
          { value: "weight_loss", label: "Weight loss" },
          { value: "diarrhoea_pest", label: "Diarrhoea (possibly worms)" },
          { value: "visible_worms", label: "Visible worms in droppings" },
          { value: "gasping", label: "Gasping / gaping (gapeworm)" },
          { value: "eye_irritation", label: "Eye irritation / watery eyes" },
        ],
        required: true,
      },
    ];
  }

  async generateRecommendation(): Promise<any> {
    return {
      agentType: "PoultryPest",
      collectedData: this.answers,
      message: "Pest signs collected.",
    };
  }
}