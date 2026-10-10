import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_inspect_console');

if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9231',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    'http://127.0.0.1:5173/vocabulary',
  ],
  { stdio: 'ignore' }
);

async function inspect() {
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9231/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page') || pages[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  const logs = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      logs.push(`[${msg.params.type}] ${text}`);
      console.log(`BROWSER CONSOLE: [${msg.params.type}] ${text}`);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      logs.push(`[EXCEPTION] ${desc}`);
      console.error(`BROWSER EXCEPTION: ${desc}`);
    }
  };

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

  // Click first card
  await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('[data-testid="hsk-card"]');
      if (card) card.click();
    })()`
  });

  await new Promise(r => setTimeout(r, 4000));

  console.log('\n--- ALL BROWSER LOGS ---');
  console.log(logs.join('\n'));

  browserProcess.kill();
}

inspect().catch(err => {
  console.error(err);
  browserProcess.kill();
});
