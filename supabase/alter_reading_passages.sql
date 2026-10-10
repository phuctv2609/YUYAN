ALTER TABLE public.reading_passages 
ADD COLUMN IF NOT EXISTS repair_provenance JSONB;
