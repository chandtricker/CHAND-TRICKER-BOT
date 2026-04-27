const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const moment = require('moment-timezone');
const CookieManager = require('./Data/system/cookieManager');
const http = require('http');
const { Server } = require('socket.io');
const stripAnsi = require('strip-ansi').default;

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  if (req.query.auth !== 'true') {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/terminal.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terminal.html'));
});



app.use(express.static('public'));

const configModule = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const appstatePath = path.join(__dirname, 'Data/system/appstate.json');
const islamicPath = path.join(__dirname, 'Data/config/islamic_messages.json');
const facebookLinksPath = path.join(__dirname, 'Data/facebook_links.json');
const uidsPath = path.join(__dirname, 'Data/uids.json');
const logFilePath = path.join(__dirname, 'Data/system/log.txt');

const originalConsoleLog = console.log.bind(console);
const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

function appendRootLog(type, args) {
  try {
    const raw = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    const message = stripAnsi(raw).trim();
    const time = moment().tz('Asia/Karachi').format('hh:mm:ss A') + ' || ' + moment().tz('Asia/Karachi').format('DD/MM/YYYY');
    const formatted = `[${time}] [${type}] ${message}\n`;

    fs.ensureFileSync(logFilePath);
    fs.appendFileSync(logFilePath, formatted);
  } catch (error) {
    originalConsoleError('[LOG WRITE ERROR]', error?.message || error);
  }
}

console.log = (...args) => {
  originalConsoleLog(...args);
  appendRootLog('INFO', args);
};
console.error = (...args) => {
  originalConsoleError(...args);
  appendRootLog('ERROR', args);
};
console.warn = (...args) => {
  originalConsoleWarn(...args);
  appendRootLog('WARN', args);
};

let botModule = null;
let botStarted = false;
let appstateRefreshTimer = null;
let appstateCheckTimer = null;
const PORT = process.env.PORT || 3000;

function getConfig() {
  try {
    const configData = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    if (!configData.ADMIN_USERNAME) {
      configData.ADMIN_USERNAME = 'chand';
    }
    if (!configData.ADMIN_PASSWORD) {
      configData.ADMIN_PASSWORD = 'chand123';
    }
    return configData;
  } catch {
    return {
      ADMIN_USERNAME: 'chand',
      ADMIN_PASSWORD: 'chand123'
    };
  }
}

function saveConfig(config) {
  const configContent = JSON.stringify(config, null, 2);
  fs.writeFileSync(path.join(__dirname, 'config.json'), configContent);
}

function getAppstate() {
  try {
    return fs.readJsonSync(appstatePath);
  } catch {
    return null;
  }
}

function saveAppstate(appstate) {
  fs.writeJsonSync(appstatePath, appstate, { spaces: 2 });
}

function checkAppstateValidity() {
  try {
    const appstate = fs.readJsonSync(appstatePath);
    if (!appstate || !Array.isArray(appstate) || appstate.length === 0) {
      console.log('[APPSTATE CHECK] AppState is invalid or empty - setting bot offline');
      botStarted = false;
      return false;
    }
    return true;
  } catch (error) {
    console.log('[APPSTATE CHECK] AppState file error - setting bot offline:', error.message);
    botStarted = false;
    return false;
  }
}

function getFacebookLinks() {
  try {
    return fs.readJsonSync(facebookLinksPath);
  } catch {
    return [];
  }
}

function saveFacebookLinks(links) {
  fs.writeJsonSync(facebookLinksPath, links, { spaces: 2 });
}

function getUids() {
  try {
    return fs.readJsonSync(uidsPath);
  } catch {
    return [];
  }
}

function saveUids(uids) {
  fs.writeJsonSync(uidsPath, uids, { spaces: 2 });
}

app.get('/', (req, res) => {
  if (req.query.auth !== 'true') {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/config', (req, res) => {
  try {
    const config = getConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);

    if (botModule) {
      botModule.loadConfig();
    }

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/appstate', (req, res) => {
  try {
    const { appstate } = req.body;
    saveAppstate(appstate);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/cookies', (req, res) => {
  try {
    const { cookies } = req.body;
    if (!cookies) {
      return res.json({ success: false, error: 'No cookies provided' });
    }
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    fs.writeFileSync(cookiesPath, cookies);
    console.log('[✅] Cookies saved to cookies.txt');
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/cookies', (req, res) => {
  try {
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    if (fs.existsSync(cookiesPath)) {
      const cookies = fs.readFileSync(cookiesPath, 'utf8');
      res.json({ cookies });
    } else {
      res.json({ cookies: null });
    }
  } catch (error) {
    res.json({ cookies: null });
  }
});

app.post('/api/cookies/validate', (req, res) => {
  try {
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    if (!fs.existsSync(cookiesPath)) {
      return res.json({ valid: false, error: 'No cookies file found' });
    }
    const valid = CookieManager.validateCookies();
    res.json({ valid });
  } catch (error) {
    res.json({ valid: false, error: error.message });
  }
});

app.post('/api/cookies/refresh', (req, res) => {
  try {
    const success = CookieManager.refreshAppstate();
    if (success) {
      res.json({ success: true, message: 'AppState refreshed from cookies' });
    } else {
      res.json({ success: false, error: 'Failed to refresh appstate from cookies' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});



app.post('/api/cookies/clear', (req, res) => {
  try {
    const cookiesPath = path.join(__dirname, 'cookies.txt');
    const appstatePath = path.join(__dirname, 'Data/system/appstate.json');

    let cleared = false;

    if (fs.existsSync(cookiesPath)) {
      fs.removeSync(cookiesPath);
      cleared = true;
    }

    if (fs.existsSync(appstatePath)) {
      fs.removeSync(appstatePath);
      cleared = true;
    }

    if (cleared) {
      res.json({ success: true, message: 'Cookies and appstate cleared!' });
    } else {
      res.json({ success: false, error: 'No cookies found to clear' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/start', async (req, res) => {
  try {
    // Try to refresh appstate from cookies before starting bot
    console.log('[🔄 Bot Start] Attempting to load cookies and refresh appstate...');

    if (fs.existsSync(path.join(__dirname, 'cookies.txt'))) {
      const cookiesValid = CookieManager.validateCookies();
      if (cookiesValid) {
        const appstateRefreshed = CookieManager.generateAppstateFromCookies();
        if (appstateRefreshed) {
          console.log('[✅ Bot Start] AppState automatically updated from cookies');
        } else {
          console.log('[⚠️  Bot Start] Could not generate appstate from cookies, using existing appstate');
        }
      } else {
        console.log('[⚠️  Bot Start] Cookies validation failed, using existing appstate');
      }
    } else {
      console.log('[ℹ️  Bot Start] No cookies.txt found, using existing appstate');
    }

    if (!fs.existsSync(logFilePath)) {
      fs.ensureFileSync(logFilePath);
    } else {
      fs.writeFileSync(logFilePath, '');
    }

    if (!fs.existsSync(appstatePath)) {
      return res.json({ success: false, error: 'AppState not configured. Please add cookies.txt or upload appstate JSON.' });
    }

    // Stop existing bot first if running, then start new one
    if (botModule && botModule.isBotRunning && botModule.isBotRunning()) {
      console.log('[🔄 Bot Start] Stopping existing bot before starting new one...');
      if (botModule.stopBot) {
        await botModule.stopBot();
      }
      botStarted = false;
      Object.keys(require.cache).forEach(key => {
        if (key.includes('./CHAND') || key.includes('fca-unofficial') || key.includes('cookieManager')) {
          delete require.cache[key];
        }
      });
      botModule = null;
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!fs.existsSync(logFilePath)) {
      fs.ensureFileSync(logFilePath);
    } else {
      fs.writeFileSync(logFilePath, '');
    }

    botModule = require('./CHAND');
    await botModule.startBot();
    botStarted = botModule.isBotRunning();
    
    // Clear account issue on successful bot start
    try {
      const accountIssuePath = path.join(__dirname, 'Data/system/account_issue.txt');
      if (fs.existsSync(accountIssuePath)) {
        fs.unlinkSync(accountIssuePath);
      }
    } catch (e) {}

    // Start the appstate refresh timer
    startAppstateRefreshTimer();
    startAppstateCheckTimer();

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/stop', async (req, res) => {
  try {
    if (botModule && botModule.isBotRunning && botModule.isBotRunning()) {
      console.log('[🛑 Bot Stop] Stopping bot...');

      if (botModule.stopBot) {
        await botModule.stopBot();
      }

      Object.keys(require.cache).forEach(key => {
        if (key.includes('./CHAND') || key.includes('fca-unofficial') || key.includes('cookieManager')) {
          delete require.cache[key];
        }
      });

      botModule = null;
      botStarted = false;

      if (appstateRefreshTimer) {
        clearInterval(appstateRefreshTimer);
        appstateRefreshTimer = null;
      }
      if (appstateCheckTimer) {
        clearInterval(appstateCheckTimer);
        appstateCheckTimer = null;
      }

      console.log('[✅ Bot Stop] Bot stopped successfully');
      res.json({ success: true });
    } else {
      res.json({ success: true, message: 'Bot was already stopped' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/commands', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not running. Start bot first!' });
    }

    const result = await botModule.reloadCommands();
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/events', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not running. Start bot first!' });
    }

    const result = await botModule.reloadEvents();
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/reload/all', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not running. Start bot first!' });
    }

    const cmdResult = await botModule.reloadCommands();
    const evtResult = await botModule.reloadEvents();
    
    res.json({ 
      success: true, 
      commands: cmdResult.success,
      events: evtResult.success 
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Global reload function for CHAND module
global.reloadChand = async function() {
  try {
    if (botModule && botModule.isBotRunning && botModule.isBotRunning()) {
      console.log('[🔄 CHAND Reload] Stopping existing bot module...');
      if (botModule.stopBot) {
        await botModule.stopBot();
      }
      global.isBotRunning = false;
    }

    Object.keys(require.cache).forEach(key => {
      if (key.includes(path.join(__dirname, 'CHAND')) || key.includes('fca-unofficial') || key.includes('cookieManager') || key.includes('lodash-pari')) {
        delete require.cache[key];
      }
    });

    botModule = require('./CHAND');
    await botModule.startBot();
    botStarted = botModule.isBotRunning();

    startAppstateRefreshTimer();
    startAppstateCheckTimer();

    return { success: true, message: 'CHAND module reloaded successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

app.post('/api/reload/chand', async (req, res) => {
  const result = await global.reloadChand();
  res.json(result);
});

let isRestarting = false;

app.post('/api/restart', async (req, res) => {
  if (isRestarting) {
    return res.json({ success: false, error: 'Restart in progress, please wait...' });
  }
  
  isRestarting = true;
  
  try {
    // Stop existing bot first
    if (botModule && botModule.isBotRunning && botModule.isBotRunning()) {
      console.log('[🔄 Bot Restart] Stopping bot before server restart...');
      
      isBotRunning = false;
      global.isBotRunning = false;
      global.api = null;
      
      try {
        if (botModule.stopBot) {
          await botModule.stopBot();
        }
      } catch (e) {
        console.log('[⚠️] Error calling stopBot:', e.message);
      }
    }
    
    if (appstateRefreshTimer) {
      clearInterval(appstateRefreshTimer);
      appstateRefreshTimer = null;
    }
    if (appstateCheckTimer) {
      clearInterval(appstateCheckTimer);
      appstateCheckTimer = null;
    }
    
    console.log('[🔄] Server Restarting...');
    res.json({ success: true, message: 'Server restarting...' });
    
    // Trigger auto-restart and exit
    autoRestartServer();
    process.exit(1);
  } catch (error) {
    console.error('[Restart Error]', error);
    isRestarting = false;
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/test-message', async (req, res) => {
  try {
    if (!botModule) {
      return res.json({ success: false, error: 'Bot not started' });
    }

    const api = botModule.getApi();
    if (!api) {
      return res.json({ success: false, error: 'Bot not logged in' });
    }

    const { uid } = req.body;
    const config = getConfig();

    api.sendMessage(`Test message from ${config.BOTNAME}!`, uid);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/status', (req, res) => {
  let commandCount = 0;
  let eventCount = 0;
  try {
    const commandsPath = path.join(__dirname, 'node_modules/lodash-pari/commands');
    const eventsPath = path.join(__dirname, 'node_modules/lodash-pari/events');
    commandCount = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).length;
    eventCount = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js')).length;
  } catch (e) {}

  let accountIssue = false;
  let botName = '';
  try {
    const accountIssuePath = path.join(__dirname, 'Data/system/account_issue.txt');
    if (fs.existsSync(accountIssuePath)) {
      const content = fs.readFileSync(accountIssuePath, 'utf8').trim();
      accountIssue = content.includes('LOGOUT');
    }
  } catch (e) {}
  
  try {
    const botInfoPath = path.join(__dirname, 'Data/system/database/botdata/bot_info.json');
    if (fs.existsSync(botInfoPath)) {
      const botInfo = JSON.parse(fs.readFileSync(botInfoPath, 'utf8'));
      botName = botInfo.name || '';
    }
  } catch (e) {}

  res.json({
    botStarted,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    config: getConfig(),
    commandCount,
    eventCount,
    accountIssue,
    botName
  });
});

const keyFilePath = path.join(__dirname, 'key.txt');

app.get('/api/key', (req, res) => {
  try {
    if (fs.existsSync(keyFilePath)) {
      const key = fs.readFileSync(keyFilePath, 'utf8').trim();
      res.json({ success: true, key });
    } else {
      res.json({ success: false, error: 'Key file not found' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/key', (req, res) => {
  try {
    const { key, restart } = req.body;
    if (!key && restart !== 'true') {
      return res.json({ success: false, error: 'Key is required' });
    }

    if (key) {
      fs.writeFileSync(keyFilePath, key);
    }

    if (restart === 'true' && botModule) {
      botModule.reloadCommands();
      console.log('[🔄] Commands reloaded after key update');
    }

    res.json({ success: true, message: restart === 'true' ? 'Key updated & bot reloaded!' : 'Key saved successfully' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/facebook-links', (req, res) => {
  try {
    const links = getFacebookLinks();
    res.json({ success: true, links });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/facebook-links', (req, res) => {
  try {
    const { name, url } = req.body;
    if (!name || !url) return res.json({ success: false, error: 'Name aur URL zaroor chahiye' });
    const links = getFacebookLinks();
    const id = Date.now().toString();
    links.push({ id, name, url, addedAt: new Date().toISOString() });
    saveFacebookLinks(links);
    res.json({ success: true, id });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/facebook-links/:id', (req, res) => {
  try {
    const { id } = req.params;
    let links = getFacebookLinks();
    links = links.filter(l => l.id !== id);
    saveFacebookLinks(links);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/uids', (req, res) => {
  try {
    const uids = getUids();
    res.json({ success: true, uids });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/uids', (req, res) => {
  try {
    const { uid, label } = req.body;
    if (!uid) return res.json({ success: false, error: 'UID zaroor chahiye' });
    const uids = getUids();
    if (uids.find(u => u.uid === uid)) return res.json({ success: false, error: 'Yeh UID pehle se exist karta hai' });
    uids.push({ uid, label: label || 'User', addedAt: new Date().toISOString() });
    saveUids(uids);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/uids/:uid', (req, res) => {
  try {
    const { uid } = req.params;
    let uids = getUids();
    uids = uids.filter(u => u.uid !== uid);
    saveUids(uids);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const apiKeysPath = path.join(__dirname, 'Data/api_keys.json');

function getApiKeys() {
  try {
    return fs.readJsonSync(apiKeysPath);
  } catch {
    return [];
  }
}

function saveApiKeys(keys) {
  fs.writeJsonSync(apiKeysPath, keys, { spaces: 2 });
}

app.get('/api/admin/keys/list', (req, res) => {
  try {
    const { adminKey } = req.query;
    if (adminKey !== 'admin_chand_2024_secure_key') {
      return res.json({ success: false, error: 'Invalid admin key' });
    }
    const keys = getApiKeys();
    res.json({ success: true, keys });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/admin/keys/generate', (req, res) => {
  try {
    const { adminKey, userId, userName } = req.body;
    if (adminKey !== 'admin_chand_2024_secure_key') {
      return res.json({ success: false, error: 'Invalid admin key' });
    }
    const keys = getApiKeys();
    const apiKey = 'CHAND_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    keys.push({
      apiKey,
      userId,
      userName: userName || '',
      createdAt: new Date().toISOString()
    });
    saveApiKeys(keys);
    res.json({ success: true, apiKey });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/admin/keys/revoke', (req, res) => {
  try {
    const { adminKey, apiKey } = req.body;
    if (adminKey !== 'admin_chand_2024_secure_key') {
      return res.json({ success: false, error: 'Invalid admin key' });
    }
    let keys = getApiKeys();
    keys = keys.filter(k => k.apiKey !== apiKey);
    saveApiKeys(keys);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});


function startAppstateRefreshTimer() {
  if (appstateRefreshTimer) clearInterval(appstateRefreshTimer);

  appstateRefreshTimer = setInterval(() => {
    console.log('[🔄 AppState Refresh] Attempting to refresh appstate from cookies...');
    const success = CookieManager.refreshAppstate();
    if (success) {
      console.log('[✅ AppState Refresh] Successfully refreshed appstate');
    } else {
      console.log('[❌ AppState Refresh] Failed to refresh appstate');
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
}

function startAppstateCheckTimer() {
  if (appstateCheckTimer) clearInterval(appstateCheckTimer);

  appstateCheckTimer = setInterval(() => {
    console.log('[🔍 AppState Check] Checking appstate validity...');
    checkAppstateValidity();
  }, 15 * 60 * 1000); // Every 15 minutes
}

/**
 * Initialize bot with cookie-based authentication
 */
function initializeBotWithCookies() {
  console.log('[🔧 Initialization] Starting cookie-based authentication...');

  // Validate cookies exist
  if (!fs.existsSync(path.join(__dirname, 'cookies.txt'))) {
    console.log('[❌ Initialization] cookies.txt not found in root directory');
    console.log('[ℹ️  Hint] Please create cookies.txt with Facebook cookies first');
    return false;
  }

  // Validate and generate appstate from cookies
  if (!CookieManager.validateCookies()) {
    console.log('[❌ Initialization] Cookie validation failed');
    return false;
  }

  if (!CookieManager.generateAppstateFromCookies()) {
    console.log('[❌ Initialization] Failed to generate appstate from cookies');
    return false;
  }

  console.log('[✅ Initialization] AppState generated successfully from cookies');

  // Start refresh timer
  startAppstateRefreshTimer();
  console.log('[⏱️  Initialization] Started 6-hour appstate refresh timer');

  return true;
}

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const config = getConfig();

    if (username === config.ADMIN_USERNAME && password === config.ADMIN_PASSWORD) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/change-credentials', (req, res) => {
  try {
    const { username, password } = req.body;
    const configPath = './config.json';
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    config.ADMIN_USERNAME = username;
    config.ADMIN_PASSWORD = password;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    res.json({ success: true, message: 'Credentials updated' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const logsPath = path.join(__dirname, 'Data/system/database/botdata/logs');

function parseLogLine(line) {
  const cleanLine = stripAnsi(String(line)).trim();
  if (!cleanLine) return null;

  let match = cleanLine.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    return { time: match[1], type: match[2], message: match[3] };
  }

  match = cleanLine.match(/^(.+?)\s*\|\|\s*(.+?)\s*\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    return { time: `${match[1]} || ${match[2]}`, type: match[3], message: match[4] };
  }

  match = cleanLine.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    return { time: '', type: 'LOG', message: match[2] };
  }

  return { time: '', type: 'LOG', message: cleanLine };
}

function readLogFileLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').map(parseLogLine).filter(Boolean);
}

function getBotLogs() {
  try {
    const rootLogs = readLogFileLines(logFilePath);
    if (rootLogs.length) {
      return rootLogs.slice(-200);
    }

    if (!fs.existsSync(logsPath)) return [];
    const files = fs.readdirSync(logsPath).filter(f => f.endsWith('.log'));
    let allLogs = [];
    files.forEach(file => {
      const lines = readLogFileLines(path.join(logsPath, file));
      allLogs = allLogs.concat(lines);
    });
    return allLogs.slice(-200);
  } catch {
    return [];
  }
}

app.get('/api/logs', (req, res) => {
  try {
    const logs = getBotLogs();
    res.json({ success: true, logs });
  } catch (error) {
    res.json({ success: false, logs: [], error: error.message });
  }
});

app.post('/api/logs/clear', (req, res) => {
  try {
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    }
    if (fs.existsSync(logsPath)) {
      const files = fs.readdirSync(logsPath).filter(f => f.endsWith('.log'));
      files.forEach(file => fs.removeSync(path.join(logsPath, file)));
    }
    res.json({ success: true, message: 'Logs cleared!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  // Silent on connect
  socket.on('disconnect', () => {
    // Silent on disconnect
  });
});

global.io = io;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} already in use - retrying in 3s...`);
    setTimeout(() => server.listen(PORT), 3000);
  } else {
    console.error('[SERVER] Server error:', err.message);
  }
});

server.listen(PORT, () => {
  // Minimal startup message
  console.log(`CHAND BOT running on http://localhost:${PORT}`);

  if (!fs.existsSync(logFilePath)) {
    fs.ensureFileSync(logFilePath);
  } else {
    fs.writeFileSync(logFilePath, '');
  }

  const config = getConfig();

  if (config.API_KEY_ENABLED && Object.keys(config.USERS_API_KEYS).length === 0) {
    
  }

  // Try to initialize bot with cookies
  const cookiesReady = initializeBotWithCookies();

  if (cookiesReady || fs.existsSync(appstatePath)) {
    if (botStarted) {
      console.log('[ℹ️ Bot Startup] Bot already running via API');
    } else {
      console.log('\n[📱 Bot Startup] AppState ready, starting bot in 3 seconds...\n');
      setTimeout(async () => {
        try {
          botModule = require('./CHAND');
          await botModule.startBot();
          botStarted = botModule.isBotRunning();
          if (botStarted) {
            console.log('[✅ Bot Startup] Bot started successfully');
          } else {
            console.log('[❌ Bot Startup] Bot did not start because appstate or login failed');
          }
        } catch (error) {
          console.error('[❌] Bot startup failed:', error.message);
        }
      }, 3000);
    }
  } else {
    console.log('');
    console.log('  ____  _  _   __   _  _  ____    ____  ____  ____');
    console.log(' / ___|| || | / _\\ | \\| ||    \\  | __ )/ __ \\|_  _|');
    console.log('| |    | || |/    \\| .` || ) _ \\ |  _ \\| |  | || |  ');
    console.log('| |___ | || / /\\ \\| |\\  || |_) || |_) | |__| || |  ');
    console.log(' \\____||_||_\\_/\\_/|_| \\_||____/ |____/ \\____/ |_|  ');
    console.log('');
    console.log('+---------------------------------------------------+');
    console.log('|         [!] APPSTATE NOT FOUND                   |');
    console.log('+---------------------------------------------------+');
    console.log('|  Bot cannot start without valid credentials.     |');
    console.log('|                                                   |');
    console.log('|  Instructions:                                    |');
    console.log('|  1. Upload appstate JSON in web panel            |');
    console.log('|  2. Add cookies.txt in root directory            |');
    console.log('|  3. Restart bot after adding credentials         |');
    console.log('|                                                   |');
    console.log('|  Web Panel: http://0.0.0.0:' + PORT.toString().padEnd(27) + '|');
    console.log('+---------------------------------------------------+');
    console.log('');
  }
});

app.post('/api/exit', (req, res) => {
  try {
    res.json({ success: true });
    console.log('[🛑] Exiting server...');
    process.exit(0);
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});
