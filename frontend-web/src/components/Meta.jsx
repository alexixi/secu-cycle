import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';

import { alternatesFor, isPublished, langFromPathname } from '../i18n/routes';

const SITE_URL = "https://secu-cycle.fr";

export default function Meta({
  title,
  description,
  name = "Sécu'Cycle",
  noindex = false,
  image = "/og-image.jpg",
  preconnect = [],
}) {
  const { pathname } = useLocation();
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const canonical = `${SITE_URL}${path}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const lang = langFromPathname(pathname);
  const alternates = alternatesFor(pathname);

  // Un groupe hreflang n'a de sens qu'à partir de deux versions. Émettre une
  // seule balise auto-référentielle est inutile ; en émettre une qui pointe vers
  // une page non publiée fait rejeter le groupe entier par Google.
  const groupe = Object.entries(alternates).filter(([, href]) => href);
  const aGroupe = groupe.length > 1;

  // Une langue routée mais pas encore publiée ne doit jamais être indexée, quoi
  // qu'en dise l'appelant.
  const horsIndex = noindex || !isPublished(lang);

  const absolu = (chemin) => `${SITE_URL}${chemin.endsWith("/") ? chemin : `${chemin}/`}`;

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      <meta name='description' content={description} />
      {horsIndex && <meta name='robots' content='noindex' />}
      <link rel="canonical" href={canonical} />

      {/* Réciprocité : les deux versions dérivent du même alternatesFor, donc
          chacune annonce le groupe complet, elle-même comprise. Google exige ces
          « return tags » et rejette un groupe annoncé d'un seul côté. */}
      {aGroupe && groupe.map(([codeLangue, href]) => (
        <link key={codeLangue} rel="alternate" hrefLang={codeLangue} href={absolu(href)} />
      ))}
      {aGroupe && <link rel="alternate" hrefLang="x-default" href={absolu(alternates.fr)} />}

      {preconnect.map((entry) => {
        const href = typeof entry === "string" ? entry : entry.href;
        const anonymous = typeof entry === "object" && entry.crossOrigin;
        return anonymous
          ? <link key={href} rel="preconnect" href={href} crossOrigin="" />
          : <link key={href} rel="preconnect" href={href} />;
      })}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content={lang === 'fr' ? 'fr_FR' : 'en_GB'} />
      {aGroupe && <meta property="og:locale:alternate" content={lang === 'fr' ? 'en_GB' : 'fr_FR'} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
