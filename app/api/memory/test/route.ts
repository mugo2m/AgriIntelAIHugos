import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Memory API is working",
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/memory/performance - POST',
      '/api/memory/test - GET'
    ]
  });
}