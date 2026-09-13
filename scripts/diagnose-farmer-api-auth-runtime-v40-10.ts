import { config } from "dotenv";

config({
  path: ".env.local",
});

import prisma from "../lib/prisma";

async function main() {
  console.log("============================================================");
  console.log("V40.10 FARMER API AUTH RUNTIME DIAGNOSTIC");
  console.log("============================================================");
  console.log("READ-ONLY: NO INSERT / UPDATE / DELETE");
  console.log("");

  console.log("------------------------------------------------------------");
  console.log("0. ENVIRONMENT");
  console.log("------------------------------------------------------------");

  console.log(
    `FIREBASE_CONFIG present: ${Boolean(process.env.FIREBASE_CONFIG)}`,
  );

  console.log(
    `FIREBASE_PROJECT_ID present: ${Boolean(
      process.env.FIREBASE_PROJECT_ID,
    )}`,
  );

  console.log(
    `FIREBASE_CLIENT_EMAIL present: ${Boolean(
      process.env.FIREBASE_CLIENT_EMAIL,
    )}`,
  );

  console.log(
    `FIREBASE_PRIVATE_KEY present: ${Boolean(
      process.env.FIREBASE_PRIVATE_KEY,
    )}`,
  );

  console.log("");

  console.log("------------------------------------------------------------");
  console.log("1. LOAD getCurrentUser()");
  console.log("------------------------------------------------------------");

  let getCurrentUser:
    typeof import("../lib/actions/auth.action").getCurrentUser;

  try {
    const authModule = await import(
      "../lib/actions/auth.action"
    );

    getCurrentUser = authModule.getCurrentUser;

    console.log(
      "PASS   auth.action.ts loaded successfully",
    );
  } catch (error) {
    console.log(
      "FAIL   auth.action.ts failed to load",
    );
    console.error(error);
    return;
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("2. DIRECT getCurrentUser() EXECUTION");
  console.log("------------------------------------------------------------");

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.log(
        "FAIL   getCurrentUser() returned null",
      );
    } else {
      console.log(
        "PASS   getCurrentUser() succeeded",
      );

      console.log(
        `User ID type: ${typeof currentUser.id}`,
      );

      console.log(
        `User ID present: ${Boolean(currentUser.id)}`,
      );

      const uid =
        typeof currentUser.id === "string"
          ? currentUser.id
          : typeof (
                currentUser as {
                  uid?: unknown;
                }
              ).uid === "string"
            ? (
                currentUser as {
                  uid: string;
                }
              ).uid
            : null;

      console.log(
        `Firebase UID present: ${Boolean(uid)}`,
      );

      if (uid) {
        console.log(
          `Firebase UID length: ${uid.length}`,
        );
      }
    }
  } catch (error) {
    console.log(
      "FAIL   getCurrentUser() threw an exception",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("3. getCurrentUser() → DATABASE USER");
  console.log("------------------------------------------------------------");

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.log(
        "FAIL   Cannot continue because getCurrentUser() returned null",
      );
    } else {
      const firebaseUid =
        typeof currentUser.id === "string"
          ? currentUser.id
          : typeof (
                currentUser as {
                  uid?: unknown;
                }
              ).uid === "string"
            ? (
                currentUser as {
                  uid: string;
                }
              ).uid
            : null;

      if (!firebaseUid) {
        console.log(
          "FAIL   Authenticated user has no Firebase UID",
        );
      } else {
        const dbUser =
          await prisma.user.findUnique({
            where: {
              firebaseUid,
            },
            include: {
              role: true,
            },
          });

        if (!dbUser) {
          console.log(
            "FAIL   Firebase user has no PostgreSQL User",
          );
        } else {
          console.log(
            "PASS   getCurrentUser() identity maps to PostgreSQL User",
          );

          console.log(
            `DB User ID: ${dbUser.id}`,
          );

          console.log(
            `DB Role: ${dbUser.role?.name ?? "NULL"}`,
          );

          console.log(
            `Active: ${dbUser.active}`,
          );
        }
      }
    }
  } catch (error) {
    console.log(
      "FAIL   getCurrentUser() → PostgreSQL mapping failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("4. AUTHORIZATION AFTER getCurrentUser()");
  console.log("------------------------------------------------------------");

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      console.log(
        "FAIL   No authenticated user",
      );
    } else {
      const firebaseUid =
        typeof currentUser.id === "string"
          ? currentUser.id
          : typeof (
                currentUser as {
                  uid?: unknown;
                }
              ).uid === "string"
            ? (
                currentUser as {
                  uid: string;
                }
              ).uid
            : null;

      if (!firebaseUid) {
        console.log(
          "FAIL   No Firebase UID",
        );
      } else {
        const dbUser =
          await prisma.user.findUnique({
            where: {
              firebaseUid,
            },
            include: {
              role: true,
            },
          });

        if (!dbUser) {
          console.log(
            "FAIL   No PostgreSQL User",
          );
        } else {
          const {
            getAuthorizedFarmerWhere,
          } = await import(
            "../lib/authorization/farmer-collection-authorization"
          );

          const where =
            await getAuthorizedFarmerWhere(
              dbUser.id,
            );

          if (!where) {
            console.log(
              "FAIL   No authorized Farmer WHERE clause",
            );
          } else {
            console.log(
              "PASS   Authentication → DB User → Authorization succeeded",
            );

            console.log(
              JSON.stringify(
                where,
                null,
                2,
              ),
            );
          }
        }
      }
    }
  } catch (error) {
    console.log(
      "FAIL   Authentication → authorization chain failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("5. CURRENT SESSION COOKIE ENVIRONMENT");
  console.log("------------------------------------------------------------");

  try {
    const { cookies } =
      await import("next/headers");

    const cookieStore =
      await cookies();

    const sessionCookie =
      cookieStore.get("session");

    if (!sessionCookie) {
      console.log(
        "WARN   No session cookie exists in direct script context",
      );

      console.log(
        "This is expected because this script is not an HTTP request.",
      );
    } else {
      console.log(
        "PASS   Session cookie is visible",
      );

      console.log(
        `Session cookie length: ${sessionCookie.value.length}`,
      );
    }
  } catch (error) {
    console.log(
      "FAIL   next/headers cookies() execution failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("6. NEXTRESPONSE.JSON DIRECT TEST");
  console.log("------------------------------------------------------------");

  try {
    const {
      NextResponse,
    } = await import(
      "next/server"
    );

    const testData = {
      success: true,
      test: "farmer-api-runtime",
      number: 123,
      text: "ok",
    };

    const response =
      NextResponse.json(
        testData,
        {
          status: 200,
        },
      );

    console.log(
      "PASS   NextResponse.json() executed successfully",
    );

    console.log(
      `Status: ${response.status}`,
    );

    console.log(
      `Content-Type: ${response.headers.get(
        "content-type",
      )}`,
    );
  } catch (error) {
    console.log(
      "FAIL   NextResponse.json() execution failed",
    );
    console.error(error);
  }

  console.log("");
  console.log("------------------------------------------------------------");
  console.log("7. FINAL DIAGNOSIS");
  console.log("------------------------------------------------------------");

  console.log(
    "Database query, relations, authorization, and JSON serialization have already passed.",
  );

  console.log(
    "This diagnostic now tests the authentication layer with .env.local explicitly loaded.",
  );

  console.log(
    "If getCurrentUser() succeeds here, the remaining fault is specific to the HTTP Next.js request context.",
  );

  console.log("");
  console.log("============================================================");
  console.log("AUTH RUNTIME DIAGNOSTIC COMPLETE");
  console.log("============================================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "UNHANDLED DIAGNOSTIC ERROR",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });