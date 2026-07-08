import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { mpesaService } from "@/lib/mpesa/service";
import { paymentDB } from "@/lib/payment/db";
import { PRICING } from "@/lib/mpesa/types";

export async function POST(req: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const { phone, interviewType = "standard" } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // 3. Get price based on interview type
    const price = PRICING[interviewType]?.price || PRICING.standard.price;
    const description = PRICING[interviewType]?.description || "Interview Practice";

    // 4. Initiate MPESA payment
    const mpesaResponse = await mpesaService.initiateSTKPush({
      phone,
      amount: price,
      reference: `HUGOS_${Date.now()}`,
      description
    });

    if (!mpesaResponse.success || !mpesaResponse.checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: mpesaResponse.error || "Payment initiation failed" },
        { status: 500 }
      );
    }

    // 5. Save payment transaction to database
    const paymentId = await paymentDB.createPaymentTransaction({
      userId: user.id,
      phone,
      amount: price,
      checkoutRequestId: mpesaResponse.checkoutRequestId,
      merchantRequestId: mpesaResponse.merchantRequestId!,
      description: `${description} - KES ${price}`
    });

    // 6. Return success response
    return NextResponse.json({
      success: true,
      paymentId,
      checkoutRequestId: mpesaResponse.checkoutRequestId,
      amount: price,
      message: `MPESA request sent to ${phone}. Check your phone to complete payment.`
    });

  } catch (error: any) {
    console.error("❌ MPESA payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}