// lib/rag/ingestion.ts
import { supabase } from "@/lib/supabase/client";
import { generateEmbedding, generateBatchEmbeddings } from "./embeddings";
import { chunkDocument, chunkByPages, chunkTable } from "./chunking";
import { processImage } from "./multimodal";
import { CacheManager } from "./cacheManager";

// PDF parsing
//import pdf from 'pdf-parse';
import * as pdf from 'pdf-parse';
// Excel parsing
import * as XLSX from 'xlsx';
// PPT parsing
import pptxParser from 'pptx-parser';
// DOCX parsing
import mammoth from 'mammoth';

export interface IngestOptions {
  source: string | File;
  sourceType: 'url' | 'file';
  fileType: 'pdf' | 'xlsx' | 'pptx' | 'docx' | 'csv' | 'jpg' | 'png' | 'txt';
  metadata?: Record<string, any>;
  userId?: string;
}

export async function ingestDocument(options: IngestOptions): Promise<{
  success: boolean;
  chunksCount: number;
  documentId?: string;
  error?: string;
}> {
  try {
    console.log(`📥 Ingesting ${options.fileType} document from ${options.sourceType}`);

    // Extract text/content based on file type
    let extractedContent: {
      text: string;
      images?: Buffer[];
      tables?: any[];
      pages?: { text: string; pageNumber: number }[];
    } = { text: '' };

    if (options.fileType === 'pdf') {
      extractedContent = await extractFromPDF(options.source);
    } else if (options.fileType === 'xlsx' || options.fileType === 'csv') {
      extractedContent = await extractFromExcel(options.source, options.fileType);
    } else if (options.fileType === 'pptx') {
      extractedContent = await extractFromPPT(options.source);
    } else if (options.fileType === 'docx') {
      extractedContent = await extractFromDOCX(options.source);
    } else if (options.fileType === 'jpg' || options.fileType === 'png') {
      extractedContent = await extractFromImage(options.source);
    } else {
      extractedContent = await extractFromText(options.source);
    }

    // Create chunks from text
    const textChunks = chunkDocument(extractedContent.text, {
      metadata: {
        ...options.metadata,
        source: options.source,
        fileType: options.fileType,
        ingestedAt: new Date().toISOString()
      }
    });

    // Create chunks from tables if any
    const tableChunks = (extractedContent.tables || []).flatMap((table, idx) =>
      chunkTable(table.data, table.headers, {
        ...options.metadata,
        tableIndex: idx,
        source: options.source
      })
    );

    // Process images if any
    const imageChunks = await Promise.all(
      (extractedContent.images || []).map(async (image, idx) => {
        const processed = await processImage(image, {
          ...options.metadata,
          imageIndex: idx
        });
        return {
          content: processed.description,
          embedding: processed.embedding,
          metadata: processed.metadata,
          thumbnail: processed.thumbnail
        };
      })
    );

    // Combine all chunks
    const allChunks = [
      ...textChunks.map(c => ({ ...c, type: 'text' })),
      ...tableChunks.map(c => ({ ...c, type: 'table' })),
      ...imageChunks.map(c => ({ ...c, type: 'image' }))
    ];

    // Generate embeddings for all chunks
    const embeddings = await generateBatchEmbeddings(
      allChunks.map(c => c.content)
    );

    // Store in Supabase
    const { data: document, error: docError } = await supabase
      .from('ingested_documents')
      .insert({
        source: options.source,
        source_type: options.sourceType,
        file_type: options.fileType,
        metadata: options.metadata,
        user_id: options.userId,
        chunks_count: allChunks.length,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (docError) throw docError;

    // Store chunks with embeddings
    const chunkInserts = allChunks.map((chunk, idx) => ({
      document_id: document.id,
      content: chunk.content,
      embedding: embeddings[idx],
      chunk_type: chunk.type,
      chunk_index: chunk.index,
      metadata: chunk.metadata,
      thumbnail: (chunk as any).thumbnail,
      created_at: new Date().toISOString()
    }));

    const { error: chunkError } = await supabase
      .from('knowledge_chunks')
      .insert(chunkInserts);

    if (chunkError) throw chunkError;

    // Invalidate search cache since new content added
    await CacheManager.invalidate('search:*');

    console.log(`✅ Successfully ingested ${allChunks.length} chunks`);

    return {
      success: true,
      chunksCount: allChunks.length,
      documentId: document.id
    };

  } catch (error: any) {
    console.error("❌ Ingestion failed:", error);
    return {
      success: false,
      chunksCount: 0,
      error: error.message
    };
  }
}

// Extraction helpers
async function extractFromPDF(source: string | File): Promise<any> {
  const buffer = source instanceof File
    ? Buffer.from(await source.arrayBuffer())
    : await fetch(source).then(r => r.buffer());

  const data = await pdf(buffer);

  return {
    text: data.text,
    pages: data.text.split('\n\n').map((text, idx) => ({
      text,
      pageNumber: idx + 1
    }))
  };
}

async function extractFromExcel(source: string | File, type: string): Promise<any> {
  const buffer = source instanceof File
    ? Buffer.from(await source.arrayBuffer())
    : await fetch(source).then(r => r.buffer());

  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet);
  const headers = Object.keys(data[0] || {});

  // Convert to readable text
  const text = data.map((row: any, idx) =>
    `Row ${idx + 1}: ${Object.entries(row).map(([k, v]) => `${k}=${v}`).join(', ')}`
  ).join('\n');

  return {
    text,
    tables: [{
      headers,
      data
    }]
  };
}

async function extractFromPPT(source: string | File): Promise<any> {
  const buffer = source instanceof File
    ? Buffer.from(await source.arrayBuffer())
    : await fetch(source).then(r => r.buffer());

  const presentation = await pptxParser(buffer);

  const slides = presentation.slides.map((slide: any, idx: number) => ({
    text: slide.text || '',
    pageNumber: idx + 1
  }));

  return {
    text: slides.map(s => s.text).join('\n\n'),
    pages: slides
  };
}

async function extractFromDOCX(source: string | File): Promise<any> {
  const buffer = source instanceof File
    ? Buffer.from(await source.arrayBuffer())
    : await fetch(source).then(r => r.buffer());

  const result = await mammoth.extractRawText({ buffer });

  return { text: result.value };
}

async function extractFromImage(source: string | File): Promise<any> {
  // Process image through multimodal
  const processed = await processImage(source, {});

  return {
    text: processed.description,
    images: [source instanceof File ? Buffer.from(await source.arrayBuffer()) : source]
  };
}

async function extractFromText(source: string | File): Promise<any> {
  if (source instanceof File) {
    return { text: await source.text() };
  }
  const response = await fetch(source);
  return { text: await response.text() };
}