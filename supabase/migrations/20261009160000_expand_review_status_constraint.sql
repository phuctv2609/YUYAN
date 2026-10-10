-- Migration: Expand review_status check constraint and add unique constraint on simplified
ALTER TABLE public.hsk_master_entries DROP CONSTRAINT IF EXISTS hsk_master_entries_review_status_check;
ALTER TABLE public.hsk_master_entries ADD CONSTRAINT hsk_master_entries_review_status_check 
    CHECK (review_status IN ('verified', 'verified_vi', 'review_required', 'proper_name_or_technical_term', 'translated_pending_review'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hsk_master_entries_simplified_key'
    ) THEN
        ALTER TABLE public.hsk_master_entries ADD CONSTRAINT hsk_master_entries_simplified_key UNIQUE (simplified);
    END IF;
END $$;
