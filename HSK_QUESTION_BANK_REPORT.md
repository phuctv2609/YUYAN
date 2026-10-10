# YUYAN — HSK QUESTION BANK & EXAM ARCHITECTURE REPORT
**Curriculum Scope:** Standard HSK Mock Test Papers & Question Banks (HSK 1 to HSK 6)  
**Database Tables:** `public.exam_questions`, `public.lesson_exercises`  
**Host:** Supabase PostgreSQL 17 (`umeyobuqigbscjucxshs`)  
**Status:** Ingested & Verified  
**Date:** October 2026

---

## 1. Structure of Question Banks

YUYAN divides educational questions into two specialized banks:

1. **Lesson Practice Bank (`lesson_exercises`):** 1,534 interactive questions tailored directly to individual lessons for immediate post-study reinforcement across 146 lessons.
2. **Official Exam Mock Bank (`exam_questions`):** Standard HSK mock examination test sets structured in full accordance with the official Hanban test blueprint (modeled after `chinesetest.online`).

---

## 2. Standard HSK Mock Blueprint

| Level | Sections | Question Count | Duration | Passing Score |
| :--- | :--- | :--- | :--- | :--- |
| **HSK 1** | Nghe (20 câu) + Đọc hiểu (20 câu) | 40 câu | 40 phút | 120 / 200 điểm |
| **HSK 2** | Nghe (35 câu) + Đọc hiểu (25 câu) | 60 câu | 55 phút | 120 / 200 điểm |
| **HSK 3** | Nghe (40 câu) + Đọc hiểu (30 câu) + Viết (10 câu) | 80 câu | 90 phút | 180 / 300 điểm |
| **HSK 4** | Nghe (45 câu) + Đọc hiểu (40 câu) + Viết (15 câu) | 100 câu | 105 phút | 180 / 300 điểm |
| **HSK 5** | Nghe (45 câu) + Đọc hiểu (45 câu) + Viết (10 câu) | 100 câu | 125 phút | 180 / 300 điểm |
| **HSK 6** | Nghe (50 câu) + Đọc hiểu (50 câu) + Viết (1 bài) | 101 câu | 140 phút | 180 / 300 điểm |

---

## 3. Question Bank Features
- **Pinyin Orthography:** Verified tone marks across all audio and reading questions.
- **Answer Recording:** User attempt results are logged into `exam_attempts` and mistakes routed to `learner_mistakes`.
- **Review Mode:** Learners can review their exact mistakes with clear grammatical explanations and native audio playback.
