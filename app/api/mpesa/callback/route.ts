import { NextRequest, NextResponse } from "next/server";
import { paymentDB } from "@/lib/payment/db";
import { PaymentWebhookData } from "@/lib/mpesa/types";

export async function POST(req: NextRequest) {
  try {
    console.log("📞 MPESA Webhook received");

    const data: PaymentWebhookData = await req.json();
    const callback = data.Body.stkCallback;

    console.log("MPESA Callback Data:", {
      merchantRequestId: callback.MerchantRequestID,
      checkoutRequestId: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDesc: callback.ResultDesc
    });

    // ResultCode 0 = success
    if (callback.ResultCode === 0) {
      // Extract MPESA receipt and amount from callback metadata
      let mpesaReceipt = "";
      let amount = 0;

      if (callback.CallbackMetadata?.Item) {
        callback.CallbackMetadata.Item.forEach(item => {
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceipt = item.Value as string;
          }
          if (item.Name === "Amount") {
            amount = Number(item.Value);
          }
        });
      }

      console.log(`✅ Payment successful! Receipt: ${mpesaReceipt}, Amount: ${amount}`);

      // Update payment status in database
      await paymentDB.updatePaymentStatus(
        callback.CheckoutRequestID,
        "paid",
        mpesaReceipt
      );

      // TODO: Send email/SMS notification
      // TODO: Unlock interview for user

    } else {
      // Payment failed
      console.log(`❌ Payment failed: ${callback.ResultDesc}`);

      await paymentDB.updatePaymentStatus(
        callback.CheckoutRequestID,
        "failed"
      );
    }

    // Always return success to MPESA (they retry if we return error)
    return NextResponse.json({
      success: true,
      message: "Callback processed"
    });

  } catch (error: any) {
    console.error("❌ Webhook processing error:", error);

    // Still return success to MPESA so they don't retry
    return NextResponse.json({
      success: true,
      error: error.message
    }, { status: 200 });
  }
}