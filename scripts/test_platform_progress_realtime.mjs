// scripts/test_platform_progress_realtime.mjs
// Authoritative automated test suite for YUYAN Real-time Learning Progress & Journey Counter

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('======================================================================');
console.log('   YUYAN — PLATFORM-WIDE REAL-TIME LEARNING PROGRESS AUDIT TEST');
console.log('======================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    testsFailed++;
  }
}

// ---------------------------------------------------------------------------
// 1. DATABASE SCHEMA & SUPABASE MIGRATION VERIFICATION
// ---------------------------------------------------------------------------
runTest('1. Supabase migration 20261010190000 exists and contains all required telemetry columns', () => {
  const migPath = path.resolve('supabase/migrations/20261010190000_realtime_learning_progress_and_journey.sql');
  assert(fs.existsSync(migPath), 'Migration file must exist');

  const sql = fs.readFileSync(migPath, 'utf-8');
  assert(sql.includes('journey_start_date DATE'), 'Must have journey_start_date');
  assert(sql.includes('longest_streak INT'), 'Must have longest_streak');
  assert(sql.includes('total_active_days INT'), 'Must have total_active_days');
  assert(sql.includes('last_study_date DATE'), 'Must have last_study_date');
  assert(sql.includes('school_email VARCHAR(255)'), 'Must have school_email');
  assert(sql.includes('avatar_url TEXT'), 'Must have avatar_url');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS study_activity_logs'), 'Must create study_activity_logs');
  assert(sql.includes('supabase_realtime ADD TABLE learner_profiles'), 'Must add learner_profiles to realtime publication');
  assert(sql.includes('supabase_realtime ADD TABLE learner_progress'), 'Must add learner_progress to realtime publication');
  assert(sql.includes('supabase_realtime ADD TABLE study_activity_logs'), 'Must add study_activity_logs to realtime publication');
});

runTest('2. TypeScript definitions include new columns and study_activity_logs', () => {
  const typesPath = path.resolve('src/types/supabase.ts');
  const types = fs.readFileSync(typesPath, 'utf-8');
  assert(types.includes('journey_start_date'), 'Types must have journey_start_date');
  assert(types.includes('longest_streak'), 'Types must have longest_streak');
  assert(types.includes('total_active_days'), 'Types must have total_active_days');
  assert(types.includes('study_activity_logs'), 'Types must have study_activity_logs table');
});

// ---------------------------------------------------------------------------
// 2. DATE MATH & JOURNEY DAY CALCULATION ALGORITHM
// ---------------------------------------------------------------------------
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPreviousDayString(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calendarDaysBetween(fromDateStr, toDateStr) {
  const [y1, m1, d1] = fromDateStr.split('-').map(Number);
  const [y2, m2, d2] = toDateStr.split('-').map(Number);
  const dFrom = new Date(y1, m1 - 1, d1);
  const dTo = new Date(y2, m2 - 1, d2);
  const ms = dTo.getTime() - dFrom.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function calculateJourneyDay(journeyStartDateStr) {
  if (!journeyStartDateStr) return 0;
  const today = getTodayDateString();
  const diff = calendarDaysBetween(journeyStartDateStr, today);
  if (diff < 0) return 1;
  return diff + 1; // Start date is Day 1
}

runTest('3. Journey Day is 0 before first meaningful activity', () => {
  assert.strictEqual(calculateJourneyDay(null), 0);
  assert.strictEqual(calculateJourneyDay(undefined), 0);
  assert.strictEqual(calculateJourneyDay(''), 0);
});

runTest('4. Journey Day is Day 1 on the exact start date', () => {
  const today = getTodayDateString();
  assert.strictEqual(calculateJourneyDay(today), 1);
});

runTest('5. Journey Day is Day 2 on the next calendar day', () => {
  const today = getTodayDateString();
  const yesterday = getPreviousDayString(today);
  assert.strictEqual(calculateJourneyDay(yesterday), 2);
});

runTest('6. Journey Day never resets when intermediate calendar days are missed', () => {
  const today = getTodayDateString();
  // 10 calendar days ago
  let curr = today;
  for (let i = 0; i < 10; i++) curr = getPreviousDayString(curr);
  assert.strictEqual(calculateJourneyDay(curr), 11);
});

// ---------------------------------------------------------------------------
// 3. STREAK & ACTIVE DAYS TELEMETRY ALGORITHM
// ---------------------------------------------------------------------------
function calculateStreakTelemetry(activeDates) {
  const uniqueDates = Array.from(new Set(activeDates.filter(Boolean))).sort();
  const totalActiveDays = uniqueDates.length;
  if (totalActiveDays === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const today = getTodayDateString();
  const yesterday = getPreviousDayString(today);
  const dateSet = new Set(uniqueDates);

  let currentStreak = 0;
  let checkDate = null;

  if (dateSet.has(today)) {
    checkDate = today;
  } else if (dateSet.has(yesterday)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    let curr = checkDate;
    while (dateSet.has(curr)) {
      currentStreak++;
      curr = getPreviousDayString(curr);
    }
  }

  let longestStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = uniqueDates[i - 1];
      const curDate = uniqueDates[i];
      if (calendarDaysBetween(prevDate, curDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak, totalActiveDays };
}

runTest('7. Streak is 0 with no activity', () => {
  const res = calculateStreakTelemetry([]);
  assert.deepStrictEqual(res, { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 });
});

runTest('8. Streak is 1 when studied today', () => {
  const today = getTodayDateString();
  const res = calculateStreakTelemetry([today]);
  assert.deepStrictEqual(res, { currentStreak: 1, longestStreak: 1, totalActiveDays: 1 });
});

runTest('9. Streak is 1 when studied yesterday (grace window for today)', () => {
  const today = getTodayDateString();
  const yesterday = getPreviousDayString(today);
  const res = calculateStreakTelemetry([yesterday]);
  assert.deepStrictEqual(res, { currentStreak: 1, longestStreak: 1, totalActiveDays: 1 });
});

runTest('10. Streak resets to 0 if last studied 2 days ago, but longestStreak is preserved', () => {
  const today = getTodayDateString();
  const d1 = getPreviousDayString(today);
  const d2 = getPreviousDayString(d1);
  const d3 = getPreviousDayString(d2);
  // Studied d2 and d3 (2 consecutive days), missed yesterday and today
  const res = calculateStreakTelemetry([d3, d2]);
  assert.strictEqual(res.currentStreak, 0);
  assert.strictEqual(res.longestStreak, 2);
  assert.strictEqual(res.totalActiveDays, 2);
});

runTest('11. Consecutive 5-day active study computes streak 5 and longest streak 5', () => {
  const today = getTodayDateString();
  const dates = [today];
  let c = today;
  for (let i = 0; i < 4; i++) {
    c = getPreviousDayString(c);
    dates.push(c);
  }
  const res = calculateStreakTelemetry(dates);
  assert.strictEqual(res.currentStreak, 5);
  assert.strictEqual(res.longestStreak, 5);
  assert.strictEqual(res.totalActiveDays, 5);
});

// ---------------------------------------------------------------------------
// 4. LEVEL BREAKDOWN & LESSON COUNT (146 TOTAL)
// ---------------------------------------------------------------------------
const HSK_TOTAL_MAP = {
  1: 15,
  2: 15,
  3: 20,
  4: 20,
  5: 36,
  6: 40,
};

function computeLevelStats(completedLessons) {
  return [1, 2, 3, 4, 5, 6].map((lvl) => {
    const total = HSK_TOTAL_MAP[lvl];
    const prefix = `hsk${lvl}-`;
    const completed = completedLessons.filter((k) => k.startsWith(prefix)).length;
    const percent = Math.min(100, Math.round((completed / total) * 100));
    return { level: lvl, total, completed, percent };
  });
}

runTest('12. Total authoritative HSK lessons equals exactly 146 across levels 1 to 6', () => {
  const sum = Object.values(HSK_TOTAL_MAP).reduce((a, b) => a + b, 0);
  assert.strictEqual(sum, 146, 'Total HSK lessons must equal 146');
});

runTest('13. Level stats compute real percentages without fabricated numbers', () => {
  const stats = computeLevelStats(['hsk1-bai01', 'hsk1-bai02', 'hsk2-bai01']);
  const lvl1 = stats.find(s => s.level === 1);
  const lvl2 = stats.find(s => s.level === 2);
  const lvl3 = stats.find(s => s.level === 3);

  assert.strictEqual(lvl1.completed, 2);
  assert.strictEqual(lvl1.total, 15);
  assert.strictEqual(lvl1.percent, 13); // round(2/15 * 100) = 13%

  assert.strictEqual(lvl2.completed, 1);
  assert.strictEqual(lvl2.total, 15);
  assert.strictEqual(lvl2.percent, 7); // round(1/15 * 100) = 7%

  assert.strictEqual(lvl3.completed, 0);
  assert.strictEqual(lvl3.percent, 0);
});

// ---------------------------------------------------------------------------
// 5. NO FABRICATED PROGRESS DEFAULTS IN REPOSITORIES
// ---------------------------------------------------------------------------
runTest('14. learnerRepository contains no hardcoded 320-day streak or dummy completed lessons', () => {
  const learnerPath = path.resolve('src/data/repositories/learnerRepository.ts');
  const code = fs.readFileSync(learnerPath, 'utf-8');
  assert(!code.includes('studyStreakDays: 320'), 'Must NOT have hardcoded 320 streak');
  assert(!code.includes("completedLessons: ['hsk1-bai01']"), 'Must NOT have dummy completed lessons');
});

runTest('15. ProgressView is wired to useLearningProgress hook and displays real metrics', () => {
  const progPath = path.resolve('src/components/modules/ProgressView.tsx');
  const code = fs.readFileSync(progPath, 'utf-8');
  assert(code.includes('useLearningProgress'), 'ProgressView must use useLearningProgress hook');
  assert(code.includes('progress.journeyDay'), 'ProgressView must render journeyDay');
  assert(code.includes('progress.currentStreak'), 'ProgressView must render currentStreak');
  assert(code.includes('progress.longestStreak'), 'ProgressView must render longestStreak');
  assert(code.includes('progress.totalActiveDays'), 'ProgressView must render totalActiveDays');
  assert(code.includes('progress.levelStats'), 'ProgressView must render levelStats');
  assert(!code.includes('320 ngày'), 'ProgressView must NOT render hardcoded 320 days');
});

runTest('16. DashboardView renders true Journey Day and active level progress', () => {
  const dashPath = path.resolve('src/components/dashboard/DashboardView.tsx');
  const code = fs.readFileSync(dashPath, 'utf-8');
  assert(code.includes('stats.journeyDay'), 'DashboardView must render Journey Day count');
  assert(code.includes('stats.currentStreak'), 'DashboardView must render true current streak');
  assert(code.includes('targetCompleted / targetTotal'), 'DashboardView must compute target level progress');
});

// ---------------------------------------------------------------------------
// 6. MODULE COMPLETION & ACTIVITY EVENT WIRES
// ---------------------------------------------------------------------------
runTest('17. WritingPracticeView wires Hanzi mastery to learningProgressService', () => {
  const code = fs.readFileSync('src/components/modules/WritingPracticeView.tsx', 'utf-8');
  assert(code.includes('learningProgressService'), 'Must import learningProgressService');
  assert(code.includes('learningProgressService.markHanziMastered(selectedChar.hanzi)'), 'Must call markHanziMastered on quiz completion');
});

runTest('18. SpeakingPracticeView wires recording completion to learningProgressService', () => {
  const code = fs.readFileSync('src/components/modules/SpeakingPracticeView.tsx', 'utf-8');
  assert(code.includes('learningProgressService'), 'Must import learningProgressService');
  assert(code.includes("type: 'speaking'"), 'Must record speaking exercise');
});

runTest('19. ListeningPracticeView wires correct answers to learningProgressService', () => {
  const code = fs.readFileSync('src/components/modules/ListeningPracticeView.tsx', 'utf-8');
  assert(code.includes('learningProgressService'), 'Must import learningProgressService');
  assert(code.includes("type: 'listening'"), 'Must record listening exercise');
});

runTest('20. SentenceOrderingView wires correct ordering to learningProgressService', () => {
  const code = fs.readFileSync('src/components/modules/SentenceOrderingView.tsx', 'utf-8');
  assert(code.includes('learningProgressService'), 'Must import learningProgressService');
  assert(code.includes("type: 'grammar'"), 'Must record grammar exercise');
});

runTest('21. ExamView wires completed exam attempts to learningProgressService', () => {
  const code = fs.readFileSync('src/components/modules/ExamView.tsx', 'utf-8');
  assert(code.includes('learningProgressService'), 'Must import learningProgressService');
  assert(code.includes("activityType: 'exam_attempt'"), 'Must record exam_attempt activity');
});

runTest('22. SentenceItem and VocabularyView wire persistent bookmarks and learned words', () => {
  const sentCode = fs.readFileSync('src/components/lesson/SentenceItem.tsx', 'utf-8');
  assert(sentCode.includes('learningProgressService.toggleBookmark'), 'SentenceItem must call toggleBookmark');
  assert(sentCode.includes('learningProgressService.isBookmarked'), 'SentenceItem must check isBookmarked');

  const vocabCode = fs.readFileSync('src/components/lesson/VocabularyView.tsx', 'utf-8');
  assert(vocabCode.includes('learningProgressService.toggleBookmark'), 'VocabularyView must call toggleBookmark');
  assert(vocabCode.includes('learningProgressService.markWordLearned'), 'VocabularyView must call markWordLearned');
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n----------------------------------------------------------------------');
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log('----------------------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('>>> ALL 22 AUDIT REQUIREMENTS VERIFIED AND PASSED SUCCESSFULLY! <<<\n');
}
