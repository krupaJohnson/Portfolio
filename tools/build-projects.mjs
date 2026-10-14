// Builds site/projects/<slug>.html from showcase/<slug>/ kits (see showcase/README.md).
// Usage: npm run build:projects            (all kits)
//        npm run build:projects -- zonny001 (one kit)
// Header, footer and the resume dialog are copied from site/index.html, so pages always match the homepage.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const KITS = path.join(ROOT, 'showcase');
const ORIGIN = 'https://johnson.kolli.in';

// Order of the prev/next links (and of projects on the site)
const ORDER = ['zonny001', 'zonnyhelper', 'geospatial-foundry', 'complaint-agent', 'genai-data-viz',
  'finance-tracker', 'devops-insightbot', 'line-following-robot'];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icon = (name, cls = 'ui-icon') => `<svg class="${cls}" aria-hidden="true"><use href="/assets/icons.svg#i-${name}"/></svg>`;

// ---------- shared chrome from the homepage ----------
const index = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const grab = (re, what) => { const m = index.match(re); if (!m) throw new Error('index.html: missing ' + what); return m[0]; };
const toHome = html => html.replace(/href="#(?!")/g, 'href="/#');
const NAV = toHome(grab(/<header class="nav"[\s\S]*?<\/header>/, 'nav'));
const FOOTER = toHome(grab(/<footer class="footer">[\s\S]*?<\/footer>/, 'footer'));
const RESUME = grab(/  <!-- Resume preview[\s\S]*?<\/dialog>/, 'resume dialog');
const DIAGRAMS = { zonny001: grab(/<svg class="diagram"[\s\S]*?<\/svg>/, 'zonny diagram') };

// ---------- kit parsing ----------
function parseKit(slug) {
  const dir = path.join(KITS, slug);
  const raw = fs.readFileSync(path.join(dir, 'project.md'), 'utf8').replace(/\r\n/g, '\n');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) throw new Error(`${slug}: project.md has no front matter`);
  const meta = {};
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/); if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('[')) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    meta[m[1]] = v;
  }
  const sections = {}; let cur = null;
  for (const line of raw.slice(fm[0].length).split('\n')) {
    const h = line.match(/^## (.+)$/);
    if (h) { cur = h[1].trim(); sections[cur] = ''; } else if (cur) sections[cur] += line + '\n';
  }
  const captions = name => Object.fromEntries((sections[name] || '').split('\n')
    .map(l => l.match(/^- (\S+)\s+[—-]\s+(.+)$/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
  const shotCaps = captions('Screenshots'), termCaps = captions('Terminal captures'), diagCaps = captions('Diagrams');
  // Listed files first, in the order project.md lists them; anything unlisted after, by name
  const byList = (files, caps) => { const order = Object.keys(caps); const rank = f => (order.indexOf(f) + 1) || 999; return files.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)); };
  const list = (sub, ext) => { const d = path.join(dir, sub); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith(ext)).sort() : []; };
  return {
    slug, dir, meta, sections,
    shots: byList(list('screenshots', '.png'), shotCaps).map(f => ({ file: f, caption: shotCaps[f] || '' })),
    diagrams: byList(list('diagrams', '.svg'), diagCaps).map(f => ({ file: f, caption: diagCaps[f] || '' })),
    terms: byList(list('terminal', '.txt'), termCaps).map(f => ({ file: f, caption: termCaps[f] || '', text: fs.readFileSync(path.join(dir, 'terminal', f), 'utf8').replace(/\r\n/g, '\n').trimEnd() })),
  };
}

// ---------- images: PNG -> WebP at two widths ----------
async function buildImages(kit) {
  const out = path.join(SITE, 'assets', 'projects', kit.slug);
  fs.mkdirSync(out, { recursive: true });
  for (const s of kit.shots) {
    const base = s.file.replace(/\.png$/, '');
    const src = path.join(kit.dir, 'screenshots', s.file);
    const meta = await sharp(src).metadata();
    s.w = meta.width; s.h = meta.height; s.base = `/assets/projects/${kit.slug}/${base}`;
    for (const w of [800, 1600]) {
      const dst = path.join(out, `${base}-${w}.webp`);
      if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs)
        await sharp(src).resize({ width: Math.min(w, meta.width) }).webp({ quality: 78 }).toFile(dst);
    }
  }
  // Diagrams are served as SVG (small once compressed, sharp at any zoom). They're shown via <img>, so any
  // script inside could never run, but refuse anything scripted or externally linked anyway.
  for (const d of kit.diagrams) {
    const svg = fs.readFileSync(path.join(kit.dir, 'diagrams', d.file), 'utf8');
    if (/<script|\son[a-z]+\s*=|<foreignObject|href\s*=\s*["']https?:/i.test(svg)) throw new Error(`${kit.slug}/${d.file}: SVG contains scripts or external links`);
    const vb = svg.match(/viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/);
    d.w = vb ? Math.round(+vb[1]) : 800; d.h = vb ? Math.round(+vb[2]) : 600;
    d.src = `/assets/projects/${kit.slug}/${d.file}`;
    fs.copyFileSync(path.join(kit.dir, 'diagrams', d.file), path.join(out, d.file));
  }
}

// ---------- page ----------
function page(kit, prev, next) {
  const m = kit.meta, S = kit.sections;
  const md = name => S[name] ? marked.parse(S[name]) : '';
  const section = (title, html, cls = '') => html ? `
        <section class="cs-section ${cls}">
          <h2>${esc(title)}</h2>
          ${html}
        </section>` : '';
  const stack = (m.stack || []).map(t => `<li>${esc(t)}</li>`).join('');
  const links = [
    m.repo && `<a class="btn btn--sm btn--outline" href="${esc(m.repo)}" target="_blank" rel="noopener">${icon('github')}GitHub</a>`,
    m.pypi && `<a class="btn btn--sm btn--outline" href="${esc(m.pypi)}" target="_blank" rel="noopener">PyPI${icon('external-link')}</a>`,
    m.live && `<a class="btn btn--sm btn--primary" href="${esc(m.live)}" target="_blank" rel="noopener">Live demo${icon('external-link')}</a>`,
    m.install && `<button class="copy-pill mono" type="button" data-copy="${esc(m.install)}" aria-label="Copy install command"><span>${esc(m.install)}</span>${icon('copy')}</button>`,
  ].filter(Boolean).join('\n            ');

  const shots = kit.shots;
  const gallery = shots.length ? `
      <section class="cs-gallery" aria-label="Screenshots">
        <div class="cs-shots">
          ${shots.map((s, i) => `<figure class="cs-shot${i === 0 ? ' cs-shot--lead' : ''}">
            <button class="cs-shot__btn" type="button" data-shot="${i}" aria-label="Enlarge: ${esc(s.caption || s.file)}">
              <img src="${s.base}-800.webp" srcset="${s.base}-800.webp 800w, ${s.base}-1600.webp 1600w"
                sizes="${i === 0 ? '(max-width: 1100px) 100vw, 1052px' : '(max-width: 640px) 100vw, 520px'}"
                width="${s.w}" height="${s.h}" alt="${esc(s.caption || s.file)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">
            </button>
            ${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''}
          </figure>`).join('\n          ')}
        </div>
      </section>` : '';

  const kitDiagrams = kit.diagrams.length ? `
        <section class="cs-section">
          <h2>Architecture</h2>
          <div class="cs-diagrams">
            ${kit.diagrams.map(d => `<figure class="cs-diagram-fig">
              <a href="${d.src}" target="_blank" rel="noopener" aria-label="Open full-size diagram: ${esc(d.caption || d.file)}">
                <img src="${d.src}" width="${d.w}" height="${d.h}" alt="${esc(d.caption || d.file)}" loading="lazy" decoding="async">
              </a>
              ${d.caption ? `<figcaption>${esc(d.caption)} <span class="mono">Open full size ↗</span></figcaption>` : ''}
            </figure>`).join('\n            ')}
          </div>
        </section>` : '';

  const diagram = DIAGRAMS[m.diagram] ? `
        <section class="cs-section">
          <h2>Architecture</h2>
          <div class="cs-diagram">${DIAGRAMS[m.diagram]}</div>
        </section>` : '';

  const terms = kit.terms.length ? section('From the terminal', kit.terms.map(t => `
          <figure class="cs-term">
            <div class="term">
              <div class="term__bar"><span class="dot r"></span><span class="dot a"></span><span class="dot g"></span><span class="term__title">${esc(t.file.replace(/^\d+-|\.txt$/g, ''))}</span></div>
              <pre class="term__body">${esc(t.text).replace(/^(\$ .*)$/gm, '<span class="p">$1</span>')}</pre>
            </div>
            ${t.caption ? `<figcaption>${esc(t.caption)}</figcaption>` : ''}
          </figure>`).join('')) : '';

  const pn = (p, dir) => p ? `<a class="cs-pn cs-pn--${dir}" href="/projects/${p.slug}"><span class="mono muted small">${dir === 'prev' ? '← Previous' : 'Next →'}</span><strong>${esc(p.meta.title)}</strong></a>` : '<span></span>';
  const url = `${ORIGIN}/projects/${kit.slug}`;
  const glance = [['Years', m.years], ['Role', m.role], ['Status', m.status]].filter(r => r[1])
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(m.title)} · Kolli Krupa Johnson</title>
  <meta name="description" content="${esc(m.tagline)}">
  <meta name="theme-color" content="#F6F7F9">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(m.title)} · Kolli Krupa Johnson">
  <meta property="og:description" content="${esc(m.tagline)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ORIGIN}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/sora.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/plex-400.woff2" as="font" type="font/woff2" crossorigin>
  <script>
    (function () {
      var d = document.documentElement, t = null;
      d.classList.add('js');
      try { t = localStorage.getItem('theme'); } catch (e) {}
      d.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    })();
  </script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="cs-page">
  <a class="skip" href="#main">Skip to content</a>
  <div class="progress" aria-hidden="true"></div>

  <!-- Generated by tools/build-projects.mjs from showcase/${kit.slug}/. Edit the kit, not this file. -->
  ${NAV}

  <main id="main">
    <div class="wrap">
      <a class="cs-back" href="/#projects">← All projects</a>

      <header class="cs-hero">
        <p class="eyebrow">// projects / ${esc(kit.slug)}</p>
        <h1 class="cs-title">${esc(m.title)}</h1>
        <p class="cs-tagline">${esc(m.tagline)}</p>
        <div class="cs-links">
            ${links}
        </div>
      </header>
      ${gallery}

      <div class="cs-layout">
        <article class="cs-body">${section('Overview', md('Overview'))}${diagram}${section('How it works', md('How it works'))}${kitDiagrams}${section('Features', md('Features'))}${section('Results', md('Results'))}${section('Challenges and decisions', md('Challenges and decisions'))}${terms}${section('Run it', md('Run it'))}${section('About these captures', md('Note on these captures'), 'cs-note')}
        </article>

        <aside class="cs-aside" aria-label="At a glance">
          <div class="card cs-glance">
            <h2>At a glance</h2>
            <dl>${glance}</dl>
            <h3>Stack</h3>
            <ul class="chips">${stack}</ul>
          </div>
        </aside>
      </div>

      <nav class="cs-pager" aria-label="More projects">
        ${pn(prev, 'prev')}
        ${pn(next, 'next')}
      </nav>
    </div>
  </main>

  ${FOOTER}

  <dialog class="lightbox" id="lightbox" aria-label="Screenshot viewer">
    <button class="icon-btn lightbox__close" type="button" data-lb="close" aria-label="Close">${icon('x')}</button>
    <button class="icon-btn lightbox__nav lightbox__nav--prev" type="button" data-lb="prev" aria-label="Previous screenshot">‹</button>
    <figure class="lightbox__fig"><img alt=""><figcaption></figcaption></figure>
    <button class="icon-btn lightbox__nav lightbox__nav--next" type="button" data-lb="next" aria-label="Next screenshot">›</button>
  </dialog>
${RESUME}

  <script src="/main.js" defer></script>
  <script src="/projects.js" defer></script>
</body>
</html>
`;
}

// ---------- main ----------
const wanted = process.argv.slice(2);
const slugs = fs.readdirSync(KITS).filter(d => fs.existsSync(path.join(KITS, d, 'project.md')))
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
const kits = slugs.map(parseKit);
fs.mkdirSync(path.join(SITE, 'projects'), { recursive: true });
for (const [i, kit] of kits.entries()) {
  if (wanted.length && !wanted.includes(kit.slug)) continue;
  await buildImages(kit);
  const html = page(kit, kits[i - 1], kits[i + 1]);
  fs.writeFileSync(path.join(SITE, 'projects', kit.slug + '.html'), html);
  console.log(`built projects/${kit.slug}.html  (${kit.shots.length} screenshots, ${kit.terms.length} terminal captures)`);
}
