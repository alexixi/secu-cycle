import { useTranslation } from 'react-i18next';

import PrimingModal from './ui/PrimingModal';

const POINTS_POSITION = [
    { cle: 'carte', icon: 'navigate-circle-outline' },
    { cle: 'itineraire', icon: 'git-branch-outline' },
    { cle: 'usage', icon: 'lock-closed-outline' },
];

const POINTS_NOTIFICATIONS = [
    { cle: 'instruction', icon: 'navigate-outline' },
    { cle: 'discret', icon: 'volume-mute-outline' },
    { cle: 'retrait', icon: 'options-outline' },
];

export function LocationPriming({ visible, onAccept, onDecline }) {
    const { t } = useTranslation();

    const points = POINTS_POSITION.map(({ cle, icon }) => ({
        cle,
        icon,
        /* i18n-suffixes: carte itineraire usage */
        titre: t(`legal.position.points.${cle}.titre`),
        /* i18n-suffixes: carte itineraire usage */
        texte: t(`legal.position.points.${cle}.texte`),
    }));

    return (
        <PrimingModal
            visible={visible}
            iconName="location-outline"
            title={t('legal.position.titre')}
            points={points}
            acceptLabel={t('legal.position.autoriser')}
            declineLabel={t('legal.position.plusTard')}
            onAccept={onAccept}
            onDecline={onDecline}
        />
    );
}

export function NotificationPriming({ visible, onAccept, onDecline }) {
    const { t } = useTranslation();

    const points = POINTS_NOTIFICATIONS.map(({ cle, icon }) => ({
        cle,
        icon,
        /* i18n-suffixes: instruction discret retrait */
        titre: t(`legal.notifications.points.${cle}.titre`),
        /* i18n-suffixes: instruction discret retrait */
        texte: t(`legal.notifications.points.${cle}.texte`),
    }));

    return (
        <PrimingModal
            visible={visible}
            iconName="notifications-outline"
            title={t('legal.notifications.titre')}
            points={points}
            acceptLabel={t('legal.notifications.autoriser')}
            declineLabel={t('legal.notifications.plusTard')}
            onAccept={onAccept}
            onDecline={onDecline}
        />
    );
}
