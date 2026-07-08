// app/api/payment/check/route.ts - WITH AGGRESSIVE CACHING
import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/firebase/admin";

const INTERVIEW_COST = 3;

// ============ AGGRESSIVE CACHE ============
const paymentCache = new Map();
const CACHE_TTL = 60000; // 10 seconds cache

function getCacheKey(interviewId: string, userId: string): string {
  return `${userId}_${interviewId}`;
}

// Clean old cache entries periodically
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of paymentCache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      paymentCache.delete(key);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { interviewId, userId } = await req.json();

    // ⭐ DIAGNOSTIC: Track where calls are coming from
    const referer = req.headers.get('referer') || 'unknown';
    const isInterviewPage = referer.includes('/interview/');

    console.log('🔍 [PAYMENT CHECK DIAGNOSTIC]', {
      interviewId: interviewId?.substring(0, 10) + '...',
      userId: userId?.substring(0, 8) + '...',
      source: isInterviewPage ? 'INTERVIEW_PAGE' : 'OTHER',
      timestamp: new Date().toLocaleTimeString(),
      cacheSize: paymentCache.size
    });

    if (!interviewId || !userId) {
      return NextResponse.json({
        hasPaid: false,
        message: 'Missing parameters',
        cost: INTERVIEW_COST
      });
    }

    // ============ CHECK CACHE FIRST ============
    const cacheKey = getCacheKey(interviewId, userId);
    const cached = paymentCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 [PAYMENT CHECK] Returning cached result (10s TTL)');
      return NextResponse.json(cached.data);
    }

    const db = getDB();
    if (!db) {
      return NextResponse.json({
        hasPaid: false,
        message: 'Database unavailable',
        cost: INTERVIEW_COST
      });
    }

    // ============ SINGLE OPTIMIZED QUERY ============
    const paymentQuery = await db.collection("payments")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .where("status", "in", ["paid", "success", "completed"])
      .where("amount", "==", INTERVIEW_COST)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let responseData;

    if (!paymentQuery.empty) {
      const paymentDoc = paymentQuery.docs[0];
      const payment = paymentDoc.data();
      const isUnused = payment.used === false;

      console.log('✅ [PAYMENT CHECK] Found payment:', {
        paymentId: paymentDoc.id,
        isUnused,
        used: payment.used || false,
        amount: payment.amount
      });

      if (isUnused) {
        responseData = {
          hasPaid: true,
          isNewPayment: false,
          amount: payment.amount,
          currency: payment.currency || "KES",
          transactionId: payment.transactionId || payment.mpesaReceipt || paymentDoc.id,
          paidAt: payment.paidAt || payment.createdAt,
          message: 'Payment verified (unused)'
        };
      } else {
        // Payment exists but has been used
        responseData = {
          hasPaid: false,
          paymentExistsButUsed: true,
          cost: INTERVIEW_COST,
          currency: "KES",
          message: 'Payment already used for this interview'
        };
      }
    } else {
      // No payment found at all
      console.log('💰 [PAYMENT CHECK] Result:', {
        hasPayment: false,
        interviewId: interviewId.substring(0, 10) + '...'
      });

      responseData = {
        hasPaid: false,
        cost: INTERVIEW_COST,
        currency: "KES",
        message: 'No payment found'
      };
    }

    // ============ CACHE THE RESULT ============
    paymentCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData
    });

    // Clean up old cache entries occasionally
    if (paymentCache.size > 100) {
      cleanupCache();
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('🔴 [PAYMENT CHECK] Error:', error.message);
    return NextResponse.json({
      hasPaid: false,
      error: error.message,
      cost: INTERVIEW_COST,
      message: 'Error checking payment'
    });
  }
}