#!/usr/bin/env node
//
// Contrôle d'internationalisation de l'application mobile.
//
//   node scripts/check-i18n.mjs
//
// Pendant de frontend-web/scripts/check-i18n.mjs, dont il reprend les
// heuristiques françaises et le système d'exemptions. Trois différences tiennent
// à React Native :
//
//   1. Il n'y a pas de DOM. Les positions où un littéral est forcément lu ne
//      sont plus `title=`/`alt=` mais le texte d'un <Text>, quelques props
//      d'accessibilité, et surtout les arguments d'Alert.alert() — que
//      l'heuristique d'attribut du web ne voit pas du tout.
//   2. Le texte d'un <Text> est très souvent écrit sur sa propre ligne. Une
//      regex `>texte<` par ligne en raterait une trentaine dans ce dépôt. On
//      balaie donc les portées <Text>…</Text> sur le fichier entier.
//   3. Le catalogue tient dans un namespace unique. C'est ce qui rend le
//      troisième contrôle possible : une clé appelée par t() est vérifiable
//      telle quelle, sans résolution de domaine.
//
// Comme le contrôle web, il n'importe que des modules natifs de Node et ne lit
// que des fichiers du dépôt : il tourne en CI sans `npm ci`. Ne jamais y ajouter
// un import de code applicatif — il tirerait i18next et React Native.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, '..');
const LOCALES = join(racine, 'i18n', 'locales');
const LANGS = ['fr', 'en'];

// Pas de src/ avec Expo Router : la racine du projet EST l'arborescence source.
// modules/ est listé pour le module natif de notification, dont les libellés
// s'affichent et que rien d'autre ne regarde.
const RACINES = ['app', 'components', 'context', 'hooks', 'services', 'constants',
    'utils', 'modules'];

// --- heuristiques françaises -------------------------------------------------

const ACCENT = /[éèêëàâäçùûüôöîïœæÉÈÊÀÂÇÔÎÏÙŒ]/;
const MOT_OUTIL = /\b(le|la|les|des|une|un|du|de|vous|votre|vos|nous|pour|avec|sur|dans|est|sont|par|aucun|aucune|cette|ce|et|au|aux|qui|que|pas|plus|non|ses|son|sa|nos|notre|ou|si|tout|toute)\b/i;
// L'élision est le marqueur le plus spécifiquement français. L'anglais a bien
// « don't », mais l'apostrophe y suit une lettre : d'où l'ancrage sur un début
// de mot.
const ELISION = /(?:^|[\s(«"'`>])[dlnmtsjcDLNMTSJC]['’]/;
// Mots d'interface français sans accent, sans mot-outil et sans élision : les
// trois filtres précédents les laissent tous passer.
const MOT_FRANCAIS = /\b(ressenti|rafales?|couvert|terminer|retour|clair|sombre|ajouter|modifier|supprimer|confirmer|annuler|fermer|enregistrer|valider|envoyer|rechercher|connexion|deconnexion|parametres|reglages|adresse|velo|trajet|trajets|itineraire|depart|arrivee|duree|vitesse|semaine|aucun|oui|non|precedent|suivant|nuage|pluie|neige|brouillard|vent|passer|continuer|demarrer|arreter|profil|compte|historique|bloquer|debloquer|signalement|signaler|station|capacite|gratuit|payant|arceaux|autoriser|refuser|gauche|droite|tourner|prenom|carte|chargement|domicile|travail)\b/i;

// Positions où un littéral est forcément lu, quelle que soit sa langue. « name »
// est délibérément absent : <Ionicons name="chevron-forward" /> en produirait
// deux cents. Les glyphes d'icônes ne sont pas du texte.
const ATTRIBUT_VISIBLE = /\b(title|label|placeholder|accessibilityLabel|accessibilityHint|confirmText|cancelText|emptyText|subtitle)=(["'])([^"']{2,})\2/g;

// Même chose en propriété d'objet : c'est la forme que prennent les tables de
// libellés, les options d'onglet, les boutons d'Alert et les notifications.
const PROP_VISIBLE = /\b(title|label|text|body|message|hint|subtitle|placeholder|notificationTitle|notificationBody|accessibilityLabel|accessibilityHint|confirmText|cancelText)\s*:\s*(["'])([^"']{2,})\2/g;

// Le module natif Android : ses libellés s'affichent dans la barre de
// notification pendant toute une navigation.
const AFFECTATION_KOTLIN = /\b(title|text|instruction|distanceLabel|nextInstruction|channelName|startingInstruction|startingDistanceLabel|arrivedTitle|rerouteTitle|fallbackTitle|nextPrefix)\s*(?::\s*String)?\s*=\s*(")([^"]{2,})\2/g;
const APPEL_KOTLIN = /\.(setName|setContentTitle|setContentText|setTicker|setSubText)\s*\(\s*(")([^"]{2,})\2/g;

// Formateurs et synthèse vocale figés sur une locale littérale. C'est la classe
// de défaut la plus dangereuse : aucun mot à repérer, elle survit à toute
// relecture, et elle produit « 5 juin 2026 » — ou une voix française lisant un
// texte anglais — au milieu d'une session en anglais.
const LOCALE_FIGEE = /(?:toLocale(?:Date|Time)?String|Intl\.[A-Za-z]+Format)\s*\(\s*['"][a-z]{2}(?:-[A-Za-z]{2,4})?['"]|\b(?:language|locale)\s*:\s*['"][a-z]{2}-[A-Za-z]{2,4}['"]/;

const LITTERAL = /(["'`])((?:(?!\1)[^\\]|\\.){2,})\1/g;

// --- exemptions ---------------------------------------------------------------

const CHEMINS_EXEMPTS = [
    /^node_modules[/\\]/,
    /^dist[/\\]/,
    /^\.expo[/\\]/,
    /[/\\]build[/\\]/,
    /\.gradle[/\\]/,
    /^scripts[/\\]/,
    // Jeu d'essai : données de simulation, pas de l'interface. Même traitement
    // que les *.mock.* du web.
    /\.mock\.[jt]sx?$/,
];

// Deux formes, la raison étant obligatoire dans les deux cas : c'est elle qui
// distingue une exemption réfléchie d'un contournement.
//
//   // i18n-exempt: <raison>              -> la ligne suivante
//   // i18n-exempt-start: <raison>  ...   -> jusqu'à // i18n-exempt-end
//
// Les deux s'écrivent aussi en commentaire JSX — {/* i18n-exempt: … */} — car
// dans du JSX, `//` n'est pas un commentaire : il est rendu comme du texte.
const OUVERTURE = String.raw`^\s*(?:\/\/|\{\s*\/\*|\/\*)\s*`;
const EXEMPTION = new RegExp(OUVERTURE + String.raw`i18n-exempt\s*:\s*\S`);
const EXEMPTION_DEBUT = new RegExp(OUVERTURE + String.raw`i18n-exempt-start\s*:\s*\S`);
const EXEMPTION_FIN = new RegExp(OUVERTURE + String.raw`i18n-exempt-end\b`);

/** Numéros de ligne (1-based) couverts par une exemption. */
function lignesExemptes(lignes) {
    const exemptes = new Set();
    let dansRegion = false;

    lignes.forEach((ligne, i) => {
        if (EXEMPTION_DEBUT.test(ligne)) { dansRegion = true; exemptes.add(i + 1); return; }
        if (EXEMPTION_FIN.test(ligne)) { dansRegion = false; exemptes.add(i + 1); return; }
        if (dansRegion) exemptes.add(i + 1);
        if (EXEMPTION.test(ligne)) { exemptes.add(i + 1); exemptes.add(i + 2); }
    });
    return exemptes;
}

// --- masquage -----------------------------------------------------------------

/**
 * Neutralise chaînes et commentaires, et relève chaque littéral.
 *
 * Compter des parenthèses ou chercher une balise sur le source brut se casse dès
 * qu'une accolade traîne dans un message. Longueurs et retours à la ligne sont
 * préservés : un décalage dans le masque désigne le même caractère que dans le
 * source.
 *
 * Limite assumée, la même que côté web : une chaîne imbriquée dans une
 * interpolation `${ … "texte" … }` n'est pas relevée séparément. Cela se traite
 * par « // i18n-exempt », pas par plus de code.
 */
function masquer(src) {
    const masque = src.split('');
    const litteraux = [];
    const lignesCommentees = new Set();
    let i = 0, paren = 0, accolade = 0, crochet = 0;

    const ligneDe = (decalage) => src.slice(0, decalage).split('\n').length;
    const marquerCommentaire = (a, b) => {
        for (let l = ligneDe(a); l <= ligneDe(b); l += 1) lignesCommentees.add(l);
    };

    const effacer = (a, b) => {
        for (let k = a; k < b && k < masque.length; k += 1) {
            if (masque[k] !== '\n') masque[k] = ' ';
        }
    };

    while (i < src.length) {
        const c = src[i];

        if (c === '/' && src[i + 1] === '/') {
            const j = src.indexOf('\n', i);
            const fin = j === -1 ? src.length : j;
            effacer(i, fin);
            i = fin;
            continue;
        }
        if (c === '/' && src[i + 1] === '*') {
            const j = src.indexOf('*/', i + 2);
            const fin = j === -1 ? src.length : j + 2;
            marquerCommentaire(i, fin);
            effacer(i, fin);
            i = fin;
            continue;
        }
        // Une apostrophe n'ouvre une chaîne que dans un contexte d'expression.
        // En position de texte JSX — « À l'écart du trafic » — elle appartient au
        // mot, et la traiter comme un délimiteur effaçait la phrase entière, qui
        // échappait alors au contrôle. On regarde donc ce qui précède.
        if (c === '"' || c === "'" || c === '`') {
            if (c !== '`' && !ouvreUneChaine(src, i)) { i += 1; continue; }
            let j = i + 1;
            while (j < src.length && src[j] !== c) j += (src[j] === '\\' ? 2 : 1);
            litteraux.push({
                debut: i, fin: j + 1, texte: src.slice(i + 1, j),
                paren, accolade, crochet,
            });
            effacer(i, j + 1);
            i = j + 1;
            continue;
        }
        if (c === '(') paren += 1;
        else if (c === ')') paren -= 1;
        else if (c === '{') accolade += 1;
        else if (c === '}') accolade -= 1;
        else if (c === '[') crochet += 1;
        else if (c === ']') crochet -= 1;
        i += 1;
    }
    return { masque: masque.join(''), litteraux, lignesCommentees };
}

// Mots-clés après lesquels un guillemet ouvre bien une chaîne, alors même que le
// caractère précédent est une lettre : `return 'x'`, `case 'y'`, `typeof 'z'`.
const MOTS_CLES_AVANT_CHAINE = new Set([
    'return', 'case', 'typeof', 'await', 'yield', 'else', 'in', 'of',
    'new', 'throw', 'delete', 'void', 'default', 'from', 'import', 'export',
]);

/** Un guillemet à `pos` ouvre-t-il une chaîne, ou fait-il partie d'un texte ? */
function ouvreUneChaine(src, pos) {
    let k = pos - 1;
    while (k >= 0 && /\s/.test(src[k])) k -= 1;
    if (k < 0) return true;

    const precedent = src[k];
    // Après un opérateur ou une ouverture, c'est une chaîne sans ambiguïté.
    if (!/[A-Za-z0-9_$\u00C0-\u024F)\]]/.test(precedent)) return true;

    // Après un mot : chaîne seulement si ce mot est un mot-clé du langage.
    let debut = k;
    while (debut >= 0 && /[A-Za-z_$]/.test(src[debut])) debut -= 1;
    return MOTS_CLES_AVANT_CHAINE.has(src.slice(debut + 1, k + 1));
}

/** Conversion décalage -> numéro de ligne (1-based). */
function indexLignes(src) {
    const debuts = [0];
    for (let i = 0; i < src.length; i += 1) if (src[i] === '\n') debuts.push(i + 1);
    return (decalage) => {
        let a = 0, b = debuts.length - 1;
        while (a < b) {
            const m = (a + b + 1) >> 1;
            if (debuts[m] <= decalage) a = m; else b = m - 1;
        }
        return a + 1;
    };
}

// --- portées <Text> -----------------------------------------------------------
//
// En React Native, une chaîne rendue hors d'un <Text> lève à l'exécution. Les
// portées <Text>…</Text> couvrent donc, par construction, TOUT le texte affiché
// de l'application : c'est le seul endroit où chercher, et il est exhaustif.

const BALISE_TEXTE = /<([A-Za-z]*Text)\b/g;

/** Décalage du `>` qui ferme la balise ouvrante commencée en `debut`. */
function finBaliseOuvrante(masque, debut) {
    let profondeur = 0;
    for (let i = debut; i < masque.length; i += 1) {
        const c = masque[i];
        if (c === '{') profondeur += 1;
        else if (c === '}') profondeur -= 1;
        else if (c === '>' && profondeur === 0) return i;
    }
    return -1;
}

/** Décalage du `<` de la balise fermante appariée, imbrications comprises. */
function finPortee(masque, nom, depuis) {
    const jetons = new RegExp(`<(/?)${nom}\\b`, 'g');
    jetons.lastIndex = depuis;
    let profondeur = 1, m;
    while ((m = jetons.exec(masque))) {
        profondeur += m[1] === '/' ? -1 : 1;
        if (profondeur === 0) return m.index;
    }
    return -1;
}

/** Intervalles [début, fin] couverts par une balise JSX, `<` et `>` compris. */
function zonesDeBalise(masque) {
    const zones = [];
    let i = 0;
    while (i < masque.length) {
        if (masque[i] !== '<') { i += 1; continue; }
        let profondeur = 0, j = i;
        while (j < masque.length) {
            const c = masque[j];
            if (c === '{') profondeur += 1;
            else if (c === '}') profondeur -= 1;
            else if (c === '>' && profondeur === 0) break;
            j += 1;
        }
        zones.push([i, j]);
        i = j + 1;
    }
    return zones;
}

function porteesTexte(masque) {
    const portees = [];
    BALISE_TEXTE.lastIndex = 0;
    let m;

    while ((m = BALISE_TEXTE.exec(masque))) {
        const fin = finBaliseOuvrante(masque, m.index);
        if (fin === -1) continue;
        if (masque[fin - 1] === '/') { BALISE_TEXTE.lastIndex = fin; continue; }   // <Text />
        const fermeture = finPortee(masque, m[1], fin + 1);
        if (fermeture === -1) { BALISE_TEXTE.lastIndex = fin; continue; }
        portees.push({ ouverture: m.index, debut: fin + 1, fin: fermeture });
        // Seules les portées extérieures sont gardées : le texte d'un <Text>
        // imbriqué est attribué à la portée englobante et n'est signalé qu'une fois.
        BALISE_TEXTE.lastIndex = fermeture;
    }
    return portees;
}

/** Fragments de texte nu d'une portée : ni balisage, ni expression. */
function textesNus(src, masque, debut, fin) {
    const fragments = [];
    let i = debut, courant = '', depart = debut;

    const vider = () => {
        if (/[A-Za-zÀ-ÿ]/.test(courant)) fragments.push({ decalage: depart, texte: courant.trim() });
        courant = '';
    };

    while (i < fin) {
        const c = masque[i];
        if (c === '{') {
            vider();
            let p = 0;
            do { if (masque[i] === '{') p += 1; else if (masque[i] === '}') p -= 1; i += 1; } while (i < fin && p > 0);
            depart = i;
            continue;
        }
        if (c === '<') {
            vider();
            while (i < fin && masque[i] !== '>') i += 1;
            i += 1;
            depart = i;
            continue;
        }
        if (c === '\n') { vider(); depart = i + 1; }
        else { if (!courant) depart = i; courant += src[i]; }
        i += 1;
    }
    vider();
    return fragments;
}

// --- Alert.alert et Speech.speak ----------------------------------------------
//
// Le point aveugle du contrôle web : Alert.alert('Titre', 'Message', [{ text }])
// n'est ni un attribut JSX, ni du texte entre chevrons. Ses deux premiers
// arguments sont pourtant la modale la plus visible de l'application.
//
// On ne retient que les littéraux ARGUMENTS POSITIONNELS — mêmes profondeurs
// d'accolade et de crochet qu'à l'ouverture de l'appel. Les « text: » des boutons
// sont attrapés par PROP_VISIBLE, et les littéraux des rappels restent hors champ.

const APPEL_VISIBLE = /\b(?:Alert\.(?:alert|prompt)|Speech\.speak)\s*\(/g;

function argumentsVisibles(masque, litteraux) {
    const vus = new Set();
    APPEL_VISIBLE.lastIndex = 0;
    let m;

    while ((m = APPEL_VISIBLE.exec(masque))) {
        const ouvrante = masque.indexOf('(', m.index);
        let p = 0, i = ouvrante;
        do {
            if (masque[i] === '(') p += 1;
            else if (masque[i] === ')') p -= 1;
            i += 1;
        } while (i < masque.length && p > 0);

        const reference = litteraux.find((l) => l.debut > ouvrante) ?? null;
        if (!reference) continue;

        for (const lit of litteraux) {
            if (lit.debut < ouvrante || lit.fin > i) continue;
            if (lit.accolade !== reference.accolade) continue;
            if (lit.crochet !== reference.crochet) continue;
            if (lit.paren !== reference.paren) continue;
            vus.add(lit);
        }
    }
    return [...vus];
}

// --- parcours des fichiers -----------------------------------------------------

function fichiersSource(depuis, out = []) {
    for (const e of readdirSync(depuis, { withFileTypes: true })) {
        const chemin = join(depuis, e.name);
        const relatif = chemin.slice(racine.length + 1);
        if (CHEMINS_EXEMPTS.some((motif) => motif.test(relatif))) continue;
        if (e.isDirectory()) fichiersSource(chemin, out);
        else if (/\.(jsx?|tsx?|kt|swift)$/.test(e.name)) out.push(chemin);
    }
    return out;
}

const tousLesFichiers = () => RACINES
    .map((r) => join(racine, r))
    .filter(existsSync)
    .flatMap((d) => fichiersSource(d));

const estFrancais = (t) => ACCENT.test(t) || MOT_OUTIL.test(t) || ELISION.test(t) || MOT_FRANCAIS.test(t);

// En position visible, un mot isolé est du texte : « Destination », « Auto »,
// « VTT ». On n'y écarte donc que les valeurs techniques, là où ailleurs
// l'absence d'espace suffit à disqualifier un littéral.
const estTechnique = (t) => /^(https?:|#|var\(|data:|M |\d)/.test(t)
    || /^(\\[nrt])+$/.test(t)
    || /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(t)
    || /^[\w.]*\$\{/.test(t)
    || /^[\w-]+([/.][\w-]+)+$/.test(t)
    || !/[A-Za-zÀ-ÿ]/.test(t);

const estIdentifiant = (t) => !t.includes(' ')
    || /^(https?:|#|var\(|data:|M |\d)/.test(t)
    // Un gabarit qui commence par un préfixe de clé ou par une interpolation est
    // un chemin ou une clé de catalogue, jamais du texte affiché.
    || /^[\w.]*\$\{/.test(t);

function verifierLitteraux() {
    const anomalies = [];

    for (const chemin of tousLesFichiers()) {
        const relatif = chemin.slice(racine.length + 1);
        const src = readFileSync(chemin, 'utf-8');
        const lignes = src.split('\n');
        const exemptes = lignesExemptes(lignes);
        const ligneDe = indexLignes(src);
        const { masque, litteraux, lignesCommentees } = masquer(src);
        const jsx = /\.(jsx|tsx)$/.test(relatif);
        const natif = /\.(kt|swift)$/.test(relatif);
        const vues = new Set();

        const signaler = (ligne, genre, texte) => {
            if (exemptes.has(ligne)) return;
            const cle = `${ligne}|${texte}`;
            if (vues.has(cle)) return;
            vues.add(cle);
            anomalies.push(`${relatif}:${ligne} — ${genre} : « ${texte.slice(0, 70)} »`);
        };

        // 1. Locales figées — indépendant de toute langue.
        lignes.forEach((ligne, i) => {
            if (ligne.trim().startsWith('//')) return;
            if (LOCALE_FIGEE.test(ligne)) signaler(i + 1, 'locale figée', ligne.trim());
        });

        // 2. Positions visibles : tout littéral y est suspect, quelle que soit sa
        //    langue. C'est ce qui attrape « Auto », « Clair », « VTT » — des mots
        //    que l'heuristique française laisse passer par construction.
        const visibles = new Set();
        const balises = zonesDeBalise(masque);
        const dansUneBalise = (lit) => balises.some(([a, b]) => lit.debut > a && lit.fin <= b + 1);
        for (const portee of porteesTexte(masque)) {
            const ligneOuverture = ligneDe(portee.ouverture);
            if (!exemptes.has(ligneOuverture)) {
                for (const f of textesNus(src, masque, portee.debut, portee.fin)) {
                    signaler(ligneDe(f.decalage), 'texte affiché en dur', f.texte);
                }
            }
            for (const lit of litteraux) {
                if (lit.debut > portee.debut && lit.fin < portee.fin && !dansUneBalise(lit)) {
                    visibles.add(lit);
                }
            }
        }
        if (!natif) for (const lit of argumentsVisibles(masque, litteraux)) visibles.add(lit);

        for (const lit of visibles) {
            if (estTechnique(lit.texte)) continue;
            signaler(ligneDe(lit.debut), 'texte affiché en dur', lit.texte);
        }

        lignes.forEach((ligne, i) => {
            if (ligne.includes('console.')) return;
            const motifs = natif
                ? [AFFECTATION_KOTLIN, APPEL_KOTLIN]
                : (jsx ? [ATTRIBUT_VISIBLE, PROP_VISIBLE] : [PROP_VISIBLE]);
            for (const motif of motifs) {
                motif.lastIndex = 0;
                for (const m of ligne.matchAll(motif)) {
                    if (estTechnique(m[3])) continue;
                    signaler(i + 1, 'texte affiché en dur', `${m[1]}: ${m[3]}`);
                }
            }
        });

        // 3. Ailleurs, on ne signale que ce qui a l'air français.
        lignes.forEach((ligne, i) => {
            const nu = ligne.trim();
            // Une ligne intérieure d'un commentaire de bloc — { /* … */ } compris —
            // n'est pas du code : ses apostrophes françaises ne délimitent rien.
            if (lignesCommentees.has(i + 1)) return;
            if (nu.startsWith('//') || nu.startsWith('*') || nu.startsWith('/*') || nu.startsWith('{/*')) return;
            if (ligne.includes('console.')) return;
            for (const m of ligne.matchAll(LITTERAL)) {
                const texte = m[2];
                if (estIdentifiant(texte)) continue;
                if (estFrancais(texte)) signaler(i + 1, 'littéral français', texte);
            }
        });
    }
    return anomalies;
}

// --- parité des catalogues ------------------------------------------------------
//
// Repris du contrôle web sans modification de fond : mêmes chemins de clés,
// mêmes variables d'interpolation, dans les deux sens. Une clé présente en
// français et absente en anglais ne casse rien et s'affiche telle quelle.

const aplatir = (o, p = '') => Object.entries(o).flatMap(([c, v]) =>
    (v && typeof v === 'object') ? aplatir(v, `${p}${c}.`) : [[`${p}${c}`, String(v)]]);

const NAMESPACES = readdirSync(join(LOCALES, 'fr'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5));

// Le fichier donne la racine de ses clés : c'est la fusion opérée par
// i18n/catalogues.js, reproduite ici pour que les clés comparées soient
// exactement celles écrites dans le code.
const catalogue = (lang) => Object.fromEntries(NAMESPACES.flatMap((ns) =>
    aplatir(JSON.parse(readFileSync(join(LOCALES, lang, `${ns}.json`), 'utf-8')), `${ns}.`)));

const motifs = (texte, expression) => [...texte.matchAll(expression)].map((m) => m[1]).sort().join(',');

function verifierParite(lang) {
    const anomalies = [];
    const fr = new Map(Object.entries(catalogue('fr')));
    const autre = new Map(Object.entries(catalogue(lang)));

    for (const [cle, texteFr] of fr) {
        if (!autre.has(cle)) { anomalies.push(`${lang} — clé absente : ${cle}`); continue; }
        for (const [quoi, exp] of [['balise', /<(\w+)>/g], ['variable', /\{\{\s*(\w+)/g]]) {
            const a = motifs(texteFr, exp);
            const b = motifs(autre.get(cle), exp);
            if (a !== b) anomalies.push(`${lang} — ${quoi}s différentes sur ${cle} : fr=[${a}] ${lang}=[${b}]`);
        }
    }
    for (const cle of autre.keys()) {
        if (!fr.has(cle)) anomalies.push(`${lang} — clé en trop, absente du français : ${cle}`);
    }
    return anomalies;
}

// --- clés appelées vs catalogue -------------------------------------------------
//
// Troisième mode de défaillance, aussi silencieux que les deux autres : t() sur
// une clé inexistante renvoie la clé, et « parametres.langue.titre » s'affiche en
// gras dans l'écran de réglages.
//
// C'est ici que le namespace unique paie : la clé écrite dans le code est la clé
// du catalogue, sans domaine à résoudre. Les clés composées sont couvertes par
// leur préfixe — t(`carte.parking.${id}`) rend « carte.parking.* » utilisé. En
// échange, on renonce à repérer une feuille morte sous un tel préfixe.

const APPEL_T = /\bt\(\s*(['"])([\w.]+)\1/g;
// <Trans i18nKey="..."> : même rôle que t(), pour les phrases qui portent des
// liens au fil du texte et qu'on ne peut pas découper sans casser l'ordre des
// mots d'une langue à l'autre.
const APPEL_TRANS = /\bi18nKey\s*=\s*(?:\{\s*)?(['"])([\w.]+)\1/g;
const APPEL_T_GABARIT = /\bt\(\s*`([\w.]*)\$\{/g;
// Un t(variable) sans préfixe littéral rendrait le contrôle inopérant sans que
// personne ne s'en aperçoive : on le refuse explicitement plutôt que d'espérer.
const APPEL_T_OPAQUE = /\bt\(\s*(?![`'"\s)])[A-Za-z_$]/g;

// Suffixes de pluriel d'i18next : t('x', { count }) résout « x_one » ou
// « x_other », et la clé nue « x » n'existe alors pas dans le catalogue.
const SUFFIXES_PLURIEL = ['zero', 'one', 'two', 'few', 'many', 'other'];

function verifierCles() {
    const anomalies = [];
    const informations = [];
    const brutes = new Set(Object.keys(catalogue('fr')));
    const cles = new Set(brutes);
    for (const cle of brutes) {
        const point = cle.lastIndexOf('_');
        if (point === -1) continue;
        if (SUFFIXES_PLURIEL.includes(cle.slice(point + 1))) cles.add(cle.slice(0, point));
    }
    const utilisees = new Set();
    const prefixes = [];

    for (const chemin of tousLesFichiers()) {
        const relatif = chemin.slice(racine.length + 1);
        const src = readFileSync(chemin, 'utf-8');
        const ligneDe = indexLignes(src);
        const { masque } = masquer(src);
        // Une exemption motivée vaut ici aussi : c'est le mécanisme prévu pour
        // les cas légitimes, et le seul qui oblige à écrire la raison.
        const exemptes = lignesExemptes(src.split('\n'));

        for (const motif of [APPEL_T, APPEL_TRANS]) {
            for (const m of src.matchAll(motif)) {
                utilisees.add(m[2]);
                if (!cles.has(m[2])) {
                    anomalies.push(`${relatif}:${ligneDe(m.index)} — clé absente du catalogue : ${m[2]}`);
                }
            }
        }
        for (const m of src.matchAll(APPEL_T_GABARIT)) {
            if (!m[1]) {
                anomalies.push(`${relatif}:${ligneDe(m.index)} — clé composée sans préfixe littéral`);
                continue;
            }
            prefixes.push(m[1]);
        }
        for (const m of masque.matchAll(APPEL_T_OPAQUE)) {
            if (exemptes.has(ligneDe(m.index))) continue;
            anomalies.push(`${relatif}:${ligneDe(m.index)} — t() sur une variable :`
                + ' écrire t(`prefixe.${x}`) pour rester vérifiable');
        }
    }

    const couverte = (cle) => {
        if (utilisees.has(cle) || prefixes.some((p) => cle.startsWith(p))) return true;
        const point = cle.lastIndexOf('_');
        return point !== -1
            && SUFFIXES_PLURIEL.includes(cle.slice(point + 1))
            && utilisees.has(cle.slice(0, point));
    };
    const orphelines = [...brutes].filter((c) => !couverte(c));
    if (orphelines.length) {
        informations.push(`${orphelines.length} clé(s) du catalogue jamais appelées : `
            + `${orphelines.slice(0, 12).join(', ')}${orphelines.length > 12 ? ' …' : ''}`);
    }
    return { anomalies, informations };
}

// --- exécution ------------------------------------------------------------------

let anomalies = 0;

for (const lang of LANGS.filter((l) => l !== 'fr')) {
    const ecarts = verifierParite(lang);
    for (const ligne of ecarts) { console.error(`PARITÉ     ${ligne}`); anomalies += 1; }
    if (!ecarts.length) console.log(`${lang} : catalogue à parité avec le français.`);
}

const cles = verifierCles();
for (const ligne of cles.anomalies) { console.error(`CLÉ        ${ligne}`); anomalies += 1; }
for (const ligne of cles.informations) console.log(`           ${ligne}`);
if (!cles.anomalies.length) console.log('chaque clé appelée par t() existe dans le catalogue.');

const litteraux = verifierLitteraux();
for (const ligne of litteraux) { console.error(`LITTÉRAL   ${ligne}`); anomalies += 1; }
if (!litteraux.length) console.log('aucun texte français en dur hors des fichiers exemptés.');

if (anomalies > 0) {
    console.error(`\n${anomalies} anomalie(s). Une clé sans texte s'affiche brute ; un littéral en dur,`
        + ' une locale figée ou une voix de synthèse figée reste en français au milieu d\'un écran anglais.');
    console.error('Pour un cas légitime — nom propre, attribution de source, repli de compatibilité —'
        + ' poser « // i18n-exempt: <raison> » sur la ligne précédente.');
    process.exit(1);
}
