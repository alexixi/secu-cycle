import { chromium } from 'playwright-core';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { slides, featureGraphic, opening, landscape, openGraph, square, productHunt, targets } from './slides.config.mjs';
import { buildPanorama, buildFeatureGraphic, buildLanding, buildCard, FONT_WEIGHTS } from './template.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, 'raw');
const OUT = join(HERE, 'out');

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

const EXTS = ['png', 'webp', 'jpg', 'jpeg'];

const FORMATS = [...Object.keys(targets), '4-3', 'square', 'ph', 'og'];
const MODIFIERS = ['strict'];

function candidates(name) {
    const base = name.replace(new RegExp(`\\.(${EXTS.join('|')})$`, 'i'), '');
    return EXTS.map((ext) => ({ ext, file: `${base}.${ext}` })).filter((c) => existsSync(join(RAW, c.file)));
}

async function dataUri(name) {
    const found = candidates(name);
    if (!found.length) return null;
    const { file, ext } = found[0];
    const buf = await readFile(join(RAW, file));
    return `data:${MIME[ext]};base64,${buf.toString('base64')}`;
}

async function hydrate(list) {
    return Promise.all(
        list.map(async (s) => ({ ...s, dataUri: await dataUri(s.raw), found: candidates(s.raw) })),
    );
}

async function loadFont() {
    return Promise.all(
        FONT_WEIGHTS.map(async (weight) => {
            const file = join(HERE, 'node_modules', '@fontsource', 'inter', 'files', `inter-latin-${weight}-normal.woff2`);
            if (!existsSync(file)) {
                throw new Error(
                    `Police introuvable : ${file}\n` +
                        `Lance « npm install » dans ${HERE} (paquet @fontsource/inter).`,
                );
            }
            const buf = await readFile(file);
            return { weight, dataUri: `data:font/woff2;base64,${buf.toString('base64')}` };
        }),
    );
}

async function main() {
    const flags = process.argv.slice(2).filter((f) => f.startsWith('--')).map((f) => f.slice(2));

    const unknown = flags.filter((f) => ![...FORMATS, ...MODIFIERS].includes(f));
    if (unknown.length) {
        console.error(`\n✗ Flag inconnu : ${unknown.map((f) => `--${f}`).join(', ')}`);
        console.error(`  Formats   : ${FORMATS.map((f) => `--${f}`).join(' ')}`);
        console.error(`  Options   : ${MODIFIERS.map((f) => `--${f}`).join(' ')}`);
        console.error('  Sans aucun flag de format, tous les formats sont générés.\n');
        process.exit(1);
    }

    const strict = flags.includes('strict');
    const wanted = flags.filter((f) => !MODIFIERS.includes(f));
    const picked = (key) => wanted.length === 0 || wanted.includes(key);
    const selected = Object.entries(targets).filter(([k]) => picked(k));

    const hydrated = await hydrate(slides);

    const ambiguous = hydrated.filter((s) => s.found.length > 1);
    if (ambiguous.length) {
        console.warn(
            `\n⚠  ${ambiguous.length} capture(s) présente(s) en plusieurs formats — la première est retenue :\n` +
                ambiguous.map((s) => `   · ${s.found.map((c) => c.file).join(', ')}  ->  ${s.found[0].file}`).join('\n'),
        );
    }

    const missing = hydrated.filter((s) => !s.dataUri);
    if (missing.length) {
        console.warn(
            `\n⚠  ${missing.length} capture(s) absente(s) de raw/ — remplacée(s) par un placeholder :\n` +
                missing.map((s) => `   · ${s.raw}.{${EXTS.join(',')}}`).join('\n'),
        );
        if (strict) {
            console.error('\n✗ Mode strict : génération interrompue, un visuel de store ne doit pas partir avec un placeholder.\n');
            process.exit(1);
        }
    }

    for (const [, target] of selected) {
        if (hydrated.length > target.maxSlides) {
            console.warn(
                `\n⚠  ${target.label} plafonne à ${target.maxSlides} captures, ` +
                    `slides.config.mjs en déclare ${hydrated.length} : les dernières seront refusées à l'upload.`,
            );
        }
    }

    const font = await loadFont();

    const browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ deviceScaleFactor: 1 });

    const freshDir = async (dir) => {
        await rm(dir, { recursive: true, force: true });
        await mkdir(dir, { recursive: true });
    };

    for (const [key, target] of selected) {
        const totalW = target.width * hydrated.length;
        await page.setViewportSize({ width: totalW, height: target.height });
        await page.setContent(buildPanorama(hydrated, target, font), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);

        const outDir = join(HERE, target.outDir);
        await freshDir(outDir);

        for (let i = 0; i < hydrated.length; i++) {
            const file = join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
            await page.screenshot({
                path: file,
                clip: { x: i * target.width, y: 0, width: target.width, height: target.height },
            });
        }

        await mkdir(OUT, { recursive: true });
        await page.screenshot({ path: join(OUT, `panorama-${key}.png`), fullPage: false });

        console.log(`✓ ${target.label} — ${hydrated.length} captures ${target.width}×${target.height} -> ${target.outDir}/`);
    }

    if (picked('play')) {
        const icon = await iconDataUri();
        const fg = { ...featureGraphic, dataUri: await dataUri(featureGraphic.raw) };
        const { width, height } = featureGraphic;
        await page.setViewportSize({ width, height });
        await page.setContent(buildFeatureGraphic(fg, icon, width, height, font), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await mkdir(join(OUT, 'play'), { recursive: true });
        await page.screenshot({ path: join(OUT, 'play/feature-graphic.png') });
        console.log(`✓ Google Play — feature graphic ${width}×${height} -> out/play/feature-graphic.png`);
    }

    const renderSet = async (dir, width, height, label) => {
        const outDir = join(OUT, dir);
        await freshDir(outDir);
        await page.setViewportSize({ width, height });

        const { headline, subtitle } = opening;
        await page.setContent(buildLanding(hydrated, headline, subtitle, width, height, font), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: join(outDir, '01-apercu.png') });

        for (let i = 0; i < hydrated.length; i++) {
            await page.setContent(buildCard(hydrated[i], width, height, font), { waitUntil: 'load' });
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({ path: join(outDir, `${String(i + 2).padStart(2, '0')}-${hydrated[i].raw}.png`) });
        }

        console.log(`✓ ${label} — ${hydrated.length + 1} visuels ${width}×${height} -> out/${dir}/`);
    };

    if (picked('4-3')) {
        await renderSet('4-3', landscape.width, landscape.height, 'Paysage 4:3');
    }

    if (picked('square')) {
        await renderSet('square', square.width, square.height, 'Carré 1:1');
    }

    if (picked('ph')) {
        await renderSet('product-hunt', productHunt.width, productHunt.height, 'Product Hunt');
    }

    if (picked('og')) {
        const icon = await iconDataUri();
        const fg = { ...featureGraphic, dataUri: await dataUri(featureGraphic.raw) };
        const { width, height } = openGraph;
        await page.setViewportSize({ width, height });
        await page.setContent(buildFeatureGraphic(fg, icon, width, height, font), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: join(OUT, 'og-image.png') });
        console.log(`✓ Open Graph — ${width}×${height} -> out/og-image.png`);
    }

    await browser.close();
    console.log('\nTout est dans store-assets/out/. Vérifie panorama-*.png avant d’uploader.\n');
}

async function iconDataUri() {
    const icon = join(HERE, '..', '..', 'frontend-mobile', 'assets', 'images', 'icon.png');
    if (!existsSync(icon)) return null;
    const buf = await readFile(icon);
    return `data:image/png;base64,${buf.toString('base64')}`;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
