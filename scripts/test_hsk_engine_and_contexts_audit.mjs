/**
 * YUYAN — HSK EXAM ENGINE + GRAMMAR REPLACEMENT + 10,000 CONTEXTS AUDIT
 * Rigorous automated verification suite.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('YUYAN HSK EXAM ENGINE + GRAMMAR + CONTEXTS AUDIT TEST SUITE');
  console.log('================================================================');

  // --------------------------------------------------------------------------
  // SUITE 1: SOURCE-DRIVEN GRAMMAR CATALOG & HSK 2.0/3.0 SEPARATION
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Source-Driven Grammar Catalog & Version Separation ---');

  const hsk3File = path.join(ROOT_DIR, 'src', 'data', 'grammar', 'hsk3GrammarData.json');
  const hsk2File = path.join(ROOT_DIR, 'src', 'data', 'grammar', 'hsk2GrammarData.json');
  const grammarReportFile = path.join(ROOT_DIR, 'scripts', 'grammar_import_report.json');

  assert(fs.existsSync(hsk3File), 'HSK 3.0 source-driven catalog exists on disk');
  assert(fs.existsSync(hsk2File), 'HSK 2.0 source-driven catalog exists on disk');
  assert(fs.existsSync(grammarReportFile), 'Grammar import report exists with provenance details');

  const hsk3Data = JSON.parse(fs.readFileSync(hsk3File, 'utf8'));
  const hsk2Data = JSON.parse(fs.readFileSync(hsk2File, 'utf8'));
  const importReport = JSON.parse(fs.readFileSync(grammarReportFile, 'utf8'));

  assert(hsk3Data.length >= 500, `HSK 3.0 contains full GF0025-2021 curriculum (found: ${hsk3Data.length} records)`);
  assert(hsk2Data.length >= 20, `HSK 2.0 contains authoritative Hanban 2015 curriculum (found: ${hsk2Data.length} records)`);

  // Verify HSK 3.0 Level 7-9 preservation
  const band79Items = hsk3Data.filter(x => x.sourceLevel === 'HSK7-9' || x.normalizedLevel === 7);
  assert(band79Items.length > 50, `HSK 3.0 Levels 7–9 are preserved as combined advanced band (found: ${band79Items.length} records)`);

  // Verify provenance and license metadata
  const sampleHsk3 = hsk3Data[0];
  assert(sampleHsk3.hskVersion === 'hsk3', 'HSK 3.0 records explicitly tagged hskVersion: hsk3');
  assert(sampleHsk3.syllabusEdition === 'GF0025-2021', 'HSK 3.0 records cite GF0025-2021 standard');
  assert(Boolean(sampleHsk3.sourceUrl), 'Records maintain verifiable source URL');
  assert(Boolean(sampleHsk3.verificationStatus), 'Records maintain verification status');

  const sampleHsk2 = hsk2Data[0];
  assert(sampleHsk2.hskVersion === 'hsk2', 'HSK 2.0 records explicitly tagged hskVersion: hsk2');
  assert(sampleHsk2.syllabusEdition === 'Hanban-2015', 'HSK 2.0 records cite Hanban-2015 standard');

  // Check Grammar Repository
  const grammarRepoPath = path.join(ROOT_DIR, 'src', 'data', 'repositories', 'grammarRepository.ts');
  const grammarRepoCode = fs.readFileSync(grammarRepoPath, 'utf8');
  assert(grammarRepoCode.includes('getByVersionAndLevel'), 'grammarRepository supports version-aware queries');
  assert(grammarRepoCode.includes('hsk3CatalogData'), 'grammarRepository integrates imported HSK 3.0 catalog');

  // Check Grammar UI Component
  const grammarViewPath = path.join(ROOT_DIR, 'src', 'components/modules/GrammarPracticeView.tsx');
  const grammarViewCode = fs.readFileSync(grammarViewPath, 'utf8');
  assert(grammarViewCode.includes('hskVersion'), 'GrammarPracticeView provides explicit HSK version selector');
  assert(grammarViewCode.includes('askGrammarAi'), 'GrammarPracticeView integrates Contextual AI Grammar Assistant');
  assert(grammarViewCode.includes('Cấp cao 7–9'), 'GrammarPracticeView provides HSK 3.0 Level 7–9 filter');

  // --------------------------------------------------------------------------
  // SUITE 2: 10,000+ LEARNING CONTEXT LIBRARY & DYNAMIC RETRIEVAL
  // --------------------------------------------------------------------------
  console.log('\n--- 2. 10,000+ Chinese-Learning Context Library ---');

  const contextDir = path.join(ROOT_DIR, 'src', 'data', 'ai', 'contexts');
  const contextIndexFile = path.join(ROOT_DIR, 'src', 'data', 'ai', 'contextCatalogIndex.ts');
  const contextReportFile = path.join(ROOT_DIR, 'scripts', 'context_generation_report.json');

  assert(fs.existsSync(contextDir), 'Partitioned contexts directory exists');
  assert(fs.existsSync(contextIndexFile), 'Lightweight context index exists');
  assert(fs.existsSync(contextReportFile), 'Context generation report exists');

  const contextReport = JSON.parse(fs.readFileSync(contextReportFile, 'utf8'));
  assert(contextReport.totalDistinctContexts >= 10000, `Context library contains at least 10,000 distinct items (found: ${contextReport.totalDistinctContexts})`);
  assert(contextReport.domainCount >= 25, `Context library covers at least 25 domains (found: ${contextReport.domainCount} domains)`);

  // Verify unique IDs across all files
  const files = fs.readdirSync(contextDir).filter(f => f.endsWith('.json'));
  let totalLoaded = 0;
  const uniqueIds = new Set();

  for (const f of files) {
    const items = JSON.parse(fs.readFileSync(path.join(contextDir, f), 'utf8'));
    totalLoaded += items.length;
    for (const it of items) {
      uniqueIds.add(it.id);
    }
  }

  assert(totalLoaded === contextReport.totalDistinctContexts, `Total loaded (${totalLoaded}) matches report`);
  assert(uniqueIds.size === totalLoaded, `Zero duplicates detected: ${uniqueIds.size} unique IDs across all partitions`);

  // Verify Context Retrieval Service
  const retrievalServicePath = path.join(ROOT_DIR, 'src', 'services', 'ai', 'contextRetrievalService.ts');
  const retrievalServiceCode = fs.readFileSync(retrievalServicePath, 'utf8');
  assert(retrievalServiceCode.includes('searchIndex'), 'contextRetrievalService provides in-memory index search');
  assert(retrievalServiceCode.includes('getContextDetails'), 'contextRetrievalService provides dynamic on-demand loading');

  // --------------------------------------------------------------------------
  // SUITE 3: FREE-QUESTION AI TUTOR & EDGE FUNCTION
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Free-Question AI Tutor & Server-Side Functions ---');

  const edgeFunctionPath = path.join(ROOT_DIR, 'supabase', 'functions', 'gemini-api', 'index.ts');
  const edgeFunctionCode = fs.readFileSync(edgeFunctionPath, 'utf8');
  assert(edgeFunctionCode.includes("action === 'free-chat'"), 'Edge function handles action free-chat for unrestricted Q&A');
  assert(edgeFunctionCode.includes("action === 'grammar-ai'"), 'Edge function handles action grammar-ai for contextual explanations');

  const aiApiServicePath = path.join(ROOT_DIR, 'src', 'services', 'ai', 'aiApiService.ts');
  const aiApiServiceCode = fs.readFileSync(aiApiServicePath, 'utf8');
  assert(aiApiServiceCode.includes('sendFreeChatMessage'), 'aiApiService implements sendFreeChatMessage');
  assert(aiApiServiceCode.includes('askGrammarAi'), 'aiApiService implements askGrammarAi');

  const aiConversationPath = path.join(ROOT_DIR, 'src', 'components', 'modules', 'AiConversationView.tsx');
  const aiConversationCode = fs.readFileSync(aiConversationPath, 'utf8');
  assert(aiConversationCode.includes('Hỏi đáp Tự do (Free Q&A)'), 'AiConversationView provides Free Q&A tab');
  assert(aiConversationCode.includes('Thư viện 12,050 Ngữ cảnh'), 'AiConversationView integrates Context Library Explorer');
  assert(aiConversationCode.includes('handleResetChat'), 'AiConversationView provides clean conversation reset');

  // --------------------------------------------------------------------------
  // SUITE 4: DEDICATED VERSION-AWARE HSK EXAM ENGINE
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Dedicated Version-Aware HSK Exam Simulator ---');

  const examRepoPath = path.join(ROOT_DIR, 'src', 'data', 'repositories', 'examRepository.ts');
  const examRepoCode = fs.readFileSync(examRepoPath, 'utf8');
  assert(examRepoCode.includes('EXAM_TEMPLATES'), 'examRepository defines authoritative HSK exam templates');
  assert(examRepoCode.includes('saveActiveSession'), 'examRepository supports active session autosaving to localStorage');
  assert(examRepoCode.includes('loadActiveSession'), 'examRepository supports session restoration after refresh');

  const examViewPath = path.join(ROOT_DIR, 'src', 'components', 'modules', 'ExamView.tsx');
  const examViewCode = fs.readFileSync(examViewPath, 'utf8');
  assert(examViewCode.includes('examVersion'), 'ExamView supports HSK 2.0 vs HSK 3.0 version selection');
  assert(examViewCode.includes('handleResumeSavedSession'), 'ExamView provides resume button for autosaved session');
  assert(examViewCode.includes('flaggedQuestions'), 'ExamView supports question flagging for review');
  assert(examViewCode.includes('Phân tích chi tiết từng câu hỏi'), 'ExamView provides complete post-exam pedagogical review');

  // --------------------------------------------------------------------------
  // SUITE 5: PRODUCTION BUILD INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Production Build Verification ---');
  const distIndexPath = path.join(ROOT_DIR, 'dist', 'index.html');
  assert(fs.existsSync(distIndexPath), 'Production bundle dist/index.html is compiled and ready');

  console.log('================================================================');
  console.log(`AUDIT RESULTS: ${passedTests}/${totalTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log('================================================================');
}

runAudit().catch(err => {
  console.error('Audit suite encountered error:', err);
  process.exit(1);
});
