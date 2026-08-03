const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const http = require('http');
const { execFile, exec } = require('child_process');

// --- Configuration ---
const CONFIG = {
  USER_DATA_DIR: path.join(os.homedir(), '.chrome-local-mcp-profile'),
  WINDOW_SIZE: '1440,900',
  DEFAULT_TYPING_DELAY: 50,
  NAVIGATION_TIMEOUT: 30000,
  WAIT_TIMEOUT: 10000,
  OCR_TIMEOUT: 15000,
  DEFAULT_SCROLL_Y: 500,
  ACTION_DELAY: 100,
  INTERACTABLE_ROLES: [
    'button', 'link', 'textbox', 'searchbox', 'combobox',
    'checkbox', 'radio', 'switch', 'slider', 'spinbutton',
    'tab', 'menuitem', 'option', 'treeitem',
  ],
  ROLE_TO_SELECTORS: {
    button: ['button', 'input[type="button"]', 'input[type="submit"]', '[role="button"]'],
    link: ['a[href]', '[role="link"]'],
    textbox: ['input[type="text"]', 'input[type="email"]', 'input[type="password"]', 'input[type="search"]', 'input[type="tel"]', 'input[type="url"]', 'input:not([type])', 'textarea', '[role="textbox"]', '[contenteditable="true"]'],
    searchbox: ['input[type="search"]', '[role="searchbox"]'],
    combobox: ['select', '[role="combobox"]'],
    checkbox: ['input[type="checkbox"]', '[role="checkbox"]'],
    radio: ['input[type="radio"]', '[role="radio"]'],
    switch: ['[role="switch"]'],
    slider: ['input[type="range"]', '[role="slider"]'],
    spinbutton: ['input[type="number"]', '[role="spinbutton"]'],
    tab: ['[role="tab"]'],
    menuitem: ['[role="menuitem"]', '[role="menuitemcheckbox"]', '[role="menuitemradio"]'],
    option: ['option', '[role="option"]'],
    treeitem: ['[role="treeitem"]'],
  },
};

// --- OCR (macOS only) ---
function localOCR(imagePath) {
  return new Promise((resolve, reject) => {
    const script = `
import Vision, sys
from Foundation import NSURL

url = NSURL.fileURLWithPath_(sys.argv[1])
req = Vision.VNRecognizeTextRequest.alloc().init()
req.setRecognitionLevel_(0)
req.setRecognitionLanguages_(["en", "vi"])
handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(url, None)
ok, err = handler.performRequests_error_([req], None)
if not ok:
    print("OCR_ERROR: " + str(err), file=sys.stderr)
    sys.exit(1)
for r in req.results():
    print(r.text())
`;
    execFile('python3', ['-c', script, imagePath], { timeout: CONFIG.OCR_TIMEOUT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`OCR failed: ${stderr || err.message}`));
      resolve(stdout.trim());
    });
  });
}

// --- Browser Manager ---
class BrowserManager {
  constructor() {
    this.browser = null;
    this.pages = {};
    this.pageCounter = 0;
    this.pageRefs = {};   // { pageId: { 'e1': { role, name, nodeInfo }, ... } }
    this.refCounter = 0;
    this.networkLogs = {};  // { pageId: { enabled: bool, requests: [] } }
  }

  async launch(headless = false) {
    if (this.browser) {
      try { await this.browser.close(); } catch (_) {}
    }
    this.browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      defaultViewport: null,
      userDataDir: CONFIG.USER_DATA_DIR,
      args: [`--window-size=${CONFIG.WINDOW_SIZE}`, '--no-sandbox'],
    });
    this.pages = {};
    this.pageCounter = 0;
    const [defaultPage] = await this.browser.pages();
    const id = ++this.pageCounter;
    this.pages[id] = defaultPage;
    return id;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages = {};
    }
  }

  async newTab() {
    if (!this.browser) throw new Error('Browser not launched. Call launch first.');
    const page = await this.browser.newPage();
    const id = ++this.pageCounter;
    this.pages[id] = page;
    return id;
  }

  async closeTab(pageId) {
    const page = this.pages[pageId];
    if (!page) throw new Error(`Page ${pageId} not found`);
    await page.close();
    delete this.pages[pageId];
  }

  async setViewport(pageId, width, height, deviceScaleFactor = 1) {
    const page = this.getPage(pageId);
    await page.setViewport({ width, height, deviceScaleFactor, isMobile: false, hasTouch: false });
  }

  async listPages() {
    const list = [];
    for (const [id, page] of Object.entries(this.pages)) {
      list.push({ pageId: Number(id), url: page.url(), title: await page.title() });
    }
    return list;
  }

  _discoverWSEndpoint() {
    return new Promise((resolve, reject) => {
      const cmd = 'lsof -iTCP -nP -sTCP:LISTEN | grep "^Google" | head -1';
      exec(cmd, (err, stdout) => {
        if (err || !stdout) return reject(new Error('No running Chrome found'));
        const match = stdout.match(/127\.0\.0\.1:(\d+)/);
        if (!match) return reject(new Error('No Chrome debug port found'));
        const port = match[1];
        http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const j = JSON.parse(data);
              resolve(j.webSocketDebuggerUrl);
            } catch (e) {
              reject(new Error('Could not parse Chrome version JSON'));
            }
          });
        }).on('error', reject);
      });
    });
  }

  async discoverAndConnect() {
    if (this.browser) {
      return this.listPages();
    }
    const ws = await this._discoverWSEndpoint();
    this.browser = await puppeteer.connect({ browserWSEndpoint: ws });
    this.pages = {};
    this.pageCounter = 0;
    const pages = (await this.browser.pages()).filter(p => p.url().startsWith('http://') || p.url().startsWith('https://'));
    for (const page of pages) {
      const id = ++this.pageCounter;
      this.pages[id] = page;
    }
    return this.listPages();
  }

  getPage(pageId) {
    const page = this.pages[pageId];
    if (!page) throw new Error(`Page ${pageId} not found. Available: ${Object.keys(this.pages).join(', ')}`);
    return page;
  }

  // Build YAML-like snapshot from accessibility tree with element refs
  async buildSnapshot(page, pageId) {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: true });
    if (!snapshot) return { text: '(empty page)', refs: {} };

    const refs = {};
    this.refCounter = 0;
    const lines = [];

    const renderNode = (node, indent = 0) => {
      const prefix = '  '.repeat(indent);
      const role = node.role || 'generic';
      const name = node.name || '';

      let refTag = '';
      if (CONFIG.INTERACTABLE_ROLES.includes(role) || node.focused) {
        const ref = 'e' + (++this.refCounter);
        refTag = ` [ref=${ref}]`;
        refs[ref] = { role, name, nodeInfo: node };
      }

      const states = [];
      if (node.focused) states.push('focused');
      if (node.checked === true) states.push('checked');
      if (node.checked === 'mixed') states.push('mixed');
      if (node.disabled) states.push('disabled');
      if (node.expanded === true) states.push('expanded');
      if (node.expanded === false) states.push('collapsed');
      if (node.selected) states.push('selected');
      if (node.required) states.push('required');
      if (node.pressed) states.push('pressed');
      const stateStr = states.length ? ` [${states.join(', ')}]` : '';

      let valueStr = '';
      if (node.value !== undefined && node.value !== '') {
        valueStr = `: "${node.value}"`;
      }

      const nameStr = name ? ` "${name}"` : '';
      lines.push(`${prefix}- ${role}${nameStr}${refTag}${stateStr}${valueStr}`);

      if (node.children) {
        for (const child of node.children) {
          renderNode(child, indent + 1);
        }
      }
    };

    renderNode(snapshot);
    return { text: lines.join('\n'), refs };
  }

  // Resolve a ref to a DOM element handle
  async resolveRef(page, pageId, ref) {
    const refMap = this.pageRefs[pageId];
    if (!refMap || !refMap[ref]) throw new Error(`Ref "${ref}" not found. Take a new snapshot first.`);

    const { role, name } = refMap[ref];

    const el = await page.evaluateHandle(({ role, name, roleToSelectors }) => {
      const selectors = roleToSelectors[role] || [`[role="${role}"]`];
      for (const sel of selectors) {
        const elements = [...document.querySelectorAll(sel)];
        for (const el of elements) {
          const label = el.getAttribute('aria-label')
            || el.getAttribute('placeholder')
            || el.getAttribute('title')
            || (el.labels && el.labels[0] && el.labels[0].textContent.trim())
            || el.textContent.trim();
          if (name && label && label.includes(name)) return el;
          if (!name && el.offsetParent !== null) return el;
        }
      }
      return null;
    }, { role, name, roleToSelectors: CONFIG.ROLE_TO_SELECTORS });

    const element = el.asElement();
    if (!element) throw new Error(`Could not find element for ref "${ref}" (${role} "${name}"). Page may have changed — take a new snapshot.`);
    return element;
  }

  // Store snapshot refs for a page
  storeRefs(pageId, refs) {
    this.pageRefs[pageId] = refs;
  }

  getRefInfo(pageId, ref) {
    const refMap = this.pageRefs[pageId];
    return refMap && refMap[ref];
  }

  // --- Network monitoring ---

  enableNetworkMonitor(pageId) {
    const page = this.getPage(pageId);
    if (this.networkLogs[pageId]?.enabled) return; // already enabled

    this.networkLogs[pageId] = { enabled: true, requests: [] };
    const log = this.networkLogs[pageId];

    const onRequest = (request) => {
      const entry = {
        id: log.requests.length + 1,
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        headers: request.headers(),
        postData: request.postData() || null,
        timestamp: Date.now(),
        status: null,
        responseHeaders: null,
        responseSize: null,
        duration: null,
      };
      log.requests.push(entry);
    };

    const onResponse = (response) => {
      const url = response.url();
      const entry = [...log.requests].reverse().find(e => e.url === url && e.status === null);
      if (entry) {
        entry.status = response.status();
        entry.responseHeaders = response.headers();
        const contentLength = response.headers()['content-length'];
        entry.responseSize = contentLength ? parseInt(contentLength, 10) : null;
        entry.duration = Date.now() - entry.timestamp;
      }
    };

    const onRequestFailed = (request) => {
      const url = request.url();
      const entry = [...log.requests].reverse().find(e => e.url === url && e.status === null);
      if (entry) {
        entry.status = 'FAILED';
        entry.error = request.failure()?.errorText || 'Unknown error';
        entry.duration = Date.now() - entry.timestamp;
      }
    };

    page.on('request', onRequest);
    page.on('response', onResponse);
    page.on('requestfailed', onRequestFailed);

    // Store listener refs for cleanup
    log._listeners = { onRequest, onResponse, onRequestFailed };
  }

  disableNetworkMonitor(pageId) {
    const log = this.networkLogs[pageId];
    if (!log?.enabled) return;

    const page = this.pages[pageId];
    if (page && log._listeners) {
      page.off('request', log._listeners.onRequest);
      page.off('response', log._listeners.onResponse);
      page.off('requestfailed', log._listeners.onRequestFailed);
    }
    delete this.networkLogs[pageId];
  }

  getNetworkRequests(pageId, { type, urlPattern, status, clear } = {}) {
    const log = this.networkLogs[pageId];
    if (!log) return [];

    let requests = [...log.requests];

    if (type) {
      requests = requests.filter(r => r.resourceType === type);
    }
    if (urlPattern) {
      const regex = new RegExp(urlPattern, 'i');
      requests = requests.filter(r => regex.test(r.url));
    }
    if (status === 'error') {
      requests = requests.filter(r => r.status === 'FAILED' || (typeof r.status === 'number' && r.status >= 400));
    } else if (status === 'success') {
      requests = requests.filter(r => typeof r.status === 'number' && r.status >= 200 && r.status < 400);
    }

    if (clear) {
      log.requests = [];
    }

    // Return compact version (no full headers by default)
    return requests.map(r => ({
      id: r.id,
      method: r.method,
      url: r.url,
      resourceType: r.resourceType,
      status: r.status,
      responseSize: r.responseSize,
      duration: r.duration ? `${r.duration}ms` : null,
      postData: r.postData,
      error: r.error || undefined,
    }));
  }

  // Clear a field (triple-click + backspace)
  async clearField(page, elementOrSelector) {
    if (typeof elementOrSelector === 'string') {
      await page.click(elementOrSelector, { clickCount: 3 });
    } else {
      await elementOrSelector.click({ clickCount: 3 });
    }
    await page.keyboard.press('Backspace');
  }
}

module.exports = { BrowserManager, CONFIG, localOCR };
