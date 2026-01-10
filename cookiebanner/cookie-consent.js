/**
 * Minimal Cookie Consent Banner
 * Manages consent for analytics_storage and ad_storage
 * Cookie name: _cnsnt
 */

(function() {
  'use strict';

  const COOKIE_NAME = '_cnsnt';
  const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

  // CSS Styles
  const styles = `
    #cookieBanner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #fff;
      border-top: 1px solid #0f0f0f;
      padding: 24px;
      z-index: 2147483645;
      font-family: Lato, sans-serif;
      font-size: 15px;
      color: #0f0f0f;
      display: none;
    }
    #cookieBanner.show { display: block; }
    .banner-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .banner-text { flex: 1; min-width: 300px; }
    .banner-text p { margin: 0 0 8px 0; font-size: 15px; line-height: 1.4; }
    .banner-text a { color: #ff1d5d; text-decoration: underline; }
    .banner-buttons { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .cookie-btn {
      font-family: Lato, sans-serif;
      font-size: 15px;
      cursor: pointer;
      border: 1px solid #0f0f0f;
      padding: 16px 24px;
      min-width: 120px;
      transition: opacity 0.2s;
    }
    .cookie-btn:hover { opacity: 0.8; }
    .btn-deny { background: transparent; color: #0f0f0f; font-weight: 700; }
    .btn-allow { background: #ff1d5d; color: #fff; font-weight: 700; }
    .btn-details {
      background: transparent;
      color: #0f0f0f;
      border: none;
      font-weight: 400;
      text-decoration: underline;
      padding: 8px 16px;
      min-width: auto;
    }
    #cookieDetails {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483646;
      display: none;
      overflow-y: auto;
    }
    #cookieDetails.show { display: block; }
    .details-dialog {
      background: #fff;
      max-width: 800px;
      margin: 40px auto;
      padding: 48px;
      position: relative;
    }
    .details-close {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      font-size: 24px;
      padding: 8px;
      min-width: auto;
      cursor: pointer;
    }
    .details-title { font-size: 24px; font-weight: 700; margin: 0 0 24px 0; }
    .cookie-category { border-bottom: 1px solid #e0e0e0; padding: 24px 0; }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .category-name { font-weight: 700; font-size: 16px; }
    .category-desc { color: #666; font-size: 14px; margin: 0; line-height: 1.5; }
    .toggle { position: relative; width: 48px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
    }
    .toggle input:checked + .toggle-slider { background-color: #ff1d5d; }
    .toggle input:checked + .toggle-slider:before { transform: translateX(24px); }
    .toggle input:disabled + .toggle-slider { opacity: 0.5; cursor: not-allowed; }
    .details-actions { margin-top: 32px; display: flex; gap: 10px; justify-content: flex-end; }
    @media (max-width: 768px) {
      .banner-content { flex-direction: column; align-items: stretch; }
      .banner-buttons { justify-content: stretch; flex-direction: column; }
      .banner-buttons button { width: 100%; }
      .details-dialog { margin: 0; min-height: 100vh; padding: 24px; }
    }
  `;

  // HTML Templates
  const bannerHTML = `
    <div id="cookieBanner">
      <div class="banner-content">
        <div class="banner-text">
          <p>We use cookies to analyse user behaviour and personalise content and ads. <a href="/privacy-policy">Details.</a></p>
        </div>
        <div class="banner-buttons">
          <button class="cookie-btn btn-deny" onclick="CookieConsent.denyAll()">Deny</button>
          <button class="cookie-btn btn-allow" onclick="CookieConsent.allowAll()">Allow</button>
          <button class="cookie-btn btn-details" onclick="CookieConsent.showDetails()">Show details</button>
        </div>
      </div>
    </div>
  `;

  const detailsHTML = `
    <div id="cookieDetails">
      <div class="details-dialog">
        <button class="details-close" onclick="CookieConsent.hideDetails()">&times;</button>
        <h2 class="details-title">Cookie Preferences</h2>

        <div class="cookie-category">
          <div class="category-header">
            <span class="category-name">Necessary</span>
            <label class="toggle">
              <input type="checkbox" checked disabled>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="category-desc">Essential cookies for basic website functionality.</p>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <span class="category-name">Statistics</span>
            <label class="toggle">
              <input type="checkbox" id="toggle-analytics">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="category-desc">Cookies that help us understand how visitors interact with our website.</p>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <span class="category-name">Marketing</span>
            <label class="toggle">
              <input type="checkbox" id="toggle-marketing">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <p class="category-desc">Cookies used to track visitors across websites and display relevant ads.</p>
        </div>

        <div class="details-actions">
          <button class="cookie-btn btn-deny" onclick="CookieConsent.saveSelection()">Allow selection</button>
          <button class="cookie-btn btn-allow" onclick="CookieConsent.allowAll()">Allow all</button>
        </div>
      </div>
    </div>
  `;

  // Cookie utilities
  function getCookie(name) {
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
  }

  function setCookie(name, value) {
    const json = JSON.stringify(value);
    document.cookie = `${name}=${encodeURIComponent(json)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  function updateConsent(analytics, marketing) {
    const consent = {
      analytics_storage: analytics,
      ad_storage: marketing,
      timestamp: new Date().toISOString()
    };
    setCookie(COOKIE_NAME, consent);

    // Push to GTM dataLayer
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'cookie_consent_update',
        consent: consent
      });
    }

    return consent;
  }

  // UI functions
  function hideBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.remove('show');
  }

  function showBanner() {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.add('show');
  }

  function showDetails() {
    const current = getCookie(COOKIE_NAME);
    if (current) {
      const analyticsToggle = document.getElementById('toggle-analytics');
      const marketingToggle = document.getElementById('toggle-marketing');
      if (analyticsToggle) analyticsToggle.checked = current.analytics_storage || false;
      if (marketingToggle) marketingToggle.checked = current.ad_storage || false;
    }
    const details = document.getElementById('cookieDetails');
    if (details) details.classList.add('show');
  }

  function hideDetails() {
    const details = document.getElementById('cookieDetails');
    if (details) details.classList.remove('show');
  }

  function allowAll() {
    updateConsent(true, true);
    hideBanner();
    hideDetails();
  }

  function denyAll() {
    updateConsent(false, false);
    hideBanner();
    hideDetails();
  }

  function saveSelection() {
    const analyticsToggle = document.getElementById('toggle-analytics');
    const marketingToggle = document.getElementById('toggle-marketing');
    const analytics = analyticsToggle ? analyticsToggle.checked : false;
    const marketing = marketingToggle ? marketingToggle.checked : false;
    updateConsent(analytics, marketing);
    hideBanner();
    hideDetails();
  }

  function showCookieSettings() {
    showBanner();
  }

  function init() {
    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // Inject HTML
    const bannerEl = document.createElement('div');
    bannerEl.innerHTML = bannerHTML;
    document.body.appendChild(bannerEl.firstElementChild);

    const detailsEl = document.createElement('div');
    detailsEl.innerHTML = detailsHTML;
    document.body.appendChild(detailsEl.firstElementChild);

    // Attach listener to cookie settings link
    const settingsLink = document.getElementById('cookie-settings');
    if (settingsLink) {
      settingsLink.addEventListener('click', function(event) {
        event.preventDefault();
        showCookieSettings();
      });
    }

    // Show banner if no consent exists
    const consent = getCookie(COOKIE_NAME);
    if (!consent) {
      showBanner();
    }
  }

  // Public API
  window.CookieConsent = {
    init: init,
    showBanner: showBanner,
    hideBanner: hideBanner,
    showDetails: showDetails,
    hideDetails: hideDetails,
    allowAll: allowAll,
    denyAll: denyAll,
    saveSelection: saveSelection,
    showCookieSettings: showCookieSettings,
    getCookie: function() { return getCookie(COOKIE_NAME); }
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
