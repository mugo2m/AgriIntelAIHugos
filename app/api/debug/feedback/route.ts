import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const interviewId = searchParams.get('interviewId');

    console.log("🔍 [Debug Feedback API] Checking for:", { userId, interviewId });

    let results: any[] = [];

    if (userId && interviewId) {
      // Check specific feedback
      try {
        const snapshot = await db
          .collection("feedback")
          .where("interviewId", "==", interviewId)
          .where("userId", "==", userId)
          .get();

        results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError: any) {
        console.log("❌ Query failed:", queryError.message);

        // Fallback: scan all documents
        const allDocs = await db.collection("feedback").get();
        allDocs.forEach(doc => {
          const data = doc.data();
          if (data.interviewId === interviewId && data.userId === userId) {
            results.push({
              id: doc.id,
              ...data
            });
          }
        });
      }
    } else if (userId) {
      // All feedback for user
      try {
        const snapshot = await db
          .collection("feedback")
          .where("userId", "==", userId)
          .get();

        results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError: any) {
        console.log("❌ Query failed:", queryError.message);

        // Fallback: scan all documents
        const allDocs = await db.collection("feedback").get();
        allDocs.forEach(doc => {
          const data = doc.data();
          if (data.userId === userId) {
            results.push({
              id: doc.id,
              ...data
            });
          }
        });
      }
    } else {
      // All feedback
      const snapshot = await db.collection("feedback").get();
      results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
      message: results.length === 0 ? "No feedback found" : "Feedback found"
    });

  } catch (error: any) {
    console.error("❌ Debug API error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}