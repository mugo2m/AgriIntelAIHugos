import { NextRequest, NextResponse } from "next/server";
// ✅ Import the specific function you need
import { getResumeInterviewData } from "@/lib/memory/memoryService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // ✅ Use the imported function directly
    const resumeData = await getResumeInterviewData(userId);

    return NextResponse.json({
      success: true,
      data: resumeData
    });
  } catch (error) {
    console.error("❌ [API /memory/resume] Error:", error);
    return NextResponse.json(
      { error: "Failed to get resume data" },
      { status: 500 }
    );
  }
}