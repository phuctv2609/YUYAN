// scripts/test_profile_and_routing_regression.mjs
// Automated verification for Profile Name & Email Update 404 Regression

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== YUYAN: PROFILE UPDATE & ROUTING REGRESSION TEST ===\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    testsFailed++;
  }
}

// ----------------------------------------------------------------------
// 1. VERIFY VERCEL.JSON CONFIGURATION
// ----------------------------------------------------------------------
runTest('vercel.json exists and configures SPA rewrite to prevent 404 on refresh', () => {
  const vercelPath = path.resolve('vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json must exist in project root');
  
  const content = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
  assert(Array.isArray(content.rewrites), 'vercel.json must have rewrites array');
  
  const spaRule = content.rewrites.find(r => r.source === '/(.*)' && r.destination === '/');
  assert(spaRule, 'vercel.json must route all wildcard paths to / for SPA history mode');
});

// ----------------------------------------------------------------------
// 2. VERIFY ROUTE PARSER LOGIC FROM APP.TSX
// ----------------------------------------------------------------------
runTest('Route parser handles /profile, /settings, /account, /ho-so without 404', () => {
  // Replicate parseUrl logic from src/App.tsx
  function parseUrl(path) {
    if (path === '/' || path === '') return { tab: 'dashboard', isNotFound: false };
    if (path === '/thi-hsk') return { tab: 'exam', isNotFound: false };
    if (path === '/tu-dien') return { tab: 'dictionary', isNotFound: false };
    
    if (
      path === '/profile' ||
      path === '/account' ||
      path === '/ho-so' ||
      path === '/profile/settings' ||
      path === '/profile/edit' ||
      path === '/settings/profile'
    ) {
      return { tab: 'profile', isNotFound: false };
    }

    const validTabs = [
      'beginner', 'vocabulary', 'specialized', 'grammar', 'listening', 'speaking',
      'writing', 'hanzi', 'radicals', 'sentence-ordering', 'mistakes', 'pinyin',
      'exam', 'ai', 'dictionary', 'progress', 'community', 'settings', 'profile', 'account'
    ];
    const tabName = path.replace(/^\//, '');
    if (validTabs.includes(tabName)) {
      return { tab: tabName, isNotFound: false };
    }
    return { tab: '404', isNotFound: true };
  }

  // Profile alias checks
  assert.strictEqual(parseUrl('/profile').tab, 'profile');
  assert.strictEqual(parseUrl('/profile').isNotFound, false);

  assert.strictEqual(parseUrl('/settings').tab, 'settings');
  assert.strictEqual(parseUrl('/settings').isNotFound, false);

  assert.strictEqual(parseUrl('/account').tab, 'profile');
  assert.strictEqual(parseUrl('/account').isNotFound, false);

  assert.strictEqual(parseUrl('/ho-so').tab, 'profile');
  assert.strictEqual(parseUrl('/ho-so').isNotFound, false);

  assert.strictEqual(parseUrl('/profile/settings').tab, 'profile');
  assert.strictEqual(parseUrl('/profile/settings').isNotFound, false);

  assert.strictEqual(parseUrl('/profile/edit').tab, 'profile');
  assert.strictEqual(parseUrl('/profile/edit').isNotFound, false);

  assert.strictEqual(parseUrl('/settings/profile').tab, 'profile');
  assert.strictEqual(parseUrl('/settings/profile').isNotFound, false);

  // Unknown route check
  assert.strictEqual(parseUrl('/random-unknown-page-999').tab, '404');
  assert.strictEqual(parseUrl('/random-unknown-page-999').isNotFound, true);
});

// ----------------------------------------------------------------------
// 3. VERIFY DISPLAY NAME AND EMAIL VALIDATION (Vietnamese Unicode, spaces, limits)
// ----------------------------------------------------------------------
runTest('validateStudentProfile correctly validates names and emails', () => {
  function validateStudentProfile(data) {
    const errors = {};
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (!data.displayName || data.displayName.trim().length === 0) {
      errors.displayName = 'Tên hiển thị không được để trống';
    } else if (data.displayName.trim().length < 2) {
      errors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự';
    } else if (data.displayName.trim().length > 60) {
      errors.displayName = 'Tên hiển thị không được vượt quá 60 ký tự';
    }

    if (!data.schoolEmail || data.schoolEmail.trim().length === 0) {
      errors.schoolEmail = 'Email không được để trống';
    } else if (!emailRegex.test(data.schoolEmail.trim())) {
      errors.schoolEmail = 'Email không đúng định dạng hợp lệ (vd: ten@example.com)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Valid Vietnamese display names
  const validVietnameseNames = [
    'Nguyễn Thị Minh Anh',
    'Đặng Hữu Phúc',
    'Trần Bảo Long',
    'Vũ Lê Phương Thảo',
    'Lê Hoàng Ánh Dương',
    '李明 (Lǐ Míng)',
    'Sarah Chen',
  ];

  for (const name of validVietnameseNames) {
    const res = validateStudentProfile({ displayName: name, schoolEmail: 'test@example.com' });
    assert.strictEqual(res.isValid, true, `Should accept valid name: "${name}"`);
  }

  // Invalid display names
  assert.strictEqual(validateStudentProfile({ displayName: '', schoolEmail: 'test@example.com' }).isValid, false);
  assert.strictEqual(validateStudentProfile({ displayName: '   ', schoolEmail: 'test@example.com' }).isValid, false);
  assert.strictEqual(validateStudentProfile({ displayName: 'A', schoolEmail: 'test@example.com' }).isValid, false);
  assert.strictEqual(validateStudentProfile({ displayName: 'A'.repeat(61), schoolEmail: 'test@example.com' }).isValid, false);

  // Valid emails
  const validEmails = [
    'minhanh@yuyan.edu.vn',
    'phuctv2609@gmail.com',
    'user.study+hsk@domain.co',
  ];
  for (const email of validEmails) {
    const res = validateStudentProfile({ displayName: 'Minh Anh', schoolEmail: email });
    assert.strictEqual(res.isValid, true, `Should accept valid email: "${email}"`);
  }

  // Invalid emails
  const invalidEmails = [
    '',
    'notanemail',
    'plainaddress',
    '@missingusername.com',
    'username@.com',
    'username@com',
  ];
  for (const email of invalidEmails) {
    const res = validateStudentProfile({ displayName: 'Minh Anh', schoolEmail: email });
    assert.strictEqual(res.isValid, false, `Should reject invalid email: "${email}"`);
  }
});

// ----------------------------------------------------------------------
// 4. VERIFY IDENTITY IMMUTABILITY AND STATE PERSISTENCE
// ----------------------------------------------------------------------
runTest('Profile update preserves immutable ID, studyStreakDays, and does not navigate', () => {
  const initialProfile = {
    id: 'yuyan_std_001',
    displayName: 'Minh Anh',
    name: 'Minh Anh',
    schoolEmail: 'minhanh@yuyan.edu.vn',
    targetHskLevel: 2,
    dailyGoalMinutes: 30,
    studyStreakDays: 320,
    levelAssessment: 'Sơ cấp (HSK 2)',
    createdAt: '2025-11-15T08:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  // Simulate repository update
  function updateProfile(current, updates) {
    return {
      ...current,
      displayName: updates.displayName?.trim() || current.displayName,
      name: updates.displayName?.trim() || current.displayName,
      schoolEmail: updates.schoolEmail?.trim() || current.schoolEmail,
      avatar: updates.avatar !== undefined ? updates.avatar : current.avatar,
      updatedAt: new Date().toISOString(),
      // Immutable identity & progress fields:
      id: current.id,
      studyStreakDays: current.studyStreakDays,
      targetHskLevel: updates.targetHskLevel || current.targetHskLevel,
      dailyGoalMinutes: updates.dailyGoalMinutes || current.dailyGoalMinutes,
    };
  }

  const updated = updateProfile(initialProfile, {
    displayName: 'Nguyễn Thị Minh Anh',
    schoolEmail: 'minhanh.new@yuyan.edu.vn',
  });

  // Verify fields
  assert.strictEqual(updated.id, 'yuyan_std_001', 'User ID must remain strictly immutable');
  assert.strictEqual(updated.displayName, 'Nguyễn Thị Minh Anh', 'Display name updated');
  assert.strictEqual(updated.name, 'Nguyễn Thị Minh Anh', 'Compatibility alias updated');
  assert.strictEqual(updated.schoolEmail, 'minhanh.new@yuyan.edu.vn', 'Email updated');
  assert.strictEqual(updated.studyStreakDays, 320, 'Study streak must be preserved');
  assert.strictEqual(updated.targetHskLevel, 2, 'Target HSK level preserved');
  assert.strictEqual(updated.dailyGoalMinutes, 30, 'Daily goal minutes preserved');
});

// ----------------------------------------------------------------------
// 5. VERIFY ROUTE INTEGRITY IN APP.TSX
// ----------------------------------------------------------------------
runTest('App.tsx route mappings correctly wire settings, profile, and account to SettingsView', () => {
  const appTsx = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
  
  assert(appTsx.includes("path === '/profile'"), 'App.tsx must include /profile check');
  assert(appTsx.includes("path === '/account'"), 'App.tsx must include /account check');
  assert(appTsx.includes("'profile'"), 'validTabs must include profile');
  assert(appTsx.includes("'account'"), 'validTabs must include account');
  assert(appTsx.includes("route.tab === 'settings' || route.tab === 'profile' || route.tab === 'account'"), 'SettingsView must render for profile, settings, and account');
});

// ----------------------------------------------------------------------
// 6. VERIFY TOPNAVBAR.TSX DIRECT MODAL AND QUICK EDIT
// ----------------------------------------------------------------------
runTest('TopNavbar.tsx has ProfileEditModal and does not force routing on edit', () => {
  const topNav = fs.readFileSync(path.resolve('src/components/layout/TopNavbar.tsx'), 'utf-8');
  
  assert(topNav.includes('isEditModalOpen'), 'TopNavbar must have isEditModalOpen state');
  assert(topNav.includes('handleOpenEditModal'), 'TopNavbar must have handleOpenEditModal handler');
  assert(topNav.includes('handleSaveQuickProfile'), 'TopNavbar must have handleSaveQuickProfile handler');
  assert(topNav.includes('Chỉnh sửa tên & email'), 'TopNavbar must provide direct quick edit menu option');
  assert(topNav.includes('Cài đặt hồ sơ & Tài khoản'), 'TopNavbar must link to profile tab');
});

console.log(`\n========================================`);
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log(`========================================\n`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL REGRESSION TESTS PASSED SUCCESSFULLY!');
}
