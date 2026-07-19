"use client";

import { EnterpriseSetupAgent } from "@/agents/EnterpriseSetupAgent";
import { FertilizerInterviewAgent } from "@/agents/FertilizerInterviewAgent";
import { DiseaseInterviewAgent } from "@/agents/DiseaseInterviewAgent";
import { PestInterviewAgent } from "@/agents/PestInterviewAgent";
import { NutrientInterviewAgent } from "@/agents/NutrientInterviewAgent";
import { StorageInterviewAgent } from "@/agents/StorageInterviewAgent";
import { GrossMarginInterviewAgent } from "@/agents/GrossMarginInterviewAgent";
import { ConservationInterviewAgent } from "@/agents/ConservationInterviewAgent";
import { GAPInterviewAgent } from "@/agents/GAPInterviewAgent";

export type RecommendationType =
  | "fertilizer"
  | "disease"
  | "pest"
  | "nutrient"
  | "storage"
  | "gross_margin"
  | "conservation"
  | "gap";

interface FarmSession {

  id: string;

  crop: string;

  enterpriseCompleted?: boolean;

}

export function getInterviewQuestions(

  recommendation: RecommendationType,

  session: FarmSession

) {

  const questions = [];

  /*
   * If this crop session has never gone through
   * Enterprise Setup,
   * ask it ONCE.
   */

  if (!session.enterpriseCompleted) {

    questions.push(...EnterpriseSetupAgent);

  }

  /*
   * Load ONLY the interview
   * needed for the selected recommendation.
   */

  switch (recommendation) {

    case "fertilizer":

      questions.push(...FertilizerInterviewAgent);

      break;

    case "disease":

      questions.push(...DiseaseInterviewAgent);

      break;

    case "pest":

      questions.push(...PestInterviewAgent);

      break;

    case "nutrient":

      questions.push(...NutrientInterviewAgent);

      break;

    case "storage":

      questions.push(...StorageInterviewAgent);

      break;

    case "gross_margin":

      questions.push(...GrossMarginInterviewAgent);

      break;

    case "conservation":

      questions.push(...ConservationInterviewAgent);

      break;

    case "gap":

      questions.push(...GAPInterviewAgent);

      break;

  }

  return questions;

}