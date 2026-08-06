// lib/agents/SQLGeneratorAgent.ts

import { BaseAgent } from "./BaseAgent";

export class SQLGeneratorAgent extends BaseAgent{

    name="SQL Generator";

    async execute(input:any){

        const{

            crop,

            county,

            subcounty,

            season,

            year

        }=input;

        let sql=`

SELECT

SUM(achieved_acres)

FROM production

WHERE 1=1

`;

        if(crop)

            sql+=`AND crop='${crop}'\n`;

        if(county)

            sql+=`AND county='${county}'\n`;

        if(subcounty)

            sql+=`AND subcounty='${subcounty}'\n`;

        if(season)

            sql+=`AND season='${season}'\n`;

        if(year)

            sql+=`AND year=${year}\n`;

        return sql;

    }

}