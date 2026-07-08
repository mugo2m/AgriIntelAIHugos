import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/lib/actions/general.action";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, transcript, userId } = body;

    if (!interviewId || !transcript || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📝 API Route - Creating feedback:", { interviewId, userId });

    const { success, feedbackId, error } = await createFeedback({
      interviewId,
      transcript,
      userId,
    });

    if (!success) {
      console.error("❌ createFeedback failed:", error);
      return NextResponse.json(
        { error: error || "Failed to create feedback" },
        { status: 500 }
      );
    }

    console.log("✅ Feedback created:", feedbackId);
    return NextResponse.json(
      { success: true, feedbackId },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}