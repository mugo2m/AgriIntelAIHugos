// app/api/offline/sync/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Handle different offline actions
    switch (data.action) {
      case 'save_answer':
        // Save to Firebase
        await db.collection('offline_answers').add({
          ...data.payload,
          syncedAt: new Date().toISOString()
        });
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Offline sync endpoint',
    version: '1.0'
  });
}