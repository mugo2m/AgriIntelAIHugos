// lib/rag/embeddings.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase/client";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Force 768 dimensions for database consistency
const TARGET_DIMENSION = 768;

const embeddingCache = new Map<string, number[]>();

const EMBEDDING_MODELS = [
  "models/embedding-001",
  "models/text-embedding-004",
  "models/gemini-embedding-exp-03-07"
];

let workingModel: string | null = null;

async function getWorkingEmbeddingModel() {
  if (workingModel) return workingModel;

  for (const modelName of EMBEDDING_MODELS) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      await testModel.embedContent("test");
      workingModel = modelName;
      console.log(`✅ Using embedding model: ${modelName}`);
      return modelName;
    } catch (e) {
      console.log(`⚠️ Model ${modelName} not available, trying next...`);
    }
  }

  console.warn("⚠️ No embedding models available, using fallback");
  return null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const cacheKey = createHash('sha256').update(text).digest('hex');

    // Check memory cache
    if (embeddingCache.has(cacheKey)) {
      console.log("🎯 Embedding cache HIT (memory)");
      return embeddingCache.get(cacheKey)!;
    }

    // Check Supabase cache
    const { data: cached } = await supabase
      .from('embedding_cache')
      .select('embedding')
      .eq('text_hash', cacheKey)
      .single();

    if (cached) {
      console.log("🎯 Embedding cache HIT (database)");
      embeddingCache.set(cacheKey, cached.embedding);
      return cached.embedding;
    }

    const modelName = await getWorkingEmbeddingModel();

    if (!modelName) {
      console.warn("⚠️ No embedding model, using zero vector");
      return new Array(TARGET_DIMENSION).fill(0);
    }

    console.log("🔄 Generating new embedding...");
    const model = genAI.getGenerativeModel({ model: modelName });

    // Try with dimension control if model supports it
    try {
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: TARGET_DIMENSION
      });
      var embedding = result.embedding.values;
    } catch {
      // Fallback to standard embedContent
      const result = await model.embedContent(text);
      var embedding = result.embedding.values.slice(0, TARGET_DIMENSION);
    }

    embeddingCache.set(cacheKey, embedding);

    supabase.from('embedding_cache').insert({
      text_hash: cacheKey,
      text: text.substring(0, 1000),
      embedding: embedding,
      created_at: new Date().toISOString()
    }).then().catch(console.error);

    return embedding;
  } catch (error) {
    console.error("❌ Embedding generation failed:", error);
    return new Array(TARGET_DIMENSION).fill(0);
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      embeddings.push(new Array(TARGET_DIMENSION).fill(0));
    }
  }
  return embeddings;
}