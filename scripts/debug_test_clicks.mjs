import { spawn } from 'node:child_process';
import fs from 'node:fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--user-data-dir=scratch/test_edge_profile',
  'http://127.0.0.1:5173/dictionary'
]);

async function run() {
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9230/json/list');
  const pages = await res.json();
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  const evalCode = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.value;
  };

  // Search 学习
  await evalCode(`
    const input = document.querySelector('#dict-search-input');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '学习');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  `);
  await new Promise(r => setTimeout(r, 2000));

  const cardsFound = await evalCode(`document.querySelectorAll('[data-testid="dict-card"]').length`);
  console.log('Cards found:', cardsFound);

  const btnExists = await evalCode(`Boolean(document.querySelector('[data-testid="dict-card-detail-btn"]'))`);
  console.log('Detail btn exists:', btnExists);

  // Click it
  await evalCode(`
    const btn = document.querySelector('[data-testid="dict-card-detail-btn"]');
    if (btn) btn.click();
  `);
  await new Promise(r => setTimeout(r, 1000));

  const modalRole = await evalCode(`Boolean(document.querySelector('[role="dialog"]'))`);
  console.log('Modal opened (role="dialog"):', modalRole);

  const modalText = await evalCode(`document.querySelector('[role="dialog"]')?.innerText?.slice(0, 200)`);
  console.log('Modal text preview:', modalText);

  browser.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  browser.kill();
  process.exit(1);
});
