import { brand } from './slides.config.mjs';

function smoothPath(points) {
    const d = [`M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d.push(
            `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ` +
            `${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`,
        );
    }
    return d.join(' ');
}

const PER_SLIDE = 4;

function routeGeometry(slideCount, slideW, slideH) {
    const totalW = slideW * slideCount;
    const baseY = slideH * 0.795;
    const amp = slideH * 0.035;
    const steps = slideCount * PER_SLIDE;

    const yAtIndex = (i) => baseY + Math.sin(i * 0.85) * amp + Math.sin(i * 0.31) * amp * 0.55;
    const yAt = (x) => yAtIndex((x * steps) / totalW);

    const points = [];

    for (let i = -PER_SLIDE / 2; i <= steps + PER_SLIDE / 2; i++) {
        const x = (totalW * i) / steps;
        points.push([x, yAtIndex(i)]);
    }

    const start = [slideW * 0.1, yAt(slideW * 0.1)];
    const end = [totalW - slideW * 0.1, yAt(totalW - slideW * 0.1)];

    return { path: smoothPath(points), start, end, totalW };
}

function renderTitle(title) {
    return escapeHtml(title)
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Graisses réellement utilisées par le design ci-dessous. generate.mjs lit les
// woff2 correspondants et les passe à chaque builder.
export const FONT_WEIGHTS = [400, 500, 600, 700, 800];

function fontFaceCss(font) {
    return font
        .map(
            ({ weight, dataUri }) => `
    @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: ${weight};
        src: url(${dataUri}) format('woff2');
    }`,
        )
        .join('');
}

function deviceMarkup(slide, extraClass = '') {
    const focus = slide.focus ?? 'top center';
    const zoom = slide.zoom ?? 1;
    const style = `object-position: ${focus}; transform: scale(${zoom}); transform-origin: ${focus};`;
    const screen = slide.dataUri
        ? `<img class="shot" src="${slide.dataUri}" style="${style}" alt="">`
        : `<div class="missing">
               <span class="missing-icon">📷</span>
               <span class="missing-name">${escapeHtml(slide.raw)}.*</span>
               <span class="missing-hint">manquant dans raw/</span>
           </div>`;
    return `
    <div class="device${extraClass ? ` ${extraClass}` : ''}">
        <div class="screen">${screen}</div>
        <div class="island"></div>
    </div>`;
}

// Le dégradé du tracé. Le panorama va du deep au clair en passant par le
// primary (il est très large) ; les cadres simples se contentent des deux bouts.
function routeGradient(width, withMidStop) {
    return `
        <linearGradient id="rg" x1="0" y1="0" x2="${width}" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="${brand.primaryDeep}"/>
            ${withMidStop ? `<stop offset="0.5" stop-color="${brand.primary}"/>` : ''}
            <stop offset="1" stop-color="${brand.accentTo}"/>
        </linearGradient>`;
}

// Tracé simple, une seule passe : utilisé par tous les cadres sauf le panorama,
// qui a en plus un halo flouté et les marqueurs départ/arrivée.
function routeSvg(path, width, height, { strokeWidth, opacity, midStop = false, className = 'route' }) {
    return `
<svg class="${className}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
    <defs>${routeGradient(width, midStop)}</defs>
    <path d="${path}" stroke="url(#rg)" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity}"/>
</svg>`;
}

const BASE_CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
        --primary: ${brand.primary};
        --primary-deep: ${brand.primaryDeep};
        --text: ${brand.text};
        --muted: ${brand.textMuted};
        --bezel: ${brand.bezel};
    }
    body {
        font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
        -webkit-font-smoothing: antialiased;
        background: ${brand.bgFrom};
        overflow: hidden;
    }
    em {
        font-style: normal;
        background: linear-gradient(100deg, ${brand.accentFrom}, ${brand.accentTo});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    /* --- châssis du téléphone, dessiné en CSS (pas d'image de mockup) --- */
    .device {
        position: relative;
        height: 100%;
        max-height: 100%;
        aspect-ratio: 9 / 19.5;
        background: var(--bezel);
        border-radius: calc(var(--sw) * 0.055);
        padding: calc(var(--sw) * 0.009);
        box-shadow:
            0 0 0 calc(var(--sw) * 0.0016) rgba(255, 255, 255, 0.16),
            0 calc(var(--sh) * 0.03) calc(var(--sh) * 0.055) rgba(0, 0, 0, 0.55),
            0 calc(var(--sh) * 0.008) calc(var(--sh) * 0.02) rgba(0, 0, 0, 0.4);
    }
    .screen {
        width: 100%;
        height: 100%;
        border-radius: calc(var(--sw) * 0.047);
        overflow: hidden;
        background: #e7ecfb;
    }
    .shot { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
    /* Dynamic Island : un simple bandeau arrondi posé sur la capture. */
    .island {
        position: absolute;
        top: calc(var(--sw) * 0.026);
        left: 50%;
        transform: translateX(-50%);
        width: 26%;
        height: calc(var(--sw) * 0.028);
        background: var(--bezel);
        border-radius: 999px;
    }
    /* Placeholder affiché tant que la capture brute n'existe pas : le design se
       relit sans avoir encore shooté l'app. */
    .missing {
        width: 100%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: calc(var(--sw) * 0.012);
        background: repeating-linear-gradient(45deg, #2a2c3e, #2a2c3e 14px, #232534 14px, #232534 28px);
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
    }
    .missing-icon { font-size: calc(var(--sw) * 0.07); }
    .missing-name { font-size: calc(var(--sw) * 0.028); font-weight: 600; color: rgba(255,255,255,0.8); }
    .missing-hint { font-size: calc(var(--sw) * 0.021); }
`;

export function buildPanorama(slides, target, font) {
    const { width: sw, height: sh } = target;
    const { path, start, end, totalW } = routeGeometry(slides.length, sw, sh);

    const glows = slides
        .map((_, k) => {
            const cx = sw * (k + 0.5);
            return `radial-gradient(ellipse ${sw * 0.55}px ${sh * 0.3}px at ${cx}px ${sh * 0.6}px, rgba(131, 137, 250, 0.28), transparent 70%)`;
        })
        .join(', ');

    const r = sw * 0.022;
    const markers = `
        <circle cx="${start[0].toFixed(1)}" cy="${start[1].toFixed(1)}" r="${(r * 2.1).toFixed(1)}" fill="${brand.primary}" opacity="0.25"/>
        <circle cx="${start[0].toFixed(1)}" cy="${start[1].toFixed(1)}" r="${r.toFixed(1)}" fill="#fff"/>
        <circle cx="${start[0].toFixed(1)}" cy="${start[1].toFixed(1)}" r="${(r * 0.45).toFixed(1)}" fill="${brand.primaryDeep}"/>
        <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="${(r * 2.1).toFixed(1)}" fill="${brand.primary}" opacity="0.25"/>
        <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="${(r * 1.25).toFixed(1)}" fill="#fff"/>
        <path d="M ${(end[0] - r * 0.28).toFixed(1)} ${(end[1] + r * 0.55).toFixed(1)}
                 v ${(-r * 1.1).toFixed(1)} h ${(r * 0.85).toFixed(1)}
                 l ${(-r * 0.22).toFixed(1)} ${(r * 0.34).toFixed(1)}
                 l ${(r * 0.22).toFixed(1)} ${(r * 0.34).toFixed(1)} h ${(-r * 0.85).toFixed(1)}"
              fill="${brand.primaryDeep}" stroke="${brand.primaryDeep}"
              stroke-width="${(r * 0.16).toFixed(1)}" stroke-linejoin="round"/>`;

    return `
<!doctype html>
<meta charset="utf-8">
<style>
    ${fontFaceCss(font)}
    ${BASE_CSS}
    body {
        --sw: ${sw}px;
        --sh: ${sh}px;
        width: ${totalW}px;
        height: ${sh}px;
        position: relative;
        background:
            ${glows},
            linear-gradient(165deg, ${brand.bgFrom} 0%, ${brand.bgTo} 55%, ${brand.bgFrom} 100%);
    }
    .route { position: absolute; inset: 0; z-index: 1; }
    .strip { position: absolute; inset: 0; display: flex; z-index: 2; }
    .slide {
        width: ${sw}px;
        height: ${sh}px;
        flex: 0 0 ${sw}px;
        display: flex;
        flex-direction: column;
        /* Surtout pas de padding en % : la slide est un flex-item de .strip, donc
           un % se résoudrait sur la largeur du panorama entier, pas de la slide. */
        padding: calc(var(--sh) * 0.075) calc(var(--sw) * 0.08) calc(var(--sh) * 0.05);
        position: relative;
    }
    .eyebrow {
        font-size: calc(var(--sw) * 0.024);
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--primary);
        margin-bottom: calc(var(--sh) * 0.012);
    }
    h1 {
        font-size: calc(var(--sw) * 0.082);
        font-weight: 800;
        line-height: 1.04;
        letter-spacing: -0.025em;
        color: var(--text);
    }
    .subtitle {
        margin-top: calc(var(--sh) * 0.014);
        font-size: calc(var(--sw) * 0.032);
        font-weight: 400;
        line-height: 1.4;
        color: var(--muted);
        max-width: 92%;
    }
    .device-wrap {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: calc(var(--sh) * 0.06);
        position: relative;
        z-index: 3;
    }
    .device-wrap .device { max-height: calc(var(--sh) * 0.58); }
</style>
<svg class="route" width="${totalW}" height="${sh}" viewBox="0 0 ${totalW} ${sh}" fill="none">
    <defs>
        ${routeGradient(totalW, true)}
        <filter id="glow" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="${(sw * 0.03).toFixed(1)}"/>
        </filter>
    </defs>
    <path d="${path}" stroke="url(#rg)" stroke-width="${(sw * 0.035).toFixed(1)}"
          stroke-linecap="round" opacity="0.45" filter="url(#glow)"/>
    <path d="${path}" stroke="url(#rg)" stroke-width="${(sw * 0.013).toFixed(1)}" stroke-linecap="round"/>
    ${markers}
</svg>
<div class="strip">
    ${slides
        .map(
            (s) => `
    <section class="slide">
        <div class="copy">
            <div class="eyebrow">${escapeHtml(s.eyebrow)}</div>
            <h1>${renderTitle(s.title)}</h1>
            <p class="subtitle">${escapeHtml(s.subtitle)}</p>
        </div>
        <div class="device-wrap">${deviceMarkup(s)}</div>
    </section>`,
        )
        .join('')}
</div>`;
}

export function buildLanding(slides, headline, subtitle, width, height, font) {
    const { path } = routeGeometry(2, width / 2, height);
    const shown = slides.slice(0, 3);

    return `
<!doctype html>
<meta charset="utf-8">
<style>
    ${fontFaceCss(font)}
    ${BASE_CSS}
    body {
        --sw: ${width * 0.26}px;
        --sh: ${height}px;
        width: ${width}px;
        height: ${height}px;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: ${height * 0.07}px;
        overflow: hidden;
        background:
            radial-gradient(ellipse 70% 60% at 50% 78%, rgba(131,137,250,0.30), transparent 70%),
            linear-gradient(165deg, ${brand.bgFrom} 0%, ${brand.bgTo} 55%, ${brand.bgFrom} 100%);
    }
    .route { position: absolute; inset: 0; z-index: 1; }
    .copy { position: relative; z-index: 3; text-align: center; max-width: 76%; }
    h1 {
        font-size: ${height * 0.075}px;
        font-weight: 800;
        line-height: 1.06;
        letter-spacing: -0.025em;
        color: var(--text);
    }
    .subtitle {
        margin-top: ${height * 0.02}px;
        font-size: ${height * 0.03}px;
        line-height: 1.4;
        color: var(--muted);
    }
    .rack {
        position: relative;
        z-index: 3;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        gap: ${width * 0.035}px;
        padding-top: ${height * 0.05}px;
        padding-bottom: ${height * 0.045}px;
    }
    .rack .device { height: 100%; }
    .rack .device.side { height: 88%; opacity: 0.92; }
</style>
${routeSvg(path, width, height, { strokeWidth: (width * 0.005).toFixed(1), opacity: 0.9, midStop: true })}
<div class="copy">
    <h1>${renderTitle(headline)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
</div>
<div class="rack">
    ${shown.map((s, i) => deviceMarkup(s, i === 1 ? '' : 'side')).join('')}
</div>`;
}

export function buildCard(slide, width, height, font) {
    const { path } = routeGeometry(2, width / 2, height);
    const stacked = width / height < 1.3;

    if (stacked) {
        return `
<!doctype html>
<meta charset="utf-8">
<style>
    ${fontFaceCss(font)}
    ${BASE_CSS}
    body {
        --sw: ${width * 0.3}px;
        --sh: ${height}px;
        width: ${width}px;
        height: ${height}px;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: ${height * 0.08}px ${width * 0.08}px ${height * 0.05}px;
        overflow: hidden;
        background:
            radial-gradient(ellipse 70% 55% at 50% 75%, rgba(131,137,250,0.28), transparent 70%),
            linear-gradient(165deg, ${brand.bgFrom} 0%, ${brand.bgTo} 55%, ${brand.bgFrom} 100%);
    }
    .route { position: absolute; inset: 0; z-index: 1; }
    .copy { position: relative; z-index: 3; text-align: center; }
    .eyebrow {
        font-size: ${height * 0.019}px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--primary);
        margin-bottom: ${height * 0.014}px;
    }
    h1 {
        font-size: ${height * 0.068}px;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.025em;
        color: var(--text);
    }
    .subtitle {
        margin-top: ${height * 0.018}px;
        font-size: ${height * 0.026}px;
        line-height: 1.45;
        color: var(--muted);
    }
    .device-wrap {
        position: relative;
        z-index: 3;
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-top: ${height * 0.045}px;
    }
    .device { height: 100%; }
</style>
${routeSvg(path, width, height, { strokeWidth: (width * 0.007).toFixed(1), opacity: 0.85 })}
<div class="copy">
    <div class="eyebrow">${escapeHtml(slide.eyebrow)}</div>
    <h1>${renderTitle(slide.title)}</h1>
    <p class="subtitle">${escapeHtml(slide.subtitle)}</p>
</div>
<div class="device-wrap">${deviceMarkup(slide)}</div>`;
    }

    return `
<!doctype html>
<meta charset="utf-8">
<style>
    ${fontFaceCss(font)}
    ${BASE_CSS}
    body {
        --sw: ${width * 0.26}px;
        --sh: ${height}px;
        width: ${width}px;
        height: ${height}px;
        position: relative;
        display: flex;
        align-items: center;
        overflow: hidden;
        background:
            radial-gradient(ellipse 55% 100% at 76% 50%, rgba(131,137,250,0.28), transparent 70%),
            linear-gradient(150deg, ${brand.bgFrom} 0%, ${brand.bgTo} 60%, ${brand.bgFrom} 100%);
    }
    .route { position: absolute; inset: 0; z-index: 1; }
    .copy { position: relative; z-index: 3; padding-left: ${width * 0.07}px; width: 52%; }
    .eyebrow {
        font-size: ${height * 0.022}px;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--primary);
        margin-bottom: ${height * 0.018}px;
    }
    h1 {
        font-size: ${height * 0.082}px;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.025em;
        color: var(--text);
    }
    .subtitle {
        margin-top: ${height * 0.022}px;
        font-size: ${height * 0.032}px;
        line-height: 1.45;
        color: var(--muted);
    }
    .device-wrap {
        position: absolute;
        right: ${width * 0.08}px;
        top: 50%;
        transform: translateY(-50%);
        height: 84%;
        z-index: 3;
    }
    .device { height: 100%; }
</style>
${routeSvg(path, width, height, { strokeWidth: (width * 0.005).toFixed(1), opacity: 0.85 })}
<div class="copy">
    <div class="eyebrow">${escapeHtml(slide.eyebrow)}</div>
    <h1>${renderTitle(slide.title)}</h1>
    <p class="subtitle">${escapeHtml(slide.subtitle)}</p>
</div>
<div class="device-wrap">${deviceMarkup(slide)}</div>`;
}

export function buildFeatureGraphic(fg, iconDataUri, width, height, font) {
    const { path } = routeGeometry(2, width / 2, height);

    return `
<!doctype html>
<meta charset="utf-8">
<style>
    ${fontFaceCss(font)}
    ${BASE_CSS}
    body {
        --sw: ${width * 0.32}px;
        --sh: ${height}px;
        width: ${width}px;
        height: ${height}px;
        position: relative;
        display: flex;
        align-items: center;
        background:
            radial-gradient(ellipse 60% 120% at 78% 50%, rgba(131,137,250,0.30), transparent 70%),
            linear-gradient(120deg, ${brand.bgFrom} 0%, ${brand.bgTo} 60%, ${brand.bgFrom} 100%);
        overflow: hidden;
    }
    .route { position: absolute; inset: 0; z-index: 1; opacity: 0.85; }
    .copy { position: relative; z-index: 3; padding-left: 6%; max-width: 58%; }
    .brandline { display: flex; align-items: center; gap: ${height * 0.04}px; }
    /* Tailles proportionnelles à la hauteur : ce même bandeau sert en feature
       graphic Play (1024x500) et en image Open Graph (1200x630). */
    .icon {
        width: ${height * 0.17}px; height: ${height * 0.17}px;
        border-radius: ${height * 0.04}px;
        box-shadow: 0 ${height * 0.02}px ${height * 0.06}px rgba(0,0,0,0.45);
    }
    .name { font-size: ${height * 0.116}px; font-weight: 800; letter-spacing: -0.02em; color: var(--text); }
    .tagline { margin-top: ${height * 0.044}px; font-size: ${height * 0.06}px; font-weight: 500; color: var(--muted); }
    .device-wrap {
        position: absolute;
        right: 8%;
        top: 20%;
        height: 105%;
        z-index: 3;
        transform: rotate(-7deg);
    }
    .device { height: 100%; }
</style>
${routeSvg(path, width, height, { strokeWidth: 10, opacity: 0.9 })}
<div class="copy">
    <div class="brandline">
        ${iconDataUri ? `<img class="icon" src="${iconDataUri}" alt="">` : ''}
        <div class="name">${escapeHtml(fg.title)}</div>
    </div>
    <div class="tagline">${escapeHtml(fg.subtitle)}</div>
</div>
<div class="device-wrap">${deviceMarkup(fg)}</div>`;
}
