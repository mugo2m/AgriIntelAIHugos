// lib/agents/ReportAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface ReportResult {
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  charts?: any[];
  tables?: any[];
  rawData?: any[];
}

export class ReportAgent extends BaseAgent {

  async execute(input: {
    question: string;
    analysis: any;
    visualization?: any;
    data: any[];
  }): Promise<ReportResult> {

    const {
      question,
      analysis,
      visualization,
      data
    } = input;

    const report: ReportResult = {
      title: "AgriIntel AI Analytics Report",

      summary: analysis.summary,

      insights: analysis.insights || [],

      recommendations:
        analysis.recommendations || [],

      charts:
        visualization?.charts || [],

      tables:
        visualization?.tables || [],

      rawData: data
    };

    return report;
  }
}