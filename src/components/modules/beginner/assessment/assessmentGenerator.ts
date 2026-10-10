import {
  AssessmentQuestion,
  AssessmentSessionState,
  AssessmentSkillSummary,
} from './assessmentTypes';
import { BEGINNER_ASSESSMENT_QUESTIONS } from './AssessmentQuestionBank';

const STORAGE_SESSION_KEY = 'yuyan_beginner_assessment_session_v2';
export const STORAGE_RESULT_KEY = 'yuyan_beginner_assessment_result';

/**
 * Implements an unbiased Fisher-Yates shuffle algorithm
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates or resumes a 30-question assessment session
 * Guarantees exactly:
 * - 8 Listening questions
 * - 8 Speaking questions
 * - 7 Reading questions
 * - 7 Writing questions
 * Total: 30 questions
 */
export function initializeAssessmentSession(): AssessmentSessionState {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(STORAGE_SESSION_KEY);
    if (cached) {
      try {
        const parsed: AssessmentSessionState = JSON.parse(cached);
        // Validate question integrity
        if (
          parsed &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length === 30 &&
          !parsed.isFinished
        ) {
          return parsed;
        }
      } catch (err) {
        console.warn('Invalid cached assessment session, creating fresh one:', err);
      }
    }
  }

  // Generate fresh session with exact 8 / 8 / 7 / 7 quota
  const listening = BEGINNER_ASSESSMENT_QUESTIONS.filter((q) => q.skill === 'listening');
  const speaking = BEGINNER_ASSESSMENT_QUESTIONS.filter((q) => q.skill === 'speaking');
  const reading = BEGINNER_ASSESSMENT_QUESTIONS.filter((q) => q.skill === 'reading');
  const writing = BEGINNER_ASSESSMENT_QUESTIONS.filter((q) => q.skill === 'writing');

  // Shuffle within categories while preserving category groupings
  const shuffledListening = fisherYatesShuffle(listening).slice(0, 8);
  const shuffledSpeaking = fisherYatesShuffle(speaking).slice(0, 8);
  const shuffledReading = fisherYatesShuffle(reading).slice(0, 7);
  const shuffledWriting = fisherYatesShuffle(writing).slice(0, 7);

  // Present questions in the canonical 4-skill order matching the infographic
  const finalQuestions: AssessmentQuestion[] = [
    ...shuffledListening,
    ...shuffledSpeaking,
    ...shuffledReading,
    ...shuffledWriting,
  ];

  const newState: AssessmentSessionState = {
    questions: finalQuestions,
    currentIndex: 0,
    answers: {},
    startedAt: Date.now(),
    isFinished: false,
  };

  saveAssessmentSession(newState);
  return newState;
}

export function saveAssessmentSession(state: AssessmentSessionState): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save assessment session to localStorage:', e);
    }
  }
}

export function clearAssessmentSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }
}

/**
 * Calculates skill breakdowns and overall score for an assessment
 */
export function calculateAssessmentResult(state: AssessmentSessionState): {
  overallScore: number;
  totalQuestions: number;
  totalCorrect: number;
  skillSummaries: AssessmentSkillSummary[];
} {
  const skills: { skill: 'listening' | 'speaking' | 'reading' | 'writing'; nameVi: string; color: string }[] = [
    { skill: 'listening', nameVi: 'Nghe (Listening)', color: '#3B82F6' },
    { skill: 'speaking', nameVi: 'Nói (Speaking)', color: '#A855F7' },
    { skill: 'reading', nameVi: 'Đọc (Reading)', color: '#10B981' },
    { skill: 'writing', nameVi: 'Viết (Writing)', color: '#F59E0B' },
  ];

  let totalPoints = 0;
  let totalCorrect = 0;

  const skillSummaries: AssessmentSkillSummary[] = skills.map((s) => {
    const questionsOfSkill = state.questions.filter((q) => q.skill === s.skill);
    let correctCount = 0;
    let skillPoints = 0;

    questionsOfSkill.forEach((q) => {
      const ans = state.answers[q.id];
      if (ans && ans.isCorrect) {
        correctCount++;
        skillPoints += ans.score;
      }
    });

    const maxPoints = questionsOfSkill.length * 100;
    const scorePercent = maxPoints > 0 ? Math.round((skillPoints / maxPoints) * 100) : 0;

    totalCorrect += correctCount;
    totalPoints += skillPoints;

    return {
      skill: s.skill,
      nameVi: s.nameVi,
      total: questionsOfSkill.length,
      correct: correctCount,
      scorePercent,
      color: s.color,
    };
  });

  const overallScore = Math.round(totalPoints / state.questions.length);

  return {
    overallScore,
    totalQuestions: state.questions.length,
    totalCorrect,
    skillSummaries,
  };
}
