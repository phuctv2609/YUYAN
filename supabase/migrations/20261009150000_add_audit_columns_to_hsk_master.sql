-- Migration: Add audit tracking columns to public.hsk_master_entries
ALTER TABLE public.hsk_master_entries
ADD COLUMN IF NOT EXISTS localization_method VARCHAR(64) DEFAULT 'cvdict_canonical_match',
ADD COLUMN IF NOT EXISTS reviewer VARCHAR(64) DEFAULT 'yuyan_lead_linguist',
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NOW();

-- Create table for AI Word Usage Cache to support fast, deduplicated, persistent AI explanations
CREATE TABLE IF NOT EXISTS public.ai_word_usage_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(64) NOT NULL,
    context_hash VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    explanation_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ai_word_cache UNIQUE (word, context_hash, prompt_version)
);

CREATE INDEX IF NOT EXISTS idx_ai_word_cache_lookup ON public.ai_word_usage_cache(word, prompt_version);

-- Enable RLS on ai_word_usage_cache
ALTER TABLE public.ai_word_usage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on ai_word_usage_cache"
ON public.ai_word_usage_cache FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anonymous insert on ai_word_usage_cache"
ON public.ai_word_usage_cache FOR INSERT TO anon, authenticated WITH CHECK (true);
