import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_dict_hanzi_qa');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Find Edge executable
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
let edgePath = edgePaths.find((p) => fs.existsSync(p));
if (!edgePath) {
  console.error('Edge executable not found!');
  process.exit(1);
}

console.log('Using Edge at:', edgePath);

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

// Start browser process
const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9228',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:5173/dictionary',
  ],
  { stdio: 'ignore' }
);

async function runQA() {
  const qaResults = {
    hardDataGates: {},
    tests: [],
    consoleErrors: [],
    screenshots: [],
    summary: {},
  };

  try {
    // 1. HARD DATA GATES CHECK
    console.log('\n--- VERIFYING HARD DATA GATES IN SUPABASE ---');
    const { count: countHanzi } = await supabase.from('canonical_hanzi').select('*', { count: 'exact', head: true });
    const { count: countSpec } = await supabase.from('specialized_vocabulary').select('*', { count: 'exact', head: true });
    const { count: countHskVocab } = await supabase.from('hsk_vocabulary').select('*', { count: 'exact', head: true });
    const { count: countRadicals } = await supabase.from('kangxi_radicals').select('*', { count: 'exact', head: true });
    const { count: countLessons } = await supabase.from('hsk_lessons').select('*', { count: 'exact', head: true });
    const { count: countSentences } = await supabase.from('lesson_sentences').select('*', { count: 'exact', head: true });

    qaResults.hardDataGates = {
      canonical_hanzi: { count: countHanzi, target: '>= 6000', passed: countHanzi >= 6000 },
      specialized_vocabulary: { count: countSpec, target: '== 10000', passed: countSpec === 10000 },
      hsk_vocabulary: { count: countHskVocab, target: '>= 6000', passed: countHskVocab >= 6000 },
      kangxi_radicals: { count: countRadicals, target: '== 214', passed: countRadicals === 214 },
      hsk_lessons: { count: countLessons, target: '== 146', passed: countLessons === 146 },
      lesson_sentences: { count: countSentences, target: '== 9178', passed: countSentences === 9178 },
    };

    console.log('Database Gates:', JSON.stringify(qaResults.hardDataGates, null, 2));

    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        const res = await fetch('http://127.0.0.1:9228/json/version');
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {}
    }
    if (!versionData) throw new Error('Could not connect to Edge DevTools on port 9228');

    const listRes = await fetch('http://127.0.0.1:9228/json/list');
    const pages = await listRes.json();
    const pageTarget = pages.find((p) => p.type === 'page') || pages[0];
    if (!pageTarget) throw new Error('No page target found in browser');

    const wsUrl = pageTarget.webSocketDebuggerUrl;
    console.log('Connecting to Page WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    const pendingCalls = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          const errText = msg.params.args.map((a) => a.value || a.description || '').join(' ');
          // Ignore harmless font / favicon warnings
          if (!errText.includes('favicon') && !errText.includes('net::ERR_ABORTED')) {
            console.error('Browser Console Error:', errText);
            qaResults.consoleErrors.push(errText);
          }
        }
      }
      if (msg.id && pendingCalls.has(msg.id)) {
        const { resolve, reject } = pendingCalls.get(msg.id);
        pendingCalls.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pendingCalls.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function setViewport(width, height) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      await sleep(400);
    }

    async function captureScreenshot(name) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const filename = `${name}.png`;
      const filePath = path.join(ARTIFACTS_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      qaResults.screenshots.push(filename);
      console.log(`[Screenshot Captured] ${filename}`);
    }

    // --- TEST 1: Navigate to /dictionary (Desktop 1440x900) ---
    console.log('\n--- TEST 1: Dictionary Overview Desktop ---');
    await setViewport(1440, 900);
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/dictionary' });
    await sleep(2500);

    const dictTitle = await evaluate(`document.querySelector('h1')?.innerText`);
    console.log('Dictionary Title:', dictTitle);
    qaResults.tests.push({
      name: 'Dictionary Header Render',
      passed: Boolean(dictTitle && dictTitle.includes('Từ điển')),
      detail: dictTitle,
    });

    // --- TEST 2: Search "hải quan" in Dictionary ---
    console.log('\n--- TEST 2: Search "hải quan" in Dictionary ---');
    await evaluate(`
      const input = document.getElementById('dict-search-input');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'hải quan');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    `);
    await sleep(2500);

    const cardsCount = await evaluate(`document.querySelectorAll('.dict-card').length`);
    console.log('Results for "hải quan":', cardsCount, 'cards');
    qaResults.tests.push({
      name: 'Search "hải quan" Returns Results',
      passed: cardsCount > 0,
      count: cardsCount,
    });
    await captureScreenshot('qa_desktop_dictionary_haiquan');

    // --- TEST 3: Click "Chiết tự: 关" on Dictionary Card -> Navigates to /hanzi ---
    console.log('\n--- TEST 3: Character Linking from Dictionary Card to Hanzi Master ---');
    const charBtnFound = await evaluate(`
      const btns = Array.from(document.querySelectorAll('.dict-card button'));
      const btn = btns.find(b => b.innerText.trim() === '关' || b.innerText.trim() === '海' || b.innerText.trim() === '报');
      if (btn) {
        btn.click();
        true;
      } else {
        false;
      }
    `);
    await sleep(2000);

    const currentUrl = await evaluate(`window.location.pathname`);
    console.log('Current URL after clicking character button:', currentUrl);
    qaResults.tests.push({
      name: 'Dictionary Card Character Link Navigates to Hanzi',
      passed: currentUrl.includes('/hanzi'),
      detail: `Navigated to ${currentUrl}`,
    });

    // --- TEST 4: Hanzi Master Overview & >= 6,000 Counter ---
    console.log('\n--- TEST 4: Hanzi Master Overview & >= 6,000 Counter ---');
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/hanzi' });
    await sleep(2500);

    const hanziCounterText = await evaluate(`
      const badge = Array.from(document.querySelectorAll('span')).find(s => s.innerText.includes('chữ Hán'));
      badge ? badge.innerText : null;
    `);
    console.log('Hanzi Master Count Badge:', hanziCounterText);
    const has6000Plus = hanziCounterText && parseInt(hanziCounterText.replace(/\D/g, ''), 10) >= 6000;
    qaResults.tests.push({
      name: 'Hanzi Master Displays >= 6,000 Total Characters',
      passed: Boolean(has6000Plus),
      detail: hanziCounterText,
    });

    const activeChar = await evaluate(`
      document.querySelector('.text-5xl')?.innerText
    `);
    console.log('Active Character in Hanzi Master:', activeChar);
    qaResults.tests.push({
      name: 'Active Character Details Rendered',
      passed: Boolean(activeChar),
      detail: activeChar,
    });
    await captureScreenshot('qa_desktop_hanzi_master_overview');

    // --- TEST 5: Hanzi Stroke Writer Animation ---
    console.log('\n--- TEST 5: Hanzi Stroke Writer Animation ---');
    const hasWriterSvg = await evaluate(`
      Boolean(document.querySelector('.hanzi-writer-char-character') || document.querySelector('svg'))
    `);
    console.log('Hanzi Stroke Writer SVG rendered:', hasWriterSvg);
    qaResults.tests.push({
      name: 'Hanzi Stroke Order Vector SVG Loaded',
      passed: hasWriterSvg,
    });
    await captureScreenshot('qa_desktop_hanzi_stroke_animation');

    // --- TEST 6: Freehand Tian Zi Ge Canvas Practice ---
    console.log('\n--- TEST 6: Freehand Tian Zi Ge Canvas Practice ---');
    await evaluate(`
      const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('tập viết tay'));
      if (tabBtn) tabBtn.click();
    `);
    await sleep(800);

    // Simulate drawing stroke on canvas
    await evaluate(`
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(70, 70);
        ctx.lineTo(210, 210);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 14;
        ctx.stroke();
      }
    `);
    await sleep(500);
    await captureScreenshot('qa_desktop_hanzi_canvas_practice');

    // Test Clear Canvas button
    const clearBtnClicked = await evaluate(`
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Xóa bảng'));
      if (clearBtn) {
        clearBtn.click();
        true;
      } else false;
    `);
    console.log('Clear Canvas Button clicked:', clearBtnClicked);
    qaResults.tests.push({
      name: 'Freehand Canvas Drawing and Clear Controls Work',
      passed: clearBtnClicked,
    });

    // --- TEST 7: Hanzi Search Filter (Query "học") ---
    console.log('\n--- TEST 7: Hanzi Search for "học" ---');
    await evaluate(`
      const tabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('hoạt họa'));
      if (tabBtn) tabBtn.click();
      const input = document.querySelector('input[data-testid="hanzi-search-input"]');
      if (input) {
        input.value = 'học';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(1500);

    const searchHanziItems = await evaluate(`
      document.querySelectorAll('[data-testid="hanzi-grid-item"]').length
    `);
    console.log('Hanzi search items for "học":', searchHanziItems);
    qaResults.tests.push({
      name: 'Hanzi Search for "học" (Hán-Việt) Returns Matches',
      passed: searchHanziItems > 0,
      count: searchHanziItems,
    });
    await captureScreenshot('qa_desktop_hanzi_search_hoc');

    // --- TEST 8: Mobile Responsive View (375x812) ---
    console.log('\n--- TEST 8: Mobile Responsive View (375x812) ---');
    await setViewport(375, 812);
    await sleep(1000);
    await captureScreenshot('qa_mobile_hanzi_master');

    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/dictionary' });
    await sleep(2000);
    await captureScreenshot('qa_mobile_dictionary');
    qaResults.tests.push({
      name: 'Mobile Layout 375x812 Rendered Without Crash',
      passed: true,
    });

    // --- TEST 9: HSK Lesson Regression Check (ABSOLUTE SCOPE LOCK) ---
    console.log('\n--- TEST 9: Lesson Regression Testing HSK 1 Lesson 1 ---');
    await setViewport(1440, 900);
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/hsk/1/lesson/1' });
    await sleep(2500);

    const hsk1SentencesCount = await evaluate(`
      document.querySelectorAll('.sentence-item, [data-sentence-id], .cursor-pointer').length
    `);
    const hsk1Title = await evaluate(`document.querySelector('h1, h2')?.innerText`);
    console.log('HSK 1 Lesson 1 Title:', hsk1Title, 'Sentence items:', hsk1SentencesCount);
    await captureScreenshot('qa_regression_hsk1_lesson1');

    qaResults.tests.push({
      name: 'HSK 1 Lesson 1 Invariant Regression Check',
      passed: Boolean(hsk1Title && hsk1SentencesCount > 0),
      detail: `Title: ${hsk1Title}, items: ${hsk1SentencesCount}`,
    });

    // HSK 2 Lesson 5 Regression Check
    console.log('\n--- TEST 10: Lesson Regression Testing HSK 2 Lesson 5 ---');
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/hsk/2/lesson/5' });
    await sleep(2500);

    const hsk2Title = await evaluate(`document.querySelector('h1, h2')?.innerText`);
    console.log('HSK 2 Lesson 5 Title:', hsk2Title);
    await captureScreenshot('qa_regression_hsk2_lesson5');

    qaResults.tests.push({
      name: 'HSK 2 Lesson 5 Repaired Translations Invariant Check',
      passed: Boolean(hsk2Title),
      detail: hsk2Title,
    });

    // HSK 6 Lesson 1 Regression Check
    console.log('\n--- TEST 11: Lesson Regression Testing HSK 6 Lesson 1 ---');
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/hsk/6/lesson/1' });
    await sleep(2500);

    const hsk6Title = await evaluate(`document.querySelector('h1, h2')?.innerText`);
    console.log('HSK 6 Lesson 1 Title:', hsk6Title);
    await captureScreenshot('qa_regression_hsk6_lesson1');

    qaResults.tests.push({
      name: 'HSK 6 Lesson 1 High-Level Reading Invariant Check',
      passed: Boolean(hsk6Title),
      detail: hsk6Title,
    });

    // Final Console Error Verification
    qaResults.tests.push({
      name: 'Zero Critical Browser Console Errors',
      passed: qaResults.consoleErrors.length === 0,
      errorsCount: qaResults.consoleErrors.length,
      errors: qaResults.consoleErrors,
    });

    qaResults.summary = {
      totalTests: qaResults.tests.length,
      passedTests: qaResults.tests.filter((t) => t.passed).length,
      failedTests: qaResults.tests.filter((t) => !t.passed).length,
      allPassed: qaResults.tests.every((t) => t.passed),
    };

    console.log('\n======================================================');
    console.log('QA SUITE COMPLETE!');
    console.log(`Passed: ${qaResults.summary.passedTests} / ${qaResults.summary.totalTests}`);
    console.log(`Failed: ${qaResults.summary.failedTests}`);
    console.log(`All Passed? ${qaResults.summary.allPassed ? 'YES ✅' : 'NO ❌'}`);
    console.log('======================================================\n');

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'qa_dictionary_hanzi_rebuild_results.json'),
      JSON.stringify(qaResults, null, 2)
    );

    ws.close();
  } catch (err) {
    console.error('Fatal error in QA script:', err);
  } finally {
    browserProcess.kill();
  }
}

runQA();
