# Cookie Banner Implementation

Minimal, self-contained cookie consent banner for 9fwr.com.

## Files

### Production Files
- **cookie-consent.js** - Main script (245 lines, self-contained)
  - Add to your site with: `<script src="cookie-consent.js"></script>`
  - Auto-initializes on page load
  - Creates banner and details dialog

### GTM Integration
- **gtm-consent-mode-template.tpl** - Importable GTM custom template
  - Manages Google Consent Mode v2
  - Reads `_cnsnt` cookie
  - Sets default consent states
- **gtm-consent-mode-template.js** - Template code with documentation

### Test Files
- **cookie-banner-minimal.html** - Test page
- **cookie-banner.test.js** - Playwright test suite (12 tests, all passing)
- **open_test.js** - Manual testing helper

### Analysis Files
- **banner_data.json** - Extracted banner HTML structure
- **cookiebanner_extracted.css** - CSS rules from live site
- **cookiebanner_computed_styles.json** - Computed styles

## Quick Start

### Test Locally
```bash
cd cookiebanner
node open_test.js
```

### Run Automated Tests
```bash
node cookie-banner.test.js
```

### Integration (Two Options)

#### Option A: GTM Integration (Recommended)
Everything loads through GTM - no HTML changes needed!

1. Upload `cookie-consent.js` to your website (e.g., `/cookie-consent.js`)
2. Import `gtm-consent-mode-template.tpl` to GTM
3. Create tag, set Script URL to `/cookie-consent.js`
4. Set trigger: **Consent Initialization - All Pages**
5. Publish GTM container

Done! The template handles both consent mode AND loading the banner script.

#### Option B: Manual Integration
1. Copy `cookie-consent.js` to your website
2. Add before closing `</body>` tag:
   ```html
   <script src="cookie-consent.js"></script>
   ```
3. Still need GTM template for consent mode (but don't set Script URL)

## Cookie Format

Cookie name: `_cnsnt`

```json
{
  "analytics_storage": true,
  "ad_storage": false,
  "timestamp": "2026-01-10T20:36:03.071Z"
}
```

## Features

✅ Small banner at bottom (Deny/Allow/Show details)
✅ Full details dialog with category toggles
✅ Matches 9fwr.com design
✅ **Direct Google Consent Mode updates** via gtag (instant, no page reload needed)
✅ GTM integration (`cookie_consent_update` event for tracking)
✅ Auto-detects footer "Cookie Settings" link (`#cookie-settings`)
✅ Responsive design
✅ No dependencies

## Categories

- **Statistics** → `analytics_storage`
- **Marketing** → `ad_storage`

## API

```javascript
// Show settings
CookieConsent.showCookieSettings();

// Get current consent
const consent = CookieConsent.getCookie();

// Programmatically set consent
CookieConsent.allowAll();
CookieConsent.denyAll();
```

## GTM Integration

### Setup (Simple 3-Step Process)

1. **Upload Script to Website**
   - Upload `cookie-consent.js` to your web server
   - Place at `/cookie-consent.js` (or any path)

2. **Import Template to GTM**
   - Open Google Tag Manager
   - Go to Templates → New
   - Click the three dots (⋮) → Import
   - Upload `gtm-consent-mode-template.tpl`
   - Save the template

3. **Create Tag**
   - Go to Tags → New
   - Choose the "Cookie Banner + Consent Mode" template
   - Set "Cookie Banner Script URL" to `/cookie-consent.js`
   - Set trigger: **Consent Initialization - All Pages**
   - Save and Publish

That's it! The template will:
- ✅ Set default consent states
- ✅ Load the cookie banner script
- ✅ Update consent based on user choice

### How It Works

1. **Page loads** → GTM loads → Consent template fires
2. **Default consent** set to "denied" for all except functionality_storage
3. **Cookie exists?**
   - Yes → Read `_cnsnt` cookie and update consent states
   - No → Wait for user to interact with banner
4. **User makes choice** → Cookie banner calls `gtag('consent', 'update', ...)` **immediately**
   - Cookie set with user preferences
   - GTM consent state updated instantly (no page reload needed)
   - `cookie_consent_update` event pushed to dataLayer for tracking
5. **Tags fire** based on updated consent states

### Verify It Works

Open browser console and check:

```javascript
// Check consent state
google_tag_manager['GTM-5MV8H23T'].dataLayer.get('consent')

// Should show:
// {
//   ad_storage: "denied" or "granted",
//   analytics_storage: "denied" or "granted",
//   ...
// }
```

## Test Coverage (12/12 ✅)

1. Banner appears on first visit
2. Allow button - all consent granted
3. Deny button - all consent denied
4. Show details opens dialog
5. Individual selection - analytics only
6. Individual selection - marketing only
7. Individual selection - both categories
8. Individual selection - none selected
9. Banner hidden on second visit
10. Cookie Settings link reopens banner
11. Close details with X button
12. Allow all from details dialog
