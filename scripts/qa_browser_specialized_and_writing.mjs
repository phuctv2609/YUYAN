import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_spec_qa');

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
let edgePath = edgePaths.find((p) => fs.existsSync(p));
if (!edgePath) {
  console.error('Edge executable not found!');
  process.exit(1);
}

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9230',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:5173/specialized',
  ],
  { stdio: 'ignore' }
);

async function runBrowserQA() {
  console.log('=== RUNNING BROWSER END-TO-END QA VIA CDP ===');
  try {
    // Wait for CDP to be available
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9230/json/version');
        if (res.ok) {
          connected = true;
          break;
        }
      } catch {}
      await sleep(500);
    }

    if (!connected) {
      throw new Error('Failed to connect to browser CDP port 9230');
    }

    const pagesRes = await fetch('http://127.0.0.1:9230/json');
    const pages = await pagesRes.json();
    const pageTarget = pages.find((p) => p.type === 'page') || pages[0];
    if (!pageTarget) throw new Error('No page target found');

    const wsUrl = pageTarget.webSocketDebuggerUrl;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let msgId = 1;
    const pendingCalls = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    }

    async function takeScreenshot(filename) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(res.data, 'base64');
      const filepath = path.join(ARTIFACTS_DIR, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`Saved screenshot: ${filepath}`);
      return filepath;
    }

    // 1. TEST SPECIALIZED VOCABULARY VIEW
    console.log('\n--- 1. Testing Specialized Vocabulary View (/specialized) ---');
    await setViewport(1280, 800);
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/specialized' });
    await sleep(2500);

    const totalCountText = await evaluate(`document.querySelector('[data-testid="spec-total-count"]')?.textContent?.trim()`);
    console.log('Specialized View total count badge:', totalCountText);

    // Click on "hành chính" subcategory
    console.log('Clicking on subcategory "hành chính"...');
    await evaluate(`
      const chip = document.querySelector('[data-testid="subcat-van_phong_doanh_nghiep_hanh_chinh"]');
      if (chip) chip.click();
    `);
    await sleep(1500);

    const cardsCount = await evaluate(`document.querySelectorAll('[data-testid="vocab-card"]').length`);
    console.log('Rendered cards for "hành chính":', cardsCount);

    const firstCardHanzi = await evaluate(`document.querySelector('[data-testid="vocab-card"] span.font-chinese')?.textContent?.trim()`);
    console.log('First card Hanzi:', firstCardHanzi);

    await takeScreenshot('qa_specialized_van_phong_hanh_chinh.png');

    // Click on "Hỏi AI" button on first card
    console.log('Clicking on "Hỏi AI" button...');
    await evaluate(`
      const aiBtn = document.querySelector('[data-testid="btn-ask-ai"]');
      if (aiBtn) aiBtn.click();
    `);
    await sleep(2000);

    await takeScreenshot('qa_specialized_ai_modal.png');

    // Close modal
    await evaluate(`
      const closeBtn = document.querySelector('button[title="Đóng"], button[aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    `);
    await sleep(500);

    // 2. TEST WRITING PRACTICE VIEW
    console.log('\n--- 2. Testing Writing Practice View (/writing) ---');
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/writing' });
    await sleep(2500);

    const canvasElements = await evaluate(`document.querySelectorAll('canvas').length`);
    console.log('Canvas elements on /writing page:', canvasElements);

    const activeChar = await evaluate(`document.querySelector('.font-chinese')?.textContent?.trim()`);
    console.log('Active character on /writing page:', activeChar);

    const charCardCount = await evaluate(`document.querySelectorAll('[data-testid^="char-card-"]').length`);
    console.log('HSK Character cards count in palette:', charCardCount);

    // Click HSK 2 filter tab
    await evaluate(`
      const tab = document.querySelector('[data-testid="writing-lvl-tab-2"]');
      if (tab) tab.click();
    `);
    await sleep(1000);

    await takeScreenshot('qa_writing_practice_hanzi_writer.png');

    console.log('\n=== BROWSER QA FINISHED SUCCESSFULLY ===');
    ws.close();
  } catch (err) {
    console.error('Browser QA failed:', err);
  } finally {
    try {
      browserProcess.kill('SIGKILL');
    } catch {}
  }
}

runBrowserQA();
