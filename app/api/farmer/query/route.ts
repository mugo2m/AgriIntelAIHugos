// app/api/farmer/query/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { FieldValue } from "firebase-admin/firestore";
import { generateAnswer as generateStructuredAnswer } from '@/lib/qaEngine';

// ✅ GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: "Farmer query API is working. Use POST to send questions.",
    status: "online",
    timestamp: new Date().toISOString(),
    supportedCategories: [
      "varieties", "fertilizer", "nutrients", "damage", "seed", "spacing",
      "pest", "disease", "harvest", "water", "margin", "business", "planting"
    ]
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, userId, sessionId, sessionData } = body;

    console.log("📝 Farmer query received:", { question, userId, sessionId });

    if (!question || !userId || !sessionId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 });
    }

    const category = detectCategory(question);

    try {
      const queryRef = db.collection("farmer_sessions")
        .doc(sessionId)
        .collection("queries")
        .doc();

      await queryRef.set({
        id: queryRef.id,
        question,
        category,
        timestamp: new Date().toISOString(),
        userId,
        sessionData: sessionData || null
      });

      await db.collection("farmer_sessions")
        .doc(sessionId)
        .update({
          queryCount: FieldValue.increment(1),
          lastQueryAt: new Date().toISOString()
        });

    } catch (dbError) {
      console.error("Failed to save query to Firebase:", dbError);
    }

    const answer = generateStructuredAnswer(question, sessionData);

    return NextResponse.json({
      success: true,
      answer,
      category
    });

  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process request"
    }, { status: 500 });
  }
}

function detectCategory(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('variet') || q.includes('varity') || q.includes('which type') || q.includes('what type of seed')) {
    return 'varieties';
  }

  if (q.includes('fertilizer') || q.includes('dap') || q.includes('can') ||
      q.includes('npk') || q.includes('manure') || q.includes('topdress')) {
    return 'fertilizer';
  }

  if (q.includes('nutrient') || q.includes('what nutrients') ||
      q.includes('n p k') || q.includes('what does my fertilizer contain') ||
      q.includes('fertilizer composition') || q.includes('secondary nutrients') ||
      q.includes('sulfur') || q.includes('calcium') || q.includes('magnesium') ||
      q.includes('zinc') || q.includes('boron') || q.includes('micronutrient')) {
    return 'nutrients';
  }

  if (q.includes('damage') || q.includes('plants damaged') ||
      q.includes('lost plants') || q.includes('plants died') ||
      q.includes('beyond recovery') || q.includes('crop loss')) {
    return 'damage';
  }

  if (q.includes('seed rate') || q.includes('how many kg') || q.includes('seed per acre')) {
    return 'seed';
  }

  if (q.includes('spacing') || q.includes('distance') || q.includes('how far')) {
    return 'spacing';
  }

  if (q.includes('pest') || q.includes('insect') || q.includes('worm') ||
      q.includes('borer') || q.includes('armyworm')) {
    return 'pest';
  }

  if (q.includes('disease') || q.includes('blight') || q.includes('rust') ||
      q.includes('virus') || q.includes('smut')) {
    return 'disease';
  }

  if (q.includes('harvest') || q.includes('when to pick') || q.includes('storage')) {
    return 'harvest';
  }

  if (q.includes('water') || q.includes('irrigation') || q.includes('drought')) {
    return 'water';
  }

  if (q.includes('gross margin') || q.includes('profit') || q.includes('revenue') ||
      q.includes('cost') || q.includes('roi')) {
    return 'margin';
  }

  if (q.includes('business') || q.includes('money') || q.includes('invest')) {
    return 'business';
  }

  if (q.includes('plant') || q.includes('when to plant') || q.includes('planting time') ||
      q.includes('sow') || q.includes('sowing') || q.includes('best time to plant')) {
    return 'planting';
  }

  return 'default';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}