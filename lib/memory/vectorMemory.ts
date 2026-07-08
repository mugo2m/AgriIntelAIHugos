// lib/memory/vectorMemory.ts
"use server";

export interface VectorEntry {
  id: string;
  userId: string;
  text: string;
  embedding: number[]; // Mock for now - in real app would use actual embeddings
  metadata: {
    type: 'question' | 'answer' | 'concept' | 'feedback';
    category?: string;
    difficulty?: string;
    score?: number;
    tags?: string[];
  };
  timestamp: string;
}

const vectorStore = new Map<string, VectorEntry[]>();

// Simple mock embedding generator
function generateMockEmbedding(text: string): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }
  return embedding;
}

// Simple cosine similarity for mock embeddings
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function storeVector(userId: string, text: string, metadata?: any): Promise<string> {
  try {
    const id = `vector_${Date.now()}_${userId}`;
    const timestamp = new Date().toISOString();

    const vectorEntry: VectorEntry = {
      id,
      userId,
      text,
      embedding: generateMockEmbedding(text),
      metadata: {
        type: metadata?.type || 'concept',
        category: metadata?.category,
        difficulty: metadata?.difficulty,
        score: metadata?.score,
        tags: metadata?.tags || []
      },
      timestamp
    };

    const userVectors = vectorStore.get(userId) || [];
    userVectors.push(vectorEntry);
    vectorStore.set(userId, userVectors);

    console.log("🔢 Vector stored:", {
      id,
      userId,
      textLength: text.length,
      type: vectorEntry.metadata.type
    });

    return id;
  } catch (error) {
    console.error("Error storing vector:", error);
    throw error;
  }
}

export async function searchVectors(userId: string, query: string, limit: number = 5): Promise<VectorEntry[]> {
  try {
    const userVectors = vectorStore.get(userId) || [];

    if (userVectors.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = generateMockEmbedding(query);

    // Calculate similarities
    const vectorsWithSimilarity = userVectors.map(vector => ({
      vector,
      similarity: cosineSimilarity(queryEmbedding, vector.embedding)
    }));

    // Sort by similarity (descending) and take top results
    return vectorsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.vector);
  } catch (error) {
    console.error("Error searching vectors:", error);
    return [];
  }
}

export async function getSimilarQuestions(userId: string, question: string, limit: number = 3): Promise<VectorEntry[]> {
  try {
    const userVectors = vectorStore.get(userId) || [];

    const questionVectors = userVectors.filter(v =>
      v.metadata.type === 'question' || v.text.toLowerCase().includes('?')
    );

    if (questionVectors.length === 0) {
      return [];
    }

    const queryEmbedding = generateMockEmbedding(question);

    const vectorsWithSimilarity = questionVectors.map(vector => ({
      vector,
      similarity: cosineSimilarity(queryEmbedding, vector.embedding)
    }));

    return vectorsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.vector);
  } catch (error) {
    console.error("Error getting similar questions:", error);
    return [];
  }
}

export async function getVectorsByType(userId: string, type: VectorEntry['metadata']['type']): Promise<VectorEntry[]> {
  try {
    const userVectors = vectorStore.get(userId) || [];

    return userVectors
      .filter(v => v.metadata.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Error getting vectors by type:", error);
    return [];
  }
}

export async function clearUserVectors(userId: string): Promise<void> {
  try {
    vectorStore.delete(userId);
    console.log("🧹 Cleared vectors for user:", userId);
  } catch (error) {
    console.error("Error clearing vectors:", error);
    throw error;
  }
}