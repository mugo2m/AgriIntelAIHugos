import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { interviewId, userId } = await req.json();

    console.log('🔵 [MARK PAYMENT USED] Request:', { interviewId, userId });

    if (!interviewId || !userId) {
      return NextResponse.json({
        success: false,
        message: 'Missing parameters'
      }, { status: 400 });
    }

    const db = getDB();
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'Database unavailable'
      }, { status: 500 });
    }

    // Find the latest UNUSED payment
    const paymentQuery = await db.collection("payments")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .where("status", "in", ["paid", "success", "completed"])
      .where("used", "==", false)
      .where("amount", "==", 3)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (paymentQuery.empty) {
      return NextResponse.json({
        success: false,
        message: 'No unused payment found'
      }, { status: 404 });
    }

    const paymentDoc = paymentQuery.docs[0];

    // Mark payment as used
    await paymentDoc.ref.update({
      used: true,
      usedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ [MARK PAYMENT USED] Success:', {
      paymentId: paymentDoc.id,
      interviewId: interviewId.substring(0, 8)
    });

    return NextResponse.json({
      success: true,
      message: 'Payment marked as used',
      paymentId: paymentDoc.id,
      usedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🔴 [MARK PAYMENT USED] Error:', error.message);
    return NextResponse.json({
      success: false,
      message: 'Failed to mark payment as used',
      error: error.message
    }, { status: 500 });
  }
}