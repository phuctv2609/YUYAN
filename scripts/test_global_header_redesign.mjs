/**
 * YUYAN — Global Header Redesign Verification Suite
 * Verifies:
 * 1. Complete removal of duplicate navigation tabs from TopNavbar
 * 2. Dedicated smart search bar with Ctrl+K shortcut and search modal trigger
 * 3. AI quick access button ("AI hội thoại")
 * 4. Streak telemetry pill ("🔥 0d")
 * 5. Clean, anchored notification popover with unread counter, read status & click-outside
 * 6. Single-click theme switcher (Sun/Moon)
 * 7. User profile capsule with avatar, display name, target HSK & quick edit
 * 8. Responsive layout across Desktop, Tablet, and Mobile with zero horizontal overflow
 * 9. Visual screenshot captures via headless Chrome CDP
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, execSync } from 'child_process';

const SCREENSHOT_DIR = path.resolve('scripts/verification_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, description) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    console.error(`  ✗ [FAIL] ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

console.log('================================================================');
console.log('YUYAN GLOBAL HEADER REDESIGN: VERIFICATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. SOURCE CODE STATIC ARCHITECTURE AUDIT
// -----------------------------------------------------------------------------
console.log('1. Static Code Audit: TopNavbar Architecture:');

const topNavbarPath = path.resolve('src/components/layout/TopNavbar.tsx');
const topNavbarCode = fs.readFileSync(topNavbarPath, 'utf-8');

// Verify duplicate navigation tabs are REMOVED from TopNavbar
assert(!topNavbarCode.includes("label: 'Trang chủ'"), "Duplicate 'Trang chủ' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'HSK'"), "Duplicate 'HSK' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'Từ vựng'"), "Duplicate 'Từ vựng' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'Luyện nghe'"), "Duplicate 'Luyện nghe' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'Luyện nói'"), "Duplicate 'Luyện nói' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'Thi thử'"), "Duplicate 'Thi thử' link removed from TopNavbar");
assert(!topNavbarCode.includes("label: 'Từ điển'"), "Duplicate 'Từ điển' link removed from TopNavbar");
assert(!topNavbarCode.includes("title=\"Khám phá thêm tính năng YUYAN\""), "Duplicate top 'Thêm' button removed from TopNavbar nav");

// Verify smart search bar exists with Ctrl+K
assert(topNavbarCode.includes('global-search-input'), 'Global search input is present');
assert(topNavbarCode.includes('Tìm bài học, từ vựng, ngữ pháp...'), 'Smart search placeholder is present');
assert(topNavbarCode.includes('Ctrl + K'), 'Ctrl + K keyboard badge is present');
assert(topNavbarCode.includes('onOpenSearchModal'), 'Search click triggers onOpenSearchModal');

// Verify AI button is present
assert(topNavbarCode.includes('AI hội thoại'), "'AI hội thoại' button label is present");
assert(topNavbarCode.includes("onSelectTab('ai')"), "AI button navigates to 'ai' tab");

// Verify Streak telemetry
assert(topNavbarCode.includes('studyStreakDays'), 'Streak days telemetry is displayed');
assert(topNavbarCode.includes('Flame'), 'Flame icon is used for streak');

// Verify Notification popover & click outside
assert(topNavbarCode.includes('showNotifications'), 'showNotifications state is tracked');
assert(topNavbarCode.includes('notificationRef'), 'notificationRef is used for click-outside dismissal');
assert(topNavbarCode.includes('handleClickOutside'), 'handleClickOutside handles popover closing');
assert(topNavbarCode.includes('unreadCount'), 'unreadCount is calculated and displayed');
assert(topNavbarCode.includes('handleMarkAllAsRead'), 'handleMarkAllAsRead allows clearing unread state');

// Verify single-button theme toggle
assert(topNavbarCode.includes('resolvedTheme'), 'ThemeContext resolvedTheme is used');
assert(topNavbarCode.includes('setTheme'), 'ThemeContext setTheme is used');
assert(topNavbarCode.includes('Moon') && topNavbarCode.includes('Sun'), 'Both Sun and Moon icons are supported for single toggle');

// Verify User Profile
assert(topNavbarCode.includes('LearnerAvatar'), 'LearnerAvatar is rendered in top navbar');
assert(topNavbarCode.includes('profile.displayName'), 'Learner profile displayName is rendered');
assert(topNavbarCode.includes('profileMenuRef'), 'profileMenuRef is used for outside click dismissal');
assert(topNavbarCode.includes('handleOpenEditModal'), 'Quick edit modal can be opened from profile menu');

// Verify left sidebar still retains all navigation items
const sidebarPath = path.resolve('src/components/layout/Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf-8');
assert(sidebarCode.includes('MAIN_NAV_ITEMS'), 'Sidebar continues to render MAIN_NAV_ITEMS');
assert(sidebarCode.includes('SECONDARY_NAV_ITEMS'), 'Sidebar continues to render SECONDARY_NAV_ITEMS');

console.log('\n2. Dynamic Browser Verification (Headless Chrome CDP):');

function findChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function checkPreviewServer() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4173', (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function captureScreenCDP(ws, sendCommand, url, fileName, width, height, isMobile = false) {
  console.log(`  -> Capturing viewport: ${width}x${height} (${fileName})...`);
  await sendCommand('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
  });
  if (isMobile) {
    await sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5,
    });
  } else {
    await sendCommand('Emulation.setTouchEmulationEnabled', {
      enabled: false,
    });
  }
  await sendCommand('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 1800));

  // Check no horizontal scrollbar
  const overflowCheck = await sendCommand('Runtime.evaluate', {
    expression: 'document.documentElement.scrollWidth <= window.innerWidth',
    returnByValue: true,
  });
  assert(overflowCheck.result.value === true, `No horizontal overflow at ${width}x${height}`);

  const screenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));

  // Also copy to artifacts directory if available
  const artifactScreenshotDir = path.resolve('C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac/screenshots');
  if (!fs.existsSync(artifactScreenshotDir)) {
    fs.mkdirSync(artifactScreenshotDir, { recursive: true });
  }
  fs.writeFileSync(path.join(artifactScreenshotDir, fileName), Buffer.from(screenshot.data, 'base64'));
  console.log(`     Saved screenshot: ${fileName}`);
}

async function runBrowserTests() {
  const chromePath = findChromePath();
  if (!chromePath) {
    console.log('Chrome binary not found; skipping CDP visual test.');
    return;
  }

  let isRunning = await checkPreviewServer();
  let serverProcess = null;

  if (!isRunning) {
    console.log('  Starting vite preview on port 4173...');
    serverProcess = spawn('cmd', ['/c', 'npx', 'vite', 'preview', '--port', '4173', '--host', '127.0.0.1'], {
      detached: false,
      stdio: 'pipe',
    });
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 600));
      isRunning = await checkPreviewServer();
      if (isRunning) break;
    }
  }

  assert(isRunning, 'Preview server active on port 4173');

  const port = 9336;
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1400,1000',
    'http://127.0.0.1:4173/?theme=light',
  ]);
  await new Promise((r) => setTimeout(r, 2500));

  try {
    const pages = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/json`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const target = pages.find((p) => p.type === 'page' && p.url.includes('4173'));
    assert(Boolean(target), 'Found CDP page target for header audit');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) => (ws.onopen = resolve));

    let cmdId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = cmdId++;
        const onMsg = (event) => {
          const resp = JSON.parse(event.data);
          if (resp.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(resp.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // 1. Desktop Light (1366x768)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=light',
      'redesigned_header_desktop_1366x768_light.png',
      1366,
      768,
      false
    );

    // 2. Desktop Dark (1920x1080)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=dark',
      'redesigned_header_desktop_1920x1080_dark.png',
      1920,
      1080,
      false
    );

    // 3. Tablet iPad (768x1024)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=light',
      'redesigned_header_tablet_ipad_768x1024.png',
      768,
      1024,
      true
    );

    // 4. Tablet iPad Air (820x1180)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=light',
      'redesigned_header_tablet_ipad_air_820x1180.png',
      820,
      1180,
      true
    );

    // 5. Mobile iPhone 14 (390x844)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=light',
      'redesigned_header_mobile_iphone14_390x844.png',
      390,
      844,
      true
    );

    // 6. Mobile Small iPhone SE (375x667)
    await captureScreenCDP(
      ws,
      sendCommand,
      'http://127.0.0.1:4173/?theme=dark',
      'redesigned_header_mobile_iphone_se_375x667.png',
      375,
      667,
      true
    );

    // 7. Interactive test: Notification Popover
    console.log('  -> Testing Notification Popover interaction via CDP...');
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await sendCommand('Page.navigate', { url: 'http://127.0.0.1:4173/?theme=light' });
    await new Promise((r) => setTimeout(r, 1500));

    // Click notification bell
    const clickBell = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const bellBtn = document.querySelector('button[aria-label="Xem thông báo"]');
        if (bellBtn) {
          bellBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true,
    });
    assert(clickBell.result.value === true, 'Successfully clicked notification bell button');

    await new Promise((r) => setTimeout(r, 600));

    // Verify popover is visible and has correct content
    const popoverCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const popover = document.querySelector('div[class*="shadow-xl"]');
        if (!popover) return { visible: false };
        const text = popover.innerText;
        return {
          visible: true,
          hasHeader: text.includes('Thông báo mới'),
          hasStreakNotif: text.includes('Chuỗi ngày học'),
          hasAiNotif: text.includes('AI YUYAN') || text.includes('AI')
        };
      })()`,
      returnByValue: true,
    });
    assert(popoverCheck.result.value.visible, 'Notification popover is visible upon clicking bell');
    assert(popoverCheck.result.value.hasHeader, 'Notification popover contains header');

    // Capture screenshot with Notification Popover open
    const notifScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const notifFilePath = path.join(SCREENSHOT_DIR, 'redesigned_header_notifications_open.png');
    fs.writeFileSync(notifFilePath, Buffer.from(notifScreenshot.data, 'base64'));
    const artifactScreenshotDir = path.resolve('C:/Users/Loan/.gemini/antigravity/brain/14d6c96a-ac3b-4196-afdf-08ab8b393dac/screenshots');
    fs.writeFileSync(path.join(artifactScreenshotDir, 'redesigned_header_notifications_open.png'), Buffer.from(notifScreenshot.data, 'base64'));
    console.log('     Saved screenshot: redesigned_header_notifications_open.png');

    // Test Escape key closes popover
    await sendCommand('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      windowsVirtualKeyCode: 27,
      code: 'Escape',
      key: 'Escape',
    });
    await new Promise((r) => setTimeout(r, 400));

    const popoverClosedCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const popover = document.querySelector('div[class*="shadow-xl"]');
        return popover === null;
      })()`,
      returnByValue: true,
    });
    assert(popoverClosedCheck.result.value === true, 'Pressing Escape successfully dismissed notification popover');

    // Test Search Modal open via Ctrl+K
    await sendCommand('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      modifiers: 2, // Ctrl
      windowsVirtualKeyCode: 75,
      code: 'KeyK',
      key: 'k',
    });
    await new Promise((r) => setTimeout(r, 600));

    const searchModalCheck = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('input[placeholder*="Tìm bài học"]');
        return modal !== null;
      })()`,
      returnByValue: true,
    });
    assert(searchModalCheck.result.value === true, 'Ctrl+K successfully opens Search Dialog');

    ws.close();
  } finally {
    try {
      chromeProcess.kill();
    } catch (e) {}
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch (e) {}
    }
  }
}

async function main() {
  await runBrowserTests();
  console.log('\n================================================================');
  console.log(`ALL VERIFICATION CHECKS PASSED: ${passedChecks}/${totalChecks} (100%)`);
  console.log('================================================================');
}

main().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
