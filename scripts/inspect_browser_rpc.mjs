import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_inspect_browser_rpc');

if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9232',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    'http://127.0.0.1:5173/vocabulary',
  ],
  { stdio: 'ignore' }
);

async function inspect() {
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9232/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page') || pages[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((res) => {
    const id = msgId++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        res(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  await new Promise(r => setTimeout(r, 2500));

  // Inspect first card id
  const cardInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('[data-testid="hsk-card"]');
      const first = cards[0];
      return {
        totalCards: cards.length,
        firstText: first?.innerText
      };
    })()`,
    returnByValue: true
  });
  console.log('Cards Info:', cardInfo.result?.value);

  // Click card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-testid="hsk-card"]');
      if (card) card.click();
    })()`
  });

  // Wait 1s and inspect modal DOM
  await new Promise(r => setTimeout(r, 1000));
  const modalDOM = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return 'NO_MODAL';
      return {
        html: modal.innerHTML.slice(0, 500)
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal DOM:', modalDOM.result?.value);

  browserProcess.kill();
}

inspect().catch(err => {
  console.error(err);
  browserProcess.kill();
});
