import prisma from "@/lib/prisma";

export async function userHasPermission(
  userId: string,
  permission: string
): Promise<boolean> {

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!user) return false;

  return user.role.rolePermissions.some(
    (rp) => rp.permission.name === permission
  );
}