// lib/agents/DiseaseInterviewAgent.ts
import { BaseInterviewAgent, InterviewQuestion, FarmerContext } from "./BaseInterviewAgent";
import { getDiseasesOptions, getPoultryDiseasesOptions } from "./utils/cropUtils";

export type SpeciesType = "crop" | "poultry";

class DiseaseInterviewAgent extends BaseInterviewAgent {
  private species: SpeciesType = "crop";
  private poultrySpecies: string = "chicken";

  getAgentKey(): string {
    return "DiseaseInterviewAgent";
  }

  setSpecies(species: SpeciesType, poultrySpecies: string = "chicken"): void {
    this.species = species;
    this.poultrySpecies = poultrySpecies;
  }

  getQuestions(context: FarmerContext): InterviewQuestion[] {
    let diseaseOptions: string[] = [];
    if (this.species === "poultry") {
      diseaseOptions = getPoultryDiseasesOptions(this.poultrySpecies);
      if (diseaseOptions.length === 0) diseaseOptions = ["Newcastle Disease", "Infectious Bursal Disease", "Coccidiosis", "Fowl Typhoid", "Other"];
    } else {
      diseaseOptions = getDiseasesOptions(context.crops || "default");
      if (diseaseOptions.length === 0) diseaseOptions = ["Other"];
    }
    return [
      { id: "commonDiseases", type: "multiselect", questionKey: this.species === "poultry" ? "question_poultry_diseases" : "question_common_diseases", options: diseaseOptions, sectionKey: "section_diseases" },
      { id: "plantsDamaged", type: "number", questionKey: this.species === "poultry" ? "question_birds_affected" : "question_plants_damaged", placeholder: this.species === "poultry" ? "e.g., 20 birds" : "e.g., 50 plants", step: "any", sectionKey: "section_pests", dependsOn: { field: "commonDiseases", valueNot: "" } }
    ];
  }
}

export default DiseaseInterviewAgent;