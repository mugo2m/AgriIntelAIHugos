// lib/agents/PostgreSQLAgent.ts

import { BaseAgent } from "./BaseAgent";

import { prisma } from "@/lib/prisma";

export class PostgreSQLAgent extends BaseAgent{

    name="PostgreSQL Agent";

    async execute(sql:string){

        const result=await prisma.$queryRawUnsafe(sql);

        return result;

    }

}