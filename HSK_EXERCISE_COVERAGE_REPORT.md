# YUYAN — HSK EXERCISE COVERAGE REPORT
**Curriculum Scope:** HSK 1 to HSK 6 (146 Lessons)  
**Database Table:** `public.lesson_exercises` in Supabase PostgreSQL 17 (`umeyobuqigbscjucxshs`)  
**Status:** 100% Ingested & Verified  
**Date:** October 2026

---

## 1. Executive Summary
Every single lesson across the entire 6-level HSK curriculum now features a structured suite of multi-modality exercises directly grounded in that lesson's authentic dialogue sentences and vocabulary items.

- **Total Lessons Covered:** 146 / 146 (100% Complete)
- **Total Interactive Exercises:** 1,534 authentic questions
- **Exercise Modalities:**
  1. `vocabulary_meaning`: Nghĩa tiếng Việt của từ mới trong bài
  2. `pinyin_matching`: Phiên âm Pinyin chuẩn của chữ Hán
  3. `fill_blank`: Điền từ thích hợp vào câu bài khóa
  4. `sentence_order`: Sắp xếp trật tự từ ngữ theo ngữ pháp câu
  5. `listening_comprehension`: Nghe câu thoại bản xứ và chọn ý nghĩa

---

## 2. Level-by-Level Distribution

| HSK Level | Total Lessons | Exercises Seeded | Average / Lesson | Exercise Types |
| :--- | :--- | :--- | :--- | :--- |
| **HSK 1** | 15 lessons (Bài 1–15) | 165 exercises | 11.0 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **HSK 2** | 15 lessons (Bài 1–15) | 165 exercises | 11.0 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **HSK 3** | 20 lessons (Bài 1–20) | 220 exercises | 11.0 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **HSK 4** | 20 lessons (Bài 1–20) | 215 exercises | 10.8 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **HSK 5** | 36 lessons (Bài 1–36) | 374 exercises | 10.4 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **HSK 6** | 40 lessons (Bài 1–40) | 395 exercises | 9.9 | Vocab, Pinyin, Điền từ, Xếp câu, Luyện nghe |
| **TOTAL** | **146 Lessons** | **1,534 Exercises** | **10.5** | **Full Multi-Modal Drills** |

---

## 3. Data Integrity & Pedagogical Rules

1. **Foreign Key Integrity:** All records link to `lesson_id` referencing `hsk_lessons(lesson_id)` with `ON DELETE CASCADE`.
2. **Authentic Source Grounding:** All distractor options are drawn from the same lesson's vocabulary bank or level cohort, preventing arbitrary or anachronistic choices.
3. **Vietnamese Explanations:** Every exercise contains detailed `explanation_vi` breaking down the sentence structure and vocabulary nuance.
4. **Mandarin Speech Synthesis:** Each question is equipped with `audio_text` enabling native `zh-CN` Mandarin playback.
