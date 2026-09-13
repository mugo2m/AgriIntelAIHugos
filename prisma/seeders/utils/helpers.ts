import { PrismaClient } from "../../lib/generated/prisma/client";

export async function resetTable(
  prisma: PrismaClient,
  table: keyof PrismaClient
) {
  const model = prisma[table] as any;

  if (model?.deleteMany) {
    await model.deleteMany();
  }
}




