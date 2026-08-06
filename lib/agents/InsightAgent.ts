// lib/agents/InsightAgent.ts

import { BaseAgent } from "./BaseAgent";

export class InsightAgent extends BaseAgent{

    name="Insight Agent";

    async execute(data:any){

        return{

            summary:`The database returned ${JSON.stringify(data)}`,

            recommendation:"Continue monitoring production."

        };

    }

}