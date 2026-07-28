// Génère les marqueurs des stations de vélos en libre-service (GBFS) affichés
// sur la carte : disque bleu nuit cerclé de blanc, contenant 1 à 3 pictogrammes
// vélo — ou un vélo barré quand il n'y a plus rien à prendre. Rendu net en 64×64
// PNG transparent via Chromium (les emojis / pictos couleur ne se rendent pas de
// façon fiable en text-field MapLibre, d'où le passage par des images).
//
// Le nombre de vélos dessinés double le code couleur de la pastille de
// disponibilité, qui est dessinée par MapLibre par-dessus l'icône (layer
// `bikeshare-badge`) : l'image ne porte QUE l'état, jamais le chiffre exact, qui
// change toutes les minutes.
//
//   bikeshare-unknown  compteurs périmés   gris   1 vélo
//   bikeshare-off      hors service        gris   vélo barré
//   bikeshare-0        plus aucun vélo     bleu   vélo barré
//   bikeshare-1        1 ou 2 vélos        bleu   1 vélo
//   bikeshare-2        3 vélos ou plus     bleu   2 vélos
//   bikeshare-3        station pleine      bleu   3 vélos
//
// Les PNG produits alimentent les layers `symbol` des 2 frontends :
//   - frontend-web/src/assets/bikeshare/
//   - frontend-mobile/assets/bikeshare/
//
// Dépendances : react, react-dom, react-icons et puppeteer (présents dans
// frontend-web/node_modules) + un Chromium/Chrome système. C'est un outil
// ponctuel : seuls les PNG générés sont commités, pas les node_modules.
//
// Utilisation (depuis la racine du repo) :
//   cd frontend-web
//   NODE_PATH="$PWD/node_modules" node ../Documentation/gen-bikeshare-icons.js \
//     ../frontend-web/src/assets/bikeshare \
//     ../frontend-mobile/assets/bikeshare
//
// Le binaire Chrome est pris dans $CHROME_BIN, sinon /usr/bin/google-chrome.
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SIZE = 64;
const CX = 32;
const CY = 32;

// Liseré blanc : c'est lui qui détache le marqueur du fond de carte, aussi bien
// sur un style clair que sur un style sombre ou une vue satellite.
const RING_R = 30;
const DISC_R = 26.5;

// Bleu nuit choisi dans la famille de --primary (#8389fa / #646cff) plutôt qu'un
// bleu franc, qui jurerait avec la charte.
const NAVY = '#312E81';
const GREY = '#6B7280';

// Le pictogramme : une silhouette de vélo sans cycliste, la plus lisible une fois
// réduite. Changer de pack/glyphe ici se répercute sur les six variantes.
const GLYPH = { pack: 'fa6', name: 'FaBicycle' };

// Disposition des vélos selon leur nombre : { cx, cy } = centre visé, `w`/`h` =
// boîte cible, `o` = opacité. Les vélos sont empilés en quinconce, du fond vers
// l'avant, avec une opacité croissante : la profondeur se lit d'un coup d'œil, et
// le recouvrement laisse des pictos bien plus gros qu'une juxtaposition — 24 px
// à trois vélos contre 17 en ligne, seuil sous lequel la silhouette se perd.
// L'ordre du tableau est l'ordre de dessin : le dernier est au premier plan.
const LAYOUTS = {
  1: [{ cx: 32, cy: 32, w: 34, h: 26, o: 1 }],
  2: [{ cx: 28.5, cy: 28.5, w: 28, h: 21, o: 0.5 },
      { cx: 35.5, cy: 35.5, w: 28, h: 21, o: 1 }],
  3: [{ cx: 24.5, cy: 26.5, w: 23, h: 17.5, o: 0.35 },
      { cx: 32, cy: 32, w: 23, h: 17.5, o: 0.62 },
      { cx: 39.5, cy: 37.5, w: 23, h: 17.5, o: 1 }],
};

const ICONS = [
  { name: 'bikeshare-unknown', color: GREY, bikes: 1 },
  { name: 'bikeshare-off', color: GREY, bikes: 1, crossed: true },
  { name: 'bikeshare-0', color: NAVY, bikes: 1, crossed: true },
  { name: 'bikeshare-1', color: NAVY, bikes: 1 },
  { name: 'bikeshare-2', color: NAVY, bikes: 2 },
  { name: 'bikeshare-3', color: NAVY, bikes: 3 },
];

// La pastille de disponibilité, posée en haut à droite du disque. C'est une
// image et non un layer `circle` pour une raison de fond : un `circle` n'a pas de
// détection de collision, alors qu'un symbole en a une, partagée avec son texte.
// Pastille et chiffre sont ainsi placés — ou masqués — d'un seul bloc, au lieu de
// voir le chiffre d'une station se poser sur la pastille de sa voisine.
// Couleurs à tenir synchronisées avec `BIKESHARE_COLORS` des deux frontends.
const BADGE_SIZE = 44;
const BADGES = [
  { name: 'bikeshare-badge-empty', color: '#EF4444' },   // plus aucun vélo
  { name: 'bikeshare-badge-low', color: '#F97316' },     // les derniers vélos
  { name: 'bikeshare-badge-ok', color: '#16A34A' },      // 3 vélos ou plus
  { name: 'bikeshare-badge-full', color: '#166534' },    // plus une place libre
];

function buildBadgeSvg({ color }) {
  const c = BADGE_SIZE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_SIZE}" height="${BADGE_SIZE}" viewBox="0 0 ${BADGE_SIZE} ${BADGE_SIZE}">
    <circle cx="${c}" cy="${c}" r="21" fill="#ffffff"/>
    <circle cx="${c}" cy="${c}" r="17.5" fill="${color}"/>
  </svg>`;
}

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

function place({ inner, vb }, { cx, cy, w, h, o = 1 }) {
  const [minx, miny, gw, gh] = vb;
  const scale = Math.min(w / gw, h / gh);
  const tx = cx - scale * (minx + gw / 2);
  const ty = cy - scale * (miny + gh / 2);
  // `opacity` sur le groupe, pas `fill-opacity` : le pictogramme se recouvre
  // lui-même (roues, cadre), et une opacité par tracé ferait ressortir ces
  // chevauchements internes en zones plus claires.
  return `<g transform="translate(${tx},${ty}) scale(${scale})" fill="#ffffff" opacity="${o}">${inner}</g>`;
}

function buildSvg({ color, bikes, crossed = false }) {
  const g = glyph(GLYPH.pack, GLYPH.name);
  const shapes = LAYOUTS[bikes].map(slot => place(g, slot)).join('');
  // La barre est doublée d'un « casing » couleur du disque : sans lui, le trait
  // se fond dans le guidon et le vélo ne se lit plus comme barré. Elle monte
  // vers la droite, à contresens du cadre : dans l'autre sens elle se superpose
  // au tube supérieur et mange la silhouette au lieu de la couper. Elle s'arrête
  // à r≈20 du centre — avec le linecap arrondi et ses 9 px d'épaisseur, aller
  // plus loin la ferait déborder du liseré blanc.
  const slash = crossed
    ? `<line x1="18" y1="46" x2="46" y2="18" stroke="${color}" stroke-width="9" stroke-linecap="round"/>
       <line x1="18" y1="46" x2="46" y2="18" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <circle cx="${CX}" cy="${CY}" r="${RING_R}" fill="#ffffff"/>
    <circle cx="${CX}" cy="${CY}" r="${DISC_R}" fill="${color}"/>
    ${shapes}
    ${slash}
  </svg>`;
}

const OUT_DIRS = process.argv.slice(2);
if (OUT_DIRS.length === 0) {
  console.error('Usage: node gen-bikeshare-icons.js <outDir> [<outDir> ...]');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const shoot = async (svg, size, name) => {
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><head><style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`,
      { waitUntil: 'load' },
    );
    const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    for (const dir of OUT_DIRS) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${name}.png`), buf);
    }
  };

  for (const icon of ICONS) {
    await shoot(buildSvg(icon), SIZE, icon.name);
    console.log(`✓ ${icon.name}.png (${icon.bikes} vélo${icon.bikes > 1 ? 's' : ''}${icon.crossed ? ', barré' : ''}, ${icon.color})`);
  }

  for (const badge of BADGES) {
    await shoot(buildBadgeSvg(badge), BADGE_SIZE, badge.name);
    console.log(`✓ ${badge.name}.png (pastille ${badge.color})`);
  }

  await browser.close();
  console.log('Terminé.');
})();
