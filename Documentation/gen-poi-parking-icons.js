// Génère les icônes POI des parkings vélo : pastille ronde (couleur du sous-type)
// + pictogramme blanc de la FORME D'ACCROCHE (plus parlant qu'un vélo générique).
// Même style que les autres POI (eau/toilettes/réparation) : anneau blanc autour
// d'un disque coloré + gros glyphe blanc. 64×64 PNG transparent, rendu via Chromium.
// (Rayons calés au pixel sur water.png : anneau blanc r≈27, disque coloré r≈22.)
//
// Sorties (mêmes noms que les PNG existants, donc pris en compte sans changement
// de code par les layers `symbol`) :
//   - frontend-mobile/assets/poi/parking-*.png
//   - frontend-web/src/assets/poi/parking-*.png
//
// Utilisation (depuis la racine du repo) :
//   cd frontend-web
//   NODE_PATH="$PWD/node_modules" node ../Documentation/gen-poi-parking-icons.js \
//     ../frontend-mobile/assets/poi \
//     ../frontend-web/src/assets/poi
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SIZE = 64;
const R_WHITE = 27;  // anneau blanc extérieur
const R_DISC = 22;   // disque coloré intérieur

// Récupère le contenu interne d'une icône react-icons, en blanc.
function iconInner(pack, name) {
  const m = require('react-icons/' + pack);
  const svg = renderToStaticMarkup(React.createElement(m[name]));
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/currentColor/g, '#ffffff');
}

// Pictogrammes dessinés dans un repère 24×24 (blanc), gros et épais pour remplir
// le disque comme les autres POI. Formes d'accroche dessinées à la main faute de
// picto standard « arceau » / « râtelier ».
const GLYPHS = {
  // Arceau : U inversé posé sur le sol.
  arceau: () => `<g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 21 V11 a8 8 0 0 1 16 0 V21"/><path d="M2 21 H22"/></g>`,
  // Râtelier / pince-roue : peigne (barre + dents).
  ratelier: () => `<g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 20 H22"/><path d="M5 20 V9"/><path d="M10 20 V9"/><path d="M14 20 V9"/><path d="M19 20 V9"/></g>`,
  // Abri : vélo (deux roues + cadre) sous un toit.
  abri: () => `<g fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12 L12 3 L22 12"/><circle cx="8" cy="17" r="3.4"/><circle cx="16" cy="17" r="3.4"/>
    <path d="M8 17 L13 11 M16 17 L13 11 M13 11 h2.5"/></g>`,
  // Autre / non précisé : simple « ? » (type de stationnement inconnu).
  question: () => `<text x="12" y="20" font-family="Arial, sans-serif" font-size="23" font-weight="700"
    text-anchor="middle" fill="#ffffff">?</text>`,
};

// Toit ajouté au-dessus du glyphe pour les parkings `covered=yes` qui ne sont pas
// de type abri (l'abri est déjà un toit). Dessiné dans le même repère 24×24.
const ROOF = `<path d="M2 11 L12 3.5 L22 11" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;

// name -> { color, glyph, size, covered } : `size` = diamètre visé du glyphe (px).
const ICONS = [
  { name: 'parking-stands', color: '#22C55E', glyph: 'arceau', size: 34 },
  { name: 'parking-racks', color: '#0D9488', glyph: 'ratelier', size: 34 },
  { name: 'parking-shelter', color: '#15803D', glyph: 'abri', size: 34 },
  { name: 'parking-other', color: '#22C55E', glyph: 'question', size: 34 },
  // Variantes couvertes : forme d'accroche sous un toit.
  { name: 'parking-stands-covered', color: '#22C55E', glyph: 'arceau', size: 34, covered: true },
  { name: 'parking-racks-covered', color: '#0D9488', glyph: 'ratelier', size: 34, covered: true },
  { name: 'parking-other-covered', color: '#22C55E', glyph: 'question', size: 34, covered: true },
];

// Composite du glyphe : sous un toit si `covered` (glyphe de base rétréci et posé
// sous le toit, ancré par sa base ~y=20).
function glyphMarkup({ glyph, covered }) {
  const base = GLYPHS[glyph]();
  if (!covered) return base;
  return `${ROOF}<g transform="translate(12,22) scale(0.62) translate(-12,-20)">${base}</g>`;
}

function buildSvg({ color, glyph, covered, size }) {
  const scale = size / 24;               // glyphes dessinés dans un repère 24×24
  const t = (SIZE - 24 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <circle cx="32" cy="32" r="${R_WHITE}" fill="#ffffff"/>
    <circle cx="32" cy="32" r="${R_DISC}" fill="${color}"/>
    <g transform="translate(${t},${t}) scale(${scale})">${glyphMarkup({ glyph, covered })}</g>
  </svg>`;
}

const OUT_DIRS = process.argv.slice(2);
if (OUT_DIRS.length === 0) {
  console.error('Usage: node gen-poi-parking-icons.js <outDir> [<outDir> ...]');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

  // Icônes de base uniquement. Les variantes grisée "-off" et ambre "-customers"
  // sont dérivées de ces PNG par Documentation/gen-poi-variant-icons.sh.
  for (const icon of ICONS) {
    const svg = buildSvg(icon);
    await page.setContent(
      `<!doctype html><html><head><style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'load' },
    );
    const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
    for (const dir of OUT_DIRS) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${icon.name}.png`), buf);
    }
    console.log(`✓ ${icon.name}.png (${icon.glyph}, ${icon.color})`);
  }

  await browser.close();
  console.log('Terminé.');
})();
