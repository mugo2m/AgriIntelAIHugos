// lib/agents/AnalysisAgent.ts

import { BaseAgent, AgentContext } from "./BaseAgent";

export interface AnalysisResult {
  summary: string;
  insights: string[];
  comparisons: string[];
  trends: string[];
  recommendations: string[];
  charts?: any[];
}

export class AnalysisAgent extends BaseAgent {

  constructor(context: AgentContext) {
    super(context);
  }

  async execute(data: any): Promise<AnalysisResult> {

    const rows = data.rows || [];

    if (rows.length === 0) {
      return {
        summary: "No matching records were found.",
        insights: [],
        comparisons: [],
        trends: [],
        recommendations: []
      };
    }

    const summary = this.generateSummary(rows);

    const insights = this.generateInsights(rows);

    const comparisons = this.generateComparisons(rows);

    const trends = this.generateTrends(rows);

    const recommendations = this.generateRecommendations(rows);

    return {
      summary,
      insights,
      comparisons,
      trends,
      recommendations
    };
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  private generateSummary(rows: any[]): string {

    const totalProduction = rows.reduce(
      (sum, row) => sum + Number(row.production_kg || 0),
      0
    );

    const totalAcres = rows.reduce(
      (sum, row) => sum + Number(row.acres || 0),
      0
    );

    return `Found ${rows.length} matching records covering ${totalAcres.toLocaleString()} acres with total production of ${totalProduction.toLocaleString()} kg.`;
  }

  // ----------------------------------------------------
  // INSIGHTS
  // ----------------------------------------------------

  private generateInsights(rows: any[]): string[] {

    const insights: string[] = [];

    const totalProduction = rows.reduce(
      (sum, row) => sum + Number(row.production_kg || 0),
      0
    );

    rows.forEach(row => {

      const production = Number(row.production_kg || 0);

      const contribution =
        totalProduction > 0
          ? ((production / totalProduction) * 100).toFixed(1)
          : "0";

      insights.push(
        `${row.subcounty} contributed ${contribution}% of total production.`
      );

    });

    return insights;
  }

  // ----------------------------------------------------
  // COMPARISONS
  // ----------------------------------------------------

  private generateComparisons(rows: any[]): string[] {

    const comparisons: string[] = [];

    if (rows.length < 2) return comparisons;

    const sorted = [...rows].sort(
      (a, b) => b.production_kg - a.production_kg
    );

    comparisons.push(
      `${sorted[0].subcounty} recorded the highest production (${sorted[0].production_kg.toLocaleString()} kg).`
    );

    comparisons.push(
      `${sorted[sorted.length - 1].subcounty} recorded the lowest production (${sorted[sorted.length - 1].production_kg.toLocaleString()} kg).`
    );

    return comparisons;
  }

  // ----------------------------------------------------
  // TRENDS
  // ----------------------------------------------------

  private generateTrends(rows: any[]): string[] {

    const trends: string[] = [];

    rows.forEach(row => {

      if (
        row.previous_year_production &&
        row.production_kg
      ) {

        const diff =
          Number(row.production_kg) -
          Number(row.previous_year_production);

        const percent =
          (
            diff /
            Number(row.previous_year_production)
          ) * 100;

        if (percent > 0) {

          trends.push(
            `${row.subcounty} increased production by ${percent.toFixed(
              1
            )}% compared to last year.`
          );

        } else {

          trends.push(
            `${row.subcounty} declined by ${Math.abs(
              percent
            ).toFixed(1)}% compared to last year.`
          );

        }

      }

    });

    return trends;
  }

  // ----------------------------------------------------
  // RECOMMENDATIONS
  // ----------------------------------------------------

  private generateRecommendations(rows: any[]): string[] {

    const recommendations: string[] = [];

    rows.forEach(row => {

      const yieldPerAcre =
        Number(row.production_kg || 0) /
        Number(row.acres || 1);

      if (yieldPerAcre < 1800) {

        recommendations.push(
          `${row.subcounty}: Improve productivity using certified seed and recommended fertilizer application.`
        );

      }

      if (yieldPerAcre >= 1800 && yieldPerAcre < 3000) {

        recommendations.push(
          `${row.subcounty}: Moderate performance. Consider precision farming and irrigation where possible.`
        );

      }

      if (yieldPerAcre >= 3000) {

        recommendations.push(
          `${row.subcounty}: Excellent performance. Maintain current management practices and document best practices for replication.`
        );

      }

    });

    return recommendations;
  }

}