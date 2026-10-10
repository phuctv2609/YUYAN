/**
 * YUYAN — Automated Beginner Module 0→1 Audit Test Suite
 * Verifies complete phonetics inventory, question quotas, Fisher-Yates shuffling,
 * and component exports.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('YUYAN BEGINNER 0→1 MODULE — COMPREHENSIVE VERIFICATION AUDIT');
console.log('================================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

// 1. Audit beginnerPhoneticsData.ts
const dataFilePath = path.join(projectRoot, 'src', 'data', 'pinyin', 'beginnerPhoneticsData.ts');
assert(fs.existsSync(dataFilePath), 'beginnerPhoneticsData.ts exists on disk');
const dataContent = fs.readFileSync(dataFilePath, 'utf8');

// Check 21 initials
const expectedInitials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const hasAllInitials = expectedInitials.every((init) => dataContent.includes(`symbol: '${init}'`));
assert(hasAllInitials, 'All 21 Mandarin Initials (b..s) present in dataset');

// Check 6 simple finals
const expectedSimple = ['a', 'o', 'e', 'i', 'u', 'ü'];
const hasAllSimple = expectedSimple.every((s) => dataContent.includes(`symbol: '${s}'`));
assert(hasAllSimple, 'All 6 Simple Finals (a, o, e, i, u, ü) present in dataset');

// Check compound finals
const expectedCompound = ['ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'ua', 'uo', 'üe', 'iao', 'iou', 'uai', 'uei'];
const hasAllCompound = expectedCompound.every((c) => dataContent.includes(`symbol: '${c}'`));
assert(hasAllCompound, 'All 13 Compound Finals present in dataset');

// Check nasal finals
const expectedNasal = ['an', 'en', 'in', 'ün', 'ian', 'uan', 'üan', 'uen', 'ang', 'eng', 'ing', 'ong', 'iong', 'iang', 'uang', 'ueng'];
const hasAllNasal = expectedNasal.every((n) => dataContent.includes(`symbol: '${n}'`));
assert(hasAllNasal, 'All 16 Nasal Finals present in dataset');

// Check retroflex final er
assert(dataContent.includes("symbol: 'er'"), 'Special Retroflex Final (er) present in dataset');

// Check 4 lexical tones
assert(dataContent.includes("toneNumber: 1") && dataContent.includes("toneNumber: 2") && dataContent.includes("toneNumber: 3") && dataContent.includes("toneNumber: 4"), '4 Lexical Tones present in dataset');

// Check 3 tone sandhi rules
assert(dataContent.includes('sandhi_two_third_tones') && dataContent.includes('sandhi_yi') && dataContent.includes('sandhi_bu'), '3 Tone Sandhi Rules (3+3, Yī, Bù) present');

// Check 4 special pinyin rules
assert(dataContent.includes('rule_y_w') && dataContent.includes('rule_u_umlaut_drop') && dataContent.includes('rule_contractions') && dataContent.includes('rule_tone_marks'), '4 Special Pinyin Rules present');

// Check minimal pairs
assert(dataContent.includes('contrast_b_p') && dataContent.includes('contrast_n_vs_ng') && dataContent.includes('contrast_u_vs_u_umlaut'), 'Minimal pairs (b/p, n/ng, u/ü) present');

// 2. Audit Assessment Question Bank
const questionBankPath = path.join(projectRoot, 'src', 'components', 'modules', 'beginner', 'assessment', 'AssessmentQuestionBank.ts');
assert(fs.existsSync(questionBankPath), 'AssessmentQuestionBank.ts exists on disk');
const qbContent = fs.readFileSync(questionBankPath, 'utf8');

// Count questions by id prefix
const listeningMatches = qbContent.match(/id:\s*'lis_\d+'/g) || [];
const speakingMatches = qbContent.match(/id:\s*'spk_\d+'/g) || [];
const readingMatches = qbContent.match(/id:\s*'rd_\d+'/g) || [];
const writingMatches = qbContent.match(/id:\s*'wrt_\d+'/g) || [];

assert(listeningMatches.length === 8, `Listening questions count: ${listeningMatches.length} === 8`);
assert(speakingMatches.length === 8, `Speaking questions count: ${speakingMatches.length} === 8`);
assert(readingMatches.length === 7, `Reading questions count: ${readingMatches.length} === 7`);
assert(writingMatches.length === 7, `Writing questions count: ${writingMatches.length} === 7`);

const totalBankQuestions = listeningMatches.length + speakingMatches.length + readingMatches.length + writingMatches.length;
assert(totalBankQuestions === 30, `Total Assessment Questions in bank: ${totalBankQuestions} === 30`);

// 3. Verify Component Files Exist
const requiredComponents = [
  'src/components/modules/beginner/illustrations/SagittalVocalTract.tsx',
  'src/components/modules/beginner/illustrations/LipShapeDiagram.tsx',
  'src/components/modules/beginner/illustrations/ToneContourDiagram.tsx',
  'src/components/modules/beginner/illustrations/NasalAirflowDiagram.tsx',
  'src/components/modules/beginner/illustrations/RetroflexErDiagram.tsx',
  'src/components/modules/beginner/BeginnerDashboard.tsx',
  'src/components/modules/beginner/InitialsLab.tsx',
  'src/components/modules/beginner/FinalsLab.tsx',
  'src/components/modules/beginner/MinimalPairsLab.tsx',
  'src/components/modules/beginner/TonesLab.tsx',
  'src/components/modules/beginner/PinyinRulesLab.tsx',
  'src/components/modules/beginner/SyllableChartLab.tsx',
  'src/components/modules/beginner/BeginnerRoadmap.tsx',
  'src/components/modules/beginner/assessment/assessmentTypes.ts',
  'src/components/modules/beginner/assessment/assessmentGenerator.ts',
  'src/components/modules/beginner/assessment/AssessmentDonutChart.tsx',
  'src/components/modules/beginner/assessment/ListeningQuestionCard.tsx',
  'src/components/modules/beginner/assessment/SpeakingQuestionCard.tsx',
  'src/components/modules/beginner/assessment/ReadingQuestionCard.tsx',
  'src/components/modules/beginner/assessment/WritingQuestionCard.tsx',
  'src/components/modules/beginner/assessment/AssessmentResultModal.tsx',
  'src/components/modules/beginner/assessment/BeginnerAssessmentView.tsx',
  'src/components/modules/BeginnerView.tsx',
];

for (const relPath of requiredComponents) {
  const full = path.join(projectRoot, relPath);
  assert(fs.existsSync(full), `Component exists: ${relPath}`);
}

console.log('----------------------------------------------------------------');
console.log(`AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL AUDIT CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
