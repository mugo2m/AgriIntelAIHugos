import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const interviewId = searchParams.get('interviewId');
    const userId = searchParams.get('userId');

    console.log("🔍 [Direct Feedback API] Request:", { id, interviewId, userId });

    if (!id && (!interviewId || !userId)) {
      return NextResponse.json(
        { error: "Missing parameters. Provide either 'id' or both 'interviewId' and 'userId'" },
        { status: 400 }
      );
    }

    let feedbackDoc;

    if (id) {
      // Direct fetch by document ID
      feedbackDoc = await db.collection("feedback").doc(id).get();

      if (!feedbackDoc.exists) {
        // Try predictable ID pattern
        const predictableId = `${interviewId}_${userId}`;
        if (interviewId && userId && id !== predictableId) {
          console.log("🔄 Trying predictable ID:", predictableId);
          feedbackDoc = await db.collection("feedback").doc(predictableId).get();
        }
      }
    } else if (interviewId && userId) {
      // Try predictable ID
      const predictableId = `${interviewId}_${userId}`;
      feedbackDoc = await db.collection("feedback").doc(predictableId).get();

      if (!feedbackDoc.exists) {
        // Try the known ID for this specific interview
        const knownIds = await findFeedbackIds(interviewId, userId);
        if (knownIds.length > 0) {
          feedbackDoc = await db.collection("feedback").doc(knownIds[0]).get();
        }
      }
    }

    if (!feedbackDoc || !feedbackDoc.exists) {
      return NextResponse.json(
        {
          error: "Feedback not found",
          message: "No feedback document found with the provided criteria"
        },
        { status: 404 }
      );
    }

    const feedbackData = feedbackDoc.data();

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedbackDoc.id,
        ...feedbackData
      },
      message: "Feedback found via direct document fetch"
    });

  } catch (error: any) {
    console.error("❌ Direct feedback API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message
      },
      { status: 500 }
    );
  }
}

async function findFeedbackIds(interviewId: string, userId: string): Promise<string[]> {
  try {
    // Try to find any feedback for this interview/user
    const allFeedback = await db.collection("feedback").get();
    const matchingIds: string[] = [];

    allFeedback.forEach(doc => {
      const data = doc.data();
      if (data.interviewId === interviewId && data.userId === userId) {
        matchingIds.push(doc.id);
      }
    });

    return matchingIds;
  } catch (error) {
    console.error("Error finding feedback IDs:", error);
    return [];
  }
}