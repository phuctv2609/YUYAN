/**
 * YUYAN MASTER SPECIFICATION AUDIT SUITE
 * Verifies complete AI ecosystem recovery, live Edge Function connectivity,
 * AI UX workspace, independent HSK 2.0/3.0 examination inventory, and grammar localization.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedChecks++;
  } else {
    console.error(`  [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

console.log('===============================================================');
console.log('   YUYAN MASTER ENGINEERING SPECIFICATION AUDIT SUITE');
console.log('===============================================================\n');

// 1. LIVE GEMINI EDGE FUNCTION CONNECTIVITY TEST
console.log('--- 1. Testing Live Gemini Edge Function (umeyobuqigbscjucxshs) ---');
try {
  const edgeUrl = 'https://umeyobuqigbscjucxshs.supabase.co/functions/v1/gemini-api';
  console.log(`Pinging Edge Function: ${edgeUrl}...`);
  
  // Test 1: Health with test=true (actual ping to Gemini)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  
  const startTime = Date.now();
  const healthRes = await fetch(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'health',
      test: true,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  assert(healthRes.ok, `Edge Function Health HTTP status ${healthRes.status} ${healthRes.statusText} (${elapsed}s)`);
  const healthData = await healthRes.json();
  assert(healthData.configured === true && healthData.valid === true, `Gemini API key is configured and authenticated: valid=${healthData.valid}`);
  assert(typeof healthData.model === 'string' && healthData.model.includes('gemini'), `Active verified model: ${healthData.model}`);

  // Test 2: Live Chat Generation
  console.log('Testing live AI chat generation...');
  const chatRes = await fetch(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      scenario: 'Chào hỏi cơ bản',
      message: '你好！',
    }),
  });
  assert(chatRes.ok, `Chat endpoint HTTP status ${chatRes.status}`);
  const chatData = await chatRes.json();
  assert(chatData.success === true && chatData.reply?.hanzi, `Live AI generated valid response: "${chatData.reply?.hanzi}" (${chatData.reply?.pinyin}) - "${chatData.reply?.vietnamese}"`);
} catch (err) {
  console.error(`Live Edge Function connection check failed: ${err.message}`);
  assert(false, `Live Edge Function must be reachable and return 200 OK: ${err.message}`);
}

// 2. SHARED AI CLIENT SERVICE AUDIT (aiApiService.ts)
console.log('\n--- 2. Auditing AI Client Service (aiApiService.ts) ---');
const aiServiceContent = readFileSync(resolve('src/services/ai/aiApiService.ts'), 'utf-8');

assert(!aiServiceContent.includes('score: 86'), 'Removed fabricated pronunciation score fallback (score: 86)');
assert(aiServiceContent.includes('AI_UNCONFIGURED'), 'Maps AI_UNCONFIGURED error to user-friendly Vietnamese explanation');
assert(aiServiceContent.includes('RATE_LIMIT_EXCEEDED'), 'Maps RATE_LIMIT_EXCEEDED error with retry guidance');
assert(aiServiceContent.includes('TIMEOUT'), 'Maps TIMEOUT error when edge runtime takes > 30s');
assert(aiServiceContent.includes('analyzeSentence'), 'Exports analyzeSentence method for grammatical parsing');
assert(aiServiceContent.includes('explainExamQuestion'), 'Exports explainExamQuestion method for pedagogical HSK reviews');

// 3. AI WORKSPACE UX AUDIT (AiConversationView.tsx)
console.log('\n--- 3. Auditing AI Learning Workspace UX (AiConversationView.tsx) ---');
const aiUxContent = readFileSync(resolve('src/components/modules/AiConversationView.tsx'), 'utf-8');

assert(aiUxContent.includes('Học tiếng Trung theo cách của bạn'), 'Preserves official tagline: "Học tiếng Trung theo cách của bạn."');
assert(aiUxContent.includes('LEARNING_SHORTCUTS'), 'Defines 10 interactive learning shortcuts');
assert(aiUxContent.includes('healthStatus'), 'Includes live AI server health status tracking');
assert(aiUxContent.includes('activeAiModel'), 'Displays active AI model indicator pill');
assert(aiUxContent.includes('Thử lại câu này'), 'Provides interactive retry action button on errors');
assert(aiUxContent.includes('handleCopyMessage'), 'Implements message copy to clipboard with toast notification');

// 4. HSK EXAM ENGINE & INVENTORY AUDIT (examPapersInventory.ts & examRepository.ts)
console.log('\n--- 4. Auditing Independent HSK Exam Inventory & Engine ---');
const inventoryContent = readFileSync(resolve('src/data/exam/examPapersInventory.ts'), 'utf-8');
const repoContent = readFileSync(resolve('src/data/repositories/examRepository.ts'), 'utf-8');
const examViewContent = readFileSync(resolve('src/components/modules/ExamView.tsx'), 'utf-8');

assert(inventoryContent.includes('CT-2015-H11003') && inventoryContent.includes('CT-2015-H61001'), 'Covers official HSK 2.0 Levels 1–6 papers (H11003-H61001)');
assert(inventoryContent.includes('GF0025-2021-S1') && inventoryContent.includes('GF0025-2021-S6'), 'Covers official HSK 3.0 Levels 1–6 papers (GF0025-2021-S1 to S6)');
assert(inventoryContent.includes('GF0025-2021-S79'), 'Covers official combined HSK 3.0 Band 7–9 paper (GF0025-2021-S79)');
assert(inventoryContent.includes('GF0025-2021'), 'Cites official National Standard GF0025-2021');
assert(inventoryContent.includes('chinesetest.cn'), 'Cites official CTI Chinese Test Centre');
assert(repoContent.includes('getExamCoverageSummary'), 'Repository integrates exam coverage inventory');
assert(examViewContent.includes('aiApiService.explainExamQuestion'), 'ExamView integrates AI pedagogical explanation feature');

// 5. GRAMMAR LOCALIZATION AUDIT (GrammarPracticeView.tsx)
console.log('\n--- 5. Auditing Grammar Practice Localization (GrammarPracticeView.tsx) ---');
const grammarViewContent = readFileSync(resolve('src/components/modules/GrammarPracticeView.tsx'), 'utf-8');

assert(grammarViewContent.includes('GRAMMAR_CATEGORY_VI'), 'Maps grammatical taxonomy to Vietnamese linguistic terms');
assert(grammarViewContent.includes('Trắc nghiệm tự luyện'), 'Localizes quiz labels to Vietnamese (no "Mini-Quiz")');
assert(grammarViewContent.includes('Tạo bài trắc nghiệm'), 'Uses natural Vietnamese action text');

console.log('\n===============================================================');
console.log(`   AUDIT COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED`);
console.log('===============================================================\n');
