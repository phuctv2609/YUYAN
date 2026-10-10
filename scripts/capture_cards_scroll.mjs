import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_spec_scroll');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9231',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:5173/specialized',
  ],
  { stdio: 'ignore' }
);

async function run() {
  try {
    await sleep(2000);
    const pagesRes = await fetch('http://127.0.0.1:9231/json');
    const pages = await pagesRes.json();
    const pageTarget = pages.find((p) => p.type === 'page') || pages[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/specialized' });
    await sleep(2000);

    // Click on "hành chính" subcategory
    await evaluate(`
      const chip = document.querySelector('[data-testid="subcat-van_phong_doanh_nghiep_hanh_chinh"]');
      if (chip) chip.click();
    `);
    await sleep(1500);

    // Scroll down to cards section
    await evaluate(`
      const card = document.querySelector('[data-testid="vocab-card"]');
      if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
    `);
    await sleep(800);

    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'qa_specialized_cards_grid.png'), buffer);
    console.log('Saved qa_specialized_cards_grid.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try {
      browserProcess.kill('SIGKILL');
    } catch {}
  }
}

run();
