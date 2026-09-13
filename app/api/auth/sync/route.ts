import { NextRequest, NextResponse } from "next/server";
import { syncFirebaseUser } from "@/lib/auth-sync";

export async function POST(request: NextRequest) {
  try {
    //--------------------------------------------------
    // Parse Request Body
    //--------------------------------------------------

    const body = await request.json();

    const idToken = body?.idToken;

    //--------------------------------------------------
    // Validate Token
    //--------------------------------------------------

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Firebase ID token is required.",
        },
        {
          status: 400,
        }
      );
    }

    //--------------------------------------------------
    // Synchronize Firebase User → PostgreSQL
    //--------------------------------------------------

    const user = await syncFirebaseUser(idToken);

    //--------------------------------------------------
    // Success
    //--------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message: "Authentication synchronized successfully.",

        user,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Authentication Sync Error");
    console.error(error);

    //--------------------------------------------------
    // Firebase Token Errors
    //--------------------------------------------------

    if (error.code?.startsWith("auth/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired Firebase token.",
        },
        {
          status: 401,
        }
      );
    }

    //--------------------------------------------------
    // Other Errors
    //--------------------------------------------------

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Authentication synchronization failed.",
      },
      {
        status: 500,
      }
    );
  }
}