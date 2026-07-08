// app/api/payment/initiate/route.ts - UPDATED WITH used FIELD
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/firebase/admin";

const INTERVIEW_COST = 3; // 3 KES

export async function POST(req: NextRequest) {
  console.log('🔵 [PAYMENT INITIATE] Starting payment initiation...');

  try {
    const body = await req.json();
    const { interviewId, userId, phoneNumber } = body;

    console.log('🔵 [PAYMENT INITIATE] Request data:', {
      interviewId,
      userId,
      phoneNumber: phoneNumber ? phoneNumber.substring(0, 12) + '...' : 'MISSING'
    });

    // ============ VALIDATION ============
    if (!interviewId || !userId || !phoneNumber) {
      console.error('🔴 [PAYMENT INITIATE] Missing required fields');
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: interviewId, userId, phoneNumber',
        message: 'Please provide all required information'
      }, { status: 400 });
    }

    // Validate phone number format
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7')) {
      formattedPhone = '254' + formattedPhone;
    }

    if (!formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
      console.error('🔴 [PAYMENT INITIATE] Invalid phone format:', formattedPhone);
      return NextResponse.json({
        success: false,
        error: 'Invalid Kenyan phone number. Use format 07XXXXXXXX or 2547XXXXXXXX',
        message: 'Please enter a valid Kenyan phone number'
      }, { status: 400 });
    }

    // ============ DATABASE CONNECTION ============
    const db = getDB();
    if (!db) {
      console.error('🔴 [PAYMENT INITIATE] Database not available');
      return NextResponse.json({
        success: false,
        error: 'Database service unavailable',
        message: 'Payment system error. Please try again.'
      }, { status: 500 });
    }

    // ============ CHECK EXISTING UNUSED PAYMENT ============
    console.log('🔵 [PAYMENT INITIATE] Checking for existing UNUSED payment...');

    const existingQuery = await db.collection("payments")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .where("used", "==", false) // Check for UNUSED payments
      .orderBy("createdAt", "desc") // Get the latest
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      const existingDoc = existingQuery.docs[0];
      const existingData = existingDoc.data();

      console.log('🟡 [PAYMENT INITIATE] Found existing payment:', {
        paymentId: existingDoc.id,
        status: existingData.status,
        used: existingData.used,
        amount: existingData.amount
      });

      // If already paid and unused, return success
      if (existingData.status === "paid" || existingData.status === "success") {
        return NextResponse.json({
          success: true,
          message: 'Unused payment already exists',
          paymentId: existingDoc.id,
          status: "paid",
          alreadyPaid: true,
          unusedPayment: true,
          transactionId: existingData.transactionId
        });
      }

      // If pending and unused, return current status
      if (existingData.status === "pending") {
        return NextResponse.json({
          success: true,
          message: 'Payment already pending',
          paymentId: existingDoc.id,
          status: "pending",
          unusedPayment: true,
          checkoutRequestId: existingData.checkoutRequestId
        });
      }
    }

    // ============ CREATE NEW PAYMENT ============
    console.log('🔵 [PAYMENT INITIATE] Creating new payment record...');

    const paymentData = {
      interviewId,
      userId,
      phoneNumber: formattedPhone,
      amount: INTERVIEW_COST,
      currency: "KES",
      status: "pending",
      used: false, // NEW: Track if payment has been consumed
      description: "AI Interview Practice Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      attempts: 1,

      // MPESA fields (will be filled when paid)
      mpesaReceipt: null,
      transactionId: null,
      checkoutRequestId: null,
      paidAt: null,
      usedAt: null, // NEW: Track when payment was used

      // For simulation/testing (remove in production)
      simulated: true,
      simulationTimeout: 10000 // 10 seconds for simulation
    };

    const paymentRef = await db.collection("payments").add(paymentData);
    const paymentId = paymentRef.id;

    console.log('🟢 [PAYMENT INITIATE] Payment record created:', {
      paymentId,
      interviewId,
      userId,
      amount: INTERVIEW_COST,
      used: false
    });

    // ============ SIMULATE MPESA PAYMENT (FOR DEVELOPMENT) ============
    // ⚠️ REMOVE THIS IN PRODUCTION - Replace with real MPESA API call
    console.log('🟡 [PAYMENT INITIATE] Starting payment simulation...');

    // Generate simulation data
    const simulationData = {
      simulated: true,
      checkoutRequestId: `SIM-CHK-${Date.now()}`,
      message: 'MPESA simulation started. Payment will complete in 10 seconds.',
      countdown: 10
    };

    // Start simulation (10 seconds delay)
    const simulationTimeout = setTimeout(async () => {
      try {
        console.log('🟡 [PAYMENT SIMULATION] Completing simulated payment...');

        const updateData = {
          status: "paid",
          paidAt: new Date().toISOString(),
          mpesaReceipt: `RCT${Date.now().toString().substring(5)}`,
          transactionId: `TXN${Date.now()}`,
          checkoutRequestId: `CHK${Date.now()}`,
          updatedAt: new Date().toISOString(),
          simulationCompleted: true
        };

        await paymentRef.update(updateData);

        console.log('✅ [PAYMENT SIMULATION] Payment marked as paid:', {
          paymentId,
          receipt: updateData.mpesaReceipt,
          used: false // Still unused
        });

      } catch (error: any) {
        console.error('🔴 [PAYMENT SIMULATION] Error:', error.message);
      }
    }, 10000); // 10 seconds

    // Store timeout reference (in a real app, you'd manage this differently)
    console.log(`⏰ [PAYMENT INITIATE] Simulation started. Will complete in 10 seconds.`);

    // ============ RESPONSE ============
    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      message: 'Payment initiated successfully',
      instructions: 'Please check your phone for MPESA STK Push notification',
      amount: INTERVIEW_COST,
      phone: formattedPhone,
      currency: "KES",
      used: false, // NEW: Include in response

      // Simulation info
      simulated: true,
      checkoutRequestId: simulationData.checkoutRequestId,
      simulationMessage: simulationData.message,
      countdownSeconds: simulationData.countdown,

      // Real MPESA info (would be filled in production)
      status: "pending",
      requiresAction: true,
      action: 'Enter MPESA PIN on your phone when prompted'
    });

  } catch (error: any) {
    console.error('🔴 [PAYMENT INITIATE] Critical error:', {
      error: error.message,
      stack: error.stack?.split('\n')[0]
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Payment initiation failed',
      message: 'Failed to initiate payment. Please try again.',
      code: 'PAYMENT_INIT_ERROR'
    }, { status: 500 });
  }
}

// ============ REAL MPESA INTEGRATION NOTES ============
/*
For production, replace the simulation with real Safaricom Daraja API:

1. Add MPESA credentials to .env.local:
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_PASSKEY=your_passkey
   MPESA_SHORTCODE=your_shortcode
   MPESA_ENVIRONMENT=production

2. Real MPESA API call:
   const mpesaResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${accessToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       BusinessShortCode: process.env.MPESA_SHORTCODE,
       Password: Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64'),
       Timestamp: timestamp,
       TransactionType: 'CustomerPayBillOnline',
       Amount: INTERVIEW_COST,
       PartyA: formattedPhone,
       PartyB: process.env.MPESA_SHORTCODE,
       PhoneNumber: formattedPhone,
       CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
       AccountReference: `Interview-${interviewId}`,
       TransactionDesc: 'AI Interview Payment'
     })
   });

3. Handle MPESA callback:
   Create /api/mpesa/callback/route.ts to update payment status when MPESA confirms
*/