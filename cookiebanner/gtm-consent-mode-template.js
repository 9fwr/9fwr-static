/**
 * GTM Cookie Banner + Consent Mode Template
 *
 * This template:
 * 1. Sets default consent states (all denied except functionality_storage)
 * 2. Reads existing _cnsnt cookie and updates consent if found
 * 3. Loads the cookie banner script automatically
 *
 * Cookie format:
 * {
 *   "analytics_storage": true,
 *   "ad_storage": false,
 *   "timestamp": "2026-01-10T20:36:03.071Z"
 * }
 *
 * Setup in GTM:
 * 1. Import gtm-consent-mode-template.tpl
 * 2. Create tag using this template
 * 3. Set "Cookie Banner Script URL" parameter (default: /cookie-consent.js)
 * 4. Set trigger: Consent Initialization - All Pages
 * 5. Publish
 */

// ===== SANDBOXED JAVASCRIPT CODE =====

const setDefaultConsentState = require('setDefaultConsentState');
const updateConsentState = require('updateConsentState');
const getCookieValues = require('getCookieValues');
const injectScript = require('injectScript');
const JSON = require('JSON');
const COOKIE_NAME = '_cnsnt';

// Set default consent state (before user makes a choice)
setDefaultConsentState({
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'denied',
});

// Read the consent cookie
const settings = getCookieValues(COOKIE_NAME);

// Update consent if cookie exists
if (settings && settings[0]) {
  const decodedCookie = settings[0];
  const cookieJson = JSON.parse(decodedCookie);

  const consentModeStates = {
    ad_storage: cookieJson.ad_storage ? 'granted' : 'denied',
    ad_user_data: cookieJson.ad_storage ? 'granted' : 'denied',
    ad_personalization: cookieJson.ad_storage ? 'granted' : 'denied',
    analytics_storage: cookieJson.analytics_storage ? 'granted' : 'denied',
    functionality_storage: 'granted',
  };

  updateConsentState(consentModeStates);
}

// Load cookie banner script
const scriptUrl = data.scriptUrl || '/cookie-consent.js';

injectScript(scriptUrl, data.gtmOnSuccess, data.gtmOnFailure);


// ===== TEMPLATE PARAMETERS =====

/**
 * scriptUrl (TEXT field)
 * - Display Name: "Cookie Banner Script URL"
 * - Default Value: "/cookie-consent.js"
 * - Help: "URL to the cookie-consent.js file (relative or absolute)"
 */


// ===== PERMISSIONS =====

/**
 * 1. Access Consent Permission
 * Grant read and write access for:
 * - ad_storage
 * - analytics_storage
 * - functionality_storage
 * - personalization_storage
 * - security_storage
 * - ad_user_data
 * - ad_personalization
 */

/**
 * 2. Get Cookies Permission
 * Cookie access: "specific"
 * Cookie names: _cnsnt
 */

/**
 * 3. Inject Script Permission
 * Allowed URLs:
 * - https://9fwr.com/*
 * - https://de.9fwr.com/*
 * - https://*.9fwr.com/*
 */
