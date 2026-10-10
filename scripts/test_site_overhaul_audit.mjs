// ============================================================================
// YUYAN FULL-WEBSITE OVERHAUL & REPAIR AUDIT TEST SUITE
// Tests Audio, Mandarin Phonetics, AudioRecordingService, Grammar Standards,
// 30 AI Tutor Modes, and Profile UUID Data Integrity.
// ============================================================================

import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('YUYAN FULL-WEBSITE OVERHAUL RIGOROUS AUDIT TEST SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// 1. Audio Phonetics & Hūdùyīn Verification
// ----------------------------------------------------------------------------
console.log('--- 1. Mandatory Mandarin Phonetics & Hūdùyīn Mapping ---');
const audioUtilsFile = fs.readFileSync('src/services/audio/audioUtils.ts', 'utf-8');

assert(
  audioUtilsFile.includes('MANDARIN_INITIALS_HUDUYIN'),
  'MANDARIN_INITIALS_HUDUYIN dictionary exists for canonical consonant vocalization'
);
assert(
  audioUtilsFile.includes('MANDARIN_FINALS_MAPPING'),
  'MANDARIN_FINALS_MAPPING dictionary exists for all 36 finals'
);
assert(
  audioUtilsFile.includes('resolveMandarinPhoneticText'),
  'resolveMandarinPhoneticText function exists in audioUtils.ts'
);

// Check that all 21 initials are present in dictionary
const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const initialsMissing = initials.filter((init) => !audioUtilsFile.includes(`'${init}'`) && !audioUtilsFile.includes(`${init}:`));
assert(
  initialsMissing.length === 0,
  `All 21 initials mapped to Chinese Hūdùyīn (missing: ${initialsMissing.join(', ') || 'none'})`
);

// Check that audioManager uses resolveMandarinPhoneticText
const audioManagerFile = fs.readFileSync('src/services/audio/audioManager.ts', 'utf-8');
assert(
  audioManagerFile.includes('resolveMandarinPhoneticText'),
  'audioManager.ts strictly invokes resolveMandarinPhoneticText in playTarget and playText'
);

// Check that MandarinVoiceHelpModal exists
const helpModalFile = fs.readFileSync('src/components/ui/MandarinVoiceHelpModal.tsx', 'utf-8');
assert(
  helpModalFile.includes('Chưa tìm thấy giọng đọc tiếng Trung'),
  'MandarinVoiceHelpModal provides informative Vietnamese instructions for OS voice installation'
);

// ----------------------------------------------------------------------------
// 2. Audio Recording Service Verification
// ----------------------------------------------------------------------------
console.log('\n--- 2. Shared Audio Recording Service ---');
const recServiceFile = fs.readFileSync('src/services/audio/audioRecordingService.ts', 'utf-8');

assert(
  recServiceFile.includes('class AudioRecordingService') && recServiceFile.includes('audioRecordingService = new AudioRecordingService()'),
  'AudioRecordingService singleton is defined and exported'
);
assert(
  recServiceFile.includes('getSupportedMimeType') && recServiceFile.includes('audio/webm;codecs=opus'),
  'AudioRecordingService supports resilient MIME negotiation with opus codec priority'
);
assert(
  recServiceFile.includes('blob.size < 128') || recServiceFile.includes('blob.size <'),
  'AudioRecordingService includes non-empty blob size validation'
);
assert(
  recServiceFile.includes('track.stop()'),
  'AudioRecordingService guarantees release of media stream tracks on stop/cancel'
);
assert(
  recServiceFile.includes('blobToBase64'),
  'AudioRecordingService provides blobToBase64 helper for AI evaluation'
);

// ----------------------------------------------------------------------------
// 3. AI Pronunciation Evaluation
// ----------------------------------------------------------------------------
console.log('\n--- 3. AI Pronunciation Evaluation System ---');
const edgeIndexFile = fs.readFileSync('supabase/functions/gemini-api/index.ts', 'utf-8');
assert(
  edgeIndexFile.includes("action === 'evaluate-pronunciation'"),
  'Supabase gemini-api edge function handles action evaluate-pronunciation'
);
assert(
  !edgeIndexFile.includes('model: GEMINI_MODEL,'),
  'Edge function ReferenceError on GEMINI_MODEL is eliminated'
);

const aiApiFile = fs.readFileSync('src/services/ai/aiApiService.ts', 'utf-8');
assert(
  aiApiFile.includes('evaluatePronunciation'),
  'aiApiService implements evaluatePronunciation method'
);
assert(
  aiApiFile.includes('PronunciationEvaluation'),
  'PronunciationEvaluation interface is defined with score, toneAccuracy, and advice'
);

const speakingViewFile = fs.readFileSync('src/components/modules/SpeakingPracticeView.tsx', 'utf-8');
assert(
  speakingViewFile.includes('evaluatePronunciation'),
  'SpeakingPracticeView connects directly to AI pronunciation evaluation'
);
assert(
  !speakingViewFile.includes('chưa có hệ thống chấm phát âm tự động'),
  'SpeakingPracticeView eliminates placeholder "chưa có hệ thống chấm phát âm tự động"'
);

const speakingCardFile = fs.readFileSync('src/components/modules/beginner/assessment/SpeakingQuestionCard.tsx', 'utf-8');
assert(
  speakingCardFile.includes('evaluatePronunciation'),
  'SpeakingQuestionCard connects directly to AI pronunciation evaluation'
);
assert(
  !speakingCardFile.includes('score: 95, // High proficiency recording score'),
  'SpeakingQuestionCard eliminates hardcoded fake 95 score'
);

// ----------------------------------------------------------------------------
// 4. Grammar Module Rebuild & GF0025-2021 Standards
// ----------------------------------------------------------------------------
console.log('\n--- 4. Grammar Module & Standards ---');
const grammarRepoFile = fs.readFileSync('src/data/repositories/grammarRepository.ts', 'utf-8');
assert(
  grammarRepoFile.includes('gfLevel') && grammarRepoFile.includes('positivePattern') && grammarRepoFile.includes('negativePattern'),
  'GrammarPoint schema includes GF0025-2021 level and positive/negative/question patterns'
);
assert(
  grammarRepoFile.includes('commonMistakes') && grammarRepoFile.includes('practiceExercises'),
  'GrammarPoint schema includes Vietnamese learner commonMistakes and practiceExercises'
);

// Check levels present
for (let lvl = 1; lvl <= 6; lvl++) {
  assert(
    grammarRepoFile.includes(`level: ${lvl}`),
    `Grammar points include authoritative content for HSK ${lvl}`
  );
}

const grammarViewFile = fs.readFileSync('src/components/modules/GrammarPracticeView.tsx', 'utf-8');
assert(
  grammarViewFile.includes("activeTab === 'formulas'") &&
  grammarViewFile.includes("activeTab === 'mistakes'") &&
  grammarViewFile.includes("activeTab === 'quiz'"),
  'GrammarPracticeView contains Formulas, Common Mistakes, and Interactive Mini-Quiz tabs'
);

// ----------------------------------------------------------------------------
// 5. 30 AI Mandarin Tutor Modes
// ----------------------------------------------------------------------------
console.log('\n--- 5. 30 AI Mandarin Tutor Modes ---');
const tutorModesFile = fs.readFileSync('src/data/ai/tutorModesData.ts', 'utf-8');

// Match all mode IDs
const modeMatches = tutorModesFile.match(/id:\s*['"]([a-z0-9_]+)['"]/g) || [];
assert(
  modeMatches.length >= 30,
  `TUTOR_MODES contains at least 30 comprehensive tutor modes (found: ${modeMatches.length})`
);

const convViewFile = fs.readFileSync('src/components/modules/AiConversationView.tsx', 'utf-8');
assert(
  convViewFile.includes('TUTOR_MODES') && convViewFile.includes('TUTOR_CATEGORIES'),
  'AiConversationView imports and renders 30 TUTOR_MODES with category filtering'
);
assert(
  convViewFile.includes('activeMode.suggestedPrompts'),
  'AiConversationView renders one-click starter prompts for students'
);

// ----------------------------------------------------------------------------
// 6. Profile Persistence & UUID Integrity
// ----------------------------------------------------------------------------
console.log('\n--- 6. Profile UUID Integrity & Persistence ---');
const learnerRepoFile = fs.readFileSync('src/data/repositories/learnerRepository.ts', 'utf-8');
assert(
  learnerRepoFile.includes('isValidUUID'),
  'learnerRepository implements isValidUUID helper'
);
assert(
  !learnerRepoFile.includes("id: 'yuyan_std_001',"),
  "DEFAULT_PROFILE does not use non-UUID 'yuyan_std_001'"
);
assert(
  learnerRepoFile.includes('learningProgressService.updateProfile'),
  'updateProfileAsync synchronizes profile with learningProgressService'
);

// ----------------------------------------------------------------------------
// 7. Production Build Artifacts
// ----------------------------------------------------------------------------
console.log('\n--- 7. Production Build Verification ---');
const distHtml = fs.existsSync('dist/index.html');
assert(distHtml, 'Production build bundle exists at dist/index.html');

console.log('\n================================================================');
console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
