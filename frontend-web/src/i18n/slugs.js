// Slugs d'URL par langue.

export const CITY_SLUGS = {
    bordeaux:   { fr: 'bordeaux',   en: 'bordeaux' },
    rennes:     { fr: 'rennes',     en: 'rennes' },
    nantes:     { fr: 'nantes',     en: 'nantes' },
    paris:      { fr: 'paris',      en: 'paris' },
    lyon:       { fr: 'lyon',       en: 'lyon' },
    lille:      { fr: 'lille',      en: 'lille' },
    strasbourg: { fr: 'strasbourg', en: 'strasbourg' },
    tournai:    { fr: 'tournai',    en: 'tournai' },
    bruxelles:  { fr: 'bruxelles',  en: 'brussels' },
};

export const THEME_SLUGS = {
    'stationnements-velo':     { fr: 'stationnements-velo',     en: 'bike-parking' },
    'toilettes-publiques':     { fr: 'toilettes-publiques',     en: 'public-toilets' },
    'points-eau':              { fr: 'points-eau',              en: 'drinking-water' },
    'toilettes-et-points-eau': { fr: 'toilettes-et-points-eau', en: 'toilets-and-water' },
    'reparation-velo':         { fr: 'reparation-velo',         en: 'bike-repair' },
    'eclairage-public':        { fr: 'eclairage-public',        en: 'street-lighting' },
    'velos-libre-service':     { fr: 'velos-libre-service',     en: 'bike-share' },
    'trafic-routier':          { fr: 'trafic-routier',          en: 'road-traffic' },
    'accidents-velo':          { fr: 'accidents-velo',          en: 'cycling-accidents' },
};

export const PARAM_SLUGS = {
    citySlug: CITY_SLUGS,
    themeSlug: THEME_SLUGS,
};
