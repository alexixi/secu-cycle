// Génère les icônes des signalements affichées sur la carte : panneau
// triangulaire (façon panneau de danger) coloré par type, avec un liseré blanc
// et un pictogramme blanc centré. Rendu net en 64×64 PNG transparent via
// Chromium (les emojis / pictos couleur ne se rendent pas de façon fiable en
// text-field MapLibre, d'où le passage par des images).
//
// Les PNG produits alimentent les layers `symbol` des 3 frontends :
//   - frontend-mobile/assets/reports/
//   - frontend-web/src/assets/reports/
//   - frontend-admin/src/assets/reports/
//
// Dépendances : react, react-dom, react-icons et puppeteer (présents dans
// frontend-web/node_modules) + un Chromium/Chrome système. C'est un outil
// ponctuel : seuls les PNG générés sont commités, pas les node_modules.
//
// Utilisation (depuis la racine du repo) :
//   cd frontend-web
//   NODE_PATH="$PWD/node_modules" node ../Documentation/gen-report-icons.js \
//     ../frontend-mobile/assets/reports \
//     ../frontend-web/src/assets/reports \
//     ../frontend-admin/src/assets/reports
//
// Le binaire Chrome est pris dans $CHROME_BIN, sinon /usr/bin/google-chrome.
// Pour changer une icône : éditer la table ICONS ci-dessous (pack/nom
// react-icons, couleur, `mul` = taille, `dy` = décalage vertical, `rotate` =
// inclinaison en degrés) puis relancer la commande.
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Un pictogramme (pack/nom react-icons) + une couleur de triangle par type
// (couleurs alignées sur REPORT_TYPE_META du frontend).
// `mul` agrandit le pictogramme, `dy` le décale verticalement (négatif = vers le
// haut), `rotate` le pivote (degrés) autour de son centre.
const ICONS = [
  { name: 'accident', color: '#ef4444', pack: 'fa6', glyph: 'FaCarBurst', mul: 1 },
  { name: 'travaux', color: '#f97316', pack: 'fa6', glyph: 'FaPersonDigging', mul: 1.3, dy: -2 },
  { name: 'danger', color: '#f59e0b', pack: 'md', glyph: 'MdPriorityHigh', mul: 1.35, dy: -4 },
  { name: 'obstacle', color: '#a16207', pack: 'gi', glyph: 'GiDeadWood', mul: 1.2, rotate: 40 },
];

const SIZE = 64;
// Boîte cible du pictogramme, centrée sur le "centre optique" du triangle
// (un peu sous le centroïde géométrique).
const TARGET_W = 30;
const TARGET_H = 24;
const CX = 32;
const CY = 41;

// Triangle pointe en haut, coins arrondis via un stroke épais de même couleur.
const TRIANGLE = '32,11 54,52 10,52';
const CORNER = 7;   // épaisseur du stroke qui arrondit les coins du triangle
const BORDER = 3;   // largeur du liseré blanc autour du triangle

// Rend une icône react-icons et renvoie { inner, vb:[minx,miny,w,h] } en blanc.
function glyph(pack, name) {
  const m = require('react-icons/' + pack);
  const Comp = m[name];
  if (!Comp) throw new Error(`Icône introuvable: ${pack}/${name}`);
  const svg = renderToStaticMarkup(React.createElement(Comp));
  const vb = (svg.match(/viewBox="([^"]+)"/)[1]).split(/\s+/).map(Number);
  const inner = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/currentColor/g, '#ffffff');
  return { inner, vb };
}

function buildSvg({ color, pack, glyph: g, mul = 1, dy = 0, rotate = 0 }) {
  const { inner, vb } = glyph(pack, g);
  const [minx, miny, w, h] = vb;
  const scale = Math.min((TARGET_W * mul) / w, (TARGET_H * mul) / h);
  const cy = CY + dy;
  const tx = CX - scale * (minx + w / 2);
  const ty = cy - scale * (miny + h / 2);
  // rotate(...) est appliqué avant translate/scale : le pictogramme est d'abord
  // placé/centré, puis pivoté autour de son centre (CX, cy).
  const rot = rotate ? `rotate(${rotate} ${CX} ${cy}) ` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <polygon points="${TRIANGLE}" fill="#ffffff" stroke="#ffffff" stroke-width="${CORNER + 2 * BORDER}" stroke-linejoin="round"/>
    <polygon points="${TRIANGLE}" fill="${color}" stroke="${color}" stroke-width="${CORNER}" stroke-linejoin="round"/>
    <g transform="${rot}translate(${tx},${ty}) scale(${scale})" fill="#ffffff">${inner}</g>
  </svg>`;
}

const OUT_DIRS = process.argv.slice(2);
if (OUT_DIRS.length === 0) {
  console.error('Usage: node gen-report-icons.js <outDir> [<outDir> ...]');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

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
    console.log(`✓ ${icon.name}.png (${icon.pack}/${icon.glyph}, ${icon.color})`);
  }

  await browser.close();
  console.log('Terminé.');
})();
