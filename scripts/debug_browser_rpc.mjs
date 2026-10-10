import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_debug_rpc');

if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9234',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    'http://127.0.0.1:5173/vocabulary',
  ],
  { stdio: 'ignore' }
);

async function inspect() {
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9234/json/list');
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

  // In the browser, check window.__vite_plugin_react_preamble_installed__ or import supabase client
  const evalRes = await send('Runtime.evaluate', {
    expression: `(async () => {
      try {
        const clientModule = await import('/src/services/supabase/client.ts');
        const supabase = clientModule.getSupabaseClient();
        if (!supabase) return { error: 'NO_SUPABASE_CLIENT' };

        const rpcRes = await supabase.rpc('get_hsk_word_master_detail', {
          p_entry_id: '2d2f8df7-c4f4-4d7a-b711-88accfee47e2',
          p_learner_id: '00000000-0000-0000-0000-000000000000'
        });
        return { rpcData: rpcRes.data, rpcError: rpcRes.error };
      } catch (e) {
        return { caught: e.message || String(e) };
      }
    })()`,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Browser RPC Direct Test:', JSON.stringify(evalRes.result?.value, null, 2));

  browserProcess.kill();
}

inspect().catch(err => {
  console.error(err);
  browserProcess.kill();
});
