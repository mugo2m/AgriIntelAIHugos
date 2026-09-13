import { NextResponse } from "next/server";

import { db } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { generateAnswer as generateStructuredAnswer } from "@/lib/qaEngine";

export async function GET() {
  return NextResponse.json({
    message: "Farmer query API is working. Use POST to send questions.",
    status: "online",
    timestamp: new Date().toISOString(),
    supportedCategories: [
      "varieties",
      "fertilizer",
      "nutrients",
      "damage",
      "seed",
      "spacing",
      "pest",
      "disease",
      "harvest",
      "water",
      "margin",
      "business",
      "planting",
    ],
  });
}

export async function POST(request: Request) {
  try {
    /*
     * ============================================================
     * 1. AUTHENTICATE THE REQUEST
     * ============================================================
     *
     * The client must have a valid Firebase-authenticated session.
     * We do not trust userId supplied in the request body.
     */
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    /*
     * ============================================================
     * 2. DERIVE THE AUTHENTICATED FIREBASE UID SERVER-SIDE
     * ============================================================
     */
    const authenticatedFirebaseUid =
      typeof currentUser.id === "string"
        ? currentUser.id
        : typeof (currentUser as { uid?: unknown }).uid === "string"
          ? (currentUser as { uid: string }).uid
          : null;

    if (!authenticatedFirebaseUid) {
      return NextResponse.json(
        {
          success: false,
          error: "Authenticated user does not have a valid Firebase UID.",
        },
        { status: 401 },
      );
    }

    /*
     * ============================================================
     * 3. PARSE REQUEST
     * ============================================================
     */
    const body = await request.json();

    const {
      question,
      sessionId,
      sessionData,
    } = body;

    /*
     * userId is intentionally NOT extracted from the request.
     *
     * The authenticated Firebase UID is the authoritative identity.
     */
    if (!question || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      );
    }

    if (typeof question !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Question must be a string",
        },
        { status: 400 },
      );
    }

    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session ID",
        },
        { status: 400 },
      );
    }

    /*
     * ============================================================
     * 4. LOAD THE AUTHORITATIVE FIRESTORE SESSION
     * ============================================================
     *
     * The session document contains the userId originally associated
     * with the session by the authenticated VAPI/session creation flow.
     *
     * We use that stored value instead of trusting body.userId.
     */
    const sessionRef = db
      .collection("farmer_sessions")
      .doc(sessionId);

    const sessionSnapshot = await sessionRef.get();

    if (!sessionSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Farmer session not found",
        },
        { status: 404 },
      );
    }

    const sessionDataFromFirestore = sessionSnapshot.data();

    if (!sessionDataFromFirestore) {
      return NextResponse.json(
        {
          success: false,
          error: "Farmer session data is unavailable",
        },
        { status: 404 },
      );
    }

    /*
     * ============================================================
     * 5. VERIFY SESSION OWNERSHIP
     * ============================================================
     *
     * This is the critical authorization boundary.
     *
     * Firestore session:
     *
     *   farmer_sessions/{sessionId}.userId
     *
     * must match:
     *
     *   getCurrentUser().id / uid
     *
     * A client cannot choose another user's session.
     */
    const sessionOwnerId = sessionDataFromFirestore.userId;

    if (
      typeof sessionOwnerId !== "string" ||
      sessionOwnerId.length === 0
    ) {
      console.error(
        "Farmer session has invalid or missing userId:",
        sessionId,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Farmer session has no valid owner",
        },
        { status: 403 },
      );
    }

    if (sessionOwnerId !== authenticatedFirebaseUid) {
      console.warn(
        "Farmer session ownership violation:",
        {
          sessionId,
          authenticatedFirebaseUid,
          sessionOwnerId,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    /*
     * ============================================================
     * 6. GENERATE CATEGORY
     * ============================================================
     */
    const category = detectCategory(question);

    /*
     * ============================================================
     * 7. SAVE QUERY USING SERVER-VERIFIED IDENTITY
     * ============================================================
     *
     * We deliberately write authenticatedFirebaseUid rather than
     * any client-supplied userId.
     */
    try {
      const queryRef = sessionRef
        .collection("queries")
        .doc();

      await queryRef.set({
        id: queryRef.id,
        question,
        category,
        timestamp: new Date().toISOString(),
        userId: authenticatedFirebaseUid,
        sessionId,
        sessionData: sessionData || null,
      });

      await sessionRef.update({
        queryCount: FieldValue.increment(1),
        lastQueryAt: new Date().toISOString(),
      });
    } catch (dbError) {
      /*
       * Preserve the previous behavior:
       *
       * Firebase persistence failure does not prevent the AI answer
       * from being generated.
       */
      console.error(
        "Failed to save query to Firebase:",
        dbError,
      );
    }

    /*
     * ============================================================
     * 8. GENERATE AI ANSWER
     * ============================================================
     */
    const answer = generateStructuredAnswer(
      question,
      sessionData,
    );

    /*
     * ============================================================
     * 9. RETURN RESPONSE
     * ============================================================
     */
    return NextResponse.json(
      {
        success: true,
        answer,
        category,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "POST /api/farmer/query error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 },
    );
  }
}

function detectCategory(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes("variet") ||
    q.includes("varity") ||
    q.includes("which type") ||
    q.includes("what type of seed")
  ) {
    return "varieties";
  }

  if (
    q.includes("fertilizer") ||
    q.includes("dap") ||
    q.includes("can") ||
    q.includes("npk") ||
    q.includes("manure") ||
    q.includes("topdress")
  ) {
    return "fertilizer";
  }

  if (
    q.includes("nutrient") ||
    q.includes("what nutrients") ||
    q.includes("n p k") ||
    q.includes("what does my fertilizer contain") ||
    q.includes("fertilizer composition") ||
    q.includes("secondary nutrients") ||
    q.includes("sulfur") ||
    q.includes("calcium") ||
    q.includes("magnesium") ||
    q.includes("zinc") ||
    q.includes("boron") ||
    q.includes("micronutrient")
  ) {
    return "nutrients";
  }

  if (
    q.includes("damage") ||
    q.includes("plants damaged") ||
    q.includes("lost plants") ||
    q.includes("plants died") ||
    q.includes("beyond recovery") ||
    q.includes("crop loss")
  ) {
    return "damage";
  }

  if (
    q.includes("seed rate") ||
    q.includes("how many kg") ||
    q.includes("seed per acre")
  ) {
    return "seed";
  }

  if (
    q.includes("spacing") ||
    q.includes("distance") ||
    q.includes("how far")
  ) {
    return "spacing";
  }

  if (
    q.includes("pest") ||
    q.includes("insect") ||
    q.includes("worm") ||
    q.includes("borer") ||
    q.includes("armyworm")
  ) {
    return "pest";
  }

  if (
    q.includes("disease") ||
    q.includes("blight") ||
    q.includes("rust") ||
    q.includes("virus") ||
    q.includes("smut")
  ) {
    return "disease";
  }

  if (
    q.includes("harvest") ||
    q.includes("when to pick") ||
    q.includes("storage")
  ) {
    return "harvest";
  }

  if (
    q.includes("water") ||
    q.includes("irrigation") ||
    q.includes("drought")
  ) {
    return "water";
  }

  if (
    q.includes("gross margin") ||
    q.includes("profit") ||
    q.includes("revenue") ||
    q.includes("cost") ||
    q.includes("roi")
  ) {
    return "margin";
  }

  if (
    q.includes("business") ||
    q.includes("money") ||
    q.includes("invest")
  ) {
    return "business";
  }

  if (
    q.includes("plant") ||
    q.includes("when to plant") ||
    q.includes("planting time") ||
    q.includes("sow") ||
    q.includes("sowing") ||
    q.includes("best time to plant")
  ) {
    return "planting";
  }

  return "default";
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}