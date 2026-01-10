const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

(async () => {
  const { server, url } = await startServer();
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto(url);
  
  console.log('\n🍪 Cookie Banner Test - Ready for manual testing\n');
  console.log('Test the following:');
  console.log('  1. Banner appears at bottom');
  console.log('  2. Click "Deny" - check cookie is set to false');
  console.log('  3. Click "Allow" - check cookie is set to true');
  console.log('  4. Click "Show details" - opens full dialog');
  console.log('  5. Toggle individual categories');
  console.log('  6. Click "Cookie Settings Link" to reopen banner');
  console.log('\nBrowser will stay open for 5 minutes...\n');
  
  await page.waitForTimeout(300000); // 5 minutes
  
  await browser.close();
  server.close();
})();
