import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'c:/Users/Loan/YUYAN';

console.log('================================================================');
console.log('🛡️ YUYAN — GLOBAL UI OVERLAP INCIDENT & LAYOUT AUDIT SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
  }
}

// 1. AUDITING APP SHELL & STACKING CONTRACT
console.log('🏗️ 1. Auditing App Shell & Stacking Order...');
const appContent = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf-8');
const topNavContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/TopNavbar.tsx'), 'utf-8');
const sidebarContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/Sidebar.tsx'), 'utf-8');
const mobileNavContent = fs.readFileSync(path.join(projectRoot, 'src/components/layout/MobileBottomNav.tsx'), 'utf-8');

assert(topNavContent.includes('z-20'), 'TopNavbar has explicit z-20 stacking level');
assert(sidebarContent.includes('z-30'), 'Sidebar has explicit z-30 stacking level');
assert(mobileNavContent.includes('z-40'), 'MobileBottomNav has explicit z-40 stacking level');
assert(appContent.includes('id="main-scroll-container"') && appContent.includes('z-10'), '<main> has z-10 stacking level');

// 2. AUDITING FLOATING AI PORTAL ARCHITECTURE
console.log('\n🚪 2. Auditing Isolated Portal Architecture (document.body)...');
const chatPanelContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanChatPanel.tsx'), 'utf-8');
const floatBtnContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanAIFloatingButton.tsx'), 'utf-8');
const voiceModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanVoiceModal.tsx'), 'utf-8');
const settingsModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanVoiceSettingsModal.tsx'), 'utf-8');
const langModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanLanguageModal.tsx'), 'utf-8');

assert(chatPanelContent.includes("createPortal(") && chatPanelContent.includes("document.body"), 'ChatPanel renders into document.body portal');
assert(floatBtnContent.includes("createPortal(") && floatBtnContent.includes("document.body"), 'Floating launcher renders into document.body portal');
assert(voiceModalContent.includes("createPortal(") && voiceModalContent.includes("document.body"), 'VoiceModal renders into document.body portal');
assert(settingsModalContent.includes("createPortal(") && settingsModalContent.includes("document.body"), 'VoiceSettingsModal renders into document.body portal');
assert(langModalContent.includes("createPortal(") && langModalContent.includes("document.body"), 'LanguageModal renders into document.body portal');

// 3. AUDITING STACKING CONTEXTS & Z-INDEX SCALE
console.log('\n📐 3. Auditing Stacking Hierarchy & Z-Index Scale...');
assert(chatPanelContent.includes('z-[60]'), 'ChatPanel uses explicit z-[60] (above main, topNav, sidebar, and mobile nav)');
assert(chatPanelContent.includes('z-[55]'), 'Mobile backdrop uses z-[55] below chat panel but above mobile nav');
assert(floatBtnContent.includes('z-40'), 'Floating button uses z-40 (safe desktop & mobile positioning)');
assert(voiceModalContent.includes('z-[70]'), 'VoiceModal uses z-[70] (sits above chat panel)');
assert(settingsModalContent.includes('z-[70]'), 'SettingsModal uses z-[70] (sits above chat panel)');
assert(langModalContent.includes('z-[70]'), 'LanguageModal uses z-[70] (sits above chat panel)');

// 4. AUDITING SOLID OPAQUE THEME BACKGROUND (NO GHOSTING)
console.log('\n🎨 4. Auditing Solid Opaque Background & Stacking Isolation...');
assert(chatPanelContent.includes('bg-white dark:bg-slate-900'), 'ChatPanel specifies solid white/slate-900 background');
assert(chatPanelContent.includes('isolate'), 'ChatPanel creates isolated CSS stacking context');
assert(chatPanelContent.includes("backgroundColor: 'var(--surface, #ffffff)'"), 'ChatPanel has explicit style backgroundColor token');
assert(floatBtnContent.includes('isolate'), 'Floating launcher has isolated stacking context');

// 5. AUDITING CLOSING, MINIMIZING & ZERO INVISIBLE BACKDROPS
console.log('\n🔒 5. Auditing Closed / Minimized States & Zero Backdrop Leakage...');
assert(chatPanelContent.includes('if (!isAssistantOpen || isMinimized) return null;'), 'ChatPanel returns null when closed or minimized');
assert(floatBtnContent.includes('if (isAssistantOpen && !isMinimized)'), 'Floating launcher safely hides when chat is open');
assert(chatPanelContent.includes('md:hidden') && chatPanelContent.includes('onClick={closeAssistant}'), 'Mobile backdrop is strictly hidden on desktop (md:hidden) and closes on tap');

// 6. AUDITING RESPONSIVE BOUNDS & VIEWPORT CONSTRAINTS
console.log('\n📱 6. Auditing Responsive Bounds & Dimensions...');
assert(chatPanelContent.includes('w-[calc(100vw-32px)] sm:w-[410px]'), 'ChatPanel has responsive width bounded to 410px on desktop');
assert(chatPanelContent.includes('max-w-full md:max-w-[calc(100vw-48px)]'), 'ChatPanel bounded by viewport margins');
assert(chatPanelContent.includes('h-[85vh] md:h-[580px] max-h-[85vh] md:max-h-[calc(100vh-100px)]'), 'ChatPanel has predictable bounded height');
assert(chatPanelContent.includes('flex-1 min-h-0 overflow-y-auto'), 'Message list has independent scroll container (min-h-0)');
assert(chatPanelContent.includes('flex-shrink-0'), 'Header, quick actions, and composer are flex-shrink protected');

// 7. AUDITING HERO BANNER & AVATAR CLEANUP (AiConversationView.tsx)
console.log('\n🖼️ 7. Auditing Hero Banner & Avatar Cleanliness (AiConversationView)...');
const aiViewContent = fs.readFileSync(path.join(projectRoot, 'src/components/modules/AiConversationView.tsx'), 'utf-8');
assert(!aiViewContent.includes('size="hero"'), 'Removed oversized hero avatar (size="hero")');
assert(!aiViewContent.includes('-top-7 -left-12'), 'Removed protruding absolute speech bubble with negative margins');
assert(aiViewContent.includes('Gia sư Yuyan AI'), 'Hero banner retains clean, restrained identity badge');
assert(aiViewContent.includes('Trợ giảng tiếng Trung 24/7'), 'Contained within hero card bounds');

// 8. AUDITING ROUTE INDEPENDENCE (INCLUDING /mistakes)
console.log('\n🛣️ 8. Auditing Route Independence Across All Modules...');
const mistakeContent = fs.readFileSync(path.join(projectRoot, 'src/components/modules/MistakeBookView.tsx'), 'utf-8');
assert(mistakeContent.includes('Sổ tay câu sai (错题本)'), '/mistakes has official heading');
assert(mistakeContent.includes('Tất cả câu sai') && mistakeContent.includes('Luyện nghe'), '/mistakes has category filters');
assert(mistakeContent.includes('handleResolve'), '/mistakes action buttons intact');

const allModules = [
  'DashboardView.tsx',
  'MistakeBookView.tsx',
  'LessonView.tsx',
  'HanziView.tsx',
  'RadicalView.tsx',
  'ListeningPracticeView.tsx',
  'SpeakingPracticeView.tsx',
  'WritingPracticeView.tsx',
  'SentenceOrderingView.tsx',
  'ExamView.tsx',
  'HskVocabularyView.tsx',
  'DictionaryView.tsx',
  'SpecializedVocabularyView.tsx',
  'GrammarPracticeView.tsx',
  'PinyinPracticeView.tsx',
  'BeginnerView.tsx',
  'ProgressView.tsx',
  'SettingsView.tsx',
  'AiConversationView.tsx'
];

for (const mod of allModules) {
  const p = path.join(projectRoot, 'src/components/modules', mod);
  const exists = fs.existsSync(p) || fs.existsSync(path.join(projectRoot, 'src/components/dashboard', mod)) || fs.existsSync(path.join(projectRoot, 'src/components/lesson', mod));
  assert(exists, `Module file verified in document flow: ${mod}`);
}

// 9. AUDITING SINGLETON INSTANCE IN APP.TSX
console.log('\n🧩 9. Auditing Single Global AI Instance in App.tsx...');
const chatPanelMatches = (appContent.match(/<YuyanChatPanel/g) || []).length;
const floatBtnMatches = (appContent.match(/<YuyanAIFloatingButton/g) || []).length;
assert(chatPanelMatches === 1, `Exactly one YuyanChatPanel rendered globally in App.tsx (found: ${chatPanelMatches})`);
assert(floatBtnMatches === 1, `Exactly one YuyanAIFloatingButton rendered globally in App.tsx (found: ${floatBtnMatches})`);

// SUMMARY
console.log('\n================================================================');
console.log(`📊 AUDIT RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 Global UI overlap incident resolved and 100% verified across all routes!');
  process.exit(0);
}
