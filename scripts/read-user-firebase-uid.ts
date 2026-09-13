import { prisma } from "../lib/prisma";

async function main(): Promise<void> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firebaseUid: true,
    },
  });

  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });