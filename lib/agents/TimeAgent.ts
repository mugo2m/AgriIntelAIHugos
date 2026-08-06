// lib/agents/TimeAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface TimeContext {
  type:
    | "single_year"
    | "year_range"
    | "comparison"
    | "relative"
    | "trend"
    | "unknown";

  year?: number;

  startYear?: number;

  endYear?: number;

  season?: string;

  compareYears?: number[];

  relative?: string;

  isTrend?: boolean;
}

export class TimeAgent extends BaseAgent {

  async execute(question: string): Promise<TimeContext> {

    const q = question.toLowerCase();

    const currentYear = new Date().getFullYear();

    const result: TimeContext = {
      type: "unknown",
      isTrend: false
    };

    //--------------------------------------------------
    // Season Detection
    //--------------------------------------------------

    if (
      q.includes("short rain") ||
      q.includes("shortrain") ||
      q.includes("sr")
    ) {
      result.season = "Short Rain";
    }

    if (
      q.includes("long rain") ||
      q.includes("longrain") ||
      q.includes("lr")
    ) {
      result.season = "Long Rain";
    }

    //--------------------------------------------------
    // Detect explicit years
    //--------------------------------------------------

    const years = q.match(/\b20\d{2}\b/g);

    if (years) {

      const parsed = years.map(Number);

      if (parsed.length === 1) {

        result.type = "single_year";
        result.year = parsed[0];

      } else if (parsed.length >= 2) {

        result.type = "year_range";
        result.startYear = Math.min(...parsed);
        result.endYear = Math.max(...parsed);

      }

    }

    //--------------------------------------------------
    // Comparison
    //--------------------------------------------------

    if (
      q.includes("compare") ||
      q.includes("versus") ||
      q.includes("vs")
    ) {

      if (years && years.length >= 2) {

        result.type = "comparison";
        result.compareYears = years.map(Number);

      }

    }

    //--------------------------------------------------
    // Relative Dates
    //--------------------------------------------------

    if (q.includes("this year")) {

      result.type = "relative";
      result.relative = "this_year";
      result.year = currentYear;

    }

    if (q.includes("last year")) {

      result.type = "relative";
      result.relative = "last_year";
      result.year = currentYear - 1;

    }

    if (q.includes("next year")) {

      result.type = "relative";
      result.relative = "next_year";
      result.year = currentYear + 1;

    }

    //--------------------------------------------------
    // Last X Years
    //--------------------------------------------------

    const lastYears = q.match(/last\s+(\d+)\s+years?/);

    if (lastYears) {

      const n = parseInt(lastYears[1]);

      result.type = "year_range";
      result.startYear = currentYear - n + 1;
      result.endYear = currentYear;

    }

    //--------------------------------------------------
    // Between
    //--------------------------------------------------

    const between = q.match(/between\s+(20\d{2})\s+and\s+(20\d{2})/);

    if (between) {

      result.type = "year_range";
      result.startYear = parseInt(between[1]);
      result.endYear = parseInt(between[2]);

    }

    //--------------------------------------------------
    // Since
    //--------------------------------------------------

    const since = q.match(/since\s+(20\d{2})/);

    if (since) {

      result.type = "year_range";
      result.startYear = parseInt(since[1]);
      result.endYear = currentYear;

    }

    //--------------------------------------------------
    // Before
    //--------------------------------------------------

    const before = q.match(/before\s+(20\d{2})/);

    if (before) {

      result.type = "year_range";
      result.startYear = 1900;
      result.endYear = parseInt(before[1]) - 1;

    }

    //--------------------------------------------------
    // After
    //--------------------------------------------------

    const after = q.match(/after\s+(20\d{2})/);

    if (after) {

      result.type = "year_range";
      result.startYear = parseInt(after[1]) + 1;
      result.endYear = currentYear;

    }

    //--------------------------------------------------
    // Trend Detection
    //--------------------------------------------------

    if (
      q.includes("trend") ||
      q.includes("over time") ||
      q.includes("growth") ||
      q.includes("change over")
    ) {

      result.isTrend = true;

      if (result.type === "unknown") {

        result.type = "trend";

      }

    }

    return result;

  }

}