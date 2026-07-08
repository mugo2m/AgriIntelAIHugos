// app/api/user/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  try {
    const sessions = await db
      .collection("farmer_sessions")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const sessionsData = sessions.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      sessions: sessionsData
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}