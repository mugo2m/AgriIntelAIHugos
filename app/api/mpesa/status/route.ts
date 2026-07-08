import { NextRequest, NextResponse } from "next/server";
import { mpesaService } from "@/lib/mpesa/service";
import { paymentDB } from "@/lib/payment/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get("checkoutId");

    if (!checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: "Missing checkoutId parameter" },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking payment status for: ${checkoutRequestId}`);

    // 1. Check database first
    const payments = await paymentDB["db"]
      .collection("payments")
      .where("checkoutRequestId", "==", checkoutRequestId)
      .limit(1)
      .get();

    if (payments.empty) {
      return NextResponse.json({
        success: false,
        error: "Payment not found",
        status: "not_found"
      });
    }

    const payment = payments.docs[0].data();

    // 2. If already marked as paid in DB, return quickly
    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        status: "paid",
        receipt: payment.mpesaReceipt,
        amount: payment.amount,
        paidAt: payment.paidAt
      });
    }

    // 3. Check with MPESA API for latest status
    try {
      const mpesaStatus = await mpesaService.checkPaymentStatus(checkoutRequestId);
      console.log("MPESA Status Response:", mpesaStatus);

      // ResultCode 0 = success
      if (mpesaStatus.ResultCode === "0") {
        const receipt = mpesaStatus.MpesaReceiptNumber || "";

        // Update database
        await paymentDB.updatePaymentStatus(checkoutRequestId, "paid", receipt);

        return NextResponse.json({
          success: true,
          status: "paid",
          receipt: receipt,
          amount: payment.amount,
          message: "Payment confirmed"
        });
      } else {
        // Check if expired (more than 15 minutes)
        const expiryTime = new Date(payment.expiresAt);
        if (new Date() > expiryTime) {
          await paymentDB.updatePaymentStatus(checkoutRequestId, "expired");
          return NextResponse.json({
            success: false,
            status: "expired",
            error: "Payment expired"
          });
        }

        return NextResponse.json({
          success: false,
          status: "pending",
          message: "Payment still pending"
        });
      }
    } catch (mpesaError) {
      console.error("MPESA status check error:", mpesaError);

      // Fallback to database status
      return NextResponse.json({
        success: payment.status === "paid",
        status: payment.status,
        message: `Payment ${payment.status}`
      });
    }

  } catch (error: any) {
    console.error("❌ Status check error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Status check failed" },
      { status: 500 }
    );
  }
}