import prisma from "@/lib/prisma";
import { auth } from "@/firebase/admin";
import { ROLES } from "@/lib/constants/roles";
export async function syncFirebaseUser(idToken: string) {
  //-------------------------------------------------------
  // Verify Firebase Token
  //-------------------------------------------------------

  const decodedToken = await auth.verifyIdToken(idToken);

  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email ?? "";
  const emailVerified = decodedToken.email_verified ?? false;
  const phoneNumber = decodedToken.phone_number ?? null;

  const displayName =
    decodedToken.name ??
    (email
      ? email.split("@")[0]
      : phoneNumber
        ? phoneNumber
        : "New User");

  const photoURL = decodedToken.picture ?? null;

  //-------------------------------------------------------
  // Find existing user by Firebase UID
  //-------------------------------------------------------

  let user = await prisma.user.findUnique({
    where: {
      firebaseUid,
    },
  });

  //-------------------------------------------------------
  // If user doesn't exist, create one
  //-------------------------------------------------------

  if (!user) {
    const defaultRole = await prisma.role.findFirst({
      where: {
        name:ROLES.FARMER,
      },
    });

    if (!defaultRole) {
      throw new Error(
        "Default role '${ROLES.FARMER}' was not found. Please seed the Role table first."
      );
    }

    user = await prisma.user.create({
      data: {
        firebaseUid,

        email,

        emailVerified,

        phoneNumber,

        photoURL,

        name: displayName,

        roleId: defaultRole.id,

        active: true,

        lastLoginAt: new Date(),
      },
      include: {
        role: true,
      },
    });

    console.log(`✅ New user created: ${user.name}`);
  }

  //-------------------------------------------------------
  // Existing user
  //-------------------------------------------------------

  else {
    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,

        emailVerified,

        phoneNumber,

        photoURL,

        name: displayName,

        lastLoginAt: new Date(),

        active: true,
      },
      include: {
        role: true,
      },
    });

    console.log(`✅ Existing user updated: ${user.name}`);
  }

  return user;
}