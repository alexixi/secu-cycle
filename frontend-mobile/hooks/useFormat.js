import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { makeFormatters } from '../utils/datetime';

/**
 * Formateurs de dates, d'heures et de nombres, réactifs au changement de langue.
 *
 * À utiliser dans TOUT composant : `i18n.language` figure ainsi dans les
 * dépendances du useMemo, ce qui garantit que les dates rebasculent en même
 * temps que le reste de l'écran. Les fonctions de utils/datetime.js lues
 * directement depuis un composant ne le garantissent pas — voir le commentaire
 * en tête de ce fichier-là.
 */
export function useFormat() {
    const { i18n } = useTranslation();
    return useMemo(() => makeFormatters(i18n.language), [i18n.language]);
}
