export type SkillType = 'listening' | 'speaking' | 'reading' | 'writing';

export interface BaseAssessmentQuestion {
  id: string;
  skill: SkillType;
  title: string;
  prompt: string;
  audioPrompt?: string; // Text to speak via audioManager for listening questions
  targetText?: string;   // Target Hanzi or Pinyin
  explanation: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  pinyin?: string;
  hanzi?: string;
  meaning?: string;
}

export interface MultipleChoiceQuestion extends BaseAssessmentQuestion {
  skill: 'listening' | 'reading';
  options: ChoiceOption[];
  correctOptionId: string;
}

export interface SpeakingQuestion extends BaseAssessmentQuestion {
  skill: 'speaking';
  targetPinyin: string;
  targetHanzi: string;
  meaning: string;
  acceptedPinyins: string[];
}

export interface WritingQuestion extends BaseAssessmentQuestion {
  skill: 'writing';
  targetHanzi: string;
  meaning: string;
  correctPinyin: string; // e.g. "dà"
  acceptableAlternatives?: string[]; // e.g. ["da4"]
}

export type AssessmentQuestion =
  | MultipleChoiceQuestion
  | SpeakingQuestion
  | WritingQuestion;

export interface UserAnswerRecord {
  questionId: string;
  skill: SkillType;
  userResponse: string; // optionId, spoken score or entered pinyin
  isCorrect: boolean;
  score: number; // 0 to 100
  audioBlobUrl?: string;
}

export interface AssessmentSessionState {
  questions: AssessmentQuestion[];
  currentIndex: number;
  answers: Record<string, UserAnswerRecord>;
  startedAt: number;
  completedAt?: number;
  isFinished: boolean;
}

export interface AssessmentSkillSummary {
  skill: SkillType;
  nameVi: string;
  total: number;
  correct: number;
  scorePercent: number;
  color: string;
}
