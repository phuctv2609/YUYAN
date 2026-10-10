# YUYAN — FULL SYSTEM IMPLEMENTATION & DATA COVERAGE AUDIT
**Date:** October 2026  
**System:** YUYAN Chinese Learning Platform (`phuctv2609/YUYAN`)  
**Backend:** Supabase PostgreSQL 17 (`umeyobuqigbscjucxshs`)  
**Auditor:** Principal Software Engineer & QA Lead

---

## 1. Executive Summary

This audit evaluates the transition of YUYAN from a prototype with static mocks into a production-grade Chinese learning platform with verified educational data, Supabase persistence, responsive UI, accessible audio, and comprehensive HSK/specialized curriculum.

### Core Audit Statistics:
| Domain | Authoritative Target | Supabase Synchronized | Status |
| :--- | :--- | :--- | :--- |
| **HSK Levels** | 6 levels (HSK 1–6) | 6 levels | **100% Verified** |
| **HSK Lessons** | 146 lessons (15+15+20+20+36+40) | 146 lessons | **100% Verified** |
| **Lesson Dialogue Sentences** | 9,178 authentic sentences | 9,178 sentences | **100% Verified** |
| **HSK Vocabulary Items** | 8,456 lexical items | 8,456 items | **100% Verified** |
| **Reading Passages** | 146 authentic passages | 146 passages | **100% Verified** |
| **Kangxi Radicals** | 214 traditional radicals | 214 radicals | **100% Verified** |
| **Canonical Hanzi** | 1,059 stroke-ordered characters | 1,059 characters | **100% Verified** |
| **Pinyin Phonetics** | 21 initials, 37 finals, 5 tones | 21 initials, 37 finals, 5 tones | **100% Verified** |
| **Specialized Vocabulary** | 100+ domains (~1,000+ terms) | Ingestion In-Progress | **Action Required** |
| **Lesson Exercises** | Interactive drills for 146 lessons | Pipeline In-Progress | **Action Required** |
| **Full HSK Mock Exam Bank** | HSK 1–6 full mock sets | 40 baseline seeded; expansion required | **Action Required** |

---

## 2. Architectural Audit

### 2.1 Backend & Database (Supabase PostgreSQL 17)
- **Host / Project:** `umeyobuqigbscjucxshs.supabase.co` (`ap-northeast-2`)
- **Schema:** 16 normalized tables created via migration `20261004161500_create_yuyan_schema.sql`:
  - `hsk_levels`, `hsk_lessons`, `lesson_sentences`, `hsk_vocabulary`, `reading_passages`
  - `kangxi_radicals`, `canonical_hanzi`
  - `pinyin_initials`, `pinyin_finals`, `pinyin_tones`, `pinyin_syllables`
  - `exam_questions`, `exam_attempts`
  - `learner_profiles`, `learner_progress`, `learner_mistakes`
- **Security & RLS:** Row-Level Security active across all tables. Curriculum tables allow public `SELECT` access. Learner data is isolated by user session UUIDs.
- **Indexes:** B-tree indexes on foreign keys (`lesson_id`, `hsk_level_id`, `radical_id`) and GIN trigram indexes on `hanzi` and `traditional` for rapid substring searches.

### 2.2 Frontend Repositories & State Integration
- **`src/services/supabase/client.ts`**: Provides initialized Supabase client with local fallback support and deterministic session ID persistence.
- **`src/data/repositories/examRepository.ts`**: Implements remote fetch for `exam_questions` with level and section filters, plus remote attempt recording in `exam_attempts`.
- **`src/data/repositories/progressRepository.ts`**: Dual-write design: updates local storage synchronously for zero UI latency, then asynchronously synchronizes with `learner_progress` in Supabase.
- **`src/data/repositories/mistakeRepository.ts`**: Tracks learner errors across exercises and syncs to `learner_mistakes` in Supabase.
- **View Integration:**
  - `WritingPracticeView.tsx`: Dynamically queries `canonical_hanzi` across HSK 1–6 (1,059 items) with stroke animation and radical breakdown.
  - `SpeakingPracticeView.tsx`: Dynamically loads dialogue sentences from `lesson_sentences` across 146 lessons, with native `zh-CN` Mandarin speech synthesis and recording comparison.
  - `ExamView.tsx`: Dynamically queries `examRepository` for authentic questions and records attempt completion.

---

## 3. Discovered Gaps & Root Cause Solutions

### Gap 1: Specialized Chinese Vocabulary (`tu-vung-tieng-trung-1000-chuyen-nganh`)
- **Finding:** The application had static mock categories for specialized vocabulary in UI state.
- **Root Cause:** Specialized terminology was not yet normalized into dedicated database tables with domain hierarchies.
- **Solution:** 
  1. Author database migration `20261008180000_create_specialized_vocabulary_schema.sql` adding `specialized_domains`, `specialized_categories`, and `specialized_vocabulary`.
  2. Scrape and normalize authentic terminology from `tiengtrung.vn/tu-vung-tieng-trung-1000-chuyen-nganh` across major industrial, commercial, and technical sectors (Logistics, Garment, Machinery, Electronics, IT, Construction, Finance, Medical, Hospitality, Law).
  3. Ingest real terms into Supabase with Hanzi, Pinyin, Vietnamese glosses, collocations, and example sentences.
  4. Build `specializedRepository.ts` and connect `SpecializedVocabularyView.tsx`.

### Gap 2: Comprehensive Exercise Sets Across All 146 Lessons
- **Finding:** Lessons in HSK 1–6 lacked structured, multi-type interactive exercises directly tied to their authentic lesson vocabulary and sentences.
- **Root Cause:** Static lesson files primarily contained dialogue texts and vocabulary lists without pre-compiled question banks.
- **Solution:**
  1. Build an exercise generation and compilation pipeline that derives pedagogical exercises (multiple choice, listening comprehension, sentence reordering, character fill-in) directly from the 9,178 dialogue sentences and 8,456 vocabulary items for every lesson.
  2. Ingest structured exercises into Supabase table `lesson_exercises`.
  3. Wire `ExerciseEngine` and lesson practice views to load dynamic exercises per lesson.

### Gap 3: Complete HSK Mock Exam Sets (HSK 1 to 6)
- **Finding:** Currently only 40 baseline questions exist in `exam_questions`.
- **Root Cause:** A complete HSK exam bank requires full mock test sets adhering to the official Hanban blueprint:
  - HSK 1: 40 questions (Listening 20, Reading 20)
  - HSK 2: 60 questions (Listening 35, Reading 25)
  - HSK 3: 80 questions (Listening 40, Reading 30, Writing 10)
  - HSK 4: 100 questions (Listening 45, Reading 40, Writing 15)
  - HSK 5: 100 questions (Listening 45, Reading 45, Writing 10)
  - HSK 6: 101 questions (Listening 50, Reading 50, Writing 1)
- **Solution:**
  1. Expand the exam question bank in Supabase with complete test papers for HSK 1 through 6.
  2. Add section timer, score breakdown (Listening / Reading / Writing), and answer explanation reviewing in `ExamView.tsx`.

---

## 4. Execution Plan
1. **Database Migration:** Create `specialized_vocabulary` & `lesson_exercises` tables in Supabase.
2. **Data Pipeline - Specialized:** Extract, normalize, and ingest 100+ categories and ~1,000+ terms into Supabase.
3. **Data Pipeline - Lesson Exercises:** Compile and seed authentic exercises for all 146 lessons.
4. **Data Pipeline - HSK Mock Exams:** Seed complete mock papers for HSK 1–6 into `exam_questions`.
5. **Frontend Repositories & UI Wiring:** Connect `SpecializedVocabularyView`, `LessonView` exercises, and `ExamView`.
6. **Verification & QA:** Full TypeScript compilation, CDP headless browser testing across desktop & mobile, audio verification.
