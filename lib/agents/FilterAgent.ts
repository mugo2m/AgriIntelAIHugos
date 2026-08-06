// lib/agents/FilterAgent.ts

import { BaseAgent } from "./BaseAgent";

export interface SQLFilter {

  column: string;

  operator:
    | "="
    | ">"
    | "<"
    | ">="
    | "<="
    | "LIKE"
    | "IN"
    | "BETWEEN";

  value: any;

}

export interface FilterContext {

  filters: SQLFilter[];

}

export class FilterAgent extends BaseAgent {

  constructor() {

    super("Filter Agent");

  }

  async execute(context: any): Promise<FilterContext> {

    this.log("Building SQL filters...");

    const filters: SQLFilter[] = [];

    //--------------------------------------------------
    // Crop
    //--------------------------------------------------

    if (context.entities?.crop) {

      filters.push({

        column: "crop_name",

        operator: "=",

        value: context.entities.crop

      });

    }

    //--------------------------------------------------
    // County
    //--------------------------------------------------

    if (context.location?.county) {

      filters.push({

        column: "county_name",

        operator: "=",

        value: context.location.county

      });

    }

    //--------------------------------------------------
    // Subcounties
    //--------------------------------------------------

    if (

      context.location?.subcounties &&

      context.location.subcounties.length > 0

    ) {

      filters.push({

        column: "subcounty_name",

        operator: "IN",

        value: context.location.subcounties

      });

    }

    //--------------------------------------------------
    // Ward
    //--------------------------------------------------

    if (

      context.location?.wards &&

      context.location.wards.length > 0

    ) {

      filters.push({

        column: "ward_name",

        operator: "IN",

        value: context.location.wards

      });

    }

    //--------------------------------------------------
    // Season
    //--------------------------------------------------

    if (context.time?.season) {

      filters.push({

        column: "season",

        operator: "=",

        value: context.time.season

      });

    }

    //--------------------------------------------------
    // Single Year
    //--------------------------------------------------

    if (context.time?.year) {

      filters.push({

        column: "year",

        operator: "=",

        value: context.time.year

      });

    }

    //--------------------------------------------------
    // Year Range
    //--------------------------------------------------

    if (

      context.time?.startYear &&

      context.time?.endYear

    ) {

      filters.push({

        column: "year",

        operator: "BETWEEN",

        value: [

          context.time.startYear,

          context.time.endYear

        ]

      });

    }

    //--------------------------------------------------
    // Farmer
    //--------------------------------------------------

    if (context.entities?.farmer) {

      filters.push({

        column: "farmer_name",

        operator: "LIKE",

        value: `%${context.entities.farmer}%`

      });

    }

    //--------------------------------------------------
    // Organization
    //--------------------------------------------------

    if (context.entities?.organization) {

      filters.push({

        column: "organization_name",

        operator: "LIKE",

        value: `%${context.entities.organization}%`

      });

    }

    //--------------------------------------------------
    // Agrovet
    //--------------------------------------------------

    if (context.entities?.agrovet) {

      filters.push({

        column: "agrovet_name",

        operator: "LIKE",

        value: `%${context.entities.agrovet}%`

      });

    }

    //--------------------------------------------------
    // SACCO
    //--------------------------------------------------

    if (context.entities?.sacco) {

      filters.push({

        column: "sacco_name",

        operator: "LIKE",

        value: `%${context.entities.sacco}%`

      });

    }

    //--------------------------------------------------
    // Extension Officer
    //--------------------------------------------------

    if (context.entities?.extensionOfficer) {

      filters.push({

        column: "extension_officer",

        operator: "LIKE",

        value: `%${context.entities.extensionOfficer}%`

      });

    }

    //--------------------------------------------------
    // Crop Variety
    //--------------------------------------------------

    if (context.entities?.variety) {

      filters.push({

        column: "variety",

        operator: "=",

        value: context.entities.variety

      });

    }

    //--------------------------------------------------
    // Return Filters
    //--------------------------------------------------

    return {

      filters

    };

  }

}