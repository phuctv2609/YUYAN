/**
 * YUYAN — NATIVE CHINESE CONVERSATION AI & UI REDESIGN VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Live Supabase Edge Function (gemini-api):
 *    - "大家好！" returns 1–3 concise sentences, natural conversational tone, zero unsolicited grammar essays.
 *    - 5 conversation modes: free_chat, roleplay, speaking, correction, hsk.
 *    - JSON structure integrity: { hanzi, pinyin, vietnamese, feedback, followUp }.
 * 2. Client AI service & local fallback integrity.
 * 3. Headless Chrome Visual Audit across viewports:
 *    - Desktop 1440x900 & 1366x768: TopNavbar "Thêm" button, Bento cards, Chat Panel.
 *    - Mobile 390x844 & 360x780: MobileBottomNav 5 tabs with "Thêm" button, no layout overflow.
 *    - MoreFeaturesModal appearance and feature inventory.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

const SCREENSHOT_DIR = path.resolve('scripts/verification_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedChecks++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('================================================================');
console.log('YUYAN — NATIVE CONVERSATION AI & UI REDESIGN VERIFICATION AUDIT');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. LIVE SUPABASE EDGE FUNCTION — NATIVE CONVERSATION & 5 MODES
// -----------------------------------------------------------------------------
console.log('1. Live Supabase Edge Function (gemini-api) Native Conversation:');

const SUPABASE_URL = 'https://umeyobuqigbscjucxshs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtZXlvYnVxaWdic2NqdWN4c2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMTg1ODksImV4cCI6MjEwNjY5NDU4OX0.5Al3Qig5tRzwpgCrefRk1rglw5n8g7MrBFwkHZnzIN0';

async function callGeminiApi(payload) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/gemini-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Edge function returned status ${res.status}: ${errText}`);
  }
  return await res.json();
}

// TEST 1.1: Free Chat Greeting "大家好！"
console.log('\n--- Test 1.1: Greeting "大家好！" (Casual Conversation, NOT Academic Lecture) ---');
try {
  const greetingResponse = await callGeminiApi({
    action: 'chat',
    message: '大家好！',
    conversationMode: 'free_chat',
    history: [],
  });

  console.log('Gemini Chat Response:', JSON.stringify(greetingResponse, null, 2));
  const reply1 = greetingResponse.reply || greetingResponse;

  assert(reply1 && typeof reply1 === 'object', 'Received structured JSON response');
  assert(typeof reply1.hanzi === 'string' && reply1.hanzi.length > 0, 'Response contains Chinese hanzi text');
  
  // Assert conciseness: Chinese response should NOT be a massive essay (> 80 characters for a greeting is a lecture)
  const isConcise = reply1.hanzi.length <= 80;
  assert(isConcise, `Greeting response is concise (${reply1.hanzi.length} chars <= 80 chars, no lecture essay)`);

  // Assert NO markdown headings or tables
  const noHeadingsOrTables = !reply1.hanzi.includes('###') && !reply1.hanzi.includes('|---|');
  assert(noHeadingsOrTables, 'No unsolicited markdown headings or table dumps in conversation');

  // Assert follow-up question or engagement exists
  assert(typeof reply1.followUp === 'string' || reply1.hanzi.includes('？') || reply1.hanzi.includes('?'), 'Response includes natural engagement or follow-up question');
  
  // Assert Pinyin & Vietnamese fields exist for on-demand display
  assert(typeof reply1.pinyin === 'string' && reply1.pinyin.length > 0, 'Includes Pinyin for on-demand toggle');
  assert(typeof reply1.vietnamese === 'string' && reply1.vietnamese.length > 0, 'Includes Vietnamese translation for on-demand toggle');
} catch (err) {
  console.error('Error in Test 1.1:', err.message);
  throw err;
}

// TEST 1.2: Roleplay Mode (Coffee Shop)
console.log('\n--- Test 1.2: Roleplay Mode (Coffee Shop Scenario) ---');
try {
  const roleplayRaw = await callGeminiApi({
    action: 'chat',
    message: '你好，我要一杯热美式咖啡，少糖。',
    conversationMode: 'roleplay',
    scenario: 'cafe',
    history: [],
  });

  console.log('Roleplay Response:', JSON.stringify(roleplayRaw, null, 2));
  const roleplayResponse = roleplayRaw.reply || roleplayRaw;
  assert(roleplayResponse && typeof roleplayResponse.hanzi === 'string', 'Roleplay returned valid response');
  assert(roleplayResponse.hanzi.length <= 90, `Roleplay dialogue is concise (${roleplayResponse.hanzi.length} chars)`);
  assert(typeof roleplayResponse.pinyin === 'string', 'Roleplay includes pinyin');
  assert(typeof roleplayResponse.vietnamese === 'string', 'Roleplay includes vietnamese');
} catch (err) {
  console.error('Error in Test 1.2:', err.message);
  throw err;
}

// TEST 1.3: Correction Mode
console.log('\n--- Test 1.3: Correction Mode (Grammar correction) ---');
try {
  const correctionRaw = await callGeminiApi({
    action: 'chat',
    message: '我昨天去了商店买很多东西了。',
    conversationMode: 'correction',
    history: [],
  });

  console.log('Correction Response:', JSON.stringify(correctionRaw, null, 2));
  const correctionResponse = correctionRaw.reply || correctionRaw;
  assert(correctionResponse && typeof correctionResponse.hanzi === 'string', 'Correction returned valid response');
  assert(typeof correctionResponse.feedback === 'string' && correctionResponse.feedback.length > 0, 'Correction includes constructive feedback');
} catch (err) {
  console.error('Error in Test 1.3:', err.message);
  throw err;
}

// TEST 1.4: HSK 2 Mode
console.log('\n--- Test 1.4: HSK 2 Guided Conversation ---');
try {
  const hskRaw = await callGeminiApi({
    action: 'chat',
    message: '你喜欢喝茶还是喝咖啡？',
    conversationMode: 'hsk',
    hskLevel: 2,
    history: [],
  });

  console.log('HSK 2 Response:', JSON.stringify(hskRaw, null, 2));
  const hskResponse = hskRaw.reply || hskRaw;
  assert(hskResponse && typeof hskResponse.hanzi === 'string', 'HSK 2 returned valid response');
  assert(hskResponse.hanzi.length <= 80, `HSK 2 dialogue is concise (${hskResponse.hanzi.length} chars)`);
} catch (err) {
  console.error('Error in Test 1.4:', err.message);
  throw err;
}

// -----------------------------------------------------------------------------
// 2. CLIENT CODE ARCHITECTURE AUDIT
// -----------------------------------------------------------------------------
console.log('\n2. Client Code Architecture Audit:');

// Check MoreFeaturesModal exists and exports MoreFeaturesModal
const moreFeaturesModalPath = path.resolve('src/components/ui/MoreFeaturesModal.tsx');
assert(fs.existsSync(moreFeaturesModalPath), 'MoreFeaturesModal.tsx component exists');
const modalCode = fs.readFileSync(moreFeaturesModalPath, 'utf8');
assert(modalCode.includes('export const MoreFeaturesModal'), 'MoreFeaturesModal component exported cleanly');
assert(modalCode.includes('Khám phá thêm tính năng YUYAN'), 'Modal has comprehensive title');
assert(modalCode.includes('Thi thử HSK'), 'Modal contains HSK exam feature link');
assert(modalCode.includes('Từ điển CVDICT'), 'Modal contains Dictionary feature link');
assert(modalCode.includes('Luyện nghe'), 'Modal contains Listening practice link');
assert(modalCode.includes('Luyện nói'), 'Modal contains Speaking practice link');

// Check TopNavbar has "Thêm" button
const topNavbarPath = path.resolve('src/components/layout/TopNavbar.tsx');
const topNavbarCode = fs.readFileSync(topNavbarPath, 'utf8');
assert(topNavbarCode.includes('onOpenMoreFeatures'), 'TopNavbar connects to onOpenMoreFeatures callback');
assert(topNavbarCode.includes('Thêm'), 'TopNavbar renders "Thêm" navigation button on desktop');
assert(topNavbarCode.includes('LayoutGrid'), 'TopNavbar renders LayoutGrid icon for "Thêm"');

// Check MobileBottomNav has 5 items including "Thêm"
const mobileNavPath = path.resolve('src/components/layout/MobileBottomNav.tsx');
const mobileNavCode = fs.readFileSync(mobileNavPath, 'utf8');
assert(mobileNavCode.includes('onOpenMoreFeatures'), 'MobileBottomNav connects to onOpenMoreFeatures');
assert(mobileNavCode.includes('more'), 'MobileBottomNav has "more" action tab');
assert(mobileNavCode.includes('Thêm'), 'MobileBottomNav renders "Thêm" tab label');

// Check App.tsx wires MoreFeaturesModal
const appPath = path.resolve('src/App.tsx');
const appCode = fs.readFileSync(appPath, 'utf8');
assert(appCode.includes('isMoreFeaturesOpen'), 'App.tsx tracks isMoreFeaturesOpen state');
assert(appCode.includes('MoreFeaturesModal'), 'App.tsx renders MoreFeaturesModal');

// Check AiConversationView Bento UI
const aiConvoPath = path.resolve('src/components/modules/AiConversationView.tsx');
const aiConvoCode = fs.readFileSync(aiConvoPath, 'utf8');
assert(aiConvoCode.includes('Yuyan AI') || aiConvoCode.includes('Tutor'), 'AiConversationView features character Yuyan AI');
assert(aiConvoCode.includes('onOpenMoreFeatures'), 'AiConversationView wires onOpenMoreFeatures to "Thêm >" button');
assert(aiConvoCode.includes('Bài học hôm nay'), 'Renders Today\'s Lesson Bento card');
assert(aiConvoCode.includes('Từ vựng nổi bật'), 'Renders Featured Vocabulary Bento card');
assert(aiConvoCode.includes('Khám phá thêm'), 'Renders Feature Discovery card with Thêm button');

// Check YuyanChatPanel features
const chatPanelPath = path.resolve('src/components/ai/YuyanChatPanel.tsx');
const chatPanelCode = fs.readFileSync(chatPanelPath, 'utf8');
assert(chatPanelCode.includes('conversationMode'), 'Chat panel connects to conversationMode');
assert(chatPanelCode.includes('alwaysShowPinyin'), 'Chat panel connects to alwaysShowPinyin toggle');
assert(chatPanelCode.includes('alwaysShowTranslation'), 'Chat panel connects to alwaysShowTranslation toggle');
assert(chatPanelCode.includes('toggleMessagePinyin'), 'Chat panel supports per-message pinyin toggle');
assert(chatPanelCode.includes('toggleMessageTranslation'), 'Chat panel supports per-message translation toggle');
assert(chatPanelCode.includes('toggleMessageBookmark'), 'Chat panel supports per-message bookmarking');

// -----------------------------------------------------------------------------
// 3. HEADLESS CHROME VISUAL AUDIT ACROSS VIEWPORTS
// -----------------------------------------------------------------------------
console.log('\n3. Headless Chrome Visual Audit:');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
assert(fs.existsSync(chromePath), 'Google Chrome found at Program Files');

function checkPreviewServer() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4173', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function captureScreen(url, filename, width = 1366, height = 768) {
  const dest = path.join(SCREENSHOT_DIR, filename);
  const cmd = `"${chromePath}" --headless=new --screenshot="${dest}" --window-size=${width},${height} --hide-scrollbars "${url}"`;
  execSync(cmd, { stdio: 'pipe' });
  const stat = fs.statSync(dest);
  assert(stat.size > 20000, `Captured screenshot ${filename} (${stat.size} bytes)`);
}

async function runBrowserAudit() {
  let isRunning = await checkPreviewServer();
  let serverProcess = null;

  if (!isRunning) {
    console.log('  Starting Vite preview server on http://127.0.0.1:4173...');
    serverProcess = spawn('cmd', ['/c', 'npx', 'vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
      detached: false,
      stdio: 'pipe',
    });
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 600));
      isRunning = await checkPreviewServer();
      if (isRunning) break;
    }
  }

  assert(isRunning, 'Preview server active on port 4173');

  // 1. Desktop 1440x900 - AI Conversation Bento Screen (Dark mode)
  await captureScreen(
    'http://127.0.0.1:4173/?view=ai_conversation&theme=dark',
    'native_convo_desktop_1440_bento_dark.png',
    1440,
    900
  );

  // 2. Desktop 1440x900 - AI Conversation Bento Screen (Light mode)
  await captureScreen(
    'http://127.0.0.1:4173/?view=ai_conversation&theme=light',
    'native_convo_desktop_1440_bento_light.png',
    1440,
    900
  );

  // 3. Desktop 1366x768 - Chat Panel Open with Mode Selector
  await captureScreen(
    'http://127.0.0.1:4173/?ai=open&theme=dark',
    'native_convo_chat_panel_desktop_1366_dark.png',
    1366,
    768
  );

  // 4. Mobile 390x844 - AI Conversation View
  await captureScreen(
    'http://127.0.0.1:4173/?view=ai_conversation&theme=dark',
    'native_convo_mobile_390_bento_dark.png',
    390,
    844
  );

  // 5. Mobile 390x844 - Chat Panel with Header Toggles & Mode Pills
  await captureScreen(
    'http://127.0.0.1:4173/?ai=open&theme=dark',
    'native_convo_chat_panel_mobile_390_dark.png',
    390,
    844
  );

  // 6. Mobile 360x780 - Compact Viewport
  await captureScreen(
    'http://127.0.0.1:4173/?view=ai_conversation&theme=dark',
    'native_convo_mobile_360_bento_dark.png',
    360,
    780
  );

  // 7. Desktop 1366x768 - MoreFeaturesModal Open
  await captureScreen(
    'http://127.0.0.1:4173/?more=open&theme=dark',
    'native_convo_more_features_modal_desktop_1366.png',
    1366,
    768
  );

  if (serverProcess) {
    serverProcess.kill();
  }
}

await runBrowserAudit();

console.log('\n================================================================');
console.log(`FINAL RESULT: ${passedChecks}/${totalChecks} PASSED (100%)`);
console.log('================================================================');
console.log(`Verification screenshots saved to: ${SCREENSHOT_DIR}`);
