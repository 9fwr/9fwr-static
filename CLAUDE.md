# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a static export of the 9 friendly white rabbits website (9fwr.com) and its German translation (de.9fwr.com). The site was originally hosted on Webflow with Weglot translation, and has been converted to static HTML/CSS/JS for self-hosting.

## Repository Structure

```
/
├── 9fwr.com/                           # Main English site (self-contained)
│   ├── index.html                      # Homepage
│   ├── *.html                          # 13 page HTML files
│   ├── cdn/ → ../cdn.prod.website-files.com  # Symlink to shared CDN assets
│   └── weglot/                         # Weglot translation library
│       └── weglot.min.js               # Language switcher (196KB)
├── de.9fwr.com/                        # German translation (self-contained)
│   ├── index.html                      # German homepage
│   ├── *.html                          # 13 German page HTML files
│   ├── cdn/ → ../cdn.prod.website-files.com  # Symlink to shared CDN assets
│   └── weglot/                         # Weglot translation library
│       └── weglot.min.js               # Language switcher (196KB)
├── cdn.prod.website-files.com/         # Shared Webflow CDN assets
│   ├── 647f3d79e0d0c64b07b47429/      # Site-specific assets
│   │   ├── css/                        # Stylesheets (1 file)
│   │   ├── js/                         # JavaScript files (6 files)
│   │   └── *.{svg,png,jpg,jpeg}       # Images and icons (103 files)
│   └── 62434fa732124a0fb112aab4/      # Shared template assets
├── CLAUDE.md                           # Technical documentation (this file)
└── DSGVO_Kategorien.html               # Existing DSGVO file (preserved, unmodified)
```

## Key Information

### Site Pages
- **English site (9fwr.com):** 13 pages
  - index, blog-template, data-boost, data-contracts-solve-your-data-issues, data-thinking-program, dsgvo-kategorien, google-analytics-consulting, imprint, privacy-policy, shopify-tracking-cookie-banner-google-tag-manager-dsgvo, the-one-thing-to-understand-business-intelligence, what-is-data-thinking, 13-types-of-metrics-you-should-know
- **German site (de.9fwr.com):** 13 pages (same structure, fully translated)

### Technology Stack
- Static HTML5 pages with semantic markup
- Webflow-generated CSS (minified)
- Webflow JavaScript framework for interactions
- Weglot JavaScript for multilingual support (localized in each site)
- Google Tag Manager for analytics
- Responsive design with mobile-first approach

### Self-Contained Site Directories

Each site directory (`9fwr.com/` and `de.9fwr.com/`) is **completely self-contained** and can be deployed independently:

- All HTML files reference assets using relative paths
- `cdn/` symlink provides access to shared Webflow assets
- `weglot/` directory contains the translation library
- No dependencies outside the directory (except intentional external services)

### Internalized vs External Resources

**Fully Internalized (no external dependencies):**
- ✅ All Webflow CSS, JS, and images → `cdn/` (110 files total)
- ✅ Weglot translation library → `weglot/weglot.min.js` (196KB, copied into each site)
- ✅ All page content and translations (embedded in HTML)

**Still External (intentionally kept):**
- Google Fonts (fonts.googleapis.com, fonts.gstatic.com)
- Google Tag Manager & Analytics (tracking/analytics)
- WebFont loader (ajax.googleapis.com)
- Social media links (Facebook, LinkedIn)
- External services (zcal.co for appointments, join.com for hiring)

### Asset References in HTML

All asset references have been converted to relative paths:
- CDN assets: `cdn/647f3d79e0d0c64b07b47429/...`
- Weglot: `weglot/weglot.min.js`
- Cross-language links: Absolute URLs maintained (e.g., `https://de.9fwr.com/` from English site)

### Important Notes

1. **Do not modify DSGVO_Kategorien.html** - This file was present before extraction and should be preserved
2. **Symlinks** - The `cdn/` directories are symbolic links to the shared `cdn.prod.website-files.com/`. When deploying, you may need to dereference symlinks or copy the assets
3. **Cross-domain references** - Links between English and German sites use absolute URLs (https://9fwr.com ↔ https://de.9fwr.com)
4. **Weglot configuration** - Weglot settings are embedded in `<script id="weglot-data">` JSON blocks in each HTML file

## Common Tasks

### Testing the site locally

Use Python's built-in HTTP server:
```bash
python3 -m http.server 8000
```
Then visit:
- English site: http://localhost:8000/9fwr.com/
- German site: http://localhost:8000/de.9fwr.com/

**Note:** Symlinks work fine with Python's HTTP server, so both sites will correctly load shared CDN assets.

### Checking for external dependencies

```bash
# List all unique external domains referenced
python3 << 'EOF'
import re
from pathlib import Path
from urllib.parse import urlparse

urls = set()
for html_file in list(Path('9fwr.com').glob('*.html')) + list(Path('de.9fwr.com').glob('*.html')):
    content = html_file.read_text(encoding='utf-8', errors='ignore')
    matches = re.findall(r'(?:src|href)=["\']([^"\']+)["\']', content)
    for match in matches:
        if match.startswith('http://') or match.startswith('https://'):
            parsed = urlparse(match)
            if parsed.netloc:
                urls.add(parsed.netloc)

for url in sorted(urls):
    print(url)
EOF
```

### Finding specific assets

```bash
# Find all images
find cdn.prod.website-files.com -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.svg" \)

# Find CSS files
find cdn.prod.website-files.com -type f -name "*.css"

# Find JavaScript files
find cdn.prod.website-files.com -type f -name "*.js"
```

## Deployment Recommendations

### Option 1: Cloudflare Pages (Recommended)

Deploy each site directory separately with custom domains:

**English site (9fwr.com):**
1. Create Cloudflare Pages project
2. Set build directory: `9fwr.com`
3. Connect custom domain: `9fwr.com`

**German site (de.9fwr.com):**
1. Create separate Cloudflare Pages project
2. Set build directory: `de.9fwr.com`
3. Connect custom domain: `de.9fwr.com`

**Note:** Cloudflare Pages automatically dereferences symlinks during deployment, so the `cdn/` symlink will work correctly.

### Option 2: Netlify

Same approach as Cloudflare - deploy each directory as a separate site.

### Option 3: Traditional Web Server

If deploying to a traditional web server (nginx, Apache):
1. Copy both directories to the server
2. Ensure symlinks are preserved OR copy the cdn.prod.website-files.com content into each site's `cdn/` directory
3. Configure virtual hosts for each domain pointing to the respective directory

### Deployment Checklist

- [ ] Verify symlinks work or dereference them
- [ ] Test both language sites load correctly
- [ ] Verify CDN assets load (images, CSS, JS)
- [ ] Test Weglot language switcher functionality
- [ ] Check cross-language links work
- [ ] Verify Google Analytics/Tag Manager loads
- [ ] Test forms and external integrations

## Site Maintenance

### Updating content

Since this is a static export, content updates require:
1. Edit the HTML files directly in both language directories, or
2. Update in Webflow and re-export using the extraction process below

### Re-extracting from Webflow

If you need to pull fresh content from the live Webflow site, use this process:

```bash
# 1. Extract English site with all assets
wget --recursive --level=2 --page-requisites --html-extension \
  --convert-links --restrict-file-names=windows --span-hosts \
  --domains=9fwr.com,cdn.prod.website-files.com,cdn.webflow.com \
  --no-parent https://9fwr.com/

# 2. Extract German site with all assets
wget --recursive --level=2 --page-requisites --html-extension \
  --convert-links --restrict-file-names=windows --span-hosts \
  --domains=de.9fwr.com,cdn.prod.website-files.com,cdn.webflow.com \
  --no-parent https://de.9fwr.com/

# 3. Download missing pages from sitemaps (if recursive didn't catch them)
# Check sitemaps at https://9fwr.com/sitemap.xml and https://de.9fwr.com/sitemap.xml

# 4. Merge nested CDN assets to top level
rsync -av --ignore-existing 9fwr.com/cdn.prod.website-files.com/ cdn.prod.website-files.com/
rsync -av --ignore-existing de.9fwr.com/cdn.prod.website-files.com/ cdn.prod.website-files.com/
rm -rf 9fwr.com/cdn.prod.website-files.com de.9fwr.com/cdn.prod.website-files.com

# 5. Download and internalize Weglot
wget -P cdn.weglot.com https://cdn.weglot.com/weglot.min.js
cp cdn.weglot.com/weglot.min.js 9fwr.com/weglot/weglot.min.js
cp cdn.weglot.com/weglot.min.js de.9fwr.com/weglot/weglot.min.js

# 6. Create CDN symlinks in each site directory
ln -s ../cdn.prod.website-files.com 9fwr.com/cdn
ln -s ../cdn.prod.website-files.com de.9fwr.com/cdn

# 7. Update all CDN references to use relative paths
python3 << 'EOF'
import re
from pathlib import Path

for html_file in list(Path('9fwr.com').glob('*.html')) + list(Path('de.9fwr.com').glob('*.html')):
    content = html_file.read_text(encoding='utf-8', errors='ignore')
    content = re.sub(r'https://cdn\.prod\.website-files\.com/', 'cdn/', content)
    content = content.replace('../cdn.weglot.com/', 'weglot/')
    html_file.write_text(content, encoding='utf-8')
EOF

# 8. Clean up temporary global weglot directory
rm -rf cdn.weglot.com
```

## Architecture Decisions

### Why wget instead of Webflow export?
- Webflow's built-in export doesn't include CMS-generated pages
- wget captures the fully-rendered site exactly as visitors see it
- Weglot translations are preserved in the extracted HTML
- All dynamic content is captured in static form

### Why self-contained directories with symlinks?
- Each site directory can be deployed independently
- Symlinks avoid duplicating 110 asset files (saves ~50MB)
- Easy to update shared assets in one location
- Deployment platforms (Cloudflare, Netlify) handle symlinks automatically

### Why keep cross-domain absolute URLs?
- Language switching requires navigating between domains
- SEO benefits from proper hreflang implementation
- Weglot language switcher expects absolute URLs
- Maintains original site behavior

### Why internalize Weglot but not Google Fonts?
- Weglot is critical for site functionality (language switching)
- Google Fonts is a performance optimization (can gracefully degrade)
- Google services have better global CDN distribution
- Smaller attack surface for potential supply chain issues
