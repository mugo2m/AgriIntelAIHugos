import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Dynamically import supabase and ingestion
    const { supabase } = await import('@/lib/supabase/client');
    const { ingestDocument } = await import('@/lib/rag/ingestion');
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("farming-documents")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("farming-documents")
      .getPublicUrl(filePath);

    // Process with RAG ingestion
    const ingestionResult = await ingestDocument({
      source: file,
      sourceType: 'file',
      fileType: file.name.split('.').pop() as any,
      metadata: {
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      file: {
        path: filePath,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      },
      rag: ingestionResult
    });

  } catch (error: any) {
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}