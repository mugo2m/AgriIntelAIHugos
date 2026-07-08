// lib/utils/hash.ts
import { createHash } from 'crypto';

// Simple hash function
export function simpleHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .replace(/[^\w\s]/g, '')       // Remove punctuation (optional)
    .substring(0, 1000);           // Limit length

  return createHash('md5').update(normalized).digest('hex');
}

// Hash for question + answer
export function hashQnA(question: string, answer: string): string {
  const combined = `${question.trim()}:${answer.trim()}`.toLowerCase();
  return simpleHash(combined);
}

// Quick similarity check (basic word overlap)
export function quickSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = new Set(
    text1.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  );

  const words2 = new Set(
    text2.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return union > 0 ? intersection / union : 0;
}