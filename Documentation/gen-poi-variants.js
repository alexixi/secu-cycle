// Génère les variantes d'état des icônes POI à partir de leur PNG couleur de base
// (transparence et glyphe blanc conservés) :
//   - "-off"       : disque recoloré en gris #9CA3AF (POI privé / indisponible /
//                    désaffecté / fermé) — signal « désactivé » franc.
//   - "-customers" : icône de couleur NORMALE + petit badge ambre « personne » en
//                    haut à droite (POI à accès « clients », utilisable sous
//                    condition). On garde la couleur du type pour rester lisible.
//   - "-paid"      : idem avec un badge ambre « € » (POI payant, fee=yes). Généré
//                    seulement hors toilettes (elles encodent déjà le tarif via
//                    leur sous-type gratuit/payant).
//
// Les icônes de base viennent des PNG existants (eau, toilettes, réparation) et du
// générateur des parkings (Documentation/gen-poi-parking-icons.js). Ce script ne
// fait QUE dériver les variantes à partir de ces bases (disque plein + anneau blanc).
//
// Dépend d'ImageMagick v7 (magick), de react-icons/react-dom (badge) et de
// puppeteer + un Chrome système (rendu du badge). Lancer depuis frontend-web pour
// résoudre les modules :
//   cd frontend-web
//   NODE_PATH="$PWD/node_modules" node ../Documentation/gen-poi-variants.js \
//     ../frontend-mobile/assets/poi ../frontend-web/src/assets/poi
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const OFF_COLOR = '#9CA3AF';
const BADGE_COLOR = '#F59E0B';
const BASES = [
  'water',
  'toilets-free', 'toilets-paid', 'toilets-unknown',
  'parking-stands', 'parking-racks', 'parking-shelter', 'parking-other',
  'parking-stands-covered', 'parking-racks-covered', 'parking-other-covered',
  'repair-selfservice', 'repair-shop',
];

const OUT_DIRS = process.argv.slice(2);
if (OUT_DIRS.length === 0) {
  console.error('Usage: node gen-poi-variants.js <poiDir> [<poiDir> ...]');
  process.exit(1);
}

const q = (p) => `'${p.replace(/'/g, "'\\''")}'`;
const run = (cmd) => execSync(cmd, { stdio: ['ignore', 'ignore', 'inherit'] });

// Badge en pastille ambre cerclée de blanc, en haut à droite (cx=48, cy=16), à
// moitié sur le disque. `symbol` = un pictogramme react-icons blanc.
function badgeFromIcon(pack, name) {
  const svg = renderToStaticMarkup(React.createElement(require('react-icons/' + pack)[name]));
  const [mx, my, w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/currentColor/g, '#ffffff');
  const s = 13 / Math.max(w, h);
  return `<g transform="translate(${48 - s * (mx + w / 2)},${16 - s * (my + h / 2)}) scale(${s})" fill="#ffffff">${inner}</g>`;
}
function badgeFromText(text) {
  return `<text x="48" y="21" font-family="Arial, sans-serif" font-size="15" font-weight="700" text-anchor="middle" fill="#ffffff">${text}</text>`;
}
function badgeSvg(symbolMarkup) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <circle cx="48" cy="16" r="12" fill="#ffffff"/>
    <circle cx="48" cy="16" r="10" fill="${BADGE_COLOR}"/>
    ${symbolMarkup}
  </svg>`;
}

// Le badge « € » (variante -paid) concerne les POI payants hors toilettes, PLUS
// les toilettes payantes (toilets-paid). Les toilettes gratuites / non précisées
// n'en ont pas.
const wantsPaid = (base) => !base.startsWith('toilets-') || base === 'toilets-paid';

// Recolore le disque (garde le glyphe blanc) : min(R,G,B) isole le blanc du glyphe.
function discRecolor(src, color, out, tmp) {
  const t = (f) => path.join(tmp, f);
  run(`magick ${q(src)} -alpha extract ${q(t('a.png'))}`);
  run(`magick ${q(src)} -alpha off -channel RGB -separate -evaluate-sequence min ${q(t('m.png'))}`);
  run(`magick ${q(t('m.png'))} -threshold 65% ${q(t('g.png'))}`);
  run(`magick ${q(t('a.png'))} ${q(t('g.png'))} -compose multiply -composite ${q(t('ga.png'))}`);
  run(`magick ${q(t('a.png'))} \\( ${q(t('g.png'))} -negate \\) -compose multiply -composite ${q(t('da.png'))}`);
  run(`magick -size 64x64 xc:${color} ${q(t('da.png'))} -alpha off -compose CopyOpacity -composite ${q(t('disc.png'))}`);
  run(`magick -size 64x64 xc:white ${q(t('ga.png'))} -alpha off -compose CopyOpacity -composite ${q(t('glyph.png'))}`);
  run(`magick ${q(t('disc.png'))} ${q(t('glyph.png'))} -compose over -composite ${q(out)}`);
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'poivar-'));

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 64, height: 64 });
  const renderOverlay = async (svg, file) => {
    await page.setContent(`<!doctype html><html><head><style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`, { waitUntil: 'load' });
    fs.writeFileSync(file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 64, height: 64 } }));
  };
  const customersBadge = path.join(tmp, 'badge-customers.png');
  const paidBadge = path.join(tmp, 'badge-paid.png');
  await renderOverlay(badgeSvg(badgeFromIcon('fa6', 'FaUser')), customersBadge);   // clients → personne
  await renderOverlay(badgeSvg(badgeFromText('€')), paidBadge);                    // payant → €
  await browser.close();

  for (const dir of OUT_DIRS) {
    for (const base of BASES) {
      const src = path.join(dir, `${base}.png`);
      if (!fs.existsSync(src)) { console.error('manquant:', src); continue; }
      discRecolor(src, OFF_COLOR, path.join(dir, `${base}-off.png`), tmp);
      run(`magick ${q(src)} ${q(customersBadge)} -compose over -composite ${q(path.join(dir, `${base}-customers.png`))}`);
      const variants = ['-off', '-customers'];
      if (wantsPaid(base)) {
        run(`magick ${q(src)} ${q(paidBadge)} -compose over -composite ${q(path.join(dir, `${base}-paid.png`))}`);
        variants.push('-paid');
      }
      console.log(`✓ ${dir}/${base} {${variants.join(',')}}`);
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('Terminé.');
})();
