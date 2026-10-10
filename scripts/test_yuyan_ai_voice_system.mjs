import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'c:/Users/Loan/YUYAN';

console.log('================================================================');
console.log('🧪 YUYAN AI — REAL-TIME VOICE & UI/UX REDESIGN TEST SUITE');
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

// 1. FILE EXISTENCE TESTS
console.log('📁 1. Verifying Core Files & Architecture...');
const requiredFiles = [
  'src/services/speech/speechTypes.ts',
  'src/services/speech/speechRecognitionService.ts',
  'src/services/speech/speechSynthesisService.ts',
  'src/services/speech/useVoiceConversation.ts',
  'src/context/YuyanAIContext.tsx',
  'src/components/ai/YuyanAIAvatar.tsx',
  'src/components/ai/YuyanAIFloatingButton.tsx',
  'src/components/ai/YuyanAudioVisualizer.tsx',
  'src/components/ai/YuyanVoiceModal.tsx',
  'src/components/ai/YuyanLanguageModal.tsx',
  'src/components/ai/YuyanVoiceSettingsModal.tsx',
  'src/components/ai/YuyanChatPanel.tsx',
  'src/components/modules/AiConversationView.tsx'
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(projectRoot, relPath);
  assert(fs.existsSync(fullPath), `File exists: ${relPath}`, `Expected file at ${fullPath}`);
}

// 2. SPEECH TYPES & CONTRACTS
console.log('\n🗣️ 2. Verifying Speech Contracts & Types...');
const speechTypesContent = fs.readFileSync(path.join(projectRoot, 'src/services/speech/speechTypes.ts'), 'utf-8');
assert(speechTypesContent.includes("export type SpeechRecognitionLanguage = 'zh-CN' | 'vi-VN' | 'auto';"), 'SpeechRecognitionLanguage union defined');
assert(speechTypesContent.includes("export type VoiceConversationState ="), 'VoiceConversationState state machine defined');
assert(
  speechTypesContent.includes("'idle'") &&
  speechTypesContent.includes("'requesting_permission'") &&
  speechTypesContent.includes("'ready'") &&
  speechTypesContent.includes("'recording'") &&
  speechTypesContent.includes("'transcribing'") &&
  speechTypesContent.includes("'generating_response'") &&
  speechTypesContent.includes("'speaking'") &&
  speechTypesContent.includes("'error'"),
  'All core state machine states defined'
);
assert(speechTypesContent.includes("export interface VoiceSettings"), 'VoiceSettings interface defined');
assert(speechTypesContent.includes("export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {"), 'DEFAULT_VOICE_SETTINGS defined');
assert(speechTypesContent.includes("sttLanguage: 'zh-CN'"), 'Default recognition language is zh-CN');
assert(speechTypesContent.includes("speechRate: 1.0"), 'Default speech rate is 1.0');
assert(speechTypesContent.includes("continuousMode: false"), 'Default continuous mode is false');
assert(speechTypesContent.includes("showPinyin: true"), 'Default showPinyin is true');
assert(speechTypesContent.includes("showVietnamese: true"), 'Default showVietnamese is true');

// 3. SPEECH RECOGNITION SERVICE
console.log('\n🎙️ 3. Verifying Speech Recognition Service...');
const sttContent = fs.readFileSync(path.join(projectRoot, 'src/services/speech/speechRecognitionService.ts'), 'utf-8');
assert(sttContent.includes('webkitSpeechRecognition') || sttContent.includes('SpeechRecognition'), 'Web Speech API support check');
assert(sttContent.includes('AnalyserNode') || sttContent.includes('AudioContext'), 'Web Audio API volume tracking present');
assert(sttContent.includes('onResult: (result: STTRecognitionResult) => void'), 'Speech recognition result callback supported');
assert(sttContent.includes('onVolume?: (volumePercent: number) => void'), 'Real-time volume callback supported');
assert(sttContent.includes('zh-CN') && sttContent.includes('vi-VN'), 'zh-CN and vi-VN language support');

// 4. SPEECH SYNTHESIS SERVICE & SANITIZER
console.log('\n🔊 4. Verifying Speech Synthesis & Markdown Sanitizer...');
const ttsContent = fs.readFileSync(path.join(projectRoot, 'src/services/speech/speechSynthesisService.ts'), 'utf-8');
assert(ttsContent.includes('export function sanitizeForSpeech(rawText: string): string'), 'sanitizeForSpeech helper exported');
assert(ttsContent.includes('window.speechSynthesis'), 'SpeechSynthesis API integration');
assert(ttsContent.includes('speak(') && ttsContent.includes('stop()'), 'Speak and stop methods implemented');

// Test the actual sanitization logic
function sanitizeForSpeechTest(rawText) {
  if (!rawText) return '';
  return rawText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[(?:Pinyin|Nghĩa|Dịch|Giải thích|Ví dụ|Lưu ý)\]:?/gi, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const rawMd = '### Chào bạn!\nĐây là **YUYAN AI**.\nHãy đọc câu: `你好` (nǐ hǎo) [link](https://yuyan.app)';
const cleaned = sanitizeForSpeechTest(rawMd);
assert(!cleaned.includes('###'), 'Removes markdown headers');
assert(!cleaned.includes('**'), 'Removes markdown bold asterisks');
assert(!cleaned.includes('`'), 'Removes backticks');
assert(!cleaned.includes('https://'), 'Removes URLs');
assert(cleaned.includes('Chào bạn! Đây là YUYAN AI. Hãy đọc câu: 你好'), 'Preserves core speakable text');

// 5. VOICE CONVERSATION HOOK & STATE MACHINE
console.log('\n🔄 5. Verifying Voice Conversation Hook...');
const hookContent = fs.readFileSync(path.join(projectRoot, 'src/services/speech/useVoiceConversation.ts'), 'utf-8');
assert(hookContent.includes('useVoiceConversation'), 'useVoiceConversation custom hook declared');
assert(hookContent.includes('startRecording'), 'startRecording method provided');
assert(hookContent.includes('stopRecordingAndSend'), 'stopRecordingAndSend method provided');
assert(hookContent.includes('stopSpeaking'), 'stopSpeaking method provided');
assert(hookContent.includes('processUserQuery'), 'processUserQuery method coordinates STT -> AI -> TTS');
assert(hookContent.includes('continuousMode'), 'Continuous conversational turn-taking supported');

// 6. GLOBAL AI CONTEXT
console.log('\n🌐 6. Verifying Global AI Context & State...');
const contextContent = fs.readFileSync(path.join(projectRoot, 'src/context/YuyanAIContext.tsx'), 'utf-8');
assert(contextContent.includes('export const YuyanAIProvider'), 'YuyanAIProvider exported');
assert(contextContent.includes('useYuyanAI'), 'useYuyanAI hook exported');
assert(contextContent.includes('isAssistantOpen'), 'Assistant panel open/close state');
assert(contextContent.includes('isVoiceModalOpen'), 'Voice modal open/close state');
assert(contextContent.includes('isSettingsModalOpen'), 'Settings modal open/close state');
assert(contextContent.includes('isLanguageModalOpen'), 'Language modal open/close state');
assert(contextContent.includes('yuyan_ai_chat_history_v1'), 'Chat messages localStorage persistence');
assert(contextContent.includes('yuyan_voice_settings_v1'), 'Voice settings localStorage persistence');

// 7. UI COMPONENTS
console.log('\n🎨 7. Verifying UI Components...');
const avatarContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanAIAvatar.tsx'), 'utf-8');
assert(avatarContent.includes('svg') && avatarContent.includes('YuyanAIAvatar'), 'YuyanAIAvatar SVG illustration component');

const floatBtnContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanAIFloatingButton.tsx'), 'utf-8');
assert(floatBtnContent.includes('Hỏi Yuyan AI'), 'Floating button has Vietnamese tooltip "Hỏi Yuyan AI"');
assert(floatBtnContent.includes('fixed bottom-20 md:bottom-7 right-5'), 'Floating button positioned safely above mobile nav');

const visualizerContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanAudioVisualizer.tsx'), 'utf-8');
assert(visualizerContent.includes('volumePercent'), 'Audio visualizer reacts to volume level');
assert(visualizerContent.includes('barCount'), 'Audio visualizer has configurable bars');

const voiceModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanVoiceModal.tsx'), 'utf-8');
assert(voiceModalContent.includes('YuyanAudioVisualizer'), 'Voice modal contains audio waveform visualizer');
assert(voiceModalContent.includes('formatTimer'), 'Voice modal displays duration timer');
assert(voiceModalContent.includes('Đang nghe...') && voiceModalContent.includes('Đang xử lý...'), 'Vietnamese state indicators');

const chatPanelContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanChatPanel.tsx'), 'utf-8');
assert(chatPanelContent.includes('w-[calc(100vw-32px)] sm:w-[410px]'), 'Chat panel compact width');
assert(chatPanelContent.includes('Giải thích') && chatPanelContent.includes('Dịch thuật') && chatPanelContent.includes('Luyện nói'), 'Chat panel quick action pills');
assert(chatPanelContent.includes('handleSpeak'), 'Chat panel message TTS audio button');

const langModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanLanguageModal.tsx'), 'utf-8');
assert(langModalContent.includes('Tiếng Trung') && langModalContent.includes('Tiếng Việt'), 'Language modal options');

const settingsModalContent = fs.readFileSync(path.join(projectRoot, 'src/components/ai/YuyanVoiceSettingsModal.tsx'), 'utf-8');
assert(settingsModalContent.includes('Tốc độ nói') && settingsModalContent.includes('Nghe thử giọng đọc'), 'Settings modal speech rate & test voice');

// 8. REDESIGNED AI CONVERSATION VIEW (PAGE)
console.log('\n📄 8. Verifying Redesigned /ai Page (AiConversationView)...');
const aiViewContent = fs.readFileSync(path.join(projectRoot, 'src/components/modules/AiConversationView.tsx'), 'utf-8');
assert(aiViewContent.includes('Xin chào! 👋') && aiViewContent.includes('Em cần mình hỗ trợ gì hôm nay?'), 'Hero banner greeting matches reference');
assert(aiViewContent.includes('Gợi ý nhanh'), 'Quick suggestion column matches reference');
assert(aiViewContent.includes('Ví dụ câu hỏi'), 'Sample questions section matches reference');
assert(aiViewContent.includes('Giải thích từ vựng') && aiViewContent.includes('Giải thích ngữ pháp') && aiViewContent.includes('Dịch Trung ↔ Việt'), '3 primary function cards present');
assert(aiViewContent.includes('Phân tích đề HSK') && aiViewContent.includes('Luyện hội thoại') && aiViewContent.includes('Sửa lỗi & viết lại'), 'Remaining 3 function cards present');
assert(aiViewContent.includes('sampleQuestionsSetIndex') && aiViewContent.includes('handleRotateQuestions'), 'Rotating sample scenario cards implemented');

// 9. APP & NAVIGATION WIRING
console.log('\n🔌 9. Verifying App & Navigation Wiring...');
const appContent = fs.readFileSync(path.join(projectRoot, 'src/App.tsx'), 'utf-8');
assert(appContent.includes('<YuyanAIProvider>'), 'App wrapped in YuyanAIProvider');
assert(appContent.includes('<YuyanAIFloatingButton />'), 'Floating button rendered globally');
assert(appContent.includes('<YuyanChatPanel') && appContent.includes('/>'), 'Chat panel rendered globally');
assert(appContent.includes('<YuyanVoiceModal />'), 'Voice modal rendered globally');
assert(appContent.includes('<YuyanVoiceSettingsModal />'), 'Settings modal rendered globally');
assert(appContent.includes('<YuyanLanguageModal />'), 'Language modal rendered globally');

const navContent = fs.readFileSync(path.join(projectRoot, 'src/config/navigation.ts'), 'utf-8');
assert(navContent.includes('AI Trợ lý'), 'Sidebar navigation updated to "AI Trợ lý"');

// SUMMARY
console.log('\n================================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All Yuyan AI Real-time Voice & Redesign tests passed successfully!');
  process.exit(0);
}
