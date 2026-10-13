# Kolli Krupa Johnson · Portfolio

A static site: plain HTML, CSS and JavaScript, with no build step and no framework.
Everything that gets deployed lives in `site/`.

```
site/
├── index.html          all page content (edit text here)
├── styles.css          colours, fonts, layout (tokens at the top)
├── main.js             theme toggle, menu, typing terminal, copy buttons, reveal
├── assets/icons.svg    one cached sprite: line icons (Lucide, ISC) + brand logos (Simple Icons, CC0)
├── assets/fonts/       self-hosted Sora, IBM Plex Sans, JetBrains Mono (latin, OFL)
├── favicon.svg / favicon-32.png / apple-touch-icon.png
├── og-image.png        1200×630 preview shown when the link is shared
├── 404.html            Cloudflare Pages serves this for unknown URLs
├── _headers            security + cache headers for Cloudflare Pages
├── robots.txt
├── resume.html         the resume (edit this one; it's what the preview shows)
└── resume.pdf          generated from resume.html (see "Updating the resume")
```

## Before you deploy

1. **Fix the repo links.** Search `index.html` for `TODO`. Four links point at your GitHub profile
   because the exact repo URLs weren't known: Zonny001, ZonnyHelper, GenAI Data Visualization Tool
   and Line Following Robot. Replace them with the real repo URLs.
2. Optional: add `Verify ↗` links to certificates (example in a comment above the list).

## Updating the resume

The Resume buttons open a preview window. Nothing resume-related loads with the page: the preview
only fetches `resume.html` on first open, and the PDF only downloads when a visitor presses
**Download PDF**. The window also has **Print** (which includes "Save as PDF") and **Open** in a new tab.

1. Edit `site/resume.html` (keep it to 2 pages).
2. Regenerate `site/resume.pdf`. Run this in PowerShell from this folder:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --user-data-dir="$PWD\.chrome-tmp" --no-pdf-header-footer --print-to-pdf="$PWD\site\resume.pdf" "$PWD\site\resume.html"; Start-Sleep 3; Remove-Item -Recurse -Force .chrome-tmp
```

Or open `resume.html` in Chrome → Print → Save as PDF, with headers and footers turned off.

## Preview locally

```bash
npx http-server site -p 8788 -c-1
```

Then open http://localhost:8788.

## Deploy to Cloudflare Pages

### Option A: Direct upload (quickest, no Git)

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (e.g. `kkj-portfolio`) → drag in the **contents of the `site` folder** → **Deploy**.
3. You get a `https://kkj-portfolio.pages.dev` URL. To update later, open the project → **Create deployment** and upload again.

Or from the terminal with Wrangler:

```bash
npx wrangler pages deploy site --project-name kkj-portfolio
```

### Option B: Connect GitHub (auto-deploys on every push)

1. Push this folder to a GitHub repo.
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Build settings: Framework preset **None**, Build command **(leave empty)**, Build output directory **`site`**.
4. **Save and Deploy**.

## Connect your domain

Your domain must be on Cloudflare first (Cloudflare dashboard → **Add a domain**, then switch the
nameservers at your registrar to the two Cloudflare gives you).

1. Open the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `yourdomain.com` → Cloudflare adds the DNS record automatically → **Activate**.
3. Repeat for `www.yourdomain.com` if you want both.
4. HTTPS certificates are issued automatically (usually a few minutes).

If the domain currently points at GitHub Pages (`Krupa1316.github.io`), delete those old `A`/`CNAME`
records in Cloudflare DNS first, or the custom-domain setup will report a conflict.

## Editing

- **Text:** all in `index.html`, section by section, in page order.
- **Colours:** the tokens at the top of `styles.css` (dark and light sets). Light is the default for every visitor; the toggle switches to dark and remembers the choice.
- **Icons:** every icon is `<svg class="ic"><use href="/assets/icons.svg#i-NAME"/></svg>` (line icons) or
  `#si-SLUG` (brand logos). Copy an existing one and change the id; the id must exist in `assets/icons.svg`.
  To add a new one, paste a `<symbol>` into that file (Lucide icons from lucide.dev, logos from simpleicons.org).
- **Logo hover colour:** set `style="--b:#HEX"` on the pill / tile / logo.

## Why it loads fast

- No third-party requests: fonts are self-hosted and the two above-the-fold fonts are preloaded
  (Cloudflare turns these into Early Hints).
- All icons come from one SVG sprite (~26 KB compressed), loaded once and cached; no icon JavaScript.
- Total first load is about 190 KB compressed (fonts ~150 KB of that). `_headers` caches fonts for a year and the sprite for a week.
