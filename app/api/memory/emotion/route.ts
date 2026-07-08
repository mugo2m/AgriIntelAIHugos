// app/api/memory/emotion/route.ts
import { NextRequest, NextResponse } from "next/server";
// ✅ Import individual functions instead of emotionalMemory object
import {
  recordEmotionalState,
  getEmotionalWellness,
  getEmotionalPatterns
} from "@/lib/memory/memoryService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, emotion, intensity, triggers, context } = body;

    if (!userId || !emotion) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ Use the imported function directly
    const timestamp = await recordEmotionalState({
      userId,
      emotion,
      intensity,
      triggers: triggers || [],
      context: context || {}
    });

    return NextResponse.json({
      success: true,
      timestamp,
      message: "Emotion recorded successfully"
    });
  } catch (error) {
    console.error("Error recording emotion:", error);
    return NextResponse.json(
      { error: "Failed to record emotion" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // ✅ Fix these function calls - they need to be imported or implemented
    // For now, let's use what's available in memoryService
    const wellness = await calculateEmotionalWellness(userId);
    const patterns = await getEmotionalPatterns(userId);

    // These need to be implemented or removed
    // const timeline = await emotionalMemory.getEmotionalTimeline(userId, limit);
    // const progress = await emotionalMemory.getEmotionalProgress(userId);

    return NextResponse.json({
      success: true,
      // timeline: [],
      patterns,
      wellness,
      // progress: {}
    });
  } catch (error) {
    console.error("Error getting emotional data:", error);
    return NextResponse.json(
      { error: "Failed to get emotional data" },
      { status: 500 }
    );
  }
}