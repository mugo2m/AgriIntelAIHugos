// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. RAG features will be limited.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Initialize database schema (run this once)
export async function initDatabaseSchema() {
  // Enable pgvector
  await supabase.rpc('exec_sql', {
    sql_string: 'CREATE EXTENSION IF NOT EXISTS vector;'
  });

  // Create farming knowledge table
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS farming_knowledge (
        id BIGSERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(768),
        crop_type TEXT[],
        region TEXT,
        county TEXT[],
        season TEXT,
        soil_type TEXT,
        pest_type TEXT[],
        disease_type TEXT[],
        category TEXT,
        confidence_score FLOAT DEFAULT 1.0,
        source_url TEXT,
        thumbnail TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_farming_knowledge_crop_type
        ON farming_knowledge USING gin (crop_type);
      CREATE INDEX IF NOT EXISTS idx_farming_knowledge_region
        ON farming_knowledge (region);
      CREATE INDEX IF NOT EXISTS idx_farming_knowledge_category
        ON farming_knowledge (category);
    `
  });

  // Create embedding cache table
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS embedding_cache (
        id BIGSERIAL PRIMARY KEY,
        text_hash TEXT UNIQUE NOT NULL,
        text TEXT,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT NOW(),
        hits INTEGER DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_embedding_cache_hash
        ON embedding_cache (text_hash);
    `
  });

  // Create ingested documents table
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS ingested_documents (
        id BIGSERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        source_type TEXT,
        file_type TEXT,
        metadata JSONB,
        user_id TEXT,
        chunks_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  });

  // Create knowledge chunks table
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id BIGSERIAL PRIMARY KEY,
        document_id BIGINT REFERENCES ingested_documents(id),
        content TEXT NOT NULL,
        embedding vector(768),
        chunk_type TEXT,
        chunk_index INTEGER,
        metadata JSONB,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
        ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
    `
  });

  // Create search cache table
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS search_cache (
        id BIGSERIAL PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        query TEXT,
        filters JSONB,
        results JSONB,
        hits INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_search_cache_key
        ON search_cache (cache_key);
    `
  });

  // Create hybrid search function
  await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE OR REPLACE FUNCTION hybrid_search_farming(
        query_text TEXT,
        query_embedding vector(768),
        filter_conditions TEXT DEFAULT '',
        match_count INTEGER DEFAULT 10
      )
      RETURNS TABLE(
        id BIGINT,
        content TEXT,
        similarity FLOAT,
        metadata JSONB,
        source_url TEXT,
        thumbnail TEXT
      ) AS $$
      BEGIN
        RETURN QUERY EXECUTE '
          SELECT
            fk.id,
            fk.content,
            (1 - (fk.embedding <=> $1)) * 0.7 +
            COALESCE(ts_rank(to_tsvector(''english'', fk.content), plainto_tsquery(''english'', $2)), 0) * 0.3 AS similarity,
            fk.metadata,
            fk.source_url,
            fk.thumbnail
          FROM farming_knowledge fk
          WHERE (1 - (fk.embedding <=> $1) > 0.5
            OR to_tsvector(''english'', fk.content) @@ plainto_tsquery(''english'', $2))
            ' || COALESCE(filter_conditions, '') || '
          ORDER BY similarity DESC
          LIMIT $3
        ' USING query_embedding, query_text, match_count;
      END;
      $$ LANGUAGE plpgsql;
    `
  });
}