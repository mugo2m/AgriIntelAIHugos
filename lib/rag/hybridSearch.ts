// lib/rag/hybridSearch.ts
import { supabase } from "@/lib/supabase/client";
import { generateEmbedding } from "./embeddings";
import { CacheManager } from "./cacheManager";

export interface SearchFilters {
  cropType?: string[];
  region?: string;
  county?: string[];
  category?: string;
  pestType?: string[];
  diseaseType?: string[];
  season?: string;
  soilType?: string;
  minConfidence?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
  source_url?: string;
  thumbnail?: string;
}

export async function hybridSearch(
  query: string,
  filters: SearchFilters = {},
  userContext?: {
    crops?: string[];
    county?: string;
  }
): Promise<SearchResult[]> {
  try {
    const startTime = Date.now();

    // Merge user context with filters
    const contextualFilters = {
      ...filters,
      cropType: filters.cropType || userContext?.crops,
      region: filters.region || userContext?.county
    };

    // Check cache first
    const cacheKey = `search:${query}:${JSON.stringify(contextualFilters)}`;
    const cached = await CacheManager.get<SearchResult[]>(cacheKey);
    if (cached) {
      console.log(`🎯 Search cache HIT (${Date.now() - startTime}ms)`);
      return cached;
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Build dynamic filter conditions
    let filterConditions = [];

    if (contextualFilters.cropType?.length) {
      filterConditions.push(`crop_type && ARRAY['${contextualFilters.cropType.join("','")}']`);
    }

    if (contextualFilters.region) {
      filterConditions.push(`region = '${contextualFilters.region}'`);
    }

    if (contextualFilters.county?.length) {
      filterConditions.push(`metadata->>'county' IN (${contextualFilters.county.map(c => `'${c}'`).join(',')})`);
    }

    if (contextualFilters.category) {
      filterConditions.push(`metadata->>'category' = '${contextualFilters.category}'`);
    }

    if (contextualFilters.pestType?.length) {
      filterConditions.push(`pest_type && ARRAY['${contextualFilters.pestType.join("','")}']`);
    }

    if (contextualFilters.season) {
      filterConditions.push(`season = '${contextualFilters.season}'`);
    }

    const filterSql = filterConditions.length > 0
      ? `AND ${filterConditions.join(' AND ')}`
      : '';

    // Execute hybrid search with PostgreSQL
    const { data, error } = await supabase.rpc('hybrid_search_farming', {
      query_text: query,
      query_embedding: queryEmbedding,
      filter_conditions: filterSql,
      match_count: filters.limit || 10
    });

    if (error) throw error;

    const results = (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      similarity: item.similarity,
      metadata: item.metadata || {},
      source_url: item.source_url,
      thumbnail: item.thumbnail
    }));

    // Cache results (1 hour TTL)
    await CacheManager.set(cacheKey, results, 3600);

    console.log(`✅ Hybrid search returned ${results.length} results in ${Date.now() - startTime}ms`);

    return results;
  } catch (error) {
    console.error("❌ Hybrid search failed:", error);
    return [];
  }
}

export async function semanticSearch(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);

  let queryBuilder = supabase
    .rpc('match_farming_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: filters.limit || 10
    });

  // Apply filters
  if (filters.cropType?.length) {
    queryBuilder = queryBuilder.overlaps('crop_type', filters.cropType);
  }

  if (filters.region) {
    queryBuilder = queryBuilder.eq('region', filters.region);
  }

  const { data, error } = await queryBuilder;

  if (error) throw error;

  return data || [];
}

export async function keywordSearch(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResult[]> {
  let queryBuilder = supabase
    .from('farming_knowledge')
    .select('*')
    .textSearch('content', query, {
      type: 'websearch',
      config: 'english'
    });

  // Apply filters
  if (filters.cropType?.length) {
    queryBuilder = queryBuilder.overlaps('crop_type', filters.cropType);
  }

  const { data, error } = await queryBuilder.limit(filters.limit || 10);

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    similarity: 0.5 // Default for keyword matches
  }));
}