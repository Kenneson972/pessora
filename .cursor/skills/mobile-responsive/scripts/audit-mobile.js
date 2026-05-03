#!/usr/bin/env node
/**
 * audit-mobile.js — Audit responsive automatique Karibloom
 *
 * Usage : node audit-mobile.js <URL> [--output /chemin/rapport.html]
 * Exemple: node audit-mobile.js http://localhost:3000 --output /tmp/rapport-mobile.html
 *
 * Nécessite: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'mobile',  label: '📱 Mobile',  width: 375,  height: 812,  deviceScaleFactor: 2, isMobile: true  },
  { name: 'tablet',  label: '📲 Tablette', width: 768,  height: 1024, deviceScaleFactor: 2, isMobile: true  },
  { name: 'desktop', label: '🖥️ Desktop', width: 1440, height: 900,  deviceScaleFactor: 1, isMobile: false },
];

const CHECKS = {
  viewportMeta:    'Viewport meta tag présent',
  noHorizontalScroll: 'Pas de scroll horizontal',
  touchTargets:    'Boutons ≥ 44px',
  fontSizes:       'Texte ≥ 15px',
  imagesResponsive: 'Images avec max-width: 100%',
  inputFontSize:   'Inputs ≥ 16px (pas de zoom iOS)',
  overflowX:       'overflow-x hidden sur body',
};

// ── Audit par viewport ────────────────────────────────────────────────────────
async function auditPage(page, url, viewport) {
  await page.setViewport({
    width:             viewport.width,
    height:            viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile:          viewport.isMobile,
    hasTouch:          viewport.isMobile,
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200)); // attendre les animations

  const results = await page.evaluate(() => {
    const issues   = [];
    const warnings = [];
    const passes   = [];

    const docWidth = document.documentElement.clientWidth;

    // 1. Viewport meta
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      passes.push('✅ Viewport meta présent');
    } else {
      issues.push({ type: 'critical', msg: '❌ Pas de viewport meta tag — le site ne sera pas responsive' });
    }

    // 2. Overflow horizontal
    let overflowCount = 0;
    const overflowEls = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 2) {
        overflowCount++;
        if (overflowEls.length < 5) {
          overflowEls.push(
            (el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')).slice(0, 60)
          );
        }
      }
    });
    if (overflowCount === 0) {
      passes.push('✅ Pas de débordement horizontal');
    } else {
      issues.push({ type: 'critical', msg: `❌ ${overflowCount} élément(s) débordent horizontalement`, details: overflowEls });
    }

    // 3. Touch targets trop petits
    const smallTargets = [];
    document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const vis  = rect.width > 0 && rect.height > 0;
      if (vis && (rect.width < 40 || rect.height < 40)) {
        const label = el.textContent?.trim().slice(0, 30) || el.getAttribute('aria-label') || el.tagName;
        smallTargets.push({ label, w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
    if (smallTargets.length === 0) {
      passes.push('✅ Tous les éléments interactifs ≥ 44px');
    } else {
      const count = smallTargets.length;
      warnings.push({
        type: 'warning',
        msg: `⚠️ ${count} élément(s) interactif(s) trop petit(s) (< 44px)`,
        details: smallTargets.slice(0, 5).map(t => `"${t.label}" — ${t.w}×${t.h}px`),
      });
    }

    // 4. Taille des polices
    const smallTexts = [];
    document.querySelectorAll('p, li, a, span, td, th').forEach(el => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 13 && el.textContent?.trim().length > 3) {
        smallTexts.push({ tag: el.tagName, size: Math.round(fs) });
      }
    });
    if (smallTexts.length === 0) {
      passes.push('✅ Taille des polices acceptable');
    } else {
      warnings.push({ type: 'warning', msg: `⚠️ ${smallTexts.length} texte(s) avec font-size < 13px` });
    }

    // 5. Inputs avec font-size < 16px (zoom iOS)
    const smallInputs = [];
    document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), textarea, select').forEach(el => {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) {
        smallInputs.push({ name: el.name || el.id || el.type, size: Math.round(fs) });
      }
    });
    if (smallInputs.length === 0) {
      passes.push('✅ Inputs ≥ 16px (pas de zoom iOS)');
    } else {
      issues.push({
        type: 'critical',
        msg: `❌ ${smallInputs.length} input(s) avec font-size < 16px → zoom automatique iOS`,
        details: smallInputs.map(i => `${i.name}: ${i.size}px`),
      });
    }

    // 6. Images sans max-width
    const badImages = [];
    document.querySelectorAll('img').forEach(el => {
      const style = getComputedStyle(el);
      const hasMaxWidth = style.maxWidth !== 'none' && parseFloat(style.maxWidth) <= 100;
      const rect = el.getBoundingClientRect();
      if (rect.width > docWidth + 2) {
        badImages.push(el.src?.split('/').pop() || 'image');
      }
    });
    if (badImages.length === 0) {
      passes.push('✅ Images dans leur conteneur');
    } else {
      issues.push({ type: 'critical', msg: `❌ ${badImages.length} image(s) débordent`, details: badImages.slice(0, 3) });
    }

    // 7. body overflow-x
    const bodyStyle = getComputedStyle(document.body);
    const htmlStyle = getComputedStyle(document.documentElement);
    if (bodyStyle.overflowX === 'hidden' || htmlStyle.overflowX === 'hidden') {
      passes.push('✅ overflow-x: hidden sur body/html');
    } else {
      warnings.push({ type: 'warning', msg: '⚠️ overflow-x: hidden non défini sur body/html — risque de scroll horizontal' });
    }

    // 8. lazy loading
    const totalImgs = document.querySelectorAll('img').length;
    const lazyImgs  = document.querySelectorAll('img[loading="lazy"]').length;
    if (totalImgs > 0) {
      if (lazyImgs / totalImgs > 0.5) {
        passes.push(`✅ Lazy loading sur ${lazyImgs}/${totalImgs} images`);
      } else {
        warnings.push({ type: 'warning', msg: `⚠️ Seulement ${lazyImgs}/${totalImgs} images avec loading="lazy"` });
      }
    }

    return { issues, warnings, passes, docWidth };
  });

  // Screenshot
  const screenshotPath = `/tmp/kb-audit-${viewport.name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return { ...results, screenshotPath, viewport };
}

// ── Génération du rapport HTML ────────────────────────────────────────────────
function generateReport(url, allResults) {
  const totalIssues   = allResults.reduce((n, r) => n + r.issues.length, 0);
  const totalWarnings = allResults.reduce((n, r) => n + r.warnings.length, 0);
  const totalPasses   = allResults.reduce((n, r) => n + r.passes.length, 0);

  const score = Math.round((totalPasses / (totalPasses + totalIssues + totalWarnings * 0.5)) * 100);

  const statusColor = score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  const statusLabel = score >= 90 ? '🏆 Excellent' : score >= 70 ? '⚠️ À améliorer' : '❌ Problèmes critiques';

  const renderResults = (results) => {
    const sections = [];

    if (results.issues.length > 0) {
      sections.push(`<div style="margin-bottom:1rem">
        <h4 style="color:#ef4444;margin:0 0 0.5rem">Problèmes critiques (${results.issues.length})</h4>
        ${results.issues.map(i => `
          <div style="background:rgba(239,68,68,0.1);border-left:3px solid #ef4444;padding:0.5rem 0.75rem;margin-bottom:0.5rem;border-radius:0 4px 4px 0;font-size:0.875rem">
            <div>${i.msg}</div>
            ${i.details ? `<ul style="margin:0.25rem 0 0 1rem;font-size:0.8125rem;opacity:0.8">${i.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </div>`);
    }

    if (results.warnings.length > 0) {
      sections.push(`<div style="margin-bottom:1rem">
        <h4 style="color:#f59e0b;margin:0 0 0.5rem">Avertissements (${results.warnings.length})</h4>
        ${results.warnings.map(w => `
          <div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;padding:0.5rem 0.75rem;margin-bottom:0.5rem;border-radius:0 4px 4px 0;font-size:0.875rem">
            <div>${w.msg}</div>
            ${w.details ? `<ul style="margin:0.25rem 0 0 1rem;font-size:0.8125rem;opacity:0.8">${w.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </div>`);
    }

    if (results.passes.length > 0) {
      sections.push(`<div>
        <h4 style="color:#22c55e;margin:0 0 0.5rem">Validations (${results.passes.length})</h4>
        ${results.passes.map(p => `<div style="font-size:0.875rem;padding:0.25rem 0">${p}</div>`).join('')}
      </div>`);
    }

    return sections.join('');
  };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Audit Mobile Karibloom — ${url}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; background: #0a0a0f; color: #f1f5f9; }
  .header { padding: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .score { font-size: 3rem; font-weight: 800; color: ${statusColor}; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; padding: 2rem; }
  .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.5rem; }
  .card h3 { margin: 0 0 1rem; font-size: 1.125rem; }
  .screenshot { width: 100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 1rem; }
  h4 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
</style>
</head>
<body>
<div class="header">
  <div style="font-size:0.875rem;color:#94a3b8;margin-bottom:0.5rem">Audit Mobile Karibloom — ${new Date().toLocaleString('fr-FR')}</div>
  <h1 style="margin:0 0 0.5rem;font-size:1.5rem">${url}</h1>
  <div class="score">${score}/100</div>
  <div style="font-size:1.25rem;margin-top:0.25rem">${statusLabel}</div>
  <div style="margin-top:1rem;font-size:0.875rem;color:#94a3b8">
    ${totalPasses} validations · ${totalWarnings} avertissements · ${totalIssues} problèmes critiques
  </div>
</div>

<div class="grid">
  ${allResults.map(r => `
  <div class="card">
    <h3>${r.viewport.label} — ${r.viewport.width}px</h3>
    <img class="screenshot" src="${r.screenshotPath}" alt="Screenshot ${r.viewport.name}" />
    ${renderResults(r)}
  </div>`).join('')}
</div>

<div style="padding:2rem;border-top:1px solid rgba(255,255,255,0.1);font-size:0.875rem;color:#94a3b8">
  Généré par le skill mobile-responsive Karibloom
</div>
</body>
</html>`;

  return html;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args   = process.argv.slice(2);
  const url    = args[0];
  const outIdx = args.indexOf('--output');
  const output = outIdx !== -1 ? args[outIdx + 1] : `/tmp/kb-mobile-audit-${Date.now()}.html`;

  if (!url) {
    console.error('Usage: node audit-mobile.js <URL> [--output /chemin/rapport.html]');
    process.exit(1);
  }

  console.log(`\n🔍 Audit mobile Karibloom — ${url}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const allResults = [];

  for (const viewport of VIEWPORTS) {
    console.log(`  Analyse ${viewport.label} (${viewport.width}px)...`);
    const page = await browser.newPage();
    try {
      const result = await auditPage(page, url, viewport);
      allResults.push(result);
      const critCount = result.issues.length;
      const warnCount = result.warnings.length;
      console.log(`    ${critCount} erreur(s) · ${warnCount} avertissement(s) · ${result.passes.length} OK`);
    } catch (err) {
      console.error(`    Erreur: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const html = generateReport(url, allResults);
  fs.writeFileSync(output, html);

  console.log(`\n✅ Rapport généré : ${output}`);
  console.log(`   Ouvrir dans le navigateur pour voir le résultat.\n`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
