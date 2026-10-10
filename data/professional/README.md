# YUYAN Professional Vocabulary v2

## Purpose
This package is a remediation of `Yuyan_Professional_Vocabulary_10000_v1(1).zip`.

## Important
- The untouched v1 source is preserved under `source_raw/`.
- All 10,000 source rows remain represented. No source data was silently deleted.
- Obvious duplicated-full-string Hanzi were corrected.
- Obvious Vietnamese template duplication/head-order issues were conservatively normalized.
- The invalid self-only `collocations` field was cleared rather than pretending the term is a collocation.
- New original example sentences were generated per professional category and are explicitly marked `yuyan_generated_original` + `review_required`.
- Taxonomy anomalies are flagged rather than silently reassigned.
- Same-category/subcategory duplicate rows are retained for provenance but hidden from the customer view until reviewed.

## Release rule
Do NOT publish all rows automatically. The database import is safe, but `status=review_required` and `customer_visible=false` intentionally block accidental publication.

## Key files
- `source_raw/` — untouched original package
- `production_data/yuyan_professional_vocabulary_10000_v2.csv`
- `production_data/yuyan_professional_vocabulary_10000_v2.json`
- `production_data/yuyan_professional_categories_v2.csv`
- `production_data/supabase_schema_v2.sql`
- `reports/REMEDIATION_REPORT.md`
- `reports/REVIEW_QUEUE.csv`
- `reports/TAXONOMY_REVIEW.csv`
- `reports/DATA_FIX_LOG.csv`

## Verified source reference
The `tiengtrung.vn` master page lists many specialist topic categories and states that the content was compiled as a large specialist vocabulary reference. YUYAN must preserve provenance and should not claim that generated examples are copied from that source.
