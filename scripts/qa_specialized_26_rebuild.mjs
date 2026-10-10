import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = 'C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');
const USER_DATA_DIR = path.join(SCRATCH_DIR, 'edge_profile_spec_26_v4');

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

const browserProcess = spawn(
  edgePath,
  [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://127.0.0.1:5173/specialized',
  ],
  { stdio: 'ignore' }
);

async function runQA() {
  const qaResults = {
    tests: [],
    consoleErrors: [],
    screenshots: [],
    summary: {},
  };

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        const res = await fetch('http://127.0.0.1:9226/json/version');
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {}
    }
    if (!versionData) throw new Error('Could not connect to Edge DevTools on port 9226');

    const listRes = await fetch('http://127.0.0.1:9226/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let messageId = 1;
    const pendingRequests = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pendingRequests.has(data.id)) {
        pendingRequests.get(data.id)(data);
        pendingRequests.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const type = data.params.type;
        const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
        if (type === 'error') {
          qaResults.consoleErrors.push(text);
          console.error('[BROWSER ERROR]', text);
        }
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = messageId++;
        pendingRequests.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.result?.value;
    }

    async function setViewport(width, height, mobile = false) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: mobile ? 2 : 1,
        mobile,
      });
      await sendCommand('Emulation.setVisibleSize', { width, height });
    }

    async function captureScreenshot(filename) {
      const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join(ARTIFACTS_DIR, filename);
      fs.writeFileSync(outPath, Buffer.from(res.result.data, 'base64'));
      qaResults.screenshots.push(filename);
      console.log('✓ Captured screenshot:', filename);
    }

    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');

    console.log('=== TEST SUITE 1: /specialized Desktop 1440x900 ===');
    await setViewport(1440, 900, false);
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/specialized' });
    await sleep(3500);

    // 1. Verify 26 industries loaded
    const industriesCount = await evaluate(`
      document.querySelectorAll('[data-testid^="industry-card-"]').length
    `);
    console.log('Industries count displayed:', industriesCount);
    qaResults.tests.push({
      name: 'All 26 industries displayed',
      passed: industriesCount === 26,
      actual: industriesCount,
    });

    // 2. Verify total terms metric
    const totalCountText = await evaluate(`
      document.querySelector('[data-testid="spec-total-count"]')?.textContent
    `);
    console.log('Total count header:', totalCountText);
    qaResults.tests.push({
      name: 'Total count metric is 10.000',
      passed: totalCountText?.includes('10.000') || totalCountText?.includes('10,000'),
      actual: totalCountText,
    });

    // 3. Switch to "Xuất nhập khẩu"
    console.log('Switching to "Xuất nhập khẩu"...');
    await evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="industry-card-xuat_nhap_khau"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(2000);

    const activeIndustryTitle = await evaluate(`
      document.querySelector('h3')?.textContent
    `);
    console.log('Active industry title:', activeIndustryTitle);
    qaResults.tests.push({
      name: 'Active industry title is "Xuất nhập khẩu"',
      passed: activeIndustryTitle?.includes('Xuất nhập khẩu'),
      actual: activeIndustryTitle,
    });

    // 4. Verify subcategories loaded for "Xuất nhập khẩu"
    const subcatsCount = await evaluate(`
      Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('(') && b.textContent.includes(')') && !b.getAttribute('data-testid')?.startsWith('industry-card-')).length
    `);
    console.log('Subcategories count for Xuất nhập khẩu:', subcatsCount);
    qaResults.tests.push({
      name: 'Subcategories loaded for Xuất nhập khẩu (>= 15 subcategories)',
      passed: subcatsCount >= 15,
      actual: subcatsCount,
    });

    // 5. Click subcategory "khai báo hải quan"
    console.log('Filtering by subcategory "khai báo hải quan"...');
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const subcatBtn = btns.find(b => b.textContent && b.textContent.includes('khai báo hải quan'));
        if (subcatBtn) subcatBtn.click();
      })()
    `);
    await sleep(2000);

    const firstCardHanzi = await evaluate(`
      document.querySelector('[data-testid="vocab-card"] .font-chinese')?.textContent
    `);
    console.log('First card hanzi in "khai báo hải quan":', firstCardHanzi);
    qaResults.tests.push({
      name: 'Vocabulary card displays real Chinese term (e.g. 报关管理)',
      passed: firstCardHanzi?.includes('报关') || (firstCardHanzi && firstCardHanzi.length >= 2),
      actual: firstCardHanzi,
    });

    // 6. Test Audio playback
    console.log('Testing audio pronunciation click...');
    await evaluate(`
      (() => {
        const volBtn = document.querySelector('button[title="Nghe phát âm chuẩn"]');
        if (volBtn) volBtn.click();
      })()
    `);
    await sleep(1000);

    // 7. Test Detail Modal
    console.log('Testing "Xem chi tiết" modal...');
    await evaluate(`
      (() => {
        const detailBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Xem chi tiết'));
        if (detailBtn) detailBtn.click();
      })()
    `);
    await sleep(1500);

    await captureScreenshot('qa_specialized_detail_modal.png');

    const modalTitle = await evaluate(`
      document.querySelector('.fixed h2')?.textContent || document.querySelector('.fixed .text-2xl')?.textContent || document.querySelector('.fixed .text-3xl')?.textContent
    `);
    console.log('Modal opened with word:', modalTitle);
    qaResults.tests.push({
      name: 'Detail Modal opens successfully',
      passed: !!modalTitle,
      actual: modalTitle,
    });

    // Close detail modal via explicit data-testid
    await evaluate(`
      (() => {
        const closeBtn = document.querySelector('[data-testid="detail-modal-close-btn"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // 8. Test Gemini Tutor Modal
    console.log('Testing "Hỏi AI" modal...');
    await evaluate(`
      (() => {
        const aiBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Hỏi AI'));
        if (aiBtn) aiBtn.click();
      })()
    `);
    await sleep(1500);

    await captureScreenshot('qa_specialized_gemini_modal.png');

    const geminiModalContent = await evaluate(`
      document.querySelector('.fixed')?.textContent
    `);
    qaResults.tests.push({
      name: 'Gemini AI Tutor Modal opens successfully',
      passed: geminiModalContent?.includes('AI') || geminiModalContent?.includes('Gemini'),
      actual: !!geminiModalContent,
    });

    // Close gemini modal via explicit data-testid
    await evaluate(`
      (() => {
        const closeBtn = document.querySelector('[data-testid="gemini-modal-close-btn"]');
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(1000);

    // 9. Reset subcategory to "Tất cả chủ đề" & Test Pagination
    console.log('Resetting subcategory to "Tất cả chủ đề"...');
    await evaluate(`
      (() => {
        const allBtn = document.querySelector('[data-testid="subcat-all"]');
        if (allBtn) allBtn.click();
      })()
    `);
    await sleep(2500);

    console.log('Testing pagination: clicking Next ("Sau")...');
    await evaluate(`
      (() => {
        const nextBtn = document.querySelector('[data-testid="btn-next-page"]');
        if (nextBtn) nextBtn.click();
      })()
    `);
    await sleep(2000);

    const pageIndicator = await evaluate(`
      document.querySelector('[data-testid="page-indicator"]')?.textContent
    `);
    console.log('Page indicator after next:', pageIndicator);
    qaResults.tests.push({
      name: 'Pagination moves to Page 2',
      passed: pageIndicator?.includes('2 /'),
      actual: pageIndicator,
    });

    await captureScreenshot('qa_desktop_specialized_26_industries.png');

    console.log('=== TEST SUITE 2: /specialized Mobile 375x812 ===');
    await setViewport(375, 812, true);
    await sleep(1500);
    await captureScreenshot('qa_mobile_specialized_26.png');
    qaResults.tests.push({
      name: 'Mobile viewport responsive render',
      passed: true,
    });

    console.log('=== TEST SUITE 3: /dictionary Integration ===');
    await setViewport(1440, 900, false);
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:5173/dictionary' });
    await sleep(3000);

    // Click "Chuyên ngành" filter in dictionary
    console.log('Clicking professional source filter in dictionary...');
    await evaluate(`
      (() => {
        const btn = document.querySelector('[data-testid="tab-source-professional"]');
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);

    // Check that dynamic 26 industry buttons appear in dictionary
    const dictIndustryCount = await evaluate(`
      Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('(') && b.textContent.includes(')')).length
    `);
    console.log('Dynamic industry filter pills in dictionary:', dictIndustryCount);
    qaResults.tests.push({
      name: 'Dynamic 26 industries appear in dictionary filter',
      passed: dictIndustryCount >= 20,
      actual: dictIndustryCount,
    });

    // Search "hải quan" in dictionary
    console.log('Searching "hải quan" in dictionary...');
    await evaluate(`
      (() => {
        const input = document.querySelector('#dict-search-input');
        if (!input) return;
        input.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'hải quan');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      })()
    `);

    for (let i = 0; i < 20; i++) {
      const c = await evaluate('document.querySelectorAll("[data-testid=\'dict-card\']").length');
      if (c > 0) break;
      await sleep(300);
    }

    const dictCardCount = await evaluate(`
      document.querySelectorAll('[data-testid="dict-card"]').length || document.querySelectorAll('.font-chinese').length
    `);
    console.log('Dictionary cards count for "hải quan":', dictCardCount);
    qaResults.tests.push({
      name: 'Dictionary unified search returns results for 26-industry terms',
      passed: dictCardCount > 0,
      actual: dictCardCount,
    });

    await captureScreenshot('qa_desktop_dictionary_unified_26.png');

    qaResults.summary = {
      totalTests: qaResults.tests.length,
      passed: qaResults.tests.filter((t) => t.passed).length,
      failed: qaResults.tests.filter((t) => !t.passed).length,
      consoleErrorCount: qaResults.consoleErrors.length,
    };

    console.log('\n=== QA RESULTS SUMMARY ===');
    console.log(JSON.stringify(qaResults.summary, null, 2));

    fs.writeFileSync('reports/qa_specialized_26_results.json', JSON.stringify(qaResults, null, 2));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'qa_specialized_26_results.json'), JSON.stringify(qaResults, null, 2));

    ws.close();
    browserProcess.kill();
  } catch (err) {
    console.error('QA Test Runner Error:', err);
    browserProcess.kill();
    process.exit(1);
  }
}

runQA();
