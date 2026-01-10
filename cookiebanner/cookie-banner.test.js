const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple HTTP server for testing (cookies don't work with file://)
function startServer(port = 8888) {
  const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './cookie-banner-minimal.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}/`);
      resolve({ server, url: `http://localhost:${port}` });
    });
  });
}

async function getCookieValue(page, cookieName) {
  return await page.evaluate((name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      try {
        return JSON.parse(decodeURIComponent(parts.pop().split(';').shift()));
      } catch (e) {
        return null;
      }
    }
    return null;
  }, cookieName);
}

async function isBannerVisible(page) {
  return await page.evaluate(() => {
    const banner = document.getElementById('cookieBanner');
    return banner && banner.classList.contains('show');
  });
}

async function isDetailsVisible(page) {
  return await page.evaluate(() => {
    const details = document.getElementById('cookieDetails');
    return details && details.classList.contains('show');
  });
}

// Helper to click checkbox by ID (handles hidden checkboxes)
async function toggleCheckbox(page, id, checked) {
  await page.evaluate(({ id, checked }) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.checked = checked;
    }
  }, { id, checked });
}

async function runTests() {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: false });
  const testResults = [];

  console.log('\n🧪 Starting Cookie Banner Tests\n');
  console.log('='.repeat(60));

  // Test 1: Banner appears on first visit
  console.log('\n📋 Test 1: Banner appears on first visit');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    const isVisible = await isBannerVisible(page);
    const cookie = await getCookieValue(page, '_cnsnt');

    if (isVisible && !cookie) {
      console.log('✅ PASS: Banner is visible, no cookie set');
      testResults.push({ test: 'Banner appears on first visit', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected banner visible and no cookie');
      testResults.push({ test: 'Banner appears on first visit', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Banner appears on first visit', status: 'ERROR' });
  }

  // Test 2: Click "Allow" - All consent granted
  console.log('\n📋 Test 2: Click "Allow" button');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-allow');
    await page.waitForTimeout(500);

    const isVisible = await isBannerVisible(page);
    const cookie = await getCookieValue(page, '_cnsnt');

    if (!isVisible &&
        cookie &&
        cookie.analytics_storage === true &&
        cookie.ad_storage === true) {
      console.log('✅ PASS: Banner hidden, all consent granted');
      testResults.push({ test: 'Allow button', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected banner hidden and all consent granted');
      testResults.push({ test: 'Allow button', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Allow button', status: 'ERROR' });
  }

  // Test 3: Click "Deny" - All consent denied
  console.log('\n📋 Test 3: Click "Deny" button');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-deny');
    await page.waitForTimeout(500);

    const isVisible = await isBannerVisible(page);
    const cookie = await getCookieValue(page, '_cnsnt');

    if (!isVisible &&
        cookie &&
        cookie.analytics_storage === false &&
        cookie.ad_storage === false) {
      console.log('✅ PASS: Banner hidden, all consent denied');
      testResults.push({ test: 'Deny button', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected banner hidden and all consent denied');
      testResults.push({ test: 'Deny button', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Deny button', status: 'ERROR' });
  }

  // Test 4: Click "Show details" opens dialog
  console.log('\n📋 Test 4: Click "Show details" button');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(500);

    const detailsVisible = await isDetailsVisible(page);

    if (detailsVisible) {
      console.log('✅ PASS: Details dialog opened');
      testResults.push({ test: 'Show details button', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Details dialog not visible');
      testResults.push({ test: 'Show details button', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Show details button', status: 'ERROR' });
  }

  // Test 5: Individual selection - Only analytics
  console.log('\n📋 Test 5: Individual selection - Only analytics');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    // Use JavaScript to toggle checkboxes (avoids viewport issues)
    await toggleCheckbox(page, 'toggle-analytics', true);
    await toggleCheckbox(page, 'toggle-marketing', false);
    await page.waitForTimeout(300);

    await page.click('.details-actions .btn-deny');
    await page.waitForTimeout(500);

    const cookie = await getCookieValue(page, '_cnsnt');

    if (cookie &&
        cookie.analytics_storage === true &&
        cookie.ad_storage === false) {
      console.log('✅ PASS: Only analytics consent granted');
      testResults.push({ test: 'Individual selection - analytics only', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected only analytics consent');
      testResults.push({ test: 'Individual selection - analytics only', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Individual selection - analytics only', status: 'ERROR' });
  }

  // Test 6: Individual selection - Only marketing
  console.log('\n📋 Test 6: Individual selection - Only marketing');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    await toggleCheckbox(page, 'toggle-analytics', false);
    await toggleCheckbox(page, 'toggle-marketing', true);
    await page.waitForTimeout(300);

    await page.click('.details-actions .btn-deny');
    await page.waitForTimeout(500);

    const cookie = await getCookieValue(page, '_cnsnt');

    if (cookie &&
        cookie.analytics_storage === false &&
        cookie.ad_storage === true) {
      console.log('✅ PASS: Only marketing consent granted');
      testResults.push({ test: 'Individual selection - marketing only', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected only marketing consent');
      testResults.push({ test: 'Individual selection - marketing only', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Individual selection - marketing only', status: 'ERROR' });
  }

  // Test 7: Individual selection - Both selected
  console.log('\n📋 Test 7: Individual selection - Both categories');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    await toggleCheckbox(page, 'toggle-analytics', true);
    await toggleCheckbox(page, 'toggle-marketing', true);
    await page.waitForTimeout(300);

    await page.click('.details-actions .btn-deny');
    await page.waitForTimeout(500);

    const cookie = await getCookieValue(page, '_cnsnt');

    if (cookie &&
        cookie.analytics_storage === true &&
        cookie.ad_storage === true) {
      console.log('✅ PASS: Both consents granted');
      testResults.push({ test: 'Individual selection - both', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected both consents granted');
      testResults.push({ test: 'Individual selection - both', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Individual selection - both', status: 'ERROR' });
  }

  // Test 8: Individual selection - None selected
  console.log('\n📋 Test 8: Individual selection - None selected');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    await toggleCheckbox(page, 'toggle-analytics', false);
    await toggleCheckbox(page, 'toggle-marketing', false);
    await page.waitForTimeout(300);

    await page.click('.details-actions .btn-deny');
    await page.waitForTimeout(500);

    const cookie = await getCookieValue(page, '_cnsnt');

    if (cookie &&
        cookie.analytics_storage === false &&
        cookie.ad_storage === false) {
      console.log('✅ PASS: Both consents denied');
      testResults.push({ test: 'Individual selection - none', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected both consents denied');
      testResults.push({ test: 'Individual selection - none', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Individual selection - none', status: 'ERROR' });
  }

  // Test 9: Banner doesn't show on second visit
  console.log('\n📋 Test 9: Banner hidden on second visit (with cookie)');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-allow');
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForTimeout(500);

    const isVisible = await isBannerVisible(page);
    const cookie = await getCookieValue(page, '_cnsnt');

    if (!isVisible && cookie) {
      console.log('✅ PASS: Banner hidden on second visit');
      testResults.push({ test: 'Banner hidden on second visit', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected banner to be hidden');
      testResults.push({ test: 'Banner hidden on second visit', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Banner hidden on second visit', status: 'ERROR' });
  }

  // Test 10: Cookie Settings link reopens banner
  console.log('\n📋 Test 10: Cookie Settings link reopens banner');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-allow');
    await page.waitForTimeout(500);

    await page.click('#cookie-settings');
    await page.waitForTimeout(500);

    const isVisible = await isBannerVisible(page);

    if (isVisible) {
      console.log('✅ PASS: Cookie settings link reopens banner');
      testResults.push({ test: 'Cookie Settings link', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Banner should reopen after clicking settings link');
      testResults.push({ test: 'Cookie Settings link', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Cookie Settings link', status: 'ERROR' });
  }

  // Test 11: Close details dialog with X button
  console.log('\n📋 Test 11: Close details dialog with X button');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    await page.click('.details-close');
    await page.waitForTimeout(300);

    const detailsVisible = await isDetailsVisible(page);

    if (!detailsVisible) {
      console.log('✅ PASS: Details dialog closed');
      testResults.push({ test: 'Close details with X', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Details should be closed');
      testResults.push({ test: 'Close details with X', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Close details with X', status: 'ERROR' });
  }

  // Test 12: "Allow all" button in details dialog
  console.log('\n📋 Test 12: "Allow all" button in details dialog');
  try {
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(500);

    await page.click('.btn-details');
    await page.waitForTimeout(300);

    await page.click('.details-actions .btn-allow');
    await page.waitForTimeout(500);

    const cookie = await getCookieValue(page, '_cnsnt');

    if (cookie &&
        cookie.analytics_storage === true &&
        cookie.ad_storage === true) {
      console.log('✅ PASS: Allow all from details works');
      testResults.push({ test: 'Allow all from details', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Expected all consent granted and dialog closed');
      testResults.push({ test: 'Allow all from details', status: 'FAIL' });
    }

    await page.close();
  } catch (e) {
    console.log('❌ ERROR:', e.message);
    testResults.push({ test: 'Allow all from details', status: 'ERROR' });
  }

  await browser.close();
  server.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;

  testResults.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.status}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${testResults.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log('='.repeat(60));

  process.exit(failed + errors > 0 ? 1 : 0);
}

runTests().catch(console.error);
