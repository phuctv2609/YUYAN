SELECT 'canonical_hanzi' as tbl, count(1) as cnt FROM canonical_hanzi
UNION ALL
SELECT 'specialized_vocabulary', count(1) FROM specialized_vocabulary
UNION ALL
SELECT 'hsk_vocabulary', count(1) FROM hsk_vocabulary
UNION ALL
SELECT 'kangxi_radicals', count(1) FROM kangxi_radicals
UNION ALL
SELECT 'hsk_lessons', count(1) FROM hsk_lessons
UNION ALL
SELECT 'lesson_sentences', count(1) FROM lesson_sentences
UNION ALL
SELECT 'reading_passages', count(1) FROM reading_passages
UNION ALL
SELECT 'lesson_exercises', count(1) FROM lesson_exercises
UNION ALL
SELECT 'exam_questions', count(1) FROM exam_questions
UNION ALL
SELECT 'learner_progress', count(1) FROM learner_progress
UNION ALL
SELECT 'learner_mistakes', count(1) FROM learner_mistakes
UNION ALL
SELECT 'exam_attempts', count(1) FROM exam_attempts;
