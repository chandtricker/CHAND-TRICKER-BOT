const fs = require('fs-extra');
const path = require('path');

const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');
const APPSTATE_PATH = path.join(__dirname, 'appstate.json');

class CookieManager {
  /**
   * Parse raw cookie string into key-value pairs
   * Supports both semicolon-separated and newline-separated formats
   */
  static parseCookieString(cookieStr) {
    const cookies = {};
    if (!cookieStr) return cookies;

    // Support both semicolon and newline separators
    const separator = cookieStr.includes('\n') ? '\n' : ';';
    const cookiePairs = cookieStr.split(separator);

    cookiePairs.forEach(cookie => {
      const trimmed = cookie.trim();
      if (!trimmed) return;

      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;

      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim();

      if (key && value) {
        cookies[key] = value;
      }
    });

    return cookies;
  }

  /**
   * Convert cookies to appstate format
   * FCA appstate is an array of {key, value, domain, ...} objects
   */
  static cookiesToAppstate(cookies) {
    const appstate = [];

    for (const [key, value] of Object.entries(cookies)) {
      appstate.push({
        key: key,
        value: value,
        domain: '.facebook.com',
        path: '/',
        hostOnly: false,
        creation: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      });
    }

    return appstate;
  }

  /**
   * Load cookies from cookies.txt and convert to appstate
   */
  static loadCookiesFromFile() {
    try {
      if (!fs.existsSync(COOKIES_PATH)) {
        console.log('[CookieManager] ❌ cookies.txt not found');
        return null;
      }

      const cookieStr = fs.readFileSync(COOKIES_PATH, 'utf-8').trim();
      if (!cookieStr) {
        console.log('[CookieManager] ❌ cookies.txt is empty');
        return null;
      }

      const cookies = this.parseCookieString(cookieStr);
      console.log(`[CookieManager] ✅ Loaded ${Object.keys(cookies).length} cookies from cookies.txt`);
      console.log('[CookieManager] 📝 Cookie keys:', Object.keys(cookies).join(', '));

      return cookies;
    } catch (error) {
      console.error('[CookieManager] ❌ Error loading cookies:', error.message);
      return null;
    }
  }

  /**
   * Generate appstate from cookies and save it
   */
  static generateAppstateFromCookies() {
    const cookies = this.loadCookiesFromFile();
    if (!cookies) {
      console.log('[CookieManager] ❌ Could not generate appstate - no cookies loaded');
      return false;
    }

    const appstate = this.cookiesToAppstate(cookies);

    try {
      fs.writeJsonSync(APPSTATE_PATH, appstate, { spaces: 2 });
      console.log('[CookieManager] ✅ AppState generated and saved from cookies');
      console.log(`[CookieManager] 📊 AppState contains ${appstate.length} items`);
      return true;
    } catch (error) {
      console.error('[CookieManager] ❌ Error saving appstate:', error.message);
      return false;
    }
  }

  /**
   * Check if cookies are still valid (basic validation)
   */
  static validateCookies() {
    const cookies = this.loadCookiesFromFile();
    if (!cookies) return false;

    // Check for critical Facebook cookies
    const requiredCookies = ['c_user', 'xs', 'fr'];
    const missing = requiredCookies.filter(key => !cookies[key]);

    if (missing.length > 0) {
      console.warn(`[CookieManager] ⚠️ Missing required cookies: ${missing.join(', ')}`);
      return false;
    }

    console.log('[CookieManager] ✅ Cookies validation passed');
    return true;
  }

  /**
   * Get current user ID from cookies
   */
  static getUserIdFromCookies() {
    const cookies = this.loadCookiesFromFile();
    return cookies?.c_user || null;
  }

  /**
   * Refresh appstate from cookies (called periodically or on error)
   */
  static refreshAppstate() {
    console.log('[CookieManager] 🔄 Refreshing AppState from cookies...');
    return this.generateAppstateFromCookies();
  }
}

module.exports = CookieManager;
